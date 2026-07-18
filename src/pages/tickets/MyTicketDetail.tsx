import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clipboard,
  Clock3,
  CreditCard,
  History,
  Loader2,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Ticket,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  buySessionTicket,
  cancelPlayerTicket,
  getPlayerTicket,
  type SessionTicket,
  type SessionTicketStatus,
} from '../../api/ticketing';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { ModalDialog } from '../../components/ui/ModalDialog';
import { useToast } from '../../components/ui/ToastRegion';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { useVisiblePolling } from '../../hooks/useVisiblePolling';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const fullDate = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const clockTime = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

const ticketStatusLabels: Record<string, string> = {
  PendingPayment: 'Chờ thanh toán',
  Paid: 'Đã thanh toán',
  CheckedIn: 'Đã check-in',
  Cancelled: 'Đã hủy',
  Expired: 'Hết thời gian giữ',
  RefundPending: 'Đang hoàn tiền',
  Refunded: 'Đã hoàn tiền',
};

const paymentStatusLabels: Record<string, string> = {
  Pending: 'Chờ chuyển khoản',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
  RefundPending: 'Đang hoàn tiền',
  Refunded: 'Đã hoàn tiền',
};

const transactionStatusLabels: Record<string, string> = {
  Applied: 'Đã ghi nhận',
  AdditionalRefundPending: 'Chờ hoàn phần chuyển dư',
  TicketRefundPending: 'Chờ hoàn giao dịch đến muộn',
  ReviewRequired: 'Đang đối soát',
  Refunded: 'Đã hoàn tiền',
};

const statusClass = (status: SessionTicketStatus) => {
  if (status === 'Paid' || status === 'CheckedIn') return 'border-primary-container/70 bg-primary-container text-on-primary-container';
  if (status === 'PendingPayment' || status === 'RefundPending') return 'border-outline-variant bg-surface-container-high text-on-surface';
  if (status === 'Refunded') return 'border-primary-container/50 bg-primary-container/20 text-[#477313]';
  return 'border-error/20 bg-error-container text-error';
};

const timestamp = (value: string) => {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized).getTime();
};

const CancelTicketDialog = ({
  busy,
  code,
  onClose,
  onConfirm,
}: {
  busy: boolean;
  code: string;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
}) => {
  const [reason, setReason] = useState('');
  return (
    <ModalDialog
      aria-labelledby="cancel-ticket-title"
      canClose={!busy}
      className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-y-auto bg-transparent shadow-none"
      onRequestClose={onClose}
    >
      <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[0_24px_70px_rgba(22,26,18,0.22)]">
        <header className="flex items-start justify-between gap-4 border-b border-outline-variant bg-error-container px-5 py-4">
          <div className="min-w-0">
            <p className="break-all font-mono text-[12px] font-bold text-error">{code}</p>
            <h2 className="mt-1 text-[22px] font-bold" id="cancel-ticket-title">Hủy vé xé sân</h2>
          </div>
          <button aria-label="Đóng" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-error hover:bg-white/60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-error/70" disabled={busy} onClick={onClose} type="button">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div className="p-5">
          <div className="flex items-start gap-3 rounded-xl border border-error/20 bg-error-container/50 p-4 text-[13px] leading-6 text-on-surface-variant">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            Vé đã thanh toán sẽ chuyển sang chờ Owner xử lý hoàn tiền. Thao tác này không thể hoàn tác.
          </div>
          <label className="mt-4 block">
            <span className="text-[13px] font-bold">Lý do hủy (không bắt buộc)</span>
            <textarea
              autoFocus
              className="mt-2 min-h-28 w-full resize-y rounded-lg border border-outline-variant bg-surface-container p-3 text-[14px] leading-6 outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/30"
              disabled={busy}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ví dụ: Tôi có lịch đột xuất..."
              value={reason}
            />
            <span className="mt-1 block text-right text-[11px] text-on-surface-variant">{reason.length}/500</span>
          </label>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Button disabled={busy} onClick={onClose} type="button" variant="outline">Giữ lại vé</Button>
            <Button aria-busy={busy} onClick={() => void onConfirm(reason.trim())} type="button" variant="danger">
              {busy && <Loader2 aria-hidden="true" className="h-4 w-4" />} Xác nhận hủy
            </Button>
          </div>
        </div>
      </section>
    </ModalDialog>
  );
};

