import { buildTimelineTicks } from '../../courts/components/CourtTimelineGrid';
import type { OwnerSchedule, OwnerScheduleSlot } from '../../../api/owner';

type OwnerTimelineGridProps = {
  schedule: OwnerSchedule;
  venueFilter: string;
  selectedSlot: OwnerScheduleSlot | null;
  onSelectSlot: (slot: OwnerScheduleSlot) => void;
};

const slotTime = (value: string) => value.slice(11, 16);

const statusLabel: Record<OwnerScheduleSlot['status'], string> = {
  Available: 'Trống',
  Holding: 'Đang giữ',
  Booked: 'Đã đặt',
  Blocked: 'Khoá',
  Maintenance: 'Bảo trì',
  Event: 'Sự kiện',
  TicketSession: 'Xé vé',
  Closed: 'Khoá',
  Inactive: 'Khoá',
};

const stateClasses: Record<OwnerScheduleSlot['status'], string> = {
  Available: 'bg-white hover:bg-[#eef8e6] focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#276b3f]',
  Holding: 'bg-[#ffc95a] hover:bg-[#f4bd4c]',
  Booked: 'bg-[#f26767] hover:bg-[#ee5a5a]',
  Blocked: 'bg-[#aeb8b0] hover:bg-[#a4afa6]',
  Maintenance: 'bg-[#aeb8b0] hover:bg-[#a4afa6]',
  Event: 'bg-[#c86fd5] text-white hover:bg-[#bd62ca]',
  TicketSession: 'bg-[#98d951] text-[#102414] hover:bg-[#8acb45]',
  Closed: 'bg-[#aeb8b0] hover:bg-[#a4afa6]',
  Inactive: 'bg-[#aeb8b0] hover:bg-[#a4afa6]',
};

const legendItems = [
  { label: 'Trống', className: 'bg-white' },
  { label: 'Đã đặt', className: 'bg-[#f26767]' },
  { label: 'Khoá', className: 'bg-[#aeb8b0]' },
  { label: 'Sự kiện', className: 'bg-[#c86fd5]', marker: '!' },
  { label: 'Xé vé', className: 'bg-[#98d951]', marker: 'V' },
];

const minutes = (value: string) => {
  const [hour, minute] = value.slice(0, 5).split(':').map(Number);
  return hour * 60 + minute;
};

const minTime = (values: string[]) => values.reduce((min, value) => (minutes(value) < minutes(min) ? value : min));
const maxTime = (values: string[]) => values.reduce((max, value) => (minutes(value) > minutes(max) ? value : max));

export const OwnerTimelineGrid = ({
  schedule,
  venueFilter,
  selectedSlot,
  onSelectSlot,
}: OwnerTimelineGridProps) => {
  const visibleVenues = venueFilter === 'all'
    ? schedule.venues
    : schedule.venues.filter((venue) => venue.venueId.toString() === venueFilter);

  return (
    <div className="ownerTimelineGrid overflow-hidden border-b border-[#dbe8d3] bg-[#f8fbf4]">
      <div className="flex min-h-10 flex-wrap items-center gap-x-7 gap-y-2 bg-[linear-gradient(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%)] px-4 py-2 text-[13px] font-black text-white">
        {legendItems.map((item) => (
          <span className="inline-flex items-center gap-2" key={item.label}>
            <span className={`flex h-6 w-6 items-center justify-center rounded-md border border-white/35 text-[15px] font-black text-[#081d24] ${item.className}`}>
              {item.marker}
            </span>
            {item.label}
          </span>
        ))}
        <span className="text-[#e2ff57]">Click ô trống để khoá, bảo trì hoặc tạo sự kiện</span>
      </div>

      <p className="border-b border-[#dbe8d3] bg-[#eef8e6] px-4 py-2 text-center text-[13px] font-semibold text-[#53645a]">
        <span className="font-black text-[#f97316]">Lưu ý:</span> Chủ sân có thể thao tác trực tiếp trên từng ô 30 phút để quản lý lịch trong ngày.
      </p>

      <div className="flex flex-col gap-[10px] bg-[#eaf5e4]">
        {visibleVenues.map((venue) => {
          const openTime = minTime([venue.openTime.slice(0, 5)]);
          const closeTime = maxTime([venue.closeTime.slice(0, 5)]);
          const ticks = buildTimelineTicks(openTime, closeTime, schedule.slotMinutes);
          const slotStarts = ticks.slice(0, -1);
          const gridTemplateColumns = `88px repeat(${slotStarts.length}, minmax(38px, 1fr))`;
          const slotsByCourtAndStart = new Map(
            schedule.slots
              .filter((slot) => slot.venueId === venue.venueId)
              .map((slot) => [`${slot.courtId}-${slotTime(slot.startTime)}`, slot]),
          );

          return (
            <section className="ownerVenueTimelineSection overflow-hidden rounded-[14px] border border-[#dbe8d3] bg-[#f8fbf4] shadow-[0_10px_24px_rgba(8,29,36,0.045)]" key={venue.venueId}>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#dbe8d3] bg-white px-4 py-3">
                <div>
                  <h3 className="text-[15px] font-black text-[#0b2228]">{venue.venueName}</h3>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#627168]">
                    {venue.address} · {openTime}-{closeTime} · {venue.courts.length} sân
                  </p>
                </div>
                <span className="rounded-md bg-[#eef8e6] px-2.5 py-1 text-[11px] font-black text-[#276b3f]">
                  Cụm sân riêng
                </span>
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
                        <span className="absolute bottom-2 left-0 -translate-x-1/2 whitespace-nowrap text-center text-[9.6px]" aria-hidden="true">
                          {tick}
                        </span>
                        <span className="absolute bottom-0 left-0 h-1.5 w-0.5 bg-[#e2ff57]" aria-hidden="true" />
                      </div>
                    ))}
                  </div>

                  {venue.courts.map((court) => (
                    <div className="grid" key={court.courtId} style={{ gridTemplateColumns }}>
                      <div className="flex h-10 items-center border-r border-[#dbe8d3] bg-[#f8fbf4] px-2 text-[13px] font-semibold text-[#276b3f]">
                        Sân {court.courtNumber}
                      </div>
                      {slotStarts.map((tick) => {
                        const slot = slotsByCourtAndStart.get(`${court.courtId}-${tick}`);
                        const selected = selectedSlot?.courtId === court.courtId && selectedSlot.startTime.slice(11, 16) === tick;
                        const className = selected
                          ? 'z-10 border-[#081d24] bg-[#e2ff57] shadow-[inset_0_0_0_1px_#081d24]'
                          : slot
                            ? stateClasses[slot.status]
                            : stateClasses.Closed;
                        const label = slot ? statusLabel[slot.status] : 'Khoá';

                        return (
                          <button
                            aria-label={`${venue.venueName} sân ${court.courtNumber} ${tick} ${label}`}
                            className={`h-10 border-b border-l border-[#dbe8d3] text-[0px] transition-colors ${className}`}
                            disabled={!slot}
                            key={`${court.courtId}-${tick}`}
                            onClick={() => slot && onSelectSlot(slot)}
                            title={slot ? `${tick} - ${slotTime(slot.endTime)} · ${label}` : `${tick} · Khoá`}
                            type="button"
                          >
                            {slot?.title ?? label}
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
