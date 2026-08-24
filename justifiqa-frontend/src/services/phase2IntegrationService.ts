import type { Database } from '@/types/database.types';
import {
  validateCorporateIntake,
  type CorporateIntakeDraft,
} from '../models/corporateIntake.ts';

export type Phase2PortalRole = 'CLIENT' | 'ADVOCATE' | 'ADMIN';
export type Phase2Actor = { userId: string; role: Phase2PortalRole };

export type CorporateEscrowStatus =
  | 'PENDING_PAYMENT'
  | 'HELD_IN_ESCROW'
  | 'HOLDING_PERIOD_24H'
  | 'FROZEN_DISPUTE'
  | 'RELEASED_TO_ADVOCATE'
  | 'REFUNDED_TO_CLIENT'
  | 'RESOLVED_SPLIT_SETTLEMENT';

type Phase2Enums = Database['public']['Enums'];

export type CorporateEscrowProjection = {
  escrowId: string;
  status: CorporateEscrowStatus;
  totalAmountIdr: number;
  paymentGatewayRef: string;
  fundsLockedAt: string | null;
};

export type ClientCorporateWorkspace = {
  caseId: string;
  orderId: string;
  entityName: string;
  entityType: string;
  currentStage: string;
  externalReference: string | null;
  escrow: CorporateEscrowProjection;
};

export type NotaryWorkspace = {
  caseId: string;
  caseCode: string;
  entityName: string;
  entityType: string;
  currentStage: string;
  domicile: string;
  kbliLabel: string;
  beneficialOwners: Array<{
    id: string;
    name: string;
    controlBasis: string;
    percentage: number | null;
    verificationStatus: string;
  }>;
  cddAssessment: {
    assessmentId: string;
    pepStatus: string;
    sanctionsStatus: string;
    decision: string;
    rulesVersion: string;
  } | null;
  submissions: Array<{
    id: string;
    system: string;
    status: string;
    reference: string | null;
  }>;
};

export type EkycWorkspace = {
  envelopeId: string;
  documentTitle: string;
  providerName: string;
  status: Phase2Enums['signing_envelope_status'];
  globalStatus: Phase2Enums['signing_envelope_global_status'];
  expiresAt: string | null;
  haltReason: Phase2Enums['signing_envelope_halt_reason'] | null;
  currentPartyId: string;
  currentVerification: {
    status: Phase2Enums['ekyc_verification_status'];
    attemptCount: number;
    verifiedAt: string | null;
  } | null;
  parties: Array<{
    id: string;
    email: string;
    role: Phase2Enums['signing_party_role'];
    status: Phase2Enums['signing_party_status'];
    signingOrder: number;
  }>;
};

export type EligibleCaseProjection = {
  caseId: string;
  orderId: string;
  entityType: string;
  proposedName: string;
  currentStage: string;
  domicileCity: string;
  domicileProvince: string;
  escrowStatus: string;
  fundsLockedAt: string | null;
  assignedNotaryId: string | null;
};

export type VerifiedNotaryProjection = {
  notaryId: string;
  fullName: string;
  licenseNumber: string;
  jurisdictionCity: string;
  jurisdictionProvince: string;
  status: string;
};

export type AssignmentContext = {
  cases: EligibleCaseProjection[];
  notaries: VerifiedNotaryProjection[];
};

export type AssignNotaryResult = {
  caseId: string;
  assignedNotaryId: string;
  currentStage: string;
  replayed: boolean;
};

export type ApproveCddResult = {
  caseId: string;
  assessmentId: string;
  currentStage: string;
  replayed: boolean;
};

export type CorporateIntakeInput = CorporateIntakeDraft;

export type SubmitCorporateIntakeResult = {
  orderId: string;
  corporateCaseId: string;
  escrowId: string;
  pricingCatalogId: string;
  quoteVersion: number;
  legalScopeVersion: string;
  totalAmountIdr: string;
  replayed: boolean;
};

export type IntakePayload = {
  orderId: string;
  entityType: string;
  proposedName: string;
  domicileCity: string;
  domicileProvince: string;
  kbliSnapshot: string[];
  authorizedCapitalIdr: string;
  paidUpCapitalIdr: string;
  corporateParties: Array<{
    partyType?: string;
    role: string;
    displayName: string;
    identityReference: string;
    ownershipPercentage?: number;
    votingPercentage?: number;
    effectiveFrom?: string;
  }>;
  beneficialOwners: Array<{
    declarationVersion: number;
    naturalPersonName: string;
    evidenceReference: string;
    controlBasis: string;
    percentage?: number;
  }>;
  idempotencyKey: string;
};

