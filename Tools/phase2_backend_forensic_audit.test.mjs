import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const migrationDirectory = join(root, 'supabase', 'migrations');
const migrationFiles = readdirSync(migrationDirectory)
  .filter((name) => name.endsWith('.sql'))
  .sort();
const sql = migrationFiles
  .map((name) => readFileSync(join(migrationDirectory, name), 'utf8'))
  .join('\n');
const hardening = readFileSync(
  join(
    migrationDirectory,
    '20260728000025_phase2_backend_forensic_hardening.sql',
  ),
  'utf8',
);

test('e-KYC envelope binding requires the authoritative held escrow lock', () => {
  assert.match(hardening, /v_escrow\.status <> 'HELD_IN_ESCROW'/);
  assert.match(hardening, /v_escrow\.funds_lock_time_reconstructed/);
  assert.match(
    hardening,
    /NEW\.escrow_locked_at IS DISTINCT FROM v_escrow\.funds_locked_at/,
  );
  assert.match(
    hardening,
    /NEW\.expires_at IS DISTINCT FROM v_escrow\.funds_locked_at \+ INTERVAL '7 days'/,
  );
  assert.match(hardening, /SIGNING_CORPORATE_ESCROW_SCOPE_MISMATCH/);
  assert.match(hardening, /SIGNING_CONSULTATION_ESCROW_SCOPE_MISMATCH/);
});

test('notary assignment requires verified held funds', () => {
  assert.match(hardening, /NOTARY_ASSIGNMENT_REQUIRES_HELD_ESCROW/);
  assert.match(
    hardening,
    /fn_is_verified_advocate\(NEW\.assigned_notary_id\)/,
  );
  assert.match(
    hardening,
    /ENABLE ALWAYS TRIGGER trg_guard_corporate_notary_assignment/,
  );
});

test('corporate intake has one complete atomic server command', () => {
  const start = hardening.indexOf(
    'CREATE OR REPLACE FUNCTION public.fn_create_corporate_intake_complete_atomic',
  );
  const end = hardening.indexOf('$$;', start);
  const body = hardening.slice(start, end);
  for (const table of [
    'service_orders',
    'service_fee_lines',
    'payment_milestones',
    'corporate_parties',
  ]) {
    assert.match(body, new RegExp(`INSERT INTO public\\.${table}`));
  }
  assert.match(body, /fn_create_corporate_intake_atomic/);
  assert.match(body, /pg_advisory_xact_lock/);
  assert.match(body, /CORPORATE_INTAKE_FINANCIAL_TOTAL_MISMATCH/);
});

test('government rejection cannot jump directly to approval', () => {
  assert.match(
    hardening,
    /WHEN 'REJECTED' THEN NEW\.submission_status = 'REJECTED'/,
  );
  assert.match(
    hardening,
    /ENABLE ALWAYS TRIGGER trg_z_guard_government_submission_transition/,
  );
});

test('wallet payout takes one deterministic lock order', () => {
  const marker =
    'CREATE OR REPLACE FUNCTION public.fn_release_escrow_to_advocate_mutex';
  const start = sql.lastIndexOf(marker);
  const end = sql.indexOf('$$;', start);
  const body = sql.slice(start, end);
  assert.ok(
    body.indexOf('ORDER BY wallet.wallet_id') <
      body.indexOf('UPDATE public.wallet_balances'),
  );
  assert.match(body, /FOR UPDATE/);
});

test('financial evidence tables are append-only and least-privilege', () => {
  assert.match(
    hardening,
    /ENABLE ALWAYS TRIGGER trg_worm_escrow_payout_ledgers_vault/,
  );
  assert.match(
    hardening,
    /ENABLE ALWAYS TRIGGER trg_guard_payout_idempotency_mutation/,
  );
  assert.match(
    hardening,
    /ENABLE ALWAYS TRIGGER trg_guard_provider_webhook_event_mutation/,
  );
  assert.match(
    hardening,
    /REVOKE ALL ON TABLE public\.escrow_payout_ledgers\s+FROM PUBLIC, anon, authenticated/,
  );
});

test('all new privileged functions use an empty fixed search path', () => {
  const privilegedFunctions = [
    'fn_create_corporate_intake_complete_atomic',
    'fn_release_escrow_to_advocate_mutex',
  ];
  for (const name of privilegedFunctions) {
    const marker = `CREATE OR REPLACE FUNCTION public.${name}`;
    const start = hardening.indexOf(marker);
    const end = hardening.indexOf('AS $$', start);
    assert.notEqual(start, -1, name);
    assert.match(hardening.slice(start, end), /SET search_path = ''/);
  }
  for (const signature of [
    /ALTER FUNCTION public\.fn_record_immutable_audit_log\([\s\S]*?\) SET search_path = ''/,
    /ALTER FUNCTION public\.fn_mutate_wallet_balance_mutex\([\s\S]*?\) SET search_path = ''/,
    /ALTER FUNCTION public\.fn_refund_escrow_to_client_mutex\(UUID, TEXT\)\s+SET search_path = ''/,
    /ALTER FUNCTION public\.fn_is_verified_advocate\(UUID\)\s+SET search_path = ''/,
  ]) {
    assert.match(hardening, signature);
  }
});
