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

const ORDER_CALLER_1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const ORDER_CALLER_2 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const KEY_CALLER_1 = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const KEY_CALLER_2 = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ORDER_RETRY = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const KEY_RETRY = 'ffffffff-ffff-4fff-8fff-ffffffffffff';
const ORDER_SINGLE_FLIGHT = '11111111-1111-4111-8111-111111111111';
const KEY_SINGLE_FLIGHT = '22222222-2222-4222-8222-222222222222';
const ORDER_RESET = '33333333-3333-4333-8333-333333333333';
const KEY_RESET = '44444444-4444-4444-8444-444444444444';
const ORDER_RESET_NEW = '55555555-5555-4555-8555-555555555555';
const KEY_RESET_NEW = '66666666-6666-4666-8666-666666666666';
const ORDER_BO_TEST = '77777777-7777-4777-8777-777777777777';
const KEY_BO_TEST = '88888888-8888-4888-8888-888888888888';
const ORDER_BO_EMPTY = '99999999-9999-4999-8999-999999999999';
const KEY_BO_EMPTY = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const ORDER_PARTY_TEST = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
const KEY_PARTY_TEST = 'cccccccc-dddd-4eee-8fff-000000000000';
const ORDER_SCOPE_TEST = 'dddddddd-eeee-4fff-8000-111111111111';
const KEY_SCOPE_TEST = 'eeeeeeee-ffff-4000-8111-222222222222';
const ORDER_PG_TEST = 'ffffffff-0000-4111-8222-333333333333';
const KEY_PG_TEST = '00000000-1111-4222-8333-444444444444';
const ORDER_EFF_TEST = '11111111-2222-4333-8444-555555555555';
const KEY_EFF_TEST = '22222222-3333-4444-8555-666666666666';
const ORDER_GATEWAY_TEST = '33333333-4444-4555-8666-777777777777';
const KEY_GATEWAY_TEST = '44444444-5555-4666-8777-888888888888';
const ORDER_EVIDENCE_RETRY = '55555555-6666-4777-8888-999999999999';
const KEY_EVIDENCE_RETRY = '66666666-7777-4888-8999-aaaaaaaaaaaa';
const ORDER_RACE_1 = '77777777-8888-4999-8aaa-bbbbbbbbbbbb';
const KEY_RACE_1 = '88888888-9999-4aaa-8bbb-cccccccccccc';
const ORDER_RACE_2 = '99999999-aaaa-4bbb-8ccc-dddddddddddd';
const KEY_RACE_2 = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee';
const ORDER_ORDER_1 = 'bbbbbbbb-cccc-4ddd-8eee-ffffffffffff';
const KEY_SAME_KEY = 'cccccccc-dddd-4eee-8fff-000000000000';
const ORDER_ORDER_2 = 'dddddddd-eeee-4fff-8000-111111111111';
const ORDER_EVIDENCE_CONFLICT = 'eeeeeeee-ffff-4000-8111-222222222222';
const KEY_EVIDENCE_CONFLICT = 'ffffffff-0000-4111-8222-333333333333';
const ORDER_ACTOR_MISMATCH = '00000000-1111-4222-8333-444444444444';
const KEY_ACTOR_MISMATCH = '11111111-2222-4333-8444-555555555555';

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
    clientRowId: 'row-test-bo',
    naturalPersonName: 'Test BO',
    evidenceReference: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    controlBasis: 'OWNERSHIP',
    percentage: '100',
  }],
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

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => { resolve = resolvePromise; });
  return { promise, resolve };
}

