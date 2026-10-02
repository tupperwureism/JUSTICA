import { supabase } from '@/lib/supabase';

export interface RoomSession {
  bookingId: string;
  bookingCode: string;
  status: string;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function resolveRoomSession(sessionReference: string): Promise<RoomSession> {
  const fields = 'booking_id,booking_code,status' as const;
  const normalized = decodeURIComponent(sessionReference).trim();
  const baseQuery = supabase.from('booking_sessions').select(fields);
  const request = UUID_PATTERN.test(normalized)
    ? baseQuery.eq('booking_id', normalized).maybeSingle()
    : normalized.toUpperCase().startsWith('REQ-')
      ? baseQuery.eq('booking_code', normalized.toUpperCase()).maybeSingle()
      : baseQuery.in('status', ['SCHEDULED', 'ACTIVE']).order('created_at', { ascending: false }).limit(1).maybeSingle();
  const { data, error } = await request;

  if (error) throw new Error('Sesi konsultasi gagal diverifikasi pada database Justica.');
  if (!data) throw new Error('Sesi konsultasi aktif tidak ditemukan untuk akun ini.');
  return { bookingId: data.booking_id, bookingCode: data.booking_code, status: data.status };
}
