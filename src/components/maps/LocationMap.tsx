import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({ iconRetinaUrl: markerIcon2x, iconUrl: markerIcon, shadowUrl: markerShadow });

type LocationMapProps = {
  latitude: number;
  longitude: number;
  onChange?: (latitude: number, longitude: number) => void;
  className?: string;
};

const MapSync = ({ latitude, longitude }: Pick<LocationMapProps, 'latitude' | 'longitude'>) => {
  const map = useMap();
  useEffect(() => {
    map.setView([latitude, longitude], map.getZoom(), { animate: false });
  }, [latitude, longitude, map]);
  return null;
};

const MapInteraction = ({ onChange }: Pick<LocationMapProps, 'onChange'>) => {
  useMapEvents({
    click: (event) => onChange?.(event.latlng.lat, event.latlng.lng),
  });
  return null;
};

export const LocationMap = ({ latitude, longitude, onChange, className = 'h-72' }: LocationMapProps) => (
  <MapContainer
    center={[latitude, longitude]}
    zoom={14}
    scrollWheelZoom
    className={`w-full ${className}`}
  >
    <TileLayer
      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    />
    <Marker position={[latitude, longitude]} />
    <MapSync latitude={latitude} longitude={longitude} />
    <MapInteraction onChange={onChange} />
  </MapContainer>
);
