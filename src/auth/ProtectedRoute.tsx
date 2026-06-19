import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../types';
import { getDefaultPathForRole, useAuth } from './AuthContext';

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="min-h-screen bg-surface" />;
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate replace state={{ from: location }} to="/unauthorized" />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  const { isLoading, user } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-surface" />;
  }

  if (user) {
    return <Navigate replace to={getDefaultPathForRole(user.role)} />;
  }

  return <Outlet />;
};
