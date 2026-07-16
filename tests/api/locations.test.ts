import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseReverseGeocodeArea } from '../../src/utils/reverseGeocodeArea';

const apiSource = readFileSync(new URL('../../src/api/locations.ts', import.meta.url), 'utf8');

test('locations API client reads provinces and wards from backend location endpoints', () => {
  assert.match(apiSource, /export type ProvinceOption/);
  assert.match(apiSource, /export type WardOption/);
  assert.match(apiSource, /apiRequest<ProvinceOption\[]>\('\/api\/locations\/provinces'\)/);
  assert.match(apiSource, /apiRequest<WardOption\[]>\(`\/api\/locations\/provinces\/\$\{encodeURIComponent\(provinceCode\)\}\/wards`\)/);
});

test('reverse geocode uses current province and ward administrative levels', () => {
  const response = (level4: string, level6: string) => ({
    features: [{ properties: { geocoding: { admin: { level4, level6 } } } }],
  });

  assert.deepEqual(
    parseReverseGeocodeArea(response('Thành phố Hồ Chí Minh', 'Phường Sài Gòn')),
    { province: 'Hồ Chí Minh', ward: 'Sài Gòn' },
  );
  assert.deepEqual(
    parseReverseGeocodeArea(response('Hà Nội', 'Phường Hoàn Kiếm')),
    { province: 'Hà Nội', ward: 'Hoàn Kiếm' },
  );
  assert.deepEqual(parseReverseGeocodeArea({}), { province: '', ward: '' });
});
