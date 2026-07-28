import { useState } from 'react';
import { Building2, CheckCircle2, FileKey2, Landmark, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { NotaryWorkspace } from '@/services/phase2IntegrationService';
import { KemenkumhamStampingModal, type NotaryStampingRequest } from './KemenkumhamStampingModal';

type StampingMutation = {
  isLoading: boolean;
  error: string | null;
  execute: (input: NotaryStampingRequest & { caseId: string }) => Promise<never>;
  retry: () => Promise<never>;
};

type Props = {
  workspace?: NotaryWorkspace | null;
  stamping?: StampingMutation;
  onRetryWorkspace?: () => void;
  hasNotaryAssignment?: boolean;
};

export function NotaryCaseWorkspacePanel({
  workspace, stamping, onRetryWorkspace, hasNotaryAssignment,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const submitStamping = async (request: NotaryStampingRequest) => {
    if (!workspace || !stamping) return;
    await stamping.execute({ ...request, caseId: workspace.caseId }).catch(() => undefined);
  };

  if (!workspace) return (
    <Card className="corporate-card-shell" role="alert">
      <CardHeader className="gap-3 p-0"><Badge variant="destructive" className="w-fit">Akses dibatasi</Badge><CardTitle>Workspace Notaris tidak tersedia</CardTitle></CardHeader>
      <CardContent className="grid gap-3 p-0 text-sm text-muted-foreground"><p>{hasNotaryAssignment ? 'Showcase lokal tidak memiliki proyeksi Supabase terotorisasi; data dummy dinonaktifkan.' : 'Hanya Notaris yang ditugaskan pada kasus ini dapat melihat dokumen intake dan menjalankan tindakan workspace.'}</p>{onRetryWorkspace && <Button type="button" variant="outline" size="sm" onClick={onRetryWorkspace}>Periksa assignment</Button>}</CardContent>
    </Card>
  );

  return (
    <section className="space-y-6" aria-label="Workspace notaris tertugas">
      <p className="corporate-notary-boundary">Boundary akses: UI ini hanya memproyeksikan kasus Notaris tertugas. Otorisasi dan data scope tetap ditegakkan oleh RLS/server.</p>
      <Card className="gap-5 rounded-2xl border-border bg-card p-6 shadow-md sm:p-8">
        <CardHeader className="gap-3 p-0"><div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline" className="rounded-full border-primary/40 bg-primary/10 px-3.5 py-1 text-primary"><ShieldCheck />Assigned Notary Only</Badge><Badge variant="secondary">{workspace.currentStage}</Badge></div><CardTitle className="font-heading text-2xl font-extrabold">{workspace.entityName}</CardTitle><p className="text-sm text-muted-foreground">Kasus {workspace.caseCode} · {workspace.entityType} · {workspace.domicile} · KBLI {workspace.kbliLabel}</p></CardHeader>
        <CardContent className="grid gap-4 p-0 md:grid-cols-3">
          <Card className="rounded-xl border-border bg-secondary/30 p-4"><CardContent className="p-0"><Building2 className="mb-3 size-5 text-primary" /><strong className="text-sm">Entitas & Domisili</strong><p className="mt-1 text-xs text-muted-foreground">{workspace.entityType} · {workspace.domicile}</p></CardContent></Card>
          <Card className="rounded-xl border-border bg-secondary/30 p-4"><CardContent className="p-0"><ShieldCheck className="mb-3 size-5 text-primary" /><strong className="text-sm">Beneficial Owner</strong><p className="mt-1 text-xs text-muted-foreground">{workspace.beneficialOwners.length} deklarasi terotorisasi</p></CardContent></Card>
          <Card className="rounded-xl border-border bg-secondary/30 p-4"><CardContent className="p-0"><FileKey2 className="mb-3 size-5 text-primary" /><strong className="text-sm">Anchor Dokumen</strong><p className="mt-1 text-xs text-muted-foreground">Pembuatan anchor hanya melalui scanner/hash server.</p></CardContent></Card>
        </CardContent>
        <Button type="button" size="lg" onClick={() => setModalOpen(true)} className="min-h-12 w-full rounded-xl"><FileKey2 />Unggah Akta / SK / NIB</Button>
      </Card>
      <Card className="gap-4 rounded-2xl border-border bg-card p-6">
        <CardHeader className="p-0"><CardTitle className="flex items-center gap-2 text-lg"><Landmark className="text-primary" />Status Pengajuan AHU &amp; OSS</CardTitle></CardHeader>
        <CardContent className="grid gap-3 p-0 md:grid-cols-3">{workspace.submissions.length ? workspace.submissions.map((submission) => <Card key={submission.id} className="rounded-xl border-border bg-secondary/30 p-4"><CardContent className="p-0"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{submission.system}</strong>{submission.status === 'APPROVED' && <CheckCircle2 className="size-4 text-primary" />}</div><Badge variant="outline" className="my-2">{submission.status}</Badge><p className="text-xs text-muted-foreground">{submission.reference ?? 'Belum ada referensi eksternal'}</p></CardContent></Card>) : <p className="text-sm text-muted-foreground">Belum ada job submission yang dapat dibaca.</p>}</CardContent>
      </Card>
      <KemenkumhamStampingModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={submitStamping} submitting={stamping?.isLoading} error={stamping?.error} onRetry={() => { void stamping?.retry().catch(() => undefined); }} />
    </section>
  );
}
