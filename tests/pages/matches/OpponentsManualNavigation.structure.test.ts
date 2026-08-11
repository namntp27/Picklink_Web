import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(
  new URL('../../../src/pages/matches/Opponents.tsx', import.meta.url),
  'utf8',
);

test('manual and automatic matchmaking both open the queue ticket they just created', () => {
  assert.match(source, /const queue = await joinSoloQueue\(token,/);
  assert.match(source, /navigate\(`\/opponents\/queue\/\$\{queue\.matchmakingQueueId\}`\)/);
  assert.doesNotMatch(source, /createManualQueueRoom/);
  assert.doesNotMatch(source, /navigate\(`\/matches\/\$\{queue\.matchId\}`\)/);
  assert.doesNotMatch(source, /navigate\('\/my-matches'\)/);
});
