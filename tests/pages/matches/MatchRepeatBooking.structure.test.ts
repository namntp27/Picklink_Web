import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Controllers/Matches/MatchController.Open.cs', import.meta.url), 'utf8');
const matchOpenServiceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/Implementations/MatchService.Open.cs', import.meta.url), 'utf8');
const matchReviewServiceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/Implementations/MatchService.Reviews.cs', import.meta.url), 'utf8');
const matchServiceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/Implementations/MatchService.cs', import.meta.url), 'utf8');

test('a booked match can submit another booking from the frontend', () => {
  const createBookingStart = apiSource.indexOf('export const createMatchBooking');
  const cancelBookingStart = apiSource.indexOf('export const cancelPendingMatchBooking');
  const createBookingSource = apiSource.slice(createBookingStart, cancelBookingStart);

  assert.ok(detailSource.includes('const canBookAnotherRound = Boolean(match?.canBookNextRound);'));
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

test('a completed match reopens for another booking without losing its reviews', () => {
  assert.match(matchOpenServiceSource, /match\.Status is not \("ReadyToBook" or "Booked" or "Completed"\)/);
  assert.match(matchServiceSource, /match\.Status is "ReadyToBook" or "Booked" or "Completed"/);
  assert.match(detailSource, /const hasEndedRound = Boolean\(match\?\.bookingCheckIns\.some/);
  assert.ok(detailSource.includes("{token && isApprovedMember && hasEndedRound && ("));
  assert.ok(detailSource.includes('Trận đã hoàn thành.'));
});

test('the next round stays locked only until the booked round is played out', () => {
  const gateStart = matchOpenServiceSource.indexOf('EvaluateNextRoundGateAsync(');
  const gateEnd = matchOpenServiceSource.indexOf(' CreateMatchBooking(', gateStart);
  const gateSource = matchOpenServiceSource.slice(gateStart, gateEnd);

  assert.ok(gateStart >= 0 && gateEnd > gateStart);
  assert.match(gateSource, /booking\.EndTime > localNow/);
  assert.match(gateSource, /Chỉ được đặt lượt tiếp theo sau khi lượt đã đặt chơi xong\./);
  assert.match(matchOpenServiceSource, /if \(!nextRoundGate\.CanBook\)\s*\n\s*return Conflict\(new \{ message = nextRoundGate\.Reason \}\);/);

  // Rating is encouraged but never blocks the next booking.
  assert.doesNotMatch(gateSource, /MatchPlayerReviews|RatingHistories/);

  assert.ok(detailSource.includes("const nextRoundBlockReason = match?.nextRoundBlockReason ?? '';"));
  assert.ok(detailSource.includes('<strong>Chưa thể đặt lượt tiếp theo.</strong> {nextRoundBlockReason}'));
  assert.ok(detailSource.includes('const closePostMatchReviews = () => {'));
  assert.ok(apiSource.includes('canBookNextRound?: boolean;'));
  assert.ok(apiSource.includes('nextRoundBlockReason?: string | null;'));
});

test('rating a room needs a finished round and a check-in, and stays editable', () => {
  const eligibilityStart = matchReviewServiceSource.indexOf(' CheckReviewEligibilityAsync(\n        int matchId');
  const eligibilitySource = matchReviewServiceSource.slice(eligibilityStart);

  assert.ok(eligibilityStart >= 0);
  assert.match(eligibilitySource, /item\.Status == "Confirmed" && item\.EndTime <= localNow/);
  assert.match(eligibilitySource, /Chỉ được đánh giá sau khi lượt chơi đã kết thúc\./);
  assert.match(eligibilitySource, /Chỉ người đã check-in tại sân mới được đánh giá\./);
  assert.match(matchReviewServiceSource, /item\.Status == "Present"/);

  // Editing a score has to rebuild prestige from the stored rows, not fold onto the old average.
  assert.match(matchReviewServiceSource, /UpdateMatchPlayerReview\(/);
  assert.match(matchReviewServiceSource, /excludedReviewId == null \|\| item\.MatchPlayerReviewId != excludedReviewId\.Value/);
  assert.match(matchReviewServiceSource, /GetMatchVenueReviews\(/);
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
  assert.ok(detailSource.includes("['Recruiting', 'ReadyToBook'].includes(match.status)"));
  assert.ok(detailSource.includes('{isApprovedMember && canBookAnotherRound && ('));
  assert.ok(controllerSource.includes('[HttpPost("{matchId:int}/ready")]'));
  assert.ok(controllerSource.includes('_matchService.MarkReadyToBook(matchId, cancellationToken)'));
});
