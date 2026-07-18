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
  RotateCcw,
  Send,
  Ticket,
  UserCheck,
  UsersRound,
  X,
  XCircle,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getOwnerVenues, type OwnerVenue } from '../../api/owner';
import {
  cancelOwnerTicketSession,
  checkInOwnerSessionTicket,
  completeOwnerAdditionalRefund,
  completeOwnerTicketRefund,
  getOwnerTicketSessionParticipants,
  publishOwnerTicketSession,
  updateOwnerTicketSession,
  type SePayTransaction,
  type SessionTicket,
  type TicketSession,
  type TicketSessionInput,
  type TicketSessionParticipants,
  type TicketSessionStatus,
} from '../../api/ticketing';
import { useAuth } from '../../auth/AuthContext';
import { ModalDialog } from '../../components/ui/ModalDialog';
import { useToast } from '../../components/ui/ToastRegion';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { OwnerShell } from './components/OwnerShell';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const shortDateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const statusLabels: Record<TicketSessionStatus, string> = {
  Draft: 'Bản nháp', Published: 'Đang bán vé', Completed: 'Đã kết thúc', Cancelled: 'Đã hủy',
};
const ticketStatusLabels: Record<string, string> = {
  PendingPayment: 'Chờ thanh toán', Paid: 'Đã thanh toán', CheckedIn: 'Đã check-in',
  Cancelled: 'Đã hủy', Expired: 'Hết hạn giữ chỗ', RefundPending: 'Chờ hoàn tiền', Refunded: 'Đã hoàn tiền',
};
const paymentStatusLabels: Record<string, string> = {
  Pending: 'Chờ thanh toán', Paid: 'Đã thanh toán', Cancelled: 'Đã hủy', Expired: 'Đã hết hạn',
  RefundPending: 'Chờ hoàn tiền', Refunded: 'Đã hoàn tiền', WaitingForConfirmation: 'Chờ xác nhận',
};
const badgeClass = (status: string) => status === 'Published' || status === 'Paid' || status === 'CheckedIn'
  ? 'bg-[#e2ff57]/55 text-[#17310a]'
  : status === 'RefundPending' || status === 'PendingPayment' || status === 'Pending'
    ? 'bg-amber-50 text-amber-800'
    : status === 'Cancelled' || status === 'Expired'
      ? 'bg-red-50 text-red-700'
      : 'bg-[#eef2e8] text-[#596151]';
const withSeconds = (value: string) => value.length === 5 ? `${value}:00` : value;

type EditState = {
  venueId: string;
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description: string;
  skillLevel: string;
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
  skillLevel: session.skillLevel,
  playFormat: session.playFormat,
  maxPlayers: String(session.maxPlayers),
  ticketPrice: String(session.ticketPrice),
});

type RefundTarget =
  | { kind: 'ticket'; ticket: SessionTicket }
  | { kind: 'additional'; ticket: SessionTicket; transaction: SePayTransaction };

