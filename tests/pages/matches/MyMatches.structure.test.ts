import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(
  new URL('../../../src/pages/matches/MyMatches.tsx', import.meta.url),
  'utf8',
);

test('manual invitations show the selected venue names in their detail card', () => {
  assert.match(source, /searchMatchVenues\(\{ radiusKm: 0 \}\)/);
  assert.match(source, /queueVenueIds\(queue\.sharedVenues\)/);
  assert.match(source, /Các sân đã chọn/);
  assert.match(source, /selectedVenues\.map\(\(venue\) =>/);
  assert.match(source, /venue\.venueName/);
  assert.match(source, /Chưa chọn sân cụ thể/);
});

test('primary match and queue data render without waiting for venue enrichment', () => {
  assert.match(source, /data: matchPage/);
  assert.match(source, /data: myQueues = emptyQueues/);
  assert.match(source, /data: queueVenues = emptyQueueVenues/);
  assert.match(source, /\['my-match-queue-venues', selectedVenueKey\]/);
  assert.doesNotMatch(source, /return \{ result, queues, queueVenues \}/);
  assert.match(source, /matches\.length === 0 && myQueues\.length === 0/);
});

test('the default my-matches tab renders joined rooms together with manual queues', () => {
  assert.match(source, /currentQueues !== null && currentQueues\.map/);
  assert.match(source, /activeFilter !== 'ActiveQueues' && visible\.map/);
  assert.match(source, /visible\.length > 0 \|\| \(activeFilter === 'all'/);
  assert.doesNotMatch(source, /currentQueues !== null \? \(/);
});

test('my matches paginates rooms and queues in groups of fifteen', () => {
  assert.match(source, /const PAGE_SIZE = 15/);
  assert.match(source, /pageSize: PAGE_SIZE/);
  assert.match(source, /activeQueues\.slice\(\(page - 1\) \* PAGE_SIZE, page \* PAGE_SIZE\)/);
  assert.match(source, /activeFilter === 'ActiveQueues' \? activeQueuePagination : pagination/);
});
