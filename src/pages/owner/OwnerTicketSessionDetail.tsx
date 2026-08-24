import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  QrCode,
  Send,
  Ticket,
  UserCheck,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import { useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getOwnerVenues, type OwnerVenue } from '../../api/owner';
import {
  cancelOwnerTicketSession,
  checkInOwnerSessionTicket,
  getOwnerTicketSessionParticipants,
  publishOwnerTicketSession,
  refundOwnerSessionTicket,
  updateOwnerTicketSession,
  type SessionTicket,
  type TicketSession,
  type TicketSessionInput,
  type TicketSessionParticipants,
  type TicketSessionStatus,
} from '../../api/ticketing';
import { useAuth } from '../../auth/AuthContext';
import { useApiQuery } from '../../hooks/useApiQuery';
import { HalfHourTimeSelect } from '../../components/ui/HalfHourTimeSelect';
import { ModalDialog } from '../../components/ui/ModalDialog';
import { useToast } from '../../components/ui/ToastRegion';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { lastBookableDate } from '../../utils/bookingDateRange';
import { OwnerShell } from './components/OwnerShell';
import { OwnerBackLink } from './components/OwnerBackLink';
import { OwnerTransactionReviewModal } from './components/OwnerTransactionReviewModal';
import { OwnerRefundProofModal } from './components/OwnerRefundProofModal';
import { useConfirm } from '../../components/ui/ConfirmDialogRegion';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateOnly = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
});
const shortDateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const timeOnly = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' });
const statusLabels: Record<TicketSessionStatus, string> = {
  Draft: 'Bản nháp', Published: 'Đang bán vé', Completed: 'Đã kết thúc', Cancelled: 'Đã hủy',
};
const ticketStatusLabels: Record<string, string> = {
  PendingPayment: 'Chờ thanh toán', Paid: 'Đã thanh toán', CheckedIn: 'Đã check-in',
  Cancelled: 'Đã hủy', Expired: 'Hết hạn giữ chỗ', RefundPending: 'Chờ đối soát', Refunded: 'Đã đối soát',
};
const paymentStatusLabels: Record<string, string> = {
  Pending: 'Chờ thanh toán', Paid: 'Đã thanh toán', Cancelled: 'Đã hủy', Expired: 'Đã hết hạn',
  RefundPending: 'Chờ đối soát', Refunded: 'Đã đối soát', WaitingForConfirmation: 'Chờ xác nhận',
};
const badgeClass = (status: string) => status === 'Published' || status === 'Paid' || status === 'CheckedIn'
  ? 'bg-[#e2ff57]/55 text-[#17310a]'
  : status === 'RefundPending' || status === 'PendingPayment' || status === 'Pending'
    ? 'bg-amber-50 text-amber-800'
    : status === 'Cancelled' || status === 'Expired'
      ? 'bg-red-50 text-red-700'
      : 'bg-[#eef2e8] text-[#596151]';
const withSeconds = (value: string) => value.length === 5 ? `${value}:00` : value;
const isHalfHourStep = (value: string) => value.slice(3, 5) === '00' || value.slice(3, 5) === '30';
const localDateKey = () => {
  const value = new Date();
  return [value.getFullYear(), String(value.getMonth() + 1).padStart(2, '0'), String(value.getDate()).padStart(2, '0')].join('-');
};
const maxTicketSessionDate = () => lastBookableDate(localDateKey());

type EditState = {
  venueId: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  minSkillLevel: string;
  maxSkillLevel: string;
  playFormat: string;
  maxPlayers: string;
  ticketPrice: string;
};
const editState = (session: TicketSession): EditState => ({
  venueId: String(session.venueId),
  courtId: String(session.courtId),
  date: session.startTime.slice(0, 10),
  startTime: session.startTime.slice(11, 16),
  endTime: session.endTime.slice(11, 16),
  title: session.title,
  description: session.description ?? '',
  minSkillLevel: String(session.minSkillLevel),
  maxSkillLevel: String(session.maxSkillLevel),
  playFormat: session.playFormat,
  maxPlayers: String(session.maxPlayers),
  ticketPrice: String(session.ticketPrice),
});

