import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AdvocateAuthIntro } from '@/components/auth/AdvocateAuthIntro';
import { AdvocateAuthPromoPanel } from '@/components/auth/AdvocateAuthPromoPanel';
import { AdvocateLoginForm } from '@/components/auth/AdvocateLoginForm';
import { AdvocateRegisterForm } from '@/components/auth/AdvocateRegisterForm';
import { AuthPortalHeader } from '@/components/auth/AuthPortalHeader';
import { authErrorMessage, registerPortal, signInPortal } from '@/services/portalAuthService';
import type { AdvocateLoginFields, AdvocateRegistrationFields, AuthTab, SyncStatus, ThemeMode } from '@/types/authForms';
import { safePortalRedirect } from '@/types/portalAuth';

const initialLogin: AdvocateLoginFields = { nia: '', email: '', kmsPassword: '', mfaOtp: '', kmsPin: '', hardwareBoundSession: true };
const initialRegistration: AdvocateRegistrationFields = { name: '', email: '', password: '', confirmPassword: '', nik: '', sipp: '', organization: 'PERADI', bank: '' };

export const AdvocateAuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [showHardwareModal, setShowHardwareModal] = useState(false);
  const [showRegSuccess, setShowRegSuccess] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [submitting, setSubmitting] = useState(false);
  const [login, setLogin] = useState(initialLogin);
  const [registration, setRegistration] = useState(initialRegistration);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = safePortalRedirect(searchParams.get('redirect'), 'ADVOCATE');

  useEffect(() => { document.documentElement.classList.toggle('dark', themeMode === 'dark'); }, [themeMode]);
  const updateLogin = <K extends keyof AdvocateLoginFields>(key: K, value: AdvocateLoginFields[K]) => setLogin((current) => ({ ...current, [key]: value }));
  const updateRegistration = <K extends keyof AdvocateRegistrationFields>(key: K, value: AdvocateRegistrationFields[K]) => setRegistration((current) => ({ ...current, [key]: value }));
  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signInPortal(login.email, login.kmsPassword, 'ADVOCATE');
      navigate(redirectUrl, { replace: true });
    } catch (error) {
      alert(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };
  const handleKycSync = (event: React.FormEvent) => {
    event.preventDefault();
    setSyncStatus('syncing');
    window.setTimeout(() => setSyncStatus('verified'), 800);
  };
  const validateLegalFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.size > 10 * 1024 * 1024) {
      alert('Ukuran dokumen legalitas maksimal 10MB.');
      event.target.value = '';
    }
  };
  const completeOnboarding = async () => {
    if (registration.password !== registration.confirmPassword) return alert('Konfirmasi kata sandi tidak cocok.');
    setSubmitting(true);
    try {
      await registerPortal({ email: registration.email, password: registration.password, role: 'ADVOCATE', fullName: registration.name, metadata: { nik: registration.nik, sipp: registration.sipp, organization: registration.organization, bank: registration.bank } });
      setShowRegSuccess(true);
      setActiveTab('login');
      setLogin((current) => ({ ...current, nia: registration.sipp, email: registration.email }));
    } catch (error) {
      alert(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row font-sans transition-colors duration-300 selection:bg-emerald-500/30 relative overflow-x-hidden">
      <div className="w-full lg:w-1/2 flex-shrink-0 min-h-screen bg-background flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border z-20 relative shadow-2xl">
        <AuthPortalHeader portal="advocate" themeMode={themeMode} onToggleTheme={() => setThemeMode((mode) => mode === 'dark' ? 'light' : 'dark')} />
        <main className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-[440px] sm:max-w-[480px] mx-auto px-6 sm:px-8 py-6 bg-card text-card-foreground border border-border rounded-3xl shadow-glass space-y-6 animate-fade-in">
            <AdvocateAuthIntro activeTab={activeTab} onTabChange={setActiveTab} />
            {activeTab === 'login' ? (
              <AdvocateLoginForm fields={login} showSuccess={showRegSuccess} showRecovery={showHardwareModal} submitting={submitting} onShowRecovery={() => setShowHardwareModal(true)} onChange={updateLogin} onSubmit={(event) => { void handleAuth(event); }} />
            ) : (
              <AdvocateRegisterForm fields={registration} syncStatus={syncStatus} onChange={updateRegistration} onFileChange={validateLegalFile} onSubmit={handleKycSync} onComplete={() => { void completeOnboarding(); }} />
            )}
          </div>
        </main>
        <footer className="px-6 sm:px-10 py-4 border-t border-border text-center text-[11px] text-muted-foreground flex-shrink-0">© 2026 JUSTICA Legal Platform • Verifikasi Mahkamah Agung &amp; KMS e-Meterai Peruri.</footer>
      </div>
      <AdvocateAuthPromoPanel />
    </div>
  );
};
