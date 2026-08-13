import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { createPaymentWebhookHandler } from '../supabase/functions/payment-webhook/handler.ts';
import { RestError } from '../supabase/functions/_shared/rest.ts';

const required = (environment, name) => {
  const value = environment[name];
  if (!value) throw new Error(`Missing required environment: ${name}`);
  return value;
};

export function createPostgrestRpcCaller({
  restUrl,
  serviceRoleKey,
  fetchImpl = fetch,
}) {
  if (!restUrl || !serviceRoleKey) {
    throw new Error('PostgREST RPC configuration is unavailable');
  }
  const baseUrl = restUrl.replace(/\/$/, '');
  return async (name, parameters) => {
    const response = await fetchImpl(`${baseUrl}/rpc/${name}`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${serviceRoleKey}`,
        apikey: serviceRoleKey,
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
}

export function createLocalWebhookServer({
  port,
  environment = process.env,
  callRpc,
}) {
  const handler = createPaymentWebhookHandler({
    getEnvironment: (name) => environment[name],
    nowMs: () => Date.now(),
    callRpc,
  });

  return http.createServer(async (incoming, outgoing) => {
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
}

export function startLocalWebhookServerFromEnvironment(
  environment = process.env,
) {
  const restUrl = required(environment, 'B3B_REST_URL');
  const serviceRoleKey = required(environment, 'SUPABASE_SERVICE_ROLE_KEY');
  const port = Number(environment.B3B_WEBHOOK_PORT ?? '55332');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('B3B_WEBHOOK_PORT must be an integer from 1 through 65535');
  }
  const callRpc = createPostgrestRpcCaller({ restUrl, serviceRoleKey });
  const server = createLocalWebhookServer({ port, environment, callRpc });
  server.listen(port, '127.0.0.1', () => {
    console.log(JSON.stringify({ status: 'ready', port }));
  });
  return server;
}

const invokedPath = process.argv[1];
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) {
  startLocalWebhookServerFromEnvironment();
}
