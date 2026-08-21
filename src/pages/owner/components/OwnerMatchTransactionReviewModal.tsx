import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, MapPin, MessageCircle, Phone, ReceiptText, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { BankTransfer } from '../../../api/booking';
import { ApiError } from '../../../api/client';
import type { BookingDetail } from '../../../data/bookings';
import {
  approveOperatorPayment,
  getOperatorBookingPayments,
  markOperatorMatchRefundSent,
  rejectOperatorPayment,
} from '../../../api/payment';
import { useAuth } from '../../../auth/AuthContext';
import { ModalDialog } from '../../../components/ui/ModalDialog';
import { usePaymentRealtime } from '../../../hooks/usePaymentRealtime';
import { preloadReceiptImage } from '../../../utils/receiptImage';
import { OwnerBookingSlotSummary, mergeAdjacentBookingSlots } from './OwnerBookingSlotSummary';
import { useConfirm } from '../../../components/ui/ConfirmDialogRegion';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});
const statusLabels: Record<string, string> = {
  Pending: 'Chờ gửi biên lai',
  WaitingForConfirmation: 'Chờ xác nhận',
  Paid: 'Đã thanh toán',
  Expired: 'Đã hết hạn',
  Cancelled: 'Đã hủy',
  RefundPending: 'Chờ hoàn tiền',
  Refunded: 'Đã hoàn tiền',
};

const statusClasses: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  WaitingForConfirmation: 'bg-blue-100 text-blue-700',
  Paid: 'bg-emerald-100 text-emerald-700',
  Expired: 'bg-red-100 text-red-700',
  Cancelled: 'bg-red-100 text-red-700',
  RefundPending: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
  Refunded: 'bg-slate-100 text-slate-700',
};

export { mergeAdjacentBookingSlots } from './OwnerBookingSlotSummary';
type OwnerMatchTransactionReviewModalProps = {
  bookingId: number;
  bookingCode: string;
  booking: Pick<BookingDetail, 'address' | 'courtName' | 'slots' | 'totalAmount'>;
  initialPayments?: BankTransfer[];
  initialPaymentsRequest?: Promise<BankTransfer[]>;
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
};

