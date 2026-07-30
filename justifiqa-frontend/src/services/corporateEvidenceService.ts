import { supabase } from '@/lib/supabase';

export type EvidenceUploadStep = 'prepare' | 'upload' | 'finalize';

export type EvidenceUploadOutcome = {
  evidenceReference: string;
};

export class CorporateEvidenceError extends Error {
  readonly step: EvidenceUploadStep;
  readonly code: string;

  constructor(step: EvidenceUploadStep, code: string, message: string) {
    super(message);
    this.name = 'CorporateEvidenceError';
    this.step = step;
    this.code = code;
  }
}

function friendlyError(step: EvidenceUploadStep, code: string, fallback: string): CorporateEvidenceError {
  if (step === 'finalize' && code === 'EVIDENCE_MAGIC_INVALID') {
    return new CorporateEvidenceError(step, code, 'Format file tidak didukung (PDF, JPG, PNG max 10MB).');
  }
  if (code === 'PAYLOAD_TOO_LARGE' || code === 'EVIDENCE_TOO_LARGE' || code === 'EVIDENCE_SIZE_INVALID') {
    return new CorporateEvidenceError(step, code, 'File terlalu besar (max 10MB).');
  }
  return new CorporateEvidenceError(step, code, fallback);
}

export async function uploadBeneficialOwnerEvidence(
  file: File,
  onProgress?: (step: EvidenceUploadStep) => void,
): Promise<EvidenceUploadOutcome> {
  onProgress?.('prepare');
  const evidenceId = crypto.randomUUID();
  const idempotencyKey = crypto.randomUUID();
  const declaredMime = file.type;
  const declaredByteSize = file.size;
  const { data: prep, error: prepErr } = await supabase.functions.invoke(
    'corporate-evidence/prepare',
    { body: { evidenceId, declaredMime, declaredByteSize, idempotencyKey } },
  );
  if (prepErr || !prep?.objectPath) {
    throw friendlyError('prepare', (prepErr as { code?: string } | null)?.code ?? 'PREPARE_FAILED', 'Persiapan unggah bukti gagal. Coba ulang.');
  }
  const objectPath: string = prep.objectPath;

  onProgress?.('upload');
  const { error: upErr } = await supabase.storage
    .from('corporate-intake-evidence')
    .upload(objectPath, file, { contentType: declaredMime, upsert: false });
  if (upErr) {
    const upCode = (upErr as unknown as { code?: string }).code ?? 'STORAGE_FAILED';
    throw friendlyError('upload', upCode, 'Unggah file bukti gagal. Coba ulang.');
  }

  onProgress?.('finalize');
  const { data: fin, error: finErr } = await supabase.functions.invoke(
    'corporate-evidence/finalize',
    { body: { evidenceId, idempotencyKey } },
  );
  if (finErr || !fin?.evidenceReference) {
    throw friendlyError('finalize', (finErr as { code?: string } | null)?.code ?? 'FINALIZE_FAILED', 'Finalisasi bukti gagal. Coba ulang.');
  }

  return { evidenceReference: fin.evidenceReference as string };
}
