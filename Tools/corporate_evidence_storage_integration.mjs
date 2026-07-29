import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const apiUrl = required("SUPABASE_URL").replace(/\/+$/, "");
const anonKey = required("SUPABASE_ANON_KEY");
const serviceKey = required("SUPABASE_SERVICE_ROLE_KEY");
const firstCredentials = {
  email: required("EVIDENCE_TEST_USER_A_EMAIL"),
  password: required("EVIDENCE_TEST_USER_A_PASSWORD"),
};
const secondCredentials = {
  email: required("EVIDENCE_TEST_USER_B_EMAIL"),
  password: required("EVIDENCE_TEST_USER_B_PASSWORD"),
};
const expiredEvidenceId = process.env.EVIDENCE_TEST_EXPIRED_ID || null;
const bucketId = "corporate-intake-evidence";
const sourceBytes = new TextEncoder().encode("%PDF-test");

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

async function json(response) {
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function signIn(credentials) {
  const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify(credentials),
  });
  assert.equal(response.status, 200, `Fixture sign-in failed for ${credentials.email}`);
  const value = await json(response);
  return { id: value.user.id, token: value.access_token };
}

function headers(token, extra = {}) {
  return {
    apikey: anonKey,
    authorization: `Bearer ${token}`,
    ...extra,
  };
}

async function rpc(name, body) {
  const response = await fetch(`${apiUrl}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const value = await json(response);
  assert.equal(response.status, 200, `${name} failed: ${JSON.stringify(value)}`);
  return value;
}

async function prepare(user, evidenceId, key) {
  const [artifact] = await rpc("fn_prepare_corporate_intake_evidence_atomic", {
    p_evidence_id: evidenceId,
    p_client_id: user.id,
    p_declared_mime: "application/pdf",
    p_declared_byte_size: sourceBytes.byteLength,
    p_idempotency_key: key,
    p_actor_user_id: user.id,
  });
  return artifact;
}

async function upload(user, path, options = {}) {
  return fetch(`${apiUrl}/storage/v1/object/${bucketId}/${path}`, {
    method: "POST",
    headers: headers(user.token, {
      "content-type": "application/pdf",
      ...(options.upsert ? { "x-upsert": "true" } : {}),
    }),
    body: sourceBytes,
  });
}

async function download(user, path) {
  return fetch(`${apiUrl}/storage/v1/object/authenticated/${bucketId}/${path}`, {
    headers: headers(user.token),
  });
}

const first = await signIn(firstCredentials);
const second = await signIn(secondCredentials);
const firstEvidenceId = randomUUID();
const secondEvidenceId = randomUUID();
const fakeEvidenceId = randomUUID();
const runKey = randomUUID().replaceAll("-", "").slice(0, 20);
const firstArtifact = await prepare(first, firstEvidenceId, `storage-a-${runKey}`);
const secondArtifact = await prepare(second, secondEvidenceId, `storage-b-${runKey}`);

assert.equal((await upload(first, firstArtifact.object_path)).status, 200);
assert.equal((await upload(second, secondArtifact.object_path)).status, 200);
assert.equal((await download(first, firstArtifact.object_path)).status, 200);
assert.notEqual((await download(second, firstArtifact.object_path)).status, 200);
assert.notEqual((await upload(first, secondArtifact.object_path)).status, 200);
assert.notEqual(
  (await upload(
    first,
    `${first.id}/${fakeEvidenceId}/source.pdf`,
  )).status,
  200,
);
assert.notEqual((await upload(first, firstArtifact.object_path, { upsert: true })).status, 200);

const updateResponse = await fetch(
  `${apiUrl}/storage/v1/object/${bucketId}/${firstArtifact.object_path}`,
  {
    method: "PUT",
    headers: headers(first.token, {
      "content-type": "application/pdf",
      "x-upsert": "true",
    }),
    body: sourceBytes,
  },
);
assert.notEqual(updateResponse.status, 200);

const deleteResponse = await fetch(`${apiUrl}/storage/v1/object/${bucketId}`, {
  method: "DELETE",
  headers: headers(first.token, { "content-type": "application/json" }),
  body: JSON.stringify({ prefixes: [firstArtifact.object_path] }),
});
await deleteResponse.arrayBuffer();
assert.equal((await download(first, firstArtifact.object_path)).status, 200);

for (const operation of ["move", "copy"]) {
  const destination = `${first.id}/${firstEvidenceId}/${operation}.pdf`;
  const response = await fetch(`${apiUrl}/storage/v1/object/${operation}`, {
    method: "POST",
    headers: headers(first.token, { "content-type": "application/json" }),
    body: JSON.stringify({
      bucketId,
      sourceKey: firstArtifact.object_path,
      destinationKey: destination,
    }),
  });
  await response.arrayBuffer();
  assert.equal((await download(first, firstArtifact.object_path)).status, 200);
  assert.notEqual((await download(first, destination)).status, 200);
}

await rpc("fn_reject_corporate_intake_evidence_atomic", {
  p_evidence_id: firstEvidenceId,
  p_client_id: first.id,
  p_rejection_code: "MAGIC_BYTES_INVALID",
  p_actor_user_id: first.id,
});
assert.notEqual((await download(first, firstArtifact.object_path)).status, 200);

let expiredReadDenied = false;
if (expiredEvidenceId) {
  const expiredPath = `${first.id}/${expiredEvidenceId}/source.pdf`;
  assert.equal((await upload(first, expiredPath)).status, 200);
  await rpc("fn_expire_corporate_intake_evidence_batch", { p_batch_size: 500 });
  expiredReadDenied = (await download(first, expiredPath)).status !== 200;
  assert.equal(expiredReadDenied, true);
}

console.log(JSON.stringify({
  ok: true,
  ownUpload: true,
  ownRead: true,
  crossTenantDenied: true,
  fakePathDenied: true,
  overwriteDenied: true,
  updateDeleteMoveCopyDenied: true,
  terminalReadDenied: true,
  expiredReadDenied,
  fixture: {
    firstClientId: first.id,
    secondClientId: second.id,
    evidenceIds: [firstEvidenceId, secondEvidenceId],
    objectPaths: [firstArtifact.object_path, secondArtifact.object_path],
  },
}));
