import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Phase2IntegrationError } from '../src/services/phase2IntegrationService.ts';
import { usePhase2Mutation } from '../src/hooks/usePhase2Mutation.ts';
import { usePhase2Query } from '../src/hooks/usePhase2Query.ts';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('usePhase2Mutation exposes single-flight loading, success, and invalidation', async () => {
  let release: (() => void) | undefined;
  let calls = 0;
  let invalidations = 0;
  let view!: ReturnType<typeof usePhase2Mutation<string, string>>;

  const mutate = async (value: string) => {
    calls += 1;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return value.toUpperCase();
  };
  const Harness = () => {
    view = usePhase2Mutation(mutate, {
      onSuccess: async () => {
        invalidations += 1;
      },
    });
    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(Harness));
  });

  let first!: Promise<string>;
  let duplicate!: Promise<string>;
  await act(async () => {
    first = view.execute('phase2');
    duplicate = view.execute('ignored');
    await Promise.resolve();
  });
  assert.equal(first, duplicate);
  assert.equal(view.isLoading, true);
  assert.equal(calls, 1);

  await act(async () => {
    release?.();
    assert.equal(await first, 'PHASE2');
  });
  assert.equal(view.status, 'success');
  assert.equal(view.data, 'PHASE2');
  assert.equal(invalidations, 1);

  await act(async () => {
    renderer.unmount();
  });
});

test('usePhase2Query loads, refreshes, and converts backend errors to safe UI state', async () => {
  const results: Array<string | Error> = [
    'first projection',
    'refreshed projection',
    new Error('private tenant detail'),
  ];
  let calls = 0;
  let view!: ReturnType<typeof usePhase2Query<string>>;
  const Harness = () => {
    view = usePhase2Query(async () => {
      const result = results[calls++];
      if (result instanceof Error) throw result;
      return result;
    });
    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(Harness));
  });
  assert.equal(view.isLoading, false);
  assert.equal(view.data, 'first projection');

  await act(async () => {
    assert.equal(await view.refresh(), 'refreshed projection');
  });
  assert.equal(view.data, 'refreshed projection');

  await act(async () => {
    await assert.rejects(view.refresh(), /private tenant detail/);
  });
  assert.equal(view.error, 'Permintaan gagal diproses. Silakan coba kembali.');
  assert.equal(view.data, 'refreshed projection');

  await act(async () => {
    renderer.unmount();
  });
});

test('usePhase2Mutation retains validated input for a safe retry after error', async () => {
  let calls = 0;
  let view!: ReturnType<typeof usePhase2Mutation<string, string>>;
  const Harness = () => {
    view = usePhase2Mutation(async (value: string) => {
      calls += 1;
      if (calls === 1) throw new Phase2IntegrationError('BROWSER_BOUNDARY_UNAVAILABLE');
      return value;
    });
    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(Harness));
  });
  await act(async () => {
    await assert.rejects(
      view.execute('validated payload'),
      (error) => error instanceof Phase2IntegrationError,
    );
  });
  assert.equal(view.status, 'error');
  assert.equal(
    view.error,
    'Tindakan ini memerlukan endpoint server terotorisasi yang belum tersedia untuk browser.',
  );

  await act(async () => {
    assert.equal(await view.retry(), 'validated payload');
  });
  assert.equal(view.status, 'success');
  assert.equal(calls, 2);

  await act(async () => {
    renderer.unmount();
  });
});
