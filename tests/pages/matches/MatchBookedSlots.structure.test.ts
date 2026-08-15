import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const dtoSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/DTOs/MatchRequest.cs', import.meta.url), 'utf8');
const matchServiceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/Implementations/MatchService.cs', import.meta.url), 'utf8');

test('created booking summary renders exact adjacent slot ranges instead of one aggregate date range', () => {
  assert.ok(apiSource.includes('export type MatchBookingSlot'));
  assert.ok(apiSource.includes('bookingSlots: MatchBookingSlot[];'));
  assert.ok(dtoSource.includes('List<MatchBookingSlotResponse> BookingSlots'));
  assert.ok(matchServiceSource.includes('BookingSlots = firstBooking?.Slots'));
  assert.ok(matchServiceSource.includes('CourtNumber = slot.Court.CourtNumber'));
  assert.ok(detailSource.includes('mergeAdjacentMatchBookingSlots'));
  assert.ok(detailSource.includes('const bookedSlotGroups = mergeAdjacentMatchBookingSlots(match.bookingSlots ?? [])'));
  assert.ok(detailSource.includes('bookedSlotGroups.map((slot) =>'));
  assert.ok(detailSource.includes('matchBookingSlotLabel(slot.startTime, slot.endTime)'));
  assert.ok(detailSource.includes('<span>Sân {slot.courtNumber}</span>'));
  assert.ok(detailSource.includes('Thời gian slot đã đặt'));
});