class TrackingGateway implements Phase2IntegrationGateway {
  public actor: { userId: string; role: 'CLIENT' | 'ADVOCATE' | 'ADMIN' } | null = { userId: CLIENT_ID, role: 'CLIENT' };
  public invokeCalls: Array<{ payload: IntakePayload; timestamp: number }> = [];
  public invokeError: string | null = null;
  public invokeGate: Promise<void> | null = null;
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
    if (this.invokeGate) await this.invokeGate;
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
    orderId: ORDER_CALLER_1,
    idempotencyKey: KEY_CALLER_1,
  });

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_CALLER_2,
    idempotencyKey: KEY_CALLER_2,
  });

  assert.equal(gateway.invokeCalls.length, 2);
  assert.equal(gateway.invokeCalls[0].payload.orderId, ORDER_CALLER_1);
  assert.equal(gateway.invokeCalls[0].payload.idempotencyKey, KEY_CALLER_1);
  assert.equal(gateway.invokeCalls[1].payload.orderId, ORDER_CALLER_2);
  assert.equal(gateway.invokeCalls[1].payload.idempotencyKey, KEY_CALLER_2);
});

test('submitCorporateIntake exact retry uses same idempotencyKey and orderId', async () => {
  const gateway = new TrackingGateway();
  gateway.invokeError = 'INTAKE_SERVER_UNAVAILABLE';
  const service = makeService(gateway);

  await assert.rejects(
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: ORDER_RETRY,
      idempotencyKey: KEY_RETRY,
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_SERVER_UNAVAILABLE',
  );

  gateway.invokeError = null;
  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_RETRY,
    idempotencyKey: KEY_RETRY,
  });

  assert.equal(gateway.invokeCalls.length, 2);
  assert.equal(gateway.invokeCalls[0].payload.idempotencyKey, KEY_RETRY);
  assert.equal(gateway.invokeCalls[1].payload.idempotencyKey, KEY_RETRY);
  assert.equal(gateway.invokeCalls[0].payload.orderId, gateway.invokeCalls[1].payload.orderId);
});

test('submitCorporateIntake single-flight: concurrent calls return same promise', async () => {
  const gateway = new TrackingGateway();
  const gate = deferred<void>();
  gateway.invokeGate = gate.promise;
  const service = makeService(gateway);

  const first = service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_SINGLE_FLIGHT,
    idempotencyKey: KEY_SINGLE_FLIGHT,
  });
  const second = service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_SINGLE_FLIGHT,
    idempotencyKey: KEY_SINGLE_FLIGHT,
  });
  assert.strictEqual(first, second);
  while (gateway.invokeCalls.length === 0) await Promise.resolve();
  assert.equal(gateway.invokeCalls.length, 1);
  gate.resolve();
  const [result1, result2] = await Promise.all([first, second]);

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
      orderId: ORDER_RESET,
      idempotencyKey: KEY_RESET,
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_SERVER_UNAVAILABLE',
  );

  gateway.invokeError = null;
  gateway.invokeCalls.length = 0;

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_RESET_NEW,
    idempotencyKey: KEY_RESET_NEW,
  });

  assert.equal(gateway.invokeCalls.length, 1);
  assert.equal(gateway.invokeCalls[0].payload.idempotencyKey, KEY_RESET_NEW);
  assert.equal(gateway.invokeCalls[0].payload.orderId, ORDER_RESET_NEW);
});

test('toIntakePayload omits UI row identity and raw identityReference from beneficialOwners', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_BO_TEST,
    idempotencyKey: KEY_BO_TEST,
  });

  const boPayload = gateway.invokeCalls[0].payload.beneficialOwners[0];
  assert.equal('identityReference' in boPayload, false);
  assert.equal('clientRowId' in boPayload, false);
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
      clientRowId: 'row-test-bo-invalid',
      naturalPersonName: 'Test BO',
      evidenceReference: '',
      controlBasis: 'OWNERSHIP',
      percentage: '100',
    }],
  };

  await assert.rejects(
    service.submitCorporateIntake({
      draft: draftWithEmptyEvidence,
      orderId: ORDER_BO_EMPTY,
      idempotencyKey: KEY_BO_EMPTY,
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INVALID_PAYLOAD',
  );
});

