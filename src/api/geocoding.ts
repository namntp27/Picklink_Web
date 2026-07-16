import { apiRequest } from './client';

type GeocodeCoordinates = {
  latitude: number;
  longitude: number;
};

type ReverseGeocodingResult = {
  displayName: string;
  province: string;
  ward: string;
};

export type GeocodingSearchResult = {
  placeId: number;
  displayName: string;
  latitude: number;
  longitude: number;
};

const requestOptions = (signal?: AbortSignal): RequestInit => signal ? { signal } : {};

export const forwardGeocodeArea = async (
  province: string,
  ward?: string,
  signal?: AbortSignal,
): Promise<GeocodeCoordinates | null> => {
  const params = new URLSearchParams({ province });
  if (ward) params.set('ward', ward);
  const result = await apiRequest<GeocodeCoordinates | null>(
    `/api/locations/geocode/forward?${params.toString()}`,
    requestOptions(signal),
  );
  return result ?? null;
};

export const reverseGeocodeAddress = (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodingResult> => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  return apiRequest<ReverseGeocodingResult>(
    `/api/locations/geocode/reverse?${params.toString()}`,
    requestOptions(signal),
  );
};

export const reverseGeocodeArea = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<{ province: string; ward: string }> => {
  const { province, ward } = await reverseGeocodeAddress(latitude, longitude, signal);
  return { province, ward };
};

export const searchGeocodeAddresses = (
  query: string,
  signal?: AbortSignal,
): Promise<GeocodingSearchResult[]> => {
  const params = new URLSearchParams({ query });
  return apiRequest<GeocodingSearchResult[]>(
    `/api/locations/geocode/search?${params.toString()}`,
    requestOptions(signal),
  );
};
