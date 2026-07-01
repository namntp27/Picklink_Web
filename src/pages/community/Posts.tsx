import { Link } from 'react-router-dom';
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
  Users,
} from 'lucide-react';
import type { CommunityPost } from '../../data/communityPosts';
import { communityPosts, currentCommunityUser } from '../../data/communityPosts';
import { CommunityFeedShell, CommunityPage } from './CommunityUI';

const PostCard = ({ post }: { post: CommunityPost }) => (
  <article className="community-card overflow-hidden">
    <div className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <Link className="flex min-w-0 gap-3" to={`/posts/${post.id}`}>
          <img alt={post.authorName} className="community-avatar" src={post.avatar} />
          <div className="min-w-0">
            <h2 className="truncate text-[14px] font-extrabold text-[#0b2228]">{post.authorName}</h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-[#718077]">
              <span className="community-badge !min-h-5 !px-2 !py-1">Trình độ {post.level}</span>
              <span>{post.createdAt}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin aria-hidden="true" className="h-3 w-3" />
                {post.location}
              </span>
            </div>
          </div>
        </Link>
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
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#cfe0c8] bg-[#edf6e9] p-3 text-[12px] font-extrabold text-[#365c16]">
          <Users aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{post.lookingFor}</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span className="community-badge text-[#526158]" key={tag}>
            #{tag}
          </span>
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
        >
          <ThumbsUp aria-hidden="true" className="h-[17px] w-[17px]" fill={post.liked ? 'currentColor' : 'none'} />
          <span className="hidden sm:inline">Thích</span>
        </button>
        <Link className="community-button-quiet !min-h-9 !px-2" to={`/posts/${post.id}`}>
          <MessageCircle aria-hidden="true" className="h-[17px] w-[17px]" />
          <span className="hidden sm:inline">Bình luận</span>
        </Link>
        <button className="community-button-quiet !min-h-9 !px-2" type="button">
          <Share2 aria-hidden="true" className="h-[17px] w-[17px]" />
          <span className="hidden sm:inline">Chia sẻ</span>
        </button>
      </div>
    </div>
  </article>
);

export const Posts = () => (
  <CommunityPage>
    <CommunityFeedShell activePath="/posts">
      <section className="community-panel overflow-hidden">
        <div className="flex gap-3 p-4">
          <img
            alt={currentCommunityUser.name}
            className="community-avatar"
            src={currentCommunityUser.avatar}
          />
          <Link
            className="flex min-h-10 min-w-0 flex-1 items-center rounded-[10px] border border-[#d8e4d4] bg-[#f4f8f2] px-3 text-[13px] font-semibold text-[#718077] transition-[border-color,background-color,box-shadow] duration-200 hover:border-[#afc5a8] hover:bg-white hover:shadow-[0_0_0_3px_rgba(71,115,19,0.08)]"
            to="/posts/create"
          >
            Bạn muốn chia sẻ gì với cộng đồng?
          </Link>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-[#e0e9dc] px-3 py-2">
          <div className="flex gap-1">
            <Link aria-label="Thêm ảnh" className="community-icon-button" title="Thêm ảnh" to="/posts/create">
              <ImageIcon aria-hidden="true" className="h-[18px] w-[18px]" />
            </Link>
            <Link aria-label="Gắn địa điểm" className="community-icon-button" title="Gắn địa điểm" to="/posts/create">
              <MapPin aria-hidden="true" className="h-[18px] w-[18px]" />
            </Link>
            <Link aria-label="Tìm người chơi" className="community-icon-button" title="Tìm người chơi" to="/posts/create">
              <UserPlus aria-hidden="true" className="h-[18px] w-[18px]" />
            </Link>
          </div>
          <Link className="community-button !min-h-9 !px-3" to="/posts/create">
            <Plus aria-hidden="true" className="h-4 w-4" />
            Tạo bài
          </Link>
        </div>
      </section>

      <div className="mb-3 mt-5 flex items-center justify-between gap-3 px-1">
        <div>
          <h1 className="text-[19px] font-extrabold tracking-[-0.02em] text-[#0b2228]">Bảng tin hôm nay</h1>
          <p className="mt-1 text-[12px] font-semibold text-[#718077]">Hoạt động mới từ người chơi quanh bạn</p>
        </div>
        <span className="community-badge">{communityPosts.length} bài mới</span>
      </div>

      <section className="grid gap-4">
        {communityPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </section>

      <Link
        aria-label="Tạo bài viết"
        className="community-button fixed bottom-5 right-4 z-30 h-12 w-12 !rounded-xl !p-0 shadow-[0_14px_30px_rgba(8,29,36,0.2)] md:hidden"
        title="Tạo bài viết"
        to="/posts/create"
      >
        <Send aria-hidden="true" className="h-5 w-5" />
      </Link>
    </CommunityFeedShell>
  </CommunityPage>
);
