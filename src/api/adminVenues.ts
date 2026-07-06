import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type AdminVenueApprovalStatus = 'Draft' | 'Pending' | 'Approved' | 'Rejected';

export type AdminVenueSummary = {
  venueId: number;
  venueName: string;
  address: string;
  ownerUserId: number;
  ownerName: string;
  ownerEmail: string;
  phoneNumber?: string | null;
  overallRating: number;
  isOpen: boolean;
  approvalStatus: AdminVenueApprovalStatus;
  rejectionReason?: string | null;
  courtCount: number;
  primaryImageUrl?: string | null;
  submittedAt?: string | null;
};

export type AdminVenueImage = {
  venueImageId: number;
  imageUrl: string;
  caption?: string | null;
  isPrimary: boolean;
};

export type AdminVenueCourt = {
  courtId: number;
  courtNumber: number;
  courtType: string;
  surfaceType?: string | null;
  hourlyPrice: number;
  isIndoor: boolean;
  availabilityStatus: string;
};

export type AdminVenueAudit = {
  action: string;
  actorName: string;
  timestamp: string;
};

export type AdminVenueDetail = AdminVenueSummary & {
  openTime: string;
  closeTime: string;
  latitude?: number | null;
  longitude?: number | null;
  basePrice: number;
  amenities: string[];
  images: AdminVenueImage[];
  courts: AdminVenueCourt[];
  auditLogs: AdminVenueAudit[];
};

export type AdminVenueListParams = PaginationParams & {
  search?: string;
  status?: AdminVenueApprovalStatus | 'all';
};

export const listAdminVenues = (
  accessToken: string,
  params: AdminVenueListParams = {},
) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') {
      query.set(key, String(value));
    }
  });
  const queryString = query.toString();
  return apiRequest<PaginatedResponse<AdminVenueSummary>>(
    `/api/admin/venues${queryString ? `?${queryString}` : ''}`,
    {},
    accessToken,
  );
};

export const getAdminVenue = (venueId: number, accessToken: string) =>
  apiRequest<AdminVenueDetail>(`/api/admin/venues/${venueId}`, {}, accessToken);

export const approveAdminVenue = (venueId: number, accessToken: string) =>
  apiRequest<AdminVenueDetail>(
    `/api/admin/venues/${venueId}/approve`,
    { method: 'POST' },
    accessToken,
  );

export const rejectAdminVenue = (
  venueId: number,
  reason: string,
  accessToken: string,
) =>
  apiRequest<AdminVenueDetail>(
    `/api/admin/venues/${venueId}/reject`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    accessToken,
  );
