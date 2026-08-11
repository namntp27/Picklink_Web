import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const friendsSource = readFileSync(new URL('../../../src/pages/community/Friends.tsx', import.meta.url), 'utf8');
const playerAppSource = readFileSync(new URL('../../../apps/player/src/PlayerApp.tsx', import.meta.url), 'utf8');
const communityUiSource = readFileSync(new URL('../../../src/pages/community/CommunityUI.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/community.ts', import.meta.url), 'utf8');

test('searchPlayers is defined in api/community.ts', () => {
  assert.match(apiSource, /export const searchPlayers/);
  assert.match(apiSource, /export type PlayerSearchResult/);
});

test('Friends page renders 3 tabs: friends, requests, and search', () => {
  assert.match(friendsSource, /Bạn bè của tôi/);
  assert.match(friendsSource, /Lời mời kết bạn/);
  assert.match(friendsSource, /Tìm bạn mới/);
  assert.match(friendsSource, /searchPlayers/);
  assert.match(friendsSource, /FriendButton/);
});

test('PlayerApp registers /posts/friends route and CommunityUI links to it', () => {
  assert.match(playerAppSource, /path="posts\/friends"/);
  assert.match(communityUiSource, /to: '\/posts\/friends'/);
});
