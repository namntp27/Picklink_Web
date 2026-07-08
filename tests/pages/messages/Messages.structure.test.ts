import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/messages/Messages.tsx', import.meta.url), 'utf8');

test('messages page keeps data types and helpers in a companion module', () => {
  assert.match(source, /from '\.\/messageModels';/);
  assert.doesNotMatch(source, /type ConversationKind =/);
  assert.doesNotMatch(source, /const groupToConversation =/);
  assert.doesNotMatch(source, /const directToConversation =/);
});
