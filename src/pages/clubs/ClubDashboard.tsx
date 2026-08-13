import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../../components/ui/ToastRegion';
import { Link, useParams, useOutletContext } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Crown,
  Edit3,
  Eye,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  Pin,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserCheck,
  UserCog,
  UserPlus,
  Users,
  XCircle,
  Loader2,
  Camera,
  Globe,
  Lock,
  MapPin,
  Image as ImageIcon,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { useVisiblePolling } from '../../hooks/useVisiblePolling';
import './club-pages.css';
import {
  getGroup,
  getGroupMembers,
  getGroupMessages,
  sendGroupMessage,
  approveMember,
  removeMember,
  getPinnedGroupMessages,
  declineMember,
  banMember,
  unbanMember,
  changeMemberRole,
  getGroupPosts,
  approveGroupPost,
  deletePost as deletePostApi,
  deleteGroupMessage,
  pinGroupMessage,
  updateGroup,
  addGroupImage,
  removeGroupImage,
  type CommunityGroup,
  type CommunityMember,
  type CommunityMessage,
  type CommunityPost,
  type GroupImage,
} from '../../api/community';
import { uploadToCloudinary } from '../../api/cloudinary';

type DashboardTab = 'overview' | 'members' | 'posts' | 'chat' | 'settings';
type MemberRole = 'Chủ nhiệm' | 'Quản trị viên' | 'Kiểm duyệt viên' | 'Thành viên';
type PostStatus = 'Đã đăng' | 'Chờ duyệt' | 'Nháp';

type JoinRequest = {
  id: number;
  name: string;
  avatar: string;
  level: string;
  area: string;
  requestedAt: string;
  note: string;
};

type ClubMember = {
  id: number;
  name: string;
  avatar: string;
  level: string;
  role: MemberRole;
  joinedAt: string;
  status: 'Đang hoạt động' | 'Tạm khóa' | 'Từ chối' | 'Bị cấm';
  permissions: string[];
};



type ClubChatMessage = {
  id: number;
  author: string;
  avatar: string;
  text: string;
  time: string;
  mine?: boolean;
  isPinned: boolean;
  senderId: number;
};


const roleOptions: MemberRole[] = ['Chủ nhiệm', 'Quản trị viên', 'Kiểm duyệt viên', 'Thành viên'];
const roleRank: Record<MemberRole, number> = {
  'Chủ nhiệm': 3,
  'Quản trị viên': 2,
  'Kiểm duyệt viên': 1,
  'Thành viên': 0,
};
const backendRoleRank: Record<string, number> = { Owner: 3, Admin: 2, Moderator: 1, Member: 0 };

const permissionByRole: Record<MemberRole, string[]> = {
  'Chủ nhiệm': ['Toàn quyền', 'Duyệt thành viên', 'Quản lý bài viết', 'Chat CLB'],
  'Quản trị viên': ['Duyệt thành viên', 'Quản lý bài viết', 'Chat CLB'],
  'Kiểm duyệt viên': ['Duyệt thành viên', 'Quản lý bài viết', 'Chat CLB'],
  'Thành viên': ['Chat CLB'],
};

const statusClassNames: Record<PostStatus, string> = {
  'Đã đăng': 'bg-[#eaf7df] text-[#477313]',
  'Chờ duyệt': 'bg-[#fff4d8] text-[#7a5600]',
  Nháp: 'bg-[#edf5e9] text-[#64736a]',
};


const getRoleClassName = (role: MemberRole) => {
  if (role === 'Chủ nhiệm') {
    return 'bg-primary text-white';
  }

  if (role === 'Quản trị viên') {
    return 'bg-primary-container text-on-primary-container';
  }

  if (role === 'Kiểm duyệt viên') {
    return 'bg-[#fff4d8] text-[#7a5600]';
  }

  return 'bg-[#edf5e9] text-[#64736a]';
};

