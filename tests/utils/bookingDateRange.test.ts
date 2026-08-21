import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addCalendarMonths, bookingSlotIdentity, datesForMonthDuration, lastBookableDate, monthGridDays } from '../../src/utils/bookingDateRange';

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

test('booking is allowed through the end of next calendar month', () => {
  assert.equal(lastBookableDate('2026-08-21'), '2026-09-30');
  assert.equal(lastBookableDate('2026-12-31'), '2027-01-31');
});

test('month grid starts on Monday and covers the whole month in six weeks', () => {
  // 2026-08-01 is a Saturday, so the grid must lead with five days of July.
  const august = monthGridDays('2026-08-01');

  assert.equal(august.length, 42);
  assert.equal(august[0].key, '2026-07-27');
  assert.equal(august[0].inMonth, false);
  assert.equal(august[5].key, '2026-08-01');
  assert.equal(august[5].inMonth, true);
  assert.equal(august.at(-1)?.key, '2026-09-06');
  assert.equal(august.filter((cell) => cell.inMonth).length, 31);
});

test('month grid keeps a Monday first column when the month itself starts on Monday', () => {
  // 2026-06-01 is a Monday: no leading overhang, so the month starts in cell zero.
  const june = monthGridDays('2026-06-01');

  assert.equal(june[0].key, '2026-06-01');
  assert.equal(june[0].inMonth, true);
  assert.equal(june.filter((cell) => cell.inMonth).length, 30);
});

test('slot identity ignores serialization precision below the minute', () => {
  assert.equal(
    bookingSlotIdentity(82, '2026-08-10T06:00:00.000', '2026-08-10T06:30:00.000'),
    bookingSlotIdentity(82, '2026-08-10T06:00:00', '2026-08-10T06:30:00'),
  );
});
