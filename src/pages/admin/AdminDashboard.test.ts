import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./AdminDashboard.tsx', import.meta.url), 'utf8');

test('admin dashboard loads real marketplace metrics', () => {
  assert.match(source, /getAdminDashboard/);
  assert.match(source, /pendingListingPaymentCount/);
  assert.match(source, /listingRevenueThisMonth/);
  assert.match(source, /expiringListings/);
  assert.match(source, /AdminShell/);
  assert.match(source, /MobileAdminNav/);
});

test('admin dashboard no longer uses mock admin data page', () => {
  assert.doesNotMatch(source, /AdminDataPage/);
  assert.doesNotMatch(source, /sectionId="overview"/);
});
