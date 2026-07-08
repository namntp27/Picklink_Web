import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const componentSource = readFileSync(new URL('../../src/components/location/AdministrativeAreaSelects.tsx', import.meta.url), 'utf8');

test('frontend does not keep the administrative units list as dropdown source of truth', () => {
  assert.doesNotMatch(componentSource, /from '..\/..\/data\/administrativeAreas'/);
  assert.match(componentSource, /from '..\/..\/api\/locations'/);
});