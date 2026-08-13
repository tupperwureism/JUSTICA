const encoder = new TextEncoder();

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function normalizeHexSignature(value: string): string | null {
  const normalized = value.trim().toLowerCase().replace(/^sha256=/, "");
  return /^[0-9a-f]{64}$/.test(normalized) ? normalized : null;
}

function hexToBytes(value: string): Uint8Array {
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (pair) => Number.parseInt(pair, 16));
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToHex(new Uint8Array(digest));
}

export async function sha256HexBytes(value: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return bytesToHex(new Uint8Array(digest));
}

export async function deriveIdempotencyKey(namespace: string, value: string): Promise<string> {
  return (await sha256Hex(`${namespace}:${value}`)).slice(0, 48);
}

type HmacVerificationOptions<TBody> = {
  body: TBody;
  secret: string;
  signature: string;
  timestamp: string;
  nowMs?: number;
  maxSkewSeconds?: number;
};

export async function verifyHmacSha256(
  options: HmacVerificationOptions<string>,
): Promise<boolean> {
  return verifyHmacSha256Bytes({
    ...options,
    body: encoder.encode(options.body),
  });
}

export async function verifyHmacSha256Bytes(
  options: HmacVerificationOptions<Uint8Array>,
): Promise<boolean> {
  const signature = normalizeHexSignature(options.signature);
  const timestampSeconds = Number(options.timestamp);
  const nowMs = options.nowMs ?? Date.now();
  const maxSkewSeconds = options.maxSkewSeconds ?? 300;

  if (
    !signature ||
    !options.secret ||
    !Number.isInteger(timestampSeconds) ||
    maxSkewSeconds < 1 ||
    Math.abs(Math.floor(nowMs / 1000) - timestampSeconds) > maxSkewSeconds
  ) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(options.secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  const prefix = encoder.encode(`${options.timestamp}.`);
  const signedBytes = new Uint8Array(prefix.byteLength + options.body.byteLength);
  signedBytes.set(prefix);
  signedBytes.set(options.body, prefix.byteLength);
  return crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(signature),
    signedBytes,
  );
}
