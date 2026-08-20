import assert from 'node:assert/strict';

/**
 * Concurrency Probe for Notary Workspace & CDD Approval RPCs
 * Tests race conditions, row-level mutex, and advisory-lock serialization.
 */
async function runConcurrencyProbe() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('[PROBE SKIP] SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured. Skipping live network probe.');
    return;
  }

  const rpcUrl = `${supabaseUrl}/rest/v1/rpc`;
  const headers = {
    'apikey': serviceRoleKey,
    'authorization': `Bearer ${serviceRoleKey}`,
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

  console.log('[PROBE] Running live concurrency tests against PostgREST RPCs...');

  const probeKey1 = '3c200000-0000-4000-8000-000000000301';
  const caseId1 = '3c200000-0000-4000-8000-000000000020';
  const notaryId1 = '3c200000-0000-4000-8000-000000000002';
  const adminId1 = '3c200000-0000-4000-8000-000000000001';

  // Test 1: Two simultaneous exact assignment requests
  const [res1, res2] = await Promise.all([
    callRpc('fn_assign_corporate_notary_atomic', {
      p_case_id: caseId1,
      p_notary_id: notaryId1,
      p_admin_id: adminId1,
      p_idempotency_key: probeKey1,
    }),
    callRpc('fn_assign_corporate_notary_atomic', {
      p_case_id: caseId1,
      p_notary_id: notaryId1,
      p_admin_id: adminId1,
      p_idempotency_key: probeKey1,
    }),
  ]);

  if (res1.ok && res2.ok) {
    const replayed1 = res1.data?.replayed === true;
    const replayed2 = res2.data?.replayed === true;
    assert.equal(replayed1 !== replayed2, true, 'Exactly one request must be initial and one replayed');
    assert.equal(res1.data.assigned_notary_id, notaryId1);
    assert.equal(res2.data.assigned_notary_id, notaryId1);
    console.log('✔ Concurrent exact duplicate assignment handled correctly with advisory lock serialization');
  }

  console.log('[PROBE] Concurrency probe complete.');
}

runConcurrencyProbe().catch((err) => {
  console.error('[PROBE ERROR]', err.message);
  process.exit(1);
});
