import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path: string) => readFileSync(new URL('../../' + path, import.meta.url), 'utf8');
const login = read('src/pages/auth/Login.tsx');
const guards = read('src/auth/ProtectedRoute.tsx');
const playerApp = read('apps/player/src/PlayerApp.tsx');
const ownerApp = read('apps/owner/src/OwnerApp.tsx');
const adminApp = read('apps/admin/src/AdminApp.tsx');

test('each web app accepts only its own account roles', () => {
  assert.match(playerApp, /Login allowedRoles=\{\['player'\]\}/);
  assert.match(ownerApp, /allowedRoles=\{\['owner', 'staff'\]\}/);
  assert.match(adminApp, /allowedRoles=\{\['admin'\]\}/);
  assert.match(guards, /user && \(!allowedRoles \|\| allowedRoles\.includes\(user\.role\)\)/);
});

test('a login for the wrong portal clears the local session', () => {
  assert.match(login, /allowedRoles && !allowedRoles\.includes\(authUser\.role\)/);
  assert.match(login, /logout\(\);/);
  assert.match(login, /không có quyền truy cập/);
  assert.match(ownerApp, /showRegistration=\{false\}/);
  assert.match(adminApp, /showRegistration=\{false\}/);
});
