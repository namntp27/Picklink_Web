import { useEffect, useRef, useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { getMyProfile, type PlayerProfile } from '../../api/profile';
import {
  getGlobalPost,
  getGlobalPosts,
  reactToPost,
  removeReaction,
} from '../../api/community';
import { CommunityFeedShell, CommunityPage } from './CommunityUI';
import { useToast } from '../../components/ui/ToastRegion';

export interface DisplayPost {
  id: string;
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
        tags: parsed.tags
      };
    }
  } catch {
    // Ignore, falls through to plaintext
  }
  return { title: '', body: rawContent };
};

export const PostCard = ({ 
  post, 
  onLikeToggle, 
  onShareClick 
}: { 
  post: DisplayPost; 
  onLikeToggle?: (postId: string) => void;
  onShareClick?: (post: DisplayPost) => void;
}) => {
  const [, setSearchParams] = useSearchParams();

  return (
    <article className="community-card community-post-card overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <Link aria-label={'Xem bài viết của ' + post.authorName} to={'/posts/' + post.id}>
              {post.avatar ? (
                <img alt="" className="community-avatar" decoding="async" loading="lazy" src={post.avatar} />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e0e9dc] text-[#477313]">
                  <UserRound aria-hidden="true" className="h-5 w-5" />
                </span>
              )}
            </Link>
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-extrabold text-[#0b2228]">{post.authorName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-[#718077]">
                {post.level && <span className="community-badge !min-h-5 !px-2 !py-1">Trình độ {post.level}</span>}
                {post.groupName && post.groupId && (
                  <Link to={`/clubs/${post.groupId}`} className="community-badge !min-h-5 !px-2 !py-1 !bg-primary/10 !text-primary hover:bg-primary/20 transition-colors font-extrabold">
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
        <Link className="community-button-quiet !min-h-9 !px-2" to={`/posts/${post.id}`}>
          <MessageCircle aria-hidden="true" className="h-[17px] w-[17px]" />
          <span className="hidden sm:inline">Bình luận</span>
        </Link>
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
  </article>
);
};

export const Posts = () => {
  const { user, token, isAuthenticated } = useAuth();
  const notify = useToast();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);


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

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await getGlobalPosts(token);
      const mapped = res.map((post): DisplayPost => {
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
          authorName: post.authorName || 'Thành viên Picklink',
          avatar: post.authorAvatarUrl || '',
          level: '',
          location: parsed.location || '',
          createdAt: formattedDate,
          title: parsed.title || 'Bài viết',
          content: parsed.body,
          image: post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : undefined,
          tags: parsed.tags || [],
          lookingFor: parsed.lookingFor && parsed.slots
            ? `Cần ${parsed.slots} slot · Trình ${parsed.levelRange || '-'} · ${parsed.playTime || '-'}`
            : undefined,
          likes: post.likeCount || 0,
          comments: post.commentCount || 0,
          liked: post.likedByMe || false,
          matchId: parsed.matchId
        };
      });

      setPosts(mapped);
    } catch (err) {
      console.error('Failed to load posts from API:', err);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPosts();
  }, [token]);

  useEffect(() => {
    if (token && user?.role === 'player') {
      getMyProfile(token)
        .then(setProfile)
        .catch(() => {});
    }
  }, [token, user]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= posts.length) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.unobserve(sentinel);
        setVisibleCount((prev) => Math.min(prev + 5, posts.length));
      }
    }, { rootMargin: '220px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [posts.length, visibleCount]);

  const handleLikeToggle = async (postId: string) => {
    if (!token) return;
    
    const postNumId = Number(postId);
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const originalLiked = post.liked;
    const originalLikes = post.likes;

    // Optimistically update local UI state
    setPosts((prevPosts) =>
      prevPosts.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !originalLiked,
              likes: originalLiked ? Math.max(0, originalLikes - 1) : originalLikes + 1,
            }
          : p
      )
    );

    try {
      if (originalLiked) {
        await removeReaction(token, postNumId);
      } else {
        await reactToPost(token, postNumId);
      }
      
      // Silently sync state with server
      const backendPost = await getGlobalPost(postNumId, token);
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: backendPost.likedByMe,
                likes: backendPost.likeCount,
              }
            : p
        )
      );
    } catch (err) {
      console.error('Failed to react to post:', err);
      // Revert on error
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: originalLiked,
                likes: originalLikes,
              }
            : p
        )
      );
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

        <div className="community-feed-heading mb-3 mt-5 flex items-center justify-between gap-3 px-1">
          <div>
            <h1 className="text-[19px] font-extrabold tracking-[-0.02em] text-[#0b2228]">Bảng tin hôm nay</h1>
            <p className="mt-1 text-[12px] font-semibold text-[#718077]">Hoạt động mới từ người chơi quanh bạn</p>
          </div>
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-[#477313]" />
          ) : (
            <span className="community-badge">{filteredPosts.length} bài mới</span>
          )}
        </div>

        <section className="grid gap-4">
          {filteredPosts.length > 0 ? (
            filteredPosts.slice(0, visibleCount).map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
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

        {filteredPosts.length > visibleCount && (
          <div
            className="mt-4 rounded-xl border border-[#cfe0c8] bg-[#f4f8f2] p-4 text-center text-[12px] font-bold text-[#718077]"
            ref={loadMoreRef}
          >
            Đang tải thêm bài viết ({Math.min(visibleCount, filteredPosts.length)}/{filteredPosts.length})
          </div>
        )}

        {isAuthenticated && (
          <Link
            aria-label="Tạo bài viết"
            className="community-button fixed bottom-5 right-4 z-30 h-12 w-12 !rounded-xl !p-0 shadow-[0_14px_30px_rgba(8,29,36,0.2)] md:hidden"
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
