import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CalendarDays, Clock, Info, Loader2, MapPin, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createBookingHolding, getCourtAvailability, type AvailabilitySlot, type CourtAvailability } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';

const localDate = () => { const now = new Date(); return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10); };
const time = (value: string) => value.slice(11, 16);
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const minuteOfDay = (value: string) => { const [hour, minute] = value.split(':').map(Number); return hour * 60 + minute; };
const unavailableLabel: Record<string, string> = { Holding: 'Đang được giữ', Booked: 'Đã đặt', Blocked: 'Đã khóa', Maintenance: 'Bảo trì', Event: 'Sự kiện', Closed: 'Đóng cửa' };

export const CourtScheduleDetail = () => {
  const venueId = Number(useParams().id);
  const navigate = useNavigate();
  const { token } = useAuth();
  const [date, setDate] = useState(localDate);
  const [availability, setAvailability] = useState<CourtAvailability | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(null);
  const [selectedStarts, setSelectedStarts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHolding, setIsHolding] = useState(false);
  const [error, setError] = useState('');

  const load = async (showLoading = true) => {
    if (!Number.isInteger(venueId)) return;
    if (showLoading) setIsLoading(true);
    setError('');
    try {
      setAvailability(await getCourtAvailability(venueId, date));
      setSelectedCourtId(null);
      setSelectedStarts([]);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải lịch sân.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => { void load(); }, [venueId, date]);
  useScheduleRealtime((notification) => {
    if (notification.venueId === venueId && notification.startTime.slice(0, 10) === date) void load(false);
  });

  const selectedCourt = availability?.courts.find((court) => court.courtId === selectedCourtId);
  const selectedSlots = useMemo(() => availability?.slots
    .filter((slot) => slot.courtId === selectedCourtId && selectedStarts.includes(time(slot.startTime)))
    .sort((first, second) => first.startTime.localeCompare(second.startTime)) ?? [], [availability, selectedCourtId, selectedStarts]);
  const durationHours = selectedSlots.length * 0.5;
  const estimatedCourtAmount = (selectedCourt?.hourlyPrice ?? 0) * durationHours;

  const selectSlot = (slot: AvailabilitySlot) => {
    if (slot.status !== 'Available' || new Date(slot.startTime).getTime() <= Date.now()) return;
    const slotTime = time(slot.startTime);
    if (selectedCourtId !== slot.courtId) {
      setSelectedCourtId(slot.courtId);
      setSelectedStarts([slotTime]);
      setError('');
      return;
    }
    if (selectedStarts.includes(slotTime)) {
      const sorted = [...selectedStarts].sort();
      setSelectedStarts(slotTime === sorted[0] || slotTime === sorted.at(-1) ? sorted.filter((item) => item !== slotTime) : [slotTime]);
      return;
    }
    const candidate = [...selectedStarts, slotTime].sort();
    const consecutive = candidate.every((item, index) => index === 0 || minuteOfDay(item) - minuteOfDay(candidate[index - 1]) === 30);
    if (consecutive) {
      setSelectedStarts(candidate);
      setError('');
    } else {
      setSelectedStarts([slotTime]);
      setError('Chỉ được chọn các slot liên tiếp. Hệ thống đã bắt đầu một lựa chọn mới.');
    }
  };

  const createHold = async () => {
    if (!token) { navigate('/login'); return; }
    if (!selectedCourtId || selectedStarts.length === 0) return;
    setIsHolding(true);
    setError('');
    try {
      const booking = await createBookingHolding(token, {
        courtId: selectedCourtId,
        date,
        slotStarts: selectedStarts.map((item) => `${item}:00`),
      });
      navigate(`/checkout?bookingId=${booking.bookingId}`);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể giữ slot. Vui lòng tải lại lịch.');
      await load();
    } finally {
      setIsHolding(false);
    }
  };

  return <div className="min-h-screen bg-surface-container-low px-4 py-6 md:px-10"><div className="mx-auto max-w-[1280px] space-y-5">
    <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary" to="/book-court"><ArrowLeft className="h-4 w-4" /> Chọn cụm sân khác</Link>
    <section className="flex flex-col gap-4 rounded-2xl border border-outline-variant bg-white p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
      <div><p className="text-[12px] font-bold uppercase tracking-wider text-primary">Chọn ngày và slot</p><h1 className="mt-1 text-[28px] font-bold">{availability?.venueName ?? 'Lịch sân'}</h1><p className="mt-2 flex items-center gap-2 text-[13px] text-on-surface-variant"><MapPin className="h-4 w-4" />{availability?.address}</p></div>
      <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /><input className="rounded-xl border border-outline-variant px-4 py-3 text-[14px] font-bold" min={localDate()} onChange={(event) => setDate(event.target.value)} type="date" value={date} /><button className="rounded-xl border border-outline-variant p-3" onClick={() => void load()} type="button"><RefreshCw className="h-5 w-5" /></button></div>
    </section>
    {error && <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-[13px] font-bold text-amber-800">{error}</div>}
    <section className="grid gap-5 xl:grid-cols-[1fr_340px]">
      <div className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-5"><div><h2 className="text-[20px] font-bold">Slot 30 phút</h2><p className="text-[13px] text-on-surface-variant">{availability?.openTime}–{availability?.closeTime} · chỉ chọn trên cùng một sân</p></div><div className="flex gap-3 text-[11px] font-bold"><span>🟢 Trống</span><span>🔵 Không khả dụng</span><span>🟩 Đã chọn</span></div></div>
        {isLoading && <div className="flex items-center justify-center gap-2 p-14 font-bold text-on-surface-variant"><Loader2 className="h-5 w-5 animate-spin" />Đang kiểm tra slot...</div>}
        {!isLoading && <div className="divide-y divide-outline-variant">{availability?.courts.map((court) => <div className="grid gap-4 p-5 lg:grid-cols-[190px_1fr]" key={court.courtId}>
          <div><h3 className="text-[16px] font-bold">Sân {court.courtNumber}</h3><p className="mt-1 text-[12px] text-on-surface-variant">{court.courtType} · {court.isIndoor ? 'Trong nhà' : 'Ngoài trời'}</p><p className="mt-2 text-[14px] font-bold text-primary">{currency.format(court.hourlyPrice)}/giờ</p></div>
          <div className="flex flex-wrap gap-2">{availability.slots.filter((slot) => slot.courtId === court.courtId).map((slot) => {
            const selected = selectedCourtId === court.courtId && selectedStarts.includes(time(slot.startTime));
            const past = new Date(slot.startTime).getTime() <= Date.now();
            const disabled = slot.status !== 'Available' || past;
            return <button className={`min-w-[70px] rounded-lg border px-2 py-2 text-[12px] font-bold ${selected ? 'border-primary bg-primary text-white' : disabled ? 'cursor-not-allowed border-blue-100 bg-blue-50 text-blue-400' : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'}`} disabled={disabled} key={`${court.courtId}-${slot.startTime}`} onClick={() => selectSlot(slot)} title={past ? 'Đã qua' : unavailableLabel[slot.status] ?? 'Còn trống'} type="button">{time(slot.startTime)}</button>;
          })}</div>
        </div>)}</div>}
      </div>
      <aside className="h-fit space-y-4 rounded-2xl border border-outline-variant bg-white p-5 shadow-sm xl:sticky xl:top-24">
        <h2 className="text-[20px] font-bold">Tóm tắt lựa chọn</h2>
        <div className="space-y-3 text-[13px]"><div className="flex justify-between"><span>Sân con</span><strong>{selectedCourt ? `Sân ${selectedCourt.courtNumber}` : 'Chưa chọn'}</strong></div><div className="flex justify-between"><span>Thời gian</span><strong>{selectedSlots.length ? `${time(selectedSlots[0].startTime)}–${time(selectedSlots.at(-1)!.endTime)}` : 'Chưa chọn'}</strong></div><div className="flex justify-between"><span>Thời lượng</span><strong>{durationHours} giờ</strong></div><div className="flex justify-between"><span>Tiền sân</span><strong>{currency.format(estimatedCourtAmount)}</strong></div></div>
        <div className="rounded-xl bg-primary/5 p-3 text-[12px] leading-5 text-on-surface-variant"><Info className="mr-1 inline h-4 w-4 text-primary" />Backend sẽ tính lại: Đơn giá sân × Thời lượng. Không có phí dịch vụ hoặc giảm giá.</div>
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-[15px] font-bold text-white disabled:opacity-50" disabled={!selectedSlots.length || isHolding} onClick={() => void createHold()} type="button">{isHolding ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}{isHolding ? 'Đang kiểm tra và giữ slot...' : 'Giữ chỗ 15 phút & thanh toán'}</button>
        <p className="text-center text-[11px] text-on-surface-variant"><Clock className="mr-1 inline h-3.5 w-3.5" />Backend kiểm tra chống trùng trong transaction.</p>
      </aside>
    </section>
  </div></div>;
};
