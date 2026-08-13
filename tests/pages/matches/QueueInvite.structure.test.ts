import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const apiSource = readFileSync(new URL('../../../src/api/matchmaking.ts', import.meta.url), 'utf8');
const queueDetailSource = readFileSync(new URL('../../../src/pages/matches/QueueDetail.tsx', import.meta.url), 'utf8');
const modalDialogSource = readFileSync(new URL('../../../src/components/ui/ModalDialog.tsx', import.meta.url), 'utf8');

test('inviteFriendToQueue is defined in api/matchmaking.ts', () => {
  assert.match(apiSource, /export const inviteFriendToQueue/);
  assert.match(apiSource, /\/api\/matchmaking\/queues\/\$\{queueId\}\/invite\?targetUserId=\$\{targetUserId\}/);
});

test('ModalDialog uses fixed inset-0 m-auto for true geometric centering', () => {
  assert.match(modalDialogSource, /fixed inset-0 m-auto/);
});

test('QueueDetail integrates inviteFriendToQueue and centers invite modal', () => {
  assert.match(queueDetailSource, /inviteFriendToQueue/);
  assert.match(queueDetailSource, /handleInviteFriend/);
  assert.match(queueDetailSource, /fixed inset-0 m-auto/);
});

test('QueueDetail remains a queue view and exposes the linked room separately', () => {
  assert.doesNotMatch(queueDetailSource, /String\(p\.playerId\) === user/);
  assert.doesNotMatch(queueDetailSource, /navigate\(`\/matches\/\$\{queue\.matchId\}`/);
  assert.match(queueDetailSource, /to=\{`\/matches\/\$\{queue\.matchId\}`\}/);
  assert.match(queueDetailSource, /Vào phòng/);
  assert.match(queueDetailSource, /joinPublicQueue\(token, queueId\)/);
});

test('QueueDetail refreshes when a join request reaches its linked room in realtime', () => {
  assert.match(queueDetailSource, /useMatchRealtime/);
  assert.match(queueDetailSource, /queue\?\.matchId === event\.matchId/);
  assert.match(queueDetailSource, /void loadQueue\(\)/);
});
