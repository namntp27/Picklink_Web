import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./AdminUsers.tsx', import.meta.url), 'utf8');

test('admin users page loads real user data and account actions', () => {
  assert.match(source, /listAdminUsers/);
  assert.match(source, /lockAdminUser/);
  assert.match(source, /unlockAdminUser/);
  assert.match(source, /PaginationControls/);
  assert.match(source, /AdminShell/);
  assert.match(source, /MobileAdminNav/);
  assert.match(source, /useAuth/);
  assert.match(source, /useToast/);
});

test('admin users page no longer uses mock admin data page', () => {
  assert.doesNotMatch(source, /AdminDataPage/);
  assert.doesNotMatch(source, /sectionId="users"/);
});
