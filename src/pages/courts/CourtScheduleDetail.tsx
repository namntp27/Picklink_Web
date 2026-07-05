import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Info,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createBookingHolding, getCourtAvailability, type AvailabilitySlot, type CourtAvailability } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useScheduleRealtime, type ScheduleRealtimeEvent } from '../../hooks/useScheduleRealtime';
import { useVenueRealtime } from '../../hooks/useVenueRealtime';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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

const unavailableLabel: Record<string, string> = {
  Holding: 'Đang được giữ',
  Booked: 'Đã đặt',
  Blocked: 'Đã khóa',
  Maintenance: 'Bảo trì',
  Event: 'Sự kiện',
  Closed: 'Đóng cửa',
};

const chipStyles: Record<string, string> = {
  available: 'border-[#b9dca8] bg-[#eef8e6] text-primary',
  selected: 'border-[#0b2228] bg-[#0b2228] text-white',
  mine: 'border-[#dbe8d3] bg-[#e2ff57] text-[#102414]',
  unavailable: 'border-[#dbe8d3] bg-white text-[#8a968f]',
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

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#f8fbf4] text-[#0b2228]">
      <main className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <motion.section
          {...motionProps}
          className="rounded-2xl border border-[#dbe8d3] bg-white p-3 shadow-[0_14px_34px_rgba(18,45,34,0.07)]"
          data-motion-managed
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.72fr)] lg:items-end">
            <div className="min-w-0">
              <Link
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#dbe8d3] bg-white px-3 text-[13px] font-bold text-primary transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#eef8e6] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px"
                to="/book-court"
              >
                <ArrowLeft className="h-4 w-4" />
                Chọn cụm sân khác
              </Link>
              <h1 className="mt-3 text-[clamp(1.55rem,2.7vw,2.25rem)] font-extrabold leading-tight tracking-[-0.035em]">
                {availability?.venueName ?? 'Lịch sân Picklink'}
              </h1>
              <p className="mt-1 flex max-w-3xl items-start gap-2 text-[13px] font-semibold leading-5 text-[#66766d]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="break-words">{availability?.address ?? 'Chọn ngày để xem tình trạng sân theo thời gian thực.'}</span>
              </p>
            </div>

            <div className="grid gap-2 rounded-2xl border border-[#dbe8d3] bg-[#f8fbf4] p-2 sm:grid-cols-[1fr_auto]">
              <Input
                className="h-10 rounded-xl border-[#dbe8d3] bg-white text-[13px]"
                icon={<CalendarDays className="h-5 w-5" />}
                min={localDate()}
                onChange={(event) => changeDate(event.target.value)}
                type="date"
                value={date}
              />
              <Button
                aria-busy={isLoading}
                className={`${buttonBase} bg-[#0b2228] text-white hover:bg-[#14333a]`}
                disabled={isLoading}
                onClick={() => void load()}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                Làm mới
              </Button>
            </div>
          </div>
        </motion.section>

        {error && (
          <motion.div
            {...motionProps}
            className="rounded-xl border border-error/25 bg-error-container px-4 py-3 text-[13px] font-bold leading-5 text-error"
            role="alert"
          >
            {error}
          </motion.div>
        )}

        <section className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_340px]">
          <motion.div
            {...motionProps}
            className="flex min-h-[560px] min-w-0 flex-col overflow-hidden rounded-2xl border border-[#dbe8d3] bg-white shadow-[0_14px_34px_rgba(18,45,34,0.07)] xl:min-h-0"
          >
            <div className="flex flex-col gap-3 border-b border-[#dbe8d3] p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-[18px] font-extrabold tracking-[-0.02em]">Slot 30 phút</h2>
                <p className="mt-1 text-[12px] font-semibold text-[#66766d]">
                  {availability ? `${availability.openTime} - ${availability.closeTime}` : 'Đang đồng bộ lịch'} - chỉ chọn trên cùng một sân
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                {[
                  ['available', 'Còn trống'],
                  ['mine', 'Đang giữ'],
                  ['unavailable', 'Không khả dụng'],
                  ['selected', 'Đã chọn'],
                ].map(([key, label]) => (
                  <span className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-2 ${chipStyles[key]}`} key={key}>
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {isLoading && (
              <div className="flex min-h-[360px] flex-1 items-center justify-center gap-3 p-8 text-[14px] font-bold text-[#66766d]">
                <Loader2 className="h-5 w-5 animate-spin text-primary motion-reduce:animate-none" />
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
              <div className="min-h-0 flex-1 overflow-y-auto">
                {availability.courts.map((court, index) => (
                  <motion.article
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    className="grid min-w-0 gap-3 border-b border-[#dbe8d3] p-4 lg:grid-cols-[180px_minmax(0,1fr)]"
                    data-motion-managed
                    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                    key={court.courtId}
                    transition={{ delay: index * 0.025, duration: 0.22 }}
                  >
                    <div className="min-w-0 rounded-xl bg-[#f8fbf4] p-3">
                      <p className="text-[12px] font-black text-primary">Sân con</p>
                      <h3 className="mt-1 text-[19px] font-extrabold tracking-[-0.02em]">Sân {court.courtNumber}</h3>
                      <p className="mt-1 text-[12px] font-semibold text-[#66766d]">
                        {court.courtType} - {court.isIndoor ? 'Trong nhà' : 'Ngoài trời'}
                      </p>
                      <p className="mt-2 text-[14px] font-black text-primary">{currency.format(court.hourlyPrice)}/giờ</p>
                    </div>

                    <div className="grid min-w-0 grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 2xl:grid-cols-6">
                      {availability.slots
                        .filter((slot) => slot.courtId === court.courtId)
                        .map((slot) => {
                          const selected = selectedCourtId === court.courtId && selectedStarts.includes(time(slot.startTime));
                          const past = new Date(slot.startTime).getTime() <= Date.now();
                          const resumableHolding = slot.status === 'Holding' && Boolean(slot.isOwnedByCurrentUser && slot.bookingId);
                          const disabled = !resumableHolding && (slot.status !== 'Available' || past);
                          const slotStyle = selected
                            ? 'border-[#0b2228] bg-[#0b2228] text-white shadow-[0_10px_20px_rgba(8,29,36,0.16)]'
                            : resumableHolding
                              ? 'border-[#dbe8d3] bg-[#e2ff57] text-[#102414] hover:bg-[#d6f64d]'
                              : disabled
                                ? 'cursor-not-allowed border-[#dbe8d3] bg-white text-[#9aa39d]'
                                : 'border-[#b9dca8] bg-[#eef8e6] text-primary hover:border-primary-container hover:bg-[#e2ff57] hover:text-[#102414]';

                          return (
                            <button
                              className={`min-w-0 rounded-xl border px-2 py-2.5 text-[12px] font-black transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px disabled:opacity-60 ${slotStyle}`}
                              disabled={disabled}
                              key={`${court.courtId}-${slot.startTime}`}
                              onClick={() => selectSlot(slot)}
                              title={
                                resumableHolding
                                  ? 'Tiếp tục thanh toán hoặc xem trạng thái xác nhận'
                                  : past
                                    ? 'Đã qua'
                                    : unavailableLabel[slot.status] ?? 'Còn trống'
                              }
                              type="button"
                            >
                              <span className="block truncate">{time(slot.startTime)}</span>
                            </button>
                          );
                        })}
                    </div>
                  </motion.article>
                ))}
              </div>
            )}
          </motion.div>

          <motion.aside
            {...motionProps}
            className="h-fit min-w-0 rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] xl:sticky xl:top-4"
          >
            <div className="rounded-2xl bg-[#0b2228] p-4 text-white">
              <p className="text-[12px] font-black text-[#e2ff57]">Tóm tắt</p>
              <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.035em]">Lựa chọn của bạn</h2>
            </div>

            <div className="mt-4 space-y-3 rounded-2xl bg-[#f8fbf4] p-4 text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-[#66766d]">Sân con</span>
                <strong className="text-right">{selectedCourt ? `Sân ${selectedCourt.courtNumber}` : 'Chưa chọn'}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-[#66766d]">Thời gian</span>
                <strong className="text-right">
                  {selectedSlots.length ? `${time(selectedSlots[0].startTime)} - ${time(selectedSlots.at(-1)!.endTime)}` : 'Chưa chọn'}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-[#66766d]">Thời lượng</span>
                <strong className="text-right">{durationHours} giờ</strong>
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-[#dbe8d3] pt-3">
                <span className="font-semibold text-[#66766d]">Tiền sân</span>
                <strong className="text-right text-[24px] font-black tracking-[-0.03em] text-primary">{currency.format(estimatedCourtAmount)}</strong>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-[#dbe8d3] bg-[#eef8e6] p-3 text-[12px] font-semibold leading-5 text-[#53645a]">
              <Info className="mr-1 inline h-4 w-4 text-primary" />
              Backend sẽ tính lại đơn giá sân nhân với thời lượng. Không có phí dịch vụ hoặc giảm giá.
            </div>

            <Button
              aria-busy={isHolding}
              className="mt-4 h-11 w-full rounded-xl bg-[#e2ff57] text-[14px] font-black text-[#102414] shadow-[0_12px_24px_rgba(152,217,81,0.2)] hover:bg-[#d6f64d]"
              disabled={!selectedSlots.length || isHolding}
              onClick={() => void createHold()}
              type="button"
            >
              <ShieldCheck className="h-5 w-5" />
              {isHolding ? 'Đang giữ slot...' : 'Giữ chỗ 5 phút'}
            </Button>

            <p className="mt-3 text-center text-[11px] font-semibold leading-5 text-[#66766d]">
              <Clock className="mr-1 inline h-3.5 w-3.5" />
              Hệ thống kiểm tra chống trùng trong transaction.
            </p>
          </motion.aside>
        </section>
      </main>
    </div>
  );
};
