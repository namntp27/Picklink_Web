import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, Loader2, XCircle } from 'lucide-react';
import type { BankTransfer } from '../../../api/booking';
import { ApiError } from '../../../api/client';
import {
  approveOperatorPayment,
  getOperatorPayment,
  rejectOperatorPayment,
} from '../../../api/payment';
import { useAuth } from '../../../auth/AuthContext';
import { ModalDialog } from '../../../components/ui/ModalDialog';
import { usePaymentRealtime } from '../../../hooks/usePaymentRealtime';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const dateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const playDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(value));
const playTime = (value: string) => value.slice(11, 16);

const paymentStatusLabels: Record<string, string> = {
  Pending: 'Chờ chuyển khoản',
  WaitingForConfirmation: 'Chờ xác nhận',
  Paid: 'Đã thanh toán',
  Expired: 'Đã hết hạn',
  Cancelled: 'Đã hủy',
};

const paymentActionLabels: Record<string, string> = {
  Created: 'Tạo yêu cầu thanh toán',
  Submitted: 'Player gửi biên lai',
  Approved: 'Đã xác nhận thanh toán',
  Rejected: 'Đã từ chối biên lai',
  BookingExpired: 'Booking hết hạn',
  BookingCancelled: 'Booking đã hủy',
};

const paymentHistoryReasons: Record<string, string> = {
  'Tao yeu cau chuyen khoan': 'T\u1ea1o y\u00eau c\u1ea7u chuy\u1ec3n kho\u1ea3n',
};

type OwnerTransactionReviewModalProps = {
  paymentId: number;
  bookingCode: string;
  initialPayment?: BankTransfer;
  initialPaymentRequest?: Promise<BankTransfer>;
  onClose: () => void;
  onUpdated: (payment: BankTransfer) => void | Promise<void>;
};

