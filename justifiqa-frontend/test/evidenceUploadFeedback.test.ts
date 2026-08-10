import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { EvidenceUploadFeedback } from '../src/components/corporate/EvidenceUploadFeedback.ts';
import type { CorporateEvidenceTaskView } from '../src/hooks/useCorporateEvidenceUploads.ts';

const baseTask: CorporateEvidenceTaskView = {
  clientRowId: 'row-a',
  evidenceId: '11111111-1111-4111-8111-111111111111',
  idempotencyKey: '22222222-2222-4222-8222-222222222222',
  file: new File(['bytes'], 'ktp.pdf', { type: 'application/pdf' }),
  objectPath: null,
  checkpoint: 'NEW',
  activeStep: 'prepare',
  failedStep: null,
  evidenceReference: null,
  error: null,
  isRunning: true,
  canRetry: false,
};

test('production evidence feedback renders accessible progress from hook state', () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(createElement(EvidenceUploadFeedback, { task: baseTask }));
  });
  const status = renderer.root.findByProps({ role: 'status' });
  assert.equal(status.props['aria-live'], 'polite');
  assert.deepEqual(status.findAllByType('li').map((item) => item.children.join('')), [
    'Persiapan',
    'Mengunggah',
    'Menfinalisasi',
  ]);
  assert.equal(status.findAllByType('li')[0].props['aria-current'], 'step');
  assert.equal(status.findAllByType('li')[1].props['aria-current'], undefined);
  act(() => { renderer.unmount(); });
});

test('production evidence feedback renders safe error and retry control', () => {
  let retries = 0;
  const task: CorporateEvidenceTaskView = {
    ...baseTask,
    activeStep: null,
    failedStep: 'prepare',
    error: 'Persiapan unggah bukti gagal. Coba ulang.',
    isRunning: false,
    canRetry: true,
  };
  let renderer!: TestRenderer.ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(createElement(EvidenceUploadFeedback, {
      task,
      retryControl: createElement('button', { type: 'button', onClick: () => { retries += 1; } }, 'Coba lagi'),
    }));
  });
  assert.equal(renderer.root.findByProps({ role: 'alert' }).children.join(''), task.error);
  act(() => { renderer.root.findByType('button').props.onClick(); });
  assert.equal(retries, 1);
  act(() => { renderer.unmount(); });
});
