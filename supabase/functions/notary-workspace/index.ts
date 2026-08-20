import { HttpError } from "../_shared/http.ts";
import { callRpc, RestError } from "../_shared/rest.ts";
import {
  createNotaryWorkspaceHandler,
  type AdminActor,
  type ApproveCddResult,
  type AssignNotaryResult,
  type EligibleCaseProjection,
  type NotaryActor,
  type VerifiedNotaryProjection,
} from "./handler.ts";

function environment(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new HttpError(500, "SERVER_MISCONFIGURED", `${name} is not configured.`);
  }
  return value;
}

async function verifyAuthUser(authorizationHeader: string | null): Promise<string> {
  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new HttpError(401, "UNAUTHENTICATED", "Sesi autentikasi diperlukan.");
  }
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
  const supabaseUrl = environment("SUPABASE_URL");

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: publishableKey,
      authorization: authorizationHeader,
    },
  });

  if (!response.ok) {
    throw new HttpError(401, "UNAUTHENTICATED", "Sesi autentikasi tidak valid atau sudah kedaluwarsa.");
  }

  const json = await response.json() as { id?: unknown };
  if (typeof json.id !== "string") {
    throw new HttpError(401, "UNAUTHENTICATED", "Profil autentikasi tidak valid.");
  }
  return json.id;
}

async function fetchAdminActor(userId: string): Promise<AdminActor | null> {
  const supabaseUrl = environment("SUPABASE_URL");
  const serviceKey = environment("SUPABASE_SERVICE_ROLE_KEY");

  const response = await fetch(
    `${supabaseUrl}/rest/v1/users_admin?admin_id=eq.${userId}&select=admin_id,role_group,is_active`,
    {
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
      },
    },
  );

  if (!response.ok) return null;
  const rows = await response.json() as Array<{ admin_id: string; role_group: string; is_active: boolean }>;
  if (!rows || rows.length === 0) return null;

  return {
    adminId: rows[0].admin_id,
    roleGroup: rows[0].role_group,
    isActive: rows[0].is_active,
  };
}

async function fetchNotaryActor(userId: string): Promise<NotaryActor | null> {
  const supabaseUrl = environment("SUPABASE_URL");
  const serviceKey = environment("SUPABASE_SERVICE_ROLE_KEY");

  const [profileRes, advocateRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/notary_profiles?notary_id=eq.${userId}&select=notary_id,status`,
      {
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
        },
      },
    ),
    fetch(
      `${supabaseUrl}/rest/v1/users_advocate?advocate_id=eq.${userId}&select=advocate_id,is_verified`,
      {
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
        },
      },
    ),
  ]);

  if (!profileRes.ok || !advocateRes.ok) return null;
  const profiles = await profileRes.json() as Array<{ notary_id: string; status: string }>;
  const advocates = await advocateRes.json() as Array<{ advocate_id: string; is_verified: boolean }>;

  if (!profiles.length || !advocates.length) return null;

  return {
    notaryId: profiles[0].notary_id,
    status: profiles[0].status,
    isVerifiedAdvocate: advocates[0].is_verified,
  };
}

async function fetchAssignmentContext(): Promise<{
  cases: EligibleCaseProjection[];
  notaries: VerifiedNotaryProjection[];
}> {
  const supabaseUrl = environment("SUPABASE_URL");
  const serviceKey = environment("SUPABASE_SERVICE_ROLE_KEY");

  const [casesRes, notariesRes] = await Promise.all([
    fetch(
      `${supabaseUrl}/rest/v1/corporate_service_cases?current_stage=eq.ESCROW_LOCKED&select=case_id,order_id,entity_type,proposed_name,current_stage,domicile_city,domicile_province,assigned_notary_id,service_orders!inner(escrow_status,funds_locked_at)&service_orders.escrow_status=eq.HELD_IN_ESCROW&order=created_at.desc`,
      {
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
        },
      },
    ),
    fetch(
      `${supabaseUrl}/rest/v1/notary_profiles?status=eq.VERIFIED_ACTIVE&select=notary_id,license_number,jurisdiction_city,jurisdiction_province,status,users_advocate!inner(full_name,is_verified)&users_advocate.is_verified=eq.true&order=created_at.desc`,
      {
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
        },
      },
    ),
  ]);

  if (!casesRes.ok || !notariesRes.ok) {
    throw new HttpError(500, "SERVER_ERROR", "Gagal memuat konteks penugasan notaris.");
  }

  const rawCases = await casesRes.json() as Array<any>;
  const rawNotaries = await notariesRes.json() as Array<any>;

  const cases: EligibleCaseProjection[] = rawCases.map((c) => ({
    caseId: c.case_id,
    orderId: c.order_id,
    entityType: c.entity_type,
    proposedName: c.proposed_name,
    currentStage: c.current_stage,
    domicileCity: c.domicile_city,
    domicileProvince: c.domicile_province,
    escrowStatus: c.service_orders?.escrow_status ?? "HELD_IN_ESCROW",
    fundsLockedAt: c.service_orders?.funds_locked_at ?? null,
    assignedNotaryId: c.assigned_notary_id,
  }));

  const notaries: VerifiedNotaryProjection[] = rawNotaries.map((n) => ({
    notaryId: n.notary_id,
    fullName: n.users_advocate?.full_name ?? "Notaris Terverifikasi",
    licenseNumber: n.license_number,
    jurisdictionCity: n.jurisdiction_city,
    jurisdictionProvince: n.jurisdiction_province,
    status: n.status,
  }));

  return { cases, notaries };
}

const handler = createNotaryWorkspaceHandler({
  verifyUser: verifyAuthUser,
  getAdminActor: fetchAdminActor,
  getNotaryActor: fetchNotaryActor,
  listAssignmentContext: fetchAssignmentContext,
  assignNotary: async (params): Promise<AssignNotaryResult> => {
    const result = await callRpc<any>("fn_assign_corporate_notary_atomic", {
      p_case_id: params.caseId,
      p_notary_id: params.notaryId,
      p_admin_id: params.adminId,
      p_idempotency_key: params.idempotencyKey,
    });
    return {
      caseId: result.case_id,
      assignedNotaryId: result.assigned_notary_id,
      replayed: Boolean(result.replayed),
    };
  },
  approveCdd: async (params): Promise<ApproveCddResult> => {
    const result = await callRpc<any>("fn_approve_notary_cdd_atomic", {
      p_case_id: params.caseId,
      p_assessment_id: params.assessmentId,
      p_notary_id: params.notaryId,
      p_rules_version: params.rulesVersion,
      p_idempotency_key: params.idempotencyKey,
    });
    return {
      caseId: result.case_id,
      assessmentId: result.assessment_id,
      currentStage: result.current_stage,
      replayed: Boolean(result.replayed),
    };
  },
});

export default handler;

// @ts-ignore Deno global serve
if (typeof Deno !== "undefined" && typeof Deno.serve === "function") {
  // @ts-ignore
  Deno.serve(handler);
}
