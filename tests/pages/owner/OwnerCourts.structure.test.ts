import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const read = (path: string) => readFileSync(new URL('../../../' + path, import.meta.url), 'utf8');

test('owner court list keeps child-court editing inside the selected venue', () => {
  const list = read('src/pages/owner/OwnerCourts.tsx');
  const detail = read('src/pages/owner/OwnerVenueDetail.tsx');
  const manager = read('src/pages/owner/components/OwnerCourtManager.tsx');
  const edit = read('src/pages/owner/OwnerCourtEdit.tsx');

  assert.doesNotMatch(list, /venue\.courts\.map/);
  assert.doesNotMatch(list, /createOwnerCourt|updateOwnerCourt|deleteOwnerCourt|CourtRow/);
  assert.match(list, /to=\{`\/owner\/courts\/\$\{venue\.venueId\}`\}/);
  assert.match(list, /Quản lý sân/);
  assert.match(detail, /<OwnerCourtManager/);
  assert.match(manager, /venue\.courts\.map/);
  assert.match(manager, /createOwnerCourt/);
  assert.match(manager, /updateOwnerCourt/);
  assert.match(manager, /deleteOwnerCourt/);
  assert.match(edit, /navigate\(`\/owner\/courts\/\$\{venueId\}`/);
});
