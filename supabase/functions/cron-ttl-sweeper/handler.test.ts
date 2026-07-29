import assert from "node:assert/strict";
import test from "node:test";
import { createTtlSweeperHandler } from "./handler.ts";

test("sweeper preserves envelope results and adds evidence summary", async () => {
  const handler = createTtlSweeperHandler({
    expectedSecret: "secret",
    batchSize: 100,
    listExpiredEnvelopes: async () => [{ envelope_id: "envelope-1" }],
    haltEnvelope: async () => [{ ok: true }],
    expireEvidence: async () => [
      {
        evidence_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
        previous_status: "HASHED",
        status: "EXPIRED",
      },
    ],
  });
  const response = await handler(new Request("http://localhost/cron-ttl-sweeper", {
    method: "POST",
    headers: { "x-cron-secret": "secret" },
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.evidence, { scanned: 1, expired: 1, failed: 0 });
  assert.equal(body.scanned, 1);
  assert.equal(body.halted, 1);
  assert.doesNotMatch(JSON.stringify(body), /aaaaaaaa/);
});

test("sweeper keeps legacy secret authentication", async () => {
  const handler = createTtlSweeperHandler({
    expectedSecret: "secret",
    batchSize: 100,
    listExpiredEnvelopes: async () => [],
    haltEnvelope: async () => [],
    expireEvidence: async () => [],
  });
  const response = await handler(new Request("http://localhost/cron-ttl-sweeper", {
    method: "POST",
    headers: { "x-cron-secret": "wrong" },
  }));
  assert.equal(response.status, 401);
});
