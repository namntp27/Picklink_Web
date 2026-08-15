import assert from 'node:assert/strict';
import { before, test } from 'node:test';
import { createServer } from 'vite';

let defaultMatchBookingDate: typeof import('../../src/pages/matches/MatchDetail').defaultMatchBookingDate;
let matchBookingSlotLabel: typeof import('../../src/pages/matches/MatchDetail').matchBookingSlotLabel;
let mergeAdjacentMatchBookingSlots: typeof import('../../src/pages/matches/MatchDetail').mergeAdjacentMatchBookingSlots;

before(async () => {
  const vite = await createServer({ appType: 'custom', configFile: false, optimizeDeps: { noDiscovery: true }, server: { hmr: false, ws: false, middlewareMode: true } });
  ({ defaultMatchBookingDate, matchBookingSlotLabel, mergeAdjacentMatchBookingSlots } = await vite.ssrLoadModule('/src/pages/matches/MatchDetail.tsx') as typeof import('../../src/pages/matches/MatchDetail'));
  await vite.close();
});

test('match booking defaults to today when today is available', () => {
  assert.equal(defaultMatchBookingDate('2026-07-01', '2026-07-31', '2026-07-19'), '2026-07-19');
  assert.equal(defaultMatchBookingDate('2026-07-20', '2026-07-31', '2026-07-19'), '2026-07-20');
  assert.equal(defaultMatchBookingDate('2026-07-01', '2026-07-18', '2026-07-19'), '2026-07-01');
});

test('match booking slot label keeps each selected date and time range together', () => {
  assert.equal(
    matchBookingSlotLabel('2026-08-15T15:00:00', '2026-08-15T15:30:00'),
    '15/08/2026 · 15:00–15:30',
  );
  assert.equal(
    matchBookingSlotLabel('2026-08-16T18:00:00', '2026-08-16T18:30:00'),
    '16/08/2026 · 18:00–18:30',
  );
});

test('match booking summary merges adjacent slots and keeps gaps on separate lines', () => {
  const groups = mergeAdjacentMatchBookingSlots([
    { bookingSlotId: 1, courtId: 10, courtNumber: 1, startTime: '2026-08-15T15:00:00', endTime: '2026-08-15T15:30:00' },
    { bookingSlotId: 2, courtId: 10, courtNumber: 1, startTime: '2026-08-15T15:30:00', endTime: '2026-08-15T16:00:00' },
    { bookingSlotId: 3, courtId: 10, courtNumber: 1, startTime: '2026-08-15T17:00:00', endTime: '2026-08-15T17:30:00' },
    { bookingSlotId: 4, courtId: 11, courtNumber: 2, startTime: '2026-08-15T16:00:00', endTime: '2026-08-15T16:30:00' },
  ]);

  assert.deepEqual(groups.map(({ courtNumber, startTime, endTime }) => ({ courtNumber, startTime, endTime })), [
    { courtNumber: 1, startTime: '2026-08-15T15:00:00', endTime: '2026-08-15T16:00:00' },
    { courtNumber: 2, startTime: '2026-08-15T16:00:00', endTime: '2026-08-15T16:30:00' },
    { courtNumber: 1, startTime: '2026-08-15T17:00:00', endTime: '2026-08-15T17:30:00' },
  ]);
});
