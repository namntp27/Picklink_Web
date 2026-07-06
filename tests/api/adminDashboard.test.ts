import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let adminDashboard: typeof import('../../src/api/adminDashboard');
let calls: Array<{ url: string; init?: RequestInit }> = [];

beforeEach(async () => {
  const vite = await createServer({
    configFile: false,
    server: { middlewareMode: true },
  });
  adminDashboard = await vite.ssrLoadModule('/src/api/adminDashboard.ts') as typeof adminDashboard;
  await vite.close();

  calls = [];
  global.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({
      totalUsers: 10,
      activeVenueCount: 3,
      pendingVenueCount: 2,
      pendingListingPaymentCount: 1,
      listingRevenueThisMonth: 450000,
      todayBookingCount: 4,
      todayBookingRevenue: 800000,
      expiringListingCount: 2,
      expiredListingCount: 1,
      actionItems: [],
      expiringListings: [],
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
});

test('admin dashboard API calls the protected real dashboard endpoint', async () => {
  const response = await adminDashboard.getAdminDashboard('token');

  assert.equal(calls[0].url, '/api/admin/dashboard');
  assert.equal(calls[0].init?.headers instanceof Headers, true);
  assert.equal(response.pendingListingPaymentCount, 1);
  assert.equal(response.listingRevenueThisMonth, 450000);
});
