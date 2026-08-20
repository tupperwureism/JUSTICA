import { CheckCircle2, FileCheck2, Landmark, ShieldAlert, FolderOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useNotaryWorkspaceIntegration } from '@/hooks/useNotaryWorkspaceIntegration';
import { NotaryCaseWorkspacePanel } from './notary/NotaryCaseWorkspacePanel';

export function AdvocateCorporateCaseManager() {
  const integration = useNotaryWorkspaceIntegration();
  const workspacesList = integration.workspaces.data ?? [];
  const workspace = integration.workspace.data;
  const boVerified = !!workspace?.beneficialOwners.length
    && workspace.beneficialOwners.every((owner) => owner.verificationStatus === 'VERIFIED');
  const assessment = workspace?.cddAssessment;
  const cddApproved = assessment?.decision === 'APPROVED';
  const screeningReady = !!assessment
    && ['NO_MATCH', 'NOT_APPLICABLE'].includes(assessment.pepStatus)
    && ['NO_MATCH', 'NOT_APPLICABLE'].includes(assessment.sanctionsStatus);
  const fieldClass = 'min-h-10 rounded-xl border-border bg-background';

  return (
    <section className="mx-auto w-full max-w-6xl space-y-6" aria-label="J-BIZ professional case manager">
      <Card className="gap-4 rounded-2xl border-border bg-card p-6 shadow-md sm:p-8">
        <CardHeader className="gap-3 p-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="min-h-7 px-3">
              <ShieldAlert className="mr-1 size-3.5" />Workspace Notaris Terbatas
            </Badge>
            <Badge variant="secondary">
              {workspace ? `${workspace.caseCode} · ${workspace.currentStage}` : 'ASSIGNMENT REQUIRED'}
            </Badge>
          </div>
          <CardTitle className="text-2xl font-extrabold">
            {workspace?.entityName ?? 'Belum ada kasus Notaris tertugas'}
          </CardTitle>
          <CardDescription>
            Area kerja Notaris tertugas. Detail CDD/EDD di bawah ini tidak masuk tracker, notifikasi, atau DTO klien.
          </CardDescription>

          {workspacesList.length > 1 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/30 p-3 text-xs">
              <FolderOpen className="size-4 text-primary" />
              <span className="font-bold text-foreground">Daftar Perkara Tertugas ({workspacesList.length}):</span>
              <div className="flex flex-wrap gap-1.5">
                {workspacesList.map((w) => (
                  <Button
                    key={w.caseId}
                    type="button"
                    variant={w.caseId === workspace?.caseId ? 'default' : 'outline'}
                    size="sm"
                    className="h-8 text-xs font-semibold"
                    onClick={() => integration.setSelectedCaseId(w.caseId)}
                  >
                    {w.entityName} ({w.currentStage})
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardHeader>
        {integration.workspaces.isLoading && (
          <p role="status" className="text-sm text-muted-foreground">
            Memuat daftar penugasan Notaris melalui RLS...
          </p>
        )}
        {integration.workspaces.error && (
          <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm">
            <span>{integration.workspaces.error}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => { void integration.workspaces.refresh().catch(() => undefined); }}
            >
              Coba lagi
            </Button>
          </div>
        )}
      </Card>

      {workspace && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="gap-5 rounded-2xl border-border bg-card p-6">
            <CardHeader className="gap-2 p-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileCheck2 className="text-primary" />BO &amp; PMPJ
              </CardTitle>
              <CardDescription>
                Periksa deklarasi orang perseorangan dan digest bukti sebelum keputusan.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              {workspace.beneficialOwners.map((owner) => (
                <Card key={owner.id} className="rounded-xl border-border bg-muted/40 p-4 text-sm">
                  <CardContent className="p-0">
                    <strong>{owner.name}</strong>
                    <p className="text-muted-foreground">
                      {owner.controlBasis} · {owner.percentage ?? 0}% · {owner.verificationStatus}
                    </p>
                  </CardContent>
                </Card>
              ))}
              <Button type="button" variant="secondary" disabled className="min-h-10 rounded-xl">
                <CheckCircle2 />
                {boVerified ? 'BO terverifikasi backend' : 'Menunggu verifikasi server'}
              </Button>
            </CardContent>
          </Card>

          <Card className="gap-5 rounded-2xl border-border bg-card p-6">
            <CardHeader className="gap-2 p-0">
              <CardTitle className="flex items-center gap-2 text-lg">
                <ShieldAlert className="text-primary" />Keputusan CDD
              </CardTitle>
              <CardDescription>Keputusan internal; tidak pernah tampil kepada klien.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">PEP: {assessment?.pepStatus ?? 'BELUM ADA'}</Badge>
                <Badge variant="outline">SANCTION: {assessment?.sanctionsStatus ?? 'BELUM ADA'}</Badge>
                <Badge variant="outline">Rules: {assessment?.rulesVersion ?? 'BELUM ADA'}</Badge>
              </div>
              <Button
                type="button"
                disabled={!boVerified || !screeningReady || cddApproved || integration.cddApproval.isLoading}
                variant={cddApproved ? 'secondary' : 'default'}
                onClick={() => {
                  if (assessment) {
                    void integration.cddApproval.execute({
                      caseId: workspace.caseId,
                      rulesVersion: assessment.rulesVersion,
                    }).catch(() => undefined);
                  }
                }}
                className="min-h-10 rounded-xl"
              >
                <CheckCircle2 />
                {cddApproved
                  ? 'CDD disetujui backend'
                  : integration.cddApproval.isLoading
                  ? 'Menyimpan keputusan atomik...'
                  : 'Setujui tahap CDD'}
              </Button>
              {!assessment && (
                <p role="alert" className="text-sm text-muted-foreground">
                  Assessment CDD hasil screening belum tersedia; approval tidak dapat dibuat dari nilai UI statis.
                </p>
              )}
              {integration.cddApproval.error && (
                <div role="alert" className="flex flex-wrap items-center justify-between gap-2 text-sm text-destructive">
                  <span>{integration.cddApproval.error}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { void integration.cddApproval.retry().catch(() => undefined); }}
                  >
                    Coba lagi
                  </Button>
                </div>
              )}
              {integration.cddApproval.status === 'success' && (
                <p role="status" className="text-sm text-muted-foreground">
                  Keputusan CDD tersimpan melalui policy reviewer tertugas dan perkara beralih ke DOCUMENTS_PENDING.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="gap-5 rounded-2xl border-border bg-card p-6 sm:p-8">
        <CardHeader className="gap-2 p-0">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Landmark className="text-primary" />Referensi AHU &amp; OSS
          </CardTitle>
          <CardDescription>
            Simpan hanya reference ID; credential, token, dan payload mentah dilarang.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-0 md:grid-cols-2">
          <label className="space-y-2 text-sm font-semibold">
            Nomor SABH/SABU
            <Input
              readOnly
              value={workspace?.submissions.find((item) => item.system.startsWith('AHU'))?.reference ?? ''}
              placeholder="Belum ada referensi AHU"
              className={fieldClass}
            />
          </label>
          <label className="space-y-2 text-sm font-semibold">
            Nomor Induk Berusaha
            <Input
              readOnly
              value={workspace?.submissions.find((item) => item.system === 'OSS_RBA')?.reference ?? ''}
              placeholder="Belum ada NIB dari OSS"
              className={fieldClass}
            />
          </label>
        </CardContent>
        <p className="text-sm text-muted-foreground">
          Assignment, stage transition, dan submission pemerintah tetap server-only; panel ini hanya membaca hasil terotorisasi.
        </p>
      </Card>

      <NotaryCaseWorkspacePanel
        workspace={workspace}
        stamping={integration.stamping}
        onRetryWorkspace={() => { void integration.workspaces.refresh().catch(() => undefined); }}
      />
    </section>
  );
}
