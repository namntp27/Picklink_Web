import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
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
import { activeCommunityPlayers, currentCommunityUser, getCommunityPostById, trendingTopics } from '../../data/communityPosts';

const countComments = (comments: CommunityComment[]): number =>
  comments.reduce((total, comment) => total + 1 + countComments(comment.replies ?? []), 0);

const CommentItem = ({ comment, nested = false }: { comment: CommunityComment; nested?: boolean }) => (
  <div className={nested ? 'ml-12 border-l border-outline-variant pl-4' : ''}>
    <div className="flex gap-3">
      <img alt={comment.authorName} className="h-10 w-10 shrink-0 rounded-lg object-cover" src={comment.avatar} />
      <div className="min-w-0 flex-1">
        <div className="rounded-lg bg-[#f0f3ff] p-3">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[14px] font-bold">{comment.authorName}</h4>
            <span className="rounded-sm bg-white px-1.5 py-0.5 text-[11px] font-bold text-primary">Trình độ {comment.level}</span>
          </div>
          <p className="mt-2 text-[14px] leading-6 text-[#151c27]">{comment.content}</p>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4 px-2 text-[12px] font-bold text-[#555f6f]">
          <span>{comment.createdAt}</span>
          <button className="hover:text-primary" type="button">
            Thích
          </button>
          <button className="hover:text-primary" type="button">
            Trả lời
          </button>
          <span>{comment.likes} lượt thích</span>
        </div>
      </div>
    </div>

    {comment.replies && comment.replies.length > 0 && (
      <div className="mt-4 space-y-4">
        {comment.replies.map((reply) => (
          <CommentItem comment={reply} key={reply.id} nested />
        ))}
      </div>
    )}
  </div>
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

    if (!content) {
      return;
    }

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
    <div className="mx-auto flex min-h-screen max-w-[1180px] bg-[#f9f9ff] pt-[72px] text-[#151c27]">
      <main className="min-w-0 flex-1 px-4 py-5 pb-24 lg:px-6">
        <div className="mx-auto max-w-[760px] space-y-5">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/posts">
                <ArrowLeft className="h-4 w-4" />
                Quay lại bảng tin
              </Link>
              <h1 className="mt-3 text-[28px] font-bold leading-tight md:text-[36px]">Chi tiết bài viết</h1>
            </div>
            <Link className="inline-flex w-fit items-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90" to="/posts/create">
              <Send className="h-5 w-5" />
              Tạo bài viết
            </Link>
          </section>

          <article className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex min-w-0 gap-3">
                <img alt={post.authorName} className="h-12 w-12 shrink-0 rounded-lg object-cover" src={post.avatar} />
                <div className="min-w-0">
                  <h2 className="truncate text-[16px] font-bold">{post.authorName}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-[#555f6f]">
                    <span className="rounded-sm bg-[#e7eefe] px-1.5 py-0.5 font-bold text-primary">Trình độ {post.level}</span>
                    <span>{post.createdAt}</span>
                    <span>{post.location}</span>
                  </div>
                </div>
              </div>
              <button className="rounded-lg p-2 text-[#555f6f] hover:bg-[#f0f3ff]" type="button" aria-label="Tùy chọn bài viết">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>

            <h2 className="text-[24px] font-bold leading-tight">{post.title}</h2>
            <p className="mt-3 text-[15px] leading-7 text-[#151c27]">{post.content}</p>

            {post.lookingFor && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-primary/8 p-4">
                <p className="flex items-center gap-2 text-[14px] font-bold text-primary">
                  <Users className="h-5 w-5" />
                  {post.lookingFor}
                </p>
              </div>
            )}

            {post.image && <img alt={post.title} className="mt-4 h-[360px] w-full rounded-lg object-cover" src={post.image} />}

            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#f0f3ff] px-3 py-1 text-[12px] font-bold text-[#555f6f]" key={tag}>
                  <Hash className="h-3.5 w-3.5" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-y border-outline-variant/50 py-3 text-[13px] text-[#555f6f]">
              <span className="flex items-center gap-1 font-bold">
                <ThumbsUp className="h-4 w-4 text-primary" fill={liked ? 'currentColor' : 'none'} />
                {likeCount} lượt thích
              </span>
              <span>
                {visibleCommentCount} bình luận · {post.shares} chia sẻ
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <button
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-bold ${
                  liked ? 'bg-[#e7eefe] text-primary' : 'text-[#555f6f] hover:bg-[#f0f3ff]'
                }`}
                onClick={() => setLiked((current) => !current)}
                type="button"
              >
                <ThumbsUp className="h-5 w-5" fill={liked ? 'currentColor' : 'none'} />
                Thích
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-bold text-[#555f6f] hover:bg-[#f0f3ff]" type="button">
                <MessageCircle className="h-5 w-5" />
                Bình luận
              </button>
              <button className="flex items-center justify-center gap-2 rounded-lg py-2 text-[14px] font-bold text-[#555f6f] hover:bg-[#f0f3ff]" type="button">
                <Share2 className="h-5 w-5" />
                Chia sẻ
              </button>
            </div>
          </article>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="text-[20px] font-bold">Bình luận</h2>
            <div className="mt-4 flex gap-3">
              <img alt={currentCommunityUser.name} className="h-10 w-10 shrink-0 rounded-lg object-cover" src={currentCommunityUser.avatar} />
              <div className="min-w-0 flex-1">
                <textarea
                  className="min-h-[88px] w-full resize-none rounded-lg border border-outline-variant bg-[#f0f3ff] p-3 text-[14px] leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setCommentDraft(event.target.value)}
                  placeholder="Viết bình luận..."
                  value={commentDraft}
                />
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex gap-2">
                    <button className="rounded-lg p-2 text-[#555f6f] hover:bg-[#f0f3ff]" type="button" aria-label="Thêm ảnh">
                      <ImageIcon className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-[#555f6f] hover:bg-[#f0f3ff]" type="button" aria-label="Gắn địa điểm">
                      <MapPin className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white hover:bg-primary/90 disabled:bg-outline-variant disabled:text-[#555f6f]"
                    disabled={!commentDraft.trim()}
                    onClick={addComment}
                    type="button"
                  >
                    <Send className="h-4 w-4" />
                    Gửi
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {comments.map((comment) => (
                <CommentItem comment={comment} key={comment.id} />
              ))}
            </div>
          </section>
        </div>
      </main>

      <aside className="sticky top-[72px] hidden h-[calc(100vh-72px)] w-[340px] shrink-0 overflow-y-auto p-4 lg:block">
        <section className="mb-4 rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
          <h2 className="text-[18px] font-bold">Thông tin bài viết</h2>
          <div className="mt-4 space-y-3">
            {post.court && (
              <div className="rounded-lg bg-[#f0f3ff] p-3">
                <p className="text-[12px] font-bold uppercase text-[#555f6f]">Sân liên quan</p>
                <p className="mt-1 text-[14px] font-bold">{post.court}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-outline-variant p-3">
                <p className="text-[12px] font-bold text-[#555f6f]">Bình luận</p>
                <p className="mt-1 text-[20px] font-bold">{visibleCommentCount}</p>
              </div>
              <div className="rounded-lg border border-outline-variant p-3">
                <p className="text-[12px] font-bold text-[#555f6f]">Chia sẻ</p>
                <p className="mt-1 text-[20px] font-bold">{post.shares}</p>
              </div>
            </div>
            <button
              className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-bold ${
                saved ? 'bg-primary text-white' : 'border border-primary text-primary hover:bg-primary/10'
              }`}
              onClick={() => setSaved((current) => !current)}
              type="button"
            >
              <Bookmark className="h-5 w-5" fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Đã lưu bài viết' : 'Lưu bài viết'}
            </button>
            <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-[#555f6f] hover:bg-[#f0f3ff]" type="button">
              <Flag className="h-5 w-5" />
              Báo cáo bài viết
            </button>
          </div>
        </section>

        <section className="mb-4 rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
          <h2 className="text-[18px] font-bold">Chủ đề nổi bật</h2>
          <div className="mt-4 space-y-4">
            {trendingTopics.map((topic) => (
              <button className="block w-full text-left" key={topic.title} type="button">
                <p className="text-[12px] text-[#555f6f]">{topic.category}</p>
                <p className="mt-1 text-[14px] font-bold hover:text-primary">{topic.title}</p>
                <p className="mt-1 text-[12px] text-[#555f6f]">{topic.posts}</p>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
          <h2 className="text-[18px] font-bold">Người chơi tích cực</h2>
          <div className="mt-4 space-y-4">
            {activeCommunityPlayers.map((player) => (
              <div className="flex items-center justify-between gap-3" key={player.name}>
                <div className="flex min-w-0 items-center gap-3">
                  <img alt={player.name} className="h-10 w-10 rounded-lg object-cover" src={player.avatar} />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-bold">{player.name}</p>
                    <p className="text-[12px] text-[#555f6f]">Trình độ {player.level}</p>
                  </div>
                </div>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
};
