import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Lock, RefreshCw, Settings2, Sparkles, Unlock, Wrench, XCircle } from 'lucide-react';
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
import { OwnerShell } from './components/OwnerShell';

const toLocalDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};
const addDays = (value: string, days: number) => { const date = new Date(`${value}T00:00:00`); date.setDate(date.getDate() + days); return toLocalDate(date); };
const timeValue = (dateTime: string) => dateTime.slice(11, 16);
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${value}T00:00:00`));
const statusLabel: Record<string, string> = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Blocked: 'Đã khóa', Cancelled: 'Đã hủy' };
const entryLabel: Record<OwnerScheduleEntryType, string> = { Blocked: 'Khóa khung giờ', Maintenance: 'Bảo trì', Event: 'Sự kiện' };
const slotClass: Record<OwnerScheduleSlot['status'], string> = {
  Available: 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
  Booked: 'border-blue-200 bg-blue-100 text-blue-800',
  Blocked: 'border-slate-300 bg-slate-200 text-slate-700',
  Maintenance: 'border-orange-200 bg-orange-100 text-orange-800',
  Event: 'border-violet-200 bg-violet-100 text-violet-800',
  Closed: 'border-slate-200 bg-slate-100 text-slate-400',
  Inactive: 'border-red-100 bg-red-50 text-red-400',
};

export const OwnerDashboard = () => {
  const { token } = useAuth();
  const [date, setDate] = useState(toLocalDate);
  const [view, setView] = useState<'day' | 'week'>('day');
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

  const load = async () => {
    if (!token) return;
    setError('');
    setIsLoading(true);
    try {
      const result = await getOwnerSchedule(token, date, view);
      setSchedule(result);
      const firstCourt = result.venues.flatMap((venue) => venue.courts).find((court) => court.availabilityStatus !== 'Inactive');
      setCourtId((current) => result.venues.some((venue) => venue.courts.some((court) => court.courtId.toString() === current)) ? current : firstCourt?.courtId.toString() || '');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải lịch sân.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void load(); }, [token, date, view]);

  const visibleItems = useMemo(() => schedule?.items.filter((item) => venueFilter === 'all' || item.venueId.toString() === venueFilter) ?? [], [schedule, venueFilter]);
  const visibleSlots = useMemo(() => schedule?.slots.filter((slot) => venueFilter === 'all' || slot.venueId.toString() === venueFilter) ?? [], [schedule, venueFilter]);
  const days = useMemo(() => [...new Set(visibleSlots.map((slot) => slot.startTime.slice(0, 10)))], [visibleSlots]);
  const bookedCount = visibleSlots.filter((slot) => slot.status === 'Booked').length;
  const availableCount = visibleSlots.filter((slot) => slot.status === 'Available').length;
  const operationCount = visibleItems.filter((item) => item.isOwnerEntry).length;
  const revenue = visibleItems.filter((item) => item.status === 'Confirmed').reduce((sum, item) => sum + item.amount, 0);

  const createEntry = async (event: React.FormEvent) => {
    event.preventDefault();
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
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tạo lịch vận hành.');
    } finally { setIsSaving(false); }
  };

  const updateStatus = async (item: OwnerScheduleItem, status: 'Confirmed' | 'Cancelled') => {
    if (!token) return;
    try { await updateOwnerBookingStatus(token, item.bookingId, status); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật booking.'); }
  };

  const unlock = async (item: OwnerScheduleItem) => {
    if (!token) return;
    try { await deleteOwnerScheduleEntry(token, item.bookingId); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể mở khóa lịch.'); }
  };

  const selectSlot = (slot: OwnerScheduleSlot) => {
    if (slot.status !== 'Available') return;
    setDate(slot.startTime.slice(0, 10));
    setCourtId(slot.courtId.toString());
    setStartTime(timeValue(slot.startTime));
    setEndTime(timeValue(slot.endTime));
  };

  const movePeriod = (direction: number) => setDate((current) => addDays(current, direction * (view === 'week' ? 7 : 1)));

  return (
    <OwnerShell activeId="schedule">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[13px] font-bold uppercase tracking-wider text-primary">Lịch vận hành</p><h1 className="mt-1 text-[30px] font-bold">Lịch sân 30 phút</h1><p className="mt-1 text-[14px] text-on-surface-variant">Theo dõi booking, khóa giờ, bảo trì và sự kiện theo ngày hoặc tuần.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-outline-variant bg-white p-1"><button className={`rounded-md px-3 py-2 text-[13px] font-bold ${view === 'day' ? 'bg-primary text-white' : ''}`} onClick={() => setView('day')} type="button">Ngày</button><button className={`rounded-md px-3 py-2 text-[13px] font-bold ${view === 'week' ? 'bg-primary text-white' : ''}`} onClick={() => setView('week')} type="button">Tuần</button></div>
          <button className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={() => movePeriod(-1)} title="Kỳ trước" type="button"><ChevronLeft className="h-5 w-5" /></button>
          <input className="rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-[14px] font-bold" onChange={(event) => setDate(event.target.value)} type="date" value={date} />
          <button className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={() => movePeriod(1)} title="Kỳ sau" type="button"><ChevronRight className="h-5 w-5" /></button>
          <select className="rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-[14px] font-bold" onChange={(event) => setVenueFilter(event.target.value)} value={venueFilter}><option value="all">Tất cả cụm sân</option>{schedule?.venues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select>
          <button className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={() => void load()} title="Tải lại" type="button"><RefreshCw className="h-5 w-5" /></button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: 'Slot còn trống', value: availableCount, icon: Clock },
        { label: 'Slot đã đặt', value: bookedCount, icon: CheckCircle2 },
        { label: 'Lịch vận hành', value: operationCount, icon: Lock },
        { label: view === 'week' ? 'Doanh thu trong tuần' : 'Doanh thu trong ngày', value: money.format(revenue), icon: CalendarDays },
      ].map((item) => <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm" key={item.label}><div className="flex items-center justify-between"><p className="text-[13px] font-bold text-on-surface-variant">{item.label}</p><item.icon className="h-5 w-5 text-primary" /></div><p className="mt-2 text-[24px] font-bold">{item.value}</p></div>)}</section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[1fr_350px]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-5"><div><h2 className="text-[20px] font-bold">Bảng slot {view === 'week' ? 'theo tuần' : 'trong ngày'}</h2><p className="mt-1 text-[13px] text-on-surface-variant">{schedule ? `${dateLabel(schedule.startDate)} – ${dateLabel(schedule.endDate)} · bước ${schedule.slotMinutes} phút` : date}</p></div><div className="flex flex-wrap gap-2 text-[11px] font-bold">{[['bg-emerald-100','Trống'],['bg-blue-100','Đã đặt'],['bg-slate-200','Đã khóa'],['bg-orange-100','Bảo trì'],['bg-violet-100','Sự kiện']].map(([color,label]) => <span className="inline-flex items-center gap-1" key={label}><i className={`h-3 w-3 rounded ${color}`} />{label}</span>)}</div></div>
            {isLoading && <p className="p-10 text-center font-bold text-on-surface-variant">Đang sinh lịch...</p>}
            {!isLoading && visibleSlots.length === 0 && <p className="p-10 text-center font-bold text-on-surface-variant">Chưa có sân con hoặc chưa thiết lập giờ mở cửa.</p>}
            <div className="divide-y divide-outline-variant">
              {days.map((day) => {
                const daySlots = visibleSlots.filter((slot) => slot.startTime.startsWith(day));
                const courts = [...new Map(daySlots.map((slot) => [slot.courtId, slot])).values()];
                return <div className="p-4" key={day}><h3 className="mb-3 text-[15px] font-bold capitalize">{dateLabel(day)}</h3><div className="space-y-3">{courts.map((court) => { const slots = daySlots.filter((slot) => slot.courtId === court.courtId); return <div className="grid gap-2 lg:grid-cols-[180px_1fr]" key={court.courtId}><div><p className="text-[13px] font-bold">{court.venueName}</p><p className="text-[12px] text-on-surface-variant">Sân {court.courtNumber}</p></div><div className="flex flex-wrap gap-1.5">{slots.map((slot) => <button className={`min-w-[62px] rounded-md border px-2 py-1.5 text-[11px] font-bold ${slotClass[slot.status]}`} disabled={slot.status !== 'Available'} key={`${slot.courtId}-${slot.startTime}`} onClick={() => selectSlot(slot)} title={slot.title ?? slot.status} type="button">{timeValue(slot.startTime)}</button>)}</div></div>; })}</div></div>;
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm"><div className="border-b border-outline-variant p-5"><h2 className="text-[20px] font-bold">Booking và lịch vận hành</h2></div>{!isLoading && visibleItems.length === 0 && <p className="p-8 text-center text-[13px] font-bold text-on-surface-variant">Chưa có booking, khóa giờ, bảo trì hoặc sự kiện.</p>}<div className="divide-y divide-outline-variant">{visibleItems.map((item) => <div className="grid gap-3 p-4 md:grid-cols-[1fr_150px_140px_1fr_auto] md:items-center" key={item.bookingId}><div><p className="text-[14px] font-bold">{item.title || `${item.venueName} · Sân ${item.courtNumber}`}</p><p className="text-[12px] text-on-surface-variant">{item.venueName} · Sân {item.courtNumber} · {item.customerName ?? (item.entryType ? entryLabel[item.entryType] : 'Chủ sân')}</p></div><p className="text-[13px] font-bold">{item.startTime.slice(0, 10)}<br />{timeValue(item.startTime)}–{timeValue(item.endTime)}</p><span className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold ${item.entryType === 'Maintenance' ? 'bg-orange-100 text-orange-800' : item.entryType === 'Event' ? 'bg-violet-100 text-violet-800' : item.isOwnerEntry ? 'bg-slate-200 text-slate-700' : item.status === 'Confirmed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{item.entryType ? entryLabel[item.entryType] : statusLabel[item.status] ?? item.status}</span><p className="text-[13px] font-bold">{item.amount ? money.format(item.amount) : '—'}<span className="ml-2 text-[11px] text-on-surface-variant">{item.paymentStatus}</span></p><div className="flex gap-2">{item.isOwnerEntry ? <button className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 text-[12px] font-bold" onClick={() => void unlock(item)} type="button"><Unlock className="h-4 w-4" /> Mở</button> : <>{item.status === 'Pending' && <button className="rounded-lg bg-primary p-2 text-white" onClick={() => void updateStatus(item, 'Confirmed')} title="Xác nhận" type="button"><CheckCircle2 className="h-4 w-4" /></button>}<button className="rounded-lg border border-red-200 p-2 text-red-600" onClick={() => void updateStatus(item, 'Cancelled')} title="Hủy" type="button"><XCircle className="h-4 w-4" /></button></>}</div></div>)}</div></div>
        </div>

        <div className="space-y-5">
          <form className="space-y-4 rounded-xl border border-outline-variant bg-white p-5 shadow-sm" onSubmit={createEntry}>
            <div><h2 className="text-[20px] font-bold">Tạo lịch vận hành</h2><p className="mt-1 text-[13px] text-on-surface-variant">Thời gian được căn theo bước 30 phút.</p></div>
            <label><span className="mb-1.5 block text-[13px] font-bold">Loại lịch</span><select className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" onChange={(event) => setEntryType(event.target.value as OwnerScheduleEntryType)} value={entryType}><option value="Blocked">Khóa khung giờ</option><option value="Maintenance">Bảo trì sân</option><option value="Event">Sự kiện</option></select></label>
            <label><span className="mb-1.5 block text-[13px] font-bold">Sân con</span><select className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" onChange={(event) => setCourtId(event.target.value)} required value={courtId}><option value="">Chọn sân</option>{schedule?.venues.flatMap((venue) => venue.courts.filter((court) => court.availabilityStatus !== 'Inactive').map((court) => <option key={court.courtId} value={court.courtId}>{venue.venueName} · Sân {court.courtNumber}</option>))}</select></label>
            <label><span className="mb-1.5 block text-[13px] font-bold">Ngày áp dụng</span><input className="w-full rounded-lg border border-outline-variant px-3 py-2.5" onChange={(event) => setDate(event.target.value)} required type="date" value={date} /></label>
            <div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-[13px] font-bold">Bắt đầu</span><input className="w-full rounded-lg border border-outline-variant px-3 py-2.5" onChange={(event) => setStartTime(event.target.value)} required step="1800" type="time" value={startTime} /></label><label><span className="mb-1.5 block text-[13px] font-bold">Kết thúc</span><input className="w-full rounded-lg border border-outline-variant px-3 py-2.5" onChange={(event) => setEndTime(event.target.value)} required step="1800" type="time" value={endTime} /></label></div>
            <label><span className="mb-1.5 block text-[13px] font-bold">{entryType === 'Event' ? 'Tên sự kiện *' : 'Ghi chú'}</span><input className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder={entryType === 'Event' ? 'Giải đấu giao hữu...' : 'Nội dung tùy chọn'} required={entryType === 'Event'} value={title} /></label>
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white disabled:opacity-60" disabled={isSaving || !courtId} type="submit">{entryType === 'Maintenance' ? <Wrench className="h-4 w-4" /> : entryType === 'Event' ? <Sparkles className="h-4 w-4" /> : <Lock className="h-4 w-4" />}{isSaving ? 'Đang lưu...' : entryLabel[entryType]}</button>
          </form>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><div className="mb-3 flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" /><h2 className="text-[18px] font-bold">Giờ mở cửa</h2></div><div className="space-y-3">{schedule?.venues.map((venue) => <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3" key={venue.venueId}><div><p className="text-[13px] font-bold">{venue.venueName}</p><p className="text-[12px] text-on-surface-variant">{venue.openTime.slice(0, 5)}–{venue.closeTime.slice(0, 5)}</p></div><Link className="text-[12px] font-bold text-primary hover:underline" to={`/owner/courts/${venue.venueId}/edit`}>Thiết lập</Link></div>)}</div></section>
        </div>
      </section>
    </OwnerShell>
  );
};
