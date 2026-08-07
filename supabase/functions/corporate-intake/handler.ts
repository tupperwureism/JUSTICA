import {
  errorResponse,
  HttpError,
  jsonResponse,
  readJsonBody,
} from "../_shared/http.ts";
import {
  rejectUnknownKeys,
  requireEnum,
  requireInteger,
  requireRecord,
  requireString,
  requireUuid,
} from "../_shared/validation.ts";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const ENTITY_TYPES = ["PT_ORDINARY", "PT_INDIVIDUAL_UMK", "CV"] as const;
const CONTROL_BASES = [
  "OWNERSHIP",
  "VOTING_RIGHTS",
  "APPOINTMENT_REMOVAL",
  "EFFECTIVE_CONTROL",
  "BENEFICIAL_ENTITLEMENT",
] as const;
const PARTY_TYPES = ["NATURAL_PERSON", "LEGAL_ENTITY"] as const;
const PARTY_ROLES = [
  "FOUNDER",
  "SHAREHOLDER",
  "DIRECTOR",
  "COMMISSIONER",
  "ACTIVE_PARTNER",
  "PASSIVE_PARTNER",
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DIGITS_ONLY = /^\d+$/;
const MAX_BODY_BYTES = 2 * 1024 * 1024;
const MAX_PARTIES = 10;
const MAX_OWNERS = 50;
const MAX_KBLI_LENGTH = 16;
const MAX_NAME_LENGTH = 256;
const MAX_PLACE_LENGTH = 128;
const MAX_PARTY_IDENTITY_LENGTH = 128;
const MAX_PAYMENT_REF_LENGTH = 64;
const MAX_IDEMPOTENCY_KEY_LENGTH = 48;

export type IntakeSuccessResponse = {
  orderId: string;
  corporateCaseId: string;
  escrowId: string;
  pricingCatalogId: string;
  quoteVersion: number;
  legalScopeVersion: string;
  totalAmountIdr: string;
  replayed: boolean;
};

type IntakeRpcRow = {
  order_id: string;
  corporate_case_id: string;
  escrow_id: string;
  pricing_catalog_id: string;
  quote_version: number;
  legal_scope_version: string;
  total_amount_idr: string;
  replayed: boolean;
};

export type CorporateIntakeDependencies = {
  verifyUser(request: Request): Promise<string>;
  callRpc<T>(name: string, parameters: unknown): Promise<T[]>;
};

type BeneficialOwnerInput = {
  declarationVersion: number;
  naturalPersonName: string;
  evidenceReference: string;
  controlBasis: string;
  percentage: number | null;
};

type CorporatePartyInput = {
  partyType: string;
  role: string;
  displayName: string;
  identityReference: string;
  ownershipPercentage: number | null;
  votingPercentage: number | null;
  effectiveFrom: string | null;
};

type IntakePayload = {
  orderId: string;
  entityType: string;
  proposedName: string;
  domicileCity: string;
  domicileProvince: string;
  kbliSnapshot: string[];
  authorizedCapitalIdr: string;
  paidUpCapitalIdr: string;
  corporateParties: CorporatePartyInput[];
  beneficialOwners: BeneficialOwnerInput[];
  paymentGatewayRef: string;
  idempotencyKey: string;
};

function corsHeaders(origin: string | null): HeadersInit {
  if (!origin || !allowedOrigins.has(origin)) return {};
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-headers": "authorization, apikey, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
    vary: "Origin",
  };
}

function withCors(response: Response, origin: string | null): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function requireNonEmptyString(value: unknown, maxLength: number): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.length > maxLength) {
    throw new HttpError(400, "INVALID_FIELD", "Field is missing or exceeds maximum length.");
  }
  return value.trim() === value ? value : value.trim();
}

function requireOptionalString(
  value: unknown,
  maxLength: number,
): string | null {
  if (value === null || value === undefined) return null;
  return requireNonEmptyString(value, maxLength);
}

function requireOptionalPercentage(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 100) {
    throw new HttpError(400, "INVALID_FIELD", "Percentage must be a number 0-100.");
  }
  return value;
}

