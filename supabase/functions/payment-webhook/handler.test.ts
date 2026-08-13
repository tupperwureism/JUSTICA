import assert from "node:assert/strict";
import test from "node:test";
import { sha256HexBytes } from "../_shared/crypto.ts";
import { RestError } from "../_shared/rest.ts";
import {
  createPaymentWebhookHandler,
  type PaymentWebhookDependencies,
  type PaymentWebhookRpcRow,
} from "./handler.ts";

const SECRET = "local-test-secret-never-persist";
const NOW_SECONDS = 1_800_000_000;
const ORDER_ID = "22222222-2222-4222-8222-222222222222";
const CASE_ID = "33333333-3333-4333-8333-333333333333";
const ESCROW_ID = "44444444-4444-4444-8444-444444444444";
const EVENT_ID = "provider-event-001";
const EVENT_ROW_ID = "55555555-5555-4555-8555-555555555555";

const validPayload = {
  providerEventId: EVENT_ID,
  eventType: "INVOICE_PAID",
  orderId: ORDER_ID,
  caseId: CASE_ID,
  escrowId: ESCROW_ID,
  amountIdr: 5_000_000,
  paymentGatewayRef: `CORP-${ORDER_ID}`,
};

const validRpcRow = (replayed = false): PaymentWebhookRpcRow => ({
  event_id: EVENT_ROW_ID,
  provider_event_id: EVENT_ID,
  order_id: ORDER_ID,
  corporate_case_id: CASE_ID,
  escrow_id: ESCROW_ID,
  escrow_status: "HELD_IN_ESCROW",
  case_stage: "ESCROW_LOCKED",
  order_status: "ACTIVE",
  provider_event_status: "PROCESSED",
  funded_milestone_count: 2,
  replayed,
});

async function hmac(rawBody: string | Uint8Array, timestamp = NOW_SECONDS): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const prefix = encoder.encode(`${timestamp}.`);
  const bodyBytes = typeof rawBody === "string" ? encoder.encode(rawBody) : rawBody;
  const signedBytes = new Uint8Array(prefix.byteLength + bodyBytes.byteLength);
  signedBytes.set(prefix);
  signedBytes.set(bodyBytes, prefix.byteLength);
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    signedBytes,
  );
  return Array.from(new Uint8Array(signature), (byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}

function dependencies(
  overrides: Partial<PaymentWebhookDependencies> = {},
): PaymentWebhookDependencies {
  return {
    getEnvironment: (name) => ({
      PAYMENT_WEBHOOK_SECRET: SECRET,
      PAYMENT_WEBHOOK_MAX_SKEW_SECONDS: "300",
      PAYMENT_PROVIDER_NAME: "LOCAL_SIGNED_PROVIDER",
    })[name],
    nowMs: () => NOW_SECONDS * 1000,
    callRpc: async () => [validRpcRow()],
    ...overrides,
  };
}

async function signedRequest(
  body: unknown = validPayload,
  options: {
    rawBody?: string;
    timestamp?: number;
    signature?: string | null;
    method?: string;
  } = {},
): Promise<Request> {
  const rawBody = options.rawBody ?? JSON.stringify(body);
  const timestamp = options.timestamp ?? NOW_SECONDS;
  const signature = options.signature === undefined
    ? await hmac(rawBody, timestamp)
    : options.signature;
  const headers = new Headers({
    "content-type": "application/json",
    "x-webhook-timestamp": String(timestamp),
  });
  if (signature !== null) headers.set("x-webhook-signature", signature);
  return new Request("http://localhost/functions/v1/payment-webhook", {
    method: options.method ?? "POST",
    headers,
    body: options.method === "GET" ? undefined : rawBody,
  });
}

async function responseBody(response: Response): Promise<Record<string, unknown>> {
  return await response.json() as Record<string, unknown>;
}

test("non-POST is rejected before database mutation", async () => {
  let calls = 0;
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async () => {
      calls += 1;
      return [validRpcRow()];
    },
  }));
  const response = await handler(await signedRequest(undefined, { method: "GET" }));
  assert.equal(response.status, 405);
  assert.equal(calls, 0);
});

