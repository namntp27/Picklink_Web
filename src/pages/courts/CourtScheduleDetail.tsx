import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  CalendarDays,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createBookingHolding, getCourtAvailability, type AvailabilitySlot, type CourtAvailability } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useScheduleRealtime, type ScheduleRealtimeEvent } from '../../hooks/useScheduleRealtime';
import { useVenueRealtime } from '../../hooks/useVenueRealtime';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CourtTimelineGrid } from './components/CourtTimelineGrid';

const localDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const validScheduleDate = (value: string | null) =>
  value && /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= localDate() ? value : localDate();

const time = (value: string) => value.slice(11, 16);

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const minuteOfDay = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};


const buttonBase = 'h-10 rounded-xl px-3 text-[13px] font-bold';

export const CourtScheduleDetail = () => {
  const venueId = Number(useParams().id);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();
  const prefersReducedMotion = useReducedMotion();
  const [date, setDate] = useState(() => validScheduleDate(searchParams.get('date')));
  const [availability, setAvailability] = useState<CourtAvailability | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [selectedStarts, setSelectedStarts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [error, setError] = useState('');

  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const },
      };

  const load = async (showLoading = true, resetSelection = true) => {
    if (!Number.isInteger(venueId)) return;
    if (showLoading) setIsLoading(true);
    if (showLoading) setError('');
    try {
      setAvailability(await getCourtAvailability(venueId, date, token));
      if (resetSelection) {
        setSelectedCourtId(null);
        setSelectedStarts([]);
      }
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải lịch sân.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [venueId, date, token]);

  const notificationTouchesSelection = (notification: ScheduleRealtimeEvent) => {
    if (!selectedCourtId || !selectedStarts.length) return false;
    if (notification.venueId !== venueId || notification.courtId !== selectedCourtId || notification.startTime.slice(0, 10) !== date) return false;

    const changedStart = minuteOfDay(notification.startTime.slice(11, 16));
    const changedEnd = minuteOfDay(notification.endTime.slice(11, 16));
    return selectedStarts.some((slotStart) => {
      const selectedStart = minuteOfDay(slotStart);
      return selectedStart < changedEnd && selectedStart + 30 > changedStart;
    });
  };

  useScheduleRealtime((notification) => {
    if (notification.venueId !== venueId || notification.startTime.slice(0, 10) !== date) return;
    if (notification.action !== 'Deleted' && notificationTouchesSelection(notification)) {
      setSelectedCourtId(null);
      setSelectedStarts([]);
      setError('Khung giờ bạn vừa chọn đã được cập nhật và không còn trống. Vui lòng chọn slot khác.');
    }
    void load(false, false);
  });

  useVenueRealtime((notification) => {
    if (notification.venueId === venueId) void load(false, false);
  });

  const selectedCourt = availability?.courts.find((court) => court.courtId === selectedCourtId);
  const selectedSlots = useMemo(
    () =>
      availability?.slots
        .filter((slot) => slot.courtId === selectedCourtId && selectedStarts.includes(time(slot.startTime)))
        .sort((first, second) => first.startTime.localeCompare(second.startTime)) ?? [],
    [availability, selectedCourtId, selectedStarts],
  );
  const durationHours = selectedSlots.length * 0.5;
  const estimatedCourtAmount = (selectedCourt?.hourlyPrice ?? 0) * durationHours;

  useEffect(() => {
    if (!selectedStarts.length || isLoading) return;
    const hasInvalidSelection = selectedSlots.length !== selectedStarts.length
      || selectedSlots.some((slot) => slot.status !== 'Available' || new Date(slot.startTime).getTime() <= Date.now());
    if (!hasInvalidSelection) return;
    setSelectedCourtId(null);
    setSelectedStarts([]);
    setError('Khung giờ bạn vừa chọn đã được cập nhật và không còn trống. Vui lòng chọn slot khác.');
  }, [isLoading, selectedSlots, selectedStarts.length]);

  const selectSlot = (slot: AvailabilitySlot) => {
    if (slot.status === 'Holding' && slot.isOwnedByCurrentUser && slot.bookingId) {
      navigate(`/checkout?bookingId=${slot.bookingId}&date=${encodeURIComponent(date)}`);
      return;
    }
    if (slot.status !== 'Available' || new Date(slot.startTime).getTime() <= Date.now()) return;
    const slotTime = time(slot.startTime);
    if (selectedCourtId !== slot.courtId) {
      setSelectedCourtId(slot.courtId);
      setSelectedStarts([slotTime]);
      setError('');
      return;
    }
    if (selectedStarts.includes(slotTime)) {
      const sorted = [...selectedStarts].sort();
      setSelectedStarts(slotTime === sorted[0] || slotTime === sorted.at(-1) ? sorted.filter((item) => item !== slotTime) : [slotTime]);
      return;
    }
    const candidate = [...selectedStarts, slotTime].sort();
    const consecutive = candidate.every((item, index) => index === 0 || minuteOfDay(item) - minuteOfDay(candidate[index - 1]) === 30);
    if (consecutive) {
      setSelectedStarts(candidate);
      setError('');
    } else {
      setSelectedStarts([slotTime]);
      setError('Chỉ được chọn các slot liên tiếp. Hệ thống đã bắt đầu một lựa chọn mới.');
    }
  };

  const createHold = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!selectedCourtId || selectedStarts.length === 0) return;
    setIsHolding(true);
    setError('');
    try {
      const booking = await createBookingHolding(token, {
        courtId: selectedCourtId,
        date,
        slotStarts: selectedStarts.map((item) => `${item}:00`),
      });
      navigate(`/checkout?bookingId=${booking.bookingId}&date=${encodeURIComponent(date)}`, { state: { booking } });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể giữ slot. Vui lòng tải lại lịch.');
      await load();
    } finally {
      setIsHolding(false);
    }
  };

  const changeDate = (nextDate: string) => {
    setDate(nextDate);
    setSearchParams({ date: nextDate }, { replace: true });
  };

  const totalMinutes = selectedSlots.length * 30;
  const durationLabel = totalMinutes
    ? `${Math.floor(totalMinutes / 60)}h${String(totalMinutes % 60).padStart(2, '0')}`
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
              onChange={(event) => changeDate(event.target.value)}
              type="date"
              value={date}
            />
            <Button
              aria-busy={isLoading}
              className={`${buttonBase} h-9 rounded-md bg-[#e2ff57] text-[#102414] hover:bg-[#d6f64d]`}
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
            <div className="min-h-0 flex-1 overflow-hidden">
              <CourtTimelineGrid
                availability={availability}
                onSelectSlot={selectSlot}
                selectedCourtId={selectedCourtId}
                selectedStarts={selectedStarts}
              />
            </div>
          )}
        </section>

        <div className="bottomBookingBar sticky bottom-0 z-20 rounded-t-xl bg-[linear-gradient(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%)] px-3 pb-3 pt-2 text-white shadow-[0_-14px_34px_rgba(8,29,36,0.18)]" data-layout={bottomBookingBar ? 'bottom-booking-bar' : undefined}>
          <div className="mx-auto mb-3 h-5 w-10 text-center text-[18px] font-black leading-5 text-white/88">⌃</div>
          <div className="mb-2 flex items-center justify-between gap-4 text-[16px] font-black sm:text-[18px]">
            <span>Tổng giờ: {durationLabel}</span>
            <span className="text-right">Tổng tiền: {currency.format(estimatedCourtAmount)}</span>
          </div>
          <Button
            aria-busy={isHolding}
            className="h-12 w-full rounded-md bg-[#e2ff57] text-[16px] font-black text-[#102414] shadow-none hover:bg-[#d6f64d] disabled:bg-[#aebd5a]"
            disabled={!selectedSlots.length || isHolding}
            onClick={() => void createHold()}
            type="button"
          >
            {isHolding ? 'ĐANG GIỮ CHỖ...' : 'TIẾP THEO'}
          </Button>
        </div>
      </main>
    </div>
  );
};