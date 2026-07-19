import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mergeAdjacentBookingSlots } from '../../../src/pages/owner/components/OwnerMatchTransactionReviewModal';

const source = readFileSync(new URL('../../../src/pages/owner/components/OwnerMatchTransactionReviewModal.tsx', import.meta.url), 'utf8');

test('owner match receipt review fills the spare column with booking information', () => {
  assert.ok(source.includes('lg:grid-cols-[minmax(0,1fr)_340px]'));
  assert.ok(source.includes("booking: Pick<BookingDetail, 'address' | 'courtName' | 'slots' | 'totalAmount'>"));
  assert.ok(source.includes('payments[0]?.slots?.length'));
  assert.ok(source.includes('Thông tin booking'));
  assert.ok(!source.includes('sm:grid-cols-3'));
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