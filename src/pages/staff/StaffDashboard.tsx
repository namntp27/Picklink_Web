import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  checkInStaffMatchParticipant,
  confirmStaffAtCourtPayment,
  getStaffAssignments,
  getStaffNotifications,
  getTodayStaffBookings,
  markStaffBookingNoShow,
  markStaffMatchParticipantNoShow,
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

const bookingStatusLabel: Record<string, string> = {
  MatchWaiting: 'Đang chờ ghép trận',
  Waiting: 'Đang chờ',
  Full: 'Đã đủ người',
  PaymentPending: 'Chờ thanh toán',
  Pending: 'Chờ xử lý',
  Confirmed: 'Đã xác nhận',
  Completed: 'Đã hoàn thành',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
};

const checkInStatusLabel: Record<string, string> = {
  NotOpen: 'Chưa mở vào sân',
  Ready: 'Sẵn sàng vào sân',
  CheckedIn: 'Đã vào sân',
  NoShow: 'Vắng mặt',
  Cancelled: 'Đã hủy',
};

const paymentStatusLabel: Record<string, string> = {
  Pending: 'Chờ thanh toán',
  WaitingForConfirmation: 'Chờ xác nhận thanh toán',
  Paid: 'Đã thanh toán',
  Failed: 'Thanh toán lỗi',
  Rejected: 'Đã từ chối',
  Refunded: 'Đã hoàn tiền',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
};

const paymentMethodLabel: Record<string, string> = {
  AtCourt: 'Thanh toán tại sân',
  BankTransfer: 'Chuyển khoản',
  GroupOnline: 'Thanh toán theo nhóm',
  Cash: 'Tiền mặt',
  VietQR: 'Chuyển khoản VietQR',
};

const attendanceStatusLabel: Record<string, string> = {
  Pending: 'Chưa điểm danh',
  Present: 'Đã vào sân',
  Absent: 'Vắng mặt',
};

const viLabel = (labels: Record<string, string>, value?: string | null, fallback = 'Chưa cập nhật') =>
  value ? labels[value] ?? fallback : fallback;

const vietnameseMessage = (value: string) => value
  .replace(/booking/gi, 'đơn')
  .replace(/check-in/gi, 'vào sân')
  .replace(/no-show/gi, 'vắng mặt');

type BookingTypeFilter = 'all' | 'Court' | 'Match';

