import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type AdminUserRole = 'User' | 'Player' | 'VenueOwner' | 'Staff' | 'Admin';

export type AdminUserSummary = {
  userId: number;
  name: string;
  email: string;
  role: AdminUserRole | string;
  roleLabel: string;
  isLocked: boolean;
  city?: string | null;
  commune?: string | null;
  avatarUrl?: string | null;
  joinedClubCount: number;
  ownedVenueCount: number;
  bookingCount: number;
};

export type AdminUserListParams = PaginationParams & {
  search?: string;
  role?: AdminUserRole | 'all';
  lockedOnly?: boolean;
};

const appendParams = (params: AdminUserListParams) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all' && value !== false) {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export const listAdminUsers = (
  accessToken: string,
  params: AdminUserListParams = {},
) => {
  const queryString = appendParams(params);
  return apiRequest<PaginatedResponse<AdminUserSummary>>(
    `/api/admin/users${queryString ? `?${queryString}` : ''}`,
    {},
    accessToken,
  );
};

export const lockAdminUser = (
  userId: number,
  reason: string,
  accessToken: string,
) =>
  apiRequest<AdminUserSummary>(
    `/api/admin/users/${userId}/lock`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    accessToken,
  );

export const unlockAdminUser = (userId: number, accessToken: string) =>
  apiRequest<AdminUserSummary>(
    `/api/admin/users/${userId}/unlock`,
    { method: 'POST' },
    accessToken,
  );
