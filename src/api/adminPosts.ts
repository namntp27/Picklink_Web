import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type AdminPost = {
  postId: number;
  authorId: number;
  authorName: string;
  authorEmail?: string | null;
  groupId?: number | null;
  groupName?: string | null;
  content?: string | null;
  postType: string;
  visibility: string;
  isHidden: boolean;
  moderationNote?: string | null;
  moderatedAt?: string | null;
  moderatedByName?: string | null;
  likeCount: number;
  commentCount: number;
  createdAt: string;
};

export type AdminPostListParams = PaginationParams & {
  search?: string;
  hiddenOnly?: boolean;
  groupId?: number;
};

export type AdminPostModerationRequest = {
  isHidden: boolean;
  moderationNote?: string;
};

const buildQuery = (params: AdminPostListParams = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== false) {
      query.set(key, String(value));
    }
  });
  return query.toString();
};

export const listAdminPosts = (
  accessToken: string,
  params: AdminPostListParams = {},
) => {
  const query = buildQuery(params);
  return apiRequest<PaginatedResponse<AdminPost>>(
    `/api/admin/posts${query ? `?${query}` : ''}`,
    {},
    accessToken,
  );
};

export const moderateAdminPost = (
  accessToken: string,
  postId: number,
  request: AdminPostModerationRequest,
) =>
  apiRequest<AdminPost>(
    `/api/admin/posts/${postId}/moderate`,
    { method: 'POST', body: JSON.stringify(request) },
    accessToken,
  );

export const deleteAdminPost = (accessToken: string, postId: number) =>
  apiRequest<void>(`/api/admin/posts/${postId}`, { method: 'DELETE' }, accessToken);
