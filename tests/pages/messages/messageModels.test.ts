import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  sortConversationsByLatestMessage,
  type Conversation,
} from '../../../src/pages/messages/messageModels';

const conversation = (id: string, lastMessageAt: string | null): Conversation => ({
  id,
  name: id,
  avatar: id,
  level: '',
  kind: 'direct',
  lastMessage: '',
  lastTime: '',
  lastMessageAt,
  unreadMessageCount: 0,
  contextTitle: id,
  contextMeta: '',
});

test('sorts conversations by latest message without mutating the source list', () => {
  const source = [
    conversation('older', '2026-08-20T08:00:00Z'),
    conversation('no-message', null),
    conversation('newest', '2026-08-21T08:00:00Z'),
  ];

  const sorted = sortConversationsByLatestMessage(source);

  assert.deepEqual(sorted.map((item) => item.id), ['newest', 'older', 'no-message']);
  assert.deepEqual(source.map((item) => item.id), ['older', 'no-message', 'newest']);
});
