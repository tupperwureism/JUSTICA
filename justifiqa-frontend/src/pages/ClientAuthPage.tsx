import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthPortalHeader } from '@/components/auth/AuthPortalHeader';
import { ClientAuthIntro } from '@/components/auth/ClientAuthIntro';
import { ClientAuthPromoPanel } from '@/components/auth/ClientAuthPromoPanel';
import { ClientLoginForm } from '@/components/auth/ClientLoginForm';
import { ClientRegisterForm } from '@/components/auth/ClientRegisterForm';
import { authErrorMessage, registerPortal, signInPortal } from '@/services/portalAuthService';
import type { AuthTab, ClientLoginFields, ClientRegistrationFields, ThemeMode } from '@/types/authForms';
import { safePortalRedirect } from '@/types/portalAuth';

const initialLogin: ClientLoginFields = { identifier: '', password: '', otp: '', rememberMe: true };
const initialRegistration: ClientRegistrationFields = { nik: '', name: '', phone: '', email: '', password: '', confirmPassword: '', agreeTerms: true };

export const ClientAuthPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuthTab>('login');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [showStatusAlert, setShowStatusAlert] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [login, setLogin] = useState(initialLogin);
  const [registration, setRegistration] = useState(initialRegistration);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = safePortalRedirect(searchParams.get('redirect'), 'CLIENT');

  useEffect(() => { document.documentElement.classList.toggle('dark', themeMode === 'dark'); }, [themeMode]);
  const updateLogin = <K extends keyof ClientLoginFields>(key: K, value: ClientLoginFields[K]) => setLogin((current) => ({ ...current, [key]: value }));
  const updateRegistration = <K extends keyof ClientRegistrationFields>(key: K, value: ClientRegistrationFields[K]) => setRegistration((current) => ({ ...current, [key]: value }));
  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!login.identifier.includes('@')) return alert('Login GoTrue saat ini memerlukan alamat email terdaftar.');
    setSubmitting(true);
    try {
      await signInPortal(login.identifier, login.password, 'CLIENT');
      navigate(redirectUrl, { replace: true });
    } catch (error) {
      alert(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };
  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    if (registration.password !== registration.confirmPassword) return alert('Konfirmasi kata sandi tidak cocok.');
    setSubmitting(true);
    try {
      await registerPortal({ email: registration.email, password: registration.password, role: 'CLIENT', fullName: registration.name, metadata: { nik: registration.nik, phone: registration.phone } });
      setActiveTab('login');
      updateLogin('identifier', registration.email);
      setShowStatusAlert(true);
    } catch (error) {
      alert(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row font-sans transition-colors duration-300 selection:bg-blue-500/30 relative overflow-x-hidden">
      <div className="w-full lg:w-1/2 flex-shrink-0 min-h-screen bg-background flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-border z-20 relative shadow-2xl">
        <AuthPortalHeader portal="client" themeMode={themeMode} onToggleTheme={() => setThemeMode((mode) => mode === 'dark' ? 'light' : 'dark')} />
        <main className="flex-1 flex flex-col items-center justify-center py-8">
          <div className="w-full max-w-[440px] sm:max-w-[480px] mx-auto px-6 sm:px-8 py-6 bg-card text-card-foreground border border-border rounded-3xl shadow-glass space-y-6 animate-fade-in">
            <ClientAuthIntro activeTab={activeTab} onTabChange={setActiveTab} />
            {activeTab === 'login' ? <ClientLoginForm fields={login} showSuccess={showStatusAlert} submitting={submitting} onChange={updateLogin} onSubmit={(event) => { void handleLogin(event); }} /> : <ClientRegisterForm fields={registration} submitting={submitting} onChange={updateRegistration} onSubmit={(event) => { void handleRegister(event); }} />}
          </div>
        </main>
        <footer className="px-6 sm:px-10 py-4 border-t border-border text-center text-[11px] text-muted-foreground flex-shrink-0">© 2026 JUSTICA Legal Platform • Verifikasi 2 Langkah &amp; E2EE Hardened.</footer>
      </div>
      <ClientAuthPromoPanel />
    </div>
  );
};
