import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  Clock,
  CreditCard,
  Filter,
  Loader2,
  MapPin,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  Star,
  TicketCheck,
  XCircle,
} from 'lucide-react';
import { cancelPlayerBooking, getMyBookingHistory, retryBookingPayment, type BookingHolding } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { PaginationControls } from '../../components/PaginationControls';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { CancelBookingDialog } from './components/CancelBookingDialog';
import './my-bookings.css';

type BookingFilter = 'all' | 'upcoming' | 'pending' | 'paid' | 'cancelled';

const filterOptions: Array<{ label: string; value: BookingFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Sắp tới', value: 'upcoming' },
  { label: 'Cần thanh toán', value: 'pending' },
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Đã hủy / hết hạn', value: 'cancelled' },
];

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const date = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value));
const time = (value: string) => value.slice(11, 16);

const bookingLabels: Record<string, string> = {
  Holding: 'Đang giữ chỗ',
  Confirmed: 'Đã đặt',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
};
const paymentLabels: Record<string, string> = {
  Pending: 'Chờ chuyển khoản',
  WaitingForConfirmation: 'Chờ Owner xác nhận',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
};
const checkInLabels: Record<string, string> = {
  NotOpen: 'Chưa mở check-in',
  Ready: 'Có thể check-in',
  CheckedIn: 'Đã check-in',
  NoShow: 'Vắng mặt',
  Missed: 'Quá giờ',
  NotApplicable: 'Không áp dụng',
};

const statusClass = (status: string) => {
  if (status === 'Confirmed' || status === 'Paid' || status === 'Ready' || status === 'CheckedIn') {
    return 'border-primary-container bg-primary-container/25 text-primary';
  }
  if (status === 'Holding' || status === 'Pending' || status === 'WaitingForConfirmation' || status === 'NotOpen') {
    return 'border-outline-variant bg-surface-container-high text-on-surface-variant';
  }
  return 'border-error/25 bg-error-container text-error';
};

const matchesFilter = (booking: BookingHolding, filter: BookingFilter) => {
  if (filter === 'all') return true;
  if (filter === 'upcoming') return !['Cancelled', 'Expired'].includes(booking.status) && new Date(booking.endTime).getTime() >= Date.now();
  if (filter === 'pending') return ['Pending', 'WaitingForConfirmation'].includes(booking.paymentStatus);
  if (filter === 'paid') return booking.paymentStatus === 'Paid';
  return booking.status === 'Cancelled' || booking.status === 'Expired';
};

const linkButtonBase = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]';
const primaryLinkButton = `${linkButtonBase} border border-primary-container bg-primary-container text-on-primary-container shadow-[0_5px_14px_rgba(152,217,81,0.18)] hover:border-primary-fixed-dim hover:bg-primary-fixed-dim hover:shadow-[0_7px_16px_rgba(152,217,81,0.24)]`;
const outlineLinkButton = `${linkButtonBase} border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary-container hover:bg-surface-container-low hover:text-primary`;

