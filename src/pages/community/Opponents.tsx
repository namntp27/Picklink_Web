import { useEffect, useMemo, useRef, useState } from 'react';
import { divIcon, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { CalendarClock, Crosshair, ListChecks, MapPin, PlusCircle, Sparkles, Trophy } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { getBookingVenues, getCourtAvailability, type BookingVenue, type CourtAvailability } from '../../api/booking';
import { createMatch } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { useVenueRealtime } from '../../hooks/useVenueRealtime';

type MatchFormat = '1vs1' | '2vs2';
type LocatedVenue = BookingVenue & { latitude: number; longitude: number };

export const provinceOptions = ['Hà Nội', 'Hồ Chí Minh', 'Việt Nam'];
const pendingCourtOptions = [
  { id: 'hn-duy-tan', province: 'Hà Nội', ward: 'Phường Cầu Giấy', name: 'Pickleball Pro Duy Tân' },
  { id: 'hn-my-dinh', province: 'Hà Nội', ward: 'Phường Từ Liêm', name: 'PickleHub Mỹ Đình' },
  { id: 'hcm-ky-hoa', province: 'Hồ Chí Minh', ward: 'Phường Hòa Hưng', name: 'Sân Kỳ Hòa Pickleball' },
];
export const getCourtsByProvince = (province: string) => pendingCourtOptions.filter((court) => court.province === province);
export const getWardsByProvince = (province: string) => Array.from(new Set(getCourtsByProvince(province).map((court) => court.ward)));

const hanoiCenter: LatLngTuple = [21.0285, 105.8542];
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const localDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};
const time = (value: string) => value.slice(11, 16);
const timeToMinutes = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};
const formatDate = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(`${value}T00:00:00`));

const isLocatedVenue = (venue: BookingVenue): venue is LocatedVenue =>
  typeof venue.latitude === 'number' && Number.isFinite(venue.latitude)
  && typeof venue.longitude === 'number' && Number.isFinite(venue.longitude);

const venueIcon = (selected: boolean) => divIcon({
  className: '',
  html: `<div style="width:${selected ? 38 : 32}px;height:${selected ? 38 : 32}px;border-radius:50% 50% 50% 0;background:${selected ? '#173f00' : '#438500'};border:3px solid white;box-shadow:0 3px 12px rgba(0,0,0,.35);transform:rotate(-45deg);display:grid;place-items:center"><div style="width:9px;height:9px;border-radius:50%;background:white"></div></div>`,
  iconAnchor: selected ? [19, 38] : [16, 32],
  popupAnchor: [0, selected ? -38 : -32],
  iconSize: selected ? [38, 38] : [32, 32],
});

const playerIcon = divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#2563eb;border:4px solid white;box-shadow:0 0 0 3px rgba(37,99,235,.25),0 3px 12px rgba(0,0,0,.3)"></div>',
  iconAnchor: [11, 11],
  iconSize: [22, 22],
});

const MapViewport = ({ venues, selectedVenue }: { venues: LocatedVenue[]; selectedVenue?: LocatedVenue }) => {
  const map = useMap();
  useEffect(() => {
    const points: LatLngTuple[] = venues.map((venue) => [venue.latitude, venue.longitude]);
    if (points.length > 1) map.fitBounds(points as LatLngBoundsExpression, { padding: [42, 42], maxZoom: 15 });
    else if (points.length === 1) map.setView(points[0], 15);
  }, [map, venues]);
  useEffect(() => {
    if (selectedVenue) map.flyTo([selectedVenue.latitude, selectedVenue.longitude], Math.max(map.getZoom(), 15), { duration: 0.7 });
  }, [map, selectedVenue]);
  return null;
};

