import { Link } from 'react-router-dom';
import {
  Bookmark,
  Flame,
  Hash,
  Home,
  MessageCircle,
  Plus,
  Settings,
  Share2,
  ThumbsUp,
  TrendingUp,
  Users,
} from 'lucide-react';
import type { CommunityPost } from '../../data/communityPosts';
import { activeCommunityPlayers, communityPosts, currentCommunityUser, trendingTopics } from '../../data/communityPosts';

type CollectionType = 'trending' | 'saved';

const getTrendScore = (post: CommunityPost) => post.likes + post.comments * 2 + post.shares * 3;

const getCollectionPosts = (type: CollectionType) => {
  if (type === 'saved') {
    return communityPosts.filter((post) => post.saved);
  }

  return [...communityPosts].sort((first, second) => getTrendScore(second) - getTrendScore(first));
};

const collectionMeta = {
  trending: {
    title: 'Bài viết xu hướng',
    eyebrow: 'Xu hướng cộng đồng',
    description: 'Những bài viết có nhiều tương tác, bình luận và chia sẻ nhất trong cộng đồng Picklink.',
    icon: TrendingUp,
    activePath: '/posts/trending',
    emptyTitle: 'Chưa có bài viết xu hướng',
    emptyText: 'Khi cộng đồng có thêm tương tác, các bài nổi bật sẽ xuất hiện tại đây.',
  },
  saved: {
    title: 'Bài viết đã lưu',
    eyebrow: 'Bộ sưu tập cá nhân',
    description: 'Các bài viết bạn đã lưu để xem lại: lịch ghép trận, review sân, kỹ thuật và kinh nghiệm chơi.',
    icon: Bookmark,
    activePath: '/posts/saved',
    emptyTitle: 'Chưa lưu bài viết nào',
    emptyText: 'Bấm lưu ở bài viết bạn quan tâm để xem lại nhanh tại trang này.',
  },
} satisfies Record<CollectionType, Record<string, unknown>>;

