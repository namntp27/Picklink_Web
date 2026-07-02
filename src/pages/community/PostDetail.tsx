import { useEffect, useMemo, useState } from 'react';
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
  Loader2,
  UserRound,
  X,
} from 'lucide-react';
import { getCommunityPostById } from '../../data/communityPosts';
import { CommunityHero, CommunityPage } from './CommunityUI';
import { useAuth } from '../../auth/AuthContext';
import { getMyProfile, type PlayerProfile } from '../../api/profile';
import { uploadToCloudinary } from '../../api/cloudinary';
import {
  getGlobalPost,
  getPostComments,
  createComment,
  reactToPost,
  removeReaction,
  reactToComment,
  removeCommentReaction,
} from '../../api/community';

export type DisplayComment = {
  id: string;
  authorName: string;
  avatar: string;
  level: string;
  createdAt: string;
  content: string;
  imageUrl?: string;
  location?: string;
  likes: number;
  liked: boolean;
  replies?: DisplayComment[];
};

interface DisplayPost {
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
}

const parsePostContent = (rawContent: string | null) => {
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

const countComments = (comments: DisplayComment[]): number => (
  comments.reduce((total, comment) => total + 1 + countComments(comment.replies ?? []), 0)
);

const parseCommentContent = (rawContent: string | null) => {
  if (!rawContent) {
    return { text: '', imageUrl: '', location: '' };
  }
  try {
    const parsed = JSON.parse(rawContent);
    if (parsed && typeof parsed === 'object') {
      return {
        text: parsed.text || '',
        imageUrl: parsed.imageUrl || '',
        location: parsed.location || '',
      };
    }
  } catch {
    // Falls back to plaintext
  }
  return { text: rawContent, imageUrl: '', location: '' };
};

const buildCommentTree = (flatComments: any[]): DisplayComment[] => {
  const commentMap: Record<string, DisplayComment> = {};
  const roots: DisplayComment[] = [];

  flatComments.forEach((c) => {
    const parsed = parseCommentContent(c.content);
    commentMap[String(c.commentId)] = {
      id: String(c.commentId),
      authorName: c.username || 'Người chơi',
      avatar: c.userAvatarUrl || 'https://i.pravatar.cc/150?u=' + c.userId,
      level: '3.5',
      createdAt: new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(c.createdAt)),
      content: parsed.text,
      imageUrl: parsed.imageUrl,
      location: parsed.location,
      likes: c.likeCount || 0,
      liked: c.likedByMe || false,
      replies: []
    };
  });

  flatComments.forEach((c) => {
    const displayComment = commentMap[String(c.commentId)];
    if (c.parentCommentId && commentMap[String(c.parentCommentId)]) {
      const parent = commentMap[String(c.parentCommentId)];
      if (!parent.replies) parent.replies = [];
      parent.replies.push(displayComment);
    } else {
      roots.push(displayComment);
    }
  });

  return roots;
};

