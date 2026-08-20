import { supabase } from '@/lib/supabase';
import { getPortalRole } from '@/types/portalAuth';
import {
  createPhase2IntegrationService,
  type ClientCorporateWorkspace,
  type CorporateEscrowStatus,
  type EkycWorkspace,
  type IntakePayload,
  type NotaryWorkspace,
  type Phase2IntegrationGateway,
  type SubmitCorporateIntakeResult,
} from './phase2IntegrationService';
import { parseIntakeErrorCode, INTAKE_UNKNOWN_FALLBACK } from './intakeError';

export { parseIntakeErrorCode } from './intakeError';

const CORPORATE_SERVICE_TYPES = ['PT_ORDINARY', 'PT_INDIVIDUAL_UMK', 'CV'];
const CORPORATE_ESCROW_STATUSES: CorporateEscrowStatus[] = [
  'PENDING_PAYMENT',
  'HELD_IN_ESCROW',
  'HOLDING_PERIOD_24H',
  'FROZEN_DISPUTE',
  'RELEASED_TO_ADVOCATE',
  'REFUNDED_TO_CLIENT',
  'RESOLVED_SPLIT_SETTLEMENT',
];

const queryError = (message: string) => new Error(`PHASE2_QUERY_FAILED:${message}`);

const corporateEscrowStatus = (value: string): CorporateEscrowStatus => {
  const status = CORPORATE_ESCROW_STATUSES.find((candidate) => candidate === value);
  if (!status) throw queryError('ESCROW_STATUS_UNSUPPORTED');
  return status;
};

const kbliLabel = (snapshot: unknown) => {
  if (typeof snapshot === 'string') return snapshot;
  if (Array.isArray(snapshot)) return snapshot.filter((item) => typeof item === 'string').join(', ');
  if (snapshot && typeof snapshot === 'object') {
    const record = snapshot as Record<string, unknown>;
    const value = record.code ?? record.kbli ?? record.primary;
    if (typeof value === 'string') return value;
  }
  return 'KBLI tersimpan';
};

