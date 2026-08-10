import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useBeneficialOwnerEvidence } from '@/hooks/useBeneficialOwnerEvidence';
import type { CorporateEvidenceAdapter } from '@/hooks/useCorporateEvidenceUploads';
import {
  BENEFICIAL_OWNER_CONTROL_BASES,
  type BeneficialOwnerDraft,
} from '@/models/corporateIntake';
import { corporateEvidenceGateway } from '@/services/corporateEvidenceService';
import { BeneficialOwnerEvidencePanel } from './BeneficialOwnerEvidencePanel';

type Props = {
  owners: BeneficialOwnerDraft[];
  onChange: (update: (owners: BeneficialOwnerDraft[]) => BeneficialOwnerDraft[]) => void;
  onAdd: () => void;
  onRemove: (clientRowId: string) => void;
  evidenceAdapter?: CorporateEvidenceAdapter;
  createEvidenceId?: () => string;
};

const controlBasisLabels: Record<BeneficialOwnerDraft['controlBasis'], string> = {
  OWNERSHIP: 'Kepemilikan',
  VOTING_RIGHTS: 'Hak suara',
  APPOINTMENT_REMOVAL: 'Pengangkatan/pemberhentian',
  EFFECTIVE_CONTROL: 'Kendali efektif',
  BENEFICIAL_ENTITLEMENT: 'Hak manfaat ekonomi',
};

export function BeneficialOwnerFields({
  owners,
  onChange,
  onAdd,
  onRemove,
  evidenceAdapter = corporateEvidenceGateway,
  createEvidenceId,
}: Props) {
  const evidence = useBeneficialOwnerEvidence({
    adapter: evidenceAdapter,
    onChange,
    createId: createEvidenceId,
  });

  return (
    <fieldset className="space-y-4 md:col-span-2">
      <legend className="text-sm font-semibold">Pemilik manfaat</legend>
      <p className="text-sm text-muted-foreground">Pemilik manfaat harus orang perseorangan dan dicatat terpisah dari pihak korporasi.</p>
      {owners.map((owner, index) => {
        const task = evidence.get(owner.clientRowId);
        return (
          <Card key={owner.clientRowId} role="group" aria-labelledby={`owner-title-${owner.clientRowId}`} className="gap-4 rounded-2xl border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p id={`owner-title-${owner.clientRowId}`} className="font-semibold">Pemilik manfaat {index + 1}</p>
              <Button type="button" variant="outline" size="sm" disabled={owners.length <= 1} onClick={() => { evidence.remove(owner.clientRowId); onRemove(owner.clientRowId); }} aria-label={`Hapus pemilik manfaat ${index + 1}`}>
                <Minus /> Hapus
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">Nama orang<Input required value={owner.naturalPersonName} onChange={(event) => evidence.updateOwner(owner.clientRowId, { naturalPersonName: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
              <label className="space-y-2 text-sm font-semibold">Dasar kendali
                <select value={owner.controlBasis} onChange={(event) => evidence.updateOwner(owner.clientRowId, { controlBasis: event.target.value as BeneficialOwnerDraft['controlBasis'] })} className="min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm">
                  {BENEFICIAL_OWNER_CONTROL_BASES.map((basis) => <option key={basis} value={basis}>{controlBasisLabels[basis]}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold">Persentase (%)<Input required type="number" min="0" max="100" value={owner.percentage} onChange={(event) => evidence.updateOwner(owner.clientRowId, { percentage: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
            </div>
            <BeneficialOwnerEvidencePanel
              evidenceReference={owner.evidenceReference}
              task={task}
              onFile={(file) => {
                void evidence.startFile(owner.clientRowId, file).catch(() => undefined);
              }}
              onRetry={() => void evidence.retry(owner.clientRowId).catch(() => undefined)}
            />
          </Card>
        );
      })}
      <Button type="button" variant="outline" onClick={onAdd} className="gap-2"><Plus /> Tambah pemilik manfaat</Button>
    </fieldset>
  );
}
