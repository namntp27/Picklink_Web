import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Plus,
  Send,
  Share2,
  ThumbsUp,
  UserPlus,
  UserRound,
  Users,
  Loader2,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { getMyProfile, type PlayerProfile } from '../../api/profile';
import {
  getGlobalPost,
  getGlobalPosts,
  reactToPost,
  removeReaction,
  getFriendshipStatuses,
  getFriendRequests,
  getPostComments,
  createComment,
  type CommunityComment,
  type FriendshipStatus,
  type FriendRequest,
} from '../../api/community';
import { CommunityFeedShell, CommunityPage } from './CommunityUI';
import { FriendButton } from './components/FriendButton';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useToast } from '../../components/ui/ToastRegion';
import { useNotificationRealtime } from '../../hooks/useNotificationRealtime';
import { PlayerHoverCard } from '../matches/components/PlayerHoverCard';

export interface DisplayPost {
  id: string;
  authorId?: number;
  authorPlayerId?: number | null;
  authorName: string;
  avatar: string;
  level: string;
  location: string;
  createdAt: string;
  title: string;
  content: string;
  image?: string;
  tags: string[];
  lookingFor?: string;
  likes: number;
  comments: number;
  liked: boolean;
  matchId?: number | null;
  groupName?: string;
  groupId?: number | null;
}

export const parsePostContent = (rawContent: string | null) => {
  if (!rawContent) {
    return { title: '', body: '' };
  }
  try {
    const parsed = JSON.parse(rawContent);
    if (parsed && typeof parsed === 'object' && 'body' in parsed) {
      return {
        title: parsed.title || '',
        body: parsed.body || '',
        location: parsed.location,
        mode: parsed.mode,
        lookingFor: parsed.lookingFor,
        slots: parsed.slots,
        levelRange: parsed.levelRange,
        playTime: parsed.playTime,
        matchId: parsed.matchId,
        tags: parsed.tags,
      };
    }
  } catch {
    // Ignore, falls through to plaintext
  }
  return { title: '', body: rawContent };
};

const emptyPosts: DisplayPost[] = [];
const pageSize = 10;

const inlineCommentText = (comment: CommunityComment) => {
  try {
    const parsed = JSON.parse(comment.content);
    return typeof parsed?.text === 'string' ? parsed.text : comment.content;
  } catch {
    return comment.content;
  }
};

export const toDisplayPost = (post: Awaited<ReturnType<typeof getGlobalPosts>>[number]): DisplayPost => {
  const parsed = parsePostContent(post.content);

  let formattedDate = 'Vừa xong';
  try {
    formattedDate = new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(post.createdAt));
  } catch {
    // Ignore date format error
  }

  return {
    id: String(post.postId),
    authorId: post.authorId,
    authorPlayerId: post.authorPlayerId,
    authorName: post.authorName || 'Thành viên Picklink',
    avatar: post.authorAvatarUrl || '',
    level: '',
    location: parsed.location || '',
    createdAt: formattedDate,
    title: parsed.title || 'Bài viết',
    content: typeof parsed.body === 'string' ? parsed.body : '',
    image: post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : undefined,
    tags: Array.isArray(parsed.tags) ? parsed.tags.filter((tag): tag is string => typeof tag === 'string') : [],
    lookingFor: parsed.lookingFor && parsed.slots
      ? `Cần ${parsed.slots} slot · Trình ${parsed.levelRange || '-'} · ${parsed.playTime || '-'}`
      : undefined,
    likes: post.likeCount || 0,
    comments: post.commentCount || 0,
    liked: post.likedByMe || false,
    matchId: parsed.matchId,
    groupId: post.groupId,
    groupName: post.groupName || undefined,
  };
};

