import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../src/types/index.ts', import.meta.url), 'utf8');

test('shared frontend types only keep types imported by the app', () => {
  assert.match(source, /export type UserRole =/);
  assert.doesNotMatch(source, /export interface/);
});