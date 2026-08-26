import { useCallback, useState } from 'react';
import { TileLayer } from 'react-leaflet';

const tileProviders = [
  {
    attribution: '&copy; <a href="https://www.esri.com">Esri</a> &mdash; Source: Esri, HERE, Garmin, USGS, NGA, EPA, NPS, OpenStreetMap contributors',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  },
  {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png',
  },
] as const;

export const ResilientTileLayer = () => {
  const [providerIndex, setProviderIndex] = useState(0);
  const provider = tileProviders[providerIndex];

  const useFallbackProvider = useCallback(() => {
    setProviderIndex((current) => Math.min(current + 1, tileProviders.length - 1));
  }, []);

  return (
    <TileLayer
      attribution={provider.attribution}
      eventHandlers={{ tileerror: useFallbackProvider }}
      key={provider.url}
      url={provider.url}
    />
  );
};
