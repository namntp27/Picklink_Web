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
  activeLocation: string | null;
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
  isPinned: boolean;
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
  likeCount: number;
  likedByMe: boolean;
};

// ────────────────────────────── Request types ───────────────────────────────

export type CreateGroupInput = {
  groupName: string;
  description?: string;
  groupType?: string;
  coverImageUrl?: string;
  activeLocation?: string;
};

export type UpdateGroupInput = {
  groupName?: string;
  description?: string;
  groupType?: string;
  coverImageUrl?: string;
  rules?: string;
  overallRating?: number;
  ratingCount?: number;
  activeLocation?: string;
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

export const getGroups = (
  token?: string | null,
  query?: string,
  page?: number,
  pageSize?: number,
  groupType?: string,
  sortBy?: string
) => {
  const searchParams = new URLSearchParams();
  if (query) searchParams.append('query', query);
  if (groupType && groupType !== 'All') searchParams.append('groupType', groupType);
  if (sortBy) searchParams.append('sortBy', sortBy);
  if (page !== undefined) searchParams.append('page', page.toString());
  if (pageSize !== undefined) searchParams.append('pageSize', pageSize.toString());

  return apiRequest<CommunityGroup[]>(`/api/Community/groups?${searchParams.toString()}`, {}, token || undefined);
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

export const getGroupMessages = (token: string, groupId: number, beforeMessageId?: number, limit = 8) => {
  const url = beforeMessageId
    ? `/api/Community/groups/${groupId}/messages?beforeMessageId=${beforeMessageId}&limit=${limit}`
    : `/api/Community/groups/${groupId}/messages?limit=${limit}`;
  return apiRequest<CommunityMessage[]>(url, {}, token);
};

export const getPinnedGroupMessages = (token: string, groupId: number) =>
  apiRequest<CommunityMessage[]>(`/api/Community/groups/${groupId}/messages/pinned`, {}, token);

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

export const declineMember = (token: string, groupId: number, memberUserId: number) =>
  apiRequest<CommunityMember>(`/api/Community/groups/${groupId}/members/${memberUserId}/decline`, { method: 'POST' }, token);

export const banMember = (token: string, groupId: number, memberUserId: number) =>
  apiRequest<CommunityMember>(`/api/Community/groups/${groupId}/members/${memberUserId}/ban`, { method: 'POST' }, token);

export const unbanMember = (token: string, groupId: number, memberUserId: number) =>
  apiRequest<void>(`/api/Community/groups/${groupId}/members/${memberUserId}/unban`, { method: 'POST' }, token);

export const changeMemberRole = (token: string, groupId: number, memberUserId: number, role: string) =>
  apiRequest<CommunityMember>(`/api/Community/groups/${groupId}/members/${memberUserId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  }, token);

// Group images
export const addGroupImage = (token: string, groupId: number, imageUrl: string, caption?: string) =>
  apiRequest<GroupImage>(`/api/Community/groups/${groupId}/images`, {
    method: 'POST',
    body: JSON.stringify({ imageUrl, caption: caption ?? null }),
  }, token);

export const removeGroupImage = (token: string, groupId: number, imageId: number) =>
  apiRequest<void>(`/api/Community/groups/${groupId}/images/${imageId}`, { method: 'DELETE' }, token);

// Global feed posts
export const getGlobalPosts = (token?: string | null) =>
  apiRequest<CommunityPost[]>('/api/Community/posts', {}, token || undefined);

export const createGlobalPost = (token: string, input: { content: string; mediaUrls?: string[] }) =>
  apiRequest<CommunityPost>('/api/Community/posts', {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);

export const reactToPost = (token: string, postId: number, reactionType = 'Like') =>
  apiRequest<CommunityPost>(`/api/Community/posts/${postId}/reaction`, {
    method: 'POST',
    body: JSON.stringify({ reactionType }),
  }, token);

export const removeReaction = (token: string, postId: number) =>
  apiRequest<CommunityPost>(`/api/Community/posts/${postId}/reaction`, { method: 'DELETE' }, token);

export const getGlobalPost = (postId: number, token?: string | null) =>
  apiRequest<CommunityPost>(`/api/Community/posts/${postId}`, {}, token || undefined);

export const getPostComments = (postId: number, token: string) =>
  apiRequest<CommunityComment[]>(`/api/Community/posts/${postId}/comments`, {}, token);

export const createComment = (token: string, postId: number, content: string, parentCommentId?: number | null) =>
  apiRequest<CommunityComment>(`/api/Community/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parentCommentId: parentCommentId ?? null }),
  }, token);

export const approveGroupPost = (token: string, postId: number) =>
  apiRequest<CommunityPost>(`/api/Community/posts/${postId}/approve`, { method: 'POST' }, token);

export const deletePost = (token: string, postId: number) =>
  apiRequest<void>(`/api/Community/posts/${postId}`, { method: 'DELETE' }, token);

export const deleteGroupMessage = (token: string, groupId: number, messageId: number) =>
  apiRequest<void>(`/api/Community/groups/${groupId}/messages/${messageId}`, { method: 'DELETE' }, token);

export const pinGroupMessage = (token: string, groupId: number, messageId: number, pin: boolean) =>
  apiRequest<CommunityMessage>(`/api/Community/groups/${groupId}/messages/${messageId}/pin?pin=${pin}`, { method: 'PUT' }, token);

export const reactToComment = (token: string, commentId: number) =>
  apiRequest<void>(`/api/Community/comments/${commentId}/like`, { method: 'POST' }, token);

export const removeCommentReaction = (token: string, commentId: number) =>
  apiRequest<void>(`/api/Community/comments/${commentId}/like`, { method: 'DELETE' }, token);

export type OutstandingPlayer = {
  userId: number;
  name: string;
  level: string;
  avatar: string | null;
};

export const getOutstandingPlayers = (token?: string | null) =>
  apiRequest<OutstandingPlayer[]>(`/api/Community/players/outstanding`, {}, token || undefined);

export type DirectConversation = {
  conversationId: number;
  otherUserId: number;
  otherUsername: string;
  otherProfileImageUrl: string | null;
  otherSkillLevel: string;
  lastMessageAt: string;
  lastMessage: string;
};

export const startDirectConversation = (token: string, targetUserId: number) =>
  apiRequest<DirectConversation>(`/api/Community/conversations/direct/start?targetUserId=${targetUserId}`, {
    method: 'POST',
  }, token);

export const getDirectConversations = (token: string) =>
  apiRequest<DirectConversation[]>(`/api/Community/conversations/direct`, {}, token);

export const getDirectMessages = (token: string, conversationId: number, beforeMessageId?: number, limit = 8) => {
  const query = beforeMessageId ? `?beforeMessageId=${beforeMessageId}&limit=${limit}` : `?limit=${limit}`;
  return apiRequest<CommunityMessage[]>(`/api/Community/conversations/direct/${conversationId}/messages${query}`, {}, token);
};

export const sendDirectMessage = (token: string, conversationId: number, content: string, mediaUrl?: string) =>
  apiRequest<CommunityMessage>(`/api/Community/conversations/direct/${conversationId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content, mediaUrl }),
  }, token);

export type CommunityFriend = {
  userId: number;
  username: string;
  profileImageUrl: string | null;
};

export const getFriends = (token: string) =>
  apiRequest<CommunityFriend[]>('/api/Community/friends', {}, token);
