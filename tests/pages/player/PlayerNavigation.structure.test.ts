import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';

const historyBackSource = readFileSync(new URL('../../../src/components/navigation/HistoryBackLink.tsx', import.meta.url), 'utf8');
const playerBackPages = [
  'bookings/BookingDetail.tsx',
  'tickets/TicketSessionDetail.tsx',
  'tickets/MyTicketDetail.tsx',
  'matches/MatchCheckout.tsx',
  'matches/QueueDetail.tsx',
  'clubs/ClubDetail.tsx',
  'clubs/ClubDashboard.tsx',
  'community/CreatePost.tsx',
  'community/PostDetail.tsx',
  'community/CommunityUI.tsx',
  'reviews/CreateReview.tsx',
];

test('player back links preserve the page that opened the detail', () => {
  assert.ok(historyBackSource.includes("key !== 'default'"));
  assert.ok(historyBackSource.includes('navigate(-1)'));
  for (const page of playerBackPages) {
    const source = readFileSync(new URL(`../../../src/pages/${page}`, import.meta.url), 'utf8');
    assert.ok(source.includes('<HistoryBackLink'));
  }
  const createClub = readFileSync(new URL('../../../src/pages/clubs/CreateClub.tsx', import.meta.url), 'utf8');
  assert.ok(createClub.includes("useHistoryBack('/clubs')"));
  assert.ok(createClub.includes('onClick={goBack}'));
});
