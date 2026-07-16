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
  Camera,
  Check,
  Globe,
  Lock,
  LogOut,
  Trash2,
  X,
  Pin,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/ToastRegion';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import {
  getGroups,
  getGroup,
  getGroupMessages,
  sendGroupMessage,
  getGroupMembers,
  getPinnedGroupMessages,
  updateGroup,
  approveMember,
  removeMember,
  leaveGroup,
  addGroupImage,
  removeGroupImage,
  deleteGroupMessage,
  pinGroupMessage,
  getDirectConversations,
  startDirectConversation,
  getDirectMessages,
  sendDirectMessage,
  type CommunityGroup,
  type CommunityMessage,
  type CommunityMember,
  type GroupImage,
} from '../../api/community';
import { uploadToCloudinary } from '../../api/cloudinary';

import {
  directToConversation,
  filterOptions,
  formatMessageTime,
  getCurrentTime,
  getLevelLabel,
  groupToConversation,
  kindLabels,
  statusClassNames,
  statusLabels,
  type ChatMessage,
  type Conversation,
  type ConversationFilter,
} from './messageModels';
export const Messages = () => {
  const { token } = useAuth();
  const notify = useToast();
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
  const [directConversations, setDirectConversations] = useState<Conversation[]>([]);
  const [clubGroupsLoading, setClubGroupsLoading] = useState(true);

  // Group info & settings states
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [showSettings, setShowSettings] = useState(true);
  const [settingsMembers, setSettingsMembers] = useState<CommunityMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Form states for editing
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editRating, setEditRating] = useState('');
  const [introImages, setIntroImages] = useState<GroupImage[]>([]);
  const [uploadingIntro, setUploadingIntro] = useState(false);

  const mediaInputRef = useRef<HTMLInputElement>(null);

  // Search parameters for starting chat
  const [searchParams, setSearchParams] = useSearchParams();
  const chatWithUserId = searchParams.get('chatWithUserId');

  // All conversations = direct + club
  const allConversations = useMemo(
    () => [
      ...directConversations,
      ...clubConversations
    ],
    [directConversations, clubConversations],
  );

  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [filter, setFilter] = useState<ConversationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [draftMessage, setDraftMessage] = useState('');
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const [clubMessagesLoading, setClubMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeMenuMessageId, setActiveMenuMessageId] = useState<number | null>(null);
  const [hasMoreByConversation, setHasMoreByConversation] = useState<Record<string, boolean>>({});
  const [loadingMoreByConversation, setLoadingMoreByConversation] = useState<Record<string, boolean>>({});
  const [pinnedMessagesByConversation, setPinnedMessagesByConversation] = useState<Record<string, ChatMessage[]>>({});
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<Record<string, number | null>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount & handle chatWithUserId query param
  useEffect(() => {
    if (!token) {
      setClubGroupsLoading(false);
      return;
    }

    let cancelled = false;
    const load = async () => {
      try {
        // Fetch groups
        const groupsData = await getGroups(token, undefined, undefined, undefined, 'Mine');
        if (cancelled) return;
        const myGroups = groupsData.filter(
          (g) => g.myStatus === 'Accepted' || g.myRole === 'Owner',
        );
        setGroups(myGroups);
        setClubConversations(myGroups.map(groupToConversation));

        // Fetch direct conversations
        const directData = await getDirectConversations(token);
        if (cancelled) return;
        const mappedDirect = directData.map(directToConversation);
        setDirectConversations(mappedDirect);

        // If chatWithUserId is provided in the URL, start/ensure that chat!
        const chatParam = searchParams.get('chat') || searchParams.get('conversationId');
        if (chatWithUserId) {
          const targetUid = Number(chatWithUserId);
          if (!isNaN(targetUid)) {
            // Check if direct conversation already loaded
            const existing = mappedDirect.find(c => c.otherUserId === targetUid);
            if (existing) {
              setActiveConversationId(existing.id);
            } else {
              // Start a new direct conversation
              const newDirect = await startDirectConversation(token, targetUid);
              if (!cancelled) {
                const newConv = directToConversation(newDirect);
                setDirectConversations(prev => [newConv, ...prev]);
                setActiveConversationId(newConv.id);
              }
            }
            // Clear search param once processed
            setSearchParams({});
          }
        } else if (chatParam) {
          setActiveConversationId(chatParam);
          setSearchParams({});
        } else {
          // Auto-select first loaded conversation
          if (mappedDirect.length > 0) {
            setActiveConversationId(mappedDirect[0].id);
          } else if (myGroups.length > 0) {
            setActiveConversationId(groupToConversation(myGroups[0]).id);
          }
        }
      } catch (err) {
        console.error('Failed to load conversations', err);
      } finally {
        if (!cancelled) setClubGroupsLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token, chatWithUserId, searchParams, setSearchParams]);

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
  const pinnedMessages = useMemo(
    () => pinnedMessagesByConversation[activeConversation?.id] ?? [],
    [pinnedMessagesByConversation, activeConversation?.id],
  );

  const activeGroup = groups.find((g) => g.groupId === activeConversation?.groupId) ?? null;
  const isManager = !!(activeGroup && ['Owner', 'Admin', 'Moderator'].includes(activeGroup.myRole || ''));

  // Load full group details (including intro images) when a club conversation is selected
  useEffect(() => {
    if (!token || !activeConversation?.groupId) return;

    let cancelled = false;
    const loadDetails = async () => {
      try {
        const details = await getGroup(activeConversation.groupId!, token);
        if (cancelled) return;
        setGroups((prev) =>
          prev.map((g) => (g.groupId === details.groupId ? details : g))
        );
      } catch (err) {
        console.error('Failed to load group details', err);
      }
    };
    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [token, activeConversation?.groupId]);

  const loadSettingsMembers = useCallback(async () => {
    if (!token || !activeConversation?.groupId) return;
    setMembersLoading(true);
    try {
      const data = await getGroupMembers(token, activeConversation.groupId);
      setSettingsMembers(data);
    } catch (err) {
      console.error('Failed to load group members', err);
    } finally {
      setMembersLoading(false);
    }
  }, [token, activeConversation?.groupId]);

  useEffect(() => {
    if (showSettings && activeConversation?.groupId) {
      loadSettingsMembers();
    }
  }, [showSettings, activeConversation?.groupId, loadSettingsMembers]);

  useEffect(() => {
    if (activeGroup) {
      setEditName(activeGroup.groupName);
      setEditDesc(activeGroup.description || '');
      setEditRules(activeGroup.rules || '');
      setEditRating(activeGroup.overallRating > 0 ? String(activeGroup.overallRating) : '');
      setIntroImages(activeGroup.images ?? []);
    }
  }, [activeConversation?.groupId, activeGroup]);

  const handleUpdateGroup = async (fields: {
    groupName?: string;
    description?: string;
    groupType?: string;
    coverImageUrl?: string;
    rules?: string;
    overallRating?: number;
    ratingCount?: number;
  }) => {
    if (!token || !activeConversation?.groupId || updatingGroup || !activeGroup) return;
    setUpdatingGroup(true);

    const mergedFields = {
      groupName: fields.groupName !== undefined ? fields.groupName : activeGroup.groupName,
      description: fields.description !== undefined ? fields.description : (activeGroup.description || ''),
      groupType: fields.groupType !== undefined ? fields.groupType : activeGroup.groupType,
      coverImageUrl: fields.coverImageUrl !== undefined ? fields.coverImageUrl : (activeGroup.coverImageUrl || ''),
      rules: fields.rules !== undefined ? fields.rules : (activeGroup.rules || ''),
      overallRating: fields.overallRating !== undefined ? fields.overallRating : activeGroup.overallRating,
      ratingCount: fields.ratingCount !== undefined ? fields.ratingCount : activeGroup.ratingCount,
    };

    try {
      const updated = await updateGroup(token, activeConversation.groupId, mergedFields);
      setGroups((prev) =>
        prev.map((g) => (g.groupId === activeConversation.groupId ? { ...g, ...updated } : g))
      );
      if (fields.rules !== undefined) setEditRules(updated.rules || '');
    } catch (err: any) {
      notify(err.message || 'Không thể cập nhật thông tin nhóm.', 'error');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !activeConversation?.groupId) return;

    try {
      setUploadProgress(0);
      const { url } = await uploadToCloudinary(token, file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadProgress(null);
      await handleUpdateGroup({ coverImageUrl: url });
    } catch (err: any) {
      setUploadProgress(null);
      notify(err.message || 'Không thể tải ảnh lên.', 'error');
    }
  };

  const handleIntroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !activeConversation?.groupId || uploadingIntro) return;
    setUploadingIntro(true);
    try {
      const { url } = await uploadToCloudinary(token, file, () => {});
      const newImg = await addGroupImage(token, activeConversation.groupId, url);
      setIntroImages((prev) => [...prev, newImg]);
      setGroups((prev) =>
        prev.map((g) =>
          g.groupId === activeConversation.groupId
            ? { ...g, images: [...(g.images ?? []), newImg] }
            : g
        )
      );
    } catch (err: any) {
      notify(err.message || 'Không thể tải ảnh lên.', 'error');
    } finally {
      setUploadingIntro(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveIntroImage = async (imageId: number) => {
    if (!token || !activeConversation?.groupId) return;
    if (!confirm('Xóa ảnh giới thiệu này?')) return;

    if (!introImages.some((img) => img.groupImageId === imageId)) return;

    try {
      await removeGroupImage(token, activeConversation.groupId, imageId);
      setIntroImages((prev) => prev.filter((img) => img.groupImageId !== imageId));
      setGroups((prev) =>
        prev.map((g) =>
          g.groupId === activeConversation.groupId
            ? { ...g, images: (g.images ?? []).filter((img) => img.groupImageId !== imageId) }
            : g
        )
      );
    } catch (err: any) {
      notify(err.message || 'Không thể xóa ảnh.', 'error');
    }
  };

  const handleApproveMember = async (memberUserId: number) => {
    if (!token || !activeConversation?.groupId) return;
    try {
      await approveMember(token, activeConversation.groupId, memberUserId);
      loadSettingsMembers();
    } catch (err: any) {
      notify(err.message || 'Không thể phê duyệt thành viên.', 'error');
    }
  };

  const handleRemoveMember = async (memberUserId: number) => {
    if (!token || !activeConversation?.groupId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
    try {
      await removeMember(token, activeConversation.groupId, memberUserId);
      loadSettingsMembers();
    } catch (err: any) {
      notify(err.message || 'Không thể xóa thành viên.', 'error');
    }
  };

  const handleLeaveGroup = async () => {
    if (!token || !activeConversation?.groupId) return;
    if (!confirm('Bạn có chắc chắn muốn rời nhóm này?')) return;
    try {
      await leaveGroup(token, activeConversation.groupId);
      setShowSettings(false);
      setActiveConversationId('');
      const groupsData = await getGroups(token);
      const myGroups = groupsData.filter(
        (g) => g.myStatus === 'Accepted' || g.myRole === 'Owner'
      );
      setGroups(myGroups);
      setClubConversations(myGroups.map(groupToConversation));
    } catch (err: any) {
      notify(err.message || 'Không thể rời nhóm.', 'error');
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || uploadingMedia || !activeConversation) return;
    const isGroup = !!activeConversation.groupId;
    const isDirect = !!activeConversation.conversationId;
    if (!isGroup && !isDirect) return;

    setUploadingMedia(true);
    try {
      const { url } = await uploadToCloudinary(token, file);
      let newMsg;
      if (isGroup) {
        newMsg = await sendGroupMessage(token, activeConversation.groupId!, {
          mediaUrl: url,
          content: `Đã gửi một ${file.type.startsWith('video/') ? 'video' : 'hình ảnh'}`
        });
      } else {
        newMsg = await sendDirectMessage(token, activeConversation.conversationId!, `Đã gửi một ${file.type.startsWith('video/') ? 'video' : 'hình ảnh'}`, url);
      }
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
    } catch (err: any) {
      notify(err.message || 'Không thể tải lên tệp tin.', 'error');
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  // Load messages when conversation is selected
  useEffect(() => {
    if (!token || !activeConversation) return;
    const isGroup = !!activeConversation.groupId;
    const isDirect = !!activeConversation.conversationId;
    if (!isGroup && !isDirect) return;

    // Already loaded
    if (messagesByConversation[activeConversation.id]?.length) return;

    let cancelled = false;
    const load = async () => {
      setClubMessagesLoading(true);
      try {
        let msgs: CommunityMessage[] = [];
        let pinned: CommunityMessage[] = [];

        if (isGroup) {
          const [groupMsgs, groupPinned] = await Promise.all([
            getGroupMessages(token, activeConversation.groupId!, undefined, 8),
            getPinnedGroupMessages(token, activeConversation.groupId!).catch(() => []),
          ]);
          msgs = groupMsgs;
          pinned = groupPinned;
        } else if (isDirect) {
          msgs = await getDirectMessages(token, activeConversation.conversationId!, undefined, 8);
        }

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
          isPinned: m.isPinned,
          senderId: m.senderId,
        }));

        const mappedPinned: ChatMessage[] = pinned.map((m) => ({
          id: m.messageId,
          author: m.isMine ? 'Bạn' : m.senderName,
          text: m.content ?? '',
          time: formatMessageTime(m.sentAt),
          mine: m.isMine,
          read: true,
          avatarUrl: m.senderAvatarUrl,
          mediaUrl: m.mediaUrl,
          isPinned: m.isPinned,
          senderId: m.senderId,
        }));

        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversation.id]: chatMessages,
        }));
        setPinnedMessagesByConversation((prev) => ({
          ...prev,
          [activeConversation.id]: mappedPinned,
        }));
        setHasMoreByConversation((prev) => ({
          ...prev,
          [activeConversation.id]: msgs.length >= 8,
        }));
      } catch (err) {
        console.error('Failed to load messages', err);
      } finally {
        if (!cancelled) setClubMessagesLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [token, activeConversation?.id, activeConversation?.groupId, activeConversation?.conversationId]);

  // Poll messages every 8s
  useEffect(() => {
    if (!token || !activeConversation) return;
    const isGroup = !!activeConversation.groupId;
    const isDirect = !!activeConversation.conversationId;
    if (!isGroup && !isDirect) return;

    let cancelled = false;

    const interval = setInterval(async () => {
      try {
        let msgs: CommunityMessage[] = [];
        let pinned: CommunityMessage[] = [];

        if (isGroup) {
          const [groupMsgs, groupPinned] = await Promise.all([
            getGroupMessages(token, activeConversation.groupId!, undefined, 8),
            getPinnedGroupMessages(token, activeConversation.groupId!).catch(() => []),
          ]);
          msgs = groupMsgs;
          pinned = groupPinned;
        } else if (isDirect) {
          msgs = await getDirectMessages(token, activeConversation.conversationId!, undefined, 8);
        }

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
          isPinned: m.isPinned,
          senderId: m.senderId,
        }));

        const mappedPinned: ChatMessage[] = pinned.map((m) => ({
          id: m.messageId,
          author: m.isMine ? 'Bạn' : m.senderName,
          text: m.content ?? '',
          time: formatMessageTime(m.sentAt),
          mine: m.isMine,
          read: true,
          avatarUrl: m.senderAvatarUrl,
          mediaUrl: m.mediaUrl,
          isPinned: m.isPinned,
          senderId: m.senderId,
        }));

        setMessagesByConversation((prev) => {
          const currentList = prev[activeConversation.id] ?? [];
          const existingIds = new Set(currentList.map(m => m.id));
          const newMsgs = chatMessages.filter(m => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          return {
            ...prev,
            [activeConversation.id]: [...currentList, ...newMsgs].sort((a, b) => a.id - b.id),
          };
        });

        setPinnedMessagesByConversation((prev) => ({
          ...prev,
          [activeConversation.id]: mappedPinned,
        }));
      } catch (err) {
        console.error('Failed to poll messages', err);
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, activeConversation?.id, activeConversation?.groupId, activeConversation?.conversationId]);

  const loadOlderChatMessages = async () => {
    if (!token || !activeConversation) return;
    const isGroup = !!activeConversation.groupId;
    const isDirect = !!activeConversation.conversationId;
    if (!isGroup && !isDirect) return;

    const conversationId = activeConversation.id;
    if (loadingMoreByConversation[conversationId] || hasMoreByConversation[conversationId] === false) return;

    const currentMsgs = messagesByConversation[conversationId] ?? [];
    const lowestId = currentMsgs[0]?.id;
    if (!lowestId) return;

    setLoadingMoreByConversation((prev) => ({ ...prev, [conversationId]: true }));
    const container = chatScrollRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;

    try {
      let msgs: CommunityMessage[] = [];
      if (isGroup) {
        msgs = await getGroupMessages(token, activeConversation.groupId!, lowestId, 8);
      } else if (isDirect) {
        msgs = await getDirectMessages(token, activeConversation.conversationId!, lowestId, 8);
      }

      if (msgs.length === 0) {
        setHasMoreByConversation((prev) => ({ ...prev, [conversationId]: false }));
        setLoadingMoreByConversation((prev) => ({ ...prev, [conversationId]: false }));
        return;
      }

      const mapped: ChatMessage[] = msgs.map((m) => ({
        id: m.messageId,
        author: m.isMine ? 'Bạn' : m.senderName,
        text: m.content ?? '',
        time: formatMessageTime(m.sentAt),
        mine: m.isMine,
        read: true,
        avatarUrl: m.senderAvatarUrl,
        mediaUrl: m.mediaUrl,
        isPinned: m.isPinned,
        senderId: m.senderId,
      }));

      setMessagesByConversation((prev) => {
        const currentList = prev[conversationId] ?? [];
        const existingIds = new Set(currentList.map((m) => m.id));
        const newMsgs = mapped.filter((m) => !existingIds.has(m.id));
        return {
          ...prev,
          [conversationId]: [...newMsgs, ...currentList],
        };
      });
      setHasMoreByConversation((prev) => ({
        ...prev,
        [conversationId]: msgs.length >= 8,
      }));

      if (container) {
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight;
        });
      }
    } catch (err) {
      console.error('Failed to load older inbox messages', err);
    } finally {
      setLoadingMoreByConversation((prev) => ({ ...prev, [conversationId]: false }));
    }
  };

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 5) {
      loadOlderChatMessages();
    }
  };

  useEffect(() => {
    const conversationId = activeConversation?.id;
    if (!conversationId) return;
    const currentMsgs = messagesByConversation[conversationId] ?? [];
    if (currentMsgs.length === 0) return;
    const lastMsg = currentMsgs[currentMsgs.length - 1];
    const container = chatScrollRef.current;
    if (!container) return;

    const previousLastId = lastMessageIdRef.current[conversationId];
    if (previousLastId === undefined || previousLastId !== lastMsg.id) {
      container.scrollTop = container.scrollHeight;
    }
    lastMessageIdRef.current[conversationId] = lastMsg.id;
  }, [activeConversation?.id, messagesByConversation]);

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
          isPinned: newMsg.isPinned,
          senderId: newMsg.senderId,
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

    // If direct conversation, send via API
    if (activeConversation?.conversationId && token) {
      setSending(true);
      try {
        const newMsg = await sendDirectMessage(token, activeConversation.conversationId, text);
        const chatMsg: ChatMessage = {
          id: newMsg.messageId,
          author: 'Bạn',
          text: newMsg.content ?? '',
          time: formatMessageTime(newMsg.sentAt),
          mine: true,
          read: true,
          avatarUrl: newMsg.senderAvatarUrl,
          mediaUrl: newMsg.mediaUrl,
          isPinned: newMsg.isPinned,
          senderId: newMsg.senderId,
        };
        setMessagesByConversation((prev) => ({
          ...prev,
          [activeConversation.id]: [...(prev[activeConversation.id] ?? []), chatMsg],
        }));
        setDraftMessage('');
      } catch (err) {
        console.error('Failed to send direct message', err);
      } finally {
        setSending(false);
      }
      return;
    }

    // Static conversations, local-only send
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

  const handleDeleteChatMessage = async (messageId: number) => {
    if (!token || !activeConversation?.groupId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
    try {
      await deleteGroupMessage(token, activeConversation.groupId, messageId);
      const msgs = await getGroupMessages(token, activeConversation.groupId);
      const chatMessages: ChatMessage[] = msgs.map((m) => ({
        id: m.messageId,
        author: m.isMine ? 'Bạn' : m.senderName,
        text: m.content ?? '',
        time: formatMessageTime(m.sentAt),
        mine: m.isMine,
        read: true,
        avatarUrl: m.senderAvatarUrl,
        mediaUrl: m.mediaUrl,
        isPinned: m.isPinned,
        senderId: m.senderId,
      }));
      setMessagesByConversation((prev) => ({
        ...prev,
        [activeConversation.id]: chatMessages,
      }));
    } catch (err: any) {
      notify(err.message || 'Không thể xóa tin nhắn.', 'error');
    }
  };

  const handleTogglePinChatMessage = async (messageId: number, currentPin: boolean) => {
    if (!token || !activeConversation?.groupId) return;
    try {
      await pinGroupMessage(token, activeConversation.groupId, messageId, !currentPin);
      
      const [msgs, pinned] = await Promise.all([
        getGroupMessages(token, activeConversation.groupId, undefined, 8),
        getPinnedGroupMessages(token, activeConversation.groupId).catch(() => []),
      ]);

      const chatMessages: ChatMessage[] = msgs.map((m) => ({
        id: m.messageId,
        author: m.isMine ? 'Bạn' : m.senderName,
        text: m.content ?? '',
        time: formatMessageTime(m.sentAt),
        mine: m.isMine,
        read: true,
        avatarUrl: m.senderAvatarUrl,
        mediaUrl: m.mediaUrl,
        isPinned: m.isPinned,
        senderId: m.senderId,
      }));

      const mappedPinned: ChatMessage[] = pinned.map((m) => ({
        id: m.messageId,
        author: m.isMine ? 'Bạn' : m.senderName,
        text: m.content ?? '',
        time: formatMessageTime(m.sentAt),
        mine: m.isMine,
        read: true,
        avatarUrl: m.senderAvatarUrl,
        mediaUrl: m.mediaUrl,
        isPinned: m.isPinned,
        senderId: m.senderId,
      }));

      setMessagesByConversation((prev) => ({
        ...prev,
        [activeConversation.id]: chatMessages,
      }));

      setPinnedMessagesByConversation((prev) => ({
        ...prev,
        [activeConversation.id]: mappedPinned,
      }));
    } catch (err: any) {
      notify(err.message || 'Không thể thay đổi trạng thái ghim tin nhắn.', 'error');
    }
  };

  const handleModifyChatMessage = async (messageId: number, text: string) => {
    if (!token || !activeConversation?.groupId) return;
    try {
      await deleteGroupMessage(token, activeConversation.groupId, messageId);
      setDraftMessage(text);
      const msgs = await getGroupMessages(token, activeConversation.groupId);
      const chatMessages: ChatMessage[] = msgs.map((m) => ({
        id: m.messageId,
        author: m.isMine ? 'Bạn' : m.senderName,
        text: m.content ?? '',
        time: formatMessageTime(m.sentAt),
        mine: m.isMine,
        read: true,
        avatarUrl: m.senderAvatarUrl,
        mediaUrl: m.mediaUrl,
        isPinned: m.isPinned,
        senderId: m.senderId,
      }));
      setMessagesByConversation((prev) => ({
        ...prev,
        [activeConversation.id]: chatMessages,
      }));
    } catch (err: any) {
      notify(err.message || 'Không thể chỉnh sửa tin nhắn.', 'error');
    }
  };

  return (
    <div className="min-h-dvh bg-[#f9f9ff] pt-[72px] text-on-surface">
      <div className="flex min-h-[calc(100dvh-72px)] flex-col overflow-hidden border-t border-outline-variant bg-[#f9f9ff] lg:h-[calc(100dvh-72px)] lg:flex-row">
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
                  <button
                    aria-label="Thông tin hội thoại"
                    className={`rounded-lg p-2 transition-colors ${
                      showSettings ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low hover:text-primary'
                    }`}
                    onClick={() => setShowSettings(!showSettings)}
                    type="button"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                  <button aria-label="Tùy chọn" className="rounded-lg p-2 transition-colors hover:bg-surface-container-low hover:text-primary" type="button">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </header>

              {activeConversation.groupId && pinnedMessages.length > 0 && (
                <div className="bg-[#f0f3ff] border-b border-outline-variant px-5 py-3 flex flex-col gap-2 shrink-0">
                  <div className="flex items-center gap-2 text-[12px] font-bold text-primary">
                    <Pin className="h-3.5 w-3.5 fill-current" />
                    <span>TIN NHẮN ĐÃ GHIM ({pinnedMessages.length})</span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                    {pinnedMessages.map((msg) => (
                      <div className="flex items-center justify-between gap-3 text-[13px] bg-white p-2 rounded border border-outline-variant shadow-sm" key={msg.id}>
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-on-surface mr-1">{msg.author}:</span>
                          <span className="text-on-surface-variant">{msg.text}</span>
                        </div>
                        {isManager && (
                          <button
                            className="text-[11px] font-bold text-[#ba1a1a] hover:underline"
                            onClick={() => handleTogglePinChatMessage(msg.id, msg.isPinned || false)}
                            type="button"
                          >
                            Bỏ ghim
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-4 md:p-6"
                ref={chatScrollRef}
                onScroll={handleChatScroll}
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
                            <div className="relative flex items-center gap-1.5 group">
                              <div
                                className={`rounded-2xl px-4 py-3 text-[14px] leading-6 shadow-sm ${
                                  message.mine
                                    ? 'rounded-tr-sm bg-primary text-white'
                                    : 'rounded-tl-sm border border-outline-variant bg-white text-on-surface'
                                }`}
                              >
                                {message.isPinned && (
                                  <div className="mb-1 flex items-center gap-1 text-[11px] font-bold text-primary-container bg-primary/20 px-1.5 py-0.5 rounded w-fit">
                                    <Pin className="h-3 w-3 fill-current" />
                                    <span>Đã ghim</span>
                                  </div>
                                )}
                                {message.text}
                                {message.mediaUrl && (
                                  <img
                                    alt="Media"
                                    className="mt-2 max-h-56 max-w-[240px] rounded-lg border border-outline-variant object-cover"
                                    src={message.mediaUrl}
                                  />
                                )}
                              </div>

                              {activeConversation.groupId && (message.mine || isManager) && (
                                <div className="relative flex items-center justify-center shrink-0">
                                  <button
                                    aria-label="Tùy chọn tin nhắn"
                                    className="h-10 w-10 flex items-center justify-center text-on-surface-variant hover:text-primary rounded-full hover:bg-surface-container-low transition-colors"
                                    onClick={() => setActiveMenuMessageId(activeMenuMessageId === message.id ? null : message.id)}
                                    type="button"
                                  >
                                    <MoreVertical className="h-5 w-5" />
                                  </button>

                                  {activeMenuMessageId === message.id && (
                                    <div className="absolute right-0 top-11 z-50 w-44 rounded-xl border border-outline-variant bg-white p-1.5 shadow-lg text-left">
                                      {message.mine && (
                                        <button
                                          className="w-full flex items-center gap-2 rounded-lg px-3 py-3 text-[14px] font-bold text-on-surface hover:bg-surface-container-low"
                                          onClick={() => {
                                            handleModifyChatMessage(message.id, message.text);
                                            setActiveMenuMessageId(null);
                                          }}
                                          type="button"
                                        >
                                          Sửa tin nhắn
                                        </button>
                                      )}
                                      <button
                                        className="w-full flex items-center gap-2 rounded-lg px-3 py-3 text-[14px] font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/50"
                                        onClick={() => {
                                          handleDeleteChatMessage(message.id);
                                          setActiveMenuMessageId(null);
                                        }}
                                        type="button"
                                      >
                                        Xóa tin nhắn
                                      </button>
                                      {isManager && (
                                        <button
                                          className="w-full flex items-center gap-2 rounded-lg px-3 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                                          onClick={() => {
                                            handleTogglePinChatMessage(message.id, message.isPinned || false);
                                            setActiveMenuMessageId(null);
                                          }}
                                          type="button"
                                        >
                                          {message.isPinned ? 'Bỏ ghim' : 'Ghim tin nhắn'}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
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
                  <input
                    type="file"
                    ref={mediaInputRef}
                    onChange={handleMediaUpload}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    aria-label="Đính kèm tệp"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                    type="button"
                  >
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Gửi hình ảnh"
                    className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary sm:flex disabled:opacity-50"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploadingMedia || (!activeConversation?.groupId && !activeConversation?.conversationId)}
                    type="button"
                  >
                    {uploadingMedia ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <ImageIcon className="h-5 w-5" />
                    )}
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
          {!activeConversation && !clubGroupsLoading && (
            <div className="flex h-full flex-1 flex-col items-center justify-center p-8 text-center text-on-surface-variant">
              <MessageCircle className="h-12 w-12 text-primary" />
              <p className="mt-4 text-[15px] font-bold text-on-surface">Chưa chọn cuộc trò chuyện nào</p>
              <p className="mt-1 text-[13px]">Hãy chọn một câu lạc bộ hoặc một người chơi từ danh sách để bắt đầu.</p>
            </div>
          )}
        </main>

        {showSettings && activeConversation && (
          <aside className="custom-scrollbar flex h-full w-[330px] shrink-0 flex-col border-l border-outline-variant bg-white overflow-y-auto">
            {activeConversation.kind === 'club' && activeGroup ? (
              <>
                <div className="flex items-center justify-between border-b border-outline-variant p-4 shrink-0">
                  <h3 className="text-[16px] font-bold text-on-surface">Thông tin nhóm</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="rounded-full p-1.5 hover:bg-surface-container-low text-on-surface-variant"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="relative h-40 bg-surface-container-low shrink-0">
                  {activeGroup.coverImageUrl ? (
                    <img
                      src={activeGroup.coverImageUrl}
                      alt="Cover"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                      {activeConversation.avatar}
                    </div>
                  )}
                  
                  {isManager && (
                    <label className="absolute bottom-2 right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCoverUpload}
                        disabled={updatingGroup || uploadProgress !== null}
                      />
                    </label>
                  )}

                  {uploadProgress !== null && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 text-white">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="mt-2 text-xs font-semibold">{uploadProgress}%</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4 space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Tên nhóm</label>
                      {isManager ? (
                        <div className="mt-1 flex gap-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 rounded-lg border border-outline-variant px-3 py-1.5 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none"
                          />
                          {editName !== activeGroup.groupName && (
                            <button
                              onClick={() => handleUpdateGroup({ groupName: editName })}
                              disabled={updatingGroup}
                              className="rounded-lg bg-primary p-2 text-white hover:bg-primary/95 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-[14px] font-semibold text-on-surface">{activeGroup.groupName}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">Mô tả</label>
                      {isManager ? (
                        <div className="mt-1 space-y-2">
                          <textarea
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            rows={3}
                            className="w-full rounded-lg border border-outline-variant px-3 py-1.5 text-[14px] focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                            placeholder="Thêm mô tả về nhóm..."
                          />
                          {editDesc !== (activeGroup.description || '') && (
                            <div className="flex justify-end">
                              <button
                                onClick={() => handleUpdateGroup({ description: editDesc })}
                                disabled={updatingGroup}
                                className="rounded-lg bg-primary px-3 py-1 text-[12px] font-bold text-white hover:bg-primary/95 transition-colors"
                              >
                                Lưu mô tả
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-1 text-[13px] text-on-surface-variant leading-relaxed">
                          {activeGroup.description || 'Không có mô tả.'}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">Chế độ nhóm</label>
                      {isManager ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateGroup({ groupType: 'Public' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg border text-[13px] font-medium transition-colors ${
                              activeGroup.groupType === 'Public'
                                ? 'bg-primary-container text-on-primary-container border-primary'
                                : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'
                            }`}
                          >
                            <Globe className="h-4 w-4" />
                            Công khai
                          </button>
                          <button
                            onClick={() => handleUpdateGroup({ groupType: 'Private' })}
                            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-lg border text-[13px] font-medium transition-colors ${
                              activeGroup.groupType === 'Private'
                                ? 'bg-primary-container text-on-primary-container border-primary'
                                : 'border-outline-variant hover:bg-surface-container-low text-on-surface-variant'
                            }`}
                          >
                            <Lock className="h-4 w-4" />
                            Riêng tư
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1 text-[13px] font-medium text-on-surface">
                          {activeGroup.groupType === 'Public' ? (
                            <>
                              <Globe className="h-4 w-4 text-on-surface-variant" />
                              <span>Công khai</span>
                            </>
                          ) : (
                            <>
                              <Lock className="h-4 w-4 text-on-surface-variant" />
                              <span>Riêng tư</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Quick Rules */}
                  <div className="border-t border-outline-variant pt-4">
                    <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                      Quy định nhanh
                    </label>
                    {isManager ? (
                      <div className="space-y-2">
                        <textarea
                          value={editRules}
                          onChange={(e) => setEditRules(e.target.value)}
                          rows={4}
                          className="w-full rounded-lg border border-outline-variant px-3 py-1.5 text-[13px] focus:border-primary focus:ring-1 focus:ring-primary outline-none resize-none"
                          placeholder="Nhập quy định của câu lạc bộ..."
                        />
                        {editRules !== (activeGroup.rules || '') && (
                          <div className="flex justify-end">
                            <button
                              onClick={() => handleUpdateGroup({ rules: editRules })}
                              disabled={updatingGroup}
                              className="rounded-lg bg-primary px-3 py-1 text-[12px] font-bold text-white hover:bg-primary/95 transition-colors disabled:opacity-50"
                            >
                              Lưu quy định
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="mt-1 text-[13px] text-on-surface-variant leading-relaxed whitespace-pre-wrap">
                        {activeGroup.rules || 'Chưa có quy định.'}
                      </p>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="border-t border-outline-variant pt-4">
                    <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
                      Đánh giá câu lạc bộ
                    </label>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[13px] font-bold text-amber-700">
                        <span>★</span>
                        {activeGroup.overallRating > 0 ? activeGroup.overallRating.toFixed(1) : 'Chưa có'}
                      </span>
                      {activeGroup.ratingCount > 0 && (
                        <span className="text-[12px] text-on-surface-variant">{activeGroup.ratingCount} đánh giá từ người chơi</span>
                      )}
                    </div>
                  </div>

                  {/* Intro Images */}
                  <div className="border-t border-outline-variant pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider">
                        Ảnh giới thiệu ({introImages.length})
                      </label>
                      {isManager && (
                        <label className="flex items-center gap-1 cursor-pointer rounded-lg bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors">
                          {uploadingIntro ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <ImageIcon className="h-3.5 w-3.5" />
                          )}
                          Thêm ảnh
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleIntroImageUpload}
                            disabled={uploadingIntro}
                          />
                        </label>
                      )}
                    </div>

                    {introImages.length === 0 ? (
                      <p className="text-[12px] text-on-surface-variant">Chưa có ảnh giới thiệu.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {introImages.map((img) => (
                          <div key={img.groupImageId} className="group relative aspect-video overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
                            <img
                              src={img.imageUrl}
                              alt={img.caption || 'Ảnh giới thiệu'}
                              className="h-full w-full object-cover"
                            />
                            {isManager && (
                              <button
                                onClick={() => handleRemoveIntroImage(img.groupImageId)}
                                className="absolute right-1 top-1 hidden rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-[#ba1a1a] group-hover:flex items-center justify-center"
                                title="Xóa ảnh"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            )}
                            {img.caption && (
                              <p className="absolute bottom-0 left-0 right-0 truncate bg-black/50 px-2 py-0.5 text-[10px] text-white">
                                {img.caption}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Members List */}
                  <div className="border-t border-outline-variant pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-[14px] font-bold text-on-surface flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        <span>Thành viên ({settingsMembers.length})</span>
                      </h4>
                    </div>

                    {membersLoading ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                        {settingsMembers.map((member) => (
                          <div key={member.userId} className="flex items-center justify-between gap-2 text-[13px]">
                            <div className="flex items-center gap-2 min-w-0">
                              {member.profileImageUrl ? (
                                <img
                                  src={member.profileImageUrl}
                                  alt={member.username}
                                  className="h-8 w-8 rounded-full object-cover shrink-0"
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                                  {member.username[0]?.toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-on-surface truncate">{member.username}</p>
                                <p className="text-[10px] text-on-surface-variant">
                                  {member.role === 'Owner'
                                    ? 'Trưởng nhóm'
                                    : member.role === 'Admin'
                                    ? 'Quản trị viên'
                                    : member.role === 'Moderator'
                                    ? 'Kiểm duyệt viên'
                                    : member.status === 'Pending'
                                    ? 'Đang chờ duyệt'
                                    : 'Thành viên'}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-1 shrink-0">
                              {isManager && member.status === 'Pending' && (
                                <>
                                  <button
                                    onClick={() => handleApproveMember(member.userId)}
                                    className="rounded bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-colors"
                                  >
                                    Duyệt
                                  </button>
                                  <button
                                    onClick={() => handleRemoveMember(member.userId)}
                                    className="rounded bg-error-container/10 px-2 py-1 text-[11px] font-bold text-error hover:bg-[#ba1a1a]/10 transition-colors"
                                  >
                                    Từ chối
                                  </button>
                                </>
                              )}
                              {isManager && member.status === 'Accepted' && member.role !== 'Owner' && member.userId !== activeGroup.ownerPlayerId && (
                                <button
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className="rounded p-1 hover:bg-[#ba1a1a]/10 text-on-surface-variant hover:text-[#ba1a1a] transition-colors"
                                  title="Xóa khỏi nhóm"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Danger zone */}
                  {activeGroup.myRole !== 'Owner' && (
                    <div className="border-t border-outline-variant pt-4 pb-2">
                      <button
                        onClick={handleLeaveGroup}
                        className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-[#ba1a1a]/20 hover:bg-[#ba1a1a]/5 text-[#ba1a1a] text-[13px] font-bold transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        Rời nhóm
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="border-b border-outline-variant p-5 shrink-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-[18px] font-bold text-white shrink-0">
                      {activeConversation.avatar}
                    </div>
                    <div>
                      <h2 className="text-[16px] font-bold text-on-surface">{activeConversation.name}</h2>
                      <p className="text-[12px] font-bold text-primary">
                        {kindLabels[activeConversation.kind]} · {getLevelLabel(activeConversation)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="rounded-full p-1.5 hover:bg-surface-container-low text-on-surface-variant lg:hidden"
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
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
        )}
      </div>
    </div>
  );
};
