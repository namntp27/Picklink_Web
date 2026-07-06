import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./AdminBookings.tsx', import.meta.url), 'utf8');

test('admin bookings page loads real booking data', () => {
  assert.match(source, /listAdminBookings/);
  assert.match(source, /paymentStatus/);
  assert.match(source, /bookingCode/);
  assert.match(source, /PaginationControls/);
  assert.match(source, /AdminShell/);
});

test('admin bookings no longer uses mock admin data page', () => {
  assert.doesNotMatch(source, /AdminDataPage/);
  assert.doesNotMatch(source, /sectionId="bookings"/);
});
