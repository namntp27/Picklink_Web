import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../src/pages/owner/OwnerCheckIn.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/ownerCheckIn.ts', import.meta.url), 'utf8');

test('owner check-in exposes venue and booking-type filter buttons', () => {
  assert.match(pageSource, /getOwnerVenues/);
  assert.match(pageSource, /Tất cả cụm sân/);
  assert.match(pageSource, /Lọc theo loại đơn/);
  assert.ok(pageSource.includes('setVenueId(venue.venueId)'));
  assert.ok(pageSource.includes('setBookingType(item.value)'));
});

test('owner check-in sends the selected venue to the backend before pagination', () => {
  assert.ok(pageSource.includes('venueId || undefined'));
  assert.ok(apiSource.includes("params.set('venueId', String(venueId))"));
});

test('owner check-in booking code stays readable on the dark detail header', () => {
  const ownerCss = readFileSync(new URL('../../../src/pages/owner/owner.css', import.meta.url), 'utf8');

  assert.match(pageSource, /owner-checkin-booking-code/);
  assert.match(ownerCss, /h2\.owner-checkin-booking-code[\s\S]*?color: var\(--owner-accent\)/);
});
