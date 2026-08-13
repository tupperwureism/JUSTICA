import { Building2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  addBeneficialOwner,
  addCorporateParty,
  addKbliCode,
  removeBeneficialOwner,
  removeCorporateParty,
  removeKbliCode,
  type CorporateEntityType,
  type CorporateIntakeDraft,
} from './corporateUiModel';
import { BeneficialOwnerFields } from './BeneficialOwnerFields';
import { CorporateKbliCodeFields } from './CorporateKbliCodeFields';
import { CorporatePartyFields } from './CorporatePartyFields';

type Props = {
  step: number;
  draft: CorporateIntakeDraft;
  onChange: (
    update: Partial<CorporateIntakeDraft> | ((current: CorporateIntakeDraft) => CorporateIntakeDraft),
  ) => void;
};

const entities: Array<{ value: CorporateEntityType; label: string; note: string }> = [
  { value: 'PT_ORDINARY', label: 'PT Persekutuan Modal', note: 'Struktur saham dan organ perseroan.' },
  { value: 'PT_INDIVIDUAL_UMK', label: 'PT Perorangan UMK', note: 'Pemilik tunggal yang memenuhi kriteria UMK.' },
  { value: 'CV', label: 'Persekutuan Komanditer', note: 'Sekutu aktif dan sekutu pasif.' },
];

export function CorporateIntakeStepFields({ step, draft, onChange }: Props) {
  if (step === 0) return <div className="grid gap-4 md:grid-cols-3">{entities.map((entity) => (
    <Card key={entity.value} className={`gap-3 rounded-2xl p-5 ${draft.entityType === entity.value ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <Building2 className="size-5 shrink-0 text-primary" /><strong>{entity.label}</strong><p className="flex-1 text-sm text-muted-foreground">{entity.note}</p>
      <Button type="button" variant={draft.entityType === entity.value ? 'default' : 'outline'} onClick={() => onChange({ entityType: entity.value })} className="min-h-10 rounded-xl">{draft.entityType === entity.value ? 'Dipilih' : 'Pilih entitas'}</Button>
    </Card>
  ))}</div>;

  if (step === 1) return <div className="grid gap-4 md:grid-cols-2">
    <label className="space-y-2 text-sm font-semibold">Nama usulan<Input required value={draft.businessName} onChange={(event) => onChange({ businessName: event.target.value })} placeholder="Contoh: Justica Solusi Indonesia" className="min-h-10 rounded-xl border-border bg-background" /></label>
    <label className="space-y-2 text-sm font-semibold">Kota domisili<Input required value={draft.domicileCity} onChange={(event) => onChange({ domicileCity: event.target.value })} placeholder="Contoh: Jakarta Selatan" className="min-h-10 rounded-xl border-border bg-background" /></label>
    <label className="space-y-2 text-sm font-semibold">Provinsi domisili<Input required value={draft.domicileProvince} onChange={(event) => onChange({ domicileProvince: event.target.value })} placeholder="Contoh: DKI Jakarta" className="min-h-10 rounded-xl border-border bg-background" /></label>
    <CorporateKbliCodeFields codes={draft.kbliCodes} onChange={(kbliCodes) => onChange({ kbliCodes })} onAdd={() => onChange({ kbliCodes: addKbliCode(draft).kbliCodes })} onRemove={(index) => onChange({ kbliCodes: removeKbliCode(draft, index).kbliCodes })} />
  </div>;

  if (step === 2) return <div className="grid gap-4 md:grid-cols-2">
    <label className="space-y-2 text-sm font-semibold">Modal dasar (IDR)<Input required type="number" min="0" value={draft.authorizedCapitalIdr} onChange={(event) => onChange({ authorizedCapitalIdr: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
    <label className="space-y-2 text-sm font-semibold">Modal disetor (IDR)<Input required type="number" min="0" value={draft.paidUpCapitalIdr} onChange={(event) => onChange({ paidUpCapitalIdr: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
    <CorporatePartyFields parties={draft.corporateParties} onChange={(corporateParties) => onChange({ corporateParties })} onAdd={() => onChange({ corporateParties: addCorporateParty(draft).corporateParties })} onRemove={(index) => onChange({ corporateParties: removeCorporateParty(draft, index).corporateParties })} />
  </div>;

  if (step === 3) return <div className="grid gap-4 md:grid-cols-2">
    <BeneficialOwnerFields owners={draft.beneficialOwners} onChange={(updateOwners) => onChange((current) => ({ ...current, beneficialOwners: updateOwners(current.beneficialOwners) }))} onAdd={() => onChange((current) => addBeneficialOwner(current))} onRemove={(clientRowId) => onChange((current) => removeBeneficialOwner(current, clientRowId))} />
    <Card className="gap-2 rounded-2xl border-primary/30 bg-primary/5 p-4 md:col-span-2"><ShieldCheck className="size-5 text-primary" /><p className="text-sm">Verifikasi dan bukti pemilik manfaat diproses pada workflow kepatuhan terpisah.</p></Card>
  </div>;

  return <div className="grid gap-4 md:grid-cols-2">
    <Card className="gap-3 rounded-2xl border-border bg-muted/40 p-5"><Badge variant="outline">Ringkasan intake</Badge><p className="font-semibold">{draft.businessName || 'Nama belum diisi'}</p><p className="text-sm text-muted-foreground">{draft.entityType} · {draft.kbliCodes.filter(Boolean).join(', ') || 'KBLI belum diisi'} · Pihak: {draft.corporateParties.length} · BO: {draft.beneficialOwners.length}</p></Card>
    <Card className="gap-3 rounded-2xl border-border bg-muted/40 p-5 md:col-span-2">
      <Badge variant="outline">Referensi pembayaran (server)</Badge>
      <p className="text-sm text-muted-foreground">Referensi pembayaran diterbitkan server secara deterministik setelah intake berhasil. Tidak perlu diisi manual.</p>
      <p className="text-xs text-muted-foreground">Kanal pembayaran sandbox belum dikonfigurasi. Referensi pembayaran akan tersedia untuk integrasi provider.</p>
    </Card>
    <label className="flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-sm font-semibold md:col-span-2"><input type="checkbox" checked={draft.acceptedScope} onChange={(event) => onChange({ acceptedScope: event.target.checked })} className="mt-0.5 size-5 shrink-0 accent-primary" />Saya menyetujui ruang lingkup layanan dan memahami bahwa pengajuan pemerintah tunduk pada pemeriksaan Notaris.</label>
  </div>;
}
