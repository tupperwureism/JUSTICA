export const CORPORATE_ENTITY_TYPES = ['PT_ORDINARY', 'PT_INDIVIDUAL_UMK', 'CV'] as const;
export const CORPORATE_PARTY_TYPES = ['NATURAL_PERSON', 'LEGAL_ENTITY'] as const;
export const CORPORATE_PARTY_ROLES = [
  'FOUNDER',
  'SHAREHOLDER',
  'DIRECTOR',
  'COMMISSIONER',
  'ACTIVE_PARTNER',
  'PASSIVE_PARTNER',
] as const;
export const BENEFICIAL_OWNER_CONTROL_BASES = [
  'OWNERSHIP',
  'VOTING_RIGHTS',
  'APPOINTMENT_REMOVAL',
  'EFFECTIVE_CONTROL',
  'BENEFICIAL_ENTITLEMENT',
] as const;

export type CorporateEntityType = typeof CORPORATE_ENTITY_TYPES[number];
export type CorporatePartyType = typeof CORPORATE_PARTY_TYPES[number];
export type CorporatePartyRole = typeof CORPORATE_PARTY_ROLES[number];
export type BeneficialOwnerControlBasis = typeof BENEFICIAL_OWNER_CONTROL_BASES[number];

export type CorporatePartyDraft = {
  partyType: CorporatePartyType;
  role: CorporatePartyRole;
  displayName: string;
  identityReference: string;
  ownershipPercentage: string;
  votingPercentage: string;
  effectiveDate: string;
};

export type BeneficialOwnerDraft = {
  naturalPersonName: string;
  identityReference: string;
  controlBasis: BeneficialOwnerControlBasis;
  percentage: string;
};

export type CorporateIntakeDraft = {
  entityType: CorporateEntityType;
  businessName: string;
  domicileCity: string;
  domicileProvince: string;
  kbliCodes: string[];
  authorizedCapitalIdr: string;
  paidUpCapitalIdr: string;
  corporateParties: CorporatePartyDraft[];
  beneficialOwners: BeneficialOwnerDraft[];
  acceptedScope: boolean;
};

export type CorporateIntakeValidationIssue = {
  code: string;
  message: string;
};

export const createEmptyCorporateParty = (): CorporatePartyDraft => ({
  partyType: 'NATURAL_PERSON',
  role: 'FOUNDER',
  displayName: '',
  identityReference: '',
  ownershipPercentage: '',
  votingPercentage: '',
  effectiveDate: '',
});

export const createEmptyBeneficialOwner = (): BeneficialOwnerDraft => ({
  naturalPersonName: '',
  identityReference: '',
  controlBasis: 'OWNERSHIP',
  percentage: '',
});

export const EMPTY_INTAKE_DRAFT: CorporateIntakeDraft = {
  entityType: 'PT_ORDINARY',
  businessName: '',
  domicileCity: '',
  domicileProvince: '',
  kbliCodes: [''],
  authorizedCapitalIdr: '',
  paidUpCapitalIdr: '',
  corporateParties: [createEmptyCorporateParty()],
  beneficialOwners: [createEmptyBeneficialOwner()],
  acceptedScope: false,
};

const isPresent = (value: string) => value.trim().length > 0;
const isAllowed = <T extends readonly string[]>(values: T, value: string): value is T[number] => values.includes(value);
const isPercentage = (value: string) => {
  const numberValue = Number(value);
  return isPresent(value) && Number.isFinite(numberValue) && numberValue >= 0 && numberValue <= 100;
};
const isNonNegativeAmount = (value: string) => {
  const numberValue = Number(value);
  return isPresent(value) && Number.isFinite(numberValue) && numberValue >= 0;
};
const isIsoCalendarDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const addCorporateParty = (draft: CorporateIntakeDraft): CorporateIntakeDraft => ({
  ...draft,
  corporateParties: [...draft.corporateParties, createEmptyCorporateParty()],
});

export const removeCorporateParty = (draft: CorporateIntakeDraft, index: number): CorporateIntakeDraft => {
  if (draft.corporateParties.length <= 1) return draft;
  return {
    ...draft,
    corporateParties: draft.corporateParties.filter((_, partyIndex) => partyIndex !== index),
  };
};

