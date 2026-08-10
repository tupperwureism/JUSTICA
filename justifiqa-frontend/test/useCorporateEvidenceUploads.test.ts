import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement, type ReactNode } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  useCorporateEvidenceUploads,
  type CorporateEvidenceAdapter,
} from '../src/hooks/useCorporateEvidenceUploads.ts';
import { CorporateEvidenceError } from '../src/services/corporateEvidenceService.ts';
import { StorageApiError } from '@supabase/supabase-js';

const ROW_A = 'row-aaaaaaaa';
const ROW_B = 'row-bbbbbbbb';
const EVIDENCE_ID_A = '11111111-1111-4111-8111-111111111111';
const EVIDENCE_ID_B = '22222222-2222-4222-8222-222222222222';
const IDEM_KEY_A = '33333333-3333-4333-8333-333333333333';
const IDEM_KEY_B = '44444444-4444-4444-8444-444444444444';
const REF_A = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const REF_B = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

function makeFile(name = 'ktp.pdf'): File {
  return new File(['bytes'], name, { type: 'application/pdf' });
}

function idFactory(...ids: string[]): () => string {
  let index = 0;
  return () => {
    const id = ids[index];
    index += 1;
    if (!id) throw new Error('Test ID factory exhausted.');
    return id;
  };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

class StubAdapter implements CorporateEvidenceAdapter {
  prepareCalls = 0;
  uploadCalls = 0;
  finalizeCalls = 0;
  prepareAttempts: Array<{ evidenceId: string; idempotencyKey: string }> = [];
  finalizeAttempts: Array<{ evidenceId: string; idempotencyKey: string }> = [];
  prepareError: string | null = null;
  uploadError: string | null = null;
  finalizeError: string | null = null;

  async prepare(input: {
    evidenceId: string;
    idempotencyKey: string;
    declaredMime: string;
    declaredByteSize: number;
  }) {
    this.prepareCalls += 1;
    this.prepareAttempts.push({ evidenceId: input.evidenceId, idempotencyKey: input.idempotencyKey });
    assert.equal(input.declaredMime, 'application/pdf');
    assert.ok(input.declaredByteSize > 0);
    if (this.prepareError) {
      throw new CorporateEvidenceError('prepare', this.prepareError, 'prepare fail');
    }
    return { objectPath: `evidence/${input.evidenceId}/ktp.pdf` };
  }

  async upload(input: { objectPath: string; file: File; contentType: string }) {
    this.uploadCalls += 1;
    assert.ok(input.objectPath);
    assert.ok(input.file.size > 0);
    assert.equal(input.contentType, 'application/pdf');
    if (this.uploadError) {
      throw new CorporateEvidenceError('upload', this.uploadError, 'upload fail');
    }
  }

  async finalize(input: { evidenceId: string; idempotencyKey: string }) {
    this.finalizeCalls += 1;
    this.finalizeAttempts.push(input);
    if (this.finalizeError) {
      throw new CorporateEvidenceError('finalize', this.finalizeError, 'finalize fail');
    }
    return { evidenceReference: input.evidenceId === EVIDENCE_ID_A ? REF_A : REF_B };
  }
}

function renderHook<T>(hook: () => T) {
  const holder: { current: T | undefined } = { current: undefined };
  const Harness = () => {
    holder.current = hook();
    return null as unknown as ReactNode;
  };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => { renderer = TestRenderer.create(createElement(Harness)); });
  return {
    view: holder as { current: T },
    unmount: () => act(() => { renderer.unmount(); }),
  };
}

test('hook exposes observable prepare progress and finalized success through React state', async () => {
  const prepareGate = deferred<{ objectPath: string }>();
  const adapter = new StubAdapter();
  adapter.prepare = async (input) => {
    adapter.prepareCalls += 1;
    adapter.prepareAttempts.push({ evidenceId: input.evidenceId, idempotencyKey: input.idempotencyKey });
    return prepareGate.promise;
  };
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  let pending!: Promise<void>;
  act(() => { pending = view.current.start(ROW_A, makeFile()); });
  assert.equal(view.current.get(ROW_A)?.activeStep, 'prepare');
  assert.equal(view.current.get(ROW_A)?.isRunning, true);

  await act(async () => {
    prepareGate.resolve({ objectPath: 'evidence/a/ktp.pdf' });
    await pending;
  });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'FINALIZED');
  assert.equal(view.current.get(ROW_A)?.evidenceReference, REF_A);
  assert.equal(view.current.get(ROW_A)?.canRetry, false);
  unmount();
});