const emptyVenues: OwnerVenue[] = [];

export const OwnerTicketSessionDetail = () => {
  const { id } = useParams();
  const ticketSessionId = Number(id);
  const { token } = useAuth();
  const confirm = useConfirm();
  const notify = useToast();
  const [busy, setBusy] = useState('');
  const [actionError, setActionError] = useState('');
  const [edit, setEdit] = useState<EditState | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [checkInCode, setCheckInCode] = useState('');
  const [reviewPaymentId, setReviewPaymentId] = useState<number | null>(null);
  const [refundProofPaymentId, setRefundProofPaymentId] = useState<number | null>(null);

  const hasValidId = Boolean(token) && Number.isInteger(ticketSessionId) && ticketSessionId >= 1;
  const { data: details = null, error: loadError, loading, refresh: load } = useApiQuery(
    ['owner-ticket-session-participants', token, ticketSessionId],
    () => getOwnerTicketSessionParticipants(token!, ticketSessionId),
    { enabled: hasValidId, errorMessage: 'Không thể tải buổi xé vé.' },
  );

  const { data: venues = emptyVenues } = useApiQuery(
    ['owner-venues', token],
    () => getOwnerVenues(token!),
    { enabled: Boolean(token) },
  );

  const error = actionError
    || (hasValidId || !token ? loadError : 'Mã buổi xé vé không hợp lệ.');
  const setError = setActionError;
  useScheduleRealtime((event) => {
    const session = details?.session;
    if (event.entryType === 'TicketSession' && (!session || event.venueId === session.venueId)) void load();
  });
  usePaymentRealtime((event) => {
    if (event.bookingId === details?.session.bookingId || details?.tickets.some((ticket) => ticket.paymentId === event.paymentId)) void load();
  });

  const session = details?.session;
  const hasTickets = (details?.tickets.length ?? 0) > 0;
  const visibleTickets = details?.tickets.filter(
    // Keep any ticket whose payment carries money the owner still needs to act on or account
    // for — held (Paid), awaiting receipt review, or mid-refund — regardless of the ticket's
    // own status (which may already be Cancelled/Expired by then).
    (ticket) => ticket.status === 'Paid' || ticket.status === 'CheckedIn'
      || ['Paid', 'WaitingForConfirmation', 'RefundPending', 'Refunded'].includes(ticket.paymentStatus),
  ) ?? [];
  const activeMinimum = (session?.soldTickets ?? 0) + (session?.reservedTickets ?? 0);
  const priceLocked = hasTickets;
  const collectedRevenue = details?.tickets
    .filter((ticket) => ticket.paymentStatus === 'Paid')
    .reduce((total, ticket) => total + ticket.amount, 0) ?? 0;
  const selectedVenue = edit && venues.find((venue) => venue.venueId === Number(edit.venueId));
  const editableVenues = useMemo(
    () => venues.filter((venue) => venue.approvalStatus === 'Approved' && venue.isOpen || venue.venueId === session?.venueId),
    [session?.venueId, venues],
  );
  const editableCourts = selectedVenue?.courts.filter(
    (court) => court.availabilityStatus === 'Available' || court.courtId === session?.courtId,
  ) ?? [];
  const setEditValue = (field: keyof EditState, value: string) => setEdit((current) => current ? { ...current, [field]: value } : current);
  const changeEditVenue = (value: string) => {
    const venue = editableVenues.find((item) => item.venueId === Number(value));
    const court = venue?.courts.find((item) => item.availabilityStatus === 'Available');
    setEdit((current) => current ? { ...current, venueId: value, courtId: court ? String(court.courtId) : '' } : current);
  };
  const changeMinSkill = (value: string) => setEdit((current) => current ? {
    ...current,
    minSkillLevel: value,
    maxSkillLevel: Number(value) > Number(current.maxSkillLevel) ? value : current.maxSkillLevel,
  } : current);
  const changeMaxSkill = (value: string) => setEdit((current) => current ? {
    ...current,
    minSkillLevel: Number(value) < Number(current.minSkillLevel) ? value : current.minSkillLevel,
    maxSkillLevel: value,
  } : current);

  const perform = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setError('');
    try {
      await action();
      notify(success, 'success');
      await load();
      return true;
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể thực hiện thao tác.');
      return false;
    } finally { setBusy(''); }
  };

  const submitEdit = async (event: FormEvent) => {
    event.preventDefault();
    if (!token || !edit || !session) return;
    const maxPlayers = Number(edit.maxPlayers);
    const ticketPrice = Number(edit.ticketPrice);
    const minSkillLevel = Number(edit.minSkillLevel);
    const maxSkillLevel = Number(edit.maxSkillLevel);
    const start = new Date(`${edit.date}T${edit.startTime}:00`);
    const end = new Date(`${edit.date}T${edit.endTime}:00`);
    const validation = !edit.venueId || !edit.courtId
      ? 'Hãy chọn cụm sân và sân.'
      : edit.title.trim().length < 3
        ? 'Tên buổi chơi cần ít nhất 3 ký tự.'
        : !isHalfHourStep(edit.startTime) || !isHalfHourStep(edit.endTime)
          ? 'Giờ chỉ được chọn theo mốc 00 hoặc 30 phút.'
        : !(start < end)
          ? 'Giờ kết thúc phải sau giờ bắt đầu.'
            : start <= new Date()
              ? 'Khung giờ chơi phải ở trong tương lai.'
              : edit.date > maxTicketSessionDate()
                ? 'Chỉ được tạo buổi xé vé trong tháng hiện tại hoặc tháng kế tiếp.'
                : minSkillLevel > maxSkillLevel
                  ? 'Trình độ tối thiểu không được lớn hơn trình độ tối đa.'
                  : !Number.isInteger(maxPlayers) || maxPlayers < Math.max(1, activeMinimum) || maxPlayers > 100
                    ? `Số người tối đa phải từ ${Math.max(1, activeMinimum)} đến 100.`
                    : !Number.isInteger(ticketPrice) || ticketPrice < 0
                      ? 'Giá vé phải là số nguyên VND không âm.'
                      : '';
    if (validation) { setError(validation); return; }
    const input: TicketSessionInput = {
      venueId: Number(edit.venueId), courtId: Number(edit.courtId), date: edit.date,
      startTime: withSeconds(edit.startTime), endTime: withSeconds(edit.endTime),
      title: edit.title.trim(), description: edit.description.trim() || undefined,
      minSkillLevel, maxSkillLevel, playFormat: edit.playFormat, maxPlayers, ticketPrice,
    };
    if (await perform('edit', () => updateOwnerTicketSession(token, ticketSessionId, input), 'Đã cập nhật buổi xé vé.')) setEdit(null);
  };

  const publish = async () => {
    if (!token) return;
    if (!(await confirm({
      title: 'Đăng bán buổi chơi này?',
      message: 'Buổi chơi sẽ hiển thị công khai và người chơi có thể mua vé ngay.',
      confirmLabel: 'Đăng bán',
      tone: 'success',
    }))) return;
    await perform('publish', () => publishOwnerTicketSession(token, ticketSessionId), 'Đã đăng bán vé.');
  };
  const cancel = async () => {
    if (!token || cancelReason.trim().length < 3) return;
    if (await perform('cancel', () => cancelOwnerTicketSession(token, ticketSessionId, cancelReason), 'Đã hủy buổi xé vé. Các khoản đã thanh toán được giữ nguyên theo chính sách không hoàn tiền.')) {
      setCancelOpen(false);
      setCancelReason('');
    }
  };
  const checkInTicket = async (code: string) => {
    const ticketCode = code.trim();
    if (!token || ticketCode.length < 3) return;
    if (await perform(
      'check-in',
      () => checkInOwnerSessionTicket(token, ticketSessionId, ticketCode),
      `Đã check-in vé ${ticketCode}.`,
    )) setCheckInCode('');
  };
  const submitCheckIn = (event: FormEvent) => {
    event.preventDefault();
    void checkInTicket(checkInCode);
  };
  const refundTicket = async (ticket: SessionTicket) => {
    if (!token) return;
    if (!(await confirm({
      title: `Hoàn tiền vé ${ticket.ticketCode}?`,
      message: `Xác nhận bạn đã chuyển lại tiền cho ${ticket.playerName}. Vé sẽ được đánh dấu đã hoàn tiền và không thể hoàn tác.`,
      confirmLabel: 'Đã hoàn tiền',
      tone: 'danger',
    }))) return;
    await perform(
      'refund-' + ticket.sessionTicketId,
      () => refundOwnerSessionTicket(token, ticketSessionId, ticket.sessionTicketId),
      `Đã đánh dấu hoàn tiền vé ${ticket.ticketCode}.`,
    );
  };

  return (
    <OwnerShell activeId="ticketSessions">
      {loading && <div className="flex min-h-[60dvh] items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="sr-only">Đang tải</span></div>}
      {!loading && !session && (
        <section className="owner-panel p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mx-auto mt-3">Không thể mở buổi xé vé</h1>
          <p className="mt-2 text-[13px] text-on-surface-variant">{error || 'Buổi chơi không tồn tại hoặc không thuộc quyền quản lý.'}</p>
          <OwnerBackLink className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold" fallback="/owner/ticket-sessions">Quay lại danh sách</OwnerBackLink>
        </section>
      )}
      {!loading && session && details && (
        <>
          <section className="owner-page-header">
            <div>
              <OwnerBackLink className="owner-kicker" fallback="/owner/ticket-sessions"><ArrowLeft className="h-4 w-4" /> Danh sách xé vé</OwnerBackLink>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <h1>{session.title}</h1>
                <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${badgeClass(session.status)}`}>{statusLabels[session.status]}</span>
              </div>
              <p className="mt-1">Mã buổi #{session.ticketSessionId} · Booking #{session.bookingId}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(session.status === 'Draft' || session.status === 'Published') && new Date(session.startTime) > new Date() && (
                <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2.5 text-[13px] font-bold" onClick={() => { setEdit(editState(session)); setError(''); }} type="button"><Edit3 className="h-4 w-4" /> Chỉnh sửa</button>
              )}
              {session.status === 'Draft' && (
                <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold disabled:opacity-50" disabled={Boolean(busy)} onClick={() => void publish()} type="button">{busy === 'publish' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Đăng bán vé</button>
              )}
              {!['Cancelled', 'Completed'].includes(session.status) && (
                <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-[13px] font-bold text-red-700" disabled={Boolean(busy)} onClick={() => setCancelOpen(true)} type="button"><XCircle className="h-4 w-4" /> Hủy buổi</button>
              )}
            </div>
          </section>

          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700" role="alert">{error}</div>}
          {session.status === 'Cancelled' && session.cancellationReason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-[13px] text-red-800"><strong>Lý do hủy:</strong> {session.cancellationReason}</div>
          )}

          <section className="owner-stat-grid sm:grid-cols-2 xl:grid-cols-4">
            <div className="owner-stat-card"><p className="text-[12px] font-bold text-on-surface-variant">Vé đã bán</p><p className="mt-2 text-[24px] font-extrabold">{session.soldTickets}/{session.maxPlayers}</p></div>
            <div className="owner-stat-card"><p className="text-[12px] font-bold text-on-surface-variant">Chỗ còn lại</p><p className="mt-2 text-[24px] font-extrabold">{session.remainingTickets}</p><p className="mt-1 text-[11px] text-on-surface-variant">{session.reservedTickets} đang giữ thanh toán</p></div>
            <div className="owner-stat-card"><p className="text-[12px] font-bold text-on-surface-variant">Giá mỗi vé</p><p className="mt-2 text-[21px] font-extrabold">{session.ticketPrice === 0 ? 'Miễn phí' : money.format(session.ticketPrice)}</p></div>
            <div className="owner-stat-card"><p className="text-[12px] font-bold text-on-surface-variant">Doanh thu đã thu</p><p className="mt-2 text-[21px] font-extrabold">{money.format(collectedRevenue)}</p><p className="mt-1 text-[11px] text-on-surface-variant">Vé đã thanh toán không hoàn tiền</p></div>
          </section>

          <section className="owner-panel p-5">
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="text-[18px]">Thông tin buổi chơi</h2>
                <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-on-surface-variant">{session.description || 'Chưa có mô tả.'}</p>
                <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-surface-container-low px-3 py-1.5 text-[12px] font-bold">Level {session.minSkillLevel}–{session.maxSkillLevel}</span><span className="rounded-full bg-surface-container-low px-3 py-1.5 text-[12px] font-bold">{session.playFormat}</span><span className="rounded-full bg-surface-container-low px-3 py-1.5 text-[12px] font-bold">Hủy trước {session.cancellationDeadlineHours} giờ</span></div>
              </div>
              <div className="grid gap-3 text-[13px]">
                <div className="flex gap-3 rounded-lg bg-surface-container-low p-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /><div><p className="font-bold">{session.venueName} · Sân {session.courtNumber}</p><p className="mt-1 text-on-surface-variant">{session.venueAddress}</p></div></div>
                <div className="flex gap-3 rounded-lg bg-surface-container-low p-3"><CalendarDays className="h-5 w-5 shrink-0 text-primary" /><div><p className="font-bold">{dateOnly.format(new Date(session.startTime))}</p><p className="mt-1 text-on-surface-variant">{timeOnly.format(new Date(session.startTime))} – {timeOnly.format(new Date(session.endTime))}</p></div></div>
              </div>
            </div>
          </section>

          <section className="owner-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
              <div><h2 className="flex items-center gap-2 text-[18px]"><UsersRound className="h-5 w-5 text-primary" /> Người tham gia</h2><p className="mt-1 text-[12px] text-on-surface-variant">Theo dõi vé, thanh toán và check-in. Vé đã thanh toán không được hoàn lại.</p></div>
              <div className="flex w-full flex-wrap items-center justify-end gap-2 lg:w-auto">
                {session.status === 'Published' && (
                  <form className="flex w-full items-center gap-2 sm:w-auto" onSubmit={submitCheckIn}>
                    <label className="sr-only" htmlFor="owner-ticket-check-in-code">Mã vé để check-in</label>
                    <div className="relative min-w-0 flex-1 sm:w-56 sm:flex-none">
                      <QrCode aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        autoComplete="off"
                        className="w-full pl-9 pr-3"
                        disabled={Boolean(busy)}
                        id="owner-ticket-check-in-code"
                        maxLength={40}
                        onChange={(event) => setCheckInCode(event.target.value)}
                        placeholder="Nhập hoặc quét mã vé"
                        value={checkInCode}
                      />
                    </div>
                    <button
                      aria-busy={busy === 'check-in'}
                      className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-4 text-[12px] font-bold disabled:opacity-50"
                      disabled={Boolean(busy) || checkInCode.trim().length < 3}
                      type="submit"
                    >
                      {busy === 'check-in' ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                      Check-in
                    </button>
                  </form>
                )}
                <span className="rounded-full bg-surface-container-low px-3 py-1.5 text-[12px] font-bold">{visibleTickets.length} đã thanh toán</span>
              </div>
            </div>
            {visibleTickets.length === 0 ? (
              <div className="grid min-h-44 place-items-center p-6 text-center"><div><Ticket className="mx-auto h-8 w-8 text-on-surface-variant" /><p className="mt-2 text-[13px] font-bold">Chưa có Player đã thanh toán.</p></div></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[920px] text-left">
                  <thead><tr><th>Player & mã vé</th><th>Trạng thái vé</th><th>Thanh toán</th><th>Check-in</th><th>Số tiền</th><th>Hoàn tiền</th></tr></thead>
                  <tbody>{visibleTickets.map((ticket) => {
                    const additional = ticket.sePayTransactions.filter((transaction) => transaction.status === 'AdditionalRefundPending');
                    const checkedIn = ticket.status === 'CheckedIn' || Boolean(ticket.checkedInAt);
                    const canCheckIn = session.status === 'Published'
                      && ticket.status === 'Paid'
                      && ticket.paymentStatus === 'Paid'
                      && !checkedIn;
                    const canRefund = ticket.paymentStatus === 'Paid' && !checkedIn;
                    return (
                      <tr className="border-t border-outline-variant align-top" key={ticket.sessionTicketId}>
                        <td><p className="font-bold">{ticket.playerName}</p><p className="mt-1 text-[12px] text-on-surface-variant">{ticket.playerEmail || 'Không có email'}</p><p className="mt-1 font-mono text-[12px] font-bold text-primary">{ticket.ticketCode}</p></td>
                        <td><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass(ticket.status)}`}>{ticketStatusLabels[ticket.status] ?? ticket.status}</span>{ticket.cancellationReason && <p className="mt-2 max-w-56 text-[11px] text-on-surface-variant">{ticket.cancellationReason}</p>}</td>
                        <td><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass(ticket.paymentStatus)}`}>{paymentStatusLabels[ticket.paymentStatus] ?? ticket.paymentStatus}</span><p className="mt-2 text-[11px] text-on-surface-variant">{ticket.paidAt ? shortDateTime.format(new Date(ticket.paidAt)) : 'Chưa ghi nhận thanh toán'}</p>{ticket.paymentStatus === 'WaitingForConfirmation' && <button className="mt-2 rounded-lg border border-primary px-3 py-2 text-[11px] font-bold text-primary" onClick={() => setReviewPaymentId(ticket.paymentId)} type="button">Kiểm tra biên lai</button>}</td>
                        <td>
                          {checkedIn ? (
                            <><span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#477313]"><CheckCircle2 className="h-4 w-4" /> Đã check-in</span>{ticket.checkedInAt && <p className="mt-1 text-[11px] text-on-surface-variant">{shortDateTime.format(new Date(ticket.checkedInAt))}</p>}</>
                          ) : (
                            <div className="flex flex-col items-start gap-2">
                              <span className="text-[12px] text-on-surface-variant">Chưa check-in</span>
                              <button
                                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-[11px] font-bold disabled:opacity-50"
                                disabled={Boolean(busy) || !canCheckIn}
                                onClick={async () => {
                                  if (await confirm({
                                    title: `Xác nhận ${ticket.playerName} đã vào sân?`,
                                    confirmLabel: 'Đã vào sân',
                                    tone: 'success',
                                  })) void checkInTicket(ticket.ticketCode);
                                }}
                                type="button"
                              >
                                <UserCheck className="h-4 w-4" />
                                {canCheckIn ? 'Check-in vé' : 'Chưa thể check-in'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="font-bold"><Banknote className="mr-1 inline h-4 w-4 text-primary" />{money.format(ticket.amount)}{additional.map((transaction) => <p className="mt-2 text-[11px] font-bold text-amber-800" key={transaction.sePayTransactionId}>Chuyển thêm: {money.format(transaction.amount)}</p>)}</td>
                        <td>
                          {canRefund ? (
                            <button
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-[11px] font-bold text-red-700 disabled:opacity-50"
                              disabled={Boolean(busy)}
                              onClick={() => void refundTicket(ticket)}
                              type="button"
                            >
                              <Banknote className="h-4 w-4" /> Hoàn tiền
                            </button>
                          ) : ticket.paymentStatus === 'RefundPending' ? (
                            <div className="flex flex-col items-start gap-1">
                              <button
                                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] font-bold text-amber-800"
                                onClick={() => setRefundProofPaymentId(ticket.paymentId)}
                                type="button"
                              >
                                <Banknote className="h-4 w-4" /> {ticket.refundProofSubmittedAt ? 'Cập nhật minh chứng' : 'Gửi minh chứng hoàn tiền'}
                              </button>
                              {ticket.refundDisputeStatus === 'Open' && <span className="text-[11px] font-bold text-red-700">Player khiếu nại</span>}
                            </div>
                          ) : (
                            <span className="text-[12px] text-on-surface-variant">
                              {ticket.paymentStatus === 'Refunded' ? 'Đã hoàn tiền' : '—'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}</tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {edit && session && (
        <ModalDialog aria-labelledby="edit-ticket-session-title" canClose={busy !== 'edit'} className="owner-modal max-w-4xl" onRequestClose={() => setEdit(null)} style={{ width: 'calc(100% - 1.75rem)' }}>
          <div className="flex items-start justify-between gap-4">
            <div><p className="owner-kicker"><Edit3 className="h-4 w-4" /> Cập nhật buổi chơi</p><h2 className="mt-1 text-[23px]" id="edit-ticket-session-title">Chỉnh sửa {session.title}</h2></div>
            <button aria-label="Đóng" className="rounded-lg p-2 hover:bg-surface-container-low" disabled={busy === 'edit'} onClick={() => setEdit(null)} type="button"><X className="h-5 w-5" /></button>
          </div>
          <form className="mt-5 grid gap-4" onSubmit={submitEdit}>
            {hasTickets && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] text-amber-900"><strong>Đã phát sinh lượt mua vé:</strong> không thể đổi sân, ngày hoặc giờ. Giá vé cũng được khóa sau khi có lượt giữ chỗ hoặc mua.</div>}
            <div className="grid gap-4 sm:grid-cols-2">
              <label><span className="mb-1.5 block text-[13px] font-bold">Cụm sân *</span><select className="w-full disabled:bg-surface-container-low" disabled={hasTickets} onChange={(event) => changeEditVenue(event.target.value)} required value={edit.venueId}>{editableVenues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select></label>
              <label><span className="mb-1.5 block text-[13px] font-bold">Sân *</span><select className="w-full disabled:bg-surface-container-low" disabled={hasTickets} onChange={(event) => setEditValue('courtId', event.target.value)} required value={edit.courtId}>{editableCourts.map((court) => <option key={court.courtId} value={court.courtId}>Sân {court.courtNumber} · {court.courtType}</option>)}</select></label>
              <label><span className="mb-1.5 block text-[13px] font-bold">Ngày chơi *</span><input className="w-full px-3 disabled:bg-surface-container-low" disabled={hasTickets} max={maxTicketSessionDate()} min={localDateKey()} onChange={(event) => setEditValue('date', event.target.value)} required type="date" value={edit.date} /></label>
              <div className="flex gap-3">
                <label><span className="mb-1.5 block text-[13px] font-bold">Bắt đầu *</span><HalfHourTimeSelect disabled={hasTickets} onChange={(value) => setEditValue('startTime', value)} value={edit.startTime} /></label>
                <label><span className="mb-1.5 block text-[13px] font-bold">Kết thúc *</span><HalfHourTimeSelect disabled={hasTickets} onChange={(value) => setEditValue('endTime', value)} value={edit.endTime} /></label>
              </div>
            </div>
            <label><span className="mb-1.5 block text-[13px] font-bold">Tên buổi chơi *</span><input className="w-full px-3" maxLength={200} minLength={3} onChange={(event) => setEditValue('title', event.target.value)} required value={edit.title} /></label>
            <label><span className="mb-1.5 block text-[13px] font-bold">Mô tả</span><textarea className="min-h-24 w-full border p-3" maxLength={2000} onChange={(event) => setEditValue('description', event.target.value)} value={edit.description} /></label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <label><span className="mb-1.5 block text-[13px] font-bold">Trình độ tối thiểu *</span><select className="w-full" onChange={(event) => changeMinSkill(event.target.value)} value={edit.minSkillLevel}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Level {value}</option>)}</select></label>
              <label><span className="mb-1.5 block text-[13px] font-bold">Trình độ tối đa *</span><select className="w-full" onChange={(event) => changeMaxSkill(event.target.value)} value={edit.maxSkillLevel}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Level {value}</option>)}</select></label>
              <label><span className="mb-1.5 block text-[13px] font-bold">Hình thức *</span><select className="w-full" onChange={(event) => setEditValue('playFormat', event.target.value)} value={edit.playFormat}>{!['1vs1', '2vs2'].includes(edit.playFormat) && <option value={edit.playFormat}>{edit.playFormat}</option>}<option value="1vs1">Đánh đơn · 1vs1</option><option value="2vs2">Đánh đôi · 2vs2</option></select></label>
              <label><span className="mb-1.5 block text-[13px] font-bold">Số người tối đa *</span><input className="w-full px-3" max={100} min={Math.max(1, activeMinimum)} onChange={(event) => setEditValue('maxPlayers', event.target.value)} required type="number" value={edit.maxPlayers} /></label>
              <label><span className="mb-1.5 block text-[13px] font-bold">Giá mỗi vé (VND) *</span><input className="w-full px-3 disabled:bg-surface-container-low" disabled={priceLocked} min={0} onChange={(event) => setEditValue('ticketPrice', event.target.value)} required step={1} type="number" value={edit.ticketPrice} /></label>
            </div>
            <div className="flex justify-end gap-3 border-t border-outline-variant pt-4"><button className="rounded-lg border border-outline-variant px-4 py-2.5 text-[13px] font-bold" disabled={busy === 'edit'} onClick={() => setEdit(null)} type="button">Đóng</button><button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-bold disabled:opacity-50" disabled={busy === 'edit'} type="submit">{busy === 'edit' && <Loader2 className="h-4 w-4 animate-spin" />} Lưu thay đổi</button></div>
          </form>
        </ModalDialog>
      )}

      {reviewPaymentId && session && (
        <OwnerTransactionReviewModal
          bookingCode={`Vé · ${session.title}`}
          onClose={() => setReviewPaymentId(null)}
          onUpdated={() => load()}
          paymentId={reviewPaymentId}
        />
      )}

      {refundProofPaymentId && (
        <OwnerRefundProofModal
          onClose={() => setRefundProofPaymentId(null)}
          onUpdated={() => load()}
          paymentId={refundProofPaymentId}
        />
      )}

      {cancelOpen && session && (
        <ModalDialog aria-labelledby="cancel-session-title" canClose={busy !== 'cancel'} className="owner-modal max-w-lg" onRequestClose={() => setCancelOpen(false)} style={{ width: 'calc(100% - 1.75rem)' }}>
          <div className="flex items-start justify-between gap-4"><div><p className="owner-kicker text-red-700"><XCircle className="h-4 w-4" /> Hủy buổi chơi</p><h2 className="mt-1 text-[23px]" id="cancel-session-title">Hủy {session.title}?</h2></div><button aria-label="Đóng" className="rounded-lg p-2" disabled={busy === 'cancel'} onClick={() => setCancelOpen(false)} type="button"><X className="h-5 w-5" /></button></div>
          <p className="mt-4 text-[13px] leading-5 text-on-surface-variant">Player sẽ nhận thông báo và booking sân được giải phóng. Các vé đã thanh toán sẽ bị hủy nhưng khoản thanh toán vẫn được giữ nguyên, không hoàn tiền.</p>
          <label className="mt-4 block"><span className="mb-1.5 block text-[13px] font-bold">Lý do hủy *</span><textarea className="min-h-24 w-full border p-3" maxLength={400} minLength={3} onChange={(event) => setCancelReason(event.target.value)} value={cancelReason} /></label>
          <div className="mt-5 flex justify-end gap-3"><button className="rounded-lg border border-outline-variant px-4 py-2.5 text-[13px] font-bold" disabled={busy === 'cancel'} onClick={() => setCancelOpen(false)} type="button">Quay lại</button><button className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-50" disabled={busy === 'cancel' || cancelReason.trim().length < 3} onClick={() => void cancel()} type="button">{busy === 'cancel' && <Loader2 className="h-4 w-4 animate-spin" />} Xác nhận hủy</button></div>
        </ModalDialog>
      )}
    </OwnerShell>
  );
};
