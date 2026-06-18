import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import type { UserRole } from '../types';
import { getDefaultPathForRole, useAuth } from './AuthContext';

type ProtectedRouteProps = {
  allowedRoles?: UserRole[];
};

export const ProtectedRoute = ({ allowedRoles }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate replace state={{ from: location }} to="/unauthorized" />;
  }

  return <Outlet />;
};

export const PublicOnlyRoute = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate replace to={getDefaultPathForRole(user.role)} />;
  }

  return <Outlet />;
};
