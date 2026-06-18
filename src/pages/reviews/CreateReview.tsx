import React, { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserRound,
  Users,
} from 'lucide-react';

type ReviewType = 'court' | 'player';

type ReviewTarget = {
  id: string;
  name: string;
  meta: string;
  helper: string;
};

type RatingKey = 'quality' | 'cleanliness' | 'service' | 'accuracy' | 'punctuality' | 'attitude' | 'skill' | 'fairPlay';

type RatingItem = {
  key: RatingKey;
  label: string;
  helper: string;
};

const courtTargets: ReviewTarget[] = [
  {
    id: 'court-pkl-20260618-001',
    name: 'Sân Pickleball Cầu Giấy',
    meta: 'Pickleball 2 · PKL-20260618-001',
    helper: 'Đơn đã check-in hoặc đã hoàn tất có thể đánh giá sân.',
  },
  {
    id: 'court-pkl-20260615-008',
    name: 'Sân Tennis & Pickleball Ba Đình',
    meta: 'Pickleball 1 · PKL-20260615-008',
    helper: 'Đánh giá giúp người chơi khác chọn sân phù hợp hơn.',
  },
];

const playerTargets: ReviewTarget[] = [
  {
    id: 'player-tran-quoc-bao',
    name: 'Trần Quốc Bảo',
    meta: 'Chủ trận · Level 3.5 · MATCH-001',
    helper: 'Đánh giá người chơi sau khi trận đã hoàn tất.',
  },
  {
    id: 'player-le-tuyet-mai',
    name: 'Lê Tuyết Mai',
    meta: 'Người tham gia · Level 3.0 · MATCH-002',
    helper: 'Điểm uy tín giúp hệ thống ghép trận chất lượng hơn.',
  },
  {
    id: 'player-minh-tuan',
    name: 'Minh Tuấn',
    meta: 'Người tham gia · Level 3.5 · MATCH-003',
    helper: 'Chỉ hiển thị đánh giá đã được kiểm duyệt nếu có báo cáo.',
  },
];

const courtRatingItems: RatingItem[] = [
  { key: 'quality', label: 'Chất lượng sân', helper: 'Mặt sân, lưới, vạch kẻ và ánh sáng.' },
  { key: 'cleanliness', label: 'Vệ sinh', helper: 'Khu vực sân, nhà vệ sinh, nước uống.' },
  { key: 'service', label: 'Phục vụ', helper: 'Lễ tân, hỗ trợ check-in, xử lý phát sinh.' },
  { key: 'accuracy', label: 'Đúng thông tin', helper: 'Giá, địa chỉ, sân con và khung giờ.' },
];

const playerRatingItems: RatingItem[] = [
  { key: 'punctuality', label: 'Đúng giờ', helper: 'Có mặt đúng khung giờ đã hẹn.' },
  { key: 'attitude', label: 'Thái độ', helper: 'Tôn trọng bạn chơi, giao tiếp tích cực.' },
  { key: 'skill', label: 'Trình độ phù hợp', helper: 'Mức chơi đúng với thông tin đã đăng.' },
  { key: 'fairPlay', label: 'Fair-play', helper: 'Chơi đẹp, hợp tác, không bỏ trận.' },
];

const courtTags = ['Sân sạch', 'Ánh sáng tốt', 'Dễ tìm', 'Check-in nhanh', 'Giá hợp lý', 'Có chỗ gửi xe'];
const playerTags = ['Đúng giờ', 'Vui vẻ', 'Fair-play', 'Trình ổn định', 'Giao tiếp tốt', 'Muốn chơi lại'];

const defaultRatings: Record<RatingKey, number> = {
  quality: 5,
  cleanliness: 5,
  service: 5,
  accuracy: 5,
  punctuality: 5,
  attitude: 5,
  skill: 5,
  fairPlay: 5,
};

const getTargets = (type: ReviewType) => (type === 'court' ? courtTargets : playerTargets);
const getRatingItems = (type: ReviewType) => (type === 'court' ? courtRatingItems : playerRatingItems);
const getTags = (type: ReviewType) => (type === 'court' ? courtTags : playerTags);

const StarRating = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) => (
  <div className="flex flex-wrap items-center gap-2" aria-label={label}>
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        aria-label={`${label}: ${star} sao`}
        className="rounded-md p-1 text-[#eab526] transition-transform hover:scale-110"
        key={star}
        onClick={() => onChange(star)}
        type="button"
      >
        <Star className={`h-6 w-6 ${star <= value ? 'fill-current' : ''}`} />
      </button>
    ))}
    <span className="ml-1 text-[13px] font-bold text-on-surface-variant">{value}/5</span>
  </div>
);

