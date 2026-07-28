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
const sqlWithoutComments = sql.replace(/--.*$/gm, '');

const phase2Tables = [
  'service_orders',
  'corporate_service_cases',
  'beneficial_owners',
  'ekyc_verification_logs',
  'signing_envelopes',
  'provider_webhook_events',
  'payout_idempotency_keys',
  'government_submission_jobs',
];

const campaignComponents = [
  'DocumentDraftingModal.tsx',
  'advocate/AdvocateHeaderAndTabs.tsx',
  'client/CheckoutEscrowModal.tsx',
  'client/CheckoutPaymentInstructions.tsx',
  'client/ClientTabNav.tsx',
  'client/room/DeliverableVaultPanel.tsx',
  'corporate/AdvocateCorporateCaseManager.tsx',
  'corporate/ClientCorporateSuiteTab.tsx',
  'corporate/CorporateCaseTrackerPanel.tsx',
  'corporate/CorporateIntakeStepFields.tsx',
  'corporate/CorporateIntakeWizard.tsx',
  'corporate/corporateUiModel.ts',
  'corporate/notary/KemenkumhamStampingModal.tsx',
  'corporate/notary/NotaryCaseWorkspacePanel.tsx',
  'document/DocumentDraftActions.tsx',
  'document/DocumentDraftingForm.tsx',
  'document/DocumentDraftPreview.tsx',
  'gateway/VerifierPanel.tsx',
  'payment/EscrowDisbursementTrackerPanel.tsx',
  'payment/PaymentGatewaySelectorModal.tsx',
  'signing/EkycVerificationWizard.tsx',
  'signing/MultiPartySigningPanel.tsx',
  'verifier/PublicVerifierFormCard.tsx',
  'verifier/PublicVerifierHero.tsx',
  'verifier/PublicVerifierResult.tsx',
];

const componentRoot = join(root, 'justifiqa-frontend', 'src', 'components');
const componentSource = (relativePath) => readFileSync(join(componentRoot, relativePath), 'utf8');

function latestFunctionBody(name) {
  const marker = `CREATE OR REPLACE FUNCTION public.${name}`;
  const start = sql.lastIndexOf(marker);
  assert.notEqual(start, -1, `missing function ${name}`);
  const end = sql.indexOf('$$;', start);
  assert.notEqual(end, -1, `unterminated function ${name}`);
  return sql.slice(start, end);
}

