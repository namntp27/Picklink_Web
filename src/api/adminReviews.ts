import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type AdminReview = {
  ratingId: number;
  reviewerUserId: number;
  reviewerName: string;
  reviewerEmail?: string | null;
  bookingId?: number | null;
  targetId: number;
  targetType: string;
  score: number;
  comment?: string | null;
  tags?: string | null;
  isAnonymous: boolean;
  isHidden: boolean;
  moderationStatus: string;
  moderationNote?: string | null;
  moderatedAt?: string | null;
  moderatedByName?: string | null;
  createdAt: string;
};

export type AdminReviewListParams = PaginationParams & {
  search?: string;
  moderationStatus?: string;
  targetType?: string;
  score?: number | 'all';
};

export type AdminReviewModerationRequest = {
  isHidden: boolean;
  moderationStatus: 'Visible' | 'Hidden' | 'Flagged';
  moderationNote?: string;
};

const buildQuery = (params: AdminReviewListParams = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export const listAdminReviews = (
  accessToken: string,
  params: AdminReviewListParams = {},
) => {
  const query = buildQuery(params);
  return apiRequest<PaginatedResponse<AdminReview>>(
    `/api/admin/reviews${query ? `?${query}` : ''}`,
    {},
    accessToken,
  );
};

export const moderateAdminReview = (
  accessToken: string,
  ratingId: number,
  request: AdminReviewModerationRequest,
) =>
  apiRequest<AdminReview>(
    `/api/admin/reviews/${ratingId}/moderate`,
    { method: 'POST', body: JSON.stringify(request) },
    accessToken,
  );
