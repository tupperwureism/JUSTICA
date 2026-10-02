import { supabase } from '@/lib/supabase';
import { resolveRoomSession } from './roomSessionService';

export interface VaultDocument {
  opinionId: string;
  bookingId: string;
  title: string;
  storagePath: string;
  revisionCount: number;
  status: string;
  sha256Hash: string;
  peruriSerial: string;
}

const vaultError = (message: string): Error => {
  if (message.includes('SIGNED_DELIVERABLE_REQUIRED')) return new Error('Dokumen WORM ber-e-Meterai belum tersedia.');
  if (message.includes('ESCROW_RELEASE_FORBIDDEN')) return new Error('Hanya Klien pemilik perkara yang dapat melepas Escrow.');
  if (message.includes('INVALID_ESCROW_STATUS')) return new Error('Escrow sudah diproses atau sedang dibekukan.');
  if (message.includes('HELD_BALANCE_MISMATCH')) return new Error('Saldo Escrow tertahan tidak konsisten. Hubungi Compliance Justica.');
  return new Error('Operasi WORM Vault gagal diproses. Silakan coba kembali.');
};

export async function getVaultDocument(sessionReference: string): Promise<VaultDocument | null> {
  const { bookingId } = await resolveRoomSession(sessionReference);
  const { data: opinion, error } = await supabase.from('legal_opinions')
    .select('opinion_id,booking_id,document_title,pdf_storage_path,revision_counter,status')
    .eq('booking_id', bookingId).eq('status', 'STAMPED_SIGNED')
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw vaultError(error.message);
  if (!opinion) return null;
  const { data: stamp, error: stampError } = await supabase.from('emeterai_stamping_logs')
    .select('sha256_document_hash,peruri_serial_number').eq('opinion_id', opinion.opinion_id)
    .eq('status', 'SUCCESS').order('stamped_at', { ascending: false }).limit(1).maybeSingle();
  if (stampError) throw vaultError(stampError.message);
  return { opinionId: opinion.opinion_id, bookingId: opinion.booking_id, title: opinion.document_title,
    storagePath: opinion.pdf_storage_path, revisionCount: opinion.revision_counter, status: opinion.status,
    sha256Hash: stamp?.sha256_document_hash ?? 'Hash e-Meterai belum tersedia',
    peruriSerial: stamp?.peruri_serial_number ?? 'Serial Peruri belum tersedia' };
}

export async function createVaultDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage.from('legal-opinions').createSignedUrl(storagePath, 60);
  if (error) throw vaultError(error.message);
  return data.signedUrl;
}

export async function releaseVaultEscrow(sessionReference: string): Promise<void> {
  const { bookingId } = await resolveRoomSession(sessionReference);
  const { data: escrow, error } = await supabase.from('escrow_transactions')
    .select('escrow_id,status').eq('booking_id', bookingId).maybeSingle();
  if (error || !escrow) throw vaultError(error?.message ?? 'ESCROW_NOT_FOUND');
  if (escrow.status === 'RELEASED_TO_ADVOCATE') return;
  const { data: released, error: releaseError } = await supabase.rpc('fn_release_escrow_to_advocate_mutex', {
    p_escrow_id: escrow.escrow_id,
  });
  if (releaseError || !released) throw vaultError(releaseError?.message ?? 'ESCROW_RELEASE_FAILED');
}
