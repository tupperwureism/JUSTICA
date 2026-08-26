import assert from 'node:assert/strict';
import test from 'node:test';
import { registerHooks } from 'node:module';
import { createElement } from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import {
  Phase2IntegrationError,
  createPhase2IntegrationService,
  type NotaryWorkspace,
  type Phase2Actor,
  type Phase2IntegrationGateway,
} from '../src/services/phase2IntegrationService.ts';
import type {
  NotaryWorkspaceService,
  useNotaryWorkspaceIntegration as useNotaryWorkspaceIntegrationType,
} from '../src/hooks/useNotaryWorkspaceIntegration.ts';

// The production hook module statically imports phase2SupabaseGateway, which
// reads import.meta.env (Vite-only). Tests inject the narrow service boundary
// and never use that default, so the gateway module is intercepted here with a
// fail-loud stub. No production file is modified for testability.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@/services/phase2SupabaseGateway') {
      return { url: 'stub:phase2SupabaseGateway', shortCircuit: true };
    }
    const resolved = nextResolve(specifier, context);
    if (resolved?.url?.replace(/\\/g, '/').endsWith('/src/services/phase2SupabaseGateway.ts')) {
      return { url: 'stub:phase2SupabaseGateway', shortCircuit: true };
    }
    return resolved;
  },
  load(url, context, nextLoad) {
    if (url === 'stub:phase2SupabaseGateway') {
      return {
        format: 'module',
        shortCircuit: true,
        source: [
          'export const phase2IntegrationService = {',
          "  loadNotaryWorkspaces: async () => { throw new Error('stub gateway: inject NotaryWorkspaceService in hook tests'); },",
          "  approveNotaryCdd: async () => { throw new Error('stub gateway: inject NotaryWorkspaceService in hook tests'); },",
          "  submitNotaryStamping: async () => { throw new Error('stub gateway: inject NotaryWorkspaceService in hook tests'); },",
          '};',
          'export default {};',
        ].join('\n'),
      };
    }
    return nextLoad(url, context);
  },
});

const hookModule = await import('../src/hooks/useNotaryWorkspaceIntegration.ts');
const useNotaryWorkspaceIntegration =
  hookModule.useNotaryWorkspaceIntegration as typeof useNotaryWorkspaceIntegrationType;

const ADMIN: Phase2Actor = { userId: '11111111-1111-4111-8111-111111111111', role: 'ADMIN' };
const ADVOCATE_NOTARY: Phase2Actor = { userId: '22222222-2222-4222-8222-222222222222', role: 'ADVOCATE' };
const OTHER_ADVOCATE: Phase2Actor = { userId: '88888888-8888-4888-8888-888888888888', role: 'ADVOCATE' };
const CLIENT: Phase2Actor = { userId: '99999999-9999-4999-8999-999999999999', role: 'CLIENT' };

const CASE_ID_1 = '33333333-3333-4333-8333-333333333333';
const CASE_ID_2 = '33333333-3333-4333-8333-444444444444';
const NOTARY_ID = '22222222-2222-4222-8222-222222222222';
const ASSESSMENT_ID = '44444444-4444-4444-8444-444444444444';
const OTHER_ASSESSMENT_ID = '44444444-4444-4444-8444-999999999999';

const sampleWorkspace1: NotaryWorkspace = {
  caseId: CASE_ID_1,
  caseCode: CASE_ID_1,
  entityName: 'PT Maju Bersama',
  entityType: 'PT_ORDINARY',
  currentStage: 'CDD_REVIEW',
  domicile: 'Jakarta Selatan, DKI Jakarta',
  kbliLabel: '62019',
  beneficialOwners: [
    {
      id: '55555555-5555-4555-8555-555555555555',
      name: 'Budi Santoso',
      controlBasis: 'OWNERSHIP',
      percentage: 70,
      verificationStatus: 'VERIFIED',
    },
  ],
  cddAssessment: {
    assessmentId: ASSESSMENT_ID,
    pepStatus: 'NO_MATCH',
    sanctionsStatus: 'NO_MATCH',
    decision: 'PENDING',
    rulesVersion: 'PMPJ-2026.1',
  },
  submissions: [],
};

