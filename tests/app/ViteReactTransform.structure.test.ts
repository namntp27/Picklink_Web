import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const config = readFileSync(new URL('../../vite.shared.config.ts', import.meta.url), 'utf8');

test('React transform excludes optimized dependencies stored outside node_modules', () => {
  assert.match(config, /reactTransformExclude/);
  assert.match(config, /picklink-vite-cache/);
  assert.match(config, /react\(\{ exclude: reactTransformExclude \}\)/);
});
