import React, { useState } from 'react';
import { Loader2, XCircle } from 'lucide-react';

type CancelBookingDialogProps = {
  bookingCode: string;
  isBusy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void | Promise<void>;
};

export const CancelBookingDialog = ({
  bookingCode,
  isBusy,
  onClose,
  onConfirm,
}: CancelBookingDialogProps) => {
  const [reason, setReason] = useState('');
  const normalizedReason = reason.trim();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="cancel-booking-title"
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[13px] font-bold text-red-600">{bookingCode}</p>
            <h2 className="mt-1 text-[24px] font-bold" id="cancel-booking-title">
              Hủy booking
            </h2>
          </div>
          <button
            aria-label="Đóng"
            className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low disabled:opacity-50"
            disabled={isBusy}
            onClick={onClose}
            type="button"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        <p className="mt-3 text-[13px] leading-5 text-on-surface-variant">
          Vui lòng cho biết lý do hủy. Nội dung này sẽ được lưu trong lịch sử booking.
        </p>

        <label className="mt-5 block">
          <span className="text-[13px] font-bold">Lý do hủy</span>
          <textarea
            autoFocus
            className="mt-2 min-h-28 w-full rounded-lg border border-outline-variant p-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            disabled={isBusy}
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Ví dụ: Tôi có việc đột xuất và không thể đến sân..."
            value={reason}
          />
          <span className="mt-1 block text-right text-[11px] text-on-surface-variant">
            {reason.length}/500
          </span>
        </label>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            className="rounded-lg border border-outline-variant px-4 py-3 text-[13px] font-bold text-on-surface-variant disabled:opacity-50"
            disabled={isBusy}
            onClick={onClose}
            type="button"
          >
            Quay lại
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-3 text-[13px] font-bold text-white disabled:opacity-50"
            disabled={isBusy || normalizedReason.length < 3}
            onClick={() => void onConfirm(normalizedReason)}
            type="button"
          >
            {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            Xác nhận hủy
          </button>
        </div>
      </section>
    </div>
  );
};
