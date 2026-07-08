import type { CommunityGroup, DirectConversation } from '../../api/community';

export type ConversationKind = 'match' | 'booking' | 'club' | 'direct';
export type ConversationStatus = 'online' | 'offline' | 'playing';
export type ConversationFilter = 'all' | 'unread' | ConversationKind;

export type Conversation = {
  id: string;
  name: string;
  avatar: string;
  level: string;
  status: ConversationStatus;
  kind: ConversationKind;
  lastMessage: string;
  lastTime: string;
  unread: number;
  location: string;
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

export const filterOptions: Array<{ id: ConversationFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'unread', label: 'Chưa đọc' },
  { id: 'match', label: 'Ghép trận' },
  { id: 'booking', label: 'Sân' },
  { id: 'club', label: 'CLB' },
];

export const kindLabels: Record<ConversationKind, string> = {
  match: 'Ghép trận',
  booking: 'Đặt sân',
  club: 'CLB',
  direct: 'Cá nhân',
};

export const statusLabels: Record<ConversationStatus, string> = {
  online: 'Đang online',
  offline: 'Vừa hoạt động',
  playing: 'Đang ở sân',
};

export const statusClassNames: Record<ConversationStatus, string> = {
  online: 'bg-[#2f9e44]',
  offline: 'bg-[#8a9380]',
  playing: 'bg-[#eab526]',
};

export const getCurrentTime = () =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

export const formatMessageTime = (isoString: string) => {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Hôm qua';
  if (diffDays < 7) {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayNames[date.getDay()];
  }
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

export const getLevelLabel = (conversation: Conversation) =>
  conversation.kind === 'booking' || conversation.kind === 'club'
    ? conversation.level
    : `Level ${conversation.level}`;

export const groupToConversation = (group: CommunityGroup): Conversation => ({
  id: `club-group-${group.groupId}`,
  name: group.groupName,
  avatar: group.groupName.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
  level: 'CLB',
  status: 'online',
  kind: 'club',
  lastMessage: group.messageCount > 0
    ? `${group.messageCount} tin nhắn trong nhóm`
    : 'Chưa có tin nhắn',
  lastTime: formatMessageTime(group.createdAt),
  unread: 0,
  location: '',
  contextTitle: group.groupName,
  contextMeta: `${group.memberCount} thành viên`,
  groupId: group.groupId,
});

export const directToConversation = (direct: DirectConversation): Conversation => ({
  id: `direct-conv-${direct.conversationId}`,
  name: direct.otherUsername,
  avatar: direct.otherProfileImageUrl || '',
  level: direct.otherSkillLevel,
  status: 'online',
  kind: 'direct',
  lastMessage: direct.lastMessage || 'Chưa có tin nhắn',
  lastTime: formatMessageTime(direct.lastMessageAt),
  unread: 0,
  location: '',
  contextTitle: 'Trò chuyện cá nhân',
  contextMeta: `Trình độ ${direct.otherSkillLevel}`,
  conversationId: direct.conversationId,
  otherUserId: direct.otherUserId,
});