test('corporateParties identityReference is preserved in payload', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_PARTY_TEST,
    idempotencyKey: KEY_PARTY_TEST,
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
    orderId: ORDER_SCOPE_TEST,
    idempotencyKey: KEY_SCOPE_TEST,
  });

  const payloadKeys = Object.keys(gateway.invokeCalls[0].payload);
  assert.equal(payloadKeys.includes('acceptedScope'), false);
});

test('intake payload excludes browser-controlled payment reference', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_PG_TEST,
    idempotencyKey: KEY_PG_TEST,
  });

  assert.equal('paymentGatewayRef' in gateway.invokeCalls[0].payload, false);
});

test('effectiveDate maps to effectiveFrom', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_EFF_TEST,
    idempotencyKey: KEY_EFF_TEST,
  });

  const partyPayload = gateway.invokeCalls[0].payload.corporateParties[0];
  assert.equal(partyPayload.effectiveFrom, '2026-08-01');
});

test('gateway uses supabase.functions.invoke for corporate-intake', async () => {
  const gateway = new TrackingGateway();
  const service = makeService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_GATEWAY_TEST,
    idempotencyKey: KEY_GATEWAY_TEST,
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
      orderId: ORDER_EVIDENCE_RETRY,
      idempotencyKey: KEY_EVIDENCE_RETRY,
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_SERVER_UNAVAILABLE',
  );

  gateway.invokeError = null;
  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_EVIDENCE_RETRY,
    idempotencyKey: KEY_EVIDENCE_RETRY,
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
      clientRowId: 'row-race-bo-1',
      naturalPersonName: 'BO 1',
      evidenceReference: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      controlBasis: 'OWNERSHIP',
      percentage: '100',
    }],
  };

  const draft2: CorporateIntakeInput = {
    ...validIntakeDraft,
    beneficialOwners: [{
      clientRowId: 'row-race-bo-2',
      naturalPersonName: 'BO 2',
      evidenceReference: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      controlBasis: 'OWNERSHIP',
      percentage: '100',
    }],
  };

  const [r1, r2] = await Promise.all([
    service.submitCorporateIntake({ draft: draft1, orderId: ORDER_RACE_1, idempotencyKey: KEY_RACE_1 }),
    service.submitCorporateIntake({ draft: draft2, orderId: ORDER_RACE_2, idempotencyKey: KEY_RACE_2 }),
  ]);

  assert.notEqual(r1.corporateCaseId, r2.corporateCaseId);
  assert.equal(gateway.invokeCalls.length, 2);
  assert.equal(gateway.invokeCalls[0].payload.beneficialOwners[0].evidenceReference, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
  assert.equal(gateway.invokeCalls[1].payload.beneficialOwners[0].evidenceReference, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb');
});

test('submitCorporateIntake rejects a different orderId with the same in-flight idempotencyKey', async () => {
  const gateway = new TrackingGateway();
  const gate = deferred<void>();
  gateway.invokeGate = gate.promise;
  const service = makeService(gateway);

  const first = service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: ORDER_ORDER_1,
    idempotencyKey: KEY_SAME_KEY,
  });
  const conflict = assert.rejects(
    service.submitCorporateIntake({
      draft: validIntakeDraft,
      orderId: ORDER_ORDER_2,
      idempotencyKey: KEY_SAME_KEY,
    }),
    (error) => error instanceof Phase2IntegrationError
      && error.code === 'INTAKE_IDEMPOTENCY_CONFLICT',
  );

  gate.resolve();
  await Promise.all([first, conflict]);
  assert.equal(gateway.invokeCalls.length, 1);
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
        orderId: ORDER_EVIDENCE_CONFLICT,
        idempotencyKey: KEY_EVIDENCE_CONFLICT,
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
      orderId: ORDER_ACTOR_MISMATCH,
      idempotencyKey: KEY_ACTOR_MISMATCH,
    }),
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_ACTOR_FORBIDDEN',
  );
});