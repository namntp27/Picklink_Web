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