function parseBeneficialOwner(record: Record<string, unknown>): BeneficialOwnerInput {
  rejectUnknownKeys(record, [
    "declarationVersion",
    "naturalPersonName",
    "evidenceReference",
    "controlBasis",
    "percentage",
  ]);
  const declarationVersion = record.declarationVersion === undefined
    ? 1
    : requireInteger(record, "declarationVersion", 1, 32_767);
  const naturalPersonName = requireNonEmptyString(record.naturalPersonName, MAX_NAME_LENGTH);
  const evidenceReference = requireUuid(
    { evidenceReference: String(record.evidenceReference ?? "") },
    "evidenceReference",
  );
  const controlBasis = requireEnum(record, "controlBasis", CONTROL_BASES);
  const percentage = requireOptionalPercentage(record.percentage);
  return {
    declarationVersion,
    naturalPersonName,
    evidenceReference,
    controlBasis: controlBasis as string,
    percentage,
  };
}

function parseCorporateParty(record: Record<string, unknown>): CorporatePartyInput {
  rejectUnknownKeys(record, [
    "partyType",
    "role",
    "displayName",
    "identityReference",
    "ownershipPercentage",
    "votingPercentage",
    "effectiveFrom",
  ]);
  const partyType = record.partyType === undefined
    ? "NATURAL_PERSON"
    : requireEnum(record, "partyType", PARTY_TYPES);
  const role = requireEnum(record, "role", PARTY_ROLES);
  const displayName = requireNonEmptyString(record.displayName, MAX_NAME_LENGTH);
  const identityReference = requireNonEmptyString(record.identityReference, MAX_PARTY_IDENTITY_LENGTH);
  const ownershipPercentage = requireOptionalPercentage(record.ownershipPercentage);
  const votingPercentage = requireOptionalPercentage(record.votingPercentage);
  const effectiveFrom = requireOptionalString(record.effectiveFrom, 10);
  if (effectiveFrom !== null && !ISO_DATE.test(effectiveFrom)) {
    throw new HttpError(400, "INVALID_FIELD", "effectiveFrom must be YYYY-MM-DD.");
  }
  return {
    partyType: partyType as string,
    role: role as string,
    displayName,
    identityReference,
    ownershipPercentage,
    votingPercentage,
    effectiveFrom,
  };
}

