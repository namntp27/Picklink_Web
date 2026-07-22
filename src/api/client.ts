import { repairMojibake } from '../utils/textEncoding';

const configuredBaseUrl = import.meta.env?.VITE_API_BASE_URL?.trim() ?? '';

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');
const inFlightGets = new Map<string, Promise<unknown>>();
const prefetchedGets = new Map<string, { expiresAt: number; request: Promise<unknown> }>();
const PREFETCH_TTL_MS = 30_000;
let isPrefetching = false;

const rememberPrefetch = (key: string, request: Promise<unknown>) => {
  prefetchedGets.set(key, { expiresAt: Date.now() + PREFETCH_TTL_MS, request });
  void request.catch(() => {
    if (prefetchedGets.get(key)?.request === request) prefetchedGets.delete(key);
  });
};

const clearReadOptimizations = () => {
  prefetchedGets.clear();
  inFlightGets.clear();
};

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
          : status === 429
            ? 'Bạn thao tác quá nhanh. Vui lòng chờ một lúc rồi thử lại.'
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
  const method = (options.method ?? 'GET').toUpperCase();
  const key = `${accessToken ?? ''}\n${path}`;

  if (method !== 'GET') {
    return executeApiRequest<T>(path, options, accessToken).then((result) => {
      clearReadOptimizations();
      return result;
    });
  }

  const prefetched = prefetchedGets.get(key);
  if (prefetched) {
    if (prefetched.expiresAt > Date.now()) {
      if (!isPrefetching) prefetchedGets.delete(key);
      return prefetched.request as Promise<T>;
    }
    prefetchedGets.delete(key);
  }

  const inFlight = inFlightGets.get(key);
  const onlyUsesSignal = Object.keys(options).every((option) => option === 'signal');
  if (inFlight && onlyUsesSignal) {
    if (isPrefetching) rememberPrefetch(key, inFlight);
    return inFlight as Promise<T>;
  }

  const request = executeApiRequest<T>(path, options, accessToken);
  if (isPrefetching) rememberPrefetch(key, request);

  if (Object.keys(options).length > 0 && !isPrefetching) return request;

  inFlightGets.set(key, request);
  const clear = () => {
    if (inFlightGets.get(key) === request) inFlightGets.delete(key);
  };
  void request.then(clear, clear);
  return request;
};

export const prefetchApiData = <T>(loader: () => Promise<T>): Promise<T> => {
  isPrefetching = true;
  try {
    return loader();
  } finally {
    isPrefetching = false;
  }
};

export const clearPrefetchedApiData = () => {
  clearReadOptimizations();
};
