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

test('each owner venue exposes a read-only player review dialog', () => {
  const list = read('src/pages/owner/OwnerCourts.tsx');
  const dialog = read('src/pages/owner/components/OwnerVenueReviewsDialog.tsx');
  const api = read('src/api/owner.ts');

  assert.match(list, /Xem đánh giá/);
  assert.match(list, /<OwnerVenueReviewsDialog/);
  assert.match(api, /getOwnerVenueReviews/);
  assert.match(api, /\/api\/owner\/venues\/\$\{venueId\}\/reviews/);
  assert.match(dialog, /Đánh giá của Player/);
  assert.match(dialog, /Chỉ xem/);
  assert.doesNotMatch(dialog, /<textarea|contentEditable|moderateOwner|updateOwnerVenueReview|deleteOwnerVenueReview/);
});

test('owner venue form collects the player support phone', () => {
  const form = read('src/pages/owner/components/OwnerVenueForm.tsx');

  assert.match(form, /Số điện thoại hỗ trợ player/);
  assert.match(form, /type="tel" value=\{draft\.phoneNumber\}/);
  assert.match(form, /phoneNumber: draft\.phoneNumber\.trim\(\) \|\| undefined/);
  assert.match(form, /Số này sẽ hiển thị trên lịch sân/);
});
