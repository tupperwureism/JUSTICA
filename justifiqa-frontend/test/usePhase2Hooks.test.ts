import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Phase2IntegrationError } from '../src/services/phase2IntegrationService.ts';
import { usePhase2Mutation } from '../src/hooks/usePhase2Mutation.ts';
import { usePhase2Query } from '../src/hooks/usePhase2Query.ts';

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

test('usePhase2Mutation retry uses exact same input (stable attempt identity)', async () => {
  const capturedInputs: string[] = [];
  let view!: ReturnType<typeof usePhase2Mutation<string, string>>;
  const Harness = () => {
    view = usePhase2Mutation(async (value: string) => {
      capturedInputs.push(value);
      if (capturedInputs.length === 1) throw new Phase2IntegrationError('INTAKE_SERVER_UNAVAILABLE');
      return value.toUpperCase();
    });
    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(Harness));
  });

  await act(async () => {
    await assert.rejects(view.execute('attempt-1'));
  });

  await act(async () => {
    assert.equal(await view.retry(), 'ATTEMPT-1');
  });

  // Same input should be used for retry
  assert.equal(capturedInputs.length, 2);
  assert.equal(capturedInputs[0], 'attempt-1');
  assert.equal(capturedInputs[1], 'attempt-1');

  await act(async () => {
    renderer.unmount();
  });
});

test('usePhase2Mutation new execute after error creates new attempt', async () => {
  let calls = 0;
  let view!: ReturnType<typeof usePhase2Mutation<string, string>>;
  const Harness = () => {
    view = usePhase2Mutation(async (value: string) => {
      calls += 1;
      if (calls === 1) throw new Phase2IntegrationError('INTAKE_SERVER_UNAVAILABLE');
      return value.toUpperCase();
    });
    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(Harness));
  });

  await act(async () => {
    await assert.rejects(view.execute('attempt-1'));
  });

  await act(async () => {
    assert.equal(await view.execute('attempt-2'), 'ATTEMPT-2');
  });

  // New execute should use new input
  assert.equal(calls, 2);

  await act(async () => {
    renderer.unmount();
  });
});

test('usePhase2Mutation reset clears retry context and retry after reset fails safely', async () => {
  let view!: ReturnType<typeof usePhase2Mutation<string, string>>;
  const Harness = () => {
    view = usePhase2Mutation(async (value: string) => value.toUpperCase());
    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(Harness));
  });

  await act(async () => {
    assert.equal(await view.execute('before-reset'), 'BEFORE-RESET');
  });

  await act(async () => {
    view.reset();
  });

  // After reset, retry should reject
  await act(async () => {
    await assert.rejects(view.retry(), /Tidak ada permintaan untuk diulang/);
  });

  // But new execute works
  await act(async () => {
    assert.equal(await view.execute('after-reset'), 'AFTER-RESET');
  });

  await act(async () => {
    renderer.unmount();
  });
});

test('usePhase2Mutation single-flight: concurrent exact duplicate returns same promise', async () => {
  let calls = 0;
  let release: (() => void) | undefined;
  let view!: ReturnType<typeof usePhase2Mutation<string, string>>;
  const Harness = () => {
    view = usePhase2Mutation(async (value: string) => {
      calls += 1;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return value.toUpperCase();
    });
    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(Harness));
  });

  let first!: Promise<string>;
  let second!: Promise<string>;
  await act(async () => {
    first = view.execute('same-input');
    second = view.execute('same-input');
    await Promise.resolve();
  });

  assert.equal(first, second);
  assert.equal(calls, 1);

  await act(async () => {
    release?.();
    assert.equal(await first, 'SAME-INPUT');
  });

  await act(async () => {
    renderer.unmount();
  });
});
