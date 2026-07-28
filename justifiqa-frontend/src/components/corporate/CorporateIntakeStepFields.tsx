import { Building2, CircleDollarSign, Scale, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { CorporateEntityType, CorporateIntakeDraft } from './corporateUiModel';

type Props = {
  step: number;
  draft: CorporateIntakeDraft;
  onChange: (patch: Partial<CorporateIntakeDraft>) => void;
};

const entities: Array<{ value: CorporateEntityType; label: string; note: string }> = [
  { value: 'PT_ORDINARY', label: 'PT Persekutuan Modal', note: 'Struktur saham dan organ perseroan.' },
  { value: 'PT_INDIVIDUAL_UMK', label: 'PT Perorangan UMK', note: 'Pemilik tunggal yang memenuhi kriteria UMK.' },
  { value: 'CV', label: 'Persekutuan Komanditer', note: 'Sekutu aktif dan sekutu pasif.' },
];

const fieldClass = 'min-h-10 rounded-xl border-border bg-background';

export function CorporateIntakeStepFields({ step, draft, onChange }: Props) {
  if (step === 0) return <div className="grid gap-4 md:grid-cols-3">{entities.map((entity) => (
    <Card key={entity.value} className={`gap-3 rounded-2xl p-5 ${draft.entityType === entity.value ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <Building2 className="size-5 shrink-0 text-primary" /><strong>{entity.label}</strong><p className="flex-1 text-sm text-muted-foreground">{entity.note}</p>
      <Button type="button" variant={draft.entityType === entity.value ? 'default' : 'outline'} onClick={() => onChange({ entityType: entity.value })} className="min-h-10 rounded-xl">{draft.entityType === entity.value ? 'Dipilih' : 'Pilih entitas'}</Button>
    </Card>
  ))}</div>;

  if (step === 1) return <div className="grid gap-4 md:grid-cols-2">
    <label className="space-y-2 text-sm font-semibold">Nama usulan<Input required value={draft.businessName} onChange={(e) => onChange({ businessName: e.target.value })} placeholder="Contoh: Justica Solusi Indonesia" className={fieldClass} /></label>
    <label className="space-y-2 text-sm font-semibold">Domisili<Input required value={draft.domicile} onChange={(e) => onChange({ domicile: e.target.value })} placeholder="Kota/Kabupaten, Provinsi" className={fieldClass} /></label>
    <label className="space-y-2 text-sm font-semibold md:col-span-2">KBLI utama<Input required value={draft.kbli} onChange={(e) => onChange({ kbli: e.target.value })} placeholder="Kode dan uraian KBLI" className={fieldClass} /></label>
  </div>;

  if (step === 2) return <div className="grid gap-4 md:grid-cols-2">
    <label className="space-y-2 text-sm font-semibold">Nama pendiri / sekutu<Input required value={draft.founderName} onChange={(e) => onChange({ founderName: e.target.value })} className={fieldClass} /></label>
    <label className="space-y-2 text-sm font-semibold">Persentase kepemilikan / kontribusi<Input required type="number" min="0" max="100" value={draft.ownership} onChange={(e) => onChange({ ownership: e.target.value })} className={fieldClass} /></label>
    <Card className="gap-2 rounded-2xl border-border bg-muted/50 p-4 md:col-span-2"><Scale className="size-5 text-primary" /><p className="text-sm text-muted-foreground">Untuk CV, sistem akan meminta sekutu aktif dan pasif. Untuk PT, total kepemilikan dan hak suara direkonsiliasi sebelum review notaris.</p></Card>
  </div>;

  if (step === 3) return <div className="grid gap-4 md:grid-cols-2">
    <label className="space-y-2 text-sm font-semibold">Nama orang Pemilik Manfaat<Input required value={draft.boName} onChange={(e) => onChange({ boName: e.target.value })} className={fieldClass} /></label>
    <label className="space-y-2 text-sm font-semibold">Dasar kendali<select value={draft.controlBasis} onChange={(e) => onChange({ controlBasis: e.target.value })} className={`${fieldClass} w-full px-3 text-sm`}><option value="OWNERSHIP">Kepemilikan</option><option value="VOTING_RIGHTS">Hak suara</option><option value="APPOINTMENT_REMOVAL">Pengangkatan/pemberhentian</option><option value="EFFECTIVE_CONTROL">Kendali efektif lain</option></select></label>
    <Card className="gap-2 rounded-2xl border-primary/30 bg-primary/5 p-4 md:col-span-2"><ShieldCheck className="size-5 text-primary" /><p className="text-sm">BO wajib orang perseorangan. Bukti dilindungi dan direkam dengan digest SHA-256; status compliance rahasia tidak ditampilkan kepada klien.</p></Card>
  </div>;

  return <div className="grid gap-4 md:grid-cols-2">
    <Card className="gap-3 rounded-2xl border-border bg-muted/40 p-5"><Badge variant="outline">Ringkasan intake</Badge><p className="font-semibold">{draft.businessName || 'Nama belum diisi'}</p><p className="text-sm text-muted-foreground">{draft.entityType} · {draft.kbli || 'KBLI belum diisi'} · BO: {draft.boName || 'belum diisi'}</p></Card>
    <Card className="gap-3 rounded-2xl border-border bg-muted/40 p-5"><CircleDollarSign className="size-5 text-primary" /><p className="font-semibold">Milestone escrow</p><p className="text-sm text-muted-foreground">Dana dilepas per hasil kerja yang disetujui. Biaya final muncul setelah notaris memeriksa ruang lingkup dan dokumen.</p></Card>
    <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm font-semibold md:col-span-2"><input type="checkbox" checked={draft.acceptedScope} onChange={(e) => onChange({ acceptedScope: e.target.checked })} className="mt-0.5 size-5 shrink-0 accent-primary" />Saya menyetujui ruang lingkup layanan dan memahami bahwa pengajuan pemerintah tunduk pada pemeriksaan Notaris.</label>
  </div>;
}
