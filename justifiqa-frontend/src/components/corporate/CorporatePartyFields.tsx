import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  CORPORATE_PARTY_ROLES,
  CORPORATE_PARTY_TYPES,
  type CorporatePartyDraft,
} from '@/models/corporateIntake';

type Props = {
  parties: CorporatePartyDraft[];
  onChange: (parties: CorporatePartyDraft[]) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

const roleLabels: Record<CorporatePartyDraft['role'], string> = {
  FOUNDER: 'Pendiri',
  SHAREHOLDER: 'Pemegang saham',
  DIRECTOR: 'Direktur',
  COMMISSIONER: 'Komisaris',
  ACTIVE_PARTNER: 'Sekutu aktif',
  PASSIVE_PARTNER: 'Sekutu pasif',
};

export function CorporatePartyFields({ parties, onChange, onAdd, onRemove }: Props) {
  const updateParty = (index: number, patch: Partial<CorporatePartyDraft>) => {
    onChange(parties.map((party, partyIndex) => (partyIndex === index ? { ...party, ...patch } : party)));
  };

  return (
    <fieldset className="space-y-4 md:col-span-2">
      <legend className="text-sm font-semibold">Pihak korporasi</legend>
      <p className="text-sm text-muted-foreground">Masukkan pendiri, pemegang saham, atau organ yang relevan pada baris terpisah.</p>
      {parties.map((party, index) => (
        <Card key={`party-${index}`} role="group" aria-labelledby={`party-title-${index}`} className="gap-4 rounded-2xl border-border bg-muted/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p id={`party-title-${index}`} className="font-semibold">Pihak {index + 1}</p>
            <Button type="button" variant="outline" size="sm" disabled={parties.length <= 1} onClick={() => onRemove(index)} aria-label={`Hapus pihak korporasi ${index + 1}`}>
              <Minus /> Hapus
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-semibold">Jenis pihak
              <select value={party.partyType} onChange={(event) => updateParty(index, { partyType: event.target.value as CorporatePartyDraft['partyType'] })} className="min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm">
                {CORPORATE_PARTY_TYPES.map((type) => <option key={type} value={type}>{type === 'NATURAL_PERSON' ? 'Orang perseorangan' : 'Badan hukum'}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold">Peran
              <select value={party.role} onChange={(event) => updateParty(index, { role: event.target.value as CorporatePartyDraft['role'] })} className="min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm">
                {CORPORATE_PARTY_ROLES.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}
              </select>
            </label>
            <label className="space-y-2 text-sm font-semibold">Nama tampilan<Input required value={party.displayName} onChange={(event) => updateParty(index, { displayName: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
            <label className="space-y-2 text-sm font-semibold">Referensi bukti identitas
              <Input required aria-describedby={`party-identity-help-${index}`} value={party.identityReference} onChange={(event) => updateParty(index, { identityReference: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" />
              <span id={`party-identity-help-${index}`} className="block text-xs font-normal text-muted-foreground">Gunakan referensi bukti terproteksi. Jangan masukkan NIK, nomor KTP, atau data identitas mentah.</span>
            </label>
            <label className="space-y-2 text-sm font-semibold">Kepemilikan (%)<Input required type="number" min="0" max="100" value={party.ownershipPercentage} onChange={(event) => updateParty(index, { ownershipPercentage: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
            <label className="space-y-2 text-sm font-semibold">Hak suara (%)<Input required type="number" min="0" max="100" value={party.votingPercentage} onChange={(event) => updateParty(index, { votingPercentage: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
            <label className="space-y-2 text-sm font-semibold">Tanggal efektif<Input required type="date" value={party.effectiveDate} onChange={(event) => updateParty(index, { effectiveDate: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
          </div>
        </Card>
      ))}
      <Button type="button" variant="outline" onClick={onAdd} className="gap-2"><Plus /> Tambah pihak</Button>
    </fieldset>
  );
}
