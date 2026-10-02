import { Award, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { AuthTab } from '@/types/authForms';

interface AdvocateAuthIntroProps { activeTab: AuthTab; onTabChange: (tab: AuthTab) => void }

export function AdvocateAuthIntro({ activeTab, onTabChange }: AdvocateAuthIntroProps) {
  const tabClass = (tab: AuthTab) => `py-2.5 px-3 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${activeTab === tab ? 'bg-emerald-600 text-white shadow-md' : 'text-muted-foreground hover:text-foreground'}`;
  return (
    <>
      <div className="grid grid-cols-2 gap-1 p-1 bg-secondary border border-border rounded-2xl w-full"><button type="button" onClick={() => onTabChange('login')} className={tabClass('login')}>MASUK SIPP (AD-01)</button><button type="button" onClick={() => onTabChange('register')} className={tabClass('register')}>REGISTRASI KYC (AD-01B)</button></div>
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto shadow-md"><Award className="w-6 h-6" /></div>
        <Badge variant="outline" className="px-3 py-1 rounded-full bg-emerald-500/15 border-emerald-500/30 text-[11px] font-bold text-emerald-400 tracking-wider uppercase gap-1.5"><ShieldCheck className="w-3.5 h-3.5" />{activeTab === 'login' ? 'MOCK-J-AD-01 • Login KMS Advokat' : 'MOCK-J-AD-01B • Verifikasi KYC Advokat'}</Badge>
        <h1 className="text-2xl font-extrabold text-foreground font-heading tracking-tight">{activeTab === 'login' ? 'AUTENTIKASI MITRA ADVOKAT' : 'VERIFIKASI IDENTITAS & SINKRONISASI LISENSI SIPP'}</h1>
        <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">{activeTab === 'login' ? 'Khusus bagi Advokat tersumpah yang terdaftar resmi pada Sistem Informasi Penelusuran Perkara (SIPP) Mahkamah Agung.' : 'Langkah wajib untuk memastikan seluruh advokat yang berpraktik di platform Justica berlisensi aktif dan sah.'}</p>
      </div>
    </>
  );
}