export interface Phase2IntegrationGateway {
  getActor(): Promise<Phase2Actor | null>;
  getClientCorporateWorkspace(userId: string): Promise<ClientCorporateWorkspace | null>;
  getNotaryWorkspace(userId: string): Promise<NotaryWorkspace | null>;
  listNotaryWorkspaces?(userId: string): Promise<NotaryWorkspace[]>;
  getEkycWorkspace(userId: string): Promise<EkycWorkspace | null>;
  listAssignmentContext?(): Promise<AssignmentContext>;
  assignNotary?(input: {
    caseId: string;
    notaryId: string;
    idempotencyKey: string;
  }): Promise<AssignNotaryResult>;
  approveCddAssessment(input: {
    assessmentId: string;
    caseId?: string;
    rulesVersion?: string;
    idempotencyKey?: string;
  }): Promise<{
    assessmentId: string;
    caseId?: string;
    currentStage?: string;
    replayed: boolean;
  }>;
  invokeCorporateIntake(payload: IntakePayload): Promise<{
    data: SubmitCorporateIntakeResult | null;
    error: { code?: string } | null;
  }>;
}

export type Phase2IntegrationErrorCode =
  | 'SESSION_REQUIRED'
  | 'ROLE_FORBIDDEN'
  | 'INVALID_PAYLOAD'
  | 'RESOURCE_NOT_FOUND'
  | 'INTAKE_IDEMPOTENCY_CONFLICT'
  | 'INTAKE_EVIDENCE_CONFLICT'
  | 'INTAKE_ACTOR_FORBIDDEN'
  | 'BROWSER_BOUNDARY_UNAVAILABLE'
  | 'INTAKE_SERVER_UNAVAILABLE'
  | 'PRICING_CATALOG_UNAVAILABLE'
  | 'ASSIGNMENT_CONFLICT'
  | 'NOTARY_NOT_VERIFIED'
  | 'ESCROW_NOT_HELD'
  | 'CDD_NOT_READY'
  | 'STAGE_CONFLICT'
  | 'IDEMPOTENCY_CONFLICT';

const ERROR_MESSAGES: Record<Phase2IntegrationErrorCode, string> = {
  SESSION_REQUIRED: 'Sesi Anda tidak tersedia. Silakan masuk kembali lalu coba ulang.',
  ROLE_FORBIDDEN: 'Peran akun ini tidak diizinkan menjalankan tindakan tersebut.',
  INVALID_PAYLOAD: 'Data belum lengkap atau formatnya tidak valid. Periksa kembali isian Anda.',
  RESOURCE_NOT_FOUND: 'Data yang diminta tidak tersedia atau tidak dapat diakses oleh akun ini.',
  INTAKE_IDEMPOTENCY_CONFLICT: 'Pengajuan dengan kunci idempotensi yang sama sudah diproses. Tidak bisa diulang dengan data berbeda.',
  INTAKE_EVIDENCE_CONFLICT: 'Bukti sudah terpakai pada pengajuan lain atau tidak ditemukan.',
  INTAKE_ACTOR_FORBIDDEN: 'Akun tidak berwenang mengirim pengajuan ini.',
  BROWSER_BOUNDARY_UNAVAILABLE: 'Tindakan ini memerlukan endpoint server terotorisasi yang belum tersedia untuk browser.',
  INTAKE_SERVER_UNAVAILABLE: 'Layanan Corporate Intake sedang tidak tersedia. Coba beberapa saat lagi.',
  PRICING_CATALOG_UNAVAILABLE: 'Layanan belum dapat menerima intake karena katalog harga aktif belum tersedia. Hubungi admin atau coba lagi nanti.',
  ASSIGNMENT_CONFLICT: 'Perkara ini sudah ditugaskan ke Notaris lain atau terjadi konflik penugasan.',
  NOTARY_NOT_VERIFIED: 'Notaris yang dipilih belum memiliki kualifikasi terverifikasi aktif.',
  ESCROW_NOT_HELD: 'Dana escrow perkara ini belum terkunci di rekening penampung.',
  CDD_NOT_READY: 'Prasyarat screening CDD atau verifikasi Beneficial Owner belum lengkap.',
  STAGE_CONFLICT: 'Status siklus hidup perkara tidak memungkinkan tindakan ini.',
  IDEMPOTENCY_CONFLICT: 'Kunci idempotensi sudah pernah digunakan dengan data berbeda.',
};

