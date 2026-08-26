import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

/**
 * True-Concurrency Probe for Notary Workspace & CDD Approval RPCs (Batch 3.C.5)
 *
 * Repairs Batch 3.C.4 finding P1-1: the previous probe called child_process.execSync
 * inside Promise.all, so request pairs executed strictly sequentially and never
 * produced two overlapping database transactions.
 *
 * This probe instead keeps TWO independent, persistent psql child processes alive
 * per competitor pair and proves overlap deterministically:
 *   1. Session A opens an explicit transaction (BEGIN) and completes the RPC,
 *      retaining its transaction-scoped advisory/row locks.
 *   2. Session B is dispatched while A's transaction is still open.
 *   3. A monitor session polls pg_stat_activity until B is observed in
 *      state='active' AND wait_event_type='Lock' — B is provably blocked by A.
 *   4. Only after that observation does the probe COMMIT A, releasing the lock,
 *      after which B produces its replay/conflict result.
 * The commit gate is driven by the lock-wait observation, never by timing alone.
 *
 * Fail-closed: missing/invalid DISPOSABLE_DB_CONTAINER exits nonzero before any
 * Docker access. The only accepted target is the disposable Batch 3.C.5 container.
 * No shell strings are built with the container name (spawn argument arrays only).
 * No credentials are printed.
 */

const REQUIRED_CONTAINER = 'supabase_db_justifiqa_3c5_disp';
const FORBIDDEN_SUBSTRINGS = ['justificadll', 'recovery', '3c4', 'main'];

function failClosed(message) {
  console.error(`[PROBE ERROR] ${message}`);
  process.exit(1);
}

const containerName = process.env.DISPOSABLE_DB_CONTAINER;
if (!containerName) {
  failClosed('DISPOSABLE_DB_CONTAINER wajib diisi. Tidak ada fallback ke environment lain.');
}
const loweredName = containerName.toLowerCase();
for (const banned of FORBIDDEN_SUBSTRINGS) {
  if (loweredName.includes(banned)) {
    failClosed(`Nama container "${containerName}" dilarang (mengandung "${banned}").`);
  }
}
if (containerName !== REQUIRED_CONTAINER) {
  failClosed(`Container harus persis "${REQUIRED_CONTAINER}", diterima "${containerName}".`);
}

/** Escape a value as a SQL literal (fixtures/args are probe-generated UUIDs). */
function sqlLit(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

/** Single-shot async psql. Rejects on nonzero child exit. Never prints stderr content. */
function runPsql(sql, { watchdogMs = 45000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      'docker',
      ['exec', '-i', containerName, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-v', 'ON_ERROR_STOP=1'],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    let stdout = '';
    let stderr = '';
    let settled = false;
    // Watchdog: kill a hung transport (docker exec stalls on engine flapping)
    // so the probe fails fast instead of hanging forever. Does not affect proof logic.
    const watchdog = setTimeout(() => {
      if (!settled) {
        settled = true;
        try { child.kill('SIGKILL'); } catch { /* noop */ }
        reject(new Error(`[PROBE] Watchdog ${watchdogMs}ms: transport psql hang (engine flap).`));
      }
    }, watchdogMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      reject(error);
    });
    child.stdin.on('error', () => undefined);
    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(watchdog);
      if (code !== 0) {
        const err = new Error(`psql exited with code ${code}: ${stderr.trim().slice(0, 400)}`);
        err.stderr = stderr;
        reject(err);
        return;
      }
      resolve(stdout.trim());
    });
    child.stdin.write(sql);
    child.stdin.end();
  });
}

