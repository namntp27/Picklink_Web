import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readSource = (relativePath: string) => readFileSync(path.join(projectRoot, relativePath), 'utf8');

test('all React roots use the shared application error boundary', () => {
  const mount = readSource('src/apps/mountPicklinkApp.tsx');

  assert.match(mount, /import \{ AppErrorBoundary \}/);
  assert.match(mount, /<AppErrorBoundary>[\s\S]*<BrowserRouter>/);

  for (const target of ['player', 'owner', 'admin']) {
    const main = readSource(`apps/${target}/src/main.tsx`);
    assert.match(main, /mountPicklinkApp/);
  }
});

test('application error boundary offers recovery without exposing error details', () => {
  const boundary = readSource('src/components/errors/AppErrorBoundary.tsx');

  assert.match(boundary, /getDerivedStateFromError/);
  assert.match(boundary, /componentDidCatch/);
  assert.match(boundary, /window\.location\.reload\(\)/);
  assert.match(boundary, /href="\/"/);
  assert.match(boundary, /role="alert"/);
  assert.doesNotMatch(boundary, /\{error\.(message|stack)\}/);
});
