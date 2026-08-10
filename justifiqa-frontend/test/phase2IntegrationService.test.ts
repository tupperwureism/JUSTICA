import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  Phase2IntegrationError,
  createPhase2IntegrationService,
  type ClientCorporateWorkspace,
  type EkycWorkspace,
  type NotaryWorkspace,
  type Phase2Actor,
  type Phase2IntegrationGateway,
} from '../src/services/phase2IntegrationService.ts';
import {
  resolveEkycScreen,
  scopeEkycWorkspaceToDocument,
} from '../src/components/signing/ekyc/ekycUiModel.ts';

const CLIENT: Phase2Actor = { userId: '11111111-1111-4111-8111-111111111111', role: 'CLIENT' };
const NOTARY: Phase2Actor = { userId: '22222222-2222-4222-8222-222222222222', role: 'ADVOCATE' };
const CASE_ID = '33333333-3333-4333-8333-333333333333';
const ESCROW_ID = '44444444-4444-4444-8444-444444444444';
const ENVELOPE_ID = '55555555-5555-4555-8555-555555555555';
const ASSESSMENT_ID = '99999999-9999-4999-8999-999999999999';
const gatewaySource = await readFile(
  new URL('../src/services/phase2SupabaseGateway.ts', import.meta.url),
  'utf8',
);

const clientWorkspace: ClientCorporateWorkspace = {
  caseId: CASE_ID,
  orderId: '66666666-6666-4666-8666-666666666666',
  entityName: 'PT Uji Integrasi',
  entityType: 'PT_ORDINARY',
  currentStage: 'DRAFT',
  externalReference: null,
  escrow: {
    escrowId: ESCROW_ID,
    status: 'PENDING_PAYMENT',
    totalAmountIdr: 7_500_000,
    paymentGatewayRef: 'CORP-ORDER-001',
    fundsLockedAt: null,
  },
};

const notaryWorkspace: NotaryWorkspace = {
  caseId: CASE_ID,
  caseCode: CASE_ID,
  entityName: 'PT Uji Integrasi',
  entityType: 'PT_ORDINARY',
  currentStage: 'NOTARY_REVIEW',
  domicile: 'Jakarta Selatan, DKI Jakarta',
  kbliLabel: '62019',
  beneficialOwners: [{
    id: '77777777-7777-4777-8777-777777777777',
    name: 'Siti Rahma',
    controlBasis: 'OWNERSHIP',
    percentage: 60,
    verificationStatus: 'VERIFIED',
  }],
  cddAssessment: {
    assessmentId: ASSESSMENT_ID,
    pepStatus: 'NO_MATCH',
    sanctionsStatus: 'NO_MATCH',
    decision: 'PENDING',
    rulesVersion: 'PMPJ-2026.1',
  },
  submissions: [],
};

const ekycWorkspace: EkycWorkspace = {
  envelopeId: ENVELOPE_ID,
  documentTitle: 'Akta Uji Integrasi',
  providerName: 'VIDA',
  status: 'SENT',
  globalStatus: 'ACTIVE',
  expiresAt: '2026-08-04T00:00:00.000Z',
  haltReason: null,
  currentPartyId: '88888888-8888-4888-8888-888888888888',
  currentVerification: null,
  parties: [{
    id: '88888888-8888-4888-8888-888888888888',
    email: 'client@example.test',
    role: 'CLIENT',
    status: 'PENDING',
    signingOrder: 1,
  }],
};

class FakeGateway implements Phase2IntegrationGateway {
  actor: Phase2Actor | null = CLIENT;
  clientWorkspace: ClientCorporateWorkspace | null = clientWorkspace;
  notaryWorkspace: NotaryWorkspace | null = notaryWorkspace;
  ekycWorkspace: EkycWorkspace | null = ekycWorkspace;
  invokeError: string | null = null;

  async getActor() {
    return this.actor;
  }

  async getClientCorporateWorkspace() {
    return this.clientWorkspace;
  }

  async getNotaryWorkspace() {
    return this.notaryWorkspace;
  }

  async getEkycWorkspace() {
    return this.ekycWorkspace;
  }

  async approveCddAssessment(input: { assessmentId: string }) {
    if (this.notaryWorkspace?.cddAssessment) {
      this.notaryWorkspace = {
        ...this.notaryWorkspace,
        cddAssessment: {
          ...this.notaryWorkspace.cddAssessment,
          decision: 'APPROVED',
        },
      };
    }
    return { assessmentId: input.assessmentId, replayed: false };
  }

  async invokeCorporateIntake(_payload: {
    orderId: string;
    idempotencyKey: string;
    [key: string]: unknown;
  }) {
    return {
      data: null,
      error: { code: this.invokeError ?? 'INVALID_PAYLOAD' },
    };
  }
}

