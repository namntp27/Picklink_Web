import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  Image as ImageIcon,
  Info,
  Loader2,
  Phone,
  PlusCircle,
  Search,
  Send,
  Smile,
  Users,
  Video,
  X,
  Camera,
  Check,
  Trash2,
  LogOut,
  Globe,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  getGroups,
  getGroupMessages,
  getGroupMembers,
  sendGroupMessage,
  updateGroup,
  approveMember,
  removeMember,
  leaveGroup,
  addGroupImage,
  removeGroupImage,
  type CommunityGroup,
  type CommunityMessage,
  type CommunityMember,
  type GroupImage,
} from '../../api/community';
import { uploadToCloudinary } from '../../api/cloudinary';

// ─── Helpers ────────────────────────────────────────────────────────────────

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

const getGroupInitial = (name: string) => {
  const words = name.trim().split(/\s+/);
  return words[0]?.[0]?.toUpperCase() ?? '?';
};

// ─── Component ──────────────────────────────────────────────────────────────

export const ClubsChat = () => {
  const navigate = useNavigate();
  const { token } = useAuth();

  // Groups state
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [groupsError, setGroupsError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Selected group state
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [memberCount, setMemberCount] = useState<number>(0);
  const [onlineText, setOnlineText] = useState<string>('');

  // Messages state
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // Composer state
  const [draftMessage, setDraftMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  // Settings Panel state
  const [showSettings, setShowSettings] = useState(false);
  const [settingsMembers, setSettingsMembers] = useState<CommunityMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form states for editing
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editRating, setEditRating] = useState('');
  const [introImages, setIntroImages] = useState<GroupImage[]>([]);
  const [uploadingIntro, setUploadingIntro] = useState(false);

  const selectedGroup = groups.find((g) => g.groupId === selectedGroupId) ?? null;
  const isManager = !!(selectedGroup && ['Owner', 'Admin', 'Moderator'].includes(selectedGroup.myRole || ''));

  // ─── Load groups ────────────────────────────────────────────────────────

  const loadGroups = useCallback(
    async (query?: string) => {
      if (!token) return;
      setGroupsLoading(true);
      setGroupsError(null);
      try {
        const data = await getGroups(token, query);
        // Only show groups the user has joined (Accepted status) or owns
        const myGroups = data.filter(
          (g) => g.myStatus === 'Accepted' || g.myRole === 'Owner',
        );
        setGroups(myGroups);
        if (myGroups.length > 0 && selectedGroupId === null) {
          setSelectedGroupId(myGroups[0].groupId);
        }
      } catch (err: any) {
        setGroupsError(err?.message ?? 'Không thể tải danh sách nhóm.');
      } finally {
        setGroupsLoading(false);
      }
    },
    [token, selectedGroupId],
  );

  useEffect(() => {
    loadGroups();
  }, [token]);

  // ─── Debounced search ───────────────────────────────────────────────────

  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      loadGroups(searchQuery || undefined);
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // ─── Load messages when group changes ───────────────────────────────────

  useEffect(() => {
    if (!token || selectedGroupId === null) return;
    let cancelled = false;

    const load = async () => {
      setMessagesLoading(true);
      setMessagesError(null);
      try {
        const [msgs, members] = await Promise.all([
          getGroupMessages(token, selectedGroupId),
          getGroupMembers(token, selectedGroupId).catch(() => []),
        ]);
        if (cancelled) return;
        setMessages(msgs);
        const acceptedMembers = members.filter((m) => m.status === 'Accepted');
        setMemberCount(acceptedMembers.length);
        setOnlineText(`${Math.max(1, Math.floor(acceptedMembers.length * 0.03))} đang trực tuyến`);
      } catch (err: any) {
        if (!cancelled) setMessagesError(err?.message ?? 'Không thể tải tin nhắn.');
      } finally {
        if (!cancelled) setMessagesLoading(false);
      }
    };

    load();
    // Poll every 8s for new messages
    const interval = setInterval(async () => {
      try {
        const msgs = await getGroupMessages(token, selectedGroupId);
        if (!cancelled) setMessages(msgs);
      } catch {
        // silent fail on poll
      }
    }, 8000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, selectedGroupId]);

  // ─── Settings Panel / Cloudinary functions ──────────────────────────────

  const loadSettingsMembers = useCallback(async () => {
    if (!token || selectedGroupId === null) return;
    setMembersLoading(true);
    try {
      const data = await getGroupMembers(token, selectedGroupId);
      setSettingsMembers(data);
    } catch (err) {
      console.error('Failed to load group members', err);
    } finally {
      setMembersLoading(false);
    }
  }, [token, selectedGroupId]);

  useEffect(() => {
    if (showSettings && selectedGroupId !== null) {
      loadSettingsMembers();
    }
  }, [showSettings, selectedGroupId, loadSettingsMembers]);

  useEffect(() => {
    if (selectedGroup) {
      setEditName(selectedGroup.groupName);
      setEditDesc(selectedGroup.description || '');
      setEditRules(selectedGroup.rules || '');
      setEditRating(selectedGroup.overallRating > 0 ? String(selectedGroup.overallRating) : '');
      setIntroImages(selectedGroup.images ?? []);
    }
  }, [selectedGroupId, selectedGroup]);

  const handleUpdateGroup = async (fields: {
    groupName?: string;
    description?: string;
    groupType?: string;
    coverImageUrl?: string;
    rules?: string;
    overallRating?: number;
    ratingCount?: number;
  }) => {
    if (!token || selectedGroupId === null || updatingGroup || !selectedGroup) return;
    setUpdatingGroup(true);

    const mergedFields = {
      groupName: fields.groupName !== undefined ? fields.groupName : selectedGroup.groupName,
      description: fields.description !== undefined ? fields.description : (selectedGroup.description || ''),
      groupType: fields.groupType !== undefined ? fields.groupType : selectedGroup.groupType,
      coverImageUrl: fields.coverImageUrl !== undefined ? fields.coverImageUrl : (selectedGroup.coverImageUrl || ''),
      rules: fields.rules !== undefined ? fields.rules : (selectedGroup.rules || ''),
      overallRating: fields.overallRating !== undefined ? fields.overallRating : selectedGroup.overallRating,
      ratingCount: fields.ratingCount !== undefined ? fields.ratingCount : selectedGroup.ratingCount,
    };

    try {
      const updated = await updateGroup(token, selectedGroupId, mergedFields);
      setGroups((prev) =>
        prev.map((g) => (g.groupId === selectedGroupId ? { ...g, ...updated } : g))
      );
      if (fields.rules !== undefined) setEditRules(updated.rules || '');
    } catch (err: any) {
      alert(err.message || 'Không thể cập nhật thông tin nhóm.');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || selectedGroupId === null) return;

    try {
      setUploadProgress(0);
      const { url } = await uploadToCloudinary(token, file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadProgress(null);
      await handleUpdateGroup({ coverImageUrl: url });
    } catch (err: any) {
      setUploadProgress(null);
      alert(err.message || 'Không thể tải ảnh lên.');
    }
  };

  const handleIntroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || selectedGroupId === null || uploadingIntro) return;
    setUploadingIntro(true);
    try {
      const { url } = await uploadToCloudinary(token, file, () => {});
      const newImg = await addGroupImage(token, selectedGroupId, url);
      setIntroImages((prev) => [...prev, newImg]);
      setGroups((prev) =>
        prev.map((g) =>
          g.groupId === selectedGroupId
            ? { ...g, images: [...(g.images ?? []), newImg] }
            : g
        )
      );
    } catch (err: any) {
      alert(err.message || 'Không thể tải ảnh lên.');
    } finally {
      setUploadingIntro(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleRemoveIntroImage = async (imageId: number) => {
    if (!token || selectedGroupId === null) return;
    if (!confirm('Xóa ảnh giới thiệu này?')) return;
    try {
      await removeGroupImage(token, selectedGroupId, imageId);
      setIntroImages((prev) => prev.filter((img) => img.groupImageId !== imageId));
      setGroups((prev) =>
        prev.map((g) =>
          g.groupId === selectedGroupId
            ? { ...g, images: (g.images ?? []).filter((img) => img.groupImageId !== imageId) }
            : g
        )
      );
    } catch (err: any) {
      alert(err.message || 'Không thể xóa ảnh.');
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || selectedGroupId === null || uploadingMedia) return;

    setUploadingMedia(true);
    try {
      const { url } = await uploadToCloudinary(token, file);
      const newMsg = await sendGroupMessage(token, selectedGroupId, {
        mediaUrl: url,
        content: `Đã gửi một ${file.type.startsWith('video/') ? 'video' : 'hình ảnh'}`
      });
      setMessages((prev) => [...prev, newMsg]);
    } catch (err: any) {
      alert(err.message || 'Không thể tải lên tệp tin.');
    } finally {
      setUploadingMedia(false);
      if (mediaInputRef.current) mediaInputRef.current.value = '';
    }
  };

  const handleApproveMember = async (memberUserId: number) => {
    if (!token || selectedGroupId === null) return;
    try {
      await approveMember(token, selectedGroupId, memberUserId);
      loadSettingsMembers();
      setMemberCount((prev) => prev + 1);
    } catch (err: any) {
      alert(err.message || 'Không thể phê duyệt thành viên.');
    }
  };

  const handleRemoveMember = async (memberUserId: number) => {
    if (!token || selectedGroupId === null) return;
    if (!confirm('Bạn có chắc chắn muốn xóa thành viên này khỏi nhóm?')) return;
    try {
      await removeMember(token, selectedGroupId, memberUserId);
      loadSettingsMembers();
      setMemberCount((prev) => Math.max(0, prev - 1));
    } catch (err: any) {
      alert(err.message || 'Không thể xóa thành viên.');
    }
  };

  const handleLeaveGroup = async () => {
    if (!token || selectedGroupId === null) return;
    if (!confirm('Bạn có chắc chắn muốn rời nhóm này?')) return;
    try {
      await leaveGroup(token, selectedGroupId);
      setShowSettings(false);
      setSelectedGroupId(null);
      loadGroups();
    } catch (err: any) {
      alert(err.message || 'Không thể rời nhóm.');
    }
  };

  // ─── Auto-scroll to bottom ──────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ─── Send message ──────────────────────────────────────────────────────

  const handleSend = async () => {
    const text = draftMessage.trim();
    if (!text || !token || selectedGroupId === null || sending) return;

    setSending(true);
    try {
      const newMsg = await sendGroupMessage(token, selectedGroupId, { content: text });
      setMessages((prev) => [...prev, newMsg]);
      setDraftMessage('');
    } catch {
      // Could show a toast here, but for now silent
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-[#f9f9ff] pt-[72px] font-body-md text-on-surface">
      <div className="flex h-[calc(100vh-72px)] min-h-[640px] flex-col overflow-hidden border-t border-outline-variant bg-[#f9f9ff] md:flex-row">
        {/* ── Sidebar ─────────────────────────────────────────────────── */}
        <aside className="flex h-[290px] w-full shrink-0 flex-col border-b border-outline-variant bg-white md:h-full md:w-80 md:border-b-0 md:border-r">
          <div className="border-b border-outline-variant p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[18px] font-bold text-on-surface">Cộng đồng</h2>
              <button
                className="rounded-full border border-outline-variant px-3 py-1 text-[12px] font-bold text-primary transition-colors hover:bg-surface-container-low"
                onClick={() => navigate('/clubs/create')}
                type="button"
              >
                Tạo câu lạc bộ
              </button>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2 pl-9 pr-4 text-[14px] outline-none placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nhóm..."
                type="text"
                value={searchQuery}
              />
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
            {groupsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : groupsError ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <AlertCircle className="h-6 w-6 text-[#ba1a1a]" />
                <p className="mt-2 text-[13px] text-[#ba1a1a]">{groupsError}</p>
                <button
                  className="mt-3 text-[13px] font-bold text-primary hover:underline"
                  onClick={() => loadGroups()}
                  type="button"
                >
                  Thử lại
                </button>
              </div>
            ) : groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <Users className="h-8 w-8 text-on-surface-variant" />
                <p className="mt-3 text-[14px] font-bold text-on-surface">Chưa tham gia nhóm nào</p>
                <p className="mt-1 text-[13px] text-on-surface-variant">
                  Tham gia một câu lạc bộ để bắt đầu trò chuyện.
                </p>
              </div>
            ) : (
              groups.map((group) => {
                const isSelected = group.groupId === selectedGroupId;
                return (
                  <button
                    className={`flex w-full items-center rounded-lg p-3 text-left transition-colors ${
                      isSelected
                        ? 'bg-primary-container text-on-primary-container shadow-sm'
                        : 'text-on-surface hover:bg-[#eef3ff]'
                    }`}
                    key={group.groupId}
                    onClick={() => setSelectedGroupId(group.groupId)}
                    type="button"
                  >
                    {group.coverImageUrl ? (
                      <img
                        alt={group.groupName}
                        className="mr-3 h-12 w-12 rounded-full object-cover shadow-sm"
                        src={group.coverImageUrl}
                      />
                    ) : (
                      <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#d6e0f3] text-[18px] font-bold text-[#3d4756] shadow-sm">
                        {getGroupInitial(group.groupName)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`truncate text-[14px] ${isSelected ? 'font-bold' : 'font-semibold'}`}
                      >
                        {group.groupName}
                      </h3>
                      <p
                        className={`truncate text-[12px] ${
                          isSelected ? 'text-on-primary-container/80' : 'text-on-surface-variant'
                        }`}
                      >
                        {group.memberCount} thành viên · {group.messageCount} tin nhắn
                      </p>
                    </div>
                    <div className="ml-2 flex h-11 flex-col items-end justify-between">
                      <span
                        className={`text-[11px] font-medium ${
                          isSelected ? 'text-on-primary-container/70' : 'text-on-surface-variant'
                        }`}
                      >
                        {formatMessageTime(group.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* ── Main Chat ───────────────────────────────────────────────── */}
        <main className="flex min-h-0 flex-1 flex-col bg-[#f9f9ff]">
          {selectedGroup ? (
            <>
              {/* Header */}
              <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-white px-4 shadow-sm md:px-6">
                <div className="flex min-w-0 items-center">
                  {selectedGroup.coverImageUrl ? (
                    <img
                      alt={selectedGroup.groupName}
                      className="mr-3 h-10 w-10 rounded-full object-cover"
                      src={selectedGroup.coverImageUrl}
                    />
                  ) : (
                    <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#d6e0f3] text-[16px] font-bold text-[#3d4756]">
                      {getGroupInitial(selectedGroup.groupName)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-[16px] font-bold text-on-surface">
                      {selectedGroup.groupName}
                    </h2>
                    <p className="truncate text-[12px] font-medium text-on-surface-variant">
                      {memberCount > 0
                        ? `${memberCount.toLocaleString('vi-VN')} thành viên · ${onlineText}`
                        : `${selectedGroup.memberCount} thành viên`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-on-surface-variant">
                  <button
                    aria-label="Gọi thoại"
                    className="rounded-full p-2 transition-colors hover:bg-surface-container-low"
                    type="button"
                  >
                    <Phone className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Gọi video"
                    className="rounded-full p-2 transition-colors hover:bg-surface-container-low"
                    type="button"
                  >
                    <Video className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Thông tin nhóm"
                    className={`rounded-full p-2 transition-colors ${
                      showSettings
                        ? 'bg-primary/10 text-primary'
                        : 'hover:bg-surface-container-low'
                    }`}
                    onClick={() => setShowSettings(!showSettings)}
                    type="button"
                  >
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </header>

              {/* Messages area */}
              <div
                className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-4 md:p-6"
                style={{
                  backgroundImage: 'radial-gradient(#dce2f3 1px, transparent 1px)',
                  backgroundSize: '18px 18px',
                }}
              >
                {messagesLoading && messages.length === 0 ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : messagesError ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <AlertCircle className="h-8 w-8 text-[#ba1a1a]" />
                    <p className="mt-3 text-[14px] text-[#ba1a1a]">{messagesError}</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Send className="h-8 w-8 text-on-surface-variant" />
                    <p className="mt-3 text-[14px] font-bold text-on-surface">Chưa có tin nhắn nào</p>
                    <p className="mt-1 text-[13px] text-on-surface-variant">
                      Hãy gửi tin nhắn đầu tiên cho nhóm!
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center">
                      <span className="rounded-full bg-[#e2e8f8] px-3 py-1 text-[11px] font-bold text-on-surface-variant">
                        Hôm nay
                      </span>
                    </div>

                    {messages.map((message) => (
                      <div
                        className={`flex max-w-3xl items-start ${message.isMine ? 'ml-auto justify-end' : ''}`}
                        key={message.messageId}
                      >
                        {!message.isMine && (
                          message.senderAvatarUrl ? (
                            <img
                              alt={message.senderName}
                              className="mr-3 mt-1 h-8 w-8 rounded-full object-cover"
                              src={message.senderAvatarUrl}
                            />
                          ) : (
                            <div className="mr-3 mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">
                              {message.senderName[0]?.toUpperCase() ?? '?'}
                            </div>
                          )
                        )}
                        <div className={`flex flex-col ${message.isMine ? 'items-end' : ''}`}>
                          <div className="mb-1 flex items-baseline gap-2">
                            {message.isMine && (
                              <span className="text-[11px] text-on-surface-variant">
                                {formatMessageTime(message.sentAt)}
                              </span>
                            )}
                            <span className="text-[13px] font-bold text-on-surface">
                              {message.isMine ? 'Bạn' : message.senderName}
                            </span>
                            {!message.isMine && (
                              <span className="text-[11px] text-on-surface-variant">
                                {formatMessageTime(message.sentAt)}
                              </span>
                            )}
                          </div>
                          <div
                            className={`space-y-2 rounded-2xl p-3 text-[14px] leading-5 shadow-sm ${
                              message.isMine
                                ? 'rounded-tr-sm bg-primary text-white'
                                : 'rounded-tl-sm border border-outline-variant bg-white text-on-surface'
                            }`}
                          >
                            {message.content && <p>{message.content}</p>}
                            {message.mediaUrl && (
                              <img
                                alt="Media"
                                className="max-h-56 w-full max-w-[240px] rounded-lg border border-outline-variant object-cover"
                                src={message.mediaUrl}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Composer */}
              <div className="shrink-0 border-t border-outline-variant bg-white p-3 md:p-4">
                <div className="mx-auto flex max-w-4xl items-end gap-2">
                  <input
                    type="file"
                    ref={mediaInputRef}
                    onChange={handleMediaUpload}
                    accept="image/*,video/*"
                    className="hidden"
                  />
                  <button
                    aria-label="Thêm nội dung"
                    className="shrink-0 rounded-full p-3 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                    type="button"
                  >
                    <PlusCircle className="h-5 w-5" />
                  </button>
                  <button
                    aria-label="Gửi hình ảnh"
                    className="shrink-0 rounded-full p-3 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary disabled:opacity-50"
                    onClick={() => mediaInputRef.current?.click()}
                    disabled={uploadingMedia}
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
                      className="max-h-32 min-h-12 w-full resize-none bg-transparent px-4 py-3 pr-10 text-[14px] outline-none"
                      onChange={(e) => setDraftMessage(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nhập tin nhắn..."
                      rows={1}
                      value={draftMessage}
                    />
                    <button
                      aria-label="Biểu cảm"
                      className="absolute bottom-2 right-2 rounded-full p-1 text-on-surface-variant transition-colors hover:text-primary"
                      type="button"
                    >
                      <Smile className="h-5 w-5" />
                    </button>
                  </div>
                  <button
                    aria-label="Gửi tin nhắn"
                    className="shrink-0 rounded-xl bg-primary p-3 text-white shadow-sm transition-transform hover:bg-primary/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!draftMessage.trim() || sending}
                    onClick={handleSend}
                    type="button"
                  >
                    {sending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" fill="currentColor" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <Users className="h-12 w-12 text-on-surface-variant" />
              <p className="mt-4 text-[18px] font-bold text-on-surface">Chọn một nhóm để trò chuyện</p>
              <p className="mt-2 text-[14px] text-on-surface-variant">
                Chọn một nhóm từ danh sách bên trái hoặc tạo câu lạc bộ mới.
              </p>
            </div>
          )}
        </main>

        {showSettings && selectedGroup && (
          <aside className="custom-scrollbar flex h-[50vh] md:h-full w-full flex-col border-t border-outline-variant bg-white md:w-80 md:border-t-0 md:border-l shrink-0 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-outline-variant p-4">
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
              {selectedGroup.coverImageUrl ? (
                <img
                  src={selectedGroup.coverImageUrl}
                  alt="Cover"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10 text-primary font-bold text-2xl">
                  {getGroupInitial(selectedGroup.groupName)}
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
                      {editName !== selectedGroup.groupName && (
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
                    <p className="mt-1 text-[14px] font-semibold text-on-surface">{selectedGroup.groupName}</p>
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
                      {editDesc !== (selectedGroup.description || '') && (
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
                      {selectedGroup.description || 'Không có mô tả.'}
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
                          selectedGroup.groupType === 'Public'
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
                          selectedGroup.groupType === 'Private'
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
                      {selectedGroup.groupType === 'Public' ? (
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
                    {editRules !== (selectedGroup.rules || '') && (
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
                    {selectedGroup.rules || 'Chưa có quy định.'}
                  </p>
                )}
              </div>

              {/* Rating */}
              <div className="border-t border-outline-variant pt-4">
                <label className="text-[12px] font-bold text-on-surface-variant uppercase tracking-wider block mb-2">
                  Đánh giá
                </label>
                {isManager ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 flex-1">
                      <span className="text-amber-500 text-[16px]">★</span>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={editRating}
                        onChange={(e) => setEditRating(e.target.value)}
                        className="w-16 bg-transparent text-[14px] font-bold outline-none text-on-surface"
                        placeholder="0.0"
                      />
                      <span className="text-[12px] text-on-surface-variant">/5</span>
                    </div>
                    {editRating !== (selectedGroup.overallRating > 0 ? String(selectedGroup.overallRating) : '') && (
                      <button
                        onClick={() => {
                          const val = parseFloat(editRating);
                          if (!isNaN(val)) handleUpdateGroup({ overallRating: val });
                        }}
                        disabled={updatingGroup}
                        className="rounded-lg bg-primary p-2 text-white hover:bg-primary/95 transition-colors disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[13px] font-bold text-amber-700">
                      <span>★</span>
                      {selectedGroup.overallRating > 0 ? selectedGroup.overallRating.toFixed(1) : '—'}
                    </span>
                    {selectedGroup.ratingCount > 0 && (
                      <span className="text-[12px] text-on-surface-variant">{selectedGroup.ratingCount} đánh giá</span>
                    )}
                  </div>
                )}
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
                          {isManager && member.status === 'Accepted' && member.role !== 'Owner' && member.userId !== selectedGroup.ownerPlayerId && (
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
              {selectedGroup.myRole !== 'Owner' && (
                <div className="border-t border-outline-variant pt-4">
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
          </aside>
        )}
      </div>
    </div>
  );
};
