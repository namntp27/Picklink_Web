import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer, type ViteDevServer } from 'vite';

let adminVenues: typeof import('../../src/api/adminVenues');
let vite: ViteDevServer;

before(async () => {
  vite = await createServer({
    appType: 'custom',
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, ws: false, middlewareMode: true },
  });
  adminVenues = await vite.ssrLoadModule('/src/api/adminVenues.ts') as typeof adminVenues;
});

after(async () => {
  await vite.close();
});

test('admin venue list sends search, status and pagination to the protected endpoint', async (context) => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  let authorization = '';

  globalThis.fetch = (async (input, init) => {
    requestedUrl = String(input);
    authorization = new Headers(init?.headers).get('Authorization') ?? '';
    return new Response(JSON.stringify({
      items: [],
      page: 2,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
    }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  }) as typeof fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  await adminVenues.listAdminVenues('access-token', {
    search: 'Cầu Giấy',
    status: 'Pending',
    page: 2,
    pageSize: 20,
  });

  const url = new URL(requestedUrl, 'http://localhost');
  assert.equal(url.pathname, '/api/admin/venues');
  assert.equal(url.searchParams.get('search'), 'Cầu Giấy');
  assert.equal(url.searchParams.get('status'), 'Pending');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('pageSize'), '20');
  assert.equal(authorization, 'Bearer access-token');
});

test('admin venue rejection posts the mandatory reason', async (context) => {
  const originalFetch = globalThis.fetch;
  let requestedUrl = '';
  let requestMethod = '';
  let requestBody = '';

  globalThis.fetch = (async (input, init) => {
    requestedUrl = String(input);
    requestMethod = init?.method ?? '';
    requestBody = String(init?.body);
    return new Response(JSON.stringify({
      venueId: 12,
      approvalStatus: 'Rejected',
      rejectionReason: 'Ảnh sân chưa đầy đủ.',
    }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  }) as typeof fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  await adminVenues.rejectAdminVenue(
    12,
    'Ảnh sân chưa đầy đủ.',
    'access-token',
  );

  assert.equal(new URL(requestedUrl, 'http://localhost').pathname, '/api/admin/venues/12/reject');
  assert.equal(requestMethod, 'POST');
  assert.deepEqual(JSON.parse(requestBody), { reason: 'Ảnh sân chưa đầy đủ.' });
});

