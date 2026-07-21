import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const api = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const detail = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const panel = readFileSync(new URL('../../../src/pages/matches/MatchSlotReplacementPanel.tsx', import.meta.url), 'utf8');

test('multi-day match rooms support reporting one busy slot and recruiting one replacement', () => {
  assert.match(api, /check-in-groups\/\$\{bookingCheckInGroupId\}\/unavailable/);
  assert.match(api, /slot-absences\/\$\{matchSlotAbsenceId\}\/replacement-requests/);
  assert.match(api, /replacement-requests\/\$\{replacementRequestId\}\/accept/);
  assert.match(api, /replacement-requests\/\$\{replacementRequestId\}\/reject/);
  assert.ok(detail.includes('<MatchSlotReplacementPanel'));
  assert.ok(panel.includes('Tôi bận buổi này · Tuyển người thay thế'));
  assert.ok(panel.includes('Đăng ký chơi thay đúng buổi này'));
  assert.ok(panel.includes('Ứng viên thay thế'));
  assert.ok(panel.includes('group.absences ?? []'));
  assert.ok(panel.includes('absence.replacementRequests ?? []'));
});

test('approved room members manage replacement membership before the slot starts', () => {
  assert.match(api, /replacement-requests\/\$\{replacementRequestId\}`/);
  assert.ok(detail.includes('canReview={isApprovedMember}'));
  assert.ok(panel.includes('canReview && pendingRequests.length > 0'));
  assert.ok(panel.includes('Đang chờ thành viên phòng duyệt'));
  assert.ok(panel.includes('Rời nhóm'));
  assert.ok(panel.includes('Đưa khỏi nhóm'));
  assert.ok(panel.includes("Left: 'Đã rời nhóm thay thế'"));
  assert.ok(panel.includes("Removed: 'Đã bị đưa khỏi nhóm thay thế'"));
});
