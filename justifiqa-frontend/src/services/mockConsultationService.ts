import type {
  ConsultationTier,
  ConsultationSlot,
  EscrowTransaction,
  BookingRequest,
} from '../types/consultation';

export const TIER_CATALOG: ConsultationTier[] = [
  {
    id: 'TIER_1_AI',
    title: 'Tier 1: AI Legal Navigator',
    badgeText: 'Gratis & Instan',
    price: 0,
    priceLabel: 'Rp 0 (Gratis)',
    description:
      'Diagnosa awal kronologi kasus secara otomatis menggunakan mesin AI Justifiqa. Pemetaan pasal dan kesimpulan awal gratis 24/7.',
    features: [
      'Analisis otomatis fakta kasus ke format IRAC awal',
      'Pemetaan pasal undang-undang dasar (KUHPerdata, KUHP, UU ITE)',
      'Akses tak terbatas ke basis data ontologi hukum',
      'Rekomendasi jalur penyelesaian sengketa',
    ],
    recommendedFor: 'Pencari keadilan awal yang ingin memahami posisi hukum sebelum sewa advokat.',
    isEscrowRequired: false,
    highlightColor: 'blue',
  },
  {
    id: 'TIER_2_ADVOCATE',
    title: 'Tier 2: Verified Advocate Consultation',
    badgeText: 'Rekomendasi Utama',
    price: 500000,
    priceLabel: 'Rp 500.000 / Sesi',
    description:
      'Konsultasi privat bersama Advokat berlisensi PERADI terverifikasi. Dilindungi oleh penguncian dana Escrow Mutex hingga sesi selesai.',
    features: [
      'Sesi konsultasi privat 60 menit bersama Advokat spesialis',
      'Verifikasi dan penyempurnaan analisis IRAC oleh profesional',
      'Jaminan keamanan dana Escrow (Dana ditahan, cair setelah sign-off)',
      'Catatan kasus asinkron terenkripsi FIDO2 E2EE',
    ],
    recommendedFor: 'Kasus sengketa kontrak, tanah, ketenagakerjaan yang membutuhkan analisis legal formal.',
    isEscrowRequired: true,
    highlightColor: 'gold',
  },
  {
    id: 'TIER_3_EMERGENCY',
    title: 'Tier 3: Emergency 24/7 Legal Counsel',
    badgeText: 'Darurat & Prioritas',
    price: 1500000,
    priceLabel: 'Rp 1.500.000 / Sesi Darurat',
    description:
      'Jalur prioritas darurat untuk pendampingan mendesak (penahanan, penggeledahan, somasi kritis). Waktu respons advokat < 15 menit.',
    features: [
      'Respons langsung advokat senior dalam < 15 menit',
      'Penyusunan draf somasi darurat atau tanggapan instan',
      'Akses jalur komunikasi hotline prioritas',
      'Penguncian jadwal darurat dengan ACID Row-Lock FOR UPDATE',
    ],
    recommendedFor: 'Situasi darurat hukum mendesak yang membutuhkan intervensi hukum instan.',
    isEscrowRequired: true,
    highlightColor: 'red',
  },
];

export const MOCK_ADVOCATE_SLOTS: ConsultationSlot[] = [
  {
    id: 'SLOT-20260716-01',
    advocateId: 'ADV-PERADI-2026-9912',
    advocateName: 'Dr. Hendra Wijaya, S.H., M.H.',
    advocateTitle: 'Senior Partner - Spesialis Hukum Bisnis & Kontrak',
    advocateRating: 4.9,
    specialty: 'Hukum Kontrak & Sengketa Komersial',
    slotTimeLabel: 'Hari ini &middot; 14:00 - 15:00 WIB',
    isBooked: false,
  },
  {
    id: 'SLOT-20260716-02',
    advocateId: 'ADV-PERADI-2026-8841',
    advocateName: 'Siti Aminah, S.H., LL.M.',
    advocateTitle: 'Advokat Spesialis Hukum Pertanahan & Properti',
    advocateRating: 4.8,
    specialty: 'Sengketa Tanah & Hak Tanggungan',
    slotTimeLabel: 'Hari ini &middot; 15:30 - 16:30 WIB',
    isBooked: false,
  },
  {
    id: 'SLOT-20260716-03',
    advocateId: 'ADV-PERADI-2026-7719',
    advocateName: 'Bambang Soemantri, S.H.',
    advocateTitle: 'Advokat Spesialis Hukum Pidana & Ketenagakerjaan',
    advocateRating: 4.95,
    specialty: 'Hukum Ketenagakerjaan & PHK',
    slotTimeLabel: 'Hari ini &middot; 16:30 - 17:30 WIB',
    isBooked: false,
  },
];

export class MockConsultationService {
  static getTiers(): ConsultationTier[] {
    return TIER_CATALOG;
  }

  static getAvailableSlots(): ConsultationSlot[] {
    return MOCK_ADVOCATE_SLOTS.filter((s) => !s.isBooked);
  }

  static async processDummyEscrowCheckout(request: BookingRequest): Promise<EscrowTransaction> {
    // Simulate network processing delay for interactive UI/UX realism
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const selectedTier = TIER_CATALOG.find((t) => t.id === request.tierId) || TIER_CATALOG[1];
    const selectedSlot = MOCK_ADVOCATE_SLOTS.find((s) => s.id === request.slotId) || MOCK_ADVOCATE_SLOTS[0];

    const transactionId = `ESCROW-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
    const mutexLockId = `ACID-MUTEX-ROW-LOCK-FOR-UPDATE-${Date.now()}`;
    const wormAuditHash = `WORM-SHA256-${Math.random().toString(36).substring(2, 15).toUpperCase()}`;

    const transaction: EscrowTransaction = {
      id: transactionId,
      slotId: selectedSlot.id,
      tierId: request.tierId,
      clientEmail: request.clientEmail,
      advocateName: selectedSlot.advocateName,
      amount: selectedTier.price,
      status: 'HELD', // Escrow status locked/held until consultation sign-off
      createdAt: new Date().toISOString(),
      mutexLockId,
      wormAuditHash,
    };

    return transaction;
  }
}
