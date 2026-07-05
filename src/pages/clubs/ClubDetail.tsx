import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  Dumbbell,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  Trophy,
  UserPlus,
  Users,
  ThumbsUp,
} from 'lucide-react';
import { XCircle } from 'lucide-react';
import './club-pages.css';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/ToastRegion';
import {
  type CommunityGroup,
  type CommunityMember,
  type CommunityPost,
  getGroup,
  getGroupMembers,
  getGroupPosts,
  joinGroup,
  leaveGroup,
} from '../../api/community';

type DetailTab = 'overview' | 'schedule' | 'members' | 'posts';

export const ClubDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const notify = useToast();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const [club, setClub] = useState<CommunityGroup | null>(null);
  const [members, setMembers] = useState<CommunityMember[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const groupId = Number(id);

  useEffect(() => {
    if (!groupId || isNaN(groupId)) {
      setError('ID câu lạc bộ không hợp lệ.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const groupData = await getGroup(groupId, token);
        setClub(groupData);

        // Fetch members & posts in parallel (these may require auth)
        const results = await Promise.allSettled([
          token ? getGroupMembers(token, groupId) : Promise.resolve([]),
          token ? getGroupPosts(token, groupId) : Promise.resolve([]),
        ]);

        if (results[0].status === 'fulfilled') setMembers(results[0].value);
        if (results[1].status === 'fulfilled') setPosts(results[1].value);
      } catch (err: any) {
        setError(err?.message || 'Không thể tải thông tin câu lạc bộ.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [groupId, token]);

  const isManager = useMemo(() => {
    return club?.myRole === 'Owner' || club?.myRole === 'Admin' || club?.myRole === 'Moderator';
  }, [club]);

  const handleJoinLeave = async () => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (!club) return;
    if (club.myStatus === 'Banned') return;

    setActionLoading(true);
    try {
      if (club.myStatus === 'Accepted' || club.myStatus === 'Pending') {
        const updated = await leaveGroup(token, groupId);
        setClub(updated);
        // Refresh members
        const freshMembers = await getGroupMembers(token, groupId);
        setMembers(freshMembers);
      } else {
        // Handles null (no membership), 'Declined' (re-request)
        const updated = await joinGroup(token, groupId);
        setClub(updated);
        // Refresh members
        const freshMembers = await getGroupMembers(token, groupId);
        setMembers(freshMembers);
      }
    } catch (err: any) {
      notify(err.message || 'Không thể thực hiện yêu cầu.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      notify('Đã sao chép liên kết câu lạc bộ.', 'success');
    } catch (err) {
      // Fallback
    }
  };

  // Derive display values from API data
  const shortName = useMemo(() => {
    if (!club) return '';
    return club.groupName
      .split(' ')
      .filter((w) => w.length > 1)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 4);
  }, [club]);

  const ownerMember = useMemo(
    () => members.find((m) => m.role === 'Owner') || null,
    [members],
  );

  const featuredMembers = useMemo(
    () => members.filter((m) => m.status === 'Accepted').slice(0, 3),
    [members],
  );

  const rulesArray = useMemo(() => {
    if (!club?.rules) return [];
    return club.rules.split('|').map((r) => r.trim()).filter(Boolean);
  }, [club]);

  const createdAtFormatted = useMemo(() => {
    if (!club) return '';
    const d = new Date(club.createdAt);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }, [club]);

  const filledStars = useMemo(() => {
    if (!club) return 0;
    return Math.round(club.overallRating);
  }, [club]);

  const stats = useMemo(() => {
    if (!club) return [];
    return [
      { label: 'Thành viên', value: club.memberCount.toLocaleString(), icon: Users },
      { label: 'Bài viết', value: club.postCount.toLocaleString(), icon: Activity },
      { label: 'Tin nhắn', value: club.messageCount.toLocaleString(), icon: MessageCircle },
      { label: 'Đánh giá', value: club.overallRating.toFixed(1), icon: Trophy },
    ];
  }, [club]);

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'schedule', label: 'Lịch hoạt động' },
    { id: 'members', label: 'Thành viên' },
    { id: 'posts', label: 'Bài viết' },
  ];

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fbf4]" data-club-ui>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[16px] font-bold text-on-surface-variant">Đang tải thông tin CLB...</p>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fbf4]" data-club-ui>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[18px] font-bold text-on-surface">{error || 'Không tìm thấy câu lạc bộ.'}</p>
          <Link className="rounded-lg bg-primary px-6 py-3 text-[15px] font-bold text-white" to="/clubs">
            Quay lại danh sách CLB
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = club.coverImageUrl || 'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1800&auto=format&fit=crop';

  return (
    <div className="min-h-dvh bg-[#f8fbf4] text-[#0b2228]" data-club-ui>
      <section className="relative min-h-[440px] overflow-hidden bg-[#081d24] pt-[72px]" data-no-reveal>
        <img alt={club.groupName} className="absolute inset-0 h-full w-full object-cover" src={coverImage} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081d24] via-[#081d24]/62 to-[#081d24]/12" />

        <div className="relative z-10 mx-auto flex min-h-[368px] max-w-[1180px] flex-col justify-end px-4 pb-7 sm:px-6 lg:px-8">
          <Link
            className="mb-6 inline-flex h-9 w-fit items-center gap-2 rounded-lg border border-white/22 bg-white/8 px-3 text-[12px] font-bold text-white backdrop-blur hover:bg-white/14"
            to="/clubs"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại CLB
          </Link>

          <div className="max-w-4xl text-white">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-lg bg-[#e2ff57] px-3 py-1.5 text-[11px] font-bold text-[#102414]">
                <ShieldCheck className="h-4 w-4" />
                CLB đã xác thực
              </span>
              <span className="rounded-lg bg-white/12 px-3 py-1.5 text-[11px] font-bold backdrop-blur">
                {club.groupType}
              </span>
            </div>
            <h1 className="text-[32px] font-bold leading-[1.02] tracking-[-0.04em] md:text-[42px]">{club.groupName}</h1>
            {club.description && (
              <p className="mt-3 max-w-3xl text-[14px] leading-6 text-white/74 md:text-[15px]">
                {club.description}
              </p>
            )}

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              {isManager ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#e2ff57] px-4 text-[13px] font-bold text-[#102414] shadow-[0_10px_24px_rgba(152,217,81,0.2)] hover:bg-[#d6f64d]"
                  onClick={() => navigate(`/clubs/${id}/dashboard`)}
                  type="button"
                >
                  <Crown className="h-4 w-4" />
                  Quản lý CLB
                </button>
              ) : club.myStatus === 'Accepted' ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-white/90 px-4 text-[13px] font-bold text-[#0b2228] disabled:opacity-60"
                  onClick={handleJoinLeave}
                  disabled={actionLoading}
                  type="button"
                >
                  {actionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                  Đã tham gia (Rời CLB)
                </button>
              ) : club.myStatus === 'Pending' ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#fff8e6] px-4 text-[13px] font-bold text-[#7a5600] disabled:opacity-60"
                  onClick={handleJoinLeave}
                  disabled={actionLoading}
                  type="button"
                >
                  {actionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Clock className="h-5 w-5 text-[#7a5600]" />
                  )}
                  Đang chờ duyệt (Hủy)
                </button>
              ) : club.myStatus === 'Declined' ? (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#7a5600]/40 bg-[#fff8e6] px-4 text-[13px] font-bold text-[#7a5600] disabled:opacity-60"
                  onClick={handleJoinLeave}
                  disabled={actionLoading}
                  type="button"
                >
                  {actionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Clock className="h-5 w-5 text-[#7a5600]" />
                  )}
                  Đã yêu cầu · Gửi lại yêu cầu
                </button>
              ) : club.myStatus === 'Banned' ? (
                <span
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ffdad6] px-4 text-[13px] font-bold text-[#ba1a1a]"
                >
                  <XCircle className="h-5 w-5" />
                  Bị cấm khỏi CLB
                </span>
              ) : (
                <button
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#e2ff57] px-4 text-[13px] font-bold text-[#102414] shadow-[0_10px_24px_rgba(152,217,81,0.2)] hover:bg-[#d6f64d] disabled:opacity-60"
                  onClick={handleJoinLeave}
                  disabled={actionLoading}
                  type="button"
                >
                  {actionLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <UserPlus className="h-5 w-5" />
                  )}
                  Tham gia CLB
                </button>
              )}
              <button
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/24 bg-white/8 px-4 text-[13px] font-bold text-white backdrop-blur hover:bg-white/14"
                onClick={() => navigate('/book-court')}
                type="button"
              >
                <CalendarDays className="h-5 w-5" />
                Đặt lịch chơi
              </button>
              <button
                aria-label="Chia sẻ câu lạc bộ"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/24 bg-white/8 text-white backdrop-blur hover:bg-white/14"
                onClick={handleShare}
                type="button"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {stats.map((item) => (
            <div className="picklink-glow-surface rounded-xl border border-[#d8e4d4] bg-white p-4 shadow-[0_8px_22px_rgba(8,29,36,0.045)]" key={item.label}>
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]">
                <item.icon className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-bold text-[#64736a]">{item.label}</p>
              <p className="mt-1 text-[22px] font-bold leading-tight tracking-[-0.025em]">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            <div className="sticky top-[72px] z-30 overflow-x-auto border-b border-[#d8e4d4] bg-[#f8fbf4]/95 py-2 backdrop-blur">
              <div className="flex min-w-max gap-2">
                {tabs.map((tab) => (
                  <button
                    className={`h-9 rounded-lg px-3 text-[12px] font-bold transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#0b2228] text-white'
                        : 'text-[#64736a] hover:bg-[#edf5e9] hover:text-[#0b2228]'
                    }`}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-4">
                <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                  <h2 className="text-[18px] font-bold">Giới thiệu</h2>
                  <p className="mt-3 text-[14px] leading-6 text-[#64736a]">
                    {club.description || 'Chưa có mô tả.'}
                  </p>
                </section>

                {club.images.length > 0 && (
                  <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <h2 className="text-[18px] font-bold">Ảnh hoạt động</h2>
                      <span className="inline-flex items-center gap-2 text-[13px] font-bold text-primary">
                        <ImageIcon className="h-4 w-4" />
                        {club.images.length} ảnh
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                      {club.images.map((image, index) => (
                        <img
                          alt={image.caption || `Hoạt động CLB ${index + 1}`}
                          className="h-40 w-full rounded-xl object-cover transition-transform duration-300 hover:scale-[1.02]"
                          key={image.groupImageId}
                          src={image.imageUrl}
                        />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}

            {(activeTab === 'overview' || activeTab === 'schedule') && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[18px] font-bold">Lịch hoạt động sắp tới</h2>
                  <button className="h-9 w-fit rounded-lg border border-[#b9cbb3] px-3 text-[12px] font-bold text-[#477313] hover:bg-[#edf5e9]" type="button">
                    Xem lịch đầy đủ
                  </button>
                </div>
                <div className="flex items-center justify-center py-8 text-on-surface-variant">
                  <p className="text-[15px]">Chưa có lịch hoạt động nào được lên lịch.</p>
                </div>
              </section>
            )}

            {(activeTab === 'overview' || activeTab === 'members') && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[18px] font-bold">Thành viên nổi bật</h2>
                  <Link
                    className="inline-flex h-9 w-fit items-center rounded-lg border border-[#d8e4d4] px-3 text-[12px] font-bold hover:bg-[#edf5e9]"
                    to={`/clubs/${id}/members`}
                  >
                    Xem tất cả
                  </Link>
                </div>
                {featuredMembers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {featuredMembers.map((member) => (
                      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4" key={member.userId}>
                        <div className="flex items-center gap-3">
                          <img
                            alt={member.username}
                            className="h-12 w-12 rounded-full object-cover"
                            src={member.profileImageUrl || `https://i.pravatar.cc/160?u=${member.userId}`}
                          />
                          <div className="min-w-0">
                            <h3 className="truncate text-[15px] font-bold">{member.username}</h3>
                            <p className="text-[13px] font-bold text-primary">{member.role}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-[14px] text-on-surface-variant">
                          Tham gia {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-on-surface-variant">
                    <p className="text-[15px]">
                      {token ? 'Chưa có thành viên.' : 'Đăng nhập để xem thành viên CLB.'}
                    </p>
                  </div>
                )}
              </section>
            )}

            {(activeTab === 'overview' || activeTab === 'posts') && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="text-[18px] font-bold">Bảng tin CLB</h2>
                  {(club.myStatus === 'Accepted') && (
                    <Link
                      to={`/posts/create?visibility=club&groupId=${groupId}`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#0b2228] px-3 text-[12px] font-bold text-white hover:bg-[#143f34]"
                    >
                      <Activity className="h-4 w-4" />
                      Đăng bài
                    </Link>
                  )}
                </div>
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => {
                      let parsed: {
                        title?: string;
                        body?: string;
                        location?: string;
                        mode?: string;
                        lookingFor?: boolean;
                        slots?: string;
                        levelRange?: string;
                        playTime?: string;
                        matchId?: number | null;
                        tags?: string[];
                      } = {};
                      try {
                        const p = JSON.parse(post.content || '{}');
                        if (p && typeof p === 'object' && 'body' in p) {
                          parsed = p;
                        }
                      } catch {
                        parsed = { body: post.content || '' };
                      }

                      const postTitle = parsed.title || '';
                      const postBody = parsed.body || post.content || '';
                      const postTags = parsed.tags || [];
                      const postLocation = parsed.location || '';
                      const isPending = post.visibility === 'Pending';

                      const lookingForText = parsed.lookingFor && parsed.slots
                        ? `Cần ${parsed.slots} slot · Trình ${parsed.levelRange || '-'} · ${parsed.playTime || '-'}`
                        : null;

                      let formattedDate = '';
                      try {
                        formattedDate = new Intl.DateTimeFormat('vi-VN', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        }).format(new Date(post.createdAt));
                      } catch {
                        formattedDate = new Date(post.createdAt).toLocaleDateString('vi-VN');
                      }

                      return (
                        <article className="rounded-xl border border-outline-variant overflow-hidden" key={post.postId}>
                          <div className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <img
                                  alt={post.authorName}
                                  className="h-10 w-10 rounded-full object-cover shrink-0"
                                  src={post.authorAvatarUrl || `https://i.pravatar.cc/160?u=${post.authorId}`}
                                />
                                <div className="min-w-0">
                                  <h3 className="truncate text-[15px] font-bold text-on-surface">{post.authorName}</h3>
                                  <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] font-bold text-on-surface-variant">
                                    <span>{formattedDate}</span>
                                    {postLocation && (
                                      <span className="inline-flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {postLocation}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {isPending && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fff8e6] px-3 py-1 text-[11px] font-bold text-[#7a5600]">
                                    <Clock className="h-3 w-3" />
                                    Chờ duyệt
                                  </span>
                                )}
                                <MessageCircle className="h-5 w-5 text-on-surface-variant" />
                              </div>
                            </div>

                            {postTitle && (
                              <h4 className="mt-3 text-[17px] font-bold leading-6 text-on-surface">{postTitle}</h4>
                            )}
                            {postBody && (
                              <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{postBody}</p>
                            )}

                            {lookingForText && (
                              <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#cfe0c8] bg-[#edf6e9] p-3 text-[12px] font-extrabold text-[#365c16]">
                                <span className="flex items-start gap-2">
                                  <Users className="mt-0.5 h-4 w-4 shrink-0" />
                                  <span>{lookingForText}</span>
                                </span>
                                {parsed.matchId && (
                                  <Link
                                    to={`/matches/${parsed.matchId}`}
                                    className="inline-flex h-8 items-center rounded-lg bg-primary hover:bg-primary/90 px-3 py-1 text-[11px] font-black text-white transition-colors shrink-0"
                                  >
                                    Tham gia ngay
                                  </Link>
                                )}
                              </div>
                            )}

                            {postTags.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {postTags.map((tag) => (
                                  <span className="inline-flex items-center rounded-full bg-[#edf5e9] px-3 py-1 text-[12px] font-bold text-[#0b2228]" key={tag}>
                                    #{tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {post.mediaUrls.length > 0 && (
                            <div className={`${post.mediaUrls.length === 1 ? '' : 'grid grid-cols-2 gap-0.5'}`}>
                              {post.mediaUrls.map((url, i) => (
                                <img alt={`Media ${i + 1}`} className="h-48 w-full object-cover" key={url} src={url} />
                              ))}
                            </div>
                          )}

                          <div className="flex items-center justify-between gap-3 px-4 py-2 text-[12px] font-bold text-on-surface-variant border-t border-outline-variant">
                            <span className="inline-flex items-center gap-1.5">
                              <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                              {post.likeCount} lượt thích
                            </span>
                            <span>{post.commentCount} bình luận</span>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-on-surface-variant">
                    <p className="text-[15px]">
                      {token ? 'Chưa có bài viết nào.' : 'Đăng nhập để xem bài viết CLB.'}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0b2228] text-[15px] font-bold text-[#e2ff57]">
                  {shortName}
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#718077]">Thông tin CLB</p>
                  <h2 className="text-[15px] font-bold">{club.groupName}</h2>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-[12px]">
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#477313]" />
                  <div>
                    <p className="font-bold text-on-surface">Thành lập</p>
                    <p className="mt-1 text-on-surface-variant">{createdAtFormatted}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#477313]" />
                  <div>
                    <p className="font-bold text-on-surface">Thành viên</p>
                    <p className="mt-1 text-on-surface-variant">{club.memberCount} thành viên</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-[#477313]" />
                  <div>
                    <p className="font-bold text-on-surface">Loại nhóm</p>
                    <p className="mt-1 text-on-surface-variant">{club.groupType}</p>
                  </div>
                </div>
              </div>
            </section>

            {ownerMember && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="text-[16px] font-bold">Quản lý CLB</h2>
                <div className="mt-4 flex items-center gap-3">
                  <img
                    alt={ownerMember.username}
                    className="h-11 w-11 rounded-xl object-cover"
                    src={ownerMember.profileImageUrl || `https://i.pravatar.cc/160?u=${ownerMember.userId}`}
                  />
                  <div>
                    <p className="font-bold text-on-surface">{ownerMember.username}</p>
                    <p className="text-[13px] font-medium text-on-surface-variant">Chủ nhiệm CLB</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-[#d8e4d4] px-2.5 text-[11px] font-bold hover:bg-[#edf5e9]" type="button">
                    <Phone className="h-4 w-4" />
                    Gọi
                  </button>
                  <button className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#0b2228] px-2.5 text-[11px] font-bold text-white hover:bg-[#143f34]" type="button">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </button>
                </div>
                <Link
                  className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#b9cbb3] px-3 text-[12px] font-bold text-[#477313] hover:bg-[#edf5e9]"
                  to={`/clubs/${id}/dashboard`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Mở quản lý CLB
                </Link>
              </section>
            )}

            {!ownerMember && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="text-[16px] font-bold">Quản lý CLB</h2>
                <p className="mt-4 text-[14px] text-on-surface-variant">{club.ownerName}</p>
                <Link
                  className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#b9cbb3] px-3 text-[12px] font-bold text-[#477313] hover:bg-[#edf5e9]"
                  to={`/clubs/${id}/dashboard`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Mở quản lý CLB
                </Link>
              </section>
            )}

            {rulesArray.length > 0 && (
              <section className="rounded-xl border border-[#dbe8cf] bg-[#edf5e9] p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-[16px] font-bold">
                  <Crown className="h-4 w-4 text-[#477313]" />
                  Quy định nhanh
                </h2>
                <ul className="mt-4 space-y-3">
                  {rulesArray.map((rule) => (
                    <li className="flex gap-2 text-[14px] font-medium text-on-surface-variant" key={rule}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="mb-3 text-[16px] font-bold">Đánh giá cộng đồng</h2>
              <div className="flex items-end gap-3">
                <span className="text-[30px] font-bold leading-none">
                  {club.overallRating.toFixed(1)}
                </span>
                <div className="pb-1">
                  <div className="flex text-primary-container">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        className={`h-4 w-4 ${index < filledStars ? 'fill-current' : ''}`}
                        key={index}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[13px] font-bold text-on-surface-variant">
                    {club.ratingCount} lượt đánh giá
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};
