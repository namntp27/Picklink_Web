import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CalendarClock,
  CheckCheck,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Info,
  Loader2,
  MapPin,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Phone,
  Search,
  Send,
  ShieldCheck,
  Smile,
  Trophy,
  UserRound,
  Users,
  Video,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useOutletContext } from 'react-router-dom';
import {
  getGroups,
  getGroupMessages,
  sendGroupMessage,
  type CommunityGroup,
  type CommunityMessage,
} from '../../api/community';

type ConversationKind = 'match' | 'booking' | 'club' | 'direct';
type ConversationStatus = 'online' | 'offline' | 'playing';
type ConversationFilter = 'all' | 'unread' | ConversationKind;

type Conversation = {
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
  // If this is a club conversation, store the group ID
  groupId?: number;
};

type ChatMessage = {
  id: number;
  author: string;
  text: string;
  time: string;
  mine?: boolean;
  read?: boolean;
  avatarUrl?: string | null;
  mediaUrl?: string | null;
};

// ─── Static conversations (match, booking, direct) ──────────────────────

const staticConversations: Conversation[] = [
  {
    id: 'tran-quoc-bao',
    name: 'Trần Quốc Bảo',
    avatar: 'TB',
    level: '3.5',
    status: 'online',
    kind: 'match',
    lastMessage: 'Tối mai mình chốt sân Cầu Giấy nhé.',
    lastTime: '10:42',
    unread: 2,
    location: 'Cầu Giấy, Hà Nội',
    contextTitle: 'Trận đôi Cầu Giấy',
    contextMeta: '20/06 · 18:00 - 19:30',
  },
  {
    id: 'le-tuyet-mai',
    name: 'Lê Tuyết Mai',
    avatar: 'TM',
    level: '3.0',
    status: 'playing',
    kind: 'direct',
    lastMessage: 'Mình rảnh khung 19h các ngày trong tuần.',
    lastTime: '09:15',
    unread: 0,
    location: 'Thủ Đức, TP. Hồ Chí Minh',
    contextTitle: 'Bạn đánh đôi phù hợp',
    contextMeta: 'Tỷ lệ phản hồi 96%',
  },
  {
    id: 'pickleball-pro-duy-tan',
    name: 'Pickleball Pro Duy Tân',
    avatar: 'DT',
    level: 'Sân',
    status: 'online',
    kind: 'booking',
    lastMessage: 'Sân C.Lông 1 đã được giữ tạm trong 10 phút.',
    lastTime: 'Hôm qua',
    unread: 1,
    location: 'Duy Tân, Hà Nội',
    contextTitle: 'Đơn đặt sân #PKL2048',
    contextMeta: '18/06 · 07:00 - 08:00',
  },
];

