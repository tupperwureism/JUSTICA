import { useState } from 'react';
import { MapPin, QrCode, ScanLine, UserRoundCheck, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface OfflineConsultationQRModalProps {
  onClose: () => void;
}

export function OfflineConsultationQRModal({ onClose }: OfflineConsultationQRModalProps) {
  const [verified, setVerified] = useState(false);

  return (
    <div className="client-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="offline-qr-title">
      <div className="client-modal-shell offline-modal-shell">
        <header className="client-modal-header">
          <div className="flex items-center gap-3"><QrCode className="size-5 text-blue-500" /><h2 id="offline-qr-title" className="font-heading text-lg font-extrabold">Verifikasi Kehadiran Konsultasi Tatap Muka</h2></div>
          <button type="button" onClick={onClose} className="client-modal-close" aria-label="Tutup"><X /></button>
        </header>
        <div className="offline-modal-body">
          <p className="mb-6 text-center text-sm text-muted-foreground">Tunjukkan kode ini kepada staf atau Advokat saat tiba di lokasi konsultasi.</p>
          <div className="offline-grid">
            <div className="offline-qr-card">
              <div className="offline-qr-mark" aria-hidden="true">▣</div>
              <p className="font-mono font-extrabold">[ KODE QR CHECK-IN ]</p>
              <p className="mt-2 text-xs text-slate-600">Diperbarui otomatis setiap 30 detik • Token: 0x8A92...</p>
            </div>
            <div className="flex flex-col gap-5">
              <div className="offline-detail-card consultation-info-list">
                <div className="consultation-info-row"><span>Advokat Mitra</span><strong>Dr. Mahendra Kusuma, S.H., M.H.</strong></div>
                <div className="consultation-info-row"><span className="inline-flex items-center gap-1"><MapPin className="size-3" />Lokasi Pertemuan</span><strong>Gedung Equity Tower Lt. 24, SCBD Jakarta</strong></div>
                <div className="consultation-info-row"><span>Jadwal Konsultasi</span><strong>Hari Ini — Pukul 14:00 WIB</strong></div>
                <div className="consultation-info-row"><span>Status Kehadiran</span><Badge variant="outline" className={`offline-status-badge ${verified ? 'verified' : ''}`}>{verified ? 'KEHADIRAN TERVERIFIKASI' : 'MENUNGGU PEMINDAIAN'}</Badge></div>
              </div>
              <Button type="button" onClick={() => setVerified(true)} className="consultation-action consultation-success-action">
                {verified ? <UserRoundCheck /> : <ScanLine />}
                {verified ? 'HANDSHAKE OK — TERCATAT DI WORM' : 'PINDAI KODE QR DARI ADVOKAT UNTUK SELESAI (Handshake OK)'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
