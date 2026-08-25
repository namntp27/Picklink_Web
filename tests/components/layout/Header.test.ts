import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/components/layout/Header.tsx', import.meta.url), 'utf8');

test('header notification badge is loaded from the real notification API', () => {
  // Header shares the badge fetch + realtime subscription with AdminShell/OwnerShell/Notifications
  // through this hook instead of each keeping its own copy — see src/hooks/useUnreadNotificationCount.ts.
  assert.match(source, /useUnreadNotificationCount/);
  assert.match(source, /unreadNotificationCount/);
  assert.doesNotMatch(source, /badge: '3'/);
});

test('player message icon shows the number of unread senders', () => {
  assert.match(source, /useUnreadMessageSenderCount/);
  assert.match(source, /unreadMessageSenderCount/);
  assert.match(source, /item\.path === '\/messages'/);
  assert.match(source, /Math\.min\(unreadMessageSenderCount, 99\)/);
});

test('header always uses the hero dark green treatment on every route', () => {
  assert.doesNotMatch(source, /const isHeroDarkHeader = location\.pathname/);
  assert.match(source, /const headerSurfaceClass = 'border-\[#143f34\] bg-\[#081d24\]\/98/);
  assert.match(source, /const activeHeaderLinkClass = 'bg-\[#e2ff57\] text-\[#102414\]/);
  assert.match(source, /const passiveHeaderLinkClass = 'text-white\/72 hover:-translate-y-px hover:bg-white\/10 hover:text-white'/);
  assert.doesNotMatch(source, /bg-white\/95/);
  assert.doesNotMatch(source, /bg-white\/86/);
});
