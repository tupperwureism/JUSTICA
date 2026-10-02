import { useState } from 'react';
import { Gavel, Scale, WalletCards } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const chronology = [
  '10/07 14:10 — Klien mengajukan laporan kualitas deliverable.',
  '10/07 14:12 — Sistem membekukan Escrow secara otomatis.',
  '10/07 14:25 — Mediator memverifikasi hash SHA-256 log E2EE.',
] as const;

const tickets = [
  ['#DSP-202607-001', 'Klien vs Dr. Mahendra K., S.H.', 'Rp 450.000', 'ESCROW FROZEN', 'Mediasi Dalam Proses'],
  ['#DSP-202607-002', 'Klien vs Anita Wulandari, S.H.', 'Rp 2.800.000', 'INVESTIGATING', 'Menunggu Bukti Log E2EE'],
  ['#DSP-202607-003', 'Klien vs Adv. Rina Kartika', 'Rp 0 (SKTM)', 'RESOLVED', 'Sengketa Ditutup'],
] as const;

export function AdminDisputeCenterTab() {
  const [resolution, setResolution] = useState<'refund' | 'release' | null>(null);
  const refundClient = () => { setResolution('refund'); window.alert('Dana Escrow Rp 450.000 resmi dikembalikan ke Klien.'); };
  const releaseAdvocate = () => { setResolution('release'); window.alert('Dana Escrow Rp 450.000 resmi dicairkan ke Dompet Advokat.'); };

  return (
    <section className="space-y-6">
      <Card className="space-y-6 rounded-3xl border-border bg-card/90 p-6 shadow-xl sm:p-8">
        <div><p className="text-xs font-bold uppercase tracking-widest text-red-500">MOCK-J-ADM-02 • Arbitration Desk</p><h1 className="mt-2 text-2xl font-black text-foreground">MEDIASI SENGKETA &amp; INVESTIGASI WHISTLEBLOWING</h1><p className="mt-2 text-sm text-muted-foreground">Kelola sengketa layanan dan putuskan pencairan atau pengembalian dana Escrow yang tertahan.</p></div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Card className="space-y-2 rounded-2xl border-border bg-secondary/40 p-6"><Scale className="size-7 text-red-500" /><p className="text-xs font-bold uppercase text-muted-foreground">Kasus Sengketa Aktif</p><strong className="text-2xl text-foreground">3 Kasus</strong></Card>
          <Card className="space-y-2 rounded-2xl border-red-500/30 bg-red-500/10 p-6"><WalletCards className="size-7 text-red-500" /><p className="text-xs font-bold uppercase text-muted-foreground">Dana Escrow Tertahan</p><strong className="text-2xl font-mono text-red-500">Rp 18.400.000 (Frozen)</strong></Card>
        </div>
        <div className="overflow-x-auto rounded-2xl border border-border"><table className="w-full min-w-[900px] text-sm"><thead className="bg-secondary text-left text-xs uppercase text-muted-foreground"><tr><th className="p-4">ID</th><th className="p-4">Para Pihak</th><th className="p-4">Nominal</th><th className="p-4">Status</th><th className="p-4">Tahap</th></tr></thead><tbody>{tickets.map(([id, parties, amount, status, stage]) => <tr key={id} className="border-t border-border"><td className="p-4 font-mono font-bold">{id}</td><td className="p-4">{parties}</td><td className="p-4 font-mono">{amount}</td><td className="p-4 font-bold">{status}</td><td className="p-4">{stage}</td></tr>)}</tbody></table></div>
      </Card>
      <Card className="gap-0 overflow-hidden rounded-3xl border-border bg-card shadow-xl">
        <header className="flex flex-col gap-3 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"><div className="flex items-center gap-3"><Gavel className="size-8 shrink-0 text-blue-500" /><div><h2 className="font-black text-foreground">Kasus #DSP-202607-001</h2><p className="text-sm text-muted-foreground">Klien vs Adv. Dr. Mahendra Kusuma, S.H. • #REQ-202607-001</p></div></div><Badge className="min-h-10 border-red-500/40 bg-red-500/10 px-3 text-red-500">Rp 450.000 (Frozen)</Badge></header>
        <div className="flex-1 space-y-3 p-6 sm:p-8"><h3 className="font-bold text-foreground">Kronologi Investigasi</h3>{chronology.map((item) => <p key={item} className="rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">{item}</p>)}</div>
        <footer className="mt-auto grid grid-cols-1 gap-3 border-t border-border p-6 sm:grid-cols-2 sm:p-8">
          <Button type="button" size="lg" onClick={refundClient} disabled={resolution !== null} className="h-12 shrink-0 whitespace-nowrap bg-emerald-600 font-bold text-white hover:bg-emerald-700">{resolution === 'refund' ? 'REFUND KLIEN TELAH DIEKSEKUSI' : 'EKSEKUSI REFUND KLIEN'}</Button>
          <Button type="button" size="lg" onClick={releaseAdvocate} disabled={resolution !== null} className="h-12 shrink-0 whitespace-nowrap bg-blue-600 font-bold text-white hover:bg-blue-700">{resolution === 'release' ? 'RELEASE ADVOKAT TELAH DIEKSEKUSI' : 'EKSEKUSI RELEASE ADVOKAT'}</Button>
        </footer>
      </Card>
    </section>
  );
}
