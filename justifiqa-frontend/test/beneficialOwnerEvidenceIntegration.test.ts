import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement, useCallback, useState, type ReactNode } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { useBeneficialOwnerEvidence } from '../src/hooks/useBeneficialOwnerEvidence.ts';
import type { CorporateEvidenceAdapter } from '../src/hooks/useCorporateEvidenceUploads.ts';
import type { BeneficialOwnerDraft } from '../src/models/corporateIntake.ts';
import { CorporateEvidenceError } from '../src/services/corporateEvidenceService.ts';

const ROW_ID = 'row-beneficial-owner';
const EVIDENCE_ID = '11111111-1111-4111-8111-111111111111';
const IDEMPOTENCY_KEY = '22222222-2222-4222-8222-222222222222';
const EVIDENCE_REFERENCE = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test('production BO evidence controller exposes progress, safe error, retry, and draft completion', async () => {
  const firstPrepare = deferred<{ objectPath: string }>();
  let prepareCalls = 0;
  let uploadCalls = 0;
  let finalizeCalls = 0;
  const adapter: CorporateEvidenceAdapter = {
    async prepare() {
      prepareCalls += 1;
      if (prepareCalls === 1) return firstPrepare.promise;
      return { objectPath: 'evidence/owner/ktp.pdf' };
    },
    async upload() { uploadCalls += 1; },
    async finalize() {
      finalizeCalls += 1;
      return { evidenceReference: EVIDENCE_REFERENCE };
    },
  };
  const ids = [EVIDENCE_ID, IDEMPOTENCY_KEY];
  const createId = () => {
    const id = ids.shift();
    if (!id) throw new Error('Test ID factory exhausted.');
    return id;
  };
  let view!: ReturnType<typeof useBeneficialOwnerEvidence> & { owners: BeneficialOwnerDraft[] };
  const Harness = () => {
    const [owners, setOwners] = useState<BeneficialOwnerDraft[]>([{
      clientRowId: ROW_ID,
      naturalPersonName: 'Budi',
      evidenceReference: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      controlBasis: 'OWNERSHIP',
      percentage: '100',
    }]);
    const onChange = useCallback((update: (current: BeneficialOwnerDraft[]) => BeneficialOwnerDraft[]) => {
      setOwners(update);
    }, []);
    view = { owners, ...useBeneficialOwnerEvidence({ adapter, onChange, createId }) };
    return null as unknown as ReactNode;
  };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => { renderer = TestRenderer.create(createElement(Harness)); });

  let initial!: Promise<void>;
  act(() => { initial = view.startFile(ROW_ID, new File(['bytes'], 'ktp.pdf', { type: 'application/pdf' })); });
  assert.equal(view.get(ROW_ID)?.activeStep, 'prepare');
  assert.equal(view.owners[0].evidenceReference, undefined);
  await act(async () => {
    firstPrepare.reject(new CorporateEvidenceError('prepare', 'PREPARE_FAILED', 'Persiapan unggah bukti gagal. Coba ulang.'));
    await initial.catch(() => undefined);
  });
  assert.equal(view.get(ROW_ID)?.failedStep, 'prepare');
  assert.equal(view.get(ROW_ID)?.error, 'Persiapan unggah bukti gagal. Coba ulang.');
  assert.equal(view.get(ROW_ID)?.canRetry, true);

  await act(async () => { await view.retry(ROW_ID); });
  assert.deepEqual([prepareCalls, uploadCalls, finalizeCalls], [2, 1, 1]);
  assert.equal(view.get(ROW_ID)?.checkpoint, 'FINALIZED');
  assert.equal(view.owners[0].evidenceReference, EVIDENCE_REFERENCE);
  act(() => { renderer.unmount(); });
});