const RefundModal = ({ target, busy, onClose, onSubmit }: {
  target: RefundTarget;
  busy: boolean;
  onClose: () => void;
  onSubmit: (reference: string) => void;
}) => {
  const [reference, setReference] = useState('');
  const additional = target.kind === 'additional';
  return (
    <ModalDialog aria-labelledby="refund-ticket-title" canClose={!busy} className="owner-modal max-w-lg" onRequestClose={onClose} style={{ width: 'calc(100% - 1.75rem)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="owner-kicker"><RotateCcw className="h-4 w-4" /> Đối soát hoàn tiền</p>
          <h2 className="mt-1 text-[23px]" id="refund-ticket-title">{additional ? 'Xác nhận hoàn khoản chuyển thêm' : 'Xác nhận hoàn vé'}</h2>
        </div>
        <button aria-label="Đóng" className="rounded-lg p-2 hover:bg-surface-container-low" disabled={busy} onClick={onClose} type="button"><X className="h-5 w-5" /></button>
      </div>
      <div className="mt-4 rounded-lg bg-surface-container-low p-4 text-[13px]">
        <p><strong>Vé:</strong> {target.ticket.ticketCode} · {target.ticket.playerName}</p>
        <p className="mt-1"><strong>Số tiền:</strong> {money.format(additional ? target.transaction.amount : target.ticket.amount)}</p>
        {additional && <p className="mt-1"><strong>Mã SePay:</strong> {target.transaction.externalTransactionId}</p>}
      </div>
      <p className="mt-4 text-[13px] leading-5 text-on-surface-variant">Chỉ xác nhận sau khi đã chuyển tiền cho Player. Thao tác này ghi nhận kết quả đối soát, không tự thực hiện lệnh chuyển tiền.</p>
      <label className="mt-4 block"><span className="mb-1.5 block text-[13px] font-bold">Mã tham chiếu hoàn tiền *</span><input className="w-full px-3" maxLength={200} minLength={3} onChange={(event) => setReference(event.target.value)} placeholder="Mã giao dịch hoặc ghi chú đối soát" value={reference} /></label>
      <div className="mt-5 flex justify-end gap-3">
        <button className="rounded-lg border border-outline-variant px-4 py-2.5 text-[13px] font-bold" disabled={busy} onClick={onClose} type="button">Đóng</button>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold disabled:opacity-50" disabled={busy || reference.trim().length < 3} onClick={() => onSubmit(reference.trim())} type="button">{busy && <Loader2 className="h-4 w-4 animate-spin" />} Xác nhận đã hoàn</button>
      </div>
    </ModalDialog>
  );
};

export const OwnerTicketSessionDetail = () => {
  const { id } = useParams();
  const ticketSessionId = Number(id);
  const { token } = useAuth();
  const notify = useToast();
  const [details, setDetails] = useState<TicketSessionParticipants | null>(null);
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [edit, setEdit] = useState<EditState | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [checkInCode, setCheckInCode] = useState('');
  const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null);

  const load = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (!Number.isInteger(ticketSessionId) || ticketSessionId < 1) {
      setDetails(null);
      setError('Mã buổi xé vé không hợp lệ.');
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    setError('');
    try {
      setDetails(await getOwnerTicketSessionParticipants(token, ticketSessionId));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải buổi xé vé.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [ticketSessionId, token]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!token) return;
    void getOwnerVenues(token).then(setVenues).catch(() => setVenues([]));
  }, [token]);
  useScheduleRealtime((event) => {
    const session = details?.session;
    if (event.entryType === 'TicketSession' && (!session || event.venueId === session.venueId)) void load(false);
  });
  usePaymentRealtime((event) => {
    if (event.bookingId === details?.session.bookingId || details?.tickets.some((ticket) => ticket.paymentId === event.paymentId)) void load(false);
  });

  const session = details?.session;
  const hasTickets = (details?.tickets.length ?? 0) > 0;
  const activeMinimum = (session?.soldTickets ?? 0) + (session?.reservedTickets ?? 0);
  const priceLocked = details?.tickets.some((ticket) => ['PendingPayment', 'Paid', 'CheckedIn', 'Expired'].includes(ticket.status)) ?? false;
  const pendingMainRefunds = details?.tickets.filter((ticket) => ticket.status === 'RefundPending' && ticket.paymentStatus === 'RefundPending').length ?? 0;
  const pendingAdditionalRefunds = details?.tickets.reduce(
    (total, ticket) => total + ticket.sePayTransactions.filter((transaction) => transaction.status === 'AdditionalRefundPending').length,
    0,
  ) ?? 0;
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

  const perform = async (key: string, action: () => Promise<unknown>, success: string) => {
    setBusy(key);
    setError('');
    try {
      await action();
      notify(success, 'success');
      await load(false);
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
    const start = new Date(`${edit.date}T${edit.startTime}:00`);
    const end = new Date(`${edit.date}T${edit.endTime}:00`);
    const validation = !edit.venueId || !edit.courtId
      ? 'Hãy chọn cụm sân và sân.'
      : edit.title.trim().length < 3
        ? 'Tên buổi chơi cần ít nhất 3 ký tự.'
        : !(start < end)
          ? 'Giờ kết thúc phải sau giờ bắt đầu.'
          : start <= new Date()
            ? 'Khung giờ chơi phải ở trong tương lai.'
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
      skillLevel: edit.skillLevel, playFormat: edit.playFormat, maxPlayers, ticketPrice,
    };
    if (await perform('edit', () => updateOwnerTicketSession(token, ticketSessionId, input), 'Đã cập nhật buổi xé vé.')) setEdit(null);
  };

  const publish = async () => {
    if (!token) return;
    await perform('publish', () => publishOwnerTicketSession(token, ticketSessionId), 'Đã đăng bán vé.');
  };
  const cancel = async () => {
    if (!token || cancelReason.trim().length < 3) return;
    if (await perform('cancel', () => cancelOwnerTicketSession(token, ticketSessionId, cancelReason), 'Đã hủy buổi xé vé và chuyển các vé cần hoàn sang hàng chờ.')) {
      setCancelOpen(false);
      setCancelReason('');
    }
  };
  const refund = async (reference: string) => {
    if (!token || !refundTarget) return;
    const target = refundTarget;
    const action = target.kind === 'ticket'
      ? () => completeOwnerTicketRefund(token, ticketSessionId, target.ticket.sessionTicketId, reference)
      : () => completeOwnerAdditionalRefund(token, ticketSessionId, target.ticket.sessionTicketId, target.transaction.sePayTransactionId, reference);
    if (await perform('refund', action, 'Đã ghi nhận hoàn tiền thành công.')) setRefundTarget(null);
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

  return (
    <OwnerShell activeId="ticketSessions">
      {loading && <div className="flex min-h-[60dvh] items-center justify-center" role="status"><Loader2 className="h-8 w-8 animate-spin text-primary" /><span className="sr-only">Đang tải</span></div>}
      {!loading && !session && (
        <section className="owner-panel p-8 text-center">
          <XCircle className="mx-auto h-10 w-10 text-red-600" />
          <h1 className="mx-auto mt-3">Không thể mở buổi xé vé</h1>
          <p className="mt-2 text-[13px] text-on-surface-variant">{error || 'Buổi chơi không tồn tại hoặc không thuộc quyền quản lý.'}</p>
          <Link className="mt-5 inline-flex rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold" to="/owner/ticket-sessions">Quay lại danh sách</Link>
        </section>
      )}
      {!loading && session && details && (
        <>
          <section className="owner-page-header">
            <div>
              <Link className="owner-kicker" to="/owner/ticket-sessions"><ArrowLeft className="h-4 w-4" /> Danh sách xé vé</Link>
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
            <div className="owner-stat-card"><p className="text-[12px] font-bold text-on-surface-variant">Cần hoàn tiền</p><p className="mt-2 text-[24px] font-extrabold">{pendingMainRefunds + pendingAdditionalRefunds}</p><p className="mt-1 text-[11px] text-on-surface-variant">{pendingMainRefunds} vé · {pendingAdditionalRefunds} khoản chuyển thêm</p></div>
          </section>

          <section className="owner-panel p-5">
            <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
              <div>
                <h2 className="text-[18px]">Thông tin buổi chơi</h2>
                <p className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-on-surface-variant">{session.description || 'Chưa có mô tả.'}</p>
                <div className="mt-4 flex flex-wrap gap-2"><span className="rounded-full bg-surface-container-low px-3 py-1.5 text-[12px] font-bold">{session.skillLevel}</span><span className="rounded-full bg-surface-container-low px-3 py-1.5 text-[12px] font-bold">{session.playFormat}</span><span className="rounded-full bg-surface-container-low px-3 py-1.5 text-[12px] font-bold">Hủy trước {session.cancellationDeadlineHours} giờ</span></div>
              </div>
              <div className="grid gap-3 text-[13px]">
                <div className="flex gap-3 rounded-lg bg-surface-container-low p-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /><div><p className="font-bold">{session.venueName} · Sân {session.courtNumber}</p><p className="mt-1 text-on-surface-variant">{session.venueAddress}</p></div></div>
                <div className="flex gap-3 rounded-lg bg-surface-container-low p-3"><CalendarDays className="h-5 w-5 shrink-0 text-primary" /><div><p className="font-bold">{dateTime.format(new Date(session.startTime))}</p><p className="mt-1 text-on-surface-variant">Kết thúc lúc {session.endTime.slice(11, 16)}</p></div></div>
              </div>
            </div>
          </section>

          <section className="owner-panel">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
              <div><h2 className="flex items-center gap-2 text-[18px]"><UsersRound className="h-5 w-5 text-primary" /> Người tham gia</h2><p className="mt-1 text-[12px] text-on-surface-variant">Theo dõi vé, thanh toán, check-in và các khoản cần hoàn.</p></div>
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
                <span className="rounded-full bg-surface-container-low px-3 py-1.5 text-[12px] font-bold">{details.tickets.length} lượt đăng ký</span>
              </div>
            </div>
            {details.tickets.length === 0 ? (
              <div className="grid min-h-44 place-items-center p-6 text-center"><div><Ticket className="mx-auto h-8 w-8 text-on-surface-variant" /><p className="mt-2 text-[13px] font-bold">Chưa có Player đăng ký.</p></div></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left">
                  <thead><tr><th>Player & mã vé</th><th>Trạng thái vé</th><th>Thanh toán</th><th>Check-in</th><th>Số tiền</th><th className="text-right">Hoàn tiền</th></tr></thead>
                  <tbody>{details.tickets.map((ticket) => {
                    const additional = ticket.sePayTransactions.filter((transaction) => transaction.status === 'AdditionalRefundPending');
                    const mainRefund = ticket.status === 'RefundPending' && ticket.paymentStatus === 'RefundPending';
                    const checkedIn = ticket.status === 'CheckedIn' || Boolean(ticket.checkedInAt);
                    const canCheckIn = session.status === 'Published'
                      && ticket.status === 'Paid'
                      && ticket.paymentStatus === 'Paid'
                      && !checkedIn;
                    return (
                      <tr className="border-t border-outline-variant align-top" key={ticket.sessionTicketId}>
                        <td><p className="font-bold">{ticket.playerName}</p><p className="mt-1 text-[12px] text-on-surface-variant">{ticket.playerEmail || 'Không có email'}</p><p className="mt-1 font-mono text-[12px] font-bold text-primary">{ticket.ticketCode}</p></td>
                        <td><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass(ticket.status)}`}>{ticketStatusLabels[ticket.status] ?? ticket.status}</span>{ticket.cancellationReason && <p className="mt-2 max-w-56 text-[11px] text-on-surface-variant">{ticket.cancellationReason}</p>}</td>
                        <td><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${badgeClass(ticket.paymentStatus)}`}>{paymentStatusLabels[ticket.paymentStatus] ?? ticket.paymentStatus}</span><p className="mt-2 text-[11px] text-on-surface-variant">{ticket.paidAt ? shortDateTime.format(new Date(ticket.paidAt)) : 'Chưa ghi nhận thanh toán'}</p></td>
                        <td>
                          {checkedIn ? (
                            <><span className="inline-flex items-center gap-1 text-[12px] font-bold text-[#477313]"><CheckCircle2 className="h-4 w-4" /> Đã check-in</span>{ticket.checkedInAt && <p className="mt-1 text-[11px] text-on-surface-variant">{shortDateTime.format(new Date(ticket.checkedInAt))}</p>}</>
                          ) : (
                            <div className="flex flex-col items-start gap-2">
                              <span className="text-[12px] text-on-surface-variant">Chưa check-in</span>
                              <button
                                className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-2 text-[11px] font-bold disabled:opacity-50"
                                disabled={Boolean(busy) || !canCheckIn}
                                onClick={() => window.confirm(`Xác nhận ${ticket.playerName} đã vào sân?`) && void checkInTicket(ticket.ticketCode)}
                                type="button"
                              >
                                <UserCheck className="h-4 w-4" />
                                {canCheckIn ? 'Check-in vé' : 'Chưa thể check-in'}
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="font-bold"><Banknote className="mr-1 inline h-4 w-4 text-primary" />{money.format(ticket.amount)}{additional.map((transaction) => <p className="mt-2 text-[11px] font-bold text-amber-800" key={transaction.sePayTransactionId}>Chuyển thêm: {money.format(transaction.amount)}</p>)}</td>
                        <td><div className="flex flex-col items-end gap-2">{mainRefund && <button className="rounded-lg border border-amber-300 px-3 py-2 text-[11px] font-bold text-amber-800" disabled={Boolean(busy)} onClick={() => setRefundTarget({ kind: 'ticket', ticket })} type="button">Hoàn vé</button>}{additional.map((transaction) => <button className="rounded-lg border border-amber-300 px-3 py-2 text-[11px] font-bold text-amber-800" disabled={Boolean(busy)} key={transaction.sePayTransactionId} onClick={() => setRefundTarget({ kind: 'additional', ticket, transaction })} type="button">Hoàn khoản chuyển thêm</button>)}{!mainRefund && additional.length === 0 && <span className="text-[11px] text-on-surface-variant">Không có khoản chờ hoàn</span>}</div></td>
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
              <label><span className="mb-1.5 block text-[13px] font-bold">Ngày chơi *</span><input className="w-full px-3 disabled:bg-surface-container-low" disabled={hasTickets} onChange={(event) => setEditValue('date', event.target.value)} required type="date" value={edit.date} /></label>
              <div className="grid grid-cols-2 gap-3">
                <label><span className="mb-1.5 block text-[13px] font-bold">Bắt đầu *</span><input className="w-full px-3 disabled:bg-surface-container-low" disabled={hasTickets} onChange={(event) => setEditValue('startTime', event.target.value)} required step={1800} type="time" value={edit.startTime} /></label>
                <label><span className="mb-1.5 block text-[13px] font-bold">Kết thúc *</span><input className="w-full px-3 disabled:bg-surface-container-low" disabled={hasTickets} onChange={(event) => setEditValue('endTime', event.target.value)} required step={1800} type="time" value={edit.endTime} /></label>
              </div>
            </div>
            <label><span className="mb-1.5 block text-[13px] font-bold">Tên buổi chơi *</span><input className="w-full px-3" maxLength={200} minLength={3} onChange={(event) => setEditValue('title', event.target.value)} required value={edit.title} /></label>
            <label><span className="mb-1.5 block text-[13px] font-bold">Mô tả</span><textarea className="min-h-24 w-full border p-3" maxLength={2000} onChange={(event) => setEditValue('description', event.target.value)} value={edit.description} /></label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label><span className="mb-1.5 block text-[13px] font-bold">Trình độ *</span><select className="w-full" onChange={(event) => setEditValue('skillLevel', event.target.value)} value={edit.skillLevel}>{!['1', '2', '3', '4', '5'].includes(edit.skillLevel) && <option value={edit.skillLevel}>{edit.skillLevel}</option>}{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Level {value}</option>)}</select></label>
              <label><span className="mb-1.5 block text-[13px] font-bold">Hình thức *</span><select className="w-full" onChange={(event) => setEditValue('playFormat', event.target.value)} value={edit.playFormat}>{!['1vs1', '2vs2'].includes(edit.playFormat) && <option value={edit.playFormat}>{edit.playFormat}</option>}<option value="1vs1">Đánh đơn · 1vs1</option><option value="2vs2">Đánh đôi · 2vs2</option></select></label>
              <label><span className="mb-1.5 block text-[13px] font-bold">Số người tối đa *</span><input className="w-full px-3" max={100} min={Math.max(1, activeMinimum)} onChange={(event) => setEditValue('maxPlayers', event.target.value)} required type="number" value={edit.maxPlayers} /></label>
              <label><span className="mb-1.5 block text-[13px] font-bold">Giá mỗi vé (VND) *</span><input className="w-full px-3 disabled:bg-surface-container-low" disabled={priceLocked} min={0} onChange={(event) => setEditValue('ticketPrice', event.target.value)} required step={1} type="number" value={edit.ticketPrice} /></label>
            </div>
            <div className="flex justify-end gap-3 border-t border-outline-variant pt-4"><button className="rounded-lg border border-outline-variant px-4 py-2.5 text-[13px] font-bold" disabled={busy === 'edit'} onClick={() => setEdit(null)} type="button">Đóng</button><button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-bold disabled:opacity-50" disabled={busy === 'edit'} type="submit">{busy === 'edit' && <Loader2 className="h-4 w-4 animate-spin" />} Lưu thay đổi</button></div>
          </form>
        </ModalDialog>
      )}

      {cancelOpen && session && (
        <ModalDialog aria-labelledby="cancel-session-title" canClose={busy !== 'cancel'} className="owner-modal max-w-lg" onRequestClose={() => setCancelOpen(false)} style={{ width: 'calc(100% - 1.75rem)' }}>
          <div className="flex items-start justify-between gap-4"><div><p className="owner-kicker text-red-700"><XCircle className="h-4 w-4" /> Hủy buổi chơi</p><h2 className="mt-1 text-[23px]" id="cancel-session-title">Hủy {session.title}?</h2></div><button aria-label="Đóng" className="rounded-lg p-2" disabled={busy === 'cancel'} onClick={() => setCancelOpen(false)} type="button"><X className="h-5 w-5" /></button></div>
          <p className="mt-4 text-[13px] leading-5 text-on-surface-variant">Player sẽ nhận thông báo. Các vé đã thanh toán được chuyển sang trạng thái chờ hoàn tiền để Owner xử lý đối soát.</p>
          <label className="mt-4 block"><span className="mb-1.5 block text-[13px] font-bold">Lý do hủy *</span><textarea className="min-h-24 w-full border p-3" maxLength={400} minLength={3} onChange={(event) => setCancelReason(event.target.value)} value={cancelReason} /></label>
          <div className="mt-5 flex justify-end gap-3"><button className="rounded-lg border border-outline-variant px-4 py-2.5 text-[13px] font-bold" disabled={busy === 'cancel'} onClick={() => setCancelOpen(false)} type="button">Quay lại</button><button className="inline-flex items-center gap-2 rounded-lg bg-red-700 px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-50" disabled={busy === 'cancel' || cancelReason.trim().length < 3} onClick={() => void cancel()} type="button">{busy === 'cancel' && <Loader2 className="h-4 w-4 animate-spin" />} Xác nhận hủy</button></div>
        </ModalDialog>
      )}
      {refundTarget && <RefundModal busy={busy === 'refund'} onClose={() => setRefundTarget(null)} onSubmit={(reference) => void refund(reference)} target={refundTarget} />}
    </OwnerShell>
  );
};