const sampleWorkspace2: NotaryWorkspace = {
  ...sampleWorkspace1,
  caseId: CASE_ID_2,
  caseCode: CASE_ID_2,
  entityName: 'PT Sukses Mandiri',
  currentStage: 'DOCUMENTS_PENDING',
  cddAssessment: {
    ...sampleWorkspace1.cddAssessment!,
    assessmentId: '44444444-4444-4444-8444-555555555555',
    decision: 'APPROVED',
  },
};

function createMockGateway(
  actor: Phase2Actor = ADMIN,
  overrides: Partial<Phase2IntegrationGateway> = {},
): Phase2IntegrationGateway {
  return {
    getActor: async () => actor,
    getClientCorporateWorkspace: async () => null,
    getNotaryWorkspace: async (userId: string) => {
      if (userId === NOTARY_ID) return sampleWorkspace1;
      return null;
    },
    listNotaryWorkspaces: async (userId: string) => {
      if (userId === NOTARY_ID) return [sampleWorkspace1, sampleWorkspace2];
      return [];
    },
    listAssignmentContext: async () => ({
      cases: [
        {
          caseId: CASE_ID_1,
          orderId: '66666666-6666-4666-8666-666666666666',
          entityType: 'PT_ORDINARY',
          proposedName: 'PT Maju Bersama',
          currentStage: 'ESCROW_LOCKED',
          domicileCity: 'Jakarta Selatan',
          domicileProvince: 'DKI Jakarta',
          escrowStatus: 'HELD_IN_ESCROW',
          fundsLockedAt: '2026-08-20T10:00:00.000Z',
          assignedNotaryId: null,
        },
      ],
      notaries: [
        {
          notaryId: NOTARY_ID,
          fullName: 'Notaris Budi S.H. M.Kn',
          licenseNumber: 'NOT-2026-001',
          jurisdictionCity: 'Jakarta Selatan',
          jurisdictionProvince: 'DKI Jakarta',
          status: 'VERIFIED_ACTIVE',
        },
      ],
    }),
    assignNotary: async (input) => ({
      caseId: input.caseId,
      assignedNotaryId: input.notaryId,
      currentStage: 'ESCROW_LOCKED',
      replayed: false,
    }),
    approveCddAssessment: async (input) => ({
      assessmentId: input.assessmentId,
      caseId: input.caseId,
      currentStage: 'DOCUMENTS_PENDING',
      replayed: false,
    }),
    invokeCorporateIntake: async () => ({ data: null, error: null }),
    getEkycWorkspace: async () => null,
    ...overrides,
  };
}

test('listAssignmentContext requires ADMIN role', async () => {
  const service = createPhase2IntegrationService(createMockGateway(CLIENT));
  await assert.rejects(
    async () => service.listAssignmentContext(),
    (err: Error) => err instanceof Phase2IntegrationError && err.code === 'ROLE_FORBIDDEN',
  );
});

test('listAssignmentContext returns eligible cases and verified notaries', async () => {
  const service = createPhase2IntegrationService(createMockGateway(ADMIN));
  const context = await service.listAssignmentContext();
  assert.equal(context.cases.length, 1);
  assert.equal(context.cases[0].caseId, CASE_ID_1);
  assert.equal(context.notaries.length, 1);
  assert.equal(context.notaries[0].notaryId, NOTARY_ID);
});

test('assignNotary validates UUIDs and requires ADMIN role', async () => {
  const service = createPhase2IntegrationService(createMockGateway(ADMIN));
  await assert.rejects(
    async () => service.assignNotary({
      caseId: 'not-a-uuid',
      notaryId: NOTARY_ID,
      idempotencyKey: '77777777-7777-4777-8777-777777777777',
    }),
    (err: Error) => err instanceof Phase2IntegrationError && err.code === 'INVALID_PAYLOAD',
  );
});

test('assignNotary single-flight blocks duplicate in-flight requests with same key', async () => {
  let callCount = 0;
  const gateway = createMockGateway(ADMIN, {
    assignNotary: async (input) => {
      callCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return { caseId: input.caseId, assignedNotaryId: input.notaryId, currentStage: 'ESCROW_LOCKED', replayed: false };
    },
  });
  const service = createPhase2IntegrationService(gateway);
  const idempotencyKey = '77777777-7777-4777-8777-777777777777';

  const [res1, res2] = await Promise.all([
    service.assignNotary({ caseId: CASE_ID_1, notaryId: NOTARY_ID, idempotencyKey }),
    service.assignNotary({ caseId: CASE_ID_1, notaryId: NOTARY_ID, idempotencyKey }),
  ]);

  assert.equal(callCount, 1);
  assert.deepEqual(res1, res2);
});

