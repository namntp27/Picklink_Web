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
  refundAmount: number;
  refundPendingSince?: string | null;
  refundProofPaymentId?: number | null;
  refundProofImageUrl?: string | null;
  refundReference?: string | null;
  refundProofSubmittedAt?: string | null;
  refundDisputeStatus?: 'Open' | 'Resolved' | null;
  refundDisputeReason?: string | null;
  refundDisputedAt?: string | null;
  refundDisputeResolution?: string | null;
  refundDisputeResolvedAt?: string | null;
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

export const cancelAdminBooking = (
  accessToken: string,
  bookingId: number,
  reason: string,
) =>
  apiRequest<AdminBookingSummary>(
    `/api/admin/bookings/${bookingId}/cancel`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    accessToken,
  );

export const resolveAdminRefundDispute = (
  accessToken: string,
  bookingId: number,
  resolution: string,
) =>
  apiRequest<AdminBookingSummary>(
    `/api/admin/bookings/${bookingId}/refund/dispute/resolve`,
    { method: 'POST', body: JSON.stringify({ resolution }) },
    accessToken,
  );
