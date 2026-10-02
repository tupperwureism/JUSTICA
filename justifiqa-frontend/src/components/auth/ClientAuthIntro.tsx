import { FileText, Lock, ShieldCheck, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AuthTab } from '@/types/authForms';

interface ClientAuthIntroProps { activeTab: AuthTab; onTabChange: (tab: AuthTab) => void }

export function ClientAuthIntro({ activeTab, onTabChange }: ClientAuthIntroProps) {
  const tabClass = (tab: AuthTab) => `flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg ring-1 ring-blue-400/50' : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'}`;
  return (
    <>
      <div className="text-center space-y-2"><div className="w-12 h-12 rounded-2xl bg-blue-500/15 border border-blue-500/40 flex items-center justify-center text-blue-400 mx-auto shadow-md"><UserCheck className="w-6 h-6" /></div><Badge variant="outline" className="px-3 py-1 rounded-full bg-blue-500/15 border-blue-500/30 text-[11px] font-bold text-blue-400 tracking-wider uppercase gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />MOCK-J-CL-01 • Klien Hukum</Badge><h1 className="text-2xl font-extrabold text-foreground font-heading tracking-tight">MASUK KE PORTAL KLIEN</h1><p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">Silakan masuk atau daftarkan identitas Anda untuk memulai konsultasi hukum terverifikasi.</p></div>
      <div className="flex rounded-2xl bg-secondary p-1.5 border border-border shadow-inner"><button type="button" onClick={() => onTabChange('login')} className={tabClass('login')}><Lock className="w-4 h-4" />Masuk Akun</button><button type="button" onClick={() => onTabChange('register')} className={tabClass('register')}><FileText className="w-4 h-4" />Daftar Baru</button></div>
    </>
  );
}
