import { useEffect, useMemo, useState } from 'react';
import { Building2, Clock, Heart, LocateFixed, MapPin, Navigation, Search, Star } from 'lucide-react';
import { divIcon, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { addFavoriteVenue, getBookingVenues, removeFavoriteVenue, type BookingVenue } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useVenueRealtime } from '../../hooks/useVenueRealtime';
import { PaginationControls } from '../../components/PaginationControls';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const hanoiCenter: LatLngTuple = [21.0285, 105.8542];

type PlayerLocation = { latitude: number; longitude: number };
type LocatedVenue = BookingVenue & { latitude: number; longitude: number };

const PLAYER_LOCATION_CACHE_KEY = 'picklink.player-location';
const PLAYER_LOCATION_CACHE_TTL_MS = 30 * 60 * 1000;

const readCachedPlayerLocation = (): PlayerLocation | null => {
  try {
    const rawValue = window.localStorage.getItem(PLAYER_LOCATION_CACHE_KEY);
    if (!rawValue) return null;
    const cached = JSON.parse(rawValue) as PlayerLocation & { cachedAt: number };
    const isValid = Number.isFinite(cached.latitude)
      && cached.latitude >= -90
      && cached.latitude <= 90
      && Number.isFinite(cached.longitude)
      && cached.longitude >= -180
      && cached.longitude <= 180
      && Date.now() - cached.cachedAt <= PLAYER_LOCATION_CACHE_TTL_MS;
    if (!isValid) {
      window.localStorage.removeItem(PLAYER_LOCATION_CACHE_KEY);
      return null;
    }
    return { latitude: cached.latitude, longitude: cached.longitude };
  } catch {
    return null;
  }
};

const cachePlayerLocation = (location: PlayerLocation) => {
  try {
    window.localStorage.setItem(PLAYER_LOCATION_CACHE_KEY, JSON.stringify({ ...location, cachedAt: Date.now() }));
  } catch {
    // Location still works when storage is unavailable.
  }
};

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

const isLocatedVenue = (venue: BookingVenue): venue is LocatedVenue =>
  typeof venue.latitude === 'number' && Number.isFinite(venue.latitude)
  && typeof venue.longitude === 'number' && Number.isFinite(venue.longitude);

const distanceInKm = (from: PlayerLocation, to: PlayerLocation) => {
  const radians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const value = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
};

const locationErrorMessage = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) return 'Bạn chưa cấp quyền vị trí cho trình duyệt.';
  if (error.code === error.POSITION_UNAVAILABLE) return 'Thiết bị chưa cung cấp được vị trí hiện tại.';
  if (error.code === error.TIMEOUT) return 'Định vị quá thời gian, vui lòng thử lại.';
  return 'Không thể lấy vị trí hiện tại.';
};

const MapViewport = ({ venues, playerLocation, selectedVenue }: {
  venues: LocatedVenue[];
  playerLocation: PlayerLocation | null;
  selectedVenue?: LocatedVenue;
}) => {
  const map = useMap();

  useEffect(() => {
    if (playerLocation) {
      map.flyTo(
        [playerLocation.latitude, playerLocation.longitude],
        Math.max(map.getZoom(), 16),
        { duration: 0.7 },
      );
      return;
    }
    const points: LatLngTuple[] = venues.map((venue) => [venue.latitude, venue.longitude]);
    if (points.length > 1) map.fitBounds(points as LatLngBoundsExpression, { padding: [42, 42], maxZoom: 15 });
    else if (points.length === 1) map.setView(points[0], 14);
  }, [map, playerLocation, venues]);

  useEffect(() => {
    if (selectedVenue) map.flyTo([selectedVenue.latitude, selectedVenue.longitude], Math.max(map.getZoom(), 15), { duration: 0.7 });
  }, [map, selectedVenue]);

  return null;
};

