import { Loader2, MessageSquareText, Star, UserRound, X } from 'lucide-react';
import { getPlayerVenueReviews, type BookingVenue } from '../../../api/booking';
import { useAuth } from '../../../auth/AuthContext';
import { ModalDialog } from '../../../components/ui/ModalDialog';
import { useApiQuery } from '../../../hooks/useApiQuery';

type VenueReviewsDialogProps = {
  venue: BookingVenue;
  onClose: () => void;
};

const dateTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
});

export const VenueReviewsDialog = ({ venue, onClose }: VenueReviewsDialogProps) => {
  const { token } = useAuth();
  const {
    data: reviews = [],
    error,
    loading,
    refresh,
  } = useApiQuery(
    ['player-venue-reviews', venue.venueId],
    () => getPlayerVenueReviews(venue.venueId, token),
    { errorMessage: 'Không thể tải đánh giá của sân.' },
  );

  return (
    <ModalDialog
      aria-labelledby="player-venue-reviews-title"
      className="m-auto w-full max-w-[560px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_72px_rgba(8,29,36,0.28)]"
      onRequestClose={onClose}
      style={{
        maxHeight: 'min(84dvh, 620px)',
        maxWidth: 'min(560px, calc(100vw - 1.5rem))',
        width: 'calc(100% - 1.5rem)',
      }}
    >
      <header className="flex items-center justify-between gap-4 bg-[#0b2228] px-4 py-3.5 text-white sm:px-5">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.09em] text-[#e2ff57]"><MessageSquareText className="h-3.5 w-3.5" /> Đánh giá từ người chơi</p>
          <h2 className="mt-1 truncate text-[20px] font-black leading-tight" id="player-venue-reviews-title">{venue.venueName}</h2>
        </div>
        <button aria-label="Đóng danh sách đánh giá" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/75 hover:bg-white/10 hover:text-white" onClick={onClose} type="button">
          <X className="h-4.5 w-4.5" />
        </button>
      </header>

      <div className="max-h-[calc(min(84dvh,620px)-68px)] overflow-y-auto p-4">
        <div className="flex flex-wrap items-center gap-2.5 rounded-xl bg-[#f4f8f1] px-3.5 py-2.5">
          <div className="flex items-center gap-1.5 text-[#0b2228]">
            <Star className="h-4.5 w-4.5 fill-[#e2ff57]" />
            <strong className="text-[19px]">{venue.overallRating > 0 ? venue.overallRating.toFixed(1) : '—'}</strong>
          </div>
          <span className="text-[12px] font-medium text-[#66766d]">
            {loading ? 'Đang tải đánh giá...' : `${reviews.length} đánh giá đang hiển thị`}
          </span>
        </div>

        {loading && (
          <div aria-label="Đang tải đánh giá" className="flex min-h-40 items-center justify-center" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}

        {!loading && error && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4 text-center" role="alert">
            <p className="text-[13px] font-bold text-red-700">{error}</p>
            <button className="mt-2 rounded-lg border border-red-300 px-3 py-1.5 text-[12px] font-bold text-red-700" onClick={refresh} type="button">Thử lại</button>
          </div>
        )}

        {!loading && !error && reviews.length === 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-[#dbe8d3] p-7 text-center">
            <MessageSquareText className="mx-auto h-8 w-8 text-[#87958d]" />
            <h3 className="mt-2 text-[16px] font-bold">Chưa có đánh giá</h3>
            <p className="mt-1 text-[12px] text-[#66766d]">Sân này chưa nhận được đánh giá nào từ Player.</p>
          </div>
        )}

        {!loading && !error && reviews.length > 0 && (
          <div className="mt-3 space-y-2" data-venue-reviews>
            {reviews.map((review) => (
              <article className="rounded-xl border border-[#dbe8d3] p-3.5" key={review.ratingId}>
                <div className="flex flex-wrap items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f0f8e8] text-primary"><UserRound className="h-3.5 w-3.5" /></span>
                    <div>
                      <h3 className="text-[13px] font-bold">{review.reviewerName}</h3>
                      <p className="text-[11px] text-[#66766d]">{review.courtNumber ? `Sân ${review.courtNumber} · ` : ''}{dateTime.format(new Date(review.createdAt))}</p>
                    </div>
                  </div>
                  <div aria-label={`${review.score} trên 5 sao`} className="flex gap-0.5 text-amber-500">
                    {[1, 2, 3, 4, 5].map((value) => <Star className={`h-3.5 w-3.5 ${value <= review.score ? 'fill-current' : ''}`} key={value} />)}
                  </div>
                </div>
                <p className="mt-2 text-[13px] leading-5 text-[#26342d]">{review.comment?.trim() || 'Player không để lại nhận xét.'}</p>
                {review.tags.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{review.tags.map((tag) => <span className="rounded-full bg-[#e2ff57] px-2 py-0.5 text-[11px] font-bold text-[#102414]" key={tag}>{tag}</span>)}</div>}
              </article>
            ))}
          </div>
        )}
      </div>
    </ModalDialog>
  );
};
