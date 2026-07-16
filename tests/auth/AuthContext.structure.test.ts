import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../src/auth/AuthContext.tsx', import.meta.url), 'utf8');

test('auth expires an open session and synchronizes session changes across tabs', () => {
  assert.ok(source.includes('const expiryMs = new Date(session.expiresAt).getTime();'));
  assert.ok(source.includes('Number.isFinite(expiryMs)'));
  assert.ok(source.includes('const remaining = expiryMs - Date.now();'));
  assert.ok(source.includes('window.setTimeout(expireWhenDue'));
  assert.ok(source.includes("window.addEventListener('storage', syncSession)"));
  assert.ok(source.includes('setSession(getStoredSession())'));
  assert.ok(source.includes('[saveSession, session?.token]'));
});