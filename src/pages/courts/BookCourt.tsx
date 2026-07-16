import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  AlertCircle,
  Building2,
  Clock,
  Heart,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
  Search,
  SlidersHorizontal,
  Star,
} from 'lucide-react';
import { divIcon, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { Link, useOutletContext } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import { addFavoriteVenue, getBookingVenues, removeFavoriteVenue, type BookingVenue } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useVenueRealtime } from '../../hooks/useVenueRealtime';
import { AdministrativeAreaSelects } from '../../components/location/AdministrativeAreaSelects';
import { PaginationControls } from '../../components/PaginationControls';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { MatchVenueMapDialog } from '../matches/components/MatchVenueMapDialog';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const hanoiCenter: LatLngTuple = [21.0285, 105.8542];

type Coordinates = { latitude: number; longitude: number };
type PlayerLocation = Coordinates & { accuracy: number };
type LocatedVenue = BookingVenue & { latitude: number; longitude: number };
type MainLayoutContext = { setShowFooter?: (value: boolean) => void };

const PLAYER_LOCATION_CACHE_KEY = 'picklink.player-location';
const PLAYER_LOCATION_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ACCURACY_METERS = 1_000;

const compactButtonClass = 'h-10 rounded-xl px-3 text-[13px] font-bold';
const compactInputClass = 'h-10 rounded-xl border-white/15 bg-[#102b31]/90 text-[13px] text-white placeholder:text-white/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] hover:border-[#e2ff57]/45 focus:border-[#e2ff57] focus:bg-[#102b31] focus:ring-[#e2ff57]/20';

const readCachedPlayerLocation = (): PlayerLocation | null => {
  try {
    const rawValue = window.localStorage.getItem(PLAYER_LOCATION_CACHE_KEY);
    if (!rawValue) return null;
    const cached = JSON.parse(rawValue) as PlayerLocation & { cachedAt: number };
    const isValid = Number.isFinite(cached.accuracy)
      && cached.accuracy >= 0
      && cached.accuracy <= MAX_CACHE_ACCURACY_METERS
      && Number.isFinite(cached.latitude)
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
    return {
      accuracy: cached.accuracy,
      latitude: cached.latitude,
      longitude: cached.longitude,
    };
  } catch {
    return null;
  }
};

const cachePlayerLocation = (location: PlayerLocation) => {
  if (location.accuracy > MAX_CACHE_ACCURACY_METERS) return;
  try {
    window.localStorage.setItem(PLAYER_LOCATION_CACHE_KEY, JSON.stringify({ ...location, cachedAt: Date.now() }));
  } catch {
    // Location sorting still works when storage is unavailable.
  }
};

const venueIcon = (selected: boolean) => divIcon({
  className: '',
  html: `<div style="width:${selected ? 36 : 30}px;height:${selected ? 36 : 30}px;border-radius:50% 50% 50% 0;background:${selected ? '#0b2228' : '#477313'};border:3px solid white;box-shadow:0 0 0 1px rgba(226,255,87,.4),0 5px 14px rgba(8,29,36,.28);transform:rotate(-45deg);display:grid;place-items:center"><div style="width:8px;height:8px;border-radius:50%;background:#e2ff57"></div></div>`,
  iconAnchor: selected ? [18, 36] : [15, 30],
  popupAnchor: [0, selected ? -36 : -30],
  iconSize: selected ? [36, 36] : [30, 30],
});

const playerIcon = divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#e2ff57;border:4px solid white;box-shadow:0 0 0 6px rgba(152,217,81,.22),0 3px 12px rgba(8,29,36,.28)"></div>',
  iconAnchor: [11, 11],
  iconSize: [22, 22],
});

const isLocatedVenue = (venue: BookingVenue): venue is LocatedVenue =>
  typeof venue.latitude === 'number' && Number.isFinite(venue.latitude)
  && typeof venue.longitude === 'number' && Number.isFinite(venue.longitude);

