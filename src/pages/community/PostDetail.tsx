import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bookmark,
  CheckCircle2,
  Flag,
  Hash,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share2,
  ThumbsUp,
  Users,
} from 'lucide-react';
import type { CommunityComment } from '../../data/communityPosts';
import {
  activeCommunityPlayers,
  currentCommunityUser,
  getCommunityPostById,
  trendingTopics,
} from '../../data/communityPosts';
import { CommunityHero, CommunityPage } from './CommunityUI';

const countComments = (comments: CommunityComment[]): number => (
  comments.reduce((total, comment) => total + 1 + countComments(comment.replies ?? []), 0)
);

const CommentItem = ({
  comment,
  nested = false,
}: {
  comment: CommunityComment;
  nested?: boolean;
}) => (
  <article className={nested ? 'ml-6 border-l border-[#d8e4d4] pl-3 sm:ml-10 sm:pl-4' : ''}>
    <div className="flex gap-3">
      <img alt={comment.authorName} className="community-avatar" src={comment.avatar} />
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-[#f0f6ed] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[13px] font-extrabold text-[#0b2228]">{comment.authorName}</h3>
            <span className="community-badge !min-h-5 !px-2 !py-1">Trình độ {comment.level}</span>
          </div>
          <p className="mt-2 text-[13px] leading-6 text-[#405048]">{comment.content}</p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 px-2 text-[11px] font-bold text-[#718077]">
          <span>{comment.createdAt}</span>
          <button className="transition-colors hover:text-[#477313]" type="button">Thích</button>
          <button className="transition-colors hover:text-[#477313]" type="button">Trả lời</button>
          <span>{comment.likes} lượt thích</span>
        </div>
      </div>
    </div>

    {comment.replies && comment.replies.length > 0 && (
      <div className="mt-4 grid gap-4">
        {comment.replies.map((reply) => (
          <CommentItem comment={reply} key={reply.id} nested />
        ))}
      </div>
    )}
  </article>
);

export const PostDetail = () => {
  const { id } = useParams();
  const post = getCommunityPostById(id);
  const [liked, setLiked] = useState(post.liked);
  const [saved, setSaved] = useState(post.saved);
  const [comments, setComments] = useState<CommunityComment[]>(post.commentList);
  const [commentDraft, setCommentDraft] = useState('');

  const visibleCommentCount = useMemo(() => countComments(comments), [comments]);
  const likeCount = post.likes + (liked && !post.liked ? 1 : !liked && post.liked ? -1 : 0);

  const addComment = () => {
    const content = commentDraft.trim();
    if (!content) return;

    setComments((currentComments) => [
      {
        id: `comment-${Date.now()}`,
        authorName: currentCommunityUser.name,
        avatar: currentCommunityUser.avatar,
        level: currentCommunityUser.level,
        createdAt: 'Vừa xong',
        content,
        likes: 0,
      },
      ...currentComments,
    ]);
    setCommentDraft('');
  };

  return (
    <CommunityPage>
      <CommunityHero
        actions={(
          <Link className="community-button" to="/posts/create">
            <Send aria-hidden="true" className="h-4 w-4" />
            Tạo bài viết
          </Link>
        )}
        backLink={{ label: 'Quay lại bảng tin', to: '/posts' }}
        description="Theo dõi nội dung, trao đổi với người chơi và lưu lại thông tin hữu ích."
        icon={MessageCircle}
        label="Cộng đồng Picklink"
        title="Chi tiết bài viết"
      />

      <main className="community-container grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-5">
          <article className="community-panel overflow-hidden">
            <div className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 gap-3">
                  <img alt={post.authorName} className="community-avatar community-avatar--lg" src={post.avatar} />
                  <div className="min-w-0">
                    <h2 className="truncate text-[14px] font-extrabold text-[#0b2228]">{post.authorName}</h2>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold text-[#718077]">
                      <span className="community-badge !min-h-5 !px-2 !py-1">Trình độ {post.level}</span>
                      <span>{post.createdAt}</span>
                      <span>{post.location}</span>
                    </div>
                  </div>
                </div>
                <button aria-label="Tùy chọn bài viết" className="community-icon-button" title="Tùy chọn bài viết" type="button">
                  <MoreHorizontal aria-hidden="true" className="h-[18px] w-[18px]" />
                </button>
              </div>

              <h1 className="mt-5 text-[clamp(1.35rem,3vw,1.75rem)] font-extrabold leading-tight tracking-[-0.025em] text-[#0b2228]">
                {post.title}
              </h1>
              <p className="mt-3 text-[14px] leading-7 text-[#405048]">{post.content}</p>

              {post.lookingFor && (
                <div className="mt-4 flex items-start gap-2 rounded-xl border border-[#cfe0c8] bg-[#edf6e9] p-3 text-[13px] font-extrabold text-[#365c16]">
                  <Users aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                  {post.lookingFor}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span className="community-badge text-[#526158]" key={tag}>
                    <Hash aria-hidden="true" className="h-3 w-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {post.image && (
              <img alt={post.title} className="max-h-[520px] w-full bg-[#dfeadc] object-cover" src={post.image} />
            )}

            <div className="px-4 pb-3 pt-3 sm:px-5">
              <div className="flex items-center justify-between gap-3 text-[11px] font-semibold text-[#718077]">
                <span className="inline-flex items-center gap-1.5">
                  <ThumbsUp aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" fill={liked ? 'currentColor' : 'none'} />
                  {likeCount} lượt thích
                </span>
                <span>{visibleCommentCount} bình luận · {post.shares} chia sẻ</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 border-t border-[#e0e9dc] pt-2">
                <button
                  className={`community-button-quiet !min-h-9 !px-2 ${liked ? '!bg-[#edf5e9] !text-[#477313]' : ''}`}
                  onClick={() => setLiked((current) => !current)}
                  type="button"
                >
                  <ThumbsUp aria-hidden="true" className="h-[17px] w-[17px]" fill={liked ? 'currentColor' : 'none'} />
                  <span className="hidden sm:inline">Thích</span>
                </button>
                <a className="community-button-quiet !min-h-9 !px-2" href="#comments">
                  <MessageCircle aria-hidden="true" className="h-[17px] w-[17px]" />
                  <span className="hidden sm:inline">Bình luận</span>
                </a>
                <button className="community-button-quiet !min-h-9 !px-2" type="button">
                  <Share2 aria-hidden="true" className="h-[17px] w-[17px]" />
                  <span className="hidden sm:inline">Chia sẻ</span>
                </button>
              </div>
            </div>
          </article>

          <section className="community-panel p-4 sm:p-5" id="comments">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[18px] font-extrabold tracking-[-0.02em] text-[#0b2228]">Bình luận</h2>
              <span className="community-badge">{visibleCommentCount}</span>
            </div>
            <div className="mt-4 flex gap-3">
              <img alt={currentCommunityUser.name} className="community-avatar" src={currentCommunityUser.avatar} />
              <div className="min-w-0 flex-1">
                <label className="sr-only" htmlFor="post-comment">Viết bình luận</label>
                <textarea
                  className="community-control min-h-[88px] resize-none"
                  id="post-comment"
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Viết bình luận..."
                  value={commentDraft}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex gap-1">
                    <button aria-label="Thêm ảnh" className="community-icon-button" title="Thêm ảnh" type="button">
                      <ImageIcon aria-hidden="true" className="h-4 w-4" />
                    </button>
                    <button aria-label="Gắn địa điểm" className="community-icon-button" title="Gắn địa điểm" type="button">
                      <MapPin aria-hidden="true" className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    className="community-button !min-h-9"
                    disabled={!commentDraft.trim()}
                    onClick={addComment}
                    type="button"
                  >
                    <Send aria-hidden="true" className="h-4 w-4" />
                    Gửi
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-5">
              {comments.map((comment) => (
                <CommentItem comment={comment} key={comment.id} />
              ))}
            </div>
          </section>
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-20">
          <section className="community-panel p-4">
            <h2 className="text-[15px] font-extrabold text-[#0b2228]">Thông tin bài viết</h2>
            {post.court && (
              <div className="mt-3 rounded-xl bg-[#edf5e9] p-3">
                <p className="text-[11px] font-bold text-[#718077]">Sân liên quan</p>
                <p className="mt-1 text-[13px] font-extrabold text-[#0b2228]">{post.court}</p>
              </div>
            )}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-[#d8e4d4] p-3">
                <p className="text-[11px] font-bold text-[#718077]">Bình luận</p>
                <p className="mt-1 font-mono text-[20px] font-extrabold">{visibleCommentCount}</p>
              </div>
              <div className="rounded-xl border border-[#d8e4d4] p-3">
                <p className="text-[11px] font-bold text-[#718077]">Chia sẻ</p>
                <p className="mt-1 font-mono text-[20px] font-extrabold">{post.shares}</p>
              </div>
            </div>
            <button
              className={`mt-3 w-full ${saved ? 'community-button' : 'community-button-secondary'}`}
              onClick={() => setSaved((current) => !current)}
              type="button"
            >
              <Bookmark aria-hidden="true" className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Đã lưu bài viết' : 'Lưu bài viết'}
            </button>
            <button className="community-button-quiet mt-1 w-full" type="button">
              <Flag aria-hidden="true" className="h-4 w-4" />
              Báo cáo bài viết
            </button>
          </section>

          <section className="community-panel p-4">
            <h2 className="text-[15px] font-extrabold text-[#0b2228]">Chủ đề nổi bật</h2>
            <div className="mt-3 grid gap-2">
              {trendingTopics.map((topic) => (
                <button className="rounded-xl p-2 text-left transition-colors hover:bg-[#edf5e9]" key={topic.title} type="button">
                  <p className="text-[11px] font-semibold text-[#718077]">{topic.category}</p>
                  <p className="mt-1 text-[13px] font-extrabold leading-5 text-[#0b2228]">{topic.title}</p>
                  <p className="mt-1 text-[11px] font-semibold text-[#718077]">{topic.posts}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="community-panel p-4">
            <h2 className="text-[15px] font-extrabold text-[#0b2228]">Người chơi tích cực</h2>
            <div className="mt-3 grid gap-3">
              {activeCommunityPlayers.map((player) => (
                <div className="flex items-center gap-3" key={player.name}>
                  <img alt={player.name} className="community-avatar" src={player.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-extrabold">{player.name}</p>
                    <p className="text-[11px] font-semibold text-[#718077]">Trình độ {player.level}</p>
                  </div>
                  <CheckCircle2 aria-label="Người chơi nổi bật" className="h-[18px] w-[18px] text-[#477313]" />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </main>
    </CommunityPage>
  );
};
