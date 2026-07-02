import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Share2,
  ThumbsUp,
  UserPlus,
  UserRound,
  Users,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { getMyProfile, type PlayerProfile } from '../../api/profile';
import {
  getGlobalPost,
  getGlobalPosts,
  reactToPost,
  removeReaction,
  getFriends,
  getGroups,
  type CommunityFriend,
  type CommunityGroup,
} from '../../api/community';
import { CommunityFeedShell, CommunityPage } from './CommunityUI';

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
  shares: number;
  liked: boolean;
  saved: boolean;
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
    <article className="community-card overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 gap-3">
            <Link to={`/posts/${post.id}`}>
              <img alt={post.authorName} className="community-avatar" src={post.avatar} />
            </Link>
            <div className="min-w-0">
              <h2 className="truncate text-[14px] font-extrabold text-[#0b2228]">{post.authorName}</h2>
              <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-[#718077]">
                <span className="community-badge !min-h-5 !px-2 !py-1">Trình độ {post.level}</span>
                {post.groupName && post.groupId && (
                  <Link to={`/clubs/${post.groupId}`} className="community-badge !min-h-5 !px-2 !py-1 !bg-primary/10 !text-primary hover:bg-primary/20 transition-colors font-extrabold">
                    CLB: {post.groupName}
                  </Link>
                )}
                <span>{post.createdAt}</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin aria-hidden="true" className="h-3 w-3" />
                  {post.location}
                </span>
              </div>
            </div>
          </div>
          <button
            aria-label="Tùy chọn bài viết"
            className="community-icon-button"
            title="Tùy chọn bài viết"
            type="button"
          >
            <MoreHorizontal aria-hidden="true" className="h-[18px] w-[18px]" />
          </button>
        </div>

        <Link className="mt-4 block" to={`/posts/${post.id}`}>
          <h3 className="text-[17px] font-extrabold leading-6 tracking-[-0.015em] text-[#0b2228] transition-colors hover:text-[#477313]">
            {post.title}
          </h3>
          <p className="mt-2 text-[13px] leading-6 text-[#526158]">{post.content}</p>
        </Link>

        {post.lookingFor && (
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#cfe0c8] bg-[#edf6e9] p-3 text-[12px] font-extrabold text-[#365c16]">
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
          src={post.image}
        />
      </Link>
    )}

    <div className="px-4 pb-3 pt-3 sm:px-5">
      <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-[#718077]">
        <span className="inline-flex items-center gap-1.5">
          <ThumbsUp aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" fill={post.liked ? 'currentColor' : 'none'} />
          {post.likes} lượt thích
        </span>
        <span>{post.comments} bình luận · {post.shares} chia sẻ</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-1 border-t border-[#e0e9dc] pt-2">
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
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(5);
  const [sharingPost, setSharingPost] = useState<DisplayPost | null>(null);
  const [friends, setFriends] = useState<CommunityFriend[]>([]);
  const [groups, setGroups] = useState<CommunityGroup[]>([]);
  const [loadingShareTargets, setLoadingShareTargets] = useState(false);

  useEffect(() => {
    if (sharingPost && token) {
      setLoadingShareTargets(true);
      Promise.all([
        getFriends(token).catch(() => []),
        getGroups(token, undefined, undefined, undefined, 'Mine').catch(() => [])
      ]).then(([friendsData, groupsData]) => {
        setFriends(friendsData);
        setGroups(groupsData);
      }).catch((err) => {
        console.error("Failed to load share targets:", err);
      }).finally(() => {
        setLoadingShareTargets(false);
      });
    }
  }, [sharingPost, token]);

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
          avatar: post.authorAvatarUrl || 'https://i.pravatar.cc/150?u=' + post.authorId,
          level: '3.5',
          location: parsed.location || 'Hà Nội',
          createdAt: formattedDate,
          title: parsed.title || 'Bài viết mới',
          content: parsed.body,
          image: post.mediaUrls && post.mediaUrls.length > 0 ? post.mediaUrls[0] : undefined,
          tags: parsed.tags || [],
          lookingFor: parsed.lookingFor && parsed.slots
            ? `Cần ${parsed.slots} slot · Trình ${parsed.levelRange || '-'} · ${parsed.playTime || '-'}`
            : undefined,
          likes: post.likeCount || 0,
          comments: post.commentCount || 0,
          shares: 0,
          liked: post.likedByMe || false,
          saved: false,
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
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop >=
        document.documentElement.offsetHeight - 120
      ) {
        setVisibleCount((prev) => Math.min(prev + 5, posts.length));
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts.length]);

  const handleLikeToggle = async (postId: string) => {
    if (!token) return;
    
    // Ignore like toggles on static mock posts
    if (postId.startsWith('mock-')) return;
    
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
          <section className="community-panel overflow-hidden">
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
                className="flex min-h-10 min-w-0 flex-1 items-center rounded-[10px] border border-[#d8e4d4] bg-[#f4f8f2] px-3 text-[13px] font-semibold text-[#718077] transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#afc5a8] hover:bg-white hover:shadow-[0_0_0_3px_rgba(71,115,19,0.08)]"
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

        <div className="mb-3 mt-5 flex items-center justify-between gap-3 px-1">
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
                onShareClick={setSharingPost}
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
          <div className="mt-4 p-4 text-center text-[12px] font-bold text-[#718077] bg-[#f4f8f2] rounded-xl border border-[#cfe0c8]">
            Đang hiển thị {Math.min(visibleCount, filteredPosts.length)} trên tổng số {filteredPosts.length} bài viết · Cuộn xuống để xem thêm
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

        {sharingPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-[#cfe0c8] bg-white p-6 shadow-2xl flex flex-col max-h-[85vh]">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#e0e9dc] pb-4">
                <h2 className="text-[17px] font-extrabold text-[#0b2228]">Chia sẻ bài viết</h2>
                <button
                  onClick={() => setSharingPost(null)}
                  className="rounded-full p-1.5 hover:bg-[#f4f8f2] text-[#718077] transition-colors"
                  type="button"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1 custom-scrollbar">
                {/* Repost Options */}
                <div>
                  <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-[#718077] mb-2">Tùy chọn chia sẻ</h3>
                  <button
                    onClick={() => {
                      alert(`Đã chọn chia sẻ lại bài viết: ${sharingPost.title}`);
                      setSharingPost(null);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-[#d8e4d4] bg-[#f4f8f2] hover:bg-[#edf5e9] text-left transition-colors cursor-pointer"
                    type="button"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Share2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-extrabold text-[#0b2228]">Chia sẻ lại lên Bảng tin</p>
                      <p className="text-[11px] font-semibold text-[#718077] mt-0.5">Bài viết sẽ xuất hiện trên dòng thời gian của bạn</p>
                    </div>
                  </button>
                </div>

                {/* Send via Message */}
                <div className="border-t border-[#e0e9dc] pt-4">
                  <h3 className="text-[12px] font-extrabold uppercase tracking-wider text-[#718077] mb-3">Gửi tin nhắn trực tiếp</h3>
                  
                  {loadingShareTargets ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      <span className="ml-2 text-[12px] text-[#718077]">Đang tải danh sách...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Groups list */}
                      <div>
                        <h4 className="text-[12px] font-extrabold text-[#0b2228] mb-2 flex items-center gap-1.5">
                          <Users className="h-4 w-4 text-primary" />
                          Nhóm CLB bạn tham gia ({groups.length})
                        </h4>
                        {groups.length > 0 ? (
                          <div className="grid gap-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                            {groups.map(g => (
                              <button
                                key={g.groupId}
                                onClick={() => {
                                  alert(`Đã chọn gửi tới nhóm: ${g.groupName}`);
                                  setSharingPost(null);
                                }}
                                className="flex w-full items-center gap-3 p-2 rounded-lg border border-[#e0e9dc]/60 hover:bg-[#f4f8f2] text-left transition-colors cursor-pointer"
                                type="button"
                              >
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-bold text-white uppercase">
                                  {g.groupName.substring(0, 2)}
                                </div>
                                <span className="text-[13px] font-bold text-[#0b2228] truncate">{g.groupName}</span>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-[#718077] italic pl-2">Bạn chưa tham gia câu lạc bộ nào.</p>
                        )}
                      </div>

                      {/* Friends list (only if user has friends) */}
                      {friends.length > 0 && (
                        <div className="border-t border-[#e0e9dc]/60 pt-4">
                          <h4 className="text-[12px] font-extrabold text-[#0b2228] mb-2 flex items-center gap-1.5">
                            <UserRound className="h-4 w-4 text-primary" />
                            Bạn bè ({friends.length})
                          </h4>
                          <div className="grid gap-1.5 max-h-36 overflow-y-auto pr-1 custom-scrollbar">
                            {friends.map(f => (
                              <button
                                key={f.userId}
                                onClick={() => {
                                  alert(`Đã chọn gửi tới bạn bè: ${f.username}`);
                                  setSharingPost(null);
                                }}
                                className="flex w-full items-center gap-3 p-2.5 rounded-lg border border-[#e0e9dc]/60 hover:bg-[#f4f8f2] text-left transition-colors cursor-pointer"
                                type="button"
                              >
                                {f.profileImageUrl ? (
                                  <img
                                    src={f.profileImageUrl}
                                    alt={f.username}
                                    className="h-7 w-7 shrink-0 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf5e9] text-primary text-[11px] font-bold uppercase">
                                    {f.username.substring(0, 2)}
                                  </div>
                                )}
                                <span className="text-[13px] font-bold text-[#0b2228] truncate">{f.username}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CommunityFeedShell>
    </CommunityPage>
  );
};
