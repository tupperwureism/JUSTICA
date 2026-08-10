import { parseEvidenceErrorCode } from './intakeError.ts';
import { StorageApiError } from '@supabase/supabase-js';

export type EvidenceUploadStep = 'prepare' | 'upload' | 'finalize';

export type PrepareInput = {
  evidenceId: string;
  idempotencyKey: string;
  declaredMime: string;
  declaredByteSize: number;
};

export type PrepareResult = {
  objectPath: string;
};

export type UploadInput = {
  objectPath: string;
  file: File;
  contentType: string;
};

export type FinalizeInput = {
  evidenceId: string;
  idempotencyKey: string;
};

export type FinalizeResult = {
  evidenceReference: string;
};

export interface EvidenceGateway {
  prepare(input: PrepareInput): Promise<PrepareResult>;
  upload(input: UploadInput): Promise<void>;
  finalize(input: FinalizeInput): Promise<FinalizeResult>;
}

export interface GatewayDependencies {
  invokeFunction(path: string, body: Record<string, unknown>): Promise<{ data: unknown; error: unknown }>;
  uploadObject(bucket: string, objectPath: string, file: File, options: { contentType: string; upsert: boolean }): Promise<{ error: StorageApiError | null }>;
}

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

const STORAGE_DUPLICATE_CODES = [
  'ResourceAlreadyExists',
  'KeyAlreadyExists',
  'already_exists',
] as const;

const EVIDENCE_BUCKET = 'corporate-intake-evidence';

function isStorageApiError(error: unknown): error is StorageApiError {
  return error instanceof StorageApiError;
}

function parseStorageDuplicateCode(error: unknown): (typeof STORAGE_DUPLICATE_CODES)[number] | null {
  if (!isStorageApiError(error)) return null;
  if (error.status !== 409) return null;
  const statusCode = error.statusCode;
  return typeof statusCode === 'string' && STORAGE_DUPLICATE_CODES.includes(statusCode as (typeof STORAGE_DUPLICATE_CODES)[number])
    ? statusCode as (typeof STORAGE_DUPLICATE_CODES)[number]
    : null;
}

