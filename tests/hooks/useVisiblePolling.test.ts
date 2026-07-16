import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('../../src/hooks/useVisiblePolling.ts', import.meta.url), 'utf8');

test('visible polling pauses in hidden tabs and refreshes when visible', () => {
  assert.match(source, /document\.hidden/);
  assert.match(source, /visibilitychange/);
  assert.match(source, /void run\(\)/);
});

test('visible polling schedules only after the previous request finishes', () => {
  assert.match(source, /await callbackRef\.current\(\)/);
  assert.match(source, /finally[\s\S]*schedule\(\)/);
  assert.doesNotMatch(source, /setInterval/);
});
