import { HttpError } from "./http.ts";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[0-9a-f]{64}$/;

export function requireRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new HttpError(400, "INVALID_PAYLOAD", "Payload must be a JSON object.");
  }
  return value as Record<string, unknown>;
}
export function rejectUnknownKeys(
  value: Record<string, unknown>,
  allowed: readonly string[],
): void {
  const allowedSet = new Set(allowed);
  if (Object.keys(value).some((key) => !allowedSet.has(key))) {
    throw new HttpError(400, "UNKNOWN_FIELD", "Payload contains an unsupported field.");
  }
}

export function requireString(
  value: Record<string, unknown>,
  key: string,
  maxLength: number,
): string {
  const result = value[key];
  if (typeof result !== "string" || result.trim() !== result || !result || result.length > maxLength) {
    throw new HttpError(400, "INVALID_FIELD", `Field ${key} is invalid.`);
  }
  return result;
}

export function requireUuid(value: Record<string, unknown>, key: string): string {
  const result = requireString(value, key, 36);
  if (!UUID.test(result)) {
    throw new HttpError(400, "INVALID_FIELD", `Field ${key} must be a UUID.`);
  }
  return result;
}

export function requireSha256(value: Record<string, unknown>, key: string): string {
  const result = requireString(value, key, 64);
  if (!SHA256.test(result)) {
    throw new HttpError(400, "INVALID_FIELD", `Field ${key} must be a lowercase SHA-256 digest.`);
  }
  return result;
}

export function requirePositiveAmount(value: Record<string, unknown>, key: string): number {
  const result = value[key];
  if (typeof result !== "number" || !Number.isFinite(result) || result <= 0 || result > 9999999999999.99) {
    throw new HttpError(400, "INVALID_FIELD", `Field ${key} must be a positive amount.`);
  }
  return result;
}

export function requireInteger(
  value: Record<string, unknown>,
  key: string,
  minimum: number,
  maximum: number,
): number {
  const result = value[key];
  if (!Number.isInteger(result) || (result as number) < minimum || (result as number) > maximum) {
    throw new HttpError(400, "INVALID_FIELD", `Field ${key} is outside its accepted range.`);
  }
  return result as number;
}

export function requireEnum<T extends string>(
  value: Record<string, unknown>,
  key: string,
  accepted: readonly T[],
): T {
  const result = requireString(value, key, 64);
  if (!accepted.includes(result as T)) {
    throw new HttpError(400, "INVALID_FIELD", `Field ${key} has an unsupported value.`);
  }
  return result as T;
}

export function requireIsoTimestamp(value: Record<string, unknown>, key: string): string {
  const result = requireString(value, key, 40);
  const parsed = Date.parse(result);
  if (!Number.isFinite(parsed) || new Date(parsed).toISOString() !== result) {
    throw new HttpError(400, "INVALID_FIELD", `Field ${key} must be an ISO-8601 UTC timestamp.`);
  }
  return result;
}
