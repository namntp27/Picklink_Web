import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Controllers/Matches/MatchController.Open.cs', import.meta.url), 'utf8');
const dtoSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/DTOs/MatchRequest.cs', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/Implementations/MatchService.cs', import.meta.url), 'utf8');

test('host invitation editor submits the full public update contract', () => {
  const updateStart = apiSource.indexOf('export const updateMatchInvitation');
  const updateEnd = apiSource.indexOf('export const acceptMatchInvitation');
  const updateSource = apiSource.slice(updateStart, updateEnd);

  assert.ok(detailSource.includes('Sửa phạm vi lời mời'));
  assert.ok(detailSource.includes('<ModalDialog'));
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
  assert.ok(updateStart >= 0 && updateEnd > updateStart);
  assert.ok(updateSource.includes('`/api/matches/${matchId}`'));
  assert.ok(updateSource.includes("method: 'PUT'"));
  assert.ok(updateSource.includes('availabilitySlots: input.availabilitySlots.map'));
  assert.ok(controllerSource.includes('[HttpPut("{matchId:int}")]'));
  assert.ok(controllerSource.includes('_matchService.UpdateOpenMatchInvitation(matchId, request, cancellationToken)'));
});

test('invitation editor rejects dates and time windows that have already passed', () => {
  assert.ok(detailSource.includes('validateInvitationScheduleAgainstNow(invitationDraft)'));
  assert.ok(detailSource.includes('draft.availableDateFrom < today'));
  assert.ok(detailSource.includes('invitationTimeEndMinutes(slot.timeStart, slot.timeEnd) <= currentMinutes'));
  assert.ok(detailSource.includes('{invitationValidationError &&'));

  assert.ok(serviceSource.includes('var localNow = VietnamTime.Now;'));
  assert.ok(serviceSource.includes('request.AvailableDateFrom < today'));
  assert.ok(serviceSource.includes('TimeRangeEndMinutes(slot.Start, slot.End) <= currentMinutes'));
  assert.ok(serviceSource.includes('Khung giờ được chọn cho hôm nay đã trôi qua.'));
});
