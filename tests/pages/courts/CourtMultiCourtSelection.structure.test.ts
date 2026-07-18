import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const scheduleSource = readFileSync(new URL('../../../src/pages/courts/CourtScheduleDetail.tsx', import.meta.url), 'utf8');

test('court schedule permits one child court per time slot', () => {
  assert.match(scheduleSource, /const slotKey = \(courtId: number, startTime: string\)/);
  assert.match(scheduleSource, /selectedSlotKeys = selectedSlotsForDate\.map/);
  assert.match(scheduleSource, /currentDateSlots\.filter\(\(item\) => !slotKey\(item\.courtId, time\(item\.startTime\)\)\.endsWith\(':' \+ startTime\)\)/);
  assert.match(scheduleSource, /bookingId=' \+ booking\.bookingId/);
});

test('court schedule continues an owned holding from the bottom action', () => {
  assert.match(scheduleSource, /const resumableHoldingBookingId = availability\?\.slots\.find/);
  assert.ok(scheduleSource.includes("navigate('/checkout?bookingId=' + resumableHoldingBookingId"));
  assert.match(scheduleSource, /!selectedSlots\.length && !resumableHoldingBookingId/);
});