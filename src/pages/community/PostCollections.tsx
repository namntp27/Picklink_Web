import { Link } from 'react-router-dom';
import {
  Bookmark,
  Flame,
  Hash,
  MessageCircle,
  Plus,
  Share2,
  ThumbsUp,
  TrendingUp,
  Users,
  Loader2,
  AlertCircle,
  type LucideIcon,
} from 'lucide-react';
import type { CommunityPost as LocalCommunityPost } from '../../data/communityPosts';
import { communityPosts } from '../../data/communityPosts';
import {
  CommunityEmptyState,
  CommunityFeedShell,
  CommunityPage,
} from './CommunityUI';
import { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getGroups, getGroupPosts, reactToPost, removeReaction, getGlobalPost } from '../../api/community';
import { PostCard, parsePostContent, type DisplayPost } from './Posts';

type CollectionType = 'trending' | 'saved';

type CollectionMeta = {
  activePath: string;
  description: string;
  emptyText: string;
  emptyTitle: string;
  icon: LucideIcon;
  label: string;
  title: string;
};

const getTrendScore = (post: LocalCommunityPost) => post.likes + post.comments * 2 + post.shares * 3;

const getCollectionPosts = (type: CollectionType) => (
  type === 'saved'
    ? communityPosts.filter((post) => post.saved)
    : [...communityPosts].sort((first, second) => getTrendScore(second) - getTrendScore(first))
);

const collectionMeta = {
  trending: {
    activePath: '/posts/trending',
    description: 'Các cuộc thảo luận có nhiều tương tác nhất trong cộng đồng Picklink.',
    emptyText: 'Bài nổi bật sẽ xuất hiện khi cộng đồng có thêm tương tác.',
    emptyTitle: 'Chưa có bài viết xu hướng',
    icon: TrendingUp,
    label: 'Được quan tâm',
    title: 'Bài viết xu hướng',
  },
  saved: {
    activePath: '/posts/saved',
    description: 'Lịch ghép trận, review sân và kinh nghiệm bạn muốn xem lại.',
    emptyText: 'Lưu bài viết bạn quan tâm để tìm lại nhanh tại đây.',
    emptyTitle: 'Chưa lưu bài viết nào',
    icon: Bookmark,
    label: 'Bộ sưu tập',
    title: 'Bài viết đã lưu',
  },
} satisfies Record<CollectionType, CollectionMeta>;

