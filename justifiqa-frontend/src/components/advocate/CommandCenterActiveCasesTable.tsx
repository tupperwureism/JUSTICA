import { Briefcase, DollarSign, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CommandCenterActiveCasesTableProps {
  onEnterRoom: () => void;
  onUploadDeliverable: () => void;
  onViewMediation: () => void;
  onWithdrawEscrow: () => void;
}

export function CommandCenterActiveCasesTable(props: CommandCenterActiveCasesTableProps) {
  const cases = [
    ['REQ-202607-001', 'PT Mitra Jaya (Klien)', 'Tier 2 (E2EE 45m)', '10:30 - 11:15 WIB', 'READY (SLA OK)', 'emerald', 'MASUK RUANG CHAT', props.onEnterRoom],
    ['REQ-202607-002', 'Bpk. Hendra S.', 'Tier 3 (Drafting)', 'Deadline: 11 Juli 2026', 'DRAFTING IN PROGRESS', 'blue', 'UNGGAH DELIVERABLE', props.onUploadDeliverable],
    ['REQ-202607-003', 'Ibu Kartika', 'Tier 2 (E2EE 45m)', '09 Juli 2026', 'ESCROW FROZEN (DISPUTE)', 'red', 'LIHAT MEDIASI', props.onViewMediation],
  ] as const;
  const tone = { emerald: 'border-emerald-500/30 bg-emerald-500/15 text-emerald-500', blue: 'border-blue-500/30 bg-blue-500/15 text-blue-500', red: 'border-red-500/30 bg-red-500/15 text-red-500' };

  return (
    <div className="space-y-5">
      <Card className="space-y-4 rounded-3xl border-border bg-card/90 p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="flex items-center gap-2 text-sm font-bold text-foreground"><Briefcase className="text-emerald-500" />DAFTAR PERKARA HUKUM AKTIF &amp; JADWAL KONSULTASI HARI INI</h2><Badge variant="outline" className="min-h-10 whitespace-nowrap font-mono">SELECT ... FOR UPDATE Mutex Lock</Badge></div>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[1040px] text-left text-xs">
            <thead className="bg-secondary/60 text-muted-foreground"><tr>{['ID Perkara', 'Nama Klien', 'Layanan & Tier', 'Jadwal / Batas Waktu', 'Status Fair-Clock', 'Aksi Langsung'].map((heading) => <th key={heading} className="p-4 uppercase tracking-wider">{heading}</th>)}</tr></thead>
            <tbody className="divide-y divide-border/40">
              {cases.map(([id, client, service, schedule, status, color, actionLabel, action]) => (
                <tr key={id} className="hover:bg-secondary/40"><td className="p-4 font-mono font-bold">{id}</td><td className="p-4 font-bold">{client}</td><td className="p-4 text-muted-foreground">{service}</td><td className="p-4 font-mono">{schedule}</td><td className="p-4"><Badge variant="outline" className={`min-h-10 whitespace-nowrap ${tone[color]}`}>{status}</Badge></td><td className="p-4 text-right"><Button type="button" size="sm" onClick={action} className="min-h-10 whitespace-nowrap font-bold">{actionLabel}</Button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
      <Card className="flex flex-col items-center justify-between gap-4 rounded-3xl border-border bg-card/90 p-6 shadow-xl lg:flex-row">
        <div className="flex items-center gap-3"><DollarSign className="text-emerald-500" /><div><h3 className="font-extrabold">PENCAIRAN SALDO ESCROW TERVERIFIKASI KE REKENING BANK MANDIRI</h3><p className="text-xs text-muted-foreground">Transfer aman via BI-FAST dengan audit pajak WORM.</p></div></div>
        <div className="flex max-w-full gap-3 overflow-x-auto"><Button type="button" onClick={props.onWithdrawEscrow} className="min-h-10 whitespace-nowrap bg-emerald-600 font-bold text-white hover:bg-emerald-700">TARIK SALDO ESCROW (Rp 14.850.000) VIA BI-FAST</Button><Button type="button" variant="outline" onClick={() => alert('Mengunduh Laporan Audit Pajak PPh 21...')} className="min-h-10 whitespace-nowrap font-bold"><Download />Unduh Laporan PPh 21</Button></div>
      </Card>
    </div>
  );
}
