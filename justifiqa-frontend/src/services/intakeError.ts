import { FunctionsHttpError } from '@supabase/supabase-js';

export const INTAKE_ERROR_ALLOWLIST = [
  'IDEMPOTENCY_CONFLICT',
  'EVIDENCE_CONFLICT',
  'EVIDENCE_INVALID',
  'ACTOR_MISMATCH',
  'PRICING_CATALOG_UNAVAILABLE',
] as const;

export type IntakeErrorCode = (typeof INTAKE_ERROR_ALLOWLIST)[number] | null;

export const INTAKE_UNKNOWN_FALLBACK = 'INTAKE_SERVER_UNAVAILABLE';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

async function readHttpErrorCode(error: FunctionsHttpError): Promise<string | null> {
  const context = error.context;
  if (!(context instanceof Response)) return null;
  let body: unknown;
  try {
    body = await context.clone().json();
  } catch {
    return null;
  }
  if (!isObject(body)) return null;
  const code = body.code;
  if (typeof code !== 'string') return null;
  return INTAKE_ERROR_ALLOWLIST.includes(code as (typeof INTAKE_ERROR_ALLOWLIST)[number])
    ? code
    : null;
}

export async function parseIntakeErrorCode(error: unknown): Promise<string | null> {
  return error instanceof FunctionsHttpError ? readHttpErrorCode(error) : null;
}

const EVIDENCE_ERROR_ALLOWLIST = [
  'EVIDENCE_MAGIC_INVALID',
  'EVIDENCE_TOO_LARGE',
  'EVIDENCE_SIZE_INVALID',
  'PAYLOAD_TOO_LARGE',
  'EVIDENCE_CONFLICT',
  'EVIDENCE_INVALID',
  'ACTOR_MISMATCH',
  'PREPARE_FAILED',
  'FINALIZE_FAILED',
] as const;

export async function parseEvidenceErrorCode(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null;

  const ctx = error.context;
  if (!(ctx instanceof Response)) return null;
  let body: unknown;
  try {
    body = await ctx.clone().json();
  } catch {
    return null;
  }
  if (!isObject(body)) return null;
  const code = body.code;
  if (typeof code !== 'string') return null;
  return EVIDENCE_ERROR_ALLOWLIST.includes(code as (typeof EVIDENCE_ERROR_ALLOWLIST)[number])
    ? code
    : null;
}
