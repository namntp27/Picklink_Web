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

type BigDataCloudAdministrativeArea = {
  adminLevel?: number;
  name?: string;
  order?: number;
};

type BigDataCloudReverseResult = {
  city?: string;
  countryCode?: string;
  countryName?: string;
  locality?: string;
  localityInfo?: {
    administrative?: BigDataCloudAdministrativeArea[];
  };
  principalSubdivision?: string;
};

export type GeocodingSearchResult = {
  placeId: number;
  displayName: string;
  latitude: number;
  longitude: number;
};

const requestOptions = (signal?: AbortSignal): RequestInit => signal ? { signal } : {};

const emptyReverseResult = (): ReverseGeocodingResult => ({
  displayName: '',
  province: '',
  ward: '',
});

const normalizedAreaName = (value = '') => value
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .toLowerCase()
  .replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

export const parseBigDataCloudReverseResult = (
  result: BigDataCloudReverseResult,
): ReverseGeocodingResult => {
  if (result.countryCode?.toUpperCase() !== 'VN') return emptyReverseResult();

  const province = result.principalSubdivision?.trim() || result.city?.trim() || '';
  const excludedNames = new Set([
    normalizedAreaName(result.countryName),
    normalizedAreaName(result.city),
    normalizedAreaName(province),
  ]);
  const deepestAdministrativeArea = [...(result.localityInfo?.administrative ?? [])]
    .filter((item) => item.name?.trim() && !excludedNames.has(normalizedAreaName(item.name)))
    .sort((left, right) =>
      (right.adminLevel ?? 0) - (left.adminLevel ?? 0)
      || (right.order ?? 0) - (left.order ?? 0))[0]?.name?.trim() ?? '';
  const ward = result.locality?.trim() || deepestAdministrativeArea;
  const displayName = [ward, province, result.countryName?.trim()]
    .filter((value, index, values): value is string =>
      Boolean(value) && values.findIndex((candidate) =>
        normalizedAreaName(candidate) === normalizedAreaName(value)) === index)
    .join(', ');

  return { displayName, province, ward };
};

const reverseGeocodeWithBrowserFallback = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    localityLanguage: 'vi',
  });
  const response = await fetch(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?${params.toString()}`,
    requestOptions(signal),
  );
  if (!response.ok) throw new Error('Không thể xác định khu vực từ tọa độ hiện tại.');
  return parseBigDataCloudReverseResult(await response.json() as BigDataCloudReverseResult);
};

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

export const reverseGeocodeAddress = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<ReverseGeocodingResult> => {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
  });
  try {
    const result = await apiRequest<ReverseGeocodingResult>(
      `/api/locations/geocode/reverse?${params.toString()}`,
      requestOptions(signal),
    );
    if (result.province || result.ward) return result;
  } catch (reason) {
    if (signal?.aborted) throw reason;
  }

  return reverseGeocodeWithBrowserFallback(latitude, longitude, signal);
};

export const reverseGeocodeArea = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
): Promise<{ province: string; ward: string; displayName: string }> => {
  const { province, ward, displayName } = await reverseGeocodeAddress(latitude, longitude, signal);
  return { province, ward, displayName };
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
