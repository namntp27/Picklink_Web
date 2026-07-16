import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
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

test('geocoding client only calls the backend proxy', () => {
  assert.match(geocodingSource, /\/api\/locations\/geocode\/forward/);
  assert.match(geocodingSource, /\/api\/locations\/geocode\/reverse/);
  assert.match(geocodingSource, /\/api\/locations\/geocode\/search/);
  assert.doesNotMatch(geocodingSource, /nominatim\.openstreetmap\.org/i);
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
