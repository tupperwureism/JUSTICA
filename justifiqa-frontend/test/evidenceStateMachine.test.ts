import assert from 'node:assert/strict';
import test from 'node:test';
import {
  prepareEvidence,
  uploadEvidence,
  finalizeEvidence,
  parseEvidenceFinalizeData,
  parseEvidencePrepareData,
  CorporateEvidenceError,
} from '../src/services/corporateEvidenceService.ts';
import type { EvidenceGateway } from '../src/services/corporateEvidenceService.ts';

const EVIDENCE_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const IDEMPOTENCY_KEY = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const OBJECT_PATH = 'evidence/row/file.pdf';
const CANONICAL_OBJECT_PATH = `${IDEMPOTENCY_KEY}/${EVIDENCE_ID}/source.pdf`;

class CountingGateway implements EvidenceGateway {
  public prepareCalls = 0;
  public uploadCalls = 0;
  public finalizeCalls = 0;
  public prepareError: string | null = null;
  public uploadError: string | null = null;
  public finalizeError: string | null = null;
  async prepare(input: {
    evidenceId: string;
    idempotencyKey: string;
    declaredMime: string;
    declaredByteSize: number;
  }): Promise<{ objectPath: string }> {
    this.prepareCalls += 1;
    if (this.prepareError) {
      throw new CorporateEvidenceError('prepare', this.prepareError, 'prepare fail');
    }
    assert.equal(input.evidenceId, EVIDENCE_ID);
    assert.equal(input.idempotencyKey, IDEMPOTENCY_KEY);
    return { objectPath: OBJECT_PATH };
  }
  async upload(input: { objectPath: string; file: File; contentType: string }): Promise<void> {
    this.uploadCalls += 1;
    if (this.uploadError) {
      throw new CorporateEvidenceError('upload', this.uploadError, 'upload fail');
    }
    assert.equal(input.objectPath, OBJECT_PATH);
  }
  async finalize(input: {
    evidenceId: string;
    idempotencyKey: string;
  }): Promise<{ evidenceReference: string }> {
    this.finalizeCalls += 1;
    if (this.finalizeError) {
      throw new CorporateEvidenceError('finalize', this.finalizeError, 'finalize fail');
    }
    assert.equal(input.evidenceId, EVIDENCE_ID);
    assert.equal(input.idempotencyKey, IDEMPOTENCY_KEY);
    return { evidenceReference: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' };
  }
}

function makeFile(): File {
  return new File(['bytes'], 'ktp.pdf', { type: 'application/pdf' });
}

test('evidence prepare failure retry uses same evidenceId and idempotencyKey and prepares twice', async () => {
  const gateway = new CountingGateway();
  gateway.prepareError = 'PREPARE_FAILED';
  await assert.rejects(
    prepareEvidence(gateway, {
      evidenceId: EVIDENCE_ID,
      idempotencyKey: IDEMPOTENCY_KEY,
      declaredMime: 'application/pdf',
      declaredByteSize: makeFile().size,
    }),
    (e) => e instanceof CorporateEvidenceError && e.step === 'prepare',
  );
  assert.equal(gateway.prepareCalls, 1);
  assert.equal(gateway.uploadCalls, 0);
  assert.equal(gateway.finalizeCalls, 0);

  gateway.prepareError = null;
  const objectPath = await prepareEvidence(gateway, {
    evidenceId: EVIDENCE_ID,
    idempotencyKey: IDEMPOTENCY_KEY,
    declaredMime: 'application/pdf',
    declaredByteSize: makeFile().size,
  });
  assert.equal(gateway.prepareCalls, 2);
  assert.equal(gateway.uploadCalls, 0);
  assert.equal(gateway.finalizeCalls, 0);
  assert.equal(objectPath.objectPath, OBJECT_PATH);

  await uploadEvidence(gateway, { objectPath: OBJECT_PATH, file: makeFile(), contentType: 'application/pdf' });
  await finalizeEvidence(gateway, { evidenceId: EVIDENCE_ID, idempotencyKey: IDEMPOTENCY_KEY });

  assert.equal(gateway.prepareCalls, 2);
  assert.equal(gateway.uploadCalls, 1);
  assert.equal(gateway.finalizeCalls, 1);
});

test('evidence upload failure retry only retries upload; prepare once, finalize after upload', async () => {
  const gateway = new CountingGateway();
  await prepareEvidence(gateway, {
    evidenceId: EVIDENCE_ID,
    idempotencyKey: IDEMPOTENCY_KEY,
    declaredMime: 'application/pdf',
    declaredByteSize: makeFile().size,
  });
  assert.equal(gateway.prepareCalls, 1);

  gateway.uploadError = 'STORAGE_FAILED';
  await assert.rejects(
    uploadEvidence(gateway, { objectPath: OBJECT_PATH, file: makeFile(), contentType: 'application/pdf' }),
    (e) => e instanceof CorporateEvidenceError && e.step === 'upload',
  );
  assert.equal(gateway.prepareCalls, 1);
  assert.equal(gateway.uploadCalls, 1);
  assert.equal(gateway.finalizeCalls, 0);

  gateway.uploadError = null;
  await uploadEvidence(gateway, { objectPath: OBJECT_PATH, file: makeFile(), contentType: 'application/pdf' });
  assert.equal(gateway.prepareCalls, 1);
  assert.equal(gateway.uploadCalls, 2);
  assert.equal(gateway.finalizeCalls, 0);

  await finalizeEvidence(gateway, { evidenceId: EVIDENCE_ID, idempotencyKey: IDEMPOTENCY_KEY });
  assert.equal(gateway.prepareCalls, 1);
  assert.equal(gateway.uploadCalls, 2);
  assert.equal(gateway.finalizeCalls, 1);
});

test('evidence finalize failure retry only retries finalize; prepare once, upload once', async () => {
  const gateway = new CountingGateway();
  await prepareEvidence(gateway, {
    evidenceId: EVIDENCE_ID,
    idempotencyKey: IDEMPOTENCY_KEY,
    declaredMime: 'application/pdf',
    declaredByteSize: makeFile().size,
  });
  await uploadEvidence(gateway, { objectPath: OBJECT_PATH, file: makeFile(), contentType: 'application/pdf' });
  assert.equal(gateway.prepareCalls, 1);
  assert.equal(gateway.uploadCalls, 1);

  gateway.finalizeError = 'FINALIZE_FAILED';
  await assert.rejects(
    finalizeEvidence(gateway, { evidenceId: EVIDENCE_ID, idempotencyKey: IDEMPOTENCY_KEY }),
    (e) => e instanceof CorporateEvidenceError && e.step === 'finalize',
  );
  assert.equal(gateway.prepareCalls, 1);
  assert.equal(gateway.uploadCalls, 1);
  assert.equal(gateway.finalizeCalls, 1);

  gateway.finalizeError = null;
  const result = await finalizeEvidence(gateway, {
    evidenceId: EVIDENCE_ID,
    idempotencyKey: IDEMPOTENCY_KEY,
  });
  assert.equal(gateway.prepareCalls, 1);
  assert.equal(gateway.uploadCalls, 1);
  assert.equal(gateway.finalizeCalls, 2);
  assert.equal(result.evidenceReference, 'cccccccc-cccc-4ccc-8ccc-cccccccccccc');
});

test('successful evidence response bodies are validated at runtime', () => {
  assert.deepEqual(
    parseEvidencePrepareData({ evidenceId: EVIDENCE_ID, objectPath: CANONICAL_OBJECT_PATH }, EVIDENCE_ID),
    { objectPath: CANONICAL_OBJECT_PATH },
  );
  assert.equal(parseEvidencePrepareData({ evidenceId: EVIDENCE_ID, objectPath: {} }, EVIDENCE_ID), null);
  assert.equal(parseEvidencePrepareData({ evidenceId: EVIDENCE_ID, objectPath: '   ' }, EVIDENCE_ID), null);
  assert.equal(parseEvidencePrepareData({ evidenceId: EVIDENCE_ID, objectPath: '../foreign/source.pdf' }, EVIDENCE_ID), null);
  assert.equal(parseEvidencePrepareData({
    evidenceId: IDEMPOTENCY_KEY,
    objectPath: `${EVIDENCE_ID}/${IDEMPOTENCY_KEY}/source.pdf`,
  }, EVIDENCE_ID), null);
  assert.deepEqual(
    parseEvidenceFinalizeData({ evidenceReference: EVIDENCE_ID }, EVIDENCE_ID),
    { evidenceReference: EVIDENCE_ID },
  );
  assert.equal(parseEvidenceFinalizeData({ evidenceReference: {} }, EVIDENCE_ID), null);
  assert.equal(parseEvidenceFinalizeData({ evidenceReference: 'not-a-uuid' }, EVIDENCE_ID), null);
  assert.equal(parseEvidenceFinalizeData({ evidenceReference: IDEMPOTENCY_KEY }, EVIDENCE_ID), null);
  assert.equal(parseEvidenceFinalizeData({ evidenceReference: EVIDENCE_ID.toUpperCase() }, EVIDENCE_ID), null);
});