const staticMessages: Record<string, ChatMessage[]> = {
  'tran-quoc-bao': [
    {
      id: 1,
      author: 'Trần Quốc Bảo',
      text: 'Chào bạn, mình thấy bạn tham gia lời mời trận đôi tối mai đúng không?',
      time: '10:18',
    },
    {
      id: 2,
      author: 'Bạn',
      text: 'Đúng rồi Bảo. Mình đánh level 3.0, có thể chơi vị trí bên phải.',
      time: '10:21',
      mine: true,
      read: true,
    },
    {
      id: 3,
      author: 'Trần Quốc Bảo',
      text: 'Ổn quá. Tối mai mình chốt sân Cầu Giấy nhé, 18h có mặt trước 10 phút.',
      time: '10:42',
    },
  ],
  'le-tuyet-mai': [
    {
      id: 1,
      author: 'Bạn',
      text: 'Mai bạn có rảnh đánh thử một trận đơn không?',
      time: '08:54',
      mine: true,
      read: true,
    },
    {
      id: 2,
      author: 'Lê Tuyết Mai',
      text: 'Mình rảnh khung 19h các ngày trong tuần. Nếu bạn đặt được sân thì nhắn mình nhé.',
      time: '09:15',
    },
  ],
  'pickleball-pro-duy-tan': [
    {
      id: 1,
      author: 'Pickleball Pro Duy Tân',
      text: 'Sân C.Lông 1 đã được giữ tạm trong 10 phút. Bạn vui lòng hoàn tất thanh toán để xác nhận lịch.',
      time: 'Hôm qua',
    },
  ],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const filterOptions: Array<{ id: ConversationFilter; label: string }> = [
  { id: 'all', label: 'Tất cả' },
  { id: 'unread', label: 'Chưa đọc' },
  { id: 'match', label: 'Ghép trận' },
  { id: 'booking', label: 'Sân' },
  { id: 'club', label: 'CLB' },
];

const kindLabels: Record<ConversationKind, string> = {
  match: 'Ghép trận',
  booking: 'Đặt sân',
  club: 'CLB',
  direct: 'Cá nhân',
};

const statusLabels: Record<ConversationStatus, string> = {
  online: 'Đang online',
  offline: 'Vừa hoạt động',
  playing: 'Đang ở sân',
};

const statusClassNames: Record<ConversationStatus, string> = {
  online: 'bg-[#2f9e44]',
  offline: 'bg-[#8a9380]',
  playing: 'bg-[#eab526]',
};

const getCurrentTime = () =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

const formatMessageTime = (isoString: string) => {
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

const getLevelLabel = (conversation: Conversation) =>
  conversation.kind === 'booking' || conversation.kind === 'club'
    ? conversation.level
    : `Level ${conversation.level}`;

const groupToConversation = (group: CommunityGroup): Conversation => ({
  id: `club-group-${group.groupId}`,
  name: group.groupName,
  avatar: group.groupName.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase(),
  level: 'CLB',
  status: 'online' as ConversationStatus,
  kind: 'club' as ConversationKind,
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

// ─── Component ──────────────────────────────────────────────────────────────

export const Messages = () => {
  const { token } = useAuth();
  const { setShowFooter } = useOutletContext<{ setShowFooter: (val: boolean) => void }>() || {};

  useEffect(() => {
    if (setShowFooter) {
      setShowFooter(false);
    }
    return () => {
      if (setShowFooter) {
        setShowFooter(true);
      }
    };
  }, [setShowFooter]);

  // Conversations from API
  const [clubConversations, setClubConversations] = useState<Conversation[]>([]);
  const [clubGroupsLoading, setClubGroupsLoading] = useState(true);

  // All conversations = static + club
  const allConversations = useMemo(
    () => [...staticConversations, ...clubConversations],
    [clubConversations],
  );

  const [activeConversationId, setActiveConversationId] = useState(staticConversations[0].id);
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>(staticMessages);
  const [clubMessagesLoading, setClubMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load club groups on mount
  useEffect(() => {
    if (!token) {
      setClubGroupsLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        const groups = await getGroups(token);
        if (cancelled) return;
        const myGroups = groups.filter(
          (g) => g.myStatus === 'Accepted' || g.myRole === 'Owner',
        );
        setClubConversations(myGroups.map(groupToConversation));
      } catch {
        // silent fail
      } finally {
        if (!cancelled) setClubGroupsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token]);

  const filteredConversations = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return allConversations.filter((conversation) => {
      const matchesFilter =
        filter === 'all' ||
        (filter === 'unread' ? conversation.unread > 0 : conversation.kind === filter);
      const matchesKeyword =
        !keyword ||
        conversation.name.toLowerCase().includes(keyword) ||
        conversation.location.toLowerCase().includes(keyword) ||
        conversation.contextTitle.toLowerCase().includes(keyword);

      return matchesFilter && matchesKeyword;
    });
  }, [filter, searchTerm, allConversations]);

  const activeConversation =
    allConversations.find((conversation) => conversation.id === activeConversationId) ?? allConversations[0];
  const activeMessages = messagesByConversation[activeConversation?.id] ?? [];

  // Load club messages when a club conversation is selected
  useEffect(() => {
    if (!token || !activeConversation?.groupId) return;
    // Already loaded
    if (messagesByConversation[activeConversation.id]?.length) return;

    let cancelled = false;
    const load = async () => {
      setClubMessagesLoading(true);
      try {
        const msgs = await getGroupMessages(token, activeConversation.groupId!);
        if (cancelled) return;
        const chatMessages: ChatMessage[] = msgs.map((m) => ({
          id: m.messageId,
          author: m.isMine ? 'Bạn' : m.senderName,
          text: m.content ?? '',
          time: formatMessageTime(m.sentAt),
          mine: m.isMine,
          read: true,
          avatarUrl: m.senderAvatarUrl,
          mediaUrl: m.mediaUrl,
        }));
        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversation.id]: chatMessages,
        }));
      } catch {
        // silent
      } finally {
        if (!cancelled) setClubMessagesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token, activeConversation?.id, activeConversation?.groupId]);

  // Poll club messages every 8s
  useEffect(() => {
    if (!token || !activeConversation?.groupId) return;
    let cancelled = false;

    const interval = setInterval(async () => {
      try {
        const msgs = await getGroupMessages(token, activeConversation.groupId!);
        if (cancelled) return;
        const chatMessages: ChatMessage[] = msgs.map((m) => ({
          id: m.messageId,
          author: m.isMine ? 'Bạn' : m.senderName,
          text: m.content ?? '',
          time: formatMessageTime(m.sentAt),
          mine: m.isMine,
          read: true,
          avatarUrl: m.senderAvatarUrl,
          mediaUrl: m.mediaUrl,
        }));
        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversation.id]: chatMessages,
        }));
      } catch {
        // silent
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, activeConversation?.id, activeConversation?.groupId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  const handleSendMessage = async () => {
    const text = draftMessage.trim();
    if (!text) return;

    // If club conversation, send via API
    if (activeConversation?.groupId && token) {
      setSending(true);
      try {
        const newMsg = await sendGroupMessage(token, activeConversation.groupId, { content: text });
        const chatMsg: ChatMessage = {
          id: newMsg.messageId,
          author: 'Bạn',
          text: newMsg.content ?? '',
          time: formatMessageTime(newMsg.sentAt),
          mine: true,
          read: true,
          avatarUrl: newMsg.senderAvatarUrl,
          mediaUrl: newMsg.mediaUrl,
        };
        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversation.id]: [...(prev[activeConversation.id] ?? []), chatMsg],
        }));
        setDraftMessage('');
      } catch {
        // silent
      } finally {
        setSending(false);
      }
      return;
    }

    // Static conversations — local-only send
    const nextMessage: ChatMessage = {
      id: Date.now(),
      author: 'Bạn',
      text,
      time: getCurrentTime(),
      mine: true,
      read: true,
    };

    setMessagesByConversation((currentMessages) => ({
      ...currentMessages,
      [activeConversation.id]: [...(currentMessages[activeConversation.id] ?? []), nextMessage],
    }));
    setDraftMessage('');
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <div className="flex min-h-[calc(100vh-72px)] flex-col overflow-hidden border-t border-outline-variant bg-[#f9f9ff] lg:h-[calc(100vh-72px)] lg:flex-row">
        <aside className="flex h-[360px] w-full shrink-0 flex-col border-b border-outline-variant bg-white lg:h-full lg:w-[360px] lg:border-b-0 lg:border-r">
          <div className="border-b border-outline-variant p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h1 className="text-[22px] font-bold text-on-surface">Tin nhắn</h1>
                <p className="mt-1 text-[13px] font-medium text-on-surface-variant">
                  Trao đổi riêng với người chơi, CLB và sân.
                </p>
              </div>
              <button
                aria-label="Tạo cuộc trò chuyện mới"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition-colors hover:bg-primary/90"
                type="button"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-3 text-[14px] font-medium outline-none placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm người chơi, sân, CLB..."
                type="text"
                value={searchTerm}
              />
            </div>

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {filterOptions.map((option) => (
                <button
                  className={`h-9 shrink-0 rounded-lg px-3 text-[13px] font-bold transition-colors ${
                    filter === option.id
                      ? 'bg-primary text-white'
                      : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                  key={option.id}
                  onClick={() => setFilter(option.id)}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-2">
            {clubGroupsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="ml-2 text-[13px] text-on-surface-variant">Đang tải CLB...</span>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => {
                const isActive = conversation.id === activeConversation?.id;

                return (
                  <button
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                      isActive
                        ? 'bg-primary-container text-on-primary-container shadow-sm'
                        : 'text-on-surface hover:bg-surface-container-low'
                    }`}
                    key={conversation.id}
                    onClick={() => setActiveConversationId(conversation.id)}
                    type="button"
                  >
                    <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white">
                      {conversation.avatar}
                      <span
                        className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${statusClassNames[conversation.status]}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-[14px] font-bold">{conversation.name}</p>
                        <span
                          className={`shrink-0 text-[11px] font-bold ${
                            isActive ? 'text-on-primary-container/70' : 'text-on-surface-variant'
                          }`}
                        >
                          {conversation.lastTime}
                        </span>
                      </div>
                      <p
                        className={`mt-1 truncate text-[12px] font-medium ${
                          isActive ? 'text-on-primary-container/80' : 'text-on-surface-variant'
                        }`}
                      >
                        {conversation.lastMessage}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                            isActive ? 'bg-white/35 text-on-primary-container' : 'bg-surface-container-low text-primary'
                          }`}
                        >
                          {kindLabels[conversation.kind]}
                        </span>
                        {conversation.unread > 0 && (
                          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#eab526] px-1 text-[11px] font-bold text-white">
                            {conversation.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <Search className="h-9 w-9 text-on-surface-variant" />
                <p className="mt-3 text-[14px] font-bold text-on-surface">Không tìm thấy hội thoại</p>
                <p className="mt-1 text-[13px] text-on-surface-variant">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
              </div>
            )}
          </div>
        </aside>

        <main className="flex min-h-[620px] flex-1 flex-col bg-[#f9f9ff] lg:min-h-0">
          {activeConversation && (
            <>
              <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-white px-4 shadow-sm md:h-[72px] md:px-6">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white">
                    {activeConversation.avatar}
                    <span
                      className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${statusClassNames[activeConversation.status]}`}
                    />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-[16px] font-bold text-on-surface">{activeConversation.name}</h2>
                    <p className="truncate text-[12px] font-bold text-on-surface-variant">
                      {statusLabels[activeConversation.status]} · {getLevelLabel(activeConversation)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <button aria-label="Gọi thoại" className="rounded-lg p-2 transition-colors hover:bg-surface-container-low hover:text-primary" type="button">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button aria-label="Gọi video" className="rounded-lg p-2 transition-colors hover:bg-surface-container-low hover:text-primary" type="button">
                    <Video className="h-5 w-5" />
                  </button>
                  <button aria-label="Thông tin hội thoại" className="rounded-lg p-2 transition-colors hover:bg-surface-container-low hover:text-primary" type="button">
                    <Info className="h-5 w-5" />
                  </button>
                  <button aria-label="Tùy chọn" className="rounded-lg p-2 transition-colors hover:bg-surface-container-low hover:text-primary" type="button">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </header>

              <div
                className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-4 md:p-6"
                style={{
                  backgroundImage: 'radial-gradient(#DDE5D5 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              >
                {clubMessagesLoading && activeConversation.groupId ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <MessageCircle className="h-8 w-8 text-on-surface-variant" />
                    <p className="mt-3 text-[14px] font-bold text-on-surface">Chưa có tin nhắn nào</p>
                    <p className="mt-1 text-[13px] text-on-surface-variant">Hãy gửi tin nhắn đầu tiên!</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <span className="rounded-full bg-[#e2e8f8] px-3 py-1 text-[11px] font-bold text-on-surface-variant">
                        Hôm nay
                      </span>
                    </div>

                    {activeMessages.map((message) => (
                      <div className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`} key={message.id}>
                        <div className={`flex w-fit max-w-[78%] gap-3 md:max-w-[620px] ${message.mine ? 'flex-row-reverse' : ''}`}>
                          {!message.mine && (
                            message.avatarUrl ? (
                              <img
                                alt={message.author}
                                className="mt-1 h-8 w-8 shrink-0 rounded-full object-cover"
                                src={message.avatarUrl}
                              />
                            ) : (
                              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
                                {activeConversation.avatar}
                              </div>
                            )
                          )}
                          <div className={`min-w-0 ${message.mine ? 'items-end text-right' : ''}`}>
                            <div className={`mb-1 flex items-center gap-2 ${message.mine ? 'justify-end' : ''}`}>
                              <span className="text-[12px] font-bold text-on-surface-variant">{message.author}</span>
                              <span className="text-[11px] font-medium text-on-surface-variant">{message.time}</span>
                            </div>
                            <div
                              className={`rounded-2xl px-4 py-3 text-[14px] leading-6 shadow-sm ${
                                message.mine
                                  ? 'rounded-tr-sm bg-primary text-white'
                                  : 'rounded-tl-sm border border-outline-variant bg-white text-on-surface'
                              }`}
                            >
                              {message.text}
                              {message.mediaUrl && (
                                <img
                                  alt="Media"
                                  className="mt-2 max-h-56 max-w-[240px] rounded-lg border border-outline-variant object-cover"
                                  src={message.mediaUrl}
                                />
                              )}
                            </div>
                            {message.mine && (
                              <div className="mt-1 flex items-center justify-end gap-1 text-[11px] font-medium text-on-surface-variant">
                                <CheckCheck className="h-3.5 w-3.5" />
                                {message.read ? 'Đã xem' : 'Đã gửi'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              <div className="shrink-0 border-t border-outline-variant bg-white p-3 md:p-4">
                <div className="flex items-end gap-2">
                  <button
                    aria-label="Đính kèm tệp"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                    type="button"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Gửi hình ảnh"
                    className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary sm:flex"
                    type="button"
                  >
                    <ImageIcon className="h-5 w-5" />
                  </button>
                  <div className="relative flex-1 rounded-xl border border-outline-variant bg-surface-container-low focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                    <textarea
                      className="max-h-32 min-h-11 w-full resize-none bg-transparent px-4 py-3 pr-11 text-[14px] leading-5 outline-none placeholder:text-on-surface-variant/70"
                      onChange={(event) => setDraftMessage(event.target.value)}
                      onKeyDown={handleComposerKeyDown}
                      placeholder="Nhập tin nhắn..."
                      rows={1}
                      value={draftMessage}
                    />
                    <button
                      aria-label="Biểu cảm"
                      className="absolute bottom-2 right-2 rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-white hover:text-primary"
                      type="button"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    aria-label="Gửi tin nhắn"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-transform hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:bg-[#8a9380]"
                    disabled={!draftMessage.trim() || sending}
                    onClick={handleSendMessage}
                    type="button"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </main>

        <aside className="hidden h-full w-[330px] shrink-0 border-l border-outline-variant bg-white xl:flex xl:flex-col">
          {activeConversation && (
            <>
              <div className="border-b border-outline-variant p-5">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-[26px] font-bold text-white">
                  {activeConversation.avatar}
                </div>
                <h2 className="mt-4 text-center text-[20px] font-bold">{activeConversation.name}</h2>
                <p className="mt-1 text-center text-[13px] font-bold text-primary">
                  {kindLabels[activeConversation.kind]} · {getLevelLabel(activeConversation)}
                </p>
              </div>

              <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
                <section className="rounded-lg border border-outline-variant bg-surface-container-low p-4">
                  <h3 className="flex items-center gap-2 text-[15px] font-bold">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Ngữ cảnh trao đổi
                  </h3>
                  <p className="mt-3 text-[14px] font-bold text-on-surface">{activeConversation.contextTitle}</p>
                  <p className="mt-1 text-[13px] leading-5 text-on-surface-variant">{activeConversation.contextMeta}</p>
                </section>

                <section className="rounded-lg border border-outline-variant p-4">
                  <h3 className="text-[15px] font-bold">Thông tin nhanh</h3>
                  <div className="mt-4 space-y-3">
                    {activeConversation.location && (
                      <div className="flex gap-3 text-[13px]">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <div>
                          <p className="font-bold text-on-surface">Khu vực</p>
                          <p className="mt-0.5 text-on-surface-variant">{activeConversation.location}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex gap-3 text-[13px]">
                      <Trophy className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-bold text-on-surface">Trình độ</p>
                        <p className="mt-0.5 text-on-surface-variant">{getLevelLabel(activeConversation)}</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-[13px]">
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-bold text-on-surface">Trạng thái</p>
                        <p className="mt-0.5 text-on-surface-variant">{statusLabels[activeConversation.status]}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant p-4">
                  <h3 className="flex items-center gap-2 text-[15px] font-bold">
                    <CalendarClock className="h-5 w-5 text-primary" />
                    Lịch hẹn liên quan
                  </h3>
                  <div className="mt-4 rounded-lg bg-[#eaf7df] p-3">
                    <p className="text-[13px] font-bold text-primary">{activeConversation.contextTitle}</p>
                    <p className="mt-1 text-[12px] font-medium text-on-surface-variant">{activeConversation.contextMeta}</p>
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant p-4">
                  <h3 className="text-[15px] font-bold">Tác vụ</h3>
                  <div className="mt-3 space-y-2">
                    {['Xem hồ sơ', 'Xem lịch sử trận', 'Báo cáo hội thoại'].map((action) => (
                      <button
                        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-[13px] font-bold text-on-surface transition-colors hover:bg-surface-container-low"
                        key={action}
                        type="button"
                      >
                        <span>{action}</span>
                        <ChevronRight className="h-4 w-4 text-on-surface-variant" />
                      </button>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-[#fff8e6] p-4">
                  <h3 className="flex items-center gap-2 text-[15px] font-bold text-[#7a5600]">
                    <UserRound className="h-5 w-5" />
                    An toàn cộng đồng
                  </h3>
                  <p className="mt-2 text-[13px] leading-5 text-[#7a5600]">
                    Chỉ chuyển tiền qua luồng thanh toán của Picklink và xác nhận lịch trong hệ thống.
                  </p>
                </section>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
};
