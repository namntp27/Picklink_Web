import type { CommunityGroup, CommunityMessage, DirectConversation } from '../../api/community';

export type ConversationKind = 'club' | 'direct';
export type ConversationFilter = 'all' | ConversationKind;

export type Conversation = {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string | null;
  level: string;
  kind: ConversationKind;
  lastMessage: string;
  lastTime: string;
  unreadMessageCount: number;
  contextTitle: string;
  contextMeta: string;
  groupId?: number;
  conversationId?: number;
  otherUserId?: number;
};

export type ChatMessage = {
  id: number;
  author: string;
  text: string;
  time: string;
  mine?: boolean;
  read?: boolean;
  avatarUrl?: string | null;
  mediaUrl?: string | null;
  isPinned?: boolean;
  senderId?: number;
};

export const formatMessageTime = (isoString: string) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

export const toChatMessage = (message: CommunityMessage): ChatMessage => ({
  id: message.messageId,
  author: message.isMine ? 'Bạn' : message.senderName,
  text: message.content ?? '',
  time: formatMessageTime(message.sentAt),
  mine: message.isMine,
  read: true,
  avatarUrl: message.senderAvatarUrl,
  mediaUrl: message.mediaUrl,
  isPinned: message.isPinned,
  senderId: message.senderId,
});

export const filterOptions: Array<{ id: ConversationFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'direct', label: 'Cá nhân' },
  { id: 'club', label: 'CLB' },
];

export const kindLabels: Record<ConversationKind, string> = {
  club: 'CLB',
  direct: 'Cá nhân',
};

export const getLevelLabel = (conversation: Conversation) => {
  if (conversation.kind === 'club') return conversation.level;
  return conversation.level ? 'Trình độ ' + conversation.level : 'Chưa cập nhật trình độ';
};

export const groupToConversation = (group: CommunityGroup): Conversation => ({
  id: 'club-group-' + group.groupId,
  name: group.groupName,
  avatar: group.groupName.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
  avatarUrl: group.coverImageUrl,
  level: 'Câu lạc bộ',
  kind: 'club',
  lastMessage: group.messageCount > 0
    ? group.messageCount + ' tin nhắn trong nhóm'
    : 'Chưa có tin nhắn',
  lastTime: '',
  unreadMessageCount: group.unreadMessageCount,
  contextTitle: group.groupName,
  contextMeta: group.memberCount + ' thành viên',
  groupId: group.groupId,
});

export const directToConversation = (direct: DirectConversation): Conversation => ({
  id: 'direct-conv-' + direct.conversationId,
  name: direct.otherUsername,
  avatar: direct.otherUsername.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
  avatarUrl: direct.otherProfileImageUrl,
  level: direct.otherSkillLevel,
  kind: 'direct',
  lastMessage: direct.lastMessage || 'Chưa có tin nhắn',
  lastTime: formatMessageTime(direct.lastMessageAt),
  unreadMessageCount: direct.unreadMessageCount,
  contextTitle: 'Trò chuyện cá nhân',
  contextMeta: direct.otherSkillLevel ? 'Trình độ ' + direct.otherSkillLevel : 'Chưa cập nhật trình độ',
  conversationId: direct.conversationId,
  otherUserId: direct.otherUserId,
});