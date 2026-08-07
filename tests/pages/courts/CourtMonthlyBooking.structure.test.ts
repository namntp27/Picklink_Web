import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const scheduleSource = readFileSync(new URL('../../../src/pages/courts/CourtScheduleDetail.tsx', import.meta.url), 'utf8');
const bookingSource = readFileSync(new URL('../../../src/api/booking.ts', import.meta.url), 'utf8');

test('court schedule applies the selected daily slots through a rolling number of months', () => {
  assert.match(scheduleSource, /const applyCurrentSlotsForMonths = async/);
  assert.match(scheduleSource, /datesForMonthDuration\(date, bookingMonths\)/);
  assert.match(scheduleSource, /getCourtAvailabilities\(venueId, targetDates, token\)/);
  assert.match(scheduleSource, /Slot không còn trống/);
  assert.match(scheduleSource, /disabledSlotKeys=\{unavailableSlotKeysForDate\}/);
  assert.match(scheduleSource, /date: slot\.startTime\.slice\(0, 10\)/);
  assert.match(bookingSource, /date\?: string/);
});

test('court schedule validates selections only against the availability for the displayed date', () => {
  // The date is part of the query key, so a response can only ever be applied to the day it was
  // requested for; `availabilityDate` derives from that rather than being tracked separately.
  assert.match(scheduleSource, /\['court-availability', venueId, date, token\]/);
  assert.match(scheduleSource, /getCourtAvailability\(venueId, date, token\)/);
  assert.match(scheduleSource, /const availabilityDate = availability \? date : null/);
  assert.match(scheduleSource, /availabilityDate !== date/);
});

test('court schedule shows selected dates as removable slot cards', () => {
  assert.match(scheduleSource, /const removeSelectedDate = \(selectedDate: string\) =>/);
  assert.match(scheduleSource, /selectedDates\.map\(\(selectedDate\) =>/);
  assert.match(scheduleSource, /onClick=\{\(\) => changeDate\(selectedDate\)\}/);
  assert.match(scheduleSource, /onClick=\{\(\) => removeSelectedDate\(selectedDate\)\}/);
  assert.match(scheduleSource, /<X className="h-3 w-3" \/>/);
});

test('court schedule completes loading when its latest availability refresh is silent', () => {
  // useApiQuery owns the loading flag and drops superseded runs, so the page never keeps a
  // spinner alive after a refresh that a newer request overtook.
  assert.match(scheduleSource, /loading: isLoading,\r?\n\s*refresh: load,\r?\n\s*\} = useApiQuery\(/);
  assert.doesNotMatch(scheduleSource, /setIsLoading\(/);
});

test('court schedule keeps a hold error visible while refreshing availability', () => {
  // The hold failure lives in its own state, so refreshing availability cannot clear it.
  assert.match(scheduleSource, /Không thể giữ slot\. Vui lòng tải lại lịch\.'\);\r?\n      await load\(\);/);
  assert.match(scheduleSource, /const error = actionError \|\| loadError;/);
});

test("court schedule confirms a player's conflicting schedule before holding slots", () => {
  assert.match(scheduleSource, /const createHold = async \(allowScheduleConflicts = false\)/);
  assert.match(scheduleSource, /requiresScheduleConflictConfirmation\?: boolean/);
  assert.match(scheduleSource, /window\.confirm\(/);
  assert.match(scheduleSource, /await createHold\(true\)/);
  assert.match(scheduleSource, /allowScheduleConflicts,/);
  assert.match(bookingSource, /allowScheduleConflicts\?: boolean/);
});
