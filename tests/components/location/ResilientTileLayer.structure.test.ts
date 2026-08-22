import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path: string) => readFileSync(new URL('../../../' + path, import.meta.url), 'utf8');

test('court discovery maps use a reachable tile provider with an automatic fallback', () => {
  const tileLayer = read('src/components/location/ResilientTileLayer.tsx');
  const bookCourt = read('src/pages/courts/BookCourt.tsx');
  const opponents = read('src/pages/matches/Opponents.tsx');

  assert.match(tileLayer, /basemaps\.cartocdn\.com/);
  assert.match(tileLayer, /tile\.openstreetmap\.org/);
  assert.match(tileLayer, /tileerror: useFallbackProvider/);
  assert.match(bookCourt, /<ResilientTileLayer \/>/);
  assert.match(opponents, /<ResilientTileLayer \/>/);
});
