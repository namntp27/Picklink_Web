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
