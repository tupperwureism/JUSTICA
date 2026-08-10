import assert from 'node:assert/strict';
import test from 'node:test';
import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js';
import {
  parseEvidenceErrorCode,
  parseIntakeErrorCode,
} from '../src/services/intakeError.ts';

test('parseIntakeErrorCode reads structured code from real FunctionsHttpError Response JSON', async () => {
  const response = new Response(
    JSON.stringify({ ok: false, code: 'PRICING_CATALOG_UNAVAILABLE', message: 'catalog missing' }),
    { status: 409, headers: { 'content-type': 'application/json' } },
  );
  const error = new FunctionsHttpError(response);
  const code = await parseIntakeErrorCode(error);
  assert.equal(code, 'PRICING_CATALOG_UNAVAILABLE');
});

test('parseIntakeErrorCode falls back to null when body is malformed JSON', async () => {
  const response = new Response('not-json-{{', {
    status: 500,
    headers: { 'content-type': 'application/json' },
  });
  const error = new FunctionsHttpError(response);
  const code = await parseIntakeErrorCode(error);
  assert.equal(code, null);
});

test('parseIntakeErrorCode falls back to null for unknown code', async () => {
  const response = new Response(
    JSON.stringify({ ok: false, code: 'SOME_NEW BackendFailure', message: 'x' }),
    { status: 500, headers: { 'content-type': 'application/json' } },
  );
  const error = new FunctionsHttpError(response);
  const code = await parseIntakeErrorCode(error);
  assert.equal(code, null);
});

test('parseIntakeErrorCode falls back to null when body code is not a string', async () => {
  const response = new Response(
    JSON.stringify({ ok: false, code: { nested: 'object' } }),
    { status: 409, headers: { 'content-type': 'application/json' } },
  );
  const error = new FunctionsHttpError(response);
  const code = await parseIntakeErrorCode(error);
  assert.equal(code, null);
});

test('parseIntakeErrorCode returns known allowlisted code IDEMPOTENCY_CONFLICT', async () => {
  const response = new Response(
    JSON.stringify({ code: 'IDEMPOTENCY_CONFLICT' }),
    { status: 409, headers: { 'content-type': 'application/json' } },
  );
  const error = new FunctionsHttpError(response);
  const code = await parseIntakeErrorCode(error);
  assert.equal(code, 'IDEMPOTENCY_CONFLICT');
});

test('parseIntakeErrorCode returns null for a non-FunctionsHttpError and does not crash', async () => {
  const code = await parseIntakeErrorCode(new Error('plain error'));
  assert.equal(code, null);
});

test('parseIntakeErrorCode rejects an arbitrary object carrying an allowlisted code', async () => {
  const code = await parseIntakeErrorCode({
    code: 'IDEMPOTENCY_CONFLICT',
    message: 'forged browser object',
  });
  assert.equal(code, null);
});

test('parseIntakeErrorCode rejects relay and fetch errors even when context looks structured', async () => {
  const forgedContext = { code: 'IDEMPOTENCY_CONFLICT' };
  assert.equal(await parseIntakeErrorCode(new FunctionsRelayError(forgedContext)), null);
  assert.equal(await parseIntakeErrorCode(new FunctionsFetchError(forgedContext)), null);
});

test('parseIntakeErrorCode does not leak message/detail into the result', async () => {
  const response = new Response(
    JSON.stringify({
      code: 'PRICING_CATALOG_UNAVAILABLE',
      message: 'leaky detail with SQL SELECT pg_terminate_backend(pid)',
      hint: 'JWT secret xyz',
    }),
    { status: 409, headers: { 'content-type': 'application/json' } },
  );
  const error = new FunctionsHttpError(response);
  const code = await parseIntakeErrorCode(error);
  assert.equal(code, 'PRICING_CATALOG_UNAVAILABLE');
  assert.equal(typeof code, 'string');
});

test('parseEvidenceErrorCode reads only allowlisted JSON from a real FunctionsHttpError', async () => {
  const valid = new FunctionsHttpError(new Response(
    JSON.stringify({ code: 'EVIDENCE_MAGIC_INVALID', detail: 'must not escape' }),
    { status: 415, headers: { 'content-type': 'application/json' } },
  ));
  assert.equal(await parseEvidenceErrorCode(valid), 'EVIDENCE_MAGIC_INVALID');
  assert.equal(
    await parseEvidenceErrorCode({ code: 'EVIDENCE_MAGIC_INVALID' }),
    null,
  );
});
