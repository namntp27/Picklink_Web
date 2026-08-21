export const maximumAdvanceBookingMonths = 1;

const bookingDateTimeMinute = (value: string) => `${value.slice(0, 10)}T${value.slice(11, 16)}`;

export const bookingSlotIdentity = (courtId: number, startTime: string, endTime: string) =>
  `${courtId}|${bookingDateTimeMinute(startTime)}|${bookingDateTimeMinute(endTime)}`;

const parseDateKey = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, monthIndex, day);
  return date.getFullYear() === year && date.getMonth() === monthIndex && date.getDate() === day
    ? date
    : null;
};

export const toDateKey = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

export const addCalendarMonths = (dateKey: string, months: number) => {
  const source = parseDateKey(dateKey);
  if (!source || !Number.isInteger(months)) return '';
  const targetMonth = new Date(source.getFullYear(), source.getMonth() + months, 1);
  const lastDay = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 0).getDate();
  targetMonth.setDate(Math.min(source.getDate(), lastDay));
  return toDateKey(targetMonth);
};

export const lastBookableDate = (todayDateKey: string) => {
  const today = parseDateKey(todayDateKey);
  if (!today) return '';
  return toDateKey(new Date(today.getFullYear(), today.getMonth() + maximumAdvanceBookingMonths + 1, 0));
};

export const datesForMonthDuration = (startDateKey: string, months: number) => {
  const start = parseDateKey(startDateKey);
  const endDateKey = addCalendarMonths(startDateKey, months);
  const end = parseDateKey(endDateKey);
  if (!start || !end || months < 1) return [];

  const dates: string[] = [];
  for (const date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    dates.push(toDateKey(date));
  }
  return dates;
};

/**
 * The 42 cells of a Monday-first month grid for `monthKey` (`YYYY-MM-01`).
 *
 * Always six weeks, so the grid keeps one height across months, and so the schedule page and its
 * route prefetch derive the exact same date range — a mismatch would make the prefetch a cache miss.
 */
export const monthGridDays = (monthKey: string) => {
  const source = parseDateKey(monthKey) ?? new Date();
  const year = source.getFullYear();
  const monthIndex = source.getMonth();
  const leading = (new Date(year, monthIndex, 1).getDay() + 6) % 7;

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(year, monthIndex, 1 - leading + index);
    return { key: toDateKey(date), date, inMonth: date.getMonth() === monthIndex };
  });
};

export const formatDateKey = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  return date ? new Intl.DateTimeFormat('vi-VN').format(date) : '';
};
