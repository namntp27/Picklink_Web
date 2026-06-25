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
} from 'lucide-react';
import { XCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
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
      alert(err.message || 'Không thể thực hiện yêu cầu.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      alert('Đã sao chép liên kết câu lạc bộ vào bộ nhớ tạm!');
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
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9ff]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[16px] font-bold text-on-surface-variant">Đang tải thông tin CLB...</p>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f9f9ff]">
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
    <div className="min-h-screen bg-[#f9f9ff] font-body-md text-on-surface">
      <section className="relative min-h-[520px] overflow-hidden bg-[#101820] pt-[72px]">
        <img alt={club.groupName} className="absolute inset-0 h-full w-full object-cover" src={coverImage} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-[#101820]/62 to-[#101820]/12" />

        <div className="relative z-10 mx-auto flex min-h-[448px] max-w-container-max-width flex-col justify-end px-margin-mobile pb-8 md:px-margin-desktop">
          <Link
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-[14px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
            to="/clubs"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại CLB
          </Link>

          <div className="max-w-4xl text-white">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-[13px] font-bold text-on-primary-container">
                <ShieldCheck className="h-4 w-4" />
                CLB đã xác thực
              </span>
              <span className="rounded-full bg-white/14 px-4 py-2 text-[13px] font-bold backdrop-blur">
                {club.groupType}
              </span>
            </div>
            <h1 className="text-[34px] font-bold leading-tight md:text-[48px]">{club.groupName}</h1>
            {club.description && (
              <p className="mt-4 max-w-3xl text-[17px] leading-7 text-white/90 md:text-[18px]">
                {club.description}
              </p>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              {isManager ? (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-[15px] font-bold text-on-primary-container shadow-lg transition-transform hover:scale-[0.98]"
                  onClick={() => navigate(`/clubs/${id}/dashboard`)}
                  type="button"
                >
                  <Crown className="h-5 w-5" />
                  Quản lý CLB
                </button>
              ) : club.myStatus === 'Accepted' ? (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-surface-container-high px-6 py-3 text-[15px] font-bold text-on-surface transition-transform hover:scale-[0.98] disabled:opacity-60"
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
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#fff8e6] px-6 py-3 text-[15px] font-bold text-[#7a5600] transition-transform hover:scale-[0.98] disabled:opacity-60"
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
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#fff8e6] border border-[#7a5600]/40 px-6 py-3 text-[15px] font-bold text-[#7a5600] transition-transform hover:scale-[0.98] disabled:opacity-60"
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
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#ffdad6] px-6 py-3 text-[15px] font-bold text-[#ba1a1a]"
                >
                  <XCircle className="h-5 w-5" />
                  Bị cấm khỏi CLB
                </span>
              ) : (
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-[15px] font-bold text-on-primary-container shadow-lg transition-transform hover:scale-[0.98] disabled:opacity-60"
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
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/12 px-6 py-3 text-[15px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
                onClick={() => navigate('/book-court')}
                type="button"
              >
                <CalendarDays className="h-5 w-5" />
                Đặt lịch chơi
              </button>
              <button
                aria-label="Chia sẻ câu lạc bộ"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/12 px-4 py-3 text-white backdrop-blur transition-colors hover:bg-white/20"
                onClick={handleShare}
                type="button"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-container-max-width px-margin-mobile py-8 md:px-margin-desktop">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-gutter">
          {stats.map((item) => (
            <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm" key={item.label}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f3ff] text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-[13px] font-bold text-on-surface-variant">{item.label}</p>
              <p className="mt-1 text-[24px] font-bold leading-tight text-on-surface">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-gutter lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <div className="sticky top-[72px] z-30 overflow-x-auto border-b border-outline-variant bg-[#f9f9ff]/95 py-2 backdrop-blur">
              <div className="flex min-w-max gap-2">
                {tabs.map((tab) => (
                  <button
                    className={`rounded-lg px-4 py-2 text-[14px] font-bold transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
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
              <div className="space-y-6">
                <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                  <h2 className="text-[24px] font-bold text-on-surface">Giới thiệu</h2>
                  <p className="mt-4 text-[16px] leading-7 text-on-surface-variant">
                    {club.description || 'Chưa có mô tả.'}
                  </p>
                </section>

                {club.images.length > 0 && (
                  <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <h2 className="text-[24px] font-bold text-on-surface">Ảnh hoạt động</h2>
                      <span className="inline-flex items-center gap-2 text-[13px] font-bold text-primary">
                        <ImageIcon className="h-4 w-4" />
                        {club.images.length} ảnh
                      </span>
                    </div>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      {club.images.map((image, index) => (
                        <img
                          alt={image.caption || `Hoạt động CLB ${index + 1}`}
                          className="h-48 w-full rounded-lg object-cover"
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
                  <h2 className="text-[24px] font-bold text-on-surface">Lịch hoạt động sắp tới</h2>
                  <button className="w-fit rounded-lg border border-primary px-4 py-2 text-[14px] font-bold text-primary hover:bg-primary/5" type="button">
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
                  <h2 className="text-[24px] font-bold text-on-surface">Thành viên nổi bật</h2>
                  <Link
                    className="w-fit rounded-lg border border-outline-variant px-4 py-2 text-[14px] font-bold text-on-surface hover:bg-surface-container-low"
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
                <h2 className="mb-5 text-[24px] font-bold text-on-surface">Bảng tin CLB</h2>
                {posts.length > 0 ? (
                  <div className="space-y-4">
                    {posts.map((post) => (
                      <article className="rounded-lg border border-outline-variant p-4" key={post.postId}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <img
                              alt={post.authorName}
                              className="h-10 w-10 rounded-full object-cover"
                              src={post.authorAvatarUrl || `https://i.pravatar.cc/160?u=${post.authorId}`}
                            />
                            <div>
                              <h3 className="text-[15px] font-bold text-on-surface">{post.authorName}</h3>
                              <p className="mt-0.5 text-[13px] font-bold text-primary">
                                {new Date(post.createdAt).toLocaleDateString('vi-VN')} · {post.likeCount} lượt thích · {post.commentCount} bình luận
                              </p>
                            </div>
                          </div>
                          <MessageCircle className="h-5 w-5 shrink-0 text-on-surface-variant" />
                        </div>
                        {post.content && (
                          <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">{post.content}</p>
                        )}
                        {post.mediaUrls.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-2">
                            {post.mediaUrls.map((url, i) => (
                              <img alt={`Media ${i + 1}`} className="h-32 w-full rounded-lg object-cover" key={url} src={url} />
                            ))}
                          </div>
                        )}
                      </article>
                    ))}
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

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-[24px] font-bold text-white">
                  {shortName}
                </div>
                <div>
                  <p className="text-[13px] font-bold uppercase text-on-surface-variant">Thông tin CLB</p>
                  <h2 className="text-[20px] font-bold text-on-surface">{club.groupName}</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-[14px]">
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-bold text-on-surface">Thành lập</p>
                    <p className="mt-1 text-on-surface-variant">{createdAtFormatted}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-bold text-on-surface">Thành viên</p>
                    <p className="mt-1 text-on-surface-variant">{club.memberCount} thành viên</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-bold text-on-surface">Loại nhóm</p>
                    <p className="mt-1 text-on-surface-variant">{club.groupType}</p>
                  </div>
                </div>
              </div>
            </section>

            {ownerMember && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="text-[20px] font-bold text-on-surface">Quản lý CLB</h2>
                <div className="mt-4 flex items-center gap-3">
                  <img
                    alt={ownerMember.username}
                    className="h-14 w-14 rounded-full object-cover"
                    src={ownerMember.profileImageUrl || `https://i.pravatar.cc/160?u=${ownerMember.userId}`}
                  />
                  <div>
                    <p className="font-bold text-on-surface">{ownerMember.username}</p>
                    <p className="text-[13px] font-medium text-on-surface-variant">Chủ nhiệm CLB</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[14px] font-bold hover:bg-surface-container-low" type="button">
                    <Phone className="h-4 w-4" />
                    Gọi
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-[14px] font-bold text-white hover:bg-primary/90" type="button">
                    <MessageCircle className="h-4 w-4" />
                    Chat
                  </button>
                </div>
                <Link
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                  to={`/clubs/${id}/dashboard`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Mở quản lý CLB
                </Link>
              </section>
            )}

            {!ownerMember && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="text-[20px] font-bold text-on-surface">Quản lý CLB</h2>
                <p className="mt-4 text-[14px] text-on-surface-variant">{club.ownerName}</p>
                <Link
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                  to={`/clubs/${id}/dashboard`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Mở quản lý CLB
                </Link>
              </section>
            )}

            {rulesArray.length > 0 && (
              <section className="rounded-xl border border-outline-variant bg-[#f0f3ff] p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-[20px] font-bold text-on-surface">
                  <Crown className="h-5 w-5 text-primary" />
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
              <h2 className="mb-4 text-[20px] font-bold text-on-surface">Đánh giá cộng đồng</h2>
              <div className="flex items-end gap-3">
                <span className="text-[40px] font-bold leading-none text-on-surface">
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