export const addBeneficialOwner = (draft: CorporateIntakeDraft): CorporateIntakeDraft => ({
  ...draft,
  beneficialOwners: [...draft.beneficialOwners, createEmptyBeneficialOwner()],
});

export const removeBeneficialOwner = (draft: CorporateIntakeDraft, index: number): CorporateIntakeDraft => {
  if (draft.beneficialOwners.length <= 1) return draft;
  return {
    ...draft,
    beneficialOwners: draft.beneficialOwners.filter((_, ownerIndex) => ownerIndex !== index),
  };
};

export const addKbliCode = (draft: CorporateIntakeDraft): CorporateIntakeDraft => ({
  ...draft,
  kbliCodes: [...draft.kbliCodes, ''],
});

export const removeKbliCode = (draft: CorporateIntakeDraft, index: number): CorporateIntakeDraft => {
  if (draft.kbliCodes.length <= 1) return draft;
  return {
    ...draft,
    kbliCodes: draft.kbliCodes.filter((_, kbliIndex) => kbliIndex !== index),
  };
};

const issue = (code: string, message: string): CorporateIntakeValidationIssue => ({ code, message });

const validateEntityType = (draft: CorporateIntakeDraft): CorporateIntakeValidationIssue[] => {
  const issues: CorporateIntakeValidationIssue[] = [];
  if (!isAllowed(CORPORATE_ENTITY_TYPES, draft.entityType)) issues.push(issue('ENTITY_TYPE_INVALID', 'Jenis entitas tidak valid.'));
  return issues;
};

const validateBusinessDetails = (draft: CorporateIntakeDraft): CorporateIntakeValidationIssue[] => {
  const issues: CorporateIntakeValidationIssue[] = [];
  if (!isPresent(draft.businessName)) issues.push(issue('BUSINESS_NAME_REQUIRED', 'Nama usulan wajib diisi.'));
  if (!isPresent(draft.domicileCity)) issues.push(issue('DOMICILE_CITY_REQUIRED', 'Kota domisili wajib diisi.'));
  if (!isPresent(draft.domicileProvince)) issues.push(issue('DOMICILE_PROVINCE_REQUIRED', 'Provinsi domisili wajib diisi.'));
  if (!draft.kbliCodes.length || draft.kbliCodes.some((code) => !isPresent(code))) issues.push(issue('KBLI_REQUIRED', 'Minimal satu KBLI wajib diisi.'));
  return issues;
};

const validateCorporateParties = (draft: CorporateIntakeDraft): CorporateIntakeValidationIssue[] => {
  const issues: CorporateIntakeValidationIssue[] = [];
  if (!isNonNegativeAmount(draft.authorizedCapitalIdr)) issues.push(issue('AUTHORIZED_CAPITAL_INVALID', 'Modal dasar harus berupa angka IDR non-negatif.'));
  if (!isNonNegativeAmount(draft.paidUpCapitalIdr)) issues.push(issue('PAID_UP_CAPITAL_INVALID', 'Modal disetor harus berupa angka IDR non-negatif.'));
  if (isNonNegativeAmount(draft.authorizedCapitalIdr) && isNonNegativeAmount(draft.paidUpCapitalIdr)
    && Number(draft.paidUpCapitalIdr) > Number(draft.authorizedCapitalIdr)) {
    issues.push(issue('PAID_UP_EXCEEDS_AUTHORIZED', 'Modal disetor tidak boleh melebihi modal dasar.'));
  }
  if (!draft.corporateParties.length) issues.push(issue('CORPORATE_PARTY_REQUIRED', 'Minimal satu pihak korporasi wajib diisi.'));
  draft.corporateParties.forEach((party, index) => {
    if (!isAllowed(CORPORATE_PARTY_TYPES, party.partyType)) issues.push(issue('PARTY_TYPE_INVALID', `Jenis pihak pada baris ${index + 1} tidak valid.`));
    if (!isAllowed(CORPORATE_PARTY_ROLES, party.role)) issues.push(issue('PARTY_ROLE_INVALID', `Peran pihak pada baris ${index + 1} tidak valid.`));
    if (!isPresent(party.displayName)) issues.push(issue('PARTY_NAME_REQUIRED', `Nama pihak pada baris ${index + 1} wajib diisi.`));
    if (!isPresent(party.identityReference)) issues.push(issue('PARTY_IDENTITY_REFERENCE_REQUIRED', `Referensi identitas pihak pada baris ${index + 1} wajib diisi.`));
    if (!isPercentage(party.ownershipPercentage)) issues.push(issue('OWNERSHIP_PERCENTAGE_INVALID', `Persentase kepemilikan pada baris ${index + 1} harus 0–100.`));
    if (!isPercentage(party.votingPercentage)) issues.push(issue('VOTING_PERCENTAGE_INVALID', `Persentase hak suara pada baris ${index + 1} harus 0–100.`));
    if (!isIsoCalendarDate(party.effectiveDate)) issues.push(issue('PARTY_EFFECTIVE_DATE_INVALID', `Tanggal efektif pihak pada baris ${index + 1} harus berupa tanggal kalender YYYY-MM-DD.`));
  });
  return issues;
};

