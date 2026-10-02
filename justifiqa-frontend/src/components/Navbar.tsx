import React from 'react';
import { Moon, Scale, ShieldCheck, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AuthSession } from '../types/auth';

interface NavbarProps {
  currentSession: AuthSession;
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentSession, themeMode, onToggleTheme }) => (
  <header className="shared-app-navbar">
    <div className="shared-brand-mark">
      <div className="shared-brand-icon"><Scale className="size-6" /></div>
      <div className="min-w-0">
        <div className="font-heading text-xl font-extrabold tracking-wider text-foreground">JUSTICA</div>
        <p className="text-xs font-semibold text-muted-foreground">Platform Hukum Digital &amp; WORM Vault</p>
      </div>
    </div>
    <div className="shared-navbar-actions">
      <Button type="button" variant="outline" onClick={onToggleTheme} className="shared-theme-action">
        {themeMode === 'dark' ? <Moon className="size-4 text-blue-400" /> : <Sun className="size-4 text-amber-500" />}
        {themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </Button>
      <div className="shared-user-status">
        <div>
          <p className="text-sm font-semibold text-foreground">{currentSession.userName}</p>
          <div className="flex items-center justify-end gap-1 text-xs font-medium text-emerald-500"><ShieldCheck className="size-3.5" /><span>FIDO2 Verified</span></div>
        </div>
      </div>
    </div>
  </header>
);
