import { motion, useReducedMotion } from 'motion/react';
import { AlertTriangle, ArrowRight, CalendarClock, Loader2, MapPin, X } from 'lucide-react';
import { Button } from './ui/Button';
import { ModalDialog } from './ui/ModalDialog';

type ConflictSlot = {
  venueName: string;
  courtNumber: number;
  startTime: string;
  endTime: string;
};

/** Structural on purpose: the booking and match flows each declare their own conflict type. */
export type ScheduleConflictItem = {
  playerName: string;
  selectedSlot: ConflictSlot;
  conflictingSlot: ConflictSlot;
};

type ScheduleConflictDialogProps = {
  conflicts: ScheduleConflictItem[];
  isBusy: boolean;
  /** Booking flows say "bạn", the match flow may be reporting a team-mate's clash. */
  subject?: 'self' | 'participants';
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
};

const date = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value));
const time = (value: string) => value.slice(11, 16);

const SlotCard = ({ label, slot, tone }: { label: string; slot: ConflictSlot; tone: 'existing' | 'selected' }) => (
  <div className={`min-w-0 rounded-lg border p-3 ${
    tone === 'existing'
      ? 'border-error/25 bg-error-container/45'
      : 'border-outline-variant bg-surface-container-low'
  }`}
  >
    <p className={`text-[10px] font-bold uppercase tracking-[0.08em] ${tone === 'existing' ? 'text-error' : 'text-on-surface-variant'}`}>
      {label}
    </p>
    <p className="mt-1.5 flex items-start gap-1.5 break-words text-[13px] font-bold leading-5">
      <MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-[#081d24]" />
      {slot.venueName} · Sân {slot.courtNumber}
    </p>
    <p className="mt-1 flex items-start gap-1.5 text-[12px] font-bold leading-5 text-on-surface-variant">
      <CalendarClock aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      {date(slot.startTime)} · {time(slot.startTime)}–{time(slot.endTime)}
    </p>
  </div>
);

export const ScheduleConflictDialog = ({
  conflicts,
  isBusy,
  subject = 'self',
  onCancel,
  onConfirm,
}: ScheduleConflictDialogProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <ModalDialog
      aria-labelledby="schedule-conflict-title"
      canClose={!isBusy}
      className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-xl overflow-y-auto bg-transparent shadow-none backdrop:bg-inverse-surface/65"
      onRequestClose={onCancel}
    >
      <motion.section
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-[0_24px_70px_rgba(25,29,20,0.22)]"
        data-motion-managed
        initial={shouldReduceMotion ? false : { opacity: 0, y: 14, scale: 0.98 }}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <div className="border-b border-outline-variant bg-error-container px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-error">Trùng lịch</p>
              <h2 className="mt-1 text-[20px] font-extrabold tracking-[-0.02em] text-on-surface" id="schedule-conflict-title">
                {subject === 'participants'
                  ? 'Có thành viên đã bận khung giờ này'
                  : 'Bạn đã có lịch vào khung giờ này'}
              </h2>
            </div>
            <button
              aria-label="Đóng"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-error transition-[background-color,transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-on-error/45 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isBusy}
              onClick={onCancel}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex gap-3 rounded-xl border border-error/25 bg-error-container/55 p-4">
            <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            <p className="text-[13px] leading-5 text-on-surface-variant">
              Đặt chồng lịch nghĩa là cùng lúc phải có mặt ở hai nơi. Bạn vẫn có thể tiếp tục nếu
              đây là chủ ý — ví dụ định hủy lịch cũ sau.
            </p>
          </div>

          <ul className="mt-5 grid gap-3">
            {conflicts.map((conflict, index) => (
              <li
                className="rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
                key={`${conflict.playerName}-${conflict.selectedSlot.startTime}-${conflict.conflictingSlot.startTime}-${index}`}
              >
                {subject === 'participants' && (
                  <p className="mb-2 break-words text-[13px] font-extrabold">{conflict.playerName}</p>
                )}
                <div className="grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                  <SlotCard label="Lịch đã có" slot={conflict.conflictingSlot} tone="existing" />
                  <ArrowRight aria-hidden="true" className="mx-auto hidden h-5 w-5 shrink-0 text-on-surface-variant sm:block" />
                  <SlotCard label="Slot đang chọn" slot={conflict.selectedSlot} tone="selected" />
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Button disabled={isBusy} onClick={onCancel} type="button" variant="outline">
              Không đặt nữa
            </Button>
            <Button
              aria-busy={isBusy}
              disabled={isBusy}
              onClick={() => void onConfirm()}
              type="button"
              variant="danger"
            >
              {isBusy && <Loader2 className="h-4 w-4" />}
              Vẫn đặt trùng lịch
            </Button>
          </div>
        </div>
      </motion.section>
    </ModalDialog>
  );
};
