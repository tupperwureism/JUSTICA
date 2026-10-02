import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClientHeaderAndTabs } from '@/components/client/ClientHeaderAndTabs';
import { ClientGreetingCard } from '@/components/client/ClientGreetingCard';
import { ClientOverviewTables } from '@/components/client/ClientOverviewTables';
import { AdvocateCatalogTab } from '@/components/client/AdvocateCatalogTab';
import { ClientCorporateSuiteTab } from '@/components/corporate/ClientCorporateSuiteTab';
import { MOCK_ADVOCATES } from '@/data/clientAdvocates';
import { AdvocateProfileDetailModal } from '@/components/client/AdvocateProfileDetailModal';
import { CheckoutEscrowModal } from '@/components/client/CheckoutEscrowModal';
import { AccountSettingsTab } from '@/components/client/AccountSettingsTab';
import { DEFAULT_SESSIONS } from '@/types/auth';
import { ACTIVE_CONSULTATIONS, HISTORY_DOCUMENTS } from '@/data/clientPortalData';
import type { Advocate, CheckoutDraft, ClientTabKey } from '@/types/client';

export const ClientDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const session = DEFAULT_SESSIONS.CLIENT;
  const [activeTab, setActiveTab] = useState<ClientTabKey>('dashboard');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  );
  const [selectedAdvocate, setSelectedAdvocate] = useState<Advocate | null>(null);
  const [checkoutDraft, setCheckoutDraft] = useState<CheckoutDraft | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', themeMode === 'dark');
  }, [themeMode]);

  const openProBonoProfile = () => {
    setActiveTab('catalog');
    setSelectedAdvocate(MOCK_ADVOCATES.find((item) => item.hasProBonoQuota) ?? null);
  };

  const startCheckout = (draft: CheckoutDraft) => {
    setSelectedAdvocate(null);
    setCheckoutDraft(draft);
  };

  const completeCheckout = () => {
    setCheckoutDraft(null);
    navigate('/client/room/ses-001');
  };

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <ClientHeaderAndTabs activeTab={activeTab} onTabChange={setActiveTab} themeMode={themeMode}
        onToggleTheme={() => setThemeMode((mode) => (mode === 'dark' ? 'light' : 'dark'))}
        onOpenSettings={() => setShowSettings(true)} />
      <main className="max-w-[1600px] mx-auto w-full px-4 sm:px-8 md:px-10 py-8 sm:py-10">
        {notice && <div role="status" className="client-notice-success">{notice}</div>}
        {activeTab === 'dashboard' && <div className="client-dashboard-shell animate-fade-in">
          <ClientGreetingCard clientName={session.userName} onStartCatalogSearch={() => setActiveTab('catalog')} onStartProBono={openProBonoProfile} />
          <ClientOverviewTables activeConsultations={ACTIVE_CONSULTATIONS} historyDocuments={HISTORY_DOCUMENTS}
            onOpenConsultation={() => navigate('/client/room/ses-001')}
            onDownloadDocument={(id) => setNotice(`Dokumen ${id} siap diteruskan ke layanan unduhan WORM Vault.`)} />
        </div>}
        {activeTab === 'catalog' && <AdvocateCatalogTab onViewProfile={setSelectedAdvocate} />}
        {activeTab === 'j_biz' && <ClientCorporateSuiteTab />}
      </main>
      {selectedAdvocate && <AdvocateProfileDetailModal advocate={selectedAdvocate} onClose={() => setSelectedAdvocate(null)} onProceedToCheckout={startCheckout} />}
      {checkoutDraft && <CheckoutEscrowModal draft={checkoutDraft} onClose={() => setCheckoutDraft(null)} onEnterConsultationRoom={completeCheckout} />}
      {showSettings && <AccountSettingsTab onClose={() => setShowSettings(false)} />}
    </div>
  );
};
