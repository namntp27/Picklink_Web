import { useId, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight, X } from 'lucide-react';
import { ModalDialog } from '../../../components/ui/ModalDialog';

export type OwnerBookingSlot = {
  courtId: number | string;
  courtNumber: number;
  startTime: string;
  endTime: string;
};

const OWNER_SLOT_DETAIL_THRESHOLD = 3;

export const mergeAdjacentBookingSlots = <Slot extends OwnerBookingSlot>(slots: Slot[]) => {
  const merged: Slot[] = [];

  [...slots]
    .sort((left, right) => left.startTime.slice(0, 10).localeCompare(right.startTime.slice(0, 10))
      || left.courtNumber - right.courtNumber
      || String(left.courtId).localeCompare(String(right.courtId))
      || left.startTime.localeCompare(right.startTime))
    .forEach((slot) => {
      const previous = merged.at(-1);
      const isAdjacent = previous
        && String(previous.courtId) === String(slot.courtId)
        && previous.startTime.slice(0, 10) === slot.startTime.slice(0, 10)
        && previous.endTime === slot.startTime;

      if (isAdjacent) previous.endTime = slot.endTime;
      else merged.push({ ...slot });
    });

  return merged;
};

const playDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(`${value.slice(0, 10)}T00:00:00`));

const playTime = (value: string) => value.includes('T') ? value.slice(11, 16) : value.slice(0, 5);
const hoursText = (hours: number) => Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, '');
const slotDurationHours = (slots: OwnerBookingSlot[]) => slots.reduce((total, slot) => {
  const start = new Date(slot.startTime).getTime();
  const end = new Date(slot.endTime).getTime();
  return total + (Number.isFinite(start) && Number.isFinite(end) ? Math.max(0, end - start) / 3_600_000 : 0);
}, 0);

type OwnerBookingSlotSummaryProps = {
  dense?: boolean;
  durationHours?: number;
  showDuration?: boolean;
  slots: OwnerBookingSlot[];
};

export const OwnerBookingSlotSummary = ({
  dense = false,
  durationHours,
  showDuration = false,
  slots,
}: OwnerBookingSlotSummaryProps) => {
  const titleId = useId();
  const [showDetails, setShowDetails] = useState(false);
  const slotGroups = mergeAdjacentBookingSlots(slots);
  const totalDurationHours = durationHours ?? slotDurationHours(slots);
  const hasManySlots = slotGroups.length > OWNER_SLOT_DETAIL_THRESHOLD;

  return (
    <>
      {hasManySlots ? (
        <div className={dense
          ? 'flex min-w-44 items-center justify-between gap-2'
          : 'min-w-48 rounded-xl border border-outline-variant bg-white p-3 shadow-[0_6px_16px_rgba(8,29,36,0.04)]'}>
          <div className="min-w-0">
            <p className={dense ? 'text-[12px] font-extrabold text-on-surface' : 'text-[13px] font-extrabold text-on-surface'}>{slotGroups.length} slot đã chọn</p>
            <p className={`${dense ? 'mt-0.5 text-[10px]' : 'mt-1 text-[11px]'} font-semibold text-on-surface-variant`}>
              {dense ? `${hoursText(totalDurationHours)} giờ` : `Tổng thời lượng ${hoursText(totalDurationHours)} giờ`}
            </p>
          </div>
          <button
            aria-label="Xem chi tiết slot"
            className={dense
              ? 'flex h-8 shrink-0 items-center gap-1 rounded-lg bg-primary px-2.5 text-[11px] font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
              : 'mt-2 flex min-h-9 w-full items-center justify-between rounded-lg bg-primary px-3 text-[12px] font-bold text-white transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'}
            onClick={() => setShowDetails(true)}
            type="button"
          >
            {dense ? 'Chi tiết' : 'Xem chi tiết slot'}
            <ChevronRight className={dense ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
          </button>
        </div>
      ) : (
        <div className={dense ? 'space-y-1' : 'space-y-2'}>
          {slotGroups.map((slot) => (
            <div key={`${slot.courtId}-${slot.startTime}`}>
              <p className={dense ? 'text-[12px] font-bold text-on-surface' : 'text-[13px] font-bold text-on-surface'}>
                Sân {slot.courtNumber}: {playTime(slot.startTime)} - {playTime(slot.endTime)}
              </p>
              <p className={`${dense ? 'text-[10px]' : 'mt-0.5 text-[11px]'} text-on-surface-variant`}>{playDate(slot.startTime)}</p>
            </div>
          ))}
          {showDuration && (
            <p className={`${dense ? 'text-[10px]' : 'text-[11px]'} text-on-surface-variant`}>{hoursText(totalDurationHours)} giờ</p>
          )}
        </div>
      )}

      {showDetails && typeof document !== 'undefined' && createPortal(
        <ModalDialog
          aria-labelledby={titleId}
          className="m-auto overflow-hidden rounded-2xl bg-white text-on-surface shadow-2xl"
          onRequestClose={() => setShowDetails(false)}
          style={{ width: 'min(640px, calc(100vw - 2rem))', maxWidth: '640px' }}
        >
          <div className="flex items-start justify-between gap-4 border-b border-outline-variant bg-surface-container-low px-5 py-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-primary">Lịch đặt sân</p>
              <h2 className="mt-1 text-xl font-black" id={titleId}>Chi tiết sân và giờ chơi</h2>
              <p className="mt-1 text-[12px] font-semibold text-on-surface-variant">
                {slotGroups.length} slot · {hoursText(totalDurationHours)} giờ
              </p>
            </div>
            <button
              aria-label="Đóng chi tiết sân và giờ chơi"
              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-outline-variant bg-white hover:bg-surface-container-low"
              onClick={() => setShowDetails(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="max-h-[min(65dvh,560px)] space-y-2 overflow-y-auto p-4">
            {slotGroups.map((slot) => (
              <article className="rounded-xl border border-outline-variant bg-white px-4 py-3" key={`${slot.courtId}-${slot.startTime}`}>
                <strong className="block text-[13px] text-on-surface">{playDate(slot.startTime)}</strong>
                <span className="mt-1 block text-[12px] font-semibold text-on-surface-variant">
                  Sân {slot.courtNumber} · {playTime(slot.startTime)} - {playTime(slot.endTime)}
                </span>
              </article>
            ))}
          </div>
        </ModalDialog>,
        document.body,
      )}
    </>
  );
};