export const PostCard = ({
  post,
  friendshipStatus,
  onFriendStatusChange,
  onLikeToggle,
  onShareClick,
  onCommentCreated,
  enableInlineComments = false,
}: {
  post: DisplayPost;
  friendshipStatus?: FriendshipStatus;
  onFriendStatusChange?: (authorId: number, status: FriendshipStatus) => void;
  onLikeToggle?: (postId: string) => void;
  onShareClick?: (post: DisplayPost) => void;
  onCommentCreated?: (postId: string) => void;
  enableInlineComments?: boolean;
}) => {
  const [, setSearchParams] = useSearchParams();
  const { token } = useAuth();
  const notify = useToast();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [inlineComments, setInlineComments] = useState<CommunityComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  const toggleComments = async () => {
    const nextOpen = !commentsOpen;
    setCommentsOpen(nextOpen);
    if (!nextOpen || !token || inlineComments.length > 0) return;

    setLoadingComments(true);
    try {
      setInlineComments(await getPostComments(Number(post.id), token));
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : 'Không thể tải bình luận.', 'error');
    } finally {
      setLoadingComments(false);
    }
  };

  const submitInlineComment = async () => {
    const content = commentDraft.trim();
    if (!token || !content || submittingComment) return;

    setSubmittingComment(true);
    try {
      const created = await createComment(token, Number(post.id), content);
      setInlineComments((current) => [...current, created]);
      setCommentDraft('');
      onCommentCreated?.(post.id);
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : 'Không thể đăng bình luận.', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    if (!commentsOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setCommentsOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [commentsOpen]);

  const authorAvatar = (
    <Link aria-label={'Xem bài viết của ' + post.authorName} to={'/posts/' + post.id}>
      {post.avatar ? (
        <img alt="" className="community-avatar" decoding="async" loading="lazy" src={post.avatar} />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e0e9dc] text-[#477313]">
          <UserRound aria-hidden="true" className="h-5 w-5" />
        </span>
      )}
    </Link>
  );

  return (
    <article className="community-card community-post-card overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            {post.authorPlayerId ? (
              <PlayerHoverCard playerId={post.authorPlayerId} playerName={post.authorName}>{authorAvatar}</PlayerHoverCard>
            ) : authorAvatar}
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-extrabold text-[#0b2228]">{post.authorName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-[#718077]">
                {post.level && <span className="community-badge !min-h-5 !px-2 !py-1">Trình độ {post.level}</span>}
                {post.groupName && post.groupId && (
                  <Link to={`/clubs/${post.groupId}`} className="community-badge !min-h-5 !px-2 !py-1 !bg-[#477313]/10 !text-[#477313] hover:bg-[#477313]/20 transition-colors font-extrabold">
                    CLB: {post.groupName}
                  </Link>
                )}
                <span>{post.createdAt}</span>
                {post.location && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin aria-hidden="true" className="h-3 w-3" />
                    {post.location}
                  </span>
                )}
              </div>
            </div>
          </div>

          {post.authorId && (
            <FriendButton
              className="shrink-0"
              onStatusChange={(newStatus) => onFriendStatusChange?.(post.authorId!, newStatus)}
              status={friendshipStatus}
              targetUserId={post.authorId}
              targetUserName={post.authorName}
            />
          )}
        </div>

        <Link className="mt-4 block" to={`/posts/${post.id}`}>
          <h3 className="text-[17px] font-extrabold leading-6 tracking-[-0.015em] text-[#0b2228] transition-colors hover:text-[#477313]">
            {post.title}
          </h3>
          <p className="mt-2 text-[13px] leading-6 text-[#526158]">{post.content}</p>
        </Link>

        {post.lookingFor && (
          <div className="community-post-card__looking-for mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#cfe0c8] bg-[#edf6e9] p-3 text-[12px] font-extrabold text-[#365c16]">
            <span className="flex items-start gap-2">
              <Users aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{post.lookingFor}</span>
            </span>
            {post.matchId && (
              <Link
                to={`/matches/${post.matchId}`}
                className="inline-flex h-8 items-center rounded-lg bg-[#477313] hover:bg-[#3b5d0f] px-3 py-1 text-[11px] font-black text-white transition-colors shrink-0"
              >
                Tham gia ngay
              </Link>
            )}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <button
              className="community-badge text-[#526158] hover:bg-[#477313]/10 hover:text-[#477313] transition-colors cursor-pointer"
              key={tag}
              onClick={() => setSearchParams({ search: `#${tag}` })}
              type="button"
            >
              #{tag}
            </button>
          ))}
        </div>
      </div>

      {post.image && (
        <Link className="block overflow-hidden bg-[#dfeadc]" to={`/posts/${post.id}`}>
          <img
            alt={post.title}
            className="max-h-[420px] w-full object-cover transition-transform duration-300 ease-out hover:scale-[1.015] motion-reduce:transform-none"
            decoding="async"
            loading="lazy"
            src={post.image}
          />
        </Link>
      )}

      <div className="px-4 pb-3 pt-3 sm:px-5">
        <div className="community-post-card__metrics flex items-center justify-between gap-3 text-[11px] font-semibold text-[#718077]">
          <span className="inline-flex items-center gap-1.5">
            <ThumbsUp aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" fill={post.liked ? 'currentColor' : 'none'} />
            {post.likes} lượt thích
          </span>
          <span>{post.comments} bình luận</span>
        </div>
        <div className="community-post-card__actions mt-3 grid grid-cols-3 gap-1 border-t border-[#e0e9dc] pt-2">
          <button
            className={`community-button-quiet !min-h-9 !px-2 ${post.liked ? '!bg-[#edf5e9] !text-[#477313]' : ''}`}
            type="button"
            onClick={() => onLikeToggle?.(post.id)}
          >
            <ThumbsUp aria-hidden="true" className="h-[17px] w-[17px]" fill={post.liked ? 'currentColor' : 'none'} />
            <span className="hidden sm:inline">Thích</span>
          </button>
          {enableInlineComments ? <button
            aria-expanded={commentsOpen}
            className={`community-button-quiet !min-h-9 !px-2 ${commentsOpen ? '!bg-[#edf5e9] !text-[#477313]' : ''}`}
            onClick={() => void toggleComments()}
            type="button"
          >
            <MessageCircle aria-hidden="true" className="h-[17px] w-[17px]" />
            <span className="hidden sm:inline">Bình luận</span>
          </button> : <Link className="community-button-quiet !min-h-9 !px-2" to={`/posts/${post.id}`}>
            <MessageCircle aria-hidden="true" className="h-[17px] w-[17px]" />
            <span className="hidden sm:inline">Bình luận</span>
          </Link>}
          <button 
            className="community-button-quiet !min-h-9 !px-2" 
            onClick={() => onShareClick?.(post)}
            type="button"
          >
            <Share2 aria-hidden="true" className="h-[17px] w-[17px]" />
            <span className="hidden sm:inline">Chia sẻ</span>
          </button>
        </div>
      </div>
      {enableInlineComments && commentsOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-[#071014]/80 p-0 backdrop-blur-[2px] sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setCommentsOpen(false);
          }}
        >
          <section
            aria-labelledby={`post-dialog-title-${post.id}`}
            aria-modal="true"
            className="flex h-[100dvh] w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-2rem)] sm:max-w-[760px] sm:rounded-2xl"
            role="dialog"
          >
            <header className="flex h-14 shrink-0 items-center justify-between border-b border-[#d8e4d4] bg-[#081d24] px-4 text-white">
              <span aria-hidden="true" className="h-9 w-9" />
              <h2 className="truncate px-3 text-center text-[15px] font-extrabold" id={`post-dialog-title-${post.id}`}>
                Bài viết của {post.authorName}
              </h2>
              <button
                aria-label="Đóng chi tiết bài viết"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                onClick={() => setCommentsOpen(false)}
                type="button"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="border-b border-[#e0e9dc] p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  {post.authorPlayerId ? (
                    <PlayerHoverCard playerId={post.authorPlayerId} playerName={post.authorName}>{authorAvatar}</PlayerHoverCard>
                  ) : authorAvatar}
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-extrabold text-[#0b2228]">{post.authorName}</p>
                    <p className="text-[11px] font-semibold text-[#718077]">{post.createdAt}{post.location ? ` · ${post.location}` : ''}</p>
                  </div>
                </div>
                <h3 className="mt-4 text-[19px] font-extrabold leading-7 text-[#0b2228]">{post.title}</h3>
                <p className="mt-2 whitespace-pre-wrap text-[14px] leading-6 text-[#526158]">{post.content}</p>
                {post.lookingFor && (
                  <div className="mt-4 rounded-xl border border-[#cfe0c8] bg-[#edf6e9] p-3 text-[12px] font-extrabold text-[#365c16]">
                    {post.lookingFor}
                  </div>
                )}
              </div>

              {post.image && (
                <div className="border-b border-[#e0e9dc] bg-[#eef4eb]">
                  <img alt={post.title} className="max-h-[52vh] w-full object-contain" src={post.image} />
                </div>
              )}

              <div className="border-b border-[#e0e9dc] px-4 py-3 sm:px-5">
                <div className="flex items-center justify-between text-[12px] font-semibold text-[#718077]">
                  <span>{post.likes} lượt thích</span>
                  <span>{post.comments} bình luận</span>
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <h3 className="text-[15px] font-extrabold text-[#0b2228]">Tất cả bình luận</h3>
                <div className="mt-4 grid gap-3" aria-live="polite">
                  {loadingComments ? (
                    <span className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#718077]">
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang tải bình luận...
                    </span>
                  ) : inlineComments.length > 0 ? inlineComments.map((comment) => {
                    const commentAvatar = comment.userAvatarUrl ? (
                        <img alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" src={comment.userAvatarUrl} />
                      ) : (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]">
                          <UserRound className="h-4 w-4" />
                        </span>
                      );
                    return <div className="flex gap-2" key={comment.commentId}>
                      {comment.playerId ? (
                        <PlayerHoverCard playerId={comment.playerId} playerName={comment.username}>{commentAvatar}</PlayerHoverCard>
                      ) : commentAvatar}
                      <div className="min-w-0 rounded-xl bg-[#f4f8f2] px-3 py-2">
                        <p className="text-[12px] font-extrabold text-[#0b2228]">{comment.username}</p>
                        <p className="mt-0.5 whitespace-pre-wrap break-words text-[13px] text-[#526158]">{inlineCommentText(comment)}</p>
                      </div>
                    </div>
                  }) : (
                    <p className="py-4 text-center text-[12px] font-semibold text-[#718077]">Chưa có bình luận nào.</p>
                  )}
                </div>
              </div>
            </div>

            <footer className="shrink-0 border-t border-[#d8e4d4] bg-white p-3 sm:p-4">
              {token ? (
                <div className="flex gap-2">
                  <label className="sr-only" htmlFor={`inline-comment-${post.id}`}>Viết bình luận</label>
                  <textarea
                    autoFocus
                    className="community-control min-h-10 flex-1 resize-none py-2"
                    disabled={submittingComment}
                    id={`inline-comment-${post.id}`}
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Viết bình luận..."
                    rows={1}
                    value={commentDraft}
                  />
                  <button
                    aria-label="Gửi bình luận"
                    className="community-button h-10 min-h-10 self-end px-3"
                    disabled={!commentDraft.trim() || submittingComment}
                    onClick={() => void submitInlineComment()}
                    type="button"
                  >
                    {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </button>
                </div>
              ) : (
                <p className="text-center text-[13px] font-semibold text-[#526158]">
                  <Link className="font-extrabold text-[#477313] hover:underline" to="/login">Đăng nhập</Link> để bình luận.
                </p>
              )}
            </footer>
          </section>
        </div>,
        document.body,
      )}
    </article>
  );
};

