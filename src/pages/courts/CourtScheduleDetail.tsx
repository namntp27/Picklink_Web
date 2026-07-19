import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  Loader2,
  RefreshCw,
  X,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createBookingHolding, getCourtAvailability, type AvailabilitySlot, type BookingScheduleConflict, type CourtAvailability } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useScheduleRealtime, type ScheduleRealtimeEvent } from '../../hooks/useScheduleRealtime';
import { useVenueRealtime } from '../../hooks/useVenueRealtime';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CourtTimelineGrid } from './components/CourtTimelineGrid';

const maxBookingSlots = 496;
const localDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};
const maxScheduleDate = () => {
  const now = new Date();
  now.setMonth(now.getMonth() + 1);
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};
const validScheduleDate = (value: string | null) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= localDate() && value <= maxScheduleDate() ? value : localDate();
const datesInMonth = (value: string) => {
  const [year, month] = value.split('-').map(Number);
  if (!year || !month) return [];
  return Array.from({ length: new Date(year, month, 0).getDate() }, (_, index) =>
    [year, String(month).padStart(2, '0'), String(index + 1).padStart(2, '0')].join('-'));
};
const time = (value: string) => value.slice(11, 16);
const datePart = (value: string) => value.slice(0, 10).split('-').reverse().join('/');
const slotKey = (courtId: number, startTime: string) => courtId + ':' + startTime;
const slotIdentity = (courtId: number, startTime: string, endTime: string) =>
  courtId + '|' + startTime + '|' + endTime;
const minuteOfDay = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};
const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value + 'T00:00:00'));

type CourtSlotSelection = {
  courtId: number;
  startTime: string;
  endTime: string;
  hourlyPrice: number;
};

type MonthUnavailableSlot = {
  date: string;
  courtId: number;
  courtNumber: number;
  startTime: string;
  endTime: string;
  status: AvailabilitySlot['status'];
};

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const buttonBase = 'h-10 rounded-xl px-3 text-[13px] font-bold';

