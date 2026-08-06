import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const playerApp = read('apps/player/src/PlayerApp.tsx');
const ownerApp = read('apps/owner/src/OwnerApp.tsx');
const adminApp = read('apps/admin/src/AdminApp.tsx');
const appFrame = read('src/apps/AppFrame.tsx');

test('all web apps lazy-load route pages through the shared app frame', () => {
  for (const source of [playerApp, ownerApp, adminApp]) {
    assert.match(source, /lazyPage/);
    assert.match(source, /<Routes>/);
  }

  assert.match(appFrame, /<Suspense/);
  assert.doesNotMatch(playerApp, /import \{ Home \} from/);
  assert.doesNotMatch(ownerApp, /import \{ OwnerDashboard \} from/);
  assert.doesNotMatch(adminApp, /import \{ AdminDashboard \} from/);
});

test('route-level source dependencies stay inside each web app boundary', () => {
  assert.doesNotMatch(playerApp, /@\/pages\/(admin|owner|staff)\//);
  assert.doesNotMatch(ownerApp, /@\/pages\/(admin|bookings|clubs|community|courts|home|matches)\//);
  assert.doesNotMatch(adminApp, /@\/pages\/(owner|staff|bookings|clubs|community|courts|home|matches)\//);

  assert.match(playerApp, /path="my-bookings"/);
  assert.match(ownerApp, /path="\/owner"/);
  assert.match(ownerApp, /path="\/staff"/);
  assert.match(adminApp, /path="\/admin"/);
  assert.match(playerApp, /path="\/register"/);
  assert.doesNotMatch(ownerApp, /path="\/register"/);
  assert.doesNotMatch(adminApp, /path="\/register"/);
});
