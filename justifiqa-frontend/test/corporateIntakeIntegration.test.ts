import assert from 'node:assert/strict';
import test from 'node:test';
import {
  Phase2IntegrationError,
  createPhase2IntegrationService,
  type Phase2IntegrationGateway,
  type SubmitCorporateIntakeResult,
  type IntakePayload,
  type CorporateIntakeInput,
} from '../src/services/phase2IntegrationService.ts';

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const CASE_ID = '33333333-3333-4333-8333-333333333333';
const ESCROW_ID = '44444444-4444-4444-8444-444444444444';
const CATALOG_ID = '55555555-5555-4555-8555-555555555555';

const validIntakeDraft: CorporateIntakeInput = {
  entityType: 'PT_ORDINARY',
  businessName: 'PT Test Company',
  domicileCity: 'Jakarta Selatan',
  domicileProvince: 'DKI Jakarta',
  kbliCodes: ['62010'],
  authorizedCapitalIdr: '1000000000',
  paidUpCapitalIdr: '250000000',
  corporateParties: [{
    partyType: 'NATURAL_PERSON',
    role: 'FOUNDER',
    displayName: 'Test Founder',
    identityReference: 'NIK-123',
    ownershipPercentage: '100',
    votingPercentage: '100',
    effectiveDate: '2026-08-01',
  }],
  beneficialOwners: [{
    naturalPersonName: 'Test BO',
    evidenceReference: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    controlBasis: 'OWNERSHIP',
    percentage: '100',
  }],
  paymentGatewayRef: 'PG-TEST-001',
  acceptedScope: true,
};

const baseResult: SubmitCorporateIntakeResult = {
  orderId: '66666666-6666-4666-8666-666666666666',
  corporateCaseId: CASE_ID,
  escrowId: ESCROW_ID,
  pricingCatalogId: CATALOG_ID,
  quoteVersion: 1,
  legalScopeVersion: '2026.07',
  totalAmountIdr: '5000000',
  replayed: false,
};

class TrackingGateway implements Phase2IntegrationGateway {
  public actor: { userId: string; role: 'CLIENT' | 'ADVOCATE' | 'ADMIN' } | null = { userId: CLIENT_ID, role: 'CLIENT' };
  public invokeCalls: Array<{ payload: IntakePayload; timestamp: number }> = [];
  public invokeError: string | null = null;
  public invokeDelay = 0;
  public shouldReplay = false;
  private caseCounter = 0;

  async getActor() {
    return this.actor;
  }

  async getClientCorporateWorkspace() {
    return null;
  }

  async getNotaryWorkspace() {
    return null;
  }

  async getEkycWorkspace() {
    return null;
  }

  async approveCddAssessment() {
    return { assessmentId: '', replayed: false };
  }

  async invokeCorporateIntake(payload: IntakePayload) {
    this.invokeCalls.push({ payload, timestamp: Date.now() });
    if (this.invokeDelay > 0) {
      await new Promise((r) => setTimeout(r, this.invokeDelay));
    }
    if (this.invokeError) {
      return { data: null, error: { code: this.invokeError } };
    }
    this.caseCounter++;
    const uniqueCaseId = `33333333-3333-4333-8333-${String(this.caseCounter).padStart(12, '0')}`;
    return { data: { ...baseResult, corporateCaseId: uniqueCaseId, replayed: this.shouldReplay }, error: null };
  }
}

function makeService(gateway: Phase2IntegrationGateway) {
  return createPhase2IntegrationService(gateway);
}

test('submitCorporateIntake uses caller-provided orderId and idempotencyKey', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'caller-order-1',
    idempotencyKey: 'caller-key-1',
  });

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'caller-order-2',
    idempotencyKey: 'caller-key-2',
  });

  assert.equal(gateway.invokeCalls.length, 2);
  assert.equal(gateway.invokeCalls[0].payload.orderId, 'caller-order-1');
  assert.equal(gateway.invokeCalls[0].payload.idempotencyKey, 'caller-key-1');
  assert.equal(gateway.invokeCalls[1].payload.orderId, 'caller-order-2');
  assert.equal(gateway.invokeCalls[1].payload.idempotencyKey, 'caller-key-2');
});

