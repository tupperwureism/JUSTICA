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
const providerName = required('PAYMENT_PROVIDER_NAME');
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
  const [orders, cases, escrows, milestones, events] = await Promise.all([
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
    }),
    restRows('provider_webhook_events', {
      select: 'event_id,provider_event_id,processed_status,payload_digest_sha256',
      provider_event_id: `eq.${providerEventId}`,
    }),
  ]);
  return {
    order: orders[0],
    corporateCase: cases[0],
    escrow: escrows[0],
    milestones,
    event: events[0],
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
    || state.event?.processed_status !== 'PROCESSED'
  ) {
    throw new Error('Webhook response was not followed by complete canonical database state');
  }
}

const now = Math.floor(Date.now() / 1000);
const valid = await post(body, now);
if (
  valid.status !== 200
  || valid.body?.ok !== true
  || valid.body?.replayed !== false
  || valid.body?.status !== 'HELD_IN_ESCROW'
) {
  throw new Error(`Valid signed callback failed safely: HTTP ${valid.status}`);
}
const afterValid = await canonicalState();
assertCanonical(afterValid);

const replay = await post(body, now);
if (
  replay.status !== 200
  || replay.body?.ok !== true
  || replay.body?.replayed !== true
  || replay.body?.eventId !== valid.body?.eventId
) {
  throw new Error(`Identical replay failed: HTTP ${replay.status}`);
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
assertCanonical(await canonicalState());

console.log(JSON.stringify({
  status: 'assertions-complete',
  validHttpStatus: valid.status,
  replayHttpStatus: replay.status,
  conflictHttpStatus: conflict.status,
  invalidSignatureHttpStatus: invalidSignature.status,
  staleSignatureHttpStatus: stale.status,
  orderStatus: afterValid.order.status,
  caseStage: afterValid.corporateCase.current_stage,
  escrowStatus: afterValid.escrow.status,
  milestoneStatuses: afterValid.milestones.map(({ status }) => status),
  providerEventStatus: afterValid.event.processed_status,
}));