const CollectionCard = ({
  post,
  rank,
  type,
}: {
  post: LocalCommunityPost;
  rank: number;
  type: CollectionType;
}) => (
  <article className="community-card overflow-hidden">
    <div className={`grid min-w-0 ${post.image ? 'sm:grid-cols-[180px_minmax(0,1fr)]' : ''}`}>
      {post.image && (
        <Link className="block h-48 overflow-hidden bg-[#dfeadc] sm:h-full sm:min-h-[220px]" to={`/posts/${post.id}`}>
          <img
            alt={post.title}
            className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.025] motion-reduce:transform-none"
            src={post.image}
          />
        </Link>
      )}

      <div className="min-w-0 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="community-badge">
            {type === 'trending' ? (
              <>
                <Flame aria-hidden="true" className="h-3.5 w-3.5" />
                Hạng {rank}
              </>
            ) : (
              <>
                <Bookmark aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" />
                Đã lưu
              </>
            )}
          </span>
          <span className="text-[11px] font-semibold text-[#718077]">{post.createdAt}</span>
          <span className="truncate text-[11px] font-semibold text-[#718077]">{post.location}</span>
        </div>

        <Link className="mt-3 block" to={`/posts/${post.id}`}>
          <h2 className="text-[17px] font-extrabold leading-6 tracking-[-0.015em] text-[#0b2228] transition-colors hover:text-[#477313]">
            {post.title}
          </h2>
          <p className="mt-2 line-clamp-3 text-[13px] leading-6 text-[#526158]">{post.content}</p>
        </Link>

        <div className="mt-3 flex flex-wrap gap-2">
          {post.tags.slice(0, 3).map((tag) => (
            <span className="community-badge text-[#526158]" key={tag}>
              <Hash aria-hidden="true" className="h-3 w-3" />
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#e0e9dc] pt-3">
          <div className="flex gap-4 text-[11px] font-bold text-[#718077]">
            <span className="inline-flex items-center gap-1">
              <ThumbsUp aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" />
              {post.likes}
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" />
              {post.comments}
            </span>
            <span className="inline-flex items-center gap-1">
              <Share2 aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" />
              {post.shares}
            </span>
          </div>
          <Link className="community-button-secondary !min-h-9 !px-3" to={`/posts/${post.id}`}>
            Xem bài
          </Link>
        </div>
      </div>
    </div>
  </article>
);

const PostCollection = ({ type }: { type: CollectionType }) => {
  const meta = collectionMeta[type];
  const posts = getCollectionPosts(type);
  const MetaIcon = meta.icon;

  return (
    <CommunityPage>
      <CommunityFeedShell activePath={meta.activePath}>
        <header className="community-panel p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[12px] font-extrabold text-[#477313]">
                <MetaIcon aria-hidden="true" className="h-4 w-4" />
                {meta.label}
              </p>
              <h1 className="mt-2 text-[24px] font-extrabold tracking-[-0.03em] text-[#0b2228]">
                {meta.title}
              </h1>
              <p className="mt-2 max-w-[55ch] text-[13px] leading-6 text-[#66756b]">{meta.description}</p>
            </div>
            <Link aria-label="Tạo bài viết" className="community-button h-10 w-10 !p-0 sm:w-auto sm:px-3" title="Tạo bài viết" to="/posts/create">
              <Plus aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Tạo bài</span>
            </Link>
          </div>
        </header>

        <section className="mt-4 grid gap-4">
          {posts.map((post, index) => (
            <CollectionCard key={post.id} post={post} rank={index + 1} type={type} />
          ))}

          {posts.length === 0 && (
            <CommunityEmptyState
              action={<Link className="community-button" to="/posts">Về bảng tin</Link>}
              description={meta.emptyText}
              icon={MetaIcon}
              title={meta.emptyTitle}
            />
          )}
        </section>
      </CommunityFeedShell>
    </CommunityPage>
  );
};

export const TrendingPosts = () => <PostCollection type="trending" />;

export const SavedPosts = () => <PostCollection type="saved" />;

export const ClubPosts = () => {
  const { token, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);

  const loadClubPosts = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // 1. Get joined clubs
      const joinedGroups = await getGroups(token, undefined, 1, 100, 'Mine');
      const activeGroups = joinedGroups.filter((g) => g.myStatus === 'Accepted');

      if (activeGroups.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // 2. Fetch posts of each club
      const postsPromises = activeGroups.map(async (group) => {
        try {
          const groupPosts = await getGroupPosts(token, group.groupId);
          return groupPosts.map((p) => ({
            ...p,
            groupName: group.groupName,
            groupId: group.groupId,
          }));
        } catch {
          return [];
        }
      });

      const results = await Promise.all(postsPromises);
      const allPosts = results.flat();

      // 3. Sort by createdAt descending
      allPosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // 4. Map to DisplayPost
      const mapped = allPosts.map((post: any): DisplayPost => {
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
          // Ignore
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
          matchId: parsed.matchId,
          groupName: post.groupName,
          groupId: post.groupId,
        };
      });

      setPosts(mapped);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải bài viết từ các câu lạc bộ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClubPosts();
  }, [token]);

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
    const postNumId = Number(postId);
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const originalLiked = post.liked;
    const originalLikes = post.likes;

    // Optimistic UI update
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

  return (
    <CommunityPage>
      <CommunityFeedShell activePath="/posts/clubs">
        <header className="community-panel p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[12px] font-extrabold text-[#477313]">
                <Users aria-hidden="true" className="h-4 w-4" />
                Câu lạc bộ của bạn
              </p>
              <h1 className="mt-2 text-[24px] font-extrabold tracking-[-0.03em] text-[#0b2228]">
                Bài viết câu lạc bộ
              </h1>
              <p className="mt-2 max-w-[55ch] text-[13px] leading-6 text-[#66756b]">
                Cập nhật tin tức, sự kiện và bài đăng ghép trận mới nhất từ các câu lạc bộ bạn đã tham gia.
              </p>
            </div>
          </div>
        </header>

        <section className="mt-4 grid gap-4">
          {loading ? (
            <div className="flex items-center justify-center py-20 bg-white rounded-xl border border-[#cfe0c8]">
              <Loader2 className="h-8 w-8 animate-spin text-[#477313]" />
              <span className="ml-3 text-[14px] text-[#66756b] font-semibold">Đang tải bài viết...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#cfe0c8]">
              <AlertCircle className="h-10 w-10 text-[#ba1a1a]" />
              <p className="mt-3 text-[16px] font-bold text-on-surface">Không thể tải bài viết</p>
              <p className="mt-2 text-[14px] text-on-surface-variant">{error}</p>
              <button
                className="mt-4 rounded-lg bg-[#477313] px-6 py-2 text-[14px] font-bold text-white hover:opacity-90"
                onClick={() => void loadClubPosts()}
              >
                Thử lại
              </button>
            </div>
          ) : !isAuthenticated ? (
            <CommunityEmptyState
              action={<Link className="community-button" to="/login">Đăng nhập</Link>}
              description="Vui lòng đăng nhập để xem bài đăng từ các câu lạc bộ của bạn."
              icon={Users}
              title="Yêu cầu đăng nhập"
            />
          ) : posts.length === 0 ? (
            <CommunityEmptyState
              action={<Link className="community-button" to="/clubs">Tìm câu lạc bộ</Link>}
              description="Bạn chưa tham gia câu lạc bộ nào hoặc các câu lạc bộ bạn tham gia chưa có bài viết."
              icon={Users}
              title="Chưa có bài viết nào"
            />
          ) : (
            posts.slice(0, visibleCount).map((post) => (
              <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} />
            ))
          )}
        </section>

        {posts.length > visibleCount && (
          <div className="mt-4 p-4 text-center text-[12px] font-bold text-[#718077] bg-[#f4f8f2] rounded-xl border border-[#cfe0c8]">
            Đang hiển thị {Math.min(visibleCount, posts.length)} trên tổng số {posts.length} bài viết · Cuộn xuống để xem thêm
          </div>
        )}
      </CommunityFeedShell>
    </CommunityPage>
  );
};
