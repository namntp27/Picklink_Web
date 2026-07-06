import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let adminBookings: typeof import('../../src/api/adminBookings');
let calls: Array<{ url: string; init?: RequestInit }> = [];

beforeEach(async () => {
  const vite = await createServer({
    configFile: false,
    server: { middlewareMode: true },
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