function parsePayload(raw: unknown): IntakePayload {
  const body = requireRecord(raw);
  rejectUnknownKeys(body, [
    "orderId",
    "entityType",
    "proposedName",
    "domicileCity",
    "domicileProvince",
    "kbliSnapshot",
    "authorizedCapitalIdr",
    "paidUpCapitalIdr",
    "corporateParties",
    "beneficialOwners",
    "paymentGatewayRef",
    "idempotencyKey",
  ]);
  const orderId = requireUuid(body, "orderId");
  const entityType = requireEnum(body, "entityType", ENTITY_TYPES);
  const proposedName = requireNonEmptyString(body.proposedName, MAX_NAME_LENGTH);
  const domicileCity = requireNonEmptyString(body.domicileCity, MAX_PLACE_LENGTH);
  const domicileProvince = requireNonEmptyString(body.domicileProvince, MAX_PLACE_LENGTH);
  if (!Array.isArray(body.kbliSnapshot) || body.kbliSnapshot.length === 0) {
    throw new HttpError(400, "INVALID_FIELD", "kbliSnapshot must be a non-empty array.");
  }
  const kbliSnapshot = body.kbliSnapshot.map((code) => {
    const trimmed = requireNonEmptyString(code, MAX_KBLI_LENGTH);
    return trimmed;
  });
  const kbliSet = new Set(kbliSnapshot.map((code) => code.toLowerCase()));
  if (kbliSet.size !== kbliSnapshot.length) {
    throw new HttpError(400, "KBLI_DUPLICATE", "kbliSnapshot contains duplicates.");
  }
  if (!DIGITS_ONLY.test(String(body.authorizedCapitalIdr))) {
    throw new HttpError(400, "INVALID_FIELD", "authorizedCapitalIdr must be a stringified integer.");
  }
  if (!DIGITS_ONLY.test(String(body.paidUpCapitalIdr))) {
    throw new HttpError(400, "INVALID_FIELD", "paidUpCapitalIdr must be a stringified integer.");
  }
  if (BigInt(String(body.paidUpCapitalIdr)) > BigInt(String(body.authorizedCapitalIdr))) {
    throw new HttpError(400, "PAID_UP_EXCEEDS_AUTHORIZED", "Paid-up capital exceeds authorized capital.");
  }
  if (!Array.isArray(body.corporateParties) || body.corporateParties.length === 0) {
    throw new HttpError(400, "INVALID_FIELD", "corporateParties must be a non-empty array.");
  }
  if (body.corporateParties.length > MAX_PARTIES) {
    throw new HttpError(400, "PARTIES_TOO_MANY", `corporateParties exceeds limit ${MAX_PARTIES}.`);
  }
  const corporateParties = (body.corporateParties as unknown[]).map((party) =>
    parseCorporateParty(party as Record<string, unknown>),
  );
  if (!Array.isArray(body.beneficialOwners) || body.beneficialOwners.length === 0) {
    throw new HttpError(400, "INVALID_FIELD", "beneficialOwners must be a non-empty array.");
  }
  if (body.beneficialOwners.length > MAX_OWNERS) {
    throw new HttpError(400, "OWNERS_TOO_MANY", `beneficialOwners exceeds limit ${MAX_OWNERS}.`);
  }
  const beneficialOwners = (body.beneficialOwners as unknown[]).map((owner) =>
    parseBeneficialOwner(owner as Record<string, unknown>),
  );
  const ownerEvidenceSet = new Set(beneficialOwners.map((o) => o.evidenceReference.toLowerCase()));
  if (ownerEvidenceSet.size !== beneficialOwners.length) {
    throw new HttpError(400, "EVIDENCE_REFERENCE_DUPLICATE", "evidenceReference duplicates detected.");
  }
  const paymentGatewayRef = requireString(body, "paymentGatewayRef", MAX_PAYMENT_REF_LENGTH);
  if (paymentGatewayRef.trim() === "") {
    throw new HttpError(400, "INVALID_FIELD", "paymentGatewayRef is required.");
  }
  const idempotencyKey = requireString(body, "idempotencyKey", MAX_IDEMPOTENCY_KEY_LENGTH);
  if (idempotencyKey.trim() === "") {
    throw new HttpError(400, "INVALID_FIELD", "idempotencyKey is required.");
  }
  return {
    orderId,
    entityType,
    proposedName,
    domicileCity,
    domicileProvince,
    kbliSnapshot,
    authorizedCapitalIdr: String(body.authorizedCapitalIdr),
    paidUpCapitalIdr: String(body.paidUpCapitalIdr),
    corporateParties,
    beneficialOwners,
    paymentGatewayRef,
    idempotencyKey,
  };
}

function toSnakeCaseBO(owner: BeneficialOwnerInput) {
  return {
    declaration_version: owner.declarationVersion,
    natural_person_name: owner.naturalPersonName,
    evidence_reference: owner.evidenceReference,
    control_basis: owner.controlBasis,
    percentage: owner.percentage,
  };
}

function toSnakeCaseParty(party: CorporatePartyInput) {
  return {
    party_type: party.partyType,
    role: party.role,
    display_name: party.displayName,
    identity_reference: party.identityReference,
    ownership_percentage: party.ownershipPercentage,
    voting_percentage: party.votingPercentage,
    effective_from: party.effectiveFrom,
  };
}

