export type PlayerLocation = {
  accuracy: number;
  latitude: number;
  longitude: number;
};

const CACHE_KEY = 'picklink.player-location';
const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ACCURACY_METERS = 1_000;

export const readCachedPlayerLocation = (): PlayerLocation | null => {
  try {
    const rawValue = window.localStorage.getItem(CACHE_KEY);
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
      && Date.now() - cached.cachedAt <= CACHE_TTL_MS;
    if (!isValid) {
      window.localStorage.removeItem(CACHE_KEY);
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

export const cachePlayerLocation = (location: PlayerLocation) => {
  if (location.accuracy > MAX_CACHE_ACCURACY_METERS) return;
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify({
      ...location,
      cachedAt: Date.now(),
    }));
  } catch {
    // Location features remain usable when storage is unavailable.
  }
};