export class Phase2IntegrationError extends Error {
  code: Phase2IntegrationErrorCode;

  constructor(code: Phase2IntegrationErrorCode) {
    super(ERROR_MESSAGES[code]);
    this.name = 'Phase2IntegrationError';
    this.code = code;
  }
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256_PATTERN = /^[0-9a-f]{64}$/;

const requireText = (value: string, maxLength = 192) => {
  const normalized = value.trim();
  if (!normalized || normalized.length > maxLength) {
    throw new Phase2IntegrationError('INVALID_PAYLOAD');
  }
  return normalized;
};

const requireActor = async (
  gateway: Phase2IntegrationGateway,
  roles: Phase2PortalRole[],
) => {
  const actor = await gateway.getActor();
  if (!actor || !UUID_PATTERN.test(actor.userId)) {
    throw new Phase2IntegrationError('SESSION_REQUIRED');
  }
  if (!roles.includes(actor.role)) {
    throw new Phase2IntegrationError('ROLE_FORBIDDEN');
  }
  return actor;
};

export function createPhase2IntegrationService(gateway: Phase2IntegrationGateway) {
  type InFlightIntake = {
    orderId: string;
    fingerprint: string;
    promise: Promise<SubmitCorporateIntakeResult>;
  };
  const inFlightIntake = new Map<string, InFlightIntake>();

  type InFlightAssign = {
    caseId: string;
    notaryId: string;
    promise: Promise<AssignNotaryResult>;
  };
  const inFlightAssign = new Map<string, InFlightAssign>();

  return {
    async loadClientCorporateWorkspace() {
      const actor = await requireActor(gateway, ['CLIENT']);
      return gateway.getClientCorporateWorkspace(actor.userId);
    },

    async listAssignmentContext(): Promise<AssignmentContext> {
      await requireActor(gateway, ['ADMIN']);
      if (typeof gateway.listAssignmentContext !== 'function') {
        throw new Phase2IntegrationError('BROWSER_BOUNDARY_UNAVAILABLE');
      }
      return gateway.listAssignmentContext();
    },

    assignNotary(input: {
      caseId: string;
      notaryId: string;
      idempotencyKey: string;
    }): Promise<AssignNotaryResult> {
      if (!UUID_PATTERN.test(input.caseId) || !UUID_PATTERN.test(input.notaryId) || !UUID_PATTERN.test(input.idempotencyKey)) {
        return Promise.reject(new Phase2IntegrationError('INVALID_PAYLOAD'));
      }

      const inFlightKey = `assign:${input.idempotencyKey}`;
      const existing = inFlightAssign.get(inFlightKey);
      if (existing) {
        if (existing.caseId !== input.caseId || existing.notaryId !== input.notaryId) {
          return requireActor(gateway, ['ADMIN']).then(() => {
            throw new Phase2IntegrationError('IDEMPOTENCY_CONFLICT');
          });
        }
        return existing.promise;
      }

      const executeAssign = async (): Promise<AssignNotaryResult> => {
        await requireActor(gateway, ['ADMIN']);
        if (typeof gateway.assignNotary !== 'function') {
          throw new Phase2IntegrationError('BROWSER_BOUNDARY_UNAVAILABLE');
        }
        return gateway.assignNotary(input);
      };

      const promise = executeAssign().finally(() => {
        if (inFlightAssign.get(inFlightKey)?.promise === promise) {
          inFlightAssign.delete(inFlightKey);
        }
      });

      inFlightAssign.set(inFlightKey, {
        caseId: input.caseId,
        notaryId: input.notaryId,
        promise,
      });

      return promise;
    },

    submitCorporateIntake(input: {
      draft: CorporateIntakeInput;
      orderId: string;
      idempotencyKey: string;
    }): Promise<SubmitCorporateIntakeResult> {
      if (!UUID_PATTERN.test(input.orderId) || !UUID_PATTERN.test(input.idempotencyKey)) {
        return Promise.reject(new Phase2IntegrationError('INVALID_PAYLOAD'));
      }

      const payload = toIntakePayload(input.draft, input.orderId, input.idempotencyKey);
      const fingerprint = canonicalPayloadFingerprint(payload);
      const existing = inFlightIntake.get(input.idempotencyKey);
      if (existing) {
        if (existing.orderId !== input.orderId || existing.fingerprint !== fingerprint) {
          return requireActor(gateway, ['CLIENT']).then(() => {
            throw new Phase2IntegrationError('INTAKE_IDEMPOTENCY_CONFLICT');
          });
        }
        return existing.promise;
      }

      const validationErrors = validateCorporateIntake(input.draft);
      if (validationErrors.length) {
        return Promise.reject(new Phase2IntegrationError('INVALID_PAYLOAD'));
      }

      const executeIntake = async (): Promise<SubmitCorporateIntakeResult> => {
        await requireActor(gateway, ['CLIENT']);
        const { data, error } = await gateway.invokeCorporateIntake(payload);
        if (error) {
          const code = error.code ?? '';
          if (code === 'IDEMPOTENCY_CONFLICT') throw new Phase2IntegrationError('INTAKE_IDEMPOTENCY_CONFLICT');
          if (code === 'EVIDENCE_CONFLICT' || code === 'EVIDENCE_INVALID') throw new Phase2IntegrationError('INTAKE_EVIDENCE_CONFLICT');
          if (code === 'ACTOR_MISMATCH') throw new Phase2IntegrationError('INTAKE_ACTOR_FORBIDDEN');
          if (code === 'PRICING_CATALOG_UNAVAILABLE') throw new Phase2IntegrationError('PRICING_CATALOG_UNAVAILABLE');
          throw new Phase2IntegrationError('INTAKE_SERVER_UNAVAILABLE');
        }
        if (!data || !data.corporateCaseId) {
          throw new Phase2IntegrationError('INTAKE_SERVER_UNAVAILABLE');
        }
        return data;
      };

      const promise = executeIntake().finally(() => {
        if (inFlightIntake.get(input.idempotencyKey)?.promise === promise) {
          inFlightIntake.delete(input.idempotencyKey);
        }
      });

      inFlightIntake.set(input.idempotencyKey, {
        orderId: input.orderId,
        fingerprint,
        promise,
      });
      return promise;
    },

    async refreshCorporateEscrow(caseId: string) {
      const actor = await requireActor(gateway, ['CLIENT']);
      if (!UUID_PATTERN.test(caseId)) throw new Phase2IntegrationError('INVALID_PAYLOAD');
      const workspace = await gateway.getClientCorporateWorkspace(actor.userId);
      if (!workspace || workspace.caseId !== caseId) {
        throw new Phase2IntegrationError('RESOURCE_NOT_FOUND');
      }
      return workspace;
    },

    async loadNotaryWorkspace(caseId?: string): Promise<NotaryWorkspace | null> {
      const actor = await requireActor(gateway, ['ADVOCATE']);
      if (caseId && typeof gateway.listNotaryWorkspaces === 'function') {
        const workspaces = await gateway.listNotaryWorkspaces(actor.userId);
        return workspaces.find((w) => w.caseId === caseId) ?? null;
      }
      return gateway.getNotaryWorkspace(actor.userId);
    },

    async loadNotaryWorkspaces(): Promise<NotaryWorkspace[]> {
      const actor = await requireActor(gateway, ['ADVOCATE']);
      if (typeof gateway.listNotaryWorkspaces === 'function') {
        return gateway.listNotaryWorkspaces(actor.userId);
      }
      const single = await gateway.getNotaryWorkspace(actor.userId);
      return single ? [single] : [];
    },

    async approveNotaryCdd(input: {
      caseId: string;
      assessmentId?: string;
      rulesVersion: string;
      idempotencyKey?: string;
    }) {
      const actor = await requireActor(gateway, ['ADVOCATE']);
      if (!UUID_PATTERN.test(input.caseId)) throw new Phase2IntegrationError('INVALID_PAYLOAD');
      if (input.assessmentId !== undefined && !UUID_PATTERN.test(input.assessmentId)) {
        throw new Phase2IntegrationError('INVALID_PAYLOAD');
      }
      const rulesVersion = requireText(input.rulesVersion, 32);
      let workspace: NotaryWorkspace | null = null;
      if (typeof gateway.listNotaryWorkspaces === 'function') {
        const workspaces = await gateway.listNotaryWorkspaces(actor.userId);
        workspace = workspaces.find((w) => w.caseId === input.caseId) ?? null;
      }
      if (!workspace) {
        workspace = await gateway.getNotaryWorkspace(actor.userId);
      }

      if (!workspace || workspace.caseId !== input.caseId) {
        throw new Phase2IntegrationError('RESOURCE_NOT_FOUND');
      }
      if (!workspace.beneficialOwners.length
        || workspace.beneficialOwners.some((owner) => owner.verificationStatus !== 'VERIFIED')) {
        throw new Phase2IntegrationError('INVALID_PAYLOAD');
      }
      const assessment = workspace.cddAssessment;
      if (!assessment
        || (input.assessmentId && assessment.assessmentId !== input.assessmentId)
        || assessment.rulesVersion !== rulesVersion
        || !['NO_MATCH', 'NOT_APPLICABLE'].includes(assessment.pepStatus)
        || !['NO_MATCH', 'NOT_APPLICABLE'].includes(assessment.sanctionsStatus)) {
        throw new Phase2IntegrationError('INVALID_PAYLOAD');
      }
      return gateway.approveCddAssessment({
        assessmentId: input.assessmentId || assessment.assessmentId,
        caseId: input.caseId,
        rulesVersion,
        idempotencyKey: input.idempotencyKey,
      });
    },

    async submitNotaryStamping(input: {
      caseId: string;
      fileName: string;
      fileType: string;
      fileSize: number;
      kemenkumhamNumber: string;
      nibNumber: string;
    }): Promise<never> {
      await requireActor(gateway, ['ADVOCATE']);
      if (!UUID_PATTERN.test(input.caseId)
        || input.fileType !== 'application/pdf'
        || !input.fileName.toLowerCase().endsWith('.pdf')
        || input.fileSize <= 0
        || input.fileSize > 10 * 1024 * 1024
        || (!input.kemenkumhamNumber.trim() && !input.nibNumber.trim())) {
        throw new Phase2IntegrationError('INVALID_PAYLOAD');
      }
      throw new Phase2IntegrationError('BROWSER_BOUNDARY_UNAVAILABLE');
    },

    async loadEkycWorkspace() {
      const actor = await requireActor(gateway, ['CLIENT', 'ADVOCATE']);
      return gateway.getEkycWorkspace(actor.userId);
    },

    async createSigningEnvelope(input: {
      documentTitle: string;
      documentSha256: string;
    }): Promise<never> {
      await requireActor(gateway, ['CLIENT', 'ADVOCATE']);
      requireText(input.documentTitle);
      if (!SHA256_PATTERN.test(input.documentSha256)) {
        throw new Phase2IntegrationError('INVALID_PAYLOAD');
      }
      throw new Phase2IntegrationError('BROWSER_BOUNDARY_UNAVAILABLE');
    },

    async beginEkycProviderSession(input: {
      envelopeId: string;
      otp: string;
    }): Promise<never> {
      await requireActor(gateway, ['CLIENT', 'ADVOCATE']);
      if (!UUID_PATTERN.test(input.envelopeId) || !/^\d{6}$/.test(input.otp)) {
        throw new Phase2IntegrationError('INVALID_PAYLOAD');
      }
      throw new Phase2IntegrationError('BROWSER_BOUNDARY_UNAVAILABLE');
    },
  };
}

function canonicalPayloadFingerprint(payload: IntakePayload): string {
  const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value)
          .filter(([, child]) => child !== undefined)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, child]) => [key, canonicalize(child)]),
      );
    }
    return value;
  };

  return JSON.stringify(canonicalize(payload));
}

