import assert from 'node:assert/strict';
import test from 'node:test';
import {
  addBeneficialOwner,
  addCorporateParty,
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
  assert.equal(removeBeneficialOwner(expanded, 1).beneficialOwners.length, 1);
  assert.strictEqual(removeBeneficialOwner(original, 0), original);
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
