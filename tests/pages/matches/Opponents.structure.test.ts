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
  assert.match(source, /onWardChange=\{\(value\) => \{[\s\S]*setWard\(value \?\? ''\);[\s\S]*\}\}/);
  assert.doesNotMatch(source, /placeholder="Hà Nội"/);
  assert.doesNotMatch(source, /placeholder="Cầu Giấy"/);
  assert.doesNotMatch(source, /onChange=\{\(event\) => setProvince\(event\.target\.value\)\}/);
  assert.doesNotMatch(source, /onChange=\{\(event\) => setWard\(event\.target\.value\)\}/);
});

test('opponents create form uses custom scrollable time dropdown inputs', () => {
  assert.match(source, /const timeOptions = Array\.from\(\{ length: 48 \}/);
  assert.match(source, /const totalMinutes = index \* 30;/);
  assert.doesNotMatch(source, /minTime=\{dateFrom === today\(\) \? currentTime\(\) : undefined\}/);
  assert.match(source, /const timeValuePattern = \/\^\(\[01\]\\d\|2\[0-3\]\):\(\[0-5\]\\d\)\$\//);
  assert.match(source, /const TimeDropdownInput = \(/);
  assert.match(source, /type="text"/);
  assert.match(source, /inputMode="numeric"/);
  assert.match(source, /placeholder="HH:mm"/);
  assert.match(source, /max-h-\[240px\]/);
  assert.match(source, /overflow-y-auto/);
  assert.match(source, /isValidTimeValue/);
  assert.match(source, /value=\{slot\.timeFrom\}/);
  assert.match(source, /value=\{slot\.timeTo\}/);
  assert.doesNotMatch(source, /aria-label=\{`Slot \$\{index \+ 1\} bắt đầu theo hệ 24 giờ`\}/);
  assert.doesNotMatch(source, /aria-label=\{`Slot \$\{index \+ 1\} kết thúc theo hệ 24 giờ`\}/);
  assert.doesNotMatch(source, /type="time"/);
});
