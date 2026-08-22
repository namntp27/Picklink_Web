import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let adminBookings: typeof import('../../src/api/adminBookings');
let calls: Array<{ url: string; init?: RequestInit }> = [];

beforeEach(async () => {
  const vite = await createServer({
    appType: 'custom',
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, ws: false, middlewareMode: true },
  });
  adminBookings = await vite.ssrLoadModule('/src/api/adminBookings.ts') as typeof adminBookings;
  await vite.close();

  calls = [];
  global.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({
      items: [],
      page: 1,
      pageSize: 10,
      totalCount: 0,
      totalPages: 0,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
});

test('admin bookings API lists real bookings with filters', async () => {
  await adminBookings.listAdminBookings('token', {
    search: 'BK-01',
    status: 'Confirmed',
    paymentStatus: 'Verified',
    page: 2,
    pageSize: 10,
  });

  assert.equal(calls[0].url, '/api/admin/bookings?search=BK-01&status=Confirmed&paymentStatus=Verified&page=2&pageSize=10');
});

test('admin bookings API only records a conclusion for an open refund dispute', async () => {
  await adminBookings.resolveAdminRefundDispute('token', 42, 'Owner cần chuyển lại đúng tài khoản');

  assert.equal(calls[0].url, '/api/admin/bookings/42/refund/dispute/resolve');
  assert.equal(calls[0].init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(calls[0].init?.body)), { resolution: 'Owner cần chuyển lại đúng tài khoản' });
});

