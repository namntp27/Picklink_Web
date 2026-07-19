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

test('court schedule validates selections only against the availability for the displayed date', () => {
  assert.match(scheduleSource, /const \[availabilityDate, setAvailabilityDate\] = useState<string \| null>\(null\)/);
  assert.match(scheduleSource, /const requestedDate = date/);
  assert.match(scheduleSource, /setAvailabilityDate\(requestedDate\)/);
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
  assert.match(scheduleSource, /if \(availabilityRequestId\.current === requestId\) setIsLoading\(false\);/);
});

test('court schedule keeps a hold error visible while refreshing availability', () => {
  assert.match(scheduleSource, /Không thể giữ slot\. Vui lòng tải lại lịch\.'\);\n      await load\(false\);/);
});

test("court schedule confirms a player's conflicting schedule before holding slots", () => {
  assert.match(scheduleSource, /const createHold = async \(allowScheduleConflicts = false\)/);
  assert.match(scheduleSource, /requiresScheduleConflictConfirmation\?: boolean/);
  assert.match(scheduleSource, /window\.confirm\(/);
  assert.match(scheduleSource, /await createHold\(true\)/);
  assert.match(scheduleSource, /allowScheduleConflicts,/);
  assert.match(bookingSource, /allowScheduleConflicts\?: boolean/);
});
