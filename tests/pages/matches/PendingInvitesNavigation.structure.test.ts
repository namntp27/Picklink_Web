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

test('opponents details open match pages without falling back to queue details', () => {
  assert.match(source, /const handleOpenQueueMatch = async/);
  assert.match(source, /navigate\(`\/matches\/\$\{queue\.matchId\}`\)/);
  assert.match(source, /createManualQueueRoom\(token!, queueId\)/);
  assert.match(source, /onClick=\{\(\) => void handleOpenQueueMatch\(q\)\}/);
  assert.match(source, /source: activeTab === 'queue' \? 'manual' : 'community'/);
  assert.match(source, /activeTab === 'manual' \|\| visibleMatches\.length > 0/);
  assert.match(source, /Các sân đã chọn/);
  assert.match(source, /match\.preferredVenues\.map\(\(venue\) =>/);
  assert.match(
    source,
    /activeTab === 'queue'[\s\S]*?Các sân đã chọn[\s\S]*?onClick=\{\(\) => setMappedMatch\(match\)\}/,
  );
  assert.match(source, /\['open-matches-v5'/);
  assert.match(source, /player\.isCurrentPlayer/);
  assert.match(source, /currentPlayer\?\.status === 'Approved'/);
  assert.match(source, /myRequest != null/);
  assert.match(source, /\{ cache: 'no-store' \}/);
  assert.doesNotMatch(source, /aria-label="Người tạo lời mời"/);
  assert.doesNotMatch(source, /owner: filters\.owner/);
  assert.doesNotMatch(source, /filters\.owner/);
  assert.doesNotMatch(source, /\/opponents\/queue\/\$\{/);
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
