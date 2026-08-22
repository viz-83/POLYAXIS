import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

/** AUTH-07: Administrator-only routes render a 403-style notice for non-admin users. */
export function AdminRoute() {
  const { isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-red-600">403 — Forbidden</p>
        <h1 className="mt-2 text-2xl font-bold text-ink-900">Administrator access required</h1>
        <p className="mt-2 text-ink-600">Your account does not have permission to view the Admin Panel.</p>
      </div>
    );
  }
  return <Outlet />;
}