export const MyBookings = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [bookings, setBookings] = useState<BookingHolding[]>([]);
  const [activeFilter, setActiveFilter] = useState<BookingFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [cancelTarget, setCancelTarget] = useState<BookingHolding | null>(null);
  const shouldReduceMotion = useReducedMotion();

  const load = async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    setError('');
    try {
      const result = await getMyBookingHistory(token, { page, pageSize: 10 });
      setBookings(result.items);
      setPagination(result);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải lịch sử đặt sân.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [page, token]);
  useScheduleRealtime(() => { void load(false); });
  usePaymentRealtime(() => { void load(false); });

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const searchable = `${booking.bookingCode} ${booking.venueName} ${booking.address} ${booking.courtNumber}`.toLowerCase();
      return matchesFilter(booking, activeFilter) && (!keyword || searchable.includes(keyword));
    });
  }, [activeFilter, bookings, search]);

  const nextBooking = useMemo(() => bookings
    .filter((booking) => !['Cancelled', 'Expired'].includes(booking.status) && new Date(booking.endTime).getTime() >= Date.now())
    .sort((first, second) => first.startTime.localeCompare(second.startTime))[0], [bookings]);
  const paidCount = bookings.filter((booking) => booking.paymentStatus === 'Paid').length;
  const pendingCount = bookings.filter((booking) => ['Pending', 'WaitingForConfirmation'].includes(booking.paymentStatus)).length;
  const readyCount = bookings.filter((booking) => booking.checkInStatus === 'Ready').length;

  const cancel = async (reason: string) => {
    if (!token || !cancelTarget) return;
    setBusyId(cancelTarget.bookingId);
    setError('');
    try {
      await cancelPlayerBooking(token, cancelTarget.bookingId, reason);
      setCancelTarget(null);
      await load(false);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể hủy booking.');
    } finally {
      setBusyId(null);
    }
  };

  const retryPayment = async (booking: BookingHolding) => {
    if (!token) return;
    setBusyId(booking.bookingId);
    setError('');
    try {
      const updatedBooking = await retryBookingPayment(token, booking.bookingId);
      navigate(
        `/checkout?bookingId=${booking.bookingId}&date=${encodeURIComponent(booking.startTime.slice(0, 10))}`,
        { state: { booking: updatedBooking } },
      );
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể thanh toán lại.');
    } finally {
      setBusyId(null);
    }
  };

  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 12 };

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-on-surface" data-bookings-ui>
      <section className="hero-gradient relative overflow-hidden px-4 py-5 text-on-primary sm:px-6 md:py-6">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 opacity-15">
            <div className="absolute inset-x-0 top-1/2 h-px bg-on-primary" />
            <div className="absolute inset-y-0 left-1/4 w-px bg-on-primary" />
            <div className="absolute inset-y-0 right-1/4 w-px bg-on-primary" />
            <div className="absolute left-[12%] right-[12%] top-[22%] h-px bg-on-primary/70" />
            <div className="absolute bottom-[22%] left-[12%] right-[12%] h-px bg-on-primary/70" />
          </div>
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto grid max-w-[1120px] gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end"
          initial={revealInitial}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-on-primary/20 bg-on-primary/12 px-4 py-2 text-[13px] font-bold">
              <ReceiptText className="h-4 w-4 text-primary-fixed" />
              Lịch sử đặt sân
            </p>
            <h1 className="mt-5 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Booking{' '}
              <span className="inline-block text-[1.12em] text-primary-fixed [text-shadow:0_0_8px_rgba(152,217,81,0.65),0_0_18px_rgba(152,217,81,0.38)]">
                của tôi
              </span>
            </h1>
            <p className="mt-4 max-w-[65ch] text-[15px] font-medium leading-7 text-on-primary/88 md:text-[17px]">
              Theo dõi booking, thanh toán và trạng thái check-in bằng dữ liệu cập nhật trực tiếp từ hệ thống.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-on-primary/15 bg-on-primary/12 p-4 backdrop-blur-sm">
            {[
              ['Đã thanh toán', paidCount],
              ['Cần xử lý', pendingCount],
              ['Có thể check-in', readyCount],
            ].map(([label, value]) => (
              <div className="min-w-0" key={label}>
                <p className="text-[26px] font-extrabold text-primary-fixed">{value}</p>
                <p className="mt-1 text-[11px] font-medium leading-4 text-on-primary/75">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      <main className="mx-auto grid max-w-[1180px] gap-4 px-4 py-4 sm:px-6 md:py-6 lg:grid-cols-[minmax(0,1fr)_288px]">
        <div className="min-w-0 space-y-5">
          {error && (
            <div className="flex gap-2 rounded-lg border border-error/25 bg-error-container p-4 text-[14px] font-bold text-error" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}

          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0_12px_30px_rgba(25,29,20,0.06)]">
            <div className="flex flex-col gap-4">
              <Input
                icon={<Search className="h-5 w-5" />}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm mã booking, sân, địa chỉ..."
                value={search}
              />
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
                <Filter className="h-5 w-5 shrink-0 text-primary" />
                {filterOptions.map((option) => (
                  <button
                    className={`shrink-0 rounded-lg border px-3 py-2 text-[13px] font-bold transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99] ${
                      activeFilter === option.value
                        ? 'border-primary-container bg-primary-container text-on-primary'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-primary-container hover:bg-surface-container-low hover:text-primary'
                    }`}
                    key={option.value}
                    onClick={() => setActiveFilter(option.value)}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {loading ? (
            <div className="flex justify-center rounded-2xl border border-outline-variant bg-surface-container-lowest py-20 shadow-[0_12px_30px_rgba(25,29,20,0.06)]">
              <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
            </div>
          ) : (
            <section className="space-y-4">
              {filtered.map((booking) => {
                const canContinue = booking.status === 'Holding' && ['Pending', 'WaitingForConfirmation'].includes(booking.paymentStatus);
                const canCancel = booking.canCancel;
                const scheduleDate = booking.startTime.slice(0, 10);
                const isBusy = busyId === booking.bookingId;

                return (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-3.5 shadow-[0_12px_30px_rgba(25,29,20,0.06)]"
                    data-motion-managed
                    initial={revealInitial}
                    key={booking.bookingId}
                    transition={{ duration: shouldReduceMotion ? 0.01 : 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          {[booking.status, booking.paymentStatus, booking.checkInStatus].map((status) => (
                            <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusClass(status)}`} key={status}>
                              {bookingLabels[status] ?? paymentLabels[status] ?? checkInLabels[status] ?? status}
                            </span>
                          ))}
                        </div>
                        <Link
                          className="mt-2.5 block min-w-0 break-words text-[17px] font-extrabold leading-tight transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
                          to={`/bookings/${booking.bookingId}`}
                        >
                          {booking.venueName} · Sân {booking.courtNumber}
                        </Link>
                        <p className="mt-1 break-all text-[13px] font-bold text-primary">{booking.bookingCode}</p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                          {[
                            { icon: CalendarDays, label: 'Ngày chơi', value: date(booking.startTime) },
                            { icon: Clock, label: 'Khung giờ', value: `${time(booking.startTime)} - ${time(booking.endTime)}` },
                            { icon: MapPin, label: 'Địa chỉ', value: booking.address },
                          ].map((item) => (
                            <div className="flex min-w-0 gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-3" key={item.label}>
                              <item.icon className="h-5 w-5 shrink-0 text-primary" />
                              <div className="min-w-0">
                                <p className="text-[11px] font-bold text-on-surface-variant">{item.label}</p>
                                <p className="mt-1 break-words text-[13px] font-bold leading-5">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="h-fit shrink-0 rounded-xl border border-outline-variant bg-surface-container-low p-4 xl:w-[220px]">
                        <p className="text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">Tổng tiền</p>
                        <p className="mt-1 break-words text-[19px] font-extrabold text-primary">{currency.format(booking.totalAmount)}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 border-t border-outline-variant pt-4">
                      <Link className={outlineLinkButton} to={`/bookings/${booking.bookingId}`}>
                        <ReceiptText className="h-4 w-4" /> Chi tiết
                      </Link>
                      {canContinue && !booking.canRetryPayment && (
                        <Link className={primaryLinkButton} to={`/checkout?bookingId=${booking.bookingId}&date=${encodeURIComponent(scheduleDate)}`}>
                          <CreditCard className="h-4 w-4" />
                          {booking.paymentStatus === 'WaitingForConfirmation' ? 'Xem trạng thái xác nhận' : 'Thanh toán'}
                        </Link>
                      )}
                      {booking.canRetryPayment && (
                        <Button aria-busy={isBusy} disabled={isBusy} onClick={() => void retryPayment(booking)} size="sm" type="button">
                          <RefreshCcw className="h-4 w-4" />
                          Thanh toán lại
                        </Button>
                      )}
                      {canCancel && (
                        <Button disabled={isBusy} onClick={() => setCancelTarget(booking)} size="sm" type="button" variant="danger">
                          {isBusy ? <Loader2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                          Hủy booking
                        </Button>
                      )}
                      {booking.canReview && (
                        <Link className={outlineLinkButton} to={`/reviews/create?bookingId=${booking.bookingId}`}>
                          <Star className="h-4 w-4" /> Đánh giá sân
                        </Link>
                      )}
                      <Link className={outlineLinkButton} to={`/court/${booking.venueId}/schedule?date=${encodeURIComponent(scheduleDate)}`}>
                        <RefreshCcw className="h-4 w-4" /> Xem lịch sân
                      </Link>
                    </div>
                  </motion.article>
                );
              })}

              {filtered.length === 0 && (
                <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-12 text-center shadow-[0_12px_30px_rgba(25,29,20,0.06)]">
                  <CalendarDays className="mx-auto h-10 w-10 text-primary" />
                  <h2 className="mt-3 text-[20px] font-extrabold">Không có booking phù hợp</h2>
                  <p className="mt-2 text-[14px] text-on-surface-variant">Hãy đổi bộ lọc hoặc đặt một sân mới.</p>
                </div>
              )}

              <PaginationControls page={pagination} onPageChange={setPage} />
            </section>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-2xl border border-primary-container bg-surface-container-lowest p-3.5 shadow-[0_12px_30px_rgba(25,29,20,0.06)]">
            <h2 className="flex items-center gap-2 text-[20px] font-extrabold">
              <ShieldCheck className="h-5 w-5 text-primary" /> Lịch gần nhất
            </h2>
            {nextBooking ? (
              <div className="mt-4">
                <p className="break-words font-bold">{nextBooking.venueName} · Sân {nextBooking.courtNumber}</p>
                <p className="mt-2 text-[13px] leading-6 text-on-surface-variant">
                  {date(nextBooking.startTime)} · {time(nextBooking.startTime)} - {time(nextBooking.endTime)}
                </p>
                <Link className={`mt-4 w-full ${primaryLinkButton}`} to={`/bookings/${nextBooking.bookingId}`}>
                  Xem booking
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-[14px] text-on-surface-variant">Bạn chưa có lịch sắp tới.</p>
            )}
          </section>

          <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-3.5 shadow-[0_12px_30px_rgba(25,29,20,0.06)]">
            <h2 className="flex items-center gap-2 text-[18px] font-extrabold">
              <TicketCheck className="h-5 w-5 text-primary" /> Trạng thái realtime
            </h2>
            <p className="mt-3 text-[13px] leading-6 text-on-surface-variant">
              Khi Owner xác nhận thanh toán, danh sách và trạng thái check-in sẽ tự cập nhật mà không cần F5.
            </p>
          </section>

          <Link className={`w-full ${primaryLinkButton}`} to="/book-court">
            <CalendarDays className="h-5 w-5" />
            Đặt sân mới
          </Link>
        </aside>
      </main>

      {cancelTarget && (
        <CancelBookingDialog
          bookingCode={cancelTarget.bookingCode}
          isBusy={busyId === cancelTarget.bookingId}
          onClose={() => setCancelTarget(null)}
          onConfirm={cancel}
        />
      )}
    </div>
  );
};
