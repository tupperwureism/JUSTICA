import type { ActiveConsultation, HistoryDocument } from '@/types/client';

export const DEFAULT_CLIENT_SESSION_ID = 'ses-001';

export const ACTIVE_CONSULTATIONS: ActiveConsultation[] = [
  {
    id: DEFAULT_CLIENT_SESSION_ID,
    advocateName: 'Dr. Mahendra Kusuma, S.H., M.H.',
    specialty: 'Hukum Bisnis & Sengketa Komersial',
    status: 'Sesi Berjalan (44:12 - E2EE Aktif)',
    statusVariant: 'live',
    actionLabel: 'Buka Ruang',
  },
  {
    id: 'ses-002',
    advocateName: 'Anita Wulandari, S.H., M.H.',
    specialty: 'Hukum Ketenagakerjaan & PHK',
    status: 'Penyusunan Legal Opinion',
    statusVariant: 'processing',
    actionLabel: 'Lihat Dokumen',
  },
];

export const HISTORY_DOCUMENTS: HistoryDocument[] = [
  {
    id: 'doc-441',
    date: '02/07/2026',
    advocateName: 'Dr. Mahendra Kusuma, S.H.',
    serviceName: 'Legal Opinion Kontrak NDA (#DLV-441 · SHA-256 Verified)',
    downloadLabel: 'Unduh Dokumen PDF',
  },
  {
    id: 'trx-9882',
    date: '18/06/2026',
    advocateName: 'Budi Hartono, S.H., M.H.',
    serviceName: 'Konsultasi Tatap Muka (#TRX-9882 · Escrow Released)',
    downloadLabel: 'Unduh Bukti Transaksi',
  },
];
