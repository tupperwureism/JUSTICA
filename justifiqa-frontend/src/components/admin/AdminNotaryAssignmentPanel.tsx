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
  const [attemptKey, setAttemptKey] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const caseSelectId = useId();
  const notarySelectId = useId();

  const loadContext = useCallback(async (): Promise<AssignmentContext | null> => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await phase2IntegrationService.listAssignmentContext();
      setContext(data);
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat daftar perkara dan notaris.';
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  const handleInitiateAssignment = () => {
    if (!selectedCaseId || !selectedNotaryId) {
      setSubmitError('Silakan pilih perkara dan notaris terlebih dahulu secara eksplisit.');
      return;
    }
    setSubmitError(null);
    setShowConfirmation(true);
  };

  const handleConfirmAssignment = async () => {
    if (!selectedCaseId || !selectedNotaryId) return;

    const currentKey = attemptKey || crypto.randomUUID();
    setAttemptKey(currentKey);
    setIsSubmitting(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      const result = await phase2IntegrationService.assignNotary({
        caseId: selectedCaseId,
        notaryId: selectedNotaryId,
        idempotencyKey: currentKey,
      });

      // Canonical refresh confirmation gate
      const refreshed = await phase2IntegrationService.listAssignmentContext();
      setContext(refreshed);

      const verifiedCase = refreshed.cases.find((c) => c.caseId === selectedCaseId);
      const isConfirmed = verifiedCase
        ? verifiedCase.assignedNotaryId === selectedNotaryId && verifiedCase.currentStage === 'ESCROW_LOCKED'
        : result.assignedNotaryId === selectedNotaryId && result.currentStage === 'ESCROW_LOCKED';

      if (!isConfirmed) {
        throw new Error('Konfirmasi penyegaran gagal: Data penugasan belum terkonfirmasi di database server.');
      }

      setSuccessMessage(
        result.replayed
          ? 'Penugasan terkonfirmasi (Replay Idempoten: Tidak ada mutasi ganda).'
          : 'Notaris berhasil ditugaskan ke perkara korporasi secara atomik.',
      );
      setAttemptKey('');
      setShowConfirmation(false);
      setSelectedCaseId('');
      setSelectedNotaryId('');
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
          variant="outline"
          size="sm"
          onClick={() => void loadContext()}
          disabled={isLoading || isSubmitting}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Segarkan Data
        </Button>
      </div>

      {error && (
        <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div role="status" className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-600">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0" />
            <p className="text-sm font-semibold">{successMessage}</p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Case Selection Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-primary" />
              1. Pilih Perkara Korporasi (Dana Terkunci di Escrow)
            </CardTitle>
            <CardDescription>
              Menampilkan perkara berstatus ESCROW_LOCKED dengan bukti dana tersimpan.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor={caseSelectId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Daftar Perkara Tersedia
              </label>
              <select
                id={caseSelectId}
                aria-label="Pilih Perkara Korporasi"
                value={selectedCaseId}
                onChange={(e) => {
                  setSelectedCaseId(e.target.value);
                  setShowConfirmation(false);
                }}
                disabled={isLoading || isSubmitting}
                className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Pilih Perkara Korporasi --</option>
                {context?.cases.map((c) => (
                  <option key={c.caseId} value={c.caseId} disabled={Boolean(c.assignedNotaryId)}>
                    {c.proposedName} ({c.entityType}) — {c.domicileCity} {c.assignedNotaryId ? '• [SUDAH DITUGASKAN]' : '• [BELUM ADA NOTARIS]'}
                  </option>
                ))}
              </select>
            </div>

            {selectedCase && (
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Perkara:</span>
                  <span className="font-mono font-medium">{selectedCase.caseId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entitas:</span>
                  <span className="font-medium">{selectedCase.entityType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Escrow:</span>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 bg-emerald-500/10">
                    <ShieldCheck className="mr-1 h-3 w-3" />
                    {selectedCase.escrowStatus}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tahap Perkara:</span>
                  <Badge variant="secondary">{selectedCase.currentStage}</Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notary Selection Card */}
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Scale className="h-5 w-5 text-primary" />
              2. Pilih Notaris Terverifikasi Aktif
            </CardTitle>
            <CardDescription>
              Menampilkan rekanan notaris yang kualifikasi dan SK Kemenkumham-nya aktif.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor={notarySelectId} className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Daftar Notaris Rekanan
              </label>
              <select
                id={notarySelectId}
                aria-label="Pilih Notaris Terverifikasi"
                value={selectedNotaryId}
                onChange={(e) => {
                  setSelectedNotaryId(e.target.value);
                  setShowConfirmation(false);
                }}
                disabled={isLoading || isSubmitting}
                className="mt-2 w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">-- Pilih Notaris Terverifikasi --</option>
                {context?.notaries.map((n) => (
                  <option key={n.notaryId} value={n.notaryId}>
                    {n.fullName} ({n.licenseNumber}) — {n.jurisdictionCity}
                  </option>
                ))}
              </select>
            </div>

            {selectedNotary && (
              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID Notaris:</span>
                  <span className="font-mono font-medium">{selectedNotary.notaryId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">No. Lisensi:</span>
                  <span className="font-medium">{selectedNotary.licenseNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yurisdiksi:</span>
                  <span className="font-medium">{selectedNotary.jurisdictionCity}, {selectedNotary.jurisdictionProvince}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status Kualifikasi:</span>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-600 bg-blue-500/10">
                    <UserCheck className="mr-1 h-3 w-3" />
                    {selectedNotary.status}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation and Submit Section */}
      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        {submitError && (
          <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {submitError}
          </div>
        )}

        {showConfirmation ? (
          <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <h4 className="text-sm font-bold text-foreground">Konfirmasi Penugasan Notaris</h4>
            <p className="text-xs text-muted-foreground">
              Apakah Anda yakin ingin menugaskan notaris <strong className="text-foreground">{selectedNotary?.fullName}</strong> ke perkara <strong className="text-foreground">{selectedCase?.proposedName}</strong>?
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => void handleConfirmAssignment()}
                disabled={isSubmitting}
                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Memproses Penugasan Atomik...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Ya, Konfirmasi Penugasan Sekarang
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowConfirmation(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Pastikan kedua pihak (perkara dan notaris) telah dipilih dengan benar sebelum melanjutkan.
            </p>
            <Button
              onClick={handleInitiateAssignment}
              disabled={isLoading || isSubmitting || !selectedCaseId || !selectedNotaryId}
              className="gap-2"
            >
              <UserCheck className="h-4 w-4" />
              Lanjutkan ke Konfirmasi Penugasan
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
