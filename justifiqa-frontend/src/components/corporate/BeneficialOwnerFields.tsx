import { useState } from 'react';
import { FileUp, Loader2, Minus, Plus, ShieldCheck, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  BENEFICIAL_OWNER_CONTROL_BASES,
  type BeneficialOwnerDraft,
} from '@/models/corporateIntake';
import {
  CorporateEvidenceError,
  uploadBeneficialOwnerEvidence,
  type EvidenceUploadStep,
} from '@/services/corporateEvidenceService';

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

const stepLabels: Record<EvidenceUploadStep, string> = {
  prepare: 'Persiapan',
  upload: 'Mengunggah',
  finalize: 'Menfinalisasi',
};

function UploadProgress({ activeStep }: { activeStep: EvidenceUploadStep | null }) {
  const steps: EvidenceUploadStep[] = ['prepare', 'upload', 'finalize'];
  if (!activeStep) return null;
  return (
    <ol className="flex flex-wrap gap-2 text-xs text-muted-foreground">
      {steps.map((step) => (
        <li
          key={step}
          className={`rounded-full border px-2.5 py-1 ${
            activeStep === step ? 'border-primary bg-primary/10 text-primary' : 'border-border'
          }`}
        >
          {stepLabels[step]}
        </li>
      ))}
    </ol>
  );
}

export function BeneficialOwnerFields({ owners, onChange, onAdd, onRemove }: Props) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [uploadStep, setUploadStep] = useState<EvidenceUploadStep | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const updateOwner = (index: number, patch: Partial<BeneficialOwnerDraft>) => {
    onChange(owners.map((owner, ownerIndex) => (ownerIndex === index ? { ...owner, ...patch } : owner)));
  };

  const handleFile = async (index: number, file: File) => {
    setUploadingIndex(index);
    setUploadStep(null);
    setUploadError(null);
    try {
      const result = await uploadBeneficialOwnerEvidence(file, (step) => {
        setUploadStep(step);
      });
      updateOwner(index, { evidenceReference: result.evidenceReference });
    } catch (error) {
      const message = error instanceof CorporateEvidenceError
        ? error.message
        : 'Unggah bukti gagal. Coba ulang.';
      setUploadError(message);
    } finally {
      setUploadingIndex(null);
      setUploadStep(null);
    }
  };

  return (
    <fieldset className="space-y-4 md:col-span-2">
      <legend className="text-sm font-semibold">Pemilik manfaat</legend>
      <p className="text-sm text-muted-foreground">Pemilik manfaat harus orang perseorangan dan dicatat terpisah dari pihak korporasi.</p>
      {uploadError && (
        <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">{uploadError}</p>
      )}
      {owners.map((owner, index) => {
        const isUploading = uploadingIndex === index;
        const hasEvidence = Boolean(owner.evidenceReference);
        return (
          <Card key={`owner-${index}`} role="group" aria-labelledby={`owner-title-${index}`} className="gap-4 rounded-2xl border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p id={`owner-title-${index}`} className="font-semibold">Pemilik manfaat {index + 1}</p>
              <Button type="button" variant="outline" size="sm" disabled={owners.length <= 1 || isUploading} onClick={() => onRemove(index)} aria-label={`Hapus pemilik manfaat ${index + 1}`}>
                <Minus /> Hapus
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold">Nama orang<Input required value={owner.naturalPersonName} onChange={(event) => updateOwner(index, { naturalPersonName: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
              <label className="space-y-2 text-sm font-semibold">Dasar kendali
                <select value={owner.controlBasis} onChange={(event) => updateOwner(index, { controlBasis: event.target.value as BeneficialOwnerDraft['controlBasis'] })} className="min-h-10 w-full rounded-xl border border-border bg-background px-3 text-sm">
                  {BENEFICIAL_OWNER_CONTROL_BASES.map((basis) => <option key={basis} value={basis}>{controlBasisLabels[basis]}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold">Persentase (%)<Input required type="number" min="0" max="100" value={owner.percentage} onChange={(event) => updateOwner(index, { percentage: event.target.value })} className="min-h-10 rounded-xl border-border bg-background" /></label>
            </div>
            <div className="space-y-3 rounded-xl border border-border bg-background p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2 font-semibold">
                  {hasEvidence ? <ShieldCheck className="size-4 text-primary" /> : <FileUp className="size-4 text-muted-foreground" />}
                  {hasEvidence ? 'Bukti identitas terunggah' : 'Unggah bukti identitas (PDF/JPG/PNG, max 10MB)'}
                </span>
                <span className="flex items-center gap-2">
                  <input
                    id={`owner-evidence-${index}`}
                    type="file"
                    accept="application/pdf,image/jpeg,image/png"
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = '';
                      if (file) void handleFile(index, file);
                    }}
                    disabled={isUploading}
                  />
                  <Button
                    type="button"
                    variant={hasEvidence ? 'outline' : 'default'}
                    size="sm"
                    disabled={isUploading}
                    onClick={() => {
                      const inputRef = document.getElementById(`owner-evidence-${index}`) as HTMLInputElement | null;
                      inputRef?.click();
                    }}
                  >
                    {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                    {hasEvidence ? 'Ganti file' : 'Pilih file'}
                  </Button>
                </span>
              </div>
              {isUploading && <UploadProgress activeStep={uploadStep} />}
              {hasEvidence && (
                <p className="break-all text-xs text-muted-foreground">
                  Referensi bukti: <code className="font-mono">{owner.evidenceReference}</code>
                </p>
              )}
            </div>
          </Card>
        );
      })}
      <Button type="button" variant="outline" onClick={() => { setUploadError(null); onAdd(); }} className="gap-2"><Plus /> Tambah pemilik manfaat</Button>
    </fieldset>
  );
}
