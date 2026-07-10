import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const checkout = readFileSync(new URL('../../../src/pages/courts/Checkout.tsx', import.meta.url), 'utf8');
const ownerPayments = readFileSync(new URL('../../../src/pages/owner/OwnerPayments.tsx', import.meta.url), 'utf8');

test('checkout payment countdown only refreshes from payment realtime events', () => {
  assert.match(checkout, /usePaymentRealtime\(\(event\) => \{/);
  assert.match(checkout, /event\.bookingId === bookingId/);
  assert.doesNotMatch(checkout, /useScheduleRealtime/);
});

test('owner payment queue avoids schedule reloads while waiting for submitted receipts', () => {
  assert.match(ownerPayments, /usePaymentRealtime\(\(event\) => \{/);
  assert.match(ownerPayments, /getOperatorPayment\(token, event\.paymentId\)/);
  assert.doesNotMatch(ownerPayments, /useScheduleRealtime/);
});
