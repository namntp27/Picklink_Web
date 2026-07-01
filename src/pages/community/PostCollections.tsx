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
  type LucideIcon,
} from 'lucide-react';
import type { CommunityPost } from '../../data/communityPosts';
import { communityPosts } from '../../data/communityPosts';
import {
  CommunityEmptyState,
  CommunityFeedShell,
  CommunityPage,
} from './CommunityUI';

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

const getTrendScore = (post: CommunityPost) => post.likes + post.comments * 2 + post.shares * 3;

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
  post: CommunityPost;
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
