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
  assert.ok(detailSource.includes('const createdMatch = await createMatchBooking'));
  assert.ok(detailSource.includes('if (!createdMatch.bookingId)'));
  assert.ok(detailSource.includes('navigate(`/checkout?bookingId=${createdMatch.bookingId}'));
  assert.ok(detailSource.includes("isBusy ? 'Đang tạo booking...'"));
  assert.ok(detailSource.includes("'Tạo booking và chuyển sang thanh toán'"));
  assert.ok(detailSource.includes('className="match-booking-notice" role="status"'));
  assert.ok(detailSource.includes('bookingSubmitError && <div aria-live="assertive" className="match-alert picklink-inline-alert'));
  assert.ok(detailSource.includes("slot.status === 'Holding' && slot.isOwnedByCurrentUser && slot.bookingId"));
  assert.ok(detailSource.includes('holdingCheckoutPath(slot, bookingDate)'));
  assert.ok(detailSource.includes('thuộc phòng #${holding.matchId}, không phải phòng #${matchId}'));
  assert.ok(detailSource.includes("currentMatchHolding ? 'Tiếp tục thanh toán booking đang giữ'"));
  assert.ok(createBookingStart >= 0 && cancelBookingStart > createBookingStart);
  assert.ok(createBookingSource.includes('/api/matches/${matchId}/booking'));
  assert.ok(createBookingSource.includes("method: 'POST'"));
  assert.ok(createBookingSource.includes('body: JSON.stringify(input)'));
  assert.ok(controllerSource.includes('[HttpPost("{matchId:int}/booking")]'));
  assert.ok(controllerSource.includes('_matchService.CreateMatchBooking(matchId, request, cancellationToken)'));
});

test('a full recruiting room can transition to the visible booking form', () => {
  const readyApiStart = apiSource.indexOf('export const markMatchReadyToBook');
  const createBookingStart = apiSource.indexOf('export const createMatchBooking');
  const readyApiSource = apiSource.slice(readyApiStart, createBookingStart);

  assert.ok(readyApiStart >= 0 && createBookingStart > readyApiStart);
  assert.ok(readyApiSource.includes('/api/matches/${matchId}/ready'));
  assert.ok(readyApiSource.includes("method: 'POST'"));
  assert.ok(detailSource.includes("match.status === 'Recruiting' && isFull"));
  assert.ok(detailSource.includes('markMatchReadyToBook(token, matchId)'));
  assert.ok(detailSource.includes("match?.status === 'ReadyToBook'"));
  assert.ok(detailSource.includes('{isApprovedMember && canBookAnotherRound && ('));
  assert.ok(controllerSource.includes('[HttpPost("{matchId:int}/ready")]'));
  assert.ok(controllerSource.includes('_matchService.MarkReadyToBook(matchId, cancellationToken)'));
});
