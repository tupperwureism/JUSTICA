import { Download, ShieldCheck, TimerReset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const auditLogs = [
  ['#AUD-991', 'E2EE Session Terminated', 'Hash SHA-256 Valid', '10/07 15:12'],
  ['#AUD-992', 'Escrow Freeze Triggered', 'Client Report #REQ-202607-001', '10/07 14:12'],
  ['#AUD-993', 'SLA Breach Alert', 'Advokat terlambat merespons > 15 menit', '10/07 11:05'],
] as const;

export function AdminComplianceTab() {
  const exportAudit = () => window.alert('Berkas laporan audit WORM ber-hash SHA-256 berhasil diekspor.');

  return (
    <Card className="space-y-6 rounded-3xl border-border bg-card/90 p-6 shadow-xl sm:p-8">
      <div><p className="text-xs font-bold uppercase tracking-widest text-emerald-500">MOCK-J-ADM-01 • Compliance Control</p><h1 className="mt-2 text-2xl font-black text-foreground">PENGAWASAN KEPATUHAN SLA &amp; AUDIT TRAIL</h1><p className="mt-2 text-sm text-muted-foreground">Pantau kepatuhan standar SLA platform dan integritas catatan audit WORM secara transparan.</p></div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Card className="space-y-3 rounded-2xl border-emerald-500/30 bg-emerald-500/10 p-6">
          <TimerReset className="size-8 text-emerald-500" /><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kepatuhan SLA Platform</p><strong className="text-2xl font-mono text-emerald-500">98.4% On-Time</strong>
        </Card>
        <Card className="space-y-3 rounded-2xl border-blue-500/30 bg-blue-500/10 p-6">
          <ShieldCheck className="size-8 text-blue-500" /><p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Status Log WORM</p><strong className="text-2xl font-mono text-blue-500">100% Valid &amp; Immutable</strong>
        </Card>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] text-sm"><thead className="bg-secondary text-left text-xs uppercase text-muted-foreground"><tr><th className="p-4">ID Audit</th><th className="p-4">Aktivitas</th><th className="p-4">Integritas / Detail</th><th className="p-4">Waktu</th></tr></thead><tbody>{auditLogs.map(([id, activity, detail, time]) => <tr key={id} className={`border-t border-border ${id === '#AUD-993' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300' : ''}`}><td className="p-4 font-mono font-bold">{id}</td><td className="p-4 font-bold">{activity}</td><td className="p-4">{detail}</td><td className="p-4 font-mono">{time}</td></tr>)}</tbody></table>
      </div>
      <Button type="button" size="lg" onClick={exportAudit} className="h-12 w-full shrink-0 gap-2 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"><Download />EKSPORT LAPORAN AUDIT</Button>
    </Card>
  );
}
