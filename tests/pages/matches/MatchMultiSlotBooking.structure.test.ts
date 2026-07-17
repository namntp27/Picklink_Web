import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const detailSource = readFileSync(new URL('../../../src/pages/matches/MatchDetail.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/matches.ts', import.meta.url), 'utf8');
const bookingServiceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Matches/MatchService.Open.cs', import.meta.url), 'utf8');

test('match booking permits independent slots, multiple courts, multiple days, and rejects unavailable monthly slots', () => {
  assert.ok(detailSource.includes('selectedSlotsByDate, setSelectedSlotsByDate'));
  assert.ok(detailSource.includes('const applyCurrentSlotsToMonth = async () =>'));
  assert.ok(detailSource.includes('const datesInMonth = (value: string)'));
  assert.ok(detailSource.includes('Áp dụng cả tháng'));
  assert.ok(detailSource.includes('monthUnavailableSlots, setMonthUnavailableSlots'));
  assert.ok(detailSource.includes('Promise.all(targetDates.map'));
  assert.ok(detailSource.includes("currentSlot?.status === 'Available'"));
  assert.ok(detailSource.includes('pastSlotKeys.add(slotIdentity(templateSlot.courtId, startTime, endTime))'));
  assert.ok(detailSource.includes('Slot không còn trống'));
  assert.ok(detailSource.includes('disabledSlotKeys={unavailableSlotKeysForDate}'));
  assert.ok(detailSource.includes('slots: selectedSlots.map(({ courtId, startTime, endTime })'));
  assert.ok(!detailSource.includes('const consecutive ='));
  assert.ok(apiSource.includes('slots: Array<{ courtId: number; startTime: string; endTime: string }>;'));
  assert.ok(bookingServiceSource.includes('selectedSlots.Count > 496'));
  assert.ok(!bookingServiceSource.includes('Các slot phải cùng một ngày'));
  assert.ok(bookingServiceSource.includes('DateOnly.FromDateTime(slot.Start)'));
  assert.ok(bookingServiceSource.includes('booking.Slots.Add(new BookingSlot'));
});
