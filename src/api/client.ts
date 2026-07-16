import { repairMojibake } from '../utils/textEncoding';

const configuredBaseUrl = import.meta.env?.VITE_API_BASE_URL?.trim() ?? '';

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');
type InFlightGet = {
  started: boolean;
  current: Promise<unknown>;
  queued?: Promise<unknown>;
};
const inFlightGets = new Map<string, InFlightGet>();

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type PaginationParams = {
  page?: number;
  pageSize?: number;
};

type ApiErrorBody = {
  detail?: string;
  errors?: Record<string, string[]>;
  message?: string;
  title?: string;
};

const repairResponseText = (value: unknown): unknown => {
  if (typeof value === 'string') return repairMojibake(value);
  if (Array.isArray(value)) return value.map(repairResponseText);
  if (!value || typeof value !== 'object') return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => [key, repairResponseText(entry)]),
  );
};

export class ApiError extends Error {
  readonly status: number;
  readonly body?: ApiErrorBody;

  constructor(status: number, message: string, body?: ApiErrorBody) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

const getErrorMessage = (status: number, body?: ApiErrorBody) => {
  const validationMessages = body?.errors ? Object.entries(body.errors).flatMap(([field, messages]) =>
    field === 'request' ? [] : messages) : [];
  const validationMessage = validationMessages[0]
    ?? (body?.errors ? Object.values(body.errors).flat()[0] : undefined);

  const fallbackMessage = status === 401
    ? 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    : status === 403
      ? 'Tài khoản không có quyền thực hiện thao tác này.'
      : status === 404
        ? 'Không tìm thấy API hoặc dữ liệu được yêu cầu. Hãy khởi động lại backend nếu vừa cập nhật mã nguồn.'
        : status === 409
          ? 'Dữ liệu vừa thay đổi. Vui lòng tải lại và thử lại.'
          : status >= 500
            ? 'Máy chủ đang gặp sự cố. Vui lòng thử lại sau.'
            : 'Yêu cầu không thành công.';

  return validationMessage
    ?? body?.message
    ?? body?.detail
    ?? body?.title
    ?? fallbackMessage;
};

const executeApiRequest = async <T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> => {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  let response: Response;
  try {
    const timeoutSignal = AbortSignal.timeout(30_000);
    const signal = options.signal ? AbortSignal.any([options.signal, timeoutSignal]) : timeoutSignal;
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers, signal });
  } catch (error) {
    throw new ApiError(
      0,
      error instanceof DOMException && error.name === 'TimeoutError'
        ? 'Máy chủ phản hồi quá lâu. Hãy kiểm tra backend đang chạy tại cổng 5209.'
        : 'Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy tại cổng 5209.',
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('json')
    ? repairResponseText(await response.json()) as T | ApiErrorBody
    : undefined;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined;
    throw new ApiError(response.status, getErrorMessage(response.status, errorBody), errorBody);
  }

  return body as T;
};

export const apiRequest = <T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> => {
  if (Object.keys(options).length > 0) return executeApiRequest<T>(path, options, accessToken);

  const key = `${accessToken ?? ''}\n${path}`;
  const entry = inFlightGets.get(key);
  if (entry) {
    if (!entry.started) return entry.current as Promise<T>;
    if (entry.queued) return entry.queued as Promise<T>;

    const previous = entry.current;
    let queued!: Promise<T>;
    const startQueued = () => {
      entry.current = queued;
      entry.queued = undefined;
      return executeApiRequest<T>(path, options, accessToken);
    };
    queued = previous.then(startQueued, startQueued);
    entry.queued = queued;
    const clear = () => {
      if (inFlightGets.get(key) === entry && entry.current === queued && !entry.queued) {
        inFlightGets.delete(key);
      }
    };
    void queued.then(clear, clear);
    return queued;
  }

  const nextEntry: InFlightGet = {
    started: false,
    current: Promise.resolve(),
  };
  const request = Promise.resolve().then(() => {
    nextEntry.started = true;
    return executeApiRequest<T>(path, options, accessToken);
  });
  nextEntry.current = request;
  inFlightGets.set(key, nextEntry);
  const clear = () => {
    if (inFlightGets.get(key) === nextEntry && nextEntry.current === request && !nextEntry.queued) {
      inFlightGets.delete(key);
    }
  };
  void request.then(clear, clear);
  return request;
};
