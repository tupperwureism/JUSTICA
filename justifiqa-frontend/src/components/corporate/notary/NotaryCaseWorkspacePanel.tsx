import { useState } from 'react';
import { Building2, CheckCircle2, FileKey2, Landmark, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KemenkumhamStampingModal, type NotaryStampingRequest } from './KemenkumhamStampingModal';

const SUBMISSIONS = [
  ['AHU_SABH', 'APPROVED', 'AHU-0012345.AH.01.01'],
  ['AHU_BO', 'SUBMITTED', 'BO-2026-00881'],
  ['OSS_RBA', 'DRAFT', 'Menunggu SK Kemenkumham'],
] as const;

type Props = { hasNotaryAssignment?: boolean };

export function NotaryCaseWorkspacePanel({ hasNotaryAssignment = true }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingAnchor, setPendingAnchor] = useState<NotaryStampingRequest | null>(null);
  const submitStamping = (request: NotaryStampingRequest) => {
    setPendingAnchor(request);
    setModalOpen(false);
  };

  if (!hasNotaryAssignment) return (
    <Card className="corporate-card-shell" role="alert">
      <CardHeader className="gap-3 p-0"><Badge variant="destructive" className="w-fit">Akses dibatasi</Badge><CardTitle>Workspace Notaris tidak tersedia</CardTitle></CardHeader>
      <CardContent className="p-0 text-sm text-muted-foreground">Hanya Notaris yang ditugaskan pada kasus ini dapat melihat dokumen intake dan menjalankan tindakan workspace.</CardContent>
    </Card>
  );

  return (
    <section className="space-y-6" aria-label="Workspace notaris tertugas">
      <p className="corporate-notary-boundary">Boundary akses: UI ini hanya memproyeksikan kasus Notaris tertugas. Otorisasi dan data scope tetap harus ditegakkan oleh RLS/server.</p>
      <Card className="gap-5 rounded-2xl border-border bg-card p-6 shadow-md sm:p-8">
        <CardHeader className="gap-3 p-0"><div className="flex flex-wrap items-center justify-between gap-3"><Badge variant="outline" className="rounded-full border-primary/40 bg-primary/10 px-3.5 py-1 text-primary"><ShieldCheck />Assigned Notary Only</Badge><Badge variant="secondary">NOTARY_REVIEW</Badge></div><CardTitle className="font-heading text-2xl font-extrabold">PT Contoh Usaha Indonesia</CardTitle><p className="text-sm text-muted-foreground">Kasus JBIZ-202607-001 · PT_ORDINARY · Jakarta Selatan · KBLI 62019</p></CardHeader>
        <CardContent className="grid gap-4 p-0 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-secondary/30 p-4"><Building2 className="mb-3 size-5 text-primary" /><strong className="text-sm">Modal & Saham</strong><p className="mt-1 text-xs text-muted-foreground">Modal dasar Rp1 M · disetor Rp250 Jt</p></div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4"><ShieldCheck className="mb-3 size-5 text-primary" /><strong className="text-sm">Beneficial Owner</strong><p className="mt-1 text-xs text-muted-foreground">Siti Rahma · OWNERSHIP 60% · VERIFIED</p></div>
          <div className="rounded-xl border border-border bg-secondary/30 p-4"><FileKey2 className="mb-3 size-5 text-primary" /><strong className="text-sm">Anchor Dokumen</strong><p className="mt-1 text-xs text-muted-foreground">{pendingAnchor ? `${pendingAnchor.file.name} menunggu proses server` : 'Belum ada request pengesahan'}</p></div>
        </CardContent>
        <Button type="button" size="lg" onClick={() => setModalOpen(true)} className="min-h-12 w-full rounded-xl"><FileKey2 />Unggah Akta / SK / NIB</Button>
      </Card>
      <Card className="gap-4 rounded-2xl border-border bg-card p-6">
        <CardHeader className="p-0"><CardTitle className="flex items-center gap-2 text-lg"><Landmark className="text-primary" />Status Pengajuan AHU &amp; OSS</CardTitle></CardHeader>
        <CardContent className="grid gap-3 p-0 md:grid-cols-3">{SUBMISSIONS.map(([system, status, reference]) => <div key={system} className="rounded-xl border border-border bg-secondary/30 p-4"><div className="flex items-center justify-between gap-2"><strong className="text-sm">{system}</strong>{status === 'APPROVED' && <CheckCircle2 className="size-4 text-primary" />}</div><Badge variant="outline" className="my-2">{status}</Badge><p className="text-xs text-muted-foreground">{reference}</p></div>)}</CardContent>
      </Card>
      <KemenkumhamStampingModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={submitStamping} />
    </section>
  );
}
