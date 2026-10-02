import { FileUp, Pause, QrCode, ShieldCheck, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

interface ConsultationInfoPanelProps {
  onPause: () => void;
  onOpenVault: () => void;
  onOpenQr: () => void;
}

export function ConsultationInfoPanel({ onPause, onOpenVault, onOpenQr }: ConsultationInfoPanelProps) {
  return (
    <Card className="consultation-card-shell">
      <CardHeader className="consultation-card-header">
        <CardTitle className="consultation-card-title">Informasi Konsultasi</CardTitle>
        <ShieldCheck className="size-5 text-emerald-500" />
      </CardHeader>
      <CardContent className="consultation-card-content consultation-info-list">
        <div className="consultation-info-row"><span>Status Konsultasi</span><strong className="text-emerald-500">● Sesi Berjalan</strong></div>
        <div className="consultation-info-row"><span>Perlindungan Dana</span><strong>Rekening Bersama Aman</strong></div>
        <div className="consultation-info-row"><span>ID Transaksi Escrow</span><strong className="font-mono">#TRX-9901</strong></div>
        <div className="consultation-info-actions">
          <Button type="button" onClick={onPause} className="consultation-action consultation-pause-action"><Pause />MINTA JEDA WAKTU</Button>
          <Button type="button" variant="outline" onClick={() => window.alert('Unggah dokumen tambahan akan dienkripsi AES-256-GCM sebelum diteruskan kepada Advokat.')} className="consultation-action consultation-secondary-action"><FileUp />UNGGAH DOKUMEN TAMBAHAN</Button>
          <Button type="button" variant="outline" onClick={onOpenVault} className="consultation-action consultation-secondary-action"><FileText />Buka Ruang Dokumen (Deliverables)</Button>
          <Button type="button" variant="outline" onClick={onOpenQr} className="consultation-action consultation-secondary-action"><QrCode />Check-In QR Tatap Muka</Button>
        </div>
      </CardContent>
      <CardFooter className="consultation-card-footer consultation-privacy-note">
        Privasi Mutlak: server Justica hanya bertindak sebagai relay paket terenkripsi dan tidak dapat membaca isi pesan Anda.
      </CardFooter>
    </Card>
  );
}
