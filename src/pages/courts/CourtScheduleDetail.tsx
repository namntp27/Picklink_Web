import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Headset,
  MapPin,
  ShieldCheck,
  Users,
} from 'lucide-react';

type BlockStatus = 'booked' | 'locked' | 'event';

type SubCourt = {
  id: string;
  name: string;
};

type CourtGroup = {
  id: string;
  name: string;
  subCourts: SubCourt[];
};

type CourtProfile = {
  id: string;
  name: string;
  address: string;
  area: string;
  rating: number;
  pricePerHour: number;
  hotline: string;
  groups: CourtGroup[];
};

type ScheduleBlock = {
  id: string;
  date: string;
  subCourtId: string;
  startTime: string;
  endTime: string;
  status: BlockStatus;
};

type SelectionState = {
  subCourtId: string;
  times: string[];
};

const courtProfiles: Record<string, CourtProfile> = {
  '1': {
    id: '1',
    name: 'Sân Pickleball Cầu Giấy',
    address: 'Số 1 Duy Tân, Phường Cầu Giấy, Hà Nội',
    area: 'Cầu Giấy, Hà Nội',
    rating: 4.8,
    pricePerHour: 220000,
    hotline: '0937.294.949',
    groups: [
      {
        id: 'badminton',
        name: 'Cầu Lông',
        subCourts: [
          { id: 'cg-cl-1', name: 'C.Lông 1' },
          { id: 'cg-cl-2', name: 'C.Lông 2' },
          { id: 'cg-cl-3', name: 'C.Lông 3' },
          { id: 'cg-cl-4', name: 'C.Lông 4' },
          { id: 'cg-cl-5', name: 'C.Lông 5' },
        ],
      },
      {
        id: 'pickleball',
        name: 'Pickleball',
        subCourts: [
          { id: 'cg-pb-1', name: 'Pickleball 1' },
          { id: 'cg-pb-2', name: 'Pickleball 2' },
          { id: 'cg-pb-3', name: 'Pickleball 3' },
          { id: 'cg-pb-4', name: 'Pickleball 4' },
          { id: 'cg-pb-5', name: 'Pickleball 5' },
        ],
      },
    ],
  },
  '2': {
    id: '2',
    name: 'PickleHub Mỹ Đình',
    address: 'KĐT Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
    area: 'Mỹ Đình, Hà Nội',
    rating: 4.9,
    pricePerHour: 260000,
    hotline: '0919.858.563',
    groups: [
      {
        id: 'pickleball',
        name: 'Pickleball',
        subCourts: [
          { id: 'md-pb-1', name: 'PB 1' },
          { id: 'md-pb-2', name: 'PB 2' },
          { id: 'md-pb-3', name: 'PB 3' },
          { id: 'md-pb-4', name: 'PB 4' },
          { id: 'md-pb-5', name: 'PB 5' },
          { id: 'md-pb-6', name: 'PB 6' },
        ],
      },
    ],
  },
  '3': {
    id: '3',
    name: 'Sân Tennis & Pickleball Ba Đình',
    address: 'Số 12 Quần Ngựa, Ba Đình, Hà Nội',
    area: 'Ba Đình, Hà Nội',
    rating: 4.7,
    pricePerHour: 190000,
    hotline: '0904.112.233',
    groups: [
      {
        id: 'mixed',
        name: 'Cụm sân',
        subCourts: [
          { id: 'bd-pb-1', name: 'Pickleball 1' },
          { id: 'bd-pb-2', name: 'Pickleball 2' },
          { id: 'bd-pb-3', name: 'Pickleball 3' },
          { id: 'bd-tennis-1', name: 'Tennis 1' },
        ],
      },
    ],
  },
};

