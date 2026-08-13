import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { CorporateEscrowCheckoutPanel } from '../src/components/corporate/CorporateEscrowCheckoutPanel.tsx';
import {
  createUseClientCorporateIntegration,
  type ClientCorporateIntegrationService,
} from '../src/hooks/useClientCorporateIntegrationFactory.ts';
import {
  Phase2IntegrationError,
  type ClientCorporateWorkspace,
} from '../src/services/phase2IntegrationService.ts';

const CASE_ID = 'b3b00000-0000-4000-8000-000000000001';

const pendingWorkspace: ClientCorporateWorkspace = {
  caseId: CASE_ID,
  orderId: 'b3b00000-0000-4000-8000-000000000002',
  entityName: 'PT Status Kanonik',
  entityType: 'PT_ORDINARY',
  currentStage: 'DRAFT',
  externalReference: null,
  escrow: {
    escrowId: 'b3b00000-0000-4000-8000-000000000003',
    status: 'PENDING_PAYMENT',
    totalAmountIdr: 7_500_000,
    paymentGatewayRef: 'CORP-b3b00000-0000-4000-8000-000000000002',
    fundsLockedAt: null,
  },
};

const heldWorkspace: ClientCorporateWorkspace = {
  ...pendingWorkspace,
  currentStage: 'ESCROW_LOCKED',
  escrow: {
    ...pendingWorkspace.escrow,
    status: 'HELD_IN_ESCROW',
    fundsLockedAt: '2026-08-13T03:30:00.000Z',
  },
};

const renderedText = (node: TestRenderer.ReactTestRendererJSON | TestRenderer.ReactTestRendererJSON[] | null): string => {
  if (!node) return '';
  if (Array.isArray(node)) return node.map(renderedText).join(' ');
  return node.children?.map((child) => (
    typeof child === 'string' ? child : renderedText(child)
  )).join(' ') ?? '';
};

test('escrow panel projects server reference and never treats pending as payment success', async () => {
  let refreshCalls = 0;
  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(CorporateEscrowCheckoutPanel, {
      entityName: pendingWorkspace.entityName,
      amount: pendingWorkspace.escrow.totalAmountIdr,
      paymentReference: pendingWorkspace.escrow.paymentGatewayRef,
      status: pendingWorkspace.escrow.status,
      success: true,
      onRefresh: () => { refreshCalls += 1; },
    }));
  });

  const text = renderedText(renderer.toJSON());
  assert.match(text, /CORP-b3b00000-0000-4000-8000-000000000002/);
  assert.match(text, /belum merupakan keberhasilan pembayaran/i);
  assert.match(text, /Kanal pembayaran sandbox belum dikonfigurasi/);
  assert.doesNotMatch(text, /BLOCKED_BY_PROVIDER_SELECTION/);
  assert.equal(renderer.root.findAll((node) => node.props.role === 'status').length, 1);
  assert.equal(
    renderer.root.find((node) => node.props.role === 'status').props['aria-live'],
    'polite',
  );

  const refreshButton = renderer.root.findAllByType('button')[0];
  await act(async () => {
    refreshButton.props.onClick();
  });
  assert.equal(refreshCalls, 1);

  await act(async () => {
    renderer.unmount();
  });
});

test('escrow panel disables refresh/retry while loading and announces held after canonical refresh', async () => {
  let renderer!: TestRenderer.ReactTestRenderer;
  const baseProps = {
    entityName: pendingWorkspace.entityName,
    amount: pendingWorkspace.escrow.totalAmountIdr,
    paymentReference: pendingWorkspace.escrow.paymentGatewayRef,
    onRefresh: () => undefined,
    onRetry: () => undefined,
  };
  await act(async () => {
    renderer = TestRenderer.create(createElement(CorporateEscrowCheckoutPanel, {
      ...baseProps,
      status: pendingWorkspace.escrow.status,
      loading: true,
      error: 'Status belum dapat dimuat.',
    }));
  });

  const buttons = renderer.root.findAllByType('button');
  assert.equal(buttons[0].props.disabled, true);
  assert.equal(buttons[0].props['aria-busy'], true);
  assert.equal(buttons[1].props.disabled, true);
  assert.equal(renderer.root.findAll((node) => node.props.role === 'alert').length, 1);

  await act(async () => {
    renderer.update(createElement(CorporateEscrowCheckoutPanel, {
      ...baseProps,
      status: heldWorkspace.escrow.status,
      loading: false,
      error: null,
      success: true,
    }));
  });
  assert.match(renderedText(renderer.toJSON()), /berhasil diperbarui/i);
  assert.match(renderedText(renderer.toJSON()), /HELD IN ESCROW/);
  assert.equal(renderer.root.findAll((node) => node.props.role === 'alert').length, 0);

  await act(async () => {
    renderer.unmount();
  });
});

test('corporate escrow retry retains case id and successful settlement refreshes workspace', async () => {
  const refreshCaseIds: string[] = [];
  let workspaceLoads = 0;
  const service = {
    async loadClientCorporateWorkspace() {
      workspaceLoads += 1;
      return workspaceLoads === 1 ? pendingWorkspace : heldWorkspace;
    },
    async submitCorporateIntake() {
      throw new Error('not used');
    },
    async refreshCorporateEscrow(caseId: string) {
      refreshCaseIds.push(caseId);
      if (refreshCaseIds.length === 1) {
        throw new Phase2IntegrationError('RESOURCE_NOT_FOUND');
      }
      return heldWorkspace;
    },
  } satisfies ClientCorporateIntegrationService;
  const useHarness = createUseClientCorporateIntegration(service);
  let view!: ReturnType<typeof useHarness>;
  const Harness = () => {
    view = useHarness();
    return null;
  };

  let renderer!: TestRenderer.ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(createElement(Harness));
  });
  assert.equal(view.workspace.data?.escrow.status, 'PENDING_PAYMENT');

  await act(async () => {
    await assert.rejects(view.escrow.execute(CASE_ID));
  });
  assert.equal(view.escrow.status, 'error');

  await act(async () => {
    assert.equal((await view.escrow.retry()).escrow.status, 'HELD_IN_ESCROW');
  });
  assert.deepEqual(refreshCaseIds, [CASE_ID, CASE_ID]);
  assert.equal(workspaceLoads, 2);
  assert.equal(view.workspace.data?.escrow.status, 'HELD_IN_ESCROW');
  assert.equal(view.escrow.status, 'success');

  await act(async () => {
    renderer.unmount();
  });
});
