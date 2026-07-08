import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const profileSource = readFileSync(new URL('../../../src/pages/profile/Profile.tsx', import.meta.url), 'utf8');

test('profile activity area uses the shared administrative area dropdown component', () => {
  assert.match(profileSource, /from '..\/..\/components\/location\/AdministrativeAreaSelects';/);
  assert.match(profileSource, /<AdministrativeAreaSelects/);
  assert.match(profileSource, /province=\{profile\.city\}/);
  assert.match(profileSource, /ward=\{profile\.commune\}/);
  assert.match(profileSource, /fieldClassName="profile-field"/);
  assert.match(profileSource, /labelClassName="profile-field-label"/);
  assert.match(profileSource, /selectClassName="profile-control"/);
  assert.doesNotMatch(profileSource, /placeholder="Ví dụ: Hà Nội"/);
  assert.doesNotMatch(profileSource, /placeholder="Ví dụ: Cầu Giấy"/);
});

test('profile activity area does not duplicate shared province and ward options', () => {
  assert.doesNotMatch(profileSource, /province: 'Hưng Yên'/);
  assert.doesNotMatch(profileSource, /administrativeAreas\.map/);
  assert.doesNotMatch(profileSource, /getWardsByProvince\(profile\.city\)/);
});

test('profile clears the selected ward when province changes', () => {
  assert.match(profileSource, /onProvinceChange=\{\(value\) => \{/);
  assert.match(profileSource, /setField\('city', value\);/);
  assert.match(profileSource, /setField\('commune', null\);/);
});