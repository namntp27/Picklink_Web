import { useEffect, useState } from 'react';
import { CalendarClock, ChevronLeft, Clock, MapPin, Phone } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { publicVenueApi } from '../../api/venues';
import { toMediaUrl } from '../../api/client';
import { LocationMap } from '../../components/maps/LocationMap';
import type { CourtDetail } from '../../types/venue';

const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

export const CourtDetailConnected = () => {
  const { id } = useParams();
  const [court, setCourt] = useState<CourtDetail | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { if (id) publicVenueApi.court(id).then(setCourt).catch((reason) => setError(reason.message)); }, [id]);

  if (error) return <main className="mx-auto min-h-screen max-w-5xl px-4 pt-28"><p className="rounded-lg bg-error-container p-4 font-bold text-error">{error}</p></main>;
  if (!court) return <main className="min-h-screen pt-28 text-center">Đang tải thông tin sân...</main>;
  const images = court.images.length ? court.images : [{ url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80', sortOrder: 0, isPrimary: true }];

  return (
    <main className="mx-auto min-h-screen max-w-[1200px] px-4 pb-12 pt-24 md:px-8">
      <Link to="/book-court" className="inline-flex items-center gap-1 text-[13px] font-bold text-primary"><ChevronLeft className="h-4 w-4" />Quay lại tìm sân</Link>
      <section className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <div className="grid h-[420px] grid-cols-2 gap-2 overflow-hidden rounded-lg"><img src={toMediaUrl(images[0].url)} alt={court.name} className="col-span-2 h-full w-full object-cover sm:col-span-1" /><div className="hidden grid-rows-2 gap-2 sm:grid">{images.slice(1, 3).map((image) => <img key={image.url} src={toMediaUrl(image.url)} alt={court.name} className="h-full w-full object-cover" />)}</div></div>
          <section><p className="text-[12px] font-bold uppercase text-primary">{court.code} · {court.venueName}</p><h1 className="mt-1 text-[32px] font-bold">{court.name}</h1><p className="mt-2 flex items-center gap-2 text-[14px] text-secondary"><MapPin className="h-5 w-5" />{court.streetAddress}, {court.wardName}, {court.provinceName}</p></section>
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2"><div className="rounded-lg border border-outline-variant p-5"><h2 className="mb-4 flex items-center gap-2 text-[18px] font-bold"><Clock className="h-5 w-5 text-primary" />Giờ hoạt động</h2><div className="space-y-2 text-[13px]">{court.openingHours.slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((item) => <div key={item.dayOfWeek} className="flex justify-between"><span>{dayNames[item.dayOfWeek]}</span><strong>{item.isClosed ? 'Nghỉ' : `${item.openTime?.slice(0, 5)} - ${item.closeTime?.slice(0, 5)}`}</strong></div>)}</div></div><div className="overflow-hidden rounded-lg border border-outline-variant"><LocationMap latitude={court.latitude} longitude={court.longitude} className="h-full min-h-72" /></div></section>
          {court.blockedSlots.length > 0 && <section className="rounded-lg border border-outline-variant p-5"><h2 className="mb-3 flex items-center gap-2 text-[18px] font-bold"><CalendarClock className="h-5 w-5 text-primary" />Lịch bảo trì</h2>{court.blockedSlots.map((slot) => <p key={slot.id} className="text-[13px] text-secondary">{new Date(slot.startTime).toLocaleString('vi-VN')} - {new Date(slot.endTime).toLocaleString('vi-VN')} · {slot.reason || 'Bảo trì'}</p>)}</section>}
        </div>
        <aside className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start"><p className="text-[13px] text-secondary">Giá cố định</p><p className="mt-1 text-[30px] font-bold text-primary">{court.pricePerHour.toLocaleString('vi-VN')}đ<span className="text-[13px] font-medium text-secondary">/giờ</span></p><div className="mt-5 space-y-3 rounded-lg bg-surface p-4 text-[13px]"><p className="flex justify-between"><span>Độ dài slot</span><strong>{court.slotDurationMinutes} phút</strong></p><p className="flex justify-between"><span>Trạng thái</span><strong>{court.status === 'Available' ? 'Sẵn sàng' : 'Bảo trì'}</strong></p></div><Link to={`/court/${court.id}/schedule`} className={`mt-5 block w-full rounded-lg px-4 py-3 text-center text-[14px] font-bold text-white ${court.status === 'Available' ? 'bg-primary' : 'pointer-events-none bg-secondary/50'}`}>Xem lịch đặt sân</Link><p className="mt-4 flex items-center justify-center gap-2 text-[12px] text-secondary"><Phone className="h-4 w-4" />Liên hệ cơ sở để được hỗ trợ</p></aside>
      </section>
    </main>
  );
};
