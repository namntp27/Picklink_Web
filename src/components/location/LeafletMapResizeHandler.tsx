import { useEffect } from 'react';
import { useMap } from 'react-leaflet';

/** Keeps Leaflet's internal viewport in sync with responsive layout changes. */
export const LeafletMapResizeHandler = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    let animationFrame = 0;

    const invalidateMapSize = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        map.invalidateSize({ animate: false, pan: false });
      });
    };

    invalidateMapSize();

    const resizeObserver = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(invalidateMapSize);
    resizeObserver?.observe(container);
    window.addEventListener('resize', invalidateMapSize);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', invalidateMapSize);
      window.cancelAnimationFrame(animationFrame);
    };
  }, [map]);

  return null;
};