const intakeDraft = {
  entityType: 'PT_ORDINARY' as const,
  businessName: 'PT Uji Integrasi',
  domicileCity: 'Jakarta Selatan',
  domicileProvince: 'DKI Jakarta',
  kbliCodes: ['62019'],
  authorizedCapitalIdr: '100000000',
  paidUpCapitalIdr: '50000000',
  corporateParties: [{
    partyType: 'NATURAL_PERSON' as const,
    role: 'FOUNDER' as const,
    displayName: 'Siti Rahma',
    identityReference: 'NIK-TEST-101',
    ownershipPercentage: '100',
    votingPercentage: '100',
    effectiveDate: '2026-07-29',
  }],
  beneficialOwners: [{
    clientRowId: 'row-budi-santoso',
    naturalPersonName: 'Budi Santoso',
    identityReference: 'NIK-TEST-102',
    evidenceReference: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    controlBasis: 'OWNERSHIP' as const,
    percentage: '100',
  }],
  paymentGatewayRef: 'PG-TEST-101',
  acceptedScope: true,
};

test('corporate intake validates the client and refuses invalid gateway responses', async () => {
  const gateway = new FakeGateway();
  gateway.invokeError = 'INVALID_PAYLOAD';
  const service = createPhase2IntegrationService(gateway);

  gateway.actor = NOTARY;
  await assert.rejects(
    service.submitCorporateIntake({
      draft: intakeDraft,
      orderId: '11111111-1111-4111-8111-111111111111',
      idempotencyKey: 'k-1',
    }),
    (error) => error instanceof Phase2IntegrationError && error.code === 'ROLE_FORBIDDEN',
  );

  gateway.actor = CLIENT;
  await assert.rejects(
    service.submitCorporateIntake({
      draft: intakeDraft,
      orderId: '11111111-1111-4111-8111-111111111111',
      idempotencyKey: 'k-1',
    }),
    (error) => error instanceof Phase2IntegrationError && error.code === 'INTAKE_SERVER_UNAVAILABLE',
  );
});

test('corporate intake surfaces idempotency conflict from gateway', async () => {
  const gateway = new FakeGateway();
  gateway.actor = CLIENT;
  gateway.invokeError = 'IDEMPOTENCY_CONFLICT';
  const service = createPhase2IntegrationService(gateway);
  await assert.rejects(
    service.submitCorporateIntake({
      draft: intakeDraft,
      orderId: '11111111-1111-4111-8111-111111111111',
      idempotencyKey: 'k-1',
    }),
    (error) => error instanceof Phase2IntegrationError && error.code === 'INTAKE_IDEMPOTENCY_CONFLICT',
  );
});

// TDD_RED_MISSED_DUE_INTERRUPTED_WIP: Regression test for PRICING_CATALOG_UNAVAILABLE mapping
test('corporate intake maps PRICING_CATALOG_UNAVAILABLE from gateway', async () => {
  const gateway = new FakeGateway();
  gateway.actor = CLIENT;
  gateway.invokeError = 'PRICING_CATALOG_UNAVAILABLE';
  const service = createPhase2IntegrationService(gateway);
  await assert.rejects(
    service.submitCorporateIntake({
      draft: intakeDraft,
      orderId: '11111111-1111-4111-8111-111111111111',
      idempotencyKey: 'k-1',
    }),
    (error) => error instanceof Phase2IntegrationError && error.code === 'PRICING_CATALOG_UNAVAILABLE',
  );
});

// TDD_RED_MISSED_DUE_INTERRUPTED_WIP: Regression test for INTAKE_SERVER_UNAVAILABLE fallback
test('corporate intake maps unknown gateway error to INTAKE_SERVER_UNAVAILABLE', async () => {
  const gateway = new FakeGateway();
  gateway.actor = CLIENT;
  gateway.invokeError = 'SOME_UNKNOWN_ERROR';
  const service = createPhase2IntegrationService(gateway);
  await assert.rejects(
    service.submitCorporateIntake({
      draft: intakeDraft,
      orderId: '11111111-1111-4111-8111-111111111111',
      idempotencyKey: 'k-1',
    }),
    (error) => error instanceof Phase2IntegrationError && error.code === 'INTAKE_SERVER_UNAVAILABLE',
  );
});

test('corporate escrow refresh preserves every canonical webhook/server status', async () => {
  const gateway = new FakeGateway();
  const service = createPhase2IntegrationService(gateway);

  assert.equal(
    (await service.refreshCorporateEscrow(CASE_ID)).escrow.status,
    'PENDING_PAYMENT',
  );

  gateway.clientWorkspace = {
    ...clientWorkspace,
    currentStage: 'COMPLIANCE_HOLD',
    escrow: {
      ...clientWorkspace.escrow,
      status: 'FROZEN_DISPUTE',
      fundsLockedAt: '2026-07-28T00:00:00.000Z',
    },
  };
  const refreshed = await service.refreshCorporateEscrow(CASE_ID);
  assert.equal(refreshed.escrow.status, 'FROZEN_DISPUTE');
});

