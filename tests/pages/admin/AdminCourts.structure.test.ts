import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/admin/AdminCourts.tsx', import.meta.url), 'utf8');

test('admin courts subscribes to venue realtime updates', () => {
  assert.match(source, /useVenueRealtime/);
  assert.match(source, /event\.venueId === selectedId/);
  assert.match(source, /loadVenues\(\)/);
  assert.match(source, /getAdminVenue\(event\.venueId, token\)/);
});
