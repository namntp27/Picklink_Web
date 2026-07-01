import { useEffect, useMemo, useRef, useState } from 'react';
import { divIcon, latLng, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { CalendarRange, Crosshair, ListChecks, MapPin, PlusCircle, Search, Sparkles, Trophy } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { createMatch, searchMatchVenues, type MatchFormat, type MatchPreferredVenue } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { CommunityHero, CommunityPage } from '../community/CommunityUI';

type PlayerLocation = { latitude: number; longitude: number };
type ReverseGeocodeAddress = Record<string, string | undefined>;
type ReverseGeocodeResponse = { address?: ReverseGeocodeAddress };

const hanoiCenter: LatLngTuple = [21.0285, 105.8542];
const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const administrativePrefixes = /^(thành phố|tỉnh|tp\.?|phường|xã|thị trấn|quận|huyện|thị xã)\s+/i;
const normalizeAreaName = (value: string) => value.trim().replace(administrativePrefixes, '').trim();
const pickAddressPart = (address: ReverseGeocodeAddress | undefined, keys: string[]) => {
  if (!address) return '';
  for (const key of keys) {
    const value = address[key]?.trim();
    if (value) return normalizeAreaName(value);
  }
  return '';
};

const reversePlayerArea = async (location: PlayerLocation) => {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(location.latitude),
    lon: String(location.longitude),
    zoom: '18',
    addressdetails: '1',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
    headers: { 'Accept-Language': 'vi' },
  });
  if (!response.ok) throw new Error('Reverse geocoding failed.');

  const result = await response.json() as ReverseGeocodeResponse;
  const address = result.address;
  return {
    province: pickAddressPart(address, ['city', 'state', 'province', 'town', 'municipality']),
    ward: pickAddressPart(address, ['ward', 'suburb', 'quarter', 'neighbourhood', 'village', 'hamlet', 'municipality', 'city_district', 'county']),
  };
};

const markerIcon = (selected: boolean) => divIcon({
  className: '',
  html: `<div style="width:${selected ? 38 : 32}px;height:${selected ? 38 : 32}px;border-radius:50% 50% 50% 0;background:${selected ? '#477313' : '#98D951'};border:3px solid white;box-shadow:0 3px 12px rgba(22,26,18,.24);transform:rotate(-45deg);display:grid;place-items:center"><div style="width:9px;height:9px;border-radius:50%;background:${selected ? '#98D951' : '#17310A'}"></div></div>`,
  iconAnchor: selected ? [19, 38] : [16, 32],
  popupAnchor: [0, selected ? -38 : -32],
});

