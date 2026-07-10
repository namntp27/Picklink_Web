import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  TicketCheck,
  Star,
  XCircle,
} from 'lucide-react';
import { cancelPlayerBooking, getBookingHolding, retryBookingPayment, type BookingHolding } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { Button } from '../../components/ui/Button';
import { CancelBookingDialog } from './components/CancelBookingDialog';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const playDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value));
const time = (value: string) => value.slice(11, 16);
const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short', timeStyle: 'short',
}).format(new Date(value));

const bookingStatusLabels: Record<string, string> = {
  Holding: 'Đang giữ chỗ',
  Confirmed: 'Đã đặt',
  Completed: 'Hoàn thành',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
};
const paymentStatusLabels: Record<string, string> = {
  Pending: 'Chờ chuyển khoản',
  WaitingForConfirmation: 'Chờ Owner xác nhận',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
};
const checkInStatusLabels: Record<string, string> = {
  NotOpen: 'Chưa mở check-in',
  Ready: 'Có thể check-in',
  CheckedIn: 'Đã check-in',
  NoShow: 'Vắng mặt',
  Missed: 'Quá giờ',
  NotApplicable: 'Không áp dụng',
};

const statusClassName = (status: string) => {
  if (status === 'Confirmed' || status === 'Paid' || status === 'Ready' || status === 'CheckedIn') {
    return 'border-[#e2ff57]/70 bg-[#e2ff57] text-[#102414]';
  }
  if (status === 'Holding' || status === 'Pending' || status === 'WaitingForConfirmation') {
    return 'border-white/18 bg-white/10 text-white/82';
  }
  return 'border-red-200/30 bg-red-500/15 text-red-50';
};

const linkButtonBase = 'inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]';
const primaryLinkButton = `${linkButtonBase} border border-[#e2ff57] bg-[#e2ff57] text-[#102414] shadow-[0_14px_30px_rgba(152,217,81,0.24)] hover:border-[#d6f64d] hover:bg-[#d6f64d]`;
const outlineLinkButton = `${linkButtonBase} border border-outline-variant bg-white text-on-surface hover:border-primary-container hover:bg-[#f0f8e8] hover:text-primary`;

