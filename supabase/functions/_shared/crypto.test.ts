import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveIdempotencyKey,
  sha256Hex,
  sha256HexBytes,
  verifyHmacSha256,
} from "./crypto.ts";

async function signature(secret: string, timestamp: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${timestamp}.${body}`)),
  );
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

test("verifyHmacSha256 accepts a valid current signature", async () => {
  const body = '{"event":"paid"}';
  const secret = "test-secret";
  const timestamp = "1700000000";
  assert.equal(
    await verifyHmacSha256({
      body,
      secret,
      timestamp,
      signature: `sha256=${await signature(secret, timestamp, body)}`,
      nowMs: 1700000000000,
    }),
    true,
  );
});
test("verifyHmacSha256 rejects tampering and stale timestamps", async () => {
  const secret = "test-secret";
  const timestamp = "1700000000";
  const signed = await signature(secret, timestamp, "original");
  assert.equal(
    await verifyHmacSha256({
      body: "changed",
      secret,
      timestamp,
      signature: signed,
      nowMs: 1700000000000,
    }),
    false,
  );
  assert.equal(
    await verifyHmacSha256({
      body: "original",
      secret,
      timestamp,
      signature: signed,
      nowMs: 1700000601000,
    }),
    false,
  );
});

test("digest and idempotency keys are deterministic and bounded", async () => {
  assert.equal(
    await sha256Hex("abc"),
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  const first = await deriveIdempotencyKey("payment", "provider:event");
  assert.equal(first, await deriveIdempotencyKey("payment", "provider:event"));
  assert.equal(first.length, 48);
  assert.notEqual(first, await deriveIdempotencyKey("ekyc", "provider:event"));
});

test("sha256HexBytes hashes the exact binary bytes", async () => {
  assert.equal(
    await sha256HexBytes(Uint8Array.from([0, 255, 1, 2, 3])),
    "4be72cf29a33b5f223067ab9d5dd9567e0c14978e6ed54e2d556ddc9e2cc6038",
  );
});
