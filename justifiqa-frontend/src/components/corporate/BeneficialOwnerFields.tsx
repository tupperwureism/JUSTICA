import { useCallback, useRef } from 'react';
import { FileUp, Loader2, Minus, Plus, ShieldCheck, Upload, X } from 'lucide-react';
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

type TaskStep = EvidenceUploadStep | 'success' | 'error' | null;

type UploadTaskState = {
  evidenceId: string;
  idempotencyKey: string;
  objectPath: string | null;
  step: TaskStep;
  error: string | null;
  file: File | null;
  fileName: string | null;
  evidenceReference: string | null;
};

function UploadProgress({ activeStep }: { activeStep: TaskStep }) {
  const steps: EvidenceUploadStep[] = ['prepare', 'upload', 'finalize'];
  if (!activeStep || activeStep === 'success' || activeStep === 'error') return null;
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
  const tasksRef = useRef<Map<number, UploadTaskState>>(new Map());

  const getTask = useCallback((index: number): UploadTaskState => {
    let task = tasksRef.current.get(index);
    if (!task) {
      task = {
        evidenceId: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
        objectPath: null,
        step: null,
        error: null,
        file: null,
        fileName: null,
        evidenceReference: null,
      };
      tasksRef.current.set(index, task);
    }
    return task;
  }, []);

  const clearTask = useCallback((index: number) => {
    tasksRef.current.delete(index);
  }, []);

  const updateOwner = (index: number, patch: Partial<BeneficialOwnerDraft>) => {
    onChange(owners.map((owner, ownerIndex) => (ownerIndex === index ? { ...owner, ...patch } : owner)));
  };

  const handleFile = async (index: number, file: File) => {
    const task = getTask(index);
    task.file = file;
    task.fileName = file.name;
    task.step = 'prepare';
    task.error = null;

    try {
      const result = await uploadBeneficialOwnerEvidence(file, (step) => {
        const currentTask = tasksRef.current.get(index);
        if (currentTask) {
          currentTask.step = step;
          if (step === 'finalize') {
            // objectPath will be set after prepare
          }
        }
      });
      task.evidenceReference = result.evidenceReference;
      task.step = 'success';
      updateOwner(index, { evidenceReference: result.evidenceReference });
    } catch (error) {
      const message = error instanceof CorporateEvidenceError
        ? error.message
        : 'Unggah bukti gagal. Coba ulang.';
      task.error = message;
      task.step = 'error';
    }
  };

  const retryUpload = async (index: number) => {
    const task = tasksRef.current.get(index);
    if (!task || !task.file) return;

    const currentStep = task.step;

    const isErrorStep = currentStep === 'error';
    const isPrepareOrError = currentStep === 'prepare' || isErrorStep;
    const isUploadOrErrorWithPath = currentStep === 'upload' || (isErrorStep && task.objectPath);
    const isFinalizeOrErrorWithRef = currentStep === 'finalize' || (isErrorStep && task.evidenceReference);

    if (isPrepareOrError) {
      // Retry from prepare
      task.step = 'prepare';
      task.error = null;
      const file = task.file;
      if (file) {
        await handleFile(index, file);
      }
    } else if (isUploadOrErrorWithPath) {
      // Retry upload only - we have objectPath from successful prepare
      task.step = 'upload';
      task.error = null;
      const file = task.file;
      if (file && task.objectPath) {
        try {
          const { supabase } = await import('@/lib/supabase');
          const { error: upErr } = await supabase.storage
            .from('corporate-intake-evidence')
            .upload(task.objectPath, file, { contentType: file.type, upsert: false });
          if (upErr) {
            const upCode = (upErr as unknown as { code?: string }).code ?? 'STORAGE_FAILED';
            throw new CorporateEvidenceError('upload', upCode, 'Unggah file bukti gagal. Coba ulang.');
          }
          // Proceed to finalize
          task.step = 'finalize';
          const { data: fin, error: finErr } = await supabase.functions.invoke(
            'corporate-evidence/finalize',
            { body: { evidenceId: task.evidenceId, idempotencyKey: task.idempotencyKey } },
          );
          if (finErr || !fin?.evidenceReference) {
            throw new CorporateEvidenceError('finalize', (finErr as { code?: string } | null)?.code ?? 'FINALIZE_FAILED', 'Finalisasi bukti gagal. Coba ulang.');
          }
          task.evidenceReference = fin.evidenceReference as string;
          task.step = 'success';
          updateOwner(index, { evidenceReference: fin.evidenceReference as string });
        } catch (error) {
          const message = error instanceof CorporateEvidenceError
            ? error.message
            : 'Unggah bukti gagal. Coba ulang.';
          task.error = message;
          task.step = 'error';
        }
      }
    } else if (isFinalizeOrErrorWithRef) {
      // Retry finalize only
      task.step = 'finalize';
      task.error = null;
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: fin, error: finErr } = await supabase.functions.invoke(
          'corporate-evidence/finalize',
          { body: { evidenceId: task.evidenceId, idempotencyKey: task.idempotencyKey } },
        );
        if (finErr || !fin?.evidenceReference) {
          throw new CorporateEvidenceError('finalize', (finErr as { code?: string } | null)?.code ?? 'FINALIZE_FAILED', 'Finalisasi bukti gagal. Coba ulang.');
        }
        task.evidenceReference = fin.evidenceReference as string;
        task.step = 'success';
        updateOwner(index, { evidenceReference: fin.evidenceReference as string });
      } catch (error) {
        const message = error instanceof CorporateEvidenceError
          ? error.message
          : 'Finalisasi bukti gagal. Coba ulang.';
        task.error = message;
        task.step = 'error';
      }
    }
  };

  const handleFileChange = (index: number, file: File) => {
    // New file selected - replace task entirely with new IDs
    clearTask(index);
    void handleFile(index, file);
  };

  return (
    <fieldset className="space-y-4 md:col-span-2">
      <legend className="text-sm font-semibold">Pemilik manfaat</legend>
      <p className="text-sm text-muted-foreground">Pemilik manfaat harus orang perseorangan dan dicatat terpisah dari pihak korporasi.</p>
      {owners.map((owner, index) => {
        const task = tasksRef.current.get(index);
        const step = task?.step ?? null;
        const isUploading = step === 'prepare' || step === 'upload' || step === 'finalize';
        const hasEvidence = Boolean(owner.evidenceReference);
        const taskError = task?.error ?? null;
        return (
          <Card key={`owner-${index}`} role="group" aria-labelledby={`owner-title-${index}`} className="gap-4 rounded-2xl border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p id={`owner-title-${index}`} className="font-semibold">Pemilik manfaat {index + 1}</p>
              <Button type="button" variant="outline" size="sm" disabled={owners.length <= 1 || isUploading} onClick={() => { clearTask(index); onRemove(index); }} aria-label={`Hapus pemilik manfaat ${index + 1}`}>
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
                      if (file) void handleFileChange(index, file);
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
                  {taskError && !isUploading && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void retryUpload(index)}
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <X className="size-3" /> Coba lagi
                    </Button>
                  )}
                </span>
              </div>
              {isUploading && <UploadProgress activeStep={step} />}
              {hasEvidence && (
                <p className="break-all text-xs text-muted-foreground">
                  Referensi bukti: <code className="font-mono">{owner.evidenceReference}</code>
                </p>
              )}
              {taskError && !isUploading && (
                <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive">{taskError}</p>
              )}
            </div>
          </Card>
        );
      })}
      <Button type="button" variant="outline" onClick={onAdd} className="gap-2"><Plus /> Tambah pemilik manfaat</Button>
    </fieldset>
  );
}
