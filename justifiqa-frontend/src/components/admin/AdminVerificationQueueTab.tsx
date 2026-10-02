import { FileCheck2, UserCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const candidates = [
  { name: 'Calon Adv. Bambang S., S.H., M.H.', license: 'PERADI #44123', documents: 'KTP & Berita Acara Sumpah: LENGKAP', sipp: 'VERIFIED MA RI' },
  { name: 'Calon Adv. Siti Aminah, S.H.', license: 'AAI #99120', documents: 'Dokumen KTP: LENGKAP', sipp: 'PENDING CHECK' },
] as const;

export function AdminVerificationQueueTab() {
  const approve = (name: string) => window.alert(`${name} resmi terverifikasi dan aktif di katalog Klien.`);
  const reject = (name: string) => window.alert(`Permintaan perbaikan berkas telah dikirim kepada ${name}.`);

  return (
    <Card className="space-y-6 rounded-3xl border-border bg-card/90 p-6 shadow-xl sm:p-8">
      <div><p className="text-xs font-bold uppercase tracking-widest text-blue-500">J-UC08 / ST-J-10</p><h1 className="mt-2 text-2xl font-black text-foreground">ANTREAN VERIFIKASI ADVOKAT (KYC / SIPP)</h1><p className="mt-2 text-sm text-muted-foreground">Validasi identitas, organisasi advokat, dan status lisensi Mahkamah Agung sebelum aktivasi katalog.</p></div>
      <div className="space-y-4">
        {candidates.map((candidate) => (
          <Card key={candidate.license} className="space-y-4 rounded-2xl border-border bg-secondary/30 p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex gap-3"><UserCheck className="size-7 shrink-0 text-blue-500" /><div><h2 className="font-black text-foreground">{candidate.name}</h2><p className="text-sm text-muted-foreground">Lisensi {candidate.license}</p></div></div><Badge variant="outline" className={candidate.sipp === 'VERIFIED MA RI' ? 'border-emerald-500/40 text-emerald-500' : 'border-amber-500/40 text-amber-600'}>{candidate.sipp}</Badge></div>
            <p className="flex items-center gap-2 text-sm font-bold text-foreground"><FileCheck2 className="size-5 text-emerald-500" />{candidate.documents}</p>
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              <Button type="button" className="min-h-12 shrink-0 bg-emerald-600 font-bold text-white hover:bg-emerald-700" onClick={() => approve(candidate.name)}>SETUJUI &amp; AKTIFKAN DI KATALOG</Button>
              <Button type="button" variant="outline" className="min-h-12 shrink-0 border-red-500/50 font-bold text-red-500 hover:bg-red-500/10" onClick={() => reject(candidate.name)}>TOLAK BERKAS / MINTA REVISI</Button>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  );
}
