import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Banknote,
  BellRing,
  CalendarDays,
  CheckCircle2,
  CircleGauge,
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
  checkInStaffCheckInGroup,
  checkInStaffMatchParticipant,
  confirmStaffAtCourtPayment,
  getStaffAssignments,
  getStaffNotifications,
  getTodayStaffBookings,
  markStaffBookingNoShow,
  markStaffCheckInGroupNoShow,
  markStaffMatchParticipantNoShow,
  verifyStaffBookingCodeByCode,
  type StaffAssignment,
  type StaffBooking,
  type StaffNotification,
} from '../../api/staff';
import type { StaffPermission } from '../../api/owner';
import {
  checkInSessionTicket,
  getStaffTicketSessionParticipants,
  getStaffTicketSessions,
  type StaffTicketParticipant,
  type TicketSession,
} from '../../api/ticketing';
import { PaginationControls } from '../../components/PaginationControls';
import './staff.css';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const time = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const dateTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : '-';
const todayValue = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const checkInBadge: Record<string, string> = {
  NotOpen: 'staff-status is-neutral',
  Ready: 'staff-status is-ready',
  CheckedIn: 'staff-status is-success',
  NoShow: 'staff-status is-warning',
  Cancelled: 'staff-status is-danger',
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

const ticketStatusLabel: Record<string, string> = {
  PendingPayment: 'Chờ thanh toán',
  Paid: 'Đã thanh toán',
  CheckedIn: 'Đã vào sân',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
  RefundPending: 'Chờ hoàn tiền',
  Refunded: 'Đã hoàn tiền',
};

const viLabel = (labels: Record<string, string>, value?: string | null, fallback = 'Chưa cập nhật') =>
  value ? labels[value] ?? fallback : fallback;

const vietnameseMessage = (value: string) => value
  .replace(/booking/gi, 'đơn')
  .replace(/check-in/gi, 'vào sân')
  .replace(/no-show/gi, 'vắng mặt');

type BookingTypeFilter = 'all' | 'Court' | 'Match';
type WorkspaceMode = 'bookings' | 'tickets';

export const StaffDashboard = () => {
  const { token, user, logout } = useAuth();
  const shouldReduceMotion = useReducedMotion();
  const [assignments, setAssignments] = useState<StaffAssignment[]>([]);
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [bookingsPage, setBookingsPage] = useState(1);
  const [bookingPagination, setBookingPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [notifications, setNotifications] = useState<StaffNotification[]>([]);
  const [selected, setSelected] = useState<StaffBooking | null>(null);
  const [selectedCheckInGroupId, setSelectedCheckInGroupId] = useState<number | null>(null);
  const [searchCode, setSearchCode] = useState('');
  const [date, setDate] = useState(todayValue);
  const [bookingTypeFilter, setBookingTypeFilter] = useState<BookingTypeFilter>('all');
  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>('bookings');
  const [ticketSessions, setTicketSessions] = useState<TicketSession[]>([]);
  const [ticketsPage, setTicketsPage] = useState(1);
  const [ticketPagination, setTicketPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [selectedTicketSession, setSelectedTicketSession] = useState<TicketSession | null>(null);
  const [ticketParticipants, setTicketParticipants] = useState<StaffTicketParticipant[]>([]);
  const [isTicketLoading, setIsTicketLoading] = useState(false);
  const [isTicketDetailLoading, setIsTicketDetailLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const detailPanelRef = useRef<HTMLElement | null>(null);

  const selectBooking = (booking: StaffBooking, checkInGroupId?: number) => {
    setSelected(booking);
    setSelectedCheckInGroupId(checkInGroupId ?? null);
    setSearchCode(booking.checkInGroups.find((group) => group.bookingCheckInGroupId === checkInGroupId)?.checkInCode ?? booking.bookingCode);
    setError('');
    setSuccess('');
    window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.innerWidth < 1000) {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  };

  const updateBooking = (booking: StaffBooking) => {
    setSelected(booking);
    setBookings((current) => current.map((item) => item.bookingId === booking.bookingId ? booking : item));
  };

  const selectTicketSession = async (session: TicketSession) => {
    if (!token) return;
    setSelectedTicketSession(session);
    setTicketParticipants([]);
    setIsTicketDetailLoading(true);
    setError('');
    setSuccess('');
    window.requestAnimationFrame(() => {
      detailPanelRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
      if (window.innerWidth < 1000) {
        detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
    try {
      const result = await getStaffTicketSessionParticipants(token, session.ticketSessionId);
      setSelectedTicketSession(result.session);
      setTicketParticipants(result.tickets);
    } catch (reason) {
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Không thể tải danh sách người tham gia.');
    } finally {
      setIsTicketDetailLoading(false);
    }
  };

  const load = useCallback(async (signal: AbortSignal) => {
    if (!token || workspaceMode !== 'bookings') return;
    setIsLoading(true);
    setError('');
    try {
      void getStaffNotifications(token, { signal })
        .then((result) => {
          if (!signal.aborted) setNotifications(result);
        })
        .catch(() => {
          if (!signal.aborted) setNotifications([]);
        });
      const [assignmentResult, bookingResult] = await Promise.all([
        getStaffAssignments(token, { signal }),
        getTodayStaffBookings(
          token,
          date,
          { page: bookingsPage, pageSize: 10 },
          bookingTypeFilter === 'all' ? undefined : bookingTypeFilter,
          { signal },
        ),
      ]);
      if (signal.aborted) return;
      setAssignments(assignmentResult);
      setBookings(bookingResult.items);
      setBookingPagination(bookingResult);
      setSelected((current) => current
        ? bookingResult.items.find((item) => item.bookingId === current.bookingId) ?? null
        : null);
    } catch (reason) {
      if (signal.aborted) return;
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Không thể tải ca vận hành.');
    } finally {
      if (!signal.aborted) setIsLoading(false);
    }
  }, [bookingTypeFilter, bookingsPage, date, token, workspaceMode]);

  useEffect(() => {
    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const loadTicketSessions = useCallback(async (signal: AbortSignal) => {
    if (!token || workspaceMode !== 'tickets') return;
    setIsTicketLoading(true);
    setError('');
    try {
      const result = await getStaffTicketSessions(
        token,
        { date, page: ticketsPage, pageSize: 10 },
        { signal },
      );
      if (signal.aborted) return;
      setTicketSessions(result.items);
      setTicketPagination(result);
      setSelectedTicketSession((current) => current
        ? result.items.find((item) => item.ticketSessionId === current.ticketSessionId) ?? null
        : null);
    } catch (reason) {
      if (signal.aborted) return;
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Không thể tải các buổi xé vé.');
    } finally {
      if (!signal.aborted) setIsTicketLoading(false);
    }
  }, [date, ticketsPage, token, workspaceMode]);

  useEffect(() => {
    const controller = new AbortController();
    void loadTicketSessions(controller.signal);
    return () => controller.abort();
  }, [loadTicketSessions]);

  const selectedPermissions = useMemo(() =>
    assignments.find((item) => item.venueId === selected?.venueId)?.permissions ?? [],
  [assignments, selected?.venueId]);
  const hasPermission = (permission: StaffPermission) => selectedPermissions.includes(permission);
  const selectedTicketPermissions = useMemo(() =>
    assignments.find((item) => item.venueId === selectedTicketSession?.venueId)?.permissions ?? [],
  [assignments, selectedTicketSession?.venueId]);
  const canCheckInSelectedTicket = selectedTicketPermissions.includes('CheckIn');
  const canCheckInAnyTicket = assignments.some((item) => item.permissions.includes('CheckIn'));
  const selectedCheckInGroup = useMemo(() => selected?.checkInGroups
    .find((group) => group.bookingCheckInGroupId === selectedCheckInGroupId) ?? null,
  [selected, selectedCheckInGroupId]);
  const hasCheckInGroups = Boolean(selected?.checkInGroups.length);
  const missingCheckInGroup = hasCheckInGroups && !selectedCheckInGroup;
  const currentCheckInStatus = selectedCheckInGroup?.checkInStatus ?? selected?.checkInStatus;
  const currentCodeVerifiedAt = selectedCheckInGroup
    ? selectedCheckInGroup.codeVerifiedAt
    : selected?.codeVerifiedAt;
  const currentCheckInWindowOpen = selectedCheckInGroup?.isCheckInWindowOpen ?? selected?.isCheckInWindowOpen;
  const currentCanMarkNoShow = selectedCheckInGroup?.canMarkNoShow ?? selected?.canMarkNoShow;

  const runTicketCheckIn = async (ticketCode: string) => {
    if (!token) return;
    if (!canCheckInAnyTicket) {
      setError('Bạn chưa được cấp quyền check-in tại cụm sân.');
      return;
    }
    setIsBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await checkInSessionTicket(token, ticketCode);
      setTicketParticipants((current) => current.map((item) =>
        item.sessionTicketId === result.sessionTicketId ? result : item));
      setSearchCode('');
      setSuccess(`Đã check-in vé ${result.ticketCode} cho ${result.playerName}.`);
    } catch (reason) {
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Không thể check-in vé.');
    } finally {
      setIsBusy(false);
    }
  };

  const searchAndVerify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !searchCode.trim()) return;
    if (workspaceMode === 'tickets') {
      await runTicketCheckIn(searchCode.trim());
      return;
    }
    setIsBusy(true);
    setError('');
    setSuccess('');
    try {
      const code = searchCode.trim();
      const verified = await verifyStaffBookingCodeByCode(token, code);
      const group = verified.checkInGroups.find((item) => item.checkInCode.toUpperCase() === code.toUpperCase());
      selectBooking(verified, group?.bookingCheckInGroupId);
      setSuccess(`Mã ${verified.bookingCode} hợp lệ và đơn thuộc đúng cụm sân được phân công.`);
    } catch (reason) {
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Không thể xác minh mã đơn.');
    } finally {
      setIsBusy(false);
    }
  };

  const runAction = async (
    action: (token: string, bookingId: number) => Promise<StaffBooking>,
    successMessage: string,
  ) => {
    if (!token || !selected) return;
    setIsBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await action(token, selected.bookingId);
      updateBooking(result);
      setSuccess(successMessage);
    } catch (reason) {
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Thao tác không thành công.');
    } finally {
      setIsBusy(false);
    }
  };

  const runCheckInGroupAction = async (
    action: (token: string, bookingId: number, checkInGroupId: number) => Promise<StaffBooking>,
    successMessage: string,
  ) => {
    if (!token || !selected || !selectedCheckInGroup) return;
    setIsBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await action(token, selected.bookingId, selectedCheckInGroup.bookingCheckInGroupId);
      updateBooking(result);
      setSuccess(successMessage);
    } catch (reason) {
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Thao tác không thành công.');
    } finally {
      setIsBusy(false);
    }
  };

  const runParticipantAction = async (
    action: (token: string, bookingId: number, playerId: number) => Promise<StaffBooking>,
    playerId: number,
    successMessage: string,
  ) => {
    if (!token || !selected) return;
    setIsBusy(true);
    setError('');
    setSuccess('');
    try {
      const result = await action(token, selected.bookingId, playerId);
      updateBooking(result);
      setSuccess(successMessage);
    } catch (reason) {
      setError(reason instanceof Error ? vietnameseMessage(reason.message) : 'Thao tác không thành công.');
    } finally {
      setIsBusy(false);
    }
  };

  const checkedIn = bookings.filter((item) => item.checkInStatus === 'CheckedIn').length;
  const ready = bookings.filter((item) => item.checkInStatus === 'Ready').length;
  const checkedInTickets = ticketParticipants.filter((item) => item.ticketStatus === 'CheckedIn').length;
  const soldTicketCount = ticketSessions.reduce((total, item) => total + item.soldTickets, 0);
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
    <div className="staff-root">
      <header className="staff-topbar">
        <div className="staff-brand">
          <span className="staff-brand__mark">
            <CircleGauge aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block text-[16px] font-extrabold tracking-[-0.03em]">Picklink</span>
            <span className="mt-1 hidden text-[9px] font-bold text-[#e2ff57] sm:block">Staff operations</span>
          </span>
        </div>

        <div className="flex min-w-0 items-center gap-2">
          <div className="hidden min-w-0 text-right sm:block">
            <p className="truncate text-[12px] font-bold">{user?.name}</p>
            <p className="max-w-[360px] truncate text-[10px] text-white/62">
              {assignments.map((item) => item.venueName).join(', ') || 'Chưa được phân công'}
            </p>
          </div>
          <button
            aria-label="Đăng xuất"
            className="staff-topbar__action"
            onClick={logout}
            title="Đăng xuất"
            type="button"
          >
            <LogOut aria-hidden="true" className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <main className="staff-shell">
        <section className="staff-page-header">
          <div>
            <p className="staff-kicker">
              <ShieldCheck aria-hidden="true" className="h-4 w-4" />
              Ca trực hôm nay
            </p>
            <h1 className="staff-title">Bàn điều phối vào sân</h1>
            <p className="staff-description">
              Xác minh mã, xử lý thanh toán và điểm danh theo đúng cụm sân được phân công.
            </p>
          </div>
          <label className="staff-date-field">
            <span className="staff-label">Ngày vận hành</span>
            <input
              className="staff-control"
              onChange={(event) => {
                setDate(event.target.value);
                setBookingsPage(1);
                setTicketsPage(1);
                setSelectedTicketSession(null);
                setTicketParticipants([]);
              }}
              type="date"
              value={date}
            />
          </label>
        </section>

        <div aria-label="Chọn nghiệp vụ vận hành" className="mt-4 inline-flex rounded-xl border border-[#d7e2d3] bg-white p-1" role="group">
          {([
            { value: 'bookings', label: 'Booking' },
            { value: 'tickets', label: 'Xé vé' },
          ] as const).map((item) => (
            <button
              aria-pressed={workspaceMode === item.value}
              className={'min-h-9 rounded-lg px-4 text-[12px] font-extrabold transition-colors '
                + (workspaceMode === item.value ? 'bg-[#0b2228] text-white' : 'text-[#627168] hover:bg-[#edf4e9]')}
              key={item.value}
              onClick={() => {
                setWorkspaceMode(item.value);
                setSearchCode('');
                setError('');
                setSuccess('');
              }}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <form className="staff-command" onSubmit={searchAndVerify}>
          <div className="staff-command__intro">
            <span className="staff-command__icon">
              <QrCode aria-hidden="true" className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-extrabold">
                {workspaceMode === 'tickets' ? 'Quét mã để check-in vé' : 'Nhập hoặc quét mã'}
              </p>
              <p className="mt-0.5 truncate text-[10px] font-medium text-[#627168]">
                {workspaceMode === 'tickets'
                  ? 'Chỉ vé đã thanh toán tại sân được phân công'
                  : 'Máy quét có thể nhập trực tiếp'}
              </p>
            </div>
          </div>
          <div className="staff-search-wrap">
            <Search aria-hidden="true" />
            <input
              autoComplete="off"
              autoFocus
              className="staff-control"
              onChange={(event) => setSearchCode(event.target.value)}
              placeholder={workspaceMode === 'tickets' ? 'VD: TK-...' : 'VD: PL-20260622-001'}
              value={searchCode}
            />
          </div>
          <button
            aria-busy={isBusy}
            className="staff-button"
            disabled={isBusy || !searchCode.trim() || (workspaceMode === 'tickets' && !canCheckInAnyTicket)}
            type="submit"
          >
            {workspaceMode === 'tickets'
              ? <UserCheck aria-hidden="true" className="h-4 w-4" />
              : <ShieldCheck aria-hidden="true" className="h-4 w-4" />}
            {workspaceMode === 'tickets' ? 'Check-in vé' : 'Xác minh'}
          </button>
        </form>

        <div aria-live="polite">
          {error && (
            <div className="staff-feedback is-error" role="alert">
              <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="staff-feedback is-success">
              <CheckCircle2 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}
        </div>

        <section aria-label="Tổng quan ca trực" className="staff-metrics">
          {(workspaceMode === 'bookings'
            ? [
                { label: 'Đơn trên trang', value: bookings.length, icon: CalendarDays },
                { label: 'Sẵn sàng', value: ready, icon: Clock3 },
                { label: 'Đã vào sân', value: checkedIn, icon: UserCheck },
                { label: 'Cảnh báo', value: notifications.length, icon: BellRing },
              ]
            : [
                { label: 'Buổi trên trang', value: ticketSessions.length, icon: CalendarDays },
                { label: 'Vé đã bán', value: soldTicketCount, icon: QrCode },
                { label: 'Đã check-in', value: checkedInTickets, icon: UserCheck },
                { label: 'Còn chỗ', value: ticketSessions.reduce((total, item) => total + item.remainingTickets, 0), icon: Clock3 },
              ]).map((item) => (
            <div className="staff-metric" key={item.label}>
              <div className="min-w-0">
                <p className="staff-metric__value">{item.value}</p>
                <p className="staff-metric__label">{item.label}</p>
              </div>
              <item.icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0 text-[#477313]" />
            </div>
          ))}
        </section>

        {workspaceMode === 'bookings' && (
        <section className="staff-workspace">
          <section className="staff-panel">
            <div className="staff-panel__header">
              <div>
                <h2>
                  Đơn ngày {new Intl.DateTimeFormat('vi-VN').format(new Date(`${date}T00:00:00`))}
                </h2>
                <p>Ưu tiên đơn đang diễn ra, sau đó đến giờ chơi gần nhất.</p>
              </div>
              <span className="staff-status is-neutral">{bookingPagination.totalCount} đơn</span>
            </div>

            <div className="staff-list-scroll">
              <div aria-label="Lọc loại đơn" className="staff-tabs" role="group">
                {([
                  { value: 'all', label: `Tất cả (${bookings.length})` },
                  { value: 'Court', label: `Đặt sân (${courtBookingCount})` },
                  { value: 'Match', label: `Ghép trận (${matchBookingCount})` },
                ] as const).map((item) => (
                  <button
                    aria-pressed={bookingTypeFilter === item.value}
                    className={`staff-tab ${bookingTypeFilter === item.value ? 'is-active' : ''}`}
                    key={item.value}
                    onClick={() => {
                      setBookingTypeFilter(item.value);
                      setBookingsPage(1);
                    }}
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <div aria-busy="true" aria-label="Đang tải danh sách đơn" role="status">
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div className="staff-skeleton-row" key={index} />
                  ))}
                </div>
              ) : !visibleBookings.length ? (
                <div className="staff-list-state">
                  <div>
                    <span className="staff-list-state__icon">
                      <CalendarDays aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-[13px] font-extrabold text-[#0b2228]">Chưa có đơn phù hợp</p>
                    <p className="mt-1 text-[11px]">Thử chọn ngày hoặc loại đơn khác.</p>
                  </div>
                </div>
              ) : (
                <div className="staff-booking-list">
                  {visibleBookings.map((booking, index) => (
                    <button
                      aria-pressed={selected?.bookingId === booking.bookingId}
                      className={`staff-booking-row ${selected?.bookingId === booking.bookingId ? 'is-selected' : ''}`}
                      key={booking.bookingId}
                      onClick={() => selectBooking(booking)}
                      type="button"
                    >
                      <span className="staff-booking-index">
                        {String((bookingPagination.page - 1) * bookingPagination.pageSize + index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="staff-booking-code">{booking.bookingCode}</p>
                          <span className={`staff-type-badge ${booking.bookingType === 'Match' ? 'is-match' : 'is-court'}`}>
                            {booking.bookingType === 'Match' ? 'Ghép trận' : 'Đặt sân'}
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[12px] font-extrabold">
                          {booking.playerName}
                          {booking.bookingType === 'Match' ? `, ${booking.participantCount} người` : ''}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-[#627168]">
                          <MapPin aria-hidden="true" className="mr-1 inline h-3 w-3" />
                          {booking.venueName}, Sân {booking.courtNumber}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-[12px] font-extrabold">
                          {time(booking.startTime)} - {time(booking.endTime)}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-[#627168]">
                          {viLabel(paymentMethodLabel, booking.paymentMethod, 'Thanh toán trực tuyến')}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className={checkInBadge[booking.checkInStatus] ?? checkInBadge.NotOpen}>
                          {viLabel(checkInStatusLabel, booking.checkInStatus)}
                        </span>
                        <p className="mt-1.5 truncate text-[10px] font-bold text-[#627168]">
                          {viLabel(paymentStatusLabel, booking.paymentStatus)}
                        </p>
                      </div>
                      <ArrowRight aria-hidden="true" className="hidden h-4 w-4 text-[#627168] sm:block" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {bookingPagination.totalPages > 1 && (
              <div className="staff-pagination">
                <PaginationControls
                  page={bookingPagination}
                  onPageChange={(nextPage) => {
                    setBookingsPage(nextPage);
                    setSelected(null);
                    setSelectedCheckInGroupId(null);
                  }}
                />
              </div>
            )}
          </section>

          <aside className="staff-detail-column" ref={detailPanelRef}>
            <div className="staff-detail-stack">
              {!selected ? (
                <div className="staff-empty-detail">
                  <div>
                    <span className="staff-empty-detail__icon">
                      <QrCode aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-[13px] font-extrabold">Chọn đơn hoặc quét mã</p>
                    <p className="mt-1 max-w-[32ch] text-[11px] leading-5 text-[#627168]">
                      Chi tiết và thao tác được cấp quyền sẽ xuất hiện tại đây.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="staff-detail-stack"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
                  key={selected.bookingId}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <section className="staff-panel">
                    <div className="staff-detail-hero">
                      <p className="text-[10px] font-bold text-white/60">
                        {selected.bookingType === 'Match' ? 'Mã đơn ghép trận' : 'Mã đơn đặt sân'}
                      </p>
                      <h2>{selected.bookingCode}</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="staff-status">
                          {selected.bookingType === 'Match' ? 'Ghép trận' : 'Đặt sân'}
                        </span>
                        <span className="staff-status">
                          {viLabel(bookingStatusLabel, selected.bookingStatus)}
                        </span>
                        <span className="staff-status">
                          {viLabel(checkInStatusLabel, currentCheckInStatus)}
                        </span>
                      </div>
                    </div>
                    <div className="staff-detail-body">
                      <dl className="staff-detail-grid">
                        <div className="staff-detail-item">
                          <dt>{selected.bookingType === 'Match' ? 'Chủ trận' : 'Khách hàng'}</dt>
                          <dd>{selected.playerName}</dd>
                        </div>
                        <div className="staff-detail-item">
                          <dt>Khung giờ</dt>
                          <dd>{time(selected.startTime)} - {time(selected.endTime)}</dd>
                        </div>
                        <div className="staff-detail-item">
                          <dt>Sân</dt>
                          <dd>{selected.venueName}, Sân {selected.courtNumber}</dd>
                        </div>
                        <div className="staff-detail-item">
                          <dt>Thanh toán</dt>
                          <dd>
                            {money.format(selected.amount)}
                            <span className="block font-medium text-[#627168]">
                              {viLabel(paymentStatusLabel, selected.paymentStatus)}
                            </span>
                          </dd>
                        </div>
                      </dl>
                      {selected.bookingType === 'Match' && (
                        <p className="text-[11px] font-semibold text-[#627168]">
                          {selected.checkedInParticipantCount}/{selected.participantCount} thành viên đã vào sân
                        </p>
                      )}
                    </div>
                  </section>

                  <section className="staff-panel">
                    <div className="staff-section">
                      <h3 className="staff-detail-title">Thao tác tại quầy</h3>

                      {selected.bookingType === 'Match' ? (
                        <div className="staff-participants">
                          {selected.participants.map((participant, index) => {
                            const isProcessed = participant.attendanceStatus !== 'Pending';
                            const attendanceClass = participant.attendanceStatus === 'Present'
                              ? 'is-success'
                              : participant.attendanceStatus === 'Absent'
                                ? 'is-danger'
                                : 'is-neutral';

                            return (
                              <article className="staff-participant" key={participant.playerId}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-[12px] font-extrabold">
                                      {index + 1}. {participant.playerName}
                                    </p>
                                    {participant.isHost && (
                                      <p className="mt-0.5 text-[10px] font-bold text-[#477313]">Chủ trận</p>
                                    )}
                                    <p className="mt-1 text-[10px] text-[#627168]">
                                      {viLabel(paymentStatusLabel, participant.paymentStatus)}
                                    </p>
                                    {participant.attendanceAt && (
                                      <p className="mt-1 text-[10px] text-[#627168]">
                                        {dateTime(participant.attendanceAt)}
                                      </p>
                                    )}
                                  </div>
                                  <span className={`staff-status ${attendanceClass}`}>
                                    {viLabel(attendanceStatusLabel, participant.attendanceStatus)}
                                  </span>
                                </div>

                                {!isProcessed && (
                                  <div className="staff-participant__actions">
                                    <button
                                      className="staff-button"
                                      disabled={isBusy || !hasPermission('CheckIn') || selected.bookingStatus !== 'Confirmed' || !selected.codeVerifiedAt || !selected.isCheckInWindowOpen || participant.paymentStatus !== 'Paid'}
                                      onClick={() => window.confirm(`Xác nhận ${participant.playerName} đã vào sân?`)
                                        && void runParticipantAction(
                                        checkInStaffMatchParticipant,
                                        participant.playerId,
                                        `Đã xác nhận ${participant.playerName} vào sân.`,
                                      )}
                                      type="button"
                                    >
                                      <UserCheck aria-hidden="true" className="h-3.5 w-3.5" />
                                      Xác nhận vào sân
                                    </button>
                                    <button
                                      className="staff-button-danger"
                                      disabled={isBusy || !hasPermission('MarkNoShow') || selected.bookingStatus !== 'Confirmed' || !selected.canMarkNoShow || participant.paymentStatus !== 'Paid'}
                                      onClick={() => window.confirm(`Xác nhận ${participant.playerName} vắng mặt?`)
                                        && void runParticipantAction(
                                          markStaffMatchParticipantNoShow,
                                          participant.playerId,
                                          `Đã đánh dấu ${participant.playerName} vắng mặt.`,
                                        )}
                                      type="button"
                                    >
                                      <UserX aria-hidden="true" className="h-3.5 w-3.5" />
                                      Đánh dấu vắng mặt
                                    </button>
                                  </div>
                                )}
                              </article>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="staff-actions">
                          {hasCheckInGroups && (
                            <label>
                              <span className="staff-label">Sân và khung giờ cần xử lý</span>
                              <select
                                className="staff-control"
                                onChange={(event) => {
                                  setSelectedCheckInGroupId(event.target.value ? Number(event.target.value) : null);
                                  setSearchCode('');
                                  setError('');
                                  setSuccess('');
                                }}
                                value={selectedCheckInGroupId ?? ''}
                              >
                                <option value="">Chọn sân / khung giờ</option>
                                {selected.checkInGroups.map((group) => (
                                  <option key={group.bookingCheckInGroupId} value={group.bookingCheckInGroupId}>
                                    Sân {group.courtNumber}, {time(group.startTime)} - {time(group.endTime)} · {viLabel(checkInStatusLabel, group.checkInStatus)}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          {missingCheckInGroup && (
                            <p className="text-[11px] font-semibold text-[#8a5b0f]">
                              Chọn sân / khung giờ hoặc quét đúng mã check-in trước khi thao tác.
                            </p>
                          )}
                          {selectedCheckInGroup && (
                            <p className="mb-3 text-[11px] font-semibold text-[#477313]">
                              Mã {selectedCheckInGroup.checkInCode}: Sân {selectedCheckInGroup.courtNumber}, {time(selectedCheckInGroup.startTime)} - {time(selectedCheckInGroup.endTime)}
                            </p>
                          )}
                          {selected.paymentMethod === 'AtCourt' && selected.paymentStatus !== 'Paid' && (
                            <button
                              className="staff-button-secondary"
                              disabled={isBusy || !hasPermission('ConfirmPayment')}
                              onClick={() => void runAction(
                                confirmStaffAtCourtPayment,
                                'Đã ghi nhận thanh toán tại sân.',
                              )}
                              type="button"
                            >
                              <Banknote aria-hidden="true" className="h-4 w-4" />
                              Xác nhận đã nhận tiền
                            </button>
                          )}
                          <button
                            className="staff-button"
                            disabled={isBusy || !hasPermission('CheckIn') || selected.bookingStatus !== 'Confirmed' || missingCheckInGroup || !currentCodeVerifiedAt || !currentCheckInWindowOpen || selected.paymentStatus !== 'Paid' || currentCheckInStatus !== 'Ready'}
                            onClick={() => window.confirm('Xác nhận người chơi đã vào sân?')
                              && (selectedCheckInGroup
                                ? void runCheckInGroupAction(checkInStaffCheckInGroup, 'Đã xác nhận người chơi vào sân.')
                                : void runAction(checkInStaffBooking, 'Đã xác nhận người chơi vào sân.'))}
                            type="button"
                          >
                            <UserCheck aria-hidden="true" className="h-4 w-4" />
                            Xác nhận vào sân
                          </button>
                          <button
                            className="staff-button-danger"
                            disabled={isBusy || !hasPermission('MarkNoShow') || selected.bookingStatus !== 'Confirmed' || missingCheckInGroup || !currentCanMarkNoShow || currentCheckInStatus !== 'Ready'}
                            onClick={() => window.confirm('Xác nhận người chơi không đến sân?')
                              && (selectedCheckInGroup
                                ? void runCheckInGroupAction(markStaffCheckInGroupNoShow, 'Đã đánh dấu vắng mặt.')
                                : void runAction(markStaffBookingNoShow, 'Đã đánh dấu vắng mặt.'))}
                            type="button"
                          >
                            <UserX aria-hidden="true" className="h-4 w-4" />
                            Đánh dấu vắng mặt
                          </button>
                        </div>
                      )}

                      <p className="mt-3 text-[10px] leading-5 text-[#627168]">
                        Cho phép vào sân từ 30 phút trước giờ chơi. Có thể đánh dấu vắng mặt sau giờ bắt đầu 15 phút.
                      </p>
                    </div>

                    <div className="staff-section">
                      <h3 className="staff-detail-title">Tiến trình tại quầy</h3>
                      <div className="staff-progress">
                        {[
                          { label: 'Xác minh mã', done: Boolean(currentCodeVerifiedAt), at: currentCodeVerifiedAt },
                          {
                            label: selected.bookingType === 'Match' ? 'Thanh toán cả nhóm' : 'Thanh toán tại sân',
                            done: selected.paymentMethod !== 'AtCourt' || selected.paymentStatus === 'Paid',
                            at: selected.paymentConfirmedAt,
                          },
                          {
                            label: 'Xác nhận vào sân',
                            done: currentCheckInStatus === 'CheckedIn',
                            at: selectedCheckInGroup?.checkedInAt ?? selected.checkedInAt,
                          },
                        ].map((step) => (
                          <div className="staff-progress__item" key={step.label}>
                            <span className="staff-progress__icon">
                              {step.done
                                ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                                : <Clock3 aria-hidden="true" className="h-4 w-4 text-[#8a5b0f]" />}
                            </span>
                            <div>
                              <p className="text-[11px] font-extrabold">{step.label}</p>
                              <p className="mt-0.5 text-[10px] text-[#627168]">
                                {step.done ? dateTime(step.at) : 'Chưa hoàn tất'}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </motion.div>
              )}

              <section className="staff-panel staff-section">
                <h3 className="staff-detail-title flex items-center gap-2">
                  <BellRing aria-hidden="true" className="h-[18px] w-[18px] text-[#477313]" />
                  Thông báo vận hành
                </h3>
                <div className="staff-notifications">
                  {notifications.slice(0, 6).map((item, index) => (
                    <button
                      className="staff-notification"
                      key={`${item.type}-${item.bookingId}-${index}`}
                      onClick={() => {
                        const booking = bookings.find((entry) => entry.bookingId === item.bookingId);
                        if (booking) selectBooking(booking);
                      }}
                      type="button"
                    >
                      <AlertTriangle
                        aria-hidden="true"
                        className={`mt-0.5 h-4 w-4 ${item.type === 'Overdue' ? 'text-[#9a6512]' : 'text-[#477313]'}`}
                      />
                      <span className="min-w-0">
                        <span className="block text-[11px] font-extrabold leading-5">
                          {vietnameseMessage(item.message)}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-[#627168]">
                          {time(item.startTime)}
                        </span>
                      </span>
                    </button>
                  ))}
                  {!notifications.length && (
                    <p className="py-2 text-[11px] text-[#627168]">Không có cảnh báo mới.</p>
                  )}
                </div>
              </section>
            </div>
          </aside>
        </section>
        )}

        {workspaceMode === 'tickets' && (
          <section className="staff-workspace">
            <section className="staff-panel">
              <div className="staff-panel__header">
                <div>
                  <h2>
                    Buổi xé vé ngày {new Intl.DateTimeFormat('vi-VN').format(new Date(date + 'T00:00:00'))}
                  </h2>
                  <p>Chỉ hiển thị buổi tại cụm sân được phân công quyền check-in.</p>
                </div>
                <span className="staff-status is-neutral">{ticketPagination.totalCount} buổi</span>
              </div>

              {isTicketLoading ? (
                <div aria-busy="true" aria-label="Đang tải các buổi xé vé" role="status">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div className="staff-skeleton-row" key={index} />
                  ))}
                </div>
              ) : !ticketSessions.length ? (
                <div className="staff-list-state">
                  <div>
                    <span className="staff-list-state__icon">
                      <QrCode aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-[13px] font-extrabold text-[#0b2228]">Chưa có buổi xé vé</p>
                    <p className="mt-1 text-[11px]">Thử chọn ngày khác hoặc kiểm tra quyền tại cụm sân.</p>
                  </div>
                </div>
              ) : (
                <div className="staff-booking-list">
                  {ticketSessions.map((session, index) => (
                    <button
                      aria-pressed={selectedTicketSession?.ticketSessionId === session.ticketSessionId}
                      className={'staff-booking-row '
                        + (selectedTicketSession?.ticketSessionId === session.ticketSessionId ? 'is-selected' : '')}
                      key={session.ticketSessionId}
                      onClick={() => void selectTicketSession(session)}
                      type="button"
                    >
                      <span className="staff-booking-index">
                        {String((ticketPagination.page - 1) * ticketPagination.pageSize + index + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="staff-booking-code">{session.title}</p>
                          <span className="staff-type-badge is-match">Xé vé</span>
                        </div>
                        <p className="mt-1 truncate text-[11px] font-bold text-[#627168]">
                          {session.skillLevel} · {session.playFormat}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-[#627168]">
                          <MapPin aria-hidden="true" className="mr-1 inline h-3 w-3" />
                          {session.venueName}, Sân {session.courtNumber}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="whitespace-nowrap text-[12px] font-extrabold">
                          {time(session.startTime)} - {time(session.endTime)}
                        </p>
                        <p className="mt-1 truncate text-[10px] text-[#627168]">
                          {money.format(session.ticketPrice)}/vé
                        </p>
                      </div>
                      <div className="min-w-0">
                        <span className={'staff-status ' + (session.remainingTickets > 0 ? 'is-ready' : 'is-warning')}>
                          {session.soldTickets}/{session.maxPlayers} vé
                        </span>
                        <p className="mt-1.5 truncate text-[10px] font-bold text-[#627168]">
                          Còn {session.remainingTickets} chỗ
                        </p>
                      </div>
                      <ArrowRight aria-hidden="true" className="hidden h-4 w-4 text-[#627168] sm:block" />
                    </button>
                  ))}
                </div>
              )}

              {ticketPagination.totalPages > 1 && (
                <div className="staff-pagination">
                  <PaginationControls
                    page={ticketPagination}
                    onPageChange={(nextPage) => {
                      setTicketsPage(nextPage);
                      setSelectedTicketSession(null);
                      setTicketParticipants([]);
                    }}
                  />
                </div>
              )}
            </section>

            <aside className="staff-detail-column" ref={detailPanelRef}>
              {!selectedTicketSession ? (
                <div className="staff-empty-detail">
                  <div>
                    <span className="staff-empty-detail__icon">
                      <UserCheck aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <p className="mt-3 text-[13px] font-extrabold">Chọn buổi xé vé</p>
                    <p className="mt-1 max-w-[32ch] text-[11px] leading-5 text-[#627168]">
                      Danh sách người tham gia và trạng thái check-in sẽ xuất hiện tại đây.
                    </p>
                  </div>
                </div>
              ) : (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className="staff-detail-stack"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }}
                  key={selectedTicketSession.ticketSessionId}
                  transition={{ duration: shouldReduceMotion ? 0.01 : 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                >
                  <section className="staff-panel">
                    <div className="staff-detail-hero">
                      <p className="text-[10px] font-bold text-white/60">Buổi xé vé</p>
                      <h2 className="break-words">{selectedTicketSession.title}</h2>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="staff-status">Sân {selectedTicketSession.courtNumber}</span>
                        <span className="staff-status">{selectedTicketSession.skillLevel}</span>
                        <span className="staff-status">{selectedTicketSession.playFormat}</span>
                      </div>
                    </div>
                    <div className="staff-detail-body">
                      <dl className="staff-detail-grid">
                        <div className="staff-detail-item">
                          <dt>Cụm sân</dt>
                          <dd>{selectedTicketSession.venueName}</dd>
                        </div>
                        <div className="staff-detail-item">
                          <dt>Khung giờ</dt>
                          <dd>{time(selectedTicketSession.startTime)} - {time(selectedTicketSession.endTime)}</dd>
                        </div>
                        <div className="staff-detail-item">
                          <dt>Vé đã bán</dt>
                          <dd>{selectedTicketSession.soldTickets}/{selectedTicketSession.maxPlayers}</dd>
                        </div>
                        <div className="staff-detail-item">
                          <dt>Giá vé</dt>
                          <dd>{money.format(selectedTicketSession.ticketPrice)}</dd>
                        </div>
                      </dl>
                    </div>
                  </section>

                  <section className="staff-panel">
                    <div className="staff-section">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="staff-detail-title">Người tham gia</h3>
                          <p className="mt-1 text-[10px] text-[#627168]">
                            {ticketParticipants.length} vé trong danh sách
                          </p>
                        </div>
                        <span className="staff-status is-success">
                          {ticketParticipants.filter((item) => item.ticketStatus === 'CheckedIn').length} đã vào sân
                        </span>
                      </div>

                      {!canCheckInSelectedTicket && (
                        <p className="mt-3 text-[11px] font-semibold text-[#a32e28]">
                          Bạn chưa được cấp quyền check-in tại cụm sân này.
                        </p>
                      )}

                      {isTicketDetailLoading ? (
                        <div aria-busy="true" className="mt-3" role="status">
                          {Array.from({ length: 4 }).map((_, index) => (
                            <div className="staff-skeleton-row" key={index} />
                          ))}
                        </div>
                      ) : !ticketParticipants.length ? (
                        <p className="mt-4 text-center text-[11px] text-[#627168]">Chưa có người đăng ký.</p>
                      ) : (
                        <div className="staff-participants">
                          {ticketParticipants.map((participant, index) => {
                            const isCheckedIn = participant.ticketStatus === 'CheckedIn'
                              || Boolean(participant.checkedInAt);
                            const isPaid = participant.ticketStatus === 'Paid'
                              && participant.paymentStatus === 'Paid';
                            const statusClass = isCheckedIn
                              ? 'is-success'
                              : isPaid
                                ? 'is-ready'
                                : participant.ticketStatus === 'Cancelled'
                                  || participant.ticketStatus === 'Expired'
                                  || participant.ticketStatus === 'Refunded'
                                  ? 'is-danger'
                                  : 'is-warning';

                            return (
                              <article className="staff-participant" key={participant.sessionTicketId}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="text-[12px] font-extrabold">
                                      {index + 1}. {participant.playerName}
                                    </p>
                                    <p className="mt-1 break-all font-mono text-[10px] font-bold text-[#477313]">
                                      {participant.ticketCode}
                                    </p>
                                    <p className="mt-1 text-[10px] text-[#627168]">
                                      {viLabel(paymentStatusLabel, participant.paymentStatus)}
                                      {participant.checkedInAt ? ' · ' + dateTime(participant.checkedInAt) : ''}
                                    </p>
                                  </div>
                                  <span className={'staff-status ' + statusClass}>
                                    {viLabel(ticketStatusLabel, participant.ticketStatus)}
                                  </span>
                                </div>
                                <button
                                  className="staff-button mt-3 w-full"
                                  disabled={isBusy || !canCheckInSelectedTicket || !isPaid || isCheckedIn}
                                  onClick={() => window.confirm('Xác nhận ' + participant.playerName + ' đã vào sân?')
                                    && void runTicketCheckIn(participant.ticketCode)}
                                  type="button"
                                >
                                  {isCheckedIn
                                    ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
                                    : <UserCheck aria-hidden="true" className="h-4 w-4" />}
                                  {isCheckedIn ? 'Đã check-in' : isPaid ? 'Check-in vé' : 'Chưa thể check-in'}
                                </button>
                              </article>
                            );
                          })}
                        </div>
                      )}

                      <p className="mt-3 text-[10px] leading-5 text-[#627168]">
                        Hệ thống chỉ cho phép vé đã thanh toán check-in trong khung giờ hợp lệ và từ chối vé đã dùng.
                      </p>
                    </div>
                  </section>
                </motion.div>
              )}
            </aside>
          </section>
        )}
      </main>
    </div>
  );
};
