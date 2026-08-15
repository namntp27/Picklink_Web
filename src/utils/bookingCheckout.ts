import type { AvailabilitySlot } from '../api/booking';

export const holdingCheckoutPath = (slot: AvailabilitySlot, fallbackDate: string) => {
  if (!slot.bookingId) return null;

  const params = new URLSearchParams({
    bookingId: String(slot.bookingId),
    date: slot.startTime.slice(0, 10) || fallbackDate,
  });
  if (slot.matchId && slot.matchId > 0) params.set('matchId', String(slot.matchId));
  return `/checkout?${params.toString()}`;
};
