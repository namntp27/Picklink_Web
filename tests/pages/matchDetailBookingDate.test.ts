import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { createServer } from 'vite';

let defaultMatchBookingDate: typeof import('../../src/pages/matches/MatchDetail').defaultMatchBookingDate;

before(async () => {
  const vite = await createServer({ appType: 'custom', configFile: false, optimizeDeps: { noDiscovery: true }, server: { hmr: false, ws: false, middlewareMode: true } });
  ({ defaultMatchBookingDate } = await vite.ssrLoadModule('/src/pages/matches/MatchDetail.tsx') as typeof import('../../src/pages/matches/MatchDetail'));
  await vite.close();
});

test('match booking defaults to today when today is available', () => {
  assert.equal(defaultMatchBookingDate('2026-07-01', '2026-07-31', '2026-07-19'), '2026-07-19');
  assert.equal(defaultMatchBookingDate('2026-07-20', '2026-07-31', '2026-07-19'), '2026-07-20');
  assert.equal(defaultMatchBookingDate('2026-07-01', '2026-07-18', '2026-07-19'), '2026-07-01');
});