const playerLocationIcon = divIcon({
  className: '',
  html: '<div style="width:24px;height:24px;border-radius:50%;background:#477313;border:4px solid white;box-shadow:0 0 0 4px rgba(152,217,81,.28),0 3px 12px rgba(22,26,18,.24)"></div>',
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
  const [locationAreaStatus, setLocationAreaStatus] = useState('');
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
    setLocationAreaStatus('Đang lấy vị trí hiện tại...');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const playerLocation = { latitude: coords.latitude, longitude: coords.longitude };
        setLocation(playerLocation);
        setError('');
        setLocationAreaStatus('Đã lấy tọa độ, đang xác định thành phố và xã/phường...');
        void loadVenuesInRadius(playerLocation, nextRadiusKm);

        try {
          const area = await reversePlayerArea(playerLocation);
          if (area.province) setProvince(area.province);
          if (area.ward) setWard(area.ward);

          const areaLabel = [area.ward, area.province].filter(Boolean).join(', ');
          setLocationAreaStatus(areaLabel
            ? `Đã xác định: ${areaLabel}`
            : 'Đã lấy tọa độ nhưng chưa xác định được thành phố và xã/phường.');
        } catch {
          setLocationAreaStatus('Đã lấy tọa độ nhưng chưa xác định được thành phố và xã/phường. Bạn có thể nhập thủ công.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setError('Không thể lấy vị trí hiện tại. Bạn vẫn có thể tìm sân theo địa chỉ.');
        setLocationAreaStatus('');
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

  const inputClass = 'community-control';
  const roomExpired = searchParams.get('expired') === '1';

  return (
    <CommunityPage>
      <CommunityHero
        actions={(
          <>
            <Link className="community-button" to="/opponents">
              <ListChecks aria-hidden="true" className="h-4 w-4" />
              Danh sách lời mời
            </Link>
            <Link className="community-button-secondary" to="/my-matches">
              <Trophy aria-hidden="true" className="h-4 w-4" />
              Phòng của tôi
            </Link>
          </>
        )}
        description="Chọn khu vực và khoảng thời gian. Cả nhóm sẽ chốt sân sau khi đủ người."
        icon={Sparkles}
        label="Ghép người trước, đặt sân sau"
        stats={(
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[24px] font-extrabold text-[#e2ff57]">{selectedVenueIds.length}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/65">cụm sân đã chọn</p>
            </div>
            <div>
              <p className="font-mono text-[24px] font-extrabold text-[#e2ff57]">{neededPlayers}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/65">người cần tìm</p>
            </div>
          </div>
        )}
        title="Tạo lời mời ghép trận"
      />

      {roomExpired && (
        <div className="mx-auto mt-5 max-w-[1216px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-800">
          Lời mời đã hết khoảng ngày có thể chơi và được chuyển sang trạng thái Hết hạn.
        </div>
      )}

      <main className="community-container grid items-start gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
        <form className="community-panel space-y-4 p-4 sm:p-5" onSubmit={submit}>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#0b2228] text-[#e2ff57]"><PlusCircle className="h-5 w-5" /></div>
            <div><h2 className="text-[17px] font-extrabold text-[#0b2228]">Thông tin lời mời</h2><p className="text-[11px] font-semibold text-[#718077]">Không khóa sân ở bước này</p></div>
          </div>
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-[12px] font-bold text-red-700">{error}</div>}

          <label className="block">
            <span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Tiêu đề lời mời</span>
            <input className={inputClass} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Tìm đội đánh đôi buổi tối" value={title} />
          </label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label><span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Tỉnh/thành phố</span><input className={inputClass} maxLength={100} onChange={(event) => setProvince(event.target.value)} placeholder="Hà Nội" value={province} /></label>
            <label><span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Xã/phường</span><input className={inputClass} maxLength={150} onChange={(event) => setWard(event.target.value)} placeholder="Cầu Giấy" value={ward} /></label>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <label>
              <span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Bán kính tìm sân</span>
              <select className={inputClass} onChange={(event) => changeRadius(Number(event.target.value))} value={radiusKm}>
                {[2, 3, 5, 10, 20, 30].map((value) => <option key={value} value={value}>{value} km</option>)}
              </select>
            </label>
            <button className="community-button-secondary mt-[22px] !h-10" disabled={isLocating} onClick={() => locate()} type="button">
              <Crosshair className="h-4 w-4" /> {isLocating ? 'Đang định vị' : location ? 'Đã định vị' : 'Vị trí'}
            </button>
          </div>
          {locationAreaStatus && <p className="text-[11px] font-semibold leading-5 text-[#718077]">{locationAreaStatus}</p>}

          <button className="community-button-secondary w-full" disabled={isSearching} onClick={() => void searchVenues()} type="button">
            <Search className="h-5 w-5" /> {isSearching ? 'Đang tìm sân...' : 'Tìm cụm sân trong khu vực'}
          </button>

          <div>
            <p className="mb-2 text-[12px] font-extrabold text-[#526158]">Cụm sân mong muốn ({selectedVenueIds.length} đã chọn)</p>
            <div className="community-scroll max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[#d8e4d4] p-2">
              {venues.map((venue) => (
                <label className={`flex cursor-pointer gap-3 rounded-[10px] p-2.5 transition-colors ${selectedVenueIds.includes(venue.venueId) ? 'bg-[#edf5e9]' : 'hover:bg-[#f4f8f2]'}`} key={venue.venueId}>
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

          <div className="rounded-xl border border-[#cfe0c8] bg-[#f0f6ed] p-3.5">
            <p className="mb-3 flex items-center gap-2 text-[13px] font-extrabold"><CalendarRange className="h-4 w-4 text-[#477313]" /> Khoảng có thể chơi</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label><span className="mb-1 block text-[12px] font-bold">Từ ngày</span><input className={inputClass} min={today()} onChange={(event) => { setDateFrom(event.target.value); if (event.target.value > dateTo) setDateTo(event.target.value); }} type="date" value={dateFrom} /></label>
              <label><span className="mb-1 block text-[12px] font-bold">Đến ngày</span><input className={inputClass} min={dateFrom} onChange={(event) => setDateTo(event.target.value)} type="date" value={dateTo} /></label>
              <label><span className="mb-1 block text-[12px] font-bold">Giờ bắt đầu</span><input className={inputClass} onChange={(event) => setTimeFrom(event.target.value)} type="time" value={timeFrom} /></label>
              <label><span className="mb-1 block text-[12px] font-bold">Giờ kết thúc</span><input className={inputClass} onChange={(event) => setTimeTo(event.target.value)} type="time" value={timeTo} /></label>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label><span className="mb-1 block text-[13px] font-bold">Trình độ tối thiểu</span><select className={inputClass} onChange={(event) => setMinSkill(Number(event.target.value))} value={minSkill}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
            <label><span className="mb-1 block text-[13px] font-bold">Trình độ tối đa</span><select className={inputClass} onChange={(event) => setMaxSkill(Number(event.target.value))} value={maxSkill}>{[1, 2, 3, 4, 5].map((value) => <option key={value}>{value}</option>)}</select></label>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[13px] font-bold">Hình thức</p>
              <div className="grid grid-cols-2 gap-2">
                {(['1vs1', '2vs2'] as const).map((value) => (
                  <button className={`min-h-10 rounded-[10px] border px-3 text-[13px] font-extrabold transition-colors ${format === value ? 'border-[#0b2228] bg-[#0b2228] text-white' : 'border-[#d8e4d4] hover:bg-[#edf5e9]'}`} key={value} onClick={() => changeFormat(value)} type="button">{value}</button>
                ))}
              </div>
            </div>
            <label><span className="mb-2 block text-[12px] font-extrabold text-[#526158]">Số người cần tìm</span><select className={inputClass} onChange={(event) => setNeededPlayers(Number(event.target.value))} value={neededPlayers}>{neededOptions.map((value) => <option key={value} value={value}>{value} người</option>)}</select></label>
          </div>

          <label className="block">
            <span className="mb-1 block text-[13px] font-bold">Mô tả hoặc yêu cầu bổ sung</span>
            <textarea className="community-control min-h-24" maxLength={1000} onChange={(event) => setNote(event.target.value)} placeholder="Phong cách chơi, yêu cầu đúng giờ..." value={note} />
          </label>

          <button className="community-button w-full" disabled={isCreating} type="submit">
            <PlusCircle className="h-5 w-5" /> {isCreating ? 'Đang đăng...' : 'Đăng lời mời'}
          </button>
        </form>

        <section className="community-panel overflow-hidden xl:sticky xl:top-20">
          <div className="border-b border-[#d8e4d4] p-4">
            <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#0b2228]">Các cụm sân phù hợp</h2>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-[#718077]">Bản đồ dùng để chọn danh sách mong muốn. Chưa có sân hoặc khung giờ nào được giữ.</p>
          </div>
          <div className="h-[420px] bg-[#e7eee4] sm:h-[520px] xl:h-[calc(100dvh-190px)] xl:min-h-[540px] xl:max-h-[720px]">
            <MapContainer center={location ? [location.latitude, location.longitude] : hanoiCenter} className="h-full w-full" scrollWheelZoom zoom={12}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapViewport location={location} radiusKm={radiusKm} venues={venues} />
              {location && (
                <Circle
                  center={[location.latitude, location.longitude]}
                  pathOptions={{ color: '#477313', fillColor: '#98D951', fillOpacity: 0.14, opacity: 0.9, weight: 2 }}
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
          <div className="flex items-start gap-3 border-t border-[#d8e4d4] p-3.5 text-[11px] font-semibold leading-5 text-[#66756b]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#477313]" />
            Khi đủ thành viên, chủ phòng sẽ chọn một sân con, ngày và giờ chính xác trong phạm vi đã khai báo.
          </div>
        </section>
      </main>
    </CommunityPage>
  );
};