const renderAvatar = (avatar: string, sizeClass = "h-10 w-10") => {
  if (avatar && (avatar.startsWith('http') || avatar.includes('/') || avatar.includes('.'))) {
    return (
      <img
        src={avatar}
        alt=""
        decoding="async"
        loading="lazy"
        className={`${sizeClass} rounded-full object-cover shrink-0`}
      />
    );
  }
  return (
    <div className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-primary text-[13px] font-bold text-white`}>
      {avatar || '?'}
    </div>
  );
};

export const ClubDashboard = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
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

  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [members, setMembers] = useState<ClubMember[]>([]);

  const [actualPosts, setActualPosts] = useState<CommunityPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [postFilter, setPostFilter] = useState<PostStatus | 'Tất cả'>('Tất cả');
  const postLoadMoreRef = useRef<HTMLDivElement | null>(null);

  const posts = useMemo(() => {
    return actualPosts.map((post) => {
      let parsed = { title: '', body: '' };
      try {
        parsed = JSON.parse(post.content || '{}');
      } catch {
        parsed = { title: '', body: post.content || '' };
      }
      return {
        id: post.postId,
        title: parsed.title || 'Bài viết không có tiêu đề',
        author: post.authorName,
        status: (post.visibility === 'Pending' ? 'Chờ duyệt' : 'Đã đăng') as PostStatus,
        createdAt: new Intl.DateTimeFormat('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }).format(new Date(post.createdAt)),
        views: 0,
        comments: post.commentCount,
      };
    });
  }, [actualPosts]);

  const filteredPosts = postFilter === 'Tất cả'
    ? posts
    : posts.filter((post) => post.status === postFilter);

  const [chatMessages, setChatMessages] = useState<ClubChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<ClubChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [hasMoreChat, setHasMoreChat] = useState(true);
  const [loadingMoreChat, setLoadingMoreChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<number | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  const [groupInfo, setGroupInfo] = useState<CommunityGroup | null>(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const groupLoadIdRef = useRef(0);

  const groupId = Number(id);
  const isNumericGroupId = !isNaN(groupId) && groupId > 0;

  const isGroupManager = useMemo(() => {
    return groupInfo?.myRole === 'Owner' || groupInfo?.myRole === 'Admin' || groupInfo?.myRole === 'Moderator';
  }, [groupInfo]);
  const currentManagerRank = backendRoleRank[groupInfo?.myRole || ''] ?? 0;

  const [updatingGroup, setUpdatingGroup] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editRules, setEditRules] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editGroupType, setEditGroupType] = useState('Public');
  const [editRequirePostApproval, setEditRequirePostApproval] = useState(true);
  const [editRequireMemberApproval, setEditRequireMemberApproval] = useState(true);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingIntro, setUploadingIntro] = useState(false);

  // Initialize edit forms when groupInfo is loaded
  useEffect(() => {
    if (groupInfo) {
      setEditName(groupInfo.groupName || '');
      setEditDesc(groupInfo.description || '');
      setEditRules(groupInfo.rules || '');
      setEditLocation(groupInfo.activeLocation || '');
      setEditGroupType(groupInfo.groupType || 'Public');
      setEditRequirePostApproval(groupInfo.requirePostApproval ?? true);
      setEditRequireMemberApproval(groupInfo.requireMemberApproval ?? groupInfo.groupType === 'Private');
    }
  }, [groupInfo]);

  const handleUpdateGroup = async (fields: any) => {
    if (!token || !isNumericGroupId) return;
    setUpdatingGroup(true);
    try {
      const updated = await updateGroup(token, groupId, fields);
      setGroupInfo(updated);
      notify('Đã cập nhật thông tin câu lạc bộ.', 'success');
    } catch (err: any) {
      notify(err.message || 'Không thể cập nhật thông tin câu lạc bộ.', 'error');
    } finally {
      setUpdatingGroup(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !isNumericGroupId) return;
    setUploadingCover(true);
    try {
      const { url } = await uploadToCloudinary(token, file);
      await handleUpdateGroup({ coverImageUrl: url });
    } catch (err: any) {
      notify(err.message || 'Không thể tải ảnh bìa lên.', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleIntroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !isNumericGroupId) return;
    setUploadingIntro(true);
    try {
      const { url } = await uploadToCloudinary(token, file);
      const newImg = await addGroupImage(token, groupId, url);
      setGroupInfo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: [...(prev.images || []), newImg],
        };
      });
    } catch (err: any) {
      notify(err.message || 'Không thể tải ảnh giới thiệu lên.', 'error');
    } finally {
      setUploadingIntro(false);
    }
  };

  const handleRemoveIntroImage = async (imageId: number) => {
    if (!token || !isNumericGroupId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa ảnh giới thiệu này?')) return;
    try {
      await removeGroupImage(token, groupId, imageId);
      setGroupInfo((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          images: (prev.images || []).filter((img) => img.groupImageId !== imageId),
        };
      });
    } catch (err: any) {
      notify(err.message || 'Không thể xóa ảnh giới thiệu.', 'error');
    }
  };

  // Load group details
  const loadGroupInfo = useCallback(async () => {
    const loadId = ++groupLoadIdRef.current;
    setLoadingGroup(true);
    setGroupInfo(null);

    if (!token || !isNumericGroupId) {
      setLoadingGroup(false);
      return;
    }

    try {
      const data = await getGroup(groupId, token);
      if (groupLoadIdRef.current === loadId) setGroupInfo(data);
    } catch (err) {
      if (groupLoadIdRef.current === loadId) {
        setGroupInfo(null);
        console.error('Failed to load group details', err);
      }
    } finally {
      if (groupLoadIdRef.current === loadId) setLoadingGroup(false);
    }
  }, [token, groupId, isNumericGroupId]);

  // Load members from API
  const loadMembers = useCallback(async () => {
    if (!token || !isNumericGroupId) return;
    try {
      const data = await getGroupMembers(token, groupId);
      
      // Map requests (Pending)
      const pending = data
        .filter((m) => m.status === 'Pending')
        .map((m) => ({
          id: m.userId,
          name: m.username,
          avatar: m.profileImageUrl || (m.username[0]?.toUpperCase() ?? '?'),
          level: 'Chưa cập nhật',
          area: 'Chưa cập nhật',
          requestedAt: new Date(m.joinedAt).toLocaleDateString('vi-VN'),
          note: 'Yêu cầu tham gia câu lạc bộ qua hệ thống Picklink.',
        }));
      setRequests(pending);

      // Map all non-pending members (Accepted, Declined, Banned)
      const allMembers = data
        .filter((m) => m.status !== 'Pending')
        .map((m) => {
          let uiRole: MemberRole = 'Thành viên';
          if (m.role === 'Owner') uiRole = 'Chủ nhiệm';
          else if (m.role === 'Admin') uiRole = 'Quản trị viên';
          else if (m.role === 'Moderator') uiRole = 'Kiểm duyệt viên';

          let uiStatus: ClubMember['status'] = 'Đang hoạt động';
          if (m.status === 'Declined') uiStatus = 'Từ chối';
          else if (m.status === 'Banned') uiStatus = 'Bị cấm';

          return {
            id: m.userId,
            name: m.username,
            avatar: m.profileImageUrl || (m.username[0]?.toUpperCase() ?? '?'),
            level: 'Chưa cập nhật',
            role: uiRole,
            joinedAt: new Date(m.joinedAt).toLocaleDateString('vi-VN'),
            status: uiStatus,
            permissions: permissionByRole[uiRole] || permissionByRole['Thành viên'],
          };
        });
      setMembers(allMembers);
    } catch (err) {
      console.error('Failed to load members', err);
    }
  }, [token, groupId, isNumericGroupId]);

  // Load chat messages from API
  const loadChatMessages = useCallback(async (isPoll = false) => {
    if (!token || !isNumericGroupId) return;
    try {
      const data = await getGroupMessages(token, groupId, undefined, 8);
      const mapped = data.map((m) => ({
        id: m.messageId,
        author: m.isMine ? 'Bạn' : m.senderName,
        avatar: m.senderAvatarUrl || (m.senderName[0]?.toUpperCase() ?? '?'),
        text: m.content || (m.mediaUrl ? 'Đã gửi một tệp đính kèm.' : ''),
        time: new Date(m.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        mine: m.isMine,
        isPinned: m.isPinned,
        senderId: m.senderId,
      }));
      if (isPoll) {
        setChatMessages((prev) => {
          const existingIds = new Set(prev.map(m => m.id));
          const newMsgs = mapped.filter(m => !existingIds.has(m.id));
          if (newMsgs.length === 0) return prev;
          return [...prev, ...newMsgs].sort((a, b) => a.id - b.id);
        });
      } else {
        setChatMessages(mapped);
        setHasMoreChat(data.length >= 8);
      }
    } catch (err) {
      console.error('Failed to load chat messages', err);
    }
  }, [token, groupId, isNumericGroupId]);

  const loadPinnedMessages = useCallback(async () => {
    if (!token || !isNumericGroupId) return;
    try {
      const data = await getPinnedGroupMessages(token, groupId);
      const mapped = data.map((m) => ({
        id: m.messageId,
        author: m.isMine ? 'Bạn' : m.senderName,
        avatar: m.senderAvatarUrl || (m.senderName[0]?.toUpperCase() ?? '?'),
        text: m.content || (m.mediaUrl ? 'Đã gửi một tệp đính kèm.' : ''),
        time: new Date(m.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        mine: m.isMine,
        isPinned: m.isPinned,
        senderId: m.senderId,
      }));
      setPinnedMessages(mapped);
    } catch (err) {
      console.error('Failed to load pinned messages', err);
    }
  }, [token, groupId, isNumericGroupId]);

  const loadOlderChatMessages = async () => {
    if (!token || !isNumericGroupId || loadingMoreChat || !hasMoreChat) return;
    const lowestId = chatMessages[0]?.id;
    if (!lowestId) return;

    setLoadingMoreChat(true);
    const container = chatScrollRef.current;
    const previousScrollHeight = container ? container.scrollHeight : 0;

    try {
      const data = await getGroupMessages(token, groupId, lowestId, 8);
      if (data.length === 0) {
        setHasMoreChat(false);
        setLoadingMoreChat(false);
        return;
      }

      const mapped = data.map((m) => ({
        id: m.messageId,
        author: m.isMine ? 'Bạn' : m.senderName,
        avatar: m.senderAvatarUrl || (m.senderName[0]?.toUpperCase() ?? '?'),
        text: m.content || (m.mediaUrl ? 'Đã gửi một tệp đính kèm.' : ''),
        time: new Date(m.sentAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        mine: m.isMine,
        isPinned: m.isPinned,
        senderId: m.senderId,
      }));

      setChatMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMsgs = mapped.filter((m) => !existingIds.has(m.id));
        return [...newMsgs, ...prev];
      });
      setHasMoreChat(data.length >= 8);

      if (container) {
        requestAnimationFrame(() => {
          const newScrollHeight = container.scrollHeight;
          container.scrollTop = newScrollHeight - previousScrollHeight;
        });
      }
    } catch (err) {
      console.error('Failed to load older chat messages', err);
    } finally {
      setLoadingMoreChat(false);
    }
  };

  const handleChatScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollTop <= 5) {
      loadOlderChatMessages();
    }
  };

  useEffect(() => {
    if (chatMessages.length === 0) return;
    const lastMsg = chatMessages[chatMessages.length - 1];
    const container = chatScrollRef.current;
    if (!container) return;

    if (lastMessageIdRef.current === null || lastMessageIdRef.current !== lastMsg.id) {
      container.scrollTop = container.scrollHeight;
    }
    lastMessageIdRef.current = lastMsg.id;
  }, [chatMessages]);

  const loadGroupPosts = useCallback(async () => {
    if (!token || !isNumericGroupId) return;
    setLoadingPosts(true);
    try {
      const data = await getGroupPosts(token, groupId);
      setActualPosts(data);
    } catch (err) {
      console.error('Failed to load group posts', err);
    } finally {
      setLoadingPosts(false);
    }
  }, [token, groupId, isNumericGroupId]);

  useEffect(() => {
    loadGroupInfo();
    loadMembers();
    loadChatMessages();
    loadPinnedMessages();
    loadGroupPosts();
  }, [token, groupId, loadGroupInfo, loadMembers, loadChatMessages, loadPinnedMessages, loadGroupPosts]);

  useEffect(() => {
    if (activeTab !== 'posts') return;

    const sentinel = postLoadMoreRef.current;
    if (!sentinel || visibleCount >= actualPosts.length) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.unobserve(sentinel);
        setVisibleCount((prev) => Math.min(prev + 5, actualPosts.length));
      }
    }, { rootMargin: '220px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, actualPosts.length, visibleCount]);

  useVisiblePolling(
    () => loadChatMessages(true),
    8000,
    activeTab === 'chat' && isNumericGroupId,
  );

  const clubCode = groupInfo?.groupName ?? '';
  const pendingPosts = posts.filter((post) => post.status === 'Chờ duyệt').length;
  const filteredMembers = members.filter((member) => {
    const keyword = memberSearch.trim().toLowerCase();

    return (
      !keyword ||
      member.name.toLowerCase().includes(keyword) ||
      member.role.toLowerCase().includes(keyword) ||
      member.level.includes(keyword)
    );
  });

  const sideNavItems: Array<{ id: DashboardTab; label: string; icon: LucideIcon; badge?: number }> = [
    { id: 'overview', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'members', label: 'Thành viên', icon: Users, badge: requests.length },
    { id: 'posts', label: 'Bài viết', icon: FileText, badge: pendingPosts },
    { id: 'chat', label: 'Chat CLB', icon: MessageCircle },
    ...(isGroupManager ? [{ id: 'settings' as const, label: 'Cài đặt CLB', icon: Settings }] : []),
  ];

  const stats = useMemo(
    () => [
      {
        label: 'Tổng thành viên',
        value: members.length.toString(),
        helper: `${requests.length} yêu cầu chờ duyệt`,
        icon: Users,
      },
      {
        label: 'Bài viết chờ duyệt',
        value: pendingPosts.toString(),
        helper: `${posts.length} bài trong bảng tin`,
        icon: FileText,
      },
      {
        label: 'Tin nhắn hôm nay',
        value: chatMessages.length.toString(),
        helper: 'Đang kết nối API Picklink',
        icon: MessageCircle,
      },
    ],
    [chatMessages.length, members.length, pendingPosts, posts.length, requests.length],
  );

  const approveRequest = async (request: JoinRequest) => {
    if (!token || !isNumericGroupId) return;
    if (!window.confirm(`Duyệt ${request.name} vào câu lạc bộ?`)) return;
    try {
      await approveMember(token, groupId, request.id);
      await loadMembers();
    } catch (err: any) {
      notify(err.message || 'Không thể phê duyệt thành viên.', 'error');
    }
  };

  const rejectRequest = async (requestId: number) => {
    if (!token || !isNumericGroupId) return;
    if (!window.confirm('Từ chối yêu cầu tham gia câu lạc bộ này?')) return;
    try {
      await declineMember(token, groupId, requestId);
      await loadMembers();
    } catch (err: any) {
      notify(err.message || 'Không thể từ chối thành viên.', 'error');
    }
  };

  // Map Vietnamese UI roles to backend role strings
  const uiRoleToBackendRole: Record<MemberRole, string> = {
    'Chủ nhiệm': 'Owner',
    'Quản trị viên': 'Admin',
    'Kiểm duyệt viên': 'Moderator',
    'Thành viên': 'Member',
  };

  const updateMemberRole = async (memberId: number, role: MemberRole) => {
    if (!token || !isNumericGroupId) return;
    const targetMember = members.find((member) => member.id === memberId);
    if (!window.confirm(`Đổi vai trò của ${targetMember?.name ?? 'thành viên này'} thành ${role}?`)) return;


    const backendRole = uiRoleToBackendRole[role];
    try {
      await changeMemberRole(token, groupId, memberId, backendRole);
      // Reload members to get fresh data from server
      await loadMembers();
    } catch (err: any) {
      notify(err.message || 'Không thể thay đổi vai trò thành viên.', 'error');
    }
  };

  const toggleMemberStatus = async (memberId: number) => {
    if (!token || !isNumericGroupId) return;
    const targetMember = members.find((member) => member.id === memberId);
    if (!targetMember) return;

    const isBanned = targetMember.status === 'Bị cấm';
    const message = isBanned
      ? 'Bạn có chắc chắn muốn bỏ cấm thành viên này?'
      : 'Bạn có chắc chắn muốn cấm thành viên này khỏi câu lạc bộ?';
    if (!confirm(message)) return;

    try {
      if (isBanned) {
        await unbanMember(token, groupId, memberId);
      } else {
        await banMember(token, groupId, memberId);
      }
      await loadMembers();
    } catch (err: any) {
      notify(
        err.message || (isBanned ? 'Không thể bỏ cấm thành viên.' : 'Không thể cấm thành viên.'),
        'error',
      );
    }
  };


  const approvePost = async (postId: number) => {
    if (!token) return;
    if (!window.confirm('Duyệt bài viết này để hiển thị trong câu lạc bộ?')) return;
    try {
      await approveGroupPost(token, postId);
      await loadGroupPosts();
    } catch (err: any) {
      notify(err.message || 'Không thể duyệt bài viết.', 'error');
    }
  };


  const deletePost = async (postId: number) => {
    if (!token) return;
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;
    try {
      await deletePostApi(token, postId);
      await loadGroupPosts();
    } catch (err: any) {
      notify(err.message || 'Không thể xóa bài viết.', 'error');
    }
  };

  const sendChatMessage = async () => {
    const text = chatDraft.trim();
    if (!text || !token || !isNumericGroupId) return;

    try {
      const newMsg = await sendGroupMessage(token, groupId, { content: text });
      setChatMessages((currentMessages) => [
        ...currentMessages,
        {
          id: newMsg.messageId,
          author: 'Bạn',
          avatar: newMsg.senderAvatarUrl || (newMsg.senderName[0]?.toUpperCase() ?? '?'),
          text: newMsg.content || '',
          time: new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(newMsg.sentAt)),
          mine: true,
          isPinned: newMsg.isPinned,
          senderId: newMsg.senderId,
        },
      ]);
      setChatDraft('');
    } catch (err: any) {
      notify(err.message || 'Không thể gửi tin nhắn.', 'error');
    }
  };

  const handleDeleteChatMessage = async (messageId: number) => {
    if (!token || !isNumericGroupId) return;
    if (!confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) return;
    try {
      await deleteGroupMessage(token, groupId, messageId);
      await loadChatMessages();
    } catch (err: any) {
      notify(err.message || 'Không thể xóa tin nhắn.', 'error');
    }
  };

  const handleTogglePinChatMessage = async (messageId: number, currentPin: boolean) => {
    if (!token || !isNumericGroupId) return;
    try {
      await pinGroupMessage(token, groupId, messageId, !currentPin);
      await loadChatMessages();
      await loadPinnedMessages();
    } catch (err: any) {
      notify(err.message || 'Không thể thay đổi trạng thái ghim tin nhắn.', 'error');
    }
  };

  const handleModifyChatMessage = async (messageId: number, text: string) => {
    if (!token || !isNumericGroupId) return;
    try {
      await deleteGroupMessage(token, groupId, messageId);
      setChatDraft(text);
      await loadChatMessages();
    } catch (err: any) {
      notify(err.message || 'Không thể chỉnh sửa tin nhắn.', 'error');
    }
  };

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <section className="rounded-xl border border-[#d8e4d4] bg-white p-5 shadow-sm" key={stat.label}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold text-[#64736a]">{stat.label}</p>
                <p className="mt-2 text-[23px] font-bold leading-none tracking-[-0.035em]">{stat.value}</p>
                <p className="mt-1.5 text-[11px] font-medium leading-4 text-[#718077]">{stat.helper}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]">
                <stat.icon className="h-4 w-4" />
              </div>
            </div>
          </section>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
        <section className="rounded-xl border border-[#d8e4d4] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-[17px] font-bold">Việc cần xử lý</h2>
              <p className="mt-1 text-[13px] text-[#64736a]">Các mục ưu tiên trong ngày của ban quản lý CLB.</p>
            </div>
            <button
              className="rounded-lg border border-[#d8e4d4] px-3 py-2 text-[13px] font-bold text-[#0b2228] hover:bg-[#edf5e9]"
              onClick={() => setActiveTab('members')}
              type="button"
            >
              Xem tất cả
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            {[
              {
                title: 'Duyệt thành viên',
                value: requests.length,
                text: 'Yêu cầu tham gia mới cần phản hồi.',
                icon: UserCheck,
                tab: 'members' as const,
              },
              {
                title: 'Duyệt bài viết',
                value: pendingPosts,
                text: 'Bài đăng cộng đồng chờ kiểm duyệt.',
                icon: FileText,
                tab: 'posts' as const,
              },
            ].map((item) => (
              <button
                className="rounded-xl border border-[#d8e4d4] p-3.5 text-left hover:border-[#98d951] hover:bg-[#edf5e9]"
                key={item.title}
                onClick={() => setActiveTab(item.tab)}
                type="button"
              >
                <item.icon className="h-5 w-5 text-[#477313]" />
                <p className="mt-3 text-[20px] font-bold leading-none">{item.value}</p>
                <h3 className="mt-2 text-[15px] font-bold">{item.title}</h3>
                <p className="mt-1 text-[13px] leading-5 text-[#64736a]">{item.text}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#dbe8cf] bg-[#edf5e9] p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-[17px] font-bold">
            <ShieldCheck className="h-5 w-5 text-[#477313]" />
            Quyền quản trị
          </h2>
          <div className="mt-5 space-y-3">
            {roleOptions.map((role) => (
              <div className="rounded-lg bg-white p-3" key={role}>
                <div className="flex items-center justify-between gap-3">
                  <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${getRoleClassName(role)}`}>
                    {role}
                  </span>
                  <span className="text-[12px] font-bold text-[#64736a]">
                    {members.filter((member) => member.role === role).length} người
                  </span>
                </div>
                <p className="mt-2 text-[12px] leading-5 text-[#64736a]">
                  {permissionByRole[role].join(' · ')}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );

  const renderMembers = () => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <section className="rounded-xl border border-[#d8e4d4] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#d8e4d4] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[17px] font-bold">Duyệt thành viên</h2>
            <p className="mt-1 text-[13px] text-[#64736a]">Kiểm tra trình độ, khu vực và ghi chú trước khi duyệt.</p>
          </div>
          <span className="w-fit rounded-full bg-[#fff4d8] px-3 py-1 text-[12px] font-bold text-[#7a5600]">
            {requests.length} yêu cầu chờ
          </span>
        </div>

        <div className="divide-y divide-[#d8e4d4]">
          {requests.length > 0 ? (
            requests.map((request) => (
              <article className="p-5" key={request.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div className="flex min-w-0 gap-3">
                    {renderAvatar(request.avatar, "h-12 w-12")}
                    <div className="min-w-0">
                      <h3 className="truncate text-[16px] font-bold">{request.name}</h3>
                      <p className="mt-1 text-[13px] font-medium text-[#64736a]">
                        Level {request.level} · {request.area} · Gửi ngày {request.requestedAt}
                      </p>
                      <p className="mt-2 text-[13px] leading-5 text-[#64736a]">{request.note}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      aria-label={`Duyệt ${request.name}`}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[13px] font-bold text-white hover:bg-primary/90"
                      onClick={() => approveRequest(request)}
                      type="button"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Duyệt
                    </button>
                    <button
                      aria-label={`Từ chối ${request.name}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[#d8e4d4] px-3 py-2 text-[13px] font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/50"
                      onClick={() => rejectRequest(request.id)}
                      type="button"
                    >
                      <XCircle className="h-4 w-4" />
                      Từ chối
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="p-8 text-center">
              <UserCheck className="mx-auto h-10 w-10 text-[#477313]" />
              <p className="mt-3 text-[15px] font-bold">Không còn yêu cầu chờ duyệt</p>
              <p className="mt-1 text-[13px] text-[#64736a]">Các yêu cầu mới sẽ hiển thị tại đây.</p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-xl border border-[#d8e4d4] bg-white p-5 shadow-sm">
        <h2 className="text-[17px] font-bold">Phân quyền nhanh</h2>
        <p className="mt-1 text-[13px] text-[#64736a]">Mỗi vai trò được gắn sẵn nhóm quyền phù hợp.</p>
        <div className="mt-5 space-y-3">
          {roleOptions.map((role) => (
            <div className="rounded-lg border border-[#d8e4d4] p-4" key={role}>
              <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold ${getRoleClassName(role)}`}>
                {role}
              </span>
              <div className="mt-3 flex flex-wrap gap-2">
                {permissionByRole[role].map((permission) => (
                  <span className="rounded-full bg-[#edf5e9] px-2 py-1 text-[11px] font-bold text-[#64736a]" key={permission}>
                    {permission}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-[#d8e4d4] bg-white shadow-sm xl:col-span-2">
        <div className="flex flex-col gap-4 border-b border-[#d8e4d4] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[17px] font-bold">Danh sách thành viên</h2>
            <p className="mt-1 text-[13px] text-[#64736a]">Cập nhật vai trò, trạng thái và quyền thao tác trong CLB.</p>
          </div>
          <div className="relative w-full md:w-[320px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64736a]" />
            <input
              className="h-11 w-full rounded-lg border border-[#d8e4d4] bg-[#edf5e9] pl-9 pr-3 text-[14px] outline-none focus:border-[#477313] focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setMemberSearch(event.target.value)}
              placeholder="Tìm thành viên, vai trò..."
              type="text"
              value={memberSearch}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-[#edf5e9]">
              <tr>
                <th className="px-5 py-4 text-[12px] font-bold uppercase text-[#64736a]">Thành viên</th>
                <th className="px-5 py-4 text-[12px] font-bold uppercase text-[#64736a]">Vai trò</th>
                <th className="px-5 py-4 text-[12px] font-bold uppercase text-[#64736a]">Quyền</th>
                <th className="px-5 py-4 text-[12px] font-bold uppercase text-[#64736a]">Trạng thái</th>
                <th className="px-5 py-4 text-[12px] font-bold uppercase text-[#64736a]">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8e4d4]">
              {filteredMembers.map((member) => (
                <tr className="hover:bg-[#f2f8ec]" key={member.id}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      {renderAvatar(member.avatar, "h-10 w-10")}
                      <div>
                        <p className="font-bold">{member.name}</p>
                        <p className="text-[12px] font-medium text-[#64736a]">
                          Level {member.level} · Gia nhập {member.joinedAt}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      className={`h-10 rounded-lg border border-[#d8e4d4] px-3 text-[13px] font-bold outline-none focus:border-[#477313] ${
                        member.role === 'Chủ nhiệm' ? 'bg-[#edf5e9] text-[#64736a] cursor-not-allowed' : 'bg-white'
                      }`}
                      disabled={currentManagerRank < 2 || currentManagerRank <= roleRank[member.role]}
                      onChange={(event) => updateMemberRole(member.id, event.target.value as MemberRole)}
                      value={member.role}
                    >
                      {roleOptions
                        .filter((role) => role === member.role || (role !== 'Chủ nhiệm' && roleRank[role] < currentManagerRank))
                        .map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex max-w-[320px] flex-wrap gap-1.5">
                      {member.permissions.map((permission) => (
                        <span className="rounded-full bg-[#edf5e9] px-2 py-1 text-[11px] font-bold text-[#64736a]" key={permission}>
                          {permission}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-[12px] font-bold ${
                        member.status === 'Đang hoạt động'
                          ? 'bg-[#eaf7df] text-[#477313]'
                          : member.status === 'Từ chối'
                          ? 'bg-[#fff4d8] text-[#7a5600]'
                          : member.status === 'Bị cấm'
                          ? 'bg-[#ffdad6] text-[#ba1a1a]'
                          : 'bg-[#ffdad6] text-[#ba1a1a]'
                      }`}
                    >
                      {member.status}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {currentManagerRank > roleRank[member.role] && (
                      <button
                        className={`rounded-lg border px-3 py-2 text-[12px] font-bold ${
                          member.status === 'Bị cấm'
                            ? 'border-[#477313] text-[#477313] hover:bg-primary/5'
                            : 'border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/50'
                        }`}
                        onClick={() => toggleMemberStatus(member.id)}
                        type="button"
                      >
                        {member.status === 'Bị cấm' ? 'Bỏ cấm' : 'Cấm'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );


  const renderPosts = () => (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-xl border border-[#d8e4d4] bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-[#d8e4d4] p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[17px] font-bold">Quản lý bài viết</h2>
            <p className="mt-1 text-[13px] text-[#64736a]">Duyệt, ghim, ẩn hoặc xóa nội dung trong bảng tin CLB.</p>
          </div>
        </div>

        <div className="divide-y divide-[#d8e4d4]">
          {loadingPosts && actualPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-[#477313]" />
              <p className="text-[13px] font-bold text-[#64736a]">Đang tải danh sách bài viết...</p>
            </div>
          ) : filteredPosts.length > 0 ? (
            filteredPosts.slice(0, visibleCount).map((post) => (
              <article className="p-5" key={post.id}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${statusClassNames[post.status]}`}>
                        {post.status}
                      </span>
                    </div>
                    <h3 className="mt-3 text-[17px] font-bold">{post.title}</h3>
                    <p className="mt-1 text-[13px] text-[#64736a]">
                      {post.author} · {post.createdAt} · {post.comments} bình luận
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {post.status === 'Chờ duyệt' && (
                      <button
                        className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary/90"
                        onClick={() => approvePost(post.id)}
                        type="button"
                      >
                        Duyệt
                      </button>
                    )}
                    <Link aria-label="Xem bài viết" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#d8e4d4] text-[#64736a] hover:bg-[#edf5e9]" to={`/posts/${post.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button
                      aria-label="Xóa bài viết"
                      className="rounded-lg border border-[#d8e4d4] p-2 text-[#ba1a1a] hover:bg-[#ffdad6]/50"
                      onClick={() => deletePost(post.id)}
                      type="button"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="p-8 text-center text-[#64736a]">
              Chưa có bài viết nào trong câu lạc bộ này.
            </div>
          )}
        </div>
        {filteredPosts.length > visibleCount && (
          <div
            className="border-t border-[#d8e4d4] bg-[#edf5e9] p-4 text-center text-[13px] font-bold text-[#64736a]"
            ref={postLoadMoreRef}
          >
            Đang tải thêm bài viết ({Math.min(visibleCount, filteredPosts.length)}/{filteredPosts.length})
          </div>
        )}
      </section>

      <aside className="space-y-6">
        <section className="rounded-xl border border-[#d8e4d4] bg-white p-5 shadow-sm">
          <h2 className="text-[17px] font-bold">Bộ lọc kiểm duyệt</h2>
          <div className="mt-4 space-y-2">
            {(['Tất cả', 'Chờ duyệt', 'Đã đăng', 'Nháp'] as const).map((status) => (
              <button
                aria-pressed={postFilter === status}
                className={'flex w-full items-center justify-between rounded-lg border px-3 py-3 text-left text-[13px] font-bold ' + (
                  postFilter === status
                    ? 'border-[#477313] bg-primary/5 text-[#477313]'
                    : 'border-[#d8e4d4] hover:bg-[#edf5e9]'
                )}
                key={status}
                onClick={() => {
                  setPostFilter(status);
                  setVisibleCount(5);
                }}
                type="button"
              >
                <span>{status}</span>
                <span className={'rounded-full px-2 py-0.5 text-[11px] ' + (
                  status === 'Tất cả'
                    ? 'bg-[#edf5e9] text-[#64736a]'
                    : statusClassNames[status]
                )}>
                  {status === 'Tất cả' ? posts.length : posts.filter((post) => post.status === status).length}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#dbe8cf] bg-[#edf5e9] p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-[17px] font-bold">
            <Sparkles className="h-5 w-5 text-[#477313]" />
            Quy tắc đăng bài
          </h2>
          <ul className="mt-4 space-y-3 text-[13px] leading-5 text-[#64736a]">
            {['Không đăng nội dung mua bán ngoài hệ thống.', 'Bài ghim ưu tiên lịch thi đấu và thông báo CLB.', 'Bài từ thành viên mới cần quản trị viên duyệt.'].map((rule) => (
              <li className="flex gap-2" key={rule}>
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#477313]" />
                {rule}
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  );

  const renderChat = () => {

    return (
      <div className="grid grid-cols-1 gap-6 xl:h-[680px] xl:grid-cols-[minmax(0,1fr)_330px]">
        <section className="flex h-[calc(100dvh-10rem)] min-h-[32rem] max-h-[46rem] flex-col overflow-hidden rounded-xl border border-[#d8e4d4] bg-white shadow-sm xl:h-full xl:min-h-0 xl:max-h-none">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-[#d8e4d4] px-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-[15px] font-bold text-white">
                {groupInfo ? groupInfo.groupName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : 'HE'}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-[17px] font-bold">Chat {clubCode}</h2>
                <p className="truncate text-[12px] font-bold text-[#64736a]">{members.length} thành viên trong nhóm</p>
              </div>
            </div>
            <button aria-label="Mở cài đặt câu lạc bộ" className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-[#d8e4d4] text-[#64736a] hover:bg-[#edf5e9]" onClick={() => setActiveTab('settings')} type="button">
              <Settings className="h-5 w-5" />
            </button>
          </header>

          {pinnedMessages.length > 0 && (
            <div className="bg-[#edf5e9] border-b border-[#dbe8cf] px-5 py-3 flex flex-col gap-2 shrink-0">
              <div className="flex items-center gap-2 text-[12px] font-bold text-[#477313]">
                <Pin className="h-3.5 w-3.5 fill-current" />
                <span>TIN NHẮN ĐÃ GHIM ({pinnedMessages.length})</span>
              </div>
              <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar">
                {pinnedMessages.map((msg) => (
                  <div className="flex items-center justify-between gap-3 text-[13px] bg-white p-2 rounded border border-[#d8e4d4] shadow-sm" key={msg.id}>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-[#0b2228] mr-1">{msg.author}:</span>
                      <span className="text-[#64736a]">{msg.text}</span>
                    </div>
                    {isGroupManager && (
                      <button
                        className="text-[11px] font-bold text-[#ba1a1a] hover:underline"
                        onClick={() => handleTogglePinChatMessage(msg.id, true)}
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
            className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto p-3 sm:p-5"
            ref={chatScrollRef}
            onScroll={handleChatScroll}
            style={{
              backgroundImage: 'radial-gradient(#DDE5D5 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          >
            {chatMessages.map((message) => (
              <div className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`} key={message.id}>
                <div className={`flex max-w-[78%] gap-3 md:max-w-[620px] ${message.mine ? 'flex-row-reverse' : ''}`}>
                  {renderAvatar(message.avatar, "h-9 w-9 mt-1")}
                  <div className={message.mine ? 'text-right' : ''}>
                    <div className={`mb-1 flex items-center gap-2 ${message.mine ? 'justify-end' : ''}`}>
                      <span className="text-[12px] font-bold text-[#64736a]">{message.author}</span>
                      <span className="text-[11px] text-[#64736a]">{message.time}</span>
                    </div>
                    <div
                      className={`rounded-2xl px-4 py-3 text-[14px] leading-6 shadow-sm ${
                        message.mine
                          ? 'rounded-tr-sm bg-primary text-white'
                          : 'rounded-tl-sm border border-[#d8e4d4] bg-white text-[#0b2228]'
                      }`}
                    >
                      {message.text}
                    </div>
                    <div className={`mt-1 flex items-center gap-2.5 text-[11px] font-bold text-[#64736a] ${message.mine ? 'justify-end' : 'justify-start'}`}>
                      {message.isPinned && (
                        <span className="flex items-center gap-1 text-[#477313]">
                          <Pin className="h-3 w-3 fill-current" />
                          Đã ghim
                        </span>
                      )}
                      {isGroupManager && (
                        <button
                          className="hover:text-[#477313] transition-colors text-[#64736a]"
                          onClick={() => handleTogglePinChatMessage(message.id, message.isPinned)}
                          type="button"
                        >
                          {message.isPinned ? 'Bỏ ghim' : 'Ghim'}
                        </button>
                      )}
                      {(message.mine || isGroupManager) && (
                        <button
                          className="hover:text-[#ba1a1a] transition-colors text-[#64736a]"
                          onClick={() => handleDeleteChatMessage(message.id)}
                          type="button"
                        >
                          Xóa
                        </button>
                      )}
                      {message.mine && (
                        <button
                          className="hover:text-[#477313] transition-colors text-[#64736a]"
                          onClick={() => handleModifyChatMessage(message.id, message.text || '')}
                          type="button"
                        >
                          Sửa
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        <div className="shrink-0 border-t border-[#d8e4d4] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:p-4">
          <div className="flex items-end gap-2">
            <textarea
              className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-[#d8e4d4] bg-[#edf5e9] px-4 py-3 text-[14px] outline-none focus:border-[#477313] focus:ring-2 focus:ring-primary/20"
              onChange={(event) => setChatDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendChatMessage();
                }
              }}
              placeholder="Nhập tin nhắn CLB..."
              rows={1}
              value={chatDraft}
            />
            <button
              aria-label="Gửi tin nhắn CLB"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-[#8a9380]"
              disabled={!chatDraft.trim()}
              onClick={sendChatMessage}
              type="button"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </section>

      <aside className="space-y-6">
        <section className="rounded-xl border border-[#d8e4d4] bg-white p-5 shadow-sm">
          <h2 className="text-[17px] font-bold">Thành viên trực tuyến</h2>
          <div className="mt-4 space-y-3">
            {members.slice(0, 4).map((member) => (
              <div className="flex items-center gap-3" key={member.id}>
                <div className="relative shrink-0">
                  {renderAvatar(member.avatar, "h-10 w-10")}
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[#2f9e44]" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold">{member.name}</p>
                  <p className="truncate text-[12px] text-[#64736a]">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-[#d8e4d4] bg-[#fff8e6] p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-[18px] font-bold text-[#7a5600]">
            <LockKeyhole className="h-5 w-5" />
            Quyền chat CLB
          </h2>
          <p className="mt-3 text-[13px] leading-5 text-[#7a5600]">
            Thành viên đã được duyệt mới có thể tham gia chat. Quản trị viên có thể ghim thông báo, ẩn tin nhắn và khóa thành viên vi phạm.
          </p>
        </section>
      </aside>
    </div>
    );
  };

  const renderSettings = () => {
    if (!groupInfo) return null;

    const hasChanges = 
      editName !== (groupInfo.groupName || '') ||
      editDesc !== (groupInfo.description || '') ||
      editRules !== (groupInfo.rules || '') ||
      editLocation !== (groupInfo.activeLocation || '') ||
      editGroupType !== (groupInfo.groupType || 'Public') ||
      editRequirePostApproval !== (groupInfo.requirePostApproval ?? true) ||
      editRequireMemberApproval !== (groupInfo.requireMemberApproval ?? groupInfo.groupType === 'Private');

    return (
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Main Settings Form */}
        <div className="space-y-6">
          <section className="rounded-xl border border-[#d8e4d4] bg-white p-6 shadow-sm">
            <h2 className="text-[17px] font-bold text-[#0b2228] mb-6">Thông tin chung câu lạc bộ</h2>
            
            <div className="space-y-5">
              <div>
                <label className="text-[13px] font-bold text-[#64736a] block mb-1.5">
                  Tên câu lạc bộ <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-[#d8e4d4] px-3.5 py-2.5 text-[14px] focus:border-[#477313] focus:ring-1 focus:ring-primary outline-none bg-white text-[#0b2228]"
                  placeholder="Nhập tên câu lạc bộ..."
                  required
                />
              </div>

              <div className="space-y-3 rounded-xl border border-[#d8e4d4] bg-[#edf5e9] p-4">
                <p className="text-[13px] font-bold text-[#0b2228]">Quyền tham gia và đăng bài</p>
                <label className="flex cursor-pointer items-start gap-3 text-[13px]">
                  <input
                    checked={editRequireMemberApproval}
                    className="mt-0.5 h-4 w-4 accent-primary"
                    onChange={(event) => setEditRequireMemberApproval(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <span className="block font-bold text-[#0b2228]">Duyệt thành viên trước khi tham gia</span>
                    <span className="mt-0.5 block text-[12px] text-[#64736a]">Tắt để người chơi tham gia ngay, không cần chủ CLB duyệt.</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 text-[13px]">
                  <input
                    checked={editRequirePostApproval}
                    className="mt-0.5 h-4 w-4 accent-primary"
                    onChange={(event) => setEditRequirePostApproval(event.target.checked)}
                    type="checkbox"
                  />
                  <span>
                    <span className="block font-bold text-[#0b2228]">Duyệt bài viết trước khi đăng</span>
                    <span className="mt-0.5 block text-[12px] text-[#64736a]">Tắt để bài viết của thành viên hiển thị ngay.</span>
                  </span>
                </label>
              </div>

              <div>
                <label className="text-[13px] font-bold text-[#64736a] block mb-1.5">
                  Giới thiệu câu lạc bộ
                </label>
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[#d8e4d4] px-3.5 py-2.5 text-[14px] focus:border-[#477313] focus:ring-1 focus:ring-primary outline-none resize-y bg-white text-[#0b2228]"
                  placeholder="Mô tả mục tiêu, đối tượng người chơi..."
                />
              </div>

              <div>
                <label className="text-[13px] font-bold text-[#64736a] block mb-1.5">
                  Vị trí hoạt động (City/District)
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64736a]" />
                  <input
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    className="w-full rounded-lg border border-[#d8e4d4] pl-10 pr-3.5 py-2.5 text-[14px] focus:border-[#477313] focus:ring-1 focus:ring-primary outline-none bg-white text-[#0b2228]"
                    placeholder="Ví dụ: Quận Cầu Giấy, Hà Nội..."
                  />
                </div>
              </div>

              <div>
                <label className="text-[13px] font-bold text-[#64736a] block mb-1.5 font-semibold">
                  Chế độ nhóm (Quyền riêng tư)
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditGroupType('Public')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-[13px] font-bold transition-colors ${
                      editGroupType === 'Public'
                        ? 'bg-primary-container text-on-primary-container border-[#477313]'
                        : 'border-[#d8e4d4] bg-white text-[#64736a] hover:bg-[#edf5e9]'
                    }`}
                  >
                    <Globe className="h-4 w-4" />
                    Công khai
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditGroupType('Private')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border text-[13px] font-bold transition-colors ${
                      editGroupType === 'Private'
                        ? 'bg-primary-container text-on-primary-container border-[#477313]'
                        : 'border-[#d8e4d4] bg-white text-[#64736a] hover:bg-[#edf5e9]'
                    }`}
                  >
                    <Lock className="h-4 w-4" />
                    Riêng tư
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[13px] font-bold text-[#64736a] block mb-1.5">
                  Quy định nội bộ
                </label>
                <textarea
                  value={editRules}
                  onChange={(e) => setEditRules(e.target.value)}
                  rows={5}
                  className="w-full rounded-lg border border-[#d8e4d4] px-3.5 py-2.5 text-[14px] focus:border-[#477313] focus:ring-1 focus:ring-primary outline-none resize-y bg-white text-[#0b2228]"
                  placeholder="Nêu rõ nội quy tham gia, đóng phí sân..."
                />
              </div>
            </div>

            {hasChanges && (
              <div className="mt-6 flex justify-end gap-3 border-t border-[#d8e4d4] pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditName(groupInfo.groupName || '');
                    setEditDesc(groupInfo.description || '');
                    setEditRules(groupInfo.rules || '');
                    setEditLocation(groupInfo.activeLocation || '');
                    setEditGroupType(groupInfo.groupType || 'Public');
                    setEditRequirePostApproval(groupInfo.requirePostApproval ?? true);
                    setEditRequireMemberApproval(groupInfo.requireMemberApproval ?? groupInfo.groupType === 'Private');
                  }}
                  className="rounded-lg border border-[#d8e4d4] px-4 py-2 text-[13px] font-bold text-[#0b2228] hover:bg-[#edf5e9] transition-colors"
                >
                  Hủy thay đổi
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleUpdateGroup({
                      groupName: editName,
                      description: editDesc,
                      rules: editRules,
                      activeLocation: editLocation,
                      groupType: editGroupType,
                      requirePostApproval: editRequirePostApproval,
                      requireMemberApproval: editRequireMemberApproval,
                    })
                  }
                  disabled={updatingGroup || !editName.trim()}
                  className="rounded-lg bg-primary px-5 py-2 text-[13px] font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {updatingGroup && <Loader2 className="h-4 w-4 animate-spin" />}
                  Lưu thông tin
                </button>
              </div>
            )}
          </section>

          {/* Intro Images Section */}
          <section className="rounded-xl border border-[#d8e4d4] bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-[18px] font-bold text-[#0b2228]">Ảnh giới thiệu</h2>
                <p className="text-[12px] text-[#64736a] mt-0.5 font-medium">Hiển thị trên trang chi tiết của câu lạc bộ.</p>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-primary/10 px-3.5 py-2 text-[13px] font-bold text-[#477313] hover:bg-primary/20 transition-colors">
                {uploadingIntro ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ImageIcon className="h-4 w-4" />
                )}
                Thêm ảnh mới
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleIntroImageUpload}
                  disabled={uploadingIntro}
                />
              </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {(groupInfo.images || []).map((img) => (
                <div key={img.groupImageId} className="group relative aspect-video rounded-lg overflow-hidden border border-[#d8e4d4] bg-[#edf5e9]">
                  <img
                    src={img.imageUrl}
                    alt={img.caption || 'Ảnh giới thiệu câu lạc bộ'}
                    className="w-full h-full object-cover" decoding="async" loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveIntroImage(img.groupImageId)}
                      className="rounded-full bg-[#ffdad6] p-2 text-[#ba1a1a] hover:scale-105 transition-transform"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              {(groupInfo.images || []).length === 0 && (
                <div className="col-span-full py-8 text-center text-[13px] text-[#64736a] border border-dashed border-[#d8e4d4] rounded-lg font-medium">
                  Chưa có ảnh giới thiệu nào.
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info & Cover Image */}
        <div className="space-y-6">
          <section className="rounded-xl border border-[#d8e4d4] bg-white p-5 shadow-sm">
            <h3 className="text-[15px] font-bold text-[#0b2228] mb-4">Ảnh bìa câu lạc bộ</h3>
            <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-[#d8e4d4] bg-[#edf5e9]">
              {groupInfo.coverImageUrl ? (
                <img
                  src={groupInfo.coverImageUrl}
                  alt={groupInfo.groupName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[12px] text-[#64736a] font-medium">
                  Chưa có ảnh bìa
                </div>
              )}
              
              <label className="absolute bottom-3 right-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/85 transition-colors">
                {uploadingCover ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleCoverUpload}
                  disabled={uploadingCover}
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-[#cfe0c8] bg-[#edf6e9] p-5 shadow-sm">
            <h3 className="text-[15px] font-bold text-[#2d5000] mb-3">Đánh giá chung</h3>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#cfe0c8] px-3.5 py-1.5 text-[15px] font-bold text-[#2d5000] shadow-sm">
                <span className="text-amber-500">★</span>
                {groupInfo.overallRating > 0 ? groupInfo.overallRating.toFixed(1) : 'Chưa có'}
              </span>
              <div>
                <p className="text-[13px] font-bold text-[#0b2228]">
                  {groupInfo.ratingCount > 0 ? `${groupInfo.ratingCount} lượt đánh giá` : 'Chưa có đánh giá'}
                </p>
                <p className="text-[11px] text-[#64736a] mt-0.5">Rating được tích hợp từ các review hội viên.</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderActiveTab = () => {
    if (activeTab === 'members') {
      return renderMembers();
    }


    if (activeTab === 'posts') {
      return renderPosts();
    }

    if (activeTab === 'chat') {
      return renderChat();
    }

    if (activeTab === 'settings') {
      return renderSettings();
    }

    return renderOverview();
  };

  if (loadingGroup) {
    return <div className="grid min-h-dvh place-items-center bg-[#f8fbf4] p-6 font-bold" role="status">Đang tải câu lạc bộ...</div>;
  }

  if (!isNumericGroupId || !groupInfo) {
    return (
      <div className="grid min-h-dvh place-items-center bg-[#f8fbf4] p-6 text-center">
        <div>
          <p className="font-bold text-error" role="alert">Không thể tải câu lạc bộ này.</p>
          <Link className="mt-4 inline-flex rounded-lg bg-primary px-4 py-2 font-bold text-white" to="/clubs">Về danh sách CLB</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-[#f8fbf4] pt-[72px] text-[#0b2228]" data-club-ui>
      <aside className="fixed bottom-0 left-0 top-[72px] z-30 hidden w-[244px] flex-col border-r border-[#d8e4d4] bg-white/92 backdrop-blur-xl lg:flex">
        <div className="m-3 rounded-2xl bg-[#0b2228] p-4 text-white shadow-[0_12px_28px_rgba(8,29,36,0.14)]">
          <Link className="inline-flex items-center gap-2 text-[18px] font-bold tracking-[-0.025em] text-white" to="/">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#e2ff57] text-[12px] font-black text-[#102414]">P</span>
            Picklink
          </Link>
          <p className="mt-2 text-[11px] font-bold text-white/58">Không gian quản lý CLB</p>
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-2">
          {sideNavItems.map((item) => (
            <button
              className={`flex h-10 w-full items-center justify-between rounded-xl px-3 text-left text-[12px] font-bold transition-colors ${
                activeTab === item.id
                  ? 'bg-[#0b2228] text-white shadow-[0_8px_18px_rgba(8,29,36,0.12)]'
                  : 'text-[#64736a] hover:bg-[#edf5e9] hover:text-[#0b2228]'
              }`}
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              type="button"
            >
              <span className="inline-flex items-center gap-2.5">
                <item.icon className={`h-4 w-4 ${activeTab === item.id ? 'text-[#e2ff57]' : 'text-[#477313]'}`} />
                {item.label}
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`rounded-full px-2 py-0.5 text-[11px] ${activeTab === item.id ? 'bg-white text-[#477313]' : 'bg-[#eab526] text-white'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

      </aside>

      <main className="lg:pl-[244px]">
        <header className="sticky top-[72px] z-20 border-b border-[#d8e4d4] bg-[#f8fbf4]/94 px-4 py-3 backdrop-blur-xl md:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-[#64736a]">
                <Link className="hover:text-[#477313]" to="/clubs">
                  CLB
                </Link>
                <ChevronRight className="h-4 w-4" />
                <span className="text-[#0b2228]">{clubCode}</span>
              </div>
              <h1 className="mt-1.5 text-[19px] font-bold leading-tight tracking-[-0.03em] md:text-[22px]">
                Quản lý CLB
              </h1>
              <p className="mt-0.5 text-[12px] text-[#64736a]">
                Mã CLB: {clubCode.toUpperCase()} · Duyệt thành viên, phân quyền, bài viết và chat.
              </p>
            </div>
          </div>

          <nav className="mt-3 flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
            {sideNavItems.map((item) => (
              <button
                className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3 text-[12px] font-bold ${
                  activeTab === item.id ? 'bg-[#0b2228] text-white' : 'border border-[#d8e4d4] bg-white text-[#64736a]'
                }`}
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                type="button"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`rounded-full px-1.5 text-[11px] ${activeTab === item.id ? 'bg-white text-[#477313]' : 'bg-[#eab526] text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </header>

        <div className="mx-auto max-w-[1280px] px-4 py-4 md:px-6 md:py-6">
          {renderActiveTab()}
        </div>
      </main>
    </div>
  );
};
