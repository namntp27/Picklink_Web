import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, ReceiptText, XCircle } from 'lucide-react';
import type { BankTransfer } from '../../../api/booking';
import { ApiError } from '../../../api/client';
import {
  approveOperatorPayment,
  getOperatorBookingPayments,
  rejectOperatorPayment,
} from '../../../api/payment';
import { useAuth } from '../../../auth/AuthContext';
import { usePaymentRealtime } from '../../../hooks/usePaymentRealtime';

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

type OwnerMatchTransactionReviewModalProps = {
  bookingId: number;
  bookingCode: string;
  onClose: () => void;
  onUpdated: () => void | Promise<void>;
};

export const OwnerMatchTransactionReviewModal = ({
  bookingId,
  bookingCode,
  onClose,
  onUpdated,
}: OwnerMatchTransactionReviewModalProps) => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<BankTransfer[]>([]);
  const [rejectReasons, setRejectReasons] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setPayments(await getOperatorBookingPayments(token, bookingId));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải biên lai của nhóm.');
    } finally {
      setLoading(false);
    }
  }, [bookingId, token]);

  useEffect(() => {
    void load();
  }, [load]);

  usePaymentRealtime((event) => {
    if (event.bookingId === bookingId) void load();
  });

  const approve = async (payment: BankTransfer) => {
    if (!token) return;
    setBusyId(payment.paymentId);
    setError('');
    try {
      await approveOperatorPayment(token, payment.paymentId);
      await onUpdated();
      await load();
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
      await rejectOperatorPayment(token, payment.paymentId, reason);
      setRejectReasons((current) => ({ ...current, [payment.paymentId]: '' }));
      await onUpdated();
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể từ chối thanh toán.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && busyId === null) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="match-payment-title"
        aria-modal="true"
        className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold text-primary">{bookingCode}</p>
            <h2 className="mt-1 text-[25px] font-bold" id="match-payment-title">
              Biên lai của nhóm chơi
            </h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">
              Xác nhận hoặc từ chối riêng từng người chơi.
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
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {payments.map((payment) => {
              const isBusy = busyId === payment.paymentId;
              const rejectReason = rejectReasons[payment.paymentId] ?? '';
              return (
                <article className="overflow-hidden rounded-xl border border-outline-variant" key={payment.paymentId}>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
                    <div>
                      <p className="text-[16px] font-bold">{payment.playerName}</p>
                      <p className="mt-1 text-[12px] text-on-surface-variant">
                        Phần thanh toán: {currency.format(payment.amount)}
                      </p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClasses[payment.paymentStatus] ?? 'bg-slate-100 text-slate-700'}`}>
                      {statusLabels[payment.paymentStatus] ?? payment.paymentStatus}
                    </span>
                  </div>

                  <div className="p-4">
                    {payment.receiptImageUrl ? (
                      <a href={payment.receiptImageUrl} rel="noreferrer" target="_blank">
                        <img
                          alt={`Biên lai của ${payment.playerName}`}
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
                            Từ chối
                          </button>
                          <button
                            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-[13px] font-bold text-white disabled:opacity-50"
                            disabled={isBusy}
                            onClick={() => void approve(payment)}
                            type="button"
                          >
                            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Chấp nhận
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
