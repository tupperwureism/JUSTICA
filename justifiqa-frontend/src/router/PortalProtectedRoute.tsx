import type { ReactElement } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { usePortalSession } from '@/hooks/usePortalSession';
import { portalHome, portalLogin, type PortalRole } from '@/types/portalAuth';

interface PortalProtectedRouteProps {
  children: ReactElement;
  requiredRole: PortalRole;
}

export function PortalProtectedRoute({ children, requiredRole }: PortalProtectedRouteProps) {
  const { session, role, loading } = usePortalSession();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-background text-sm font-semibold text-muted-foreground">Memverifikasi sesi GoTrue...</div>;
  }
  if (!session || !role) {
    const target = `${location.pathname}${location.search}`;
    return <Navigate to={`${portalLogin[requiredRole]}?redirect=${encodeURIComponent(target)}`} replace />;
  }
  if (role !== requiredRole) return <Navigate to={portalHome[role]} replace />;
  return children;
}
