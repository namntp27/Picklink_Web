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
  Ticket,
  UserCheck,
  UsersRound,
  UserX,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  checkInOwnerBooking,
  checkInOwnerBookingGroup,
  checkInOwnerMatchParticipant,
  confirmOwnerAtCourtPayment,
  getOwnerCheckInBookings,
  markOwnerBookingGroupNoShow,
  markOwnerBookingNoShow,
  markOwnerMatchParticipantNoShow,
  verifyOwnerCheckInCode,
} from '../../api/ownerCheckIn';
import { getOwnerVenues, type OwnerVenue } from '../../api/owner';
import type { StaffBooking } from '../../api/staff';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';

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
  Refunded: 'Đã hoàn tiền',
};
const attendanceLabels: Record<string, string> = {
  Pending: 'Chờ điểm danh',
  Present: 'Đã vào sân',
  Absent: 'Vắng mặt',
};
const statusClass = (status: string) => status === 'CheckedIn' || status === 'Present'
  ? 'bg-[#e2ff57]/55 text-[#17310a]'
  : status === 'NoShow' || status === 'Absent' || status === 'Cancelled'
    ? 'bg-red-50 text-red-700'
    : 'bg-amber-50 text-amber-800';

type BookingAction = (token: string, bookingId: number) => Promise<StaffBooking>;
type GroupAction = (token: string, bookingId: number, groupId: number) => Promise<StaffBooking>;
type ParticipantAction = (token: string, bookingId: number, playerId: number) => Promise<StaffBooking>;

