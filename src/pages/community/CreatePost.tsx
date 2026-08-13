import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, Globe2, Image as ImageIcon, Loader2, MessageCircle, Send, ThumbsUp, UserRound, Users, X } from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { getMyProfile } from '../../api/profile';
import { deleteUploadedMedia, uploadToCloudinary } from '../../api/cloudinary';
import { createGlobalPost, createGroupPost, getGroups, type CommunityGroup } from '../../api/community';
import { CommunityHero, CommunityPage } from './CommunityUI';
import { useToast } from '../../components/ui/ToastRegion';
import { useApiQuery } from '../../hooks/useApiQuery';

const emptyGroups: CommunityGroup[] = [];

export const CreatePost = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const notify = useToast();
  const [searchParams] = useSearchParams();
  const requestedGroupId = Number(searchParams.get('groupId')) || null;
  const isClubPost = searchParams.get('visibility') === 'club';
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const { data: profile = null } = useApiQuery(
    ['my-profile', token],
    () => getMyProfile(token!),
    { enabled: Boolean(token) && user?.role === 'player' },
  );
  const { data: userGroups = emptyGroups, loading: loadingGroups } = useApiQuery(
    ['my-groups', token],
    () => getGroups(token!, undefined, undefined, undefined, 'Mine'),
    { enabled: Boolean(token) && isClubPost },
  );

  const selectedClub = useMemo(() => userGroups.find((group) => group.groupId === requestedGroupId), [requestedGroupId, userGroups]);
  const name = user?.name || 'Người chơi';
  const avatarUrl = user?.avatar || profile?.profileImageUrl;
  const canPublish = content.trim().length >= 10 && (!isClubPost || Boolean(selectedClub));

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !token) return;

    setUploadingImage(true);
    setUploadProgress(0);
    try {
      const { url } = await uploadToCloudinary(token, file, setUploadProgress, 'picklink_posts');
      setImageUrl(url);
    } catch (error: unknown) {
      notify(error instanceof Error ? error.message : 'Không thể tải ảnh lên.', 'error');
    } finally {
      setUploadingImage(false);
      setUploadProgress(null);
    }
  };

  const handleDeleteImage = () => {
    if (token && imageUrl) void deleteUploadedMedia(token, imageUrl);
    setImageUrl('');
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token || !canPublish) return;

    setSubmitting(true);
    try {
      const serializedContent = JSON.stringify({
        title: '',
        body: content.trim(),
        location: '',
        mode: 'discussion',
        lookingFor: false,
        slots: '',
        levelRange: '',
        playTime: '',
        matchId: null,
        tags: [],
      });
      const mediaUrls = imageUrl ? [imageUrl] : [];

      if (isClubPost) {
        if (!requestedGroupId || !selectedClub) {
          notify('Không thể xác nhận câu lạc bộ để đăng bài.', 'error');
          return;
        }
        await createGroupPost(token, requestedGroupId, { content: serializedContent, mediaUrls });
        navigate(`/clubs/${requestedGroupId}`);
      } else {
        await createGlobalPost(token, {
          content: serializedContent,
          mediaUrls,
          visibility: 'Public',
        });
        navigate('/posts');
      }
    } catch (error: unknown) {
      notify(error instanceof Error ? error.message : 'Không thể tạo bài viết.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <CommunityPage>
      <CommunityHero
        actions={(
          <>
            <Link className="community-button-secondary" to={isClubPost ? `/clubs/${requestedGroupId}` : '/posts'}><X aria-hidden="true" className="h-4 w-4" />Hủy</Link>
            <button className="community-button" disabled={!canPublish || submitting} form="create-community-post" type="submit">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send aria-hidden="true" className="h-4 w-4" />}
              Đăng bài
            </button>
          </>
        )}
        backLink={{ label: isClubPost ? 'Quay lại CLB' : 'Quay lại bảng tin', to: isClubPost ? `/clubs/${requestedGroupId}` : '/posts' }}
        description="Chia sẻ nhanh với cộng đồng Picklink."
        icon={MessageCircle}
        label="Cộng đồng Picklink"
        title="Tạo bài viết"
      />

      <form className="community-container grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]" id="create-community-post" onSubmit={handleSubmit}>
        <main className="min-w-0 space-y-5">
          <section className="community-panel p-4 sm:p-5">
            <div className="flex items-center gap-3 border-b border-[#e0e9dc] pb-4">
              {avatarUrl ? <img alt={name} className="community-avatar community-avatar--lg" src={avatarUrl} /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#e0e9dc] text-[#477313]"><UserRound className="h-6 w-6" /></div>}
              <div className="min-w-0"><h2 className="truncate text-[14px] font-extrabold text-[#0b2228]">{name}</h2><p className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-[#718077]">{isClubPost ? <Users aria-hidden="true" className="h-3.5 w-3.5" /> : <Globe2 aria-hidden="true" className="h-3.5 w-3.5" />}{isClubPost ? selectedClub?.groupName || 'Trong CLB' : 'Công khai'}</p></div>
            </div>

            {isClubPost && loadingGroups && <p className="mt-3 flex items-center gap-2 text-[12px] font-semibold text-[#718077]"><Loader2 className="h-4 w-4 animate-spin" />Đang xác nhận CLB...</p>}

            <label className="mt-4 block">
              <span className="mb-1.5 block text-[12px] font-extrabold text-[#526158]">Nội dung bài viết</span>
              <textarea className="community-control min-h-[180px]" maxLength={1200} onChange={(event) => setContent(event.target.value)} placeholder="Bạn muốn chia sẻ điều gì?" value={content} />
            </label>
            <p className="mt-2 text-right text-[11px] font-semibold text-[#718077]">{content.length}/1200 ký tự</p>
          </section>

          <section className="community-panel p-4 sm:p-5">
            <span className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-[#0b2228]"><ImageIcon className="h-4 w-4 text-[#477313]" />Ảnh bài viết</span>
            {imageUrl ? (
              <div className="flex items-center justify-between gap-4 rounded-lg border border-[#d8e4d4] bg-[#f8f9fa] p-4"><img alt="Ảnh đã chọn" className="h-16 w-24 rounded-md border border-[#d8e4d4] object-cover" src={imageUrl} /><button className="rounded-lg bg-[#ffdad6] px-3 py-2 text-[13px] font-bold text-[#ba1a1a]" onClick={handleDeleteImage} type="button">Xóa ảnh</button></div>
            ) : (
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#d8e4d4] p-6 hover:bg-[#edf5e9]">
                <ImageIcon className="mb-2 h-8 w-8 text-[#555f6f]" /><span className="text-[13px] font-bold text-[#555f6f]">{uploadingImage ? 'Đang tải ảnh...' : 'Chọn ảnh tải lên'}</span>
                <input ref={imageInputRef} accept="image/*" className="sr-only" disabled={uploadingImage} onChange={handleImageUpload} type="file" />
              </label>
            )}
            {uploadingImage && uploadProgress !== null && <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#f0f3ff]"><div className="h-full rounded-full bg-[#477313]" style={{ width: `${uploadProgress}%` }} /></div>}
          </section>
        </main>

        <aside className="grid gap-4 lg:sticky lg:top-20">
          <section className="community-panel p-4">
            <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-[#0b2228]"><Eye aria-hidden="true" className="h-[18px] w-[18px] text-[#477313]" />Xem trước</h2>
            <article className="mt-4 overflow-hidden rounded-xl border border-[#d8e4d4] bg-white">
              <div className="p-3">
                <div className="flex gap-3">
                  {avatarUrl ? <img alt={name} className="community-avatar" src={avatarUrl} /> : <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#edf5e9] text-[#477313]"><UserRound className="h-4 w-4" /></div>}
                  <div className="min-w-0"><p className="truncate text-[13px] font-extrabold">{name}</p><p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#718077]">{isClubPost ? <Users className="h-3.5 w-3.5" /> : <Globe2 className="h-3.5 w-3.5" />}{selectedClub?.groupName || (isClubPost ? 'Trong CLB' : 'Công khai')}</p></div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-[12px] leading-5 text-[#66756b]">{content || 'Nội dung bài viết sẽ hiển thị tại đây.'}</p>
              </div>
              {imageUrl ? <img alt="Ảnh xem trước" className="h-40 w-full object-cover" src={imageUrl} /> : <div className="grid h-32 place-items-center bg-[#edf5e9] text-[#81907f]"><ImageIcon className="h-7 w-7" /></div>}
              <div className="grid grid-cols-3 gap-1 border-t border-[#e0e9dc] p-2"><span className="community-button-quiet !min-h-8 !px-1 text-[11px]"><ThumbsUp className="h-3.5 w-3.5" />Thích</span><span className="community-button-quiet !min-h-8 !px-1 text-[11px]"><MessageCircle className="h-3.5 w-3.5" />Bình luận</span><span className="community-button-quiet !min-h-8 !px-1 text-[11px]"><Send className="h-3.5 w-3.5" />Gửi</span></div>
            </article>
          </section>
        </aside>
      </form>
    </CommunityPage>
  );
};