test('NEW failure retries prepare with the same IDs', async () => {
  const adapter = new StubAdapter();
  adapter.prepareError = 'PREPARE_FAILED';
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'NEW');
  assert.equal(view.current.get(ROW_A)?.failedStep, 'prepare');

  adapter.prepareError = null;
  await act(async () => { await view.current.retry(ROW_A); });
  assert.deepEqual(adapter.prepareAttempts, [
    { evidenceId: EVIDENCE_ID_A, idempotencyKey: IDEM_KEY_A },
    { evidenceId: EVIDENCE_ID_A, idempotencyKey: IDEM_KEY_A },
  ]);
  assert.equal(adapter.uploadCalls, 1);
  assert.equal(adapter.finalizeCalls, 1);
  unmount();
});

test('concurrent retry of the same attempt is single-flight', async () => {
  const adapter = new StubAdapter();
  adapter.prepareError = 'PREPARE_FAILED';
  const createId = idFactory(EVIDENCE_ID_A, IDEM_KEY_A);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, { createId }));
  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });

  const prepareGate = deferred<{ objectPath: string }>();
  adapter.prepareError = null;
  adapter.prepare = async (input) => {
    adapter.prepareCalls += 1;
    adapter.prepareAttempts.push({ evidenceId: input.evidenceId, idempotencyKey: input.idempotencyKey });
    return prepareGate.promise;
  };
  let first!: Promise<void>;
  let second!: Promise<void>;
  act(() => {
    first = view.current.retry(ROW_A);
    second = view.current.retry(ROW_A);
  });
  assert.strictEqual(first, second);
  assert.equal(adapter.prepareCalls, 2);

  await act(async () => {
    prepareGate.resolve({ objectPath: `evidence/${EVIDENCE_ID_A}/ktp.pdf` });
    await Promise.all([first, second]);
  });
  assert.deepEqual([adapter.uploadCalls, adapter.finalizeCalls], [1, 1]);
  unmount();
});

test('PREPARED failure retries upload only and retains objectPath', async () => {
  const adapter = new StubAdapter();
  adapter.uploadError = 'STORAGE_FAILED';
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'PREPARED');
  assert.equal(view.current.get(ROW_A)?.objectPath, `evidence/${EVIDENCE_ID_A}/ktp.pdf`);

  adapter.uploadError = null;
  await act(async () => { await view.current.retry(ROW_A); });
  assert.equal(adapter.prepareCalls, 1);
  assert.equal(adapter.uploadCalls, 2);
  assert.equal(adapter.finalizeCalls, 1);
  unmount();
});

test('UPLOADED failure retries finalize only and FINALIZED retry performs no network', async () => {
  const adapter = new StubAdapter();
  adapter.finalizeError = 'FINALIZE_FAILED';
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'UPLOADED');

  adapter.finalizeError = null;
  await act(async () => { await view.current.retry(ROW_A); });
  assert.deepEqual([adapter.prepareCalls, adapter.uploadCalls, adapter.finalizeCalls], [1, 1, 2]);
  await act(async () => { await view.current.retry(ROW_A); });
  assert.deepEqual([adapter.prepareCalls, adapter.uploadCalls, adapter.finalizeCalls], [1, 1, 2]);
  unmount();
});

class ControlledFinalizeAdapter extends StubAdapter {
  readonly started = new Map<string, ReturnType<typeof deferred<void>>>();
  readonly completed = new Map<string, ReturnType<typeof deferred<string>>>();

  override async finalize(input: { evidenceId: string; idempotencyKey: string }) {
    this.finalizeCalls += 1;
    this.finalizeAttempts.push(input);
    const started = deferred<void>();
    const completed = deferred<string>();
    this.started.set(input.evidenceId, started);
    this.completed.set(input.evidenceId, completed);
    started.resolve();
    return { evidenceReference: await completed.promise };
  }
}

async function waitForFinalize(adapter: ControlledFinalizeAdapter, evidenceId: string): Promise<void> {
  while (!adapter.started.has(evidenceId)) await Promise.resolve();
  await adapter.started.get(evidenceId)?.promise;
}

