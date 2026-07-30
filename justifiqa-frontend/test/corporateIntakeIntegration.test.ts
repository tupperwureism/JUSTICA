import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const serviceSource = await readFile(
  new URL('../src/services/phase2IntegrationService.ts', import.meta.url),
  'utf8',
);
const gatewaySource = await readFile(
  new URL('../src/services/phase2SupabaseGateway.ts', import.meta.url),
  'utf8',
);

test('phase2IntegrationService.submitCorporateIntake no longer throws BROWSER_BOUNDARY_UNAVAILABLE for its body', () => {
  const submitMatch = serviceSource.match(/async\s+submitCorporateIntake\([^)]*\)\s*:\s*Promise<[^>]+>\s*\{([\s\S]*?)\n    \},/);
  assert.ok(submitMatch, 'submitCorporateIntake method not found');
  const body = submitMatch[1];
  assert.equal(
    body.includes('BROWSER_BOUNDARY_UNAVAILABLE'),
    false,
    'submitCorporateIntake must not throw BROWSER_BOUNDARY_UNAVAILABLE anymore',
  );
});

test('phase2IntegrationService invokes corporate-intake Edge Function via supabase.functions.invoke', () => {
  assert.match(
    serviceSource,
    /supabase\.functions\.invoke<\w+>\(\s*['"]corporate-intake['"]/,
    'Expected supabase.functions.invoke("corporate-intake") call in service',
  );
});

test('phase2IntegrationService does NOT call supabase.rpc for intake', () => {
  assert.equal(
    /supabase\.rpc\([^)]*intake/i.test(serviceSource),
    false,
    'supabase.rpc(*intake*) call must NOT exist',
  );
});

test('phase2SupabaseGateway does NOT call supabase.rpc for intake', () => {
  assert.equal(
    /supabase\.rpc\([^)]*intake/i.test(gatewaySource),
    false,
    'gateway must not call supabase.rpc for intake',
  );
});

test('toIntakePayload maps effectiveDate -> effectiveFrom and omits identityReference from beneficialOwners', () => {
  assert.match(serviceSource, /effectiveFrom:\s*p\.effectiveDate/);
  assert.match(
    serviceSource,
    /beneficialOwners:\s*draft\.beneficialOwners\.map\([\s\S]*?evidenceReference:\s*o\.evidenceReference/,
  );
});

test('toIntakePayload does NOT include identityReference in beneficialOwners mapper', () => {
  const boMapMatch = serviceSource.match(/beneficialOwners:\s*draft\.beneficialOwners\.map\([\s\S]*?\]\),/);
  assert.ok(boMapMatch, 'beneficialOwners mapper not found');
  assert.equal(
    boMapMatch[1].includes('identityReference'),
    false,
    'identityReference must not be sent to EF in BO mapping',
  );
});

test('acceptedScope is NOT sent to EF (UI gate only)', () => {
  const payloadMatch = serviceSource.match(/function toIntakePayload([\s\S]*?)\nreturn \{/);
  assert.ok(payloadMatch, 'toIntakePayload not found');
  const body = payloadMatch[1];
  assert.equal(
    body.includes('acceptedScope'),
    false,
    'acceptedScope must not appear in toIntakePayload',
  );
});

test('paymentGatewayRef is included in payload', () => {
  assert.match(
    serviceSource,
    /paymentGatewayRef:\s*draft\.paymentGatewayRef\.trim\(\)/,
  );
});
