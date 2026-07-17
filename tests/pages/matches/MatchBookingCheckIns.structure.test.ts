import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const dtoSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/DTOs/MatchRequest.cs', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/MatchService.Open.cs', import.meta.url), 'utf8');

test('match rooms expose check-in codes per paid booking group only during its check-in window', () => {
  assert.ok(apiSource.includes('export type MatchBookingCheckInGroup'));
  assert.ok(apiSource.includes('bookingCheckIns: MatchBookingCheckIn[];'));
  assert.ok(dtoSource.includes('class MatchBookingCheckInResponse'));
  assert.ok(dtoSource.includes('class MatchBookingCheckInGroupResponse'));
  assert.ok(serviceSource.includes('.Include(item => item.Bookings).ThenInclude(item => item.CheckInGroups).ThenInclude(item => item.Court)'));
  assert.ok(serviceSource.includes('CheckInCode = isWindowOpen && group.CheckInStatus == "Ready" ? group.CheckInCode : null'));
  assert.ok(detailSource.includes('Các lượt booking'));
  assert.ok(detailSource.includes('Mã mở trước giờ chơi 30 phút.'));
});