test('loadNotaryWorkspaces returns array of all assigned cases for the notary', async () => {
  const service = createPhase2IntegrationService(createMockGateway(ADVOCATE_NOTARY));
  const workspaces = await service.loadNotaryWorkspaces();
  assert.equal(workspaces.length, 2);
  assert.equal(workspaces[0].caseId, CASE_ID_1);
  assert.equal(workspaces[1].caseId, CASE_ID_2);
});

test('unrelated advocate sees empty notary workspaces', async () => {
  const service = createPhase2IntegrationService(createMockGateway(OTHER_ADVOCATE));
  const workspaces = await service.loadNotaryWorkspaces();
  assert.equal(workspaces.length, 0);
});

test('approveNotaryCdd validates prerequisites and executes atomic approval', async () => {
  let approveCalled = false;
  let passedAssessmentId = '';
  const gateway = createMockGateway(ADVOCATE_NOTARY, {
    approveCddAssessment: async (input) => {
      approveCalled = true;
      passedAssessmentId = input.assessmentId;
      return {
        assessmentId: input.assessmentId,
        caseId: input.caseId,
        currentStage: 'DOCUMENTS_PENDING',
        replayed: false,
      };
    },
  });
  const service = createPhase2IntegrationService(gateway);
  const result = await service.approveNotaryCdd({
    caseId: CASE_ID_1,
    assessmentId: ASSESSMENT_ID,
    rulesVersion: 'PMPJ-2026.1',
    idempotencyKey: '88888888-8888-4888-8888-888888888888',
  });

  assert.equal(approveCalled, true);
  assert.equal(passedAssessmentId, ASSESSMENT_ID);
  assert.equal(result.currentStage, 'DOCUMENTS_PENDING');
  assert.equal(result.replayed, false);
});

test('approveNotaryCdd rejects when explicit assessmentId does not match workspace assessment', async () => {
  const service = createPhase2IntegrationService(createMockGateway(ADVOCATE_NOTARY));
  await assert.rejects(
    async () => service.approveNotaryCdd({
      caseId: CASE_ID_1,
      assessmentId: OTHER_ASSESSMENT_ID, // Mismatched assessmentId
      rulesVersion: 'PMPJ-2026.1',
      idempotencyKey: '88888888-8888-4888-8888-888888888888',
    }),
    (err: Error) => err instanceof Phase2IntegrationError && err.code === 'INVALID_PAYLOAD',
  );
});

test('approveNotaryCdd rejects malformed assessmentId', async () => {
  const service = createPhase2IntegrationService(createMockGateway(ADVOCATE_NOTARY));
  await assert.rejects(
    async () => service.approveNotaryCdd({
      caseId: CASE_ID_1,
      assessmentId: 'invalid-not-a-uuid',
      rulesVersion: 'PMPJ-2026.1',
      idempotencyKey: '88888888-8888-4888-8888-888888888888',
    }),
    (err: Error) => err instanceof Phase2IntegrationError && err.code === 'INVALID_PAYLOAD',
  );
});

test('submitNotaryStamping remains honestly blocked as future work', async () => {
  const service = createPhase2IntegrationService(createMockGateway(ADVOCATE_NOTARY));
  await assert.rejects(
    async () => service.submitNotaryStamping({
      caseId: CASE_ID_1,
      fileName: 'akta.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      kemenkumhamNumber: 'AHU-001',
      nibNumber: 'NIB-001',
    }),
    (err: Error) => err instanceof Phase2IntegrationError && err.code === 'BROWSER_BOUNDARY_UNAVAILABLE',
  );
});

