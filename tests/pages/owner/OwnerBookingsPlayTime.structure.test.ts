import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/owner/OwnerBookings.tsx', import.meta.url), 'utf8');
const adapterSource = readFileSync(new URL('../../../src/pages/owner/ownerBookingAdapter.ts', import.meta.url), 'utf8');
const detailSource = readFileSync(new URL('../../../src/pages/owner/OwnerBookingDetail.tsx', import.meta.url), 'utf8');

test('regular owner bookings filter the selected day by creation date', () => {
  assert.match(source, /const matchesSelectedDate = getLocalDateValue\(new Date\(booking\.createdAt\)\) === selectedDate;/);
  assert.match(source, /formatBookingCreatedTime\(booking\.createdAt\)/);
  assert.match(source, /const \[selectedDate, setSelectedDate\] = useState\(today\);/);
  assert.match(source, /new Date\(right\.createdAt\)\.getTime\(\) - new Date\(left\.createdAt\)\.getTime\(\)/);
});


test('owner bookings patch payment updates without reloading the full page', () => {
  assert.match(source, /usePaymentRealtime\(\(event\) => \{[\s\S]*setBookings\(\(current\)/);
  assert.match(source, /paymentStatus: normalizePaymentStatus\(event\.paymentStatus\)/);
  assert.doesNotMatch(source, /usePaymentRealtime\(\(event\) => \{[\s\S]*scheduleRealtimeReload\(\);[\s\S]*\}\);/);
});

test('owner preloads fresh receipt details as soon as a realtime payment event arrives', () => {
  assert.match(source, /const prefetched = prefetchPayment\(event\.paymentId\)/);
  assert.match(source, /prefetched\?\.promise[\s\S]*applyPaymentUpdate\(payment\)/);
  assert.match(source, /fallbackPayment: booking\.fallbackPayment[\s\S]*\.\.\.payment/);
  assert.match(source, /if \(!event\.action\.startsWith\('Payment'\)\) scheduleRealtimeReload\(\)/);
});

test('owner keeps completed action responses in the receipt cache', () => {
  assert.match(source, /paymentPrefetchCache\.current\.set\(transactionTarget\.paymentId, prefetched\)/);
  assert.match(source, /preloadReceiptImage\(payment\.receiptImageUrl\)/);
});

test('regular owner bookings retain and render every selected child-court slot', () => {
  assert.match(adapterSource, /slots: record\.slots/);
  assert.match(source, /booking\.slots\.map\(\(slot\)/);
});

test('owner booking detail summarizes child-court slots', () => {
  assert.match(detailSource, /const bookingSlots = booking\.slots\.length/);
});

test('owner receipt review falls back to receipt data from the booking list when the detail endpoint is empty', () => {
  assert.match(source, /payment\.paymentId === paymentId \? payment : fallbackPayment/);
  assert.match(source, /receiptImageUrl: record\.receiptImageUrl/);
  assert.match(source, /fallbackPayment,/);
});

test('owner booking tables show price and booking status without payment filters', () => {
  assert.doesNotMatch(source, /\bPaymentFilter\b|\bpaymentFilter\b|matchesPayment/);
  assert.match(source, /bookingStateFilterOptions/);
  assert.doesNotMatch(source, /getPaymentLabel\(booking\.paymentStatus\)/);
  assert.match(source, /getBookingStatusLabel\(booking\)/);
  assert.match(source, />Giá tiền<\/th>/);
  assert.match(source, /formatBookingCurrency\(booking\.totalAmount\)/);
  assert.match(source, /colSpan=\{8\}/);
});
