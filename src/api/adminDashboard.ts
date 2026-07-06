import { apiRequest } from './client';

export type AdminDashboardActionItem = {
  type: string;
  title: string;
  description: string;
  status: string;
  tone: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | string;
  linkTo: string;
  createdAt?: string | null;
};

export type AdminDashboardExpiringListing = {
  venueId: number;
  venueName: string;
  ownerName: string;
  ownerEmail: string;
  courtCount: number;
  paidUntil?: string | null;
};

export type AdminDashboardMetrics = {
  totalUsers: number;
  lockedUserCount: number;
  activeVenueCount: number;
  pendingVenueCount: number;
  totalCourtCount: number;
  todayBookingCount: number;
  todayBookingRevenue: number;
  pendingBookingPaymentCount: number;
  pendingListingPaymentCount: number;
  listingRevenueThisMonth: number;
  expiringListingCount: number;
  expiredListingCount: number;
  actionItems: AdminDashboardActionItem[];
  expiringListings: AdminDashboardExpiringListing[];
};

export const getAdminDashboard = (accessToken: string) =>
  apiRequest<AdminDashboardMetrics>('/api/admin/dashboard', {}, accessToken);