test('approveNotaryCdd always calls gateway and never synthesizes local replay', async () => {
  let callCount = 0;
  const gateway = createMockGateway(ADVOCATE_NOTARY, {
    approveCddAssessment: async (input) => {
      callCount += 1;
      return {
        assessmentId: input.assessmentId,
        caseId: input.caseId,
        currentStage: 'DOCUMENTS_PENDING',
        replayed: callCount > 1,
      };
    },
  });
  const service = createPhase2IntegrationService(gateway);
  const input = {
    caseId: CASE_ID_1,
    assessmentId: ASSESSMENT_ID,
    rulesVersion: 'PMPJ-2026.1',
    idempotencyKey: '88888888-8888-4888-8888-888888888888',
  };

  const res1 = await service.approveNotaryCdd(input);
  assert.equal(res1.replayed, false);
  assert.equal(callCount, 1);

  // Second call must call gateway again (server decides replay based on idempotency record)
  const res2 = await service.approveNotaryCdd(input);
  assert.equal(res2.replayed, true);
  assert.equal(callCount, 2);
});

// ============================================================================
// BEHAVIORAL HOOK TESTS (Batch 3.C.5)
//
// The three audit-identified projection-only tests were REMOVED. They only
// inspected mock data returned by query methods and never executed the
// production hook. The tests below render the REAL useNotaryWorkspaceIntegration
// hook through react-test-renderer with a narrow legitimately-injected service
// boundary (NotaryWorkspaceService). No hook logic is duplicated here.
// ============================================================================

const HOOK_RULES_VERSION = 'PMPJ-2026.1';

const pendingCddWorkspace: NotaryWorkspace = {
  ...sampleWorkspace1,
  currentStage: 'CDD_REVIEW',
  cddAssessment: {
    assessmentId: ASSESSMENT_ID,
    pepStatus: 'NO_MATCH',
    sanctionsStatus: 'NO_MATCH',
    decision: 'PENDING',
    rulesVersion: HOOK_RULES_VERSION,
  },
};

const confirmedCddWorkspace: NotaryWorkspace = {
  ...pendingCddWorkspace,
  currentStage: 'DOCUMENTS_PENDING',
  cddAssessment: { ...pendingCddWorkspace.cddAssessment!, decision: 'APPROVED' },
};

const OTHER_ASSESSMENT_ID_2 = '44444444-4444-4444-8444-666666666666';

const pendingCddWorkspaceV2: NotaryWorkspace = {
  ...pendingCddWorkspace,
  cddAssessment: { ...pendingCddWorkspace.cddAssessment!, assessmentId: OTHER_ASSESSMENT_ID_2 },
};

const confirmedCddWorkspaceV2: NotaryWorkspace = {
  ...pendingCddWorkspaceV2,
  currentStage: 'DOCUMENTS_PENDING',
  cddAssessment: { ...pendingCddWorkspaceV2.cddAssessment!, decision: 'APPROVED' },
};

type ApproveCddInput = Parameters<NotaryWorkspaceService['approveNotaryCdd']>[0];

function createHookService(options: {
  loads: Array<() => Promise<NotaryWorkspace[]>>;
  approve: (input: ApproveCddInput) => Promise<{ caseId: string; assessmentId: string; currentStage: string; replayed: boolean }>;
}): { service: NotaryWorkspaceService; approveCalls: ApproveCddInput[] } {
  const approveCalls: ApproveCddInput[] = [];
  let loadIndex = 0;
  const service: NotaryWorkspaceService = {
    loadNotaryWorkspaces: async () => {
      const loader = options.loads[Math.min(loadIndex, options.loads.length - 1)];
      loadIndex += 1;
      return loader();
    },
    approveNotaryCdd: async (input) => {
      approveCalls.push(input);
      return options.approve(input);
    },
    submitNotaryStamping: (async () => {
      throw new Phase2IntegrationError('BROWSER_BOUNDARY_UNAVAILABLE');
    }) as NotaryWorkspaceService['submitNotaryStamping'],
  };
  return { service, approveCalls };
}

function successfulApprove(resultCaseId: string, resultAssessmentId: string) {
  return async (_input: ApproveCddInput) => ({
    caseId: resultCaseId,
    assessmentId: resultAssessmentId,
    currentStage: 'DOCUMENTS_PENDING',
    replayed: false,
  });
}

