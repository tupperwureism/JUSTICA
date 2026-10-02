import { AlertTriangle, ArrowLeft, Award, Building2, Calendar, FileCheck, LayoutDashboard, LogOut, MessageSquare, Moon, Settings, ShieldCheck, Sun, Wallet } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { authErrorMessage, signOutPortal } from '@/services/portalAuthService';

export type AdvocateTabKey = 'command_center' | 'corporate_cases' | 'e2ee_room' | 'schedule' | 'deliverable' | 'wallet' | 'pro_bono' | 'settings';

interface AdvocateHeaderAndTabsProps {
  activeTab: AdvocateTabKey;
  onTabChange: (tab: AdvocateTabKey) => void;
  practiceStatus: 'ONLINE' | 'OFFLINE';
  onToggleStatus: () => void;
  simulateConflict: boolean;
  onToggleConflict: (checked: boolean) => void;
  conflictError: string | null;
  themeMode: 'dark' | 'light';
  onToggleTheme: () => void;
}

const tabs = [
  { key: 'command_center', label: 'Command Center', icon: LayoutDashboard },
  { key: 'corporate_cases', label: 'J-BIZ Corporate', icon: Building2 },
  { key: 'e2ee_room', label: 'Ruang Konsultasi E2EE', icon: MessageSquare },
  { key: 'schedule', label: 'Jadwal & Slot', icon: Calendar },
  { key: 'deliverable', label: 'Deliverable e-Meterai', icon: FileCheck },
  { key: 'wallet', label: 'Dompet & Honor', icon: Wallet },
  { key: 'pro_bono', label: 'Pro Bono & Laporan', icon: Award },
  { key: 'settings', label: 'Pengaturan & Lisensi', icon: Settings },
] as const;

export function AdvocateHeaderAndTabs(props: AdvocateHeaderAndTabsProps) {
  const navigate = useNavigate();
  const logout = async () => {
    try {
      await signOutPortal();
      navigate('/advocate/login', { replace: true });
    } catch (error) {
      alert(authErrorMessage(error));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 border-b border-border pb-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm" className="min-h-10 rounded-xl font-semibold"><Link to="/"><ArrowLeft />Gerbang Utama</Link></Button>
          <Badge variant="outline" className="min-h-10 rounded-full border-primary/30 bg-primary/10 px-3 text-primary"><ShieldCheck />MOCK-J-AD-02A..06 • Command Center Advokat PERADI</Badge>
          <Button type="button" variant="outline" size="sm" onClick={props.onToggleTheme} className="min-h-10 whitespace-nowrap rounded-xl font-semibold">{props.themeMode === 'dark' ? <Moon className="text-primary" /> : <Sun className="text-primary" />}{props.themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}</Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { void logout(); }} className="min-h-10 whitespace-nowrap rounded-xl font-bold"><LogOut />Keluar</Button>
        </div>
        <div className="flex max-w-full overflow-x-auto rounded-xl border border-border bg-secondary/60 p-1 shadow-inner">
          {tabs.map(({ key, label, icon: Icon }) => (
            <Button key={key} type="button" variant={props.activeTab === key ? 'default' : 'ghost'} size="sm" onClick={() => props.onTabChange(key)} className="min-h-10 shrink-0 whitespace-nowrap rounded-lg font-bold">
              <Icon />{label}
            </Button>
          ))}
        </div>
      </div>
      <Card className="flex flex-col items-center justify-between gap-4 rounded-2xl border-border bg-card/90 p-4 shadow-md sm:flex-row">
        <div className="flex flex-wrap items-center gap-3">
            <span className={`size-3 rounded-full ${props.practiceStatus === 'ONLINE' ? 'bg-primary animate-pulse' : 'bg-muted'}`} />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status Praktik: <strong className="text-primary">{props.practiceStatus}</strong></span>
          <Button type="button" variant="outline" size="sm" onClick={props.onToggleStatus} className="min-h-10 whitespace-nowrap rounded-lg font-bold">Ubah ke {props.practiceStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE'}</Button>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={props.simulateConflict} onChange={(event) => props.onToggleConflict(event.target.checked)} />Simulasikan Sesi Aktif / Sidang (Error 409 Conflict)</label>
      </Card>
      {props.conflictError && <Card className="flex items-center gap-3 rounded-xl border-destructive/40 bg-destructive/15 p-4 text-xs text-destructive"><AlertTriangle className="shrink-0" />{props.conflictError}</Card>}
    </div>
  );
}
