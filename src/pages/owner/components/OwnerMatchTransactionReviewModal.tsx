import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, MapPin, ReceiptText, XCircle } from 'lucide-react';
import type { BankTransfer } from '../../../api/booking';
import { ApiError } from '../../../api/client';
import type { BookingDetail } from '../../../data/bookings';
import {
  approveOperatorPayment,
  getOperatorBookingPayments,
  rejectOperatorPayment,
} from '../../../api/payment';
import { useAuth } from '../../../auth/AuthContext';
import { ModalDialog } from '../../../components/ui/ModalDialog';
import { usePaymentRealtime } from '../../../hooks/usePaymentRealtime';
import { preloadReceiptImage } from '../../../utils/receiptImage';

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
};

const statusClasses: Record<string, string> = {
  Pending: 'bg-amber-100 text-amber-800',
  WaitingForConfirmation: 'bg-blue-100 text-blue-700',
  Paid: 'bg-emerald-100 text-emerald-700',
  Expired: 'bg-red-100 text-red-700',
  Cancelled: 'bg-red-100 text-red-700',
};

type BookingSlot = NonNullable<BankTransfer['slots']>[number];

export const mergeAdjacentBookingSlots = (slots: BookingSlot[]) => {
  const merged: BookingSlot[] = [];
  [...slots]
    .sort((left, right) => left.startTime.slice(0, 10).localeCompare(right.startTime.slice(0, 10)) || left.courtNumber - right.courtNumber || left.startTime.localeCompare(right.startTime))
    .forEach((slot) => {
      const previous = merged.at(-1);
      if (previous && previous.courtId === slot.courtId && previous.startTime.slice(0, 10) === slot.startTime.slice(0, 10) && previous.endTime === slot.startTime) previous.endTime = slot.endTime;
      else merged.push({ ...slot });
    });
  return merged;
};
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
              return (
                <article className="overflow-hidden rounded-xl border border-outline-variant" key={payment.paymentGroupId ?? payment.paymentId}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
                    <div>
                      <p className="text-[16px] font-bold">{isBatch ? `Giao dịch gộp ${group.payments.length} người` : payment.playerName}</p>
                      <p className="mt-1 text-[12px] text-on-surface-variant">
                        Tổng thanh toán: {currency.format(group.groupTotalAmount)}
                      </p>
                      {isBatch && (
                        <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">
                          <strong>Các phần được thanh toán:</strong> {playerNames}
                        </p>
                      )}
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClasses[payment.paymentStatus] ?? 'bg-slate-100 text-slate-700'}`}>
                      {statusLabels[payment.paymentStatus] ?? payment.paymentStatus}
                    </span>
                  </div>

                  <div className="p-4">
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
                <div className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-primary" /><div>{bookingTimeGroups.map((slot) => <p className="mt-1 text-on-surface-variant" key={`${slot.courtId}-${slot.startTime}`}>Sân {slot.courtNumber}: {slot.startTime.slice(0, 10).split('-').reverse().join('/')} · {slot.startTime.slice(11, 16)} - {slot.endTime.slice(11, 16)}</p>)}</div></div>
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
