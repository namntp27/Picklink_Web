import { apiRequest } from './client';

export type PlayerScheduleEntryType = 'Booking' | 'Ticket' | 'Match';

export type PlayerScheduleEntry = {
  entryType: PlayerScheduleEntryType;
  /** Id of the thing this entry opens: bookingId, sessionTicketId or matchId. */
  referenceId: number;
  bookingId: number;
  /** Vietnam-local play date as `YYYY-MM-DD`; group by this, never by parsing startTime. */
  date: string;
  startTime: string;
  endTime: string;
  venueId: number;
  venueName: string;
  address: string;
  courtId: number;
  courtNumber: number;
  title?: string | null;
  status: string;
  paymentStatus: string;
  needsAction: boolean;
  amount: number;
  code?: string | null;
  matchType?: string | null;
};

export type PlayerSchedule = {
  fromDate: string;
  toDate: string;
  entries: PlayerScheduleEntry[];
};

export const getMySchedule = (token: string, from: string, to: string) =>
  apiRequest<PlayerSchedule>(
    `/api/player-bookings/schedule?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    {},
    token,
  );

/** Where a calendar entry sends the player when they open it. */
export const scheduleEntryPath = (entry: PlayerScheduleEntry) => {
  if (entry.entryType === 'Ticket') return `/my-tickets/${entry.referenceId}`;
  if (entry.entryType === 'Match') return `/matches/${entry.referenceId}`;
  return `/bookings/${entry.referenceId}`;
};
