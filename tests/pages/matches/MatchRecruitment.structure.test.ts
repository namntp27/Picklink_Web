import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Controllers/Matches/MatchController.Open.cs', import.meta.url), 'utf8');
const interfaceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/IMatchService.cs', import.meta.url), 'utf8');
const dtoSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/DTOs/MatchRequest.cs', import.meta.url), 'utf8');

test('match recruitment UI and client follow the public moderation contract', () => {
  assert.ok(detailSource.includes('inviteMatchPlayers(token, matchId, { automatic: true })'));
  assert.ok(detailSource.includes('const recruitMorePlayers = async () =>'));
  assert.ok(detailSource.includes('Phòng hiện đã xuất hiện trên trang Ghép trận.'));
  assert.ok(detailSource.includes("notify(message, 'error')"));
  assert.ok(detailSource.includes('updateMatchInvitation(token, matchId, invitationDraft)'));
  assert.ok(detailSource.includes('isApprovedMember && pending.length > 0'));
  assert.ok(detailSource.includes('showInvitationEditor'));
  assert.ok(apiSource.includes('export const updateMatchInvitation'));
  assert.ok(apiSource.includes("method: 'PUT'"));
  assert.ok(controllerSource.includes('[HttpPut("{matchId:int}")]'));
  assert.ok(controllerSource.includes('UpdateOpenMatchInvitation'));
  assert.ok(controllerSource.includes('[HttpPost("{matchId:int}/participants/{participantId:int}/accept")]'));
  assert.ok(controllerSource.includes('[HttpPost("{matchId:int}/participants/{participantId:int}/reject")]'));
  assert.ok(interfaceSource.includes('UpdateOpenMatchInvitation(int matchId, UpdateOpenMatchInvitationRequest request'));
  assert.ok(interfaceSource.includes('AcceptParticipant(int matchId, int participantId'));
  assert.ok(interfaceSource.includes('RejectParticipant(int matchId, int participantId'));
  assert.ok(apiSource.includes('export const acceptParticipant'));
  assert.ok(apiSource.includes('export const rejectParticipant'));
  assert.ok(dtoSource.includes('class UpdateOpenMatchInvitationRequest'));
});
