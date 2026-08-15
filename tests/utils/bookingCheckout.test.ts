import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { AvailabilitySlot } from '../../src/api/booking';
import { holdingCheckoutPath } from '../../src/utils/bookingCheckout';

const holdingSlot = (overrides: Partial<AvailabilitySlot> = {}): AvailabilitySlot => ({
  courtId: 31,
  startTime: '2026-08-17T06:30:00',
  endTime: '2026-08-17T07:00:00',
  status: 'Holding',
  bookingId: 8288,
  isOwnedByCurrentUser: true,
  ...overrides,
});

test('owned match holding resumes checkout for the match that created it', () => {
  assert.equal(
    holdingCheckoutPath(holdingSlot({ matchId: 5066 }), '2026-08-17'),
    '/checkout?bookingId=8288&date=2026-08-17&matchId=5066',
  );
});

test('ordinary court holding resumes the ordinary court checkout', () => {
  assert.equal(
    holdingCheckoutPath(holdingSlot({ matchId: null }), '2026-08-17'),
    '/checkout?bookingId=8288&date=2026-08-17',
  );
});

test('slot without a booking id cannot create a checkout link', () => {
  assert.equal(holdingCheckoutPath(holdingSlot({ bookingId: null }), '2026-08-17'), null);
});
