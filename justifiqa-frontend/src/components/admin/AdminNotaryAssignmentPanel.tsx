import { useCallback, useEffect, useId, useState } from 'react';
import { Building2, CheckCircle2, RefreshCw, Scale, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  phase2IntegrationService,
  type AssignmentContext,
  type EligibleCaseProjection,
  type VerifiedNotaryProjection,
} from '@/services/phase2SupabaseGateway';

export function AdminNotaryAssignmentPanel() {
  const [context, setContext] = useState<AssignmentContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedNotaryId, setSelectedNotaryId] = useState<string>('');
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const caseSelectId = useId();
  const notarySelectId = useId();

  const loadContext = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await phase2IntegrationService.listAssignmentContext();
      setContext(data);
      if (data.cases.length > 0 && !selectedCaseId) {
        setSelectedCaseId(data.cases[0].caseId);
      }
      if (data.notaries.length > 0 && !selectedNotaryId) {
        setSelectedNotaryId(data.notaries[0].notaryId);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memuat daftar perkara dan notaris.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedCaseId, selectedNotaryId]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  const handleAssign = async () => {
    if (!selectedCaseId || !selectedNotaryId) {
      setSubmitError('Pilih perkara dan notaris terlebih dahulu.');
      return;
    }

    const currentKey = idempotencyKey || crypto.randomUUID();
    setIdempotencyKey(currentKey);
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const result = await phase2IntegrationService.assignNotary({
        caseId: selectedCaseId,
        notaryId: selectedNotaryId,
        idempotencyKey: currentKey,
      });

      setSuccessMessage(
        result.replayed
          ? 'Penugasan terkonfirmasi (Replay Idempoten: Tidak ada mutasi ganda).'
          : 'Notaris berhasil ditugaskan ke perkara korporasi secara atomik.',
      );
      setIdempotencyKey('');
      await loadContext();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal menugaskan notaris.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCase = context?.cases.find((c: EligibleCaseProjection) => c.caseId === selectedCaseId);
  const selectedNotary = context?.notaries.find((n: VerifiedNotaryProjection) => n.notaryId === selectedNotaryId);

  return (
    <Card className="space-y-6 rounded-3xl border-border bg-card/90 p-6 shadow-xl sm:p-8" aria-busy={isLoading}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-500">
            MOCK-J-ADM-03 • Notary Assignment Control
          </p>
          <h1 className="mt-2 text-2xl font-black text-foreground">
            PENUGASAN NOTARIS KORPORASI &amp; KELAYAKAN ESCROW
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tugaskan notaris berlisensi aktif ke perkara korporasi yang dananya telah terkunci di escrow.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => { void loadContext(); }}
          disabled={isLoading}
          className="gap-2 font-bold"
        >
          <RefreshCw className={isLoading ? 'animate-spin size-4' : 'size-4'} />
          Segarkan Data
        </Button>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="size-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div role="status" className="flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Kolom 1: Pemilihan Perkara */}
        <Card className="space-y-4 rounded-2xl border-border bg-secondary/20 p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <Building2 className="size-5 text-primary" />
              1. Pilih Perkara Korporasi Layak
            </CardTitle>
            <CardDescription>
              Menampilkan perkara berstatus <Badge variant="outline" className="font-mono">ESCROW_LOCKED</Badge> dengan dana tertahan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <label htmlFor={caseSelectId} className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Daftar Perkara Siap Penugasan
            </label>
            <select
              id={caseSelectId}
              value={selectedCaseId}
              onChange={(e) => setSelectedCaseId(e.target.value)}
              disabled={isLoading || isSubmitting || !context?.cases.length}
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {!context?.cases.length && (
                <option value="">Tidak ada perkara berstatus ESCROW_LOCKED</option>
              )}
              {context?.cases.map((c: EligibleCaseProjection) => (
                <option key={c.caseId} value={c.caseId}>
                  {c.proposedName} ({c.entityType}) — {c.domicileCity}
                </option>
              ))}
            </select>

            {selectedCase && (
              <div className="rounded-xl border border-border/80 bg-card p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Perkara:</span>
                  <span className="font-mono font-semibold">{selectedCase.caseId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bentuk Entitas:</span>
                  <span className="font-semibold">{selectedCase.entityType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Domisili:</span>
                  <span>{selectedCase.domicileCity}, {selectedCase.domicileProvince}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Escrow:</span>
                  <Badge variant="outline" className="border-emerald-500 text-emerald-500 font-bold">
                    {selectedCase.escrowStatus}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kolom 2: Pemilihan Notaris */}
        <Card className="space-y-4 rounded-2xl border-border bg-secondary/20 p-6">
          <CardHeader className="p-0">
            <CardTitle className="flex items-center gap-2 text-base font-bold">
              <UserCheck className="size-5 text-primary" />
              2. Pilih Notaris Terverifikasi Aktif
            </CardTitle>
            <CardDescription>
              Menampilkan notaris dengan status kualifikasi <Badge variant="outline" className="font-mono">VERIFIED_ACTIVE</Badge>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 p-0">
            <label htmlFor={notarySelectId} className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Daftar Notaris Mitra Terverifikasi
            </label>
            <select
              id={notarySelectId}
              value={selectedNotaryId}
              onChange={(e) => setSelectedNotaryId(e.target.value)}
              disabled={isLoading || isSubmitting || !context?.notaries.length}
              className="min-h-11 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {!context?.notaries.length && (
                <option value="">Tidak ada notaris terverifikasi aktif</option>
              )}
              {context?.notaries.map((n: VerifiedNotaryProjection) => (
                <option key={n.notaryId} value={n.notaryId}>
                  {n.fullName} ({n.licenseNumber}) — {n.jurisdictionCity}
                </option>
              ))}
            </select>

            {selectedNotary && (
              <div className="rounded-xl border border-border/80 bg-card p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Notaris:</span>
                  <span className="font-mono font-semibold">{selectedNotary.notaryId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nomor SK / Lisensi:</span>
                  <span className="font-semibold">{selectedNotary.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wilayah Kerja:</span>
                  <span>{selectedNotary.jurisdictionCity}, {selectedNotary.jurisdictionProvince}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Kualifikasi:</span>
                  <Badge variant="outline" className="border-blue-500 text-blue-500 font-bold">
                    <ShieldCheck className="mr-1 size-3" />
                    {selectedNotary.status}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {submitError && (
        <div role="alert" className="flex items-center justify-between rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          <span>{submitError}</span>
          <Button type="button" variant="outline" size="sm" onClick={() => { void handleAssign(); }}>
            Coba Ulang
          </Button>
        </div>
      )}

      <Button
        type="button"
        size="lg"
        onClick={() => { void handleAssign(); }}
        disabled={isLoading || isSubmitting || !selectedCaseId || !selectedNotaryId}
        className="h-12 w-full shrink-0 gap-2 rounded-xl bg-primary font-bold text-primary-foreground shadow-lg hover:bg-primary/90"
      >
        <Scale className="size-5" />
        {isSubmitting ? 'Memproses Penugasan Atomik...' : 'Tugaskan Notaris ke Perkara'}
      </Button>
    </Card>
  );
}
