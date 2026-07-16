import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, Users } from 'lucide-react';
import {
  CommunityEmptyState,
  CommunityFeedShell,
  CommunityPage,
} from './CommunityUI';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { getGroups, getGroupPosts, reactToPost, removeReaction, getGlobalPost } from '../../api/community';
import { PostCard, parsePostContent, type DisplayPost } from './Posts';
import { useToast } from '../../components/ui/ToastRegion';

export const ClubPosts = () => {
  const { token, isAuthenticated } = useAuth();
  const notify = useToast();
  const [posts, setPosts] = useState<DisplayPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(5);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

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
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-xl border border-[#cfe0c8]" role="alert">
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
              <PostCard key={post.id} post={post} onLikeToggle={handleLikeToggle} onShareClick={(post) => void sharePost(post)} />
            ))
          )}
        </section>

        {posts.length > visibleCount && (
          <div
            className="mt-4 rounded-xl border border-[#cfe0c8] bg-[#f4f8f2] p-4 text-center text-[12px] font-bold text-[#718077]"
            ref={loadMoreRef}
          >
            Đang tải thêm bài viết ({Math.min(visibleCount, posts.length)}/{posts.length})
          </div>
        )}
      </CommunityFeedShell>
    </CommunityPage>
  );
};