function toIntakePayload(
  draft: CorporateIntakeDraft,
  orderId: string,
  idempotencyKey: string,
): IntakePayload {
  return {
    orderId,
    entityType: draft.entityType,
    proposedName: draft.businessName.trim(),
    domicileCity: draft.domicileCity.trim(),
    domicileProvince: draft.domicileProvince.trim(),
    kbliSnapshot: draft.kbliCodes.map((c) => c.trim()).filter(Boolean),
    authorizedCapitalIdr: draft.authorizedCapitalIdr,
    paidUpCapitalIdr: draft.paidUpCapitalIdr,
    corporateParties: draft.corporateParties.map((p) => ({
      partyType: p.partyType,
      role: p.role,
      displayName: p.displayName.trim(),
      identityReference: p.identityReference.trim(),
      ownershipPercentage: p.ownershipPercentage ? Number(p.ownershipPercentage) : undefined,
      votingPercentage: p.votingPercentage ? Number(p.votingPercentage) : undefined,
      effectiveFrom: p.effectiveDate || undefined,
    })),
    beneficialOwners: draft.beneficialOwners.map((o) => ({
      declarationVersion: 1,
      naturalPersonName: o.naturalPersonName.trim(),
      evidenceReference: o.evidenceReference ?? '',
      controlBasis: o.controlBasis,
      percentage: o.percentage ? Number(o.percentage) : undefined,
    })),
    idempotencyKey,
  };
}
