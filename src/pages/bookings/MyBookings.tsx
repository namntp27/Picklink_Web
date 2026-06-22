import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
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
  Holding: 'Đang giữ chỗ', Confirmed: 'Đã đặt', Completed: 'Hoàn thành', Cancelled: 'Đã hủy', Expired: 'Đã hết hạn',
};
const paymentLabels: Record<string, string> = {
  Pending: 'Chờ chuyển khoản', WaitingForConfirmation: 'Chờ Owner xác nhận', Paid: 'Đã thanh toán', Cancelled: 'Đã hủy', Expired: 'Đã hết hạn',
};
const checkInLabels: Record<string, string> = {
  NotOpen: 'Chưa mở check-in', Ready: 'Có thể check-in', CheckedIn: 'Đã check-in', NoShow: 'Vắng mặt', Missed: 'Quá giờ', NotApplicable: 'Không áp dụng',
};

const statusClass = (status: string) => {
  if (status === 'Confirmed' || status === 'Paid' || status === 'Ready' || status === 'CheckedIn') return 'bg-emerald-100 text-emerald-700';
  if (status === 'Holding' || status === 'Pending' || status === 'WaitingForConfirmation' || status === 'NotOpen') return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-700';
};

const matchesFilter = (booking: BookingHolding, filter: BookingFilter) => {
  if (filter === 'all') return true;
  if (filter === 'upcoming') return !['Cancelled', 'Expired'].includes(booking.status) && new Date(booking.endTime).getTime() >= Date.now();
  if (filter === 'pending') return ['Pending', 'WaitingForConfirmation'].includes(booking.paymentStatus);
  if (filter === 'paid') return booking.paymentStatus === 'Paid';
  return booking.status === 'Cancelled' || booking.status === 'Expired';
};