/** JSON row-set query. Empty sets become '[]'; malformed/empty output is rejected. */
async function execPsqlJson(sql) {
  const raw = await runPsql(`SELECT coalesce(json_agg(t), '[]'::json)::text FROM (${sql}) t;`);
  if (!raw) {
    throw new Error(`[PROBE] Malformed/empty psql output untuk query: ${sql.slice(0, 120)}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (parseError) {
    throw new Error(`[PROBE] JSON parse failure: ${parseError.message}; raw=${raw.slice(0, 200)}`);
  }
  if (!Array.isArray(parsed)) {
    throw new Error(`[PROBE] Hasil bukan array JSON untuk query: ${sql.slice(0, 120)}`);
  }
  return parsed;
}

/** Count query helper. */
async function countRows(sql) {
  const rows = await execPsqlJson(sql);
  assert.equal(rows.length, 1, 'countRows harus menghasilkan tepat 1 baris');
  return Number(rows[0].count);
}

/**
 * Persistent interactive psql session over stdin/stdout pipes.
 * SQL errors do NOT kill this session (no ON_ERROR_STOP), so expected RPC
 * rejections are reported through stderr deltas between statement sentinels.
 */
class PsqlSession {
  constructor(label) {
    this.label = label;
    this.seq = 0;
    this.outBuf = '';
    this.errBuf = '';
    this.waiter = null;
    this.closed = false;
    this.spawnedAt = Date.now();
    this.child = spawn(
      'docker',
      ['exec', '-i', containerName, 'psql', '-U', 'postgres', '-d', 'postgres', '-t', '-A', '-q'],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );
    this.child.stdout.on('data', (chunk) => {
      this.outBuf += chunk;
      this.drain();
    });
    this.child.stderr.on('data', (chunk) => {
      this.errBuf += chunk;
    });
    this.child.on('error', (error) => {
      if (this.waiter) {
        this.waiter.reject(error);
        this.waiter = null;
      }
    });
    this.exited = new Promise((resolve) => {
      this.child.on('close', (code) => {
        this.closed = true;
        this.exitCode = code;
        if (this.waiter) {
          this.waiter.reject(new Error(`[PROBE] Sesi ${this.label} keluar dini (code ${code}).`));
          this.waiter = null;
        }
        resolve(code);
      });
    });
  }

  drain() {
    if (!this.waiter) return;
    const { sentinel, startOut, startErr, resolve } = this.waiter;
    const idx = this.outBuf.indexOf(sentinel, startOut);
    if (idx === -1) return;
    const rawOut = this.outBuf.slice(startOut, idx).trim();
    const rawErr = this.errBuf.slice(startErr).trim();
    this.waiter = null;
    resolve({ out: rawOut, err: rawErr });
  }

  /**
   * Send one SQL statement plus a unique sentinel SELECT. Resolves once the
   * sentinel is echoed back — correlation is by sentinel, never by timing.
   */
  send(sql, { timeoutMs = 30000 } = {}) {
    if (this.closed) return Promise.reject(new Error(`[PROBE] Sesi ${this.label} sudah tertutup.`));
    if (this.waiter) return Promise.reject(new Error(`[PROBE] Sesi ${this.label} sibuk.`));
    const sentinel = `__PROBE_${this.label}_${++this.seq}__`;
    const startOut = this.outBuf.length;
    const startErr = this.errBuf.length;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.waiter) {
          this.waiter = null;
          reject(new Error(`[PROBE] Timeout ${timeoutMs}ms menunggu sentinel pada sesi ${this.label}.`));
        }
      }, timeoutMs);
      this.waiter = {
        sentinel,
        startOut,
        startErr,
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      };
      this.child.stdin.write(`${sql}\nSELECT '${sentinel}';\n`);
    });
  }

  async close() {
    if (!this.closed) {
      try { this.child.stdin.end(); } catch { /* noop */ }
      await Promise.race([this.exited, new Promise((res) => setTimeout(res, 3000))]);
      if (!this.closed) this.child.kill('SIGKILL');
    }
  }
}

/** The RPC outcome row lives on stdout inside the same stream before the sentinel. */
function buildRpcDo(fnName, args) {
  return [
    'TRUNCATE probe_result;',
    'DO $$',
    'DECLARE v_result JSONB;',
    'BEGIN',
    '  BEGIN',
    `    v_result := ${fnName}(${args.map(sqlLit).join(', ')});`,
    "    INSERT INTO probe_result(outcome) VALUES ('RESULT ' || v_result::text);",
    '  EXCEPTION WHEN OTHERS THEN',
    "    INSERT INTO probe_result(outcome) VALUES ('ERROR ' || SQLERRM);",
    '  END;',
    'END $$;',
    'SELECT outcome FROM probe_result;',
  ].join('\n');
}

/** Parse the structured outcome row emitted by buildRpcDo on stdout. */
function parseRpcOutcome(res, label) {
  const line = res.out
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith('RESULT ') || l.startsWith('ERROR '));
  if (!line) {
    throw new Error(
      `${label}: tidak ada baris hasil RPC terstruktur. out=${res.out.slice(0, 300)} err=${res.err.slice(0, 300)}`,
    );
  }
  if (line.startsWith('RESULT ')) {
    const payload = line.slice('RESULT '.length);
    try {
      return { ok: true, data: JSON.parse(payload) };
    } catch (parseError) {
      throw new Error(`${label}: RESULT bukan JSON valid (${parseError.message}): ${line.slice(0, 200)}`);
    }
  }
  return { ok: false, error: line.slice('ERROR '.length) };
}

/**
 * Observe, via an independent monitor session, that backend `pid` is blocked
 * on a PostgreSQL lock while executing fnName. Throws on timeout — this
 * observation is the deterministic barrier that gates the COMMIT of session A.
 */
async function waitForLockWait(pid, fnName, label, timeoutMs = 60000) {
  const started = Date.now();
  let attempts = 0;
  let lastRows = null;
  for (;;) {
    attempts += 1;
    let rows;
    try {
      rows = await execPsqlJson(
        `SELECT pid::text AS pid, state, wait_event_type, wait_event
         FROM pg_stat_activity WHERE pid = ${Number(pid)}`,
      );
      lastRows = rows;
    } catch (pollError) {
      // Transient docker transport flap while polling: keep polling until the
      // barrier timeout; the concurrency proof remains the lock observation.
      if (Date.now() - started > timeoutMs) {
        throw new Error(`[PROBE] ${label}: polling terhambat transport: ${pollError.message}`);
      }
      await new Promise((res) => setTimeout(res, 500));
      continue;
    }
    if (rows.length === 1 && rows[0].state === 'active' && rows[0].wait_event_type === 'Lock') {
      return {
        pid,
        state: rows[0].state,
        waitEventType: rows[0].wait_event_type,
        waitEvent: rows[0].wait_event,
        pollAttempts: attempts,
        elapsedMs: Date.now() - started,
        fnName,
        label,
      };
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(
        `[PROBE] ${label}: sesi kompetitor (pid ${pid}) tidak pernah teramati menunggu lock; ` +
        `overlap tidak dapat dibuktikan. Observasi terakhir: ${JSON.stringify(lastRows)}`,
      );
    }
    await new Promise((res) => setTimeout(res, 200));
  }
}

/**
 * Run two competing RPC calls as two truly overlapping database sessions.
 * Returns both results plus the overlap evidence bundle.
 */
async function runCompetingPair({ label, fnName, argsA, argsB }) {
  const sessionA = new PsqlSession(`${label}-A`);
  const sessionB = new PsqlSession(`${label}-B`);
  try {
    await sessionA.send('SELECT 1;');
    await sessionB.send('SELECT 1;');
    // Session-persistent outcome table (outside any explicit transaction) so
    // RPC results ride stdout in deterministic order before the sentinel.
    await sessionA.send('CREATE TEMP TABLE probe_result (outcome text);');
    await sessionB.send('CREATE TEMP TABLE probe_result (outcome text);');
    const bothAliveAt = Date.now();

    await sessionA.send('BEGIN;');
    await sessionB.send('BEGIN;');

    const pidBRow = await sessionB.send('SELECT pg_backend_pid();');
    const pidB = Number(pidBRow.out.split('\n')[0].trim());
    assert(Number.isInteger(pidB) && pidB > 0, `${label}: pid sesi B tidak valid`);

    // Competitor A completes its RPC but KEEPS its transaction open, retaining locks.
    const aRes = await sessionA.send(buildRpcDo(fnName, argsA), { timeoutMs: 120000 });
    const aCompletedAt = Date.now();

    // Competitor B is dispatched while A's transaction is still open. Not awaited.
    // NOTE: the 120s bound only absorbs intermittent local Docker transport
    // stalls. The concurrency proof itself never uses duration; it is gated by
    // the pg_stat_activity lock-wait observation and the explicit COMMIT order.
    let pendingACommit = true;
    let bSettledBeforeACommit = null;
    const bPromise = sessionB.send(buildRpcDo(fnName, argsB), { timeoutMs: 120000 }).then((value) => {
      bSettledBeforeACommit = pendingACommit;
      return value;
    });

    const bDispatchedAt = Date.now();

    // Deterministic barrier: prove B is blocked on a lock held by A's open txn.
    const overlap = await waitForLockWait(pidB, fnName, label);

    await sessionA.send('COMMIT;');
    const aCommittedAt = Date.now();
    pendingACommit = false;

    const bRes = await bPromise;
    await sessionB.send('COMMIT;');

    assert.equal(
      bSettledBeforeACommit, false,
      `${label}: sesi B selesai sebelum sesi A melepas lock — overlap tidak terbukti`,
    );

    return {
      label,
      aResult: aRes,
      bResult: bRes,
      evidence: {
        bothSessionsAliveBeforeRpcAt: bothAliveAt,
        aRpcCompletedAt: aCompletedAt,
        bDispatchedAt,
        aCommittedAt,
        bBlockedObservation: overlap,
        competitorBPendingUntilACommit: bSettledBeforeACommit === false,
      },
    };
  } finally {
    await sessionA.close();
    await sessionB.close();
  }
}

async function runConcurrencyProbe() {
  // Fail-closed reachability check against the validated disposable container only.
  await runPsql('SELECT 1;');

  // Fixture identities
  const adminId = '3c500000-0000-4000-8000-000000000001';
  const notaryId1 = '3c500000-0000-4000-8000-000000000002';
  const notaryId2 = '3c500000-0000-4000-8000-000000000003';
  const clientId = '3c500000-0000-4000-8000-000000000006';

  const orderId1 = randomUUID();
  const caseId1 = randomUUID();
  const escrowId1 = randomUUID();
  const assignKey1 = randomUUID();

  const orderId2 = randomUUID();
  const caseId2 = randomUUID();
  const escrowId2 = randomUUID();
  const assignKey2A = randomUUID();
  const assignKey2B = randomUUID();

  const orderId3 = randomUUID();
  const caseId3 = randomUUID();
  const escrowId3 = randomUUID();
  const assignKey3 = randomUUID();

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
  const caseListSql = allCaseIds.map(sqlLit).join(', ');

  console.log('[PROBE] Provisioning fresh isolated test fixtures for Batch 3.C.5 on disposable stack...');

  const fixtureSql = `
BEGIN;
INSERT INTO auth.users (id, aud, role, email, encrypted_password, created_at, updated_at)
VALUES
    (${sqlLit(adminId)}, 'authenticated', 'authenticated', 'admin-probe-3c5@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
    (${sqlLit(notaryId1)}, 'authenticated', 'authenticated', 'notary1-probe-3c5@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
    (${sqlLit(notaryId2)}, 'authenticated', 'authenticated', 'notary2-probe-3c5@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp()),
    (${sqlLit(clientId)}, 'authenticated', 'authenticated', 'client-probe-3c5@justica.invalid', '!TEST!', clock_timestamp(), clock_timestamp())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.users_admin (admin_id, full_name, email, role_group)
VALUES (${sqlLit(adminId)}, 'Admin Probe 3C5', 'admin-probe-3c5@justica.invalid', 'COMPLIANCE_OFFICER')
ON CONFLICT (admin_id) DO UPDATE SET role_group = 'COMPLIANCE_OFFICER';

INSERT INTO public.users_client (client_id, full_name, email, phone_e164, password_hash, kyc_status)
VALUES (${sqlLit(clientId)}, 'Client Probe 3C5', 'client-probe-3c5@justica.invalid', '+6281234567890', '!HASH!', 'VERIFIED')
ON CONFLICT (client_id) DO NOTHING;

INSERT INTO public.users_advocate (advocate_id, full_name, email, phone_e164, sipp_license_no, peradi_card_no, specialization_primary, kyc_status)
VALUES
    (${sqlLit(notaryId1)}, 'Notaris 1 Probe 3C5', 'notary1-probe-3c5@justica.invalid', '+6281234567891', 'SIPP-PROBE-3C5-01', 'PERADI-PROBE-3C5-01', 'CORPORATE', 'VERIFIED'),
    (${sqlLit(notaryId2)}, 'Notaris 2 Probe 3C5', 'notary2-probe-3c5@justica.invalid', '+6281234567892', 'SIPP-PROBE-3C5-02', 'PERADI-PROBE-3C5-02', 'CORPORATE', 'VERIFIED')
ON CONFLICT (advocate_id) DO UPDATE SET kyc_status = EXCLUDED.kyc_status;

INSERT INTO public.notary_profiles (notary_id, license_number, jurisdiction_city, jurisdiction_province, status, verified_by_admin_id, verified_at)
VALUES
    (${sqlLit(notaryId1)}, 'SK-PROBE-3C5-01', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', ${sqlLit(adminId)}, clock_timestamp()),
    (${sqlLit(notaryId2)}, 'SK-PROBE-3C5-02', 'Jakarta Selatan', 'DKI Jakarta', 'VERIFIED_ACTIVE', ${sqlLit(adminId)}, clock_timestamp())
ON CONFLICT (notary_id) DO UPDATE SET status = EXCLUDED.status;

INSERT INTO public.service_orders (order_id, client_id, service_type, status)
VALUES
    (${sqlLit(orderId1)}, ${sqlLit(clientId)}, 'PT_ORDINARY', 'DRAFT'),
    (${sqlLit(orderId2)}, ${sqlLit(clientId)}, 'PT_ORDINARY', 'DRAFT'),
    (${sqlLit(orderId3)}, ${sqlLit(clientId)}, 'PT_ORDINARY', 'DRAFT'),
    (${sqlLit(orderId4)}, ${sqlLit(clientId)}, 'PT_ORDINARY', 'DRAFT'),
    (${sqlLit(orderId5)}, ${sqlLit(clientId)}, 'PT_ORDINARY', 'DRAFT');

INSERT INTO public.corporate_service_cases (case_id, order_id, entity_type, proposed_name, domicile_city, domicile_province, legal_scope_version, current_stage, assigned_notary_id)
VALUES
    (${sqlLit(caseId1)}, ${sqlLit(orderId1)}, 'PT_ORDINARY', 'PT S1 Probe 3C5', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
    (${sqlLit(caseId2)}, ${sqlLit(orderId2)}, 'PT_ORDINARY', 'PT S2 Probe 3C5', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
    (${sqlLit(caseId3)}, ${sqlLit(orderId3)}, 'PT_ORDINARY', 'PT S3 Probe 3C5', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'ESCROW_LOCKED', null),
    (${sqlLit(caseId4)}, ${sqlLit(orderId4)}, 'PT_ORDINARY', 'PT S4 Probe 3C5', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'CDD_REVIEW', ${sqlLit(notaryId1)}),
    (${sqlLit(caseId5)}, ${sqlLit(orderId5)}, 'PT_ORDINARY', 'PT S5 Probe 3C5', 'Jakarta Selatan', 'DKI Jakarta', '2026.1', 'CDD_REVIEW', ${sqlLit(notaryId1)});

INSERT INTO public.escrow_transactions (escrow_id, corporate_case_id, client_id, total_amount_idr, status, holding_expires_at, payment_gateway_ref, funds_locked_at)
VALUES
    (${sqlLit(escrowId1)}, ${sqlLit(caseId1)}, ${sqlLit(clientId)}, 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S1-3C5', clock_timestamp()),
    (${sqlLit(escrowId2)}, ${sqlLit(caseId2)}, ${sqlLit(clientId)}, 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S2-3C5', clock_timestamp()),
    (${sqlLit(escrowId3)}, ${sqlLit(caseId3)}, ${sqlLit(clientId)}, 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S3-3C5', clock_timestamp()),
    (${sqlLit(escrowId4)}, ${sqlLit(caseId4)}, ${sqlLit(clientId)}, 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S4-3C5', clock_timestamp()),
    (${sqlLit(escrowId5)}, ${sqlLit(caseId5)}, ${sqlLit(clientId)}, 7500000, 'HELD_IN_ESCROW', clock_timestamp() + interval '7 days', 'PG-S5-3C5', clock_timestamp());

INSERT INTO public.beneficial_owners (beneficial_owner_id, case_id, declaration_version, person_type, natural_person_name, identity_reference, control_basis, percentage, evidence_digest, verification_status, reviewer_id, reviewer_role, verified_at)
VALUES
    (${sqlLit(boId4)}, ${sqlLit(caseId4)}, 1, 'NATURAL_PERSON', 'BO Probe S4', 'ID-S4-3C5', 'OWNERSHIP', 90.0, repeat('d', 64), 'VERIFIED', ${sqlLit(adminId)}, 'COMPLIANCE_OFFICER', clock_timestamp()),
    (${sqlLit(boId5)}, ${sqlLit(caseId5)}, 1, 'NATURAL_PERSON', 'BO Probe S5', 'ID-S5-3C5', 'OWNERSHIP', 90.0, repeat('e', 64), 'VERIFIED', ${sqlLit(adminId)}, 'COMPLIANCE_OFFICER', clock_timestamp());

INSERT INTO public.compliance_assessments (assessment_id, case_id, assessment_level, pep_check_status, sanctions_check_status, rules_version, reviewer_decision, reviewer_id, reviewer_role)
VALUES
    (${sqlLit(assessmentId4)}, ${sqlLit(caseId4)}, 'CDD', 'NO_MATCH', 'NO_MATCH', '2026.1', 'PENDING', ${sqlLit(notaryId1)}, 'NOTARY'),
    (${sqlLit(assessmentId5)}, ${sqlLit(caseId5)}, 'CDD', 'NO_MATCH', 'NO_MATCH', '2026.1', 'PENDING', ${sqlLit(notaryId1)}, 'NOTARY');
COMMIT;
`;

  await runPsql(fixtureSql);
  console.log('[PROBE] Fixtures provisioned. Running 5 TRUE-concurrency scenarios (2 overlapping sessions per pair)...');

  const overlapEvidence = [];

  async function globalCounts() {
    return {
      idempotency: await countRows(`SELECT count(*) AS count FROM public.notary_workspace_idempotency_records WHERE case_id IN (${caseListSql})`),
      worm: await countRows(`SELECT count(*) AS count FROM public.compliance_workflow_events_worm WHERE corporate_case_id IN (${caseListSql})`),
    };
  }

  function recordEvidence(entry) {
    overlapEvidence.push(entry);
    console.log(`[PROBE][OVERLAP] ${entry.label}: B blocked on wait_event=${entry.evidence.bBlockedObservation.waitEvent} ` +
      `(type=${entry.evidence.bBlockedObservation.waitEventType}, polls=${entry.evidence.bBlockedObservation.pollAttempts}, ` +
      `${entry.evidence.bBlockedObservation.elapsedMs}ms) until A COMMIT; B pending-before-commit=${entry.evidence.competitorBPendingUntilACommit}`);
  }

  try {
    // ------------------------------------------------------------------
    // Scenario 1: Simultaneous identical assignment (same key, same payload)
    // ------------------------------------------------------------------
    console.log('[PROBE] Scenario 1: two overlapping sessions, identical assignment RPC...');
    let before = await globalCounts();
    const s1 = await runCompetingPair({
      label: 'S1',
      fnName: 'public.fn_assign_corporate_notary_atomic',
      argsA: [caseId1, notaryId1, adminId, assignKey1],
      argsB: [caseId1, notaryId1, adminId, assignKey1],
    });
    const s1A = parseRpcOutcome(s1.aResult, 'S1-A');
    const s1B = parseRpcOutcome(s1.bResult, 'S1-B');
    assert(s1A.ok && s1B.ok, `S1: kedua sesi harus sukses (A=${s1A.ok ? 'ok' : s1A.error}; B=${s1B.ok ? 'ok' : s1B.error})`);
    assert.deepEqual(
      [s1A.data.replayed, s1B.data.replayed].sort(),
      [false, true],
      'S1: satu response harus initial (replayed=false), satu replay (replayed=true)',
    );
    assert.equal(s1A.data.case_id, caseId1.toLowerCase());
    assert.equal(s1B.data.case_id, caseId1.toLowerCase());
    const s1Case = await execPsqlJson(`SELECT current_stage, assigned_notary_id::text AS notary FROM public.corporate_service_cases WHERE case_id = ${sqlLit(caseId1)}`);
    assert.equal(s1Case.length, 1);
    assert.equal(s1Case[0].notary, notaryId1);
    assert.equal(s1Case[0].current_stage, 'ESCROW_LOCKED');
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.compliance_workflow_events_worm WHERE corporate_case_id = ${sqlLit(caseId1)}`), 1, 'S1: tepat 1 WORM event');
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.notary_workspace_idempotency_records WHERE idempotency_key = ${sqlLit(assignKey1.toLowerCase())}`), 1, 'S1: tepat 1 idempotency record');
    let after = await globalCounts();
    assert.equal(after.idempotency - before.idempotency, 1, 'S1: delta idempotency global harus 1');
    assert.equal(after.worm - before.worm, 1, 'S1: delta WORM global harus 1');
    recordEvidence(s1);
    console.log('✔ Scenario 1: duplikat identik konkuren → 1 initial + 1 replay, tepat 1 event + 1 idempotency row');

    // ------------------------------------------------------------------
    // Scenario 2: Simultaneous conflicting Notaries for one case (different keys)
    // ------------------------------------------------------------------
    console.log('[PROBE] Scenario 2: two overlapping sessions racing different Notaris/keys on one case...');
    before = await globalCounts();
    const s2 = await runCompetingPair({
      label: 'S2',
      fnName: 'public.fn_assign_corporate_notary_atomic',
      argsA: [caseId2, notaryId1, adminId, assignKey2A],
      argsB: [caseId2, notaryId2, adminId, assignKey2B],
    });
    const s2A = parseRpcOutcome(s2.aResult, 'S2-A');
    const s2B = parseRpcOutcome(s2.bResult, 'S2-B');
    assert(s2A.ok, `S2: pemenang A harus sukses: ${s2A.ok ? '' : s2A.error}`);
    assert(!s2B.ok, 'S2: kompetitor B harus ditolak');
    assert(
      s2B.error.includes('ASSIGNMENT_CONFLICT') || s2B.error.includes('STAGE_CONFLICT'),
      `S2: konflik harus ASSIGNMENT_CONFLICT/STAGE_CONFLICT, diterima: ${s2B.ok ? '' : s2B.error}`,
    );
    const s2Case = await execPsqlJson(`SELECT current_stage, assigned_notary_id::text AS notary FROM public.corporate_service_cases WHERE case_id = ${sqlLit(caseId2)}`);
    assert.equal(s2Case[0].notary, notaryId1, 'S2: pemenang race adalah sesi yang lebih dulu commit');
    assert.equal(s2Case[0].current_stage, 'ESCROW_LOCKED');
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.compliance_workflow_events_worm WHERE corporate_case_id = ${sqlLit(caseId2)}`), 1, 'S2: tepat 1 event untuk pemenang');
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.notary_workspace_idempotency_records WHERE case_id = ${sqlLit(caseId2)}`), 1, 'S2: tepat 1 idempotency row');
    after = await globalCounts();
    assert.equal(after.idempotency - before.idempotency, 1);
    assert.equal(after.worm - before.worm, 1);
    recordEvidence(s2);
    console.log('✔ Scenario 2: race Notaris berbeda → tepat 1 pemenang, pecundang ASSIGNMENT_CONFLICT, tanpa partial write');

    // ------------------------------------------------------------------
    // Scenario 3: Same assignment key with mutated payload
    // ------------------------------------------------------------------
    console.log('[PROBE] Scenario 3: two overlapping sessions, same key + mutated Notary payload...');
    before = await globalCounts();
    const s3 = await runCompetingPair({
      label: 'S3',
      fnName: 'public.fn_assign_corporate_notary_atomic',
      argsA: [caseId3, notaryId1, adminId, assignKey3],
      argsB: [caseId3, notaryId2, adminId, assignKey3],
    });
    const s3A = parseRpcOutcome(s3.aResult, 'S3-A');
    const s3B = parseRpcOutcome(s3.bResult, 'S3-B');
    assert(s3A.ok, `S3: A harus sukses: ${s3A.ok ? '' : s3A.error}`);
    assert(!s3B.ok && s3B.error.includes('IDEMPOTENCY_CONFLICT'), `S3: B harus IDEMPOTENCY_CONFLICT, diterima: ${s3B.ok ? 'sukses' : s3B.error}`);
    const s3Case = await execPsqlJson(`SELECT current_stage, assigned_notary_id::text AS notary FROM public.corporate_service_cases WHERE case_id = ${sqlLit(caseId3)}`);
    assert.equal(s3Case[0].notary, notaryId1);
    assert.equal(s3Case[0].current_stage, 'ESCROW_LOCKED');
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.compliance_workflow_events_worm WHERE corporate_case_id = ${sqlLit(caseId3)}`), 1);
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.notary_workspace_idempotency_records WHERE idempotency_key = ${sqlLit(assignKey3.toLowerCase())}`), 1);
    after = await globalCounts();
    assert.equal(after.idempotency - before.idempotency, 1);
    assert.equal(after.worm - before.worm, 1);
    recordEvidence(s3);
    console.log('✔ Scenario 3: key sama payload termutasi → IDEMPOTENCY_CONFLICT tanpa write tambahan');

    // ------------------------------------------------------------------
    // Scenario 4: Simultaneous identical CDD approval
    // ------------------------------------------------------------------
    console.log('[PROBE] Scenario 4: two overlapping sessions, identical CDD approval RPC...');
    before = await globalCounts();
    const s4 = await runCompetingPair({
      label: 'S4',
      fnName: 'public.fn_approve_notary_cdd_atomic',
      argsA: [caseId4, assessmentId4, notaryId1, '2026.1', cddKey4],
      argsB: [caseId4, assessmentId4, notaryId1, '2026.1', cddKey4],
    });
    const s4A = parseRpcOutcome(s4.aResult, 'S4-A');
    const s4B = parseRpcOutcome(s4.bResult, 'S4-B');
    assert(s4A.ok && s4B.ok, `S4: kedua sesi harus sukses (A=${s4A.ok ? 'ok' : s4A.error}; B=${s4B.ok ? 'ok' : s4B.error})`);
    assert.deepEqual([s4A.data.replayed, s4B.data.replayed].sort(), [false, true], 'S4: 1 initial + 1 replay');
    const s4Case = await execPsqlJson(`SELECT current_stage FROM public.corporate_service_cases WHERE case_id = ${sqlLit(caseId4)}`);
    assert.equal(s4Case[0].current_stage, 'DOCUMENTS_PENDING');
    const s4Assessment = await execPsqlJson(`SELECT reviewer_decision FROM public.compliance_assessments WHERE assessment_id = ${sqlLit(assessmentId4)}`);
    assert.equal(s4Assessment[0].reviewer_decision, 'APPROVED');
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.compliance_workflow_events_worm WHERE corporate_case_id = ${sqlLit(caseId4)}`), 1);
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.notary_workspace_idempotency_records WHERE idempotency_key = ${sqlLit(cddKey4.toLowerCase())}`), 1);
    after = await globalCounts();
    assert.equal(after.idempotency - before.idempotency, 1);
    assert.equal(after.worm - before.worm, 1);
    recordEvidence(s4);
    console.log('✔ Scenario 4: CDD duplikat identik konkuren → 1 approval + 1 replay, stage DOCUMENTS_PENDING');

    // ------------------------------------------------------------------
    // Scenario 5: Same CDD key with mutated rules version
    // ------------------------------------------------------------------
    console.log('[PROBE] Scenario 5: two overlapping sessions, same CDD key + mutated rules version...');
    before = await globalCounts();
    const s5 = await runCompetingPair({
      label: 'S5',
      fnName: 'public.fn_approve_notary_cdd_atomic',
      argsA: [caseId5, assessmentId5, notaryId1, '2026.1', cddKey5],
      argsB: [caseId5, assessmentId5, notaryId1, '2026.2_MUTATED', cddKey5],
    });
    const s5A = parseRpcOutcome(s5.aResult, 'S5-A');
    const s5B = parseRpcOutcome(s5.bResult, 'S5-B');
    assert(s5A.ok, `S5: A harus sukses: ${s5A.ok ? '' : s5A.error}`);
    assert(!s5B.ok && s5B.error.includes('IDEMPOTENCY_CONFLICT'), `S5: B harus IDEMPOTENCY_CONFLICT, diterima: ${s5B.ok ? 'sukses' : s5B.error}`);
    const s5Case = await execPsqlJson(`SELECT current_stage FROM public.corporate_service_cases WHERE case_id = ${sqlLit(caseId5)}`);
    assert.equal(s5Case[0].current_stage, 'DOCUMENTS_PENDING');
    const s5Assessment = await execPsqlJson(`SELECT reviewer_decision FROM public.compliance_assessments WHERE assessment_id = ${sqlLit(assessmentId5)}`);
    assert.equal(s5Assessment[0].reviewer_decision, 'APPROVED');
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.compliance_workflow_events_worm WHERE corporate_case_id = ${sqlLit(caseId5)}`), 1);
    assert.equal(await countRows(`SELECT count(*) AS count FROM public.notary_workspace_idempotency_records WHERE idempotency_key = ${sqlLit(cddKey5.toLowerCase())}`), 1);
    after = await globalCounts();
    assert.equal(after.idempotency - before.idempotency, 1);
    assert.equal(after.worm - before.worm, 1);
    recordEvidence(s5);
    console.log('✔ Scenario 5: key CDD sama rules termutasi → IDEMPOTENCY_CONFLICT tanpa write tambahan');

    console.log('[PROBE] All 5 TRUE-concurrency scenarios verified. Overlap was proven by pg_stat_activity lock-wait observation gating each COMMIT, never by timing alone.');
    console.log(`[PROBE] Overlap evidence entries recorded: ${overlapEvidence.length}`);
  } finally {
    console.log('[PROBE] Cleaning up all MUTABLE disposable probe fixtures...');
    try {
      const cleanupSql = `
BEGIN;
DELETE FROM public.notary_workspace_idempotency_records WHERE case_id IN (${caseListSql});
DELETE FROM public.compliance_assessments WHERE case_id IN (${caseListSql});
DELETE FROM public.beneficial_owners WHERE case_id IN (${caseListSql});
COMMIT;
`;
      await runPsql(cleanupSql);
      const remainingIdem = await countRows(`SELECT count(*) AS count FROM public.notary_workspace_idempotency_records WHERE case_id IN (${caseListSql})`);
      const remainingAssess = await countRows(`SELECT count(*) AS count FROM public.compliance_assessments WHERE case_id IN (${caseListSql})`);
      const remainingBo = await countRows(`SELECT count(*) AS count FROM public.beneficial_owners WHERE case_id IN (${caseListSql})`);
      assert.equal(remainingIdem, 0, 'Fixture idempotency harus bersih setelah cleanup');
      assert.equal(remainingAssess, 0, 'Fixture assessment harus bersih setelah cleanup');
      assert.equal(remainingBo, 0, 'Fixture beneficial owner harus bersih setelah cleanup');
      console.log('[PROBE] Fixture idempotency/assessment/BO probe ini dibersihkan.TERVERIFIKASI 0. LIMITATION: baris WORM append-only dan fixture case/escrow/order/notary/user yang direferensikan FK-nya tidak dapat dihapus secara legal dan tetap tinggal di database disposable sampai container+volume dihancurkan.');
    } catch (cleanupErr) {
      console.warn('[PROBE WARNING] Cleanup error:', cleanupErr.message);
    }
  }
}

runConcurrencyProbe().catch((err) => {
  console.error('[PROBE FATAL]', err);
  process.exit(1);
});
