import React, { useCallback, useMemo, useState } from 'react';
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
  Loader2,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  UserPlus,
  Users,
  UserRound,
  ThumbsUp,
} from 'lucide-react';
import { XCircle } from 'lucide-react';
import './club-pages.css';
import { useAuth } from '../../auth/AuthContext';
import { useApiQuery } from '../../hooks/useApiQuery';
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
  reactToPost,
  removeReaction,
} from '../../api/community';
import { PlayerHoverCard } from '../matches/components/PlayerHoverCard';
import { PostCard, toDisplayPost, type DisplayPost } from '../community/Posts';

type DetailTab = 'members' | 'posts';

const emptyMembers: CommunityMember[] = [];
const emptyPosts: CommunityPost[] = [];

const ClubPlayerAvatar = ({ imageUrl, playerId, playerName, size = 'h-12 w-12' }: {
  imageUrl?: string | null;
  playerId?: number | null;
  playerName: string;
  size?: string;
}) => {
  const avatar = imageUrl ? (
    <img alt="" className={`${size} rounded-xl object-cover`} decoding="async" loading="lazy" src={imageUrl} />
  ) : (
    <span className={`flex ${size} shrink-0 items-center justify-center rounded-xl bg-[#e0e9dc] text-[#477313]`}>
      <UserRound aria-hidden="true" className="h-5 w-5" />
    </span>
  );

  return playerId ? (
    <PlayerHoverCard playerId={playerId} playerName={playerName}>{avatar}</PlayerHoverCard>
  ) : avatar;
};
const emptyDetail: {
  club: CommunityGroup | null;
  members: CommunityMember[];
  posts: CommunityPost[];
} = { club: null, members: emptyMembers, posts: emptyPosts };