async function renderNotaryHook(service: NotaryWorkspaceService) {
  const rendered: {
    view?: ReturnType<typeof useNotaryWorkspaceIntegrationType>;
    renderer?: TestRenderer.ReactTestRenderer;
  } = {};
  const Harness = () => {
    rendered.view = useNotaryWorkspaceIntegration(service);
    return null;
  };
  await act(async () => {
    rendered.renderer = TestRenderer.create(createElement(Harness));
  });
  assert(rendered.view, 'hook harus ter-render');
  return {
    get view() {
      return rendered.view!;
    },
    async unmount() {
      await act(async () => {
        rendered.renderer?.unmount();
      });
    },
  };
}

test('hook loads canonical workspaces and exposes the selected workspace', async () => {
  const { service } = createHookService({
    loads: [async () => [structuredClone(pendingCddWorkspace), structuredClone(sampleWorkspace2)]],
    approve: successfulApprove(CASE_ID_1, ASSESSMENT_ID),
  });
  const hook = await renderNotaryHook(service);
  try {
    assert.equal(hook.view.workspace.data?.caseId, CASE_ID_1);
    assert.equal(hook.view.workspaces.data?.length, 2);
    await act(async () => {
      hook.view.setSelectedCaseId(CASE_ID_2);
    });
    assert.equal(hook.view.workspace.data?.caseId, CASE_ID_2);
    assert.equal(hook.view.selectedCaseId, CASE_ID_2);
  } finally {
    await hook.unmount();
  }
});

test('hook returns null workspace and never list[0] when the selected case disappears after refresh', async () => {
  const { service } = createHookService({
    loads: [
      async () => [structuredClone(pendingCddWorkspace), structuredClone(sampleWorkspace2)],
      async () => [structuredClone(sampleWorkspace2)], // case 1 removed server-side
    ],
    approve: successfulApprove(CASE_ID_1, ASSESSMENT_ID),
  });
  const hook = await renderNotaryHook(service);
  try {
    await act(async () => {
      hook.view.setSelectedCaseId(CASE_ID_1);
    });
    assert.equal(hook.view.workspace.data?.caseId, CASE_ID_1);

    await act(async () => {
      await hook.view.workspaces.refresh();
    });
    assert.equal(hook.view.workspace.data, null, 'workspace harus null; fallback list[0] dilarang');
    assert.equal(hook.view.workspaces.data?.length, 1, 'daftar server tetap memuat case lain');
  } finally {
    await hook.unmount();
  }
});

test('CDD retry reuses the exact attempt tuple (caseId, assessmentId, rulesVersion, idempotencyKey)', async () => {
  let attempt = 0;
  const { service, approveCalls } = createHookService({
    loads: [
      async () => [structuredClone(pendingCddWorkspace)],
      async () => [structuredClone(confirmedCddWorkspace)],
    ],
    approve: async (input) => {
      attempt += 1;
      if (attempt === 1) throw new Error('jaringan terputus');
      return { caseId: input.caseId, assessmentId: input.assessmentId ?? '', currentStage: 'DOCUMENTS_PENDING', replayed: false };
    },
  });
  const hook = await renderNotaryHook(service);
  try {
    await act(async () => {
      await assert.rejects(hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION }));
    });
    assert.equal(hook.view.cddApproval.status, 'error');
    assert.equal(approveCalls.length, 1);

    await act(async () => {
      await hook.view.cddApproval.retry();
    });
    assert.equal(hook.view.cddApproval.status, 'success');
    assert.equal(approveCalls.length, 2);
    assert.deepEqual(approveCalls[1], approveCalls[0], 'retry harus memakai tuple identik');
    assert(approveCalls[0].idempotencyKey, 'attempt harus memiliki idempotency key');
    assert.equal(approveCalls[0].assessmentId, ASSESSMENT_ID);
  } finally {
    await hook.unmount();
  }
});

test('selecting another case invalidates the attempt and a stale retry makes zero gateway calls', async () => {
  const { service, approveCalls } = createHookService({
    loads: [async () => [structuredClone(pendingCddWorkspace), structuredClone(sampleWorkspace2)]],
    approve: async () => {
      throw new Error('jaringan terputus');
    },
  });
  const hook = await renderNotaryHook(service);
  try {
    await act(async () => {
      await assert.rejects(hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION }));
    });
    assert.equal(approveCalls.length, 1);

    await act(async () => {
      hook.view.setSelectedCaseId(CASE_ID_2);
    });
    await act(async () => {
      await assert.rejects(hook.view.cddApproval.retry(), /Tidak ada permintaan untuk diulang/);
    });
    assert.equal(approveCalls.length, 1, 'retry attempt usang tidak boleh memanggil gateway');
  } finally {
    await hook.unmount();
  }
});

