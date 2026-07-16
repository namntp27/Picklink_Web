import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const componentSource = readFileSync(
  new URL('../../../src/components/location/AdministrativeAreaSelects.tsx', import.meta.url),
  'utf8',
);

test('administrative area selects load options and emit area changes atomically', () => {
  assert.match(componentSource, /type AdministrativeAreaSelectsProps/);
  assert.match(componentSource, /onAreaChange\?:/);
  assert.match(componentSource, /listProvinces/);
  assert.match(componentSource, /listWards/);
  assert.match(componentSource, /const nextProvinceName = nextProvince\?\.name \?\? null/);
  assert.match(componentSource, /onAreaChange\(nextProvinceName, null\)/);
  assert.match(
    componentSource,
    /onAreaChange\(selectedProvince\?\.name \?\? null, nextWardName\)/,
  );
  assert.match(componentSource, /aria-label=\{label\}/);
  assert.match(componentSource, /aria-expanded=\{isOpen\}/);
  assert.match(componentSource, /role="listbox"/);
  assert.match(componentSource, /isLoadingProvinces/);
  assert.match(componentSource, /isLoadingWards/);
  assert.doesNotMatch(componentSource, /administrativeAreas\.map/);
  assert.doesNotMatch(componentSource, /getWardsByProvince\(province\)/);
});
