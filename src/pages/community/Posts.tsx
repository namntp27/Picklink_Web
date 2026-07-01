import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  Home,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Plus,
  Send,
  Settings,
  Share2,
  ThumbsUp,
  TrendingUp,
  UserPlus,
  UserRound,
  Users,
} from 'lucide-react';
import type { CommunityPost } from '../../data/communityPosts';
import { activeCommunityPlayers, communityPosts, trendingTopics } from '../../data/communityPosts';
import { useAuth } from '../../auth/AuthContext';
import { getMyProfile, type PlayerProfile } from '../../api/profile';

const CommunitySidebar = ({
  isAuthenticated,
  name,
  avatarUrl,
  subtitle,
}: {
  isAuthenticated: boolean;
  name: string;
  avatarUrl?: string;
  subtitle: string;
}) => (
  <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[280px] shrink-0 overflow-y-auto p-4 md:block">
    {isAuthenticated ? (
      <div className="mb-8 flex items-center gap-3 p-2">
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border-2 border-white shadow-sm flex items-center justify-center bg-primary/10 text-primary">
          {avatarUrl ? (
            <img alt={name} className="h-full w-full object-cover" src={avatarUrl} />
          ) : (
            <UserRound className="h-6 w-6" />
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-bold text-primary" title={name}>{name}</h3>
          <p className="truncate text-[13px] font-medium text-[#555f6f]">{subtitle}</p>
        </div>
      </div>
    ) : (
      <div className="mb-8 rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
        <h3 className="text-[15px] font-bold text-primary mb-2">Tham gia Picklink</h3>
        <p className="text-[13px] text-[#555f6f] leading-5 mb-4">
          Giao lưu, đặt sân và kết bạn cùng cộng đồng Pickleball!
        </p>
        <Link
          to="/login"
          className="block w-full text-center rounded-lg bg-primary py-2 text-[13px] font-bold text-white hover:bg-primary/90 transition-colors"
        >
          Đăng nhập ngay
        </Link>
      </div>
    )}

    <nav className="space-y-2">
      {[
        { label: 'Bảng tin', icon: Home, to: '/posts', active: true },
        { label: 'Xu hướng', icon: TrendingUp, to: '/posts/trending' },
        { label: 'Câu lạc bộ', icon: Users, to: '/clubs' },
        ...(isAuthenticated
          ? [
              { label: 'Bài viết đã lưu', icon: Bookmark, to: '/posts/saved' },
              { label: 'Cài đặt', icon: Settings, to: '/profile' },
            ]
          : []),
      ].map((item) => (
        <Link
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-bold transition-colors ${
            item.active ? 'bg-primary text-white shadow-sm' : 'text-[#555f6f] hover:bg-[#e7eefe] hover:text-primary'
          }`}
          key={item.label}
          to={item.to}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  </aside>
);

const CommunityRightSidebar = () => (
  <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[300px] shrink-0 overflow-y-auto p-4 lg:block">
    <section className="mb-4 rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[16px] font-bold">Chủ đề nổi bật</h3>
      <div className="space-y-4">
        {trendingTopics.map((topic) => (
          <button className="block w-full text-left" key={topic.title} type="button">
            <p className="mb-0.5 text-[12px] text-[#555f6f]">{topic.category}</p>
            <h4 className="text-[14px] font-bold transition-colors hover:text-primary">{topic.title}</h4>
            <p className="text-[12px] text-[#555f6f]">{topic.posts}</p>
          </button>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[16px] font-bold">Người chơi tích cực</h3>
      <div className="space-y-4">
        {activeCommunityPlayers.map((player) => (
          <div className="flex items-center justify-between gap-3" key={player.name}>
            <div className="flex min-w-0 items-center gap-3">
              <img alt={player.name} className="h-10 w-10 rounded-lg object-cover" src={player.avatar} />
              <div className="min-w-0">
                <h4 className="truncate text-[14px] font-bold">{player.name}</h4>
                <p className="text-[12px] text-[#555f6f]">Trình độ {player.level}</p>
              </div>
            </div>
            <button className="shrink-0 rounded-lg bg-[#e7eefe] px-3 py-1.5 text-[12px] font-bold text-primary hover:bg-primary-container" type="button">
              Kết bạn
            </button>
          </div>
        ))}
      </div>
    </section>
  </aside>
);

const PostCard = ({ post }: { post: CommunityPost }) => (
  <article className="mb-4 rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
    <div className="mb-3 flex items-center justify-between gap-3">
      <Link className="flex min-w-0 gap-3" to={`/posts/${post.id}`}>
        <img alt={post.authorName} className="h-10 w-10 shrink-0 rounded-lg object-cover" src={post.avatar} />
        <div className="min-w-0">
          <h4 className="truncate text-[15px] font-bold">{post.authorName}</h4>
          <div className="flex flex-wrap items-center gap-2 text-[12px] text-[#555f6f]">
            <span className="rounded-sm bg-[#e7eefe] px-1.5 py-0.5 font-bold text-[#3d6a00]">Trình độ {post.level}</span>
            <span>{post.createdAt}</span>
            <span>{post.location}</span>
          </div>
        </div>
      </Link>
      <button className="rounded-lg p-1.5 text-[#555f6f] hover:bg-[#f0f3ff]" type="button" aria-label="Tùy chọn bài viết">
        <MoreHorizontal className="h-5 w-5" />
      </button>
    </div>

    <Link className="block" to={`/posts/${post.id}`}>
      <h3 className="mb-2 text-[18px] font-bold leading-6 text-on-surface">{post.title}</h3>
      <p className="mb-4 text-[15px] leading-6 text-[#151c27]">{post.content}</p>

      {post.lookingFor && (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/8 p-3">
          <p className="flex items-center gap-2 text-[13px] font-bold text-primary">
            <Users className="h-4 w-4" />
            {post.lookingFor}
          </p>
        </div>
      )}

      {post.image && <img alt={post.title} className="mb-3 h-[300px] w-full rounded-lg object-cover" src={post.image} />}
    </Link>

    <div className="mb-3 flex flex-wrap gap-2">
      {post.tags.map((tag) => (
        <span className="rounded-full bg-[#f0f3ff] px-3 py-1 text-[12px] font-bold text-[#555f6f]" key={tag}>
          #{tag}
        </span>
      ))}
    </div>

    <div className="mb-3 flex items-center justify-between px-2 text-[13px] text-[#555f6f]">
      <span className="flex items-center gap-1 font-medium">
        <ThumbsUp className="h-4 w-4 text-primary" fill={post.liked ? 'currentColor' : 'none'} />
        {post.likes}
      </span>
      <span>
        {post.comments} bình luận · {post.shares} chia sẻ
      </span>
    </div>

    <div className="grid grid-cols-3 gap-2 border-t border-outline-variant/40 pt-3">
      <button
        className={`flex items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-bold transition-colors ${
          post.liked ? 'bg-[#e7eefe] text-primary' : 'text-[#555f6f] hover:bg-[#f0f3ff]'
        }`}
        type="button"
      >
        <ThumbsUp className="h-5 w-5" fill={post.liked ? 'currentColor' : 'none'} />
        <span className="hidden sm:inline">Thích</span>
      </button>
      <Link
        className="flex items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-bold text-[#555f6f] transition-colors hover:bg-[#f0f3ff]"
        to={`/posts/${post.id}`}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline">Bình luận</span>
      </Link>
      <button className="flex items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-bold text-[#555f6f] transition-colors hover:bg-[#f0f3ff]" type="button">
        <Share2 className="h-5 w-5" />
        <span className="hidden sm:inline">Chia sẻ</span>
      </button>
    </div>
  </article>
);

export const Posts = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (token && user?.role === 'player') {
      getMyProfile(token)
        .then(setProfile)
        .catch(() => {});
    }
  }, [token, user]);

  const name = user?.name || '';
  const avatarUrl = user?.avatar || profile?.profileImageUrl;

  let subtitle = '';
  if (user) {
    if (user.role === 'player') {
      const levelStr = profile?.skillLevel != null ? profile.skillLevel.toFixed(1) : 'Chưa cập nhật';
      subtitle = `Trình độ ${levelStr}`;
    } else if (user.role === 'owner') {
      subtitle = 'Chủ sân';
    } else if (user.role === 'admin') {
      subtitle = 'Quản trị viên';
    } else if (user.role === 'staff') {
      subtitle = 'Nhân viên';
    }
  }

  return (
    <div className="w-full bg-[#f9f9ff] min-h-screen pt-[72px] font-body-md text-[#151c27]">
      <div className="mx-auto flex max-w-container-max-width justify-center px-4 md:px-6">
        <CommunitySidebar
          isAuthenticated={isAuthenticated}
          name={name}
          avatarUrl={avatarUrl}
          subtitle={subtitle}
        />

        <main className="min-w-0 flex-1 p-4 lg:max-w-[620px]">
          {isAuthenticated ? (
            <section className="mb-6 rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
              <div className="mb-4 flex gap-3">
                {avatarUrl ? (
                  <img alt={name} className="h-10 w-10 shrink-0 rounded-lg object-cover" src={avatarUrl} />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <UserRound className="h-5 w-5" />
                  </div>
                )}
                <Link
                  className="flex min-h-11 w-full items-center rounded-lg bg-[#f0f3ff] px-4 text-[14px] font-medium text-[#555f6f] hover:ring-2 hover:ring-primary/20"
                  to="/posts/create"
                >
                  Bạn đang nghĩ gì về trận đấu hôm nay?
                </Link>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant/40 pt-3 flex-wrap gap-2">
                <div className="flex gap-2">
                  <Link className="rounded-lg p-2 text-[#555f6f] transition-colors hover:bg-[#f0f3ff]" to="/posts/create?attach=image" aria-label="Thêm ảnh">
                    <ImageIcon className="h-5 w-5" />
                  </Link>
                  <Link className="rounded-lg p-2 text-[#555f6f] transition-colors hover:bg-[#f0f3ff]" to="/posts/create?focus=location" aria-label="Gắn địa điểm">
                    <MapPin className="h-5 w-5" />
                  </Link>
                  <Link className="rounded-lg p-2 text-[#555f6f] transition-colors hover:bg-[#f0f3ff]" to="/posts/create?mode=find_players" aria-label="Tìm người chơi">
                    <UserPlus className="h-5 w-5" />
                  </Link>
                </div>
                <Link className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-[14px] font-bold text-white hover:bg-primary/90" to="/posts/create">
                  <Plus className="h-4 w-4" />
                  Tạo bài viết
                </Link>
              </div>
            </section>
          ) : (
            <section className="mb-6 rounded-lg border border-outline-variant bg-white p-6 text-center shadow-sm">
              <h3 className="text-[18px] font-bold mb-2">Bạn muốn chia sẻ trạng thái?</h3>
              <p className="text-[14px] text-[#555f6f] mb-4">
                Đăng nhập để chia sẻ những khoảnh khắc Pickleball tuyệt vời của bạn với cộng đồng.
              </p>
              <Link
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-[14px] font-bold text-white hover:bg-primary/90"
                to="/login"
              >
                Đăng nhập ngay
              </Link>
            </section>
          )}

          <section>
            {communityPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>
        </main>

        <CommunityRightSidebar />

        <Link
          className="fixed bottom-5 right-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-white shadow-lg hover:bg-primary/90 md:hidden"
          to="/posts/create"
          aria-label="Tạo bài viết"
        >
          <Send className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
};
