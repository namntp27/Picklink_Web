import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type AdminClub = {
  groupId: number;
  groupName: string;
  description?: string | null;
  groupType: string;
  ownerId: number;
  ownerName: string;
  memberCount: number;
  postCount: number;
  isSuspended: boolean;
  suspensionReason?: string | null;
  moderatedAt?: string | null;
  moderatedByName?: string | null;
  createdAt: string;
};

export type AdminClubListParams = PaginationParams & {
  search?: string;
  suspendedOnly?: boolean;
};

export type AdminClubModerationRequest = {
  isSuspended: boolean;
  suspensionReason?: string;
};

const buildQuery = (params: AdminClubListParams = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== false) {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export const listAdminClubs = (
  accessToken: string,
  params: AdminClubListParams = {},
) => {
  const query = buildQuery(params);
  return apiRequest<PaginatedResponse<AdminClub>>(
    `/api/admin/clubs${query ? `?${query}` : ''}`,
    {},
    accessToken,
  );
};

export const moderateAdminClub = (
  accessToken: string,
  groupId: number,
  request: AdminClubModerationRequest,
) =>
  apiRequest<AdminClub>(
    `/api/admin/clubs/${groupId}/moderate`,
    { method: 'POST', body: JSON.stringify(request) },
    accessToken,
  );
