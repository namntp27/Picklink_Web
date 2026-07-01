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
  Sparkles,
} from 'lucide-react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { createBookingHolding, getCourtAvailability, type AvailabilitySlot, type CourtAvailability } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
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
  available: 'border-primary-fixed-dim/70 bg-primary-fixed/40 text-primary',
  selected: 'border-primary-container bg-primary-container text-on-primary',
  mine: 'border-secondary-container bg-secondary-container/35 text-secondary',
  unavailable: 'border-outline-variant bg-surface-container text-on-surface-variant',
};

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
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.38, ease: 'easeOut' as const },
      };

  const load = async (showLoading = true) => {
    if (!Number.isInteger(venueId)) return;
    if (showLoading) setIsLoading(true);
    setError('');
    try {
      setAvailability(await getCourtAvailability(venueId, date, token));
      setSelectedCourtId(null);
      setSelectedStarts([]);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải lịch sân.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [venueId, date, token]);

  useScheduleRealtime((notification) => {
    if (notification.venueId === venueId && notification.startTime.slice(0, 10) === date) void load(false);
  });

  useVenueRealtime((notification) => {
    if (notification.venueId === venueId) void load(false);
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
    <div className="min-h-screen overflow-x-hidden bg-surface-container-low px-4 py-6 text-on-surface md:px-10 md:py-8">
      <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-5">
        <Link
          className="inline-flex w-fit items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 text-[13px] font-bold text-primary shadow-[0_10px_24px_rgba(25,29,20,0.04)] transition hover:-translate-y-px hover:border-primary-fixed-dim hover:bg-primary-fixed/25 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/60 active:translate-y-px"
          to="/book-court"
        >
          <ArrowLeft className="h-4 w-4" />
          Chọn cụm sân khác
        </Link>

        <motion.section
          {...motionProps}
          className="relative overflow-hidden rounded-[28px] border border-primary-fixed-dim/60 bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] p-5 text-on-primary shadow-[0_22px_60px_rgba(152,217,81,0.18)] md:p-7"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary-fixed/30 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/4 h-52 w-52 rounded-full bg-secondary-container/30 blur-3xl" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.18em] text-primary-fixed">
                <Sparkles className="h-4 w-4" />
                Chọn ngày và slot
              </p>
              <h1 className="mt-4 text-[32px] font-black leading-tight tracking-[-0.04em] text-white md:text-[46px]">
                {availability?.venueName ?? 'Lịch sân Picklink'}
              </h1>
              <p className="mt-3 flex max-w-xl items-start gap-2 text-[14px] font-semibold leading-6 text-white/78">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary-fixed" />
                <span className="break-words">{availability?.address ?? 'Chọn ngày để xem tình trạng sân theo thời gian thực.'}</span>
              </p>
            </div>

            <div className="grid min-w-0 gap-3 rounded-2xl border border-white/15 bg-white/12 p-3 backdrop-blur md:min-w-[420px] md:grid-cols-[1fr_auto]">
              <Input
                className="border-white/20 bg-white text-on-surface hover:border-primary-fixed-dim focus:border-primary-fixed-dim focus:ring-primary-fixed/30"
                icon={<CalendarDays className="h-5 w-5" />}
                min={localDate()}
                onChange={(event) => changeDate(event.target.value)}
                type="date"
                value={date}
              />
              <Button
                aria-busy={isLoading}
                className="h-12 bg-primary-fixed-dim text-primary hover:bg-primary-fixed"
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
            className="rounded-2xl border border-error-container bg-error-container/20 p-4 text-[13px] font-bold leading-6 text-on-error-container"
            role="alert"
          >
            {error}
          </motion.div>
        )}

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <motion.div
            {...motionProps}
            className="min-w-0 overflow-hidden rounded-[28px] border border-outline-variant bg-surface-container-lowest shadow-[0_16px_44px_rgba(25,29,20,0.06)]"
          >
            <div className="flex flex-col gap-4 border-b border-outline-variant p-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-[22px] font-black tracking-[-0.02em] text-on-surface">Slot 30 phút</h2>
                <p className="mt-1 text-[13px] font-medium text-on-surface-variant">
                  {availability ? `${availability.openTime} - ${availability.closeTime}` : 'Đang đồng bộ lịch'} · chỉ chọn trên cùng một sân
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                {[
                  ['available', 'Còn trống'],
                  ['mine', 'Đang giữ của bạn'],
                  ['unavailable', 'Không khả dụng'],
                  ['selected', 'Đã chọn'],
                ].map(([key, label]) => (
                  <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 ${chipStyles[key]}`} key={key}>
                    <span className="h-2 w-2 rounded-full bg-current" />
                    {label}
                  </span>
                ))}
              </div>
            </div>

            {isLoading && (
              <div className="flex min-h-[360px] items-center justify-center gap-3 p-8 text-[14px] font-bold text-on-surface-variant">
                <Loader2 className="h-5 w-5 animate-spin text-primary motion-reduce:animate-none" />
                Đang kiểm tra slot...
              </div>
            )}

            {!isLoading && availability?.courts.length === 0 && (
              <div className="p-10 text-center">
                <p className="text-[18px] font-black text-on-surface">Chưa có sân con khả dụng</p>
                <p className="mt-2 text-[13px] font-medium text-on-surface-variant">Vui lòng chọn ngày khác hoặc làm mới lịch.</p>
              </div>
            )}

            {!isLoading && availability && availability.courts.length > 0 && (
              <div className="divide-y divide-outline-variant">
                {availability.courts.map((court, index) => (
                  <motion.article
                    animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                    className="grid min-w-0 gap-4 p-5 lg:grid-cols-[210px_minmax(0,1fr)]"
                    initial={prefersReducedMotion ? undefined : { opacity: 0, y: 10 }}
                    key={court.courtId}
                    transition={{ delay: index * 0.03, duration: 0.28 }}
                  >
                    <div className="min-w-0 rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                      <p className="text-[12px] font-black uppercase tracking-[0.16em] text-primary">Sân con</p>
                      <h3 className="mt-1 text-[20px] font-black tracking-[-0.02em] text-on-surface">Sân {court.courtNumber}</h3>
                      <p className="mt-2 text-[13px] font-semibold text-on-surface-variant">
                        {court.courtType} · {court.isIndoor ? 'Trong nhà' : 'Ngoài trời'}
                      </p>
                      <p className="mt-3 text-[15px] font-black text-primary">{currency.format(court.hourlyPrice)}/giờ</p>
                    </div>

                    <div className="grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                      {availability.slots
                        .filter((slot) => slot.courtId === court.courtId)
                        .map((slot) => {
                          const selected = selectedCourtId === court.courtId && selectedStarts.includes(time(slot.startTime));
                          const past = new Date(slot.startTime).getTime() <= Date.now();
                          const resumableHolding = slot.status === 'Holding' && Boolean(slot.isOwnedByCurrentUser && slot.bookingId);
                          const disabled = !resumableHolding && (slot.status !== 'Available' || past);
                          const slotStyle = selected
                            ? 'border-primary-container bg-primary-container text-on-primary-container shadow-[0_10px_20px_rgba(152,217,81,0.18)]'
                            : resumableHolding
                              ? 'border-secondary-container bg-secondary-container/35 text-secondary hover:bg-secondary-container/55'
                              : disabled
                                ? 'cursor-not-allowed border-outline-variant bg-surface-container text-outline'
                                : 'border-primary-fixed-dim/70 bg-primary-fixed/25 text-primary hover:border-primary-container hover:bg-primary-fixed/45 hover:shadow-[0_8px_18px_rgba(152,217,81,0.16)]';

                          return (
                            <button
                              className={`min-w-0 rounded-xl border px-2.5 py-3 text-[13px] font-black transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/60 active:translate-y-px disabled:opacity-60 ${slotStyle}`}
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
            className="h-fit min-w-0 space-y-4 rounded-[28px] border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_16px_44px_rgba(25,29,20,0.06)] xl:sticky xl:top-24"
          >
            <div>
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-primary">Tóm tắt</p>
              <h2 className="mt-1 text-[24px] font-black tracking-[-0.03em] text-on-surface">Lựa chọn của bạn</h2>
            </div>

            <div className="space-y-3 rounded-2xl border border-outline-variant bg-surface-container-low p-4 text-[13px]">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-on-surface-variant">Sân con</span>
                <strong className="text-right text-on-surface">{selectedCourt ? `Sân ${selectedCourt.courtNumber}` : 'Chưa chọn'}</strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-on-surface-variant">Thời gian</span>
                <strong className="text-right text-on-surface">
                  {selectedSlots.length ? `${time(selectedSlots[0].startTime)} - ${time(selectedSlots.at(-1)!.endTime)}` : 'Chưa chọn'}
                </strong>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-on-surface-variant">Thời lượng</span>
                <strong className="text-right text-on-surface">{durationHours} giờ</strong>
              </div>
              <div className="flex items-end justify-between gap-4 border-t border-outline-variant pt-3">
                <span className="font-semibold text-on-surface-variant">Tiền sân</span>
                <strong className="text-right text-[24px] font-black tracking-[-0.03em] text-primary">{currency.format(estimatedCourtAmount)}</strong>
              </div>
            </div>

            <div className="rounded-2xl border border-primary-fixed-dim/60 bg-primary-fixed/20 p-4 text-[12px] font-semibold leading-5 text-on-surface-variant">
              <Info className="mr-1 inline h-4 w-4 text-primary" />
              Backend sẽ tính lại: đơn giá sân nhân với thời lượng. Không có phí dịch vụ hoặc giảm giá.
            </div>

            <Button
              aria-busy={isHolding}
              className="h-[54px] w-full rounded-2xl text-[15px] shadow-[0_14px_26px_rgba(152,217,81,0.18)]"
              disabled={!selectedSlots.length || isHolding}
              onClick={() => void createHold()}
              type="button"
            >
              <ShieldCheck className="h-5 w-5" />
              {isHolding ? 'Đang kiểm tra và giữ slot...' : 'Giữ chỗ 5 phút & thanh toán'}
            </Button>

            <p className="text-center text-[11px] font-semibold leading-5 text-on-surface-variant">
              <Clock className="mr-1 inline h-3.5 w-3.5" />
              Backend kiểm tra chống trùng trong transaction.
            </p>
          </motion.aside>
        </section>
      </div>
    </div>
  );
};
