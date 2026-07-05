import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const myMatchesSource = readFileSync(
  new URL('./MyMatches.tsx', import.meta.url),
  'utf8',
);

const matchesApiSource = readFileSync(
  new URL('../../api/matches.ts', import.meta.url),
  'utf8',
);

test('my matches cancels stale list requests so slow responses cannot overwrite newer data', () => {
  assert.match(myMatchesSource, /AbortController/);
  assert.match(myMatchesSource, /requestIdRef/);
  assert.match(myMatchesSource, /signal:\s*controller\.signal/);
  assert.match(matchesApiSource, /getMyMatches[\s\S]*options:\s*Pick<RequestInit,\s*'signal'>/);
});

test('my matches ignores noisy realtime events that do not change the list cards', () => {
  assert.match(myMatchesSource, /matchListRefreshActions/);
  assert.match(myMatchesSource, /matchListRefreshActions\.has\(event\.action\)/);
  assert.doesNotMatch(myMatchesSource, /matchListRefreshActions[\s\S]*MessageSent/);
  assert.doesNotMatch(myMatchesSource, /matchListRefreshActions[\s\S]*SlotVoteChanged/);
});

test('my matches restores cached results while revalidating in the background', () => {
  assert.match(myMatchesSource, /myMatchesCache/);
  assert.match(myMatchesSource, /cachedPage\?\.items/);
  assert.match(myMatchesSource, /behavior:\s*\{\s*silent\?:\s*boolean\s*\}/);
  assert.match(myMatchesSource, /load\(\{\},\s*\{\s*silent:\s*true\s*\}\)/);
});

test('my matches uses the same compact three-column card grid as opponents', () => {
  assert.match(myMatchesSource, /sm:grid-cols-2 lg:grid-cols-3/);
  assert.match(myMatchesSource, /isLoading && matches\.length === 0/);
  assert.match(myMatchesSource, /pageSize:\s*9/);
});
