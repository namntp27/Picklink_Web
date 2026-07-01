import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

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
  const shouldReduceMotion = useReducedMotion();
  const normalizedReason = reason.trim();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-inverse-surface/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) onClose();
      }}
      role="presentation"
    >
      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        aria-labelledby="cancel-booking-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[0_24px_70px_rgba(25,29,20,0.22)]"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
        role="dialog"
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="border-b border-outline-variant bg-error-container px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="break-all text-[13px] font-bold text-error">{bookingCode}</p>
              <h2 className="mt-1 text-[24px] font-extrabold tracking-[-0.02em] text-on-surface" id="cancel-booking-title">
                Hủy booking
              </h2>
            </div>
            <button
              aria-label="Đóng"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-error transition-[background-color,transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-on-error/45 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isBusy}
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-3 rounded-xl border border-error/25 bg-error-container/55 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            <p className="text-[13px] leading-5 text-on-surface-variant">
              Vui lòng cho biết lý do hủy. Nội dung này sẽ được lưu trong lịch sử booking.
            </p>
          </div>

          <label className="mt-5 block">
            <span className="text-[14px] font-bold text-on-surface">Lý do hủy</span>
            <textarea
              autoFocus
              className="mt-2 min-h-32 w-full resize-y rounded-lg border border-outline-variant bg-surface-container p-3 text-[14px] leading-6 text-on-surface outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] placeholder:text-outline hover:border-outline focus:border-primary-container focus:ring-1 focus:ring-primary-container/30 disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-55"
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
            <Button disabled={isBusy} onClick={onClose} type="button" variant="outline">
              Quay lại
            </Button>
            <Button
              aria-busy={isBusy}
              disabled={isBusy || normalizedReason.length < 3}
              onClick={() => void onConfirm(normalizedReason)}
              type="button"
              variant="danger"
            >
              {isBusy && <Loader2 className="h-4 w-4" />}
              Xác nhận hủy
            </Button>
          </div>
        </div>
      </motion.section>
    </div>
  );
};
