import { CheckCircle2, FileText, SearchX } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { PublicVerificationResult, VerifyStatus } from '@/hooks/usePublicVerifier';

interface PublicVerifierResultProps { status: Exclude<VerifyStatus, 'idle'>; verifyHash: string; result: PublicVerificationResult | null; onReset: () => void }

export function PublicVerifierResult({ status, verifyHash, result, onReset }: PublicVerifierResultProps) {
  const publicRows = result ? [
    ['ID Verifikasi Publik', result.verification_id],
    ['Jenis Dokumen', result.document_type],
    ['Judul Dokumen', result.document_title],
    ['Waktu Finalisasi', new Date(result.finalized_at).toLocaleString('id-ID')],
    ['Status Penyedia Tanda Tangan', result.signature_provider_status],
    ['Serial e-Meterai', result.emeterai_serial],
    ['Status e-Meterai', result.emeterai_status],
    ['Hash SHA-256 Validasi', verifyHash],
  ] : [];
  return (
    <div id="verify-result-section" className="w-full max-w-4xl animate-fade-in">
      {status === 'verified' && result ? (
        <Card className="overflow-hidden rounded-2xl border-2 border-primary/70 bg-card/95 shadow-2xl">
          <div className="h-1.5 w-full bg-primary" />
          <CardHeader className="border-b border-border px-8 pb-4 pt-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><CheckCircle2 className="h-12 w-12 shrink-0 text-primary" strokeWidth={1.5} /><div className="space-y-1"><div className="flex flex-wrap items-center gap-3"><h3 className="font-heading text-xl font-extrabold text-primary sm:text-2xl">DIGEST DOKUMEN COCOK</h3><Badge variant="outline" className="border-primary bg-primary/10 text-xs font-extrabold uppercase text-primary">SHA-256 Match</Badge></div><p className="text-xs text-muted-foreground sm:text-sm">Berkas cocok dengan anchor integritas yang tersimpan di Justica.</p></div></div></CardHeader>
          <CardContent className="px-8 py-6">{publicRows.map(([label, value]) => <div key={label} className="flex flex-col gap-1 border-b border-border/50 py-3 sm:flex-row sm:justify-between"><span className="w-52 shrink-0 text-xs font-semibold text-muted-foreground sm:text-sm">{label}</span><span className="break-all text-xs font-bold text-foreground sm:text-sm">{value}</span></div>)}<p className="pt-4 text-xs font-semibold text-primary">{result.warning}</p></CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden rounded-2xl border-2 border-destructive/70 bg-card/95 shadow-2xl"><div className="h-1.5 w-full bg-destructive" /><CardContent className="px-8 py-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center"><SearchX className="h-12 w-12 shrink-0 text-destructive" /><div><h3 className="font-heading text-xl font-extrabold text-destructive">ANCHOR DOKUMEN TIDAK DITEMUKAN</h3><p className="text-sm text-muted-foreground">Hash SHA-256 berkas ini tidak ditemukan. Hasil ini tidak dengan sendirinya membuktikan bahwa dokumen palsu.</p></div></div></CardContent></Card>
      )}
      <div className="mt-6 text-center"><Button type="button" variant="outline" onClick={onReset} className="mx-auto"><FileText className="h-4 w-4 shrink-0" />Verifikasi Dokumen Lain</Button></div>
    </div>
  );
}