export const CourtScheduleDetail = () => {
  const venueId = Number(useParams().id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [date, setDate] = useState(() => validScheduleDate(searchParams.get('date')));
  const [availability, setAvailability] = useState<CourtAvailability | null>(null);
  const [availabilityDate, setAvailabilityDate] = useState<string | null>(null);
  const availabilityRequestId = useRef(0);
  const [selectedSlotsByDate, setSelectedSlotsByDate] = useState<Record<string, CourtSlotSelection[]>>({});
  const [bookingMonth, setBookingMonth] = useState(() => date.slice(0, 7));
  const [monthUnavailableSlots, setMonthUnavailableSlots] = useState<MonthUnavailableSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplyingMonth, setIsApplyingMonth] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [error, setError] = useState('');

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const },
      };

  const load = async (showLoading = true) => {
    if (!Number.isInteger(venueId)) return;
    const requestId = ++availabilityRequestId.current;
    const requestedDate = date;
    if (showLoading) {
      setIsLoading(true);
      setError('');
    }
    try {
      const nextAvailability = await getCourtAvailability(venueId, requestedDate, token);
      if (availabilityRequestId.current !== requestId) return;
      setAvailability(nextAvailability);
      setAvailabilityDate(requestedDate);
    } catch (requestError) {
      if (availabilityRequestId.current !== requestId) return;
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải lịch sân.');
    } finally {
      if (availabilityRequestId.current === requestId) setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [venueId, date, token]);

  const selectedSlotsForDate = useMemo(
    () => selectedSlotsByDate[date] ?? [],
    [date, selectedSlotsByDate],
  );
  const selectedSlotKeys = selectedSlotsForDate.map((slot) => slotKey(slot.courtId, time(slot.startTime)));
  const selectedSlots = useMemo(
    () => Object.values(selectedSlotsByDate).flat()
      .sort((first, second) => first.startTime.localeCompare(second.startTime) || first.courtId - second.courtId),
    [selectedSlotsByDate],
  );
  const selectedDates = useMemo(
    () => Object.keys(selectedSlotsByDate).filter((selectedDate) => selectedSlotsByDate[selectedDate].length).sort(),
    [selectedSlotsByDate],
  );
  const unavailableSlotKeysForDate = useMemo(
    () => monthUnavailableSlots.filter((slot) => slot.date === date)
      .map((slot) => slotKey(slot.courtId, time(slot.startTime))),
    [date, monthUnavailableSlots],
  );
  const resumableHoldingBookingId = availability?.slots.find((slot) =>
    slot.status === 'Holding' && slot.isOwnedByCurrentUser && slot.bookingId,
  )?.bookingId;
  const estimatedCourtAmount = selectedSlots.reduce(
    (total, slot) => total + Math.round(slot.hourlyPrice * 0.5),
    0,
  );
  const removeSelectedDate = (selectedDate: string) => {
    setSelectedSlotsByDate((current) => {
      const next = { ...current };
      delete next[selectedDate];
      return next;
    });
    setMonthUnavailableSlots((current) => current.filter((slot) => slot.date !== selectedDate));
  };

  useEffect(() => {
    if (isLoading || !availability || availabilityDate !== date || !selectedSlotsForDate.length) return;
    const validKeys = new Set(
      availability.slots
        .filter((slot) => slot.status === 'Available' && new Date(slot.startTime).getTime() > Date.now())
        .map((slot) => slotIdentity(slot.courtId, slot.startTime, slot.endTime)),
    );
    const invalidSelection = selectedSlotsForDate.some((slot) =>
      !validKeys.has(slotIdentity(slot.courtId, slot.startTime, slot.endTime)));
    if (!invalidSelection) return;
    setSelectedSlotsByDate((current) => {
      const retained = (current[date] ?? []).filter((slot) =>
        validKeys.has(slotIdentity(slot.courtId, slot.startTime, slot.endTime)));
      const next = { ...current };
      if (retained.length) next[date] = retained;
      else delete next[date];
      return next;
    });
    setError('Khung giờ bạn vừa chọn đã được cập nhật và không còn trống. Vui lòng chọn slot khác.');
  }, [availability, availabilityDate, date, isLoading, selectedSlotsForDate]);

  const notificationTouchesSelection = (notification: ScheduleRealtimeEvent) => {
    if (!selectedSlotKeys.length) return false;
    if (notification.venueId !== venueId || notification.startTime.slice(0, 10) !== date) return false;
    const changedStart = minuteOfDay(notification.startTime.slice(11, 16));
    const changedEnd = minuteOfDay(notification.endTime.slice(11, 16));
    return selectedSlotsForDate.some((selectedSlot) => {
      const selectedStart = minuteOfDay(time(selectedSlot.startTime));
      return selectedSlot.courtId === notification.courtId
        && selectedStart < changedEnd
        && selectedStart + 30 > changedStart;
    });
  };

  useScheduleRealtime((notification) => {
    if (notification.venueId !== venueId || notification.startTime.slice(0, 10) !== date) return;
    if (isHolding && notification.entryType === 'Holding' && notification.action === 'Created') return;
    if (notification.action !== 'Deleted' && notificationTouchesSelection(notification)) {
      const changedStart = notification.startTime.slice(11, 16);
      const changedEnd = notification.endTime.slice(11, 16);
      setSelectedSlotsByDate((current) => {
        const retained = (current[date] ?? []).filter((slot) =>
          slot.courtId !== notification.courtId
          || time(slot.startTime) < changedStart
          || time(slot.startTime) >= changedEnd);
        const next = { ...current };
        if (retained.length) next[date] = retained;
        else delete next[date];
        return next;
      });
      setError('Khung giờ bạn vừa chọn đã được cập nhật và không còn trống. Vui lòng chọn slot khác.');
    }
    void load(false);
  });

  useVenueRealtime((notification) => {
    if (notification.venueId === venueId) void load(false);
  });

  const selectSlot = (slot: AvailabilitySlot) => {
    if (slot.status === 'Holding' && slot.isOwnedByCurrentUser && slot.bookingId) {
      navigate('/checkout?bookingId=' + slot.bookingId + '&date=' + encodeURIComponent(date));
      return;
    }
    const key = slotKey(slot.courtId, time(slot.startTime));
    if (slot.status !== 'Available'
      || unavailableSlotKeysForDate.includes(key)
      || new Date(slot.startTime).getTime() <= Date.now()) return;
    const court = availability?.courts.find((item) => item.courtId === slot.courtId);
    const startTime = time(slot.startTime);
    setSelectedSlotsByDate((current) => {
      const currentDateSlots = current[date] ?? [];
      const identity = slotIdentity(slot.courtId, slot.startTime, slot.endTime);
      const nextDateSlots = currentDateSlots.some((item) => slotIdentity(item.courtId, item.startTime, item.endTime) === identity)
        ? currentDateSlots.filter((item) => slotIdentity(item.courtId, item.startTime, item.endTime) !== identity)
        : [...currentDateSlots.filter((item) => !slotKey(item.courtId, time(item.startTime)).endsWith(':' + startTime)), {
          courtId: slot.courtId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          hourlyPrice: court?.hourlyPrice ?? 0,
        }].sort((first, second) => first.startTime.localeCompare(second.startTime) || first.courtId - second.courtId);
      const next = { ...current };
      if (nextDateSlots.length) next[date] = nextDateSlots;
      else delete next[date];
      return next;
    });
    setMonthUnavailableSlots([]);
    setError('');
  };

  const applyCurrentSlotsToMonth = async () => {
    if (!token || !bookingMonth || !selectedSlotsForDate.length) {
      setError('Hãy chọn ít nhất một slot ở ngày đang xem trước khi áp dụng cho cả tháng.');
      return;
    }
    const targetDates = datesInMonth(bookingMonth)
      .filter((targetDate) => targetDate >= localDate() && targetDate <= maxScheduleDate());
    if (!targetDates.length) {
      setError('Tháng đã chọn không còn ngày nào có thể đặt.');
      return;
    }

    setIsApplyingMonth(true);
    setError('');
    try {
      // ponytail: reuse the existing daily availability API; add a batch endpoint only if this becomes a bottleneck.
      const calendars = await Promise.all(targetDates.map(async (targetDate) => ({
        date: targetDate,
        availability: await getCourtAvailability(venueId, targetDate, token),
      })));
      const unavailable: MonthUnavailableSlot[] = [];
      const invalidKeys = new Set<string>();
      const validSlots: CourtSlotSelection[] = [];
      for (const { date: targetDate, availability: dailyAvailability } of calendars) {
        for (const templateSlot of selectedSlotsForDate) {
          const startTime = targetDate + 'T' + time(templateSlot.startTime) + ':00';
          const endTime = targetDate + 'T' + time(templateSlot.endTime) + ':00';
          const identity = slotIdentity(templateSlot.courtId, startTime, endTime);
          if (new Date(startTime).getTime() <= Date.now()) {
            invalidKeys.add(identity);
            continue;
          }
          const currentSlot = dailyAvailability.slots.find((slot) =>
            slot.courtId === templateSlot.courtId && time(slot.startTime) === time(templateSlot.startTime));
          if (currentSlot?.status === 'Available') {
            const court = dailyAvailability.courts.find((item) => item.courtId === templateSlot.courtId);
            validSlots.push({
              courtId: templateSlot.courtId,
              startTime,
              endTime,
              hourlyPrice: court?.hourlyPrice ?? templateSlot.hourlyPrice,
            });
            continue;
          }
          const court = dailyAvailability.courts.find((item) => item.courtId === templateSlot.courtId);
          unavailable.push({
            date: targetDate,
            courtId: templateSlot.courtId,
            courtNumber: court?.courtNumber ?? templateSlot.courtId,
            startTime,
            endTime,
            status: currentSlot?.status ?? 'Closed',
          });
          invalidKeys.add(identity);
        }
      }

      const existingKeys = new Set(selectedSlots.map((slot) => slotIdentity(slot.courtId, slot.startTime, slot.endTime)));
      const additions = validSlots.filter((slot) => !existingKeys.has(slotIdentity(slot.courtId, slot.startTime, slot.endTime)));
      const invalidSelectedCount = selectedSlots.filter((slot) => invalidKeys.has(slotIdentity(slot.courtId, slot.startTime, slot.endTime))).length;
      if (selectedSlots.length - invalidSelectedCount + additions.length > maxBookingSlots) {
        setError('Một booking chỉ hỗ trợ tối đa ' + maxBookingSlots + ' slot. Hãy giảm số slot hoặc số ngày.');
        return;
      }

      setSelectedSlotsByDate((current) => {
        const next = { ...current };
        targetDates.forEach((targetDate) => {
          const retained = (next[targetDate] ?? []).filter((slot) =>
            !invalidKeys.has(slotIdentity(slot.courtId, slot.startTime, slot.endTime)));
          const newSlots = additions.filter((slot) => slot.startTime.slice(0, 10) === targetDate);
          const merged = [...retained, ...newSlots];
          if (merged.length) next[targetDate] = merged;
          else delete next[targetDate];
        });
        return next;
      });
      setMonthUnavailableSlots(unavailable);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Không thể kiểm tra lịch cả tháng.');
    } finally {
      setIsApplyingMonth(false);
    }
  };

  const createHold = async (allowScheduleConflicts = false) => {
    if (resumableHoldingBookingId) {
      navigate('/checkout?bookingId=' + resumableHoldingBookingId + '&date=' + encodeURIComponent(date));
      return;
    }
    if (!token) {
      navigate('/login');
      return;
    }
    if (!selectedSlots.length) return;
    setIsHolding(true);
    setError('');
    try {
      const booking = await createBookingHolding(token, {
        date: selectedDates[0] ?? date,
        slots: selectedSlots.map((slot) => ({
          date: slot.startTime.slice(0, 10),
          courtId: slot.courtId,
          startTime: time(slot.startTime) + ':00',
        })),
        allowScheduleConflicts,
      });
      navigate('/checkout?bookingId=' + booking.bookingId + '&date=' + encodeURIComponent(selectedDates[0] ?? date), { state: { booking } });
    } catch (requestError) {
      const body = requestError instanceof ApiError ? requestError.body as {
        requiresScheduleConflictConfirmation?: boolean;
        conflicts?: BookingScheduleConflict[];
      } | undefined : undefined;
      if (!allowScheduleConflicts && body?.requiresScheduleConflictConfirmation && body.conflicts?.length) {
        const details = body.conflicts.map((conflict) =>
          `${conflict.playerName} đã có lịch trùng với slot được chọn.\n`
          + `Lịch đã có: ${conflict.conflictingSlot.venueName} · Sân ${conflict.conflictingSlot.courtNumber} · ${datePart(conflict.conflictingSlot.startTime)} · ${time(conflict.conflictingSlot.startTime)}–${time(conflict.conflictingSlot.endTime)}`
          + `\nSlot đang chọn: ${conflict.selectedSlot.venueName} · Sân ${conflict.selectedSlot.courtNumber} · ${datePart(conflict.selectedSlot.startTime)} · ${time(conflict.selectedSlot.startTime)}–${time(conflict.selectedSlot.endTime)}`,
        );
        if (window.confirm(`${details.join('\n\n')}\n\nBạn có muốn tiếp tục tạo booking trùng lịch không?`)) {
          await createHold(true);
        }
        return;
      }
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể giữ slot. Vui lòng tải lại lịch.');
      await load(false);
    } finally {
      setIsHolding(false);
    }
  };
  const changeDate = (nextDate: string) => {
    const nextValidDate = validScheduleDate(nextDate);
    setDate(nextValidDate);
    setBookingMonth(nextValidDate.slice(0, 7));
    setSearchParams({ date: nextValidDate }, { replace: true });
  };

  const totalMinutes = selectedSlots.length * 30;
  const durationLabel = totalMinutes
    ? String(Math.floor(totalMinutes / 60)) + 'h' + String(totalMinutes % 60).padStart(2, '0')
    : '0h00';
  const bottomBookingBar = true;

  return (
    <div className="min-h-dvh overflow-hidden bg-[#f8fbf4] text-[#0b2228]">
      <main className="flex min-h-dvh flex-col">
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[linear-gradient(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%)] px-3 py-2 text-white shadow-[0_8px_20px_rgba(8,29,36,0.12)]">
          <Link
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 text-[13px] font-bold text-white transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-white/16 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e2ff57] active:translate-y-px"
            to="/book-court"
          >
            <ArrowLeft className="h-4 w-4" />
            Chọn cụm sân khác
          </Link>

          <div className="flex min-w-0 flex-1 items-center justify-center px-2 text-center">
            <h1 className="truncate text-[15px] font-black text-white">
              {availability?.venueName ?? 'Lịch sân Picklink'}
            </h1>
          </div>

          <div className="grid grid-cols-[minmax(150px,1fr)_auto] gap-2">
            <Input
              className="h-9 rounded-md border-white/20 bg-white/18 text-[13px] font-bold text-white [color-scheme:dark]"
              icon={<CalendarDays className="h-4 w-4" />}
              min={localDate()}
              max={maxScheduleDate()}
              onChange={(event) => changeDate(event.target.value)}
              type="date"
              value={date}
            />
            <Button
              aria-busy={isLoading}
              className={buttonBase + ' h-9 rounded-md bg-[#e2ff57] text-[#102414] hover:bg-[#d6f64d]'}
              disabled={isLoading}
              onClick={() => void load()}
              type="button"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {error && (
          <motion.div
            {...motionProps}
            className="border-b border-error/25 bg-error-container px-4 py-3 text-[13px] font-bold leading-5 text-error"
            role="alert"
          >
            {error}
          </motion.div>
        )}

        <section className="flex min-h-0 flex-1 flex-col bg-[#eef8e6]">
          {isLoading && (
            <div className="flex min-h-[360px] flex-1 items-center justify-center gap-3 p-8 text-[14px] font-bold text-[#66766d]">
              <Loader2 className="h-5 w-5 animate-spin text-[#276b3f] motion-reduce:animate-none" />
              Đang kiểm tra slot...
            </div>
          )}

          {!isLoading && availability?.courts.length === 0 && (
            <div className="p-10 text-center">
              <p className="text-[18px] font-extrabold">Chưa có sân con khả dụng</p>
              <p className="mt-2 text-[13px] font-medium text-[#66766d]">Vui lòng chọn ngày khác hoặc làm mới lịch.</p>
            </div>
          )}

          {!isLoading && availability && availability.courts.length > 0 && (
            <>
              <div className="min-h-0 flex-1 overflow-hidden">
                <CourtTimelineGrid
                  availability={availability}
                  disabledSlotKeys={unavailableSlotKeysForDate}
                  onSelectSlot={selectSlot}
                  selectedSlotKeys={selectedSlotKeys}
                />
              </div>
              <div className="border-b border-[#dbe8d3] bg-[#f8fbf4] px-3 py-3">
                <div className="mx-auto max-w-5xl rounded-xl border border-[#d8e4d4] bg-[#f7faf5] p-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="min-w-[160px] flex-1">
                      <span className="mb-1 block text-[12px] font-bold text-[#526158]">Áp dụng slot ngày này cho cả tháng</span>
                      <input
                        className="h-10 w-full rounded-lg border border-[#d8e4d4] bg-white px-3 text-[13px] font-bold text-[#0b2228] outline-none focus:border-[#276b3f]"
                        max={maxScheduleDate().slice(0, 7)}
                        min={localDate().slice(0, 7)}
                        onChange={(event) => setBookingMonth(event.target.value)}
                        type="month"
                        value={bookingMonth}
                      />
                    </label>
                    <Button
                      aria-busy={isApplyingMonth}
                      className="h-10 rounded-xl bg-[#0b2228] px-3 text-[12px] font-bold text-white hover:bg-[#173a41]"
                      disabled={isApplyingMonth || !bookingMonth || !selectedSlotsForDate.length}
                      onClick={() => void applyCurrentSlotsToMonth()}
                      type="button"
                    >
                      {isApplyingMonth ? 'ĐANG KIỂM TRA...' : 'ÁP DỤNG CẢ THÁNG'}
                    </Button>
                  </div>
                  <p className="mt-2 text-[12px] font-medium text-[#718077]">
                    Đổi ngày để chọn slot riêng từng ngày. Khi áp dụng cả tháng, các slot đang chọn được sao chép cho mọi ngày còn lại trong tháng.
                  </p>
                  {monthUnavailableSlots.length > 0 && (
                    <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950">
                      <p className="flex items-center gap-2 text-[12px] font-extrabold">
                        <AlertCircle className="h-4 w-4" />
                        Slot không còn trống ({monthUnavailableSlots.length})
                      </p>
                      <div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">
                        {monthUnavailableSlots.map((slot) => (
                          <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold" key={slotIdentity(slot.courtId, slot.startTime, slot.endTime)}>
                            Sân {slot.courtNumber} · {dateLabel(slot.date)} · {time(slot.startTime)}-{time(slot.endTime)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedDates.length > 0 && (
                    <div className="mt-3 max-h-64 overflow-y-auto pr-1">
                      <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                        {selectedDates.map((selectedDate) => (
                          <div
                            className={'flex items-start justify-between gap-2 rounded-lg border px-2 py-1.5 text-[11px] font-bold ' + (selectedDate === date ? 'border-primary bg-[#eef8e6] text-primary' : 'border-[#d8e4d4] bg-white text-[#526158]')}
                            key={selectedDate}
                          >
                            <button className="min-w-0 flex-1 text-left" onClick={() => changeDate(selectedDate)} type="button">
                              <span className="block truncate">{dateLabel(selectedDate)}</span>
                              <span className="mt-1 block text-[10px]">{selectedSlotsByDate[selectedDate].length} slot</span>
                            </button>
                            <button aria-label={'Bỏ ngày ' + selectedDate} onClick={() => removeSelectedDate(selectedDate)} type="button">
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <p className="mt-3 text-[12px] font-extrabold text-[#276b3f]">
                    Tổng booking: {selectedSlots.length} slot · {selectedDates.length} ngày
                  </p>
                </div>
              </div>


            </>
          )}
        </section>

        <div className="bottomBookingBar sticky bottom-0 z-20 rounded-t-xl bg-[linear-gradient(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%)] px-3 pb-3 pt-2 text-white shadow-[0_-14px_34px_rgba(8,29,36,0.18)]" data-layout={bottomBookingBar ? 'bottom-booking-bar' : undefined}>
          <div className="mx-auto mb-3 h-5 w-10 text-center text-[18px] font-black leading-5 text-white/88">⌄</div>
          <div className="mb-2 flex items-center justify-between gap-4 text-[16px] font-black sm:text-[18px]">
            <span>Tổng giờ: {durationLabel}</span>
            <span className="text-right">Tổng tiền: {currency.format(estimatedCourtAmount)}</span>
          </div>
          <Button
            aria-busy={isHolding}
            className="h-12 w-full rounded-md bg-[#e2ff57] text-[16px] font-black text-[#102414] shadow-none hover:bg-[#d6f64d] disabled:bg-[#aebd5a]"
            disabled={(!selectedSlots.length && !resumableHoldingBookingId) || isHolding}
            onClick={() => void createHold()}
            type="button"
          >
            {isHolding ? 'ĐANG GIỮ CHỖ...' : resumableHoldingBookingId ? 'TIẾP TỤC THANH TOÁN' : 'TIẾP THEO'}
          </Button>
        </div>
      </main>
    </div>
  );
};