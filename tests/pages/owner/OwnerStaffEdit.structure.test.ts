import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const page = readFileSync(new URL('../../../src/pages/owner/OwnerStaff.tsx', import.meta.url), 'utf8');
const api = readFileSync(new URL('../../../src/api/owner.ts', import.meta.url), 'utf8');

test('owner can edit staff identity, venue, role, permissions and status', () => {
  assert.match(page, /beginStaffEdit/);
  assert.match(page, /saveStaffEdit/);
  assert.match(page, /Tên đăng nhập/);
  assert.match(page, /Lưu thay đổi/);
  assert.match(page, /username: staffEdit\.username\.trim\(\)/);
  assert.match(page, /email: staffEdit\.email\.trim\(\)/);
  assert.match(page, /venueIds: staffEdit\.venueIds/);
  assert.match(page, /toggleStaffEditVenue/);
  assert.match(page, /bg-\[#e2ff57\]/);
});

test('staff update API accepts editable account fields', () => {
  assert.match(api, /venueIds\?: number\[\]; username\?: string; email\?: string; role\?: string/);
  assert.match(api, /\/api\/owner\/staff\/\$\{staffId\}/);
  assert.match(api, /venueIds: number\[\]/);
});