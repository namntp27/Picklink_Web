import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let adminReports: typeof import('./adminReports');
let calls: Array<{ url: string; init?: RequestInit }> = [];

beforeEach(async () => {
  const vite = await createServer({
    configFile: false,
    server: { middlewareMode: true },
  });
  adminReports = await vite.ssrLoadModule('/src/api/adminReports.ts') as typeof adminReports;
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

test('admin reports API lists and reviews real reports', async () => {
  await adminReports.listAdminReports('token', {
    search: 'spam',
    status: 'Open',
    targetType: 'Venue',
    page: 2,
    pageSize: 10,
  });
  await adminReports.reviewAdminReport('token', 5, {
    status: 'Resolved',
    resolutionNote: 'Đã xử lý',
  });

  assert.equal(calls[0].url, '/api/admin/reports?search=spam&status=Open&targetType=Venue&page=2&pageSize=10');
  assert.equal(calls[1].url, '/api/admin/reports/5/review');
  assert.equal(calls[1].init?.method, 'POST');
});
