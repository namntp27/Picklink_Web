import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve(import.meta.dirname, '../../..');

test('owner booking detail renders child slots and check-in groups', async () => {
  const source = await readFile(path.join(root, 'src/pages/owner/OwnerBookingDetail.tsx'), 'utf8');
  const api = await readFile(path.join(root, 'src/api/owner.ts'), 'utf8');

  assert.match(api, /slots: Array/);
  assert.match(api, /checkInGroups: Array/);
  assert.match(source, /booking\.slots\.map\(\(slot\)/);
  assert.match(source, /booking\.checkInGroups\.map\(\(group\)/);
});
