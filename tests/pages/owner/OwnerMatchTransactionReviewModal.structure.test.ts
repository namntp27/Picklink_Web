import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeAdjacentBookingSlots } from '../../../src/pages/owner/components/OwnerMatchTransactionReviewModal';

const source = readFileSync(new URL('../../../src/pages/owner/components/OwnerMatchTransactionReviewModal.tsx', import.meta.url), 'utf8');
const bookingsSource = readFileSync(new URL('../../../src/pages/owner/OwnerBookings.tsx', import.meta.url), 'utf8');
const notificationsSource = readFileSync(new URL('../../../src/pages/notifications/Notifications.tsx', import.meta.url), 'utf8');
const paymentApiSource = readFileSync(new URL('../../../src/api/payment.ts', import.meta.url), 'utf8');

test('owner match receipt review fills the spare column with booking information', () => {
  assert.ok(source.includes('lg:grid-cols-[minmax(0,1fr)_340px]'));
  assert.ok(source.includes("booking: Pick<BookingDetail, 'address' | 'courtName' | 'slots' | 'totalAmount'>"));
  assert.ok(source.includes('payments[0]?.slots?.length'));
  assert.ok(source.includes('Thông tin booking'));
  assert.ok(!source.includes('sm:grid-cols-3'));
});
test('owner match receipt review shows every player phone number', () => {
  assert.ok(source.includes('item.playerPhoneNumber'));
  assert.ok(source.includes("href={'tel:' + item.playerPhoneNumber.replaceAll(' ', '')}"));
  assert.ok(source.includes('Chưa cập nhật SĐT'));
});
test('match refunds stay pending until the actual sender confirms from notifications', () => {
  assert.ok(source.includes('markOperatorMatchRefundSent'));
  assert.ok(source.includes("entry.action === 'OwnerMarkedRefundSent'"));
  assert.ok(bookingsSource.includes('Xử lý hoàn tiền'));
  assert.ok(bookingsSource.includes('Đã hủy · Đã hoàn tiền'));
  assert.ok(notificationsSource.includes('confirmMatchRefundReceived'));
  assert.ok(notificationsSource.includes('Đã nhận được tiền'));
  assert.ok(paymentApiSource.includes('/refund-sent'));
  assert.ok(paymentApiSource.includes('/refund/confirm'));
});
test('adjacent slots merge only within the same court and day', () => {
  const merged = mergeAdjacentBookingSlots([
    { courtId: 1, courtNumber: 1, startTime: '2026-07-19T06:00:00', endTime: '2026-07-19T06:30:00' },
    { courtId: 1, courtNumber: 1, startTime: '2026-07-19T06:30:00', endTime: '2026-07-19T07:00:00' },
    { courtId: 1, courtNumber: 1, startTime: '2026-07-19T07:30:00', endTime: '2026-07-19T08:00:00' },
    { courtId: 2, courtNumber: 2, startTime: '2026-07-19T07:00:00', endTime: '2026-07-19T07:30:00' },
  ]);

  assert.deepEqual(merged.map(({ courtNumber, startTime, endTime }) => ({ courtNumber, startTime, endTime })), [
    { courtNumber: 1, startTime: '2026-07-19T06:00:00', endTime: '2026-07-19T07:00:00' },
    { courtNumber: 1, startTime: '2026-07-19T07:30:00', endTime: '2026-07-19T08:00:00' },
    { courtNumber: 2, startTime: '2026-07-19T07:00:00', endTime: '2026-07-19T07:30:00' },
  ]);
});