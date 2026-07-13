import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const dashboardSource = readFileSync(new URL('../../../src/pages/owner/OwnerDashboard.tsx', import.meta.url), 'utf8');
const gridSource = readFileSync(new URL('../../../src/pages/owner/components/OwnerTimelineGrid.tsx', import.meta.url), 'utf8');
const packageSource = readFileSync(new URL('../../../package.json', import.meta.url), 'utf8');

test('owner schedule delegates the primary timetable to OwnerTimelineGrid', () => {
  assert.match(dashboardSource, /from '\.\/components\/OwnerTimelineGrid';/);
  assert.match(dashboardSource, /<OwnerTimelineGrid/);
  assert.match(dashboardSource, /owner-schedule-stage/);
  assert.doesNotMatch(dashboardSource, /slots\.map\(\(slot\) => <button className=\{`min-w-\[62px\]/);
});

test('owner timeline mirrors the court schedule legend and full-width timetable style', () => {
  for (const label of ['Trống', 'Đã đặt', 'Khoá', 'Sự kiện']) {
    assert.match(gridSource, new RegExp(label));
  }

  for (const token of ['#081d24', '#0f2e32', '#143f34', '#276b3f', '#e2ff57', '#eef8e6']) {
    assert.match(gridSource, new RegExp(token));
  }

  assert.match(gridSource, /buildTimelineTicks/);
  assert.match(gridSource, /gridTemplateColumns/);
  assert.match(gridSource, /ownerTimelineGrid/);
});

test('owner timeline separates courts by venue instead of merging every court into one grid', () => {
  assert.match(gridSource, /ownerVenueTimelineSection/);
  assert.match(gridSource, /ownerVenueTimelineSection overflow-hidden rounded-\[14px\]/);
  assert.match(gridSource, /border border-\[#dbe8d3\]/);
  assert.match(gridSource, /shadow-\[0_10px_24px_rgba\(8,29,36,0\.045\)\]/);
  assert.match(gridSource, /gap-\[10px\]/);
  assert.match(gridSource, /visibleVenues\.map/);
  assert.match(gridSource, /venue\.courts\.map/);
  assert.doesNotMatch(gridSource, /venues\.flatMap\(\(venue\) => venue\.courts/);
});

test('frontend test script includes the owner schedule timeline contract', () => {
  assert.match(packageSource, /tests\/pages\/owner\/OwnerDashboard\.structure\.test\.ts/);
});

test('owner schedule can confirm a held player booking from the slot drawer', () => {
  assert.match(dashboardSource, /selectedSlotItem\.status === 'Holding'/);
  assert.doesNotMatch(dashboardSource, /selectedSlotItem\.status === 'Pending'/);
});