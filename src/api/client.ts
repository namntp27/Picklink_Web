const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() ?? '';

export const API_BASE_URL = configuredBaseUrl.replace(/\/$/, '');

type ApiErrorBody = {
  detail?: string;
  errors?: Record<string, string[]>;
  message?: string;
  title?: string;
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
  const validationMessage = body?.errors ? Object.values(body.errors).flat()[0] : undefined;

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

export const apiRequest = async <T>(
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
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      0,
      'Không thể kết nối tới máy chủ. Hãy kiểm tra backend đang chạy tại cổng 5209.',
    );
  }

  const contentType = response.headers.get('content-type') ?? '';
  const body = contentType.includes('json')
    ? await response.json() as T | ApiErrorBody
    : undefined;

  if (!response.ok) {
    const errorBody = body as ApiErrorBody | undefined;
    throw new ApiError(response.status, getErrorMessage(response.status, errorBody), errorBody);
  }

  return body as T;
};
