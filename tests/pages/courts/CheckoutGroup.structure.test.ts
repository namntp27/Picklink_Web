import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const checkoutSource = readFileSync(new URL('../../../src/pages/courts/Checkout.tsx', import.meta.url), 'utf8');

test('court checkout is not mistaken for match checkout when matchId is absent', () => {
  assert.match(checkoutSource, /matchId !== null/);
  assert.match(checkoutSource, /Number\(matchId\) > 0/);
  assert.doesNotMatch(checkoutSource, /Number\.isInteger\(Number\(params\.get\('matchId'\)\)\)/);
});

test('checkout loads and submits one booking', () => {
  assert.match(checkoutSource, /params\.get\('bookingId'\)/);
  assert.match(checkoutSource, /getBookingHolding/);
  assert.match(checkoutSource, /submitBankTransfer/);
  assert.doesNotMatch(checkoutSource, /paymentGroupId/);
});

test('checkout summarizes selected child-court slots instead of the parent booking span', () => {
  assert.match(checkoutSource, /buildSlotSummaries/);
  assert.match(checkoutSource, /booking\.slots\.length/);
  assert.match(checkoutSource, /slotSummaries\.map/);
  assert.match(checkoutSource, /dateText\(slot\.startTime\)/);
  assert.doesNotMatch(checkoutSource, /timeText\(booking\.startTime\)} - \{timeText\(booking\.endTime\)/);
});

test('checkout renders an owner-rejected receipt as a red alert', () => {
  assert.match(checkoutSource, /transfer\?\.rejectionReason && status === 'Pending'/);
  assert.match(checkoutSource, /border-red-300 bg-red-50/);
  assert.match(checkoutSource, /text-red-700" role="alert"/);
});
