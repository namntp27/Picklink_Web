import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const scheduleSource = readFileSync(new URL('../../../src/pages/courts/CourtScheduleDetail.tsx', import.meta.url), 'utf8');
const bookingSource = readFileSync(new URL('../../../src/api/booking.ts', import.meta.url), 'utf8');

test('court schedule applies the selected daily slots to available days in a month', () => {
  assert.match(scheduleSource, /const applyCurrentSlotsToMonth = async/);
  assert.match(scheduleSource, /datesInMonth\(bookingMonth\)/);
  assert.match(scheduleSource, /getCourtAvailability\(venueId, targetDate, token\)/);
  assert.match(scheduleSource, /Slot không còn trống/);
  assert.match(scheduleSource, /disabledSlotKeys=\{unavailableSlotKeysForDate\}/);
  assert.match(scheduleSource, /date: slot\.startTime\.slice\(0, 10\)/);
  assert.match(bookingSource, /date\?: string/);
});