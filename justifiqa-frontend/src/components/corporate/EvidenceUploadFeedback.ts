import { createElement, Fragment, type ReactNode } from 'react';
import type { CorporateEvidenceTaskView } from '@/hooks/useCorporateEvidenceUploads';
import type { EvidenceUploadStep } from '@/services/corporateEvidenceService';

const stepLabels: Record<EvidenceUploadStep, string> = {
  prepare: 'Persiapan',
  upload: 'Mengunggah',
  finalize: 'Menfinalisasi',
};

export function EvidenceUploadFeedback({
  task,
  retryControl,
}: {
  task?: CorporateEvidenceTaskView;
  retryControl?: ReactNode;
}) {
  const progress = task?.activeStep
    ? createElement(
      'ol',
      { role: 'status', 'aria-live': 'polite', className: 'flex flex-wrap gap-2 text-xs text-muted-foreground' },
      (['prepare', 'upload', 'finalize'] as const).map((step) => createElement(
        'li',
        {
          key: step,
          'aria-current': task.activeStep === step ? 'step' : undefined,
          className: `rounded-full border px-2.5 py-1 ${task.activeStep === step ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`,
        },
        stepLabels[step],
      )),
    )
    : null;
  const error = task?.error
    ? createElement('p', {
      role: 'alert',
      className: 'rounded-xl border border-destructive/40 bg-destructive/10 p-2 text-xs text-destructive',
    }, task.error)
    : null;

  return createElement(Fragment, null, progress, task?.canRetry && task.error ? retryControl : null, error);
}
