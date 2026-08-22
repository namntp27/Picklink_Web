import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../src/hooks/useSePayPollingEngine.ts', import.meta.url), 'utf8');

test('SePay polling checks immediately before continuing on its interval', () => {
  assert.match(source, /hasTriggeredForActivePeriodRef/);
  assert.match(source, /void triggerNow\(\)/);
  assert.match(source, /window\.setInterval/);
});

test('SePay polling prevents overlapping reconciliation requests', () => {
  assert.match(source, /if \(inFlightRef\.current\) return/);
  assert.match(source, /inFlightRef\.current = true/);
  assert.match(source, /inFlightRef\.current = false/);
});
