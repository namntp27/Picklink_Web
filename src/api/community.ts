import { apiRequest } from './client';

// ────────────────────────────── Response types ──────────────────────────────

export type GroupImage = {
  groupImageId: number;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
};

export type CommunityGroup = {
  groupId: number;
  groupName: string;
  description: string | null;
  groupType: string;
  coverImageUrl: string | null;
  createdAt: string;
  ownerPlayerId: number;
  ownerName: string;
  memberCount: number;
  myRole: string | null;
  myStatus: string | null;
  postCount: number;
  messageCount: number;
  rules: string | null;
  overallRating: number;
  ratingCount: number;
  images: GroupImage[];
};

export type CommunityMember = {
  groupId: number;
  userId: number;
  username: string;
  profileImageUrl: string | null;
  role: string;
  status: string;
  joinedAt: string;
};

export type CommunityMessage = {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl: string | null;
  content: string | null;
  messageType: string;
  mediaUrl: string | null;
  replyToMessageId: number | null;
  sentAt: string;
  isMine: boolean;
};

export type CommunityPost = {
  postId: number;
  groupId: number | null;
  authorId: number;
  authorName: string;
  authorAvatarUrl: string | null;
  content: string | null;
  postType: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  myReactionType: string | null;
};

export type CommunityComment = {
  commentId: number;
  postId: number;
  userId: number;
  username: string;
  userAvatarUrl: string | null;
  parentCommentId: number | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

// ────────────────────────────── Request types ───────────────────────────────

export type CreateGroupInput = {
  groupName: string;
  description?: string;
  groupType?: string;
  coverImageUrl?: string;
};

export type UpdateGroupInput = {
  groupName?: string;
  description?: string;
  groupType?: string;
  coverImageUrl?: string;
  rules?: string;
  overallRating?: number;
  ratingCount?: number;
};

export type SendMessageInput = {
  content?: string;
  mediaUrl?: string;
  replyToMessageId?: number;
};

export type CreatePostInput = {
  content?: string;
  mediaUrls?: string[];
};

// ────────────────────────────── API functions ───────────────────────────────

// Groups
export const getGroups = (token?: string | null, query?: string) => {
  const params = query ? `?query=${encodeURIComponent(query)}` : '';
  return apiRequest<CommunityGroup[]>(`/api/Community/groups${params}`, {}, token || undefined);
};

export const getGroup = (groupId: number, token?: string | null) =>
  apiRequest<CommunityGroup>(`/api/Community/groups/${groupId}`, {}, token || undefined);

export const createGroup = (token: string, input: CreateGroupInput) =>
  apiRequest<CommunityGroup>('/api/Community/groups', { method: 'POST', body: JSON.stringify(input) }, token);

export const updateGroup = (token: string, groupId: number, input: UpdateGroupInput) =>
  apiRequest<CommunityGroup>(`/api/Community/groups/${groupId}`, { method: 'PUT', body: JSON.stringify(input) }, token);

export const joinGroup = (token: string, groupId: number) =>
  apiRequest<CommunityGroup>(`/api/Community/groups/${groupId}/join`, { method: 'POST' }, token);

export const leaveGroup = (token: string, groupId: number) =>
  apiRequest<CommunityGroup>(`/api/Community/groups/${groupId}/leave`, { method: 'POST' }, token);

// Members
export const getGroupMembers = (token: string, groupId: number) =>
  apiRequest<CommunityMember[]>(`/api/Community/groups/${groupId}/members`, {}, token);

// Messages
export const getGroupMessages = (token: string, groupId: number) =>
  apiRequest<CommunityMessage[]>(`/api/Community/groups/${groupId}/messages`, {}, token);

export const sendGroupMessage = (token: string, groupId: number, input: SendMessageInput) =>
  apiRequest<CommunityMessage>(`/api/Community/groups/${groupId}/messages`, { method: 'POST', body: JSON.stringify(input) }, token);

// Posts
export const getGroupPosts = (token: string, groupId: number) =>
  apiRequest<CommunityPost[]>(`/api/Community/groups/${groupId}/posts`, {}, token);

export const createGroupPost = (token: string, groupId: number, input: CreatePostInput) =>
  apiRequest<CommunityPost>(`/api/Community/groups/${groupId}/posts`, { method: 'POST', body: JSON.stringify(input) }, token);

// Member management
export const approveMember = (token: string, groupId: number, memberUserId: number) =>
  apiRequest<CommunityMember>(`/api/Community/groups/${groupId}/members/${memberUserId}/approve`, { method: 'POST' }, token);

export const removeMember = (token: string, groupId: number, memberUserId: number) =>
  apiRequest<void>(`/api/Community/groups/${groupId}/members/${memberUserId}`, { method: 'DELETE' }, token);

// Group images
export const addGroupImage = (token: string, groupId: number, imageUrl: string, caption?: string) =>
  apiRequest<GroupImage>(`/api/Community/groups/${groupId}/images`, {
    method: 'POST',
    body: JSON.stringify({ imageUrl, caption: caption ?? null }),
  }, token);

export const removeGroupImage = (token: string, groupId: number, imageId: number) =>
  apiRequest<void>(`/api/Community/groups/${groupId}/images/${imageId}`, { method: 'DELETE' }, token);