export const BookingDetail = () => {
  const navigate = useNavigate();
  const bookingId = Number(useParams().id);
  const { token } = useAuth();
  const [booking, setBooking] = useState<BookingHolding | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const load = async (silent = false) => {
    if (!token || !Number.isInteger(bookingId)) {
      setError('Mã booking không hợp lệ.');
      setLoading(false);
      return;
    }
    try {
      setBooking(await getBookingHolding(token, bookingId));
      setError('');
    } catch (requestError) {
      if (!silent) setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải chi tiết booking.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [bookingId, token]);
  usePaymentRealtime((event) => {
    if (event.bookingId === bookingId) void load(true);
  });
  useScheduleRealtime((event) => {
    if (booking && event.venueId === booking.venueId && event.courtId === booking.courtId) void load(true);
  });

  const copyCode = async () => {
    if (!booking) return;
    await navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const cancel = async (reason: string) => {
    if (!token || !booking) return;
    setBusy(true);
    try {
      await cancelPlayerBooking(token, booking.bookingId, reason);
      setShowCancelDialog(false);
      await load(true);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể hủy booking.');
    } finally {
      setBusy(false);
    }
  };

  const retryPayment = async () => {
    if (!token || !booking) return;
    setBusy(true);
    try {
      const updatedBooking = await retryBookingPayment(token, booking.bookingId);
      navigate(
        `/checkout?bookingId=${booking.bookingId}&date=${encodeURIComponent(booking.startTime.slice(0, 10))}`,
        { state: { booking: updatedBooking } },
      );
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể thanh toán lại.');
    } finally {
      setBusy(false);
    }
  };

  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 12 };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fbf4] px-4">
        <div className="rounded-2xl bg-white p-6 text-center shadow-[0_14px_34px_rgba(18,45,34,0.07)] ring-1 ring-outline-variant/80">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
          <p className="mt-3 font-bold text-on-surface">Đang tải chi tiết booking...</p>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fbf4] px-4">
        <div className="max-w-md rounded-2xl bg-white p-8 text-center shadow-[0_14px_34px_rgba(18,45,34,0.07)] ring-1 ring-error/25">
          <XCircle className="mx-auto h-12 w-12 text-error" />
          <h1 className="mt-3 text-[22px] font-extrabold">Không thể mở booking</h1>
          <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">
            {error || 'Booking không tồn tại hoặc không thuộc tài khoản của bạn.'}
          </p>
          <Link className={`mt-5 ${primaryLinkButton}`} to="/my-bookings">
            Về booking của tôi
          </Link>
        </div>
      </div>
    );
  }

  const scheduleDate = booking.startTime.slice(0, 10);
  const canContinuePayment = booking.status === 'Holding'
    && (booking.paymentStatus === 'Pending' || booking.paymentStatus === 'WaitingForConfirmation');

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f8fbf4] text-on-background">
      <main className="bg-[#f8fbf4] pb-8">
        <section className="relative overflow-hidden bg-[#081d24] px-4 pb-8 pt-4 text-white sm:px-6 lg:px-8">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(152,217,81,0.22),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(225,255,87,0.16),transparent_28%),linear-gradient(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%)]" />
            <div className="absolute inset-x-0 bottom-0 h-20 bg-[linear-gradient(to_top,rgba(248,251,244,1),rgba(248,251,244,0))]" />
            <div className="absolute left-[7%] top-16 h-px w-[86%] bg-white/10" />
            <div className="absolute bottom-10 left-[8%] h-px w-[84%] bg-white/10" />
          </div>

          <div className="relative mx-auto max-w-[1180px]">
            <Link className="inline-flex min-h-9 items-center gap-2 rounded-lg px-1 text-[13px] font-bold text-white/84 transition-[background-color,color,transform] duration-200 hover:-translate-y-px hover:bg-white/8 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e2ff57]/75 active:translate-y-px" to="/my-bookings">
              <ArrowLeft className="h-4 w-4" /> Booking của tôi
            </Link>
          </div>
        </section>

        <div className="mx-auto -mt-8 max-w-[1180px] px-4 sm:px-6 lg:px-8">
          {error && (
            <div className="mt-4 rounded-lg border border-error/25 bg-error-container px-4 py-3 text-[13px] font-bold text-error" role="alert">
              {error}
            </div>
          )}

        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="overflow-hidden rounded-2xl bg-white shadow-[0_14px_34px_rgba(18,45,34,0.07)] ring-1 ring-outline-variant/80"
          data-booking-detail-compact
          data-booking-detail-hero
          data-motion-managed
          initial={revealInitial}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="relative overflow-hidden bg-[#081d24] px-4 py-4 text-white md:px-5 md:py-5">
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_16%_18%,rgba(152,217,81,0.2),transparent_28%),linear-gradient(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%)]" />
              <div className="absolute inset-x-0 top-1/2 h-px bg-white/10" />
              <div className="absolute inset-y-0 left-[25%] w-px bg-white/10" />
              <div className="absolute inset-y-0 right-[25%] w-px bg-white/10" />
            </div>

            <div className="relative z-10 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap gap-2">
                  {[booking.status, booking.paymentStatus, booking.checkInStatus].map((status) => (
                    <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${statusClassName(status)}`} key={status}>
                      {bookingStatusLabels[status] ?? paymentStatusLabels[status] ?? checkInStatusLabels[status] ?? status}
                    </span>
                  ))}
                </div>
                <h1 className="mt-3 text-[clamp(1.55rem,3vw,2.35rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
                  {booking.venueName}{' '}
                  <span className="inline-block text-[1.12em] text-[#e2ff57] [text-shadow:0_0_8px_rgba(152,217,81,0.45),0_0_18px_rgba(152,217,81,0.22)]">
                    Sân {booking.courtNumber}
                  </span>
                </h1>
                <p className="mt-2 flex max-w-[65ch] items-start gap-2 text-[13px] font-medium leading-5 text-white/78">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#e2ff57]" />
                  <span className="break-words">{booking.address}</span>
                </p>
              </div>

              <div className="min-w-0 rounded-xl border border-white/14 bg-white/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/68">Mã booking</p>
                    <strong className="mt-1 block min-w-0 break-all text-[16px] leading-5 text-[#e2ff57]">{booking.bookingCode}</strong>
                  </div>
                  <button
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[#e2ff57] transition-[background-color,transform] duration-200 hover:bg-white/12 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e2ff57]/75 active:translate-y-px active:scale-[0.99]"
                    onClick={() => void copyCode()}
                    title="Sao chép mã booking"
                    type="button"
                  >
                    {copied ? <CheckCircle2 className="h-5 w-5" /> : <Clipboard className="h-5 w-5" />}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-white/64">Tạo lúc {dateTime(booking.createdAt)}</p>
              </div>
            </div>
          </div>

          <div className="grid border-t border-outline-variant bg-white sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-outline-variant">
            {[
              { icon: CalendarDays, label: 'Ngày chơi', value: playDate(booking.startTime) },
              { icon: Clock, label: 'Khung giờ', value: `${time(booking.startTime)} - ${time(booking.endTime)}` },
              { icon: Building2, label: 'Sân con', value: `Sân ${booking.courtNumber}` },
              { icon: CreditCard, label: 'Thanh toán', value: paymentStatusLabels[booking.paymentStatus] ?? booking.paymentStatus },
              { icon: TicketCheck, label: 'Check-in', value: checkInStatusLabels[booking.checkInStatus] ?? booking.checkInStatus },
            ].map((item) => (
              <div className="min-w-0 border-b border-outline-variant p-3 last:border-b-0 sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0" key={item.label}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e8f8cf] text-primary">
                  <item.icon className="h-4 w-4" />
                </span>
                <p className="mt-2 text-[11px] font-semibold text-on-surface-variant">{item.label}</p>
                <p className="mt-0.5 break-words text-[13px] font-bold leading-5">{item.value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="rounded-2xl bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] ring-1 ring-outline-variant/80">
            <h2 className="flex items-center gap-2 text-[18px] font-extrabold">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f8cf] text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              Tiến trình booking
            </h2>
            <div className="mt-4 divide-y divide-outline-variant border-y border-outline-variant">
              {booking.statusHistory.map((entry, index) => (
                <div className="flex gap-3 py-3" key={`${entry.changedAt}-${index}`}>
                  <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${entry.toStatus === 'Cancelled' || entry.toStatus === 'Expired' ? 'bg-error-container text-error' : 'bg-primary-container/25 text-primary'}`}>
                    {entry.toStatus === 'Cancelled' || entry.toStatus === 'Expired' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold">{bookingStatusLabels[entry.toStatus] ?? entry.toStatus}</p>
                    <p className="mt-0.5 break-words text-[12px] text-on-surface-variant">
                      {dateTime(entry.changedAt)}{entry.reason ? ` · ${entry.reason}` : ''}
                    </p>
                  </div>
                </div>
              ))}
              {booking.checkedInAt && (
                <div className="flex gap-3 py-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-container/25 text-primary"><TicketCheck className="h-4 w-4" /></span>
                  <div>
                    <p className="text-[14px] font-bold">Đã check-in</p>
                    <p className="mt-0.5 text-[12px] text-on-surface-variant">{dateTime(booking.checkedInAt)} · Player đã check-in tại sân</p>
                  </div>
                </div>
              )}
              {booking.statusHistory.length === 0 && !booking.checkedInAt && <p className="py-4 text-[14px] text-on-surface-variant">Chưa có lịch sử trạng thái.</p>}
            </div>
          </section>

          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <section className="rounded-2xl bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] ring-1 ring-outline-variant/80">
              <h2 className="flex items-center gap-2 text-[18px] font-extrabold">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#e8f8cf] text-primary">
                  <ReceiptText className="h-4 w-4" />
                </span>
                Chi phí
              </h2>
              <div className="mt-4 space-y-2 text-[13px]">
                <div className="flex justify-between gap-3"><span className="text-on-surface-variant">Đơn giá</span><strong>{currency.format(booking.hourlyPrice)}/giờ</strong></div>
                <div className="flex justify-between gap-3"><span className="text-on-surface-variant">Thời lượng</span><strong>{booking.durationHours} giờ</strong></div>
                <div className="flex justify-between gap-3"><span className="text-on-surface-variant">Tiền sân</span><strong>{currency.format(booking.courtAmount)}</strong></div>
                <div className="flex items-end justify-between gap-3 border-t border-outline-variant pt-3"><strong>Tổng thanh toán</strong><strong className="text-right text-[20px] text-primary">{currency.format(booking.totalAmount)}</strong></div>
              </div>
            </section>

            <section className="rounded-2xl bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] ring-1 ring-outline-variant/80">
              <h2 className="text-[18px] font-extrabold">Thao tác</h2>
              <div className="mt-3 space-y-2">
                {canContinuePayment && !booking.canRetryPayment && (
                  <Link className={primaryLinkButton} to={`/checkout?bookingId=${booking.bookingId}&date=${encodeURIComponent(scheduleDate)}`}>
                    <CreditCard className="h-5 w-5" />
                    {booking.paymentStatus === 'WaitingForConfirmation' ? 'Xem trạng thái xác nhận' : 'Tiếp tục thanh toán'}
                  </Link>
                )}
                {booking.canRetryPayment && (
                  <Button aria-busy={busy} className="w-full" disabled={busy} onClick={() => void retryPayment()} type="button">
                    <RefreshCcw className="h-5 w-5" />
                    Thanh toán lại
                  </Button>
                )}
                {booking.canReview && (
                  <Link className={outlineLinkButton} to={`/reviews/create?bookingId=${booking.bookingId}`}>
                    <Star className="h-5 w-5" />
                    Đánh giá sân
                  </Link>
                )}
                {booking.canCancel && (
                  <Button className="w-full" disabled={busy} onClick={() => setShowCancelDialog(true)} type="button" variant="danger">
                    <XCircle className="h-5 w-5" />
                    Hủy booking
                  </Button>
                )}
                <Link className={outlineLinkButton} to={`/court/${booking.venueId}/schedule?date=${encodeURIComponent(scheduleDate)}`}>
                  <CalendarDays className="h-5 w-5" />
                  Xem lịch sân
                </Link>
              </div>
            </section>
          </aside>
        </div>
        </div>
      </main>

      {showCancelDialog && (
        <CancelBookingDialog
          bookingCode={booking.bookingCode}
          isBusy={busy}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={cancel}
        />
      )}
    </div>
  );
};
