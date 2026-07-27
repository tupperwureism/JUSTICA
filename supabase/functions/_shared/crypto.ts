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

export async function deriveIdempotencyKey(namespace: string, value: string): Promise<string> {
  return (await sha256Hex(`${namespace}:${value}`)).slice(0, 48);
}

export async function verifyHmacSha256(options: {
  body: string;
  secret: string;
  signature: string;
  timestamp: string;
  nowMs?: number;
  maxSkewSeconds?: number;
}): Promise<boolean> {
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
  return crypto.subtle.verify(
    "HMAC",
    key,
    hexToBytes(signature),
    encoder.encode(`${options.timestamp}.${options.body}`),
  );
}
