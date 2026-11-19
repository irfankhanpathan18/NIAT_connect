import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-xl shadow-blue-500/20 animate-pulse">
            <span className="text-2xl font-black text-white">N</span>
          </div>
          <p className="mt-4 text-xs font-semibold text-slate-700 tracking-wide">
            Verifying NIAT Connect Credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // If route requires admin, redirect to dedicated admin login
    if (allowedRoles.includes('ADMIN')) {
      return <Navigate to="/admin/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Role mismatch: send user to their legitimate portal
    return user.role === 'ADMIN' ? (
      <Navigate to="/admin/dashboard" replace />
    ) : (
      <Navigate to="/student/dashboard" replace />
    );
  }

  return <Outlet />;
};