export const BookCourt = () => {
  const { token } = useAuth();
  const [venues, setVenues] = useState<BookingVenue[]>([]);
  const [search, setSearch] = useState('');
  const [area, setArea] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(() => new URLSearchParams(window.location.search).get('favorites') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [error, setError] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [playerLocation, setPlayerLocation] = useState<PlayerLocation | null>(() => readCachedPlayerLocation());
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(() => readCachedPlayerLocation()
    ? 'Đang dùng vị trí gần nhất và làm mới trong nền.'
    : 'Bấm “Vị trí của tôi” để xem các sân gần bạn.');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      getBookingVenues({
        search,
        area,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        favoritesOnly,
        page,
        pageSize: 10,
      }, token)
        .then((result) => { setVenues(result.items); setPagination(result); setError(''); })
        .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách sân.'))
        .finally(() => setIsLoading(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [area, favoritesOnly, maxPrice, minPrice, page, search, token]);

  useVenueRealtime(() => {
    getBookingVenues({
      search,
      area,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      favoritesOnly,
      page,
      pageSize: 10,
    }, token)
      .then((result) => {
        setVenues(result.items);
        setPagination(result);
        setError('');
      })
      .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Không thể đồng bộ danh sách sân.'));
  });

  const visibleVenues = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const filtered = keyword ? venues.filter((venue) => `${venue.venueName} ${venue.address}`.toLowerCase().includes(keyword)) : venues;
    if (!playerLocation) return filtered;
    return [...filtered].sort((left, right) => {
      if (!isLocatedVenue(left)) return 1;
      if (!isLocatedVenue(right)) return -1;
      return distanceInKm(playerLocation, left) - distanceInKm(playerLocation, right);
    });
  }, [playerLocation, search, venues]);

  const mappedVenues = useMemo(() => visibleVenues.filter(isLocatedVenue), [visibleVenues]);
  const selectedVenue = mappedVenues.find((venue) => venue.venueId === selectedVenueId);

  const locatePlayer = (refreshSilently = false) => {
    const cachedLocation = readCachedPlayerLocation();
    if (cachedLocation) {
      setPlayerLocation({ ...cachedLocation });
      if (!refreshSilently) setLocationStatus('Đang hiển thị vị trí gần nhất và cập nhật lại...');
    }
    if (!navigator.geolocation) {
      setLocationStatus('Trình duyệt không hỗ trợ định vị.');
      return;
    }
    if (!window.isSecureContext) {
      setLocationStatus('Định vị chỉ hoạt động trên HTTPS hoặc localhost.');
      return;
    }
    setIsLocating(true);
    if (!cachedLocation && !refreshSilently) setLocationStatus('Đang xác định vị trí của bạn...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const nextLocation = { latitude: coords.latitude, longitude: coords.longitude };
        setPlayerLocation(nextLocation);
        cachePlayerLocation(nextLocation);
        setLocationStatus('Danh sách đã được xếp theo khoảng cách gần nhất.');
        setIsLocating(false);
      },
      (locationError) => {
        setLocationStatus(cachedLocation
          ? 'Đang dùng vị trí gần nhất. Chưa thể cập nhật vị trí mới.'
          : locationErrorMessage(locationError));
        setIsLocating(false);
      },
      { enableHighAccuracy: false, maximumAge: 5 * 60_000, timeout: 5_000 },
    );
  };

  useEffect(() => {
    let isActive = true;
    if (!navigator.permissions || !navigator.geolocation || !window.isSecureContext) return undefined;
    void navigator.permissions.query({ name: 'geolocation' }).then((permission) => {
      if (isActive && permission.state === 'granted') locatePlayer(true);
    }).catch(() => undefined);
    return () => { isActive = false; };
  }, []);

  const toggleFavorite = async (venue: BookingVenue) => {
    if (!token) {
      setError('Vui lòng đăng nhập bằng tài khoản Player để lưu sân yêu thích.');
      return;
    }
    try {
      if (venue.isFavorite) await removeFavoriteVenue(token, venue.venueId);
      else await addFavoriteVenue(token, venue.venueId);
      setVenues((current) => current
        .map((item) => item.venueId === venue.venueId ? { ...item, isFavorite: !venue.isFavorite } : item)
        .filter((item) => !favoritesOnly || item.isFavorite));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật sân yêu thích.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-container-low px-4 py-6 md:px-8">
      <div className="mx-auto max-w-[1440px] space-y-5">
        <section className="flex flex-col gap-4 rounded-2xl bg-primary p-5 text-white shadow-lg md:flex-row md:items-center md:justify-between md:p-7">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.18em] text-white/70">Đặt sân Picklink</p>
            <h1 className="mt-1 text-[30px] font-bold md:text-[36px]">Tìm sân quanh bạn</h1>
            <p className="mt-1 text-[14px] text-white/80">Chọn cụm sân trong danh sách hoặc trực tiếp trên bản đồ.</p>
          </div>
          <div className="w-full md:max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
              <input className="w-full rounded-xl bg-white py-3.5 pl-12 pr-4 text-[14px] font-medium text-on-surface outline-none" onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Tên sân hoặc địa chỉ..." value={search} />
            </div>
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] font-bold text-red-700">{error}</div>}

        <section className="grid gap-3 rounded-xl border border-outline-variant bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-5">
          <label className="lg:col-span-2"><span className="text-[11px] font-bold uppercase text-on-surface-variant">Khu vực</span><input className="mt-1 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary" onChange={(event) => { setArea(event.target.value); setPage(1); }} placeholder="Quận, huyện, thành phố..." value={area} /></label>
          <label><span className="text-[11px] font-bold uppercase text-on-surface-variant">Giá từ</span><input className="mt-1 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary" min="0" onChange={(event) => { setMinPrice(event.target.value); setPage(1); }} placeholder="100000" type="number" value={minPrice} /></label>
          <label><span className="text-[11px] font-bold uppercase text-on-surface-variant">Giá đến</span><input className="mt-1 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary" min="0" onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }} placeholder="300000" type="number" value={maxPrice} /></label>
          <button className={`mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg border px-3 text-[13px] font-bold ${favoritesOnly ? 'border-primary bg-primary text-white' : 'border-outline-variant text-on-surface-variant'}`} onClick={() => token ? (setFavoritesOnly((value) => !value), setPage(1)) : setError('Vui lòng đăng nhập để xem sân yêu thích.')} type="button"><Heart className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} /> Sân yêu thích</button>
        </section>

        <section className="grid gap-5 lg:grid-cols-[minmax(320px,1fr)_minmax(0,2fr)]">
          <div className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm lg:h-[calc(100vh-230px)]">
            <div className="border-b border-outline-variant px-4 py-3.5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-bold">{visibleVenues.length} cụm sân</h2>
                {playerLocation && <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700"><LocateFixed className="h-3.5 w-3.5" /> Gần nhất</span>}
              </div>
              <p className="mt-1 text-[11px] text-on-surface-variant">{locationStatus}</p>
              {!isLoading && visibleVenues.length > mappedVenues.length && <p className="mt-1 text-[11px] font-medium text-amber-700">{visibleVenues.length - mappedVenues.length} sân chưa được chủ sân cập nhật tọa độ.</p>}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-3">
              {isLoading && <div className="p-10 text-center text-[13px] font-bold text-on-surface-variant">Đang tải danh sách sân...</div>}
              {!isLoading && visibleVenues.length === 0 && <div className="p-10 text-center"><Building2 className="mx-auto h-10 w-10 text-primary/50" /><p className="mt-3 text-[13px] font-bold">Không tìm thấy cụm sân đang mở.</p></div>}
              {visibleVenues.map((venue) => {
                const distance = playerLocation && isLocatedVenue(venue) ? distanceInKm(playerLocation, venue) : null;
                const selected = selectedVenueId === venue.venueId;
                return (
                  <article className={`cursor-pointer rounded-xl border p-4 transition ${selected ? 'border-primary bg-primary/5 shadow-sm' : 'border-outline-variant hover:border-primary/50 hover:bg-surface-container-low'}`} key={venue.venueId} onClick={() => setSelectedVenueId(venue.venueId)}>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-[16px] font-bold leading-snug">{venue.venueName}</h3>
                      <div className="flex shrink-0 items-center gap-1"><span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-700"><Star className="h-3 w-3 fill-current" />{venue.overallRating.toFixed(1)}</span><button aria-label={venue.isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'} className={`rounded-full p-2 ${venue.isFavorite ? 'bg-red-50 text-red-600' : 'bg-surface-container-low text-on-surface-variant'}`} onClick={(event) => { event.stopPropagation(); void toggleFavorite(venue); }} type="button"><Heart className={`h-4 w-4 ${venue.isFavorite ? 'fill-current' : ''}`} /></button></div>
                    </div>
                    <p className="mt-2 flex items-start gap-2 text-[12px] text-on-surface-variant"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />{venue.address}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-medium">
                      <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" />{venue.openTime}–{venue.closeTime}</span>
                      <span>{venue.courtCount} sân</span>
                      {distance !== null && <span className="inline-flex items-center gap-1 font-bold text-blue-700"><Navigation className="h-3.5 w-3.5" />{distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}</span>}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-2 border-t border-outline-variant pt-3">
                      <p className="text-[15px] font-bold text-primary">{currency.format(venue.fromPrice)}/giờ</p>
                      <Link className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white" onClick={(event) => event.stopPropagation()} to={`/court/${venue.venueId}/schedule`}>Chọn sân</Link>
                    </div>
                  </article>
                );
              })}
              <PaginationControls page={pagination} onPageChange={setPage} />
            </div>
          </div>

          <div className="relative h-[620px] overflow-hidden rounded-2xl border border-outline-variant bg-surface-container shadow-sm lg:sticky lg:top-5 lg:h-[calc(100vh-230px)]">
            <MapContainer center={hanoiCenter} className="h-full w-full" scrollWheelZoom zoom={12}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapViewport playerLocation={playerLocation} selectedVenue={selectedVenue} venues={mappedVenues} />
              {playerLocation && <Marker icon={playerIcon} position={[playerLocation.latitude, playerLocation.longitude]}><Popup><strong>Vị trí của bạn</strong></Popup></Marker>}
              {mappedVenues.map((venue) => (
                <Marker eventHandlers={{ click: () => setSelectedVenueId(venue.venueId) }} icon={venueIcon(selectedVenueId === venue.venueId)} key={venue.venueId} position={[venue.latitude, venue.longitude]}>
                  <Popup minWidth={220}>
                    <div className="space-y-1.5">
                      <strong className="text-[14px]">{venue.venueName}</strong>
                      <p className="m-0 text-[12px] text-gray-600">{venue.address}</p>
                      <p className="m-0 text-[12px] font-bold text-primary">{currency.format(venue.fromPrice)}/giờ</p>
                      <Link className="inline-block text-[12px] font-bold text-primary underline" to={`/court/${venue.venueId}/schedule`}>Xem lịch sân</Link>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
            <button
              aria-label="Đi đến vị trí của tôi"
              className="absolute left-[10px] top-[82px] z-[500] flex h-10 w-10 items-center justify-center rounded-full border-2 border-white bg-white text-blue-600 shadow-[0_2px_8px_rgba(0,0,0,0.4)] transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              disabled={isLocating}
              onClick={() => locatePlayer()}
              title={isLocating ? 'Đang xác định vị trí' : 'Vị trí của tôi'}
              type="button"
            >
              <LocateFixed className={`h-5 w-5 ${isLocating ? 'animate-spin' : ''}`} />
            </button>
            {!isLoading && mappedVenues.length === 0 && <div className="pointer-events-none absolute left-1/2 top-5 z-[500] -translate-x-1/2 rounded-xl bg-white/95 px-4 py-3 text-center text-[12px] font-bold shadow-lg">Chưa có cụm sân nào trong kết quả được cập nhật tọa độ.</div>}
          </div>
        </section>
      </div>
    </div>
  );
};