test('assessment change invalidates the attempt; only a fresh execute creates a new idempotency key', async () => {
  let approveRun = 0;
  const { service, approveCalls } = createHookService({
    loads: [
      async () => [structuredClone(pendingCddWorkspace)], // initial load, assessment A1
      async () => [structuredClone(pendingCddWorkspaceV2)], // refresh: assessment berubah ke A2
      async () => [structuredClone(confirmedCddWorkspaceV2)], // refresh sukses untuk A2
    ],
    approve: async (input) => {
      approveRun += 1;
      if (approveRun === 1) throw new Error('jaringan terputus');
      return { caseId: input.caseId, assessmentId: input.assessmentId ?? '', currentStage: 'DOCUMENTS_PENDING', replayed: false };
    },
  });
  const hook = await renderNotaryHook(service);
  try {
    await act(async () => {
      await assert.rejects(hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION }));
    });
    assert.equal(approveCalls.length, 1);
    const firstKey = approveCalls[0].idempotencyKey;
    assert(firstKey);

    await act(async () => {
      await hook.view.workspaces.refresh();
    });
    await act(async () => {
      await assert.rejects(hook.view.cddApproval.retry(), /Tidak ada permintaan untuk diulang/);
    });
    assert.equal(approveCalls.length, 1, 'retry assessment usang tidak boleh memanggil gateway');

    await act(async () => {
      await hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION });
    });
    assert.equal(approveCalls.length, 2);
    assert.notEqual(approveCalls[1].idempotencyKey, firstKey, 'execute baru harus membuat idempotency key baru');
    assert.equal(approveCalls[1].assessmentId, OTHER_ASSESSMENT_ID_2, 'execute baru memakai assessment kanonik terbaru');
    assert.equal(hook.view.cddApproval.status, 'success');
  } finally {
    await hook.unmount();
  }
});

test('refresh rejection keeps the hook in error and retains the identical retry tuple', async () => {
  const { service, approveCalls } = createHookService({
    loads: [
      async () => [structuredClone(pendingCddWorkspace)],
      async () => { throw new Error('refresh gagal'); },
      async () => [structuredClone(confirmedCddWorkspace)],
    ],
    approve: successfulApprove(CASE_ID_1, ASSESSMENT_ID),
  });
  const hook = await renderNotaryHook(service);
  try {
    await act(async () => {
      await assert.rejects(hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION }));
    });
    assert.equal(hook.view.cddApproval.status, 'error');
    assert.equal(approveCalls.length, 1);

    await act(async () => {
      await hook.view.cddApproval.retry();
    });
    assert.equal(hook.view.cddApproval.status, 'success');
    assert.equal(approveCalls.length, 2);
    assert.deepEqual(approveCalls[1], approveCalls[0], 'retry setelah refresh gagal memakai tuple identik');
  } finally {
    await hook.unmount();
  }
});

test('refresh returning wrong stage/decision rejects success', async () => {
  const { service, approveCalls } = createHookService({
    loads: [
      async () => [structuredClone(pendingCddWorkspace)],
      async () => [structuredClone(pendingCddWorkspace)], // refresh belum mengonfirmasi (stage CDD_REVIEW, decision PENDING)
    ],
    approve: successfulApprove(CASE_ID_1, ASSESSMENT_ID),
  });
  const hook = await renderNotaryHook(service);
  try {
    await act(async () => {
      await assert.rejects(hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION }));
    });
    assert.equal(hook.view.cddApproval.status, 'error');
    assert.equal(hook.view.cddApproval.data, null, 'tidak boleh melaporkan sukses tanpa konfirmasi kanonik');
    assert.equal(approveCalls.length, 1);
  } finally {
    await hook.unmount();
  }
});

