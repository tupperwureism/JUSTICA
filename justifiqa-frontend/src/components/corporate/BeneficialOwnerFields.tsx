import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BENEFICIAL_OWNER_CONTROL_BASES,
  type BeneficialOwnerDraft,
} from '@/models/corporateIntake';

type Props = {
  owners: BeneficialOwnerDraft[];
  onChange: (owners: BeneficialOwnerDraft[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

const controlBasisLabels: Record<BeneficialOwnerDraft['controlBasis'], string> = {
  OWNERSHIP: 'Kepemilikan',
  VOTING_RIGHTS: 'Hak suara',
  APPOINTMENT_REMOVAL: 'Pengangkatan/pemberhentian',
  EFFECTIVE_CONTROL: 'Kendali efektif',
  BENEFICIAL_ENTITLEMENT: 'Hak manfaat ekonomi',
};

export function BeneficialOwnerFields({ owners, onChange, onAdd, onRemove }: Props) {
  const updateOwner = (index: number, patch: Partial<BeneficialOwnerDraft>) => {
    onChange(owners.map((owner, ownerIndex) => (ownerIndex === index ? { ...owner, ...patch } : owner)));
  };

  return (
    <fieldset className="space-y-4 md:col-span-2">
      <legend className="text-sm font-semibold">Pemilik manfaat</legend>
      <p className="text-sm text-muted-foreground">Pemilik manfaat harus orang perseorangan dan dicatat terpisah dari pihak korporasi.</p>
      {owners.map((owner, index) => (
        <Card key={`owner-${index}`} role="group" aria-labelledby={`owner-title-${index}`} className="gap-4 rounded-2xl border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p id={`owner-title-${index}`} className="font-semibold">Pemilik manfaat {index + 1}</p>
            <Button type="button" variant="outline" size="sm" disabled={owners.length <= 1} onClick={() => onRemove(index)} aria-label={`Hapus pemilik manfaat ${index + 1}`}>
              <Minus /> Hapus
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">Nama orang<Input required value={owner.naturalPersonName} onChange={(event) => updateOwner(index, { naturalPersonName: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
            <label className="space-y-2 text-sm font-semibold">Referensi bukti identitas
              <Input required aria-describedby={`owner-identity-help-${index}`} value={owner.identityReference} onChange={(event) => updateOwner(index, { identityReference: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" />
              <span id={`owner-identity-help-${index}`} className="block text-xs font-normal text-muted-foreground">Gunakan referensi bukti terproteksi. Jangan masukkan NIK, nomor KTP, atau data identitas mentah.</span>
            </label>
            <label className="space-y-2 text-sm font-semibold">Dasar kendali
              <select value={owner.controlBasis} onChange={(event) => updateOwner(index, { controlBasis: event.target.value as BeneficialOwnerDraft['controlBasis'] })} className="min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm">
                {BENEFICIAL_OWNER_CONTROL_BASES.map((basis) => <option key={basis} value={basis}>{controlBasisLabels[basis]}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold">Persentase (%)<Input required type="number" min="0" max="100" value={owner.percentage} onChange={(event) => updateOwner(index, { percentage: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
          </div>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={onAdd} className="gap-2"><Plus /> Tambah pemilik manfaat</Button>
    </fieldset>
  );
}
