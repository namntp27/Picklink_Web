import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/matches/Opponents.tsx', import.meta.url), 'utf8');

test('opponents page uses shared province and ward dropdowns', () => {
  assert.match(source, /from '..\/..\/components\/location\/AdministrativeAreaSelects';/);
  assert.match(source, /const \[province, setProvince\] = useState\(''\);/);
  assert.match(source, /const \[ward, setWard\] = useState\(''\);/);
  assert.match(source, /<AdministrativeAreaSelects/);
  assert.match(source, /province=\{province\}/);
  assert.match(source, /ward=\{ward\}/);
  assert.match(source, /setProvince\(value \?\? ''\);/);
  assert.match(source, /setWard\(''\);/);
  assert.match(source, /onWardChange=\{\(value\) => setWard\(value \?\? ''\)\}/);
  assert.doesNotMatch(source, /placeholder="Hà Nội"/);
  assert.doesNotMatch(source, /placeholder="Cầu Giấy"/);
  assert.doesNotMatch(source, /onChange=\{\(event\) => setProvince\(event\.target\.value\)\}/);
  assert.doesNotMatch(source, /onChange=\{\(event\) => setWard\(event\.target\.value\)\}/);
});