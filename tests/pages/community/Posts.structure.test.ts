import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const postsSource = readFileSync(new URL('../../../src/pages/community/Posts.tsx', import.meta.url), 'utf8');
const shellSource = readFileSync(new URL('../../../src/pages/community/CommunityUI.tsx', import.meta.url), 'utf8');
const stylesSource = readFileSync(new URL('../../../src/pages/community/community.css', import.meta.url), 'utf8');

test('posts feed scopes hero dark green panels to the main feed only', () => {
  assert.match(shellSource, /community-feed-shell--hero-panels/);
  assert.match(stylesSource, /\.community-feed-shell--hero-panels \.community-card/);
  assert.match(stylesSource, /\.community-feed-shell--hero-panels \.community-insights \.community-panel:not\(:first-child\)/);
  assert.match(stylesSource, /background: #081d24;/);
});

test('posts feed cards use readable text and controls on dark panels', () => {
  assert.match(postsSource, /community-post-card/);
  assert.match(postsSource, /community-post-card__metrics/);
  assert.match(postsSource, /community-post-card__actions/);
  assert.match(stylesSource, /color: #fff !important;/);
  assert.match(stylesSource, /color: rgb\(255 255 255 \/ 0\.72\) !important;/);
  assert.match(stylesSource, /border-color: rgb\(255 255 255 \/ 0\.12\) !important;/);
  assert.match(stylesSource, /\.community-feed-shell--hero-panels \.community-button-quiet/);
  assert.match(stylesSource, /\.community-feed-shell--hero-panels \.community-topic/);
  assert.match(stylesSource, /\.community-feed-shell--hero-panels \.community-badge/);
});

test('posts feed preserves privacy and loads updates without a manual refresh', () => {
  const createSource = readFileSync(new URL('../../../src/pages/community/CreatePost.tsx', import.meta.url), 'utf8');
  const apiSource = readFileSync(new URL('../../../src/api/community.ts', import.meta.url), 'utf8');

  assert.match(createSource, /visibility: 'Public'/);
  assert.match(createSource, /const isClubPost = searchParams\.get\('visibility'\) === 'club';/);
  assert.match(createSource, /if \(!requestedGroupId \|\| !selectedClub\)/);
  assert.match(postsSource, /useNotificationRealtime\(token/);
  assert.match(postsSource, /getGlobalPosts\(token, page, pageSize\)/);
  assert.match(postsSource, /filter\(\(post\) => post\.groupId === null\)/);
  assert.match(postsSource, /Không thể tải bảng tin/);
  assert.match(postsSource, /Không thể cập nhật lượt thích/);
  assert.match(postsSource, /groupName: post\.groupName/);
  assert.match(apiSource, /page=\$\{page\}&pageSize=\$\{pageSize\}/);
});

test('post composer keeps one text field, an image, and the preview without attachments or player matching', () => {
  const createSource = readFileSync(new URL('../../../src/pages/community/CreatePost.tsx', import.meta.url), 'utf8');

  assert.match(createSource, /title: ''/);
  assert.match(createSource, /mediaUrls = imageUrl \? \[imageUrl\] : \[\]/);
  assert.match(createSource, /const isClubPost = searchParams\.get\('visibility'\) === 'club';/);
  assert.match(createSource, /if \(isClubPost\)/);
  assert.match(createSource, /visibility: 'Public'/);
  assert.match(createSource, /Nội dung bài viết/);
  assert.match(createSource, /Xem trước/);
  assert.doesNotMatch(createSource, /Thông tin gắn kèm/);
  assert.doesNotMatch(createSource, /Tìm người chơi/);
  assert.doesNotMatch(createSource, /Kiểm tra trước khi đăng/);
});

test('posts feed opens a centered post dialog for comments without navigating', () => {
  assert.match(postsSource, /enableInlineComments/);
  assert.match(postsSource, /createPortal\(/);
  assert.match(postsSource, /role="dialog"/);
  assert.match(postsSource, /aria-modal="true"/);
  assert.match(postsSource, /fixed inset-0 z-\[100\]/);
  assert.match(postsSource, /Bài viết của \{post\.authorName\}/);
  assert.match(postsSource, /event\.key === 'Escape'/);
  assert.match(postsSource, /getPostComments\(Number\(post\.id\), token\)/);
  assert.match(postsSource, /createComment\(token, Number\(post\.id\), content\)/);
  assert.match(postsSource, /placeholder="Viết bình luận\.\.\."/);
  assert.match(postsSource, /onCommentCreated=\{\(postId\)/);
});