export const ClubDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuth();
  const notify = useToast();
  const [activeTab, setActiveTab] = useState<DetailTab>('posts');

  const [actionLoading, setActionLoading] = useState(false);

  const groupId = Number(id);
  const hasValidId = Boolean(groupId) && !Number.isNaN(groupId);

  const { data, error: loadError, loading, setData } = useApiQuery(
    ['club-detail', groupId, token],
    async () => {
      const group = await getGroup(groupId, token);
      const canViewPrivateClub = group.groupType !== 'Private'
        || group.myStatus === 'Accepted'
        || ['Owner', 'Admin', 'Moderator'].includes(group.myRole || '');
      if (!canViewPrivateClub) return { club: group, members: emptyMembers, posts: emptyPosts };
      const [members, posts] = await Promise.all([
        token ? getGroupMembers(token, groupId).catch(() => emptyMembers) : Promise.resolve(emptyMembers),
        token ? getGroupPosts(token, groupId).catch(() => emptyPosts) : Promise.resolve(emptyPosts),
      ]);
      return { club: group, members, posts };
    },
    { enabled: hasValidId, errorMessage: 'Không thể tải thông tin câu lạc bộ.' },
  );

  const club = data?.club ?? null;
  const members = data?.members ?? emptyMembers;
  const posts = data?.posts ?? emptyPosts;
  const error = hasValidId ? (loadError || null) : 'ID câu lạc bộ không hợp lệ.';

  const setClub = useCallback((updated: CommunityGroup) => {
    setData((current) => ({ ...(current ?? emptyDetail), club: updated }));
  }, [setData]);

  const setMembers = useCallback((updated: CommunityMember[]) => {
    setData((current) => ({ ...(current ?? emptyDetail), members: updated }));
  }, [setData]);

  const setPosts = useCallback((updated: CommunityPost[]) => {
    setData((current) => ({ ...(current ?? emptyDetail), posts: updated }));
  }, [setData]);

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

    if (club.myStatus === 'Accepted'
      && !window.confirm(`Rời câu lạc bộ “${club.groupName}”?`)) return;
    if (club.myStatus === 'Pending'
      && !window.confirm(`Hủy yêu cầu tham gia câu lạc bộ “${club.groupName}”?`)) return;

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

  const privateClubRestricted = club?.groupType === 'Private'
    && club.myStatus !== 'Accepted'
    && !isManager;

  if (club && privateClubRestricted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fbf4] px-4 text-[#0b2228]" data-club-ui>
        <main className="w-full max-w-xl rounded-2xl border border-[#d8e4d4] bg-white p-6 text-center shadow-[0_12px_30px_rgba(8,29,36,0.06)]">
          <Link className="mb-6 inline-flex items-center gap-2 text-[12px] font-bold text-[#477313]" to="/clubs">
            <ArrowLeft className="h-4 w-4" />
            Quay lại CLB
          </Link>
          <ShieldCheck className="mx-auto h-10 w-10 text-[#477313]" />
          <h1 className="mt-3 text-[24px] font-bold">{club.groupName}</h1>
          <p className="mt-2 text-[14px] text-[#64736a]">CLB riêng tư. Bạn cần gửi yêu cầu và được duyệt để xem chi tiết.</p>
          <div className="mt-5 flex justify-center">
            {!token ? (
              <button className="inline-flex h-10 items-center justify-center rounded-lg bg-[#e2ff57] px-4 text-[13px] font-bold text-[#102414]" onClick={() => navigate('/login')} type="button">
                Đăng nhập để gửi yêu cầu
              </button>
            ) : club.myStatus === 'Pending' ? (
              <button className="inline-flex h-10 items-center justify-center rounded-lg bg-[#fff8e6] px-4 text-[13px] font-bold text-[#7a5600] disabled:opacity-60" disabled={actionLoading} onClick={handleJoinLeave} type="button">
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Hủy yêu cầu
              </button>
            ) : club.myStatus === 'Banned' ? (
              <span className="inline-flex h-10 items-center rounded-lg bg-[#ffdad6] px-4 text-[13px] font-bold text-[#ba1a1a]">Bị cấm khỏi CLB</span>
            ) : (
              <button className="inline-flex h-10 items-center justify-center rounded-lg bg-[#e2ff57] px-4 text-[13px] font-bold text-[#102414] disabled:opacity-60" disabled={actionLoading} onClick={handleJoinLeave} type="button">
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gửi yêu cầu tham gia
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  const handlePostLike = async (postId: string) => {
    if (!token) {
      navigate('/login');
      return;
    }

    const post = posts.find((item) => item.postId === Number(postId));
    if (!post) return;

    const previous = post;
    const optimistic = {
      ...post,
      likedByMe: !post.likedByMe,
      likeCount: post.likedByMe ? Math.max(0, post.likeCount - 1) : post.likeCount + 1,
    };
    setPosts(posts.map((item) => item.postId === post.postId ? optimistic : item));

    try {
      const updated = post.likedByMe
        ? await removeReaction(token, post.postId)
        : await reactToPost(token, post.postId);
      setPosts(posts.map((item) => item.postId === post.postId ? updated : item));
    } catch (reason) {
      setPosts(posts.map((item) => item.postId === post.postId ? previous : item));
      notify(reason instanceof Error ? reason.message : 'Không thể cập nhật lượt thích.', 'error');
    }
  };

  const handlePostShare = async (post: DisplayPost) => {
    const url = new URL(`/posts/${post.id}`, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({ title: club?.groupName || 'Bài viết CLB', url });
      } else {
        await navigator.clipboard.writeText(url);
        notify('Đã sao chép liên kết bài viết.', 'success');
      }
    } catch (reason) {
      if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
        notify(reason instanceof Error ? reason.message : 'Không thể chia sẻ bài viết.', 'error');
      }
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

  const acceptedMembers = useMemo(
    () => members.filter((member) => member.status === 'Accepted'),
    [members],
  );
  const visibleMembers = acceptedMembers;

  const rulesArray = useMemo(() => {
    if (!club?.rules) return [];
    return club.rules.split('|').map((r) => r.trim()).filter(Boolean);
  }, [club]);

  const createdAtFormatted = useMemo(() => {
    if (!club) return '';
    const d = new Date(club.createdAt);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  }, [club]);

  const stats = useMemo(() => {
    if (!club) return [];
    return [
      { label: 'Thành viên', value: club.memberCount.toLocaleString(), icon: Users },
      { label: 'Bài viết', value: club.postCount.toLocaleString(), icon: Activity },
      { label: 'Tin nhắn', value: club.messageCount.toLocaleString(), icon: MessageCircle },
    ];
  }, [club]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fbf4]" data-club-ui>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-[#477313]" />
          <p className="text-[16px] font-bold text-[#64736a]">Đang tải thông tin CLB...</p>
        </div>
      </div>
    );
  }

  if (error || !club) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fbf4]" data-club-ui>
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-[18px] font-bold text-[#0b2228]">{error || 'Không tìm thấy câu lạc bộ.'}</p>
          <Link className="rounded-lg bg-primary px-6 py-3 text-[15px] font-bold text-white" to="/clubs">
            Quay lại danh sách CLB
          </Link>
        </div>
      </div>
    );
  }

  const coverImage = club.coverImageUrl;

  return (
    <div className="min-h-dvh bg-[#f8fbf4] text-[#0b2228]" data-club-ui>
      <section className="relative min-h-[440px] overflow-hidden bg-[#081d24] pt-[72px]" data-no-reveal>
        {coverImage && (
          <img alt="" className="absolute inset-0 h-full w-full object-cover" src={coverImage} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#081d24] via-[#081d24]/62 to-[#081d24]/12" />

        <div className="relative z-10 mx-auto flex min-h-[368px] max-w-[1180px] flex-col justify-end px-4 pb-16 sm:px-6 lg:px-8">
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
                    <CheckCircle2 className="h-5 w-5 text-[#0b2228]" />
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
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.map((item) => (
            item.icon === Users ? (
              <button
                aria-label="Xem thành viên CLB"
                className="picklink-glow-surface flex min-h-16 items-center gap-2.5 rounded-xl border border-[#d8e4d4] bg-white px-3 py-2.5 text-left shadow-[0_6px_16px_rgba(8,29,36,0.04)] hover:border-[#9fbe91] hover:bg-[#fbfdf9]"
                key={item.label}
                onClick={() => setActiveTab((current) => current === 'members' ? 'posts' : 'members')}
                type="button"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]">
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-[#64736a]">{item.label}</p>
                  <p className="text-[17px] font-bold leading-tight tracking-[-0.025em]">{item.value}</p>
                </div>
              </button>
            ) : item.icon === MessageCircle ? (
              <button
                aria-label="Mở tin nhắn CLB"
                className="picklink-glow-surface flex min-h-16 items-center gap-2.5 rounded-xl border border-[#d8e4d4] bg-white px-3 py-2.5 text-left shadow-[0_6px_16px_rgba(8,29,36,0.04)] hover:border-[#9fbe91] hover:bg-[#fbfdf9]"
                key={item.label}
                onClick={() => navigate(`/messages?chat=club-group-${groupId}`)}
                type="button"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]">
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-[#64736a]">{item.label}</p>
                  <p className="text-[17px] font-bold leading-tight tracking-[-0.025em]">{item.value}</p>
                </div>
              </button>
            ) : (
              <div className="picklink-glow-surface flex min-h-16 items-center gap-2.5 rounded-xl border border-[#d8e4d4] bg-white px-3 py-2.5 shadow-[0_6px_16px_rgba(8,29,36,0.04)]" key={item.label}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]">
                  <item.icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-[#64736a]">{item.label}</p>
                  <p className="text-[17px] font-bold leading-tight tracking-[-0.025em]">{item.value}</p>
                </div>
              </div>
            )
          ))}
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0 space-y-4">
            {activeTab === 'members' && (
              <section className="rounded-2xl border border-[#d8e4d4] bg-white p-6 shadow-[0_10px_28px_rgba(8,29,36,0.055)]">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[18px] font-bold">Thành viên nổi bật</h2>
                </div>
                {visibleMembers.length > 0 ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {visibleMembers.map((member) => (
                      <div className="rounded-lg border border-[#e3ece0] bg-[#fbfdf9] p-4" key={member.userId}>
                        <div className="flex items-center gap-3">
                          <ClubPlayerAvatar
                            imageUrl={member.profileImageUrl}
                            playerId={member.playerId}
                            playerName={member.username}
                          />
                          <div className="min-w-0">
                            <h3 className="truncate text-[15px] font-bold">{member.username}</h3>
                            <p className="text-[13px] font-bold text-[#477313]">{member.role}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-[14px] text-[#64736a]">
                          Tham gia {new Date(member.joinedAt).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-[#64736a]">
                    <p className="text-[15px]">
                      {token ? 'Chưa có thành viên.' : 'Đăng nhập để xem thành viên CLB.'}
                    </p>
                  </div>
                )}
              </section>
            )}

            {activeTab === 'posts' && (
              <section className="rounded-2xl border border-[#d8e4d4] bg-white p-6 shadow-[0_10px_28px_rgba(8,29,36,0.055)]">
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
                      const displayPost = toDisplayPost(post);
                      return (
                        <PostCard
                          enableInlineComments
                          key={post.postId}
                          onCommentCreated={(postId) => setPosts(posts.map((item) => item.postId === Number(postId)
                            ? { ...item, commentCount: item.commentCount + 1 }
                            : item))}
                          onLikeToggle={(postId) => void handlePostLike(postId)}
                          onShareClick={(sharedPost) => void handlePostShare(sharedPost)}
                          post={displayPost}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-8 text-[#64736a]">
                    <p className="text-[15px]">
                      {token ? 'Chưa có bài viết nào.' : 'Đăng nhập để xem bài viết CLB.'}
                    </p>
                  </div>
                )}
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border border-[#d8e4d4] bg-white p-6 shadow-[0_10px_28px_rgba(8,29,36,0.055)]">
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
                    <p className="font-bold text-[#0b2228]">Thành lập</p>
                    <p className="mt-1 text-[#64736a]">{createdAtFormatted}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Users className="mt-0.5 h-4 w-4 shrink-0 text-[#477313]" />
                  <div>
                    <p className="font-bold text-[#0b2228]">Thành viên</p>
                    <p className="mt-1 text-[#64736a]">{club.memberCount} thành viên</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Award className="mt-0.5 h-4 w-4 shrink-0 text-[#477313]" />
                  <div>
                    <p className="font-bold text-[#0b2228]">Loại nhóm</p>
                    <p className="mt-1 text-[#64736a]">{club.groupType}</p>
                  </div>
                </div>
              </div>
            </section>

            {ownerMember && (
              <section className="rounded-2xl border border-[#d8e4d4] bg-white p-6 shadow-[0_10px_28px_rgba(8,29,36,0.055)]">
                <h2 className="text-[16px] font-bold">Chủ nhiệm CLB</h2>
                <div className="mt-4 flex items-center gap-3">
                  <ClubPlayerAvatar
                    imageUrl={ownerMember.profileImageUrl}
                    playerId={ownerMember.playerId || club.ownerPlayerId}
                    playerName={ownerMember.username}
                    size="h-11 w-11"
                  />
                  <div>
                    <p className="font-bold text-[#0b2228]">{ownerMember.username}</p>
                    <p className="text-[13px] font-medium text-[#64736a]">Chủ nhiệm CLB</p>
                  </div>
                </div>
                <Link
                  className="mt-5 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[#0b2228] px-3 text-[12px] font-bold text-white hover:bg-[#143f34]"
                  to={'/messages?chatWithUserId=' + ownerMember.userId}
                >
                  <MessageCircle className="h-4 w-4" />
                  Nhắn tin
                </Link>
                {isManager && (
                  <Link
                    className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#b9cbb3] px-3 text-[12px] font-bold text-[#477313] hover:bg-[#edf5e9]"
                    to={'/clubs/' + id + '/dashboard'}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Mở quản lý CLB
                  </Link>
                )}
              </section>
            )}

            {!ownerMember && (
              <section className="rounded-2xl border border-[#d8e4d4] bg-white p-6 shadow-[0_10px_28px_rgba(8,29,36,0.055)]">
                <h2 className="text-[16px] font-bold">Quản lý CLB</h2>
                <div className="mt-4">
                  <PlayerHoverCard playerId={club.ownerPlayerId} playerName={club.ownerName}>
                    <span className="text-[14px] text-[#64736a]">{club.ownerName}</span>
                  </PlayerHoverCard>
                </div>
                {isManager && (
                  <Link
                    className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-[#b9cbb3] px-3 text-[12px] font-bold text-[#477313] hover:bg-[#edf5e9]"
                    to={'/clubs/' + id + '/dashboard'}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Mở quản lý CLB
                  </Link>
                )}
              </section>
            )}

            {rulesArray.length > 0 && (
              <section className="rounded-2xl border border-[#dbe8cf] bg-[#edf5e9] p-6 shadow-[0_10px_28px_rgba(8,29,36,0.04)]">
                <h2 className="flex items-center gap-2 text-[16px] font-bold">
                  <Crown className="h-4 w-4 text-[#477313]" />
                  Quy định nhanh
                </h2>
                <ul className="mt-4 space-y-3">
                  {rulesArray.map((rule) => (
                    <li className="flex gap-2 text-[14px] font-medium text-[#64736a]" key={rule}>
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#477313]" />
                      {rule}
                    </li>
                  ))}
                </ul>
              </section>
            )}

          </aside>
        </div>
      </main>
    </div>
  );
};
