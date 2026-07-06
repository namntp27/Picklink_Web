import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer, type ViteDevServer } from 'vite';

let notificationsApi: typeof import('./notifications');
let vite: ViteDevServer;

before(async () => {
  vite = await createServer({
    appType: 'custom',
    configFile: false,
    optimizeDeps: { noDiscovery: true },
    server: { hmr: { port: 24680 }, middlewareMode: true },
  });
  notificationsApi = await vite.ssrLoadModule('/src/api/notifications.ts') as typeof notificationsApi;
});

after(async () => {
  await vite.close();
});

test('notification list sends filters and pagination to the protected endpoint', async (context) => {
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

  await notificationsApi.listNotifications('access-token', {
    type: 'match',
    unreadOnly: true,
    page: 2,
    pageSize: 20,
  });

  const url = new URL(requestedUrl, 'http://localhost');
  assert.equal(url.pathname, '/api/notifications');
  assert.equal(url.searchParams.get('type'), 'match');
  assert.equal(url.searchParams.get('unreadOnly'), 'true');
  assert.equal(url.searchParams.get('page'), '2');
  assert.equal(url.searchParams.get('pageSize'), '20');
  assert.equal(authorization, 'Bearer access-token');
});

test('notification commands use the backend contract', async (context) => {
  const originalFetch = globalThis.fetch;
  const calls: Array<{ path: string; method: string }> = [];

  globalThis.fetch = (async (input, init) => {
    calls.push({
      path: new URL(String(input), 'http://localhost').pathname,
      method: init?.method ?? 'GET',
    });
    const isUnreadCount = calls.at(-1)?.path.endsWith('/unread-count');
    const isMarkRead = calls.at(-1)?.path.endsWith('/read') && calls.at(-1)?.method === 'PATCH';
    return new Response(
      isUnreadCount
        ? JSON.stringify({ count: 7 })
        : isMarkRead
          ? JSON.stringify({
            notificationId: 12,
            type: 'match',
            title: 'Đã đọc',
            message: 'Đã đọc',
            tone: 'default',
            createdAt: '2026-07-06T00:00:00Z',
            isRead: true,
          })
          : null,
      {
        headers: isUnreadCount || isMarkRead
          ? { 'content-type': 'application/json' }
          : undefined,
        status: isMarkRead ? 200 : isUnreadCount ? 200 : 204,
      },
    );
  }) as typeof fetch;
  context.after(() => {
    globalThis.fetch = originalFetch;
  });

  await notificationsApi.getUnreadNotificationCount('access-token');
  await notificationsApi.markNotificationAsRead('access-token', 12);
  await notificationsApi.markAllNotificationsAsRead('access-token');
  await notificationsApi.deleteNotification('access-token', 12);
  await notificationsApi.deleteReadNotifications('access-token');

  assert.deepEqual(calls, [
    { path: '/api/notifications/unread-count', method: 'GET' },
    { path: '/api/notifications/12/read', method: 'PATCH' },
    { path: '/api/notifications/read-all', method: 'PATCH' },
    { path: '/api/notifications/12', method: 'DELETE' },
    { path: '/api/notifications/read', method: 'DELETE' },
  ]);
});
