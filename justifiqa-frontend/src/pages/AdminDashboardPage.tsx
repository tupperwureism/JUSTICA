import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminComplianceTab } from '@/components/admin/AdminComplianceTab';
import { AdminDisputeCenterTab } from '@/components/admin/AdminDisputeCenterTab';
import { AdminHeaderAndTabs, type AdminTabKey } from '@/components/admin/AdminHeaderAndTabs';
import { AdminNotaryAssignmentPanel } from '@/components/admin/AdminNotaryAssignmentPanel';
import { AdminSettingsPanel } from '@/components/admin/AdminSettingsPanel';
import { AdminVerificationQueueTab } from '@/components/admin/AdminVerificationQueueTab';
import { authErrorMessage, signOutPortal } from '@/services/portalAuthService';

export function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<AdminTabKey>('compliance');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() => document.documentElement.classList.contains('dark') ? 'dark' : 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
    document.documentElement.classList.toggle('light', themeMode === 'light');
  }, [themeMode]);

  const logout = async () => {
    try {
      await signOutPortal();
      navigate('/admin/login', { replace: true });
    } catch (error) {
      alert(authErrorMessage(error));
    }
  };

  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <AdminHeaderAndTabs activeTab={activeTab} onTabChange={setActiveTab} themeMode={themeMode}
        onToggleTheme={() => setThemeMode((mode) => mode === 'dark' ? 'light' : 'dark')} onLogout={() => { void logout(); }} />
      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-8 sm:py-12">
        {activeTab === 'compliance' && <AdminComplianceTab />}
        {activeTab === 'notary_assignment' && <AdminNotaryAssignmentPanel />}
        {activeTab === 'dispute_center' && <AdminDisputeCenterTab />}
        {activeTab === 'verification_queue' && <AdminVerificationQueueTab />}
        {activeTab === 'settings' && <AdminSettingsPanel />}
      </main>
    </div>
  );
}
