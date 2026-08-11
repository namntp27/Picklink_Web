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
  assert.match(source, /\(\) => getPublicQueues\(token\)/);
  assert.match(source, /paginatedQueues\.map\(\(q\) =>/);
  assert.doesNotMatch(source, /getOpenMatches/);
  assert.doesNotMatch(source, /activeTab|setActiveTab/);
  assert.doesNotMatch(source, /open-matches-v5/);
  assert.match(source, /const PAGE_SIZE = 15/);
  assert.match(source, /<PaginationControls page=\{pagination\} onPageChange=\{setPage\} \/>/);
  assert.doesNotMatch(source, /createManualQueueRoom/);
  assert.match(source, /venueList\.map\(\(venue\) =>/);
  assert.match(source, /onClick=\{\(\) => setMappedQueue\(q\)\}/);
  assert.match(source, /player\.isCurrentPlayer/);
  assert.doesNotMatch(source, /String\(player\.playerId\) === user\?\.id/);
  assert.match(source, /currentPlayer\?\.status === 'Approved'/);
  assert.match(source, /myRequest\?\.status === 'Approved'/);
  assert.doesNotMatch(source, /cache: 'no-store'/);
  assert.match(source, /searchMatchVenues\(\{ radiusKm: 0 \}\)/);
  assert.doesNotMatch(source, /Promise\.all\(queues\.map/);
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

test('manual queue filters exclude full rooms and support all visible controls', () => {
  assert.match(source, /approvedPlayerCount >= maxCapacity/);
  assert.match(source, /queueMatchesDate\(q, filters\.date\)/);
  assert.match(source, /skill < \(q\.minSkillLevel \?\? 1\)/);
  assert.match(source, /filters\.format !== 'all'/);
  assert.match(source, /filters\.province && q\.province/);
});
