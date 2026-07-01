import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Eye,
  Globe2,
  Hash,
  Image as ImageIcon,
  Lock,
  MapPin,
  MessageCircle,
  Send,
  ThumbsUp,
  Users,
  X,
} from 'lucide-react';
import { currentCommunityUser } from '../../data/communityPosts';
import { CommunityHero, CommunityPage } from './CommunityUI';

type Visibility = 'public' | 'club' | 'friends';
type PostMode = 'discussion' | 'find_players' | 'review' | 'training';

const modeOptions: Array<{ label: string; value: PostMode }> = [
  { label: 'Thảo luận', value: 'discussion' },
  { label: 'Tìm người chơi', value: 'find_players' },
  { label: 'Review sân / dụng cụ', value: 'review' },
  { label: 'Kỹ thuật tập luyện', value: 'training' },
];

const visibilityOptions: Array<{ label: string; value: Visibility; icon: typeof Globe2 }> = [
  { label: 'Công khai', value: 'public', icon: Globe2 },
  { label: 'Trong CLB', value: 'club', icon: Users },
  { label: 'Bạn bè', value: 'friends', icon: Lock },
];

const FieldLabel = ({
  children,
  icon: Icon,
}: {
  children: React.ReactNode;
  icon?: React.ElementType;
}) => (
  <span className="mb-1.5 flex items-center gap-2 text-[12px] font-extrabold text-[#526158]">
    {Icon && <Icon aria-hidden="true" className="h-4 w-4 text-[#477313]" />}
    {children}
  </span>
);