export const phase2SupabaseGateway: Phase2IntegrationGateway = {
  async getActor() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw queryError(error.message);
    const user = data.session?.user ?? null;
    const role = getPortalRole(user);
    return user && role ? { userId: user.id, role } : null;
  },

  async getClientCorporateWorkspace(userId) {
    const orders = await supabase.from('service_orders')
      .select('order_id').eq('client_id', userId)
      .in('service_type', CORPORATE_SERVICE_TYPES)
      .order('created_at', { ascending: false }).limit(20);
    if (orders.error) throw queryError(orders.error.message);
    if (!orders.data.length) return null;

    const cases = await supabase.from('corporate_service_cases')
      .select('case_id,order_id,proposed_name,entity_type,current_stage,created_at')
      .in('order_id', orders.data.map(({ order_id }) => order_id))
      .order('created_at', { ascending: false }).limit(1);
    if (cases.error) throw queryError(cases.error.message);
    const corporateCase = cases.data[0];
    if (!corporateCase) return null;

    const [escrow, submissions] = await Promise.all([
      supabase.from('escrow_transactions')
        .select('escrow_id,status,total_amount_idr,payment_gateway_ref,funds_locked_at')
        .eq('corporate_case_id', corporateCase.case_id).maybeSingle(),
      supabase.from('government_submission_jobs')
        .select('external_registration_number,external_reference_id,created_at')
        .eq('case_id', corporateCase.case_id)
        .order('created_at', { ascending: false }).limit(1),
    ]);
    if (escrow.error) throw queryError(escrow.error.message);
    if (submissions.error) throw queryError(submissions.error.message);
    if (!escrow.data) return null;

    return {
      caseId: corporateCase.case_id,
      orderId: corporateCase.order_id,
      entityName: corporateCase.proposed_name,
      entityType: corporateCase.entity_type,
      currentStage: corporateCase.current_stage,
      externalReference: submissions.data[0]?.external_registration_number
        ?? submissions.data[0]?.external_reference_id
        ?? null,
      escrow: {
        escrowId: escrow.data.escrow_id,
        status: corporateEscrowStatus(escrow.data.status),
        totalAmountIdr: escrow.data.total_amount_idr,
        paymentGatewayRef: escrow.data.payment_gateway_ref,
        fundsLockedAt: escrow.data.funds_locked_at,
      },
    } satisfies ClientCorporateWorkspace;
  },

  async listNotaryWorkspaces(userId) {
    const cases = await supabase.from('corporate_service_cases')
      .select('case_id,proposed_name,entity_type,current_stage,domicile_city,domicile_province,kbli_snapshot,created_at')
      .eq('assigned_notary_id', userId)
      .order('created_at', { ascending: false });
    if (cases.error) throw queryError(cases.error.message);
    if (!cases.data.length) return [];

    const workspaces = await Promise.all(
      cases.data.map(async (corporateCase) => {
        const [owners, assessments, submissions] = await Promise.all([
          supabase.from('beneficial_owners')
            .select('beneficial_owner_id,natural_person_name,control_basis,percentage,verification_status')
            .eq('case_id', corporateCase.case_id)
            .order('declaration_version', { ascending: false }),
          supabase.from('compliance_assessments')
            .select('assessment_id,pep_check_status,sanctions_check_status,reviewer_decision,rules_version')
            .eq('case_id', corporateCase.case_id)
            .eq('assessment_level', 'CDD')
            .order('created_at', { ascending: false }).limit(1),
          supabase.from('government_submission_jobs')
            .select('job_id,target_system,submission_status,external_registration_number,external_reference_id,created_at')
            .eq('case_id', corporateCase.case_id)
            .order('created_at', { ascending: false }),
        ]);
        if (owners.error) throw queryError(owners.error.message);
        if (assessments.error) throw queryError(assessments.error.message);
        if (submissions.error) throw queryError(submissions.error.message);

        return {
          caseId: corporateCase.case_id,
          caseCode: corporateCase.case_id,
          entityName: corporateCase.proposed_name,
          entityType: corporateCase.entity_type,
          currentStage: corporateCase.current_stage,
          domicile: `${corporateCase.domicile_city}, ${corporateCase.domicile_province}`,
          kbliLabel: kbliLabel(corporateCase.kbli_snapshot),
          beneficialOwners: owners.data.map((owner) => ({
            id: owner.beneficial_owner_id,
            name: owner.natural_person_name,
            controlBasis: owner.control_basis,
            percentage: owner.percentage,
            verificationStatus: owner.verification_status,
          })),
          cddAssessment: assessments.data[0] ? {
            assessmentId: assessments.data[0].assessment_id,
            pepStatus: assessments.data[0].pep_check_status,
            sanctionsStatus: assessments.data[0].sanctions_check_status,
            decision: assessments.data[0].reviewer_decision,
            rulesVersion: assessments.data[0].rules_version,
          } : null,
          submissions: submissions.data.map((submission) => ({
            id: submission.job_id,
            system: submission.target_system,
            status: submission.submission_status,
            reference: submission.external_registration_number
              ?? submission.external_reference_id,
          })),
        } satisfies NotaryWorkspace;
      }),
    );

    return workspaces;
  },

  async getNotaryWorkspace(userId) {
    if (typeof phase2SupabaseGateway.listNotaryWorkspaces === 'function') {
      const workspaces = await phase2SupabaseGateway.listNotaryWorkspaces(userId);
      return workspaces[0] ?? null;
    }
    return null;
  },

  async listAssignmentContext() {
    const { data, error } = await supabase.functions.invoke<{
      ok: boolean;
      data: {
        cases: Array<{
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
        }>;
        notaries: Array<{
          notaryId: string;
          fullName: string;
          licenseNumber: string;
          jurisdictionCity: string;
          jurisdictionProvince: string;
          status: string;
        }>;
      };
    }>('notary-workspace', {
      body: { action: 'list_assignment_context' },
    });

    if (error || !data || !data.ok) {
      throw queryError(error?.message ?? 'Gagal memuat daftar penugasan.');
    }
    return data.data;
  },

  async assignNotary(input) {
    const { data, error } = await supabase.functions.invoke<{
      ok: boolean;
      data: {
        caseId: string;
        assignedNotaryId: string;
        replayed: boolean;
      };
    }>('notary-workspace', {
      body: {
        action: 'assign_notary',
        caseId: input.caseId,
        notaryId: input.notaryId,
        idempotencyKey: input.idempotencyKey,
      },
    });

    if (error || !data || !data.ok) {
      throw queryError(error?.message ?? 'Gagal menugaskan notaris.');
    }
    return data.data;
  },

  async approveCddAssessment(input) {
    const { data, error } = await supabase.functions.invoke<{
      ok: boolean;
      data: {
        caseId: string;
        assessmentId: string;
        currentStage: string;
        replayed: boolean;
      };
    }>('notary-workspace', {
      body: {
        action: 'approve_cdd',
        caseId: input.caseId,
        assessmentId: input.assessmentId,
        rulesVersion: input.rulesVersion,
        idempotencyKey: input.idempotencyKey ?? crypto.randomUUID(),
      },
    });

    if (error || !data || !data.ok) {
      throw queryError(error?.message ?? 'Gagal menyetujui CDD.');
    }
    return data.data;
  },

  async getEkycWorkspace(userId) {
    const participant = await supabase.from('signing_envelope_parties')
      .select('envelope_id,party_id,created_at')
      .eq('party_user_id', userId)
      .order('created_at', { ascending: false }).limit(20);
    if (participant.error) throw queryError(participant.error.message);
    if (!participant.data.length) return null;

    const envelopes = await supabase.from('signing_envelopes')
      .select('envelope_id,document_title,provider_name,status,global_status,expires_at,halt_reason,created_at')
      .in('envelope_id', participant.data.map(({ envelope_id }) => envelope_id))
      .order('created_at', { ascending: false }).limit(1);
    if (envelopes.error) throw queryError(envelopes.error.message);
    const envelope = envelopes.data[0];
    if (!envelope) return null;
    const currentParty = participant.data.find((party) => party.envelope_id === envelope.envelope_id);
    if (!currentParty) return null;

    const [parties, verification] = await Promise.all([
      supabase.from('signing_envelope_parties')
        .select('party_id,signer_email,party_role,signing_status,signing_order')
        .eq('envelope_id', envelope.envelope_id)
        .order('signing_order', { ascending: true }),
      supabase.from('ekyc_verification_logs')
        .select('status,liveness_attempt_count,verified_at')
        .eq('envelope_id', envelope.envelope_id)
        .eq('party_id', currentParty.party_id)
        .eq('user_id', userId)
        .order('created_at', { ascending: false }).limit(1),
    ]);
    if (parties.error) throw queryError(parties.error.message);
    if (verification.error) throw queryError(verification.error.message);
    const currentVerification = verification.data[0];

    return {
      envelopeId: envelope.envelope_id,
      documentTitle: envelope.document_title,
      providerName: envelope.provider_name,
      status: envelope.status,
      globalStatus: envelope.global_status,
      expiresAt: envelope.expires_at,
      haltReason: envelope.halt_reason,
      currentPartyId: currentParty.party_id,
      currentVerification: currentVerification ? {
        status: currentVerification.status,
        attemptCount: currentVerification.liveness_attempt_count,
        verifiedAt: currentVerification.verified_at,
      } : null,
      parties: parties.data.map((party) => ({
        id: party.party_id,
        email: party.signer_email,
        role: party.party_role,
        status: party.signing_status,
        signingOrder: party.signing_order,
      })),
    } satisfies EkycWorkspace;
  },

  async invokeCorporateIntake(payload: IntakePayload) {
    const { data, error } = await supabase.functions.invoke<SubmitCorporateIntakeResult>(
      'corporate-intake',
      { body: payload },
    );
    if (error) {
      const rawCode = await parseIntakeErrorCode(error);
      return { data: null, error: { code: rawCode ?? INTAKE_UNKNOWN_FALLBACK } };
    }
    return { data, error: null };
  },
};

export const phase2IntegrationService = createPhase2IntegrationService(
  phase2SupabaseGateway,
);

export type {
  AssignmentContext,
  EligibleCaseProjection,
  VerifiedNotaryProjection,
  AssignNotaryResult,
  ApproveCddResult,
} from './phase2IntegrationService.ts';
