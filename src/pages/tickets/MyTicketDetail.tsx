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
  Upload,
  UserCheck,
  X,
  XCircle,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { HistoryBackLink, useHistoryBack } from '../../components/navigation/HistoryBackLink';
import {
  buySessionTicket,
  cancelPlayerTicket,
  getPlayerTicket,
  type SessionTicket,
  type SessionTicketStatus,
} from '../../api/ticketing';
import { confirmRefundReceived, disputeRefund, submitTicketReceipt } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { useConfirm, usePrompt } from '../../components/ui/ConfirmDialogRegion';
import { ModalDialog } from '../../components/ui/ModalDialog';
import { useToast } from '../../components/ui/ToastRegion';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { useVisiblePolling } from '../../hooks/useVisiblePolling';
import { SePayAutoPollingToggle } from '../../components/payment/SePayAutoPollingToggle';
import { ReceiptFallbackPanel } from '../../components/payment/ReceiptFallbackPanel';
import { useSePayPollingEngine } from '../../hooks/useSePayPollingEngine';

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
  RefundPending: 'Chờ đối soát',
  Refunded: 'Đã đối soát',
};

const paymentStatusLabels: Record<string, string> = {
  Pending: 'Chờ chuyển khoản',
  WaitingForConfirmation: 'Chờ chủ sân xác nhận',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
  RefundPending: 'Chờ đối soát',
  Refunded: 'Đã đối soát',
};

const transactionStatusLabels: Record<string, string> = {
  Applied: 'Đã ghi nhận',
  AdditionalRefundPending: 'Chuyển dư cần đối soát',
  TicketRefundPending: 'Giao dịch đến muộn cần đối soát',
  ReviewRequired: 'Đang đối soát',
  Refunded: 'Đã đối soát',
};