export const OwnerCheckIn = () => {
  const { token } = useAuth();
  const [date, setDate] = useState(localToday);
  const [bookingType, setBookingType] = useState<'all' | 'Court' | 'Match'>('all');
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [venueId, setVenueId] = useState(0);
  const [bookings, setBookings] = useState<StaffBooking[]>([]);
  const [selected, setSelected] = useState<StaffBooking | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [busyKey, setBusyKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadBookings = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const getPage = (page: number) => getOwnerCheckInBookings(
        token,
        date,
        { page, pageSize: 100 },
        bookingType === 'all' ? undefined : bookingType,
        venueId || undefined,
      );
      const firstPage = await getPage(1);
      // ponytail: A daily queue is bounded; add visible pagination only if loading every page becomes measurable.
      const remainingPages = await Promise.all(Array.from(
        { length: Math.max(0, firstPage.totalPages - 1) },
        (_, index) => getPage(index + 2),
      ));
      const items = [firstPage, ...remainingPages].flatMap((page) => page.items);
      setBookings(items);
      setSelected((current) => current
        ? items.find((item) => item.bookingId === current.bookingId) ?? null
        : null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách check-in.');
    } finally {
      setIsLoading(false);
    }
  }, [bookingType, date, token, venueId]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    void getOwnerVenues(token)
      .then((result) => {
        if (active) setVenues(result);
      })
      .catch((reason) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách cụm sân.');
      });
    return () => {
      active = false;
    };
  }, [token]);

  const selectedGroup = useMemo(
    () => selected?.checkInGroups.find((item) => item.bookingCheckInGroupId === selectedGroupId) ?? null,
    [selected, selectedGroupId],
  );

  const chooseBooking = (booking: StaffBooking, groupId?: number | null) => {
    setSelected(booking);
    setSelectedGroupId(groupId
      ?? booking.checkInGroups.find((item) => item.isCheckInWindowOpen)?.bookingCheckInGroupId
      ?? booking.checkInGroups.find((item) => item.canMarkNoShow)?.bookingCheckInGroupId
      ?? booking.checkInGroups[0]?.bookingCheckInGroupId ?? null);
    setError('');
    setSuccess('');
  };

  const updateBooking = (booking: StaffBooking) => {
    setBookings((items) => {
      const exists = items.some((item) => item.bookingId === booking.bookingId);
      return exists
        ? items.map((item) => item.bookingId === booking.bookingId ? booking : item)
        : [booking, ...items];
    });
    setSelected(booking);
  };

  const verifyCode = async (event: FormEvent) => {
    event.preventDefault();
    const normalized = code.trim();
    if (!token || !normalized) return;
    setBusyKey('verify');
    setError('');
    setSuccess('');
    try {
      let booking = await verifyOwnerCheckInCode(token, normalized);
      const group = booking.checkInGroups.find(
        (item) => item.checkInCode.toUpperCase() === normalized.toUpperCase(),
      );
      const verifiedParticipant = booking.verifiedPlayerId
        ? booking.participants.find((item) => item.playerId === booking.verifiedPlayerId)
        : undefined;
      if (verifiedParticipant) {
        if (verifiedParticipant.attendanceStatus === 'Pending') {
          booking = await checkInOwnerMatchParticipant(token, booking.bookingId, verifiedParticipant.playerId);
          updateBooking(booking);
          setSelectedGroupId(null);
          setSuccess('Đã check-in ' + verifiedParticipant.playerName + ' bằng mã cá nhân.');
          return;
        }
        updateBooking(booking);
        setSelectedGroupId(null);
        setSuccess(verifiedParticipant.playerName + (verifiedParticipant.attendanceStatus === 'Present'
          ? ' đã check-in trước đó.'
          : ' đã được đánh dấu vắng mặt.'));
        return;
      }
      updateBooking(booking);
      setSelectedGroupId(group?.bookingCheckInGroupId ?? null);
      setSuccess(group
        ? 'Đã xác minh đúng mã của sân và khung giờ được chọn.'
        : booking.checkInGroups.length > 0
          ? 'Đã tìm thấy đơn. Hãy quét mã của đúng sân và khung giờ cần check-in.'
          : 'Đã xác minh mã booking.');
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
  const currentVerifiedAt = selectedGroup?.codeVerifiedAt ?? selected?.codeVerifiedAt;
  const currentWindowOpen = selectedGroup?.isCheckInWindowOpen ?? selected?.isCheckInWindowOpen ?? false;
  const currentCanNoShow = selectedGroup?.canMarkNoShow ?? selected?.canMarkNoShow ?? false;
  const checkedInCount = bookings.filter((item) => item.checkInStatus === 'CheckedIn').length;
  const readyCount = bookings.filter((item) => item.checkInStatus === 'Ready').length;

  return (
    <OwnerShell activeId="checkIn" innerClassName="max-w-[1420px]">
      <section className="owner-page-header">
        <div>
          <p className="owner-kicker"><ScanLine className="h-4 w-4" /> Vận hành tại quầy</p>
          <h1 className="mt-2">Check-in khách vào sân</h1>
          <p className="mt-1">Quét mã, xác nhận thanh toán tại sân và điểm danh đơn đặt sân hoặc ghép trận.</p>
        </div>
        <Link
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 text-[13px] font-extrabold text-on-surface hover:bg-surface-container-low"
          to="/owner/ticket-sessions"
        >
          <Ticket className="h-4 w-4" />
          Check-in vé xé
        </Link>
      </section>

      <section className="owner-panel p-4 sm:p-5">
        <form className="grid gap-3 lg:grid-cols-[minmax(280px,1fr)_190px_auto]" onSubmit={verifyCode}>
          <label>
            <span className="mb-1.5 block text-[11px] font-extrabold text-on-surface-variant">Mã booking / khung giờ / người chơi</span>
            <span className="flex h-11 items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
              <QrCode className="h-4 w-4 shrink-0 text-primary" />
              <input
                autoComplete="off"
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-[14px] font-bold outline-none"
                onChange={(event) => setCode(event.target.value)}
                placeholder="Quét hoặc nhập mã check-in"
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
            {busyKey === 'verify' ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />}
            Xác minh mã
          </button>
        </form>

        <div className="mt-4 grid gap-4 border-t border-outline-variant pt-4">
          <div className="min-w-0">
            <p className="mb-2 text-[11px] font-extrabold text-on-surface-variant">Lọc theo cụm sân</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                aria-pressed={venueId === 0}
                className={'shrink-0 rounded-full border px-3 py-2 text-[11px] font-extrabold transition ' + (venueId === 0
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
                  className={'shrink-0 rounded-full border px-3 py-2 text-[11px] font-extrabold transition ' + (venueId === venue.venueId
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
                {bookings.length} đơn · {readyCount} sẵn sàng · {checkedInCount} đã check-in
              </p>
            </div>
            <button
              aria-label="Tải lại danh sách"
              className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low"
              disabled={isLoading}
              onClick={() => void loadBookings()}
              type="button"
            >
              <RefreshCw className={'h-4 w-4 ' + (isLoading ? 'animate-spin' : '')} />
            </button>
          </div>

          <div className="max-h-[620px] space-y-2 overflow-y-auto p-3">
            {isLoading && bookings.length === 0 && (
              <div className="flex min-h-44 items-center justify-center gap-2 text-[13px] font-bold text-on-surface-variant">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải booking...
              </div>
            )}
            {!isLoading && bookings.length === 0 && (
              <div className="flex min-h-44 flex-col items-center justify-center px-4 text-center">
                <CalendarDays className="h-7 w-7 text-on-surface-variant" />
                <p className="mt-3 text-[13px] font-extrabold">Không có booking trong ngày này</p>
                <p className="mt-1 text-[11px] text-on-surface-variant">Đổi ngày hoặc quét trực tiếp mã booking của khách.</p>
              </div>
            )}
            {bookings.map((booking) => (
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
          {!selected ? (
            <div className="flex min-h-[540px] flex-col items-center justify-center px-6 text-center">
              <span className="rounded-2xl bg-[#edf4d3] p-4 text-[#315516]"><QrCode className="h-7 w-7" /></span>
              <p className="mt-4 text-[16px] font-extrabold">Chọn đơn hoặc quét mã</p>
              <p className="mt-1 max-w-sm text-[12px] leading-5 text-on-surface-variant">Thông tin khách, sân con và thao tác check-in sẽ xuất hiện tại đây.</p>
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
                        Mã khung giờ: <strong>{selectedGroup.checkInCode}</strong>
                        {selectedGroup.codeVerifiedAt ? ' · Đã xác minh' : ' · Chưa xác minh'}
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
                      Quét mã cá nhân để hệ thống nhận đúng người và check-in ngay. Mã đơn chung chỉ dùng để mở đơn.
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
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#173b31] px-3 text-[11px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={Boolean(busyKey) || !selected.codeVerifiedAt || !selected.isCheckInWindowOpen || participant.paymentStatus !== 'Paid'}
                                onClick={() => window.confirm('Xác nhận ' + participant.playerName + ' đã vào sân?')
                                  && void runParticipantAction('participant-' + participant.playerId, checkInOwnerMatchParticipant, participant.playerId, 'Đã xác nhận người chơi vào sân.')}
                                type="button"
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Xác nhận vào sân
                              </button>
                              <button
                                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-extrabold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                                disabled={Boolean(busyKey) || !selected.canMarkNoShow || participant.paymentStatus !== 'Paid'}
                                onClick={() => window.confirm('Đánh dấu ' + participant.playerName + ' vắng mặt?')
                                  && void runParticipantAction('participant-' + participant.playerId, markOwnerMatchParticipantNoShow, participant.playerId, 'Đã đánh dấu người chơi vắng mặt.')}
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
                        onClick={() => window.confirm('Xác nhận đã nhận đủ tiền tại sân?')
                          && void runBookingAction('payment', confirmOwnerAtCourtPayment, 'Đã xác nhận thanh toán tại sân.')}
                        type="button"
                      >
                        <Banknote className="h-4 w-4" /> Xác nhận đã nhận tiền
                      </button>
                    )}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#173b31] px-4 text-[12px] font-extrabold text-white disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={Boolean(busyKey) || (selected.checkInGroups.length > 0 && !selectedGroup) || !currentVerifiedAt || !currentWindowOpen || selected.paymentStatus !== 'Paid' || currentStatus !== 'Ready'}
                        onClick={() => window.confirm('Xác nhận khách đã vào sân?')
                          && (selectedGroup
                            ? void runGroupAction('check-in', checkInOwnerBookingGroup, 'Đã check-in khách vào sân.')
                            : void runBookingAction('check-in', checkInOwnerBooking, 'Đã check-in khách vào sân.'))}
                        type="button"
                      >
                        <UserCheck className="h-4 w-4" /> Xác nhận vào sân
                      </button>
                      <button
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 text-[12px] font-extrabold text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        disabled={Boolean(busyKey) || (selected.checkInGroups.length > 0 && !selectedGroup) || !currentCanNoShow || currentStatus !== 'Ready'}
                        onClick={() => window.confirm('Xác nhận khách không đến sân?')
                          && (selectedGroup
                            ? void runGroupAction('no-show', markOwnerBookingGroupNoShow, 'Đã đánh dấu khách vắng mặt.')
                            : void runBookingAction('no-show', markOwnerBookingNoShow, 'Đã đánh dấu khách vắng mặt.'))}
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