import type { UserRole } from '../types';
import { apiRequest } from './client';

export type BackendUser = {
  userId: number;
  username: string;
  email: string;
  userType: string;
  profileImageUrl?: string | null;
  city?: string | null;
  commune?: string | null;
};

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  city?: string;
  commune?: string;
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  user: AuthUser;
};

type AuthResponse = {
  token: string;
  expiresAt: string;
  user: BackendUser;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  city?: string;
  commune?: string;
  role: 'player' | 'owner';
  experience?: 'Beginner' | 'Intermediate' | 'Advanced';
};

const mapRole = (userType: string): UserRole => {
  const normalizedRole = userType.trim().toLowerCase();

  if (normalizedRole === 'admin' || normalizedRole === 'administrator' || normalizedRole === 'staff') {
    return 'admin';
  }

  if (normalizedRole === 'venueowner' || normalizedRole === 'owner') {
    return 'owner';
  }

  return 'player';
};

export const mapAuthUser = (user: BackendUser): AuthUser => ({
  id: String(user.userId),
  name: user.username,
  email: user.email,
  role: mapRole(user.userType),
  avatar: user.profileImageUrl ?? undefined,
  city: user.city ?? undefined,
  commune: user.commune ?? undefined,
});

const mapSession = (response: AuthResponse): AuthSession => ({
  token: response.token,
  expiresAt: response.expiresAt,
  user: mapAuthUser(response.user),
});

export const loginRequest = async (email: string, password: string) => {
  const response = await apiRequest<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  return mapSession(response);
};

const googleAuthRequest = async (idToken: string, mode: 'login' | 'register') => {
  const path = mode === 'register' ? '/api/auth/google/register' : '/api/auth/google';
  const response = await apiRequest<AuthResponse>(path, {
    method: 'POST',
    body: JSON.stringify({ idToken }),
  });

  return mapSession(response);
};

export const googleLoginRequest = (idToken: string) => googleAuthRequest(idToken, 'login');

export const googleRegisterRequest = (idToken: string) => googleAuthRequest(idToken, 'register');

export const registerRequest = async (input: RegisterInput) => {
  const response = await apiRequest<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      username: input.username,
      email: input.email,
      password: input.password,
      city: input.city || null,
      commune: input.commune || null,
    }),
  });

  const assignedSession = await apiRequest<AuthResponse>('/api/auth/assign-role', {
    method: 'POST',
    body: JSON.stringify({
      role: input.role === 'owner' ? 'VenueOwner' : 'Player',
      experience: input.role === 'player' ? input.experience ?? 'Beginner' : null,
    }),
  }, response.token);

  const user = await getCurrentUser(assignedSession.token);

  return {
    token: assignedSession.token,
    expiresAt: assignedSession.expiresAt,
    user,
  } satisfies AuthSession;
};

export const getCurrentUser = async (token: string) => {
  const user = await apiRequest<BackendUser>('/api/auth/me', {}, token);
  return mapAuthUser(user);
};

export const forgotPasswordRequest = (email: string) => apiRequest<{ message: string; expiresAt?: string }>(
  '/api/auth/forgot-password',
  { method: 'POST', body: JSON.stringify({ email }) },
);

export const verifyPasswordResetCodeRequest = (email: string, token: string) => apiRequest<{ message: string }>(
  '/api/auth/verify-reset-code',
  { method: 'POST', body: JSON.stringify({ email, token }) },
);

export const resetPasswordRequest = (email: string, token: string, newPassword: string) => apiRequest<{ message: string }>(
  '/api/auth/reset-password',
  { method: 'POST', body: JSON.stringify({ email, token, newPassword }) },
);
