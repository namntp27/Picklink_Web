import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pendingInvitesSource = readFileSync(
  new URL('./PendingInvites.tsx', import.meta.url),
  'utf8',
);

const matchesApiSource = readFileSync(
  new URL('../../api/matches.ts', import.meta.url),
  'utf8',
);

test('opponents search debounces free-text location filters before requesting matches', () => {
  assert.match(pendingInvitesSource, /debouncedProvince/);
  assert.match(pendingInvitesSource, /debouncedWard/);
  assert.match(pendingInvitesSource, /setTimeout/);
  assert.doesNotMatch(pendingInvitesSource, /province:\s*filters\.province\s*\|\|\s*undefined/);
  assert.doesNotMatch(pendingInvitesSource, /ward:\s*filters\.ward\s*\|\|\s*undefined/);
});

test('opponents search cancels stale match requests so old responses cannot overwrite new filters', () => {
  assert.match(pendingInvitesSource, /AbortController/);
  assert.match(pendingInvitesSource, /requestIdRef/);
  assert.match(pendingInvitesSource, /signal:\s*controller\.signal/);
  assert.match(matchesApiSource, /options:\s*Pick<RequestInit,\s*'signal'>/);
});