const statusClass = (status: SessionTicketStatus) => {
  if (status === 'Paid' || status === 'CheckedIn') return 'border-primary-container/70 bg-primary-container text-on-primary-container';
  if (status === 'PendingPayment' || status === 'RefundPending') return 'border-outline-variant bg-surface-container-high text-on-surface';
  if (status === 'Refunded') return 'border-primary-container/50 bg-primary-container/20 text-[#477313]';
  return 'border-error/20 bg-error-container text-error';
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
            <h2 className="mt-1 text-[18px] font-bold" id="cancel-ticket-title">Hủy vé xé sân</h2>
          </div>
          <button aria-label="Đóng" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg text-error hover:bg-white/60 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-error/70" disabled={busy} onClick={onClose} type="button">
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </header>
        <div className="p-5">
          <div className="flex items-start gap-3 rounded-xl border border-error/20 bg-error-container/50 p-4 text-[13px] leading-6 text-on-surface-variant">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            Hủy vé không hoàn lại khoản đã thanh toán. Chỗ của bạn sẽ được nhả cho người khác và thao tác này không thể hoàn tác.
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
  const confirm = useConfirm();
  const prompt = usePrompt();
  const [refundBusy, setRefundBusy] = useState(false);
  const [refundError, setRefundError] = useState('');
  const navigationTicket = (location.state as { ticket?: SessionTicket } | null)?.ticket;
  const initialTicket = navigationTicket?.sessionTicketId === ticketId ? navigationTicket : null;
  const [busyAction, setBusyAction] = useState<'cancel' | 'retry' | 'receipt' | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [actionError, setActionError] = useState('');
  const [now, setNow] = useState(Date.now());
  const { goBack } = useHistoryBack('/my-tickets');

  const hasValidRequest = Boolean(token) && Number.isInteger(ticketId) && ticketId > 0;
  const {
    data,
    error: loadError,
    loading: queryLoading,
    refresh: load,
    setData: setTicket,
  } = useApiQuery(
    ['my-ticket', token, ticketId],
    () => getPlayerTicket(token!, ticketId),
    { enabled: hasValidRequest, errorMessage: 'Không thể tải chi tiết vé.' },
  );

  // Arriving straight from a purchase carries the ticket in navigation state, so the screen can
  // render before the confirming request lands.
  const ticket = data ?? initialTicket;
  const loading = queryLoading && !initialTicket;
  const error = actionError
    || loadError
    || (token ? (hasValidRequest ? '' : 'Mã vé không hợp lệ.') : 'Phiên đăng nhập không còn hợp lệ.');
  const setError = setActionError;

  const isPending = ticket?.status === 'PendingPayment' && ticket.paymentStatus === 'Pending';
  const isAwaitingReview = ticket?.status === 'PendingPayment' && ticket.paymentStatus === 'WaitingForConfirmation';
  useEffect(() => {
    if (!isPending || !ticket?.holdExpiresAt) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isPending, ticket?.holdExpiresAt]);

  const hasSePayConfigured = Boolean(ticket?.hasSePayApiToken);
  const isAutoActive = hasSePayConfigured;

  const {
    countdown: sepayCountdown,
    isChecking: isSepayChecking,
    triggerNow: checkSepayNow,
  } = useSePayPollingEngine({
    intervalSeconds: 5,
    enabled: isAutoActive,
    isActive: Boolean(ticket && ticket.status === 'PendingPayment'),
    onTrigger: load,
  });

  usePaymentRealtime((event) => {
    if (ticket && event.paymentId === ticket.paymentId) void load();
  });

  useScheduleRealtime((event) => {
    const session = ticket?.session;
    if (!session || event.entryType !== 'TicketSession') return;
    if (event.venueId === session.venueId && event.courtId === session.courtId) void load();
  });

  useVisiblePolling(
    load,
    7_500,
    Boolean(ticket && ticket.status === 'PendingPayment' && !isAutoActive),
  );

  const holdDeadline = useMemo(() => ticket?.holdRemainingSeconds != null
    ? Date.now() + ticket.holdRemainingSeconds * 1000
    : 0, [ticket?.sessionTicketId, ticket?.holdRemainingSeconds]);
  const remainingSeconds = Math.max(0, Math.ceil((holdDeadline - now) / 1000));
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const locallyExpired = ticket?.status === 'Expired'
    || Boolean(ticket?.status === 'PendingPayment' && ticket.paymentStatus === 'Pending'
      && ticket.holdExpiresAt && remainingSeconds <= 0);

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
      notify('Vé đã được hủy. Khoản đã thanh toán (nếu có) không được hoàn lại.', 'success');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể hủy vé.');
    } finally {
      setBusyAction(null);
    }
  };

  const exitToHistory = async () => {
    if (isPending && token && ticket) {
      try {
        await cancelPlayerTicket(token, ticket.sessionTicketId, '');
        notify('Đã hủy vé giữ chỗ chưa thanh toán.', 'success');
      } catch {
        // Ignore: still leave the page even if the silent cancel fails.
      }
    }
    goBack();
  };

  const submitReceipt = async () => {
    if (!token || !ticket || !receipt) {
      setError('Vui lòng chọn ảnh biên lai trước khi gửi.');
      return;
    }
    if (remainingSeconds <= 0) {
      setError('Thời gian giữ vé đã hết. Vui lòng tạo lại QR.');
      return;
    }
    setBusyAction('receipt');
    setUploadProgress(0);
    setError('');
    try {
      await submitTicketReceipt(token, ticket.sessionTicketId, receipt, setUploadProgress);
      setTicket(await getPlayerTicket(token, ticket.sessionTicketId));
      setReceipt(null);
      notify('Đã gửi biên lai cho chủ sân kiểm tra.', 'success');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể gửi biên lai.');
    } finally {
      setBusyAction(null);
      setUploadProgress(null);
    }
  };

  const confirmReceivedRefund = async () => {
    if (!token || !ticket) return;
    if (!(await confirm({
      title: 'Bạn đã nhận được tiền hoàn?',
      message: 'Chỉ xác nhận khi khoản tiền hoàn đã thực sự vào tài khoản của bạn.',
      confirmLabel: 'Đã nhận được tiền',
      tone: 'success',
    }))) return;
    setRefundBusy(true);
    setRefundError('');
    try {
      await confirmRefundReceived(token, ticket.paymentId);
      notify('Đã xác nhận nhận tiền hoàn.', 'success');
      setTicket(await getPlayerTicket(token, ticket.sessionTicketId));
    } catch (requestError) {
      setRefundError(requestError instanceof ApiError ? requestError.message : 'Không thể xác nhận nhận tiền hoàn.');
    } finally {
      setRefundBusy(false);
    }
  };

  const submitRefundDispute = async () => {
    if (!token || !ticket) return;
    const reason = (await prompt({
      title: 'Khiếu nại khoản hoàn tiền',
      message: 'Mô tả rõ số tiền chưa nhận được hoặc điểm không khớp trong minh chứng để Admin kiểm tra.',
      label: 'Lý do khiếu nại',
      placeholder: 'Ví dụ: Chưa nhận được tiền sau khi kiểm tra tài khoản...',
      required: true,
      confirmLabel: 'Gửi khiếu nại',
      tone: 'danger',
    }))?.trim();
    if (!reason) return;
    if (reason.length < 5) { notify('Lý do khiếu nại phải có ít nhất 5 ký tự.', 'error'); return; }

    setRefundBusy(true);
    setRefundError('');
    try {
      await disputeRefund(token, ticket.paymentId, reason);
      setTicket(await getPlayerTicket(token, ticket.sessionTicketId));
      notify('Đã gửi khiếu nại đến Admin.', 'success');
    } catch (requestError) {
      setRefundError(requestError instanceof ApiError ? requestError.message : 'Không thể gửi khiếu nại.');
    } finally {
      setRefundBusy(false);
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
          <h1 className="mt-4 text-[18px] font-bold">Không thể mở vé</h1>
          <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{error || 'Vé không tồn tại hoặc không thuộc tài khoản của bạn.'}</p>
          <HistoryBackLink className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary-container px-4 text-[14px] font-bold text-on-primary-container" fallback="/my-tickets">Về lịch sử vé</HistoryBackLink>
        </section>
      </div>
    );
  }

  const session = ticket.session;
  const canShowCheckInCode = ticket.status === 'Paid' || ticket.status === 'CheckedIn';
  const displayedTicketStatus: SessionTicketStatus = locallyExpired && ticket.status === 'PendingPayment'
    ? 'Expired'
    : ticket.status;
  const cancellationDeadline = new Date(session.startTime).getTime() - session.cancellationDeadlineHours * 60 * 60 * 1000;
  const hasPaymentCommitment = ticket.paymentStatus !== 'Pending';
  const canCancel = !locallyExpired
    && (ticket.status === 'PendingPayment' || ticket.status === 'Paid')
    && session.status === 'Published'
    && (!hasPaymentCommitment || Date.now() <= cancellationDeadline);
  const showPaymentPanel = ticket.status === 'PendingPayment' && ticket.paymentStatus === 'Pending' && !locallyExpired;
  const canRetry = locallyExpired
    && session.status === 'Published'
    && new Date(session.startTime).getTime() > Date.now()
    && session.remainingTickets > 0;

  return (
    <div className="min-h-dvh bg-white pb-14 pt-[84px] text-on-background" data-my-ticket-detail>
      <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <button className="inline-flex min-h-11 items-center gap-2 rounded-lg text-[13px] font-bold text-primary hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70" onClick={() => void exitToHistory()} type="button">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Lịch sử vé
        </button>

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
              <h1 className="mt-4 text-[clamp(1.65rem,4vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.03em]">{session.title}</h1>
              <p className="mt-3 flex items-start gap-2 text-[14px] leading-6 text-on-surface-variant"><MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span><strong className="text-on-surface">{session.venueName} · Sân {session.courtNumber}</strong><br />{session.venueAddress}</span></p>
            </div>
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Mã check-in</p>
              <div className="mt-2 flex items-start gap-2">
                <strong className="min-w-0 flex-1 break-all font-mono text-[18px] leading-6 text-on-surface">{canShowCheckInCode ? ticket.ticketCode : 'Có sau khi thanh toán'}</strong>
                {canShowCheckInCode && <button aria-label="Sao chép mã check-in" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-outline-variant bg-white text-primary hover:border-primary-container focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70" onClick={() => void copy(ticket.ticketCode, 'mã check-in')} type="button"><Clipboard aria-hidden="true" className="h-4 w-4" /></button>}
              </div>
              <p className="mt-2 text-[11px] text-on-surface-variant">Tạo lúc {dateTime.format(new Date(ticket.createdAt))}</p>
            </div>
          </div>
          <div className="grid border-t border-outline-variant bg-surface-container-low md:grid-cols-4 md:divide-x md:divide-outline-variant">
            <div className="p-4"><CalendarDays aria-hidden="true" className="h-5 w-5 text-primary" /><p className="mt-2 text-[11px] font-semibold text-on-surface-variant">Ngày chơi</p><p className="mt-1 text-[13px] font-bold">{fullDate.format(new Date(session.startTime))}</p></div>
            <div className="border-t border-outline-variant p-4 md:border-t-0"><Clock3 aria-hidden="true" className="h-5 w-5 text-primary" /><p className="mt-2 text-[11px] font-semibold text-on-surface-variant">Khung giờ</p><p className="mt-1 text-[13px] font-bold">{clockTime.format(new Date(session.startTime))} – {clockTime.format(new Date(session.endTime))}</p></div>
            <div className="border-t border-outline-variant p-4 md:border-t-0"><Ticket aria-hidden="true" className="h-5 w-5 text-primary" /><p className="mt-2 text-[11px] font-semibold text-on-surface-variant">Trình độ · hình thức</p><p className="mt-1 text-[13px] font-bold">Level {session.minSkillLevel}–{session.maxSkillLevel} · {session.playFormat}</p></div>
            <div className="border-t border-outline-variant p-4 md:border-t-0"><CreditCard aria-hidden="true" className="h-5 w-5 text-primary" /><p className="mt-2 text-[11px] font-semibold text-on-surface-variant">Giá vé</p><p className="mt-1 text-[13px] font-bold">{ticket.amount === 0 ? 'Miễn phí' : currency.format(ticket.amount)}</p></div>
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-5">
            {showPaymentPanel && (
              <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-[0_8px_24px_rgba(22,26,18,0.05)] sm:p-6" aria-labelledby="ticket-payment-title">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div><p className="text-[12px] font-bold text-primary">Thanh toán QR</p><h2 className="mt-1 text-[18px] font-bold" id="ticket-payment-title">Hoàn tất chuyển khoản để giữ vé</h2></div>
                  <div className="rounded-xl bg-on-surface px-4 py-2 text-right text-white"><p className="text-[10px] font-semibold text-white/70">Còn lại</p><p className="font-mono text-[20px] font-bold text-primary-container">{countdown}</p></div>
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
                <div className="mt-4 space-y-4">
                  <SePayAutoPollingToggle
                    countdownSeconds={sepayCountdown}
                    hasSePayConfigured={hasSePayConfigured}
                    intervalSeconds={5}
                    isChecking={isSepayChecking}
                    onManualCheck={() => void checkSepayNow()}
                    transferContent={ticket.transferContent}
                  />

                  {ticket.rejectionReason && <p className="rounded-xl border border-error/20 bg-error-container p-3 text-[13px] font-bold text-error">Biên lai trước bị từ chối: {ticket.rejectionReason}</p>}
                  <ReceiptFallbackPanel
                    defaultOpen={Boolean(ticket.rejectionReason || !hasSePayConfigured)}
                    hasSePayConfigured={hasSePayConfigured}
                  >
                  {uploadProgress !== null && busyAction === 'receipt' && (
                    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3">
                      <div className="flex items-center justify-between text-[12px] font-bold text-primary">
                        <span>Đang tải ảnh biên lai lên Cloud...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-outline-variant">
                        <div
                          className="h-full bg-primary transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {(
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
                      <label className="block min-w-0">
                        <span className="text-[13px] font-bold">Ảnh biên lai chuyển khoản</span>
                        <span className="mt-2 flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 text-[13px] font-semibold text-on-surface-variant">
                          <Upload className="h-4 w-4 shrink-0 text-primary" />
                          <span className="truncate">{receipt?.name ?? 'Chọn ảnh JPG, PNG hoặc WEBP'}</span>
                          <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busyAction === 'receipt'} onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" />
                        </span>
                      </label>
                      <Button aria-busy={busyAction === 'receipt'} disabled={!receipt || Boolean(busyAction)} onClick={() => void submitReceipt()} type="button">
                        {busyAction === 'receipt' ? (uploadProgress !== null ? `Đang tải ${uploadProgress}%` : <Loader2 className="h-4 w-4 animate-spin" />) : <Upload className="h-4 w-4" />} Gửi biên lai
                      </Button>
                    </div>
                  )}
                  </ReceiptFallbackPanel>
                </div>
              </section>
            )}

            {isAwaitingReview && (
              <section className="rounded-2xl border border-primary-container/60 bg-primary-container/15 p-6">
                <CheckCircle2 className="h-8 w-8 text-primary" />
                <h2 className="mt-3 text-[18px] font-bold">Đã gửi biên lai</h2>
                <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">Đang chờ chủ sân kiểm tra. Thời gian giữ vé đã được tạm dừng.</p>
                {ticket.receiptImageUrl && <img alt="Biên lai đã gửi" className="mt-4 max-h-72 rounded-xl border border-outline-variant bg-white object-contain" src={ticket.receiptImageUrl} />}
              </section>
            )}

            {locallyExpired && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-6">
                <RefreshCw aria-hidden="true" className="h-7 w-7 text-primary" />
                <h2 className="mt-3 text-[18px] font-bold">Lượt giữ vé đã hết hạn</h2>
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
                <h2 className="mt-3 text-[18px] font-bold">{ticket.status === 'CheckedIn' ? 'Vé đã được check-in' : 'Vé đã sẵn sàng'}</h2>
                <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{ticket.status === 'CheckedIn' ? `Check-in lúc ${ticket.checkedInAt ? dateTime.format(new Date(ticket.checkedInAt)) : 'đã ghi nhận'}.` : 'Đưa mã vé ở đầu trang cho Staff khi đến sân. Một vé chỉ check-in được một lần.'}</p>
              </section>
            )}

            {(ticket.status === 'RefundPending' || ticket.status === 'Refunded') && (
              <section className="rounded-2xl border border-outline-variant bg-surface-container-low p-6">
                <Banknote aria-hidden="true" className="h-8 w-8 text-primary" />
                <h2 className="mt-3 text-[18px] font-bold">{ticket.status === 'Refunded' ? 'Đã đối soát giao dịch cũ' : 'Giao dịch cũ đang đối soát'}</h2>
                <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">Trạng thái này chỉ áp dụng cho dữ liệu phát sinh trước chính sách không hoàn tiền hiện tại.</p>
              </section>
            )}

            {ticket.status === 'Cancelled' && (
              <section className="rounded-2xl border border-error/20 bg-error-container p-6"><XCircle aria-hidden="true" className="h-8 w-8 text-error" /><h2 className="mt-3 text-[18px] font-bold">Vé đã hủy</h2>{ticket.paymentStatus === 'Paid' && <p className="mt-2 text-[14px] font-semibold leading-6 text-on-surface-variant">Khoản đã thanh toán không được hoàn lại.</p>}{ticket.cancellationReason && <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">Lý do: {ticket.cancellationReason}</p>}</section>
            )}

            {(ticket.paymentStatus === 'RefundPending' || ticket.paymentStatus === 'Refunded') && (
              <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-amber-900">
                  <Banknote aria-hidden="true" className="h-5 w-5" />
                  {ticket.paymentStatus === 'Refunded' ? 'Đã hoàn tiền' : 'Đang chờ hoàn tiền'}
                </h2>
                <p className="mt-2 text-[13px] leading-5 text-amber-900">
                  {ticket.paymentStatus === 'Refunded'
                    ? `Chủ sân đã hoàn ${currency.format(ticket.amount)} cho vé này.`
                    : `Vé này đã hủy. Chủ sân cần hoàn lại ${currency.format(ticket.amount)} cho bạn.`}
                </p>

                {refundError && (
                  <p className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-error">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {refundError}
                  </p>
                )}

                <div className="mt-3 space-y-3">
                  {ticket.refundProofImageUrl ? (
                    <img alt="Minh chứng hoàn tiền từ chủ sân" className="max-h-64 w-full rounded-xl border border-amber-200 bg-white object-contain" src={ticket.refundProofImageUrl} />
                  ) : (
                    <p className="rounded-lg border border-amber-200 bg-white px-3 py-2 text-[12px] text-amber-900">Chủ sân chưa gửi minh chứng hoàn tiền.</p>
                  )}
                  {ticket.refundReference && (
                    <p className="text-[12px] text-amber-900">Mã tham chiếu: <strong>{ticket.refundReference}</strong></p>
                  )}
                  {ticket.refundDisputeStatus === 'Open' && (
                    <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700">
                      Bạn đã khiếu nại: {ticket.refundDisputeReason}. Admin đang xem xét.
                    </p>
                  )}
                  {ticket.refundDisputeResolution && (
                    <p className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[12px] text-blue-800">
                      <strong>Kết luận của Admin:</strong> {ticket.refundDisputeResolution}
                    </p>
                  )}
                  {ticket.paymentStatus === 'RefundPending' && ticket.refundDisputeStatus !== 'Open' && (
                    <div className="flex flex-wrap gap-2">
                      <button className="inline-flex items-center gap-2 rounded-lg bg-[#081d24] px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={refundBusy} onClick={() => void confirmReceivedRefund()} type="button">
                        <CheckCircle2 className="h-4 w-4" /> Đã nhận được tiền
                      </button>
                      <button className="inline-flex items-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-[13px] font-bold text-red-700 disabled:opacity-50" disabled={refundBusy} onClick={() => void submitRefundDispute()} type="button">
                        <AlertCircle className="h-4 w-4" /> Khiếu nại
                      </button>
                    </div>
                  )}
                </div>
              </section>
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
            {hasPaymentCommitment && (
              <section className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
                <ShieldCheck aria-hidden="true" className="h-6 w-6 text-primary" />
                <h2 className="mt-3 text-[15px] font-bold">Chính sách hủy</h2>
                <p className="mt-2 text-[13px] leading-6 text-on-surface-variant">Chỉ hủy trước giờ chơi ít nhất {session.cancellationDeadlineHours} giờ. Vé đã thanh toán không được hoàn tiền.</p>
                {canCancel && <Button className="mt-4 w-full" onClick={() => setShowCancelDialog(true)} type="button" variant="danger">Hủy vé</Button>}
              </section>
            )}
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
