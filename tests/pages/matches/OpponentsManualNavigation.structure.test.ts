import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(
  new URL('../../../src/pages/matches/Opponents.tsx', import.meta.url),
  'utf8',
);

test('manual matchmaking opens its match while automatic matchmaking opens its queue', () => {
  assert.match(source, /const queue = await joinSoloQueue\(token,/);
  assert.match(source, /if \(creationMode === 'manual'\)/);
  assert.match(source, /createManualQueueRoom\(token, queue\.matchmakingQueueId\)/);
  assert.match(source, /navigate\(`\/matches\/\$\{matchId\}`\)/);
  assert.match(source, /navigate\(`\/opponents\/queue\/\$\{queue\.matchmakingQueueId\}`\)/);
  assert.doesNotMatch(source, /navigate\('\/my-matches'\)/);
});
