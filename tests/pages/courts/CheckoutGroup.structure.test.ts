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

test('checkout refreshes navigation state so the latest owner bank account is used', () => {
  assert.match(checkoutSource, /const \[booking, setBooking\] = useState<BookingHolding \| null>\(initialBooking\)/);
  assert.match(checkoutSource, /useEffect\(\(\) => \{\s*void loadBooking\(\);\s*\}, \[bookingId, token\]\)/);
  assert.doesNotMatch(checkoutSource, /if \(initialBooking\) return/);
});

test('checkout treats unzoned holding deadlines as Vietnam time', () => {
  assert.match(checkoutSource, /\$\{value\}\+07:00/);
  assert.doesNotMatch(checkoutSource, /\$\{value\}Z/);
});

test('checkout stops showing a countdown after the receipt is submitted', () => {
  assert.match(checkoutSource, /booking\?\.status === 'Holding'[\s\S]*booking\.paymentStatus === 'Pending'[\s\S]*Boolean\(booking\.holdExpiresAt\)/);
  assert.match(checkoutSource, /isWaiting \? 'Đã dừng' : '--:--'/);
  assert.match(checkoutSource, /holdExpiresAt: updatedPayment\.holdExpiresAt/);
});

test('owner review events update checkout immediately while fresh details load in the background', () => {
  assert.match(checkoutSource, /const nextPaymentStatus = event\.paymentStatus/);
  assert.match(checkoutSource, /paymentStatus: nextPaymentStatus/);
  assert.match(checkoutSource, /rejectionReason: event\.action === 'Rejected'/);
  assert.match(checkoutSource, /getPlayerBookingPayment\(token, bookingId\)/);
  assert.match(checkoutSource, /Boolean\(booking\.holdExpiresAt\)/);
});

test('a submitted receipt cancels any stale expiry warning and redirect', () => {
  assert.match(checkoutSource, /const isPaymentExpired = !isSubmitting && !isPaymentAwaitingReview/);
  assert.match(checkoutSource, /current === PAYMENT_EXPIRED_MESSAGE \? '' : current/);
  assert.match(checkoutSource, /setError\(''\);\s*setReceipt\(null\)/);
});

test('checkout summarizes selected child-court slots instead of the parent booking span', () => {
  assert.match(checkoutSource, /buildSlotSummaries/);
  assert.match(checkoutSource, /booking\.slots\.length/);
  assert.match(checkoutSource, /slotSummaries\.map/);
  assert.match(checkoutSource, /dateText\(slot\.startTime\)/);
  assert.doesNotMatch(checkoutSource, /timeText\(booking\.startTime\)} - \{timeText\(booking\.endTime\)/);
});

test('checkout keeps a large slot schedule compact and opens details on demand', () => {
  assert.match(checkoutSource, /CHECKOUT_SLOT_DETAIL_THRESHOLD = 3/);
  assert.match(checkoutSource, /hasManySlotSummaries/);
  assert.match(checkoutSource, /Xem chi tiết slot/);
  assert.match(checkoutSource, /showSlotDetails && \(/);
  assert.match(checkoutSource, /checkout-slot-details-title/);
  assert.match(checkoutSource, /max-h-\[min\(65dvh,560px\)\]/);
  assert.match(checkoutSource, /width: 'min\(640px, calc\(100vw - 2rem\)\)'/);
  assert.match(checkoutSource, /setShowSlotDetails\(false\)/);
});

test('checkout renders an owner-rejected receipt as a red alert', () => {
  assert.match(checkoutSource, /transfer\?\.rejectionReason && status === 'Pending'/);
  assert.match(checkoutSource, /border-red-300 bg-red-50/);
  assert.match(checkoutSource, /text-red-700" role="alert"/);
});
