import assert from 'node:assert/strict';
import test from 'node:test';
import {
  Phase2IntegrationError,
  createPhase2IntegrationService,
  type Phase2IntegrationGateway,
  type IntakePayload,
  type SubmitCorporateIntakeResult,
  type CorporateIntakeInput,
} from '../src/services/phase2IntegrationService.ts';

const CLIENT_ID = '11111111-1111-4111-8111-111111111111';
const CASE_ID = '33333333-3333-4333-8333-333333333333';

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
  paymentGatewayRef: 'PG-TEST-001',
  acceptedScope: true,
};

const baseResult: SubmitCorporateIntakeResult = {
  orderId: '66666666-6666-4666-8666-666666666666',
  corporateCaseId: CASE_ID,
  escrowId: '44444444-4444-4444-8444-444444444444',
  pricingCatalogId: '55555555-5555-4555-8555-555555555555',
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

class ConflictGateway implements Phase2IntegrationGateway {
  public actor = { userId: CLIENT_ID, role: 'CLIENT' as const };
  public invokeCalls = 0;
  public invokeGate: Promise<void> | null = null;
  async getActor() { return this.actor; }
  async getClientCorporateWorkspace() { return null; }
  async getNotaryWorkspace() { return null; }
  async getEkycWorkspace() { return null; }
  async approveCddAssessment() { return { assessmentId: '', replayed: false }; }
  async invokeCorporateIntake(_payload: IntakePayload) {
    this.invokeCalls += 1;
    if (this.invokeGate) await this.invokeGate;
    return { data: { ...baseResult }, error: null };
  }
}

test('intake single-flight: same key+orderId+payload returns same promise with one gateway call', async () => {
  const gateway = new ConflictGateway();
  const gate = deferred<void>();
  gateway.invokeGate = gate.promise;
  const service = createPhase2IntegrationService(gateway);

  const first = service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K',
  });
  const second = service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K',
  });
  assert.strictEqual(first, second);
  while (gateway.invokeCalls === 0) await Promise.resolve();
  gate.resolve();
  const [r1, r2] = await Promise.all([first, second]);

  assert.equal(r1.corporateCaseId, r2.corporateCaseId);
  assert.equal(gateway.invokeCalls, 1);
});

test('intake single-flight: same idempotencyKey but different orderId fails closed with INTAKE_IDEMPOTENCY_CONFLICT and no second call', async () => {
  const gateway = new ConflictGateway();
  const gate = deferred<void>();
  gateway.invokeGate = gate.promise;
  const service = createPhase2IntegrationService(gateway);

  const first = service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K',
  });
  const second = service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-B',
    idempotencyKey: 'key-K',
  });
  const secondRejection = assert.rejects(
    second,
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_IDEMPOTENCY_CONFLICT',
  );

  gate.resolve();
  await first;
  await secondRejection;

  assert.equal(gateway.invokeCalls, 1);
});

test('intake single-flight: same idempotencyKey+orderId but different payload fails closed with INTAKE_IDEMPOTENCY_CONFLICT', async () => {
  const gateway = new ConflictGateway();
  const gate = deferred<void>();
  gateway.invokeGate = gate.promise;
  const service = createPhase2IntegrationService(gateway);

  const first = service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K',
  });
  const conflictingDraft: CorporateIntakeInput = {
    ...validIntakeDraft,
    businessName: 'PT Different Company',
  };
  const second = service.submitCorporateIntake({
    draft: conflictingDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K',
  });
  const secondRejection = assert.rejects(
    second,
    (e) => e instanceof Phase2IntegrationError && e.code === 'INTAKE_IDEMPOTENCY_CONFLICT',
  );

  gate.resolve();
  await first;
  await secondRejection;

  assert.equal(gateway.invokeCalls, 1);
});

test('active key rejects a different invalid payload as idempotency conflict before validation', async () => {
  const gateway = new ConflictGateway();
  const gate = deferred<void>();
  gateway.invokeGate = gate.promise;
  const service = createPhase2IntegrationService(gateway);
  const first = service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K',
  });
  const invalidConflict = assert.rejects(
    service.submitCorporateIntake({
      draft: { ...validIntakeDraft, businessName: '' },
      orderId: 'order-A',
      idempotencyKey: 'key-K',
    }),
    (error) => error instanceof Phase2IntegrationError
      && error.code === 'INTAKE_IDEMPOTENCY_CONFLICT',
  );

  gate.resolve();
  await Promise.all([first, invalidConflict]);
  assert.equal(gateway.invokeCalls, 1);
});

test('intake single-flight: different idempotencyKey creates separate attempt', async () => {
  const gateway = new ConflictGateway();
  const service = createPhase2IntegrationService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K1',
  });
  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K2',
  });

  assert.equal(gateway.invokeCalls, 2);
});

test('intake single-flight: cleanup only removes entry if the finished promise is still the same one', async () => {
  const gateway = new ConflictGateway();
  const service = createPhase2IntegrationService(gateway);

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K',
  });

  await service.submitCorporateIntake({
    draft: validIntakeDraft,
    orderId: 'order-A',
    idempotencyKey: 'key-K',
  });

  assert.equal(gateway.invokeCalls, 2);
});