const Sidebar = ({ activePath }: { activePath: string }) => (
  <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[280px] shrink-0 overflow-y-auto p-4 md:block">
    <div className="mb-8 flex items-center gap-3 p-2">
      <img alt={currentCommunityUser.name} className="h-12 w-12 rounded-lg object-cover shadow-sm" src={currentCommunityUser.avatar} />
      <div>
        <h3 className="text-[16px] font-bold text-primary">{currentCommunityUser.name}</h3>
        <p className="text-[13px] font-medium text-[#555f6f]">Trình độ {currentCommunityUser.level}</p>
      </div>
    </div>

    <nav className="space-y-2">
      {[
        { label: 'Bảng tin', icon: Home, to: '/posts' },
        { label: 'Xu hướng', icon: TrendingUp, to: '/posts/trending' },
        { label: 'Câu lạc bộ', icon: Users, to: '/clubs' },
        { label: 'Bài viết đã lưu', icon: Bookmark, to: '/posts/saved' },
        { label: 'Cài đặt', icon: Settings, to: '/profile' },
      ].map((item) => (
        <Link
          className={`flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-bold transition-colors ${
            activePath === item.to ? 'bg-primary text-white shadow-sm' : 'text-[#555f6f] hover:bg-[#e7eefe] hover:text-primary'
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

const CollectionCard = ({ post, rank, type }: { post: CommunityPost; rank: number; type: CollectionType }) => {
  const score = getTrendScore(post);

  return (
    <article className="rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row">
        {post.image && (
          <Link className="block h-48 shrink-0 overflow-hidden rounded-lg sm:h-36 sm:w-44" to={`/posts/${post.id}`}>
            <img alt={post.title} className="h-full w-full object-cover" src={post.image} />
          </Link>
        )}

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {type === 'trending' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[12px] font-bold text-white">
                <Flame className="h-3.5 w-3.5" />
                #{rank}
              </span>
            )}
            {type === 'saved' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-[12px] font-bold text-white">
                <Bookmark className="h-3.5 w-3.5" fill="currentColor" />
                Đã lưu
              </span>
            )}
            <span className="text-[12px] font-bold text-[#555f6f]">{post.createdAt}</span>
            <span className="text-[12px] font-bold text-[#555f6f]">{post.location}</span>
          </div>

          <Link to={`/posts/${post.id}`}>
            <h2 className="text-[20px] font-bold leading-7 hover:text-primary">{post.title}</h2>
            <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-[#555f6f]">{post.content}</p>
          </Link>

          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f3ff] px-3 py-1 text-[12px] font-bold text-[#555f6f]" key={tag}>
                <Hash className="h-3.5 w-3.5" />
                {tag}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/50 pt-3">
            <div className="flex flex-wrap gap-4 text-[13px] font-bold text-[#555f6f]">
              <span className="flex items-center gap-1">
                <ThumbsUp className="h-4 w-4 text-primary" />
                {post.likes}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4 text-primary" />
                {post.comments}
              </span>
              <span className="flex items-center gap-1">
                <Share2 className="h-4 w-4 text-primary" />
                {post.shares}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {type === 'trending' && <span className="text-[12px] font-bold text-primary">Điểm nổi bật {score}</span>}
              <Link className="rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-bold text-[#555f6f] hover:bg-[#f0f3ff]" to={`/posts/${post.id}`}>
                Xem chi tiết
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

const RightPanel = () => (
  <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[300px] shrink-0 overflow-y-auto p-4 lg:block">
    <section className="mb-4 rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[16px] font-bold">Chủ đề nổi bật</h3>
      <div className="space-y-4">
        {trendingTopics.map((topic) => (
          <div key={topic.title}>
            <p className="text-[12px] text-[#555f6f]">{topic.category}</p>
            <p className="mt-1 text-[14px] font-bold">{topic.title}</p>
            <p className="mt-1 text-[12px] text-[#555f6f]">{topic.posts}</p>
          </div>
        ))}
      </div>
    </section>

    <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-[16px] font-bold">Người chơi tích cực</h3>
      <div className="space-y-4">
        {activeCommunityPlayers.map((player) => (
          <div className="flex items-center gap-3" key={player.name}>
            <img alt={player.name} className="h-10 w-10 rounded-lg object-cover" src={player.avatar} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-bold">{player.name}</p>
              <p className="text-[12px] text-[#555f6f]">Trình độ {player.level}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  </aside>
);

const PostCollection = ({ type }: { type: CollectionType }) => {
  const meta = collectionMeta[type];
  const posts = getCollectionPosts(type);
  const MetaIcon = meta.icon as typeof TrendingUp;

  return (
    <div className="mx-auto flex min-h-screen max-w-[1200px] bg-[#f9f9ff] pt-[72px] text-[#151c27]">
      <Sidebar activePath={meta.activePath as string} />

      <main className="min-w-0 flex-1 px-4 py-5 pb-24 lg:max-w-[640px]">
        <section className="mb-6 rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary">
                <MetaIcon className="h-4 w-4" />
                {meta.eyebrow as string}
              </p>
              <h1 className="mt-3 text-[30px] font-bold leading-tight md:text-[38px]">{meta.title as string}</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#555f6f]">{meta.description as string}</p>
            </div>
            <Link className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90" to="/posts/create">
              <Plus className="h-5 w-5" />
              Tạo bài
            </Link>
          </div>
        </section>

        <section className="space-y-4">
          {posts.map((post, index) => (
            <CollectionCard key={post.id} post={post} rank={index + 1} type={type} />
          ))}

          {posts.length === 0 && (
            <div className="rounded-lg border border-outline-variant bg-white p-8 text-center shadow-sm">
              <MetaIcon className="mx-auto h-10 w-10 text-primary" />
              <h2 className="mt-4 text-[20px] font-bold">{meta.emptyTitle as string}</h2>
              <p className="mt-2 text-[14px] leading-6 text-[#555f6f]">{meta.emptyText as string}</p>
              <Link className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90" to="/posts">
                Về bảng tin
              </Link>
            </div>
          )}
        </section>
      </main>

      <RightPanel />
    </div>
  );
};

export const TrendingPosts = () => <PostCollection type="trending" />;

export const SavedPosts = () => <PostCollection type="saved" />;
