import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/MatchService.Open.cs', import.meta.url), 'utf8');
const dtoSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/DTOs/MatchRequest.cs', import.meta.url), 'utf8');

test('host can edit the full invitation scope and the server persists validated conditions', () => {
  assert.ok(detailSource.includes('Chỉnh sửa trực tiếp trong thẻ phạm vi lời mời.'));
  assert.ok(detailSource.includes("{showInvitationEditor ? 'Hủy sửa' : 'Sửa lời mời'}"));
  assert.ok(detailSource.includes('searchInvitationVenues'));
  assert.ok(detailSource.includes('const invitationTimeOptions = Array.from({ length: 48 }'));
  assert.ok(detailSource.includes('col-span-3 h-[258px] overflow-y-scroll'));
  assert.equal(detailSource.includes('Bắt đầu (24h)'), false);
  assert.equal(detailSource.includes('required type="time" value={slot.timeStart}'), false);
  assert.ok(detailSource.includes('Các slot có thể chơi'));
  assert.ok(detailSource.includes('preferredVenueIds'));
  assert.ok(detailSource.includes('matchType: event.target.value as MatchFormat'));
  assert.ok(apiSource.includes('availabilitySlots: Array<{ timeStart: string; timeEnd: string }>;'));
  assert.ok(apiSource.includes('preferredVenueIds: number[];'));
  assert.ok(dtoSource.includes('class UpdateOpenMatchInvitationRequest'));
  assert.ok(dtoSource.includes('public List<int> PreferredVenueIds'));
  assert.ok(dtoSource.includes('public List<MatchAvailabilitySlotRequest> AvailabilitySlots'));
  assert.ok(serviceSource.includes('match.AvailabilitySlots.Clear();'));
  assert.ok(serviceSource.includes('match.SharedVenues = string.Join'));
  assert.ok(serviceSource.includes('Khoảng trình độ mới không còn phù hợp với thành viên đã duyệt'));
});
