import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let client: typeof import('../../src/api/client');

const makeMojibake = (value: string) => new TextDecoder('windows-1252').decode(new TextEncoder().encode(value));

beforeEach(async () => {
  const vite = await createServer({
    appType: 'custom',
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, ws: false, middlewareMode: true },
  });
  client = await vite.ssrLoadModule('/src/api/client.ts') as typeof client;
  await vite.close();
});

test('apiRequest repairs mojibake strings in nested JSON responses', async () => {
  const original = 'Người chơi xác nhận đã chuyển khoản';
  global.fetch = (async () => new Response(JSON.stringify({
    title: makeMojibake(original),
    history: [
      { reason: makeMojibake(makeMojibake(original)) },
      { reason: 'sai tiền', amount: 120000 },
    ],
  }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })) as typeof fetch;

  const response = await client.apiRequest<{
    title: string;
    history: Array<{ reason: string; amount?: number }>;
  }>('/api/example');

  assert.equal(response.title, original);
  assert.equal(response.history[0].reason, original);
  assert.equal(response.history[1].reason, 'sai tiền');
  assert.equal(response.history[1].amount, 120000);
});
test('apiRequest applies a shared timeout signal', async () => {
  let requestSignal: AbortSignal | null | undefined;
  global.fetch = (async (_input, init) => {
    requestSignal = init?.signal;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  await client.apiRequest('/api/example');

  assert.ok(requestSignal instanceof AbortSignal);
});