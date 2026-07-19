import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/messages/Messages.tsx', import.meta.url), 'utf8');
const modelsSource = readFileSync(new URL('../../../src/pages/messages/messageModels.ts', import.meta.url), 'utf8');

test('messages page keeps data types and helpers in a companion module', () => {
  assert.match(source, /from '\.\/messageModels';/);
  assert.doesNotMatch(source, /type ConversationKind =/);
  assert.doesNotMatch(source, /const groupToConversation =/);
  assert.doesNotMatch(source, /const directToConversation =/);
});

test('messages list distinguishes unread conversations', () => {
  assert.match(modelsSource, /unreadMessageCount: number/);
  assert.match(modelsSource, /unreadMessageCount: group\.unreadMessageCount/);
  assert.match(modelsSource, /unreadMessageCount: direct\.unreadMessageCount/);
  assert.match(source, /conversation\.unreadMessageCount > 0/);
  assert.match(source, /tin chưa đọc/);
  assert.match(source, /Math\.min\(conversation\.unreadMessageCount, 99\)/);
  assert.match(source, /unreadMessageCount: 0/);
});