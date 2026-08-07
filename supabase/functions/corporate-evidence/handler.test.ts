import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "../_shared/http.ts";
import {
  createCorporateEvidenceHandler,
  detectAllowedMime,
  type CorporateEvidenceDependencies,
} from "./handler.ts";

const userId = "11111111-1111-4111-8111-111111111111";
const evidenceId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function dependencies(
  overrides: Partial<CorporateEvidenceDependencies> = {},
): CorporateEvidenceDependencies {
  return {
    verifyUser: async () => userId,
    hasClientProfile: async () => true,
    prepare: async () => ({
      evidence_id: evidenceId,
      bucket_id: "corporate-intake-evidence",
      object_path: `${userId}/${evidenceId}/source.pdf`,
      status: "PENDING_UPLOAD",
      expires_at: "2027-07-30T00:00:00.000Z",
      replayed: false,
    }),
    resolveStorageObject: async () => ({
      evidence_id: evidenceId,
      client_id: userId,
      bucket_id: "corporate-intake-evidence",
      object_path: `${userId}/${evidenceId}/source.pdf`,
      status: "PENDING_UPLOAD",
      declared_mime: "application/pdf",
      declared_byte_size: 9,
      expires_at: "2027-07-30T00:00:00.000Z",
      artifact_storage_object_id: null,
      artifact_detected_mime: null,
      artifact_actual_byte_size: null,
      artifact_sha256_digest: null,
      artifact_finalize_idempotency_key: null,
      storage_object_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      storage_owner_id: userId,
      stored_mime: "application/pdf",
      stored_byte_size: 9,
    }),
    downloadObject: async () => new TextEncoder().encode("%PDF-test"),
    finalize: async () => ({
      evidence_id: evidenceId,
      evidence_reference: evidenceId,
      status: "HASHED",
      expires_at: "2027-08-05T00:00:00.000Z",
      replayed: false,
    }),
    reject: async () => undefined,
    ...overrides,
  };
}

test("magic-byte detection uses exact PDF/JPEG/PNG signatures", () => {
  assert.equal(detectAllowedMime(new TextEncoder().encode("%PDF-x")), "application/pdf");
  assert.equal(detectAllowedMime(Uint8Array.from([0xff, 0xd8, 0xff, 1])), "image/jpeg");
  assert.equal(
    detectAllowedMime(Uint8Array.from([137, 80, 78, 71, 13, 10, 26, 10])),
    "image/png",
  );
  assert.equal(detectAllowedMime(new TextEncoder().encode("not-file")), null);
});

test("prepare derives the client from the verified JWT", async () => {
  let actor = "";
  const handler = createCorporateEvidenceHandler(dependencies({
    prepare: async (parameters) => {
      actor = parameters.p_actor_user_id;
      return (await dependencies().prepare(parameters));
    },
  }));
  const response = await handler(new Request(
    "http://localhost/functions/v1/corporate-evidence/prepare",
    {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        evidenceId,
        declaredMime: "application/pdf",
        declaredByteSize: 9,
        idempotencyKey: "prepare-1",
      }),
    },
  ));
  assert.equal(response.status, 200);
  assert.equal(actor, userId);
  assert.equal((await response.json()).sha256Digest, undefined);
});

test("client profile lookup receives the verified request context", async () => {
  let profileUserId = "";
  let profileAuthorization = "";
  const handler = createCorporateEvidenceHandler(dependencies({
    hasClientProfile: async (candidateUserId, request) => {
      profileUserId = candidateUserId;
      profileAuthorization = request.headers.get("authorization") ?? "";
      return true;
    },
  }));
  const response = await handler(new Request(
    "http://localhost/functions/v1/corporate-evidence/prepare",
    {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        evidenceId,
        declaredMime: "application/pdf",
        declaredByteSize: 9,
        idempotencyKey: "prepare-request-context",
      }),
    },
  ));
  assert.equal(response.status, 200);
  assert.equal(profileUserId, userId);
  assert.equal(profileAuthorization, "Bearer fixture");
});

