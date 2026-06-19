import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ApiError, authApi, getStoredTokens, persistTokens, type BackendAuthResponse, type BackendUser } from '../api/client';
import type { UserRole } from '../types';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
  role: Extract<UserRole, 'player' | 'owner'>;
};

type ExternalLoginInput = {
  token: string;
  role?: Extract<UserRole, 'player' | 'owner'>;
};

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<AuthUser | null>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  loginWithGoogle: (input: ExternalLoginInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_STORAGE_KEY = 'picklink.auth.user';

const mapRole = (roles: string[]): UserRole => {
  const normalizedRoles = roles.map((role) => role.toLowerCase());

  if (normalizedRoles.includes('admin')) {
    return 'admin';
  }

  if (normalizedRoles.includes('owner')) {
    return 'owner';
  }

  return 'player';
};

const mapUser = (user: BackendUser): AuthUser => ({
  id: user.id,
  name: user.fullName,
  email: user.email,
  role: mapRole(user.roles),
});

const getStoredUser = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedUser = window.localStorage.getItem(AUTH_STORAGE_KEY);

    return storedUser ? (JSON.parse(storedUser) as AuthUser) : null;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);

    return null;
  }
};

const persistUser = (user: AuthUser | null) => {
  if (typeof window === 'undefined') {
    return;
  }

  if (user) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

const persistAuthResponse = (response: BackendAuthResponse) => {
  const authUser = mapUser(response.user);
  persistUser(authUser);
  return authUser;
};

export const getDefaultPathForRole = (role: UserRole) => {
  if (role === 'admin') {
    return '/admin';
  }

  if (role === 'owner') {
    return '/owner';
  }

  return '/';
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(() => Boolean(getStoredTokens()));

  useEffect(() => {
    let cancelled = false;

    const hydrateUser = async () => {
      const tokens = getStoredTokens();
      if (!tokens?.accessToken) {
        setIsLoading(false);
        return;
      }

      try {
        const backendUser = await authApi.me();
        if (cancelled) {
          return;
        }

        const authUser = mapUser(backendUser);
        setUser(authUser);
        persistUser(authUser);
      } catch {
        if (!cancelled) {
          setUser(null);
          persistUser(null);
          persistTokens(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    hydrateUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login: async ({ email, password }) => {
        try {
          const response = await authApi.login({ email, password });
          const authUser = persistAuthResponse(response);

          setUser(authUser);
          return authUser;
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            return null;
          }

          throw error;
        }
      },
      register: async (input) => {
        const response = await authApi.register(input);
        const authUser = persistAuthResponse(response);

        setUser(authUser);
        return authUser;
      },
      loginWithGoogle: async (input) => {
        const response = await authApi.loginWithGoogle(input);
        const authUser = persistAuthResponse(response);

        setUser(authUser);
        return authUser;
      },
      logout: async () => {
        const tokens = getStoredTokens();
        setUser(null);
        persistUser(null);
        persistTokens(null);

        if (tokens?.refreshToken) {
          await authApi.logout(tokens.refreshToken).catch(() => undefined);
        }
      },
    }),
    [isLoading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
};
