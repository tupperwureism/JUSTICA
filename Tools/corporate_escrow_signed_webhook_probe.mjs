import { createHmac } from 'node:crypto';

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment: ${name}`);
  return value;
};

const webhookUrl = required('PAYMENT_WEBHOOK_URL');
const webhookSecret = required('PAYMENT_WEBHOOK_SECRET');
const supabaseUrl = required('SUPABASE_URL').replace(/\/$/, '');
const restUrl = (process.env.SUPABASE_REST_URL ?? `${supabaseUrl}/rest/v1`).replace(/\/$/, '');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const orderId = required('B3B_ORDER_ID').toLowerCase();
const caseId = required('B3B_CASE_ID').toLowerCase();
const escrowId = required('B3B_ESCROW_ID').toLowerCase();
const amountIdr = Number(required('B3B_AMOUNT_IDR'));
const providerEventId = process.env.B3B_PROVIDER_EVENT_ID
  ?? `batch-3b-probe-${Date.now()}`;

if (!Number.isSafeInteger(amountIdr) || amountIdr <= 0) {
  throw new Error('B3B_AMOUNT_IDR must be a positive safe integer');
}

const body = JSON.stringify({
  providerEventId,
  eventType: 'INVOICE_PAID',
  orderId,
  caseId,
  escrowId,
  amountIdr,
  paymentGatewayRef: `CORP-${orderId}`,
});

const signature = (timestamp, rawBody) => createHmac('sha256', webhookSecret)
  .update(`${timestamp}.${rawBody}`, 'utf8')
  .digest('hex');

async function post(rawBody, timestamp, signed = true) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-webhook-timestamp': String(timestamp),
      'x-webhook-signature': signed
        ? signature(timestamp, rawBody)
        : '0'.repeat(64),
    },
    body: rawBody,
  });
  let responseBody = null;
  try {
    responseBody = await response.json();
  } catch {
    throw new Error(`Webhook returned non-JSON HTTP ${response.status}`);
  }
  return { status: response.status, body: responseBody };
}

async function restRows(table, query) {
  const response = await fetch(
    `${restUrl}/${table}?${new URLSearchParams(query)}`,
    {
      headers: {
        apikey: serviceRoleKey,
        authorization: `Bearer ${serviceRoleKey}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Canonical database read failed for ${table}: HTTP ${response.status}`);
  }
  return response.json();
}

async function canonicalState() {
  const [orders, cases, escrows, milestones, events, feeLines] = await Promise.all([
    restRows('service_orders', {
      select: 'order_id,status',
      order_id: `eq.${orderId}`,
    }),
    restRows('corporate_service_cases', {
      select: 'case_id,current_stage',
      case_id: `eq.${caseId}`,
    }),
    restRows('escrow_transactions', {
      select: 'escrow_id,status,funds_locked_at',
      escrow_id: `eq.${escrowId}`,
    }),
    restRows('payment_milestones', {
      select: 'milestone_id,status',
      order_id: `eq.${orderId}`,
      order: 'milestone_id.asc',
    }),
    restRows('provider_webhook_events', {
      select: 'event_id,provider_event_id,processed_status,payload_digest_sha256',
      provider_event_id: `eq.${providerEventId}`,
    }),
    restRows('service_fee_lines', {
      select: 'fee_line_id',
      order_id: `eq.${orderId}`,
      order: 'fee_line_id.asc',
    }),
  ]);
  return {
    order: orders[0],
    corporateCase: cases[0],
    escrow: escrows[0],
    milestones,
    events,
    feeLines,
  };
}

function assertCanonical(state) {
  if (
    state.order?.status !== 'ACTIVE'
    || state.corporateCase?.current_stage !== 'ESCROW_LOCKED'
    || state.escrow?.status !== 'HELD_IN_ESCROW'
    || !state.escrow?.funds_locked_at
    || !state.milestones.length
    || state.milestones.some(({ status }) => status !== 'FUNDED')
    || state.events.length !== 1
    || state.events[0]?.processed_status !== 'PROCESSED'
  ) {
    throw new Error('Webhook response was not followed by complete canonical database state');
  }
}

const before = await canonicalState();
if (
  before.events.length !== 0
  || before.order?.status !== 'PAYMENT_PENDING'
  || before.corporateCase?.current_stage !== 'DRAFT'
  || before.escrow?.status !== 'PENDING_PAYMENT'
  || !before.milestones.length
  || before.milestones.some(({ status }) => status !== 'PENDING')
) {
  throw new Error('Disposable fixture is not in the required pre-settlement state');
}
const milestoneIdsBefore = before.milestones.map(({ milestone_id }) => milestone_id);
const feeLineIdsBefore = before.feeLines.map(({ fee_line_id }) => fee_line_id);

const now = Math.floor(Date.now() / 1000);
const concurrent = await Promise.all([
  post(body, now),
  post(body, now),
]);
if (concurrent.some(({ status, body: responseBody }) => (
  status !== 200
  || responseBody?.ok !== true
  || responseBody?.status !== 'HELD_IN_ESCROW'
))) {
  throw new Error(`Concurrent signed callbacks failed: HTTP ${concurrent.map(({ status }) => status).join(',')}`);
}
const replayDistribution = concurrent
  .map(({ body: responseBody }) => responseBody?.replayed)
  .sort();
if (
  JSON.stringify(replayDistribution) !== JSON.stringify([false, true])
  || concurrent[0].body?.eventId !== concurrent[1].body?.eventId
) {
  throw new Error('Concurrent callback initial/replay distribution is not canonical');
}

const afterConcurrent = await canonicalState();
assertCanonical(afterConcurrent);
if (
  JSON.stringify(afterConcurrent.milestones.map(({ milestone_id }) => milestone_id))
    !== JSON.stringify(milestoneIdsBefore)
  || JSON.stringify(afterConcurrent.feeLines.map(({ fee_line_id }) => fee_line_id))
    !== JSON.stringify(feeLineIdsBefore)
) {
  throw new Error('Concurrent callback created duplicate financial rows');
}

const sequentialReplay = await post(body, now);
if (
  sequentialReplay.status !== 200
  || sequentialReplay.body?.ok !== true
  || sequentialReplay.body?.replayed !== true
  || sequentialReplay.body?.eventId !== concurrent[0].body?.eventId
) {
  throw new Error(`Identical replay failed: HTTP ${sequentialReplay.status}`);
}
assertCanonical(await canonicalState());

const mutatedBody = JSON.stringify({
  ...JSON.parse(body),
  amountIdr: amountIdr + 1,
});
const conflict = await post(mutatedBody, now);
if (conflict.status !== 409 || conflict.body?.code !== 'IDEMPOTENCY_CONFLICT') {
  throw new Error(`Mutated replay was not rejected as conflict: HTTP ${conflict.status}`);
}
assertCanonical(await canonicalState());

const invalidSignature = await post(body, now, false);
if (
  invalidSignature.status !== 401
  || invalidSignature.body?.code !== 'INVALID_SIGNATURE'
) {
  throw new Error(`Invalid signature was not rejected: HTTP ${invalidSignature.status}`);
}

const stale = await post(body, now - 301);
if (stale.status !== 401 || stale.body?.code !== 'INVALID_SIGNATURE') {
  throw new Error(`Stale signature was not rejected: HTTP ${stale.status}`);
}
const finalState = await canonicalState();
assertCanonical(finalState);

console.log(JSON.stringify({
  status: 'assertions-complete',
  concurrentHttpStatuses: concurrent.map(({ status }) => status),
  replayDistribution,
  eventIds: concurrent.map(({ body: responseBody }) => responseBody.eventId),
  sequentialReplayHttpStatus: sequentialReplay.status,
  conflictHttpStatus: conflict.status,
  invalidSignatureHttpStatus: invalidSignature.status,
  staleSignatureHttpStatus: stale.status,
  providerEventRowCount: finalState.events.length,
  milestoneRowCount: finalState.milestones.length,
  feeLineRowCount: finalState.feeLines.length,
  orderStatus: finalState.order.status,
  caseStage: finalState.corporateCase.current_stage,
  escrowStatus: finalState.escrow.status,
  milestoneStatuses: finalState.milestones.map(({ status }) => status),
  providerEventStatus: finalState.events[0].processed_status,
}));