test("finalize hashes stored bytes and never returns the digest", async () => {
  let digest = "";
  const handler = createCorporateEvidenceHandler(dependencies({
    finalize: async (parameters) => {
      digest = parameters.p_sha256_digest;
      return (await dependencies().finalize(parameters));
    },
  }));
  const response = await handler(new Request(
    "http://localhost/functions/v1/corporate-evidence/finalize",
    {
      method: "POST",
      headers: {
        origin: "http://127.0.0.1:5173",
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify({ evidenceId, idempotencyKey: "finalize-1" }),
    },
  ));
  assert.equal(response.status, 200);
  assert.match(digest, /^[0-9a-f]{64}$/);
  assert.equal((await response.json()).sha256Digest, undefined);
});

test("invalid origin and missing JWT are rejected safely", async () => {
  const handler = createCorporateEvidenceHandler(dependencies({
    verifyUser: async () => {
      throw new Error("invalid jwt containing secret details");
    },
  }));
  const originResponse = await handler(new Request(
    "http://localhost/functions/v1/corporate-evidence/prepare",
    { method: "POST", headers: { origin: "https://evil.invalid" } },
  ));
  assert.equal(originResponse.status, 403);

  const authResponse = await handler(new Request(
    "http://localhost/functions/v1/corporate-evidence/prepare",
    { method: "POST", headers: { origin: "http://localhost:5173" } },
  ));
  assert.equal(authResponse.status, 401);
  assert.doesNotMatch(await authResponse.text(), /secret details/);
});

test("non-client and forged metadata cannot select the actor", async () => {
  const nonClientHandler = createCorporateEvidenceHandler(dependencies({
    hasClientProfile: async () => false,
  }));
  const nonClientResponse = await nonClientHandler(new Request(
    "http://localhost/functions/v1/corporate-evidence/prepare",
    {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        evidenceId,
        declaredMime: "application/pdf",
        declaredByteSize: 9,
        idempotencyKey: "prepare-1",
      }),
    },
  ));
  assert.equal(nonClientResponse.status, 403);

  const handler = createCorporateEvidenceHandler(dependencies());
  const metadataResponse = await handler(new Request(
    "http://localhost/functions/v1/corporate-evidence/prepare",
    {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        evidenceId,
        declaredMime: "application/pdf",
        declaredByteSize: 9,
        idempotencyKey: "prepare-1",
        user_metadata: { sub: "ffffffff-ffff-4fff-8fff-ffffffffffff" },
      }),
    },
  ));
  assert.equal(metadataResponse.status, 400);
});

test("permanent MIME failure rejects but missing Storage metadata remains retryable", async () => {
  let rejected = "";
  const mismatchHandler = createCorporateEvidenceHandler(dependencies({
    resolveStorageObject: async () => ({
      ...(await dependencies().resolveStorageObject(evidenceId, userId))!,
      stored_mime: "image/png",
    }),
    reject: async (_evidence, _client, code) => {
      rejected = code;
    },
  }));
  const request = () =>
    new Request("http://localhost/functions/v1/corporate-evidence/finalize", {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify({ evidenceId, idempotencyKey: "finalize-1" }),
    });
  assert.equal((await mismatchHandler(request())).status, 415);
  assert.equal(rejected, "MIME_MISMATCH");

  rejected = "";
  const retryHandler = createCorporateEvidenceHandler(dependencies({
    resolveStorageObject: async () => ({
      ...(await dependencies().resolveStorageObject(evidenceId, userId))!,
      stored_mime: null,
    }),
    reject: async (_evidence, _client, code) => {
      rejected = code;
    },
  }));
  assert.equal((await retryHandler(request())).status, 503);
  assert.equal(rejected, "");

  const oversizedHandler = createCorporateEvidenceHandler(dependencies({
    downloadObject: async () => {
      throw new HttpError(413, "EVIDENCE_TOO_LARGE", "Stored evidence exceeds the size limit.");
    },
    reject: async (_evidence, _client, code) => {
      rejected = code;
    },
  }));
  assert.equal((await oversizedHandler(request())).status, 413);
  assert.equal(rejected, "SIZE_INVALID");
});

