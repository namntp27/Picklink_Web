import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const readSource = (relativePath: string) => readFileSync(path.join(projectRoot, relativePath), 'utf8');

test('React root is protected by the application error boundary', () => {
  const main = readSource('src/main.tsx');

  assert.match(main, /import \{ AppErrorBoundary \}/);
  assert.match(main, /<AppErrorBoundary>[\s\S]*<BrowserRouter>/);
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
