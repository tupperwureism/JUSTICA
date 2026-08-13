import assert from 'node:assert/strict';
import test from 'node:test';
import { PRESENTATION_CAPABILITIES } from '../src/components/presentation/presentationReadinessModel.ts';

test('presentation readiness only marks completed local corporate batches as accepted', () => {
  const accepted = PRESENTATION_CAPABILITIES.filter(({ status }) => status === 'ACCEPTED_LOCAL');
  assert.deepEqual(accepted.map(({ id }) => id), ['corporate-intake', 'corporate-escrow']);
  assert.ok(accepted.every(({ evidence }) => evidence.startsWith('Batch 3.')));
});

test('notary, e-KYC, provider initiation, and production remain fail-closed', () => {
  const statusById = new Map(PRESENTATION_CAPABILITIES.map(({ id, status }) => [id, status]));
  assert.equal(statusById.get('notary-workspace'), 'FUTURE_WORK');
  assert.equal(statusById.get('ekyc-signing'), 'FUTURE_WORK');
  assert.equal(statusById.get('provider-initiation'), 'BLOCKED');
  assert.equal(statusById.get('production-readiness'), 'NOT_STARTED');
});

test('presentation copy does not claim production readiness', () => {
  const serialized = JSON.stringify(PRESENTATION_CAPABILITIES).toLowerCase();
  assert.equal(serialized.includes('production-ready'), false);
  assert.equal(serialized.includes('implemented end-to-end'), false);
});