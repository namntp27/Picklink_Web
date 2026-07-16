import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/components/layout/Header.tsx', import.meta.url), 'utf8');

test('header notification badge is loaded from the real notification API', () => {
  assert.match(source, /getUnreadNotificationCount/);
  assert.match(source, /useNotificationRealtime/);
  assert.match(source, /unreadNotificationCount/);
  assert.doesNotMatch(source, /badge: '3'/);
});

test('header always uses the hero dark green treatment on every route', () => {
  assert.doesNotMatch(source, /const isHeroDarkHeader = location\.pathname/);
  assert.match(source, /const headerSurfaceClass = 'border-\[#143f34\] bg-\[#081d24\]\/98/);
  assert.match(source, /const activeHeaderLinkClass = 'bg-\[#e2ff57\] text-\[#102414\]/);
  assert.match(source, /const passiveHeaderLinkClass = 'text-white\/72 hover:-translate-y-px hover:bg-white\/10 hover:text-white'/);
  assert.doesNotMatch(source, /bg-white\/95/);
  assert.doesNotMatch(source, /bg-white\/86/);
});
