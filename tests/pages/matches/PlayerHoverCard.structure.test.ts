import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const hoverCardSource = readFileSync(new URL('../../../src/pages/matches/components/PlayerHoverCard.tsx', import.meta.url), 'utf8');
const matchDetailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');

test('other-player avatars load the shared public profile card on hover or focus', () => {
  assert.match(hoverCardSource, /getPublicPlayerProfile\(playerId\)/);
  assert.match(hoverCardSource, /enabled: open/);
  assert.match(hoverCardSource, /onMouseEnter=\{\(\) => setOpen\(true\)\}/);
  assert.match(hoverCardSource, /onFocus=\{\(\) => setOpen\(true\)\}/);
  assert.match(hoverCardSource, /role="tooltip"/);
  assert.match(matchDetailSource, /isCurrentPlayer \? avatar : \(/);
  assert.match(matchDetailSource, /<PlayerHoverCard focusable=\{false\}/);
});