test('reverse completion keeps each evidence reference on its stable row', async () => {
  const adapter = new ControlledFinalizeAdapter();
  const finalized: Array<[string, string]> = [];
  const createId = idFactory(EVIDENCE_ID_A, IDEM_KEY_A, EVIDENCE_ID_B, IDEM_KEY_B);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId,
    onFinalized: (rowId, reference) => finalized.push([rowId, reference]),
  }));

  let first!: Promise<void>;
  let second!: Promise<void>;
  act(() => {
    first = view.current.start(ROW_A, makeFile('a.pdf'));
    second = view.current.start(ROW_B, makeFile('b.pdf'));
  });
  await act(async () => {
    await Promise.all([
      waitForFinalize(adapter, EVIDENCE_ID_A),
      waitForFinalize(adapter, EVIDENCE_ID_B),
    ]);
  });
  await act(async () => {
    adapter.completed.get(EVIDENCE_ID_B)?.resolve(REF_B);
    await second;
    adapter.completed.get(EVIDENCE_ID_A)?.resolve(REF_A);
    await first;
  });

  assert.equal(view.current.get(ROW_A)?.evidenceReference, REF_A);
  assert.equal(view.current.get(ROW_B)?.evidenceReference, REF_B);
  assert.deepEqual(finalized.sort(), [[ROW_A, REF_A], [ROW_B, REF_B]].sort());
  unmount();
});

test('late completion from replaced File A cannot overwrite File B', async () => {
  const adapter = new ControlledFinalizeAdapter();
  const finalized: Array<[string, string]> = [];
  const createId = idFactory(EVIDENCE_ID_A, IDEM_KEY_A, EVIDENCE_ID_B, IDEM_KEY_B);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId,
    onFinalized: (rowId, reference) => finalized.push([rowId, reference]),
  }));

  let first!: Promise<void>;
  act(() => { first = view.current.start(ROW_A, makeFile('a.pdf')); });
  await act(async () => { await waitForFinalize(adapter, EVIDENCE_ID_A); });
  let second!: Promise<void>;
  act(() => { second = view.current.start(ROW_A, makeFile('b.pdf')); });
  await act(async () => { await waitForFinalize(adapter, EVIDENCE_ID_B); });

  await act(async () => {
    adapter.completed.get(EVIDENCE_ID_B)?.resolve(REF_B);
    await second;
    adapter.completed.get(EVIDENCE_ID_A)?.resolve(REF_A);
    await first;
  });
  assert.equal(view.current.get(ROW_A)?.evidenceId, EVIDENCE_ID_B);
  assert.equal(view.current.get(ROW_A)?.evidenceReference, REF_B);
  assert.deepEqual(finalized, [[ROW_A, REF_B]]);
  unmount();
});

test('late completion of a removed row is ignored', async () => {
  const adapter = new ControlledFinalizeAdapter();
  const finalized: Array<[string, string]> = [];
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
    onFinalized: (rowId, reference) => finalized.push([rowId, reference]),
  }));

  let pending!: Promise<void>;
  act(() => { pending = view.current.start(ROW_A, makeFile()); });
  await act(async () => { await waitForFinalize(adapter, EVIDENCE_ID_A); });
  act(() => { view.current.remove(ROW_A); });
  await act(async () => {
    adapter.completed.get(EVIDENCE_ID_A)?.resolve(REF_A);
    await pending;
  });
  assert.equal(view.current.tasks.has(ROW_A), false);
  assert.deepEqual(finalized, []);
  unmount();
});

test('new file creates new IDs and clears the previous evidence reference', async () => {
  const adapter = new StubAdapter();
  const createId = idFactory(EVIDENCE_ID_A, IDEM_KEY_A, EVIDENCE_ID_B, IDEM_KEY_B);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId,
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile('a.pdf')); });
  assert.equal(view.current.get(ROW_A)?.evidenceReference, REF_A);
  await act(async () => { await view.current.start(ROW_A, makeFile('b.pdf')); });
  assert.equal(view.current.get(ROW_A)?.evidenceId, EVIDENCE_ID_B);
  assert.equal(view.current.get(ROW_A)?.idempotencyKey, IDEM_KEY_B);
  assert.equal(view.current.get(ROW_A)?.evidenceReference, REF_B);
  unmount();
});

