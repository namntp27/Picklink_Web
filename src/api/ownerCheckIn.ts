import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';
import type { StaffBooking } from './staff';

const ROOT = '/api/owner/check-in';

export const getOwnerCheckInBookings = (
  token: string,
  date?: string,
  pagination: PaginationParams = {},
  bookingType?: 'Court' | 'Match',
  venueId?: number,
  options: Pick<RequestInit, 'signal'> = {},
) => {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (bookingType) params.set('bookingType', bookingType);
  if (venueId) params.set('venueId', String(venueId));
  if (pagination.page) params.set('page', String(pagination.page));
  if (pagination.pageSize) params.set('pageSize', String(pagination.pageSize));
  const query = params.toString();
  return apiRequest<PaginatedResponse<StaffBooking>>(
    ROOT + '/bookings/today' + (query ? '?' + query : ''),
    options,
    token,
  );
};

export const searchOwnerCheckInBooking = (token: string, code: string) =>
  apiRequest<StaffBooking>(ROOT + '/bookings/search?code=' + encodeURIComponent(code), {}, token);

export const verifyOwnerCheckInCode = (token: string, code: string) =>
  apiRequest<StaffBooking>(
    ROOT + '/bookings/verify-code',
    { method: 'POST', body: JSON.stringify({ code }) },
    token,
  );

export const confirmOwnerAtCourtPayment = (token: string, bookingId: number) =>
  apiRequest<StaffBooking>(
    ROOT + '/bookings/' + bookingId + '/confirm-at-court-payment',
    { method: 'POST' },
    token,
  );

export const checkInOwnerBooking = (token: string, bookingId: number) =>
  apiRequest<StaffBooking>(
    ROOT + '/bookings/' + bookingId + '/check-in',
    { method: 'POST' },
    token,
  );

export const markOwnerBookingNoShow = (token: string, bookingId: number) =>
  apiRequest<StaffBooking>(
    ROOT + '/bookings/' + bookingId + '/no-show',
    { method: 'POST' },
    token,
  );

export const checkInOwnerBookingGroup = (
  token: string,
  bookingId: number,
  checkInGroupId: number,
) =>
  apiRequest<StaffBooking>(
    ROOT + '/bookings/' + bookingId + '/check-in-groups/' + checkInGroupId + '/check-in',
    { method: 'POST' },
    token,
  );

export const markOwnerBookingGroupNoShow = (
  token: string,
  bookingId: number,
  checkInGroupId: number,
) =>
  apiRequest<StaffBooking>(
    ROOT + '/bookings/' + bookingId + '/check-in-groups/' + checkInGroupId + '/no-show',
    { method: 'POST' },
    token,
  );

export const checkInOwnerMatchParticipant = (
  token: string,
  bookingId: number,
  playerId: number,
) =>
  apiRequest<StaffBooking>(
    ROOT + '/bookings/' + bookingId + '/participants/' + playerId + '/check-in',
    { method: 'POST' },
    token,
  );

export const markOwnerMatchParticipantNoShow = (
  token: string,
  bookingId: number,
  playerId: number,
) =>
  apiRequest<StaffBooking>(
    ROOT + '/bookings/' + bookingId + '/participants/' + playerId + '/no-show',
    { method: 'POST' },
    token,
  );