export const OwnerMatchTransactionReviewModal = ({
  bookingId,
  bookingCode,
  booking,
  initialPayments,
  initialPaymentsRequest,
  onClose,
  onUpdated,
}: OwnerMatchTransactionReviewModalProps) => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [payments, setPayments] = useState<BankTransfer[]>(initialPayments ?? []);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(!initialPayments);
  const [error, setError] = useState('');

  const load = useCallback(async (forceRefresh = false) => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const nextPayments = await (!forceRefresh && initialPaymentsRequest
        ? initialPaymentsRequest
        : getOperatorBookingPayments(token, bookingId));
      nextPayments.forEach((payment) => preloadReceiptImage(payment.receiptImageUrl));
      setPayments(nextPayments);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải biên lai của nhóm.');
    } finally {
      setLoading(false);
    }
  }, [bookingId, initialPaymentsRequest, token]);

  useEffect(() => {
    if (initialPayments) initialPayments.forEach((payment) => preloadReceiptImage(payment.receiptImageUrl));
    else void load();
  }, [initialPayments, load]);

  usePaymentRealtime((event) => {
    if (event.bookingId === bookingId && busyId === null) void load(true);
  });

  const groupedPayments = useMemo(() => {
    const groups = new Map<string, BankTransfer[]>();
    payments.forEach((payment) => {
      const key = payment.paymentGroupId ?? `single-${payment.paymentId}`;
      groups.set(key, [...(groups.get(key) ?? []), payment]);
    });
    return Array.from(groups.values()).map((groupPayments) => {
      const representative = groupPayments[0];
      return {
        representative,
        payments: groupPayments,
        groupTotalAmount: representative.paymentGroupId
          ? representative.groupTotalAmount
          : groupPayments.reduce((total, payment) => total + payment.amount, 0),
      };
    });
  }, [payments]);
  const bookingSlots = payments[0]?.slots?.length
    ? payments[0].slots
    : booking.slots?.length
      ? booking.slots.map((slot) => ({ ...slot, courtId: Number(slot.courtId) }))
      : payments[0] ? [{ courtId: payments[0].courtNumber, courtNumber: payments[0].courtNumber, startTime: payments[0].startTime, endTime: payments[0].endTime }] : [];
  const bookingTimeGroups = mergeAdjacentBookingSlots(bookingSlots);
  const amountPerPlayer = payments[0]?.amount ?? 0;

  const approve = async (payment: BankTransfer) => {
    if (!token) return;
    if (!(await confirm({
      title: `Xác nhận đã nhận tiền của ${payment.playerName}?`,
      message: 'Phần đóng góp của người chơi này sẽ được ghi nhận là đã thanh toán.',
      confirmLabel: 'Đã nhận đủ',
      tone: 'success',
    }))) return;
    setBusyId(payment.paymentId);
    setError('');
    try {
      const updated = await approveOperatorPayment(token, payment.paymentId);
      setPayments((current) => current.map((item) => item.paymentId === updated.paymentId || (
        updated.paymentGroupId && item.paymentGroupId === updated.paymentGroupId
      ) ? { ...item, paymentStatus: updated.paymentStatus, verifiedAt: updated.verifiedAt } : item));
      void onUpdated();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể xác nhận thanh toán.');
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (payment: BankTransfer) => {
    const reason = rejectReasons[payment.paymentId]?.trim() ?? '';
    if (!token || reason.length < 3) return;
    if (!(await confirm({
      title: `Từ chối thanh toán của ${payment.playerName}?`,
      message: 'Người chơi sẽ nhận được thông báo và cần chuyển khoản lại.',
      confirmLabel: 'Từ chối',
      tone: 'danger',
    }))) return;
    setBusyId(payment.paymentId);
    setError('');
    try {
      const updated = await rejectOperatorPayment(token, payment.paymentId, reason);
      setRejectReasons((current) => ({ ...current, [payment.paymentId]: '' }));
      setPayments((current) => current.map((item) => item.paymentId === updated.paymentId || (
        updated.paymentGroupId && item.paymentGroupId === updated.paymentGroupId
      ) ? { ...item, paymentStatus: updated.paymentStatus, rejectionReason: updated.rejectionReason } : item));
      void onUpdated();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể từ chối thanh toán.');
    } finally {
      setBusyId(null);
    }
  };

  const markRefundSent = async (groupPayments: BankTransfer[]) => {
    if (!token) return;
    const refundPayments = groupPayments.filter((item) => item.paymentStatus === 'RefundPending');
    if (refundPayments.length === 0) return;
    const refundTotal = refundPayments.reduce((total, item) => total + item.amount, 0);
    if (!(await confirm({
      title: 'Xác nhận đã chuyển tiền hoàn?',
      message: 'Chỉ tiếp tục sau khi bạn đã chuyển ' + currency.format(refundTotal)
        + '. Người thực sự thanh toán sẽ nhận thông báo để xác nhận tiền đã vào tài khoản.',
      confirmLabel: 'Đã chuyển tiền',
      tone: 'success',
    }))) return;

    const representative = refundPayments[0];
    setBusyId(representative.paymentId);
    setError('');
    try {
      const updatedPayments = await markOperatorMatchRefundSent(token, representative.paymentId);
      const updates = new Map(updatedPayments.map((item) => [item.paymentId, item]));
      setPayments((current) => current.map((item) => updates.get(item.paymentId) ?? item));
      void onUpdated();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể gửi yêu cầu xác nhận hoàn tiền.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <ModalDialog
      aria-labelledby="match-payment-title"
      canClose={busyId === null}
      className="owner-modal max-w-6xl"
      onRequestClose={onClose}
      style={{ width: 'calc(100% - 1.75rem)' }}
    >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold text-primary">{bookingCode}</p>
            <h2 className="mt-1 text-[25px] font-bold" id="match-payment-title">
              Biên lai của nhóm chơi
            </h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              Một giao dịch gộp chỉ cần xác nhận hoặc từ chối một lần.
            </p>
          </div>
          <button
            aria-label="Đóng"
            className="rounded-lg p-2 hover:bg-surface-container-low disabled:opacity-50"
            disabled={busyId !== null}
            onClick={onClose}
            type="button"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {error && (
          <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-[13px] font-bold">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="flex min-h-72 items-center justify-center">
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
          </div>
        ) : (
          <>
          <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <div className="space-y-5">
            {groupedPayments.map((group) => {
              const payment = group.representative;
              const isBatch = group.payments.length > 1 || payment.groupPaymentCount > 1;
              const isBusy = busyId === payment.paymentId;
              const rejectReason = rejectReasons[payment.paymentId] ?? '';
              const playerNames = group.payments.map((item) => item.playerName).join(', ');
              const refundPayments = group.payments.filter((item) => item.paymentStatus === 'RefundPending');
              const refundSent = refundPayments.length > 0 && refundPayments.every((item) =>
                item.history.some((entry) => entry.action === 'OwnerMarkedRefundSent'));
              const refundBusy = refundPayments.some((item) => item.paymentId === busyId);
              return (
                <article className="overflow-hidden rounded-xl border border-outline-variant" key={payment.paymentGroupId ?? payment.paymentId}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
                    <div>
                      <p className="text-[16px] font-bold">{isBatch ? `Giao dịch gộp ${group.payments.length} người` : payment.playerName}</p>
                      <p className="mt-1 text-[12px] text-on-surface-variant">
                        Tổng thanh toán: {currency.format(group.groupTotalAmount)}
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {group.payments.map((item) => (
                          <div className="rounded-lg bg-surface-container-low px-3 py-2" key={item.paymentId}>
                            {isBatch && <p className="text-[12px] font-bold">{item.playerName}</p>}
                            <div className="mt-1 flex items-center gap-1.5 text-[12px] text-on-surface-variant">
                              <Phone className="h-3.5 w-3.5 shrink-0 text-primary" />
                              {item.playerPhoneNumber ? (
                                <a
                                  aria-label={'Gọi ' + item.playerName}
                                  className="font-bold text-primary hover:underline"
                                  href={'tel:' + item.playerPhoneNumber.replaceAll(' ', '')}
                                >
                                  {item.playerPhoneNumber}
                                </a>
                              ) : (
                                <span>Chưa cập nhật SĐT</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClasses[payment.paymentStatus] ?? 'bg-slate-100 text-slate-700'}`}>
                        {refundSent ? 'Chờ người chơi xác nhận' : (statusLabels[payment.paymentStatus] ?? payment.paymentStatus)}
                      </span>
                      {payment.paymentStatus === 'RefundPending' && (
                        <button
                          aria-label={`Nhắn tin hoàn tiền cho ${payment.playerName}`}
                          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-[11px] font-bold text-amber-900 shadow-sm transition hover:bg-amber-100 active:scale-95"
                          onClick={() => {
                            const draftText = `Chat hoàn tiền - Match #${bookingCode} (Khoản #${payment.transferCode || payment.paymentId})`;
                            const targetUserId = payment.payerUserId;
                            if (targetUserId) {
                              navigate(`/owner/messages?chatWithUserId=${targetUserId}&bookingId=${bookingId}&draft=${encodeURIComponent(draftText)}`);
                            } else {
                              navigate(`/owner/messages?bookingId=${bookingId}&draft=${encodeURIComponent(draftText)}`);
                            }
                          }}
                          title={`Mở chat hoàn tiền với ${payment.playerName}`}
                          type="button"
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-amber-700" />
                          <span>Nhắn tin</span>
                        </button>
                      )}
                      {refundPayments.length > 0 && (refundSent ? (
                        <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                          Đã báo hoàn tiền
                        </span>
                      ) : (
                        <button
                          className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-[11px] font-bold text-white disabled:opacity-50"
                          disabled={refundBusy}
                          onClick={() => void markRefundSent(group.payments)}
                          type="button"
                        >
                          {refundBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ReceiptText className="h-3.5 w-3.5" />}
                          Hoàn tiền
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4">
                    {payment.paymentStatus === 'RefundPending' && (
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/80 p-3.5">
                        <div className="flex items-center gap-2.5">
                          <MessageCircle className="h-5 w-5 shrink-0 text-amber-700" />
                          <div>
                            <p className="text-[13px] font-bold text-amber-950">Khoản tiền đang chờ hoàn trả</p>
                            <p className="text-[12px] text-amber-800">
                              Người chơi đã chuyển <strong>{currency.format(payment.amount)}</strong>. Hãy liên hệ với người chơi để xác nhận thông tin và chuyển lại tiền.
                            </p>
                          </div>
                        </div>
                        <button
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-[12px] font-bold text-white shadow transition hover:bg-amber-700 active:scale-95"
                          onClick={() => {
                            const draftText = `Chat hoàn tiền - Match #${bookingCode} (Khoản #${payment.transferCode || payment.paymentId})`;
                            const targetUserId = payment.payerUserId;
                            if (targetUserId) {
                              navigate(`/owner/messages?chatWithUserId=${targetUserId}&bookingId=${bookingId}&draft=${encodeURIComponent(draftText)}`);
                            } else {
                              navigate(`/owner/messages?bookingId=${bookingId}&draft=${encodeURIComponent(draftText)}`);
                            }
                          }}
                          type="button"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span>Chat với {payment.playerName}</span>
                        </button>
                      </div>
                    )}

                    {payment.receiptImageUrl ? (
                      <a href={payment.receiptImageUrl} rel="noreferrer" target="_blank">
                        <img
                          alt={isBatch ? `Biên lai thanh toán cho ${playerNames}` : `Biên lai của ${payment.playerName}`}
                          className="h-64 w-full rounded-lg border object-contain"
                          src={payment.receiptImageUrl}
                        />
                      </a>
                    ) : (
                      <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-surface-container-low text-on-surface-variant">
                        <ReceiptText className="h-8 w-8" />
                        <p className="mt-2 text-[13px] font-bold">Người chơi chưa gửi biên lai</p>
                      </div>
                    )}

                    {payment.paymentStatus === 'WaitingForConfirmation' && (
                      <>
                        <textarea
                          className="mt-4 min-h-20 w-full rounded-lg border border-outline-variant p-3 text-[13px] outline-none focus:border-primary"
                          disabled={isBusy}
                          onChange={(event) => setRejectReasons((current) => ({
                            ...current,
                            [payment.paymentId]: event.target.value,
                          }))}
                          placeholder="Lý do từ chối biên lai..."
                          value={rejectReason}
                        />
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-3 py-2.5 text-[13px] font-bold text-red-700 disabled:opacity-50"
                            disabled={isBusy || rejectReason.trim().length < 3}
                            onClick={() => void reject(payment)}
                            type="button"
                          >
                            <XCircle className="h-4 w-4" />
                            {isBatch ? 'Từ chối toàn bộ' : 'Từ chối'}
                          </button>
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                            disabled={isBusy}
                            onClick={() => void approve(payment)}
                            type="button"
                          >
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            {isBatch ? 'Duyệt toàn bộ' : 'Chấp nhận'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
            </div>
            <aside className="h-fit rounded-2xl border border-outline-variant bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] lg:sticky lg:top-4">
              <h3 className="flex items-center gap-2 text-lg font-extrabold"><ReceiptText className="h-5 w-5 text-primary" /> Thông tin booking</h3>
              <div className="mt-4 space-y-4 text-[13px]">
                <div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /><div><strong>{booking.courtName}</strong><p className="mt-1 text-on-surface-variant">{booking.address}</p></div></div>
                <div className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-primary" /><div className="min-w-0 flex-1"><OwnerBookingSlotSummary slots={bookingTimeGroups} /></div></div>
              </div>
              <div className="my-4 border-t border-dashed border-outline-variant" />
              <div className="space-y-2 text-[14px]"><div className="flex justify-between gap-3"><span>Phần mỗi người</span><strong>{currency.format(amountPerPlayer)}</strong></div><div className="flex justify-between gap-3"><span>Tổng booking</span><strong>{currency.format(booking.totalAmount)}</strong></div></div>
            </aside>
          </div>
          </>
        )}
    </ModalDialog>
  );
};
