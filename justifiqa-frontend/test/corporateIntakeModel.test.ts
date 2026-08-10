import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addBeneficialOwner,
  addCorporateParty,
  createEmptyBeneficialOwner,
  createEmptyCorporateIntakeDraft,
  removeBeneficialOwner,
  removeCorporateParty,
  validateCorporateIntake,
  validateCorporateIntakeStep,
  type CorporateIntakeDraft,
} from '../src/models/corporateIntake.ts';

const validDraft = (): CorporateIntakeDraft => ({
  entityType: 'PT_ORDINARY',
  businessName: 'PT Uji Intake',
  domicileCity: 'Jakarta Selatan',
  domicileProvince: 'DKI Jakarta',
  kbliCodes: ['62019'],
  authorizedCapitalIdr: '100000000',
  paidUpCapitalIdr: '50000000',
  corporateParties: [{
    partyType: 'NATURAL_PERSON',
    role: 'FOUNDER',
    displayName: 'Siti Rahma',
    identityReference: 'NIK-TEST-001',
    ownershipPercentage: '100',
    votingPercentage: '100',
    effectiveDate: '2026-07-29',
  }],
  beneficialOwners: [{
    clientRowId: 'row-budi-santoso',
    naturalPersonName: 'Budi Santoso',
    evidenceReference: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    controlBasis: 'OWNERSHIP',
    percentage: '100',
  }],
  paymentGatewayRef: 'PG-TEST-001',
  acceptedScope: true,
});

const codesOf = (draft: CorporateIntakeDraft) => validateCorporateIntake(draft).map((issue) => issue.code);

test('corporate intake captures non-financial domicile and capital state', () => {
  const draft = validDraft();
  assert.deepEqual(codesOf(draft), []);
  assert.equal(validateCorporateIntakeStep(draft, 1), null);
  assert.equal(validateCorporateIntakeStep({ ...draft, domicileCity: '', domicileProvince: '' }, 1)?.code, 'DOMICILE_CITY_REQUIRED');
  assert.equal(validateCorporateIntakeStep({ ...draft, paidUpCapitalIdr: '100000001' }, 2)?.code, 'PAID_UP_EXCEEDS_AUTHORIZED');
});

test('party step ignores untouched beneficial-owner fields from the next step', () => {
  const draft = validDraft();
  draft.beneficialOwners[0] = {
    ...draft.beneficialOwners[0],
    naturalPersonName: '',
    evidenceReference: '',
    percentage: '',
  };

  assert.equal(validateCorporateIntakeStep(draft, 2), null);
});

test('corporate party rows can be added and cannot be removed below one', () => {
  const original = validDraft();
  const expanded = addCorporateParty(original);
  assert.equal(expanded.corporateParties.length, 2);
  assert.equal(removeCorporateParty(expanded, 1).corporateParties.length, 1);
  assert.strictEqual(removeCorporateParty(original, 0), original);
});

test('beneficial owner rows can be added and cannot be removed below one', () => {
  const original = validDraft();
  const expanded = addBeneficialOwner(original);
  assert.equal(expanded.beneficialOwners.length, 2);
  const addedRowId = expanded.beneficialOwners[1].clientRowId;
  assert.notEqual(addedRowId, original.beneficialOwners[0].clientRowId);
  assert.equal(removeBeneficialOwner(expanded, addedRowId).beneficialOwners.length, 1);
  assert.strictEqual(removeBeneficialOwner(original, original.beneficialOwners[0].clientRowId), original);
});

test('the same natural person can be both a corporate party and a beneficial owner', () => {
  const draft = validDraft();
  draft.beneficialOwners[0].evidenceReference = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  assert.deepEqual(codesOf(draft), []);
});

test('beneficial-owner evidence references must be unique within the declaration', () => {
  const draft = validDraft();
  draft.beneficialOwners.push({
    ...draft.beneficialOwners[0],
    clientRowId: 'row-budi-santoso-duplicate',
    naturalPersonName: 'Budi Santoso Duplikat',
    evidenceReference: draft.beneficialOwners[0].evidenceReference,
  });

  assert.ok(codesOf(draft).includes('DUPLICATE_BENEFICIAL_OWNER_EVIDENCE_REFERENCE'));
});

test('evidenceReference is required for beneficial owner at final validation', () => {
  const draft = validDraft();
  draft.beneficialOwners[0].evidenceReference = '';
  const codes = codesOf(draft);
  assert.ok(codes.includes('BENEFICIAL_OWNER_EVIDENCE_REFERENCE_REQUIRED'));
});