function mapIntakeRpcError(error: unknown): HttpError {
  if (!(error instanceof Error)) return new HttpError(500, "INTAKE_BACKEND_FAILURE", "Intake service is unavailable.");
  const detail = error instanceof Error && "details" in error
    ? JSON.stringify((error as { details?: unknown }).details)
    : String(error.message);

  if (detail.includes("CORPORATE_INTAKE_CLIENT_ACTOR_MISMATCH")) {
    return new HttpError(403, "ACTOR_MISMATCH", "Actor does not match client.");
  }
  if (detail.includes("CORPORATE_INTAKE_IDEMPOTENCY_CONFLICT")) {
    return new HttpError(409, "IDEMPOTENCY_CONFLICT", "Idempotent replay conflicts with existing state.");
  }
  if (
    detail.includes("CORPORATE_INTAKE_EVIDENCE_STATE_INVALID")
    || detail.includes("CORPORATE_INTAKE_EVIDENCE_NOT_FOUND")
  ) {
    return new HttpError(409, "EVIDENCE_CONFLICT", "Evidence is missing or already consumed.");
  }
  if (detail.startsWith("CORPORATE_INTAKE_EVIDENCE_")) {
    return new HttpError(422, "EVIDENCE_INVALID", "Evidence state is invalid.");
  }
  if (
    detail.startsWith("CORPORATE_INTAKE_BENEFICIAL_OWNER_")
    || detail.startsWith("CORPORATE_INTAKE_PARTY_")
    || detail.startsWith("CORPORATE_INTAKE_KBLI_")
    || detail.includes("CORPORATE_INTAKE_CAPITAL_INVALID")
    || detail.includes("CORPORATE_INTAKE_PAYMENT_REFERENCE_INVALID")
    || detail.includes("CORPORATE_INTAKE_DOMICILE_INVALID")
    || detail.includes("CORPORATE_INTAKE_PROPOSED_NAME_INVALID")
    || detail.includes("CORPORATE_INTAKE_ENTITY_TYPE_INVALID")
    || detail.includes("CORPORATE_INTAKE_ORDER_REQUIRED")
    || detail.includes("CORPORATE_INTAKE_IDEMPOTENCY_KEY_INVALID")
  ) {
    return new HttpError(400, "INVALID_PAYLOAD", "Payload was rejected by intake service.");
  }
  if (detail.includes("CORPORATE_PRICING_ACTIVE_CATALOG_NOT_FOUND")) {
    return new HttpError(409, "PRICING_CATALOG_UNAVAILABLE", "Pricing catalog is not available.");
  }
  return new HttpError(500, "INTAKE_BACKEND_FAILURE", "Intake service is unavailable.");
}

export function createCorporateIntakeHandler(
  dependencies: CorporateIntakeDependencies,
): (request: Request) => Promise<Response> {
  return async (request) => {
    const origin = request.headers.get("origin");
    try {
      if (origin && !allowedOrigins.has(origin)) {
        throw new HttpError(403, "ORIGIN_NOT_ALLOWED", "Request origin is not allowed.");
      }
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }), origin);
      }
      if (request.method !== "POST") {
        throw new HttpError(405, "METHOD_NOT_ALLOWED", "Only POST is accepted.");
      }
      const clientId = await dependencies.verifyUser(request);
      const { value } = await readJsonBody(request, MAX_BODY_BYTES);
      const payload = parsePayload(value);
      let rows: IntakeRpcRow[];
      try {
        rows = await dependencies.callRpc<IntakeRpcRow>(
          "fn_create_corporate_intake_from_evidence_atomic",
          {
            p_order_id: payload.orderId,
            p_client_id: clientId,
            p_entity_type: payload.entityType,
            p_proposed_name: payload.proposedName,
            p_domicile_city: payload.domicileCity,
            p_domicile_province: payload.domicileProvince,
            p_kbli_snapshot: payload.kbliSnapshot,
            p_authorized_capital_idr: payload.authorizedCapitalIdr,
            p_paid_up_capital_idr: payload.paidUpCapitalIdr,
            p_corporate_parties: payload.corporateParties.map(toSnakeCaseParty),
            p_beneficial_owners: payload.beneficialOwners.map(toSnakeCaseBO),
            p_payment_gateway_ref: payload.paymentGatewayRef,
            p_idempotency_key: payload.idempotencyKey,
            p_actor_user_id: clientId,
          },
        );
      } catch (error) {
        throw mapIntakeRpcError(error);
      }
      if (rows.length !== 1) {
        throw new HttpError(500, "BACKEND_CONTRACT_INVALID", "Intake service returned an unexpected payload.");
      }
      const row = rows[0];
      const response: IntakeSuccessResponse = {
        orderId: row.order_id,
        corporateCaseId: row.corporate_case_id,
        escrowId: row.escrow_id,
        pricingCatalogId: row.pricing_catalog_id,
        quoteVersion: row.quote_version,
        legalScopeVersion: row.legal_scope_version,
        totalAmountIdr: String(row.total_amount_idr),
        replayed: row.replayed,
      };
      return withCors(jsonResponse(response), origin);
    } catch (error) {
      return withCors(errorResponse(error), origin);
    }
  };
}
