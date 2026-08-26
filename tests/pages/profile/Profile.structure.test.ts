import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const profileSource = readFileSync(new URL('../../../src/pages/profile/Profile.tsx', import.meta.url), 'utf8');
const matchesApiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');

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

test('profile shows match reviews received by the current player', () => {
  assert.match(matchesApiSource, /\/api\/matches\/reviews\/received/);
  assert.match(profileSource, /getReceivedMatchReviews\(token!\)/);
  assert.match(profileSource, /Đánh giá về bạn/);
  assert.match(profileSource, /review\.reviewerName/);
  assert.match(profileSource, /review\.score/);
  assert.match(profileSource, /review\.comment/);
  assert.match(profileSource, /to=\{`\/matches\/\$\{review\.matchId\}`\}/);
});

test('profile lets the player view and update their phone number', () => {
  assert.match(profileSource, /Số điện thoại/);
  assert.match(profileSource, /type="tel"/);
  assert.match(profileSource, /setField\('phoneNumber', event\.target\.value\)/);
  assert.equal(profileSource.match(/phoneNumber: profile\.phoneNumber/g)?.length, 2);
});

test('profile shows skill level as text, like other pages', () => {
  assert.match(profileSource, /skillLevelName = \(level\?: number\) => \(\{ 1: 'Mới chơi', 2: 'Cơ bản', 3: 'Trung bình', 4: 'Khá', 5: 'Nâng cao' \}/);
  assert.match(profileSource, /skillLevelName\(toSkillLevelStep\(profile\.skillLevel\)\)/);
  assert.match(profileSource, /skillLevel: toSkillLevelStep\(loadedProfile\.skillLevel\)/);
  assert.doesNotMatch(profileSource, /skillLevel\?\.toFixed\(1\)/);
});
