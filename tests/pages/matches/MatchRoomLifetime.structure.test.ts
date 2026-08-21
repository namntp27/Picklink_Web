import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const root = new URL('../../../../', import.meta.url);
const source = (relativePath: string) => readFileSync(new URL(relativePath, root), 'utf8');
const controller = source('PicklinkBackend/PicklinkBackend/Controllers/Matches/MatchController.Open.cs');
const detail = source('Picklink_Web/src/pages/matches/MatchDetail.tsx');
const api = source('Picklink_Web/src/api/matches.ts');

test('frontend room lifecycle exposes leave without obsolete cancel or reopen commands', () => {
  assert.ok(api.includes('export const leaveMatch'));
  assert.ok(api.includes('/api/matches/${matchId}/leave'));
  assert.ok(controller.includes('[HttpPost("{matchId:int}/leave")]'));
  assert.ok(controller.includes('_matchService.LeaveOpenMatch(matchId, cancellationToken)'));
  assert.ok(!api.includes('export const cancelMatch'));
  assert.ok(!api.includes('export const reopenMatch'));
  assert.ok(!detail.includes('cancelMatch(token, matchId)'));
  assert.ok(!detail.includes('reopenMatch(token, matchId)'));
  assert.ok(detail.includes('isApprovedMember && ('));
  assert.ok(detail.includes('leaveMatch(token, matchId)'));
  assert.ok(detail.includes("await confirm({ title: 'Rời phòng ghép trận này?'"));
});