const validateBeneficialOwners = (draft: CorporateIntakeDraft): CorporateIntakeValidationIssue[] => {
  const issues: CorporateIntakeValidationIssue[] = [];
  if (!draft.beneficialOwners.length) issues.push(issue('BENEFICIAL_OWNER_REQUIRED', 'Minimal satu pemilik manfaat wajib diisi.'));
  draft.beneficialOwners.forEach((owner, index) => {
    if (!isPresent(owner.naturalPersonName)) issues.push(issue('BENEFICIAL_OWNER_NAME_REQUIRED', `Nama pemilik manfaat pada baris ${index + 1} wajib diisi.`));
    if (!isPresent(owner.identityReference)) issues.push(issue('BENEFICIAL_OWNER_IDENTITY_REFERENCE_REQUIRED', `Referensi identitas pemilik manfaat pada baris ${index + 1} wajib diisi.`));
    if (!isAllowed(BENEFICIAL_OWNER_CONTROL_BASES, owner.controlBasis)) issues.push(issue('CONTROL_BASIS_INVALID', `Dasar kendali pada baris ${index + 1} tidak valid.`));
    if (!isPercentage(owner.percentage)) issues.push(issue('BENEFICIAL_OWNER_PERCENTAGE_INVALID', `Persentase pemilik manfaat pada baris ${index + 1} harus 0–100.`));
  });
  const beneficialOwnerIdentities = draft.beneficialOwners
    .map((owner) => owner.identityReference.trim())
    .filter(Boolean);
  if (new Set(beneficialOwnerIdentities).size !== beneficialOwnerIdentities.length) {
    issues.push(issue(
      'DUPLICATE_BENEFICIAL_OWNER_IDENTITY_REFERENCE',
      'Referensi identitas pemilik manfaat tidak boleh duplikat.',
    ));
  }
  return issues;
};

const validateScopeAcceptance = (draft: CorporateIntakeDraft): CorporateIntakeValidationIssue[] => (
  draft.acceptedScope
    ? []
    : [issue('SCOPE_ACCEPTANCE_REQUIRED', 'Persetujuan ruang lingkup wajib diberikan sebelum mengirim.')]
);

const intakeStepValidators: Readonly<Record<number, (draft: CorporateIntakeDraft) => CorporateIntakeValidationIssue[]>> = {
  0: validateEntityType,
  1: validateBusinessDetails,
  2: validateCorporateParties,
  3: validateBeneficialOwners,
  4: validateScopeAcceptance,
};

export function validateCorporateIntake(draft: CorporateIntakeDraft): CorporateIntakeValidationIssue[] {
  return [
    ...validateEntityType(draft),
    ...validateBusinessDetails(draft),
    ...validateCorporateParties(draft),
    ...validateBeneficialOwners(draft),
    ...validateScopeAcceptance(draft),
  ];
}

export function validateCorporateIntakeStep(draft: CorporateIntakeDraft, step: number): CorporateIntakeValidationIssue | null {
  return intakeStepValidators[step]?.(draft)[0] ?? null;
}