const CommentItem = ({
  comment,
  nested = false,
  onReply,
  onLike,
}: {
  comment: DisplayComment;
  nested?: boolean;
  onReply?: (target: { id: string; authorName: string }) => void;
  onLike?: (commentId: string) => void;
}) => (
  <article className={nested ? 'ml-6 border-l border-[#d8e4d4] pl-3 sm:ml-10 sm:pl-4' : ''}>
    <div className="flex gap-3">
      <img alt={comment.authorName} className="community-avatar" src={comment.avatar} />
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-[#f0f6ed] p-3 shadow-sm border border-[#e8efe5]">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[13px] font-extrabold text-[#0b2228]">{comment.authorName}</h3>
            <span className="community-badge !min-h-5 !px-2 !py-1">Trình độ {comment.level}</span>
            {comment.location && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#477313] bg-[#edf5e9] px-2 py-0.5 rounded-full">
                <MapPin className="h-3 w-3" />
                {comment.location}
              </span>
            )}
          </div>
          <p className="mt-2 text-[13px] leading-6 text-[#405048] whitespace-pre-wrap">{comment.content}</p>
          {comment.imageUrl && (
            <div className="mt-3 overflow-hidden rounded-lg border border-[#d8e4d4] max-w-[280px] bg-white">
              <img src={comment.imageUrl} alt="Attached attachment" className="max-w-full h-auto object-contain" />
            </div>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-3 px-2 text-[11px] font-bold text-[#718077]">
          <span>{comment.createdAt}</span>
          <button 
            onClick={() => onLike && onLike(comment.id)}
            className={`transition-colors font-bold ${comment.liked ? 'text-[#477313]' : 'hover:text-[#477313]'}`}
            type="button"
          >
            {comment.liked ? 'Đã thích' : 'Thích'}
          </button>
          {onReply && (
            <button 
              onClick={() => onReply({ id: comment.id, authorName: comment.authorName })}
              className="transition-colors hover:text-[#477313]" 
              type="button"
            >
              Trả lời
            </button>
          )}
          <span>{comment.likes} lượt thích</span>
        </div>
      </div>
    </div>

    {comment.replies && comment.replies.length > 0 && (
      <div className="mt-4 grid gap-4">
        {comment.replies.map((reply) => (
          <CommentItem comment={reply} key={reply.id} nested onReply={onReply} onLike={onLike} />
        ))}
      </div>
    )}
  </article>
);

export const PostDetail = () => {
  const { id } = useParams();
  const { token, user } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  const [post, setPost] = useState<DisplayPost | null>(null);
  const [comments, setComments] = useState<DisplayComment[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [commentImageUrl, setCommentImageUrl] = useState('');
  const [commentLocation, setCommentLocation] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; authorName: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingComment, setSubmittingComment] = useState(false);

  const isMock = id?.startsWith('mock-');

  const loadPostDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      if (isMock) {
        const originalId = id.replace('mock-', '');
        const mockPost = getCommunityPostById(originalId);
        setPost({
          id: id,
          authorName: mockPost.authorName,
          avatar: mockPost.avatar,
          level: mockPost.level,
          location: mockPost.location,
          createdAt: mockPost.createdAt,
          title: mockPost.title,
          content: mockPost.content,
          image: mockPost.image,
          tags: mockPost.tags,
          lookingFor: mockPost.lookingFor,
          likes: mockPost.likes,
          comments: mockPost.comments,
          shares: mockPost.shares,
          liked: mockPost.liked,
          saved: mockPost.saved,
          matchId: null
        });
        
        // Map mock comment structures
        const mappedMockComments: DisplayComment[] = mockPost.commentList.map((c) => {
          const parsed = parseCommentContent(c.content);
          return {
            id: c.id,
            authorName: c.authorName,
            avatar: c.avatar,
            level: c.level,
            createdAt: c.createdAt,
            content: parsed.text,
            imageUrl: parsed.imageUrl,
            location: parsed.location,
            likes: c.likes,
            liked: false,
            replies: (c.replies || []).map((r) => {
              const parsedReply = parseCommentContent(r.content);
              return {
                id: r.id,
                authorName: r.authorName,
                avatar: r.avatar,
                level: r.level,
                createdAt: r.createdAt,
                content: parsedReply.text,
                imageUrl: parsedReply.imageUrl,
                location: parsedReply.location,
                likes: r.likes,
                liked: false
              };
            })
          };
        });
        setComments(mappedMockComments);
      } else {
        const postNumId = Number(id);
        const backendPost = await getGlobalPost(postNumId, token);
        const parsed = parsePostContent(backendPost.content);
        
        let formattedDate = 'Vừa xong';
        try {
          formattedDate = new Intl.DateTimeFormat('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(backendPost.createdAt));
        } catch {
          // ignore date parse issues
        }

        setPost({
          id: String(backendPost.postId),
          authorName: backendPost.authorName || 'Thành viên Picklink',
          avatar: backendPost.authorAvatarUrl || 'https://i.pravatar.cc/150?u=' + backendPost.authorId,
          level: '3.5',
          location: parsed.location || 'Hà Nội',
          createdAt: formattedDate,
          title: parsed.title || 'Bài viết mới',
          content: parsed.body,
          image: backendPost.mediaUrls && backendPost.mediaUrls.length > 0 ? backendPost.mediaUrls[0] : undefined,
          tags: parsed.tags || [],
          lookingFor: parsed.lookingFor && parsed.slots
            ? `Cần ${parsed.slots} slot · Trình ${parsed.levelRange || '-'} · ${parsed.playTime || '-'}`
            : undefined,
          likes: backendPost.likeCount || 0,
          comments: backendPost.commentCount || 0,
          shares: 0,
          liked: backendPost.likedByMe || false,
          saved: false,
          matchId: parsed.matchId
        });

        // Load comments if authenticated
        if (token) {
          const flatComments = await getPostComments(postNumId, token);
          const commentTree = buildCommentTree(flatComments);
          setComments(commentTree);
        }
      }
    } catch (err) {
      console.error('Failed to load post details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPostDetails();
  }, [id, token]);

  useEffect(() => {
    if (token) {
      getMyProfile(token)
        .then(setProfile)
        .catch(() => {});
    }
  }, [token]);

  const handleLikeToggle = async () => {
    if (!token || !post || isMock) return;

    const originalLiked = post.liked;
    const originalLikes = post.likes;

    // Optimistically update local state immediately
    setPost((prev) =>
      prev
        ? {
            ...prev,
            liked: !originalLiked,
            likes: originalLiked ? Math.max(0, originalLikes - 1) : originalLikes + 1,
          }
        : null
    );

    try {
      const postNumId = Number(post.id);
      if (originalLiked) {
        await removeReaction(token, postNumId);
      } else {
        await reactToPost(token, postNumId);
      }
      
      // Silently sync state with server
      const backendPost = await getGlobalPost(postNumId, token);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              liked: backendPost.likedByMe,
              likes: backendPost.likeCount,
            }
          : null
      );
    } catch (err) {
      console.error('Failed to toggle like:', err);
      // Revert if error
      setPost((prev) =>
        prev
          ? {
              ...prev,
              liked: originalLiked,
              likes: originalLikes,
            }
          : null
      );
    }
  };

  const addComment = async () => {
    const text = commentDraft.trim();
    if (!text && !commentImageUrl && !commentLocation) return;
    if (!token || !post) return;

    // Serialize to JSON if we have image or location
    let finalContent = text;
    if (commentImageUrl || commentLocation) {
      finalContent = JSON.stringify({
        text,
        imageUrl: commentImageUrl,
        location: commentLocation
      });
    }

    if (isMock) {
      // Mock flow comment addition
      setComments((currentComments) => [
        {
          id: `comment-${Date.now()}`,
          authorName: user?.name || 'Người dùng',
          avatar: user?.avatar || profile?.profileImageUrl || '',
          level: '3.5',
          createdAt: 'Vừa xong',
          content: text, // Plain text display for mock tree
          imageUrl: commentImageUrl,
          location: commentLocation,
          likes: 0,
          liked: false,
          replies: []
        },
        ...currentComments,
      ]);
      setCommentDraft('');
      setCommentImageUrl('');
      setCommentLocation('');
      setReplyingTo(null);
      return;
    }

    setSubmittingComment(true);
    try {
      const postNumId = Number(post.id);
      const parentId = replyingTo ? Number(replyingTo.id) : null;
      await createComment(token, postNumId, finalContent, parentId);
      setCommentDraft('');
      setCommentImageUrl('');
      setCommentLocation('');
      setReplyingTo(null);
      // Reload comments
      const flatComments = await getPostComments(postNumId, token);
      const commentTree = buildCommentTree(flatComments);
      setComments(commentTree);
    } catch (err) {
      alert('Không thể đăng bình luận.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    setUploadingImage(true);
    try {
      const { url } = await uploadToCloudinary(token, file);
      setCommentImageUrl(url);
    } catch (err: any) {
      alert(err.message || 'Không thể tải ảnh lên.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAttachLocation = () => {
    const loc = prompt('Nhập địa điểm hoạt động hoặc vị trí:');
    if (loc !== null) {
      setCommentLocation(loc.trim());
    }
  };

  const handleCommentLikeToggle = async (commentId: string) => {
    if (!token || isMock) return;

    // Helper function to recursively toggle liked status in comment list
    const updateCommentLikedStatus = (list: DisplayComment[]): DisplayComment[] => {
      return list.map((c) => {
        if (c.id === commentId) {
          const nextLiked = !c.liked;
          return {
            ...c,
            liked: nextLiked,
            likes: nextLiked ? c.likes + 1 : Math.max(0, c.likes - 1)
          };
        }
        if (c.replies && c.replies.length > 0) {
          return {
            ...c,
            replies: updateCommentLikedStatus(c.replies)
          };
        }
        return c;
      });
    };

    // Optimistically update
    setComments((prev) => updateCommentLikedStatus(prev));

    try {
      const commentNumId = Number(commentId);
      // Find the comment to see its original liked status
      const findComment = (list: DisplayComment[]): DisplayComment | null => {
        for (const c of list) {
          if (c.id === commentId) return c;
          if (c.replies && c.replies.length > 0) {
            const found = findComment(c.replies);
            if (found) return found;
          }
        }
        return null;
      };

      const targetComment = findComment(comments);
      if (targetComment) {
        if (targetComment.liked) {
          // It was liked, so unlike it
          await removeCommentReaction(token, commentNumId);
        } else {
          // It was not liked, so like it
          await reactToComment(token, commentNumId);
        }
      }
    } catch (err) {
      console.error('Failed to toggle comment like:', err);
      // Revert status on failure
      setComments((prev) => updateCommentLikedStatus(prev));
    }
  };

  const visibleCommentCount = useMemo(() => countComments(comments), [comments]);
  const currentAvatar = user?.avatar || profile?.profileImageUrl || '';
  const currentName = user?.name || 'Thành viên';

  if (loading) {
    return (
      <CommunityPage>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#477313]" />
          <p className="text-[14px] font-semibold text-[#718077]">Đang tải chi tiết bài viết...</p>
        </div>
      </CommunityPage>
    );
  }

  if (!post) {
    return (
      <CommunityPage>
        <div className="text-center py-20">
          <h2 className="text-[20px] font-extrabold text-[#0b2228]">Bài viết không tồn tại</h2>
          <p className="text-[14px] text-[#718077] mt-2">Bài viết bạn tìm kiếm có thể đã bị xóa hoặc không hợp lệ.</p>
          <Link className="community-button mt-4 inline-flex" to="/posts">Quay lại bảng tin</Link>
        </div>
      </CommunityPage>
    );
  }

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
                      <span className="inline-flex items-center gap-1">
                        <MapPin aria-hidden="true" className="h-3 w-3" />
                        {post.location}
                      </span>
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
              <p className="mt-3 text-[14px] leading-7 text-[#405048] whitespace-pre-wrap">{post.content}</p>

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
                  <ThumbsUp aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" fill={post.liked ? 'currentColor' : 'none'} />
                  {post.likes} lượt thích
                </span>
                <span>{visibleCommentCount} bình luận · {post.shares} chia sẻ</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1 border-t border-[#e0e9dc] pt-2">
                <button
                  className={`community-button-quiet !min-h-9 !px-2 ${post.liked ? '!bg-[#edf5e9] !text-[#477313]' : ''}`}
                  onClick={handleLikeToggle}
                  type="button"
                >
                  <ThumbsUp aria-hidden="true" className="h-[17px] w-[17px]" fill={post.liked ? 'currentColor' : 'none'} />
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
            {token ? (
              <div className="mt-4 flex gap-3">
                {currentAvatar ? (
                  <img alt={currentName} className="community-avatar" src={currentAvatar} />
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]">
                    <UserRound className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  {replyingTo && (
                    <div className="mb-2.5 flex items-center justify-between rounded-lg bg-[#f0f6ed] px-3 py-1.5 text-[12px] font-bold text-[#477313]">
                      <span>Đang trả lời bình luận của {replyingTo.authorName}...</span>
                      <button onClick={() => setReplyingTo(null)} className="text-[#ba1a1a] hover:opacity-80">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {commentLocation && (
                    <div className="mb-2.5 flex items-center justify-between rounded-lg bg-[#f0f6ed] px-3 py-1 text-[12px] font-bold text-[#477313] border border-[#d8e4d4]">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5" />
                        Vị trí: {commentLocation}
                      </span>
                      <button onClick={() => setCommentLocation('')} className="text-[#ba1a1a] hover:opacity-80">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}

                  {commentImageUrl && (
                    <div className="mb-2.5 relative w-20 aspect-video rounded-lg overflow-hidden border border-[#d8e4d4] bg-white group">
                      <img src={commentImageUrl} alt="Comment preview" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setCommentImageUrl('')}
                        className="absolute top-1 right-1 rounded-full bg-black/60 p-0.5 text-white hover:bg-[#ba1a1a]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {uploadingImage && (
                    <div className="mb-2.5 flex items-center gap-2 rounded-lg bg-[#f0f6ed] p-2 text-[12px] font-bold text-[#477313] border border-dashed border-[#d8e4d4]">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Đang tải ảnh lên Cloudinary...</span>
                    </div>
                  )}

                  <label className="sr-only" htmlFor="post-comment">Viết bình luận</label>
                  <textarea
                    className="community-control min-h-[88px] resize-none"
                    id="post-comment"
                    onChange={(event) => setCommentDraft(event.target.value)}
                    placeholder="Viết bình luận..."
                    value={commentDraft}
                    disabled={submittingComment || uploadingImage}
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <div className="flex gap-1">
                      <button
                        aria-label="Thêm ảnh"
                        className="community-icon-button"
                        title="Thêm ảnh"
                        type="button"
                        onClick={() => document.getElementById('comment-image-input')?.click()}
                        disabled={uploadingImage}
                      >
                        <ImageIcon aria-hidden="true" className="h-4 w-4" />
                      </button>
                      <input
                        id="comment-image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleCommentImageUpload}
                        disabled={uploadingImage}
                      />
                      <button
                        aria-label="Gắn địa điểm"
                        className="community-icon-button"
                        title="Gắn địa điểm"
                        type="button"
                        onClick={handleAttachLocation}
                      >
                        <MapPin aria-hidden="true" className="h-4 w-4" />
                      </button>
                    </div>
                    <button
                      className="community-button !min-h-9"
                      disabled={(!commentDraft.trim() && !commentImageUrl && !commentLocation) || submittingComment || uploadingImage}
                      onClick={addComment}
                      type="button"
                    >
                      {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
                      Gửi
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-[#d8e4d4] bg-[#f4f8f2] p-4 text-center">
                <p className="text-[13px] font-bold text-[#526158]">Đăng nhập để xem và tham gia thảo luận bài viết này.</p>
                <Link className="community-button mt-3 inline-flex" to="/login">Đăng nhập</Link>
              </div>
            )}

            <div className="mt-6 grid gap-5">
              {comments.map((comment) => (
                <CommentItem 
                  comment={comment} 
                  key={comment.id} 
                  onReply={(target) => {
                    setReplyingTo(target);
                    const el = document.getElementById('post-comment');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                      el.focus();
                    }
                  }}
                  onLike={handleCommentLikeToggle}
                />
              ))}
              {comments.length === 0 && (
                <p className="text-center py-6 text-[13px] font-medium text-[#718077]">Chưa có bình luận nào cho bài viết này.</p>
              )}
            </div>
          </section>
        </div>

        <aside className="grid gap-4 lg:sticky lg:top-20">
          <section className="community-panel p-4">
            <h2 className="text-[15px] font-extrabold text-[#0b2228]">Thông tin bài viết</h2>
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
            <button className="community-button-secondary mt-3 w-full" type="button">
              <Bookmark aria-hidden="true" className="h-4 w-4" />
              Lưu bài viết
            </button>
            <button className="community-button-quiet mt-1 w-full" type="button">
              <Flag aria-hidden="true" className="h-4 w-4" />
              Báo cáo bài viết
            </button>
          </section>
        </aside>
      </main>
    </CommunityPage>
  );
};