test('invalid evidenceReference format is rejected at final validation', () => {
  const draft = validDraft();
  draft.beneficialOwners[0].evidenceReference = 'not-a-uuid';
  const codes = codesOf(draft);
  assert.ok(codes.includes('BENEFICIAL_OWNER_EVIDENCE_REFERENCE_INVALID'));
});

test('effective dates must be valid ISO calendar dates before progression', () => {
  const draft = validDraft();
  draft.corporateParties[0].effectiveDate = '2026-02-30';
  assert.equal(validateCorporateIntakeStep(draft, 2)?.code, 'PARTY_EFFECTIVE_DATE_INVALID');
});

test('percentage values outside the RPC range are rejected before progression', () => {
  const draft = validDraft();
  draft.corporateParties[0].ownershipPercentage = '100.01';
  draft.beneficialOwners[0].percentage = '-1';
  const codes = codesOf(draft);
  assert.ok(codes.includes('OWNERSHIP_PERCENTAGE_INVALID'));
  assert.ok(codes.includes('BENEFICIAL_OWNER_PERCENTAGE_INVALID'));
  assert.equal(validateCorporateIntakeStep(draft, 2)?.code, 'OWNERSHIP_PERCENTAGE_INVALID');
});

test('final confirmation is required before the intake can be submitted', () => {
  const draft = validDraft();
  draft.acceptedScope = false;
  assert.equal(validateCorporateIntakeStep(draft, 4)?.code, 'SCOPE_ACCEPTANCE_REQUIRED');
});

test('createEmptyCorporateIntakeDraft default factory works without receiver error', () => {
  const draft = createEmptyCorporateIntakeDraft();
  assert.ok(draft);
  assert.equal(draft.beneficialOwners.length, 1);
  assert.ok(draft.beneficialOwners[0].clientRowId);
  assert.match(draft.beneficialOwners[0].clientRowId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('two factory calls produce distinct objects, arrays, BO, and clientRowId', () => {
  const draft1 = createEmptyCorporateIntakeDraft();
  const draft2 = createEmptyCorporateIntakeDraft();
  assert.notStrictEqual(draft1, draft2);
  assert.notStrictEqual(draft1.corporateParties, draft2.corporateParties);
  assert.notStrictEqual(draft1.beneficialOwners, draft2.beneficialOwners);
  assert.notStrictEqual(draft1.kbliCodes, draft2.kbliCodes);
  assert.notEqual(draft1.beneficialOwners[0].clientRowId, draft2.beneficialOwners[0].clientRowId);
  assert.notEqual(draft1.corporateParties[0], draft2.corporateParties[0]);
});

test('injected createId is called exactly once for initial BO and produces deterministic ID', () => {
  let callCount = 0;
  const deterministicId = '11111111-1111-4111-8111-111111111111';
  const createId = () => {
    callCount += 1;
    return deterministicId;
  };
  const draft = createEmptyCorporateIntakeDraft(createId);
  assert.equal(callCount, 1);
  assert.equal(draft.beneficialOwners[0].clientRowId, deterministicId);
});

test('createEmptyBeneficialOwner accepts optional createId and generates exactly one clientRowId', () => {
  let callCount = 0;
  const deterministicId = '22222222-2222-4222-8222-222222222222';
  const createId = () => {
    callCount += 1;
    return deterministicId;
  };
  const bo = createEmptyBeneficialOwner(createId);
  assert.equal(callCount, 1);
  assert.equal(bo.clientRowId, deterministicId);
  assert.equal(bo.naturalPersonName, '');
  assert.equal(bo.controlBasis, 'OWNERSHIP');
  assert.equal(bo.percentage, '');
});

test('createEmptyBeneficialOwner without createId uses crypto.randomUUID and generates valid UUID', () => {
  const bo = createEmptyBeneficialOwner();
  assert.ok(bo.clientRowId);
  assert.match(bo.clientRowId, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
});

test('no shared mutable state between factory calls', () => {
  const draft1 = createEmptyCorporateIntakeDraft();
  const draft2 = createEmptyCorporateIntakeDraft();
  draft1.businessName = 'Modified';
  draft1.beneficialOwners[0].naturalPersonName = 'Modified';
  assert.equal(draft2.businessName, '');
  assert.equal(draft2.beneficialOwners[0].naturalPersonName, '');
});
