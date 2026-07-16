type ReverseGeocodeArea = {
  admin?: {
    level4?: string;
    level6?: string;
  };
  city?: string;
  district?: string;
};

export type ReverseGeocodeResponse = {
  features?: Array<{
    properties?: {
      geocoding?: ReverseGeocodeArea;
    };
  }>;
};

const administrativePrefix = /^(thành phố|tỉnh|tp\.?|phường|xã|thị trấn|đặc khu|quận|huyện|thị xã)\s+/i;
const normalizeAreaName = (value = '') => value.trim().replace(administrativePrefix, '').trim();

export const parseReverseGeocodeArea = (result: ReverseGeocodeResponse) => {
  const area = result.features?.[0]?.properties?.geocoding;
  return {
    province: normalizeAreaName(area?.admin?.level4 ?? area?.city),
    ward: normalizeAreaName(area?.admin?.level6 ?? area?.district),
  };
};