export const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mode, setMode] = useState<PostMode>('discussion');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [court, setCourt] = useState('Sân Pickleball Cầu Giấy');
  const [location, setLocation] = useState(currentCommunityUser.location);
  const [imageUrl, setImageUrl] = useState('');
  const [tagDraft, setTagDraft] = useState('Tìm đồng đội, Pickleball');
  const [lookingFor, setLookingFor] = useState(false);
  const [slots, setSlots] = useState('2');
  const [levelRange, setLevelRange] = useState('3.0 - 4.0');
  const [playTime, setPlayTime] = useState('18:00 - 20:00 hôm nay');
  const [published, setPublished] = useState(false);

  const tags = useMemo(
    () => tagDraft
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 5),
    [tagDraft],
  );
  const selectedVisibility = visibilityOptions.find((option) => option.value === visibility) ?? visibilityOptions[0];
  const VisibilityIcon = selectedVisibility.icon;
  const canPublish = title.trim().length > 0 && content.trim().length >= 10;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canPublish) return;
    setPublished(true);
  };

  return (
    <CommunityPage>
      <CommunityHero
        actions={(
          <>
            <Link className="community-button-secondary" to="/posts">
              <X aria-hidden="true" className="h-4 w-4" />
              Hủy
            </Link>
            <button className="community-button" disabled={!canPublish} form="create-community-post" type="submit">
              <Send aria-hidden="true" className="h-4 w-4" />
              Đăng bài
            </button>
          </>
        )}
        backLink={{ label: 'Quay lại bảng tin', to: '/posts' }}
        description="Chia sẻ trận đấu, tìm người chơi, review sân hoặc đăng kinh nghiệm tập luyện."
        icon={MessageCircle}
        label="Cộng đồng Picklink"
        title="Tạo bài viết"
      />

      <form
        className="community-container grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]"
        id="create-community-post"
        onSubmit={handleSubmit}
      >
        <main className="min-w-0 space-y-5">
          {published && (
            <section className="rounded-xl border border-[#b9d4ae] bg-[#eaf6e5] p-4 text-[#365c16]">
              <div className="flex items-start gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-[13px] font-extrabold">Bài viết đã sẵn sàng trong bản nháp giao diện.</p>
                  <Link className="mt-1 inline-flex text-[12px] font-bold underline" to="/posts">Về bảng tin</Link>
                </div>
              </div>
            </section>
          )}

          <section className="community-panel p-4 sm:p-5">
            <div className="flex items-center gap-3 border-b border-[#e0e9dc] pb-4">
              <img alt={currentCommunityUser.name} className="community-avatar community-avatar--lg" src={currentCommunityUser.avatar} />
              <div className="min-w-0">
                <h2 className="truncate text-[14px] font-extrabold text-[#0b2228]">{currentCommunityUser.name}</h2>
                <p className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-[#718077]">
                  <VisibilityIcon aria-hidden="true" className="h-3.5 w-3.5" />
                  {selectedVisibility.label} · Trình độ {currentCommunityUser.level}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label>
                <FieldLabel>Chủ đề bài viết</FieldLabel>
                <select className="community-control" onChange={(event) => setMode(event.target.value as PostMode)} value={mode}>
                  {modeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label>
                <FieldLabel>Hiển thị</FieldLabel>
                <select className="community-control" onChange={(event) => setVisibility(event.target.value as Visibility)} value={visibility}>
                  {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <label className="mt-4 block">
              <FieldLabel>Tiêu đề</FieldLabel>
              <input
                className="community-control !h-11 text-[14px] font-bold"
                maxLength={90}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Tìm đồng đội đánh đôi tối nay ở Cầu Giấy"
                value={title}
              />
            </label>

            <label className="mt-4 block">
              <FieldLabel>Nội dung</FieldLabel>
              <textarea
                className="community-control min-h-[160px]"
                maxLength={1200}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Chia sẻ nội dung bài viết..."
                value={content}
              />
            </label>
            <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-[#718077]">
              <span>{content.length}/1200 ký tự</span>
              <span>{title.length}/90 tiêu đề</span>
            </div>
          </section>

          <section className="community-panel p-4 sm:p-5">
            <div className="mb-4">
              <h2 className="text-[17px] font-extrabold tracking-[-0.02em] text-[#0b2228]">Thông tin gắn kèm</h2>
              <p className="mt-1 text-[12px] leading-5 text-[#718077]">Giúp bài viết dễ được tìm thấy và đặt đúng bối cảnh.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <FieldLabel icon={MapPin}>Địa điểm</FieldLabel>
                <input className="community-control" onChange={(event) => setLocation(event.target.value)} value={location} />
              </label>
              <label>
                <FieldLabel icon={CalendarDays}>Sân / lịch liên quan</FieldLabel>
                <input className="community-control" onChange={(event) => setCourt(event.target.value)} value={court} />
              </label>
              <label>
                <FieldLabel icon={Hash}>Thẻ chủ đề</FieldLabel>
                <input className="community-control" onChange={(event) => setTagDraft(event.target.value)} value={tagDraft} />
              </label>
              <label>
                <FieldLabel icon={ImageIcon}>Ảnh bài viết</FieldLabel>
                <input
                  className="community-control"
                  onChange={(event) => setImageUrl(event.target.value)}
                  placeholder="Dán URL ảnh"
                  value={imageUrl}
                />
              </label>
            </div>
          </section>

          <section className="community-panel p-4 sm:p-5">
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="flex items-center gap-2 text-[17px] font-extrabold text-[#0b2228]">
                  <Users aria-hidden="true" className="h-5 w-5 text-[#477313]" />
                  Tìm người chơi
                </span>
                <span className="mt-1 block text-[12px] leading-5 text-[#718077]">Bật khi bài viết cần ghép thêm người tham gia trận.</span>
              </span>
              <span className="relative mt-1 inline-flex shrink-0">
                <input
                  checked={lookingFor}
                  className="peer h-5 w-9 cursor-pointer appearance-none rounded-full bg-[#d5dfd1] transition-colors checked:bg-[#477313]"
                  onChange={(event) => setLookingFor(event.target.checked)}
                  type="checkbox"
                />
                <span className="pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
              </span>
            </label>

            {lookingFor && (
              <div className="mt-4 grid gap-4 border-t border-[#e0e9dc] pt-4 sm:grid-cols-3">
                <label>
                  <FieldLabel>Số slot</FieldLabel>
                  <input className="community-control" onChange={(event) => setSlots(event.target.value)} type="number" value={slots} />
                </label>
                <label>
                  <FieldLabel>Trình độ</FieldLabel>
                  <input className="community-control" onChange={(event) => setLevelRange(event.target.value)} value={levelRange} />
                </label>
                <label>
                  <FieldLabel>Thời gian</FieldLabel>
                  <input className="community-control" onChange={(event) => setPlayTime(event.target.value)} value={playTime} />
                </label>
              </div>
            )}
          </section>
        </main>

        <aside className="grid gap-4 lg:sticky lg:top-20">
          <section className="community-panel p-4">
            <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-[#0b2228]">
              <Eye aria-hidden="true" className="h-[18px] w-[18px] text-[#477313]" />
              Xem trước
            </h2>
            <article className="mt-4 overflow-hidden rounded-xl border border-[#d8e4d4] bg-white">
              <div className="p-3">
                <div className="flex gap-3">
                  <img alt={currentCommunityUser.name} className="community-avatar" src={currentCommunityUser.avatar} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-extrabold">{currentCommunityUser.name}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#718077]">
                      <VisibilityIcon aria-hidden="true" className="h-3 w-3" />
                      {selectedVisibility.label}
                    </p>
                  </div>
                </div>
                <h3 className="mt-3 text-[15px] font-extrabold leading-5 text-[#0b2228]">{title || 'Tiêu đề bài viết'}</h3>
                <p className="mt-2 text-[12px] leading-5 text-[#66756b]">{content || 'Nội dung bài viết sẽ hiển thị tại đây.'}</p>

                {lookingFor && (
                  <div className="mt-3 rounded-xl bg-[#edf5e9] p-3 text-[11px] font-extrabold text-[#477313]">
                    Cần {slots || '0'} slot · Trình {levelRange || '-'} · {playTime || '-'}
                  </div>
                )}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {tags.map((tag) => <span className="community-badge !min-h-5 !px-2 !py-1" key={tag}>#{tag}</span>)}
                </div>
              </div>

              {imageUrl ? (
                <img alt="Ảnh xem trước" className="h-40 w-full bg-[#dfeadc] object-cover" src={imageUrl} />
              ) : (
                <div className="grid h-32 place-items-center bg-[#edf5e9] text-[#81907f]">
                  <ImageIcon aria-hidden="true" className="h-7 w-7" />
                </div>
              )}

              <div className="grid grid-cols-3 gap-1 border-t border-[#e0e9dc] p-2">
                <span className="community-button-quiet !min-h-8 !px-1 text-[11px]"><ThumbsUp className="h-3.5 w-3.5" />Thích</span>
                <span className="community-button-quiet !min-h-8 !px-1 text-[11px]"><MessageCircle className="h-3.5 w-3.5" />Bình luận</span>
                <span className="community-button-quiet !min-h-8 !px-1 text-[11px]"><Send className="h-3.5 w-3.5" />Gửi</span>
              </div>
            </article>
          </section>

          <section className="community-panel p-4">
            <h2 className="text-[15px] font-extrabold text-[#0b2228]">Kiểm tra trước khi đăng</h2>
            <div className="mt-3 grid gap-2">
              {[
                { label: 'Có tiêu đề', done: title.trim().length > 0 },
                { label: 'Nội dung đủ dài', done: content.trim().length >= 10 },
                { label: 'Có thẻ chủ đề', done: tags.length > 0 },
              ].map((item) => (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-[#f0f6ed] p-3" key={item.label}>
                  <span className="text-[12px] font-bold text-[#526158]">{item.label}</span>
                  <CheckCircle2 className={`h-[18px] w-[18px] ${item.done ? 'text-[#477313]' : 'text-[#b8c5b4]'}`} />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </form>
    </CommunityPage>
  );
};
