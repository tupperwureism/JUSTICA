import { ArrowLeft, LogOut, Moon, Scale, Settings, ShieldCheck, Sun, UserCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export type AdminTabKey = 'compliance' | 'notary_assignment' | 'dispute_center' | 'verification_queue' | 'settings';

interface AdminHeaderAndTabsProps {
  activeTab: AdminTabKey;
  onTabChange: (tab: AdminTabKey) => void;
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
  onLogout: () => void;
}

const tabs = [
  { key: 'compliance', label: 'Kepatuhan SLA & Audit — MOCK-J-ADM-01', icon: ShieldCheck },
  { key: 'notary_assignment', label: 'Penugasan Notaris Korporasi', icon: UserCheck },
  { key: 'dispute_center', label: 'Pusat Mediasi Escrow — MOCK-J-ADM-02', icon: Scale },
  { key: 'verification_queue', label: 'Antrean Verifikasi Advokat (KYC / SIPP)', icon: UserCheck },
  { key: 'settings', label: 'Pengaturan & Parameter Sistem', icon: Settings },
] as const;

export function AdminHeaderAndTabs({ activeTab, onTabChange, themeMode, onToggleTheme, onLogout }: AdminHeaderAndTabsProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-lg backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 py-4 sm:px-8 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3"><Button asChild variant="outline" size="sm" className="min-h-10 shrink-0 rounded-xl font-bold"><Link to="/"><ArrowLeft />Gerbang Utama</Link></Button><div><p className="font-heading text-lg font-black text-foreground">JUSTICA ADMIN</p><p className="text-xs font-semibold text-muted-foreground">Portal Kepatuhan &amp; Mediasi</p></div></div>
          <div className="flex max-w-full shrink-0 gap-2 overflow-x-auto"><Button type="button" variant="outline" size="sm" className="min-h-10 shrink-0" onClick={onToggleTheme}>{themeMode === 'dark' ? <Moon className="text-blue-400" /> : <Sun className="text-amber-500" />}{themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Button><Button type="button" variant="outline" size="sm" className="min-h-10 shrink-0 font-bold" onClick={onLogout}><LogOut />Keluar</Button></div>
        </div>
        <nav className="flex max-w-full overflow-x-auto rounded-xl border border-border bg-secondary/60 p-1 shadow-inner" aria-label="Navigasi portal admin">
          {tabs.map(({ key, label, icon: Icon }) => (
            <Button key={key} type="button" variant={activeTab === key ? 'default' : 'ghost'} size="sm" onClick={() => onTabChange(key)} className="min-h-10 shrink-0 whitespace-nowrap rounded-lg font-bold"><Icon />{label}</Button>
          ))}
        </nav>
      </div>
    </header>
  );
}
