import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const hoverCardSource = readFileSync(new URL('../../../src/pages/matches/components/PlayerHoverCard.tsx', import.meta.url), 'utf8');
const matchDetailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const postsSource = readFileSync(new URL('../../../src/pages/community/Posts.tsx', import.meta.url), 'utf8');
const clubDetailSource = readFileSync(new URL('../../../src/pages/clubs/ClubDetail.tsx', import.meta.url), 'utf8');
const communityApiSource = readFileSync(new URL('../../../src/api/community.ts', import.meta.url), 'utf8');

test('other-player avatars load the shared public profile card on hover or focus', () => {
  assert.match(hoverCardSource, /getPublicPlayerProfile\(playerId\)/);
  assert.match(hoverCardSource, /enabled: open/);
  assert.match(hoverCardSource, /onMouseEnter=\{show\}/);
  assert.match(hoverCardSource, /onFocus=\{show\}/);
  assert.match(hoverCardSource, /createPortal\(/);
  assert.match(hoverCardSource, /pointer-events-none fixed/);
  assert.match(hoverCardSource, /role="tooltip"/);
  assert.match(matchDetailSource, /isCurrentPlayer \? avatar : \(/);
  assert.match(matchDetailSource, /<PlayerHoverCard focusable=\{false\}/);
});

test('posts and clubs expose the shared hover profile wherever a player is shown', () => {
  assert.match(communityApiSource, /authorPlayerId: number \| null/);
  assert.match(communityApiSource, /playerId: number \| null/);
  assert.match(postsSource, /post\.authorPlayerId/);
  assert.match(postsSource, /comment\.playerId/);
  assert.match(postsSource, /<PlayerHoverCard/);
  assert.match(clubDetailSource, /member\.playerId/);
  assert.match(clubDetailSource, /toDisplayPost\(post\)/);
  assert.match(clubDetailSource, /import \{ PostCard, toDisplayPost/);
  assert.match(clubDetailSource, /club\.ownerPlayerId/);
  assert.match(clubDetailSource, /<ClubPlayerAvatar/);
});
