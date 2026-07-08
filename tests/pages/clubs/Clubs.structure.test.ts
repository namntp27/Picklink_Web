import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/clubs/Clubs.tsx', import.meta.url), 'utf8');

test('clubs page uses shared province and ward dropdowns for area filtering', () => {
  assert.match(source, /from '..\/..\/components\/location\/AdministrativeAreaSelects';/);
  assert.match(source, /const \[selectedProvince, setSelectedProvince\] = useState\(''\);/);
  assert.match(source, /const \[selectedWard, setSelectedWard\] = useState\(''\);/);
  assert.match(source, /const areaFilter = \[selectedWard, selectedProvince\]\.filter\(Boolean\)\.join\(' '\);/);
  assert.match(source, /buildSearchQuery\(searchTerm, areaFilter\)/);
  assert.match(source, /<AdministrativeAreaSelects/);
  assert.match(source, /province=\{selectedProvince\}/);
  assert.match(source, /ward=\{selectedWard\}/);
  assert.match(source, /setSelectedWard\(''\);/);
  assert.doesNotMatch(source, /selectedCity/);
  assert.doesNotMatch(source, /setSelectedCity/);
  assert.doesNotMatch(source, /<option>Hà Nội<\/option>/);
  assert.doesNotMatch(source, /<option>TP\. Hồ Chí Minh<\/option>/);
});