test("invalid method/path, missing object, and owner mismatch map to safe statuses", async () => {
  const handler = createCorporateEvidenceHandler(dependencies());
  const commonHeaders = {
    origin: "http://localhost:5173",
    authorization: "Bearer fixture",
    "content-type": "application/json",
  };
  assert.equal(
    (await handler(new Request(
      "http://localhost/functions/v1/corporate-evidence/prepare",
      { method: "GET", headers: commonHeaders },
    ))).status,
    405,
  );
  assert.equal(
    (await handler(new Request(
      "http://localhost/functions/v1/corporate-evidence/unknown",
      { method: "POST", headers: commonHeaders, body: "{}" },
    ))).status,
    400,
  );
  const missingHandler = createCorporateEvidenceHandler(dependencies({
    resolveStorageObject: async () => null,
  }));
  assert.equal(
    (await missingHandler(new Request(
      "http://localhost/functions/v1/corporate-evidence/finalize",
      {
        method: "POST",
        headers: commonHeaders,
        body: JSON.stringify({ evidenceId, idempotencyKey: "finalize-1" }),
      },
    ))).status,
    404,
  );
  const ownerHandler = createCorporateEvidenceHandler(dependencies({
    resolveStorageObject: async () => ({
      ...(await dependencies().resolveStorageObject(evidenceId, userId))!,
      storage_owner_id: "ffffffff-ffff-4fff-8fff-ffffffffffff",
    }),
  }));
  const ownerResponse = await ownerHandler(new Request(
    "http://localhost/functions/v1/corporate-evidence/finalize",
    {
      method: "POST",
      headers: commonHeaders,
      body: JSON.stringify({ evidenceId, idempotencyKey: "finalize-1" }),
    },
  ));
  assert.equal(ownerResponse.status, 403);
  assert.doesNotMatch(await ownerResponse.text(), /ffffffff/);
});

test("terminal or expired evidence is rejected before Storage download", async () => {
  let downloads = 0;
  const request = () =>
    new Request("http://localhost/functions/v1/corporate-evidence/finalize", {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify({ evidenceId, idempotencyKey: "finalize-1" }),
    });
  for (const record of [
    { status: "REJECTED", expires_at: "2026-08-05T00:00:00.000Z" },
    { status: "HASHED", expires_at: "2020-01-01T00:00:00.000Z" },
  ]) {
    const handler = createCorporateEvidenceHandler(dependencies({
      resolveStorageObject: async () => ({
        ...(await dependencies().resolveStorageObject(evidenceId, userId))!,
        ...record,
      }),
      downloadObject: async () => {
        downloads++;
        return new Uint8Array();
      },
    }));
    assert.equal((await handler(request())).status, 422);
  }
  assert.equal(downloads, 0);
});

test("consumed finalize replay uses immutable database metadata without downloading", async () => {
  let downloads = 0;
  const handler = createCorporateEvidenceHandler(dependencies({
    resolveStorageObject: async () => ({
      ...(await dependencies().resolveStorageObject(evidenceId, userId))!,
      status: "CONSUMED",
      artifact_storage_object_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      artifact_detected_mime: "application/pdf",
      artifact_actual_byte_size: 9,
      artifact_sha256_digest:
        "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      artifact_finalize_idempotency_key: "finalize-consumed",
      storage_object_id: null,
      storage_owner_id: null,
      stored_mime: null,
      stored_byte_size: null,
    }),
    downloadObject: async () => {
      downloads++;
      return new Uint8Array();
    },
    finalize: async () => ({
      evidence_id: evidenceId,
      evidence_reference: evidenceId,
      status: "CONSUMED",
      expires_at: "2026-08-05T00:00:00.000Z",
      replayed: true,
    }),
  }));
  const response = await handler(new Request(
    "http://localhost/functions/v1/corporate-evidence/finalize",
    {
      method: "POST",
      headers: {
        origin: "http://localhost:5173",
        authorization: "Bearer fixture",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        evidenceId,
        idempotencyKey: "finalize-consumed",
      }),
    },
  ));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).status, "CONSUMED");
  assert.equal(downloads, 0);
});
