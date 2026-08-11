import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const panelSource = readFileSync(new URL('../../../src/pages/matches/MatchPostMatchReviewPanel.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');

test('completed match renders the post-match review panel for approved members', () => {
  assert.match(detailSource, /match\.status === 'Completed'/);
  assert.match(detailSource, /<MatchPostMatchReviewPanel match=\{match\} token=\{token\}/);
  assert.match(panelSource, /participant\.playerId !== match\.myPlayerId/);
  assert.match(detailSource, /\['Recruiting', 'ReadyToBook'\]\.includes\(match\.status\)/);
});

test('post-match panel loads and submits player and venue reviews', () => {
  assert.match(panelSource, /getMatchReviews\(token, match\.matchId\)/);
  assert.match(panelSource, /reviewPlayer\(token, match\.matchId, playerId/);
  assert.match(panelSource, /getBookingReview\(token, booking\.bookingId\)/);
  assert.match(panelSource, /createBookingReview\(token, bookingId/);
  assert.match(panelSource, /reason instanceof ApiError && reason\.status === 409/);
  assert.match(panelSource, /const existing = await getBookingReview\(token, bookingId\)/);
  assert.match(panelSource, /review\.bookingId !== bookingId \|\| !review\.venueId/);
  assert.match(panelSource, /review\.matchPlayerReviewId/);
  assert.match(panelSource, /Backend chưa nạp phiên bản đánh giá mới/);
  assert.match(panelSource, /Đánh giá sân/);
  assert.match(panelSource, /Người chơi cùng trận/);
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
