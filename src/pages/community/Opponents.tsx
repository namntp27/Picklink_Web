import { useEffect, useMemo, useRef, useState } from 'react';
import { divIcon, latLng, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { CalendarRange, Crosshair, ListChecks, MapPin, PlusCircle, Search, Sparkles, Trophy } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { createMatch, searchMatchVenues, type MatchFormat, type MatchPreferredVenue } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';

type PlayerLocation = { latitude: number; longitude: number };

const hanoiCenter: LatLngTuple = [21.0285, 105.8542];
const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const markerIcon = (selected: boolean) => divIcon({
  className: '',
  html: `<div style="width:${selected ? 38 : 32}px;height:${selected ? 38 : 32}px;border-radius:50% 50% 50% 0;background:${selected ? '#173f00' : '#438500'};border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,.35);transform:rotate(-45deg);display:grid;place-items:center"><div style="width:9px;height:9px;border-radius:50%;background:white"></div></div>`,
  iconAnchor: selected ? [19, 38] : [16, 32],
  popupAnchor: [0, selected ? -38 : -32],
});

const playerLocationIcon = divIcon({
  className: '',
  html: '<div style="width:24px;height:24px;border-radius:50%;background:#2563eb;border:4px solid white;box-shadow:0 0 0 4px rgba(37,99,235,.22),0 3px 12px rgba(0,0,0,.35)"></div>',
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

const MapViewport = ({
  venues,
  location,
  radiusKm,
}: {
  venues: MatchPreferredVenue[];
  location: PlayerLocation | null;
  radiusKm: number;
}) => {
  const map = useMap();

  useEffect(() => {
    if (location) {
      const radiusBounds = latLng(location.latitude, location.longitude).toBounds(radiusKm * 2_000);
      map.fitBounds(radiusBounds, { padding: [36, 36], maxZoom: 16 });
      return;
    }

    const points = venues
      .filter((venue) => venue.latitude != null && venue.longitude != null)
      .map((venue) => [venue.latitude!, venue.longitude!] as LatLngTuple);
    if (points.length > 1) map.fitBounds(points as LatLngBoundsExpression, { padding: [40, 40], maxZoom: 15 });
    else if (points.length === 1) map.setView(points[0], 15);
  }, [location, map, radiusKm, venues]);

  return null;
};

export const Opponents = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [title, setTitle] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [location, setLocation] = useState<PlayerLocation | null>(null);
  const [venues, setVenues] = useState<MatchPreferredVenue[]>([]);
  const [selectedVenueIds, setSelectedVenueIds] = useState<number[]>([]);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [timeFrom, setTimeFrom] = useState('18:00');
  const [timeTo, setTimeTo] = useState('20:00');
  const [minSkill, setMinSkill] = useState(2);
  const [maxSkill, setMaxSkill] = useState(4);
  const [format, setFormat] = useState<MatchFormat>('2vs2');
  const [neededPlayers, setNeededPlayers] = useState(3);
  const [note, setNote] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState('');
  const venueRequestId = useRef(0);

  const capacity = format === '1vs1' ? 2 : 4;
  const neededOptions = useMemo(() => Array.from({ length: capacity - 1 }, (_, index) => index + 1), [capacity]);

  useEffect(() => {
    let isActive = true;
    const requestId = ++venueRequestId.current;
    setIsSearching(true);
    searchMatchVenues({ radiusKm: 50 })
      .then((result) => {
        if (!isActive || requestId !== venueRequestId.current) return;
        setVenues(result);
      })
      .catch(() => {
        if (!isActive || requestId !== venueRequestId.current) return;
        setError('Không thể tải vị trí các cụm sân trên bản đồ.');
      })
      .finally(() => {
        if (isActive && requestId === venueRequestId.current) setIsSearching(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const loadVenuesInRadius = async (playerLocation: PlayerLocation, nextRadiusKm: number) => {
    const requestId = ++venueRequestId.current;
    setIsSearching(true);
    try {
      const result = await searchMatchVenues({
        radiusKm: nextRadiusKm,
        latitude: playerLocation.latitude,
        longitude: playerLocation.longitude,
      });
      if (requestId !== venueRequestId.current) return;
      setVenues(result);
      setSelectedVenueIds((current) => current.filter((id) => result.some((venue) => venue.venueId === id)));
      setError(result.length === 0 ? `Không có cụm sân nào trong bán kính ${nextRadiusKm} km từ vị trí của bạn.` : '');
    } catch (reason) {
      if (requestId !== venueRequestId.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải các cụm sân trong bán kính đã chọn.');
    } finally {
      if (requestId === venueRequestId.current) setIsSearching(false);
    }
  };

  const locate = (nextRadiusKm = radiusKm) => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const playerLocation = { latitude: coords.latitude, longitude: coords.longitude };
        setLocation(playerLocation);
        setError('');
        setIsLocating(false);
        void loadVenuesInRadius(playerLocation, nextRadiusKm);
      },
      () => {
        setError('Không thể lấy vị trí hiện tại. Bạn vẫn có thể tìm sân theo địa chỉ.');
        setIsLocating(false);
      },
      { enableHighAccuracy: false, timeout: 8_000, maximumAge: 300_000 },
    );
  };

  const changeRadius = (nextRadiusKm: number) => {
    setRadiusKm(nextRadiusKm);
    if (location) {
      void loadVenuesInRadius(location, nextRadiusKm);
      return;
    }
    locate(nextRadiusKm);
  };

  const searchVenues = async () => {
    if (!province.trim() || !ward.trim()) {
      setError('Vui lòng nhập tỉnh/thành phố và xã/phường trước khi tìm sân.');
      return;
    }
    const requestId = ++venueRequestId.current;
    setIsSearching(true);
    try {
      const result = await searchMatchVenues({
        province: province.trim(),
        ward: ward.trim(),
        radiusKm,
        latitude: location?.latitude,
        longitude: location?.longitude,
      });
      if (requestId !== venueRequestId.current) return;
      setVenues(result);
      setSelectedVenueIds((current) => current.filter((id) => result.some((venue) => venue.venueId === id)));
      setError(result.length === 0 ? 'Chưa tìm thấy cụm sân phù hợp. Hãy tăng bán kính hoặc kiểm tra lại khu vực.' : '');
    } catch (reason) {
      if (requestId !== venueRequestId.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tìm cụm sân.');
    } finally {
      if (requestId === venueRequestId.current) setIsSearching(false);
    }
  };

  const toggleVenue = (venueId: number) => {
    setSelectedVenueIds((current) =>
      current.includes(venueId) ? current.filter((id) => id !== venueId) : [...current, venueId]);
  };

  const changeFormat = (value: MatchFormat) => {
    setFormat(value);
    setNeededPlayers(value === '1vs1' ? 1 : 3);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!title.trim() || !province.trim() || !ward.trim() || selectedVenueIds.length === 0) {
      setError('Vui lòng nhập đủ nội dung và chọn ít nhất một cụm sân mong muốn.');
      return;
    }
    if (dateTo < dateFrom || timeTo <= timeFrom || maxSkill < minSkill) {
      setError('Khoảng ngày, giờ hoặc trình độ chưa hợp lệ.');
      return;
    }

    setIsCreating(true);
    try {
      const match = await createMatch(token, {
        title: title.trim(),
        province: province.trim(),
        ward: ward.trim(),
        searchRadiusKm: radiusKm,
        searchLatitude: location?.latitude,
        searchLongitude: location?.longitude,
        preferredVenueIds: selectedVenueIds,
        availableDateFrom: dateFrom,
        availableDateTo: dateTo,
        preferredTimeStart: timeFrom,
        preferredTimeEnd: timeTo,
        minSkillLevel: minSkill,
        maxSkillLevel: maxSkill,
        matchType: format,
        neededPlayerCount: neededPlayers,
        note: note.trim() || undefined,
      });
      navigate(`/matches/${match.matchId}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đăng lời mời ghép trận.');
    } finally {
      setIsCreating(false);
    }
  };

  const inputClass = 'h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
  const roomExpired = searchParams.get('expired') === '1';

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-10 md:px-margin-desktop">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold">
            <Sparkles className="h-4 w-4" /> Ghép người trước, đặt sân sau
          </span>
          <h1 className="mt-4 text-[34px] font-bold md:text-[44px]">Tạo lời mời ghép trận</h1>
          <p className="mt-3 max-w-3xl text-[16px] leading-7 text-white/85">
            Khai báo khu vực và khoảng thời gian bạn có thể chơi. Hệ thống chưa giữ sân;
            cả nhóm sẽ chọn lịch chính xác sau khi đủ người.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-[14px] font-bold text-primary" to="/opponents">
              <ListChecks className="h-5 w-5" /> Xem danh sách lời mời
            </Link>
            <Link className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-3 text-[14px] font-bold" to="/my-matches">
              <Trophy className="h-5 w-5" /> Phòng của tôi
            </Link>
          </div>
        </div>
      </section>

      {roomExpired && (
        <div className="mx-auto mt-6 max-w-[1200px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-800">
          Lời mời đã hết khoảng ngày có thể chơi và được chuyển sang trạng thái Hết hạn.
        </div>
      )}

      <main className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[470px_minmax(0,1fr)]">
        <form className="space-y-5 rounded-xl border border-outline-variant bg-white p-5 shadow-sm" onSubmit={submit}>
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-white"><PlusCircle className="h-6 w-6" /></div>
            <div><h2 className="text-[21px] font-bold">Thông tin lời mời</h2><p className="text-[13px] text-on-surface-variant">Không khóa sân ở bước này</p></div>
          </div>
          {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}

          <label className="block">
            <span className="mb-1 block text-[13px] font-bold">Tiêu đề lời mời</span>
            <input className={inputClass} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Tìm đội đánh đôi buổi tối" value={title} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label><span className="mb-1 block text-[13px] font-bold">Tỉnh/thành phố</span><input className={inputClass} maxLength={100} onChange={(event) => setProvince(event.target.value)} placeholder="Hà Nội" value={province} /></label>
            <label><span className="mb-1 block text-[13px] font-bold">Xã/phường</span><input className={inputClass} maxLength={150} onChange={(event) => setWard(event.target.value)} placeholder="Cầu Giấy" value={ward} /></label>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <label>
              <span className="mb-1 block text-[13px] font-bold">Bán kính tìm sân</span>
              <select className={inputClass} onChange={(event) => changeRadius(Number(event.target.value))} value={radiusKm}>
                {[2, 3, 5, 10, 20, 30].map((value) => <option key={value} value={value}>{value} km</option>)}
              </select>
            </label>
            <button className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg border border-primary px-3 text-[13px] font-bold text-primary" disabled={isLocating} onClick={() => locate()} type="button">
              <Crosshair className="h-4 w-4" /> {isLocating ? 'Đang định vị' : location ? 'Đã định vị' : 'Vị trí'}
            </button>
          </div>

          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-[14px] font-bold text-primary" disabled={isSearching} onClick={() => void searchVenues()} type="button">
            <Search className="h-5 w-5" /> {isSearching ? 'Đang tìm sân...' : 'Tìm cụm sân trong khu vực'}
          </button>

          <div>
            <p className="mb-2 text-[13px] font-bold">Cụm sân mong muốn ({selectedVenueIds.length} đã chọn)</p>
            <div className="max-h-52 space-y-2 overflow-y-auto rounded-lg border border-outline-variant p-2">
              {venues.map((venue) => (
                <label className={`flex cursor-pointer gap-3 rounded-lg p-3 ${selectedVenueIds.includes(venue.venueId) ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`} key={venue.venueId}>
                  <input checked={selectedVenueIds.includes(venue.venueId)} className="mt-1 accent-primary" onChange={() => toggleVenue(venue.venueId)} type="checkbox" />
                  <span>
                    <strong className="block text-[14px]">{venue.venueName}</strong>
                    <span className="mt-1 block text-[12px] leading-5 text-on-surface-variant">{venue.address}</span>
                    {venue.distanceKm != null && <span className="text-[12px] font-bold text-primary">{venue.distanceKm} km</span>}
                  </span>
                </label>
              ))}
              {venues.length === 0 && <p className="p-4 text-center text-[13px] text-on-surface-variant">{isSearching ? 'Đang tải các cụm sân...' : 'Chưa có cụm sân nào có tọa độ.'}</p>}
            </div>
          </div>

          <div className="rounded-lg border border-primary/20 bg-[#f3f9eb] p-4">
            <p className="mb-3 flex items-center gap-2 text-[14px] font-bold"><CalendarRange className="h-5 w-5 text-primary" /> Khoảng có thể chơi</p>
            <div className="grid grid-cols-2 gap-3">
              <label><span className="mb-1 block text-[12px] font-bold">Từ ngày</span><input className={inputClass} min={today()} onChange={(event) => { setDateFrom(event.target.value); if (event.target.value > dateTo) setDateTo(event.target.value); }} type="date" value={dateFrom} /></label>
              <label><span className="mb-1 block text-[12px] font-bold">Đến ngày</span><input className={inputClass} min={dateFrom} onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} /></label>
              <label><span className="mb-1 block text-[12px] font-bold">Giờ bắt đầu</span><input className={inputClass} onChange={(event) => setTimeFrom(event.target.value)} type="time" value={timeFrom} /></label>
              <label><span className="mb-1 block text-[12px] font-bold">Giờ kết thúc</span><input className={inputClass} onChange={(event) => setTimeTo(event.target.value)} type="time" value={timeTo} /></label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label><span className="mb-1 block text-[13px] font-bold">Trình độ tối thiểu</span><select className={inputClass} onChange={(event) => setMinSkill(Number(event.target.value))} value={minSkill}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span className="mb-1 block text-[13px] font-bold">Trình độ tối đa</span><select className={inputClass} onChange={(event) => setMaxSkill(Number(event.target.value))} value={maxSkill}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-2 text-[13px] font-bold">Hình thức</p>
              <div className="grid grid-cols-2 gap-2">
                {(['1vs1', '2vs2'] as const).map((value) => (
                  <button className={`rounded-lg border px-3 py-3 text-[14px] font-bold ${format === value ? 'border-primary bg-primary text-white' : 'border-outline-variant'}`} key={value} onClick={() => changeFormat(value)} type="button">{value}</button>
                ))}
              </div>
            </div>
            <label><span className="mb-2 block text-[13px] font-bold">Số người cần tìm</span><select className={`${inputClass} h-[46px]`} onChange={(event) => setNeededPlayers(Number(event.target.value))} value={neededPlayers}>{neededOptions.map((value) => <option key={value} value={value}>{value} người</option>)}</select></label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[13px] font-bold">Mô tả hoặc yêu cầu bổ sung</span>
            <textarea className="min-h-24 w-full resize-none rounded-lg border border-outline-variant p-3 text-[14px] outline-none focus:border-primary" maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Phong cách chơi, yêu cầu đúng giờ..." value={note} />
          </label>

          <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[15px] font-bold text-white disabled:opacity-50" disabled={isCreating} type="submit">
            <PlusCircle className="h-5 w-5" /> {isCreating ? 'Đang đăng...' : 'Đăng lời mời'}
          </button>
        </form>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="text-[22px] font-bold">Các cụm sân phù hợp</h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">Bản đồ chỉ để chọn danh sách mong muốn; chưa có sân hoặc khung giờ nào được giữ.</p>
          </div>
          <div className="h-[760px] bg-surface-container">
            <MapContainer center={location ? [location.latitude, location.longitude] : hanoiCenter} className="h-full w-full" scrollWheelZoom zoom={12}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapViewport location={location} radiusKm={radiusKm} venues={venues} />
              {location && (
                <Circle
                  center={[location.latitude, location.longitude]}
                  pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.14, opacity: 0.9, weight: 2 }}
                  radius={radiusKm * 1_000}
                />
              )}
              {location && (
                <Marker icon={playerLocationIcon} position={[location.latitude, location.longitude]} zIndexOffset={1000}>
                  <Popup>
                    <strong>Vị trí của bạn</strong>
                    <p className="my-1 text-[12px] text-gray-600">Tâm của bán kính tìm sân</p>
                  </Popup>
                </Marker>
              )}
              {venues.filter((venue) => venue.latitude != null && venue.longitude != null).map((venue) => (
                <Marker eventHandlers={{ click: () => toggleVenue(venue.venueId) }} icon={markerIcon(selectedVenueIds.includes(venue.venueId))} key={venue.venueId} position={[venue.latitude!, venue.longitude!]}>
                  <Popup minWidth={220}><strong>{venue.venueName}</strong><p className="my-2 text-[12px]">{venue.address}</p><button className="text-[12px] font-bold text-primary" onClick={() => toggleVenue(venue.venueId)} type="button">{selectedVenueIds.includes(venue.venueId) ? 'Bỏ chọn' : 'Chọn cụm sân'}</button></Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="flex items-start gap-3 border-t border-outline-variant p-4 text-[13px] text-on-surface-variant">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            Khi đủ thành viên, chủ phòng sẽ chọn một sân con, ngày và giờ chính xác trong phạm vi đã khai báo.
          </div>
        </section>
      </main>
    </div>
  );
};
