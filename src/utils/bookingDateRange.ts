export const maximumAdvanceBookingMonths = 12;

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

const toDateKey = (date: Date) => [
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

export const formatDateKey = (dateKey: string) => {
  const date = parseDateKey(dateKey);
  return date ? new Intl.DateTimeFormat('vi-VN').format(date) : '';
};
