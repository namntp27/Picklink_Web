import { useState } from 'react';
import type { AvailabilitySlot, CourtAvailability } from '../../../api/booking';

type CourtTimelineGridProps = {
  availability: CourtAvailability;
  selectedSlotKeys: string[];
  onSelectSlot: (slot: AvailabilitySlot) => void;
  disabledSlotKeys?: string[];
};

export const timeToMinutes = (value: string) => {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return hour * 60 + minute;
};

const minutesToTime = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

export const buildTimelineTicks = (openTime: string, closeTime: string, slotMinutes: number) => {
  const step = slotMinutes > 0 ? slotMinutes : 30;
  const start = timeToMinutes(openTime);
  const end = Math.max(start + step, timeToMinutes(closeTime));
  const ticks: string[] = [];
  for (let cursor = start; cursor <= end; cursor += step) ticks.push(minutesToTime(cursor));
  if (ticks.at(-1) !== minutesToTime(end)) ticks.push(minutesToTime(end));
  return ticks;
};

const slotTime = (value: string) => value.slice(11, 16);
const slotKey = (courtId: number, startTime: string) => `${courtId}:${startTime}`;
const parseSlotDate = (str: string) => {
  if (!str) return 0;
  return new Date(str.includes('Z') || str.includes('+') ? str : str + '+07:00').getTime();
};

const statusLabel: Record<AvailabilitySlot['status'], string> = {
  Available: 'Trống',
  Holding: 'Đang giữ',
  Booked: 'Đã đặt',
  Blocked: 'Khoá',
  Maintenance: 'Khoá',
  Event: 'Sự kiện',
  Closed: 'Khoá',
};

const stateClasses = {
  empty: 'bg-white hover:bg-[#eef8e6] focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#276b3f]',
  selected: 'z-10 border-[#081d24] bg-[#e2ff57] shadow-[inset_0_0_0_1px_#081d24]',
  owned: 'bg-[#fbbf24] hover:bg-[#f59e0b] focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#92400e]',
  booked: 'cursor-not-allowed bg-[#f26767]',
  locked: 'cursor-not-allowed bg-[#aeb8b0]',
  event: 'cursor-not-allowed bg-[#c86fd5] text-white',
};

