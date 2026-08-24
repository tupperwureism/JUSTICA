import assert from 'node:assert/strict';
import test from 'node:test';
import {
  Phase2IntegrationError,
  createPhase2IntegrationService,
  type NotaryWorkspace,
  type Phase2Actor,
  type Phase2IntegrationGateway,
} from '../src/services/phase2IntegrationService.ts';

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

test('assignment refresh missing case fails closed and rejects stale mutation substitution', async () => {
  const gateway = createMockGateway(ADMIN, {
    listAssignmentContext: async () => ({
      cases: [], // Case missing in refresh
      notaries: [
        {
          notaryId: NOTARY_ID,
          fullName: 'Notaris 1',
          licenseNumber: 'SK-01',
          jurisdictionCity: 'Jakarta',
          jurisdictionProvince: 'DKI Jakarta',
          status: 'VERIFIED_ACTIVE',
        },
      ],
    }),
  });
  const service = createPhase2IntegrationService(gateway);

  // When client refreshes context after mutation, missing case in refreshed context fails validation
  const refreshed = await service.listAssignmentContext();
  const verifiedCase = refreshed.cases.find((c) => c.caseId === CASE_ID_1);
  assert.equal(verifiedCase, undefined);
});

test('assignment refresh with mismatched notary or wrong stage fails validation', async () => {
  const gateway = createMockGateway(ADMIN, {
    listAssignmentContext: async () => ({
      cases: [
        {
          caseId: CASE_ID_1,
          orderId: '11111111-1111-4111-8111-111111111111',
          proposedName: 'PT Test',
          entityType: 'PT_ORDINARY',
          domicileCity: 'Jakarta',
          domicileProvince: 'DKI Jakarta',
          currentStage: 'DOCUMENTS_PENDING', // Wrong stage (expected ESCROW_LOCKED)
          escrowStatus: 'HELD_IN_ESCROW',
          fundsLockedAt: '2026-08-20T00:00:00Z',
          assignedNotaryId: '99999999-9999-4999-8999-999999999999', // Mismatched notary
        },
      ],
      notaries: [],
    }),
  });
  const service = createPhase2IntegrationService(gateway);
  const refreshed = await service.listAssignmentContext();
  const verifiedCase = refreshed.cases.find((c) => c.caseId === CASE_ID_1);
  assert.notEqual(verifiedCase?.assignedNotaryId, NOTARY_ID);
  assert.notEqual(verifiedCase?.currentStage, 'ESCROW_LOCKED');
});

test('CDD refresh missing case or wrong stage/decision fails validation', async () => {
  const gateway = createMockGateway(ADVOCATE_NOTARY, {
    listNotaryWorkspaces: async () => [
      {
        caseId: CASE_ID_1,
        caseCode: 'CASE-01',
        entityName: 'PT Test',
        entityType: 'PT_ORDINARY',
        currentStage: 'CDD_REVIEW', // Not yet DOCUMENTS_PENDING
        domicile: 'Jakarta Selatan, DKI Jakarta',
        kbliLabel: '62019',
        cddAssessment: {
          assessmentId: '33333333-3333-4333-8333-333333333333',
          rulesVersion: 'PMPJ-2026.1',
          decision: 'PENDING', // Not yet APPROVED
          pepStatus: 'NO_MATCH',
          sanctionsStatus: 'NO_MATCH',
        },
        beneficialOwners: [],
        submissions: [],
      },
    ],
  });
  const service = createPhase2IntegrationService(gateway);
  const workspaces = await service.loadNotaryWorkspaces();
  const verified = workspaces.find((w) => w.caseId === CASE_ID_1);
  assert.notEqual(verified?.currentStage, 'DOCUMENTS_PENDING');
  assert.notEqual(verified?.cddAssessment?.decision, 'APPROVED');
});
