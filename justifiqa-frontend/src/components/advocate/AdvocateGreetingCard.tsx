import { Award } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface AdvocateGreetingCardProps { userName?: string }

const reputation = [
  ['Status Verifikasi MA', 'ACTIVE SIPP VERIFIED', 'text-emerald-400'],
  ['SLA Respons E2EE', '99.4% (< 2 Menit)', 'font-mono'],
  ['Perkara Selesai', '318 Perkara', ''],
  ['Escrow Siap Cair', 'Rp 14.850.000', 'text-emerald-400 font-mono'],
] as const;

export function AdvocateGreetingCard({ userName }: AdvocateGreetingCardProps) {
  return (
    <Card className="relative overflow-hidden rounded-3xl border-border bg-card p-6 shadow-2xl sm:p-8">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
      <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-3"><span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/15 text-emerald-500"><Award /></span><div><h1 className="font-heading text-xl font-extrabold text-foreground">INFORMASI ADVOKAT &amp; RINGKASAN REPUTASI SIPP</h1><p className="text-xs font-semibold text-emerald-500">Selamat datang, Adv. {userName || 'Dr. Mahendra Kusuma'}, S.H., M.H. · NIA: 18293/PERADI/2015</p></div></div>
          <p className="text-sm leading-relaxed text-muted-foreground">Seluruh aktivitas sesi Anda diawasi oleh <strong className="text-foreground">Fair-Clock SLA Monitor</strong>.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {reputation.map(([label, value, style]) => <Card key={label} className="rounded-2xl border-border bg-secondary/40 p-3.5 text-center"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p><strong className={`mt-1 inline-block text-xs ${style}`}>{value}</strong></Card>)}
        </div>
      </div>
    </Card>
  );
}
