import { useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Lock,
  RefreshCw,
  Sparkles,
  Unlock,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  createOwnerScheduleEntry,
  deleteOwnerScheduleEntry,
  getOwnerSchedule,
  updateOwnerBookingStatus,
  type OwnerSchedule,
  type OwnerScheduleEntryType,
  type OwnerScheduleItem,
  type OwnerScheduleSlot,
} from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { OwnerShell } from './components/OwnerShell';
import { OwnerTimelineGrid } from './components/OwnerTimelineGrid';

const toLocalDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const addDays = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
};

const timeValue = (dateTime: string) => dateTime.slice(11, 16);
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${value}T00:00:00`));

const statusLabel: Record<string, string> = {
  Holding: 'Giữ chỗ',
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã đặt',
  Blocked: 'Đã khóa',
  Cancelled: 'Đã hủy',
};

const paymentStatusLabel: Record<string, string> = {
  Pending: 'Chờ thanh toán',
  WaitingForConfirmation: 'Chờ xác nhận thanh toán',
  Paid: 'Đã thanh toán',
  Expired: 'Đã hết hạn',
  Cancelled: 'Đã hủy',
  Rejected: 'Đã từ chối',
  Failed: 'Thanh toán lỗi',
};

const slotStatusLabel: Record<OwnerScheduleSlot['status'], string> = {
  Available: 'Trống',
  Holding: 'Đang giữ',
  Booked: 'Đã đặt',
  Blocked: 'Đã khóa',
  Maintenance: 'Bảo trì',
  Event: 'Sự kiện',
  Closed: 'Đã đóng cửa',
  Inactive: 'Ngừng hoạt động',
};

const entryLabel: Record<OwnerScheduleEntryType, string> = {
  Blocked: 'Khóa khung giờ',
  Maintenance: 'Bảo trì sân',
  Event: 'Sự kiện',
};

const operationTimeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2).toString().padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

const getPaymentStatusLabel = (status?: string | null) => status ? paymentStatusLabel[status] ?? status : '-';

export const OwnerDashboard = () => {
  const { token } = useAuth();
  const [date, setDate] = useState(toLocalDate);
  const [schedule, setSchedule] = useState<OwnerSchedule | null>(null);
  const [venueFilter, setVenueFilter] = useState('all');
  const [courtId, setCourtId] = useState('');
  const [entryType, setEntryType] = useState<OwnerScheduleEntryType>('Blocked');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:30');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<OwnerScheduleSlot | null>(null);

  const load = async (showLoading = true) => {
    if (!token) return;
    setError('');
    if (showLoading) setIsLoading(true);
    try {
      const result = await getOwnerSchedule(token, date, 'day');
      setSchedule(result);
      const firstCourt = result.venues
        .flatMap((venue) => venue.courts)
        .find((court) => court.availabilityStatus !== 'Inactive');
      setCourtId((current) =>
        result.venues.some((venue) => venue.courts.some((court) => court.courtId.toString() === current))
          ? current
          : firstCourt?.courtId.toString() || '',
      );
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải lịch sân.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token, date]);

  useScheduleRealtime((notification) => {
    const visibleVenue = schedule?.venues.some((venue) => venue.venueId === notification.venueId);
    if (visibleVenue && notification.startTime.slice(0, 10) === date) void load(false);
  });

  usePaymentRealtime((notification) => {
    if (schedule?.venues.some((venue) => venue.venueId === notification.venueId)) void load(false);
  });

  const visibleVenueIds = useMemo(
    () => new Set((schedule?.venues ?? [])
      .filter((venue) => venueFilter === 'all' || venue.venueId.toString() === venueFilter)
      .map((venue) => venue.venueId)),
    [schedule, venueFilter],
  );
  const visibleItems = useMemo(
    () => schedule?.items.filter((item) => visibleVenueIds.has(item.venueId)) ?? [],
    [schedule, visibleVenueIds],
  );
  const visibleSlots = useMemo(
    () => schedule?.slots.filter((slot) => visibleVenueIds.has(slot.venueId)) ?? [],
    [schedule, visibleVenueIds],
  );
  const bookedCount = visibleSlots.filter((slot) => slot.status === 'Booked').length;
  const holdingCount = visibleSlots.filter((slot) => slot.status === 'Holding').length;
  const availableCount = visibleSlots.filter((slot) => slot.status === 'Available').length;
  const operationCount = visibleItems.filter((item) => item.isOwnerEntry).length;
  const revenue = visibleItems
    .filter((item) => item.status === 'Confirmed')
    .reduce((sum, item) => sum + item.amount, 0);

  const selectedSlotItem = selectedSlot?.bookingId
    ? visibleItems.find((item) => item.bookingId === selectedSlot.bookingId)
    : undefined;

  const applySlotToForm = (slot: OwnerScheduleSlot) => {
    setSelectedSlot(slot);
    setCourtId(slot.courtId.toString());
    setStartTime(timeValue(slot.startTime));
    setEndTime(timeValue(slot.endTime));
    setDate(slot.startTime.slice(0, 10));
    if (slot.status === 'Event') setEntryType('Event');
    else if (slot.status === 'Maintenance') setEntryType('Maintenance');
    else setEntryType('Blocked');
  };

  const createEntry = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!token || !courtId) return;
    setError('');
    setIsSaving(true);
    try {
      await createOwnerScheduleEntry(token, {
        courtId: Number(courtId),
        startTime: `${date}T${startTime}:00`,
        endTime: `${date}T${endTime}:00`,
        entryType,
        title: title.trim() || undefined,
      });
      setTitle('');
      setSelectedSlot(null);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tạo lịch vận hành.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (item: OwnerScheduleItem, status: 'Confirmed' | 'Cancelled') => {
    if (!token) return;
    try {
      await updateOwnerBookingStatus(token, item.bookingId, status);
      setSelectedSlot(null);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật booking.');
    }
  };

  const unlock = async (item: OwnerScheduleItem) => {
    if (!token) return;
    try {
      await deleteOwnerScheduleEntry(token, item.bookingId);
      setSelectedSlot(null);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể mở khóa lịch.');
    }
  };

  const moveDate = (days: number) => setDate((current) => addDays(current, days));

  return (
    <OwnerShell activeId="schedule">
      <section className="owner-page-header">
        <div>
          <p className="owner-kicker"><CalendarDays className="h-4 w-4" /> Lịch vận hành</p>
          <h1 className="mt-2">Quản lý lịch đặt sân</h1>
          <p className="mt-1">Theo dõi toàn bộ sân con theo trục thời gian 30 phút và thao tác trực tiếp trên từng ô.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={() => moveDate(-1)} title="Ngày trước" type="button">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <input
            className="rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-[14px] font-bold"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
          <button className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={() => moveDate(1)} title="Ngày sau" type="button">
            <ChevronRight className="h-5 w-5" />
          </button>
          <select className="rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-[14px] font-bold" onChange={(event) => setVenueFilter(event.target.value)} value={venueFilter}>
            <option value="all">Tất cả cụm sân</option>
            {schedule?.venues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}
          </select>
          <button className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={() => void load()} title="Tải lại" type="button">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="owner-stat-grid sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: 'Slot còn trống', value: availableCount, icon: Clock },
          { label: 'Slot đang giữ', value: holdingCount, icon: Clock },
          { label: 'Slot đã đặt', value: bookedCount, icon: CheckCircle2 },
          { label: 'Lịch vận hành', value: operationCount, icon: Lock },
          { label: 'Doanh thu trong ngày', value: money.format(revenue), icon: Banknote },
        ].map((item) => (
          <div className="owner-stat-card" key={item.label}>
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-on-surface-variant">{item.label}</p>
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 font-mono text-[22px] font-extrabold">{item.value}</p>
          </div>
        ))}
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}

      <section className="owner-schedule-stage owner-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
          <div>
            <h2 className="text-[18px] font-bold">Bảng lịch ngày {dateLabel(date)}</h2>
            <p className="mt-1 text-[12px] text-on-surface-variant">
              {schedule ? `${schedule.venues.length} cụm sân · bước ${schedule.slotMinutes} phút` : 'Đang tải lịch'}
            </p>
          </div>
          <Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[12px] font-bold hover:bg-surface-container-low" to="/owner/bookings">
            <Eye className="h-4 w-4" /> Danh sách đơn
          </Link>
        </div>

        {isLoading && <p className="p-10 text-center font-bold text-on-surface-variant">Đang sinh lịch...</p>}
        {!isLoading && schedule && visibleSlots.length === 0 && (
          <p className="p-10 text-center font-bold text-on-surface-variant">Chưa có sân con hoặc chưa thiết lập giờ mở cửa.</p>
        )}
        {!isLoading && schedule && visibleSlots.length > 0 && (
          <OwnerTimelineGrid
            onSelectSlot={applySlotToForm}
            schedule={schedule}
            selectedSlot={selectedSlot}
            venueFilter={venueFilter}
          />
        )}
      </section>

      <section className="owner-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold">Giờ mở cửa</h2>
            <p className="mt-1 text-[12px] text-on-surface-variant">Thiết lập giờ vận hành tại hồ sơ từng cụm sân.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {schedule?.venues.map((venue) => (
              <Link className="rounded-lg bg-surface-container-low px-3 py-2 text-[12px] font-bold hover:bg-white" key={venue.venueId} to={`/owner/courts/${venue.venueId}/edit`}>
                {venue.venueName}: {venue.openTime.slice(0, 5)}-{venue.closeTime.slice(0, 5)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {selectedSlot && (
        <div className="owner-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && setSelectedSlot(null)}>
          <section aria-modal="true" className="owner-modal max-w-2xl p-5" role="dialog">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-primary">Thông tin khung giờ</p>
                <h2 className="mt-1 text-[24px] font-bold">{selectedSlot.venueName} · Sân {selectedSlot.courtNumber}</h2>
              </div>
              <button aria-label="Đóng" className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low" onClick={() => setSelectedSlot(null)} type="button">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-[13px] md:grid-cols-4">
              <div className="rounded-lg bg-surface-container-low p-3"><p className="font-bold text-on-surface-variant">Ngày</p><p className="mt-1 font-bold">{dateLabel(selectedSlot.startTime.slice(0, 10))}</p></div>
              <div className="rounded-lg bg-surface-container-low p-3"><p className="font-bold text-on-surface-variant">Thời gian</p><p className="mt-1 font-bold">{timeValue(selectedSlot.startTime)}-{timeValue(selectedSlot.endTime)}</p></div>
              <div className="rounded-lg bg-surface-container-low p-3"><p className="font-bold text-on-surface-variant">Trạng thái</p><p className="mt-1 font-bold">{slotStatusLabel[selectedSlot.status]}</p></div>
              <div className="rounded-lg bg-surface-container-low p-3"><p className="font-bold text-on-surface-variant">Mã booking</p><p className="mt-1 font-bold">{selectedSlot.bookingId ? `#${selectedSlot.bookingId}` : '-'}</p></div>
            </div>

            {selectedSlotItem && (
              <div className="mt-4 rounded-xl border border-outline-variant p-4">
                <p className="flex items-center gap-2 text-[14px] font-bold"><Eye className="h-4 w-4 text-primary" /> Chi tiết booking</p>
                <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Nội dung</span><strong className="text-right">{selectedSlotItem.title || (statusLabel[selectedSlotItem.status] ?? selectedSlotItem.status)}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Khách hàng</span><strong className="text-right">{selectedSlotItem.customerName || '-'}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Thanh toán</span><strong className="text-right">{getPaymentStatusLabel(selectedSlotItem.paymentStatus)}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Số tiền</span><strong className="text-right">{selectedSlotItem.amount ? money.format(selectedSlotItem.amount) : '-'}</strong></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSlotItem.isOwnerEntry ? (
                    <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-[13px] font-bold" onClick={() => void unlock(selectedSlotItem)} type="button">
                      <Unlock className="h-4 w-4" /> Mở khóa lịch
                    </button>
                  ) : (
                    <>
                      {selectedSlotItem.status === 'Pending' && (
                        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white" onClick={() => void updateStatus(selectedSlotItem, 'Confirmed')} type="button">
                          <CheckCircle2 className="h-4 w-4" /> Xác nhận đặt sân
                        </button>
                      )}
                      <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-[13px] font-bold text-red-600" onClick={() => void updateStatus(selectedSlotItem, 'Cancelled')} type="button">
                        <XCircle className="h-4 w-4" /> Hủy booking
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {selectedSlot.status === 'Available' && (
              <form className="mt-4 rounded-xl border border-outline-variant p-4" onSubmit={createEntry}>
                <p className="text-[14px] font-bold">Tạo lịch vận hành cho khung giờ này</p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-[13px] font-bold">Loại lịch</span>
                    <select className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" onChange={(event) => setEntryType(event.target.value as OwnerScheduleEntryType)} value={entryType}>
                      <option value="Blocked">Khóa khung giờ</option>
                      <option value="Maintenance">Bảo trì sân</option>
                      <option value="Event">Sự kiện</option>
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[13px] font-bold">{entryType === 'Event' ? 'Tên sự kiện *' : 'Ghi chú'}</span>
                    <input className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" maxLength={200} onChange={(event) => setTitle(event.target.value)} required={entryType === 'Event'} value={title} />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[13px] font-bold">Bắt đầu</span>
                    <select className="w-full rounded-lg border border-outline-variant px-3 py-2.5" onChange={(event) => setStartTime(event.target.value)} required value={startTime}>
                      {operationTimeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[13px] font-bold">Kết thúc</span>
                    <select className="w-full rounded-lg border border-outline-variant px-3 py-2.5" onChange={(event) => setEndTime(event.target.value)} required value={endTime}>
                      {operationTimeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                </div>
                <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white disabled:opacity-60" disabled={isSaving || !courtId} type="submit">
                  {entryType === 'Maintenance' ? <Wrench className="h-4 w-4" /> : entryType === 'Event' ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isSaving ? 'Đang lưu...' : entryLabel[entryType]}
                </button>
              </form>
            )}
          </section>
        </div>
      )}
    </OwnerShell>
  );
};
