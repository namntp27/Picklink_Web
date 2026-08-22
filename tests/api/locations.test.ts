import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseBigDataCloudReverseResult } from '../../src/api/geocoding';
import { administrativeNamesEqual } from '../../src/api/locations';

const locationsSource = readFileSync(
  new URL('../../src/api/locations.ts', import.meta.url),
  'utf8',
);
const geocodingSource = readFileSync(
  new URL('../../src/api/geocoding.ts', import.meta.url),
  'utf8',
);

test('locations API client reads and resolves canonical administrative areas', () => {
  assert.match(locationsSource, /export type ProvinceOption/);
  assert.match(locationsSource, /export type WardOption/);
  assert.match(locationsSource, /apiRequest<ProvinceOption\[]>\('\/api\/locations\/provinces'/);
  assert.match(
    locationsSource,
    /encodeURIComponent\(provinceCode\).*\/wards/s,
  );
  assert.match(locationsSource, /resolveAdministrativeArea/);
  assert.match(locationsSource, /signal \? \{ signal \} : \{\}/);
  assert.match(locationsSource, /provinceCache/);
  assert.match(locationsSource, /wardCache/);
});

test('geocoding client uses the backend proxy before its browser fallback', () => {
  assert.match(geocodingSource, /\/api\/locations\/geocode\/forward/);
  assert.match(geocodingSource, /\/api\/locations\/geocode\/reverse/);
  assert.match(geocodingSource, /\/api\/locations\/geocode\/search/);
  assert.doesNotMatch(geocodingSource, /nominatim\.openstreetmap\.org/i);
  assert.match(geocodingSource, /api\.bigdatacloud\.net\/data\/reverse-geocode-client/);
});

test('browser fallback maps Vietnamese province and ward fields', () => {
  assert.deepEqual(parseBigDataCloudReverseResult({
    countryCode: 'VN',
    countryName: 'Việt Nam',
    principalSubdivision: 'Thành phố Hồ Chí Minh',
    city: 'Thành phố Hồ Chí Minh',
    locality: 'Bến Thành',
    localityInfo: {
      administrative: [
        { name: 'Việt Nam', adminLevel: 2, order: 3 },
        { name: 'Thành phố Hồ Chí Minh', adminLevel: 4, order: 8 },
        { name: 'Sài Gòn', adminLevel: 6, order: 10 },
        { name: 'Bến Thành', adminLevel: 6, order: 11 },
      ],
    },
  }), {
    displayName: 'Bến Thành, Thành phố Hồ Chí Minh, Việt Nam',
    province: 'Thành phố Hồ Chí Minh',
    ward: 'Bến Thành',
  });
});

test('reverse geocoding can resolve canonical administrative options from the provider label', () => {
  assert.match(locationsSource, /findByNameInText/);
  assert.match(locationsSource, /fallbackText/);
  assert.match(locationsSource, /resolvedProvince/);
  assert.match(locationsSource, /resolvedWard/);
  assert.match(geocodingSource, /displayName/);
});

test('administrative names match catalog spelling and optional prefixes', () => {
  assert.equal(
    administrativeNamesEqual(
      'Ph\u01b0\u1eddng H\u00f2a Minh',
      'Ph\u01b0\u1eddng Ho\u00e0 Minh',
    ),
    true,
  );
  assert.equal(
    administrativeNamesEqual(
      'Th\u00e0nh ph\u1ed1 H\u00e0 N\u1ed9i',
      'H\u00e0 N\u1ed9i',
    ),
    true,
  );
  assert.equal(administrativeNamesEqual('Ha Noi', 'Da Nang'), false);
});
