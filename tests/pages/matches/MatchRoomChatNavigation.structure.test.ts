import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const messagesSource = readFileSync(new URL('../../../src/pages/messages/Messages.tsx', import.meta.url), 'utf8');
const modelsSource = readFileSync(new URL('../../../src/pages/messages/messageModels.ts', import.meta.url), 'utf8');

test('match room chat opens the full messages page', () => {
  assert.match(detailSource, /navigate\(`\/messages\?matchId=\$\{matchId\}`\)/);
  assert.match(detailSource, /Chat phòng/);
  assert.doesNotMatch(detailSource, /getMatchMessages|sendMatchMessage|messagesContainerRef/);
});

test('messages page loads, sends, and updates match room messages', () => {
  assert.match(messagesSource, /searchParams\.get\('matchId'\)/);
  assert.match(messagesSource, /getMatchMessages\(token, activeConversation\.matchId!/);
  assert.match(messagesSource, /sendMatchMessage\(token, activeConversation\.matchId, text\)/);
  assert.match(messagesSource, /useMatchRealtime/);
  assert.match(modelsSource, /ConversationKind = 'club' \| 'direct' \| 'match'/);
  assert.match(modelsSource, /matchToConversation/);
});

test('approved replacement sees a clearly limited match-room chat', () => {
  assert.match(detailSource, /chatAccessRole === 'Replacement'/);
  assert.match(detailSource, /Quyền người thay thế/);
  assert.match(messagesSource, /activeConversation\.accessRole === 'Replacement'/);
  assert.match(messagesSource, /formatTemporaryAccessExpiry/);
  assert.match(modelsSource, /accessRole\?: 'Member' \| 'Replacement'/);
  assert.match(modelsSource, /conversationType === 'LobbyChat'/);
  assert.match(modelsSource, /kind: isRoom \? 'match' : 'direct'/);
});
