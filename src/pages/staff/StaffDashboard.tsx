import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LogOut,
  MapPin,
  QrCode,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  checkInStaffBooking,
  confirmStaffAtCourtPayment,
  getStaffAssignments,
  getStaffNotifications,
  getTodayStaffBookings,
  markStaffBookingNoShow,
  searchStaffBooking,
  verifyStaffBookingCode,
  type StaffAssignment,
  type StaffBooking,
  type StaffNotification,
} from '../../api/staff';
import type { StaffPermission } from '../../api/owner';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const time = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const dateTime = (value?: string | null) => value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : '—';
const todayValue = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const checkInBadge: Record<string, string> = {
  NotOpen: 'bg-slate-100 text-slate-600', Ready: 'bg-blue-100 text-blue-700',
  CheckedIn: 'bg-green-100 text-green-700', NoShow: 'bg-amber-100 text-amber-700', Cancelled: 'bg-red-100 text-red-700',
};

export const StaffDashboard = () => {
  const { token, user, logout } = useAuth();
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [selected, setSelected] = useState<StaffBooking | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [date, setDate] = useState(todayValue);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true); setError('');
    try {
      const [assignmentResult, bookingResult, notificationResult] = await Promise.all([
        getStaffAssignments(token), getTodayStaffBookings(token, date), getStaffNotifications(token),
      ]);
      setAssignments(assignmentResult);
      setBookings(bookingResult);
      setNotifications(notificationResult);
      setSelected((current) => current ? bookingResult.find((item) => item.bookingId === current.bookingId) ?? current : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải ca vận hành.');
    } finally { setIsLoading(false); }
  }, [date, token]);

  useEffect(() => { void load(); }, [load]);

  const selectedPermissions = useMemo(() =>
    assignments.find((item) => item.venueId === selected?.venueId)?.permissions ?? [], [assignments, selected?.venueId]);
  const hasPermission = (permission: StaffPermission) => selectedPermissions.includes(permission);

  const searchAndVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !searchCode.trim()) return;
    setIsBusy(true); setError(''); setSuccess('');
    try {
      const found = await searchStaffBooking(token, searchCode.trim());
      const verified = await verifyStaffBookingCode(token, found.bookingId, searchCode.trim());
      setSelected(verified);
      setSuccess(`Mã ${verified.bookingCode} hợp lệ và booking thuộc đúng cụm sân được phân công.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể xác minh mã booking.');
    } finally { setIsBusy(false); }
  };

  const runAction = async (action: (token: string, bookingId: number) => Promise<StaffBooking>, successMessage: string) => {
    if (!token || !selected) return;
    setIsBusy(true); setError(''); setSuccess('');
    try {
      const result = await action(token, selected.bookingId);
      setSelected(result);
      setSuccess(successMessage);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Thao tác không thành công.');
    } finally { setIsBusy(false); }
  };

  const checkedIn = bookings.filter((item) => item.checkInStatus === 'CheckedIn').length;
  const ready = bookings.filter((item) => item.checkInStatus === 'Ready').length;

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-on-surface">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-primary px-4 text-white shadow-md md:px-8">
        <div className="flex items-center gap-3"><span className="text-[23px] font-bold">Picklink</span><span className="rounded-lg bg-white/15 px-3 py-1 text-[12px] font-bold">Staff vận hành</span></div>
        <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-[13px] font-bold">{user?.name}</p><p className="text-[11px] text-white/70">{assignments.map((item) => item.venueName).join(' · ') || 'Chưa được phân công'}</p></div><button aria-label="Đăng xuất" className="rounded-lg p-2 hover:bg-white/10" onClick={logout} type="button"><LogOut className="h-5 w-5" /></button></div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 p-4 md:p-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary"><ShieldCheck className="h-4 w-4" /> Ca trực hôm nay</p><h1 className="mt-3 text-[32px] font-bold">Vận hành booking tại sân</h1><p className="mt-2 text-[14px] text-on-surface-variant">Chỉ hiển thị booking thuộc cụm sân và quyền được Owner phân công.</p></div>
          <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Ngày vận hành</span><input className="h-11 rounded-lg border border-outline-variant bg-white px-3 text-[14px]" onChange={(event) => setDate(event.target.value)} type="date" value={date} /></label>
        </section>

        <form className="rounded-xl border border-primary/30 bg-white p-4 shadow-sm" onSubmit={searchAndVerify}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center"><div className="flex items-center gap-3 md:w-[260px]"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><QrCode className="h-6 w-6" /></span><div><p className="text-[15px] font-bold">Nhập hoặc quét mã</p><p className="text-[12px] text-on-surface-variant">Máy quét có thể nhập trực tiếp vào ô mã</p></div></div><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" /><input autoComplete="off" autoFocus className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-11 pr-3 text-[16px] font-bold uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" onChange={(event) => setSearchCode(event.target.value)} placeholder="VD: PL-20260622-001" value={searchCode} /></div><button className="h-12 rounded-lg bg-primary px-6 text-[14px] font-bold text-white disabled:opacity-50" disabled={isBusy || !searchCode.trim()} type="submit">Tìm & xác minh</button></div>
        </form>

        {(error || success) && <div className={`rounded-lg border px-4 py-3 text-[13px] font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{error || success}</div>}

        <section className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Booking trong ngày', value: bookings.length, icon: CalendarDays },
            { label: 'Sẵn sàng', value: ready, icon: Clock3 },
            { label: 'Đã check-in', value: checkedIn, icon: UserCheck },
            { label: 'Cảnh báo', value: notifications.length, icon: BellRing },
          ].map((item) => <div className="rounded-xl border border-outline-variant bg-white p-4" key={item.label}><div className="flex items-center justify-between"><div><p className="text-[25px] font-bold">{item.value}</p><p className="text-[12px] text-on-surface-variant">{item.label}</p></div><item.icon className="h-5 w-5 text-primary" /></div></div>)}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
            <div className="border-b border-outline-variant p-5"><h2 className="text-[19px] font-bold">Booking ngày {new Intl.DateTimeFormat('vi-VN').format(new Date(`${date}T00:00:00`))}</h2></div>
            {isLoading ? <p className="p-10 text-center text-[13px] font-bold text-on-surface-variant">Đang tải booking...</p> : !bookings.length ? <p className="p-10 text-center text-[13px] text-on-surface-variant">Không có booking trong ngày tại sân được phân công.</p> : <div className="divide-y divide-outline-variant">{bookings.map((booking) => (
              <button className={`grid w-full gap-3 p-5 text-left transition-colors md:grid-cols-[1fr_160px_140px_auto] md:items-center ${selected?.bookingId === booking.bookingId ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`} key={booking.bookingId} onClick={() => { setSelected(booking); setSearchCode(booking.bookingCode); setError(''); setSuccess(''); }} type="button">
                <div><p className="text-[15px] font-bold text-primary">{booking.bookingCode}</p><p className="mt-1 text-[13px] font-bold">{booking.playerName}</p><p className="mt-1 text-[12px] text-on-surface-variant"><MapPin className="mr-1 inline h-3.5 w-3.5" />{booking.venueName} · Sân {booking.courtNumber}</p></div>
                <div><p className="text-[14px] font-bold">{time(booking.startTime)}–{time(booking.endTime)}</p><p className="text-[12px] text-on-surface-variant">{booking.paymentMethod === 'AtCourt' ? 'Thanh toán tại sân' : booking.paymentMethod || 'Thanh toán online'}</p></div>
                <div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${checkInBadge[booking.checkInStatus] ?? checkInBadge.NotOpen}`}>{booking.checkInStatus}</span><p className="mt-2 text-[11px] font-bold text-on-surface-variant">{booking.paymentStatus}</p></div>
                <span className="text-[13px] font-bold">Chi tiết →</span>
              </button>
            ))}</div>}
          </div>

          <aside className="space-y-4 xl:sticky xl:top-20 xl:self-start">
            {!selected ? <div className="rounded-xl border border-dashed border-outline-variant bg-white p-10 text-center"><QrCode className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 text-[15px] font-bold">Chọn booking hoặc quét mã</p><p className="mt-1 text-[13px] text-on-surface-variant">Thông tin và thao tác hợp lệ sẽ xuất hiện ở đây.</p></div> : <>
              <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm"><div className="bg-primary p-5 text-white"><p className="text-[12px] font-bold text-white/70">MÃ BOOKING</p><h2 className="mt-1 text-[25px] font-bold">{selected.bookingCode}</h2><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">{selected.bookingStatus}</span><span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">{selected.checkInStatus}</span></div></div><div className="space-y-3 p-5 text-[13px]"><div><p className="text-on-surface-variant">Khách hàng</p><p className="font-bold">{selected.playerName}</p></div><div><p className="text-on-surface-variant">Sân & thời gian</p><p className="font-bold">{selected.venueName} · Sân {selected.courtNumber}</p><p>{time(selected.startTime)}–{time(selected.endTime)}</p></div><div><p className="text-on-surface-variant">Thanh toán</p><p className="font-bold">{money.format(selected.amount)} · {selected.paymentStatus}</p></div></div></section>

              <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h3 className="text-[17px] font-bold">Tiến trình tại quầy</h3><div className="mt-4 space-y-3">{[
                { label: 'Xác minh mã', done: Boolean(selected.codeVerifiedAt), at: selected.codeVerifiedAt },
                { label: 'Thanh toán tại sân', done: selected.paymentMethod !== 'AtCourt' || selected.paymentStatus === 'Paid', at: selected.paymentConfirmedAt },
                { label: 'Check-in', done: selected.checkInStatus === 'CheckedIn', at: selected.checkedInAt },
              ].map((step) => <div className="flex items-center gap-3" key={step.label}>{step.done ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Clock3 className="h-5 w-5 text-amber-600" />}<div><p className="text-[13px] font-bold">{step.label}</p><p className="text-[11px] text-on-surface-variant">{step.done ? dateTime(step.at) : 'Chưa hoàn tất'}</p></div></div>)}</div></section>

              <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h3 className="text-[17px] font-bold">Thao tác</h3><div className="mt-4 space-y-2">
                {selected.paymentMethod === 'AtCourt' && selected.paymentStatus !== 'Paid' && <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-[13px] font-bold text-white disabled:opacity-40" disabled={isBusy || !hasPermission('ConfirmPayment')} onClick={() => void runAction(confirmStaffAtCourtPayment, 'Đã ghi nhận thanh toán tại sân.')} type="button"><Banknote className="h-4 w-4" /> Xác nhận đã nhận tiền</button>}
                <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[13px] font-bold text-white disabled:opacity-40" disabled={isBusy || !hasPermission('CheckIn') || !selected.codeVerifiedAt || !selected.isCheckInWindowOpen || selected.paymentStatus !== 'Paid' || selected.checkInStatus === 'CheckedIn'} onClick={() => void runAction(checkInStaffBooking, 'Check-in thành công.')} type="button"><UserCheck className="h-4 w-4" /> Check-in người chơi</button>
                <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 px-4 py-3 text-[13px] font-bold text-amber-700 disabled:opacity-40" disabled={isBusy || !hasPermission('MarkNoShow') || !selected.canMarkNoShow || selected.checkInStatus === 'CheckedIn' || selected.checkInStatus === 'NoShow'} onClick={() => window.confirm('Xác nhận người chơi không đến sân?') && void runAction(markStaffBookingNoShow, 'Đã đánh dấu no-show.')} type="button"><UserX className="h-4 w-4" /> Đánh dấu no-show</button>
              </div><p className="mt-3 text-[11px] leading-5 text-on-surface-variant">Check-in mở từ 30 phút trước giờ chơi đến khi booking kết thúc. No-show mở sau giờ bắt đầu 15 phút.</p></section>
            </>}

            <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 text-[17px] font-bold"><BellRing className="h-5 w-5 text-primary" /> Thông báo vận hành</h3><div className="mt-4 space-y-3">{notifications.slice(0, 6).map((item, index) => <button className="flex w-full gap-3 rounded-lg bg-surface-container-low p-3 text-left" key={`${item.type}-${item.bookingId}-${index}`} onClick={() => { const booking = bookings.find((entry) => entry.bookingId === item.bookingId); if (booking) setSelected(booking); }} type="button"><AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${item.type === 'Overdue' ? 'text-amber-600' : 'text-primary'}`} /><div><p className="text-[12px] font-bold">{item.message}</p><p className="mt-1 text-[11px] text-on-surface-variant">{time(item.startTime)}</p></div></button>)}{!notifications.length && <p className="text-[12px] text-on-surface-variant">Không có cảnh báo mới.</p>}</div></section>
          </aside>
        </section>
      </main>
    </div>
  );
};
