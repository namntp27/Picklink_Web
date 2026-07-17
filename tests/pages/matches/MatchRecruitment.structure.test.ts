import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Controllers/Matches/MatchController.Open.cs', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/MatchService.Open.cs', import.meta.url), 'utf8');
const dtoSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/DTOs/MatchRequest.cs', import.meta.url), 'utf8');

test('match host can recruit and edit an invitation while approved members can moderate join requests', () => {
  assert.ok(detailSource.includes('inviteMatchPlayers(token, matchId, { automatic: true })'));
  assert.ok(detailSource.includes('updateMatchInvitation(token, matchId, invitationDraft)'));
  assert.ok(detailSource.includes('isApprovedMember && pending.length > 0'));
  assert.ok(detailSource.includes('showInvitationEditor'));
  assert.ok(apiSource.includes('export const updateMatchInvitation'));
  assert.ok(apiSource.includes("method: 'PUT'"));
  assert.ok(controllerSource.includes('[HttpPut("{matchId:int}")]'));
  assert.ok(controllerSource.includes('UpdateOpenMatchInvitation'));
  assert.ok(serviceSource.includes('UpdateOpenMatchInvitation('));
  assert.equal((serviceSource.match(/ApprovedParticipants\(match\)\.Any\(item => item\.PlayerId == approverPlayerId\.Value\)/g) ?? []).length, 2);
  assert.ok(dtoSource.includes('class UpdateOpenMatchInvitationRequest'));
});