export const MyBookings = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [bookings, setBookings] = useState<BookingHolding[]>([]);
  const [activeFilter, setActiveFilter] = useState<BookingFilter>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    setError('');
    try { setBookings(await getMyBookingHistory(token)); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải lịch sử đặt sân.'); }
    finally { if (showLoading) setLoading(false); }
  };

  useEffect(() => { void load(); }, [token]);
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

  const cancel = async (booking: BookingHolding) => {
    if (!token || !window.confirm(`Hủy booking ${booking.bookingCode}?`)) return;
    setBusyId(booking.bookingId);
    setError('');
    try { await cancelPlayerBooking(token, booking.bookingId); await load(false); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể hủy booking.'); }
    finally { setBusyId(null); }
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
    } finally { setBusyId(null); }
  };

  return <div className="min-h-screen bg-surface-container-low pt-[72px] text-on-surface">
    <section className="bg-primary text-white"><div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-9 lg:grid-cols-[minmax(0,1fr)_350px] lg:items-end"><div><p className="inline-flex items-center gap-2 rounded-lg bg-white/15 px-3 py-2 text-[13px] font-bold"><ReceiptText className="h-4 w-4" /> Lịch sử đặt sân</p><h1 className="mt-4 text-[34px] font-bold md:text-[44px]">Booking của tôi</h1><p className="mt-2 max-w-2xl text-[15px] text-white/80">Theo dõi booking, thanh toán và trạng thái check-in bằng dữ liệu cập nhật trực tiếp từ hệ thống.</p></div><div className="grid grid-cols-3 gap-3 rounded-xl bg-white/10 p-5">{[['Đã thanh toán', paidCount], ['Cần xử lý', pendingCount], ['Có thể check-in', readyCount]].map(([label, value]) => <div key={label}><p className="text-[26px] font-bold">{value}</p><p className="mt-1 text-[11px] text-white/75">{label}</p></div>)}</div></div></section>

    <main className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="space-y-5">
        {error && <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-[14px] font-bold text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
        <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm"><div className="flex flex-col gap-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" /><input className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-10 pr-3 text-[14px] outline-none focus:border-primary" onChange={(event) => setSearch(event.target.value)} placeholder="Tìm mã booking, sân, địa chỉ..." value={search} /></div><div className="flex items-center gap-2 overflow-x-auto"><Filter className="h-5 w-5 shrink-0 text-primary" />{filterOptions.map((option) => <button className={`shrink-0 rounded-lg px-3 py-2 text-[13px] font-bold ${activeFilter === option.value ? 'bg-primary text-white' : 'border border-outline-variant bg-white text-on-surface-variant'}`} key={option.value} onClick={() => setActiveFilter(option.value)} type="button">{option.label}</button>)}</div></div></section>

        {loading ? <div className="flex justify-center rounded-xl border bg-white py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <section className="space-y-4">
          {filtered.map((booking) => {
            const canContinue = booking.status === 'Holding' && ['Pending', 'WaitingForConfirmation'].includes(booking.paymentStatus);
            const canCancel = booking.canCancel;
            const scheduleDate = booking.startTime.slice(0, 10);
            return <article className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm" key={booking.bookingId}>
              <div className="flex flex-col gap-4 xl:flex-row xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2"><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(booking.status)}`}>{bookingLabels[booking.status] ?? booking.status}</span><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(booking.paymentStatus)}`}>{paymentLabels[booking.paymentStatus] ?? booking.paymentStatus}</span><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClass(booking.checkInStatus)}`}>{checkInLabels[booking.checkInStatus] ?? booking.checkInStatus}</span></div><Link className="mt-3 block text-[21px] font-bold hover:text-primary" to={`/bookings/${booking.bookingId}`}>{booking.venueName} · Sân {booking.courtNumber}</Link><p className="mt-1 text-[13px] font-bold text-primary">{booking.bookingCode}</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><div className="flex gap-2 rounded-lg bg-surface-container-low p-3"><CalendarDays className="h-5 w-5 text-primary" /><div><p className="text-[11px] font-bold text-on-surface-variant">Ngày chơi</p><p className="mt-1 text-[13px] font-bold">{date(booking.startTime)}</p></div></div><div className="flex gap-2 rounded-lg bg-surface-container-low p-3"><Clock className="h-5 w-5 text-primary" /><div><p className="text-[11px] font-bold text-on-surface-variant">Khung giờ</p><p className="mt-1 text-[13px] font-bold">{time(booking.startTime)}–{time(booking.endTime)}</p></div></div><div className="flex gap-2 rounded-lg bg-surface-container-low p-3"><MapPin className="h-5 w-5 text-primary" /><div><p className="text-[11px] font-bold text-on-surface-variant">Địa chỉ</p><p className="mt-1 line-clamp-2 text-[13px] font-bold">{booking.address}</p></div></div></div></div><div className="h-fit shrink-0 rounded-lg border border-outline-variant p-4 xl:w-[210px]"><p className="text-[11px] font-bold uppercase text-on-surface-variant">Tổng tiền</p><p className="mt-1 text-[23px] font-bold text-primary">{currency.format(booking.totalAmount)}</p></div></div>
              <div className="mt-5 flex flex-wrap gap-2 border-t border-outline-variant pt-4"><Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-[13px] font-bold hover:bg-surface-container-low" to={`/bookings/${booking.bookingId}`}><ReceiptText className="h-4 w-4" /> Chi tiết</Link>{canContinue && !booking.canRetryPayment && <Link className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white" to={`/checkout?bookingId=${booking.bookingId}&date=${encodeURIComponent(scheduleDate)}`}><CreditCard className="h-4 w-4" />{booking.paymentStatus === 'WaitingForConfirmation' ? 'Xem trạng thái xác nhận' : 'Thanh toán'}</Link>}{booking.canRetryPayment && <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-50" disabled={busyId === booking.bookingId} onClick={() => void retryPayment(booking)} type="button"><RefreshCcw className="h-4 w-4" /> Thanh toán lại</button>}{canCancel && <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-[13px] font-bold text-red-700 disabled:opacity-50" disabled={busyId === booking.bookingId} onClick={() => void cancel(booking)} type="button">{busyId === booking.bookingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />} Hủy booking</button>}{booking.canReview && <Link className="inline-flex items-center gap-2 rounded-lg border border-amber-300 px-4 py-2.5 text-[13px] font-bold text-amber-700" to={`/reviews/create?bookingId=${booking.bookingId}`}><Star className="h-4 w-4" /> Đánh giá sân</Link>}<Link className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-2.5 text-[13px] font-bold text-primary" to={`/court/${booking.venueId}/schedule?date=${encodeURIComponent(scheduleDate)}`}><RefreshCcw className="h-4 w-4" /> Xem lịch sân</Link></div>
            </article>;
          })}
          {filtered.length === 0 && <div className="rounded-xl border border-outline-variant bg-white p-12 text-center"><CalendarDays className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-3 text-[20px] font-bold">Không có booking phù hợp</h2><p className="mt-2 text-[14px] text-on-surface-variant">Hãy đổi bộ lọc hoặc đặt một sân mới.</p></div>}
        </section>}
      </div>

      <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start"><section className="rounded-xl border border-primary bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-[20px] font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> Lịch gần nhất</h2>{nextBooking ? <div className="mt-4"><p className="font-bold">{nextBooking.venueName} · Sân {nextBooking.courtNumber}</p><p className="mt-2 text-[13px] text-on-surface-variant">{date(nextBooking.startTime)} · {time(nextBooking.startTime)}–{time(nextBooking.endTime)}</p><Link className="mt-4 flex justify-center rounded-lg bg-primary px-4 py-3 text-[13px] font-bold text-white" to={`/bookings/${nextBooking.bookingId}`}>Xem booking</Link></div> : <p className="mt-3 text-[14px] text-on-surface-variant">Bạn chưa có lịch sắp tới.</p>}</section><section className="rounded-xl border border-outline-variant bg-white p-5"><h2 className="flex items-center gap-2 text-[18px] font-bold"><TicketCheck className="h-5 w-5 text-primary" /> Trạng thái realtime</h2><p className="mt-3 text-[13px] leading-6 text-on-surface-variant">Khi Owner xác nhận thanh toán, danh sách và trạng thái check-in sẽ tự cập nhật mà không cần F5.</p></section><Link className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white" to="/book-court"><CalendarDays className="h-5 w-5" /> Đặt sân mới</Link></aside>
    </main>
  </div>;
};
