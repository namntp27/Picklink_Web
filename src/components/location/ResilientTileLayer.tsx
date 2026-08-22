import { useCallback, useState } from 'react';
import { TileLayer } from 'react-leaflet';

const tileProviders = [
  {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  },
  {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
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
