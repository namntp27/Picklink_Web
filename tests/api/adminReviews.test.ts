import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let adminReviews: typeof import('../../src/api/adminReviews');
let calls: Array<{ url: string; init?: RequestInit }> = [];

beforeEach(async () => {
  const vite = await createServer({
    appType: 'custom',
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { hmr: false, ws: false, middlewareMode: true },
  });
  adminReviews = await vite.ssrLoadModule('/src/api/adminReviews.ts') as typeof adminReviews;
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

test('admin reviews API lists and moderates real reviews', async () => {
  await adminReviews.listAdminReviews('token', {
    search: 'spam',
    moderationStatus: 'Visible',
    targetType: 'Venue',
    page: 2,
    pageSize: 10,
  });
  await adminReviews.moderateAdminReview('token', 7, {
    isHidden: true,
    moderationStatus: 'Hidden',
    moderationNote: 'Spam',
  });

  assert.equal(calls[0].url, '/api/admin/reviews?search=spam&moderationStatus=Visible&targetType=Venue&page=2&pageSize=10');
  assert.equal(calls[1].url, '/api/admin/reviews/7/moderate');
  assert.equal(calls[1].init?.method, 'POST');
});

