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

test('clubs page uses a compact browsing layout instead of a tall landing hero', () => {
  assert.match(source, /data-clubs-compact-header/);
  assert.match(source, /className="border-b border-\[#143f34\] bg-\[#081d24\][^"]*text-white/);
  assert.match(source, /data-clubs-compact-toolbar/);
  assert.match(source, /bg-white\/8/);
  assert.match(source, /bg-\[#e2ff57\][^"]*text-\[#102414\]/);
  assert.match(source, /grid gap-3 sm:grid-cols-2 xl:grid-cols-3/);
  assert.match(source, /line-clamp-2/);
  assert.match(source, /min-h-\[132px\]/);
  assert.match(source, /min-h-9/);
  assert.doesNotMatch(source, /bg-\[#081d24\] px-4 pb-12 pt-24/);
  assert.doesNotMatch(source, /isFeatured/);
  assert.doesNotMatch(source, /md:min-h-\[330px\]/);
  assert.doesNotMatch(source, /Chưa có câu lạc bộ đúng tinh thần/);
});