const distanceInKm = (from: Coordinates, to: Coordinates) => {
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
  const { setShowFooter } = useOutletContext<MainLayoutContext>() ?? {};
  const [venues, setVenues] = useState<BookingVenue[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(() => new URLSearchParams(window.location.search).get('favorites') === 'true');
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [error, setError] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [playerLocation, setPlayerLocation] = useState<PlayerLocation | null>(() => readCachedPlayerLocation());
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState(() => readCachedPlayerLocation()
    ? 'Đang dùng vị trí gần nhất và làm mới trong nền.'
    : 'Bấm Vị trí của tôi để xem sân gần bạn.');
  const shouldReduceMotion = useReducedMotion();
  const areaFilter = [selectedWard, selectedProvince].filter(Boolean).join(' ');

  useEffect(() => {
    setShowFooter?.(false);
    return () => setShowFooter?.(true);
  }, [setShowFooter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      getBookingVenues({
        search,
        area: areaFilter,
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
  }, [areaFilter, favoritesOnly, maxPrice, minPrice, page, search, token]);

  useVenueRealtime(() => {
    getBookingVenues({
      search,
      area: areaFilter,
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
        const nextLocation = {
          accuracy: Math.max(0, coords.accuracy),
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
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
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
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

  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 10 };
  const activeFilterCount = [areaFilter, minPrice, maxPrice, favoritesOnly ? 'favorite' : ''].filter(Boolean).length;

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f8fbf4] pt-16 text-[#0b2228]">
      <main className="relative z-0 mx-auto grid w-full max-w-[1500px] gap-3 px-3 py-3 sm:px-4 lg:px-5">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 overflow-visible rounded-2xl border border-white/15 bg-[#081d24] p-3 text-white shadow-[0_18px_44px_rgba(8,29,36,0.22)] before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[radial-gradient(circle_at_8%_0%,rgba(226,255,87,0.14),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.07),transparent_42%)]"
          data-motion-managed
          initial={revealInitial}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="relative grid gap-3 xl:grid-cols-[280px_minmax(0,1fr)_auto] xl:items-center">
            <div className="min-w-0">
              <p className="inline-flex w-fit items-center gap-2 rounded-lg border border-[#e2ff57]/45 bg-[#e2ff57] px-2.5 py-1.5 text-[11px] font-black text-[#081d24] shadow-[0_0_0_1px_rgba(226,255,87,0.18),0_8px_20px_rgba(226,255,87,0.12)]">
                <Building2 aria-hidden="true" className="h-4 w-4" />
                Book court
              </p>
              <h1 className="mt-1.5 text-[clamp(1.25rem,2vw,1.75rem)] font-black leading-tight tracking-[-0.035em]">
                Tìm sân pickleball
              </h1>
            </div>

            <div className="grid min-w-0 gap-2 md:grid-cols-[minmax(0,1fr)_auto]">
              <Input
                className={compactInputClass}
                icon={<Search className="h-5 w-5 text-white/55" />}
                onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                placeholder="Tên sân hoặc địa chỉ..."
                value={search}
              />
              <Button
                className={`${compactButtonClass} border-[#e2ff57] bg-[#e2ff57] text-[#081d24] shadow-[0_10px_24px_rgba(226,255,87,0.18)] hover:border-[#f0ff8b] hover:bg-[#f0ff8b] hover:shadow-[0_0_0_1px_rgba(226,255,87,0.5),0_12px_26px_rgba(226,255,87,0.22)]`}
                onClick={() => locatePlayer()}
                type="button"
              >
                <LocateFixed className={`h-4 w-4 ${isLocating ? 'animate-spin motion-reduce:animate-none' : ''}`} />
                Vị trí của tôi
              </Button>
            </div>

            <div className="flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.07] px-3 text-[12px] font-black text-white/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] xl:justify-center">
              <SlidersHorizontal className="h-4 w-4 text-[#e2ff57]" />
              {activeFilterCount ? `${activeFilterCount} bộ lọc` : 'Bộ lọc gọn'}
            </div>
          </div>

          <div className="relative z-30 mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_132px_132px_auto]">
            <AdministrativeAreaSelects
              fieldClassName="min-w-0 flex items-center gap-2"
              labelClassName="shrink-0 text-[11px] font-bold text-white/70"
              onProvinceChange={(value) => {
                setSelectedProvince(value ?? '');
                setSelectedWard('');
                setPage(1);
              }}
              onWardChange={(value) => {
                setSelectedWard(value ?? '');
                setPage(1);
              }}
              province={selectedProvince}
              selectClassName={`${compactInputClass} min-w-0 flex-1`}
              ward={selectedWard}
            />
            <label className="min-w-0">
              <span className="sr-only">Giá từ</span>
              <Input className={compactInputClass} min="0" onChange={(event) => { setMinPrice(event.target.value); setPage(1); }} placeholder="Giá từ" type="number" value={minPrice} />
            </label>
            <label className="min-w-0">
              <span className="sr-only">Giá đến</span>
              <Input className={compactInputClass} min="0" onChange={(event) => { setMaxPrice(event.target.value); setPage(1); }} placeholder="Giá đến" type="number" value={maxPrice} />
            </label>
            <Button
              className={`${compactButtonClass} border-white/15 bg-white/[0.07] text-white hover:border-[#e2ff57]/55 hover:bg-white/[0.11] hover:text-[#e2ff57] ${favoritesOnly ? 'border-[#e2ff57] bg-[#e2ff57] text-[#081d24] hover:bg-[#f0ff8b] hover:text-[#081d24]' : ''}`}
              onClick={() => token ? (setFavoritesOnly((value) => !value), setPage(1)) : setError('Vui lòng đăng nhập để xem sân yêu thích.')}
              type="button"
              variant={favoritesOnly ? 'default' : 'outline'}
            >
              <Heart className={`h-4 w-4 ${favoritesOnly ? 'fill-current' : ''}`} />
              Yêu thích
            </Button>
          </div>
        </motion.section>

        {error && (
          <div className="shrink-0 flex gap-2 rounded-xl border border-error/25 bg-error-container px-4 py-3 text-[13px] font-bold text-error" role="alert">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}

        <section className="grid min-h-0 gap-3 lg:sticky lg:top-[76px] lg:h-[calc(100dvh-88px)] lg:grid-cols-[390px_minmax(0,1fr)]">
          <aside className="flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-[#dbe8d3] bg-white shadow-[0_10px_28px_rgba(18,45,34,0.06)] lg:min-h-0">
            <div className="border-b border-[#dbe8d3] bg-[#fbfdf8] px-3.5 py-3">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-[16px] font-black tracking-[-0.02em]">{visibleVenues.length} cụm sân</h2>
                  <p className="mt-0.5 line-clamp-2 text-[12px] leading-5 text-[#66766d]">{locationStatus}</p>
                </div>
                {playerLocation && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-[#eef8e6] px-2 py-1 text-[11px] font-bold text-primary">
                    <LocateFixed className="h-3.5 w-3.5" />
                    Gần nhất
                  </span>
                )}
              </div>
              {!isLoading && visibleVenues.length > mappedVenues.length && (
                <p className="mt-1 text-[12px] font-medium text-[#66766d]">
                  {visibleVenues.length - mappedVenues.length} sân chưa có tọa độ.
                </p>
              )}
            </div>

            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-2">
              {isLoading && (
                <div className="space-y-2" aria-label="Đang tải danh sách sân">
                  {[0, 1, 2, 3].map((item) => (
                    <div className="animate-pulse rounded-xl bg-[#f8fbf4] p-4 motion-reduce:animate-none" key={item}>
                      <div className="h-4 w-2/3 rounded bg-[#dbe8d3]" />
                      <div className="mt-3 h-3 w-full rounded bg-[#dbe8d3]" />
                      <div className="mt-2 h-3 w-1/2 rounded bg-[#dbe8d3]" />
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && visibleVenues.length === 0 && (
                <div className="rounded-xl bg-[#f8fbf4] p-8 text-center">
                  <Building2 className="mx-auto h-10 w-10 text-primary/55" />
                  <p className="mt-3 text-[13px] font-bold">Không tìm thấy cụm sân đang mở.</p>
                  <p className="mt-1 text-[12px] text-[#66766d]">Thử đổi khu vực hoặc khoảng giá.</p>
                </div>
              )}

              {!isLoading && visibleVenues.map((venue) => {
                const distance = playerLocation && isLocatedVenue(venue) ? distanceInKm(playerLocation, venue) : null;
                const selected = selectedVenueId === venue.venueId;
                return (
                  <motion.article
                    animate={{ opacity: 1, y: 0 }}
                    className={`picklink-glow-surface cursor-pointer rounded-xl px-3 py-3 transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px ${selected ? 'bg-[#0b2228] text-white shadow-[0_12px_28px_rgba(8,29,36,0.16)]' : 'bg-[#fbfdf8] hover:bg-[#eef8e6]'}`}
                    data-motion-managed
                    initial={revealInitial}
                    key={venue.venueId}
                    onClick={() => setSelectedVenueId(venue.venueId)}
                    transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="min-w-0 break-words text-[15px] font-extrabold leading-snug">{venue.venueName}</h3>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className={`inline-flex h-8 items-center gap-1 rounded-lg px-2 text-[11px] font-bold ${selected ? 'bg-white/10 text-white' : 'border border-[#dbe8d3] bg-white text-[#66766d]'}`}>
                          <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                          {venue.overallRating.toFixed(1)}
                        </span>
                        <button
                          aria-label={venue.isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'}
                          className={`flex h-8 w-8 items-center justify-center rounded-lg transition-[background-color,color,transform] duration-200 hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99] ${venue.isFavorite ? 'bg-error-container text-error' : 'bg-[#f0f8e8] text-[#66766d] hover:text-primary'}`}
                          onClick={(event) => { event.stopPropagation(); void toggleFavorite(venue); }}
                          type="button"
                        >
                          <Heart className={`h-4 w-4 ${venue.isFavorite ? 'fill-current' : ''}`} />
                        </button>
                      </div>
                    </div>
                    <p className={`mt-1.5 flex items-start gap-2 text-[12px] leading-5 ${selected ? 'text-white/74' : 'text-[#66766d]'}`}>
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      {venue.address}
                    </p>
                    <div className={`mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] font-semibold ${selected ? 'text-white/76' : 'text-[#53645a]'}`}>
                      <span className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        {venue.openTime} - {venue.closeTime}
                      </span>
                      <span>{venue.courtCount} sân</span>
                      {distance !== null && (
                        <span className="inline-flex items-center gap-1 font-bold text-primary">
                          <Navigation className="h-3.5 w-3.5" />
                          {distance < 1 ? `${Math.round(distance * 1000)} m` : `${distance.toFixed(1)} km`}
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <p className={`break-words text-[14px] font-black ${selected ? 'text-[#e2ff57]' : 'text-primary'}`}>{currency.format(venue.fromPrice)}/giờ</p>
                      <Link
                        className="inline-flex h-8 items-center rounded-lg bg-[#e2ff57] px-3 text-[12px] font-black text-[#102414] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#d6f64d] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
                        onClick={(event) => event.stopPropagation()}
                        to={`/court/${venue.venueId}/schedule`}
                      >
                        Chọn sân
                      </Link>
                    </div>
                  </motion.article>
                );
              })}
            </div>

            {!isLoading && (
              <div className="border-t border-[#dbe8d3] p-2">
                <PaginationControls page={pagination} onPageChange={setPage} />
              </div>
            )}
          </aside>

          <div className="relative isolate z-10 min-h-[460px] overflow-hidden rounded-2xl border border-[#dbe8d3] bg-[#dfe9d7] shadow-[0_10px_28px_rgba(18,45,34,0.06)] lg:min-h-0">
            <div className="absolute left-3 top-3 z-20 max-w-[min(360px,calc(100%-24px))] rounded-lg bg-white px-3 py-2 shadow-[0_2px_8px_rgba(60,64,67,0.3)]">
              <p className="text-[11px] font-black text-primary">Bản đồ sân</p>
              <p className="mt-0.5 line-clamp-2 text-[12px] font-semibold leading-5 text-[#53645a]">
                Chọn một cụm sân bên trái để map tự căn vị trí.
              </p>
              <button
                className="mt-2 inline-flex min-h-9 items-center gap-2 rounded-lg bg-[#0b2228] px-3 text-[11px] font-bold text-[#e2ff57] transition-[background-color,transform,box-shadow] hover:-translate-y-px hover:bg-[#14333a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313] disabled:cursor-not-allowed disabled:opacity-50"
                disabled={mappedVenues.length === 0}
                onClick={() => setShowRouteMap(true)}
                type="button"
              >
                <Route aria-hidden="true" className="h-4 w-4" />
                Xem khoảng cách và lộ trình
              </button>
            </div>

            <MapContainer center={hanoiCenter} className="match-venue-map-google relative z-0 h-full min-h-[460px] w-full lg:min-h-full" scrollWheelZoom zoom={12}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapViewport playerLocation={playerLocation} selectedVenue={selectedVenue} venues={mappedVenues} />
              {playerLocation && (
                <Marker icon={playerIcon} position={[playerLocation.latitude, playerLocation.longitude]}>
                  <Popup><strong>Vị trí của bạn</strong></Popup>
                </Marker>
              )}
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
              className="absolute bottom-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-xl border border-[#dbe8d3] bg-white text-[#0b2228] shadow-[0_8px_24px_rgba(8,29,36,0.18)] transition-[background-color,transform,opacity] duration-200 hover:-translate-y-px hover:bg-[#eef8e6] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99] disabled:cursor-wait disabled:opacity-55"
              disabled={isLocating}
              onClick={() => locatePlayer()}
              title={isLocating ? 'Đang xác định vị trí' : 'Vị trí của tôi'}
              type="button"
            >
              <LocateFixed className={`h-5 w-5 ${isLocating ? 'animate-spin motion-reduce:animate-none' : ''}`} />
            </button>
            {!isLoading && mappedVenues.length === 0 && (
              <div className="pointer-events-none absolute left-1/2 top-24 z-20 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-xl border border-[#dbe8d3] bg-white/95 px-4 py-3 text-center text-[12px] font-bold shadow-lg backdrop-blur-sm">
                Chưa có cụm sân nào trong kết quả được cập nhật tọa độ.
              </div>
            )}
          </div>
        </section>
      </main>

      {showRouteMap && (
        <MatchVenueMapDialog
          initialSelectedVenueId={selectedVenueId}
          matchTitle="Tìm sân pickleball"
          onClose={() => setShowRouteMap(false)}
          venues={mappedVenues}
        />
      )}
    </div>
  );
};
