import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Banknote, ImageUp, Loader2, XCircle } from 'lucide-react';
import type { BankTransfer } from '../../../api/booking';
import { ApiError } from '../../../api/client';
import { getOperatorPayment, submitOperatorRefundProof } from '../../../api/payment';
import { useAuth } from '../../../auth/AuthContext';
import { useConfirm } from '../../../components/ui/ConfirmDialogRegion';
import { ModalDialog } from '../../../components/ui/ModalDialog';
import { usePaymentRealtime } from '../../../hooks/usePaymentRealtime';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });

type OwnerRefundProofModalProps = {
  paymentId: number;
  onClose: () => void;
  onUpdated: (payment: BankTransfer[]) => void | Promise<void>;
};

export const OwnerRefundProofModal = ({ paymentId, onClose, onUpdated }: OwnerRefundProofModalProps) => {
  const { token } = useAuth();
  const confirm = useConfirm();
  const [payment, setPayment] = useState<BankTransfer | null>(null);
  const [reference, setReference] = useState('');
  const [proof, setProof] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      setPayment(await getOperatorPayment(token, paymentId));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải khoản hoàn tiền.');
    } finally {
      setIsLoading(false);
    }
  }, [paymentId, token]);

  useEffect(() => { void load(); }, [load]);

  usePaymentRealtime((event) => {
    if (event.paymentId === paymentId && !isBusy) void load();
  });

  const submit = async () => {
    if (!token || !payment || !proof) {
      setError('Vui lòng chọn ảnh minh chứng chuyển khoản.');
      return;
    }
    if (!(await confirm({
      title: `Gửi minh chứng hoàn tiền cho ${payment.playerName}?`,
      message: 'Player sẽ xem ảnh này để xác nhận đã nhận tiền hoặc gửi khiếu nại.',
      confirmLabel: 'Gửi minh chứng',
      tone: 'success',
    }))) return;
    setIsBusy(true);
    setError('');
    try {
      const updated = await submitOperatorRefundProof(token, paymentId, proof, reference.trim() || undefined);
      void onUpdated(updated);
      setProof(null);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể gửi minh chứng hoàn tiền.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <ModalDialog
      aria-labelledby="refund-proof-title"
      canClose={!isBusy}
      className="owner-modal max-w-2xl"
      onRequestClose={onClose}
      style={{ width: 'calc(100% - 1.75rem)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[13px] font-bold text-primary">{payment?.bookingCode ?? `Vé #${paymentId}`}</p>
          <h2 className="mt-1 text-[23px] font-bold" id="refund-proof-title">Minh chứng hoàn tiền</h2>
        </div>
        <button aria-label="Đóng" className="rounded-lg p-2 hover:bg-surface-container-low disabled:opacity-50" disabled={isBusy} onClick={onClose} type="button">
          <XCircle className="h-6 w-6" />
        </button>
      </div>

      {isLoading && (
        <div aria-label="Đang tải" className="flex min-h-52 items-center justify-center" role="status">
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
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-[11px] font-bold uppercase text-on-surface-variant">Người nhận hoàn tiền</p>
              <p className="mt-1 text-[14px] font-bold">{payment.playerName}</p>
            </div>
            <div className="rounded-lg bg-surface-container-low p-3">
              <p className="text-[11px] font-bold uppercase text-on-surface-variant">Số tiền cần hoàn</p>
              <p className="mt-1 text-[14px] font-bold">{currency.format(payment.amount)}</p>
            </div>
          </div>

          {payment.refundDisputeStatus === 'Open' && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">
              Player khiếu nại: {payment.refundDisputeReason}. Admin đang xem xét.
            </div>
          )}
          {payment.refundDisputeResolution && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-[13px] text-blue-800">
              <strong>Kết luận của Admin:</strong> {payment.refundDisputeResolution}
            </div>
          )}

          {payment.refundProofImageUrl && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase text-on-surface-variant">Minh chứng đã gửi</p>
              <img alt="Minh chứng hoàn tiền" className="mt-2 max-h-72 w-full rounded-xl border object-contain" src={payment.refundProofImageUrl} />
              {payment.refundReference && <p className="mt-2 text-[12px] text-on-surface-variant">Mã tham chiếu: <strong>{payment.refundReference}</strong></p>}
            </div>
          )}

          <div className="mt-5 grid gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-outline-variant bg-white px-3 py-2.5 text-[13px] font-bold text-on-surface-variant">
              <ImageUp className="h-4 w-4 shrink-0 text-primary" />
              <span className="truncate">{proof?.name ?? 'Chọn ảnh biên lai chuyển khoản hoàn tiền'}</span>
              <input accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={isBusy} onChange={(event) => setProof(event.target.files?.[0] ?? null)} type="file" />
            </label>
            <input
              aria-label="Mã tham chiếu chuyển khoản hoàn tiền"
              className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[13px]"
              disabled={isBusy}
              maxLength={200}
              onChange={(event) => setReference(event.target.value)}
              placeholder="Mã giao dịch hoàn tiền (không bắt buộc)"
              value={reference}
            />
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-white disabled:opacity-50"
              disabled={isBusy || !proof}
              onClick={() => void submit()}
              type="button"
            >
              {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <Banknote className="h-5 w-5" />}
              {payment.refundProofSubmittedAt ? 'Cập nhật minh chứng' : 'Gửi minh chứng'}
            </button>
          </div>
        </>
      )}
    </ModalDialog>
  );
};