const legendItems = [
  { label: 'Trống', className: 'bg-white' },
  { label: 'Bạn đang giữ', className: 'bg-[#fbbf24]' },
  { label: 'Đã đặt', className: 'bg-[#f26767]' },
  { label: 'Khoá', className: 'bg-[#aeb8b0]' },
  { label: 'Sự kiện', className: 'bg-[#c86fd5]', marker: '!' },
];

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export const CourtTimelineGrid = ({
  availability,
  selectedSlotKeys,
  onSelectSlot,
  disabledSlotKeys = [],
}: CourtTimelineGridProps) => {
  const [showPrices, setShowPrices] = useState(false);
  const ticks = buildTimelineTicks(availability.openTime, availability.closeTime, availability.slotMinutes);
  const slotStarts = ticks.slice(0, -1);
  const gridTemplateColumns = `72px repeat(${slotStarts.length}, minmax(38px, 1fr))`;
  const slotsByCourtAndStart = new Map(
    availability.slots.map((slot) => [`${slot.courtId}-${slotTime(slot.startTime)}`, slot]),
  );

  return (
    <div className="overflow-hidden border-b border-[#dbe8d3] bg-[#f8fbf4]">
      <div className="flex min-h-10 flex-wrap items-center gap-x-7 gap-y-2 bg-[linear-gradient(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%)] px-4 py-2 text-[13px] font-black text-white">
        {legendItems.map((item) => (
          <span className="inline-flex items-center gap-2" key={item.label}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-md border border-white/35 text-[15px] font-black text-[#081d24] ${item.className}`}>
              {item.marker}
            </span>
            {item.label}
          </span>
        ))}
      </div>

      <div className="border-b border-[#dbe8d3] bg-[#eef8e6] px-4 py-2 text-center text-[13px] font-semibold text-[#53645a]">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <p>
            Hỗ trợ từ chủ sân:{' '}
            {availability.phoneNumber
              ? <a className="font-black text-[#276b3f] underline" href={`tel:${availability.phoneNumber}`}>{availability.phoneNumber}</a>
              : <span className="font-bold">Chưa cập nhật số điện thoại</span>}
          </p>
          <button
            aria-expanded={showPrices}
            className="rounded-lg border border-[#b9dca8] bg-white px-3 py-1 text-[12px] font-black text-[#276b3f] transition hover:bg-[#e2ff57]"
            onClick={() => setShowPrices((current) => !current)}
            type="button"
          >
            Bảng giá
          </button>
        </div>
        {showPrices && (
          <div className="mx-auto mt-2 max-h-56 max-w-3xl overflow-y-auto rounded-xl border border-[#cfe0c8] bg-white p-3 text-left shadow-sm">
            <p className="mb-2 text-[12px] font-black text-[#0b2228]">Giá thuê các sân con</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {availability.courts.map((court) => (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-[#f7faf5] px-3 py-2" key={court.courtId}>
                  <div className="min-w-0">
                    <p className="font-black text-[#0b2228]">Sân {court.courtNumber}</p>
                    <p className="truncate text-[11px] text-[#718077]">{court.courtType}{court.surfaceType ? ` · ${court.surfaceType}` : ''} · {court.isIndoor ? 'Trong nhà' : 'Ngoài trời'}</p>
                  </div>
                  <p className="shrink-0 font-black text-[#276b3f]">{currency.format(court.hourlyPrice)}<span className="text-[10px] font-bold text-[#718077]">/giờ</span></p>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="mt-1"><span className="font-black text-[#f97316]">Lưu ý:</span> Bạn có thể chọn các slot rời nhau; dùng mục số tháng áp dụng để sao chép lịch đang chọn.</p>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[1080px]">
          <div
            className="grid border-b border-[#dbe8d3] bg-[#eef8e6] text-[12px] font-semibold text-[#276b3f]"
            style={{ gridTemplateColumns }}
          >
            <div className="h-8" />
            {slotStarts.map((tick) => (
              <div className="relative h-8 border-l border-transparent" key={tick}>
                <span className="timeTickLabel absolute bottom-2 left-0 -translate-x-1/2 whitespace-nowrap text-center text-[9.6px]" aria-hidden="true">
                  {tick}
                </span>
                <span className="timeTickMarker absolute bottom-0 left-0 h-1.5 w-0.5 bg-[#e2ff57]" aria-hidden="true" />
              </div>
            ))}
          </div>

          {availability.courts.map((court) => (
            <div className="grid" key={court.courtId} style={{ gridTemplateColumns }}>
              <div className="flex h-10 items-center border-r border-[#dbe8d3] bg-[#f8fbf4] px-2 text-[13px] font-semibold text-[#276b3f]">
                Sân {court.courtNumber}
              </div>
              {slotStarts.map((tick) => {
                const slot = slotsByCourtAndStart.get(`${court.courtId}-${tick}`);
                const forcedUnavailable = disabledSlotKeys.includes(slotKey(court.courtId, tick));
                const selected = selectedSlotKeys.includes(slotKey(court.courtId, tick));
                const past = slot ? parseSlotDate(slot.startTime) <= Date.now() : false;
                const resumableHolding = Boolean(slot?.status === 'Holding' && slot.isOwnedByCurrentUser && slot.bookingId);
                const displayStatus = resumableHolding ? 'Bạn đang giữ · Nhấn để tiếp tục thanh toán' : statusLabel[slot?.status ?? 'Blocked'];
                const disabled = forcedUnavailable || !slot || (!resumableHolding && (slot.status !== 'Available' || past));
                const statusClass = forcedUnavailable
                  ? stateClasses.locked
                  : selected
                    ? stateClasses.selected
                  : resumableHolding
                    ? stateClasses.owned
                    : !slot || past || slot.status === 'Blocked' || slot.status === 'Maintenance' || slot.status === 'Closed'
                      ? stateClasses.locked
                      : slot.status === 'Booked' || slot.status === 'Holding'
                        ? stateClasses.booked
                        : slot.status === 'Event'
                          ? stateClasses.event
                          : stateClasses.empty;

                return (
                  <button
                    aria-label={`Sân ${court.courtNumber} ${tick} ${slot ? displayStatus : 'Khoá'}`}
                    className={`h-10 border-b border-l border-[#dbe8d3] text-[0px] transition-colors ${statusClass}`}
                    disabled={disabled}
                    key={`${court.courtId}-${tick}`}
                    onClick={() => slot && onSelectSlot(slot)}
                    title={slot ? `${tick} - ${slotTime(slot.endTime)} · ${displayStatus}` : `${tick} · Khoá`}
                    type="button"
                  >
                    {slot?.status === 'Event' ? 'Sự kiện' : statusLabel[slot?.status ?? 'Blocked']}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
