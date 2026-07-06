import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./AdminCourts.tsx', import.meta.url), 'utf8');

test('admin courts loads real venue data and exposes review actions', () => {
  assert.match(source, /listAdminVenues/);
  assert.match(source, /getAdminVenue/);
  assert.match(source, /approveAdminVenue/);
  assert.match(source, /rejectAdminVenue/);
  assert.match(source, /PaginationControls/);
  assert.match(source, /AdminShell/);
});

test('admin courts requires a bounded rejection reason', () => {
  assert.match(source, /minLength=\{3\}/);
  assert.match(source, /maxLength=\{500\}/);
  assert.match(source, /rejectionReason\.trim\(\)\.length < 3/);
});