function parseStorageErrorCode(error: unknown): string | null {
  if (!isStorageApiError(error)) return null;
  const statusCode = error.statusCode;
  return typeof statusCode === 'string'
    && ['EntityTooLarge', 'InvalidMimeType', 'InvalidRequest', 'ResourceAlreadyExists', 'KeyAlreadyExists', 'already_exists'].includes(statusCode)
    ? statusCode
    : null;
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

const PREPARE_FALLBACK = 'Persiapan unggah bukti gagal. Coba ulang.';
const UPLOAD_FALLBACK = 'Unggah file bukti gagal. Coba ulang.';
const FINALIZE_FALLBACK = 'Finalisasi bukti gagal. Coba ulang.';
const EVIDENCE_REFERENCE_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const UUID_FRAGMENT = '[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}';
const EVIDENCE_OBJECT_PATH_PATTERN = new RegExp(`^${UUID_FRAGMENT}/(${UUID_FRAGMENT})/source\\.(?:pdf|jpg|png)$`);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function parseEvidencePrepareData(
  data: unknown,
  expectedEvidenceId: string,
): PrepareResult | null {
  if (!isRecord(data)
    || typeof data.evidenceId !== 'string'
    || typeof data.objectPath !== 'string') return null;
  const normalizedEvidenceId = expectedEvidenceId.toLowerCase();
  const objectPath = data.objectPath;
  const pathMatch = EVIDENCE_OBJECT_PATH_PATTERN.exec(objectPath);
  return data.evidenceId === normalizedEvidenceId && pathMatch?.[1] === normalizedEvidenceId
    ? { objectPath }
    : null;
}

export function parseEvidenceFinalizeData(
  data: unknown,
  expectedEvidenceId: string,
): FinalizeResult | null {
  if (!isRecord(data) || typeof data.evidenceReference !== 'string') return null;
  const normalizedEvidenceId = expectedEvidenceId.toLowerCase();
  return EVIDENCE_REFERENCE_PATTERN.test(data.evidenceReference)
    && data.evidenceReference === normalizedEvidenceId
    ? { evidenceReference: data.evidenceReference }
    : null;
}

export async function prepareEvidence(
  gateway: EvidenceGateway,
  input: PrepareInput,
): Promise<PrepareResult> {
  try {
    return await gateway.prepare(input);
  } catch (error) {
    if (error instanceof CorporateEvidenceError) throw error;
    const code = await parseEvidenceErrorCode(error).catch(() => null);
    throw friendlyError('prepare', code ?? 'PREPARE_FAILED', PREPARE_FALLBACK);
  }
}

export async function uploadEvidence(
  gateway: EvidenceGateway,
  input: UploadInput,
): Promise<void> {
  try {
    await gateway.upload(input);
  } catch (error) {
    if (error instanceof CorporateEvidenceError) throw error;
    const duplicateCode = parseStorageDuplicateCode(error);
    if (duplicateCode) {
      return;
    }
    const code = parseStorageErrorCode(error);
    throw friendlyError('upload', code ?? 'STORAGE_FAILED', UPLOAD_FALLBACK);
  }
}

export async function finalizeEvidence(
  gateway: EvidenceGateway,
  input: FinalizeInput,
): Promise<FinalizeResult> {
  try {
    return await gateway.finalize(input);
  } catch (error) {
    if (error instanceof CorporateEvidenceError) throw error;
    const code = await parseEvidenceErrorCode(error).catch(() => null);
    throw friendlyError('finalize', code ?? 'FINALIZE_FAILED', FINALIZE_FALLBACK);
  }
}

function createDefaultDependencies(): GatewayDependencies {
  return {
    async invokeFunction(path, body) {
      const { supabase } = await import('@/lib/supabase');
      return supabase.functions.invoke(path, { body: body as Record<string, unknown> });
    },
    async uploadObject(bucket, objectPath, file, options) {
      const { supabase } = await import('@/lib/supabase');
      const result = await supabase.storage.from(bucket).upload(objectPath, file, options);
      return { error: result.error as StorageApiError | null };
    },
  };
}

export function createCorporateEvidenceGateway(deps: GatewayDependencies): EvidenceGateway {
  return {
    async prepare(input: PrepareInput): Promise<PrepareResult> {
      const { data, error } = await deps.invokeFunction('corporate-evidence/prepare', {
        evidenceId: input.evidenceId,
        declaredMime: input.declaredMime,
        declaredByteSize: input.declaredByteSize,
        idempotencyKey: input.idempotencyKey,
      });
      const parsed = parseEvidencePrepareData(data, input.evidenceId);
      if (error || !parsed) {
        const code = await parseEvidenceErrorCode(error).catch(() => null);
        throw friendlyError('prepare', code ?? 'PREPARE_FAILED', PREPARE_FALLBACK);
      }
      return parsed;
    },
    async upload(input: UploadInput): Promise<void> {
      const { error } = await deps.uploadObject(EVIDENCE_BUCKET, input.objectPath, input.file, {
        contentType: input.contentType,
        upsert: false,
      });
      if (error) {
        throw error;
      }
    },
    async finalize(input: FinalizeInput): Promise<FinalizeResult> {
      const { data, error } = await deps.invokeFunction('corporate-evidence/finalize', {
        evidenceId: input.evidenceId,
        idempotencyKey: input.idempotencyKey,
      });
      const parsed = parseEvidenceFinalizeData(data, input.evidenceId);
      if (error || !parsed) {
        const code = await parseEvidenceErrorCode(error).catch(() => null);
        throw friendlyError('finalize', code ?? 'FINALIZE_FAILED', FINALIZE_FALLBACK);
      }
      return parsed;
    },
  };
}

export const corporateEvidenceGateway: EvidenceGateway = createCorporateEvidenceGateway(createDefaultDependencies());