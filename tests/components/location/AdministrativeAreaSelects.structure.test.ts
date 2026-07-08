import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const componentSource = readFileSync(new URL('../../../src/components/location/AdministrativeAreaSelects.tsx', import.meta.url), 'utf8');

test('administrative area selects loads province and ward options from the locations API', () => {
  assert.match(componentSource, /type AdministrativeAreaSelectsProps/);
  assert.match(componentSource, /listProvinces/);
  assert.match(componentSource, /listWards/);
  assert.match(componentSource, /useEffect/);
  assert.match(componentSource, /onProvinceChange\(nextProvince\?\.name \?\? null\)/);
  assert.match(componentSource, /onWardChange\(nextWard\?\.name \?\? null\)/);
  assert.match(componentSource, /aria-label="Tỉnh hoặc thành phố"/);
  assert.match(componentSource, /aria-label="Xã hoặc phường"/);
  assert.match(componentSource, /isLoadingProvinces \? '\u0110ang t\u1ea3i\.\.\.' : 'T\u1ec9nh\/th\u00e0nh'/);
  assert.match(componentSource, /isLoadingWards \? '\u0110ang t\u1ea3i\.\.\.' : 'X\u00e3\/ph\u01b0\u1eddng'/);
  assert.doesNotMatch(componentSource, /'Ch\u01b0a ch\u1ecdn'/);  assert.doesNotMatch(componentSource, /administrativeAreas\.map/);
  assert.doesNotMatch(componentSource, /getWardsByProvince\(province\)/);
});