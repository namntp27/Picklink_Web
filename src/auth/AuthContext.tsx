import React, { createContext, useContext, useMemo, useState } from 'react';
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

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (input: LoginInput) => AuthUser | null;
  logout: () => void;
};

const AUTH_STORAGE_KEY = 'picklink.auth.user';

const testUsers: Array<AuthUser & { password: string }> = [
  {
    id: 'admin-test',
    name: 'Admin Cao Cấp',
    email: 'admin@picklink.vn',
    password: 'admin123',
    role: 'admin',
  },
  {
    id: 'owner-test',
    name: 'Nguyễn Văn An',
    email: 'owner@picklink.vn',
    password: 'owner123',
    role: 'owner',
  },
  {
    id: 'player-test',
    name: 'Nguyễn Minh Anh',
    email: 'player@picklink.vn',
    password: 'player123',
    role: 'player',
  },
];

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

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

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      login: ({ email, password }) => {
        const matchedUser = testUsers.find(
          (testUser) => testUser.email === email.trim().toLowerCase() && testUser.password === password,
        );

        if (!matchedUser) {
          return null;
        }

        const { password: _password, ...authUser } = matchedUser;

        setUser(authUser);
        persistUser(authUser);

        return authUser;
      },
      logout: () => {
        setUser(null);
        persistUser(null);
      },
    }),
    [user],
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
