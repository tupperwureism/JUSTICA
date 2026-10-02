import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdvocateKycResultProps { onComplete: () => void }
const rows = [
  ['Status Lisensi SIPP', 'AKTIF & BERLAKU HINGGA 2028', 'VERIFIED ACTIVE'],
  ['Kesesuaian Nama Advokat', 'Dr. Mahendra Kusuma, S.H., M.H.', 'MATCH 100%'],
  ['Catatan Pelanggaran Etik MA', 'TIDAK ADA CATATAN PELANGGARAN', 'CLEAN RECORD'],
] as const;

export function AdvocateKycResult({ onComplete }: AdvocateKycResultProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 animate-fade-in">
      <h2 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Hasil Sinkronisasi API Mahkamah Agung RI</h2>
      <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-[11px]"><thead className="text-muted-foreground"><tr><th className="p-2">Parameter Pemeriksaan</th><th className="p-2">Status Pangkalan Data MA RI</th><th className="p-2">Hasil Kepatuhan Justica</th></tr></thead><tbody className="font-semibold text-foreground">{rows.map((row) => <tr key={row[0]} className="border-t border-emerald-500/20"><td className="p-2">{row[0]}</td><td className="p-2">{row[1]}</td><td className="p-2 text-emerald-500">{row[2]}</td></tr>)}</tbody></table></div>
      <Button type="button" onClick={onComplete} className="w-full min-h-12 rounded-xl bg-emerald-600 text-white font-black text-[10px] sm:text-xs whitespace-nowrap overflow-x-auto hover:bg-emerald-700"><CheckCircle2 className="size-5" />SELESAIKAN ONBOARDING &amp; MASUK KE LOGIN KMS</Button>
    </section>
  );
}