test("malformed JSON with a valid signature is rejected without mutation", async () => {
  let calls = 0;
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async () => {
      calls += 1;
      return [validRpcRow()];
    },
  }));
  const response = await handler(await signedRequest(undefined, { rawBody: "{broken" }));
  assert.equal(response.status, 400);
  assert.equal((await responseBody(response)).code, "INVALID_JSON");
  assert.equal(calls, 0);
});

test("signature is verified before malformed JSON is parsed", async () => {
  let calls = 0;
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async () => {
      calls += 1;
      return [validRpcRow()];
    },
  }));
  const response = await handler(await signedRequest(undefined, {
    rawBody: "{broken",
    signature: "0".repeat(64),
  }));
  assert.equal(response.status, 401);
  assert.equal((await responseBody(response)).code, "INVALID_SIGNATURE");
  assert.equal(calls, 0);
});

test("HMAC and evidence digest preserve the exact raw request bytes", async () => {
  let parameters: Record<string, unknown> | undefined;
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async (_name, value) => {
      parameters = value as Record<string, unknown>;
      return [validRpcRow()];
    },
  }));
  const jsonBytes = new TextEncoder().encode(JSON.stringify(validPayload));
  const rawBytes = new Uint8Array(jsonBytes.byteLength + 3);
  rawBytes.set([0xef, 0xbb, 0xbf]);
  rawBytes.set(jsonBytes, 3);
  const request = new Request("http://localhost/functions/v1/payment-webhook", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-webhook-timestamp": String(NOW_SECONDS),
      "x-webhook-signature": await hmac(rawBytes),
    },
    body: rawBytes,
  });

  const response = await handler(request);

  assert.equal(response.status, 200);
  assert.ok(parameters);
  assert.equal(
    parameters.p_raw_payload_sha256,
    await sha256HexBytes(rawBytes),
  );
});

test("unknown fields are rejected without mutation", async () => {
  let calls = 0;
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async () => {
      calls += 1;
      return [validRpcRow()];
    },
  }));
  const response = await handler(await signedRequest({ ...validPayload, rawPayload: "forbidden" }));
  assert.equal(response.status, 400);
  assert.equal((await responseBody(response)).code, "UNKNOWN_FIELD");
  assert.equal(calls, 0);
});

for (const [name, patch] of [
  ["UUID", { orderId: "not-a-uuid" }],
  ["event type", { eventType: "DISBURSEMENT_SUCCESS" }],
  ["amount NaN encoding", { amountIdr: "NaN" }],
  ["amount infinity encoding", { amountIdr: "Infinity" }],
  ["negative amount", { amountIdr: -1 }],
  ["fractional IDR amount", { amountIdr: 5_000_000.5 }],
  ["blank reference", { paymentGatewayRef: "" }],
  ["non-canonical reference", { paymentGatewayRef: "CORP-wrong" }],
  ["blank provider event", { providerEventId: "" }],
] as const) {
  test(`invalid ${name} is rejected`, async () => {
    const handler = createPaymentWebhookHandler(dependencies());
    const response = await handler(await signedRequest({ ...validPayload, ...patch }));
    assert.equal(response.status, 400);
  });
}

test("missing, invalid, stale, and body-mismatched signatures never mutate", async () => {
  let calls = 0;
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async () => {
      calls += 1;
      return [validRpcRow()];
    },
  }));
  const missing = await handler(await signedRequest(validPayload, { signature: null }));
  const invalid = await handler(await signedRequest(validPayload, { signature: "0".repeat(64) }));
  const stale = await handler(await signedRequest(validPayload, { timestamp: NOW_SECONDS - 301 }));
  const canonicalRaw = JSON.stringify(validPayload);
  const mismatched = await handler(await signedRequest(validPayload, {
    rawBody: `${canonicalRaw} `,
    signature: await hmac(canonicalRaw),
  }));
  assert.deepEqual(
    [missing.status, invalid.status, stale.status, mismatched.status],
    [401, 401, 401, 401],
  );
  assert.equal(calls, 0);
});

test("missing server environment fails closed", async () => {
  for (const missingName of ["PAYMENT_WEBHOOK_SECRET", "PAYMENT_PROVIDER_NAME"]) {
    const base = dependencies();
    const handler = createPaymentWebhookHandler(dependencies({
      getEnvironment: (name) => name === missingName ? undefined : base.getEnvironment(name),
    }));
    const response = await handler(await signedRequest());
    assert.equal(response.status, 500);
    assert.equal((await responseBody(response)).code, "SERVER_MISCONFIGURED");
  }
});