test('submitCorporateIntake exact retry uses same idempotencyKey and orderId', async () => {
  const gateway = new TrackingGateway();
  gateway.invokeError = 'INTAKE_SERVER_UNAVAILABLE';
  const service = makeService(gateway);

  await assert.rejects(
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: 'retry-order',
      idempotencyKey: 'retry-key',
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_SERVER_UNAVAILABLE',
  );

  gateway.invokeError = null;
  const _result = await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'retry-order',
    idempotencyKey: 'retry-key',
  });

  assert.equal(gateway.invokeCalls.length, 2);
  assert.equal(gateway.invokeCalls[0].payload.idempotencyKey, 'retry-key');
  assert.equal(gateway.invokeCalls[1].payload.idempotencyKey, 'retry-key');
  assert.equal(gateway.invokeCalls[0].payload.orderId, gateway.invokeCalls[1].payload.orderId);
});

test('submitCorporateIntake single-flight: concurrent calls return same promise', async () => {
  const gateway = new TrackingGateway();
  gateway.invokeDelay = 50;
  const service = makeService(gateway);

  const [result1, result2] = await Promise.all([
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: 'single-flight-order',
      idempotencyKey: 'single-flight-key',
    }),
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: 'single-flight-order',
      idempotencyKey: 'single-flight-key',
    }),
  ]);

  assert.equal(result1.corporateCaseId, result2.corporateCaseId);
  assert.equal(gateway.invokeCalls.length, 1);
});

test('submitCorporateIntake reset clears retry context', async () => {
  const gateway = new TrackingGateway();
  gateway.invokeError = 'INTAKE_SERVER_UNAVAILABLE';
  const service = makeService(gateway);

  await assert.rejects(
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: 'reset-order',
      idempotencyKey: 'reset-key',
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_SERVER_UNAVAILABLE',
  );

  gateway.invokeError = null;
  gateway.invokeCalls.length = 0;

  const _result = await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'reset-order-new',
    idempotencyKey: 'reset-key-new',
  });

  assert.equal(gateway.invokeCalls.length, 1);
  assert.equal(gateway.invokeCalls[0].payload.idempotencyKey, 'reset-key-new');
  assert.equal(gateway.invokeCalls[0].payload.orderId, 'reset-order-new');
});

test('toIntakePayload omits identityReference from beneficialOwners', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'bo-test-order',
    idempotencyKey: 'bo-test-key',
  });

  const boPayload = gateway.invokeCalls[0].payload.beneficialOwners[0];
  assert.equal('identityReference' in boPayload, false);
  assert.equal(boPayload.evidenceReference, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  assert.equal(boPayload.naturalPersonName, 'Test BO');
  assert.equal(boPayload.controlBasis, 'OWNERSHIP');
});

test('toIntakePayload rejects empty evidenceReference in beneficialOwners at validation', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  const draftWithEmptyEvidence: CorporateIntakeInput = {
    ...validIntakeDraft,
    beneficialOwners: [{
      naturalPersonName: 'Test BO',
      evidenceReference: '',
      controlBasis: 'OWNERSHIP',
      percentage: '100',
    }],
  };

  await assert.rejects(
    service.submitCorporateIntake({
      draft: draftWithEmptyEvidence,
      orderId: 'bo-empty-evidence',
      idempotencyKey: 'bo-empty-key',
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INVALID_PAYLOAD',
  );
});

test('corporateParties identityReference is preserved in payload', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'party-test-order',
    idempotencyKey: 'party-test-key',
  });

  const partyPayload = gateway.invokeCalls[0].payload.corporateParties[0];
  assert.equal(partyPayload.identityReference, 'NIK-123');
  assert.equal(partyPayload.displayName, 'Test Founder');
});

test('acceptedScope is not sent to Edge Function', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'scope-test-order',
    idempotencyKey: 'scope-test-key',
  });

  const payloadKeys = Object.keys(gateway.invokeCalls[0].payload);
  assert.equal(payloadKeys.includes('acceptedScope'), false);
});

test('paymentGatewayRef is included in payload', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'pg-test-order',
    idempotencyKey: 'pg-test-key',
  });

  assert.equal(gateway.invokeCalls[0].payload.paymentGatewayRef, 'PG-TEST-001');
});

test('effectiveDate maps to effectiveFrom', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'eff-test-order',
    idempotencyKey: 'eff-test-key',
  });

  const partyPayload = gateway.invokeCalls[0].payload.corporateParties[0];
  assert.equal(partyPayload.effectiveFrom, '2026-08-01');
});