export const Posts = () => {
  const { user, token, isAuthenticated } = useAuth();
  const notify = useToast();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [friendshipStatuses, setFriendshipStatuses] = useState<Record<number, FriendshipStatus>>({});
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [morePosts, setMorePosts] = useState<DisplayPost[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const nextPageRef = useRef(2);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const {
    data: firstPosts = emptyPosts,
    error,
    loading,
    refresh,
    setData: setFirstPosts,
  } = useApiQuery(
    ['global-posts', token],
    async () => (await getGlobalPosts(token, 1, pageSize)).filter((post) => post.groupId === null).map(toDisplayPost),
    { errorMessage: 'Không thể tải bảng tin.' },
  );
  const posts = [...firstPosts, ...morePosts];

  useEffect(() => {
    setMorePosts([]);
    nextPageRef.current = 2;
    setHasMore(firstPosts.length === pageSize);
  }, [token, firstPosts.length]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const page = nextPageRef.current;
      const loaded = (await getGlobalPosts(token, page, pageSize)).filter((post) => post.groupId === null).map(toDisplayPost);
      setMorePosts((current) => [
        ...current,
        ...loaded.filter((post) => !current.some((existing) => existing.id === post.id)),
      ]);
      nextPageRef.current = page + 1;
      setHasMore(loaded.length === pageSize);
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : 'Không thể tải thêm bài viết.', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, notify, token]);

  // Batch query friendship statuses for post authors
  useEffect(() => {
    if (!token || !isAuthenticated || posts.length === 0) return;
    const currentUserId = user?.id ? Number(user.id) : null;
    const authorIds = Array.from(
      new Set(
        posts
          .map((p) => p.authorId)
          .filter((id): id is number => typeof id === 'number' && id > 0 && id !== currentUserId)
      )
    );
    if (authorIds.length === 0) return;

    let cancelled = false;
    getFriendshipStatuses(token, authorIds)
      .then((res) => {
        if (!cancelled && res?.statuses) {
          setFriendshipStatuses((prev) => ({ ...prev, ...res.statuses }));
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated, posts, user?.id]);

  const loadFriendRequests = useCallback(async () => {
    if (!token || !isAuthenticated) return;
    try {
      setFriendRequests((await getFriendRequests(token)) || []);
    } catch {
      // The notification page remains the fallback when this optional banner cannot refresh.
    }
  }, [token, isAuthenticated]);

  useEffect(() => {
    void loadFriendRequests();
  }, [loadFriendRequests]);

  useNotificationRealtime(token, () => {
    void loadFriendRequests();
  });

  const handleFriendStatusChange = (targetUserId: number, newStatus: FriendshipStatus) => {
    setFriendshipStatuses((prev) => ({
      ...prev,
      [targetUserId]: newStatus,
    }));
    if (newStatus === 'Accepted' || newStatus === 'None') {
      setFriendRequests((prev) => prev.filter((r) => r.requesterId !== targetUserId));
    }
  };

  const sharePost = async (post: DisplayPost) => {
    const url = new URL('/posts/' + post.id, window.location.origin).toString();
    try {
      if (navigator.share) {
        await navigator.share({
          title: post.title,
          text: post.content.slice(0, 160),
          url,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        notify('Đã sao chép liên kết bài viết.', 'success');
      } else {
        throw new Error('Trình duyệt không hỗ trợ chia sẻ.');
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      notify(error instanceof Error ? error.message : 'Không thể chia sẻ bài viết.', 'error');
    }
  };

  useEffect(() => {
    if (token && user?.role === 'player') {
      getMyProfile(token)
        .then(setProfile)
        .catch(() => {});
    }
  }, [token, user]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.unobserve(sentinel);
        void loadMore();
      }
    }, { rootMargin: '220px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const updatePost = (postId: string, updater: (post: DisplayPost) => DisplayPost) => {
    setFirstPosts((current) => (current ?? emptyPosts).map((post) => post.id === postId ? updater(post) : post));
    setMorePosts((current) => current.map((post) => post.id === postId ? updater(post) : post));
  };

  const handleLikeToggle = async (postId: string) => {
    if (!token) {
      notify('Vui lòng đăng nhập để thích bài viết.', 'info');
      return;
    }
    
    const postNumId = Number(postId);
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const originalLiked = post.liked;
    const originalLikes = post.likes;

    // Optimistically update local UI state
    updatePost(postId, (current) => ({
      ...current,
      liked: !originalLiked,
      likes: originalLiked ? Math.max(0, originalLikes - 1) : originalLikes + 1,
    }));

    try {
      if (originalLiked) {
        await removeReaction(token, postNumId);
      } else {
        await reactToPost(token, postNumId);
      }
      
      // Silently sync state with server
      const backendPost = await getGlobalPost(postNumId, token);
      updatePost(postId, (current) => ({
        ...current,
        liked: backendPost.likedByMe,
        likes: backendPost.likeCount,
      }));
    } catch (err) {
      updatePost(postId, (current) => ({ ...current, liked: originalLiked, likes: originalLikes }));
      notify(err instanceof Error ? err.message : 'Không thể cập nhật lượt thích.', 'error');
    }
  };

  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search') || '';

  const filteredPosts = posts.filter((post) => {
    if (!searchQuery) return true;
    const query = searchQuery.trim().toLowerCase();

    if (query.startsWith('#')) {
      const tagQuery = query.slice(1).trim();
      if (!tagQuery) return true; // If they just typed '#', show everything
      return post.tags?.some(tag => tag.toLowerCase().includes(tagQuery));
    }
    
    // Check detail / content
    const matchesContent = post.content?.toLowerCase().includes(query);
    
    // Check title
    const matchesTitle = post.title?.toLowerCase().includes(query);
    
    // Check hashtag (tags array)
    const matchesHashtag = post.tags?.some(tag => tag.toLowerCase().includes(query));
    
    return matchesContent || matchesTitle || matchesHashtag;
  });

  const name = user?.name || '';
  const avatarUrl = user?.avatar || profile?.profileImageUrl;

  return (
    <CommunityPage>
      <CommunityFeedShell activePath="/posts">
        {isAuthenticated && (
          <section className="community-panel community-composer overflow-hidden">
            <div className="flex gap-3 p-4">
              {avatarUrl ? (
                <img
                  alt={name}
                  className="community-avatar"
                  src={avatarUrl}
                />
              ) : (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]">
                  <UserRound className="h-4 w-4" />
                </div>
              )}
              <Link
                className="community-composer__prompt flex min-h-10 min-w-0 flex-1 items-center rounded-[10px] border border-[#d8e4d4] bg-[#f4f8f2] px-3 text-[13px] font-semibold text-[#718077] transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#afc5a8] hover:bg-white hover:shadow-[0_0_0_3px_rgba(71,115,19,0.08)]"
                to="/posts/create"
              >
                Bạn muốn chia sẻ gì với cộng đồng?
              </Link>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#e0e9dc] px-3 py-2">
              <div className="flex gap-1">
                <Link aria-label="Thêm ảnh" className="community-icon-button" title="Thêm ảnh" to="/posts/create?attach=image">
                  <ImageIcon aria-hidden="true" className="h-[18px] w-[18px]" />
                </Link>
                <Link aria-label="Gắn địa điểm" className="community-icon-button" title="Gắn địa điểm" to="/posts/create?focus=location">
                  <MapPin aria-hidden="true" className="h-[18px] w-[18px]" />
                </Link>
                <Link aria-label="Tìm người chơi" className="community-icon-button" title="Tìm người chơi" to="/posts/create?mode=find_players">
                  <UserPlus aria-hidden="true" className="h-[18px] w-[18px]" />
                </Link>
              </div>
              <Link className="community-button !min-h-9 !px-3" to="/posts/create">
                <Plus aria-hidden="true" className="h-4 w-4" />
                Tạo bài
              </Link>
            </div>
          </section>
        )}

        {/* Incoming Friend Requests Banner if any */}
        {isAuthenticated && friendRequests.length > 0 && (
          <section className="mt-4 rounded-2xl border border-[#cfe0c8] bg-[#f4f8f2] p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#477313] text-white">
                  <UserPlus className="h-4 w-4" />
                </span>
                <h2 className="text-[14px] font-black text-[#0b2228]">
                  Lời mời kết bạn chờ duyệt ({friendRequests.length})
                </h2>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {friendRequests.map((req) => (
                <div
                  key={req.friendshipId}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white p-2.5 border border-[#e0e9dc] shadow-xs"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {req.requesterAvatarUrl ? (
                      <img alt="" className="community-avatar h-9 w-9" src={req.requesterAvatarUrl} />
                    ) : (
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e0e9dc] text-[#477313]">
                        <UserRound className="h-4 w-4" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-extrabold text-[#0b2228]">{req.requesterName}</p>
                      {req.skillLevel && (
                        <p className="text-[10px] font-semibold text-[#718077]">Trình {req.skillLevel}</p>
                      )}
                    </div>
                  </div>
                  <FriendButton
                    onStatusChange={(status) => handleFriendStatusChange(req.requesterId, status)}
                    status="PendingReceived"
                    targetUserId={req.requesterId}
                    targetUserName={req.requesterName}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="community-feed-heading mb-3 mt-5 flex items-center justify-between gap-3 px-1">
          <div>
            <h1 className="text-[19px] font-extrabold tracking-[-0.02em] text-[#0b2228]">Bảng tin hôm nay</h1>
            <p className="mt-1 text-[12px] font-semibold text-[#718077]">Hoạt động mới từ người chơi quanh bạn</p>
          </div>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#477313]" />
          ) : (
            <span className="community-badge">{filteredPosts.length} bài</span>
          )}
        </div>

        {error && firstPosts.length === 0 ? (
          <section className="grid justify-items-start rounded-2xl border border-[#e7c8c4] bg-white p-6">
            <AlertCircle aria-hidden="true" className="h-6 w-6 text-[#ba1a1a]" />
            <p className="mt-3 font-extrabold text-[#0b2228]">Không thể tải bảng tin</p>
            <p className="mt-1 text-[13px] text-[#718077]">{error}</p>
            <button className="community-button mt-4" onClick={() => void refresh()} type="button">
              <RefreshCw aria-hidden="true" className="h-4 w-4" />
              Thử tải lại
            </button>
          </section>
        ) : (
          <section className="grid gap-4">
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post}
                friendshipStatus={post.authorId ? friendshipStatuses[post.authorId] : undefined}
                enableInlineComments
                onCommentCreated={(postId) => updatePost(postId, (current) => ({
                  ...current,
                  comments: current.comments + 1,
                }))}
                onFriendStatusChange={handleFriendStatusChange}
                onLikeToggle={handleLikeToggle} 
                onShareClick={(post) => void sharePost(post)}
              />
              ))
            ) : (
              <div className="text-center p-8 bg-[#f4f8f2] rounded-2xl border border-[#cfe0c8] text-[#718077]">
                <p className="font-extrabold text-[15px]">Không tìm thấy bài viết nào khớp với từ khóa</p>
                <p className="text-[12px] mt-1 font-semibold">Thử tìm kiếm từ khóa khác hoặc xóa bộ lọc.</p>
              </div>
            )}
          </section>
        )}

        {hasMore && (
          <div
            className="mt-4 rounded-xl border border-[#cfe0c8] bg-[#f4f8f2] p-4 text-center text-[12px] font-bold text-[#718077]"
            ref={loadMoreRef}
          >
            {loadingMore ? 'Đang tải thêm bài viết...' : 'Cuộn để xem thêm'}
          </div>
        )}

        {isAuthenticated && (
          <Link
            aria-label="Tạo bài viết"
            className="community-button fixed bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-4 z-30 h-12 w-12 !rounded-xl !p-0 shadow-[0_14px_30px_rgba(8,29,36,0.2)] md:hidden"
            title="Tạo bài viết"
            to="/posts/create"
          >
            <Send aria-hidden="true" className="h-5 w-5" />
          </Link>
        )}

      </CommunityFeedShell>
    </CommunityPage>
  );
};
