import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  getCurrentUser,
  googleLoginRequest,
  googleRegisterRequest,
  loginRequest,
  registerRequest,
  type AuthSession,
  type AuthUser,
  type RegisterInput,
} from '../api/auth';
import type { UserRole } from '../types';

type LoginInput = {
  email: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (input: LoginInput) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  googleLogin: (idToken: string) => Promise<AuthUser>;
  googleRegister: (idToken: string) => Promise<AuthUser>;
  logout: () => void;
};

const AUTH_STORAGE_KEY = 'picklink.auth.session';
const LEGACY_AUTH_STORAGE_KEY = 'picklink.auth.user';
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getStoredSession = (): AuthSession | null => {
  if (typeof window === 'undefined') return null;

  try {
    window.localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY);
    const value = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!value) return null;

    const session = JSON.parse(value) as AuthSession;
    if (!session.token || !session.user || new Date(session.expiresAt).getTime() <= Date.now()) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const persistSession = (session: AuthSession | null) => {
  if (typeof window === 'undefined') return;

  if (session) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
};

export const getDefaultPathForRole = (role: UserRole) => {
  if (role === 'admin') return '/admin';
  if (role === 'owner') return '/owner';
  if (role === 'staff') return '/owner/payments';
  return '/';
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [isInitializing, setIsInitializing] = useState(Boolean(session));

  const saveSession = useCallback((nextSession: AuthSession | null) => {
    setSession(nextSession);
    persistSession(nextSession);
  }, []);

  useEffect(() => {
    if (!session) {
      setIsInitializing(false);
      return;
    }

    let isActive = true;
    getCurrentUser(session.token)
      .then((user) => {
        if (isActive) saveSession({ ...session, user });
      })
      .catch(() => {
        if (isActive) saveSession(null);
      })
      .finally(() => {
        if (isActive) setIsInitializing(false);
      });

    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user: session?.user ?? null,
    token: session?.token ?? null,
    isAuthenticated: Boolean(session),
    isInitializing,
    login: async ({ email, password }) => {
      const nextSession = await loginRequest(email.trim().toLowerCase(), password);
      saveSession(nextSession);
      return nextSession.user;
    },
    register: async (input) => {
      const nextSession = await registerRequest(input);
      saveSession(nextSession);
      return nextSession.user;
    },
    googleLogin: async (idToken) => {
      const nextSession = await googleLoginRequest(idToken);
      saveSession(nextSession);
      return nextSession.user;
    },
    googleRegister: async (idToken) => {
      const nextSession = await googleRegisterRequest(idToken);
      saveSession(nextSession);
      return nextSession.user;
    },
    logout: () => saveSession(null),
  }), [isInitializing, saveSession, session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

export type { AuthUser, RegisterInput };
