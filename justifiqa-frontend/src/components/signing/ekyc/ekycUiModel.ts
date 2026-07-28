import type { EkycWorkspace } from '@/services/phase2IntegrationService';

export type EkycScreen =
  | 'otp'
  | 'liveness'
  | 'verified'
  | 'hold'
  | 'halted'
  | 'refundPending'
  | 'refunded';

export type EkycOutcome = 'passed' | 'failed' | 'hold' | 'refunded';

export const E_KYC_STEPS = ['OTP aman', 'Liveness provider', 'Hasil callback'] as const;

type EkycVerificationStatus = NonNullable<EkycWorkspace['currentVerification']>['status'];

export const resolveEkycScreen = (
  globalStatus: EkycWorkspace['globalStatus'] | undefined,
  envelopeStatus: EkycWorkspace['status'] | undefined,
  verificationStatus: EkycVerificationStatus | undefined,
): EkycScreen => {
  if (globalStatus === 'REFUNDED') return 'refunded';
  if (globalStatus === 'REFUND_PENDING') return 'refundPending';
  if (globalStatus === 'HALTED' || envelopeStatus === 'VOIDED' || envelopeStatus === 'EXPIRED') return 'halted';
  if (globalStatus === 'COMPLETED' || envelopeStatus === 'COMPLETED') return 'verified';
  if (verificationStatus === 'PASSED') return 'verified';
  if (verificationStatus === 'REQUIRES_MANUAL_REVIEW' || verificationStatus === 'REJECTED') return 'hold';
  if (verificationStatus === 'PENDING') return 'liveness';
  return 'otp';
};

export const scopeEkycWorkspaceToDocument = (
  workspace: EkycWorkspace | null,
  documentTitle: string,
) => workspace?.documentTitle === documentTitle ? workspace : null;

export const outcomeCopy: Record<Exclude<EkycScreen, 'otp' | 'liveness'>, { title: string; detail: string }> = {
  verified: {
    title: 'Identitas terverifikasi',
    detail: 'Callback provider telah diterima. Escrow tetap HELD IN ESCROW hingga milestone berikutnya terpenuhi.',
  },
  hold: {
    title: 'Verifikasi perlu review',
    detail: 'Sesi ditahan untuk review yang berwenang. Tidak ada media biometrik mentah di Justifiqa.',
  },
  halted: {
    title: 'Envelope dihentikan secara global',
    detail: 'Semua tindakan pihak telah diblokir. Status refund belum dikonfirmasi dan hanya dapat berubah melalui proses server idempoten.',
  },
  refundPending: {
    title: 'Refund sedang diproses',
    detail: 'Global Halt aktif dan refund escrow sedang diproses secara idempoten oleh boundary server.',
  },
  refunded: {
    title: 'Global Halt / Escrow dikembalikan',
    detail: 'Envelope dihentikan dan refund 100% diproses secara idempoten ke metode pembayaran asal.',
  },
};
