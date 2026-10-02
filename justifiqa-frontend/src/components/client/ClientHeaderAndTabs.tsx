import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Scale, Sun, Moon, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ClientTabNav } from './ClientTabNav';
import type { ClientTabKey } from '@/types/client';
import { authErrorMessage, signOutPortal } from '@/services/portalAuthService';

interface ClientHeaderAndTabsProps {
  activeTab: ClientTabKey;
  onTabChange: (tab: ClientTabKey) => void;
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export function ClientHeaderAndTabs({
  activeTab,
  onTabChange,
  themeMode,
  onToggleTheme,
  onOpenSettings,
}: ClientHeaderAndTabsProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOutPortal();
      navigate('/client/login', { replace: true });
    } catch (error) {
      alert(authErrorMessage(error));
    }
  };

  return (
    <header className="gateway-navbar-shell">
      <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-8 flex items-center justify-between gap-4">
        <Link to="/" className="navbar-brand-pill flex-shrink-0">
          <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg">
            <Scale className="w-5 h-5" />
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-extrabold text-base tracking-tight text-foreground font-heading">JUSTICA</span>
            <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">Portal Klien Terverifikasi</span>
          </div>
        </Link>

        <ClientTabNav activeTab={activeTab} onTabChange={onTabChange} className="hidden md:flex" />
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onToggleTheme}
            className="rounded-full gap-1.5 font-semibold h-9 px-3"
          >
            {themeMode === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Dark Mode</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">Light Mode</span>
              </>
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="rounded-full gap-1.5 font-semibold h-9 px-3"
          >
            <Settings className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Pengaturan</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => { void handleLogout(); }}
            className="navbar-btn-action border-border bg-secondary text-foreground hover:bg-secondary/80"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Keluar</span>
          </Button>
        </div>
      </div>

      <div className="md:hidden w-full px-4 pb-3 -mt-1">
        <ClientTabNav activeTab={activeTab} onTabChange={onTabChange} className="flex" />
      </div>
    </header>
  );
}