const scheduleBlocks: ScheduleBlock[] = [
  { id: 'b-1', date: '2026-06-18', subCourtId: 'cg-cl-1', startTime: '17:00', endTime: '21:00', status: 'booked' },
  { id: 'b-2', date: '2026-06-18', subCourtId: 'cg-cl-2', startTime: '05:30', endTime: '06:30', status: 'booked' },
  { id: 'b-3', date: '2026-06-18', subCourtId: 'cg-cl-2', startTime: '13:00', endTime: '13:30', status: 'event' },
  { id: 'b-4', date: '2026-06-18', subCourtId: 'cg-cl-2', startTime: '18:00', endTime: '21:00', status: 'booked' },
  { id: 'b-5', date: '2026-06-18', subCourtId: 'cg-cl-3', startTime: '18:00', endTime: '20:00', status: 'booked' },
  { id: 'b-6', date: '2026-06-18', subCourtId: 'cg-cl-4', startTime: '18:00', endTime: '21:00', status: 'booked' },
  { id: 'b-7', date: '2026-06-18', subCourtId: 'cg-cl-5', startTime: '18:00', endTime: '20:30', status: 'booked' },
  { id: 'b-8', date: '2026-06-18', subCourtId: 'cg-pb-1', startTime: '05:00', endTime: '06:00', status: 'booked' },
  { id: 'b-9', date: '2026-06-18', subCourtId: 'cg-pb-1', startTime: '17:00', endTime: '19:30', status: 'booked' },
  { id: 'b-10', date: '2026-06-18', subCourtId: 'cg-pb-2', startTime: '18:00', endTime: '20:00', status: 'booked' },
  { id: 'b-11', date: '2026-06-18', subCourtId: 'cg-pb-3', startTime: '15:00', endTime: '20:00', status: 'booked' },
  { id: 'b-12', date: '2026-06-18', subCourtId: 'cg-pb-4', startTime: '14:00', endTime: '16:00', status: 'booked' },
  { id: 'b-13', date: '2026-06-18', subCourtId: 'cg-pb-4', startTime: '17:00', endTime: '18:00', status: 'booked' },
  { id: 'b-14', date: '2026-06-18', subCourtId: 'cg-pb-5', startTime: '11:30', endTime: '12:00', status: 'locked' },
  { id: 'b-15', date: '2026-06-19', subCourtId: 'cg-cl-1', startTime: '06:00', endTime: '07:30', status: 'booked' },
  { id: 'b-16', date: '2026-06-19', subCourtId: 'cg-cl-3', startTime: '18:30', endTime: '20:30', status: 'booked' },
  { id: 'b-17', date: '2026-06-19', subCourtId: 'cg-pb-2', startTime: '17:00', endTime: '18:30', status: 'event' },
  { id: 'b-18', date: '2026-06-19', subCourtId: 'cg-pb-4', startTime: '20:00', endTime: '22:00', status: 'booked' },
  { id: 'b-19', date: '2026-06-20', subCourtId: 'cg-cl-2', startTime: '08:00', endTime: '09:30', status: 'booked' },
  { id: 'b-20', date: '2026-06-20', subCourtId: 'cg-pb-1', startTime: '18:00', endTime: '21:00', status: 'booked' },
  { id: 'b-21', date: '2026-06-20', subCourtId: 'cg-pb-5', startTime: '07:00', endTime: '08:00', status: 'locked' },
  { id: 'md-1', date: '2026-06-18', subCourtId: 'md-pb-1', startTime: '18:00', endTime: '20:00', status: 'booked' },
  { id: 'md-2', date: '2026-06-18', subCourtId: 'md-pb-2', startTime: '07:00', endTime: '08:30', status: 'booked' },
  { id: 'md-3', date: '2026-06-18', subCourtId: 'md-pb-4', startTime: '19:30', endTime: '21:30', status: 'booked' },
  { id: 'bd-1', date: '2026-06-18', subCourtId: 'bd-pb-1', startTime: '06:00', endTime: '07:00', status: 'booked' },
  { id: 'bd-2', date: '2026-06-18', subCourtId: 'bd-pb-3', startTime: '17:30', endTime: '19:00', status: 'booked' },
  { id: 'bd-3', date: '2026-06-18', subCourtId: 'bd-tennis-1', startTime: '20:00', endTime: '21:00', status: 'locked' },
];

const timelineStartMinutes = 5 * 60;
const timelineEndMinutes = 22 * 60 + 30;
const timelineStepMinutes = 30;
const firstBookableDate = '2026-06-18';
const weekdayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (value: number) => {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;

  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};

const timelineColumns = Array.from(
  { length: (timelineEndMinutes - timelineStartMinutes) / timelineStepMinutes },
  (_, index) => minutesToTime(timelineStartMinutes + index * timelineStepMinutes),
);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

const formatCalendarDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date
    .getDate()
    .toString()
    .padStart(2, '0')}`;

const toMonthDate = (date: string) => {
  const parsedDate = new Date(`${date}T00:00:00`);

  return new Date(parsedDate.getFullYear(), parsedDate.getMonth(), 1);
};

const formatMonthTitle = (date: Date) => `tháng ${date.getMonth() + 1} năm ${date.getFullYear()}`;

const getCalendarMonthCells = (monthDate: Date) => {
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leadingEmptyCells = (firstDay.getDay() + 6) % 7;
  const cells: Array<string | null> = Array.from({ length: leadingEmptyCells }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(toDateValue(new Date(year, month, day)));
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  return cells;
};

const getNextDates = (startDate: string, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(`${startDate}T00:00:00`);
    date.setDate(date.getDate() + index);

    return toDateValue(date);
  });

const getCellBlockedStatus = (blocks: ScheduleBlock[], subCourtId: string, time: string) =>
  blocks.find((block) => {
    const cellStart = timeToMinutes(time);

    return block.subCourtId === subCourtId && cellStart >= timeToMinutes(block.startTime) && cellStart < timeToMinutes(block.endTime);
  })?.status;

const blockClassNames: Record<BlockStatus, string> = {
  booked: 'border-[#ff5a5f] bg-[#ff5a5f]',
  locked: 'border-[#8f9892] bg-[#8f9892]',
  event: 'border-[#e869de] bg-[#e869de]',
};

const blockLabels: Record<BlockStatus, string> = {
  booked: 'Đã đặt',
  locked: 'Khóa',
  event: 'Sự kiện',
};

export const CourtScheduleDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const court = courtProfiles[id ?? '1'] ?? courtProfiles['1'];
  const [selectedDate, setSelectedDate] = useState(firstBookableDate);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [draftDate, setDraftDate] = useState(firstBookableDate);
  const [calendarMonthDate, setCalendarMonthDate] = useState(() => toMonthDate(firstBookableDate));
  const [selection, setSelection] = useState<SelectionState>({ subCourtId: '', times: [] });

  const dateBlocks = useMemo(() => scheduleBlocks.filter((block) => block.date === selectedDate), [selectedDate]);
  const quickDates = useMemo(() => getNextDates(firstBookableDate, 7), []);
  const calendarCells = useMemo(() => getCalendarMonthCells(calendarMonthDate), [calendarMonthDate]);
  const selectedSubCourt = court.groups.flatMap((group) => group.subCourts).find((subCourt) => subCourt.id === selection.subCourtId);
  const selectedTimeCells = [...selection.times].sort((first, second) => timeToMinutes(first) - timeToMinutes(second));
  const selectedDurationHours = selectedTimeCells.length * (timelineStepMinutes / 60);
  const selectedStartTime = selectedTimeCells[0];
  const selectedEndTime = selectedTimeCells.length
    ? minutesToTime(timeToMinutes(selectedTimeCells[selectedTimeCells.length - 1]) + timelineStepMinutes)
    : undefined;
  const selectedTotalPrice = Math.round(court.pricePerHour * selectedDurationHours);
  const selectedCellCount = selectedTimeCells.length;
  const timelineGridStyle = { gridTemplateColumns: `repeat(${timelineColumns.length}, minmax(40px, 1fr))` };

  const resetSelectionForDate = (date: string) => {
    setSelectedDate(date);
    setSelection({ subCourtId: '', times: [] });
  };

  const openCalendar = () => {
    setDraftDate(selectedDate);
    setCalendarMonthDate(toMonthDate(selectedDate));
    setIsCalendarOpen(true);
  };

  const confirmCalendarDate = () => {
    resetSelectionForDate(draftDate);
    setIsCalendarOpen(false);
  };

  const handleCellSelect = (subCourtId: string, time: string) => {
    setSelection((current) => {
      if (current.subCourtId !== subCourtId || current.times.length === 0) {
        return { subCourtId, times: [time] };
      }

      const currentIndexes = current.times.map((cellTime) => timelineColumns.indexOf(cellTime)).sort((first, second) => first - second);
      const clickedIndex = timelineColumns.indexOf(time);

      if (current.times.includes(time)) {
        if (current.times.length === 1) {
          return { subCourtId: '', times: [] };
        }

        if (clickedIndex === currentIndexes[0]) {
          return { subCourtId, times: currentIndexes.slice(1).map((index) => timelineColumns[index]) };
        }

        if (clickedIndex === currentIndexes[currentIndexes.length - 1]) {
          return { subCourtId, times: currentIndexes.slice(0, -1).map((index) => timelineColumns[index]) };
        }

        return { subCourtId, times: [time] };
      }

      const rangeStart = Math.min(clickedIndex, currentIndexes[0]);
      const rangeEnd = Math.max(clickedIndex, currentIndexes[currentIndexes.length - 1]);
      const nextTimes = timelineColumns.slice(rangeStart, rangeEnd + 1);
      const crossesBlockedCell = nextTimes.some((cellTime) => getCellBlockedStatus(dateBlocks, subCourtId, cellTime));

      return crossesBlockedCell ? { subCourtId, times: [time] } : { subCourtId, times: nextTimes };
    });
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
          <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-white/86 hover:text-white" to="/book-court">
            <ChevronLeft className="h-5 w-5" />
            Quay lại danh sách sân
          </Link>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-lg bg-white/12 px-3 py-2 text-[13px] font-bold text-white/88">
                <MapPin className="h-4 w-4" />
                {court.area}
              </p>
              <h1 className="mt-4 text-[30px] font-bold leading-tight md:text-[42px]">{court.name}</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/84">{court.address}</p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/18 bg-white/10 p-4">
              <div>
                <p className="text-[12px] font-bold text-white/70">Đánh giá</p>
                <p className="mt-1 text-[22px] font-bold">{court.rating}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold text-white/70">Giá giờ</p>
                <p className="mt-1 text-[18px] font-bold">{formatCurrency(court.pricePerHour)}</p>
              </div>
              <div>
                <p className="text-[12px] font-bold text-white/70">Sân con</p>
                <p className="mt-1 text-[22px] font-bold">{court.groups.reduce((total, group) => total + group.subCourts.length, 0)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-outline-variant bg-white shadow-sm">
            <div className="flex flex-col gap-4 rounded-t-lg bg-primary p-4 text-white md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-[22px] font-bold">Đặt lịch ngày trực quan</h2>
                <p className="mt-1 text-[13px] font-medium text-white/78">Bấm vào ô trắng để chọn giờ. Ô đã chọn sẽ chuyển sang màu xanh.</p>
              </div>

              <div className="relative">
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/18 px-4 py-3 text-[14px] font-bold text-white hover:bg-white/24 md:w-auto"
                  onClick={openCalendar}
                  type="button"
                >
                  <CalendarDays className="h-5 w-5" />
                  {formatCalendarDate(selectedDate)}
                </button>

                {isCalendarOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[320px] rounded-lg bg-white p-5 text-on-surface shadow-2xl ring-1 ring-black/10">
                    <div className="flex items-center justify-between">
                      <button
                        aria-label="Tháng trước"
                        className="rounded-lg p-2 text-primary hover:bg-primary/10"
                        onClick={() =>
                          setCalendarMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))
                        }
                        type="button"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <p className="text-[16px] font-bold">{formatMonthTitle(calendarMonthDate)}</p>
                      <button
                        aria-label="Tháng sau"
                        className="rounded-lg p-2 text-primary hover:bg-primary/10"
                        onClick={() =>
                          setCalendarMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))
                        }
                        type="button"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[12px] font-bold text-on-surface-variant">
                      {weekdayLabels.map((label) => (
                        <span className="py-2" key={label}>
                          {label}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarCells.map((date, index) => {
                        if (!date) {
                          return <span className="h-10" key={`empty-${index}`} />;
                        }

                        const day = new Date(`${date}T00:00:00`).getDate();
                        const isSelected = draftDate === date;
                        const isPast = date < firstBookableDate;

                        return (
                          <button
                            className={`h-10 rounded-lg text-[14px] font-bold transition-colors ${
                              isSelected
                                ? 'bg-primary text-white'
                                : isPast
                                  ? 'cursor-not-allowed text-on-surface-variant/35'
                                  : 'text-on-surface hover:bg-primary/10 hover:text-primary'
                            }`}
                            disabled={isPast}
                            key={date}
                            onClick={() => setDraftDate(date)}
                            type="button"
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-5 flex items-center justify-end gap-2">
                      <button
                        className="rounded-lg px-4 py-2 text-[14px] font-bold text-primary hover:bg-primary/10"
                        onClick={() => setIsCalendarOpen(false)}
                        type="button"
                      >
                        Hủy
                      </button>
                      <button
                        className="rounded-lg bg-primary px-4 py-2 text-[14px] font-bold text-white hover:bg-primary/90"
                        onClick={confirmCalendarDate}
                        type="button"
                      >
                        Xác nhận
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 border-b border-outline-variant bg-white p-4">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {quickDates.map((date) => (
                  <button
                    className={`shrink-0 rounded-lg border px-4 py-3 text-left text-[13px] font-bold transition-colors ${
                      selectedDate === date
                        ? 'border-primary bg-primary text-white'
                        : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary hover:bg-primary/10'
                    }`}
                    key={date}
                    onClick={() => resetSelectionForDate(date)}
                    type="button"
                  >
                    {formatDate(date)}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[12px] font-bold text-on-surface-variant">
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-white ring-1 ring-[#c9d2c9]" />
                  Trống
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#c7f0d8] ring-1 ring-[#56a36c]" />
                  Đang chọn
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#ff5a5f]" />
                  Đã đặt
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#8f9892]" />
                  Khóa
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 rounded bg-[#e869de]" />
                  Sự kiện
                </span>
              </div>
            </div>

            <p className="border-b border-[#b8e4cf] bg-[#eefbf4] px-4 py-3 text-center text-[13px] font-medium text-on-surface-variant">
              <span className="font-bold text-[#d77a00]">Lưu ý:</span> Chọn cùng một sân con để kéo dài khung giờ. Nếu chọn sân con khác, lịch đang chọn sẽ được chuyển sang sân mới.
            </p>

            <div className="overflow-x-auto">
              <div className="min-w-[1520px]">
                <div className="grid grid-cols-[86px_112px_auto] bg-[#b7eef2] text-[12px] font-medium text-[#356058]">
                  <div className="sticky left-0 z-30 col-span-2 border-r border-[#93cfc4] bg-[#b7eef2] px-3 py-3 font-bold">
                    Cụm sân / sân con
                  </div>
                  <div className="grid" style={timelineGridStyle}>
                    {timelineColumns.map((time) => (
                      <span className="border-r border-[#93cfc4] px-1 py-3 text-center" key={time}>
                        {time}
                      </span>
                    ))}
                  </div>
                </div>

                {court.groups.map((group) => (
                  <div
                    className="grid grid-cols-[86px_112px_auto] border-b border-[#c5d7cd]"
                    key={group.id}
                    style={{ gridTemplateRows: `repeat(${group.subCourts.length}, 56px)` }}
                  >
                    <div
                      className="sticky left-0 z-30 flex items-center justify-center border-r border-[#a7d9c1] bg-[#d9f7e8] px-2 text-center"
                      style={{ gridRow: `1 / span ${group.subCourts.length}` }}
                    >
                      <span className="line-clamp-3 text-[12px] font-bold leading-5 text-[#226143]">{group.name}</span>
                    </div>

                    {group.subCourts.map((subCourt, rowIndex) => (
                      <React.Fragment key={subCourt.id}>
                        <div
                          className="sticky left-[86px] z-20 flex items-center border-r border-b border-[#b9d8ca] bg-[#dff7ea] px-3"
                          style={{ gridColumn: 2, gridRow: rowIndex + 1 }}
                        >
                          <span className="text-[13px] font-bold text-[#226143]">{subCourt.name}</span>
                        </div>

                        <div className="relative border-b border-[#c5d7cd]" style={{ gridColumn: 3, gridRow: rowIndex + 1 }}>
                          <div className="grid h-full" style={timelineGridStyle}>
                            {timelineColumns.map((time) => {
                              const blockedStatus = getCellBlockedStatus(dateBlocks, subCourt.id, time);
                              const isSelected = selection.subCourtId === subCourt.id && selection.times.includes(time);

                              return (
                                <button
                                  aria-label={`${subCourt.name} ${time} ${
                                    blockedStatus ? blockLabels[blockedStatus] : isSelected ? 'đang chọn' : 'trống'
                                  }`}
                                  aria-pressed={isSelected}
                                  className={`h-14 border-r border-[#aeb7b0] transition-colors last:border-r-0 ${
                                    blockedStatus
                                      ? `${blockClassNames[blockedStatus]} cursor-not-allowed`
                                      : isSelected
                                        ? 'border-[#4c9b62] bg-[#c7f0d8] hover:bg-[#a9e7c3]'
                                        : 'bg-white hover:bg-[#eefbf4]'
                                  }`}
                                  disabled={!!blockedStatus}
                                  key={`${subCourt.id}-${time}`}
                                  onClick={() => handleCellSelect(subCourt.id, time)}
                                  title={
                                    blockedStatus
                                      ? `${blockLabels[blockedStatus]} ${time} - ${minutesToTime(timeToMinutes(time) + timelineStepMinutes)}`
                                      : `${subCourt.name} - ${time} đến ${minutesToTime(timeToMinutes(time) + timelineStepMinutes)}`
                                  }
                                  type="button"
                                />
                              );
                            })}
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-b-lg bg-primary p-4 text-white">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="grid grid-cols-2 gap-4 text-[15px] font-bold md:flex md:items-center">
                  <span>Tổng giờ: {selectedDurationHours.toFixed(1)}h</span>
                  <span>Tổng tiền: {formatCurrency(selectedTotalPrice)}</span>
                  <span className="col-span-2 text-[13px] text-white/78 md:col-span-1">
                    {selectedSubCourt && selectedStartTime && selectedEndTime
                      ? `${selectedSubCourt.name} · ${selectedStartTime} - ${selectedEndTime}`
                      : 'Chưa chọn khung giờ'}
                  </span>
                </div>
                <button
                  className={`rounded-lg px-5 py-3 text-[14px] font-bold transition-colors ${
                    selectedCellCount > 0 ? 'bg-[#eab526] text-white hover:bg-[#d6a51f]' : 'cursor-not-allowed bg-[#a7ad9a] text-white'
                  }`}
                  disabled={selectedCellCount === 0}
                  onClick={() => navigate('/checkout')}
                  type="button"
                >
                  TIẾP THEO
                </button>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <CreditCard className="h-5 w-5 text-primary" />
              Tóm tắt đặt sân
            </h2>

            <div className="mt-5 space-y-4 text-[14px]">
              <div className="flex items-start justify-between gap-4">
                <span className="font-bold text-on-surface-variant">Ngày chơi</span>
                <span className="text-right font-bold">{formatDate(selectedDate)}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-bold text-on-surface-variant">Sân con</span>
                <span className="text-right font-bold">{selectedSubCourt?.name ?? 'Chưa chọn'}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-bold text-on-surface-variant">Thời gian</span>
                <span className="text-right font-bold">
                  {selectedStartTime && selectedEndTime ? `${selectedStartTime} - ${selectedEndTime}` : 'Chưa chọn'}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="font-bold text-on-surface-variant">Số giờ</span>
                <span className="text-right font-bold">{selectedDurationHours.toFixed(1)} giờ</span>
              </div>
            </div>

            <div className="mt-5 rounded-lg bg-surface-container-low p-4">
              <div className="flex items-end justify-between gap-4">
                <span className="text-[13px] font-bold text-on-surface-variant">Tổng cộng</span>
                <span className="text-[26px] font-bold text-primary">{formatCurrency(selectedTotalPrice)}</span>
              </div>
              <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">Giá tạm tính theo số ô 30 phút đã chọn.</p>
            </div>

            <button
              className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-bold transition-colors ${
                selectedCellCount > 0 ? 'bg-primary text-white hover:bg-primary/90' : 'cursor-not-allowed bg-surface-container-low text-on-surface-variant'
              }`}
              disabled={selectedCellCount === 0}
              onClick={() => navigate('/checkout')}
              type="button"
            >
              <CreditCard className="h-5 w-5" />
              Tiếp tục thanh toán
            </button>
          </section>

          <section className="rounded-lg border border-primary bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[18px] font-bold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Quy ước trạng thái
            </h2>
            <div className="mt-4 space-y-3 text-[13px] font-medium text-on-surface-variant">
              <p className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Ô trắng có thể chọn và sẽ đổi sang xanh khi được đặt tạm.
              </p>
              <p className="flex gap-2">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#a33535]" />
                Ô đỏ, xám hoặc hồng không thể chọn vì đã có lịch, bị khóa hoặc có sự kiện.
              </p>
              <p className="flex gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Mỗi ô tương ứng 30 phút, tổng tiền cập nhật theo thời gian đã chọn.
              </p>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[18px] font-bold">
              <Users className="h-5 w-5 text-primary" />
              Muốn tìm người chơi cùng?
            </h2>
            <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">
              Sau khi chọn sân và giờ, bạn có thể tạo lời mời ghép trận để người chơi khác tham gia và cùng thanh toán tiền sân.
            </p>
            <Link
              className="mt-4 flex items-center justify-center rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
              to="/opponents"
            >
              Tạo lời mời ghép trận
            </Link>
          </section>

          <section className="rounded-lg border border-[#84c33e]/30 bg-[#f2f9eb] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#84c33e]/20 text-primary">
                <Headset className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[14px] font-bold">Cần hỗ trợ?</p>
                <p className="mt-0.5 text-[12px] font-medium text-on-surface-variant">
                  {court.hotline} hoặc 1900 6789
                </p>
              </div>
            </div>
          </section>
        </aside>
      </main>
    </div>
  );
};
