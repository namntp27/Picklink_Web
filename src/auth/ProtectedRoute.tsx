import React from 'react';
import { Navigate, Outlet, useLocation, useOutletContext } from 'react-router-dom';
import type { UserRole } from '../types';
import { getDefaultPathForRole, useAuth } from './AuthContext';

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isInitializing, user } = useAuth();
  const location = useLocation();
  const context = useOutletContext();

  if (isInitializing) {
    return <div className="flex min-h-screen items-center justify-center bg-surface text-primary">Đang xác thực...</div>;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate replace state={{ from: location }} to="/unauthorized" />;
  }

  return <Outlet context={context} />;
};

export const PublicOnlyRoute = () => {
  const { isInitializing, user } = useAuth();
  const context = useOutletContext();

  if (isInitializing) {
    return <div className="flex min-h-screen items-center justify-center bg-surface text-primary">Đang xác thực...</div>;
  }

  if (user) {
    return <Navigate replace to={getDefaultPathForRole(user.role)} />;
  }

  return <Outlet context={context} />;
};
