import assert from 'node:assert/strict';
import test from 'node:test';
import { Phase2IntegrationError } from '../src/services/phase2IntegrationService.ts';
import {
  createSingleFlightMutation,
  initialPhase2MutationState,
  phase2MutationReducer,
  safePhase2MutationError,
} from '../src/hooks/phase2MutationState.ts';

test('mutation reducer exposes loading, success, error, and reset states', () => {
  const loading = phase2MutationReducer(initialPhase2MutationState, { type: 'start' });
  assert.deepEqual(loading, { status: 'loading', data: null, error: null });

  const success = phase2MutationReducer(loading, { type: 'success', data: { replayed: true } });
  assert.deepEqual(success, {
    status: 'success',
    data: { replayed: true },
    error: null,
  });

  const failed = phase2MutationReducer(loading, { type: 'error', error: 'Coba kembali.' });
  assert.deepEqual(failed, { status: 'error', data: null, error: 'Coba kembali.' });
  assert.deepEqual(
    phase2MutationReducer(failed, { type: 'reset' }),
    initialPhase2MutationState,
  );
});

test('single-flight mutation returns the same promise and runs once while loading', async () => {
  let calls = 0;
  let release: (() => void) | undefined;
  const run = createSingleFlightMutation(async (value: string) => {
    calls += 1;
    if (calls === 1) {
      await new Promise<void>((resolve) => {
        release = resolve;
      });
    }
    return value.toUpperCase();
  });

  const first = run('aman');
  const duplicate = run('diabaikan');
  assert.equal(first, duplicate);
  assert.equal(calls, 1);
  release?.();
  assert.equal(await first, 'AMAN');
  assert.equal(await run('ulang'), 'ULANG');
  assert.equal(calls, 2);
});

test('mutation errors expose approved messages and hide raw backend details', () => {
  assert.equal(
    safePhase2MutationError(new Phase2IntegrationError('SESSION_REQUIRED')),
    'Sesi Anda tidak tersedia. Silakan masuk kembali lalu coba ulang.',
  );
  assert.equal(
    safePhase2MutationError(new Error('duplicate key includes private tenant id')),
    'Permintaan gagal diproses. Silakan coba kembali.',
  );
});