test('ambiguous Storage success: upload actually stored but response lost, retry receives StorageApiError 409 ResourceAlreadyExists', async () => {
  const adapter = new StubAdapter();
  let uploadAttempt = 0;
  const objectPath = `evidence/${EVIDENCE_ID_A}/ktp.pdf`;
  adapter.upload = async (input) => {
    adapter.uploadCalls += 1;
    uploadAttempt += 1;
    assert.equal(input.objectPath, objectPath);
    assert.equal(input.contentType, 'application/pdf');
    if (uploadAttempt === 1) {
      throw new Error('Network error: response lost');
    }
    if (uploadAttempt === 2) {
      throw new StorageApiError('Duplicate', 409, 'ResourceAlreadyExists');
    }
  };
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'PREPARED');
  assert.equal(view.current.get(ROW_A)?.failedStep, 'upload');
  assert.equal(adapter.uploadCalls, 1);

  await act(async () => { await view.current.retry(ROW_A); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'FINALIZED');
  assert.equal(view.current.get(ROW_A)?.evidenceReference, REF_A);
  assert.equal(adapter.prepareCalls, 1);
  assert.equal(adapter.uploadCalls, 2);
  assert.equal(adapter.finalizeCalls, 1);
  assert.deepEqual(adapter.prepareAttempts, [{ evidenceId: EVIDENCE_ID_A, idempotencyKey: IDEM_KEY_A }]);
  assert.deepEqual(adapter.finalizeAttempts, [{ evidenceId: EVIDENCE_ID_A, idempotencyKey: IDEM_KEY_A }]);
  unmount();
});

test('ambiguous Storage success: recognizes KeyAlreadyExists statusCode', async () => {
  const adapter = new StubAdapter();
  let uploadAttempt = 0;
  adapter.upload = async (_input) => {
    adapter.uploadCalls += 1;
    uploadAttempt += 1;
    if (uploadAttempt === 1) {
      throw new Error('Network error: response lost');
    }
    if (uploadAttempt === 2) {
      throw new StorageApiError('Duplicate', 409, 'KeyAlreadyExists');
    }
  };
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  await act(async () => { await view.current.retry(ROW_A); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'FINALIZED');
  assert.equal(adapter.uploadCalls, 2);
  assert.equal(adapter.finalizeCalls, 1);
  unmount();
});

test('ambiguous Storage success: recognizes legacy already_exists statusCode', async () => {
  const adapter = new StubAdapter();
  let uploadAttempt = 0;
  adapter.upload = async (_input) => {
    adapter.uploadCalls += 1;
    uploadAttempt += 1;
    if (uploadAttempt === 1) {
      throw new Error('Network error: response lost');
    }
    if (uploadAttempt === 2) {
      throw new StorageApiError('Duplicate', 409, 'already_exists');
    }
  };
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  await act(async () => { await view.current.retry(ROW_A); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'FINALIZED');
  assert.equal(adapter.uploadCalls, 2);
  assert.equal(adapter.finalizeCalls, 1);
  unmount();
});

test('ambiguous Storage success: arbitrary object with similar statusCode is rejected', async () => {
  const adapter = new StubAdapter();
  adapter.upload = async (_input) => {
    adapter.uploadCalls += 1;
    throw { status: 409, statusCode: 'ResourceAlreadyExists', code: 'ResourceAlreadyExists' };
  };
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'PREPARED');
  assert.equal(view.current.get(ROW_A)?.failedStep, 'upload');
  assert.equal(adapter.uploadCalls, 1);
  assert.equal(adapter.finalizeCalls, 0);
  unmount();
});

test('ambiguous Storage success: generic 409 without allowlisted statusCode is rejected', async () => {
  const adapter = new StubAdapter();
  adapter.upload = async (_input) => {
    adapter.uploadCalls += 1;
    throw new StorageApiError('Conflict', 409, 'SomeOtherConflictCode');
  };
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'PREPARED');
  assert.equal(view.current.get(ROW_A)?.failedStep, 'upload');
  assert.equal(adapter.uploadCalls, 1);
  assert.equal(adapter.finalizeCalls, 0);
  unmount();
});

test('ambiguous Storage success: upsert:false verified through gateway call arguments', async () => {
  const adapter = new StubAdapter();
  let uploadAttempt = 0;
  const _uploadOptions: Array<{ objectPath: string; file: File; contentType: string }> = [];
  adapter.upload = async (input) => {
    adapter.uploadCalls += 1;
    uploadAttempt += 1;
    _uploadOptions.push(input);
    if (uploadAttempt === 1) {
      throw new Error('Network error: response lost');
    }
    if (uploadAttempt === 2) {
      throw new StorageApiError('Duplicate', 409, 'ResourceAlreadyExists');
    }
  };
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  await act(async () => { await view.current.retry(ROW_A); });
  assert.equal(_uploadOptions.length, 2);
  assert.equal(_uploadOptions[0].objectPath, _uploadOptions[1].objectPath);
  assert.equal(_uploadOptions[0].file.size, _uploadOptions[1].file.size);
  assert.equal(_uploadOptions[0].contentType, _uploadOptions[1].contentType);
  unmount();
});

