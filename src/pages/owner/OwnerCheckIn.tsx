import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  QrCode,
  RefreshCw,
  ScanLine,
  Search,
  Ticket,
  UsersRound,
  UserX,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  confirmOwnerAtCourtPayment,
  getOwnerCheckInBookings,
  markOwnerBookingGroupNoShow,
  markOwnerBookingNoShow,
  markOwnerMatchParticipantNoShow,
  searchOwnerCheckInBooking,
  verifyOwnerCheckInCode,
} from '../../api/ownerCheckIn';
import { getOwnerVenues, type OwnerVenue } from '../../api/owner';
import { checkInOwnerTicketByCode, getOwnerCheckInTickets, type SessionTicket } from '../../api/ticketing';
import type { StaffBooking } from '../../api/staff';
import { useAuth } from '../../auth/AuthContext';
import { useApiQuery } from '../../hooks/useApiQuery';
import { OwnerShell } from './components/OwnerShell';
import { useConfirm } from '../../components/ui/ConfirmDialogRegion';

const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});
const time = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
}).format(new Date(value));
const localToday = () => {
  const value = new Date();
  return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
};

const checkInLabels: Record<string, string> = {
  NotOpen: 'Chưa mở',
  Ready: 'Sẵn sàng',
  CheckedIn: 'Đã check-in',
  NoShow: 'Vắng mặt',
  Cancelled: 'Đã hủy',
};
const paymentLabels: Record<string, string> = {
  Pending: 'Chờ thanh toán',
  WaitingForConfirmation: 'Chờ xác nhận',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
  Refunded: 'Đã đối soát',
};
const attendanceLabels: Record<string, string> = {
  Pending: 'Chờ điểm danh',
  Present: 'Đã vào sân',
  Absent: 'Vắng mặt',
};
const ticketStatusLabels: Record<string, string> = {
  PendingPayment: 'Chờ thanh toán',
  Paid: 'Đã thanh toán',
  CheckedIn: 'Đã check-in',
  Cancelled: 'Đã hủy',
  Expired: 'Hết thời gian giữ',
  RefundPending: 'Chờ đối soát',
  Refunded: 'Đã đối soát',
};
const statusClass = (status: string) => status === 'CheckedIn' || status === 'Present'
  ? 'bg-[#e2ff57]/55 text-[#17310a]'
  : status === 'NoShow' || status === 'Absent' || status === 'Cancelled' || status === 'Expired'
    ? 'bg-red-50 text-red-700'
    : 'bg-amber-50 text-amber-800';

type BookingAction = (token: string, bookingId: number) => Promise<StaffBooking>;
type GroupAction = (token: string, bookingId: number, groupId: number) => Promise<StaffBooking>;
type ParticipantAction = (token: string, bookingId: number, playerId: number) => Promise<StaffBooking>;

const emptyBookings: StaffBooking[] = [];
const emptyTickets: SessionTicket[] = [];
const emptyVenues: OwnerVenue[] = [];

