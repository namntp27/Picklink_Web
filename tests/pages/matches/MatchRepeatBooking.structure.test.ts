import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Controllers/Matches/MatchController.Open.cs', import.meta.url), 'utf8');

test('a booked match can submit another booking from the frontend', () => {
  const createBookingStart = apiSource.indexOf('export const createMatchBooking');
  const cancelBookingStart = apiSource.indexOf('export const cancelPendingMatchBooking');
  const createBookingSource = apiSource.slice(createBookingStart, cancelBookingStart);

  assert.ok(detailSource.includes("const canBookAnotherRound = match?.status === 'ReadyToBook' || match?.status === 'Booked';"));
  assert.ok(detailSource.includes("{isApprovedMember && canBookAnotherRound && ("));
  assert.ok(detailSource.includes('Booking đã thanh toán thành công.'));
  assert.ok(createBookingStart >= 0 && cancelBookingStart > createBookingStart);
  assert.ok(createBookingSource.includes('/api/matches/${matchId}/booking'));
  assert.ok(createBookingSource.includes("method: 'POST'"));
  assert.ok(createBookingSource.includes('body: JSON.stringify(input)'));
  assert.ok(controllerSource.includes('[HttpPost("{matchId:int}/booking")]'));
  assert.ok(controllerSource.includes('_matchService.CreateMatchBooking(matchId, request, cancellationToken)'));
});
