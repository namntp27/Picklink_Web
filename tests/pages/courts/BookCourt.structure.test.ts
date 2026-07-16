import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/courts/BookCourt.tsx', import.meta.url), 'utf8');

test('book court uses shared province and ward dropdowns for area filtering', () => {
  assert.match(source, /from '..\/..\/components\/location\/AdministrativeAreaSelects';/);
  assert.match(source, /const \[selectedProvince, setSelectedProvince\] = useState\(''\);/);
  assert.match(source, /const \[selectedWard, setSelectedWard\] = useState\(''\);/);
  assert.match(source, /const areaFilter = \[selectedWard, selectedProvince\]\.filter\(Boolean\)\.join\(' '\);/);
  assert.match(source, /area: areaFilter,/);
  assert.match(source, /<AdministrativeAreaSelects/);
  assert.match(source, /province=\{selectedProvince\}/);
  assert.match(source, /ward=\{selectedWard\}/);
  assert.match(source, /fieldClassName=\"min-w-0 flex items-center gap-2\"/);
  assert.match(source, /labelClassName=\"shrink-0 text-\[11px\] font-bold text-white\/70\"/);
  assert.match(source, /selectClassName=\{`\$\{compactInputClass\} min-w-0 flex-1`\}/);
  assert.match(source, /setSelectedWard\(''\);/);
  assert.doesNotMatch(source, /const \[area, setArea\] = useState\(''\);/);
  assert.doesNotMatch(source, /placeholder="Khu v/);
  assert.doesNotMatch(source, /labelClassName=\"sr-only\"/);
});

test('book court filter hero allows province and ward menus to escape the card', () => {
  assert.match(source, /className="relative z-10 overflow-visible rounded-2xl/);
  assert.match(source, /<div className="relative z-30 mt-2 grid gap-2/);
  assert.doesNotMatch(source, /className="relative z-10 overflow-hidden rounded-2xl border border-white\/15 bg-\[#081d24\]/);
});
