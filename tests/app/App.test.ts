import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../src/App.tsx', import.meta.url), 'utf8');

test('app routes lazy-load page components', () => {
  assert.match(source, /React\.lazy/);
  assert.match(source, /<Suspense/);
  assert.doesNotMatch(source, /import \{ Home \} from '\.\/pages\/home\/Home';/);
  assert.doesNotMatch(source, /import \{ Messages \} from '\.\/pages\/messages\/Messages';/);
  assert.doesNotMatch(source, /import \{ ClubDashboard \} from '\.\/pages\/clubs\/ClubDashboard';/);
});
