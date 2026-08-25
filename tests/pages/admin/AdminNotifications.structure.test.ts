import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const read = (path: string) => readFileSync(new URL(`../../../${path}`, import.meta.url), 'utf8');

test('admin notification workspace is routed, prefetched, and uses the shared notification flow', () => {
  const app = read('apps/admin/src/AdminApp.tsx');
  const routePrefetch = read('src/navigation/adminRoutePrefetch.ts');
  const page = read('src/pages/admin/AdminNotifications.tsx');
  const notifications = read('src/pages/notifications/Notifications.tsx');

  assert.match(app, /path="\/admin\/notifications" element=\{<AdminNotifications \/>\}/);
  assert.match(routePrefetch, /'\/admin\/notifications'.*AdminNotifications/);
  assert.match(page, /<AdminShell activeId="notifications">/);
  assert.match(page, /<Notifications workspace="admin" \/>/);
  assert.match(notifications, /admin: \{[\s\S]*?filters: adminFilterOptions/);
});

test('admin shell exposes a realtime unread notification badge', () => {
  const shell = read('src/pages/admin/components/AdminShell.tsx');

  // Shared with Header/OwnerShell/Notifications via useUnreadNotificationCount instead of
  // AdminShell keeping its own fetch + realtime subscription.
  assert.match(shell, /useUnreadNotificationCount/);
  assert.match(shell, /to="\/admin\/notifications"/);
  assert.match(shell, /Math\.min\(unreadNotificationCount, 99\)/);
});
