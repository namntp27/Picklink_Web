import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./Notifications.tsx', import.meta.url), 'utf8');

test('notifications page uses real notification API and realtime updates', () => {
  assert.match(source, /listNotifications/);
  assert.match(source, /getUnreadNotificationCount/);
  assert.match(source, /markNotificationAsRead/);
  assert.match(source, /markAllNotificationsAsRead/);
  assert.match(source, /deleteNotification/);
  assert.match(source, /deleteReadNotifications/);
  assert.match(source, /useNotificationRealtime/);
  assert.match(source, /PaginationControls/);
});

test('notifications page no longer ships mock data, preferences, or tournament notification filters', () => {
  assert.doesNotMatch(source, /initialNotifications/);
  assert.doesNotMatch(source, /initialPreferences/);
  assert.doesNotMatch(source, /NotificationPreference/);
  assert.doesNotMatch(source, /tournament/);
  assert.doesNotMatch(source, /Trophy/);
});