export const StaffDashboard = () => {
  const { token, user, logout } = useAuth();
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [selected, setSelected] = useState<StaffBooking | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [date, setDate] = useState(todayValue);
  const [bookingTypeFilter, setBookingTypeFilter] = useState<BookingTypeFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const detailPanelRef = useRef<HTMLElement | null>(null);

  const selectBooking = (booking: StaffBooking) => {
    setSelected(booking);
    setSearchCode(booking.bookingCode);
    setError('');
    setSuccess('');
    window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.innerWidth < 1280) {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

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
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Không thể tải ca vận hành.');
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
      selectBooking(verified);
      setSuccess(`Mã ${verified.bookingCode} hợp lệ và đơn thuộc đúng cụm sân được phân công.`);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Không thể xác minh mã đơn.');
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
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Thao tác không thành công.');
    } finally { setIsBusy(false); }
  };

  const runParticipantAction = async (
    action: (token: string, bookingId: number, playerId: number) => Promise<StaffBooking>,
    playerId: number,
    successMessage: string,
  ) => {
    if (!token || !selected) return;
    setIsBusy(true); setError(''); setSuccess('');
    try {
      const result = await action(token, selected.bookingId, playerId);
      setSelected(result);
      setSuccess(successMessage);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Thao tác không thành công.');
    } finally { setIsBusy(false); }
  };

  const checkedIn = bookings.filter((item) => item.checkInStatus === 'CheckedIn').length;
  const ready = bookings.filter((item) => item.checkInStatus === 'Ready').length;
  const courtBookingCount = bookings.filter((item) => item.bookingType === 'Court').length;
  const matchBookingCount = bookings.filter((item) => item.bookingType === 'Match').length;
  const filteredBookings = bookingTypeFilter === 'all'
    ? bookings
    : bookings.filter((item) => item.bookingType === bookingTypeFilter);
  const visibleBookings = [...filteredBookings].sort((left, right) => {
    const now = Date.now();
    const leftStart = new Date(left.startTime).getTime();
    const rightStart = new Date(right.startTime).getTime();
    const leftEnd = new Date(left.endTime).getTime();
    const rightEnd = new Date(right.endTime).getTime();
    const leftGroup = leftStart <= now && leftEnd >= now ? 0 : leftStart > now ? 1 : 2;
    const rightGroup = rightStart <= now && rightEnd >= now ? 0 : rightStart > now ? 1 : 2;

    if (leftGroup !== rightGroup) return leftGroup - rightGroup;
    if (leftGroup === 2) return rightStart - leftStart;
    return leftStart - rightStart;
  });

  return (
    <div className="min-h-screen bg-[#f7f8fc] text-on-surface">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between bg-primary px-4 text-white shadow-md md:px-8">
        <div className="flex items-center gap-3"><span className="text-[23px] font-bold">Picklink</span><span className="rounded-lg bg-white/15 px-3 py-1 text-[12px] font-bold">Nhân viên vận hành</span></div>
        <div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-[13px] font-bold">{user?.name}</p><p className="text-[11px] text-white/70">{assignments.map((item) => item.venueName).join(' · ') || 'Chưa được phân công'}</p></div><button aria-label="Đăng xuất" className="rounded-lg p-2 hover:bg-white/10" onClick={logout} type="button"><LogOut className="h-5 w-5" /></button></div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 p-4 md:p-8">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary"><ShieldCheck className="h-4 w-4" /> Ca trực hôm nay</p><h1 className="mt-3 text-[32px] font-bold">Quản lý vào sân</h1><p className="mt-2 text-[14px] text-on-surface-variant">Chỉ hiển thị các đơn thuộc cụm sân và quyền được chủ sân phân công.</p></div>
          <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Ngày vận hành</span><input className="h-11 rounded-lg border border-outline-variant bg-white px-3 text-[14px]" onChange={(event) => setDate(event.target.value)} type="date" value={date} /></label>
        </section>

        <form className="rounded-xl border border-primary/30 bg-white p-4 shadow-sm" onSubmit={searchAndVerify}>
          <div className="flex flex-col gap-3 md:flex-row md:items-center"><div className="flex items-center gap-3 md:w-[260px]"><span className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><QrCode className="h-6 w-6" /></span><div><p className="text-[15px] font-bold">Nhập hoặc quét mã</p><p className="text-[12px] text-on-surface-variant">Máy quét có thể nhập trực tiếp vào ô mã</p></div></div><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" /><input autoComplete="off" autoFocus className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-11 pr-3 text-[16px] font-bold uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" onChange={(event) => setSearchCode(event.target.value)} placeholder="VD: PL-20260622-001" value={searchCode} /></div><button className="h-12 rounded-lg bg-primary px-6 text-[14px] font-bold text-white disabled:opacity-50" disabled={isBusy || !searchCode.trim()} type="submit">Tìm & xác minh</button></div>
        </form>

        {(error || success) && <div className={`rounded-lg border px-4 py-3 text-[13px] font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{error || success}</div>}

        <section className="grid gap-4 sm:grid-cols-4">
          {[
            { label: 'Đơn trong ngày', value: bookings.length, icon: CalendarDays },
            { label: 'Sẵn sàng', value: ready, icon: Clock3 },
            { label: 'Đã vào sân', value: checkedIn, icon: UserCheck },
            { label: 'Cảnh báo', value: notifications.length, icon: BellRing },
          ].map((item) => <div className="rounded-xl border border-outline-variant bg-white p-4" key={item.label}><div className="flex items-center justify-between"><div><p className="text-[25px] font-bold">{item.value}</p><p className="text-[12px] text-on-surface-variant">{item.label}</p></div><item.icon className="h-5 w-5 text-primary" /></div></div>)}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
            <div className="border-b border-outline-variant p-5"><h2 className="text-[19px] font-bold">Danh sách đơn ngày {new Intl.DateTimeFormat('vi-VN').format(new Date(`${date}T00:00:00`))}</h2><p className="mt-1 text-[12px] text-on-surface-variant">Sắp xếp theo thời gian gần nhất.</p></div>
            <div className="flex flex-wrap gap-2 border-b border-outline-variant px-5 py-3">
              {([
                { value: 'all', label: `Tất cả (${bookings.length})` },
                { value: 'Court', label: `Đơn đặt sân (${courtBookingCount})` },
                { value: 'Match', label: `Đơn ghép trận (${matchBookingCount})` },
              ] as const).map((item) => (
                <button
                  className={`rounded-lg border px-3 py-2 text-[12px] font-bold ${
                    bookingTypeFilter === item.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant bg-white text-on-surface hover:bg-surface-container-low'
                  }`}
                  key={item.value}
                  onClick={() => setBookingTypeFilter(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            {isLoading ? <p className="p-10 text-center text-[13px] font-bold text-on-surface-variant">Đang tải danh sách đơn...</p> : !visibleBookings.length ? <p className="p-10 text-center text-[13px] text-on-surface-variant">Không có đơn thuộc loại đã chọn trong ngày này.</p> : <div className="divide-y divide-outline-variant">{visibleBookings.map((booking, index) => (
              <button className={`grid w-full gap-3 p-5 text-left transition-colors md:grid-cols-[52px_1fr_160px_160px_auto] md:items-center ${selected?.bookingId === booking.bookingId ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`} key={booking.bookingId} onClick={() => selectBooking(booking)} type="button">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-[14px] font-bold text-primary">{index + 1}</span>
                <div><div className="flex flex-wrap items-center gap-2"><p className="text-[15px] font-bold text-primary">{booking.bookingCode}</p><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${booking.bookingType === 'Match' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{booking.bookingType === 'Match' ? 'Đơn ghép trận' : 'Đơn đặt sân'}</span></div><p className="mt-1 text-[13px] font-bold">{booking.playerName}{booking.bookingType === 'Match' ? ` · ${booking.participantCount} người` : ''}</p><p className="mt-1 text-[12px] text-on-surface-variant"><MapPin className="mr-1 inline h-3.5 w-3.5" />{booking.venueName} · Sân {booking.courtNumber}</p></div>
                <div><p className="text-[14px] font-bold">{time(booking.startTime)}–{time(booking.endTime)}</p><p className="text-[12px] text-on-surface-variant">{viLabel(paymentMethodLabel, booking.paymentMethod, 'Thanh toán trực tuyến')}</p></div>
                <div><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${checkInBadge[booking.checkInStatus] ?? checkInBadge.NotOpen}`}>{viLabel(checkInStatusLabel, booking.checkInStatus)}</span><p className="mt-2 text-[11px] font-bold text-on-surface-variant">{viLabel(paymentStatusLabel, booking.paymentStatus)}</p></div>
                <span className="text-[13px] font-bold">Chi tiết →</span>
              </button>
            ))}</div>}
          </div>

          <aside className="scroll-mt-20 space-y-4 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto xl:overscroll-contain xl:pr-1" ref={detailPanelRef}>
            {!selected ? <div className="rounded-xl border border-dashed border-outline-variant bg-white p-10 text-center"><QrCode className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 text-[15px] font-bold">Chọn đơn hoặc quét mã</p><p className="mt-1 text-[13px] text-on-surface-variant">Thông tin và thao tác hợp lệ sẽ xuất hiện ở đây.</p></div> : <>
              <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
                <div className="bg-primary p-5 text-white">
                  <p className="text-[12px] font-bold text-white/70">{selected.bookingType === 'Match' ? 'MÃ ĐƠN GHÉP TRẬN' : 'MÃ ĐƠN ĐẶT SÂN'}</p>
                  <h2 className="mt-1 text-[25px] font-bold">{selected.bookingCode}</h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">{selected.bookingType === 'Match' ? 'Đơn ghép trận' : 'Đơn đặt sân'}</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">{viLabel(bookingStatusLabel, selected.bookingStatus)}</span>
                    <span className="rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-bold">{viLabel(checkInStatusLabel, selected.checkInStatus)}</span>
                  </div>
                </div>
                <div className="space-y-3 p-5 text-[13px]">
                  <div>
                    <p className="text-on-surface-variant">{selected.bookingType === 'Match' ? 'Chủ trận' : 'Khách hàng'}</p>
                    <p className="font-bold">{selected.playerName}</p>
                    {selected.bookingType === 'Match' && <p className="mt-1 text-[12px] text-on-surface-variant">{selected.checkedInParticipantCount}/{selected.participantCount} thành viên đã vào sân</p>}
                  </div>
                  <div><p className="text-on-surface-variant">Sân & thời gian</p><p className="font-bold">{selected.venueName} · Sân {selected.courtNumber}</p><p>{time(selected.startTime)}–{time(selected.endTime)}</p></div>
                  <div><p className="text-on-surface-variant">Thanh toán</p><p className="font-bold">{money.format(selected.amount)} · {viLabel(paymentStatusLabel, selected.paymentStatus)}</p><p className="mt-1 text-[12px] text-on-surface-variant">{viLabel(paymentMethodLabel, selected.paymentMethod, 'Thanh toán trực tuyến')}</p></div>
                </div>
              </section>

              <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
                <h3 className="text-[17px] font-bold">Thao tác</h3>

                {selected.bookingType === 'Match' ? (
                  <div className="mt-4 space-y-3">
                    {selected.participants.map((participant, index) => {
                      const isProcessed = participant.attendanceStatus !== 'Pending';
                      return (
                        <article className="rounded-lg border border-outline-variant p-3" key={participant.playerId}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[13px] font-bold">
                                {index + 1}. {participant.playerName}
                                {participant.isHost && <span className="ml-2 text-[11px] text-primary">Chủ trận</span>}
                              </p>
                              <p className="mt-1 text-[11px] text-on-surface-variant">
                                {viLabel(paymentStatusLabel, participant.paymentStatus)} · {viLabel(attendanceStatusLabel, participant.attendanceStatus)}
                              </p>
                              {participant.attendanceAt && <p className="mt-1 text-[11px] text-on-surface-variant">{dateTime(participant.attendanceAt)}</p>}
                            </div>
                            <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                              participant.attendanceStatus === 'Present'
                                ? 'bg-green-100 text-green-700'
                                : participant.attendanceStatus === 'Absent'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-slate-100 text-slate-600'
                            }`}>
                              {viLabel(attendanceStatusLabel, participant.attendanceStatus)}
                            </span>
                          </div>

                          {!isProcessed && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              <button
                                className="flex items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-2.5 text-[11px] font-bold text-white disabled:opacity-40"
                                disabled={isBusy || !hasPermission('CheckIn') || !selected.codeVerifiedAt || !selected.isCheckInWindowOpen || participant.paymentStatus !== 'Paid'}
                                onClick={() => void runParticipantAction(checkInStaffMatchParticipant, participant.playerId, `Đã xác nhận ${participant.playerName} vào sân.`)}
                                type="button"
                              >
                                <UserCheck className="h-4 w-4" /> Xác nhận
                              </button>
                              <button
                                className="flex items-center justify-center gap-1.5 rounded-lg border border-red-300 px-2 py-2.5 text-[11px] font-bold text-red-700 disabled:opacity-40"
                                disabled={isBusy || !hasPermission('MarkNoShow') || !selected.codeVerifiedAt || !selected.canMarkNoShow || participant.paymentStatus !== 'Paid'}
                                onClick={() => window.confirm(`Xác nhận ${participant.playerName} vắng mặt?`) && void runParticipantAction(markStaffMatchParticipantNoShow, participant.playerId, `Đã đánh dấu ${participant.playerName} vắng mặt.`)}
                                type="button"
                              >
                                <UserX className="h-4 w-4" /> Vắng mặt
                              </button>
                            </div>
                          )}
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    {selected.paymentMethod === 'AtCourt' && selected.paymentStatus !== 'Paid' && <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-[13px] font-bold text-white disabled:opacity-40" disabled={isBusy || !hasPermission('ConfirmPayment')} onClick={() => void runAction(confirmStaffAtCourtPayment, 'Đã ghi nhận thanh toán tại sân.')} type="button"><Banknote className="h-4 w-4" /> Xác nhận đã nhận tiền</button>}
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[13px] font-bold text-white disabled:opacity-40" disabled={isBusy || !hasPermission('CheckIn') || !selected.codeVerifiedAt || !selected.isCheckInWindowOpen || selected.paymentStatus !== 'Paid' || selected.checkInStatus === 'CheckedIn'} onClick={() => void runAction(checkInStaffBooking, 'Đã xác nhận người chơi vào sân.')} type="button"><UserCheck className="h-4 w-4" /> Xác nhận người chơi vào sân</button>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-300 px-4 py-3 text-[13px] font-bold text-amber-700 disabled:opacity-40" disabled={isBusy || !hasPermission('MarkNoShow') || !selected.canMarkNoShow || selected.checkInStatus === 'CheckedIn' || selected.checkInStatus === 'NoShow'} onClick={() => window.confirm('Xác nhận người chơi không đến sân?') && void runAction(markStaffBookingNoShow, 'Đã đánh dấu vắng mặt.')} type="button"><UserX className="h-4 w-4" /> Đánh dấu vắng mặt</button>
                  </div>
                )}

                <p className="mt-3 text-[11px] leading-5 text-on-surface-variant">Cho phép vào sân từ 30 phút trước giờ chơi đến khi đơn kết thúc. Có thể đánh dấu vắng mặt sau giờ bắt đầu 15 phút.</p>
              </section>

              <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h3 className="text-[17px] font-bold">Tiến trình tại quầy</h3><div className="mt-4 space-y-3">{[
                { label: 'Xác minh mã', done: Boolean(selected.codeVerifiedAt), at: selected.codeVerifiedAt },
                { label: selected.bookingType === 'Match' ? 'Thanh toán cả nhóm' : 'Thanh toán tại sân', done: selected.paymentMethod !== 'AtCourt' || selected.paymentStatus === 'Paid', at: selected.paymentConfirmedAt },
                { label: 'Xác nhận vào sân', done: selected.checkInStatus === 'CheckedIn', at: selected.checkedInAt },
              ].map((step) => <div className="flex items-center gap-3" key={step.label}>{step.done ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Clock3 className="h-5 w-5 text-amber-600" />}<div><p className="text-[13px] font-bold">{step.label}</p><p className="text-[11px] text-on-surface-variant">{step.done ? dateTime(step.at) : 'Chưa hoàn tất'}</p></div></div>)}</div></section>
            </>}

            <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 text-[17px] font-bold"><BellRing className="h-5 w-5 text-primary" /> Thông báo vận hành</h3><div className="mt-4 space-y-3">{notifications.slice(0, 6).map((item, index) => <button className="flex w-full gap-3 rounded-lg bg-surface-container-low p-3 text-left" key={`${item.type}-${item.bookingId}-${index}`} onClick={() => { const booking = bookings.find((entry) => entry.bookingId === item.bookingId); if (booking) selectBooking(booking); }} type="button"><AlertTriangle className={`mt-0.5 h-4 w-4 shrink-0 ${item.type === 'Overdue' ? 'text-amber-600' : 'text-primary'}`} /><div><p className="text-[12px] font-bold">{vietnameseMessage(item.message)}</p><p className="mt-1 text-[11px] text-on-surface-variant">{time(item.startTime)}</p></div></button>)}{!notifications.length && <p className="text-[12px] text-on-surface-variant">Không có cảnh báo mới.</p>}</div></section>
          </aside>
        </section>
      </main>
    </div>
  );
};
