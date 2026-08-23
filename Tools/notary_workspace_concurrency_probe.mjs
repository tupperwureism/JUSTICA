import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';

/**
 * Concurrency Probe for Notary Workspace & CDD Approval RPCs (Batch 3.C.3)
 * Tests race conditions, row-level mutex, and advisory-lock serialization across 5 locked scenarios.
 * Fails closed with nonzero exit on missing configuration or any unexpected assertion.
 */
async function runConcurrencyProbe() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[PROBE ERROR] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided.');
    process.exit(1);
  }

  const rpcUrl = `${supabaseUrl}/rest/v1/rpc`;
  const restUrl = `${supabaseUrl}/rest/v1`;
  const headers = {
    apikey: serviceRoleKey,
    authorization: `Bearer ${serviceRoleKey}`,
    'content-type': 'application/json',
  };

  async function callRpc(functionName, params) {
    const res = await fetch(`${rpcUrl}/${functionName}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(params),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  }

  async function queryTable(table, queryParams = '') {
    const res = await fetch(`${restUrl}/${table}?${queryParams}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      throw new Error(`Failed to query table ${table}: ${res.status} ${await res.text()}`);
    }
    return res.json();
  }

  console.log('[PROBE] Provisioning fresh isolated test fixtures for Batch 3.C.3...');

  const adminId = '3c300000-0000-4000-8000-000000000001';
  const notaryId1 = '3c300000-0000-4000-8000-000000000002';
  const notaryId2 = '3c300000-0000-4000-8000-000000000003';
  const clientId = '3c300000-0000-4000-8000-000000000006';

  const orderId1 = randomUUID();
  const caseId1 = randomUUID();
  const escrowId1 = randomUUID();
  const assignKey1 = randomUUID();

  const orderId2 = randomUUID();
  const caseId2 = randomUUID();
  const escrowId2 = randomUUID();
  const assignKey2 = randomUUID();

  const orderId3 = randomUUID();
  const caseId3 = randomUUID();
  const escrowId3 = randomUUID();
  const assignKey3A = randomUUID();
  const assignKey3B = randomUUID();

  const orderId4 = randomUUID();
  const caseId4 = randomUUID();
  const escrowId4 = randomUUID();
  const boId4 = randomUUID();
  const assessmentId4 = randomUUID();
  const cddKey4 = randomUUID();

  const orderId5 = randomUUID();
  const caseId5 = randomUUID();
  const escrowId5 = randomUUID();
  const boId5 = randomUUID();
  const assessmentId5 = randomUUID();
  const cddKey5 = randomUUID();

  const fixtureSql = `
BEGIN;
INSERT INTO auth.users (id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
    ('${adminId}', 'authenticated', 'authenticated', 'admin-probe@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
    ('${notaryId1}', 'authenticated', 'authenticated', 'notary1-probe@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
    ('${notaryId2}', 'authenticated', 'authenticated', 'notary2-probe@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
    ('${clientId}', 'authenticated', 'authenticated', 'client-probe@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users_admin (admin_id, full_name, email, role_group)
VALUES ('${adminId}', 'Admin Probe', 'admin-probe@justica.invalid', 'COMPLIANCE_OFFICER')
ON CONFLICT (admin_id) DO UPDATE SET role_group = 'COMPLIANCE_OFFICER';

INSERT INTO public.users_client (client_id, full_name, email, phone_e164, password_hash, kyc_status)
VALUES ('${clientId}', 'Client Probe', 'client-probe@justica.invalid', '+6281234567890', '!HASH!', 'VERIFIED')
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO public.users_advocate (advocate_id, full_name, email, phone_e164, sipp_license_no, peradi_card_no, specialization_primary, kyc_status)
VALUES
    ('${notaryId1}', 'Notaris 1 Probe', 'notary1-probe@justica.invalid', '+6281234567891', 'SIPP-PROBE-01', 'PERADI-PROBE-01', 'CORPORATE', 'VERIFIED'),
    ('${notaryId2}', 'Notaris 2 Probe', 'notary2-probe@justica.invalid', '+6281234567892', 'SIPP-PROBE-02', 'PERADI-PROBE-02', 'CORPORATE', 'VERIFIED')
ON CONFLICT (advocate_id) DO UPDATE SET kyc_status = EXCLUDED.kyc_status;

INSERT INTO public.notary_profiles (notary_id, license_number, jurisdiction_city, jurisdiction_province, status, verified_by_admin_id, verified_at)
VALUES
    ('${notaryId1}', 'SK-PROBE-01', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', '${adminId}', clock_timestamp()),
    ('${notaryId2}', 'SK-PROBE-02', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', '${adminId}', clock_timestamp())
ON CONFLICT (notary_id) DO UPDATE SET status = EXCLUDED.status;

-- Service Orders
INSERT INTO public.service_orders (order_id, client_id, service_type, status)
VALUES
    ('${orderId1}', '${clientId}', 'PT_ORDINARY', 'DRAFT'),
    ('${orderId2}', '${clientId}', 'PT_ORDINARY', 'DRAFT'),
    ('${orderId3}', '${clientId}', 'PT_ORDINARY', 'DRAFT'),
    ('${orderId4}', '${clientId}', 'PT_ORDINARY', 'DRAFT'),
    ('${orderId5}', '${clientId}', 'PT_ORDINARY', 'DRAFT');

-- Corporate Cases
INSERT INTO public.corporate_service_cases (case_id, order_id, entity_type, proposed_name, domicile_city, domicile_province, legal_scope_version, current_stage, assigned_notary_id)
VALUES
    ('${caseId1}', '${orderId1}', 'PT_ORDINARY', 'PT S1 Probe', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
    ('${caseId2}', '${orderId2}', 'PT_ORDINARY', 'PT S2 Probe', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
    ('${caseId3}', '${orderId3}', 'PT_ORDINARY', 'PT S3 Probe', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
    ('${caseId4}', '${orderId4}', 'PT_ORDINARY', 'PT S4 Probe', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'CDD_REVIEW', '${notaryId1}'),
    ('${caseId5}', '${orderId5}', 'PT_ORDINARY', 'PT S5 Probe', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'CDD_REVIEW', '${notaryId1}');

-- Escrows
INSERT INTO public.escrow_transactions (escrow_id, corporate_case_id, client_id, total_amount_idr, status, holding_expires_at, payment_gateway_ref, funds_locked_at)
VALUES
    ('${escrowId1}', '${caseId1}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S1', clock_timestamp()),
    ('${escrowId2}', '${caseId2}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S2', clock_timestamp()),
    ('${escrowId3}', '${caseId3}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S3', clock_timestamp()),
    ('${escrowId4}', '${caseId4}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S4', clock_timestamp()),
    ('${escrowId5}', '${caseId5}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S5', clock_timestamp());

-- Beneficial Owners
INSERT INTO public.beneficial_owners (beneficial_owner_id, case_id, declaration_version, natural_person_name, identity_reference, control_basis, percentage, evidence_digest, verification_status, reviewer_id, verified_at)
VALUES
    ('${boId4}', '${caseId4}', 1, 'BO Probe S4', 'ID-S4', 'OWNERSHIP', 90.0, repeat('d', 64), 'VERIFIED', '${adminId}', clock_timestamp()),
    ('${boId5}', '${caseId5}', 1, 'BO Probe S5', 'ID-S5', 'OWNERSHIP', 90.0, repeat('e', 64), 'VERIFIED', '${adminId}', clock_timestamp());

-- Compliance Assessments
INSERT INTO public.compliance_assessments (assessment_id, case_id, assessment_level, pep_check_status, sanctions_check_status, rules_version, reviewer_decision, reviewer_id, reviewer_role)
VALUES
    ('${assessmentId4}', '${caseId4}', 'CDD', 'NO_MATCH', 'NO_MATCH', 'PMPJ-2026.1', 'PENDING', '${notaryId1}', 'NOTARY'),
    ('${assessmentId5}', '${caseId5}', 'CDD', 'NO_MATCH', 'NO_MATCH', 'PMPJ-2026.1', 'PENDING', '${notaryId1}', 'NOTARY');

COMMIT;
`;

  execSync('docker exec -i supabase_db_justificadll psql -U postgres -d postgres -v ON_ERROR_STOP=1', {
    input: fixtureSql,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  console.log('[PROBE] Fixtures provisioned successfully. Running 5 locked concurrent scenarios...');

  // --- Scenario 1: Same assignment key + same payload ---
  console.log('[PROBE] Scenario 1: Concurrent exact duplicate assignment requests...');
  const [s1Res1, s1Res2] = await Promise.all([
    callRpc('fn_assign_corporate_notary_atomic', {
      p_case_id: caseId1,
      p_notary_id: notaryId1,
      p_admin_id: adminId,
      p_idempotency_key: assignKey1,
    }),
    callRpc('fn_assign_corporate_notary_atomic', {
      p_case_id: caseId1,
      p_notary_id: notaryId1,
      p_admin_id: adminId,
      p_idempotency_key: assignKey1,
    }),
  ]);

  assert.equal(s1Res1.ok, true, `Scenario 1 Res 1 failed: ${JSON.stringify(s1Res1.data)}`);
  assert.equal(s1Res2.ok, true, `Scenario 1 Res 2 failed: ${JSON.stringify(s1Res2.data)}`);

  const s1Replayed1 = s1Res1.data?.replayed === true;
  const s1Replayed2 = s1Res2.data?.replayed === true;
  assert.equal(s1Replayed1 !== s1Replayed2, true, 'Scenario 1: Exactly one request must be initial and one replayed');
  assert.equal(s1Res1.data.assigned_notary_id, notaryId1);
  assert.equal(s1Res2.data.assigned_notary_id, notaryId1);

  // Verify DB state for Scenario 1
  const s1Cases = await queryTable('corporate_service_cases', `case_id=eq.${caseId1}`);
  assert.equal(s1Cases[0].assigned_notary_id, notaryId1);
  assert.equal(s1Cases[0].current_stage, 'ESCROW_LOCKED');

  const s1Events = await queryTable('compliance_workflow_events_worm', `corporate_case_id=eq.${caseId1}&event_type=eq.NOTARY_ASSIGNED`);
  assert.equal(s1Events.length, 1, 'Scenario 1: Exactly one NOTARY_ASSIGNED WORM event must exist');

  const s1Idempotency = await queryTable('notary_workspace_idempotency_records', `idempotency_key=eq.${assignKey1}`);
  assert.equal(s1Idempotency.length, 1, 'Scenario 1: Exactly one idempotency record must exist');
  console.log('✔ Scenario 1 passed: Concurrent exact duplicate assignment handled with advisory lock serialization');


  // --- Scenario 2: Same assignment key + mutated notary ---
  console.log('[PROBE] Scenario 2: Concurrent same key with mutated notary payload...');
  const [s2Res1, s2Res2] = await Promise.all([
    callRpc('fn_assign_corporate_notary_atomic', {
      p_case_id: caseId2,
      p_notary_id: notaryId1,
      p_admin_id: adminId,
      p_idempotency_key: assignKey2,
    }),
    callRpc('fn_assign_corporate_notary_atomic', {
      p_case_id: caseId2,
      p_notary_id: notaryId2,
      p_admin_id: adminId,
      p_idempotency_key: assignKey2,
    }),
  ]);

  const s2SuccessCount = (s2Res1.ok ? 1 : 0) + (s2Res2.ok ? 1 : 0);
  const s2ConflictCount = (!s2Res1.ok && JSON.stringify(s2Res1.data).includes('IDEMPOTENCY_CONFLICT') ? 1 : 0)
    + (!s2Res2.ok && JSON.stringify(s2Res2.data).includes('IDEMPOTENCY_CONFLICT') ? 1 : 0);

  assert.equal(s2SuccessCount, 1, 'Scenario 2: Exactly one request must succeed');
  assert.equal(s2ConflictCount, 1, 'Scenario 2: Exactly one request must be rejected as IDEMPOTENCY_CONFLICT');
  console.log('✔ Scenario 2 passed: Concurrent mutated key reuse rejected as IDEMPOTENCY_CONFLICT');


  // --- Scenario 3: Different keys + different notaries racing for one case ---
  console.log('[PROBE] Scenario 3: Racing different keys and notaries for same case...');
  const [s3Res1, s3Res2] = await Promise.all([
    callRpc('fn_assign_corporate_notary_atomic', {
      p_case_id: caseId3,
      p_notary_id: notaryId1,
      p_admin_id: adminId,
      p_idempotency_key: assignKey3A,
    }),
    callRpc('fn_assign_corporate_notary_atomic', {
      p_case_id: caseId3,
      p_notary_id: notaryId2,
      p_admin_id: adminId,
      p_idempotency_key: assignKey3B,
    }),
  ]);

  const s3SuccessCount = (s3Res1.ok ? 1 : 0) + (s3Res2.ok ? 1 : 0);
  const s3ConflictCount = (!s3Res1.ok && JSON.stringify(s3Res1.data).includes('ASSIGNMENT_CONFLICT') ? 1 : 0)
    + (!s3Res2.ok && JSON.stringify(s3Res2.data).includes('ASSIGNMENT_CONFLICT') ? 1 : 0);

  assert.equal(s3SuccessCount, 1, 'Scenario 3: Exactly one assignment must succeed');
  assert.equal(s3ConflictCount, 1, 'Scenario 3: Exactly one request must fail with ASSIGNMENT_CONFLICT');
  console.log('✔ Scenario 3 passed: Racing different notaries for same case resolved with single winner');


  // --- Scenario 4: Same CDD key + same payload ---
  console.log('[PROBE] Scenario 4: Concurrent exact duplicate CDD approvals...');
  const [s4Res1, s4Res2] = await Promise.all([
    callRpc('fn_approve_notary_cdd_atomic', {
      p_case_id: caseId4,
      p_assessment_id: assessmentId4,
      p_notary_id: notaryId1,
      p_rules_version: 'PMPJ-2026.1',
      p_idempotency_key: cddKey4,
    }),
    callRpc('fn_approve_notary_cdd_atomic', {
      p_case_id: caseId4,
      p_assessment_id: assessmentId4,
      p_notary_id: notaryId1,
      p_rules_version: 'PMPJ-2026.1',
      p_idempotency_key: cddKey4,
    }),
  ]);

  assert.equal(s4Res1.ok, true, `Scenario 4 Res 1 failed: ${JSON.stringify(s4Res1.data)}`);
  assert.equal(s4Res2.ok, true, `Scenario 4 Res 2 failed: ${JSON.stringify(s4Res2.data)}`);

  const s4Replayed1 = s4Res1.data?.replayed === true;
  const s4Replayed2 = s4Res2.data?.replayed === true;
  assert.equal(s4Replayed1 !== s4Replayed2, true, 'Scenario 4: Exactly one request must be initial and one replayed');
  assert.equal(s4Res1.data.current_stage, 'DOCUMENTS_PENDING');
  assert.equal(s4Res2.data.current_stage, 'DOCUMENTS_PENDING');

  // Verify DB state for Scenario 4
  const s4Cases = await queryTable('corporate_service_cases', `case_id=eq.${caseId4}`);
  assert.equal(s4Cases[0].current_stage, 'DOCUMENTS_PENDING');

  const s4Assessments = await queryTable('compliance_assessments', `assessment_id=eq.${assessmentId4}`);
  assert.equal(s4Assessments[0].reviewer_decision, 'APPROVED');

  const s4Events = await queryTable('compliance_workflow_events_worm', `corporate_case_id=eq.${caseId4}&event_type=eq.CDD_APPROVED`);
  assert.equal(s4Events.length, 1, 'Scenario 4: Exactly one CDD_APPROVED WORM event must exist');
  console.log('✔ Scenario 4 passed: Concurrent CDD duplicate approval serialized cleanly');


  // --- Scenario 5: Same CDD key + mutated binding ---
  console.log('[PROBE] Scenario 5: Concurrent CDD same key with mutated rules version...');
  const [s5Res1, s5Res2] = await Promise.all([
    callRpc('fn_approve_notary_cdd_atomic', {
      p_case_id: caseId5,
      p_assessment_id: assessmentId5,
      p_notary_id: notaryId1,
      p_rules_version: 'PMPJ-2026.1',
      p_idempotency_key: cddKey5,
    }),
    callRpc('fn_approve_notary_cdd_atomic', {
      p_case_id: caseId5,
      p_assessment_id: assessmentId5,
      p_notary_id: notaryId1,
      p_rules_version: 'PMPJ-2026.9-MUTATED',
      p_idempotency_key: cddKey5,
    }),
  ]);

  const s5SuccessCount = (s5Res1.ok ? 1 : 0) + (s5Res2.ok ? 1 : 0);
  const s5ConflictCount = (!s5Res1.ok && JSON.stringify(s5Res1.data).includes('IDEMPOTENCY_CONFLICT') ? 1 : 0)
    + (!s5Res2.ok && JSON.stringify(s5Res2.data).includes('IDEMPOTENCY_CONFLICT') ? 1 : 0);

  assert.equal(s5SuccessCount, 1, 'Scenario 5: Exactly one request must succeed');
  assert.equal(s5ConflictCount, 1, 'Scenario 5: Exactly one request must be rejected as IDEMPOTENCY_CONFLICT');
  console.log('✔ Scenario 5 passed: Concurrent CDD mutated binding rejected as IDEMPOTENCY_CONFLICT');

  console.log('[PROBE] All 5 concurrent scenarios verified successfully with zero state corruption.');
}

runConcurrencyProbe().catch((err) => {
  console.error('[PROBE FATAL ERROR]', err.message);
  process.exit(1);
});
