import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(
  new URL('../../../src/pages/matches/PendingInvites.tsx', import.meta.url),
  'utf8',
);
const matchDetailSource = readFileSync(
  new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url),
  'utf8',
);

test('manual invitations keep their queue detail interface after a room is linked', () => {
  assert.match(source, /const handleOpenQueue = \(queue: QueueStatusResponse\)/);
  assert.match(source, /navigate\(`\/opponents\/queue\/\$\{queueId\}`\)/);
  assert.match(source, /onClick=\{\(\) => handleOpenQueue\(q\)\}/);
  assert.match(source, /source: 'community'/);
  assert.match(source, /activeTab === 'manual' \? \(/);
  assert.doesNotMatch(source, /createManualQueueRoom/);
  assert.match(source, /venueList\.map\(\(venue\) =>/);
  assert.match(source, /onClick=\{\(\) => setMappedQueue\(q\)\}/);
  assert.match(source, /\['open-matches-v5'/);
  assert.match(source, /player\.isCurrentPlayer/);
  assert.match(source, /currentPlayer\?\.status === 'Approved'/);
  assert.match(source, /myRequest\?\.status === 'Approved'/);
  assert.match(source, /\{ cache: 'no-store' \}/);
  assert.doesNotMatch(source, /aria-label="Người tạo lời mời"/);
  assert.doesNotMatch(source, /owner: filters\.owner/);
  assert.doesNotMatch(source, /filters\.owner/);
  assert.match(source, /\/opponents\/queue\/\$\{queueId\}/);
  assert.doesNotMatch(source, /Vui lòng chờ chủ phòng mở phòng/);
});

test('joining stays on the room while accepting an invitation opens my matches', () => {
  assert.match(
    matchDetailSource,
    /run\(\(\) => joinMatch\(token, matchId\)\)/,
  );
  assert.doesNotMatch(
    matchDetailSource,
    /joinMatch\(token, matchId\), \(\) => navigate\('\/my-matches'\)/,
  );
  assert.match(
    matchDetailSource,
    /acceptMatchInvitation\(token, matchId\), \(\) => navigate\('\/my-matches'\)/,
  );
});

test('full rooms and queues never render in opponents', () => {
  assert.match(
    source,
    /matches\.filter\(\(match\) =>[\s\S]*?match\.status === 'Recruiting' && match\.availableSlotCount > 0/,
  );
  assert.match(source, /approvedPlayerCount >= maxCapacity/);
});
