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

test('apiRequest serializes duplicate GET generations while unrelated GETs stay parallel', async () => {
  const releases: Array<() => void> = [];
  let fetchCount = 0;
  global.fetch = (async () => {
    fetchCount += 1;
    await new Promise<void>((resolve) => releases.push(resolve));
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  const waitForFetchCount = async (expected: number) => {
    while (fetchCount < expected) await new Promise<void>((resolve) => setImmediate(resolve));
  };

  const first = client.apiRequest('/api/example');
  const sameTick = client.apiRequest('/api/example');
  assert.equal(first, sameTick);
  await waitForFetchCount(1);

  const queued = client.apiRequest('/api/example');
  const duplicateQueued = client.apiRequest('/api/example');
  const independent = client.apiRequest('/api/other');
  assert.notEqual(first, queued);
  assert.equal(queued, duplicateQueued);
  await waitForFetchCount(2);

  releases.splice(0).forEach((release) => release());
  await Promise.all([first, sameTick, independent]);
  await waitForFetchCount(3);
  releases.splice(0).forEach((release) => release());
  await Promise.all([queued, duplicateQueued]);

  const next = client.apiRequest('/api/example');
  await waitForFetchCount(4);
  releases.splice(0).forEach((release) => release());
  await next;
});

test('apiRequest does not share requests across auth sessions or explicit options', async () => {
  let fetchCount = 0;
  global.fetch = (async () => {
    fetchCount += 1;
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;

  await Promise.all([
    client.apiRequest('/api/example'),
    client.apiRequest('/api/example', {}, 'token-a'),
    client.apiRequest('/api/example', {}, 'token-b'),
    client.apiRequest('/api/example', { method: 'POST' }, 'token-a'),
    client.apiRequest('/api/example', { signal: new AbortController().signal }, 'token-a'),
  ]);

  assert.equal(fetchCount, 5);
});
