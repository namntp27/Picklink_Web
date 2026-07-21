import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const scheduleSource = readFileSync(new URL('../../../src/pages/courts/CourtScheduleDetail.tsx', import.meta.url), 'utf8');
const gridSource = readFileSync(new URL('../../../src/pages/courts/components/CourtTimelineGrid.tsx', import.meta.url), 'utf8');

test('court schedule delegates the timetable UI to CourtTimelineGrid', () => {
  assert.match(scheduleSource, /from '\.\/components\/CourtTimelineGrid';/);
  assert.match(scheduleSource, /<CourtTimelineGrid/);
});

test('court timeline grid matches the venue timetable states from the reference', () => {
  for (const label of ['Trống', 'Đã đặt', 'Khoá', 'Sự kiện']) {
    assert.match(gridSource, new RegExp(label));
  }

  assert.match(gridSource, /số tháng áp dụng/i);
  assert.match(gridSource, /buildTimelineTicks/);
  assert.match(gridSource, /gridTemplateColumns/);
  assert.match(gridSource, /timeToMinutes/);
  assert.doesNotMatch(gridSource, /href="#court-pricing"/);
});

test('court schedule bottom bar follows the Home page palette', () => {
  for (const token of ['#081d24', '#0f2e32', '#143f34', '#e2ff57', '#f8fbf4']) {
    assert.match(scheduleSource, new RegExp(token));
  }

  assert.match(scheduleSource, /durationLabel/);
  assert.match(scheduleSource, /bottomBookingBar/);
  assert.match(scheduleSource, /currency\.format\(estimatedCourtAmount\)/);
});

test('court timeline grid uses the Home page navy, green and lime palette', () => {
  for (const token of ['#081d24', '#0f2e32', '#143f34', '#276b3f', '#e2ff57', '#eef8e6']) {
    assert.match(gridSource, new RegExp(token));
  }
});
test('court schedule uses the reference full-width layout with a bottom booking bar', () => {
  assert.doesNotMatch(scheduleSource, /<motion\.aside/);
  assert.match(scheduleSource, /bottomBookingBar/);
  assert.match(scheduleSource, /Tổng giờ/);
  assert.match(scheduleSource, /Tổng tiền/);
  assert.match(scheduleSource, /TIẾP THEO/);
});
test('court schedule follows the reference page-level timetable layout', () => {
  assert.match(gridSource, /overflow-hidden border-b border-\[#dbe8d3\] bg-\[#f8fbf4\]/);
  assert.doesNotMatch(gridSource, /rounded-lg border border-\[#dbe8d3\]/);
  assert.match(gridSource, /linear-gradient\(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%\)/);
  assert.match(scheduleSource, /bottomBookingBar sticky bottom-0 z-20/);
});
test('court timeline grid shows lime time markers under each tick', () => {
  assert.match(gridSource, /timeTickMarker/);
  assert.match(gridSource, /timeTickMarker absolute bottom-0 left-0 h-1\.5 w-0\.5 bg-\[#e2ff57\]/);
  assert.match(gridSource, /absolute bottom-0 left-0 h-1\.5 w-0\.5/);
  assert.doesNotMatch(gridSource, /left-1\/2/);
});
test('court timeline grid aligns time labels over the lime markers', () => {
  assert.match(gridSource, /timeTickLabel/);
  assert.match(gridSource, /timeTickLabel absolute bottom-2 left-0 -translate-x-1\/2 whitespace-nowrap text-center text-\[9\.6px\]/);
  assert.match(gridSource, /timeTickMarker absolute bottom-0 left-0/);
});

test('court schedule limits player booking dates to one month from today', () => {
  assert.match(scheduleSource, /maxScheduleDate/);
  assert.match(scheduleSource, /now\.setMonth\(now\.getMonth\(\) \+ 1\)/);
  assert.match(scheduleSource, /value <= maxScheduleDate\(\)/);
  assert.match(scheduleSource, /max=\{maxScheduleDate\(\)\}/);
});
test('court schedule applies slots for a rolling number of months', () => {
  assert.match(scheduleSource, /Số tháng áp dụng/);
  assert.match(scheduleSource, /type="number"/);
  assert.match(scheduleSource, /datesForMonthDuration\(date, bookingMonths\)/);
  assert.match(scheduleSource, /formatDateKey\(bookingRangeEnd\)/);
  assert.match(scheduleSource, /maximumAdvanceBookingMonths/);
  assert.doesNotMatch(scheduleSource, /type="month"/);
});


test('court schedule allows non-consecutive slots but one child court per time', () => {
  assert.doesNotMatch(scheduleSource, /Ch? du?c ch?n cï¿½c slot liï¿½n ti?p/);
  assert.doesNotMatch(scheduleSource, /const consecutive = candidate\.every/);
  assert.match(scheduleSource, /slotKey\(item\.courtId, time\(item\.startTime\)\)\.endsWith\(':' \+ startTime\)/);
});

test('court schedule ignores its own realtime holding event before checkout navigation', () => {
  assert.match(scheduleSource, /isHolding && notification\.entryType === 'Holding' && notification\.action === 'Created'/);
});
