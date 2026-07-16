import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/bookings/MyBookings.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../../../src/pages/bookings/my-bookings.css', import.meta.url), 'utf8');
const globalCss = readFileSync(new URL('../../../src/index.css', import.meta.url), 'utf8');

test('my bookings page keeps only compact status summary above the list', () => {
  assert.match(source + css, /#081d24/);
  assert.match(source + css, /#e2ff57/);
  assert.match(globalCss, /--color-primary:\s*#081d24/);
  assert.match(globalCss, /--color-primary-container:\s*#e2ff57/);
  assert.match(globalCss, /--color-on-primary-container:\s*#081d24/);
  assert.doesNotMatch(source + css, /#0f2e32/);
  assert.doesNotMatch(source + css, /#143f34/);

  assert.match(source, /data-bookings-summary/);
  assert.match(source, /pt-\[88px\]/);
  assert.match(source, /\u0110\u00e3 thanh to\u00e1n/);
  assert.match(source, /C\u1ea7n x\u1eed l\u00fd/);
  assert.match(source, /C\u00f3 th\u1ec3 check-in/);
  assert.match(source, /min-h-14/);
  assert.match(source, /bg-\[#081d24\]/);
  assert.match(source, /bg-\[#e2ff57\]/);
  assert.match(source, /text-\[#e2ff57\]/);
  assert.match(source, /shadow-\[0_8px_20px_rgba\(25,29,20,0\.05\)\]/);
  assert.match(source, /ring-1 ring-outline-variant\/80/);
  assert.match(source, /lg:grid-cols-\[minmax\(0,1fr\)_260px\]/);
  assert.doesNotMatch(source, /min-h-20/);
  assert.doesNotMatch(source, /bg-\[#e8f8cf\]/);
  assert.doesNotMatch(source, /const bookingQuickActions = \[/);
  assert.doesNotMatch(source, /data-bookings-quick-actions/);
  assert.doesNotMatch(source, /booking-hero-court/);
  assert.doesNotMatch(source, /Booking c\u1ee7a b\u1ea1n\. Tr\u1ea1ng th\u00e1i r\u00f5 r\u00e0ng\./);
  assert.doesNotMatch(css, /width: min\(calc\(100% - 24px\), 1180px\)/);
});


test('confirmed, paid, and checked-in booking statuses are green', () => {
  assert.match(source, /status === 'Confirmed' \|\| status === 'Paid' \|\| status === 'Ready' \|\| status === 'CheckedIn'/);
  assert.match(source, /border-green-200 bg-green-100 text-green-700/);
});


test('paid booking has no cancel action', () => {
  assert.match(source, /const canCancel = booking\.canCancel && booking\.paymentStatus !== 'Paid';/);
});
