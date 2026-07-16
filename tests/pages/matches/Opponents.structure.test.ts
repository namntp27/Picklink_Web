import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(
  new URL('../../../src/pages/matches/Opponents.tsx', import.meta.url),
  'utf8',
);

test('opponents page keeps province and ward updates atomic and race-safe', () => {
  assert.match(source, /AdministrativeAreaSelects/);
  assert.match(
    source,
    /const \[\{ province, ward \}, setArea\] = useState\(\{ province: '', ward: '' \}\)/,
  );
  assert.match(source, /onAreaChange=\{handleAreaChange\}/);
  assert.match(source, /const nextArea = \{ province: provinceValue \?\? '', ward: wardValue \?\? '' \}/);
  assert.match(source, /geocodeAbortController\.current\?\.abort\(\)/);
  assert.match(source, /requestId !== geocodeRequestId\.current/);
  assert.doesNotMatch(source, /const \[province, setProvince\]/);
  assert.doesNotMatch(source, /const \[ward, setWard\]/);
});

test('opponents create form enforces playable one-off dates and 90-minute slots', () => {
  assert.match(source, /type="time"/);
  assert.match(source, /timeToMinutes\(slot\.timeTo\) - timeToMinutes\(slot\.timeFrom\) < 90/);
  assert.match(source, /dateFrom < today\(\)/);
  assert.match(source, /dateTo > lastOneOffDate\(dateFrom\)/);
  assert.match(source, /max=\{lastOneOffDate\(dateFrom\)\}/);
  assert.match(
    source,
    /min=\{replayType === 'None' && dateFrom === today\(\) \? currentTime\(\) : undefined\}/,
  );
  assert.doesNotMatch(source, /TimeDropdownInput/);
  assert.doesNotMatch(source, /const timeOptions/);
});

test('manual queues stay discoverable while all new queues remain matchable', () => {
  assert.match(source, /isPublic: creationMode === 'manual'/);
  assert.match(source, /isActive: true/);
  assert.match(source, /\{replayType === 'None' && \(/);
  assert.match(source, /https:\/\/tile\.openstreetmap\.org\/\{z\}\/\{x\}\/\{y\}\.png/);
  assert.doesNotMatch(source, /nominatim\.openstreetmap\.org/i);
});
