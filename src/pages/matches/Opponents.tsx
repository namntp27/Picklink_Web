import { useEffect, useMemo, useRef, useState } from 'react';
import { divIcon, latLng, type LatLngBoundsExpression, type LatLngTuple } from 'leaflet';
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { AlertTriangle, Bot, CalendarRange, Crosshair, ListChecks, MapPin, Plus, PlusCircle, Route, Sparkles, Trash2, Trophy, UserPlus, UsersRound, X } from 'lucide-react';
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
  }, [province, ward]);
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

  const changeFormat = (value: MatchFormat) => {
    setFormat(value);
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
    if (!Number.isInteger(neededPlayers) || neededPlayers < 1) {
      setError('Số người cần tìm phải là số nguyên từ 1 trở lên.');
      return;
    }
    const hasMissingSlotTime = orderedAvailabilitySlots.some((slot) =>
      !slot.timeFrom || !slot.timeTo);
    const hasInvalidTimeFormat = orderedAvailabilitySlots.some((slot) =>
      !isValidTimeValue(slot.timeFrom) || !isValidTimeValue(slot.timeTo));
    const hasInvalidSlotRange = orderedAvailabilitySlots.some((slot) =>
      isValidTimeValue(slot.timeFrom) && isValidTimeValue(slot.timeTo) && slot.timeTo <= slot.timeFrom);
    const hasPastSlot = dateFrom === today()
      && orderedAvailabilitySlots.some((slot) => isValidTimeValue(slot.timeFrom) && slot.timeFrom <= currentTime());
    const hasOverlappingSlots = orderedAvailabilitySlots.some((slot, index) => {
      const previous = orderedAvailabilitySlots[index - 1];
      return previous && isValidTimeValue(slot.timeFrom) && isValidTimeValue(previous.timeTo) && slot.timeFrom < previous.timeTo;
    });
    if (!dateFrom || !dateTo) {
      setError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc.');
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
    if (hasMissingSlotTime) {
      setError('Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc cho mỗi slot.');
      return;
    }
    if (hasInvalidTimeFormat) {
      setError('Vui lòng nhập giờ theo định dạng HH:mm.');
      return;
    }
    if (hasPastSlot) {
      setError('Giờ bắt đầu của mỗi slot trong hôm nay phải lớn hơn giờ hiện tại.');
      return;
    }
    if (hasInvalidSlotRange) {
      setError('Giờ kết thúc của mỗi slot phải lớn hơn giờ bắt đầu.');
      return;
    }
    if (hasOverlappingSlots) {
      setError('Các slot chơi không được trùng hoặc chồng thời gian.');
      return;
    }
    if (maxSkill < minSkill) {
      setError('Trình độ tối đa không được nhỏ hơn trình độ tối thiểu.');
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
        availabilitySlots: orderedAvailabilitySlots.map((slot) => ({
          timeStart: slot.timeFrom,
          timeEnd: slot.timeTo,
        })),
        minSkillLevel: minSkill,
        maxSkillLevel: maxSkill,
        matchType: format,
        neededPlayerCount: neededPlayers,
      });
      if (invitationMode === 'automatic' || (invitationMode === 'manual' && selectedPlayerIds.length > 0)) {
        try {
          await inviteMatchPlayers(token, match.matchId, {
            automatic: invitationMode === 'automatic',
            playerIds: invitationMode === 'manual' ? selectedPlayerIds : [],
          });
        } catch {
          navigate(`/matches/${match.matchId}?invite=failed`);
          return;
        }
      }
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
        <form className="community-panel space-y-4 p-4 sm:p-5" noValidate onSubmit={submit}>
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[10px] bg-[#0b2228] text-[#e2ff57]"><PlusCircle className="h-5 w-5" /></div>
            <div><h2 className="text-[17px] font-extrabold text-[#0b2228]">Thông tin lời mời</h2><p className="text-[11px] font-semibold text-[#718077]">Không khóa sân ở bước này</p></div>
          </div>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Tiêu đề lời mời</span>
            <input className={inputClass} maxLength={200} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Tìm đội đánh đôi buổi tối" value={title} />
          </label>

          <div className="grid grid-cols-[1fr_auto] gap-3">
            <label>
              <span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Bán kính tìm sân</span>
              <select className={inputClass} onChange={(event) => changeRadius(Number(event.target.value))} value={radiusKm}>
                {[2, 3, 5, 10].map((value) => <option key={value} value={value}>{value} km</option>)}
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
              onProvinceChange={(value) => {
                setLocation(null);
                setLocationAreaStatus('');
                setProvince(value ?? '');
                setWard('');
              }}
              onWardChange={(value) => {
                setLocation(null);
                setLocationAreaStatus('');
                setWard(value ?? '');
              }}
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

          <section className="border-y border-[#cfe0c8] py-3.5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[13px] font-extrabold">
                <CalendarRange className="h-4 w-4 text-[#477313]" />
                Slot có thể chơi ({availabilitySlots.length})
              </p>
              <button
                aria-label="Thêm slot"
                className="community-button-quiet !min-h-8 !px-2.5"
                disabled={availabilitySlots.length >= 20}
                onClick={addAvailabilitySlot}
                title="Thêm slot"
                type="button"
              >
                <Plus className="h-4 w-4" />
                Thêm
              </button>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
            <div className="space-y-3">
              {availabilitySlots.map((slot, index) => (
                <div className="grid grid-cols-[1fr_38px] gap-2 border-b border-[#e2e9df] pb-3 last:border-b-0 last:pb-0" key={slot.id}>
                  <div className="grid grid-cols-2 gap-2">
                    <TimeDropdownInput
                      ariaLabel={`Slot ${index + 1} bắt đầu`}
                      inputClass={inputClass}
                      label={`Slot ${index + 1} bắt đầu`}
                      onChange={(value) => updateAvailabilitySlot(slot.id, 'timeFrom', value)}
                      options={timeOptions}
                      value={slot.timeFrom}
                    />
                    <TimeDropdownInput
                      ariaLabel={`Slot ${index + 1} kết thúc`}
                      inputClass={inputClass}
                      label="Kết thúc"
                      minTime={isValidTimeValue(slot.timeFrom) ? slot.timeFrom : undefined}
                      onChange={(value) => updateAvailabilitySlot(slot.id, 'timeTo', value)}
                      options={timeOptions}
                      value={slot.timeTo}
                    />
                  </div>
                  <button
                    aria-label={`Xóa slot ${index + 1}`}
                    className="mt-[22px] grid h-10 w-[38px] place-items-center text-red-600 disabled:cursor-not-allowed disabled:opacity-30"
                    disabled={availabilitySlots.length === 1}
                    onClick={() => removeAvailabilitySlot(slot.id)}
                    title="Xóa slot"
                    type="button"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label><span className="mb-1 block text-[13px] font-bold">Trình độ tối thiểu</span><select className={inputClass} onChange={(event) => setMinSkill(Number(event.target.value))} value={minSkill}>{skillLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.value} - {option.label}</option>)}</select></label>
            <label><span className="mb-1 block text-[13px] font-bold">Trình độ tối đa</span><select className={inputClass} onChange={(event) => setMaxSkill(Number(event.target.value))} value={maxSkill}>{skillLevelOptions.map((option) => <option key={option.value} value={option.value}>{option.value} - {option.label}</option>)}</select></label>
          </div>
          {maxSkill < minSkill && (
            <p className="text-[11px] font-bold text-red-700" role="alert">
              Trình độ tối đa không được nhỏ hơn trình độ tối thiểu.
            </p>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-[13px] font-bold">Hình thức</p>
              <div className="grid grid-cols-2 gap-2">
                {(['1vs1', '2vs2'] as const).map((value) => (
                  <button className={`min-h-10 rounded-[10px] border px-3 text-[13px] font-extrabold transition-colors ${format === value ? 'border-[#0b2228] bg-[#0b2228] text-white' : 'border-[#d8e4d4] hover:bg-[#edf5e9]'}`} key={value} onClick={() => changeFormat(value)} type="button">{value}</button>
                ))}
              </div>
            </div>
            <label>
              <span className="mb-2 block text-[12px] font-extrabold text-[#526158]">Số người cần tìm</span>
              <input
                className={inputClass}
                min={1}
                onChange={(event) => setNeededPlayers(Number(event.target.value))}
                step={1}
                type="number"
                value={neededPlayers}
              />
            </label>
          </div>

          <section className="border-t border-[#d8e4d4] pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-[14px] font-extrabold text-[#0b2228]">
                  <UsersRound className="h-4 w-4 text-[#477313]" />
                  Người chơi phù hợp
                </h3>
                <p className="mt-1 text-[11px] font-semibold text-[#718077]">
                  {isLoadingRecommendations ? 'Đang tìm...' : `${recommendations.length} người trong phạm vi`}
                </p>
              </div>
              {invitationMode === 'manual' && selectedPlayerIds.length > 0 && (
                <span className="community-badge">{selectedPlayerIds.length} đã chọn</span>
              )}
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1 rounded-[10px] bg-[#edf2ea] p-1">
              {([
                { value: 'automatic', label: 'Tự động', icon: Bot },
                { value: 'manual', label: 'Thủ công', icon: UserPlus },
                { value: 'none', label: 'Không mời', icon: ListChecks },
              ] as const).map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    aria-pressed={invitationMode === option.value}
                    className={`flex min-h-9 items-center justify-center gap-1.5 rounded-[8px] px-2 text-[11px] font-extrabold transition-colors ${
                      invitationMode === option.value ? 'bg-white text-[#0b2228] shadow-sm' : 'text-[#718077] hover:text-[#0b2228]'
                    }`}
                    key={option.value}
                    onClick={() => setInvitationMode(option.value)}
                    type="button"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {option.label}
                  </button>
                );
              })}
            </div>

            {recommendationError && <p className="mt-3 text-[11px] font-bold text-red-700">{recommendationError}</p>}
            {invitationMode !== 'none' && recommendations.length > 0 && (
              <div className="community-scroll mt-3 max-h-56 divide-y divide-[#e2e9df] overflow-y-auto">
                {recommendations.map((player) => (
                  <label
                    className={`flex items-center gap-3 py-2.5 ${invitationMode === 'manual' ? 'cursor-pointer' : ''}`}
                    key={player.playerId}
                  >
                    {invitationMode === 'manual' && (
                      <input
                        checked={selectedPlayerIds.includes(player.playerId)}
                        className="accent-primary"
                        onChange={() => toggleRecommendedPlayer(player.playerId)}
                        type="checkbox"
                      />
                    )}
                    <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-[#0b2228] text-[11px] font-extrabold text-[#e2ff57]">
                      {player.avatarUrl
                        ? <img alt="" className="h-full w-full object-cover" src={player.avatarUrl} />
                        : player.playerName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}
                    </div>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[13px] text-[#0b2228]">{player.playerName}</strong>
                      <span className="block truncate text-[11px] font-semibold text-[#718077]">
                        Level {player.skillLevel.toFixed(1)} · {player.matchReason}
                      </span>
                    </span>
                    <span className="shrink-0 text-[10px] font-bold text-[#477313]">{player.prestige} uy tín</span>
                  </label>
                ))}
              </div>
            )}
            {!isLoadingRecommendations && !recommendationError && recommendations.length === 0 && province.trim() && ward.trim() && (
              <p className="mt-3 py-2 text-center text-[11px] font-semibold text-[#718077]">
                Chưa có người chơi phù hợp trong phạm vi này.
              </p>
            )}
          </section>

          <button className="community-button w-full" disabled={isCreating} type="submit">
            <PlusCircle className="h-5 w-5" /> {isCreating ? 'Đang đăng...' : 'Đăng lời mời'}
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