export const OwnerTransactionReviewModal = ({
  paymentId,
  bookingCode,
  initialPayment,
  initialPaymentRequest,
  onClose,
  onUpdated,
}: OwnerTransactionReviewModalProps) => {
  const { token } = useAuth();
  const [payment, setPayment] = useState<BankTransfer | null>(initialPayment ?? null);
  const [rejectReason, setRejectReason] = useState('');
  const [isLoading, setIsLoading] = useState(!initialPayment);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (forceRefresh = false) => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      setPayment(await (!forceRefresh && initialPaymentRequest
        ? initialPaymentRequest
        : getOperatorPayment(token, paymentId)));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải giao dịch.');
    } finally {
      setIsLoading(false);
    }
  }, [initialPaymentRequest, paymentId, token]);

  useEffect(() => {
    if (!initialPayment) void load();
  }, [initialPayment, load]);

  usePaymentRealtime((event) => {
    if (event.paymentId === paymentId && !isBusy) void load(true);
  });

  const approve = async () => {
    if (!token || !payment) return;
    setIsBusy(true);
    setError('');
    try {
      const updatedPayment = await approveOperatorPayment(token, payment.paymentId);
      onClose();
      void onUpdated(updatedPayment);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể xác nhận thanh toán.');
    } finally {
      setIsBusy(false);
    }
  };

  const reject = async () => {
    if (!token || !payment || rejectReason.trim().length < 3) return;
    setIsBusy(true);
    setError('');
    try {
      const updatedPayment = await rejectOperatorPayment(token, payment.paymentId, rejectReason.trim());
      onClose();
      void onUpdated(updatedPayment);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể từ chối thanh toán.');

    } finally {
      setIsBusy(false);

    }
  };

  const paymentSlots = payment?.slots?.length
    ? payment.slots
    : payment ? [{ courtId: 0, courtNumber: payment.courtNumber, startTime: payment.startTime, endTime: payment.endTime }] : [];
  const paymentHistory = (payment?.history ?? []).map((entry) => ({
    ...entry,
    reason: paymentHistoryReasons[entry.reason ?? ''] ?? entry.reason,
  }));

  return (
    <ModalDialog
      aria-labelledby="transaction-review-title"
      canClose={!isBusy}
      className="owner-modal max-w-3xl"
      onRequestClose={onClose}
      style={{ width: 'calc(100% - 1.75rem)' }}
    >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold text-primary">{payment?.bookingCode ?? bookingCode}</p>
            <h2 className="mt-1 text-[25px] font-bold" id="transaction-review-title">
              Kiểm tra giao dịch
            </h2>
          </div>
          <button
            aria-label="Đóng kiểm tra giao dịch"
            className="rounded-lg p-2 hover:bg-surface-container-low disabled:opacity-50"
            disabled={isBusy}
            onClick={onClose}
            type="button"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {isLoading && (
          <div aria-label="Đang tải giao dịch" className="flex min-h-72 items-center justify-center" role="status">
            <Loader2 className="h-9 w-9 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="mt-5 flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700" role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-[13px] font-bold">{error}</span>
          </div>
        )}

        {!isLoading && payment && (
          <>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <div>
                {payment.receiptImageUrl ? (
                  <img
                    alt="Biên lai chuyển khoản"
                    className="max-h-[460px] w-full rounded-xl border object-contain"
                    src={payment.receiptImageUrl}
                  />
                ) : (
                  <div className="flex h-72 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant">
                    Không có ảnh biên lai
                  </div>
                )}
              </div>
              <div className="space-y-3">
                {[
                  ['Người chơi', payment.playerName],
                  ['Sân', `${payment.venueName} · Sân ${payment.courtNumber}`],
                  ['Giờ chơi', `${playTime(payment.startTime)} - ${playTime(payment.endTime)} · ${playDate(payment.startTime)}`],
                  ['Trạng thái', paymentStatusLabels[payment.paymentStatus] ?? payment.paymentStatus],
                  ['Số tiền cần trả', currency.format(payment.amount)],
                  ['Nội dung CK', payment.transferContent ?? '-'],
                  ['Tài khoản nhận', `${payment.bankName ?? '-'} · ${payment.bankAccountNumber ?? '-'}`],
                  ['Hạn giữ chỗ', payment.holdExpiresAt ? dateTime(payment.holdExpiresAt) : '-'],
                ].filter((_, index) => index !== 1 && index !== 2).map(([label, value]) => (
                  <div className="rounded-lg bg-surface-container-low p-3" key={label}>
                    <p className="text-[11px] font-bold uppercase text-on-surface-variant">{label}</p>
                    <p className="mt-1 text-[14px] font-bold">{value}</p>
                  </div>
                ))}
                <div className="rounded-lg bg-surface-container-low p-3">
                  <p className="text-[11px] font-bold uppercase text-on-surface-variant">{'S\u00e2n v\u00e0 gi\u1edd ch\u01a1i'}</p>
                  <div className="mt-1 space-y-1 text-[14px] font-bold">
                    {paymentSlots.map((slot) => <p key={`${slot.courtId}-${slot.startTime}`}>{`S\u00e2n ${slot.courtNumber}: ${playTime(slot.startTime)} - ${playTime(slot.endTime)} \u00b7 ${playDate(slot.startTime)}`}</p>)}
                  </div>
                </div>
              </div>
            </div>

            {payment.paymentStatus === 'WaitingForConfirmation' && (
              <>
                <label className="mt-5 block">
                  <span className="text-[13px] font-bold">Lý do từ chối (bắt buộc khi từ chối)</span>
                  <textarea
                    className="mt-2 min-h-20 w-full rounded-lg border border-outline-variant p-3 text-[14px] outline-none focus:border-primary"
                    disabled={isBusy}
                    onChange={(event) => setRejectReason(event.target.value)}
                    placeholder="Ví dụ: Không tìm thấy giao dịch, sai số tiền..."
                    value={rejectReason}
                  />
                </label>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-3 font-bold text-red-700 disabled:opacity-50"
                    disabled={rejectReason.trim().length < 3 || isBusy}
                    onClick={() => void reject()}
                    type="button"
                  >
                    <XCircle className="h-5 w-5" />
                    Từ chối
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-white disabled:opacity-50"
                    disabled={isBusy}
                    onClick={() => void approve()}
                    type="button"
                  >
                    {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                    Xác nhận đã nhận tiền
                  </button>
                </div>
              </>
            )}

            <div className="mt-5 border-t pt-4">
              <h3 className="flex items-center gap-2 font-bold">
                <Clock className="h-4 w-4 text-primary" />
                Lịch sử
              </h3>
              <div className="mt-3 space-y-2">
                {paymentHistory.map((entry, index) => (
                  <div className="text-[13px]" key={`${entry.createdAt}-${index}`}>
                    <strong>{paymentActionLabels[entry.action] ?? entry.action}</strong> ·{' '}
                    {paymentStatusLabels[entry.toStatus] ?? entry.toStatus}
                    <span className="text-on-surface-variant">
                      {' '}· {dateTime(entry.createdAt)}
                      {entry.reason ? ` · ${entry.reason}` : ''}
                    </span>
                  </div>
                ))}
                {paymentHistory.length === 0 && (
                  <p className="text-[13px] text-on-surface-variant">Chưa có lịch sử giao dịch.</p>
                )}
              </div>
            </div>
          </>
        )}
    </ModalDialog>
  );
};
