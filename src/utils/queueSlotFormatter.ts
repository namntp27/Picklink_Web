import { QueueSlotResponse } from '../api/matchmaking';

export interface FormattedSlot {
  dayLabel: string;
  timeStart: string;
  timeEnd: string;
}

const dayOfWeekOrder: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

const longWeekdayMap: Record<string, string> = {
  Monday: 'Thứ 2',
  Tuesday: 'Thứ 3',
  Wednesday: 'Thứ 4',
  Thursday: 'Thứ 5',
  Friday: 'Thứ 6',
  Saturday: 'Thứ 7',
  Sunday: 'Chủ Nhật'
};

const shortWeekdayMap: Record<string, string> = {
  Monday: 'T2',
  Tuesday: 'T3',
  Wednesday: 'T4',
  Thursday: 'T5',
  Friday: 'T6',
  Saturday: 'T7',
  Sunday: 'CN'
};

const dateLabel = (value: string) => {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
};

const shortDateLabel = (value: string) => {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value.slice(5).replace('-', '/');
  }
};

const normalizeDayOfWeek = (day: string | number): string => {
  const dayStr = String(day).trim();
  const numericMap: Record<string, string> = {
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday'
  };
  return numericMap[dayStr] || dayStr;
};

export const formatQueueSlots = (
  slots: QueueSlotResponse[] | undefined | null,
  replayType: string,
  isShort = false
): FormattedSlot[] => {
  if (!slots || slots.length === 0) return [];

  interface GroupedSlotInternal {
    dayLabel: string;
    timeStart: string;
    timeEnd: string;
    sortKeyDay: number;
  }

  const result: GroupedSlotInternal[] = [];

  if (replayType === 'Weekly') {
    // Group slots by timeStart & timeEnd
    const groups: Record<string, string[]> = {};
    slots.forEach(slot => {
      if (slot.dayOfWeek == null || slot.dayOfWeek === '') return;
      const normalizedDay = normalizeDayOfWeek(slot.dayOfWeek);
      const key = `${slot.timeStart}-${slot.timeEnd}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      if (!groups[key].includes(normalizedDay)) {
        groups[key].push(normalizedDay);
      }
    });

    Object.entries(groups).forEach(([timeKey, dayNames]) => {
      const [timeStart, timeEnd] = timeKey.split('-');
      const sortedDays = [...dayNames].sort((a, b) => {
        return (dayOfWeekOrder[a] || 0) - (dayOfWeekOrder[b] || 0);
      });

      let currentRun: string[] = [];
      const runs: string[][] = [];

      sortedDays.forEach(day => {
        if (currentRun.length === 0) {
          currentRun.push(day);
        } else {
          const prevDay = currentRun[currentRun.length - 1];
          const prevOrder = dayOfWeekOrder[prevDay];
          const currOrder = dayOfWeekOrder[day];
          if (currOrder === prevOrder + 1) {
            currentRun.push(day);
          } else {
            runs.push(currentRun);
            currentRun = [day];
          }
        }
      });
      if (currentRun.length > 0) {
        runs.push(currentRun);
      }

      runs.forEach(run => {
        const startDay = run[0];
        const endDay = run[run.length - 1];
        let dayLabel = '';

        if (run.length === 1) {
          dayLabel = isShort ? (shortWeekdayMap[startDay] || startDay) : (longWeekdayMap[startDay] || startDay);
        } else {
          const startLabel = isShort ? (shortWeekdayMap[startDay] || startDay) : (longWeekdayMap[startDay] || startDay);
          const endLabel = isShort ? (shortWeekdayMap[endDay] || endDay) : (longWeekdayMap[endDay] || endDay);
          dayLabel = isShort ? `${startLabel} - ${endLabel}` : `${startLabel} đến ${endLabel}`;
        }

        result.push({
          dayLabel,
          timeStart,
          timeEnd,
          sortKeyDay: dayOfWeekOrder[startDay] || 99
        });
      });
    });
  } else if (replayType === 'Monthly') {
    // Group slots by timeStart & timeEnd
    const groups: Record<string, number[]> = {};
    slots.forEach(slot => {
      if (slot.dayOfMonth == null) return;
      const key = `${slot.timeStart}-${slot.timeEnd}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      if (!groups[key].includes(slot.dayOfMonth)) {
        groups[key].push(slot.dayOfMonth);
      }
    });

    Object.entries(groups).forEach(([timeKey, days]) => {
      const [timeStart, timeEnd] = timeKey.split('-');
      const sortedDays = [...days].sort((a, b) => a - b);

      let currentRun: number[] = [];
      const runs: number[][] = [];

      sortedDays.forEach(day => {
        if (currentRun.length === 0) {
          currentRun.push(day);
        } else {
          const prevDay = currentRun[currentRun.length - 1];
          if (day === prevDay + 1) {
            currentRun.push(day);
          } else {
            runs.push(currentRun);
            currentRun = [day];
          }
        }
      });
      if (currentRun.length > 0) {
        runs.push(currentRun);
      }

      runs.forEach(run => {
        const startDay = run[0];
        const endDay = run[run.length - 1];
        let dayLabel = '';

        if (run.length === 1) {
          dayLabel = isShort ? `N. ${startDay}` : `Ngày ${startDay}`;
        } else {
          dayLabel = isShort ? `N. ${startDay} - N. ${endDay}` : `Ngày ${startDay} đến Ngày ${endDay}`;
        }

        result.push({
          dayLabel,
          timeStart,
          timeEnd,
          sortKeyDay: startDay
        });
      });
    });
  } else if (replayType === 'Daily') {
    // No days, just time ranges
    slots.forEach(slot => {
      result.push({
        dayLabel: isShort ? 'Hàng ngày' : 'Mỗi ngày',
        timeStart: slot.timeStart,
        timeEnd: slot.timeEnd,
        sortKeyDay: 0
      });
    });
  } else {
    // None / specific dates
    // Group slots by timeStart & timeEnd
    const groups: Record<string, string[]> = {};
    slots.forEach(slot => {
      if (!slot.specificDate) return;
      const key = `${slot.timeStart}-${slot.timeEnd}`;
      if (!groups[key]) {
        groups[key] = [];
      }
      if (!groups[key].includes(slot.specificDate)) {
        groups[key].push(slot.specificDate);
      }
    });

    Object.entries(groups).forEach(([timeKey, dates]) => {
      const [timeStart, timeEnd] = timeKey.split('-');
      const sortedDates = [...dates].sort();

      let currentRun: string[] = [];
      const runs: string[][] = [];

      sortedDates.forEach(dateStr => {
        if (currentRun.length === 0) {
          currentRun.push(dateStr);
        } else {
          const prevDateStr = currentRun[currentRun.length - 1];
          const prevTime = new Date(`${prevDateStr}T00:00:00`).getTime();
          const currTime = new Date(`${dateStr}T00:00:00`).getTime();
          const diffDays = Math.round((currTime - prevTime) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            currentRun.push(dateStr);
          } else {
            runs.push(currentRun);
            currentRun = [dateStr];
          }
        }
      });
      if (currentRun.length > 0) {
        runs.push(currentRun);
      }

      runs.forEach(run => {
        const startDate = run[0];
        const endDate = run[run.length - 1];
        let dayLabel = '';

        if (run.length === 1) {
          dayLabel = isShort ? shortDateLabel(startDate) : dateLabel(startDate);
        } else {
          dayLabel = isShort 
            ? `${shortDateLabel(startDate)} - ${shortDateLabel(endDate)}` 
            : `${dateLabel(startDate)} đến ${dateLabel(endDate)}`;
        }

        result.push({
          dayLabel,
          timeStart,
          timeEnd,
          sortKeyDay: new Date(`${startDate}T00:00:00`).getTime()
        });
      });
    });
  }

  // Sort: first by sortKeyDay, then by timeStart
  return result
    .sort((a, b) => {
      if (a.sortKeyDay !== b.sortKeyDay) {
        return a.sortKeyDay - b.sortKeyDay;
      }
      return a.timeStart.localeCompare(b.timeStart);
    })
    .map(({ dayLabel, timeStart, timeEnd }) => ({
      dayLabel,
      timeStart,
      timeEnd
    }));
};
