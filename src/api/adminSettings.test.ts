import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
import { createServer } from 'vite';

let adminSettings: typeof import('./adminSettings');
let calls: Array<{ url: string; init?: RequestInit }> = [];

beforeEach(async () => {
  const vite = await createServer({
    configFile: false,
    server: { middlewareMode: true },
  });
  adminSettings = await vite.ssrLoadModule('/src/api/adminSettings.ts') as typeof adminSettings;
  await vite.close();

  calls = [];
  global.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  }) as typeof fetch;
});

test('admin settings API reads and updates protected real settings', async () => {
  await adminSettings.getAdminSettings('token');
  await adminSettings.updateAdminSetting('token', 'bookingHoldMinutes', '10');

  assert.equal(calls[0].url, '/api/admin/settings');
  assert.equal(calls[1].url, '/api/admin/settings/bookingHoldMinutes');
  assert.equal(calls[1].init?.method, 'PUT');
  assert.equal(calls[1].init?.body, JSON.stringify({ settingValue: '10' }));
});
