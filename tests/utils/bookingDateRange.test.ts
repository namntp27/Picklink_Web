import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addCalendarMonths, bookingSlotIdentity, datesForMonthDuration } from '../../src/utils/bookingDateRange';

test('one month is a rolling period through the same day next month', () => {
  const dates = datesForMonthDuration('2026-07-21', 1);

  assert.equal(addCalendarMonths('2026-07-21', 1), '2026-08-21');
  assert.equal(dates[0], '2026-07-21');
  assert.equal(dates.at(-1), '2026-08-21');
  assert.equal(dates.length, 32);
});

test('month addition clamps to the last valid day of the target month', () => {
  assert.equal(addCalendarMonths('2027-01-31', 1), '2027-02-28');
  assert.equal(addCalendarMonths('2028-01-31', 1), '2028-02-29');
});

test('slot identity ignores serialization precision below the minute', () => {
  assert.equal(
    bookingSlotIdentity(82, '2026-08-10T06:00:00.000', '2026-08-10T06:30:00.000'),
    bookingSlotIdentity(82, '2026-08-10T06:00:00', '2026-08-10T06:30:00'),
  );
});