export const CreateReview = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'player' ? 'player' : 'court';
  const [reviewType, setReviewType] = useState<ReviewType>(initialType);
  const [ratings, setRatings] = useState(defaultRatings);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const targets = getTargets(reviewType);
  const ratingItems = getRatingItems(reviewType);
  const tags = getTags(reviewType);
  const [selectedTargetId, setSelectedTargetId] = useState(targets[0]?.id ?? '');

  const selectedTarget = useMemo(
    () => getTargets(reviewType).find((target) => target.id === selectedTargetId) ?? getTargets(reviewType)[0],
    [reviewType, selectedTargetId],
  );

  const averageRating = useMemo(() => {
    const total = ratingItems.reduce((sum, item) => sum + ratings[item.key], 0);
    return total / ratingItems.length;
  }, [ratingItems, ratings]);

  const switchReviewType = (type: ReviewType) => {
    setReviewType(type);
    setSelectedTargetId(getTargets(type)[0]?.id ?? '');
    setSelectedTags([]);
    setIsSubmitted(false);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((current) => (current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]));
    setIsSubmitted(false);
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
  };

  return (
    <div className="flex w-full flex-1 flex-col overflow-x-hidden bg-[#f9f9ff] pt-[72px] font-body-md text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
          <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-white/86 hover:text-white" to="/my-bookings">
            <ArrowLeft className="h-4 w-4" />
            Quay lại lịch sử
          </Link>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold">
                <Star className="h-4 w-4 fill-current" />
                Đánh giá trải nghiệm
              </span>
              <h1 className="mt-4 text-[32px] font-bold leading-tight md:text-[44px]">Đánh giá sân / người chơi</h1>
              <p className="mt-4 max-w-2xl text-[16px] leading-7 text-white/85">
                Gửi nhận xét sau khi đặt sân hoặc hoàn tất trận để cải thiện chất lượng cộng đồng Picklink.
              </p>
            </div>

            <div className="rounded-xl border border-white/18 bg-white/10 p-5 backdrop-blur">
              <p className="text-[13px] font-bold uppercase tracking-wide text-white/75">Điểm trung bình</p>
              <p className="mt-3 text-[40px] font-bold leading-tight">{averageRating.toFixed(1)}</p>
              <div className="mt-3 flex gap-1 text-[#ffe08a]">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star className={`h-5 w-5 ${star <= Math.round(averageRating) ? 'fill-current' : ''}`} key={star} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface-container-low p-1">
              {[
                { value: 'court' as const, label: 'Đánh giá sân', icon: Trophy },
                { value: 'player' as const, label: 'Đánh giá người chơi', icon: Users },
              ].map((tab) => (
                <button
                  className={`flex items-center justify-center gap-2 rounded-md px-3 py-3 text-[14px] font-bold transition-colors ${
                    reviewType === tab.value ? 'bg-primary text-white shadow-sm' : 'text-on-surface-variant hover:bg-white'
                  }`}
                  key={tab.value}
                  onClick={() => switchReviewType(tab.value)}
                  type="button"
                >
                  <tab.icon className="h-5 w-5" />
                  {tab.label}
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Đối tượng đánh giá</span>
              <select
                className="h-12 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => {
                  setSelectedTargetId(event.target.value);
                  setIsSubmitted(false);
                }}
                value={selectedTarget?.id}
              >
                {targets.map((target) => (
                  <option key={target.id} value={target.id}>
                    {target.name} - {target.meta}
                  </option>
                ))}
              </select>
            </label>

            {selectedTarget && (
              <div className="mt-4 rounded-lg border border-outline-variant bg-surface-container-low p-4">
                <p className="text-[18px] font-bold">{selectedTarget.name}</p>
                <p className="mt-1 text-[13px] font-bold text-primary">{selectedTarget.meta}</p>
                <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">{selectedTarget.helper}</p>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[22px] font-bold">
              <Star className="h-5 w-5 fill-current text-[#eab526]" />
              Chấm điểm chi tiết
            </h2>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              {ratingItems.map((item) => (
                <div className="rounded-lg border border-outline-variant p-4" key={item.key}>
                  <p className="text-[15px] font-bold">{item.label}</p>
                  <p className="mt-1 min-h-10 text-[13px] leading-5 text-on-surface-variant">{item.helper}</p>
                  <div className="mt-3">
                    <StarRating
                      label={item.label}
                      onChange={(value) => {
                        setRatings((current) => ({ ...current, [item.key]: value }));
                        setIsSubmitted(false);
                      }}
                      value={ratings[item.key]}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[22px] font-bold">
              <Sparkles className="h-5 w-5 text-primary" />
              Nhận xét nhanh
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  className={`rounded-full border px-3 py-2 text-[13px] font-bold transition-colors ${
                    selectedTags.includes(tag)
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant text-on-surface-variant hover:bg-surface-container-low'
                  }`}
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  type="button"
                >
                  {tag}
                </button>
              ))}
            </div>

            <label className="mt-5 block">
              <span className="mb-1 block text-[13px] font-bold text-on-surface-variant">Nhận xét của bạn</span>
              <textarea
                className="min-h-32 w-full resize-y rounded-lg border border-outline-variant bg-white px-3 py-3 text-[14px] font-medium leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => {
                  setContent(event.target.value);
                  setIsSubmitted(false);
                }}
                placeholder={
                  reviewType === 'court'
                    ? 'Ví dụ: sân sạch, đúng giờ, ánh sáng tốt nhưng khu gửi xe hơi đông...'
                    : 'Ví dụ: bạn chơi đúng giờ, vui vẻ, trình độ đúng như mô tả...'
                }
                value={content}
              />
            </label>

            <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg bg-surface-container-low p-4">
              <input
                checked={isAnonymous}
                className="mt-1 h-4 w-4 accent-primary"
                onChange={(event) => setIsAnonymous(event.target.checked)}
                type="checkbox"
              />
              <span>
                <span className="block text-[14px] font-bold">Ẩn tên công khai</span>
                <span className="mt-1 block text-[13px] leading-5 text-on-surface-variant">
                  Picklink vẫn lưu người gửi đánh giá để xử lý khi có báo cáo vi phạm.
                </span>
              </span>
            </label>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border border-primary bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <MessageSquareText className="h-5 w-5 text-primary" />
              Tóm tắt đánh giá
            </h2>

            <div className="mt-5 space-y-4">
              <div className="rounded-lg bg-surface-container-low p-4">
                <p className="text-[13px] font-bold text-on-surface-variant">Loại đánh giá</p>
                <p className="mt-1 text-[16px] font-bold">{reviewType === 'court' ? 'Sân chơi' : 'Người chơi'}</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <p className="text-[13px] font-bold text-on-surface-variant">Đối tượng</p>
                <p className="mt-1 text-[16px] font-bold">{selectedTarget?.name}</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <p className="text-[13px] font-bold text-on-surface-variant">Điểm trung bình</p>
                <p className="mt-1 text-[28px] font-bold text-primary">{averageRating.toFixed(1)}/5</p>
              </div>
              <div className="rounded-lg bg-surface-container-low p-4">
                <p className="text-[13px] font-bold text-on-surface-variant">Tag đã chọn</p>
                <p className="mt-1 text-[14px] font-bold">{selectedTags.length ? selectedTags.join(', ') : 'Chưa chọn tag'}</p>
              </div>
            </div>

            <button
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
              onClick={handleSubmit}
              type="button"
            >
              <Star className="h-5 w-5 fill-current" />
              Gửi đánh giá
            </button>

            {isSubmitted && (
              <div className="mt-4 rounded-lg border border-primary/30 bg-[#eaf7df] p-4">
                <p className="flex items-center gap-2 text-[14px] font-bold text-primary">
                  <CheckCircle2 className="h-5 w-5" />
                  Đã gửi đánh giá
                </p>
                <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
                  Cảm ơn bạn. Đánh giá sẽ được dùng để cải thiện chất lượng sân và ghép trận.
                </p>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[18px] font-bold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Nguyên tắc cộng đồng
            </h3>
            <div className="mt-4 space-y-3 text-[13px] font-medium leading-6 text-on-surface-variant">
              <p>Đánh giá cần dựa trên trải nghiệm thực tế sau khi đặt sân hoặc chơi trận.</p>
              <p>Không đăng thông tin cá nhân nhạy cảm, xúc phạm hoặc nội dung không liên quan.</p>
              <p>Điểm uy tín người chơi sẽ được cập nhật sau khi hệ thống kiểm tra tín hiệu bất thường.</p>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[18px] font-bold">
              <UserRound className="h-5 w-5 text-primary" />
              Hiển thị công khai
            </h3>
            <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">
              Đánh giá sân hiển thị trên trang chi tiết sân. Đánh giá người chơi hiển thị trong hồ sơ uy tín khi đủ dữ liệu.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
};
