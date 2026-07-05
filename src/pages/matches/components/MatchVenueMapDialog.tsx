import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { divIcon, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import { motion, useReducedMotion } from 'motion/react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import {
  ArrowLeft,
  CarFront,
  Check,
  Clock3,
  ExternalLink,
  LocateFixed,
  MapPin,
  Navigation,
  Route,
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import type { MatchPreferredVenue } from '../../../api/matches';
import '../../community/community.css';

type PlayerLocation = {
  accuracy: number;
  latitude: number;
  longitude: number;
};

type LocatedVenue = MatchPreferredVenue & {
  latitude: number;
  longitude: number;
};

type RouteMetric = {
  distanceKm: number;
  durationMinutes: number;
};

type OsrmTableResponse = {
  code: string;
  distances?: Array<Array<number | null>>;
  durations?: Array<Array<number | null>>;
};

type OsrmRouteResponse = {
  code: string;
  routes?: Array<{
    distance: number;
    duration: number;
    geometry: {
      coordinates: Array<[number, number]>;
    };
  }>;
};

type MatchVenueMapDialogProps = {
  initialSelectedVenueId?: number | null;
  matchTitle: string;
  onClose: () => void;
  onVenueToggle?: (venueId: number) => void;
  selectedVenueIds?: number[];
  venues: MatchPreferredVenue[];
};

const PLAYER_LOCATION_CACHE_KEY = 'picklink.player-location';
const PLAYER_LOCATION_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ACCURACY_METERS = 1_000;
const hanoiCenter: LatLngTuple = [21.0285, 105.8542];

const venueMarkerIcon = (selected: boolean) => divIcon({
  className: '',
  html: `<div style="width:${selected ? 36 : 30}px;height:${selected ? 36 : 30}px;border-radius:50% 50% 50% 0;background:${selected ? '#0b2228' : '#477313'};border:3px solid white;box-shadow:0 0 0 1px rgba(226,255,87,.4),0 5px 14px rgba(8,29,36,.28);transform:rotate(-45deg);display:grid;place-items:center"><div style="width:8px;height:8px;border-radius:50%;background:#e2ff57"></div></div>`,
  iconAnchor: selected ? [18, 36] : [15, 30],
  popupAnchor: [0, selected ? -36 : -30],
  iconSize: selected ? [36, 36] : [30, 30],
});

const playerMarkerIcon = divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#e2ff57;border:4px solid white;box-shadow:0 0 0 6px rgba(152,217,81,.22),0 3px 12px rgba(8,29,36,.28)"></div>',
  iconAnchor: [11, 11],
  iconSize: [22, 22],
});

const isLocatedVenue = (venue: MatchPreferredVenue): venue is LocatedVenue =>
  typeof venue.latitude === 'number'
  && Number.isFinite(venue.latitude)
  && typeof venue.longitude === 'number'
  && Number.isFinite(venue.longitude);

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
    window.localStorage.setItem(PLAYER_LOCATION_CACHE_KEY, JSON.stringify({
      ...location,
      cachedAt: Date.now(),
    }));
  } catch {
    // The map still works when local storage is unavailable.
  }
};

const locationErrorMessage = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) return 'Bạn chưa cấp quyền vị trí cho trình duyệt.';
  if (error.code === error.POSITION_UNAVAILABLE) return 'Thiết bị chưa cung cấp được vị trí hiện tại.';
  if (error.code === error.TIMEOUT) return 'Định vị quá thời gian, vui lòng thử lại.';
  return 'Không thể lấy vị trí hiện tại.';
};

const accuracyLabel = (accuracy: number) => accuracy < 1_000
  ? `Độ chính xác khoảng ±${Math.max(1, Math.round(accuracy))} m`
  : `Độ chính xác thấp, khoảng ±${(accuracy / 1_000).toFixed(1)} km`;