test('all Phase 2 tenant tables explicitly enable and force RLS', () => {
  for (const table of phase2Tables) {
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${table} ENABLE ROW LEVEL SECURITY`, 'i'));
    assert.match(sql, new RegExp(`ALTER TABLE public\\.${table} FORCE ROW LEVEL SECURITY`, 'i'));
  }
});

test('payout idempotency and privileged writes remain default-deny', () => {
  assert.doesNotMatch(sql, /GRANT\s+(?:SELECT|INSERT|UPDATE|DELETE|ALL)[^;]*payout_idempotency_keys[^;]*TO\s+(?:anon|authenticated)/i);
  const hardening = readFileSync(join(migrationDirectory, '20260722000021_phase2_holistic_security_hardening.sql'), 'utf8');
  assert.match(hardening, /REVOKE INSERT, UPDATE ON TABLE public\.government_submission_jobs FROM authenticated/i);
  assert.match(hardening, /REVOKE INSERT ON TABLE public\.document_integrity_anchors FROM authenticated/i);
  assert.match(hardening, /WITH CHECK \(false\)/i);
});

test('no raw biometric-media column exists in the migration chain', () => {
  assert.doesNotMatch(
    sqlWithoutComments,
    /\b(?:ktp_(?:image|photo|crop)|selfie|liveness_(?:image|video|media)|biometric_(?:template|embedding)|face_embedding|voiceprint|fingerprint_blob|raw_provider_payload)\b\s+(?:bytea|text|jsonb|varchar)/i,
  );
  assert.doesNotMatch(sqlWithoutComments, /\bBYTEA\b/i);
});

test('all financial mutexes lock rows before state or balance mutation', () => {
  const book = latestFunctionBody('fn_book_consultation_slot_mutex');
  assert.ok(book.indexOf('FOR UPDATE OF slot') < book.indexOf('UPDATE public.consultation_slots'));
  assert.ok(book.indexOf('FOR UPDATE;') < book.indexOf('UPDATE public.wallet_balances'));

  const release = latestFunctionBody('fn_release_escrow_to_advocate_mutex');
  assert.ok(release.indexOf('WHERE escrow.escrow_id = p_escrow_id') < release.indexOf('UPDATE public.escrow_transactions'));
  assert.ok(release.indexOf('ORDER BY wallet.wallet_id') < release.indexOf('SET balance_held_idr'));
  assert.ok(release.indexOf('FOR UPDATE;') < release.indexOf('SET balance_held_idr'));

  const webhook = latestFunctionBody('fn_webhook_settle_escrow_mutex');
  assert.ok(webhook.indexOf('provider_event_id = p_provider_event_id\n    FOR UPDATE') < webhook.indexOf('FOR UPDATE OF escrow'));
  assert.ok(webhook.indexOf('FOR UPDATE OF escrow') < webhook.indexOf('UPDATE public.escrow_transactions'));
});

test('signing and notarial integrity anchors require lowercase SHA-256 and tamper guards', () => {
  assert.match(sql, /chk_signing_document_digest CHECK \(document_sha256_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/i);
  assert.match(sql, /chk_integrity_digest CHECK \(sha256_document_hash ~ '\^\[0-9a-f\]\{64\}\$'\)/i);
  assert.match(sql, /ENABLE ALWAYS TRIGGER trg_worm_document_integrity_anchors/i);
  assert.match(sql, /COMPLETED_ENVELOPE_PSRE_ANCHOR_REQUIRED/i);
  assert.match(sql, /INTEGRITY_ANCHOR_DIGEST_MISMATCH/i);
});

test('public verifier computes real file SHA-256 and exposes only the allow-list', () => {
  const hook = readFileSync(join(root, 'justifiqa-frontend', 'src', 'hooks', 'usePublicVerifier.ts'), 'utf8');
  assert.match(hook, /crypto\.subtle\.digest\('SHA-256', await file\.arrayBuffer\(\)\)/);
  assert.match(hook, /supabase\.rpc\('fn_verify_public_legal_document'/);

  const verifier = latestFunctionBody('fn_verify_public_legal_document');
  for (const field of ['verification_id', 'digest_match', 'document_type', 'document_title', 'finalized_at',
    'signature_provider_status', 'emeterai_serial', 'emeterai_status', 'warning']) {
    assert.match(verifier, new RegExp(`\\b${field}\\b`));
  }
  assert.doesNotMatch(verifier.slice(0, verifier.indexOf('AS $$')), /\b(?:nik|email|phone|storage_path|case_id|user_id|biometric|beneficial_owner)\b/i);
});

test('all campaign components remain below 100 physical lines', () => {
  for (const relativePath of campaignComponents) {
    const lineCount = componentSource(relativePath).split(/\r?\n/).length;
    assert.ok(lineCount < 100, `${relativePath} has ${lineCount} lines`);
  }
});

test('clean campaign components contain no inline style, arbitrary utility, or hardcoded palette', () => {
  const hardcodedPalette = /(?:bg|text|border|from|to|via|ring)-(?:amber|blue|indigo|emerald|green|red|orange|slate|gray|black|white)(?:-|\/|\b)/;
  for (const relativePath of campaignComponents) {
    const source = componentSource(relativePath);
    assert.doesNotMatch(source, /\bstyle\s*=/, relativePath);
    for (const match of source.matchAll(/className=(?:"([^"]*)"|\{`([^`]*)`\})/g)) {
      const classValue = match[1] ?? match[2] ?? '';
      assert.doesNotMatch(classValue, /\[[^\]]+\]/, `${relativePath}: ${classValue}`);
      assert.doesNotMatch(classValue, hardcodedPalette, `${relativePath}: ${classValue}`);
    }
  }
});

test('custom campaign CSS classes exist in index.css', () => {
  const css = readFileSync(join(root, 'justifiqa-frontend', 'src', 'index.css'), 'utf8');
  const customClasses = [
    'client-modal-overlay', 'client-modal-shell', 'client-modal-header', 'client-modal-body-scroll',
    'document-drafting-overlay', 'document-drafting-shell', 'document-drafting-header', 'document-drafting-icon',
    'document-draft-preview-scroll',
    'client-summary-row',
    'client-payment-panel', 'client-copy-action', 'client-primary-action', 'client-secondary-action',
    'client-tab-btn', 'consultation-card-shell', 'deliverable-vault-shell', 'deliverable-heading',
    'consultation-card-content', 'deliverable-meta', 'deliverable-legal-badge', 'deliverable-preview',
    'consultation-action', 'consultation-send-action', 'consultation-card-footer', 'deliverable-actions',
    'consultation-success-action', 'consultation-warning-action', 'client-payment-method',
  ];
  for (const className of customClasses) {
    assert.match(css, new RegExp(`\\.${className}(?:[\\s,{:.]|$)`), className);
  }
});

test('generated database types contain every Phase 2 table and new anchor binding', () => {
  const types = readFileSync(join(root, 'justifiqa-frontend', 'src', 'types', 'database.types.ts'), 'utf8');
  for (const table of [...phase2Tables, 'document_integrity_anchors']) {
    assert.match(types, new RegExp(`^ {6}${table}: \\{`, 'm'));
  }
  assert.match(types, /public_verification_token: string/);
  assert.match(types, /signing_envelope_id: string \| null/);
  assert.match(types, /foreignKeyName: "fk_document_integrity_anchor_envelope"/);
});
