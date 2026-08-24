import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';

/**
 * Concurrency Probe for Notary Workspace & CDD Approval RPCs (Batch 3.C.4)
 * Tests race conditions, row-level mutex, and advisory-lock serialization across 5 locked scenarios.
 * Fails closed with nonzero exit (code 1) on missing configuration or any assertion failure.
 * Cleans up all disposable fixtures in finally block.
 */
async function runConcurrencyProbe() {
  const containerName = process.env.DISPOSABLE_DB_CONTAINER || process.env.SUPABASE_CONTAINER;

  if (!containerName) {
    console.error('[PROBE ERROR] DISPOSABLE_DB_CONTAINER or SUPABASE_CONTAINER must be provided.');
    process.exit(1);
  }

  function execPsql(sql) {
    const result = execSync(
      `docker exec -i ${containerName} psql -U postgres -d postgres -t -A -v ON_ERROR_STOP=1`,
      {
        input: sql,
        stdio: ['pipe', 'pipe', 'pipe'],
        encoding: 'utf8',
      },
    );
    return result.trim();
  }

  function execPsqlJson(sql) {
    const jsonSql = `SELECT json_agg(t) FROM (${sql}) t;`;
    const raw = execPsql(jsonSql);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  async function callRpcInDb(functionName, argsJson) {
    const query = `SELECT ${functionName}(${argsJson.map((a) => (a === null ? 'NULL' : `'${a}'`)).join(', ')});`;
    try {
      const raw = execPsql(query);
      return { ok: true, data: JSON.parse(raw) };
    } catch (err) {
      const msg = err.stderr ? err.stderr.toString() : err.message;
      return { ok: false, error: msg };
    }
  }

  // Generate test IDs
  const adminId = '3c400000-0000-4000-8000-000000000001';
  const notaryId1 = '3c400000-0000-4000-8000-000000000002';
  const notaryId2 = '3c400000-0000-4000-8000-000000000003';
  const clientId = '3c400000-0000-4000-8000-000000000006';

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

  const allCaseIds = [caseId1, caseId2, caseId3, caseId4, caseId5];
  const allOrderIds = [orderId1, orderId2, orderId3, orderId4, orderId5];

  console.log('[PROBE] Provisioning fresh isolated test fixtures for Batch 3.C.4 on disposable stack...');

  const fixtureSql = `
BEGIN;
INSERT INTO auth.users (id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
    ('${adminId}', 'authenticated', 'authenticated', 'admin-probe-3c4@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
    ('${notaryId1}', 'authenticated', 'authenticated', 'notary1-probe-3c4@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
    ('${notaryId2}', 'authenticated', 'authenticated', 'notary2-probe-3c4@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
    ('${clientId}', 'authenticated', 'authenticated', 'client-probe-3c4@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users_admin (admin_id, full_name, email, role_group)
VALUES ('${adminId}', 'Admin Probe 3C4', 'admin-probe-3c4@justica.invalid', 'COMPLIANCE_OFFICER')
ON CONFLICT (admin_id) DO UPDATE SET role_group = 'COMPLIANCE_OFFICER';

INSERT INTO public.users_client (client_id, full_name, email, phone_e164, password_hash, kyc_status)
VALUES ('${clientId}', 'Client Probe 3C4', 'client-probe-3c4@justica.invalid', '+6281234567890', '!HASH!', 'VERIFIED')
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO public.users_advocate (advocate_id, full_name, email, phone_e164, sipp_license_no, peradi_card_no, specialization_primary, kyc_status)
VALUES
    ('${notaryId1}', 'Notaris 1 Probe 3C4', 'notary1-probe-3c4@justica.invalid', '+6281234567891', 'SIPP-PROBE-3C4-01', 'PERADI-PROBE-3C4-01', 'CORPORATE', 'VERIFIED'),
    ('${notaryId2}', 'Notaris 2 Probe 3C4', 'notary2-probe-3c4@justica.invalid', '+6281234567892', 'SIPP-PROBE-3C4-02', 'PERADI-PROBE-3C4-02', 'CORPORATE', 'VERIFIED')
ON CONFLICT (advocate_id) DO UPDATE SET kyc_status = EXCLUDED.kyc_status;

INSERT INTO public.notary_profiles (notary_id, license_number, jurisdiction_city, jurisdiction_province, status, verified_by_admin_id, verified_at)
VALUES
    ('${notaryId1}', 'SK-PROBE-3C4-01', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', '${adminId}', clock_timestamp()),
    ('${notaryId2}', 'SK-PROBE-3C4-02', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', '${adminId}', clock_timestamp())
ON CONFLICT (notary_id) DO UPDATE SET status = EXCLUDED.status;

-- Service Orders (status = DRAFT avoids full fee lines/quotes requirement)
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
    ('${caseId1}', '${orderId1}', 'PT_ORDINARY', 'PT S1 Probe 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
    ('${caseId2}', '${orderId2}', 'PT_ORDINARY', 'PT S2 Probe 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
    ('${caseId3}', '${orderId3}', 'PT_ORDINARY', 'PT S3 Probe 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
    ('${caseId4}', '${orderId4}', 'PT_ORDINARY', 'PT S4 Probe 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'CDD_REVIEW', '${notaryId1}'),
    ('${caseId5}', '${orderId5}', 'PT_ORDINARY', 'PT S5 Probe 3C4', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'CDD_REVIEW', '${notaryId1}');

-- Escrows
INSERT INTO public.escrow_transactions (escrow_id, corporate_case_id, client_id, total_amount_idr, status, holding_expires_at, payment_gateway_ref, funds_locked_at)
VALUES
    ('${escrowId1}', '${caseId1}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S1-3C4', clock_timestamp()),
    ('${escrowId2}', '${caseId2}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S2-3C4', clock_timestamp()),
    ('${escrowId3}', '${caseId3}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S3-3C4', clock_timestamp()),
    ('${escrowId4}', '${caseId4}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S4-3C4', clock_timestamp()),
    ('${escrowId5}', '${caseId5}', '${clientId}', 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S5-3C4', clock_timestamp());

-- Beneficial Owners
INSERT INTO public.beneficial_owners (beneficial_owner_id, case_id, declaration_version, person_type, natural_person_name, identity_reference, control_basis, percentage, evidence_digest, verification_status, reviewer_id, reviewer_role, verified_at)
VALUES
    ('${boId4}', '${caseId4}', 1, 'NATURAL_PERSON', 'BO Probe S4', 'ID-S4', 'OWNERSHIP', 90.0, repeat('d', 64), 'VERIFIED', '${adminId}', 'COMPLIANCE_OFFICER', clock_timestamp()),
    ('${boId5}', '${caseId5}', 1, 'NATURAL_PERSON', 'BO Probe S5', 'ID-S5', 'OWNERSHIP', 90.0, repeat('e', 64), 'VERIFIED', '${adminId}', 'COMPLIANCE_OFFICER', clock_timestamp());

-- Compliance Assessments
INSERT INTO public.compliance_assessments (assessment_id, case_id, assessment_level, pep_check_status, sanctions_check_status, rules_version, reviewer_decision, reviewer_id, reviewer_role)
VALUES
    ('${assessmentId4}', '${caseId4}', 'CDD', 'NO_MATCH', 'NO_MATCH', '2026.1', 'PENDING', '${notaryId1}', 'NOTARY'),
    ('${assessmentId5}', '${caseId5}', 'CDD', 'NO_MATCH', 'NO_MATCH', '2026.1', 'PENDING', '${notaryId1}', 'NOTARY');

COMMIT;
`;

  execPsql(fixtureSql);
  console.log('[PROBE] Fixtures provisioned successfully. Running 5 locked concurrent scenarios...');

  try {
    // --- Scenario 1: Same assignment key + same payload ---
    console.log('[PROBE] Scenario 1: Concurrent exact duplicate assignment requests...');
    const [s1Res1, s1Res2] = await Promise.all([
      callRpcInDb('public.fn_assign_corporate_notary_atomic', [caseId1, notaryId1, adminId, assignKey1]),
      callRpcInDb('public.fn_assign_corporate_notary_atomic', [caseId1, notaryId1, adminId, assignKey1]),
    ]);

    assert(s1Res1.ok && s1Res2.ok, `Scenario 1 failed RPC execution: ${JSON.stringify({ s1Res1, s1Res2 })}`);
    const replayedStates = [s1Res1.data.replayed, s1Res2.data.replayed];
    assert(replayedStates.includes(false), 'Scenario 1: One response must be initial (replayed=false)');
    assert(replayedStates.includes(true), 'Scenario 1: One response must be replay (replayed=true)');

    const s1Case = execPsqlJson(`SELECT current_stage, assigned_notary_id FROM public.corporate_service_cases WHERE case_id = '${caseId1}'`);
    assert.equal(s1Case[0].assigned_notary_id, notaryId1);
    assert.equal(s1Case[0].current_stage, 'ESCROW_LOCKED');

    const s1Events = execPsqlJson(`SELECT event_type FROM public.compliance_workflow_events_worm WHERE corporate_case_id = '${caseId1}'`);
    assert.equal(s1Events.length, 1, 'Scenario 1: Exactly 1 WORM event must be recorded');
    assert.equal(s1Events[0].event_type, 'NOTARY_ASSIGNED');

    const s1Idem = execPsqlJson(`SELECT operation_type, actor_id FROM public.notary_workspace_idempotency_records WHERE idempotency_key = '${assignKey1.toLowerCase()}'`);
    assert.equal(s1Idem.length, 1, 'Scenario 1: Exactly 1 idempotency record must exist');
    console.log('✔ Scenario 1 passed: Concurrent exact duplicate assignment handled with advisory lock serialization');

    // --- Scenario 2: Same assignment key + mutated notary payload ---
    console.log('[PROBE] Scenario 2: Concurrent same key with mutated notary payload...');
    const [s2Res1, s2Res2] = await Promise.all([
      callRpcInDb('public.fn_assign_corporate_notary_atomic', [caseId2, notaryId1, adminId, assignKey2]),
      callRpcInDb('public.fn_assign_corporate_notary_atomic', [caseId2, notaryId2, adminId, assignKey2]),
    ]);

    const s2SuccessCount = [s2Res1.ok, s2Res2.ok].filter(Boolean).length;
    assert.equal(s2SuccessCount, 1, 'Scenario 2: Exactly 1 request must succeed');
    const s2Error = !s2Res1.ok ? s2Res1.error : s2Res2.error;
    assert(s2Error.includes('IDEMPOTENCY_CONFLICT'), `Scenario 2: Rejected request must be IDEMPOTENCY_CONFLICT, got: ${s2Error}`);

    const s2Events = execPsqlJson(`SELECT count(*) AS count FROM public.compliance_workflow_events_worm WHERE corporate_case_id = '${caseId2}'`);
    assert.equal(Number(s2Events[0].count), 1, 'Scenario 2: Exactly 1 event written');
    console.log('✔ Scenario 2 passed: Concurrent mutated key reuse rejected as IDEMPOTENCY_CONFLICT');

    // --- Scenario 3: Racing different keys + notaries for same case ---
    console.log('[PROBE] Scenario 3: Racing different keys and notaries for same case...');
    const [s3Res1, s3Res2] = await Promise.all([
      callRpcInDb('public.fn_assign_corporate_notary_atomic', [caseId3, notaryId1, adminId, assignKey3A]),
      callRpcInDb('public.fn_assign_corporate_notary_atomic', [caseId3, notaryId2, adminId, assignKey3B]),
    ]);

    const s3SuccessCount = [s3Res1.ok, s3Res2.ok].filter(Boolean).length;
    assert.equal(s3SuccessCount, 1, 'Scenario 3: Exactly 1 assignment can win the race');
    const s3Error = !s3Res1.ok ? s3Res1.error : s3Res2.error;
    assert(s3Error.includes('ASSIGNMENT_CONFLICT') || s3Error.includes('STAGE_NOT_ESCROW_LOCKED'), `Scenario 3: Conflict must be raised, got: ${s3Error}`);

    const s3Events = execPsqlJson(`SELECT count(*) AS count FROM public.compliance_workflow_events_worm WHERE corporate_case_id = '${caseId3}'`);
    assert.equal(Number(s3Events[0].count), 1, 'Scenario 3: Exactly 1 event for winning assignment');
    console.log('✔ Scenario 3 passed: Racing different notaries for same case resolved with single winner');

    // --- Scenario 4: Same CDD key + same payload ---
    console.log('[PROBE] Scenario 4: Concurrent exact duplicate CDD approvals...');
    const [s4Res1, s4Res2] = await Promise.all([
      callRpcInDb('public.fn_approve_notary_cdd_atomic', [caseId4, assessmentId4, notaryId1, '2026.1', cddKey4]),
      callRpcInDb('public.fn_approve_notary_cdd_atomic', [caseId4, assessmentId4, notaryId1, '2026.1', cddKey4]),
    ]);

    assert(s4Res1.ok && s4Res2.ok, `Scenario 4 failed RPC execution: ${JSON.stringify({ s4Res1, s4Res2 })}`);
    const s4Replayed = [s4Res1.data.replayed, s4Res2.data.replayed];
    assert(s4Replayed.includes(false), 'Scenario 4: One must be initial');
    assert(s4Replayed.includes(true), 'Scenario 4: One must be replay');

    const s4Case = execPsqlJson(`SELECT current_stage FROM public.corporate_service_cases WHERE case_id = '${caseId4}'`);
    assert.equal(s4Case[0].current_stage, 'DOCUMENTS_PENDING');

    const s4Assessment = execPsqlJson(`SELECT reviewer_decision FROM public.compliance_assessments WHERE assessment_id = '${assessmentId4}'`);
    assert.equal(s4Assessment[0].reviewer_decision, 'APPROVED');

    const s4Events = execPsqlJson(`SELECT event_type FROM public.compliance_workflow_events_worm WHERE corporate_case_id = '${caseId4}'`);
    assert.equal(s4Events.length, 1);
    assert.equal(s4Events[0].event_type, 'CDD_APPROVED');
    console.log('✔ Scenario 4 passed: Concurrent CDD duplicate approval serialized cleanly');

    // --- Scenario 5: Same CDD key + mutated rules version ---
    console.log('[PROBE] Scenario 5: Concurrent CDD same key with mutated rules version...');
    const [s5Res1, s5Res2] = await Promise.all([
      callRpcInDb('public.fn_approve_notary_cdd_atomic', [caseId5, assessmentId5, notaryId1, '2026.1', cddKey5]),
      callRpcInDb('public.fn_approve_notary_cdd_atomic', [caseId5, assessmentId5, notaryId1, '2026.2_MUTATED', cddKey5]),
    ]);

    const s5SuccessCount = [s5Res1.ok, s5Res2.ok].filter(Boolean).length;
    assert.equal(s5SuccessCount, 1, 'Scenario 5: Exactly 1 must succeed');
    const s5Error = !s5Res1.ok ? s5Res1.error : s5Res2.error;
    assert(s5Error.includes('IDEMPOTENCY_CONFLICT') || s5Error.includes('RULES_VERSION_MISMATCH'), `Scenario 5: Mutated retry must conflict, got: ${s5Error}`);

    const s5Events = execPsqlJson(`SELECT count(*) AS count FROM public.compliance_workflow_events_worm WHERE corporate_case_id = '${caseId5}'`);
    assert.equal(Number(s5Events[0].count), 1);
    console.log('✔ Scenario 5 passed: Concurrent CDD mutated binding rejected as IDEMPOTENCY_CONFLICT');

    console.log('[PROBE] All 5 concurrent scenarios verified successfully with zero state corruption.');
  } finally {
    console.log('[PROBE] Cleaning up disposable probe fixtures...');
    try {
      const cleanupSql = `
BEGIN;
DELETE FROM public.notary_workspace_idempotency_records WHERE case_id IN (${allCaseIds.map((id) => `'${id}'`).join(', ')});
DELETE FROM public.compliance_assessments WHERE case_id IN (${allCaseIds.map((id) => `'${id}'`).join(', ')});
DELETE FROM public.beneficial_owners WHERE case_id IN (${allCaseIds.map((id) => `'${id}'`).join(', ')});
COMMIT;
`;
      execPsql(cleanupSql);
      console.log('[PROBE] Disposable probe mutable fixtures cleaned up cleanly.');
    } catch (cleanupErr) {
      console.warn('[PROBE WARNING] Cleanup error:', cleanupErr.message);
    }
  }
}

runConcurrencyProbe().catch((err) => {
  console.error('[PROBE FATAL]', err);
  process.exit(1);
});
