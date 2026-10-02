import { CheckCircle2, Download, FileCheck2, RefreshCcw, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useVaultDelivery } from '@/hooks/useVaultDelivery';
import { EscrowDisbursementTrackerPanel } from '@/components/payment/EscrowDisbursementTrackerPanel';

interface DeliverableVaultPanelProps {
  sessionId: string;
  onEscrowReleased: () => void;
}

export function DeliverableVaultPanel({ sessionId, onEscrowReleased }: DeliverableVaultPanelProps) {
  const { document, isLoading, isReleasing, released, error, download, release } = useVaultDelivery(sessionId);
  const handleRelease = async () => {
    if (await release()) onEscrowReleased();
  };

  return (
    <Card className="consultation-card-shell deliverable-vault-shell">
      <CardHeader className="deliverable-heading">
        <CardTitle className="font-heading text-2xl font-extrabold">Dokumen Hukum Siap Diunduh</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">Advokat Anda telah menyelesaikan dokumen hukum resmi ber-e-Meterai.</p>
      </CardHeader>
      <CardContent className="consultation-card-content flex flex-col gap-6">
        <div className="deliverable-meta">
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground">Judul Dokumen Resmi</p>
            <h2 className="mt-1 font-heading text-xl font-extrabold">{document?.title ?? (isLoading ? 'Memuat WORM Vault...' : 'Belum ada dokumen final')}</h2>
            {document && <p className="mt-1 font-mono text-xs text-primary">#{document.opinionId.slice(0, 8).toUpperCase()} • SHA-256: {document.sha256Hash}</p>}
          </div>
          {document && <Badge variant="outline" className="deliverable-legal-badge"><ShieldCheck />DIGEST COCOK &amp; e-METERAI TERCATAT</Badge>}
        </div>
        <EscrowDisbursementTrackerPanel
          peruriSerial={document?.peruriSerial ?? 'Menunggu anchor dokumen final'}
          status={released ? 'SUCCESS' : 'NOT_STARTED'}
        />
        <article className="deliverable-preview">
          <header className="mb-5 border-b-2 border-foreground pb-4 text-center">
            <FileCheck2 className="mx-auto mb-2 size-8 text-primary" />
            <h3 className="font-heading font-extrabold">KANTOR HUKUM DR. MAHENDRA KUSUMA &amp; REKAN</h3>
            <p className="text-xs text-muted-foreground">Serial Peruri • {document?.peruriSerial ?? 'Menunggu dokumen final'}</p>
          </header>
          <p>{document ? `Dokumen immutable berstatus ${document.status} dengan sisa garansi revisi ${Math.max(0, 2 - document.revisionCount)}x. Isi lengkap hanya dibuka melalui signed URL privat.` : 'Advokat belum menerbitkan dokumen final ber-e-Meterai untuk sesi ini.'}</p>
        </article>
        {error && <p role="alert" className="text-sm font-semibold text-destructive">{error}</p>}
        <Button type="button" onClick={() => { void download(); }} disabled={!document} className="consultation-action consultation-send-action"><Download />UNDUH DOKUMEN LENGKAP (PDF)</Button>
      </CardContent>
      <CardFooter className="consultation-card-footer deliverable-actions">
        <h3 className="font-heading text-center text-lg font-extrabold">Apakah dokumen ini sudah memenuhi kebutuhan Anda?</h3>
        <p className="text-center text-sm text-muted-foreground">Persetujuan akhir mencairkan dana Rekening Bersama kepada Advokat.</p>
        <Button type="button" onClick={() => { void handleRelease(); }} disabled={!document || released || isReleasing} className="consultation-action consultation-success-action"><CheckCircle2 />{released ? 'ESCROW TELAH DILEPASKAN' : isReleasing ? 'MEMPROSES MUTEX...' : 'SETUJUI & SELESAIKAN PERKARA'}</Button>
        <Button type="button" variant="outline" onClick={() => window.alert('Form catatan revisi akan dikirim terenkripsi. Sisa garansi perbaikan dokumen: 2x.')} className="consultation-action consultation-warning-action"><RefreshCcw />Ajukan Perbaikan Dokumen (Sisa Garansi: 2x)</Button>
      </CardFooter>
    </Card>
  );
}
