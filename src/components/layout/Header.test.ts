import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./Header.tsx', import.meta.url), 'utf8');

test('header notification badge is loaded from the real notification API', () => {
  assert.match(source, /getUnreadNotificationCount/);
  assert.match(source, /useNotificationRealtime/);
  assert.match(source, /unreadNotificationCount/);
  assert.doesNotMatch(source, /badge: '3'/);
});
