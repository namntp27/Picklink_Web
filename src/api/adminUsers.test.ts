import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let adminUsers: typeof import('./adminUsers');
let calls: Array<{ url: string; init?: RequestInit }> = [];

beforeEach(async () => {
  const vite = await createServer({
    configFile: false,
    server: { middlewareMode: true },
  });
  adminUsers = await vite.ssrLoadModule('/src/api/adminUsers.ts') as typeof adminUsers;
  await vite.close();

  calls = [];
  global.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify({
      items: [],
      page: 2,
      pageSize: 20,
      totalCount: 0,
      totalPages: 0,
    }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
});

test('listAdminUsers sends admin filters and bearer token', async () => {
  await adminUsers.listAdminUsers('access-token', {
    search: 'An',
    role: 'Player',
    lockedOnly: true,
    page: 2,
    pageSize: 20,
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, '/api/admin/users?search=An&role=Player&lockedOnly=true&page=2&pageSize=20');
  assert.equal((calls[0].init?.headers as Headers).get('Authorization'), 'Bearer access-token');
});

test('lock and unlock user call real admin endpoints', async () => {
  await adminUsers.lockAdminUser(12, 'spam reports', 'access-token');
  await adminUsers.unlockAdminUser(12, 'access-token');

  assert.equal(calls[0].url, '/api/admin/users/12/lock');
  assert.equal(calls[0].init?.method, 'POST');
  assert.equal(calls[0].init?.body, JSON.stringify({ reason: 'spam reports' }));
  assert.equal(calls[1].url, '/api/admin/users/12/unlock');
  assert.equal(calls[1].init?.method, 'POST');
});
