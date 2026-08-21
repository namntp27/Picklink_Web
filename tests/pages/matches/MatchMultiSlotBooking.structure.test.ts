import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const controllerSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Controllers/Matches/MatchController.Open.cs', import.meta.url), 'utf8');
const dtoSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/DTOs/MatchRequest.cs', import.meta.url), 'utf8');

test('match booking submits independent slots through the public booking contract', () => {
  assert.ok(detailSource.includes('selectedSlotsByDate, setSelectedSlotsByDate'));
  assert.ok(detailSource.includes('const applyCurrentSlotsForMonths = async () =>'));
  assert.ok(detailSource.includes('datesForMonthDuration(bookingDate, bookingMonths)'));
  assert.ok(detailSource.includes('Số tháng áp dụng'));
  assert.ok(detailSource.indexOf('{availability && <CourtTimelineGrid') < detailSource.indexOf('Số tháng áp dụng'));
  assert.ok(detailSource.includes('monthUnavailableSlots, setMonthUnavailableSlots'));
  assert.ok(detailSource.includes('getCourtAvailabilities(selectedVenueId, targetDates, token)'));
  assert.ok(detailSource.includes("currentSlot?.status === 'Available'"));
  assert.ok(detailSource.includes('pastSlotKeys.add(slotIdentity(templateSlot.courtId, startTime, endTime))'));
  assert.ok(detailSource.includes('Slot không còn trống'));
  assert.ok(detailSource.includes('disabledSlotKeys={unavailableSlotKeysForDate}'));
  assert.ok(detailSource.includes('slots: selectedSlots.map(({ courtId, startTime, endTime })'));
  assert.ok(detailSource.includes("isCreatingBookingRef.current && notification.entryType === 'Holding' && notification.action === 'Created'"));
  assert.ok(detailSource.indexOf('isCreatingBookingRef.current = true') < detailSource.indexOf('await createMatchBooking'));
  assert.ok(!detailSource.includes('const consecutive ='));
  assert.ok(apiSource.includes('slots: Array<{ courtId: number; startTime: string; endTime: string }>;'));
  assert.ok(detailSource.includes('max={maximumMonthDuration}'));
  assert.ok(dtoSource.includes('class CreateMatchBookingRequest'));
  assert.ok(dtoSource.includes('[Required, MinLength(1), MaxLength(496)]'));
  assert.ok(dtoSource.includes('public List<CreateMatchBookingSlotRequest> Slots'));
  assert.ok(dtoSource.includes('public bool AllowScheduleConflicts'));
  assert.ok(controllerSource.includes('[HttpPost("{matchId:int}/booking")]'));
  assert.ok(controllerSource.includes('_matchService.CreateMatchBooking(matchId, request, cancellationToken)'));
});

test('match booking explains an invalid monthly apply instead of silently disabling it', () => {
  assert.ok(detailSource.includes('disabled={isBusy} onClick={() => void applyCurrentSlotsForMonths()}'));
  assert.ok(!detailSource.includes('disabled={isBusy || maximumMonthDuration < 1 || !selectedSlotsForDate.length}'));
});

test('match venue changes discard stale availability responses', () => {
  assert.ok(detailSource.includes('const availabilityRequestId = ++availabilityRequestRef.current;'));
  assert.ok(detailSource.includes('if (availabilityRequestId !== availabilityRequestRef.current) return;'));
});
