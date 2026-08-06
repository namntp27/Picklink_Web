import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const dtoSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/DTOs/MatchRequest.cs', import.meta.url), 'utf8');

test('match room frontend reveals only the personal code returned for a check-in group', () => {
  assert.ok(apiSource.includes('export type MatchBookingCheckInGroup'));
  assert.ok(apiSource.includes('checkInCode?: string | null;'));
  assert.ok(apiSource.includes('isCheckInWindowOpen: boolean;'));
  assert.ok(apiSource.includes('bookingCheckIns: MatchBookingCheckIn[];'));
  assert.ok(dtoSource.includes('class MatchBookingCheckInResponse'));
  assert.ok(dtoSource.includes('class MatchBookingCheckInGroupResponse'));
  assert.ok(dtoSource.includes('public bool IsCheckInWindowOpen { get; set; }'));
  assert.ok(detailSource.includes('{group.checkInCode &&'));
  assert.ok(detailSource.includes('{group.checkInCode}</div>'));
  assert.ok(detailSource.includes('group.isCheckInWindowOpen ?'));
  assert.ok(!detailSource.includes('match.checkInCode'));
  assert.ok(detailSource.includes('Mã check-in cá nhân của bạn'));
  assert.ok(detailSource.includes('Các lượt booking'));
  assert.ok(detailSource.includes('Mã mở trước giờ chơi 30 phút.'));
});
