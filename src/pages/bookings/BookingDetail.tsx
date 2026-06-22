import React, { useEffect, useState } from 'react';
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
  if (status === 'Confirmed' || status === 'Paid' || status === 'Ready' || status === 'CheckedIn') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Holding' || status === 'Pending' || status === 'WaitingForConfirmation') return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-700';
};

export const BookingDetail = () => {
  const navigate = useNavigate();
  const bookingId = Number(useParams().id);
  const { token } = useAuth();
  const [booking, setBooking] = useState<BookingHolding | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

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
  useEffect(() => {
    if (booking?.paymentStatus !== 'WaitingForConfirmation') return;
    const timer = window.setInterval(() => void load(true), 5000);
    return () => window.clearInterval(timer);
  }, [booking?.paymentStatus, bookingId, token]);

  const copyCode = async () => {
    if (!booking) return;
    await navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const cancel = async () => {
    if (!token || !booking || !window.confirm(`Hủy booking ${booking.bookingCode}?`)) return;
    setBusy(true);
    try { await cancelPlayerBooking(token, booking.bookingId); await load(true); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể hủy booking.'); }
    finally { setBusy(false); }
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
    } catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể thanh toán lại.'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="flex min-h-screen items-center justify-center bg-surface-container-low"><div className="text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /><p className="mt-3 font-bold">Đang tải chi tiết booking...</p></div></div>;

  if (!booking) return <div className="flex min-h-screen items-center justify-center bg-surface-container-low px-4"><div className="max-w-md rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm"><XCircle className="mx-auto h-12 w-12 text-red-600" /><h1 className="mt-3 text-[22px] font-bold">Không thể mở booking</h1><p className="mt-2 text-[14px] text-on-surface-variant">{error || 'Booking không tồn tại hoặc không thuộc tài khoản của bạn.'}</p><Link className="mt-5 inline-flex rounded-lg bg-primary px-5 py-3 font-bold text-white" to="/my-bookings">Về booking của tôi</Link></div></div>;

  const scheduleDate = booking.startTime.slice(0, 10);
  const canContinuePayment = booking.status === 'Holding'
    && (booking.paymentStatus === 'Pending' || booking.paymentStatus === 'WaitingForConfirmation');

  return <div className="min-h-screen bg-surface-container-low text-on-surface">
    <header className="border-b border-outline-variant bg-primary text-white"><div className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-4"><Link className="text-[24px] font-bold" to="/">Picklink</Link><span className="rounded-lg bg-white/15 px-3 py-2 text-[13px] font-bold">Chi tiết booking</span></div></header>

    <main className="mx-auto max-w-[1180px] px-4 py-8">
      <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary" to="/my-bookings"><ArrowLeft className="h-4 w-4" /> Booking của tôi</Link>

      {error && <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}

      <section className="mt-5 rounded-2xl border border-outline-variant bg-white p-6 shadow-sm md:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-[12px] font-bold ${statusClassName(booking.status)}`}>{bookingStatusLabels[booking.status] ?? booking.status}</span><span className={`rounded-full px-3 py-1 text-[12px] font-bold ${statusClassName(booking.paymentStatus)}`}>{paymentStatusLabels[booking.paymentStatus] ?? booking.paymentStatus}</span><span className={`rounded-full px-3 py-1 text-[12px] font-bold ${statusClassName(booking.checkInStatus)}`}>{checkInStatusLabels[booking.checkInStatus] ?? booking.checkInStatus}</span></div>
            <h1 className="mt-4 text-[30px] font-bold md:text-[42px]">{booking.venueName}</h1>
            <p className="mt-2 flex items-start gap-2 text-[14px] text-on-surface-variant"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{booking.address}</p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 lg:w-[330px]"><p className="text-[11px] font-bold uppercase text-on-surface-variant">Mã booking</p><div className="mt-2 flex items-center justify-between gap-3"><strong className="break-all text-[18px] text-primary">{booking.bookingCode}</strong><button className="rounded-lg p-2 text-primary hover:bg-primary/10" onClick={() => void copyCode()} title="Sao chép mã booking" type="button">{copied ? <CheckCircle2 className="h-5 w-5" /> : <Clipboard className="h-5 w-5" />}</button></div><p className="mt-3 text-[12px] text-on-surface-variant">Tạo lúc {dateTime(booking.createdAt)}</p></div>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { icon: CalendarDays, label: 'Ngày chơi', value: playDate(booking.startTime) },
            { icon: Clock, label: 'Khung giờ', value: `${time(booking.startTime)}–${time(booking.endTime)}` },
            { icon: Building2, label: 'Sân con', value: `Sân ${booking.courtNumber}` },
            { icon: CreditCard, label: 'Thanh toán', value: paymentStatusLabels[booking.paymentStatus] ?? booking.paymentStatus },
            { icon: TicketCheck, label: 'Check-in', value: checkInStatusLabels[booking.checkInStatus] ?? booking.checkInStatus },
          ].map((item) => <div className="rounded-xl bg-surface-container-low p-4" key={item.label}><item.icon className="h-5 w-5 text-primary" /><p className="mt-3 text-[11px] font-bold uppercase text-on-surface-variant">{item.label}</p><p className="mt-1 text-[14px] font-bold">{item.value}</p></div>)}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-[21px] font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> Tiến trình booking</h2>
          <div className="mt-5 space-y-3">
            {booking.statusHistory.map((entry, index) => <div className="flex gap-3" key={`${entry.changedAt}-${index}`}><span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${entry.toStatus === 'Cancelled' || entry.toStatus === 'Expired' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>{entry.toStatus === 'Cancelled' || entry.toStatus === 'Expired' ? <XCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}</span><div><p className="text-[14px] font-bold">{bookingStatusLabels[entry.toStatus] ?? entry.toStatus}</p><p className="mt-0.5 text-[12px] text-on-surface-variant">{dateTime(entry.changedAt)}{entry.reason ? ` · ${entry.reason}` : ''}</p></div></div>)}
            {booking.statusHistory.length === 0 && <p className="text-[14px] text-on-surface-variant">Chưa có lịch sử trạng thái.</p>}
          </div>
        </section>

        <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
          <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-[20px] font-bold"><ReceiptText className="h-5 w-5 text-primary" /> Chi phí</h2><div className="mt-5 space-y-3 text-[14px]"><div className="flex justify-between gap-3"><span className="text-on-surface-variant">Đơn giá</span><strong>{currency.format(booking.hourlyPrice)}/giờ</strong></div><div className="flex justify-between gap-3"><span className="text-on-surface-variant">Thời lượng</span><strong>{booking.durationHours} giờ</strong></div><div className="flex justify-between gap-3"><span className="text-on-surface-variant">Tiền sân</span><strong>{currency.format(booking.courtAmount)}</strong></div><div className="flex justify-between gap-3 border-t border-outline-variant pt-3"><strong>Tổng thanh toán</strong><strong className="text-[23px] text-primary">{currency.format(booking.totalAmount)}</strong></div></div></section>

          {booking.checkInCode && <section className="rounded-2xl border border-primary bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-[20px] font-bold"><TicketCheck className="h-5 w-5 text-primary" /> Mã check-in</h2><p className="mt-2 text-[12px] text-on-surface-variant">Đưa mã này cho Staff tại sân.</p><div className="mt-3 flex items-center justify-between rounded-lg bg-surface-container-low p-3"><strong className="break-all text-[17px] text-primary">{booking.checkInCode}</strong><button className="rounded-lg p-2 text-primary" onClick={() => void copyCode()} type="button"><Clipboard className="h-5 w-5" /></button></div></section>}

          <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm"><h2 className="text-[20px] font-bold">Thao tác</h2><div className="mt-4 space-y-3">{canContinuePayment && !booking.canRetryPayment && <Link className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white" to={`/checkout?bookingId=${booking.bookingId}&date=${encodeURIComponent(scheduleDate)}`}><CreditCard className="h-5 w-5" />{booking.paymentStatus === 'WaitingForConfirmation' ? 'Xem trạng thái xác nhận' : 'Tiếp tục thanh toán'}</Link>}{booking.canRetryPayment && <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white disabled:opacity-50" disabled={busy} onClick={() => void retryPayment()} type="button"><RefreshCcw className="h-5 w-5" /> Thanh toán lại</button>}{booking.canReview && <Link className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 px-4 py-3 text-[14px] font-bold text-amber-700" to={`/reviews/create?bookingId=${booking.bookingId}`}><Star className="h-5 w-5" /> Đánh giá sân</Link>}{booking.canCancel && <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-3 text-[14px] font-bold text-red-700 disabled:opacity-50" disabled={busy} onClick={() => void cancel()} type="button"><XCircle className="h-5 w-5" /> Hủy booking</button>}<Link className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary" to={`/court/${booking.venueId}/schedule?date=${encodeURIComponent(scheduleDate)}`}><CalendarDays className="h-5 w-5" /> Xem lịch sân</Link></div></section>
        </aside>
      </div>
    </main>
  </div>;
};