test('notary CDD approval updates an existing screened assessment and replays safely', async () => {
  const gateway = new FakeGateway();
  gateway.actor = NOTARY;
  const service = createPhase2IntegrationService(gateway);
  const input = { caseId: CASE_ID, rulesVersion: 'PMPJ-2026.1' };

  const first = await service.approveNotaryCdd(input);
  const replay = await service.approveNotaryCdd(input);

  assert.equal(first.assessmentId, ASSESSMENT_ID);
  assert.equal(replay.assessmentId, first.assessmentId);
  assert.equal(replay.replayed, true);
});

test('notary CDD approval refuses to manufacture missing screening results', async () => {
  const gateway = new FakeGateway();
  gateway.actor = NOTARY;
  gateway.notaryWorkspace = { ...notaryWorkspace, cddAssessment: null };
  const service = createPhase2IntegrationService(gateway);

  await assert.rejects(
    service.approveNotaryCdd({ caseId: CASE_ID, rulesVersion: 'PMPJ-2026.1' }),
    (error) => error instanceof Phase2IntegrationError && error.code === 'INVALID_PAYLOAD',
  );
});

test('notary stamping rejects invalid files and exposes the missing server boundary', async () => {
  const gateway = new FakeGateway();
  gateway.actor = NOTARY;
  const service = createPhase2IntegrationService(gateway);

  await assert.rejects(
    service.submitNotaryStamping({
      caseId: CASE_ID,
      fileName: 'akta.exe',
      fileType: 'application/octet-stream',
      fileSize: 100,
      kemenkumhamNumber: 'AHU-001',
      nibNumber: '',
    }),
    (error) => error instanceof Phase2IntegrationError && error.code === 'INVALID_PAYLOAD',
  );
  await assert.rejects(
    service.submitNotaryStamping({
      caseId: CASE_ID,
      fileName: 'akta.pdf',
      fileType: 'application/pdf',
      fileSize: 100,
      kemenkumhamNumber: 'AHU-001',
      nibNumber: '',
    }),
    (error) => error instanceof Phase2IntegrationError
      && error.code === 'BROWSER_BOUNDARY_UNAVAILABLE',
  );
});

test('e-KYC reads canonical provider state and never fabricates envelope/provider outcomes', async () => {
  const gateway = new FakeGateway();
  const service = createPhase2IntegrationService(gateway);

  assert.equal((await service.loadEkycWorkspace())?.envelopeId, ENVELOPE_ID);
  await assert.rejects(
    service.createSigningEnvelope({ documentTitle: 'Akta', documentSha256: 'a'.repeat(64) }),
    (error) => error instanceof Phase2IntegrationError
      && error.code === 'BROWSER_BOUNDARY_UNAVAILABLE',
  );
  await assert.rejects(
    service.beginEkycProviderSession({ envelopeId: ENVELOPE_ID, otp: '123456' }),
    (error) => error instanceof Phase2IntegrationError
      && error.code === 'BROWSER_BOUNDARY_UNAVAILABLE',
  );
});

test('e-KYC UI fails closed for Global Halt and distinguishes refund progress', () => {
  assert.equal(resolveEkycScreen('ACTIVE', 'SENT', 'PENDING'), 'liveness');
  assert.equal(resolveEkycScreen('HALTED', 'VOIDED', 'PENDING'), 'halted');
  assert.equal(resolveEkycScreen('REFUND_PENDING', 'VOIDED', 'PENDING'), 'refundPending');
  assert.equal(resolveEkycScreen('REFUNDED', 'VOIDED', 'PENDING'), 'refunded');
  assert.equal(resolveEkycScreen('COMPLETED', 'COMPLETED', 'PASSED'), 'verified');
});

test('e-KYC UI refuses to reuse the latest envelope for an unrelated document', () => {
  assert.equal(
    scopeEkycWorkspaceToDocument(ekycWorkspace, 'Dokumen lain'),
    null,
  );
  assert.equal(
    scopeEkycWorkspaceToDocument(ekycWorkspace, ekycWorkspace.documentTitle)?.envelopeId,
    ENVELOPE_ID,
  );
});

test('browser adapter never invokes privileged RPCs and only mutates screened CDD', () => {
  assert.doesNotMatch(gatewaySource, /\.rpc\s*\(/);
  assert.doesNotMatch(gatewaySource, /service[_-]?role/i);
  const writes = [...gatewaySource.matchAll(
    /\.from\('([^']+)'\)\.(insert|update|upsert|delete)\s*\(/g,
  )].map((match) => `${match[1]}:${match[2]}`);
  assert.deepEqual(writes, ['compliance_assessments:update']);
});
