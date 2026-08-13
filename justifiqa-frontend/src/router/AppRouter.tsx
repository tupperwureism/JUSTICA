import type { ReactElement } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthSessionProvider } from '@/hooks/useAuthSession';
import type { PortalRole } from '@/types/portalAuth';
import { PortalProtectedRoute } from './PortalProtectedRoute';

// ── Batch 1: Root Gateway, Verifier & Authentication ──────────────────────────
import { LandingGatewayPage } from '../pages/LandingGatewayPage';
import { PublicDocumentVerifierPage } from '../pages/PublicDocumentVerifierPage';
import { ClientAuthPage } from '../pages/ClientAuthPage';
import { AdvocateAuthPage } from '../pages/AdvocateAuthPage';
import { ClientLoginPage } from '../pages/auth/ClientLoginPage';
import { AdvocateLoginPage } from '../pages/auth/AdvocateLoginPage';

// ── Batch 2+: Portal Dashboards ───────────────────────────────────────────────
import { ClientDashboardPage } from '../pages/ClientDashboardPage';
import { ClientConsultationRoomPage } from '../pages/ClientConsultationRoomPage';
import { ClientDisputeCenterPage } from '../pages/ClientDisputeCenterPage';
import { AdvocateDashboardPage } from '../pages/AdvocateDashboardPage';
import { AiNavigatorPage } from '../pages/AiNavigatorPage';
import { AdminDashboardPage } from '../pages/AdminDashboardPage';
import { AdminLoginPage } from '../pages/admin/AdminLoginPage';
import { DevShowcasePage } from '../pages/DevShowcasePage';

const protectedElement = (role: PortalRole, element: ReactElement) => (
  <PortalProtectedRoute requiredRole={role}>{element}</PortalProtectedRoute>
);

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <AuthSessionProvider>
        <Routes>
        {/* ── Batch 1: Public Routes ── */}
        <Route path="/" element={<LandingGatewayPage />} />
        <Route path="/public/verify" element={<PublicDocumentVerifierPage />} />
        <Route path="/demo/readiness" element={<DevShowcasePage />} />

        {/* Auth: legacy paths (compatible) */}
        <Route path="/client/auth" element={<ClientAuthPage />} />
        <Route path="/advocate/auth" element={<AdvocateAuthPage />} />

        {/* Auth: Batch 1 canonical paths */}
        <Route path="/client/login" element={<ClientLoginPage />} />
        <Route path="/advocate/login" element={<AdvocateLoginPage />} />

        {/* ── Batch 2+: Protected Portal Routes ── */}
        <Route path="/client/dashboard" element={protectedElement('CLIENT', <ClientDashboardPage />)} />
        <Route path="/client/room/:sessionId" element={protectedElement('CLIENT', <ClientConsultationRoomPage />)} />
        <Route path="/client/room" element={protectedElement('CLIENT', <ClientConsultationRoomPage />)} />
        <Route path="/client/dispute" element={protectedElement('CLIENT', <ClientDisputeCenterPage />)} />
        <Route path="/advocate/dashboard" element={protectedElement('ADVOCATE', <AdvocateDashboardPage />)} />
        <Route path="/ai-legal" element={<AiNavigatorPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={protectedElement('ADMIN', <AdminDashboardPage />)} />
        <Route path="/admin/compliance" element={protectedElement('ADMIN', <Navigate to="/admin/dashboard" replace />)} />

        {/* Catch-all → redirect to Root Gateway */}
        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthSessionProvider>
    </BrowserRouter>
  );
};
