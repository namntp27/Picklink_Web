import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const apiTestDir = path.dirname(fileURLToPath(import.meta.url));

test('API module tests disable Vite websocket servers', () => {
  const offenders = readdirSync(apiTestDir)
    .filter((file) => file.endsWith('.test.ts') && file !== 'viteServer.structure.test.ts')
    .filter((file) => {
      const source = readFileSync(path.join(apiTestDir, file), 'utf8');
      return source.includes('createServer(')
        && (!source.includes('hmr: false') || !source.includes('ws: false'));
    });

  assert.deepEqual(offenders, []);
});