test("valid signed callback calls only the atomic RPC and correlates canonical result", async () => {
  let captured: { name: string; parameters: Record<string, unknown> } | null = null;
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async (name, parameters) => {
      captured = { name, parameters: parameters as Record<string, unknown> };
      return [validRpcRow()];
    },
  }));
  const response = await handler(await signedRequest());
  assert.equal(response.status, 200);
  assert.equal((await responseBody(response)).replayed, false);
  assert.ok(captured);
  assert.equal(captured.name, "fn_process_corporate_payment_webhook_atomic");
  assert.equal(captured.parameters.p_provider_name, "LOCAL_SIGNED_PROVIDER");
  assert.equal(captured.parameters.p_provider_event_id, EVENT_ID);
  assert.equal(captured.parameters.p_order_id, ORDER_ID);
  assert.match(String(captured.parameters.p_raw_payload_sha256), /^[0-9a-f]{64}$/);
  assert.match(String(captured.parameters.p_idempotency_key), /^[0-9a-f]{48}$/);
});

test("empty, multiple, malformed, and mismatched RPC results fail closed", async () => {
  const cases: unknown[] = [
    [],
    [validRpcRow(), validRpcRow(true)],
    [{ ...validRpcRow(), funded_milestone_count: 0 }],
    [{ ...validRpcRow(), escrow_status: "PENDING_PAYMENT" }],
    [{ ...validRpcRow(), order_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" }],
    [{ ...validRpcRow(), unexpected: "field" }],
  ];
  for (const result of cases) {
    const handler = createPaymentWebhookHandler(dependencies({
      callRpc: async () => result as PaymentWebhookRpcRow[],
    }));
    const response = await handler(await signedRequest());
    assert.equal(response.status, 502);
    assert.equal((await responseBody(response)).code, "INVALID_SETTLEMENT_RESULT");
  }
});

test("identical replay returns the canonical record with replayed=true", async () => {
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async () => [validRpcRow(true)],
  }));
  const response = await handler(await signedRequest());
  assert.equal(response.status, 200);
  const body = await responseBody(response);
  assert.equal(body.eventId, EVENT_ROW_ID);
  assert.equal(body.replayed, true);
  assert.equal(body.status, "HELD_IN_ESCROW");
});

test("mutated replay maps database conflict to HTTP 409", async () => {
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async () => {
      throw new RestError(409, { message: "CORPORATE_PAYMENT_WEBHOOK_EVENT_CONFLICT" });
    },
  }));
  const response = await handler(await signedRequest({ ...validPayload, amountIdr: 5_000_001 }));
  assert.equal(response.status, 409);
  assert.equal((await responseBody(response)).code, "IDEMPOTENCY_CONFLICT");
});

test("RPC failure cannot return HTTP 200 and leaks no raw, secret, signature, or SQL detail", async () => {
  const rawBody = JSON.stringify(validPayload);
  const signature = await hmac(rawBody);
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async () => {
      throw new RestError(500, {
        message: `SQLSTATE P0001 ${SECRET} ${signature} ${rawBody}`,
      });
    },
  }));
  const response = await handler(await signedRequest(validPayload, { rawBody, signature }));
  assert.equal(response.status, 500);
  const text = await response.text();
  assert.equal(text.includes("SQLSTATE"), false);
  assert.equal(text.includes(SECRET), false);
  assert.equal(text.includes(signature), false);
  assert.equal(text.includes(rawBody), false);
});

test("concurrent identical callbacks settle through one atomic boundary each and both correlate", async () => {
  let calls = 0;
  const handler = createPaymentWebhookHandler(dependencies({
    callRpc: async () => {
      calls += 1;
      await Promise.resolve();
      return [validRpcRow(calls > 1)];
    },
  }));
  const [first, second] = await Promise.all([
    handler(await signedRequest()),
    handler(await signedRequest()),
  ]);
  assert.deepEqual([first.status, second.status], [200, 200]);
  assert.equal(calls, 2);
  const replayFlags = [
    (await responseBody(first)).replayed,
    (await responseBody(second)).replayed,
  ];
  assert.deepEqual(replayFlags.sort(), [false, true]);
});