export const Opponents = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const importedVenueId = Number(searchParams.get('venueId'));
  const importedCourtId = Number(searchParams.get('courtId'));
  const importedDate = searchParams.get('date') ?? '';
  const importedStart = searchParams.get('start') ?? '';
  const importedEnd = searchParams.get('end') ?? '';
  const roomExpired = searchParams.get('expired') === '1';

  const [venues, setVenues] = useState<BookingVenue[]>([]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(importedVenueId > 0 ? importedVenueId : null);
  const [bookingDate, setBookingDate] = useState(/^\d{4}-\d{2}-\d{2}$/.test(importedDate) ? importedDate : localDate());
  const [availability, setAvailability] = useState<CourtAvailability | null>(null);
  const [selectedCourtId, setSelectedCourtId] = useState<number | null>(importedCourtId > 0 ? importedCourtId : null);
  const [startTime, setStartTime] = useState(importedStart);
  const [endTime, setEndTime] = useState(importedEnd);
  const [level, setLevel] = useState('3.0 - 3.5');
  const [format, setFormat] = useState<MatchFormat>('2vs2');
  const [note, setNote] = useState('');
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [playerLocation, setPlayerLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    setIsLoadingMap(true);
    getBookingVenues({}, token)
      .then((items) => { setVenues(items); setError(''); })
      .catch(() => setError('Không thể tải danh sách sân.'))
      .finally(() => setIsLoadingMap(false));
  }, [token]);

  useEffect(() => {
    if (!selectedVenueId) {
      setAvailability(null);
      return;
    }
    setIsLoadingSchedule(true);
    getCourtAvailability(selectedVenueId, bookingDate, token)
      .then((data) => {
        setAvailability(data);
        setSelectedCourtId((current) => data.courts.some((court) => court.courtId === current) ? current : data.courts[0]?.courtId ?? null);
        setError('');
      })
      .catch(() => {
        setAvailability(null);
        setError('Không thể tải lịch trống của sân đã chọn.');
      })
      .finally(() => setIsLoadingSchedule(false));
  }, [bookingDate, selectedVenueId, token]);

  useScheduleRealtime((event) => {
    if (event.venueId !== selectedVenueId || event.startTime.slice(0, 10) !== bookingDate) return;
    getCourtAvailability(event.venueId, bookingDate, token)
      .then(setAvailability)
      .catch(() => setError('Không thể đồng bộ lịch sân mới nhất.'));
  });
  useVenueRealtime(() => {
    getBookingVenues({}, token)
      .then(setVenues)
      .catch(() => setError('Không thể đồng bộ danh sách sân mới nhất.'));
  });

  const mappedVenues = useMemo(() => venues.filter(isLocatedVenue), [venues]);
  const selectedVenue = venues.find((venue) => venue.venueId === selectedVenueId);
  const selectedMappedVenue = mappedVenues.find((venue) => venue.venueId === selectedVenueId);
  const selectedCourt = availability?.courts.find((court) => court.courtId === selectedCourtId);
  const availableSlots = useMemo(() => availability?.slots
    .filter((slot) => slot.courtId === selectedCourtId && slot.status === 'Available' && new Date(slot.startTime).getTime() > Date.now())
    .sort((left, right) => left.startTime.localeCompare(right.startTime)) ?? [], [availability, selectedCourtId]);
  const startOptions = useMemo(() => Array.from(new Set(availableSlots.map((slot) => time(slot.startTime)))), [availableSlots]);
  const endOptions = useMemo(() => {
    if (!startTime) return [];
    const startsAt = availableSlots.findIndex((slot) => time(slot.startTime) === startTime);
    if (startsAt < 0) return [];
    const values: string[] = [];
    for (let index = startsAt; index < availableSlots.length; index += 1) {
      const slot = availableSlots[index];
      if (index > startsAt && time(slot.startTime) !== time(availableSlots[index - 1].endTime)) break;
      values.push(time(slot.endTime));
    }
    return values;
  }, [availableSlots, startTime]);

  const durationHours = startTime && endTime ? Math.max(0, (timeToMinutes(endTime) - timeToMinutes(startTime)) / 60) : 0;
  const totalAmount = Math.ceil((selectedCourt?.hourlyPrice ?? 0) * durationHours);
  const requiredPlayers = format === '1vs1' ? 2 : 4;
  const amountPerPlayer = requiredPlayers > 0 ? Math.ceil(totalAmount / requiredPlayers) : 0;
  const canCreate = Boolean(selectedVenueId && selectedCourtId && bookingDate && startTime && endTime && durationHours > 0);

  const chooseVenue = (venueId: number) => {
    setSelectedVenueId(venueId);
    setSelectedCourtId(null);
    setStartTime('');
    setEndTime('');
  };
  const chooseDate = (value: string) => {
    setBookingDate(value);
    setStartTime('');
    setEndTime('');
  };
  const chooseCourt = (value: number) => {
    setSelectedCourtId(value);
    setStartTime('');
    setEndTime('');
  };
  const chooseStart = (value: string) => {
    setStartTime(value);
    setEndTime('');
  };

  const locatePlayer = () => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị.');
      return;
    }
    if (!window.isSecureContext) {
      setError('Định vị chỉ hoạt động trên HTTPS hoặc localhost.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const location = { latitude: coords.latitude, longitude: coords.longitude };
        setPlayerLocation(location);
        mapRef.current?.flyTo([location.latitude, location.longitude], 16, { duration: 0.8 });
        setError('');
        setIsLocating(false);
      },
      (locationError) => {
        setError(locationError.code === locationError.PERMISSION_DENIED
          ? 'Bạn chưa cấp quyền truy cập vị trí.'
          : 'Không thể xác định vị trí hiện tại.');
        setIsLocating(false);
      },
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 20_000 },
    );
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) { navigate('/login'); return; }
    if (!canCreate || !selectedCourtId) {
      window.alert('Vui lòng nhập đầy đủ sân, ngày và khung giờ.');
      return;
    }
    setIsCreating(true);
    try {
      const match = await createMatch(token, {
        courtId: selectedCourtId,
        matchType: format,
        matchSkillLevel: Math.max(1, Math.min(5, Math.round(Number.parseFloat(level)))),
        startTime: `${bookingDate}T${startTime}:00`,
        endTime: `${bookingDate}T${endTime}:00`,
        note: note.trim() || undefined,
      });
      navigate(`/matches/${match.matchId}`);
    } catch (reason) {
      window.alert(reason instanceof Error ? reason.message : 'Không thể tạo lời mời ghép trận.');
    } finally {
      setIsCreating(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-outline-variant bg-white px-3 py-3 text-[14px] outline-none focus:border-primary disabled:cursor-not-allowed disabled:bg-surface-container-low';

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-[#f9f9ff] font-body-md text-on-surface">
      <section className="bg-primary pt-[72px]"><div className="mx-auto max-w-[1200px] px-4 py-10 text-white md:px-margin-desktop md:py-14">
        <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold"><Sparkles className="h-4 w-4" /> Tìm đối thủ và chia tiền sân</span>
        <h1 className="max-w-3xl text-[32px] font-bold leading-tight md:text-[44px]">Tạo lời mời chơi pickleball</h1>
        <p className="mt-4 max-w-2xl text-[17px] leading-7 text-white/88">Nhập sân, ngày giờ, trình độ và hình thức thi đấu để tìm người chơi phù hợp.</p>
        <div className="mt-5 flex flex-wrap gap-3"><Link className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-[14px] font-bold text-primary" to="/my-matches"><Trophy className="h-5 w-5" /> Xem trận của tôi</Link><Link className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-3 text-[14px] font-bold text-white" to="/opponents/pending"><ListChecks className="h-5 w-5" /> Lời mời đang chờ</Link></div>
      </div></section>

      {roomExpired && <div className="mx-auto mt-6 w-[calc(100%-2rem)] max-w-[1200px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-bold text-amber-800">Phòng ghép trận đã hết thời gian. Bạn đã được đưa ra khỏi phòng và khung giờ sân đã trở lại trạng thái trống.</div>}
      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[420px_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start"><section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary text-white"><PlusCircle className="h-6 w-6" /></div><div><h2 className="text-[20px] font-bold">Tạo lời mời ghép trận</h2><p className="text-[13px] text-on-surface-variant">Nhập đầy đủ thông tin trận đấu</p></div></div>
          {error && <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] font-bold text-red-700">{error}</p>}
          <form className="space-y-4" onSubmit={submit}>
            <label className="block"><span className="mb-1 block text-[13px] font-bold">Cụm sân</span><select className={inputClass} onChange={(event) => chooseVenue(Number(event.target.value))} value={selectedVenueId ?? ''}><option value="">Chọn cụm sân</option>{venues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select>{selectedVenue && <p className="mt-2 flex gap-2 text-[12px] leading-5 text-on-surface-variant"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{selectedVenue.address}</p>}</label>
            <div className="grid grid-cols-2 gap-3"><label><span className="mb-1 block text-[13px] font-bold">Ngày chơi</span><input className={inputClass} min={localDate()} onChange={(event) => chooseDate(event.target.value)} type="date" value={bookingDate} /></label><label><span className="mb-1 block text-[13px] font-bold">Sân con</span><select className={inputClass} disabled={!availability || isLoadingSchedule} onChange={(event) => chooseCourt(Number(event.target.value))} value={selectedCourtId ?? ''}><option value="">{isLoadingSchedule ? 'Đang tải...' : 'Chọn sân'}</option>{availability?.courts.map((court) => <option key={court.courtId} value={court.courtId}>Sân {court.courtNumber} · {court.courtType}</option>)}</select></label></div>
            <div className="grid grid-cols-2 gap-3"><label><span className="mb-1 block text-[13px] font-bold">Giờ bắt đầu</span><select className={inputClass} disabled={!selectedCourtId} onChange={(event) => chooseStart(event.target.value)} value={startTime}><option value="">Chọn giờ</option>{startOptions.map((value) => <option key={value}>{value}</option>)}</select></label><label><span className="mb-1 block text-[13px] font-bold">Giờ kết thúc</span><select className={inputClass} disabled={!startTime} onChange={(event) => setEndTime(event.target.value)} value={endTime}><option value="">Chọn giờ</option>{endOptions.map((value) => <option key={value}>{value}</option>)}</select></label></div>
            {selectedCourtId && !isLoadingSchedule && startOptions.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-[12px] font-medium text-amber-800">Sân này không còn khung giờ trống trong ngày đã chọn.</p>}
            <div className="rounded-lg border border-primary/25 bg-[#f3f9eb] p-4"><p className="flex items-center gap-2 text-[13px] font-bold"><CalendarClock className="h-4 w-4 text-primary" />{canCreate ? `${formatDate(bookingDate)} · ${startTime}–${endTime}` : 'Chưa chọn đủ lịch thi đấu'}</p><div className="mt-3 grid grid-cols-3 gap-2 text-[12px]"><div className="rounded-lg bg-white p-2"><p className="text-on-surface-variant">Thời lượng</p><p className="mt-1 font-bold text-primary">{durationHours} giờ</p></div><div className="rounded-lg bg-white p-2"><p className="text-on-surface-variant">Tổng tiền</p><p className="mt-1 font-bold text-primary">{currency.format(totalAmount)}</p></div><div className="rounded-lg bg-white p-2"><p className="text-on-surface-variant">Mỗi người</p><p className="mt-1 font-bold text-primary">{currency.format(amountPerPlayer)}</p></div></div></div>
            <label className="block"><span className="mb-1 block text-[13px] font-bold">Trình độ</span><select className={inputClass} onChange={(event) => setLevel(event.target.value)} value={level}><option>2.0 - 2.5</option><option>3.0 - 3.5</option><option>3.5 - 4.0</option><option>4.0 - 4.5</option><option>5.0+</option></select></label>
            <div><p className="mb-2 text-[13px] font-bold">Hình thức</p><div className="grid grid-cols-2 gap-2">{(['1vs1', '2vs2'] as const).map((value) => <button className={`rounded-lg border px-3 py-3 text-[14px] font-bold ${format === value ? 'border-primary bg-primary text-white' : 'border-outline-variant bg-white'}`} key={value} onClick={() => setFormat(value)} type="button">{value}</button>)}</div></div>
            <label className="block"><span className="mb-1 block text-[13px] font-bold">Ghi chú</span><textarea className={`${inputClass} min-h-24 resize-none`} onChange={(event) => setNote(event.target.value)} placeholder="VD: tìm người chơi vui vẻ, đúng giờ..." value={note} /></label>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[15px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!canCreate || isCreating} type="submit"><PlusCircle className="h-5 w-5" />{isCreating ? 'Đang tạo lời mời...' : 'Đăng lời mời'}</button>
          </form>
        </section></aside>

        <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm"><div className="border-b border-outline-variant p-5"><h2 className="text-[22px] font-bold">Bản đồ sân Pickleball</h2><p className="mt-1 text-[13px] text-on-surface-variant">Chọn marker để đưa cụm sân vào form tạo lời mời.</p></div><div className="relative h-[760px] bg-surface-container">
          <MapContainer center={hanoiCenter} className="h-full w-full" ref={mapRef} scrollWheelZoom zoom={12}><TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><MapViewport selectedVenue={selectedMappedVenue} venues={mappedVenues} />{playerLocation && <Marker icon={playerIcon} position={[playerLocation.latitude, playerLocation.longitude]}><Popup><strong>Vị trí của bạn</strong></Popup></Marker>}{mappedVenues.map((venue) => <Marker eventHandlers={{ click: () => chooseVenue(venue.venueId) }} icon={venueIcon(selectedVenueId === venue.venueId)} key={venue.venueId} position={[venue.latitude, venue.longitude]}><Popup minWidth={220}><div className="space-y-1.5"><strong className="text-[14px]">{venue.venueName}</strong><p className="m-0 text-[12px] text-gray-600">{venue.address}</p><p className="m-0 text-[12px] font-bold text-primary">{currency.format(venue.fromPrice)}/giờ</p><button className="text-[12px] font-bold text-primary underline" onClick={() => chooseVenue(venue.venueId)} type="button">Chọn cụm sân này</button></div></Popup></Marker>)}</MapContainer>
          <button aria-label="Đi đến vị trí của tôi" className="absolute left-[10px] top-[82px] z-[500] flex h-[34px] w-[34px] items-center justify-center rounded-md border-2 border-white bg-white text-blue-600 shadow-[0_1px_5px_rgba(0,0,0,0.45)] transition hover:bg-blue-50 disabled:opacity-60" disabled={isLocating} onClick={locatePlayer} title="Vị trí của tôi" type="button"><Crosshair className={`h-5 w-5 ${isLocating ? 'animate-spin' : ''}`} /></button>
          {isLoadingMap && <div className="pointer-events-none absolute left-1/2 top-5 z-[500] -translate-x-1/2 rounded-xl bg-white/95 px-4 py-3 text-[12px] font-bold shadow-lg">Đang tải vị trí sân...</div>}{!isLoadingMap && mappedVenues.length === 0 && <div className="pointer-events-none absolute left-1/2 top-5 z-[500] -translate-x-1/2 rounded-xl bg-white/95 px-4 py-3 text-[12px] font-bold shadow-lg">Chưa có sân nào được cập nhật tọa độ.</div>}
        </div></section>
      </main>
    </div>
  );
};
