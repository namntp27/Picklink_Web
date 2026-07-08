import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const checkedRoots = ['src', 'tests'];
const textFilePattern = /\.(css|js|jsx|json|md|ts|tsx)$/;
const mojibakePattern = new RegExp(
  '[\\u00c3\\u00c2\\u00c4\\u00c6][\\u0080-\\u00bf]|\\u00e1\\u00ba|\\u00e1\\u00bb|\\u00e2[\\u20ac\\u201e]',
);

const collectTextFiles = (directory: string): string[] => readdirSync(directory, { withFileTypes: true })
  .flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTextFiles(fullPath);
    return textFilePattern.test(entry.name) ? [fullPath] : [];
  });

test('frontend source and tests do not contain mojibake text', () => {
  const offenders = checkedRoots
    .flatMap((root) => collectTextFiles(path.join(projectRoot, root)))
    .filter((filePath) => mojibakePattern.test(readFileSync(filePath, 'utf8')))
    .map((filePath) => path.relative(projectRoot, filePath).replaceAll(path.sep, '/'));

  assert.deepEqual(offenders, []);
});
