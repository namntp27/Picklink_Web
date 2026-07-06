import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(new URL('./useNotificationRealtime.ts', import.meta.url), 'utf8');

test('notification realtime hook uses authenticated fetch SSE instead of EventSource', () => {
  assert.match(source, /fetch\(`\$\{API_BASE_URL\}\/api\/realtime\/notifications`/);
  assert.match(source, /Authorization/);
  assert.match(source, /Bearer \$\{accessToken\}/);
  assert.doesNotMatch(source, /new EventSource/);
});

test('notification realtime hook parses notification-updated events', () => {
  assert.match(source, /notification-updated/);
  assert.match(source, /JSON\.parse/);
  assert.match(source, /AbortController/);
});
