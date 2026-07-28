export type EkycScreen = 'otp' | 'liveness' | 'verified' | 'hold' | 'refunded';

export type EkycOutcome = 'passed' | 'failed' | 'hold' | 'refunded';

export const E_KYC_STEPS = ['OTP aman', 'Liveness provider', 'Hasil callback'] as const;

export const outcomeCopy: Record<Exclude<EkycScreen, 'otp' | 'liveness'>, { title: string; detail: string }> = {
  verified: {
    title: 'Identitas terverifikasi',
    detail: 'Callback provider telah diterima. Escrow tetap HELD IN ESCROW hingga milestone berikutnya terpenuhi.',
  },
  hold: {
    title: 'Verifikasi perlu review',
    detail: 'Sesi ditahan untuk review yang berwenang. Tidak ada media biometrik mentah di Justifiqa.',
  },
  refunded: {
    title: 'Global Halt / Escrow dikembalikan',
    detail: 'Envelope dihentikan dan refund 100% diproses secara idempoten ke metode pembayaran asal.',
  },
};
