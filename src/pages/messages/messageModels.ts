import type { CommunityGroup, CommunityMessage, DirectConversation } from '../../api/community';
import type { MatchDetailResponse, MatchMessage } from '../../api/matches';

export type ConversationKind = 'club' | 'direct' | 'match';
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
  matchId?: number;
  accessRole?: 'Member' | 'Replacement' | string | null;
  accessExpiresAt?: string | null;
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
  senderRole?: 'Member' | 'Replacement' | string;
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

export const formatTemporaryAccessExpiry = (isoString?: string | null) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });
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
export const toMatchChatMessage = (message: MatchMessage): ChatMessage => ({
  id: message.messageId,
  author: message.isMine ? 'Bạn' : message.senderName,
  text: message.content,
  time: formatMessageTime(message.sentAt),
  mine: message.isMine,
  read: true,
  avatarUrl: message.senderAvatarUrl,
  senderId: message.senderId,
  senderRole: message.senderRole,
});


export const filterOptions: Array<{ id: ConversationFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'direct', label: 'Cá nhân' },
  { id: 'club', label: 'CLB' },
  { id: 'match', label: 'Phòng trận' },
];

export const kindLabels: Record<ConversationKind, string> = {
  club: 'CLB',
  direct: 'Cá nhân',
  match: 'Phòng trận',
};

export const getLevelLabel = (conversation: Conversation) => {
  if (conversation.kind === 'club') return conversation.level;
  if (conversation.kind === 'match') return 'Phòng ' + conversation.level;
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

export const directToConversation = (direct: DirectConversation): Conversation => {
  const isRoom = direct.conversationType === 'LobbyChat' || direct.conversationType === 'QueueLobbyChat';
  const matchId = direct.matchId ?? undefined;
  return {
    id: matchId ? 'match-' + matchId : (isRoom ? 'room-conv-' : 'direct-conv-') + direct.conversationId,
    name: direct.otherUsername,
    avatar: direct.otherUsername.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
    avatarUrl: direct.otherProfileImageUrl,
    level: isRoom ? 'Ghép trận' : direct.otherSkillLevel,
    kind: isRoom ? 'match' : 'direct',
    lastMessage: direct.lastMessage || 'Chưa có tin nhắn',
    lastTime: formatMessageTime(direct.lastMessageAt),
    unreadMessageCount: direct.unreadMessageCount,
    contextTitle: isRoom ? direct.otherUsername : 'Trò chuyện cá nhân',
    contextMeta: isRoom
      ? direct.accessRole === 'Replacement' ? 'Bạn đang tham gia với vai trò người thay thế' : 'Trao đổi trong phòng trận'
      : direct.otherSkillLevel ? 'Trình độ ' + direct.otherSkillLevel : 'Chưa cập nhật trình độ',
    conversationId: direct.conversationId,
    otherUserId: direct.otherUserId,
    matchId,
    accessRole: direct.accessRole,
    accessExpiresAt: direct.accessExpiresAt,
  };
};
export const matchToConversation = (match: MatchDetailResponse): Conversation => ({
  id: 'match-' + match.matchId,
  name: match.title,
  avatar: match.title.split(/\s+/).map((word) => word[0]).join('').slice(0, 2).toUpperCase(),
  level: match.matchType,
  kind: 'match',
  lastMessage: 'Trao đổi với các thành viên trong phòng',
  lastTime: '',
  unreadMessageCount: 0,
  contextTitle: match.title,
  contextMeta: `${match.acceptedPlayerCount}/${match.requiredPlayerCount} người chơi · ${match.province}, ${match.ward}`,
  matchId: match.matchId,
  accessRole: match.chatAccessRole,
  accessExpiresAt: match.chatAccessExpiresAt,
});