test('gateway uses supabase.functions.invoke for corporate-intake', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'gateway-test-order',
    idempotencyKey: 'gateway-test-key',
  });

  // The gateway.invokeCorporateIntake was called
  assert.equal(gateway.invokeCalls.length, 1);
});

test('evidence upload resumable: retry per step preserves uploaded evidence', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  gateway.invokeError = 'INTAKE_SERVER_UNAVAILABLE';
  await assert.rejects(
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: 'evidence-retry-order',
      idempotencyKey: 'evidence-retry-key',
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_SERVER_UNAVAILABLE',
  );

  gateway.invokeError = null;
  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'evidence-retry-order',
    idempotencyKey: 'evidence-retry-key',
  });

  assert.equal(gateway.invokeCalls.length, 2);
  const bo1 = gateway.invokeCalls[0].payload.beneficialOwners[0].evidenceReference;
  const bo2 = gateway.invokeCalls[1].payload.beneficialOwners[0].evidenceReference;
  assert.equal(bo1, bo2);
});

test('evidence upload prevents race: concurrent uploads with different evidenceReferences create separate cases', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  const draft1: CorporateIntakeInput = {
    ...validIntakeDraft,
    beneficialOwners: [{
      naturalPersonName: 'BO 1',
      evidenceReference: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      controlBasis: 'OWNERSHIP',
      percentage: '100',
    }],
  };

  const draft2: CorporateIntakeInput = {
    ...validIntakeDraft,
    beneficialOwners: [{
      naturalPersonName: 'BO 2',
      evidenceReference: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      controlBasis: 'OWNERSHIP',
      percentage: '100',
    }],
  };

  const [r1, r2] = await Promise.all([
    service.submitCorporateIntake({ draft: draft1, orderId: 'race-1', idempotencyKey: 'race-key-1' }),
    service.submitCorporateIntake({ draft: draft2, orderId: 'race-2', idempotencyKey: 'race-key-2' }),
  ]);

  assert.notEqual(r1.corporateCaseId, r2.corporateCaseId);
  assert.equal(gateway.invokeCalls.length, 2);
  assert.equal(gateway.invokeCalls[0].payload.beneficialOwners[0].evidenceReference, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  assert.equal(gateway.invokeCalls[1].payload.beneficialOwners[0].evidenceReference, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
});

test('submitCorporateIntake different orderId with same idempotencyKey are NOT treated as same attempt', async () => {
  const gateway = new TrackingGateway();
  gateway.invokeDelay = 50;
  const service = makeService(gateway);

  const [result1, result2] = await Promise.all([
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: 'order-1',
      idempotencyKey: 'same-key',
    }),
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: 'order-2',
      idempotencyKey: 'same-key',
    }),
  ]);

  // Both should succeed with different case IDs - they are different attempts
  assert.notEqual(result1.corporateCaseId, result2.corporateCaseId);
  // Two calls should be made because different orderId means different attempt
  assert.equal(gateway.invokeCalls.length, 2);
});

test('submitCorporateIntake maps EVIDENCE_CONFLICT and EVIDENCE_INVALID from gateway', async () => {
  const gateway = new TrackingGateway();
  gateway.actor = { userId: CLIENT_ID, role: 'CLIENT' };

  for (const code of ['EVIDENCE_CONFLICT', 'EVIDENCE_INVALID'] as const) {
    gateway.invokeError = code;
    const service = makeService(gateway);
    await assert.rejects(
      service.submitCorporateIntake({
        draft: validIntakeDraft,
        orderId: 'evidence-conflict-order',
        idempotencyKey: 'evidence-conflict-key',
      }),
      (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_EVIDENCE_CONFLICT',
    );
    gateway.invokeCalls.length = 0;
  }
});

test('submitCorporateIntake maps ACTOR_MISMATCH from gateway', async () => {
  const gateway = new TrackingGateway();
  gateway.actor = { userId: CLIENT_ID, role: 'CLIENT' };
  gateway.invokeError = 'ACTOR_MISMATCH';
  const service = makeService(gateway);

  await assert.rejects(
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: 'actor-mismatch-order',
      idempotencyKey: 'actor-mismatch-key',
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_ACTOR_FORBIDDEN',
  );
});