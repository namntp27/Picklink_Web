import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const postsSource = readFileSync(new URL('../../../src/pages/community/Posts.tsx', import.meta.url), 'utf8');
const communityUiSource = readFileSync(new URL('../../../src/pages/community/CommunityUI.tsx', import.meta.url), 'utf8');
const friendButtonSource = readFileSync(new URL('../../../src/pages/community/components/FriendButton.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/community.ts', import.meta.url), 'utf8');

test('friendship API methods and types are defined in api/community.ts', () => {
  assert.match(apiSource, /export type FriendshipStatus/);
  assert.match(apiSource, /export type FriendRequest/);
  assert.match(apiSource, /getFriendshipStatuses/);
  assert.match(apiSource, /getFriendRequests/);
  assert.match(apiSource, /sendFriendRequest/);
  assert.match(apiSource, /acceptFriendRequest/);
  assert.match(apiSource, /declineFriendRequest/);
  assert.match(apiSource, /removeFriend/);
});

test('FriendButton component handles all friendship lifecycle states', () => {
  assert.match(friendButtonSource, /PendingSent/);
  assert.match(friendButtonSource, /PendingReceived/);
  assert.match(friendButtonSource, /Accepted/);
  assert.match(friendButtonSource, /handleSend/);
  assert.match(friendButtonSource, /handleAccept/);
  assert.match(friendButtonSource, /handleDecline/);
  assert.match(friendButtonSource, /handleUnfriend/);
});

test('Posts feed integrates FriendButton into PostCard and sidebar', () => {
  assert.match(postsSource, /FriendButton/);
  assert.match(postsSource, /friendshipStatus/);
  assert.match(postsSource, /getFriendshipStatuses/);
  assert.match(communityUiSource, /FriendButton/);
  assert.match(communityUiSource, /getFriendshipStatuses/);
});
