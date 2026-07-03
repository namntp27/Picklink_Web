import { useEffect, useMemo, useState } from 'react';
import { Crosshair, MapPin, Search } from 'lucide-react';
import { divIcon, type LatLngExpression, type LeafletMouseEvent } from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

type LocationValue = {
  address: string;
  latitude: string;
  longitude: string;
};

type SearchResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
};

const hanoiCenter: LatLngExpression = [21.0285, 105.8542];
const markerIcon = divIcon({
  className: '',
  html: '<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:#2f6b00;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,.35);transform:rotate(-45deg)"><div style="width:8px;height:8px;border-radius:50%;background:white;margin:7px"></div></div>',
  iconAnchor: [14, 28],
  iconSize: [28, 28],
});

const coordinate = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && value.trim() !== '' ? parsed : null;
};

const geolocationErrorMessage = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Quyền vị trí đang bị chặn. Bấm biểu tượng ổ khóa bên trái thanh địa chỉ, cho phép Vị trí rồi tải lại trang.';
    case error.POSITION_UNAVAILABLE:
      return 'Máy tính chưa cung cấp được vị trí. Hãy bật Location services của Windows và Wi-Fi rồi thử lại.';
    case error.TIMEOUT:
      return 'Định vị quá thời gian. Hãy bật Location services/Wi-Fi rồi thử lại hoặc chọn trực tiếp trên bản đồ.';
    default:
      return 'Không lấy được vị trí hiện tại. Bạn có thể chọn trực tiếp trên bản đồ.';
  }
};

const reverseAddress = async (lat: number, lng: number) => {
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
    headers: { 'Accept-Language': 'vi' },
  });
  if (!response.ok) throw new Error('Reverse geocoding failed.');
  const result = await response.json() as { display_name?: string };
  return result.display_name ?? '';
};

const MapClickHandler = ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({
    click: (event: LeafletMouseEvent) => onSelect(event.latlng.lat, event.latlng.lng),
  });
  return null;
};

const RecenterMap = ({ position }: { position: LatLngExpression | null }) => {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, 17);
  }, [map, position]);
  return null;
};

export const OpenStreetMapLocationPicker = ({
  value,
  onChange,
}: {
  value: LocationValue;
  onChange: (nextValue: LocationValue) => void;
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [status, setStatus] = useState('Tìm địa chỉ, kéo marker hoặc bấm trực tiếp trên bản đồ.');

  const position = useMemo<LatLngExpression | null>(() => {
    const lat = coordinate(value.latitude);
    const lng = coordinate(value.longitude);
    return lat === null || lng === null ? null : [lat, lng];
  }, [value.latitude, value.longitude]);

  const selectPosition = async (lat: number, lng: number, knownAddress?: string) => {
    setStatus('Đang xác định địa chỉ...');
    let address = knownAddress ?? value.address;
    if (!knownAddress) {
      try { address = await reverseAddress(lat, lng); }
      catch { setStatus('Đã cập nhật tọa độ nhưng không lấy được tên địa chỉ.'); }
    }
    onChange({ address, latitude: lat.toFixed(7), longitude: lng.toFixed(7) });
    if (address) setStatus('Đã cập nhật vị trí sân.');
  };

  const searchAddress = async (event: React.FormEvent) => {
    event.preventDefault();
    const keyword = query.trim();
    if (!keyword) return;
    setIsSearching(true);
    setStatus('Đang tìm trên OpenStreetMap...');
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(keyword)}&limit=5&countrycodes=vn&addressdetails=1`, {
        headers: { 'Accept-Language': 'vi' },
      });
      if (!response.ok) throw new Error('Search failed.');
      const items = await response.json() as SearchResult[];
      setResults(items);
      setStatus(items.length ? `Tìm thấy ${items.length} kết quả.` : 'Không tìm thấy địa chỉ phù hợp.');
    } catch {
      setStatus('Không thể tìm địa chỉ lúc này. Bạn vẫn có thể chọn trực tiếp trên bản đồ.');
    } finally { setIsSearching(false); }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus('Trình duyệt không hỗ trợ định vị.');
      return;
    }

    if (!window.isSecureContext) {
      setStatus('Định vị chỉ hoạt động qua HTTPS hoặc localhost. Hãy mở trang bằng http://localhost:3000 thay vì địa chỉ IP nội bộ.');
      return;
    }

    setIsLocating(true);
    setStatus('Đang lấy vị trí từ trình duyệt...');
    navigator.geolocation.getCurrentPosition(
      (result) => {
        void selectPosition(result.coords.latitude, result.coords.longitude);
        setIsLocating(false);
      },
      (error) => {
        setStatus(geolocationErrorMessage(error));
        setIsLocating(false);
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 20_000,
      },
    );
  };

  return (
    <div className="space-y-3 md:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] font-bold">Vị trí trên OpenStreetMap</span>
        <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-[12px] font-bold text-primary hover:bg-primary/5 disabled:opacity-60" disabled={isLocating} onClick={useCurrentLocation} type="button">
          <Crosshair className="h-4 w-4" /> {isLocating ? 'Đang định vị...' : 'Vị trí hiện tại'}
        </button>
      </div>

      <form className="flex gap-2" onSubmit={searchAddress}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
          <input className="w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none focus:border-primary" onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên đường, phường/xã, quận/huyện..." value={query} />
        </div>
        <button className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60" disabled={isSearching} type="submit">{isSearching ? 'Đang tìm...' : 'Tìm'}</button>
      </form>

      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto rounded-lg border border-outline-variant bg-white shadow-sm">
          {results.map((result) => (
            <button className="flex w-full gap-2 border-b border-outline-variant px-3 py-2.5 text-left text-[12px] font-medium hover:bg-primary/5 last:border-0" key={result.place_id} onClick={() => { setResults([]); setQuery(result.display_name); void selectPosition(Number(result.lat), Number(result.lon), result.display_name); }} type="button">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> {result.display_name}
            </button>
          ))}
        </div>
      )}

      <label>
        <span className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Địa chỉ lưu vào hệ thống</span>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-primary" />
          <input className="w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-10 pr-3 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary" minLength={5} onChange={(event) => onChange({ ...value, address: event.target.value })} required value={value.address} />
        </div>
      </label>

      <div className="h-72 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low">
        <MapContainer center={position ?? hanoiCenter} className="h-full w-full" scrollWheelZoom zoom={position ? 17 : 12}>
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <MapClickHandler onSelect={(lat, lng) => { void selectPosition(lat, lng); }} />
          <RecenterMap position={position} />
          {position && (
            <Marker
              draggable
              eventHandlers={{ dragend: (event) => { const point = event.target.getLatLng(); void selectPosition(point.lat, point.lng); } }}
              icon={markerIcon}
              position={position}
            />
          )}
        </MapContainer>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-medium text-on-surface-variant">{status}</p>
        {position && (
          <a className="text-[12px] font-bold text-primary hover:underline" href={`https://www.openstreetmap.org/?mlat=${value.latitude}&mlon=${value.longitude}#map=18/${value.latitude}/${value.longitude}`} rel="noreferrer" target="_blank">Mở trong OpenStreetMap</a>
        )}
      </div>
    </div>
  );
};
