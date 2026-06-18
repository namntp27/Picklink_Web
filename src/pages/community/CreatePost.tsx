import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
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
    () =>
      tagDraft
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

    if (!canPublish) {
      return;
    }

    setPublished(true);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-[#151c27]">
      <form className="mx-auto grid max-w-[1180px] grid-cols-1 gap-6 px-4 py-6 pb-24 lg:grid-cols-[minmax(0,1fr)_360px]" onSubmit={handleSubmit}>
        <main className="min-w-0 space-y-6">
          <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/posts">
                <ArrowLeft className="h-4 w-4" />
                Quay lại bảng tin
              </Link>
              <h1 className="mt-3 text-[30px] font-bold leading-tight md:text-[40px]">Tạo bài viết cộng đồng</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-6 text-[#555f6f]">
                Chia sẻ trận đấu, tìm người chơi, review sân hoặc đăng kinh nghiệm tập luyện với cộng đồng Picklink.
              </p>
            </div>
            <div className="flex gap-2">
              <Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-[#555f6f] hover:bg-white" to="/posts">
                <X className="h-5 w-5" />
                Hủy
              </Link>
              <button
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90 disabled:bg-outline-variant disabled:text-[#555f6f]"
                disabled={!canPublish}
                type="submit"
              >
                <Send className="h-5 w-5" />
                Đăng bài
              </button>
            </div>
          </section>

          {published && (
            <section className="rounded-lg border border-primary bg-[#eaf7df] p-4 text-primary">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                <div>
                  <p className="text-[15px] font-bold">Bài viết đã sẵn sàng trong bản nháp giao diện.</p>
                  <Link className="mt-1 inline-flex text-[13px] font-bold underline" to="/posts">
                    Về bảng tin
                  </Link>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <img alt={currentCommunityUser.name} className="h-12 w-12 rounded-lg object-cover" src={currentCommunityUser.avatar} />
              <div>
                <h2 className="text-[18px] font-bold">{currentCommunityUser.name}</h2>
                <p className="flex items-center gap-2 text-[13px] text-[#555f6f]">
                  <VisibilityIcon className="h-4 w-4" />
                  {selectedVisibility.label} · Trình độ {currentCommunityUser.level}
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-[13px] font-bold text-[#555f6f]">Chủ đề bài viết</span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary"
                  onChange={(event) => setMode(event.target.value as PostMode)}
                  value={mode}
                >
                  {modeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[13px] font-bold text-[#555f6f]">Hiển thị</span>
                <select
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary"
                  onChange={(event) => setVisibility(event.target.value as Visibility)}
                  value={visibility}
                >
                  {visibilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="mt-5 block">
              <span className="text-[13px] font-bold text-[#555f6f]">Tiêu đề</span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-[#f0f3ff] px-4 text-[15px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={90}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Ví dụ: Tìm đồng đội đánh đôi tối nay ở Cầu Giấy"
                value={title}
              />
            </label>

            <label className="mt-5 block">
              <span className="text-[13px] font-bold text-[#555f6f]">Nội dung</span>
              <textarea
                className="mt-2 min-h-[180px] w-full resize-none rounded-lg border border-outline-variant bg-[#f0f3ff] p-4 text-[15px] leading-7 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                maxLength={1200}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Chia sẻ nội dung bài viết..."
                value={content}
              />
            </label>

            <div className="mt-2 flex items-center justify-between text-[12px] text-[#555f6f]">
              <span>{content.length}/1200 ký tự</span>
              <span>{title.length}/90 ký tự tiêu đề</span>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="text-[20px] font-bold">Thông tin gắn kèm</h2>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block">
                <span className="flex items-center gap-2 text-[13px] font-bold text-[#555f6f]">
                  <MapPin className="h-4 w-4" />
                  Địa điểm
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setLocation(event.target.value)}
                  value={location}
                />
              </label>
              <label className="block">
                <span className="flex items-center gap-2 text-[13px] font-bold text-[#555f6f]">
                  <CalendarDays className="h-4 w-4" />
                  Sân / lịch liên quan
                </span>
                <input
                  className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setCourt(event.target.value)}
                  value={court}
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="flex items-center gap-2 text-[13px] font-bold text-[#555f6f]">
                <Hash className="h-4 w-4" />
                Thẻ chủ đề
              </span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => setTagDraft(event.target.value)}
                value={tagDraft}
              />
            </label>

            <label className="mt-5 block">
              <span className="flex items-center gap-2 text-[13px] font-bold text-[#555f6f]">
                <ImageIcon className="h-4 w-4" />
                Ảnh bài viết
              </span>
              <input
                className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="Dán URL ảnh"
                value={imageUrl}
              />
            </label>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="flex items-center gap-2 text-[20px] font-bold">
                  <Users className="h-5 w-5 text-primary" />
                  Tìm người chơi
                </span>
                <span className="mt-1 block text-[13px] text-[#555f6f]">Bật khi bài viết cần ghép người tham gia trận.</span>
              </span>
              <input checked={lookingFor} className="h-5 w-5 accent-primary" onChange={(event) => setLookingFor(event.target.checked)} type="checkbox" />
            </label>

            {lookingFor && (
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <label className="block">
                  <span className="text-[13px] font-bold text-[#555f6f]">Số slot</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => setSlots(event.target.value)}
                    type="number"
                    value={slots}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-[#555f6f]">Trình độ</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => setLevelRange(event.target.value)}
                    value={levelRange}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-[#555f6f]">Thời gian</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => setPlayTime(event.target.value)}
                    value={playTime}
                  />
                </label>
              </div>
            )}
          </section>
        </main>

        <aside className="space-y-6 lg:sticky lg:top-[88px] lg:self-start">
          <section className="rounded-lg border border-primary bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <Eye className="h-5 w-5 text-primary" />
              Xem trước
            </h2>
            <article className="mt-5 rounded-lg border border-outline-variant p-4">
              <div className="flex gap-3">
                <img alt={currentCommunityUser.name} className="h-10 w-10 rounded-lg object-cover" src={currentCommunityUser.avatar} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-bold">{currentCommunityUser.name}</p>
                  <p className="flex items-center gap-1 text-[12px] text-[#555f6f]">
                    <VisibilityIcon className="h-3.5 w-3.5" />
                    {selectedVisibility.label}
                  </p>
                </div>
              </div>
              <h3 className="mt-4 text-[18px] font-bold leading-6">{title || 'Tiêu đề bài viết'}</h3>
              <p className="mt-2 text-[14px] leading-6 text-[#555f6f]">{content || 'Nội dung bài viết sẽ hiển thị tại đây.'}</p>

              {lookingFor && (
                <div className="mt-4 rounded-lg bg-primary/10 p-3 text-[13px] font-bold text-primary">
                  Cần {slots || '0'} slot · Trình {levelRange || '-'} · {playTime || '-'}
                </div>
              )}

              {imageUrl ? (
                <img alt="Ảnh xem trước" className="mt-4 h-44 w-full rounded-lg object-cover" src={imageUrl} />
              ) : (
                <div className="mt-4 flex h-44 w-full items-center justify-center rounded-lg bg-[#f0f3ff] text-[#555f6f]">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span className="rounded-full bg-[#f0f3ff] px-3 py-1 text-[12px] font-bold text-[#555f6f]" key={tag}>
                    #{tag}
                  </span>
                ))}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-outline-variant pt-3">
                <span className="flex items-center justify-center gap-1 rounded-lg py-2 text-[12px] font-bold text-[#555f6f]">
                  <ThumbsUp className="h-4 w-4" />
                  Thích
                </span>
                <span className="flex items-center justify-center gap-1 rounded-lg py-2 text-[12px] font-bold text-[#555f6f]">
                  <MessageCircle className="h-4 w-4" />
                  Bình luận
                </span>
                <span className="flex items-center justify-center gap-1 rounded-lg py-2 text-[12px] font-bold text-[#555f6f]">
                  <Send className="h-4 w-4" />
                  Gửi
                </span>
              </div>
            </article>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="text-[20px] font-bold">Trạng thái bài viết</h2>
            <div className="mt-4 space-y-3">
              {[
                { label: 'Có tiêu đề', done: title.trim().length > 0 },
                { label: 'Nội dung đủ dài', done: content.trim().length >= 10 },
                { label: 'Có thẻ chủ đề', done: tags.length > 0 },
              ].map((item) => (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-[#f0f3ff] p-3" key={item.label}>
                  <span className="text-[13px] font-bold text-[#555f6f]">{item.label}</span>
                  <CheckCircle2 className={`h-5 w-5 ${item.done ? 'text-primary' : 'text-outline-variant'}`} />
                </div>
              ))}
            </div>
          </section>
        </aside>
      </form>
    </div>
  );
};