test('refresh missing the exact case rejects success and the workspace stays fail-closed null', async () => {
  const { service, approveCalls } = createHookService({
    loads: [
      async () => [structuredClone(pendingCddWorkspace), structuredClone(sampleWorkspace2)],
      async () => [structuredClone(sampleWorkspace2)], // case yang di-approve hilang dari refresh
    ],
    approve: successfulApprove(CASE_ID_1, ASSESSMENT_ID),
  });
  const hook = await renderNotaryHook(service);
  try {
    await act(async () => {
      hook.view.setSelectedCaseId(CASE_ID_1);
    });
    await act(async () => {
      await assert.rejects(hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION }));
    });
    assert.equal(hook.view.cddApproval.status, 'error');
    assert.equal(hook.view.cddApproval.data, null);
    assert.equal(hook.view.workspace.data, null, 'case terpilih hilang → workspace null, bukan list[0]');
    assert.equal(approveCalls.length, 1);
  } finally {
    await hook.unmount();
  }
});

test('exact confirmed refresh yields success and clears the completed attempt', async () => {
  const { service, approveCalls } = createHookService({
    loads: [
      async () => [structuredClone(pendingCddWorkspace)],
      async () => [structuredClone(confirmedCddWorkspace)],
      async () => [structuredClone(pendingCddWorkspace)],
      async () => [structuredClone(confirmedCddWorkspace)],
    ],
    approve: successfulApprove(CASE_ID_1, ASSESSMENT_ID),
  });
  const hook = await renderNotaryHook(service);
  try {
    await act(async () => {
      await hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION });
    });
    assert.equal(hook.view.cddApproval.status, 'success');
    assert.equal(approveCalls.length, 1);
    const firstKey = approveCalls[0].idempotencyKey;
    assert(firstKey);

    await act(async () => {
      await hook.view.workspaces.refresh();
    });
    await act(async () => {
      await hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION });
    });
    assert.equal(approveCalls.length, 2);
    assert(
      approveCalls[1].idempotencyKey && approveCalls[1].idempotencyKey !== firstKey,
      'attempt yang selesai harus dibersihkan — execute berikutnya membuat key baru',
    );
  } finally {
    await hook.unmount();
  }
});

test('two concurrent identical submissions hit the gateway exactly once (single-flight)', async () => {
  let release!: () => void;
  const { service, approveCalls } = createHookService({
    loads: [
      async () => [structuredClone(pendingCddWorkspace)],
      async () => [structuredClone(confirmedCddWorkspace)],
    ],
    approve: async (input) => {
      await new Promise<void>((resolve) => { release = resolve; });
      return { caseId: input.caseId, assessmentId: input.assessmentId ?? '', currentStage: 'DOCUMENTS_PENDING', replayed: false };
    },
  });
  const hook = await renderNotaryHook(service);
  try {
    let first!: Promise<unknown>;
    let second!: Promise<unknown>;
    await act(async () => {
      first = hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION });
      second = hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION });
      await Promise.resolve();
    });
    assert.equal(first === second, true, 'single-flight harus mengembalikan promise yang sama');
    assert.equal(approveCalls.length, 1, 'gateway hanya boleh dipanggil sekali');
    await act(async () => {
      release();
      await first;
    });
    assert.equal(hook.view.cddApproval.status, 'success');
  } finally {
    await hook.unmount();
  }
});

test('loading state is observable while the approval request is in flight', async () => {
  let release!: () => void;
  const { service } = createHookService({
    loads: [
      async () => [structuredClone(pendingCddWorkspace)],
      async () => [structuredClone(confirmedCddWorkspace)],
    ],
    approve: async (input) => {
      await new Promise<void>((resolve) => { release = resolve; });
      return { caseId: input.caseId, assessmentId: input.assessmentId ?? '', currentStage: 'DOCUMENTS_PENDING', replayed: false };
    },
  });
  const hook = await renderNotaryHook(service);
  try {
    let pending!: Promise<unknown>;
    await act(async () => {
      pending = hook.view.cddApproval.execute({ caseId: CASE_ID_1, rulesVersion: HOOK_RULES_VERSION });
      await Promise.resolve();
    });
    assert.equal(hook.view.cddApproval.isLoading, true, 'loading harus tampak selama in-flight');
    assert.equal(hook.view.cddApproval.status, 'loading');
    await act(async () => {
      release();
      await pending;
    });
    assert.equal(hook.view.cddApproval.isLoading, false);
    assert.equal(hook.view.cddApproval.status, 'success');
  } finally {
    await hook.unmount();
  }
});
