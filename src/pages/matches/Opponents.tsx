import { useEffect, useMemo, useRef, useState } from 'react';
import { divIcon, latLng, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { AlertTriangle, Bot, CalendarRange, Crosshair, ListChecks, MapPin, Plus, PlusCircle, Route, Sparkles, Trash2, Trophy, UserPlus, UsersRound, X, Settings, Repeat, User } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import {
  createMatch,
  getMatchPlayerRecommendations,
  inviteMatchPlayers,
  searchMatchVenues,
  type MatchFormat,
  type MatchPlayerRecommendation,
  type MatchPreferredVenue,
} from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { joinSoloQueue } from '../../api/matchmaking';
import { CommunityHero, CommunityPage } from '../community/CommunityUI';
import { MatchVenueMapDialog } from './components/MatchVenueMapDialog';
import { AdministrativeAreaSelects } from '../../components/location/AdministrativeAreaSelects';

type PlayerLocation = { accuracy: number; latitude: number; longitude: number };
type InvitationMode = 'automatic' | 'manual' | 'none';
type AvailabilitySlotInput = { id: number; timeFrom: string; timeTo: string };
type ReverseGeocodeAddress = Record<string, string | undefined>;
type ReverseGeocodeResponse = { address?: ReverseGeocodeAddress };

const hanoiCenter: LatLngTuple = [21.0285, 105.8542];
const PLAYER_LOCATION_CACHE_KEY = 'picklink.player-location';
const PLAYER_LOCATION_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ACCURACY_METERS = 1_000;
const skillLevelOptions = [
  { value: 1, label: 'Mới bắt đầu' },
  { value: 2, label: 'Cơ bản' },
  { value: 3, label: 'Trung bình' },
  { value: 4, label: 'Khá' },
  { value: 5, label: 'Chuyên nghiệp' },
];

const distanceBetweenKm = (
  from: PlayerLocation,
  to: { latitude: number; longitude: number },
) => {
  const toRadians = (value: number) => value * Math.PI / 180;
  const latitudeDelta = toRadians(to.latitude - from.latitude);
  const longitudeDelta = toRadians(to.longitude - from.longitude);
  const a = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(toRadians(from.latitude))
    * Math.cos(toRadians(to.latitude))
    * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
};

const today = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};
const currentTime = () => new Date().toTimeString().slice(0, 5);
const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const totalMinutes = index * 30;
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
});

const timeValuePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const isValidTimeValue = (value: string) => timeValuePattern.test(value);
const normalizeTimeInput = (value: string) => {
  const cleaned = value.replace(/[^\d:]/g, '').slice(0, 5);
  if (/^\d{3,4}$/.test(cleaned)) return `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
  return cleaned;
};

type TimeDropdownInputProps = {
  ariaLabel: string;
  inputClass: string;
  label: string;
  minTime?: string;
  onChange: (value: string) => void;
  options: string[];
  value: string;
};

const TimeDropdownInput = ({
  ariaLabel,
  inputClass,
  label,
  minTime,
  onChange,
  options,
  value,
}: TimeDropdownInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const visibleOptions = useMemo(
    () => options.filter((time) => !minTime || time > minTime),
    [minTime, options],
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={rootRef}>
      <label>
        <span className="mb-1 block text-[11px] font-bold text-[#718077]">{label}</span>
        <input
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={ariaLabel}
          className={`${inputClass} font-mono`}
          inputMode="numeric"
          maxLength={5}
          onChange={(event) => onChange(normalizeTimeInput(event.target.value))}
          onFocus={() => setIsOpen(true)}
          onClick={() => setIsOpen(true)}
          placeholder="HH:mm"
          type="text"
          value={value}
        />
      </label>
      {isOpen && (
        <div className="community-scroll absolute left-0 right-0 top-[calc(100%+4px)] z-[1300] max-h-[240px] overflow-y-auto rounded-[10px] border border-[#d8e4d4] bg-white shadow-[0_12px_28px_rgba(8,29,36,0.16)]" role="listbox">
          {visibleOptions.map((time) => (
            <button
              aria-selected={time === value}
              className={`flex h-10 w-full items-center px-3 font-mono text-[13px] font-bold transition-colors ${time === value ? 'bg-[#edf5e9] text-[#0b2228]' : 'text-[#526158] hover:bg-[#f4f8f2]'}`}
              key={time}
              onClick={() => {
                onChange(time);
                setIsOpen(false);
              }}
              onMouseDown={(event) => event.preventDefault()}
              role="option"
              type="button"
            >
              {time}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
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
    // Searching still works when storage is unavailable.
  }
};

const administrativePrefixes = /^(thành phố|tỉnh|tp\.?|phường|xã|thị trấn|quận|huyện|thị xã)\s+/i;
const wardPrefixes = /^(phường|xã|thị trấn)\s+/i;
const normalizeAreaName = (value: string) => value.trim().replace(administrativePrefixes, '').trim();
const pickAddressPart = (address: ReverseGeocodeAddress | undefined, keys: string[]) => {
  if (!address) return '';
  for (const key of keys) {
    const value = address[key]?.trim();
    if (value) return normalizeAreaName(value);
  }
  return '';
};

const pickWard = (address: ReverseGeocodeAddress | undefined) => {
  if (!address) return '';
  const keys = ['ward', 'town', 'municipality', 'city_district', 'borough', 'suburb', 'quarter', 'neighbourhood', 'village', 'hamlet'];
  for (const key of keys) {
    const value = address[key]?.trim();
    if (value && wardPrefixes.test(value)) return normalizeAreaName(value);
  }
  return pickAddressPart(address, keys);
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
    ward: pickWard(address),
  };
};

const geocodeArea = async (province: string, ward?: string) => {
  const query = [ward, province, 'Việt Nam'].filter(Boolean).join(', ');
  const params = new URLSearchParams({
    format: 'jsonv2',
    q: query,
    limit: '1',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: { 'Accept-Language': 'vi' },
  });
  if (!response.ok) throw new Error('Geocoding failed.');
  const data = await response.json();
  if (Array.isArray(data) && data.length > 0) {
    return {
      latitude: Number(data[0].lat),
      longitude: Number(data[0].lon),
      accuracy: 1000,
    };
  }
  return null;
};

const locationErrorMessage = (error: GeolocationPositionError) => {
  if (error.code === error.PERMISSION_DENIED) {
    return 'Bạn chưa cấp quyền vị trí cho trình duyệt. Hãy bấm biểu tượng ổ khóa trên thanh địa chỉ và cho phép Vị trí.';
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return 'Thiết bị chưa cung cấp được vị trí hiện tại. Hãy bật Location services/GPS và Wi-Fi rồi thử lại.';
  }
  if (error.code === error.TIMEOUT) {
    return 'Định vị quá thời gian. Hãy bật Location services/GPS và Wi-Fi rồi thử lại.';
  }
  return 'Không thể lấy vị trí hiện tại. Bạn vẫn có thể tìm sân theo địa chỉ.';
};

const markerIcon = (selected: boolean) => divIcon({
  className: '',
  html: `<div style="width:${selected ? 36 : 30}px;height:${selected ? 36 : 30}px;border-radius:50% 50% 50% 0;background:${selected ? '#0b2228' : '#477313'};border:3px solid white;box-shadow:0 0 0 1px rgba(226,255,87,.4),0 5px 14px rgba(8,29,36,.28);transform:rotate(-45deg);display:grid;place-items:center"><div style="width:8px;height:8px;border-radius:50%;background:#e2ff57"></div></div>`,
  iconAnchor: selected ? [18, 36] : [15, 30],
  popupAnchor: [0, selected ? -36 : -30],
});

const playerLocationIcon = divIcon({
  className: '',
  html: '<div style="width:22px;height:22px;border-radius:50%;background:#e2ff57;border:4px solid white;box-shadow:0 0 0 6px rgba(152,217,81,.22),0 3px 12px rgba(8,29,36,.28)"></div>',
  iconAnchor: [11, 11],
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

const MapClickEvents = ({ onMapClick }: { onMapClick: (lat: number, lon: number) => void }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

export const Opponents = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [creationMode, setCreationMode] = useState<'auto' | 'manual'>('auto');
  const [isActive, setIsActive] = useState(true);
  const [replayType, setReplayType] = useState<string>('None');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [selectedDaysOfMonth, setSelectedDaysOfMonth] = useState<number[]>([]);
  const [weeklySlots, setWeeklySlots] = useState<Record<number, AvailabilitySlotInput[]>>({
    0: [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }],
    1: [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }],
    2: [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }],
    3: [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }],
    4: [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }],
    5: [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }],
    6: [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }],
  });
  const [monthlySlots, setMonthlySlots] = useState<Record<number, AvailabilitySlotInput[]>>({});
  const [title, setTitle] = useState('');
  const [province, setProvince] = useState('');
  const [ward, setWard] = useState('');
  const [radiusKm, setRadiusKm] = useState(5);
  const [location, setLocation] = useState<PlayerLocation | null>(null);
  const [venues, setVenues] = useState<MatchPreferredVenue[]>([]);
  const [selectedVenueIds, setSelectedVenueIds] = useState<number[]>([]);
  const [showRouteMap, setShowRouteMap] = useState(false);
  const [dateFrom, setDateFrom] = useState(today());
  const [dateTo, setDateTo] = useState(today());
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlotInput[]>([
    { id: 1, timeFrom: '18:00', timeTo: '20:00' },
  ]);
  const [minSkill, setMinSkill] = useState(2);
  const [maxSkill, setMaxSkill] = useState(4);
  const [format, setFormat] = useState<MatchFormat>('2vs2');
  const [neededPlayers, setNeededPlayers] = useState(3);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendations, setRecommendations] = useState<MatchPlayerRecommendation[]>([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<number[]>([]);
  const [invitationMode, setInvitationMode] = useState<InvitationMode>('manual');
  const [recommendationError, setRecommendationError] = useState('');
  const [locationAreaStatus, setLocationAreaStatus] = useState('');
  const [error, setError] = useState('');
  const venueRequestId = useRef(0);
  const recommendationRequestId = useRef(0);
  const nextAvailabilitySlotId = useRef(2);

  const orderedAvailabilitySlots = useMemo(
    () => [...availabilitySlots].sort((left, right) => left.timeFrom.localeCompare(right.timeFrom)),
    [availabilitySlots],
  );
  const timeFrom = orderedAvailabilitySlots.reduce(
    (earliest, slot) => slot.timeFrom < earliest ? slot.timeFrom : earliest,
    orderedAvailabilitySlots[0]?.timeFrom ?? '18:00',
  );
  const timeTo = orderedAvailabilitySlots.reduce(
    (latest, slot) => slot.timeTo > latest ? slot.timeTo : latest,
    orderedAvailabilitySlots[0]?.timeTo ?? '20:00',
  );
  const visibleVenues = useMemo(() => {
    if (!location) return venues;
    return venues.filter((venue) =>
      venue.latitude != null
      && venue.longitude != null
      && distanceBetweenKm(location, {
        latitude: venue.latitude,
        longitude: venue.longitude,
      }) <= radiusKm);
  }, [location, radiusKm, venues]);
  const preferredVenueOptions = useMemo(() => {
    const visibleVenueIds = new Set(visibleVenues.map((venue) => venue.venueId));
    return venues.filter((venue) =>
      visibleVenueIds.has(venue.venueId) || selectedVenueIds.includes(venue.venueId));
  }, [selectedVenueIds, venues, visibleVenues]);

  useEffect(() => {
    if (location) return;
    let isActive = true;
    const requestId = ++venueRequestId.current;
    const nextProvince = province.trim();
    const nextWard = ward.trim();

    setIsSearching(true);
    const timeoutId = window.setTimeout(() => {
      searchMatchVenues({
        radiusKm: 10,
        province: nextProvince || undefined,
        ward: nextWard || undefined,
      })
        .then((result) => {
          if (!isActive || requestId !== venueRequestId.current) return;
          setVenues(result);
          setSelectedVenueIds((current) => current.filter((id) => result.some((venue) => venue.venueId === id)));
          setError(result.length === 0 && nextProvince ? 'Chưa có cụm sân nào trong khu vực đã chọn.' : '');
        })
        .catch(() => {
          if (!isActive || requestId !== venueRequestId.current) return;
          setError('Không thể tải vị trí các cụm sân trên bản đồ.');
        })
        .finally(() => {
          if (isActive && requestId === venueRequestId.current) setIsSearching(false);
        });
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [province, ward, location]);
  useEffect(() => {
    const requestId = ++recommendationRequestId.current;
    if (!token || !province.trim() || !ward.trim()) {
      setRecommendations([]);
      setSelectedPlayerIds([]);
      setRecommendationError('');
      setIsLoadingRecommendations(false);
      return;
    }

    setIsLoadingRecommendations(true);
    const timeoutId = window.setTimeout(() => {
      getMatchPlayerRecommendations(token, {
        radiusKm,
        latitude: location?.latitude,
        longitude: location?.longitude,
        province: province.trim(),
        ward: ward.trim(),
        minSkillLevel: minSkill,
        maxSkillLevel: maxSkill,
        limit: 20,
      })
        .then((result) => {
          if (requestId !== recommendationRequestId.current) return;
          setRecommendations(result);
          setSelectedPlayerIds((current) => current.filter((id) => result.some((player) => player.playerId === id)));
          setRecommendationError('');
        })
        .catch((reason) => {
          if (requestId !== recommendationRequestId.current) return;
          setRecommendations([]);
          setRecommendationError(reason instanceof Error ? reason.message : 'Không thể tải người chơi phù hợp.');
        })
        .finally(() => {
          if (requestId === recommendationRequestId.current) setIsLoadingRecommendations(false);
        });
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [location?.latitude, location?.longitude, maxSkill, minSkill, province, radiusKm, token, ward]);

  const loadVenuesInRadius = async (playerLocation: PlayerLocation, nextRadiusKm: number) => {
    const requestId = ++venueRequestId.current;
    setIsSearching(true);
    try {
      const [result, allVenues] = await Promise.all([
        searchMatchVenues({
          radiusKm: nextRadiusKm,
          latitude: playerLocation.latitude,
          longitude: playerLocation.longitude,
        }),
        searchMatchVenues({ radiusKm: 10 }),
      ]);
      if (requestId !== venueRequestId.current) return;
      const nearbyLookup = new Map(result.map((venue) => [venue.venueId, venue]));
      setVenues(allVenues.map((venue) => nearbyLookup.get(venue.venueId) ?? venue));
      setError(result.length === 0 ? `Không có cụm sân nào trong bán kính ${nextRadiusKm} km từ vị trí của bạn.` : '');
    } catch (reason) {
      if (requestId !== venueRequestId.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải các cụm sân trong bán kính đã chọn.');
    } finally {
      if (requestId === venueRequestId.current) setIsSearching(false);
    }
  };

  const locate = (nextRadiusKm = radiusKm) => {
    const cachedLocation = readCachedPlayerLocation();
    if (cachedLocation) {
      setLocation({ ...cachedLocation });
      setError('');
      setLocationAreaStatus('Đang hiển thị vị trí gần nhất và cập nhật lại...');
      void loadVenuesInRadius(cachedLocation, nextRadiusKm);
    }

    if (!navigator.geolocation) {
      setError(cachedLocation ? '' : 'Trình duyệt không hỗ trợ định vị.');
      if (cachedLocation) setLocationAreaStatus('Đang dùng vị trí gần nhất. Trình duyệt không hỗ trợ cập nhật vị trí mới.');
      return;
    }

    if (!window.isSecureContext) {
      setError(cachedLocation ? '' : 'Định vị chỉ hoạt động trên HTTPS hoặc localhost. Hãy mở trang bằng localhost/HTTPS rồi thử lại.');
      if (cachedLocation) setLocationAreaStatus('Đang dùng vị trí gần nhất. Định vị mới chỉ hoạt động trên HTTPS hoặc localhost.');
      return;
    }

    setIsLocating(true);
    if (!cachedLocation) setLocationAreaStatus('Đang lấy vị trí hiện tại...');
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const playerLocation = {
          accuracy: Math.max(0, coords.accuracy),
          latitude: coords.latitude,
          longitude: coords.longitude,
        };
        setLocation(playerLocation);
        cachePlayerLocation(playerLocation);
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
      (locationError) => {
        if (cachedLocation) {
          setError('');
          setLocationAreaStatus('Đang dùng vị trí gần nhất. Chưa thể cập nhật vị trí mới.');
        } else {
          setError(locationErrorMessage(locationError));
          setLocationAreaStatus('');
        }
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 20_000, maximumAge: 0 },
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

  const handleProvinceChange = async (value: string | null) => {
    const prov = value ?? '';
    setProvince(prov);
    setWard('');
    setLocation(null);
    setLocationAreaStatus('');

    if (prov) {
      try {
        const coords = await geocodeArea(prov);
        if (coords) {
          setLocation(coords);
          setLocationAreaStatus(`Đã định vị bản đồ đến: ${prov}`);
          void loadVenuesInRadius(coords, radiusKm);
        }
      } catch (e) {
        console.error('Geocoding province failed', e);
      }
    }
  };

  const handleWardChange = async (value: string | null) => {
    const wd = value ?? '';
    setWard(wd);
    setLocation(null);
    setLocationAreaStatus('');

    if (province && wd) {
      try {
        const coords = await geocodeArea(province, wd);
        if (coords) {
          setLocation(coords);
          setLocationAreaStatus(`Đã định vị bản đồ đến: ${wd}, ${province}`);
          void loadVenuesInRadius(coords, radiusKm);
        }
      } catch (e) {
        console.error('Geocoding ward failed', e);
      }
    } else if (province) {
      try {
        const coords = await geocodeArea(province);
        if (coords) {
          setLocation(coords);
          setLocationAreaStatus(`Đã định vị bản đồ đến: ${province}`);
          void loadVenuesInRadius(coords, radiusKm);
        }
      } catch (e) {
        console.error('Geocoding province failed', e);
      }
    }
  };

  const handleMapClick = async (lat: number, lon: number) => {
    const playerLocation = {
      accuracy: 10,
      latitude: lat,
      longitude: lon,
    };
    setLocation(playerLocation);
    setError('');
    setLocationAreaStatus('Đang xác định địa chỉ từ vị trí đã chọn...');
    void loadVenuesInRadius(playerLocation, radiusKm);

    try {
      const area = await reversePlayerArea(playerLocation);
      if (area.province) setProvince(area.province);
      if (area.ward) setWard(area.ward);

      const areaLabel = [area.ward, area.province].filter(Boolean).join(', ');
      setLocationAreaStatus(areaLabel
        ? `Đã chọn vị trí: ${areaLabel}`
        : 'Đã chọn vị trí trên bản đồ.');
    } catch {
      setLocationAreaStatus('Đã chọn vị trí trên bản đồ nhưng chưa xác định được địa chỉ.');
    }
  };

  const toggleVenue = (venueId: number) => {
    setSelectedVenueIds((current) =>
      current.includes(venueId) ? current.filter((id) => id !== venueId) : [...current, venueId]);
  };

  const toggleRecommendedPlayer = (playerId: number) => {
    setSelectedPlayerIds((current) =>
      current.includes(playerId) ? current.filter((id) => id !== playerId) : [...current, playerId]);
  };

  const updateAvailabilitySlot = (
    slotId: number,
    field: keyof Omit<AvailabilitySlotInput, 'id'>,
    value: string,
  ) => {
    setAvailabilitySlots((current) => current.map((slot) =>
      slot.id === slotId ? { ...slot, [field]: value } : slot));
  };

  const addAvailabilitySlot = () => {
    setAvailabilitySlots((current) => {
      if (current.length >= 20) return current;
      const previous = current.at(-1);
      return [...current, {
        id: nextAvailabilitySlotId.current++,
        timeFrom: previous?.timeFrom ?? '18:00',
        timeTo: previous?.timeTo ?? '20:00',
      }];
    });
  };

  const removeAvailabilitySlot = (slotId: number) => {
    setAvailabilitySlots((current) => current.length === 1
      ? current
      : current.filter((slot) => slot.id !== slotId));
  };

  const addWeeklySlot = (day: number) => {
    setWeeklySlots((current) => {
      const slots = current[day] ?? [];
      if (slots.length >= 20) return current;
      const previous = slots.at(-1);
      const newSlot = {
        id: nextAvailabilitySlotId.current++,
        timeFrom: previous?.timeFrom ?? '18:00',
        timeTo: previous?.timeTo ?? '20:00',
      };
      return { ...current, [day]: [...slots, newSlot] };
    });
  };

  const removeWeeklySlot = (day: number, slotId: number) => {
    setWeeklySlots((current) => {
      const slots = current[day] ?? [];
      if (slots.length <= 1) return current;
      return { ...current, [day]: slots.filter((slot) => slot.id !== slotId) };
    });
  };

  const updateWeeklySlot = (day: number, slotId: number, field: keyof Omit<AvailabilitySlotInput, 'id'>, value: string) => {
    setWeeklySlots((current) => {
      const slots = current[day] ?? [];
      const updated = slots.map((slot) => slot.id === slotId ? { ...slot, [field]: value } : slot);
      return { ...current, [day]: updated };
    });
  };

  const addMonthlySlot = (day: number) => {
    setMonthlySlots((current) => {
      const slots = current[day] ?? [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }];
      if (slots.length >= 20) return current;
      const previous = slots.at(-1);
      const newSlot = {
        id: nextAvailabilitySlotId.current++,
        timeFrom: previous?.timeFrom ?? '18:00',
        timeTo: previous?.timeTo ?? '20:00',
      };
      return { ...current, [day]: [...slots, newSlot] };
    });
  };

  const removeMonthlySlot = (day: number, slotId: number) => {
    setMonthlySlots((current) => {
      const slots = current[day] ?? [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }];
      if (slots.length <= 1) return current;
      return { ...current, [day]: slots.filter((slot) => slot.id !== slotId) };
    });
  };

  const updateMonthlySlot = (day: number, slotId: number, field: keyof Omit<AvailabilitySlotInput, 'id'>, value: string) => {
    setMonthlySlots((current) => {
      const slots = current[day] ?? [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }];
      const updated = slots.map((slot) => slot.id === slotId ? { ...slot, [field]: value } : slot);
      return { ...current, [day]: updated };
    });
  };

  const changeFormat = (value: MatchFormat) => {
    setFormat(value);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!province.trim() || !ward.trim()) {
      setError('Vui lòng chọn Tỉnh/Thành phố và Quận/Huyện để tìm đối thủ.');
      return;
    }

    const timeToMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };

    const validateSlotList = (slots: AvailabilitySlotInput[], contextName: string) => {
      const ordered = [...slots].sort((left, right) => left.timeFrom.localeCompare(right.timeFrom));
      const hasMissing = ordered.some((slot) => !slot.timeFrom || !slot.timeTo);
      if (hasMissing) {
        return `Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc cho mỗi slot ở ${contextName}.`;
      }
      const hasInvalid = ordered.some((slot) => {
        if (!slot.timeFrom || !slot.timeTo) return false;
        return timeToMinutes(slot.timeTo) - timeToMinutes(slot.timeFrom) < 30;
      });
      if (hasInvalid) {
        return `Giờ kết thúc của mỗi slot ở ${contextName} phải lớn hơn giờ bắt đầu ít nhất 30 phút.`;
      }
      const hasOverlap = ordered.some((slot, index) => {
        const previous = ordered[index - 1];
        return previous && slot.timeFrom < previous.timeTo;
      });
      if (hasOverlap) {
        return `Các slot chơi ở ${contextName} không được trùng hoặc chồng thời gian.`;
      }
      return null;
    };

    let queueSlots: any[] = [];

    if (replayType === 'None' || replayType === 'Daily') {
      const errorMsg = validateSlotList(availabilitySlots, 'khung giờ chơi');
      if (errorMsg) {
        setError(errorMsg);
        return;
      }
      if (replayType === 'Daily') {
        queueSlots = orderedAvailabilitySlots.map((slot) => ({
          timeStart: slot.timeFrom,
          timeEnd: slot.timeTo,
        }));
      } else {
        // None (One-off)
        if (!dateFrom || !dateTo) {
          setError('Vui lòng chọn đầy đủ ngày có thể chơi.');
          return;
        }
        if (dateFrom < today()) {
          setError('Ngày bắt đầu không được ở trong quá khứ.');
          return;
        }
        if (dateTo < dateFrom) {
          setError('Ngày kết thúc phải bằng hoặc sau ngày bắt đầu.');
          return;
        }

        let current = new Date(dateFrom);
        const end = new Date(dateTo);
        while (current <= end) {
          const dateStr = current.toISOString().slice(0, 10);
          orderedAvailabilitySlots.forEach((slot) => {
            queueSlots.push({
              specificDate: dateStr,
              timeStart: slot.timeFrom,
              timeEnd: slot.timeTo,
            });
          });
          current.setDate(current.getDate() + 1);
        }
      }
    } else if (replayType === 'Weekly') {
      if (selectedWeekdays.length === 0) {
        setError('Vui lòng chọn ít nhất một ngày trong tuần.');
        return;
      }
      const weekdayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      for (const day of selectedWeekdays) {
        const slots = weeklySlots[day] ?? [];
        if (slots.length === 0) {
          setError(`Vui lòng thêm ít nhất một khung giờ cho ${weekdayNames[day]}.`);
          return;
        }
        const errorMsg = validateSlotList(slots, weekdayNames[day]);
        if (errorMsg) {
          setError(errorMsg);
          return;
        }
        const ordered = [...slots].sort((left, right) => left.timeFrom.localeCompare(right.timeFrom));
        ordered.forEach((slot) => {
          queueSlots.push({
            dayOfWeek: day,
            timeStart: slot.timeFrom,
            timeEnd: slot.timeTo,
          });
        });
      }
    } else if (replayType === 'Monthly') {
      if (selectedDaysOfMonth.length === 0) {
        setError('Vui lòng chọn ít nhất một ngày trong tháng.');
        return;
      }
      for (const day of selectedDaysOfMonth) {
        const slots = monthlySlots[day] ?? [];
        if (slots.length === 0) {
          setError(`Vui lòng thêm ít nhất một khung giờ cho Ngày ${day}.`);
          return;
        }
        const errorMsg = validateSlotList(slots, `Ngày ${day}`);
        if (errorMsg) {
          setError(errorMsg);
          return;
        }
        const ordered = [...slots].sort((left, right) => left.timeFrom.localeCompare(right.timeFrom));
        ordered.forEach((slot) => {
          queueSlots.push({
            dayOfMonth: day,
            timeStart: slot.timeFrom,
            timeEnd: slot.timeTo,
          });
        });
      }
    }

    let replayWeekdaysStr: string | null = null;
    if (replayType === 'Weekly') {
      const weekdaysNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      replayWeekdaysStr = selectedWeekdays.map((d) => weekdaysNames[d]).join(',');
    }

    setIsCreating(true);
    try {
      await joinSoloQueue(token, {
        matchType: format,
        searchRadiusKm: radiusKm,
        searchLatitude: location?.latitude,
        searchLongitude: location?.longitude,
        replayType,
        replayWeekdays: replayWeekdaysStr,
        isPublic: creationMode === 'manual',
        isActive: creationMode === 'auto' ? true : isActive,
        province: province.trim() || null,
        ward: ward.trim() || null,
        sharedVenues: selectedVenueIds.length > 0 ? selectedVenueIds.join(',') : null,
        queueSlots,
      });
      navigate('/my-matches');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đăng ký hàng chờ ghép trận.');
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
        description="Đăng ký các khung giờ và khu vực chơi của bạn. Hệ thống sẽ tự động ghép cặp người chơi phù hợp nhất."
        icon={Sparkles}
        label="Tìm đối thủ nhanh"
        stats={(
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-mono text-[24px] font-extrabold text-[#e2ff57]">{selectedVenueIds.length}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/65">cụm sân đã chọn</p>
            </div>
            <div>
              <p className="font-mono text-[24px] font-extrabold text-[#e2ff57]">{format}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/65">hình thức tìm</p>
            </div>
          </div>
        )}
        title="Vào hàng chờ ghép trận"
      />

      {roomExpired && (
        <div className="mx-auto mt-5 max-w-[1216px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] font-bold text-amber-800">
          Lời mời đã hết khoảng ngày có thể chơi và được chuyển sang trạng thái Hết hạn.
        </div>
      )}

      <main className="community-container grid items-start gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
        <form className="community-panel space-y-4 p-4 sm:p-5" noValidate onSubmit={submit}>
          {/* Mode Selector */}
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#edf2ea] p-1">
            <button
              type="button"
              onClick={() => setCreationMode('auto')}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-1 text-[11px] font-extrabold transition-colors ${creationMode === 'auto' ? 'bg-[#0b2228] text-white shadow-sm' : 'text-[#718077] hover:text-[#0b2228]'
                }`}
            >
              <Repeat className="h-3.5 w-3.5" />
              Ghép tự động
            </button>
            <button
              type="button"
              onClick={() => setCreationMode('manual')}
              className={`flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-1 text-[11px] font-extrabold transition-colors ${creationMode === 'manual' ? 'bg-[#0b2228] text-white shadow-sm' : 'text-[#718077] hover:text-[#0b2228]'
                }`}
            >
              <User className="h-3.5 w-3.5" />
              Ghép thủ công
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#0b2228] text-[#e2ff57]"><PlusCircle className="h-5 w-5" /></div>
            <div>
              <h2 className="text-[17px] font-extrabold text-[#0b2228]">Lời mời ghép trận</h2>
              <p className="text-[11px] font-semibold text-[#718077]">Thiết lập khung giờ và sân ưu tiên</p>
            </div>
          </div>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <label>
              <span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Bán kính tìm sân</span>
              <select className={inputClass} onChange={(event) => changeRadius(Number(event.target.value))} value={radiusKm}>
                {[0.5, 1, 2, 3, 5, 10].map((value) => <option key={value} value={value}>{value} km</option>)}
              </select>
            </label>
            <button className="community-button-secondary mt-[22px] !h-10" disabled={isLocating} onClick={() => locate()} type="button">
              <Crosshair className="h-4 w-4" /> {isLocating ? 'Đang định vị' : location ? 'Đã định vị' : 'Vị trí'}
            </button>
          </div>
          {locationAreaStatus && <p className="text-[11px] font-semibold leading-5 text-[#718077]">{locationAreaStatus}</p>}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <AdministrativeAreaSelects
              fieldClassName="block"
              labelClassName="mb-1.5 block text-[12px] font-extrabold text-[#526158]"
              onProvinceChange={handleProvinceChange}
              onWardChange={handleWardChange}
              province={province}
              selectClassName={inputClass}
              ward={ward}
            />
          </div>

          <div>
            <p className="mb-2 text-[12px] font-extrabold text-[#526158]">Cụm sân mong muốn ({selectedVenueIds.length} đã chọn)</p>
            <div className="community-scroll max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[#d8e4d4] p-2">
              {preferredVenueOptions.map((venue) => {
                const distanceKm = location && venue.latitude != null && venue.longitude != null
                  ? distanceBetweenKm(location, {
                    latitude: venue.latitude,
                    longitude: venue.longitude,
                  })
                  : venue.distanceKm;
                const isOutsideRadius = distanceKm != null && distanceKm > radiusKm;
                return (
                  <label className={`flex cursor-pointer gap-3 rounded-[10px] p-2.5 transition-colors ${selectedVenueIds.includes(venue.venueId) ? 'bg-[#edf5e9]' : 'hover:bg-[#f4f8f2]'}`} key={venue.venueId}>
                    <input checked={selectedVenueIds.includes(venue.venueId)} className="mt-1 accent-primary" onChange={() => toggleVenue(venue.venueId)} type="checkbox" />
                    <span>
                      <strong className="block text-[14px]">{venue.venueName}</strong>
                      <span className="mt-1 block text-[12px] leading-5 text-on-surface-variant">{venue.address}</span>
                      {distanceKm != null && (
                        <span className={`text-[12px] font-bold ${isOutsideRadius ? 'text-amber-700' : 'text-primary'}`}>
                          {distanceKm.toFixed(2)} km{isOutsideRadius ? ' · Ngoài bán kính' : ''}
                        </span>
                      )}
                    </span>
                  </label>
                );
              })}
              {preferredVenueOptions.length === 0 && <p className="p-4 text-center text-[13px] text-on-surface-variant">{isSearching ? 'Đang tải các cụm sân...' : 'Chưa có cụm sân nào trong bán kính đã chọn.'}</p>}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[13px] font-bold">Hình thức lời mời</p>
            <div className="grid grid-cols-2 gap-2">
              {(['1vs1', '2vs2'] as const).map((value) => (
                <button
                  className={`min-h-10 rounded-[10px] border px-3 text-[13px] font-extrabold transition-colors ${format === value ? 'border-[#0b2228] bg-[#0b2228] text-white' : 'border-[#d8e4d4] hover:bg-[#edf5e9]'}`}
                  key={value}
                  onClick={() => changeFormat(value)}
                  type="button"
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 border-t border-[#cfe0c8] pt-4">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-[#477313]" />
              <h3 className="text-[13px] font-extrabold text-[#0b2228]">Cấu hình lời mời</h3>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Tần suất tìm lại (Replay)</span>
              <select
                className={inputClass}
                value={replayType}
                onChange={(e) => setReplayType(e.target.value)}
              >
                <option value="None">Một lần (Không tìm lại sau khi khớp)</option>
                <option value="Daily">Hàng ngày (Daily replay)</option>
                <option value="Weekly">Hàng tuần (Weekly replay)</option>
                <option value="Monthly">Hàng tháng (Monthly replay)</option>
              </select>
            </label>

            {(replayType === 'None' || replayType === 'Daily') && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <label>
                    <span className="mb-1 block text-[11px] font-bold text-[#718077]">Từ ngày</span>
                    <input
                      className={inputClass}
                      min={today()}
                      onChange={(event) => {
                        setDateFrom(event.target.value);
                        if (event.target.value > dateTo) setDateTo(event.target.value);
                      }}
                      type="date"
                      value={dateFrom}
                    />
                  </label>
                  <label>
                    <span className="mb-1 block text-[11px] font-bold text-[#718077]">Đến ngày</span>
                    <input
                      className={inputClass}
                      min={dateFrom}
                      onChange={(event) => setDateTo(event.target.value)}
                      type="date"
                      value={dateTo}
                    />
                  </label>
                </div>

                <div className="border-t border-[#cfe0c8] pt-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="text-[12px] font-bold text-[#0b2228]">Khung giờ có thể chơi ({availabilitySlots.length})</span>
                    <button
                      type="button"
                      onClick={addAvailabilitySlot}
                      className="community-button-quiet !min-h-8 !px-2.5"
                      disabled={availabilitySlots.length >= 20}
                    >
                      <Plus className="h-4 w-4" /> Thêm
                    </button>
                  </div>
                  <div className="space-y-3">
                    {availabilitySlots.map((slot, index) => (
                      <div key={slot.id} className="grid grid-cols-[1fr_38px] gap-2 border-b border-[#e2e9df] pb-3 last:border-b-0 last:pb-0">
                        <div className="grid grid-cols-2 gap-2">
                          <label>
                            <span className="mb-1 block text-[11px] font-bold text-[#718077]">Slot {index + 1} bắt đầu</span>
                            <input
                              type="time"
                              className={inputClass}
                              value={slot.timeFrom}
                              onChange={(e) => updateAvailabilitySlot(slot.id, 'timeFrom', e.target.value)}
                            />
                          </label>
                          <label>
                            <span className="mb-1 block text-[11px] font-bold text-[#718077]">Kết thúc</span>
                            <input
                              type="time"
                              className={inputClass}
                              value={slot.timeTo}
                              onChange={(e) => updateAvailabilitySlot(slot.id, 'timeTo', e.target.value)}
                            />
                          </label>
                        </div>
                        <button
                          type="button"
                          disabled={availabilitySlots.length === 1}
                          onClick={() => removeAvailabilitySlot(slot.id)}
                          className="mt-[22px] grid h-10 w-[38px] place-items-center text-red-600 disabled:opacity-30"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {replayType === 'Weekly' && (
              <>
                <div>
                  <span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Chọn các thứ trong tuần</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((label, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setSelectedWeekdays((prev) =>
                            prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
                          );
                        }}
                        className={`min-h-9 rounded-lg border text-[11px] font-extrabold transition-colors ${selectedWeekdays.includes(index)
                          ? 'border-[#0b2228] bg-[#0b2228] text-white'
                          : 'border-[#d8e4d4] hover:bg-[#edf5e9]'
                          }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedWeekdays.map((day) => {
                    const weekdayNames = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                    const slots = weeklySlots[day] ?? [];
                    return (
                      <div key={day} className="rounded-xl border border-[#d8e4d4] p-3 bg-[#edf5e9]/20">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-[12px] font-extrabold text-[#0b2228]">Khung giờ {weekdayNames[day]} ({slots.length})</span>
                          <button
                            type="button"
                            onClick={() => addWeeklySlot(day)}
                            className="community-button-quiet !min-h-8 !px-2.5"
                            disabled={slots.length >= 20}
                          >
                            <Plus className="h-4 w-4" /> Thêm
                          </button>
                        </div>
                        <div className="space-y-3">
                          {slots.map((slot, index) => (
                            <div key={slot.id} className="grid grid-cols-[1fr_38px] gap-2 border-b border-[#e2e9df]/60 pb-3 last:border-b-0 last:pb-0">
                              <div className="grid grid-cols-2 gap-2">
                                <label>
                                  <span className="mb-1 block text-[10px] font-bold text-[#718077]">Bắt đầu</span>
                                  <input
                                    type="time"
                                    className={inputClass}
                                    value={slot.timeFrom}
                                    onChange={(e) => updateWeeklySlot(day, slot.id, 'timeFrom', e.target.value)}
                                  />
                                </label>
                                <label>
                                  <span className="mb-1 block text-[10px] font-bold text-[#718077]">Kết thúc</span>
                                  <input
                                    type="time"
                                    className={inputClass}
                                    value={slot.timeTo}
                                    onChange={(e) => updateWeeklySlot(day, slot.id, 'timeTo', e.target.value)}
                                  />
                                </label>
                              </div>
                              <button
                                type="button"
                                disabled={slots.length === 1}
                                onClick={() => removeWeeklySlot(day, slot.id)}
                                className="mt-[18px] grid h-10 w-[38px] place-items-center text-red-600 disabled:opacity-30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {replayType === 'Monthly' && (
              <>
                <div>
                  <span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Chọn các ngày trong tháng (1 - 31)</span>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setSelectedDaysOfMonth((prev) => {
                            const next = prev.includes(d) ? prev.filter((val) => val !== d) : [...prev, d];
                            if (!prev.includes(d) && !monthlySlots[d]) {
                              setMonthlySlots((curr) => ({
                                ...curr,
                                [d]: [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }]
                              }));
                            }
                            return next;
                          });
                        }}
                        className={`min-h-9 rounded-lg border text-[11px] font-extrabold transition-colors ${
                          selectedDaysOfMonth.includes(d)
                            ? 'border-[#0b2228] bg-[#0b2228] text-white'
                            : 'border-[#d8e4d4] hover:bg-[#edf5e9]'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedDaysOfMonth.map((day) => {
                    const slots = monthlySlots[day] ?? [{ id: 1, timeFrom: '18:00', timeTo: '20:00' }];
                    return (
                      <div key={day} className="rounded-xl border border-[#d8e4d4] p-3 bg-[#edf5e9]/20">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <span className="text-[12px] font-extrabold text-[#0b2228]">Khung giờ Ngày {day} ({slots.length})</span>
                          <button
                            type="button"
                            onClick={() => addMonthlySlot(day)}
                            className="community-button-quiet !min-h-8 !px-2.5"
                            disabled={slots.length >= 20}
                          >
                            <Plus className="h-4 w-4" /> Thêm
                          </button>
                        </div>
                        <div className="space-y-3">
                          {slots.map((slot, index) => (
                            <div key={slot.id} className="grid grid-cols-[1fr_38px] gap-2 border-b border-[#e2e9df]/60 pb-3 last:border-b-0 last:pb-0">
                              <div className="grid grid-cols-2 gap-2">
                                <label>
                                  <span className="mb-1 block text-[10px] font-bold text-[#718077]">Bắt đầu</span>
                                  <input
                                    type="time"
                                    className={inputClass}
                                    value={slot.timeFrom}
                                    onChange={(e) => updateMonthlySlot(day, slot.id, 'timeFrom', e.target.value)}
                                  />
                                </label>
                                <label>
                                  <span className="mb-1 block text-[10px] font-bold text-[#718077]">Kết thúc</span>
                                  <input
                                    type="time"
                                    className={inputClass}
                                    value={slot.timeTo}
                                    onChange={(e) => updateMonthlySlot(day, slot.id, 'timeTo', e.target.value)}
                                  />
                                </label>
                              </div>
                              <button
                                type="button"
                                disabled={slots.length === 1}
                                onClick={() => removeMonthlySlot(day, slot.id)}
                                className="mt-[18px] grid h-10 w-[38px] place-items-center text-red-600 disabled:opacity-30"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {creationMode === 'manual' && (
              <label className="flex cursor-pointer gap-2.5 items-start bg-[#edf5e9]/40 border border-[#cfe0c8]/50 p-2.5 rounded-xl">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <span className="text-[11px] leading-relaxed font-semibold text-[#526158]">
                  <strong className="block text-[#0b2228] text-[12px] font-extrabold">Mở phòng (Tự động tìm kiếm đối thủ)</strong>
                  Hệ thống tự động tìm kiếm đối thủ chạy ngầm song song. Nếu bỏ tích, phòng sẽ chỉ tìm kiếm thông qua việc người dùng khác duyệt tìm và tham gia thủ công.
                </span>
              </label>
            )}
          </div>

          <button className="community-button w-full" disabled={isCreating} type="submit">
            <PlusCircle className="h-5 w-5" />
            {isCreating ? 'Đang tạo lời mời...' : 'Bắt đầu tìm đối thủ (Tạo lời mời)'}
          </button>
        </form>

        <section className="community-panel overflow-hidden xl:sticky xl:top-20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#d8e4d4] p-4">
            <div className="min-w-0">
              <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#0b2228]">Các cụm sân phù hợp</h2>
              <p className="mt-1 text-[11px] font-semibold leading-5 text-[#718077]">Bản đồ dùng để chọn danh sách mong muốn. Chưa có sân hoặc khung giờ nào được giữ.</p>
            </div>
            <button
              className="inline-flex min-h-9 shrink-0 items-center gap-2 rounded-lg bg-[#0b2228] px-3 text-[11px] font-bold text-[#e2ff57] transition-[background-color,transform,box-shadow] hover:-translate-y-px hover:bg-[#14333a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={preferredVenueOptions.length === 0}
              onClick={() => setShowRouteMap(true)}
              type="button"
            >
              <Route aria-hidden="true" className="h-4 w-4" />
              Xem khoảng cách và lộ trình
            </button>
          </div>
          <div className="h-[420px] bg-[#e7eee4] sm:h-[520px] xl:h-[calc(100dvh-190px)] xl:min-h-[540px] xl:max-h-[720px] relative z-10">
            <MapContainer center={location ? [location.latitude, location.longitude] : hanoiCenter} className="match-venue-map-google h-full w-full" scrollWheelZoom zoom={12}>
              <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapViewport location={location} radiusKm={radiusKm} venues={visibleVenues} />
              <MapClickEvents onMapClick={handleMapClick} />
              {location && (
                <Circle
                  center={[location.latitude, location.longitude]}
                  pathOptions={{ color: '#477313', fillColor: '#98d951', fillOpacity: 0.1, opacity: 0.9, weight: 2 }}
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

      {showRouteMap && (
        <MatchVenueMapDialog
          initialSelectedVenueId={selectedVenueIds[0] ?? preferredVenueOptions[0]?.venueId}
          matchTitle="Chọn cụm sân mong muốn"
          onClose={() => setShowRouteMap(false)}
          onVenueToggle={toggleVenue}
          selectedVenueIds={selectedVenueIds}
          venues={preferredVenueOptions}
        />
      )}

      {error && (
        <div
          aria-live="assertive"
          className="fixed bottom-5 left-1/2 z-[1200] flex w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 items-start gap-3 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-red-800 shadow-[0_12px_32px_rgba(80,20,20,0.18)]"
          role="alert"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="min-w-0 flex-1 text-[13px] font-bold leading-5">{error}</p>
          <button
            aria-label="Đóng cảnh báo"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-red-700 transition-colors hover:bg-red-100"
            onClick={() => setError('')}
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      )}
    </CommunityPage>
  );
};