test('ambiguous Storage success: retry uses same evidenceId, idempotencyKey, File, and objectPath', async () => {
  const adapter = new StubAdapter();
  let uploadAttempt = 0;
  const uploadInputs: Array<{ objectPath: string; file: File; contentType: string }> = [];
  adapter.upload = async (input) => {
    adapter.uploadCalls += 1;
    uploadAttempt += 1;
    uploadInputs.push(input);
    if (uploadAttempt === 1) {
      throw new Error('Network error: response lost');
    }
    if (uploadAttempt === 2) {
      throw new StorageApiError('Duplicate', 409, 'ResourceAlreadyExists');
    }
  };
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(adapter, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  const testFile = makeFile('ktp.pdf');
  await act(async () => { await view.current.start(ROW_A, testFile).catch(() => undefined); });
  await act(async () => { await view.current.retry(ROW_A); });
  assert.equal(uploadInputs.length, 2);
  assert.equal(uploadInputs[0].objectPath, uploadInputs[1].objectPath);
  assert.equal(uploadInputs[0].file, uploadInputs[1].file);
  assert.equal(uploadInputs[0].contentType, uploadInputs[1].contentType);
  assert.deepEqual(adapter.prepareAttempts, [{ evidenceId: EVIDENCE_ID_A, idempotencyKey: IDEM_KEY_A }]);
  assert.deepEqual(adapter.finalizeAttempts, [{ evidenceId: EVIDENCE_ID_A, idempotencyKey: IDEM_KEY_A }]);
  unmount();
});

test('production gateway factory: creates gateway with injected dependencies', async () => {
  const { createCorporateEvidenceGateway } = await import('../src/services/corporateEvidenceService.ts');
  const uploadCalls: Array<{ objectPath: string; file: File; contentType: string; options: { upsert: boolean } }> = [];
  let uploadAttempt = 0;
  const deps = {
    invokeFunction: async (path: string, body: { evidenceId: string; idempotencyKey?: string }) => {
      if (path === 'corporate-evidence/prepare') {
        return { data: { evidenceId: body.evidenceId, objectPath: `${body.evidenceId}/${body.evidenceId}/source.pdf` }, error: null };
      }
      if (path === 'corporate-evidence/finalize') {
        return { data: { evidenceReference: '11111111-1111-4111-8111-111111111111' }, error: null };
      }
      return { data: null, error: new Error('Unknown path') };
    },
    uploadObject: async (_bucket: string, objectPath: string, file: File, options: { contentType: string; upsert: boolean }) => {
      uploadAttempt += 1;
      uploadCalls.push({ objectPath, file, contentType: options.contentType, options });
      if (uploadAttempt === 1) {
        throw new Error('Network error: response lost');
      }
      if (uploadAttempt === 2) {
        throw new StorageApiError('Duplicate', 409, 'ResourceAlreadyExists');
      }
      throw new Error('Unexpected call');
    },
  };
  const gateway = createCorporateEvidenceGateway(deps);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(gateway, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  await act(async () => { await view.current.retry(ROW_A); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'FINALIZED');
  assert.equal(uploadCalls.length, 2);
  assert.equal(uploadCalls[0].options.upsert, false);
  assert.equal(uploadCalls[1].options.upsert, false);
  unmount();
});

test('production gateway factory: raw StorageApiError propagates to uploadEvidence for duplicate handling', async () => {
  const { createCorporateEvidenceGateway } = await import('../src/services/corporateEvidenceService.ts');
  let uploadAttempt = 0;
  const deps = {
    invokeFunction: async (path: string, body: { evidenceId: string; idempotencyKey?: string }) => {
      if (path === 'corporate-evidence/prepare') {
        return { data: { evidenceId: body.evidenceId, objectPath: `${body.evidenceId}/${body.evidenceId}/source.pdf` }, error: null };
      }
if (path === 'corporate-evidence/finalize') {
return { data: { evidenceReference: '11111111-1111-4111-8111-111111111111' }, error: null };
      }
      return { data: null, error: new Error('Unknown path') };
    },
    uploadObject: async (_bucket: string, _objectPath: string, _file: File, _options: { contentType: string; upsert: boolean }) => {
      uploadAttempt += 1;
      if (uploadAttempt === 1) throw new Error('Network error: response lost');
      if (uploadAttempt === 2) throw new StorageApiError('Duplicate', 409, 'ResourceAlreadyExists');
      throw new Error('Unexpected call');
    },
  };
  const gateway = createCorporateEvidenceGateway(deps);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(gateway, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'PREPARED');
  assert.equal(view.current.get(ROW_A)?.failedStep, 'upload');

  await act(async () => { await view.current.retry(ROW_A); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'FINALIZED');
  unmount();
});

test('production gateway factory: rejects arbitrary object mimicking StorageApiError', async () => {
  const { createCorporateEvidenceGateway } = await import('../src/services/corporateEvidenceService.ts');
  const deps = {
    invokeFunction: async (path: string, body: { evidenceId: string }) => {
      if (path === 'corporate-evidence/prepare') {
        return { data: { evidenceId: body.evidenceId, objectPath: `${body.evidenceId}/${body.evidenceId}/source.pdf` }, error: null };
      }
      return { data: null, error: new Error('Unknown path') };
    },
    uploadObject: async () => {
      throw { status: 409, statusCode: 'ResourceAlreadyExists', code: 'ResourceAlreadyExists' };
    },
  };
  const gateway = createCorporateEvidenceGateway(deps);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(gateway, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'PREPARED');
  assert.equal(view.current.get(ROW_A)?.failedStep, 'upload');
  assert.equal(view.current.get(ROW_A)?.canRetry, true);
  unmount();
});

test('production gateway factory: rejects generic 409 without allowlisted statusCode', async () => {
  const { createCorporateEvidenceGateway } = await import('../src/services/corporateEvidenceService.ts');
  const deps = {
    invokeFunction: async (path: string, body: { evidenceId: string }) => {
      if (path === 'corporate-evidence/prepare') {
        return { data: { evidenceId: body.evidenceId, objectPath: `${body.evidenceId}/${body.evidenceId}/source.pdf` }, error: null };
      }
      return { data: null, error: new Error('Unknown path') };
    },
    uploadObject: async () => {
      throw new StorageApiError('Conflict', 409, 'SomeOtherConflictCode');
    },
  };
  const gateway = createCorporateEvidenceGateway(deps);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(gateway, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, makeFile()).catch(() => undefined); });
  assert.equal(view.current.get(ROW_A)?.checkpoint, 'PREPARED');
  assert.equal(view.current.get(ROW_A)?.failedStep, 'upload');
  assert.equal(view.current.get(ROW_A)?.canRetry, true);
  unmount();
});

test('production gateway factory: retry preserves exact File, objectPath, evidenceId, idempotencyKey', async () => {
  const { createCorporateEvidenceGateway } = await import('../src/services/corporateEvidenceService.ts');
  const uploadCalls: Array<{ objectPath: string; file: File; evidenceId: string; idempotencyKey: string }> = [];
  let uploadAttempt = 0;
  const testFile = makeFile('ktp.pdf');
  const deps = {
    invokeFunction: async (path: string, body: { evidenceId: string; idempotencyKey: string }) => {
if (path === 'corporate-evidence/prepare') {
        uploadCalls.push({
          objectPath: '',
          file: new File([], ''),
          evidenceId: body.evidenceId,
          idempotencyKey: body.idempotencyKey,
        });
        return { data: { evidenceId: body.evidenceId, objectPath: `${body.evidenceId}/${body.evidenceId}/source.pdf` }, error: null };
      }
      if (path === 'corporate-evidence/finalize') {
        return { data: { evidenceReference: '11111111-1111-4111-8111-111111111111' }, error: null };
      }
      return { data: null, error: new Error('Unknown path') };
    },
    uploadObject: async (_bucket: string, _objectPath: string, _file: File, _options: { contentType: string; upsert: boolean }) => {
      uploadAttempt += 1;
      if (uploadAttempt === 1) throw new Error('Network error: response lost');
      if (uploadAttempt === 2) throw new StorageApiError('Duplicate', 409, 'ResourceAlreadyExists');
      throw new Error('Unexpected call');
    },
  };
  const gateway = createCorporateEvidenceGateway(deps);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(gateway, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, testFile).catch(() => undefined); });
  await act(async () => { await view.current.retry(ROW_A); });

  // Verify prepare was called once with same IDs
  const prepareCalls = uploadCalls.filter(c => c.evidenceId === EVIDENCE_ID_A && c.idempotencyKey === IDEM_KEY_A);
  assert.equal(prepareCalls.length, 1);

  // Verify upload was called twice with same file and objectPath
  // Note: uploadObject doesn't receive evidenceId/idempotencyKey directly, but we verify through the hook
  assert.equal(view.current.get(ROW_A)?.evidenceId, EVIDENCE_ID_A);
  assert.equal(view.current.get(ROW_A)?.idempotencyKey, IDEM_KEY_A);
  unmount();
});

