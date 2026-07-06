import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type AdminBookingSummary = {
  bookingId: number;
  bookingCode?: string | null;
  status: string;
  startTime: string;
  endTime: string;
  createdAt: string;
  totalAmount: number;
  courtAmount: number;
  venueId: number;
  venueName: string;
  courtId: number;
  courtNumber: number;
  ownerName: string;
  ownerEmail: string;
  playerName: string;
  playerEmail?: string | null;
  paymentStatus: string;
  paymentMethod?: string | null;
  paymentSubmittedAt?: string | null;
  paymentVerifiedAt?: string | null;
};

export type AdminBookingListParams = PaginationParams & {
  search?: string;
  status?: string;
  paymentStatus?: string;
};

const buildQuery = (params: AdminBookingListParams = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export const listAdminBookings = (
  accessToken: string,
  params: AdminBookingListParams = {},
) => {
  const query = buildQuery(params);
  return apiRequest<PaginatedResponse<AdminBookingSummary>>(
    `/api/admin/bookings${query ? `?${query}` : ''}`,
    {},
    accessToken,
  );
};
