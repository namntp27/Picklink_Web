import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const ownerBookingsSource = readFileSync(
  new URL('./OwnerBookings.tsx', import.meta.url),
  'utf8',
);

test('owner match bookings use the play date so submitted receipts are visible on the scheduled day', () => {
  assert.match(ownerBookingsSource, /const matchesSelectedDate = booking\.date === selectedDate/);
  assert.doesNotMatch(ownerBookingsSource, /localDateFromTimestamp\(booking\.createdAt\)/);
  assert.match(ownerBookingsSource, /Đơn ghép trận hôm nay/);
  assert.match(ownerBookingsSource, /Đơn ghép trận theo ngày chơi/);
});
