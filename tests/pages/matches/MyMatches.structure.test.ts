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

test('the default my-matches tab renders joined rooms together with manual queues', () => {
  assert.match(source, /currentQueues !== null && currentQueues\.map/);
  assert.match(source, /activeFilter !== 'ActiveQueues' && visible\.map/);
  assert.match(source, /visible\.length > 0 \|\| \(activeFilter === 'all'/);
  assert.match(source, /activeFilter !== 'ActiveQueues' && \(/);
  assert.doesNotMatch(source, /currentQueues !== null \? \(/);
});
