import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, Lock, RefreshCw, Unlock, XCircle } from 'lucide-react';
import { ApiError } from '../../api/client';
import {
  createOwnerScheduleBlock,
  deleteOwnerScheduleBlock,
  getOwnerSchedule,
  updateOwnerBookingStatus,
  type OwnerSchedule,
  type OwnerScheduleItem,
} from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';

const localDate = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

const timeValue = (dateTime: string) => dateTime.slice(11, 16);
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const statusLabel: Record<string, string> = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Blocked: 'Đã khóa', Cancelled: 'Đã hủy' };

export const OwnerDashboard = () => {
  const { token } = useAuth();
  const [date, setDate] = useState(localDate);
  const [schedule, setSchedule] = useState<OwnerSchedule | null>(null);
  const [venueFilter, setVenueFilter] = useState('all');
  const [courtId, setCourtId] = useState('');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    setError('');
    setIsLoading(true);
    try {
      const result = await getOwnerSchedule(token, date);
      setSchedule(result);
      const firstCourt = result.venues.flatMap((venue) => venue.courts).find((court) => court.availabilityStatus === 'Available');
      setCourtId((current) => current || firstCourt?.courtId.toString() || '');
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải lịch sân.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void load(); }, [token, date]);

  const visibleItems = useMemo(() => schedule?.items.filter((item) => venueFilter === 'all' || item.venueId.toString() === venueFilter) ?? [], [schedule, venueFilter]);
  const pendingCount = visibleItems.filter((item) => item.status === 'Pending').length;
  const confirmedCount = visibleItems.filter((item) => item.status === 'Confirmed').length;
  const blockedCount = visibleItems.filter((item) => item.isOwnerBlock).length;
  const revenue = visibleItems.filter((item) => item.status === 'Confirmed').reduce((sum, item) => sum + item.amount, 0);

  const createBlock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !courtId) return;
    setError('');
    setIsSaving(true);
    try {
      await createOwnerScheduleBlock(token, {
        courtId: Number(courtId),
        startTime: `${date}T${startTime}:00`,
        endTime: `${date}T${endTime}:00`,
      });
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể khóa khung giờ.');
    } finally { setIsSaving(false); }
  };

  const updateStatus = async (item: OwnerScheduleItem, status: 'Confirmed' | 'Cancelled') => {
    if (!token) return;
    try { await updateOwnerBookingStatus(token, item.bookingId, status); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật booking.'); }
  };

  const unlock = async (item: OwnerScheduleItem) => {
    if (!token) return;
    try { await deleteOwnerScheduleBlock(token, item.bookingId); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể mở khóa khung giờ.'); }
  };

  return (
    <OwnerShell activeId="schedule">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><p className="text-[13px] font-bold uppercase tracking-wider text-primary">Lịch vận hành</p><h1 className="mt-1 text-[30px] font-bold">Lịch sân theo ngày</h1><p className="mt-1 text-[14px] text-on-surface-variant">Xác nhận đơn đặt, theo dõi doanh thu và khóa giờ bảo trì.</p></div>
        <div className="flex flex-wrap gap-2"><input className="rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-[14px] font-bold" onChange={(event) => setDate(event.target.value)} type="date" value={date} /><select className="rounded-lg border border-outline-variant bg-white px-4 py-2.5 text-[14px] font-bold" onChange={(event) => setVenueFilter(event.target.value)} value={venueFilter}><option value="all">Tất cả cụm sân</option>{schedule?.venues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select><button className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={load} type="button"><RefreshCw className="h-5 w-5" /></button></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
        { label: 'Chờ xác nhận', value: pendingCount, icon: Clock },
        { label: 'Đã xác nhận', value: confirmedCount, icon: CheckCircle2 },
        { label: 'Khung đã khóa', value: blockedCount, icon: Lock },
        { label: 'Doanh thu trong ngày', value: money.format(revenue), icon: CalendarDays },
      ].map((item) => <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm" key={item.label}><div className="flex items-center justify-between"><p className="text-[13px] font-bold text-on-surface-variant">{item.label}</p><item.icon className="h-5 w-5 text-primary" /></div><p className="mt-2 text-[24px] font-bold">{item.value}</p></div>)}</section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}

      <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <div className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
          <div className="border-b border-outline-variant p-5"><h2 className="text-[20px] font-bold">Booking và khung khóa</h2><p className="mt-1 text-[13px] text-on-surface-variant">{date}</p></div>
          {isLoading && <p className="p-10 text-center font-bold text-on-surface-variant">Đang tải lịch...</p>}
          {!isLoading && visibleItems.length === 0 && <p className="p-10 text-center font-bold text-on-surface-variant">Chưa có booking hoặc khung khóa trong ngày.</p>}
          <div className="divide-y divide-outline-variant">
            {visibleItems.map((item) => (
              <div className="grid gap-3 p-4 md:grid-cols-[1fr_120px_130px_1fr_auto] md:items-center" key={item.bookingId}>
                <div><p className="text-[14px] font-bold">{item.venueName} · Sân {item.courtNumber}</p><p className="text-[12px] text-on-surface-variant">{item.customerName ?? 'Khóa bởi chủ sân'}</p></div>
                <p className="text-[14px] font-bold">{timeValue(item.startTime)}–{timeValue(item.endTime)}</p>
                <span className={`w-fit rounded-full px-3 py-1 text-[11px] font-bold ${item.status === 'Confirmed' ? 'bg-green-100 text-green-700' : item.isOwnerBlock ? 'bg-slate-200 text-slate-700' : 'bg-amber-100 text-amber-700'}`}>{statusLabel[item.status] ?? item.status}</span>
                <p className="text-[13px] font-bold">{item.amount ? money.format(item.amount) : '—'}<span className="ml-2 text-[11px] text-on-surface-variant">{item.paymentStatus}</span></p>
                <div className="flex gap-2">{item.isOwnerBlock ? <button className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-3 py-2 text-[12px] font-bold" onClick={() => unlock(item)} type="button"><Unlock className="h-4 w-4" /> Mở</button> : <>{item.status === 'Pending' && <button className="rounded-lg bg-primary p-2 text-white" onClick={() => updateStatus(item, 'Confirmed')} title="Xác nhận" type="button"><CheckCircle2 className="h-4 w-4" /></button>}<button className="rounded-lg border border-red-200 p-2 text-red-600" onClick={() => updateStatus(item, 'Cancelled')} title="Hủy" type="button"><XCircle className="h-4 w-4" /></button></>}</div>
              </div>
            ))}
          </div>
        </div>

        <form className="h-fit space-y-4 rounded-xl border border-outline-variant bg-white p-5 shadow-sm" onSubmit={createBlock}>
          <div><h2 className="text-[20px] font-bold">Khóa khung giờ</h2><p className="mt-1 text-[13px] text-on-surface-variant">Dùng cho bảo trì, sự kiện hoặc vận hành nội bộ.</p></div>
          <label><span className="mb-1.5 block text-[13px] font-bold">Sân con</span><select className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" onChange={(event) => setCourtId(event.target.value)} required value={courtId}><option value="">Chọn sân</option>{schedule?.venues.flatMap((venue) => venue.courts.filter((court) => court.availabilityStatus === 'Available').map((court) => <option key={court.courtId} value={court.courtId}>{venue.venueName} · Sân {court.courtNumber}</option>))}</select></label>
          <div className="grid grid-cols-2 gap-3"><label><span className="mb-1.5 block text-[13px] font-bold">Bắt đầu</span><input className="w-full rounded-lg border border-outline-variant px-3 py-2.5" onChange={(event) => setStartTime(event.target.value)} required type="time" value={startTime} /></label><label><span className="mb-1.5 block text-[13px] font-bold">Kết thúc</span><input className="w-full rounded-lg border border-outline-variant px-3 py-2.5" onChange={(event) => setEndTime(event.target.value)} required type="time" value={endTime} /></label></div>
          <button className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white disabled:opacity-60" disabled={isSaving || !courtId} type="submit"><Lock className="h-4 w-4" /> {isSaving ? 'Đang khóa...' : 'Khóa khung giờ'}</button>
        </form>
      </section>
    </OwnerShell>
  );
};
