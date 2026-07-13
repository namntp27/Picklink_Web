import type { AvailabilitySlot, CourtAvailability } from '../../../api/booking';

type CourtTimelineGridProps = {
  availability: CourtAvailability;
  selectedSlotKeys: string[];
  onSelectSlot: (slot: AvailabilitySlot) => void;
};

const timelineHelpPhone = '0822 046 686';
const timelineBackupPhone = '0981 181 551';

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
  owned: 'bg-[#e2ff57] hover:bg-[#d6f64d]',
  booked: 'cursor-not-allowed bg-[#f26767]',
  locked: 'cursor-not-allowed bg-[#aeb8b0]',
  event: 'cursor-not-allowed bg-[#c86fd5] text-white',
};

const legendItems = [
  { label: 'Trống', className: 'bg-white' },
  { label: 'Đã đặt', className: 'bg-[#f26767]' },
  { label: 'Khoá', className: 'bg-[#aeb8b0]' },
  { label: 'Sự kiện', className: 'bg-[#c86fd5]', marker: '!' },
];

export const CourtTimelineGrid = ({
  availability,
  selectedSlotKeys,
  onSelectSlot,
}: CourtTimelineGridProps) => {
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
        <a className="text-[#e2ff57] underline decoration-2 underline-offset-4" href="#court-pricing">
          Xem sân & bảng giá
        </a>
      </div>

      <p className="border-b border-[#dbe8d3] bg-[#eef8e6] px-4 py-2 text-center text-[13px] font-semibold text-[#53645a]">
        <span className="font-black text-[#f97316]">Lưu ý:</span> Nếu bạn cần đặt lịch tháng vui lòng liên hệ {timelineHelpPhone} hoặc {timelineBackupPhone} để được hỗ trợ
      </p>

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
                const selected = selectedSlotKeys.includes(slotKey(court.courtId, tick));
                const past = slot ? new Date(slot.startTime).getTime() <= Date.now() : false;
                const resumableHolding = Boolean(slot?.status === 'Holding' && slot.isOwnedByCurrentUser && slot.bookingId);
                const disabled = !slot || (!resumableHolding && (slot.status !== 'Available' || past));
                const statusClass = selected
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
                    aria-label={`Sân ${court.courtNumber} ${tick} ${slot ? statusLabel[slot.status] : 'Khoá'}`}
                    className={`h-10 border-b border-l border-[#dbe8d3] text-[0px] transition-colors ${statusClass}`}
                    disabled={disabled}
                    key={`${court.courtId}-${tick}`}
                    onClick={() => slot && onSelectSlot(slot)}
                    title={slot ? `${tick} - ${slotTime(slot.endTime)} · ${statusLabel[slot.status]}` : `${tick} · Khoá`}
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
