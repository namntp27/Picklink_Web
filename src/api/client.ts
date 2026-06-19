import type { UserRole } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5190/api').replace(/\/+$/, '');

const TOKEN_STORAGE_KEY = 'picklink.auth.tokens';

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: unknown;
  meta?: unknown;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresAt: string;
};

export type BackendUser = {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  avatarUrl?: string | null;
  status: string;
  roles: string[];
};

export type BackendAuthResponse = AuthTokens & {
  user: BackendUser;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: Extract<UserRole, 'player' | 'owner'>;
};

export type ExternalLoginRequest = {
  token: string;
  role?: Extract<UserRole, 'player' | 'owner'>;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errors?: unknown,
  ) {
    super(message);
  }
}

const apiErrorTranslations: Record<string, string> = {
  'API request failed.': 'Yêu cầu API thất bại.',
  'API response is empty.': 'Phản hồi API trống.',
  'Cannot create user.': 'Không thể tạo tài khoản.',
  'Email already exists.': 'Email đã tồn tại.',
  'Invalid email or password.': 'Email hoặc mật khẩu không đúng.',
  'Validation failed.': 'Dữ liệu chưa hợp lệ.',
  'Google login is not configured.': 'Chưa cấu hình đăng nhập Google trên backend.',
  'Google token is invalid.': 'Token Google không hợp lệ.',
  'Google token audience is invalid.': 'Client ID của Google không khớp với backend.',
  'Google email is not verified.': 'Email Google chưa được xác minh.',
  'External account does not expose an email address.': 'Tài khoản mạng xã hội không cung cấp email.',
  'Cannot create external user.': 'Không thể tạo tài khoản từ mạng xã hội.',
  'Cannot assign role to external user.': 'Không thể gán vai trò cho tài khoản mạng xã hội.',
  'External login can create only Player or Owner accounts.': 'Đăng nhập mạng xã hội chỉ có thể tạo tài khoản Người chơi hoặc Chủ sân.',
  'Unsupported external login provider.': 'Nhà cung cấp đăng nhập không được hỗ trợ.',
  'Passwords must be at least 8 characters.': 'Mật khẩu phải có ít nhất 8 ký tự.',
  "Passwords must have at least one lowercase ('a'-'z').": 'Mật khẩu phải có ít nhất một chữ thường.',
  "Passwords must have at least one uppercase ('A'-'Z').": 'Mật khẩu phải có ít nhất một chữ hoa.',
  "Passwords must have at least one digit ('0'-'9').": 'Mật khẩu phải có ít nhất một chữ số.',
};

const translateApiError = (message: string) => apiErrorTranslations[message] ?? message;

const collectErrorMessages = (errors: unknown): string[] => {
  if (!errors) {
    return [];
  }

  if (typeof errors === 'string') {
    return [errors];
  }

  if (Array.isArray(errors)) {
    return errors.flatMap(collectErrorMessages);
  }

  if (typeof errors === 'object') {
    return Object.values(errors as Record<string, unknown>).flatMap(collectErrorMessages);
  }

  return [String(errors)];
};

const buildApiErrorMessage = <T>(payload: ApiResponse<T> | null) => {
  const message = translateApiError(payload?.message ?? 'API request failed.');
  const details = collectErrorMessages(payload?.errors).map(translateApiError);

  return details.length > 0 ? `${message} ${details.join(' ')}` : message;
};

export const getStoredTokens = (): AuthTokens | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthTokens) : null;
  } catch {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    return null;
  }
};

export const persistTokens = (tokens: AuthTokens | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (tokens) {
    window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
  } else {
    window.localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
};

const parseResponse = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || payload?.success === false) {
    throw new ApiError(buildApiErrorMessage(payload), response.status, payload?.errors);
  }

  if (!payload) {
    throw new ApiError(translateApiError('API response is empty.'), response.status);
  }

  return payload.data;
};

export const apiRequest = async <T>(
  path: string,
  init: RequestInit = {},
  options: { auth?: boolean } = {},
): Promise<T> => {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (options.auth) {
    const tokens = getStoredTokens();
    if (tokens?.accessToken) {
      headers.set('Authorization', `${tokens.tokenType || 'Bearer'} ${tokens.accessToken}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  return parseResponse<T>(response);
};

const storeAuthResponse = (response: BackendAuthResponse) => {
  persistTokens({
    accessToken: response.accessToken,
    refreshToken: response.refreshToken,
    tokenType: response.tokenType,
    expiresAt: response.expiresAt,
  });

  return response;
};

export const authApi = {
  async login(input: LoginRequest) {
    const response = await apiRequest<BackendAuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return storeAuthResponse(response);
  },

  async register(input: RegisterRequest) {
    const response = await apiRequest<BackendAuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return storeAuthResponse(response);
  },

  async loginWithGoogle(input: ExternalLoginRequest) {
    const response = await apiRequest<BackendAuthResponse>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(input),
    });

    return storeAuthResponse(response);
  },

  async me() {
    return apiRequest<BackendUser>('/auth/me', {}, { auth: true });
  },

  async refreshToken(refreshToken: string) {
    const response = await apiRequest<BackendAuthResponse>('/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });

    return storeAuthResponse(response);
  },

  async logout(refreshToken: string) {
    await apiRequest<unknown>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },
};

export const getApiBaseUrl = () => API_BASE_URL;
