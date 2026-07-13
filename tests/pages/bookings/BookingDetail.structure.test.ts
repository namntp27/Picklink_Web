import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/bookings/BookingDetail.tsx', import.meta.url), 'utf8');

test('booking detail page follows the Home page visual system', () => {
  for (const token of ['#081d24', '#0f2e32', '#143f34', '#e2ff57', '#f8fbf4']) {
    assert.match(source, new RegExp(token));
  }

  assert.match(source, /data-booking-detail-hero/);
  assert.match(source, /shadow-\[0_14px_34px_rgba\(18,45,34,0\.07\)\]/);
  assert.match(source, /ring-1 ring-outline-variant\/80/);
  assert.doesNotMatch(source, /className="hero-gradient/);
});

test('booking detail page uses a compact no-header layout', () => {
  assert.match(source, /data-booking-detail-compact/);
  assert.match(source, /lg:grid-cols-\[minmax\(0,1fr\)_320px\]/);
  assert.doesNotMatch(source, /<header className=/);
  assert.doesNotMatch(source, /booking-detail-court/);
  assert.doesNotMatch(source, /shadow-\[0_24px_80px_rgba\(8,29,36,0\.16\)\]/);
});


test('booking detail puts each check-in code beside its child court and playing time', () => {
  assert.match(source, /booking\.checkInGroups\.map\(\(group\)/);
  assert.match(source, /time\(group\.startTime\)/);
  assert.match(source, /time\(group\.endTime\)/);
  assert.match(source, /group\.checkInCode/);
});


test('booking detail replaces its redundant overview fields', () => {
  assert.match(source, /CalendarDays,/);
  assert.doesNotMatch(source, /icon: CalendarDays/);
  assert.doesNotMatch(source, /icon: Clock/);
  assert.doesNotMatch(source, /icon: Building2/);
  assert.doesNotMatch(source, /S?n \{booking\.courtNumber\}/);
  assert.match(source, /lg:grid-cols-3/);
  assert.match(source, /playDate\(booking\.startTime\)/);
  assert.match(source, /historyReason\(entry\.reason\)/);
  assert.match(source, /Player tao giu cho/);
  assert.doesNotMatch(source, /Thao t\u00e1c/);
  assert.match(source, /booking\.checkInGroups\.map\(\(group\)/);
  assert.match(source, /group\.checkInCode/);
});


test('booking API normalizes optional child-court arrays', () => {
  const api = readFileSync(new URL('../../../src/api/booking.ts', import.meta.url), 'utf8');
  assert.match(api, /slots: booking\.slots \?\? \[\]/);
  assert.match(api, /checkInGroups: booking\.checkInGroups \?\? \[\]/);
  assert.match(api, /getBookingHolding[\s\S]*?then\(normalizeBookingHolding\)/);
});