export const OwnerCheckIn = () => {
  const { token } = useAuth();
  const confirm = useConfirm();
  const [date, setDate] = useState(localToday);
  const [bookingType, setBookingType] = useState<'all' | 'Court' | 'Match' | 'Ticket'>('all');
  const [venueId, setVenueId] = useState(0);
  const [selected, setSelected] = useState<StaffBooking | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SessionTicket | null>(null);
  const [code, setCode] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const showingTickets = bookingType === 'Ticket';

  const {
    data: bookings = emptyBookings,
    error: bookingsError,
    loading: isBookingsLoading,
    refresh: loadBookings,
    setData: setBookings,
  } = useApiQuery(
    ['owner-check-in', token, date, bookingType, venueId],
    async () => {
      const getPage = (page: number) => getOwnerCheckInBookings(
        token!,
        date,
        { page, pageSize: 100 },
        bookingType === 'Court' || bookingType === 'Match' ? bookingType : undefined,
        venueId || undefined,
      );
      const firstPage = await getPage(1);
      // ponytail: A daily queue is bounded; add visible pagination only if loading every page becomes measurable.
      const remainingPages = await Promise.all(Array.from(
        { length: Math.max(0, firstPage.totalPages - 1) },
        (_, index) => getPage(index + 2),
      ));
      return [firstPage, ...remainingPages].flatMap((page) => page.items);
    },
    { enabled: Boolean(token) && !showingTickets, errorMessage: 'Không thể tải danh sách check-in.' },
  );

  const {
    data: tickets = emptyTickets,
    error: ticketsError,
    loading: isTicketsLoading,
    refresh: loadTickets,
    setData: setTickets,
  } = useApiQuery(
    ['owner-check-in-tickets', token, date, venueId],
    async () => {
      const getPage = (page: number) => getOwnerCheckInTickets(
        token!, date, venueId || undefined, { page, pageSize: 100 },
      );
      const firstPage = await getPage(1);
      const remainingPages = await Promise.all(Array.from(
        { length: Math.max(0, firstPage.totalPages - 1) },
        (_, index) => getPage(index + 2),
      ));
      return [firstPage, ...remainingPages].flatMap((page) => page.items);
    },
    { enabled: Boolean(token) && showingTickets, errorMessage: 'Không thể tải danh sách vé xé.' },
  );

  const isLoading = showingTickets ? isTicketsLoading : isBookingsLoading;

  const { data: venues = emptyVenues, error: venuesError } = useApiQuery(
    ['owner-venues', token],
    () => getOwnerVenues(token!),
    { enabled: Boolean(token), errorMessage: 'Không thể tải danh sách cụm sân.' },
  );

  const error = actionError || bookingsError || ticketsError || venuesError;
  const setError = setActionError;

  // Keep the open detail pane pointing at the freshest copy of its booking.
  useEffect(() => {
    setSelected((current) => current
      ? bookings.find((item) => item.bookingId === current.bookingId) ?? null
      : null);
  }, [bookings]);

  // Same, but for the ticket detail pane.
  useEffect(() => {
    setSelectedTicket((current) => current
      ? tickets.find((item) => item.sessionTicketId === current.sessionTicketId) ?? null
      : null);
  }, [tickets]);

  const selectedGroup = useMemo(
    () => selected?.checkInGroups.find((item) => item.bookingCheckInGroupId === selectedGroupId) ?? null,
    [selected, selectedGroupId],
  );

  const chooseBooking = (booking: StaffBooking, groupId?: number | null) => {
    setSelected(booking);
    setSelectedTicket(null);
    setSelectedGroupId(groupId
      ?? booking.checkInGroups.find((item) => item.isCheckInWindowOpen)?.bookingCheckInGroupId
      ?? booking.checkInGroups.find((item) => item.canMarkNoShow)?.bookingCheckInGroupId
      ?? booking.checkInGroups[0]?.bookingCheckInGroupId ?? null);
    setError('');
    setSuccess('');
  };

  const updateBooking = (booking: StaffBooking) => {
    setBookings((current) => {
      const items = current ?? emptyBookings;
      const exists = items.some((item) => item.bookingId === booking.bookingId);
      return exists
        ? items.map((item) => item.bookingId === booking.bookingId ? booking : item)
        : [booking, ...items];
    });
    setSelected(booking);
    setSelectedTicket(null);
  };

  const chooseTicket = (ticket: SessionTicket) => {
    setSelectedTicket(ticket);
    setSelected(null);
    setError('');
    setSuccess('');
  };

  const updateTicket = (ticket: SessionTicket) => {
    setTickets((current) => {
      const items = current ?? emptyTickets;
      const exists = items.some((item) => item.sessionTicketId === ticket.sessionTicketId);
      return exists
        ? items.map((item) => item.sessionTicketId === ticket.sessionTicketId ? ticket : item)
        : [ticket, ...items];
    });
    setSelectedTicket(ticket);
    setSelected(null);
  };

  const checkInSelectedTicket = async () => {
    if (!token || !selectedTicket) return;
    setBusyKey('ticket-check-in');
    setError('');
    setSuccess('');
    try {
      const ticket = await checkInOwnerTicketByCode(token, selectedTicket.ticketCode);
      updateTicket(ticket);
      setSuccess('Đã check-in vé ' + ticket.ticketCode + ' cho ' + (ticket.playerName ?? 'người chơi') + '.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể check-in vé.');
    } finally {
      setBusyKey('');
    }
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim();
    if (!token || !normalized) return;
    setBusyKey('verify');
    setError('');
    setSuccess('');
    try {
      if (normalized.toUpperCase().startsWith('PL-')) {
        const booking = await searchOwnerCheckInBooking(token, normalized);
        updateBooking(booking);
        setSelectedGroupId(
          booking.checkInGroups.find((item) => item.isCheckInWindowOpen)?.bookingCheckInGroupId
          ?? booking.checkInGroups[0]?.bookingCheckInGroupId
          ?? null,
        );
        setSuccess('Đã tìm thấy booking. Mã booking chỉ dùng để xem thông tin; hãy quét mã check-in để check-in.');
        return;
      }

      let booking: StaffBooking;
      try {
        booking = await verifyOwnerCheckInCode(token, normalized);
      } catch (bookingError) {
        // The scan/check-in codes for regular bookings and ticket-session tickets share the
        // same 6-character alphabet with no distinguishing prefix, so a code that doesn't
        // match any booking is tried against ticket check-in next.
        if (bookingError instanceof ApiError && bookingError.status === 404) {
          const ticket = await checkInOwnerTicketByCode(token, normalized);
          updateTicket(ticket);
          setSuccess('Đã check-in vé ' + ticket.ticketCode + ' cho ' + (ticket.playerName ?? 'người chơi') + '.');
          return;
        }
        throw bookingError;
      }
      const group = booking.verifiedCheckInGroupId
        ? booking.checkInGroups.find(
          (item) => item.bookingCheckInGroupId === booking.verifiedCheckInGroupId,
        )
        : undefined;
      const verifiedParticipant = booking.verifiedPlayerId
        ? booking.participants.find((item) => item.playerId === booking.verifiedPlayerId)
        : undefined;
      updateBooking(booking);
      setSelectedGroupId(group?.bookingCheckInGroupId ?? null);
      if (verifiedParticipant) {
        setSuccess(verifiedParticipant.attendanceStatus === 'Present'
          ? 'Đã check-in ' + verifiedParticipant.playerName + ' bằng mã cá nhân.'
          : verifiedParticipant.playerName + ' đã được đánh dấu vắng mặt.');
        return;
      }
      setSuccess(group
        ? 'Đã check-in đúng sân và khung giờ.'
        : 'Mã check-in hợp lệ.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Mã check-in không hợp lệ.');
    } finally {
      setBusyKey('');
    }
  };

  const runBookingAction = async (key: string, action: BookingAction, message: string) => {
    if (!token || !selected) return;
    setBusyKey(key);
    setError('');
    setSuccess('');
    try {
      updateBooking(await action(token, selected.bookingId));
      setSuccess(message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Thao tác không thành công.');
    } finally {
      setBusyKey('');
    }
  };

  const runGroupAction = async (key: string, action: GroupAction, message: string) => {
    if (!token || !selected || !selectedGroup) return;
    setBusyKey(key);
    setError('');
    setSuccess('');
    try {
      updateBooking(await action(token, selected.bookingId, selectedGroup.bookingCheckInGroupId));
      setSuccess(message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Thao tác không thành công.');
    } finally {
      setBusyKey('');
    }
  };

  const runParticipantAction = async (
    key: string,
    action: ParticipantAction,
    playerId: number,
    message: string,
  ) => {
    if (!token || !selected) return;
    setBusyKey(key);
    setError('');
    setSuccess('');
    try {
      updateBooking(await action(token, selected.bookingId, playerId));
      setSuccess(message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Thao tác không thành công.');
    } finally {
      setBusyKey('');
    }
  };

  const currentStatus = selectedGroup?.checkInStatus ?? selected?.checkInStatus;
  const currentCanNoShow = selectedGroup?.canMarkNoShow ?? selected?.canMarkNoShow ?? false;
  const checkedInCount = showingTickets
    ? tickets.filter((item) => item.status === 'CheckedIn').length
    : bookings.filter((item) => item.checkInStatus === 'CheckedIn').length;
  const readyCount = showingTickets
    ? tickets.filter((item) => item.status === 'Paid').length
    : bookings.filter((item) => item.checkInStatus === 'Ready').length;
  const listCount = showingTickets ? tickets.length : bookings.length;

  return (
    <OwnerShell activeId="checkIn" innerClassName="max-w-[1420px]">
      <section className="owner-page-header">
        <div>
          <p className="owner-kicker"><ScanLine className="h-4 w-4" /> Vận hành tại quầy</p>
          <h1 className="mt-2">Check-in khách vào sân</h1>
          <p className="mt-1">Quét mã, xác nhận thanh toán tại sân và điểm danh đơn đặt sân, ghép trận hoặc vé xé sân.</p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 text-[13px] font-extrabold text-on-surface hover:bg-surface-container-low"
          to="/owner/ticket-sessions"
        >
          <Ticket className="h-4 w-4" />
          Quản lý buổi xé vé
        </Link>
      </section>

      <section className="owner-panel p-4 sm:p-5">
        <form className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_190px_auto]" onSubmit={verifyCode}>
          <label>
            <span className="mb-1.5 block text-[11px] font-extrabold text-on-surface-variant">Mã booking / khung giờ / người chơi / vé xé</span>
            <span className="flex h-11 items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <QrCode className="h-4 w-4 shrink-0 text-primary" />
              <input
                autoComplete="off"
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-[14px] font-bold outline-none"
                onChange={(event) => setCode(event.target.value)}
                placeholder="Quét hoặc nhập mã PL- / CI- / mã vé xé"
                value={code}
              />
            </span>
          </label>
          <label>
            <span className="mb-1.5 block text-[11px] font-extrabold text-on-surface-variant">Ngày vận hành</span>
            <input
              className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[13px] font-bold outline-none focus:border-primary"
              onChange={(event) => setDate(event.target.value)}
              type="date"
              value={date}
            />
          </label>
          <button
            className="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#173b31] px-5 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!code.trim() || busyKey === 'verify'}
            type="submit"
          >
            {busyKey === 'verify'
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : code.trim().toUpperCase().startsWith('PL-')
                ? <Search className="h-4 w-4" />
                : <ScanLine className="h-4 w-4" />}
            {code.trim().toUpperCase().startsWith('PL-') ? 'Xem thông tin' : 'Quét & check-in'}
          </button>
        </form>

        <div className="mt-4 grid gap-4 border-t border-outline-variant pt-4">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-extrabold text-on-surface-variant">Lọc theo cụm sân</p>
            <div className="flex flex-wrap gap-2">
              <button
                aria-pressed={venueId === 0}
                className={'rounded-full border px-3 py-2 text-[11px] font-extrabold transition ' + (venueId === 0
                  ? 'border-[#173b31] bg-[#173b31] text-white'
                  : 'border-outline-variant bg-white text-on-surface-variant hover:border-[#9cad71]')}
                onClick={() => setVenueId(0)}
                type="button"
              >
                Tất cả cụm sân
              </button>
              {venues.map((venue) => (
                <button
                  aria-pressed={venueId === venue.venueId}
                  className={'rounded-full border px-3 py-2 text-[11px] font-extrabold transition ' + (venueId === venue.venueId
                    ? 'border-[#173b31] bg-[#173b31] text-white'
                    : 'border-outline-variant bg-white text-on-surface-variant hover:border-[#9cad71]')}
                  key={venue.venueId}
                  onClick={() => setVenueId(venue.venueId)}
                  type="button"
                >
                  {venue.venueName}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-extrabold text-on-surface-variant">Lọc theo loại đơn</p>
            <div className="flex flex-wrap gap-2">
              {([
                { value: 'all', label: 'Tất cả đơn' },
                { value: 'Court', label: 'Đặt sân' },
                { value: 'Match', label: 'Ghép trận' },
                { value: 'Ticket', label: 'Xé vé' },
              ] as const).map((item) => (
                <button
                  aria-pressed={bookingType === item.value}
                  className={'rounded-full border px-3 py-2 text-[11px] font-extrabold transition ' + (bookingType === item.value
                    ? 'border-[#e2ff57] bg-[#e2ff57] text-[#17310a]'
                    : 'border-outline-variant bg-white text-on-surface-variant hover:border-[#9cad71]')}
                  key={item.value}
                  onClick={() => setBookingType(item.value)}
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700" role="alert">{error}</div>}
      {success && <div className="rounded-lg border border-[#b8d66a] bg-[#f4fbdc] px-4 py-3 text-[13px] font-bold text-[#315516]" role="status">{success}</div>}

      <div className="grid min-h-[540px] gap-5 xl:grid-cols-[minmax(360px,0.8fr)_minmax(520px,1.2fr)]">
        <section className="owner-panel">
          <div className="flex items-center justify-between gap-3 border-b border-outline-variant p-4">
            <div>
              <p className="text-[14px] font-extrabold">Danh sách trong ngày</p>
              <p className="mt-1 text-[11px] font-semibold text-on-surface-variant">
                {listCount} {showingTickets ? 'vé' : 'đơn'} · {readyCount} {showingTickets ? 'chờ check-in' : 'sẵn sàng'} · {checkedInCount} đã check-in
              </p>
            </div>
            <button
              aria-label="Tải lại danh sách"
              className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low"
              disabled={isLoading}
              onClick={() => void (showingTickets ? loadTickets() : loadBookings())}
              type="button"
            >
              <RefreshCw className={'h-4 w-4 ' + (isLoading ? 'animate-spin' : '')} />
            </button>
          </div>

          <div className="max-h-[620px] space-y-2 overflow-y-auto p-3">
            {isLoading && listCount === 0 && (
              <div className="flex min-h-44 items-center justify-center gap-2 text-[13px] font-bold text-on-surface-variant">
                <Loader2 className="h-4 w-4 animate-spin" /> {showingTickets ? 'Đang tải vé xé...' : 'Đang tải booking...'}
              </div>
            )}
            {!isLoading && listCount === 0 && (
              <div className="flex min-h-44 flex-col items-center justify-center px-4 text-center">
                <CalendarDays className="h-7 w-7 text-on-surface-variant" />
                <p className="mt-3 text-[13px] font-extrabold">{showingTickets ? 'Không có vé xé trong ngày này' : 'Không có booking trong ngày này'}</p>
                <p className="mt-1 text-[11px] text-on-surface-variant">Đổi ngày hoặc quét trực tiếp mã check-in của khách.</p>
              </div>
            )}
            {showingTickets ? tickets.map((ticket) => (
              <button
                className={'w-full rounded-xl border p-3 text-left transition ' + (selectedTicket?.sessionTicketId === ticket.sessionTicketId
                  ? 'border-[#315516] bg-[#f4fbdc]'
                  : 'border-outline-variant bg-white hover:border-[#9cad71] hover:bg-surface-container-low')}
                key={ticket.sessionTicketId}
                onClick={() => chooseTicket(ticket)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold">{ticket.ticketCode}</p>
                    <p className="mt-1 truncate text-[11px] font-semibold text-on-surface-variant">
                      {ticket.playerName} · {ticket.session?.venueName ?? ''}
                    </p>
                  </div>
                  <span className={'shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold ' + statusClass(ticket.status)}>
                    {ticketStatusLabels[ticket.status] ?? ticket.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-bold">
                    <Clock3 className="h-3.5 w-3.5" />
                    {ticket.session ? `${time(ticket.session.startTime)}–${time(ticket.session.endTime)}` : '—'}
                  </span>
                  <span className="truncate font-bold text-on-surface-variant">{ticket.session?.title ?? 'Vé xé sân'}</span>
                </div>
              </button>
            )) : bookings.map((booking) => (
              <button
                className={'w-full rounded-xl border p-3 text-left transition ' + (selected?.bookingId === booking.bookingId
                  ? 'border-[#315516] bg-[#f4fbdc]'
                  : 'border-outline-variant bg-white hover:border-[#9cad71] hover:bg-surface-container-low')}
                key={booking.bookingId}
                onClick={() => chooseBooking(booking)}
                type="button"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold">{booking.bookingCode}</p>
                    <p className="mt-1 truncate text-[11px] font-semibold text-on-surface-variant">
                      {booking.venueName} · Sân {booking.courtNumber}
                    </p>
                  </div>
                  <span className={'shrink-0 rounded-full px-2 py-1 text-[9px] font-extrabold ' + statusClass(booking.checkInStatus)}>
                    {checkInLabels[booking.checkInStatus] ?? booking.checkInStatus}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-bold"><Clock3 className="h-3.5 w-3.5" /> {time(booking.startTime)}–{time(booking.endTime)}</span>
                  <span className="font-bold text-on-surface-variant">{booking.bookingType === 'Match' ? 'Ghép trận' : 'Đặt sân'}</span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="owner-panel">
          {selectedTicket ? (
            <>
              <div className="border-b border-outline-variant bg-[#102a26] p-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-white/60">Vé xé sân</p>
                    <h2 className="owner-checkin-booking-code mt-1 text-[24px] font-black tracking-tight">{selectedTicket.ticketCode}</h2>
                    <p className="mt-2 text-[12px] font-semibold text-white/70">{selectedTicket.playerName}{selectedTicket.session ? ' · ' + selectedTicket.session.venueName : ''}</p>
                  </div>
                  <span className={'rounded-full px-3 py-1.5 text-[10px] font-extrabold ' + statusClass(selectedTicket.status)}>
                    {ticketStatusLabels[selectedTicket.status] ?? selectedTicket.status}
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-4 sm:p-5">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-surface-container-low p-3 sm:col-span-2">
                    <dt className="text-[10px] font-bold text-on-surface-variant">Buổi chơi</dt>
                    <dd className="mt-1 text-[13px] font-extrabold">{selectedTicket.session?.title ?? '—'}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <dt className="text-[10px] font-bold text-on-surface-variant">Sân · khung giờ</dt>
                    <dd className="mt-1 text-[13px] font-extrabold">
                      {selectedTicket.session
                        ? `Sân ${selectedTicket.session.courtNumber} · ${time(selectedTicket.session.startTime)}–${time(selectedTicket.session.endTime)}`
                        : '—'}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <dt className="text-[10px] font-bold text-on-surface-variant">Thanh toán</dt>
                    <dd className="mt-1 text-[13px] font-extrabold">{money.format(selectedTicket.amount)} · {paymentLabels[selectedTicket.paymentStatus] ?? selectedTicket.paymentStatus}</dd>
                  </div>
                </dl>
                {selectedTicket.checkedInAt && (
                  <p className="text-[11px] font-semibold text-on-surface-variant">
                    Đã check-in lúc {new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(selectedTicket.checkedInAt))}.
                  </p>
                )}
                {selectedTicket.status === 'Paid' && (
                  <button
                    className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#173b31] px-4 text-[13px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-50"
                    disabled={Boolean(busyKey)}
                    onClick={() => void checkInSelectedTicket()}
                    type="button"
                  >
                    {busyKey === 'ticket-check-in' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
                    Check-in vé này
                  </button>
                )}
                <Link
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 text-[12px] font-extrabold text-on-surface hover:bg-surface-container-low"
                  to={`/owner/ticket-sessions/${selectedTicket.ticketSessionId}`}
                >
                  <Ticket className="h-4 w-4" /> Xem buổi xé vé
                </Link>
              </div>
            </>
          ) : !selected ? (
            <div className="flex min-h-[540px] flex-col items-center justify-center px-6 text-center">
              <span className="rounded-2xl bg-[#edf4d3] p-4 text-[#315516]"><QrCode className="h-7 w-7" /></span>
              <p className="mt-4 text-[16px] font-extrabold">Chọn đơn hoặc quét mã</p>
              <p className="mt-1 max-w-sm text-[12px] leading-5 text-on-surface-variant">Thông tin khách, sân con và thao tác check-in sẽ xuất hiện tại đây. Quét mã vé xé cũng được check-in ngay tại đây.</p>
            </div>
          ) : (
            <>
              <div className="border-b border-outline-variant bg-[#102a26] p-5 text-white">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-white/60">{selected.bookingType === 'Match' ? 'Đơn ghép trận' : 'Đơn đặt sân'}</p>
                    <h2 className="owner-checkin-booking-code mt-1 text-[24px] font-black tracking-tight">{selected.bookingCode}</h2>
                    <p className="mt-2 text-[12px] font-semibold text-white/70">{selected.playerName} · {selected.venueName}</p>
                  </div>
                  <span className={'rounded-full px-3 py-1.5 text-[10px] font-extrabold ' + statusClass(currentStatus ?? '')}>
                    {checkInLabels[currentStatus ?? ''] ?? currentStatus}
                  </span>
                </div>
              </div>

              <div className="space-y-5 p-4 sm:p-5">
                <dl className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <dt className="text-[10px] font-bold text-on-surface-variant">Khung giờ</dt>
                    <dd className="mt-1 text-[13px] font-extrabold">{time(selected.startTime)}–{time(selected.endTime)}</dd>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <dt className="text-[10px] font-bold text-on-surface-variant">Thanh toán</dt>
                    <dd className="mt-1 text-[13px] font-extrabold">{money.format(selected.amount)} · {paymentLabels[selected.paymentStatus] ?? selected.paymentStatus}</dd>
                  </div>
                </dl>

                {selected.bookingType === 'Court' && selected.checkInGroups.length > 0 && (
                  <div>
                    <p className="mb-2 text-[12px] font-extrabold">Chọn sân và khung giờ</p>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {selected.checkInGroups.map((group) => (
                        <button
                          className={'rounded-lg border p-3 text-left ' + (selectedGroupId === group.bookingCheckInGroupId
                            ? 'border-[#315516] bg-[#f4fbdc]'
                            : 'border-outline-variant bg-white hover:bg-surface-container-low')}
                          key={group.bookingCheckInGroupId}
                          onClick={() => {
                            setSelectedGroupId(group.bookingCheckInGroupId);
                            setError('');
                            setSuccess('');
                          }}
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-[12px] font-extrabold">Sân {group.courtNumber}</span>
                            {group.codeVerifiedAt && <CheckCircle2 className="h-4 w-4 text-[#477313]" />}
                          </div>
                          <p className="mt-1 text-[11px] font-semibold text-on-surface-variant">{time(group.startTime)}–{time(group.endTime)}</p>
                          <p className="mt-1 text-[10px] font-bold">{checkInLabels[group.checkInStatus] ?? group.checkInStatus}</p>
                        </button>
                      ))}
                    </div>
                    {selectedGroup && (
                      <p className="mt-2 text-[11px] font-semibold text-on-surface-variant">
                        Sân {selectedGroup.courtNumber}
                        {selectedGroup.checkedInAt ? ' · Đã check-in' : ' · Chưa check-in'}
                      </p>
                    )}
                  </div>
                )}

                {selected.bookingType === 'Match' ? (
                  <div>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <p className="inline-flex items-center gap-2 text-[13px] font-extrabold"><UsersRound className="h-4 w-4" /> Điểm danh người chơi</p>
                      <span className="text-[11px] font-bold text-on-surface-variant">{selected.checkedInParticipantCount}/{selected.participantCount} đã vào sân</span>
                    </div>
                    <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">
                      Quét mã cá nhân để hệ thống nhận đúng người và check-in ngay. Mã booking không dùng để check-in.
                    </p>
                    <div className="space-y-2">
                      {selected.participants.map((participant) => (
                        <article className="rounded-lg border border-outline-variant p-3" key={participant.playerId}>
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <p className="text-[12px] font-extrabold">{participant.playerName}{participant.isHost ? ' · Chủ trận' : ''}</p>
                              <p className="mt-1 text-[10px] font-semibold text-on-surface-variant">{paymentLabels[participant.paymentStatus] ?? participant.paymentStatus}</p>
                            </div>
                            <span className={'rounded-full px-2 py-1 text-[9px] font-extrabold ' + statusClass(participant.attendanceStatus)}>
                              {attendanceLabels[participant.attendanceStatus] ?? participant.attendanceStatus}
                            </span>
                          </div>
                          {participant.attendanceStatus === 'Pending' && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-extrabold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={Boolean(busyKey) || !selected.canMarkNoShow || participant.paymentStatus !== 'Paid'}
                                onClick={async () => {
                                  if (await confirm({
                                    title: `Đánh dấu ${participant.playerName} vắng mặt?`,
                                    message: 'Người chơi sẽ bị ghi nhận không đến sân trong trận này.',
                                    confirmLabel: 'Đánh dấu vắng mặt',
                                    tone: 'danger',
                                  })) void runParticipantAction('participant-' + participant.playerId, markOwnerMatchParticipantNoShow, participant.playerId, 'Đã đánh dấu người chơi vắng mặt.');
                                }}
                                type="button"
                              >
                                <UserX className="h-3.5 w-3.5" /> Vắng mặt
                              </button>
                            </div>
                          )}
                        </article>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {selected.checkInGroups.length > 0 && !selectedGroup && (
                      <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800">Chọn sân/khung giờ hoặc quét đúng mã khung giờ trước khi thao tác.</p>
                    )}
                    {selected.paymentMethod === 'AtCourt' && selected.paymentStatus !== 'Paid' && (
                      <button
                        className="mb-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#9cad71] bg-[#f4fbdc] px-4 text-[12px] font-extrabold text-[#315516] disabled:opacity-40"
                        disabled={Boolean(busyKey)}
                        onClick={async () => {
                          if (await confirm({
                            title: 'Xác nhận đã nhận đủ tiền tại sân?',
                            message: 'Booking sẽ được ghi nhận là đã thanh toán.',
                            confirmLabel: 'Đã nhận đủ',
                            tone: 'success',
                          })) void runBookingAction('payment', confirmOwnerAtCourtPayment, 'Đã xác nhận thanh toán tại sân.');
                        }}
                        type="button"
                      >
                        <Banknote className="h-4 w-4" /> Xác nhận đã nhận tiền
                      </button>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-[12px] font-extrabold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={Boolean(busyKey) || (selected.checkInGroups.length > 0 && !selectedGroup) || !currentCanNoShow || currentStatus !== 'Ready'}
                        onClick={async () => {
                          if (!(await confirm({
                            title: 'Xác nhận khách không đến sân?',
                            message: 'Booking sẽ bị ghi nhận vắng mặt và không thể check-in lại.',
                            confirmLabel: 'Đánh dấu vắng mặt',
                            tone: 'danger',
                          }))) return;
                          if (selectedGroup) void runGroupAction('no-show', markOwnerBookingGroupNoShow, 'Đã đánh dấu khách vắng mặt.');
                          else void runBookingAction('no-show', markOwnerBookingNoShow, 'Đã đánh dấu khách vắng mặt.');
                        }}
                        type="button"
                      >
                        <UserX className="h-4 w-4" /> Đánh dấu vắng mặt
                      </button>
                    </div>
                    <p className="mt-3 text-[10px] leading-5 text-on-surface-variant">Cho phép check-in từ 30 phút trước giờ chơi. Có thể đánh dấu vắng mặt sau giờ bắt đầu 15 phút.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </OwnerShell>
  );
};
