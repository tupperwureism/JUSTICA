import { supabase } from '@/lib/supabase';
import type { ConsultationCheckout, LiveConsultationSlot } from '@/types/consultation';
import type { Database } from '@/types/database.types';

type CheckoutRow = Database['public']['Functions']['fn_book_consultation_slot_mutex']['Returns'][number];

const bookingError = (message: string): Error => {
  if (message.includes('SLOT_ALREADY_BOOKED')) return new Error('Slot sudah keduluan dipesan orang lain atau telah kedaluwarsa.');
  if (message.includes('INSUFFICIENT_FUNDS')) return new Error('Saldo dompet Klien tidak mencukupi untuk mengunci dana Escrow.');
  if (message.includes('WALLET_NOT_FOUND')) return new Error('Dompet Klien belum tersedia. Silakan hubungi dukungan Justica.');
  if (message.includes('AUTH_REQUIRED') || message.includes('ROLE_FORBIDDEN')) return new Error('Sesi Klien tidak valid. Silakan masuk kembali.');
  return new Error('Checkout konsultasi gagal diproses oleh database. Silakan coba kembali.');
};

export async function getAvailableConsultationSlots(): Promise<LiveConsultationSlot[]> {
  const { data: slots, error: slotError } = await supabase.from('consultation_slots')
    .select('slot_id,tier_id,start_time').eq('status', 'AVAILABLE')
    .gt('start_time', new Date().toISOString()).order('start_time');
  if (slotError) throw bookingError(slotError.message);
  if (!slots.length) return [];

  const slotIds = slots.map(({ slot_id }) => slot_id);
  const tierIds = [...new Set(slots.map(({ tier_id }) => tier_id))];
  const [profiles, tiers] = await Promise.all([
    supabase.from('frontend_consultation_slots_v').select('*').in('id', slotIds).eq('isBooked', false),
    supabase.from('advocate_service_tiers').select('tier_id,price_idr,price_label').in('tier_id', tierIds).eq('is_active', true),
  ]);
  if (profiles.error) throw bookingError(profiles.error.message);
  if (tiers.error) throw bookingError(tiers.error.message);
  const profileById = new Map(profiles.data.map((profile) => [profile.id, profile]));
  const tierById = new Map(tiers.data.map((tier) => [tier.tier_id, tier]));

  return slots.flatMap((slot) => {
    const profile = profileById.get(slot.slot_id);
    const tier = tierById.get(slot.tier_id);
    if (!profile?.id || !profile.advocateId || !profile.advocateName || !tier) return [];
    return [{ id: profile.id, advocateId: profile.advocateId, advocateName: profile.advocateName,
      advocateTitle: profile.advocateTitle ?? 'Advokat Terverifikasi', advocateRating: profile.advocateRating ?? 0,
      specialty: profile.specialty ?? 'Konsultasi Hukum', slotTimeLabel: profile.slotTimeLabel ?? slot.start_time,
      isBooked: false, tierId: slot.tier_id, price: tier.price_idr,
      priceLabel: tier.price_label ?? `Rp ${tier.price_idr.toLocaleString('id-ID')}` }];
  });
}

const mapCheckout = (row: CheckoutRow): ConsultationCheckout => ({
  bookingId: row.booking_id, bookingCode: row.booking_code, escrowId: row.escrow_id,
  slotId: row.slot_id, tierId: row.tier_id, advocateId: row.advocate_id,
  advocateName: row.advocate_name, amount: row.amount_idr, status: row.escrow_status,
  createdAt: row.created_at, mutexLockId: row.mutex_lock_id, paymentReference: row.payment_gateway_ref,
});

export async function checkoutConsultation(slotId: string, caseSummary: string): Promise<ConsultationCheckout> {
  const { data, error } = await supabase.rpc('fn_book_consultation_slot_mutex', {
    p_slot_id: slotId, p_case_summary: caseSummary, p_booking_type: 'STANDARD',
  });
  if (error) throw bookingError(error.message);
  const row = data[0];
  if (!row) throw new Error('Database tidak mengembalikan bukti transaksi Escrow.');
  return mapCheckout(row);
}