export const MyTicketDetail = () => {
  const ticketId = Number(useParams().id);
  const location = useLocation();
  const { token } = useAuth();
  const notify = useToast();
  const navigationTicket = (location.state as { ticket?: SessionTicket } | null)?.ticket;
  const initialTicket = navigationTicket?.sessionTicketId === ticketId ? navigationTicket : null;
  const [ticket, setTicket] = useState<SessionTicket | null>(initialTicket);
  const [loading, setLoading] = useState(!initialTicket);
  const [busyAction, setBusyAction] = useState<'cancel' | 'retry' | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [error, setError] = useState('');
  const [now, setNow] = useState(Date.now());

  const load = async (silent = false) => {
    if (!token || !Number.isInteger(ticketId) || ticketId <= 0) {
      if (!token) setError('Phiên đăng nhập không còn hợp lệ.');
      else setError('Mã vé không hợp lệ.');
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      setTicket(await getPlayerTicket(token, ticketId));
      setError('');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải chi tiết vé.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void load(Boolean(initialTicket));
  }, [ticketId, token]);

  const isPending = ticket?.status === 'PendingPayment';
  useEffect(() => {
    if (!isPending || !ticket?.holdExpiresAt) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isPending, ticket?.holdExpiresAt]);

  usePaymentRealtime((event) => {
    if (ticket && event.paymentId === ticket.paymentId) void load(true);
  });

  useScheduleRealtime((event) => {
    const session = ticket?.session;
    if (!session || event.entryType !== 'TicketSession') return;
    if (event.venueId === session.venueId && event.courtId === session.courtId) void load(true);
  });

  useVisiblePolling(
    () => load(true),
    7_500,
    Boolean(ticket && ticket.status === 'PendingPayment'),
  );

  const remainingSeconds = useMemo(() => ticket?.holdExpiresAt
    ? Math.max(0, Math.floor((timestamp(ticket.holdExpiresAt) - now) / 1000))
    : 0, [now, ticket?.holdExpiresAt]);
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const locallyExpired = ticket?.status === 'Expired'
    || Boolean(ticket?.status === 'PendingPayment' && ticket.holdExpiresAt && remainingSeconds <= 0);

  const copy = async (value: string | null | undefined, label: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      notify(`Đã sao chép ${label}.`, 'success');
    } catch {
      notify(`Không thể sao chép ${label}.`, 'error');
    }
  };

  const retry = async () => {
    if (!token || !ticket?.session) return;
    setBusyAction('retry');
    setError('');
    try {
      const updated = await buySessionTicket(token, ticket.session.ticketSessionId);
      setTicket(updated);
      setNow(Date.now());
      notify(updated.status === 'Paid' ? 'Vé miễn phí đã được xác nhận.' : 'Đã tạo lại mã QR và thời gian giữ vé.', 'success');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tạo lại yêu cầu thanh toán.');
    } finally {
      setBusyAction(null);
    }
  };

  const cancel = async (reason: string) => {
    if (!token || !ticket) return;
    setBusyAction('cancel');
    setError('');
    try {
      const updated = await cancelPlayerTicket(token, ticket.sessionTicketId, reason);
      setTicket(updated);
      setShowCancelDialog(false);
      notify(updated.status === 'RefundPending' ? 'Vé đã hủy và đang chờ hoàn tiền.' : 'Vé đã được hủy.', 'success');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể hủy vé.');
    } finally {
      setBusyAction(null);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-white px-4 pt-16" role="status">
        <div className="text-center"><Loader2 aria-hidden="true" className="mx-auto h-8 w-8 animate-spin text-primary motion-reduce:animate-none" /><p className="mt-3 text-[14px] font-semibold text-on-surface-variant">Đang tải vé...</p></div>
      </div>
    );
  }

  if (!ticket || !ticket.session) {
    return (
      <div className="grid min-h-dvh place-items-center bg-white px-4 pt-16">
        <section className="w-full max-w-md rounded-xl border border-error/25 bg-white p-7 text-center shadow-[0_12px_32px_rgba(22,26,18,0.08)]">
          <XCircle aria-hidden="true" className="mx-auto h-11 w-11 text-error" />
          <h1 className="mt-4 text-[22px] font-bold">Không thể mở vé</h1>
          <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{error || 'Vé không tồn tại hoặc không thuộc tài khoản của bạn.'}</p>
          <Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary-container px-4 text-[14px] font-bold text-on-primary-container" to="/my-tickets">Về lịch sử vé</Link>
        </section>
      </div>
    );
  }

  const session = ticket.session;
  const displayedTicketStatus: SessionTicketStatus = locallyExpired && ticket.status === 'PendingPayment'
    ? 'Expired'
    : ticket.status;
  const cancellationDeadline = new Date(session.startTime).getTime() - session.cancellationDeadlineHours * 60 * 60 * 1000;
  const canCancel = !locallyExpired
    && (ticket.status === 'PendingPayment' || ticket.status === 'Paid')
    && session.status === 'Published'
    && Date.now() <= cancellationDeadline;
  const showPaymentPanel = ticket.status === 'PendingPayment' && !locallyExpired;
  const canRetry = locallyExpired
    && session.status === 'Published'
    && new Date(session.startTime).getTime() > Date.now()
    && session.remainingTickets > 0;

  return (
    <div className="min-h-dvh bg-white pb-14 pt-[84px] text-on-background" data-my-ticket-detail>
      <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg text-[13px] font-bold text-primary hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70" to="/my-tickets">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Lịch sử vé
        </Link>

        {error && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-[14px] font-semibold text-error" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button className="ml-auto shrink-0 underline" onClick={() => void load()} type="button">Tải lại</button>
          </div>
        )}

        <section className="mt-3 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[0_12px_34px_rgba(22,26,18,0.07)]">
          <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_300px] lg:p-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-lg border px-2.5 py-1 text-[12px] font-bold ${statusClass(displayedTicketStatus)}`}>{ticketStatusLabels[displayedTicketStatus] ?? displayedTicketStatus}</span>
                <span className="rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[12px] font-semibold text-on-surface-variant">{paymentStatusLabels[ticket.paymentStatus] ?? ticket.paymentStatus}</span>
              </div>
              <h1 className="mt-4 text-[clamp(1.9rem,5vw,3.4rem)] font-bold leading-[1.06] tracking-[-0.03em]">{session.title}</h1>
              <p className="mt-3 flex items-start gap-2 text-[14px] leading-6 text-on-surface-variant"><MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span><strong className="text-on-surface">{session.venueName} · Sân {session.courtNumber}</strong><br />{session.venueAddress}</span></p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Mã vé</p>
              <div className="mt-2 flex items-start gap-2">
                <strong className="min-w-0 flex-1 break-all font-mono text-[18px] leading-6 text-on-surface">{ticket.ticketCode}</strong>
                <button aria-label="Sao chép mã vé" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-outline-variant bg-white text-primary hover:border-primary-container focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70" onClick={() => void copy(ticket.ticketCode, 'mã vé')} type="button"><Clipboard aria-hidden="true" className="h-4 w-4" /></button>
              </div>
              <p className="mt-2 text-[11px] text-on-surface-variant">Tạo lúc {dateTime.format(new Date(ticket.createdAt))}</p>
            </div>
          </div>
          <div className="grid border-t border-outline-variant bg-surface-container-low md:grid-cols-4 md:divide-x md:divide-outline-variant">
            <div className="p-4"><CalendarDays aria-hidden="true" className="h-5 w-5 text-primary" /><p className="mt-2 text-[11px] font-semibold text-on-surface-variant">Ngày chơi</p><p className="mt-1 text-[13px] font-bold">{fullDate.format(new Date(session.startTime))}</p></div>
            <div className="border-t border-outline-variant p-4 md:border-t-0"><Clock3 aria-hidden="true" className="h-5 w-5 text-primary" /><p className="mt-2 text-[11px] font-semibold text-on-surface-variant">Khung giờ</p><p className="mt-1 text-[13px] font-bold">{clockTime.format(new Date(session.startTime))} – {clockTime.format(new Date(session.endTime))}</p></div>
            <div className="border-t border-outline-variant p-4 md:border-t-0"><Ticket aria-hidden="true" className="h-5 w-5 text-primary" /><p className="mt-2 text-[11px] font-semibold text-on-surface-variant">Trình độ · hình thức</p><p className="mt-1 text-[13px] font-bold">Level {session.skillLevel} · {session.playFormat}</p></div>
            <div className="border-t border-outline-variant p-4 md:border-t-0"><CreditCard aria-hidden="true" className="h-5 w-5 text-primary" /><p className="mt-2 text-[11px] font-semibold text-on-surface-variant">Giá vé</p><p className="mt-1 text-[13px] font-bold">{ticket.amount === 0 ? 'Miễn phí' : currency.format(ticket.amount)}</p></div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            {showPaymentPanel && (
              <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-[0_8px_24px_rgba(22,26,18,0.05)] sm:p-6" aria-labelledby="ticket-payment-title">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-[12px] font-bold text-primary">Thanh toán QR</p><h2 className="mt-1 text-[22px] font-bold" id="ticket-payment-title">Hoàn tất chuyển khoản để giữ vé</h2></div>
                  <div className="rounded-xl bg-on-surface px-4 py-2 text-right text-white"><p className="text-[10px] font-semibold text-white/70">Còn lại</p><p className="font-mono text-[25px] font-bold text-primary-container">{countdown}</p></div>
                </div>
                <div className="mt-5 grid gap-5 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
                  <div className="aspect-square overflow-hidden rounded-xl border border-outline-variant bg-white p-2">
                    {ticket.qrImageUrl ? <img alt="Mã QR thanh toán vé" className="h-full w-full object-contain" src={ticket.qrImageUrl} /> : <div className="grid h-full place-items-center p-5 text-center text-[13px] text-on-surface-variant">QR chưa sẵn sàng. Hãy tải lại sau ít giây.</div>}
                  </div>
                  <dl className="divide-y divide-outline-variant rounded-xl border border-outline-variant">
                    {[
                      ['Ngân hàng', ticket.bankName || ticket.bankCode],
                      ['Chủ tài khoản', ticket.bankAccountName],
                      ['Số tài khoản', ticket.bankAccountNumber],
                      ['Số tiền', currency.format(ticket.amount)],
                      ['Nội dung', ticket.transferContent],
                    ].map(([label, value]) => (
                      <div className="grid gap-1 px-4 py-3 sm:grid-cols-[120px_minmax(0,1fr)_36px] sm:items-center" key={label}>
                        <dt className="text-[11px] font-semibold text-on-surface-variant">{label}</dt>
                        <dd className="min-w-0 break-all text-[13px] font-bold">{value || '—'}</dd>
                        {(label === 'Số tài khoản' || label === 'Nội dung') && value ? <button aria-label={`Sao chép ${label.toLocaleLowerCase('vi-VN')}`} className="grid h-9 w-9 place-items-center rounded-lg text-primary hover:bg-surface-container-low focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70" onClick={() => void copy(value, label.toLocaleLowerCase('vi-VN'))} type="button"><Clipboard aria-hidden="true" className="h-4 w-4" /></button> : <span />}
                      </div>
                    ))}
                  </dl>
                </div>
                <p className="mt-4 flex items-start gap-2 rounded-xl bg-surface-container-low p-3 text-[12px] leading-5 text-on-surface-variant"><ShieldCheck aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" />Giữ nguyên số tiền và nội dung chuyển khoản. SePay sẽ tự động cập nhật vé khi ngân hàng ghi nhận giao dịch.</p>
              </section>
            )}

            {locallyExpired && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-6">
                <RefreshCw aria-hidden="true" className="h-7 w-7 text-primary" />
                <h2 className="mt-3 text-[21px] font-bold">Lượt giữ vé đã hết hạn</h2>
                <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">Nếu buổi vẫn còn chỗ, bạn có thể tạo lại QR với thời gian giữ vé mới.</p>
                {canRetry ? (
                  <Button aria-busy={busyAction === 'retry'} className="mt-4" onClick={() => void retry()} type="button">
                    {busyAction === 'retry' && <Loader2 aria-hidden="true" className="h-4 w-4" />} Tạo lại QR
                  </Button>
                ) : (
                  <p className="mt-3 text-[13px] font-semibold text-on-surface-variant">Buổi chơi hiện không còn mở để giữ vé lại.</p>
                )}
              </section>
            )}

            {(ticket.status === 'Paid' || ticket.status === 'CheckedIn') && (
              <section className="rounded-2xl border border-primary-container/60 bg-primary-container/15 p-6">
                {ticket.status === 'CheckedIn' ? <UserCheck aria-hidden="true" className="h-8 w-8 text-[#477313]" /> : <CheckCircle2 aria-hidden="true" className="h-8 w-8 text-[#477313]" />}
                <h2 className="mt-3 text-[22px] font-bold">{ticket.status === 'CheckedIn' ? 'Vé đã được check-in' : 'Vé đã sẵn sàng'}</h2>
                <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{ticket.status === 'CheckedIn' ? `Check-in lúc ${ticket.checkedInAt ? dateTime.format(new Date(ticket.checkedInAt)) : 'đã ghi nhận'}.` : 'Đưa mã vé ở đầu trang cho Staff khi đến sân. Một vé chỉ check-in được một lần.'}</p>
              </section>
            )}

            {(ticket.status === 'RefundPending' || ticket.status === 'Refunded') && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-6">
                <Banknote aria-hidden="true" className="h-8 w-8 text-primary" />
                <h2 className="mt-3 text-[22px] font-bold">{ticket.status === 'Refunded' ? 'Đã hoàn tiền vé' : 'Đang chờ hoàn tiền'}</h2>
                <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{ticket.status === 'Refunded' ? 'Owner đã ghi nhận hoàn tiền. Xem mã đối soát trong lịch sử giao dịch bên dưới.' : 'Owner đã nhận yêu cầu và sẽ cập nhật mã đối soát sau khi hoàn tiền.'}</p>
              </section>
            )}

            {ticket.status === 'Cancelled' && (
              <section className="rounded-2xl border border-error/20 bg-error-container p-6"><XCircle aria-hidden="true" className="h-8 w-8 text-error" /><h2 className="mt-3 text-[22px] font-bold">Vé đã hủy</h2>{ticket.cancellationReason && <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">Lý do: {ticket.cancellationReason}</p>}</section>
            )}

            {ticket.sePayTransactions.length > 0 && (
              <section className="rounded-2xl border border-outline-variant bg-white p-5 sm:p-6" aria-labelledby="transaction-history-title">
                <div className="flex items-center gap-2"><History aria-hidden="true" className="h-5 w-5 text-primary" /><h2 className="text-[18px] font-bold" id="transaction-history-title">Lịch sử giao dịch</h2></div>
                <div className="mt-4 divide-y divide-outline-variant border-y border-outline-variant">
                  {ticket.sePayTransactions.map((transaction) => (
                    <article className="grid gap-2 py-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center" key={transaction.sePayTransactionId}>
                      <div><p className="text-[13px] font-bold">{transactionStatusLabels[transaction.status] ?? transaction.status}</p><p className="mt-1 text-[11px] text-on-surface-variant">SePay #{transaction.externalTransactionId} · {dateTime.format(new Date(transaction.receivedAt))}</p>{transaction.refundReference && <p className="mt-1 break-all text-[11px] font-semibold text-primary">Đối soát: {transaction.refundReference}</p>}</div>
                      <p className="font-mono text-[15px] font-bold">{currency.format(transaction.amount)}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-xl border border-outline-variant bg-white p-5">
              <h2 className="text-[15px] font-bold">Trạng thái vé</h2>
              <dl className="mt-3 divide-y divide-outline-variant text-[13px]">
                <div className="flex justify-between gap-3 py-3"><dt className="text-on-surface-variant">Vé</dt><dd className="text-right font-bold">{ticketStatusLabels[displayedTicketStatus] ?? displayedTicketStatus}</dd></div>
                <div className="flex justify-between gap-3 py-3"><dt className="text-on-surface-variant">Thanh toán</dt><dd className="text-right font-bold">{paymentStatusLabels[ticket.paymentStatus] ?? ticket.paymentStatus}</dd></div>
                {ticket.paidAt && <div className="flex justify-between gap-3 py-3"><dt className="text-on-surface-variant">Ghi nhận lúc</dt><dd className="text-right font-bold">{dateTime.format(new Date(ticket.paidAt))}</dd></div>}
              </dl>
            </section>
            <section className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
              <ShieldCheck aria-hidden="true" className="h-6 w-6 text-primary" />
              <h2 className="mt-3 text-[15px] font-bold">Chính sách hủy</h2>
              <p className="mt-2 text-[13px] leading-6 text-on-surface-variant">Chỉ hủy trước giờ chơi ít nhất {session.cancellationDeadlineHours} giờ. Vé đã thanh toán sẽ chuyển sang chờ hoàn tiền.</p>
              {canCancel && <Button className="mt-4 w-full" onClick={() => setShowCancelDialog(true)} type="button" variant="danger">Hủy vé</Button>}
            </section>
            <Link className="inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-outline-variant bg-white px-4 text-[13px] font-bold text-primary hover:border-primary-container hover:bg-surface-container-low focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70" to={`/ticket-sessions/${session.ticketSessionId}`}>Xem lại buổi chơi</Link>
          </aside>
        </div>
      </main>

      {showCancelDialog && (
        <CancelTicketDialog
          busy={busyAction === 'cancel'}
          code={ticket.ticketCode}
          onClose={() => setShowCancelDialog(false)}
          onConfirm={cancel}
        />
      )}
    </div>
  );
};
