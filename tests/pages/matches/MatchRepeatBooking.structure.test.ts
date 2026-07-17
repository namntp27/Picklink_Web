import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/MatchService.Open.cs', import.meta.url), 'utf8');

test('a paid match booking can immediately create the next booking', () => {
  const createBookingStart = serviceSource.indexOf('public async Task<ServiceResult<OpenMatchDetailResponse>> CreateMatchBooking');
  const slotOptionsStart = serviceSource.indexOf('public async Task<ServiceResult<List<MatchSlotOptionResponse>>> GetMatchSlotOptions');
  const createBookingSource = serviceSource.slice(createBookingStart, slotOptionsStart);

  assert.ok(detailSource.includes("const canBookAnotherRound = match?.status === 'ReadyToBook' || match?.status === 'Booked';"));
  assert.ok(detailSource.includes("{isApprovedMember && canBookAnotherRound && ("));
  assert.ok(detailSource.includes('Booking đã thanh toán thành công.'));
  assert.ok(serviceSource.includes('CanCreateBooking(string status) => status is \"ReadyToBook\" or \"Booked\"'));
  assert.ok(createBookingSource.includes('if (!CanCreateBooking(match.Status))'));
  assert.equal(createBookingSource.includes('match.Bookings.Any(booking => !InactiveBookingStatuses.Contains(booking.Status))'), false);
  assert.equal(createBookingSource.includes('excludedMatchId: match.MatchId'), false);
});
