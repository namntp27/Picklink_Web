import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type AdminReportStatus = 'Open' | 'InReview' | 'Resolved' | 'Dismissed';

export type AdminReport = {
  communityReportId: number;
  reporterUserId: number;
  reporterName: string;
  reporterEmail: string;
  targetType: string;
  targetId?: number | null;
  targetLabel: string;
  reason: string;
  description?: string | null;
  status: AdminReportStatus | string;
  priority: string;
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByName?: string | null;
  resolutionNote?: string | null;
};

export type AdminReportListParams = PaginationParams & {
  search?: string;
  status?: AdminReportStatus | 'all';
  targetType?: string;
};

export type AdminReportReviewRequest = {
  status: Exclude<AdminReportStatus, 'Open'>;
  resolutionNote?: string;
};

const buildQuery = (params: AdminReportListParams = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export const listAdminReports = (
  accessToken: string,
  params: AdminReportListParams = {},
) => {
  const query = buildQuery(params);
  return apiRequest<PaginatedResponse<AdminReport>>(
    `/api/admin/reports${query ? `?${query}` : ''}`,
    {},
    accessToken,
  );
};

export const reviewAdminReport = (
  accessToken: string,
  reportId: number,
  request: AdminReportReviewRequest,
) =>
  apiRequest<AdminReport>(
    `/api/admin/reports/${reportId}/review`,
    { method: 'POST', body: JSON.stringify(request) },
    accessToken,
  );
