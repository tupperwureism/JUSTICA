import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CorporateIntakeStepFields } from './CorporateIntakeStepFields';
import { EMPTY_INTAKE_DRAFT, INTAKE_STEPS, type CorporateIntakeDraft } from './corporateUiModel';

type Props = {
  onComplete?: (draft: CorporateIntakeDraft) => void | Promise<void>;
  submitting?: boolean;
  error?: string | null;
  success?: boolean;
  onRetry?: () => void;
};

export function CorporateIntakeWizard({
  onComplete, submitting = false, error, success = false, onRetry,
}: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(EMPTY_INTAKE_DRAFT);
  const isLast = step === INTAKE_STEPS.length - 1;

  const validStep = step === 0
    || (step === 1 && !!draft.businessName.trim() && !!draft.domicile.trim() && !!draft.kbli.trim())
    || (step === 2 && !!draft.founderName.trim() && Number(draft.ownership) > 0 && Number(draft.ownership) <= 100)
    || (step === 3 && !!draft.boName.trim() && !!draft.controlBasis.trim())
    || (step === 4 && draft.acceptedScope);
  const continueFlow = () => {
    if (!isLast) return setStep((value) => value + 1);
    void Promise.resolve(onComplete?.(draft)).catch(() => undefined);
  };

  return (
    <Card className="mx-auto w-full max-w-4xl gap-6 rounded-2xl border-border bg-card p-6 shadow-md sm:p-8">
      <CardHeader className="gap-3 p-0">
        <div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline" className="min-h-7 px-3">J-BIZ Corporate Intake</Badge><span className="text-sm font-semibold text-muted-foreground">Langkah {step + 1} dari {INTAKE_STEPS.length}</span></div>
        <CardTitle className="text-2xl font-extrabold">{INTAKE_STEPS[step]}</CardTitle>
        <CardDescription>Data menjadi draft terstruktur untuk pemeriksaan advokat/notaris; pengisian ini bukan pengesahan pemerintah.</CardDescription>
        <div className="grid grid-cols-5 gap-2" aria-label="Kemajuan intake">{INTAKE_STEPS.map((label, index) => <div key={label} className={`h-2 rounded-full ${index <= step ? 'bg-primary' : 'bg-muted'}`} title={label} />)}</div>
      </CardHeader>
      <CardContent className="p-0"><CorporateIntakeStepFields step={step} draft={draft} onChange={(patch) => setDraft((value) => ({ ...value, ...patch }))} /></CardContent>
      <CardFooter className="flex flex-wrap justify-between gap-3 p-0">
        <Button type="button" variant="outline" size="lg" disabled={step === 0 || submitting} onClick={() => setStep((value) => value - 1)} className="min-h-10 rounded-xl"><ArrowLeft />Kembali</Button>
        <Button type="button" size="lg" disabled={!validStep || submitting} onClick={continueFlow} className="min-h-10 rounded-xl">{isLast ? <Check /> : <ArrowRight />}{submitting ? 'Mengirim intake...' : isLast ? 'Kirim Corporate Intake' : 'Lanjutkan'}</Button>
      </CardFooter>
      {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm"><span>{error}</span>{onRetry && <Button type="button" variant="outline" size="sm" onClick={onRetry} disabled={submitting}>Coba lagi</Button>}</div>}
      {success && <p role="status" className="rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm">Corporate Intake tersimpan dan proyeksi kasus telah diperbarui.</p>}
    </Card>
  );
}
