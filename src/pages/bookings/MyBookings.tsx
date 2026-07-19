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
    return 'border-green-200 bg-green-100 text-green-700';
  }
  if (status === 'Holding' || status === 'Pending' || status === 'WaitingForConfirmation' || status === 'NotOpen') {
    return 'border-outline-variant bg-surface-container-high text-on-surface-variant';
  }
  return 'border-error/25 bg-error-container text-error';
};

const getBookingRange = (booking: BookingHolding, now = Date.now()) => {
  const groups = booking.checkInGroups
    .filter((group) => !['CheckedIn', 'NoShow'].includes(group.checkInStatus));
  const ranges = (groups.length > 0
    ? groups
    : booking.checkInGroups.length > 0
      ? booking.checkInGroups
      : booking.slots.length > 0
        ? booking.slots
        : [booking])
    .slice()
    .sort((first, second) => first.startTime.localeCompare(second.startTime));
  return ranges.find((range) => new Date(range.startTime).getTime() - 30 * 60_000 <= now && new Date(range.endTime).getTime() >= now)
    ?? ranges.find((range) => new Date(range.endTime).getTime() >= now)
    ?? ranges[ranges.length - 1];
};

const matchesFilter = (booking: BookingHolding, filter: BookingFilter) => {
  if (filter === 'all') return true;
  if (filter === 'upcoming') return !['Cancelled', 'Expired'].includes(booking.status) && new Date(getBookingRange(booking).endTime).getTime() >= Date.now();
  if (filter === 'pending') return ['Pending', 'WaitingForConfirmation'].includes(booking.paymentStatus);
  if (filter === 'paid') return booking.paymentStatus === 'Paid';
  return booking.status === 'Cancelled' || booking.status === 'Expired';
};

