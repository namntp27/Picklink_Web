import { useEffect, useMemo, useState } from 'react';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { administrativeApi, publicVenueApi } from '../../api/venues';
import { toMediaUrl } from '../../api/client';
import { LocationMap } from '../../components/maps/LocationMap';
import type { CourtListItem, Province, Ward } from '../../types/venue';

export const BookCourtConnected = () => {
  const navigate = useNavigate();
  const [courts, setCourts] = useState<CourtListItem[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [search, setSearch] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [wardId, setWardId] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { administrativeApi.provinces().then(setProvinces).catch(() => undefined); }, []);
  useEffect(() => {
    if (!provinceId) { setWards([]); return; }
    administrativeApi.wards(provinceId).then(setWards).catch(() => undefined);
  }, [provinceId]);
  useEffect(() => {
    setLoading(true);
    publicVenueApi.courts({ search, provinceId, wardId, maxPrice, pageSize: 50 })
      .then((items) => { setCourts(items); setSelectedId((current) => current || items[0]?.id || ''); })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [maxPrice, provinceId, search, wardId]);

  const selectedCourt = useMemo(() => courts.find((item) => item.id === selectedId) ?? courts[0], [courts, selectedId]);

  return (
    <div className="flex min-h-screen flex-col bg-white pt-[72px] md:h-screen md:flex-row md:overflow-hidden">
      <section className="flex w-full flex-col border-r border-outline-variant md:h-full md:w-[60%]">
        <div className="shrink-0 border-b border-outline-variant bg-white p-4 shadow-sm md:p-5">
          <div className="relative"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên sân, mã sân hoặc cơ sở" className="w-full rounded-lg border border-outline-variant bg-surface-container-low py-3 pl-10 pr-4 text-[14px] outline-none focus:border-primary" /></div>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <select value={provinceId} onChange={(e) => { setProvinceId(e.target.value); setWardId(''); }} className="rounded-lg border border-outline-variant px-3 py-2.5 text-[13px]"><option value="">Tất cả tỉnh/thành</option>{provinces.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
            <select value={wardId} onChange={(e) => setWardId(e.target.value)} className="rounded-lg border border-outline-variant px-3 py-2.5 text-[13px]"><option value="">Tất cả xã/phường</option>{wards.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select>
            <select value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="rounded-lg border border-outline-variant px-3 py-2.5 text-[13px]"><option value="">Mọi mức giá</option><option value="150000">Đến 150.000đ</option><option value="200000">Đến 200.000đ</option><option value="300000">Đến 300.000đ</option></select>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4 md:p-5">
          <div className="flex items-center justify-between"><h1 className="text-[20px] font-bold">{loading ? 'Đang tìm sân...' : `${courts.length} sân Pickleball`}</h1><SlidersHorizontal className="h-5 w-5 text-secondary" /></div>
          {error && <p className="rounded-lg bg-error-container p-3 text-[13px] font-bold text-error">{error}</p>}
          {courts.map((court) => (
            <article key={court.id} onMouseEnter={() => setSelectedId(court.id)} className={`flex flex-col overflow-hidden rounded-lg border bg-white transition-shadow hover:shadow-md sm:flex-row ${selectedCourt?.id === court.id ? 'border-primary' : 'border-outline-variant'}`}>
              <img src={toMediaUrl(court.imageUrl) || 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=700&q=80'} alt={court.name} className="h-44 w-full object-cover sm:w-44" />
              <div className="flex min-w-0 flex-1 flex-col justify-between p-4"><div><div className="flex items-start justify-between gap-3"><div><h2 className="text-[17px] font-bold">{court.name}</h2><p className="text-[12px] font-bold text-primary">{court.code} · {court.venueName}</p></div><span className="rounded-md bg-[#eaf7df] px-2 py-1 text-[11px] font-bold text-primary">{court.status === 'Available' ? 'Sẵn sàng' : 'Bảo trì'}</span></div><p className="mt-2 flex items-center gap-1 text-[13px] text-secondary"><MapPin className="h-4 w-4" />{court.wardName}, {court.provinceName}</p><p className="mt-3 text-[20px] font-bold text-primary">{court.pricePerHour.toLocaleString('vi-VN')}đ <span className="text-[12px] font-medium text-secondary">/ giờ · slot {court.slotDurationMinutes} phút</span></p></div><div className="mt-4 flex justify-end"><button onClick={() => navigate(`/court/${court.id}`)} className="rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white">Xem chi tiết</button></div></div>
            </article>
          ))}
          {!loading && !courts.length && <p className="rounded-lg border border-dashed border-outline-variant p-10 text-center text-secondary">Không tìm thấy sân phù hợp.</p>}
        </div>
      </section>

      <section className="relative hidden h-full w-[40%] md:block">
        {selectedCourt ? <LocationMap latitude={selectedCourt.latitude} longitude={selectedCourt.longitude} className="h-full" /> : <div className="flex h-full items-center justify-center bg-surface text-secondary">Chưa có vị trí sân</div>}
        {selectedCourt && <div className="absolute left-4 top-4 z-[500] max-w-[280px] rounded-lg border border-outline-variant bg-white p-3 shadow-lg"><p className="text-[13px] font-bold">{selectedCourt.name}</p><p className="mt-1 text-[12px] text-secondary">{selectedCourt.venueName}</p></div>}
      </section>
    </div>
  );
};
