export {
  EMPTY_INTAKE_DRAFT,
  createEmptyCorporateIntakeDraft,
  addBeneficialOwner,
  addCorporateParty,
  addKbliCode,
  removeBeneficialOwner,
  removeCorporateParty,
  removeKbliCode,
  validateCorporateIntake,
  validateCorporateIntakeStep,
} from '@/models/corporateIntake';
export type {
  BeneficialOwnerControlBasis,
  BeneficialOwnerDraft,
  CorporateEntityType,
  CorporateIntakeDraft,
  CorporateIntakeValidationIssue,
  CorporatePartyDraft,
  CorporatePartyRole,
  CorporatePartyType,
} from '@/models/corporateIntake';

export type CorporateCaseStage =
  | 'DRAFT'
  | 'ESCROW_LOCKED'
  | 'NOTARY_REVIEW'
  | 'CUSTOMER_ACTION_REQUIRED'
  | 'COMPLIANCE_HOLD'
  | 'COMPLETED';

export const INTAKE_STEPS = [
  'Jenis Entitas',
  'Nama & KBLI',
  'Pendiri & Saham',
  'Beneficial Owner',
  'Review & Escrow',
] as const;

export const CORPORATE_STAGES = [
  ['DRAFT', 'Draf'],
  ['ESCROW_LOCKED', 'Escrow terkunci'],
  ['NOTARY_REVIEW', 'Review notaris'],
  ['CUSTOMER_ACTION_REQUIRED', 'Tindakan klien diperlukan'],
  ['COMPLIANCE_HOLD', 'Proses ditahan'],
  ['COMPLETED', 'Selesai'],
] as const;

export const CLIENT_STAGE_COPY: Record<CorporateCaseStage, { label: string; tone: string; detail: string }> = {
  DRAFT: { label: 'Draft', tone: 'secondary', detail: 'Lengkapi intake dan setujui penawaran.' },
  ESCROW_LOCKED: { label: 'Escrow Locked', tone: 'primary', detail: 'Dana aman di rekening bersama; notaris telah diberi tugas.' },
  NOTARY_REVIEW: { label: 'Review', tone: 'info', detail: 'Notaris memeriksa kelengkapan formalitas.' },
  CUSTOMER_ACTION_REQUIRED: { label: 'Tindakan diperlukan', tone: 'warning', detail: 'Ada data atau dokumen yang perlu dilengkapi.' },
  COMPLIANCE_HOLD: { label: 'Hold', tone: 'danger', detail: 'Proses sementara ditahan. Tim akan menghubungi Anda bila ada tindakan.' },
  COMPLETED: { label: 'Selesai', tone: 'success', detail: 'Dokumen final tersedia melalui akses terotorisasi.' },
};
