import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../src/types/index.ts', import.meta.url), 'utf8');

test('shared frontend types only keep types that are imported by the app', () => {
  assert.match(source, /export type UserRole =/);
  assert.match(source, /export interface Court/);
  assert.match(source, /export interface Club/);
  assert.doesNotMatch(source, /export interface User/);
  assert.doesNotMatch(source, /export interface Booking/);
});