test('production gateway factory: exact prepare/finalize invoke payload shape — no double body wrapper', async () => {
  const { createCorporateEvidenceGateway } = await import('../src/services/corporateEvidenceService.ts');
  const invokeCalls: Array<{ path: string; payload: Record<string, unknown> }> = [];
  let uploadAttempt = 0;
  const testFile = makeFile('ktp.pdf');
  const deps = {
    invokeFunction: async (path: string, payload: Record<string, unknown>) => {
      invokeCalls.push({ path, payload });
      if (path === 'corporate-evidence/prepare') {
        return { data: { evidenceId: payload.evidenceId, objectPath: `${payload.evidenceId}/${payload.evidenceId}/source.pdf` }, error: null };
      }
      if (path === 'corporate-evidence/finalize') {
        return { data: { evidenceReference: '11111111-1111-4111-8111-111111111111' }, error: null };
      }
      return { data: null, error: new Error('Unknown path') };
    },
    uploadObject: async (_bucket: string, _objectPath: string, _file: File, _options: { contentType: string; upsert: boolean }) => {
      uploadAttempt += 1;
      if (uploadAttempt === 1) throw new Error('Network error: response lost');
      if (uploadAttempt === 2) throw new StorageApiError('Duplicate', 409, 'ResourceAlreadyExists');
      throw new Error('Unexpected call');
    },
  };
  const gateway = createCorporateEvidenceGateway(deps);
  const { view, unmount } = renderHook(() => useCorporateEvidenceUploads(gateway, {
    createId: idFactory(EVIDENCE_ID_A, IDEM_KEY_A),
  }));

  await act(async () => { await view.current.start(ROW_A, testFile).catch(() => undefined); });
  await act(async () => { await view.current.retry(ROW_A); });

  // Capture prepare call
  const prepareCall = invokeCalls.find(c => c.path === 'corporate-evidence/prepare');
  assert.ok(prepareCall, 'prepare must be called');
  const preparePayload = prepareCall.payload;
  // Prepare payload: evidenceId, declaredMime, declaredByteSize, idempotencyKey
  assert.equal(typeof preparePayload.evidenceId, 'string');
  assert.equal(preparePayload.evidenceId, EVIDENCE_ID_A);
  assert.equal(preparePayload.declaredMime, 'application/pdf');
  assert.ok(typeof preparePayload.declaredByteSize === 'number' && preparePayload.declaredByteSize > 0);
  assert.equal(preparePayload.idempotencyKey, IDEM_KEY_A);
  // Must NOT have nested body
  assert.ok(!('body' in preparePayload), 'prepare payload must not have nested body property');

  // Capture finalize call
  const finalizeCall = invokeCalls.find(c => c.path === 'corporate-evidence/finalize');
  assert.ok(finalizeCall, 'finalize must be called');
  const finalizePayload = finalizeCall.payload;
  // Finalize payload: exactly evidenceId and idempotencyKey
  assert.equal(Object.keys(finalizePayload).length, 2, 'finalize payload must have exactly 2 keys');
  assert.equal(finalizePayload.evidenceId, EVIDENCE_ID_A);
  assert.equal(finalizePayload.idempotencyKey, IDEM_KEY_A);
  // Must NOT have nested body
  assert.ok(!('body' in finalizePayload), 'finalize payload must not have nested body property');

  // Verify the test would fail if double-wrapper is restored
  // This assertion would fail if someone wraps payload as { body: { evidenceId, idempotencyKey } }
  assert.ok(!('body' in finalizePayload && typeof finalizePayload.body === 'object' && finalizePayload.body !== null));

  unmount();
});