const MapViewport = ({
  playerLocation,
  routeCoordinates,
  venues,
}: {
  playerLocation: PlayerLocation | null;
  routeCoordinates: LatLngTuple[];
  venues: LocatedVenue[];
}) => {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    if (routeCoordinates.length > 1) {
      map.fitBounds(routeCoordinates as LatLngBoundsExpression, {
        padding: [36, 36],
        maxZoom: 16,
      });
      return;
    }

    const points: LatLngTuple[] = venues.map((venue) => [venue.latitude, venue.longitude]);
    if (playerLocation) points.push([playerLocation.latitude, playerLocation.longitude]);
    if (points.length > 1) {
      map.fitBounds(points as LatLngBoundsExpression, { padding: [36, 36], maxZoom: 15 });
    } else if (points.length === 1) {
      map.setView(points[0], 15);
    }
  }, [map, playerLocation, routeCoordinates, venues]);

  return null;
};

export const MatchVenueMapDialog = ({
  initialSelectedVenueId,
  matchTitle,
  onClose,
  onVenueToggle,
  selectedVenueIds = [],
  venues,
}: MatchVenueMapDialogProps) => {
  const shouldReduceMotion = useReducedMotion();
  const locatedVenues = useMemo(() => venues.filter(isLocatedVenue), [venues]);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(
    () => initialSelectedVenueId ?? locatedVenues[0]?.venueId ?? null,
  );
  const [playerLocation, setPlayerLocation] = useState<PlayerLocation | null>(
    () => readCachedPlayerLocation(),
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [locationStatus, setLocationStatus] = useState(() => {
    const cached = readCachedPlayerLocation();
    return cached ? `${accuracyLabel(cached.accuracy)} · vị trí gần nhất` : '';
  });
  const [routeMetrics, setRouteMetrics] = useState<Record<number, RouteMetric>>({});
  const [routeCoordinates, setRouteCoordinates] = useState<LatLngTuple[]>([]);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState('');
  const dialogRef = useRef<HTMLElement>(null);
  const geolocationWatchRef = useRef<number | null>(null);
  const geolocationTimeoutRef = useRef<number | null>(null);
  const selectedVenue = locatedVenues.find((venue) => venue.venueId === selectedVenueId)
    ?? locatedVenues[0];
  const selectedMetric = selectedVenue ? routeMetrics[selectedVenue.venueId] : undefined;

  useEffect(() => {
    setSelectedVenueId((current) => {
      if (initialSelectedVenueId != null
        && locatedVenues.some((venue) => venue.venueId === initialSelectedVenueId)) {
        return initialSelectedVenueId;
      }
      if (current != null && locatedVenues.some((venue) => venue.venueId === current)) {
        return current;
      }
      return locatedVenues[0]?.venueId ?? null;
    });
  }, [initialSelectedVenueId, locatedVenues]);

  const clearLocationWatch = useCallback(() => {
    if (geolocationWatchRef.current != null && navigator.geolocation) {
      navigator.geolocation.clearWatch(geolocationWatchRef.current);
      geolocationWatchRef.current = null;
    }
    if (geolocationTimeoutRef.current != null) {
      window.clearTimeout(geolocationTimeoutRef.current);
      geolocationTimeoutRef.current = null;
    }
  }, []);

  const locatePlayer = useCallback((silent = false) => {
    clearLocationWatch();
    const cachedLocation = readCachedPlayerLocation();
    if (cachedLocation) {
      setPlayerLocation(cachedLocation);
      setLocationStatus(`${accuracyLabel(cachedLocation.accuracy)} · vị trí gần nhất`);
    }

    if (!navigator.geolocation) {
      if (!silent || !cachedLocation) setLocationError('Trình duyệt không hỗ trợ định vị.');
      return;
    }
    if (!window.isSecureContext) {
      if (!silent || !cachedLocation) setLocationError('Định vị chỉ hoạt động trên HTTPS hoặc localhost.');
      return;
    }

    setIsLocating(true);
    setLocationError('');
    let bestLocation = silent ? cachedLocation : null;
    geolocationWatchRef.current = navigator.geolocation.watchPosition(
      ({ coords }) => {
        const nextLocation = {
          accuracy: Math.max(0, coords.accuracy),
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        if (bestLocation && bestLocation.accuracy <= nextLocation.accuracy) return;
        bestLocation = nextLocation;
        cachePlayerLocation(nextLocation);
        setPlayerLocation(nextLocation);
        setLocationError('');
        setLocationStatus(accuracyLabel(nextLocation.accuracy));
        if (nextLocation.accuracy <= 50) {
          clearLocationWatch();
          setIsLocating(false);
        }
      },
      (error) => {
        if (!bestLocation) setLocationError(locationErrorMessage(error));
        clearLocationWatch();
        setIsLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 },
    );

    geolocationTimeoutRef.current = window.setTimeout(() => {
      clearLocationWatch();
      if (!bestLocation) setLocationError('Chưa lấy được vị trí chính xác. Bạn có thể kéo điểm vị trí trên bản đồ.');
      setIsLocating(false);
    }, 20_000);
  }, [clearLocationWatch]);

  useEffect(() => {
    locatePlayer(true);
  }, [locatePlayer]);

  useEffect(() => clearLocationWatch, [clearLocationWatch]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!playerLocation || locatedVenues.length === 0) {
      setRouteMetrics({});
      return undefined;
    }

    const controller = new AbortController();
    const coordinates = [
      `${playerLocation.longitude},${playerLocation.latitude}`,
      ...locatedVenues.map((venue) => `${venue.longitude},${venue.latitude}`),
    ].join(';');
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);

    fetch(`https://router.project-osrm.org/table/v1/driving/${coordinates}?sources=0&annotations=distance,duration`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Routing table failed.');
        return response.json() as Promise<OsrmTableResponse>;
      })
      .then((result) => {
        if (result.code !== 'Ok') throw new Error('Routing table unavailable.');
        const distances = result.distances?.[0] ?? [];
        const durations = result.durations?.[0] ?? [];
        const nextMetrics: Record<number, RouteMetric> = {};
        locatedVenues.forEach((venue, index) => {
          const distance = distances[index + 1];
          const duration = durations[index + 1];
          if (distance == null || duration == null) return;
          nextMetrics[venue.venueId] = {
            distanceKm: distance / 1000,
            durationMinutes: Math.max(1, Math.round(duration / 60)),
          };
        });
        setRouteMetrics(nextMetrics);
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setRouteMetrics({});
      })
      .finally(() => window.clearTimeout(timeoutId));

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [locatedVenues, playerLocation]);

  useEffect(() => {
    if (!playerLocation || !selectedVenue) {
      setRouteCoordinates([]);
      setRouteError('');
      setIsRouting(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 10_000);
    const coordinates = `${playerLocation.longitude},${playerLocation.latitude};${selectedVenue.longitude},${selectedVenue.latitude}`;
    setIsRouting(true);
    setRouteError('');

    fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error('Route request failed.');
        return response.json() as Promise<OsrmRouteResponse>;
      })
      .then((result) => {
        const route = result.routes?.[0];
        if (result.code !== 'Ok' || !route) throw new Error('Route unavailable.');
        setRouteCoordinates(route.geometry.coordinates.map(([longitude, latitude]) => [
          latitude,
          longitude,
        ]));
        setRouteMetrics((current) => ({
          ...current,
          [selectedVenue.venueId]: {
            distanceKm: route.distance / 1000,
            durationMinutes: Math.max(1, Math.round(route.duration / 60)),
          },
        }));
      })
      .catch((error) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setRouteCoordinates([]);
        setRouteError('Chưa thể vẽ lộ trình trong ứng dụng.');
      })
      .finally(() => {
        window.clearTimeout(timeoutId);
        setIsRouting(false);
      });

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [playerLocation, selectedVenue]);

  const directionsUrl = selectedVenue
    ? `https://www.google.com/maps/dir/?${new URLSearchParams({
      api: '1',
      ...(playerLocation
        ? { origin: `${playerLocation.latitude},${playerLocation.longitude}` }
        : {}),
      destination: `${selectedVenue.latitude},${selectedVenue.longitude}`,
      travelmode: 'driving',
    }).toString()}`
    : '#';

  return (
    <motion.div
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#081d24]/72 p-0 backdrop-blur-sm sm:p-4"
      initial={shouldReduceMotion ? false : { opacity: 0 }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
      transition={{ duration: shouldReduceMotion ? 0.01 : 0.2 }}
    >
      <motion.section
        animate={{ opacity: 1, scale: 1, y: 0 }}
        aria-labelledby="match-venue-map-title"
        aria-modal="true"
        className="h-[100dvh] w-full max-w-[1180px] overflow-hidden bg-white shadow-[0_28px_90px_rgba(8,29,36,0.34)] outline-none sm:h-[min(780px,calc(100dvh-32px))] sm:rounded-2xl"
        data-motion-managed
        initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.985, y: 16 }}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
        transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {locatedVenues.length === 0 ? (
          <div className="flex h-full flex-col">
            <header className="flex items-center gap-3 border-b border-[#d8e4d4] px-4 py-3">
              <button
                aria-label="Đóng bản đồ"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[#526158] transition-colors hover:bg-[#edf5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313]"
                onClick={onClose}
                title="Đóng"
                type="button"
              >
                <ArrowLeft aria-hidden="true" className="h-5 w-5" />
              </button>
              <h2 className="min-w-0 truncate text-[17px] font-bold text-[#0b2228]" id="match-venue-map-title">
                {matchTitle}
              </h2>
            </header>
            <div className="grid flex-1 place-items-center p-8 text-center">
              <div>
                <MapPin aria-hidden="true" className="mx-auto h-9 w-9 text-[#718077]" />
                <p className="mt-3 text-[14px] font-medium text-[#526158]">
                  Các cụm sân trong lời mời chưa có tọa độ bản đồ.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-0 flex-col lg:grid lg:grid-cols-[360px_minmax(0,1fr)]">
            <aside className="order-2 flex min-h-0 flex-1 flex-col bg-white lg:order-1 lg:border-r lg:border-[#d8e4d4]">
              <div className="border-b border-[#d8e4d4] px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <button
                    aria-label="Đóng bản đồ"
                    className="hidden h-10 w-10 shrink-0 place-items-center rounded-xl text-[#526158] transition-colors hover:bg-[#edf5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313] lg:grid"
                    onClick={onClose}
                    title="Quay lại"
                    type="button"
                  >
                    <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                  </button>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[#718077]">Chỉ đường</p>
                    <h2 className="truncate text-[16px] font-bold text-[#0b2228]" id="match-venue-map-title">
                      {matchTitle}
                    </h2>
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-[18px_minmax(0,1fr)_36px] items-center gap-x-2 gap-y-2">
                  <span className="picklink-live-pulse mx-auto h-2.5 w-2.5 rounded-full border-2 border-white bg-[#e2ff57] shadow-[0_0_0_1px_#477313]" />
                  <div className="min-w-0 rounded-lg bg-[#edf5e9] px-3 py-2">
                    <p className="truncate text-[12px] font-semibold text-[#0b2228]">Vị trí của bạn</p>
                    <p className="truncate text-[10px] text-[#718077]">
                      {locationStatus || (isLocating ? 'Đang xác định vị trí...' : 'Chưa xác định')}
                    </p>
                  </div>
                  <button
                    aria-label="Cập nhật vị trí của tôi"
                    className="grid h-9 w-9 place-items-center rounded-xl text-[#477313] transition-colors hover:bg-[#edf5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313] disabled:cursor-wait disabled:opacity-50"
                    disabled={isLocating}
                    onClick={() => locatePlayer()}
                    title="Vị trí của tôi"
                    type="button"
                  >
                    <LocateFixed aria-hidden="true" className={`h-4 w-4 ${isLocating ? 'animate-spin motion-reduce:animate-none' : ''}`} />
                  </button>

                  <MapPin aria-hidden="true" className="mx-auto h-4 w-4 text-[#477313]" />
                  <div className="min-w-0 rounded-lg bg-[#edf5e9] px-3 py-2">
                    <p className="truncate text-[12px] font-semibold text-[#0b2228]">
                      {selectedVenue?.venueName || 'Chọn cụm sân'}
                    </p>
                    <p className="truncate text-[10px] text-[#718077]">{selectedVenue?.address}</p>
                  </div>
                  <span />
                </div>

                {locationError && (
                  <p className="mt-2 rounded-lg bg-[#fff3f2] px-3 py-2 text-[10px] font-medium text-[#ba1a1a]">
                    {locationError}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 border-b border-[#d8e4d4] bg-[#f8fbf4] px-4 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf5e9] text-[#477313]">
                  <CarFront aria-hidden="true" className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-semibold text-[#0b2228]">
                    {selectedMetric
                      ? `${selectedMetric.durationMinutes} phút`
                      : isRouting ? 'Đang tính lộ trình...' : 'Lộ trình lái xe'}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-[#718077]">
                    {selectedMetric
                      ? `${selectedMetric.distanceKm.toFixed(1)} km đến ${selectedVenue?.venueName}`
                      : 'Khoảng cách theo mạng lưới đường bộ'}
                  </p>
                </div>
                <Route aria-hidden="true" className="h-4 w-4 shrink-0 text-[#526158]" />
              </div>

              <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-3">
                <p className="text-[12px] font-semibold text-[#0b2228]">Cụm sân mong muốn</p>
                <span className="text-[10px] font-medium text-[#718077]">{locatedVenues.length} địa điểm</span>
              </div>

              <div className="min-h-0 flex-1 divide-y divide-[#e2eae0] overflow-y-auto">
                {locatedVenues.map((venue) => {
                  const metric = routeMetrics[venue.venueId];
                  const selected = venue.venueId === selectedVenue?.venueId;
                  const chosen = selectedVenueIds.includes(venue.venueId);
                  return (
                    <div
                      className={`relative flex items-stretch transition-colors ${
                        selected ? 'bg-[#edf5e9]' : 'hover:bg-[#f8fbf4]'
                      }`}
                      key={venue.venueId}
                    >
                      {selected && <span className="absolute inset-y-0 left-0 w-1 bg-[#477313]" />}
                      <button
                        aria-pressed={selected}
                        className="flex min-w-0 flex-1 items-start gap-3 px-4 py-3 text-left"
                        onClick={() => setSelectedVenueId(venue.venueId)}
                        type="button"
                      >
                        <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${selected ? 'bg-white' : 'bg-[#edf5e9]'}`}>
                          <MapPin aria-hidden="true" className="h-4 w-4 text-[#477313]" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <strong className="block truncate text-[12px] font-semibold text-[#0b2228]">{venue.venueName}</strong>
                          <span className="mt-0.5 line-clamp-2 block text-[10px] leading-4 text-[#718077]">{venue.address}</span>
                          {metric && (
                            <span className="mt-1.5 flex items-center gap-3 text-[10px] font-medium text-[#477313]">
                              <span>{metric.distanceKm < 1
                                ? `${Math.round(metric.distanceKm * 1000)} m`
                                : `${metric.distanceKm.toFixed(1)} km`}</span>
                              <span className="inline-flex items-center gap-1">
                                <Clock3 aria-hidden="true" className="h-3 w-3" />
                                {metric.durationMinutes} phút
                              </span>
                            </span>
                          )}
                        </span>
                      </button>
                      {onVenueToggle && (
                        <button
                          aria-label={chosen ? `Bỏ chọn ${venue.venueName}` : `Chọn ${venue.venueName}`}
                          aria-pressed={chosen}
                          className="mr-3 mt-3 grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-[#d8e4d4] bg-white text-[#526158] transition-colors hover:bg-[#edf5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313]"
                          onClick={() => {
                            setSelectedVenueId(venue.venueId);
                            onVenueToggle(venue.venueId);
                          }}
                          title={chosen ? 'Bỏ chọn cụm sân' : 'Chọn cụm sân'}
                          type="button"
                        >
                          {chosen
                            ? <Check aria-hidden="true" className="h-4 w-4 text-[#477313]" />
                            : <span className="h-3.5 w-3.5 rounded-full border-2 border-[#98a39b]" />}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-[#d8e4d4] p-3.5">
                {routeError && <p className="mb-2 text-[10px] font-medium text-[#b06000]">{routeError}</p>}
                <a
                  className={`flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-[#e2ff57] px-4 py-2 text-[12px] font-extrabold text-[#102414] shadow-[0_10px_22px_rgba(152,217,81,0.2)] transition-[background-color,transform,box-shadow] hover:bg-[#d6f64d] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313] active:scale-[0.99] ${selectedVenue ? '' : 'pointer-events-none opacity-50'}`}
                  href={directionsUrl}
                  rel="noreferrer"
                  target="_blank"
                >
                  <Navigation aria-hidden="true" className="h-4 w-4" />
                  Mở trong Google Maps
                  <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                </a>
              </div>
            </aside>

            <div className="relative order-1 h-[48dvh] min-h-[330px] bg-[#e7eee4] lg:order-2 lg:h-full lg:min-h-0">
              <MapContainer
                center={hanoiCenter}
                className="match-venue-map-google absolute inset-0 z-0 h-full w-full"
                scrollWheelZoom
                zoom={12}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <MapViewport
                  playerLocation={playerLocation}
                  routeCoordinates={routeCoordinates}
                  venues={locatedVenues}
                />
                {playerLocation && (
                  <Marker
                    draggable
                    eventHandlers={{
                      dragend: (event) => {
                        const point = event.target.getLatLng();
                        const correctedLocation = {
                          accuracy: 0,
                          latitude: point.lat,
                          longitude: point.lng,
                        };
                        clearLocationWatch();
                        setIsLocating(false);
                        setPlayerLocation(correctedLocation);
                        cachePlayerLocation(correctedLocation);
                        setLocationError('');
                        setLocationStatus('Đã dùng vị trí bạn chọn trên bản đồ.');
                      },
                    }}
                    icon={playerMarkerIcon}
                    position={[playerLocation.latitude, playerLocation.longitude]}
                    zIndexOffset={1000}
                  >
                    <Popup>
                      <strong>Vị trí của bạn</strong>
                      <br />
                      <span>Kéo điểm này để hiệu chỉnh.</span>
                    </Popup>
                  </Marker>
                )}
                {locatedVenues.map((venue) => (
                  <Marker
                    eventHandlers={{ click: () => setSelectedVenueId(venue.venueId) }}
                    icon={venueMarkerIcon(venue.venueId === selectedVenue?.venueId)}
                    key={venue.venueId}
                    position={[venue.latitude, venue.longitude]}
                  >
                    <Popup>
                      <strong>{venue.venueName}</strong>
                      <br />
                      <span>{venue.address}</span>
                    </Popup>
                  </Marker>
                ))}
                {routeCoordinates.length > 1 && (
                  <Polyline
                    pathOptions={{ color: '#477313', opacity: 0.92, weight: 6 }}
                    positions={routeCoordinates}
                  />
                )}
              </MapContainer>

              <div className="absolute left-3 right-3 top-3 z-[500] flex items-center gap-2 rounded-xl border border-[#d8e4d4] bg-white px-2 py-2 shadow-[0_10px_26px_rgba(8,29,36,0.14)] lg:hidden">
                <button
                  aria-label="Đóng bản đồ"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-[#526158] hover:bg-[#edf5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313]"
                  onClick={onClose}
                  type="button"
                >
                  <ArrowLeft aria-hidden="true" className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-semibold text-[#0b2228]">{selectedVenue?.venueName}</p>
                  <p className="truncate text-[10px] text-[#718077]">{matchTitle}</p>
                </div>
              </div>

              <button
                aria-label="Cập nhật vị trí của tôi"
                className="absolute bottom-5 right-3 z-[500] grid h-11 w-11 place-items-center rounded-xl border border-[#d8e4d4] bg-white text-[#477313] shadow-[0_10px_24px_rgba(8,29,36,0.16)] transition-[background-color,transform,box-shadow] hover:-translate-y-px hover:bg-[#edf5e9] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313] disabled:cursor-wait disabled:opacity-55"
                disabled={isLocating}
                onClick={() => locatePlayer()}
                title="Vị trí của tôi"
                type="button"
              >
                <LocateFixed aria-hidden="true" className={`h-4 w-4 ${isLocating ? 'animate-spin motion-reduce:animate-none' : ''}`} />
              </button>
            </div>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
};
