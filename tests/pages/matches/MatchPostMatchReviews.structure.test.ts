import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const panelSource = readFileSync(new URL('../../../src/pages/matches/MatchPostMatchReviewPanel.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const reviewsApiSource = readFileSync(new URL('../../../src/api/reviews.ts', import.meta.url), 'utf8');

test('completed match offers one review button below chat and opens the review modal', () => {
  assert.match(detailSource, /match\.status === 'Completed'/);
  assert.doesNotMatch(detailSource, /match\.status === 'Completed' && \(\s*<MatchPostMatchReviewPanel/);
  assert.match(detailSource, /Chat phòng[\s\S]*Đánh giá người chơi và sân/);
  assert.match(detailSource, /onClick=\{\(\) => setShowPostMatchReviews\(true\)\}/);
  assert.match(detailSource, /<ModalDialog aria-labelledby="post-match-review-title"/);
  assert.match(detailSource, /<MatchPostMatchReviewPanel match=\{match\} token=\{token\}/);
  assert.match(panelSource, /participant\.playerId !== match\.myPlayerId/);
  assert.match(detailSource, /\['Recruiting', 'ReadyToBook'\]\.includes\(match\.status\)/);
});

test('post-match panel loads and submits player and venue reviews', () => {
  assert.match(panelSource, /getMatchReviews\(token, match\.matchId\)/);
  assert.match(panelSource, /reviewPlayer\(token, match\.matchId, playerId/);
  assert.match(panelSource, /getMatchVenueReviews\(token, match\.matchId\)/);
  assert.match(panelSource, /createBookingReview\(token, bookingId/);
  assert.match(panelSource, /reason instanceof ApiError && reason\.status === 409/);
  assert.match(panelSource, /review\.matchPlayerReviewId/);
  assert.match(panelSource, /Backend chưa nạp phiên bản đánh giá mới/);
  assert.match(panelSource, /Đánh giá sân/);
  assert.match(panelSource, /Người chơi cùng trận/);
});

test('every member and venue is rated once, editable afterwards, and only by who checked in', () => {
  // One card per venue, not per booking round.
  assert.match(panelSource, /const byVenue = new Map<number, \{ venueId: number/);
  assert.match(panelSource, /playedVenues\.map\(\(venue\) =>/);
  assert.match(panelSource, /setVenueReviews\(Object\.fromEntries\(bookingReviews\.map\(\(review\) => \[review\.venueId, review\]\)\)\)/);

  // Existing reviews stay editable through the update endpoints, addressed by venue.
  assert.match(panelSource, /updatePlayerReview\(token, match\.matchId, playerId, input\)/);
  assert.match(panelSource, /updateVenueReview\(token, venueId, input\)/);
  assert.match(reviewsApiSource, /\/api\/player-reviews\/venue\/\$\{venueId\}/);
  assert.match(panelSource, /Sửa đánh giá/);
  assert.match(panelSource, /Lưu thay đổi/);
  assert.match(apiSource, /method: 'PUT'/);
  assert.match(reviewsApiSource, /method: 'PUT'/);

  // Check-in is a per-player scan, so absent members see a notice instead of the forms.
  assert.match(panelSource, /participant\.checkInStatus === 'Present'/);
  assert.match(panelSource, /const showForm = hasCheckedIn && \(!existing \|\| isEditing\)/);
  assert.match(panelSource, /Bạn chưa check-in tại sân cho trận này nên chưa thể đánh giá\./);
});

test('post-match review form stays compact on desktop and mobile', () => {
  assert.match(panelSource, /lg:grid-cols-2/);
  assert.match(panelSource, /!h-16 !min-h-16 resize-none/);
  assert.match(panelSource, /!min-h-9/);
});

test('booking round contract includes venue identity for the review card', () => {
  assert.match(apiSource, /venueId: number;/);
  assert.match(apiSource, /venueName: string;/);
});