const linkButtonBase = 'inline-flex min-h-8 items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#e2ff57]/75 active:translate-y-px active:scale-[0.99]';
const primaryLinkButton = `${linkButtonBase} border border-[#e2ff57] bg-[#e2ff57] text-[#081d24] shadow-[0_5px_14px_rgba(226,255,87,0.18)] hover:border-[#d6f64d] hover:bg-[#d6f64d] hover:shadow-[0_7px_16px_rgba(226,255,87,0.24)]`;
const outlineLinkButton = `${linkButtonBase} border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-[#e2ff57] hover:bg-[#081d24] hover:text-[#e2ff57]`;

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
  usePaymentRealtime((event) => {
    setBookings((current) => current.map((booking) => event.bookingId === booking.bookingId
      ? {
        ...booking,
        paymentStatus: event.paymentStatus,
        status: event.paymentStatus === 'Paid' ? 'Confirmed' : booking.status,
      }
      : booking));
    void load(false);
  });

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      const searchable = `${booking.bookingCode} ${booking.venueName} ${booking.address} ${booking.courtNumber}`.toLowerCase();
      return matchesFilter(booking, activeFilter) && (!keyword || searchable.includes(keyword));
    });
  }, [activeFilter, bookings, search]);

  const nextBooking = useMemo(() => bookings
    .filter((booking) => !['Cancelled', 'Expired'].includes(booking.status) && new Date(getBookingRange(booking).endTime).getTime() >= Date.now())
    .sort((first, second) => getBookingRange(first).startTime.localeCompare(getBookingRange(second).startTime))[0], [bookings]);
  const nextBookingRange = nextBooking ? getBookingRange(nextBooking) : null;
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
      const range = getBookingRange(updatedBooking);
      navigate(
        `/checkout?bookingId=${booking.bookingId}&date=${encodeURIComponent(range.startTime.slice(0, 10))}`,
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
      <section className="px-4 pt-[88px] sm:px-6 sm:pt-[92px] lg:px-8" data-bookings-summary>
        <div className="mx-auto grid max-w-[1180px] gap-2 sm:grid-cols-3">
          {[
            { label: 'Đã thanh toán', value: paidCount, icon: CreditCard },
            { label: 'Cần xử lý', value: pendingCount, icon: AlertCircle },
            { label: 'Có thể check-in', value: readyCount, icon: TicketCheck },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <div
                className="flex min-h-14 items-center gap-2.5 rounded-xl bg-[#081d24] px-3 py-2 text-white shadow-[0_8px_20px_rgba(25,29,20,0.05)] ring-1 ring-[#e2ff57]/35"
                key={item.label}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e2ff57] text-[#081d24]">
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-mono text-[18px] font-bold leading-none text-[#e2ff57]">{item.value}</span>
                  <span className="mt-0.5 block text-[12px] font-bold text-white/72">{item.label}</span>
                </span>
              </div>
            );
          })}
        </div>
      </section>
      <main className="mx-auto grid max-w-[1180px] gap-3 px-4 py-3 sm:px-6 md:py-4 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-3">
          {error && (
            <div className="flex gap-2 rounded-lg border border-error/25 bg-error-container p-4 text-[14px] font-bold text-error" role="alert">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}

          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3 shadow-[0_8px_20px_rgba(25,29,20,0.05)]">
            <div className="flex flex-col gap-2.5">
              <Input
                icon={<Search className="h-5 w-5" />}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tìm mã booking, sân, địa chỉ..."
                value={search}
              />
              <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1">
                <Filter className="h-5 w-5 shrink-0 text-[#081d24]" />
                {filterOptions.map((option) => (
                  <button
                    className={`shrink-0 rounded-lg border px-2.5 py-1.5 text-[12px] font-bold transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99] ${
                      activeFilter === option.value
                        ? 'border-[#e2ff57] bg-[#081d24] text-[#e2ff57]'
                        : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-[#e2ff57] hover:bg-[#081d24] hover:text-[#e2ff57]'
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
            <div className="flex justify-center rounded-xl border border-outline-variant bg-surface-container-lowest py-14 shadow-[0_8px_20px_rgba(25,29,20,0.05)]">
              <Loader2 className="h-8 w-8 animate-spin text-[#081d24] motion-reduce:animate-none" />
            </div>
          ) : (
            <section className="space-y-3">
              {filtered.map((booking) => {
                const canContinue = booking.status === 'Holding' && ['Pending', 'WaitingForConfirmation'].includes(booking.paymentStatus);
                const canCancel = booking.canCancel && booking.paymentStatus !== 'Paid';
                const displayRange = getBookingRange(booking);
                const scheduleDate = displayRange.startTime.slice(0, 10);
                const isBusy = busyId === booking.bookingId;

                return (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl bg-surface-container-lowest p-3 shadow-[0_8px_20px_rgba(25,29,20,0.05)] ring-1 ring-outline-variant/80 transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(25,29,20,0.08)]"
                    data-motion-managed
                    initial={revealInitial}
                    key={booking.bookingId}
                    transition={{ duration: shouldReduceMotion ? 0.01 : 0.25, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <div className="flex flex-col gap-3 xl:flex-row xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          {[booking.status, booking.paymentStatus, booking.checkInStatus].map((status) => (
                            <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${statusClass(status)}`} key={status}>
                              {bookingLabels[status] ?? paymentLabels[status] ?? checkInLabels[status] ?? status}
                            </span>
                          ))}
                        </div>
                        <Link
                          className="mt-2 block min-w-0 break-words text-[15px] font-extrabold leading-tight transition-colors hover:text-[#081d24] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e2ff57]/75"
                          to={`/bookings/${booking.bookingId}`}
                        >
                          {booking.venueName} · Sân {booking.courtNumber}
                        </Link>
                        <p className="mt-0.5 break-all text-[12px] font-bold text-[#081d24]">{booking.bookingCode}</p>
                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                          {[
                            { icon: CalendarDays, label: 'Ngày chơi', value: date(displayRange.startTime) },
                            { icon: Clock, label: 'Khung giờ', value: `${time(displayRange.startTime)} - ${time(displayRange.endTime)}` },
                            { icon: MapPin, label: 'Địa chỉ', value: booking.address },
                          ].map((item) => (
                            <div className="flex min-w-0 gap-2 rounded-lg border border-outline-variant bg-surface-container-low p-2" key={item.label}>
                              <item.icon className="h-4 w-4 shrink-0 text-[#081d24]" />
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-on-surface-variant">{item.label}</p>
                                <p className="mt-0.5 break-words text-[12px] font-bold leading-5">{item.value}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="h-fit shrink-0 rounded-lg border border-[#e2ff57]/40 bg-[#081d24] p-3 text-white xl:w-[180px]">
                        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-white/60">Tổng tiền</p>
                        <p className="mt-1 break-words text-[17px] font-extrabold text-[#e2ff57]">{currency.format(booking.totalAmount)}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 border-t border-outline-variant pt-3">
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
                <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 text-center shadow-[0_8px_20px_rgba(25,29,20,0.05)]">
                  <CalendarDays className="mx-auto h-10 w-10 text-[#081d24]" />
                  <h2 className="mt-3 text-[20px] font-extrabold">Không có booking phù hợp</h2>
                  <p className="mt-2 text-[14px] text-on-surface-variant">Hãy đổi bộ lọc hoặc đặt một sân mới.</p>
                </div>
              )}

              <PaginationControls page={pagination} onPageChange={setPage} />
            </section>
          )}
        </div>

        <aside className="space-y-3 lg:sticky lg:top-[92px] lg:self-start">
          <section className="rounded-xl border border-[#e2ff57]/60 bg-surface-container-lowest p-3 shadow-[0_8px_20px_rgba(25,29,20,0.05)]">
            <h2 className="flex items-center gap-2 text-[17px] font-extrabold">
              <ShieldCheck className="h-5 w-5 text-[#081d24]" /> Lịch gần nhất
            </h2>
            {nextBooking && nextBookingRange ? (
              <div className="mt-3">
                <p className="break-words text-[14px] font-bold">{nextBooking.venueName} · Sân {nextBooking.courtNumber}</p>
                <p className="mt-1.5 text-[12px] leading-5 text-on-surface-variant">
                  {date(nextBookingRange.startTime)} · {time(nextBookingRange.startTime)} - {time(nextBookingRange.endTime)}
                </p>
                <Link className={`mt-3 w-full ${primaryLinkButton}`} to={`/bookings/${nextBooking.bookingId}`}>
                  Xem booking
                </Link>
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-on-surface-variant">Bạn chưa có lịch sắp tới.</p>
            )}
          </section>

          <section className="rounded-xl bg-surface-container-lowest p-3 shadow-[0_8px_20px_rgba(25,29,20,0.05)] ring-1 ring-outline-variant/80 transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(25,29,20,0.08)]">
            <h2 className="flex items-center gap-2 text-[17px] font-extrabold">
              <TicketCheck className="h-5 w-5 text-[#081d24]" /> Trạng thái realtime
            </h2>
            <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">
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
