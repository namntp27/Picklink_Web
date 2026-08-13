import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/clubs/ClubDetail.tsx', import.meta.url), 'utf8');

test('club detail opens its post feed by default and keeps summary stats compact', () => {
  assert.match(source, /type DetailTab = 'members' \| 'posts';/);
  assert.match(source, /useState<DetailTab>\('posts'\)/);
  assert.doesNotMatch(source, /const tabs/);
  assert.match(source, /aria-label="Xem thành viên CLB"/);
  assert.match(source, /aria-label="Mở tin nhắn CLB"/);
  assert.match(source, /navigate\(`\/messages\?chat=club-group-\$\{groupId\}`\)/);
  assert.match(source, /const privateClubRestricted = club\?\.groupType === 'Private'/);
  assert.match(source, /CLB riêng tư/);
  assert.match(source, /Hủy yêu cầu/);
  assert.doesNotMatch(source, /Lịch hoạt động/);
  assert.doesNotMatch(source, /label: 'Tổng quan'/);
  assert.doesNotMatch(source, /navigate\('\/book-court'\)/);
  assert.match(source, /grid grid-cols-2 gap-2 sm:grid-cols-3/);
  assert.match(source, /flex min-h-16 items-center gap-2\.5/);
  assert.match(source, /activeTab === 'posts'/);
  assert.match(source, /reactToPost\(token, post\.postId\)/);
  assert.match(source, /removeReaction\(token, post\.postId\)/);
  assert.match(source, /import \{ PostCard, toDisplayPost, type DisplayPost \} from '..\/community\/Posts';/);
  assert.match(source, /enableInlineComments/);
  assert.match(source, /onCommentCreated=/);
  assert.match(source, /onLikeToggle=/);
  assert.match(source, /onShareClick=/);
});
