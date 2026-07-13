import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const checkout = readFileSync(new URL('../../../src/pages/courts/Checkout.tsx', import.meta.url), 'utf8');
const groupedCheckout = readFileSync(new URL('../../../src/pages/courts/GroupedCheckout.tsx', import.meta.url), 'utf8');
const ownerPayments = readFileSync(new URL('../../../src/pages/owner/OwnerPayments.tsx', import.meta.url), 'utf8');
const ownerBookings = readFileSync(new URL('../../../src/pages/owner/OwnerBookings.tsx', import.meta.url), 'utf8');
const ownerTransactionModal = readFileSync(new URL('../../../src/pages/owner/components/OwnerTransactionReviewModal.tsx', import.meta.url), 'utf8');
const ownerMatchTransactionModal = readFileSync(new URL('../../../src/pages/owner/components/OwnerMatchTransactionReviewModal.tsx', import.meta.url), 'utf8');

test('checkout payment countdown only refreshes from payment realtime events', () => {
  assert.match(checkout, /usePaymentRealtime\(\(event\) => \{/);
  assert.match(checkout, /event\.bookingId === bookingId/);
  assert.match(checkout, /getPlayerBookingPayment\(token, bookingId\)/);
  assert.doesNotMatch(checkout, /\.catch\(\(\) => loadBooking\(true\)\)/);
  assert.doesNotMatch(checkout, /useScheduleRealtime/);
});

test('checkout pauses its countdown while a receipt is awaiting owner review', () => {
  assert.match(checkout, /const isHoldCountdownActive = booking\?\.status === 'Holding' && booking\.paymentStatus === 'Pending';/);
  assert.match(checkout, /if \(!isHoldCountdownActive\) return;/);
  assert.match(checkout, /\{isHoldCountdownActive \? countdown : '--:--'\}/);
});

test('owner payment queue avoids schedule reloads while waiting for submitted receipts', () => {
  assert.match(ownerPayments, /usePaymentRealtime\(\(event\) => \{/);
  assert.match(ownerPayments, /getOperatorPayment\(token, event\.paymentId\)/);
  assert.doesNotMatch(ownerPayments, /useScheduleRealtime/);
});


test('payment actions update immediately without waiting for follow-up reads', () => {
  assert.match(groupedCheckout, /const result = await submitBookingHoldingGroupTransfer\(token, paymentGroupId, receipt\);/);
  assert.match(groupedCheckout, /paymentStatus: result\.payments\.find\(\(payment\) => payment\.bookingId === item\.bookingId\)\?\.paymentStatus \?\? item\.paymentStatus/);
  assert.doesNotMatch(groupedCheckout, /await loadGroup\(true\);/);
  assert.doesNotMatch(ownerPayments, /await load\(\);/);
  assert.doesNotMatch(ownerTransactionModal, /await onUpdated\(\);/);
  assert.doesNotMatch(ownerMatchTransactionModal, /await Promise\.all\(\[load\(true\), onUpdated\(\)\]\);/);
});

test('owner booking receipts patch one payment instead of refetching the full page', () => {
  assert.match(ownerTransactionModal, /const updatedPayment = await approveOperatorPayment/);
  assert.match(ownerTransactionModal, /void onUpdated\(updatedPayment\);/);
  assert.match(ownerTransactionModal, /event\.paymentId === paymentId && !isBusy/);
  assert.match(ownerTransactionModal, /paymentSlots\.map/);
  assert.match(ownerTransactionModal, /paymentHistoryReasons/);
  assert.match(ownerBookings, /paymentStatus: normalizePaymentStatus\(event\.paymentStatus\)/);
  assert.doesNotMatch(ownerBookings, /getOperatorPayment\(token, event\.paymentId\)/);
  assert.match(ownerBookings, /applyPaymentUpdate\(payment\);/);
  assert.doesNotMatch(ownerBookings, /return load\(false\);/);
});
