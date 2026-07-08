import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const apiSource = readFileSync(new URL('../../src/api/locations.ts', import.meta.url), 'utf8');

test('locations API client reads provinces and wards from backend location endpoints', () => {
  assert.match(apiSource, /export type ProvinceOption/);
  assert.match(apiSource, /export type WardOption/);
  assert.match(apiSource, /apiRequest<ProvinceOption\[]>\('\/api\/locations\/provinces'\)/);
  assert.match(apiSource, /apiRequest<WardOption\[]>\(`\/api\/locations\/provinces\/\$\{encodeURIComponent\(provinceCode\)\}\/wards`\)/);
});