import { FileUp, Loader2, ShieldCheck, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import type { CorporateEvidenceTaskView } from '@/hooks/useCorporateEvidenceUploads';
import { EvidenceUploadFeedback } from './EvidenceUploadFeedback';

type Props = {
  evidenceReference?: string;
  task?: CorporateEvidenceTaskView;
  onFile: (file: File) => void;
  onRetry: () => void;
};

export function BeneficialOwnerEvidencePanel({
  evidenceReference,
  task,
  onFile,
  onRetry,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasEvidence = Boolean(evidenceReference);
  return (
    <div className="space-y-3 rounded-xl border border-border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="flex items-center gap-2 font-semibold">
          {hasEvidence ? <ShieldCheck className="size-4 text-primary" /> : <FileUp className="size-4 text-muted-foreground" />}
          {hasEvidence ? 'Bukti identitas terunggah' : 'Unggah bukti identitas (PDF/JPG/PNG, max 10MB)'}
        </span>
        <span className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="application/pdf,image/jpeg,image/png" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (event.target) event.target.value = ''; if (file) onFile(file); }} />
          <Button type="button" variant={hasEvidence ? 'outline' : 'default'} size="sm" onClick={() => fileInputRef.current?.click()}>
            {task?.isRunning ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
            {hasEvidence ? 'Ganti file' : 'Pilih file'}
          </Button>
        </span>
      </div>
      <EvidenceUploadFeedback
        task={task}
        retryControl={(
          <Button type="button" variant="outline" size="sm" onClick={onRetry} className="border-destructive text-destructive hover:bg-destructive/10">
            <X className="size-3" /> Coba lagi
          </Button>
        )}
      />
      {task?.file && <p className="text-xs text-muted-foreground">File: {task.file.name}</p>}
      {hasEvidence && <p className="break-all text-xs text-muted-foreground">Referensi bukti: <code className="font-mono">{evidenceReference}</code></p>}
    </div>
  );
}
