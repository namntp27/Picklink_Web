import { Loader2, MessageSquareText, Star, UserRound, X } from 'lucide-react';
import { getOwnerVenueReviews } from '../../../api/owner';
import { useAuth } from '../../../auth/AuthContext';
import { ModalDialog } from '../../../components/ui/ModalDialog';
import { useApiQuery } from '../../../hooks/useApiQuery';

type OwnerVenueReviewsDialogProps = {
  venue: {
    venueId: number;
    venueName: string;
    overallRating: number;
  };
  onClose: () => void;
};

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export const OwnerVenueReviewsDialog = ({ venue, onClose }: OwnerVenueReviewsDialogProps) => {
  const { token } = useAuth();
  const {
    data: reviews = [],
    error,
    loading,
    refresh,
  } = useApiQuery(
    ['owner-venue-reviews', token, venue.venueId],
    () => getOwnerVenueReviews(token!, venue.venueId),
    { enabled: Boolean(token), errorMessage: 'Không thể tải đánh giá của sân.' },
  );

  return (
    <ModalDialog
      aria-labelledby="owner-venue-reviews-title"
      className="owner-modal max-w-3xl"
      onRequestClose={onClose}
      style={{ width: 'calc(100% - 1.75rem)' }}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="owner-kicker"><MessageSquareText className="h-4 w-4" /> Chỉ xem</p>
          <h2 className="mt-1 text-[25px] font-bold" id="owner-venue-reviews-title">Đánh giá của Player</h2>
          <p className="mt-1 text-[14px] text-on-surface-variant">{venue.venueName}</p>
        </div>
        <button aria-label="Đóng danh sách đánh giá" className="rounded-lg p-2 hover:bg-surface-container-low" onClick={onClose} type="button">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl bg-surface-container-low p-4">
        <div className="flex items-center gap-2 text-primary">
          <Star className="h-5 w-5 fill-current" />
          <strong className="text-[21px]">{venue.overallRating > 0 ? venue.overallRating.toFixed(1) : '—'}</strong>
        </div>
        <span className="text-[13px] text-on-surface-variant">
          {loading ? 'Đang tải đánh giá...' : `${reviews.length} đánh giá đang hiển thị`}
        </span>
      </div>

      {loading && (
        <div aria-label="Đang tải đánh giá" className="flex min-h-56 items-center justify-center" role="status">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && error && (
        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-5 text-center" role="alert">
          <p className="text-[14px] font-bold text-red-700">{error}</p>
          <button className="mt-3 rounded-lg border border-red-300 px-4 py-2 text-[13px] font-bold text-red-700" onClick={refresh} type="button">Thử lại</button>
        </div>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-outline-variant p-10 text-center">
          <MessageSquareText className="mx-auto h-9 w-9 text-outline" />
          <h3 className="mt-3 text-[18px] font-bold">Chưa có đánh giá</h3>
          <p className="mt-1 text-[13px] text-on-surface-variant">Các đánh giá được Player gửi cho sân sẽ xuất hiện tại đây.</p>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
        <div className="mt-5 space-y-3">
          {reviews.map((review) => (
            <article className="rounded-xl border border-outline-variant p-4" key={review.ratingId}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-primary"><UserRound className="h-4 w-4" /></span>
                  <div>
                    <h3 className="text-[14px] font-bold">{review.reviewerName}</h3>
                    <p className="text-[12px] text-on-surface-variant">
                      {review.courtNumber ? `Sân ${review.courtNumber} · ` : ''}{dateTime.format(new Date(review.createdAt))}
                    </p>
                  </div>
                </div>
                <div aria-label={`${review.score} trên 5 sao`} className="flex gap-0.5 text-amber-500">
                  {[1, 2, 3, 4, 5].map((value) => <Star className={`h-4 w-4 ${value <= review.score ? 'fill-current' : ''}`} key={value} />)}
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-on-surface">{review.comment?.trim() || 'Player không để lại nhận xét.'}</p>
              {review.tags.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{review.tags.map((tag) => <span className="rounded-full bg-primary-container px-2.5 py-1 text-[12px] font-bold text-on-primary-container" key={tag}>{tag}</span>)}</div>}
            </article>
          ))}
        </div>
      )}
    </ModalDialog>
  );
};
