import http from 'node:http';
import { createPaymentWebhookHandler } from '../supabase/functions/payment-webhook/handler.ts';
import { RestError } from '../supabase/functions/_shared/rest.ts';

const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment: ${name}`);
  return value;
};

const restUrl = required('B3B_REST_URL').replace(/\/$/, '');
const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
const port = Number(process.env.B3B_WEBHOOK_PORT ?? '55332');

const callRpc = async (name, parameters) => {
  const response = await fetch(`${restUrl}/rpc/${name}`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${serviceRoleKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(parameters),
  });
  const text = await response.text();
  let value = null;
  try {
    value = text ? JSON.parse(text) : null;
  } catch {
    throw new RestError(response.status, { message: 'Non-JSON REST response' });
  }
  if (!response.ok) throw new RestError(response.status, value);
  return value;
};

const handler = createPaymentWebhookHandler({
  getEnvironment: (name) => process.env[name],
  nowMs: () => Date.now(),
  callRpc,
});

const server = http.createServer(async (incoming, outgoing) => {
  try {
    const chunks = [];
    for await (const chunk of incoming) chunks.push(chunk);
    const body = Buffer.concat(chunks);
    const request = new Request(
      `http://127.0.0.1:${port}${incoming.url ?? '/'}`,
      {
        method: incoming.method,
        headers: incoming.headers,
        body: incoming.method === 'GET' || incoming.method === 'HEAD'
          ? undefined
          : body,
      },
    );
    const response = await handler(request);
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(Buffer.from(await response.arrayBuffer()));
  } catch {
    outgoing.writeHead(500, {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    });
    outgoing.end(JSON.stringify({
      ok: false,
      code: 'LOCAL_SERVER_FAILURE',
      message: 'The local webhook server could not process the request.',
    }));
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(JSON.stringify({ status: 'ready', port }));
});
