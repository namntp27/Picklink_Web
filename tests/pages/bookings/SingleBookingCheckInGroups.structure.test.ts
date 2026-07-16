import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/bookings/MyBookings.tsx', import.meta.url), 'utf8');

test('player booking card leaves check-in codes to the booking detail page', () => {
  assert.doesNotMatch(source, /booking\.checkInGroups\.map\(\(group\)/);
  assert.doesNotMatch(source, /group\.checkInCode/);
});
