import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Star } from 'lucide-react';
import { ApiError } from '../../api/client';
import {
  getMatchReviews,
  reviewPlayer,
  type MatchDetailResponse,
  type MatchPlayerReview,
} from '../../api/matches';
import {
  createBookingReview,
  getBookingReview,
  type BookingReview,
} from '../../api/reviews';

type Props = {
  match: MatchDetailResponse;
  token: string;
};

type ReviewDrafts = Record<number, { score: number; comment: string }>;

const isApproved = (status: string) => status === 'Approved' || status === 'Accepted';

const RatingStars = ({ disabled, onChange, score }: {
  disabled?: boolean;
  onChange: (score: number) => void;
  score: number;
}) => (
  <div className="flex items-center gap-0.5" role="group" aria-label="Chọn số sao">
    {[1, 2, 3, 4, 5].map((value) => (
      <button
        aria-label={`${value} sao`}
        className="rounded-md p-1 text-amber-500 transition duration-200 hover:bg-amber-50 active:translate-y-px disabled:cursor-default"
        disabled={disabled}
        key={value}
        onClick={() => onChange(value)}
        type="button"
      >
        <Star className={`h-5 w-5 ${value <= score ? 'fill-current' : ''}`} />
      </button>
    ))}
    <strong className="ml-1.5 text-[12px] tabular-nums text-[#526158]">{score}/5</strong>
  </div>
);

export const MatchPostMatchReviewPanel = ({ match, token }: Props) => {
  const [playerReviews, setPlayerReviews] = useState<MatchPlayerReview[]>([]);
  const [venueReviews, setVenueReviews] = useState<Record<number, BookingReview>>({});
  const [playerDrafts, setPlayerDrafts] = useState<ReviewDrafts>({});
  const [venueDrafts, setVenueDrafts] = useState<ReviewDrafts>({});
  const [busyKey, setBusyKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const otherPlayers = useMemo(() => match.participants.filter((participant) =>
    isApproved(participant.status) && participant.playerId !== match.myPlayerId), [match]);
  const endedBookings = useMemo(() => match.bookingCheckIns.filter((booking) =>
    booking.bookingStatus === 'Completed' || new Date(booking.endTime).getTime() <= Date.now()), [match]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    void Promise.all([
      getMatchReviews(token, match.matchId),
      Promise.all(endedBookings.map(async (booking) => {
        try {
          return await getBookingReview(token, booking.bookingId);
        } catch (reason) {
          if (reason instanceof ApiError && reason.status === 404) return null;
          throw reason;
        }
      })),
    ]).then(([reviews, bookingReviews]) => {
      if (!active) return;
      setPlayerReviews(reviews);
      setVenueReviews(Object.fromEntries(bookingReviews
        .filter((review): review is BookingReview => review !== null)
        .map((review) => [review.bookingId, review])));
    }).catch((reason) => {
      if (!active) return;
      setError(reason instanceof ApiError ? reason.message : 'Không thể tải trạng thái đánh giá.');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [endedBookings, match.matchId, token]);

  const playerDraft = (playerId: number) => playerDrafts[playerId] ?? { score: 5, comment: '' };
  const venueDraft = (bookingId: number) => venueDrafts[bookingId] ?? { score: 5, comment: '' };
  const updatePlayerDraft = (playerId: number, update: Partial<{ score: number; comment: string }>) =>
    setPlayerDrafts((current) => ({ ...current, [playerId]: { ...playerDraft(playerId), ...update } }));
  const updateVenueDraft = (bookingId: number, update: Partial<{ score: number; comment: string }>) =>
    setVenueDrafts((current) => ({ ...current, [bookingId]: { ...venueDraft(bookingId), ...update } }));

  const submitPlayerReview = async (playerId: number) => {
    const key = `player-${playerId}`;
    setBusyKey(key);
    setError('');
    try {
      const draft = playerDraft(playerId);
      const review = await reviewPlayer(token, match.matchId, playerId, {
        score: draft.score,
        comment: draft.comment.trim() || undefined,
      });
      if (!review.matchPlayerReviewId || review.matchId !== match.matchId || review.revieweePlayerId !== playerId) {
        throw new Error('Backend chưa nạp phiên bản đánh giá mới. Hãy khởi động lại backend rồi thử lại.');
      }
      setPlayerReviews((current) => [...current.filter((item) => item.revieweePlayerId !== playerId), review]);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gửi đánh giá người chơi.');
    } finally {
      setBusyKey('');
    }
  };

  const submitVenueReview = async (bookingId: number) => {
    const key = `venue-${bookingId}`;
    setBusyKey(key);
    setError('');
    try {
      const draft = venueDraft(bookingId);
      const review = await createBookingReview(token, bookingId, {
        score: draft.score,
        comment: draft.comment.trim() || undefined,
        tags: [],
        isAnonymous: false,
      });
      if (review.bookingId !== bookingId || !review.venueId) {
        throw new Error('Backend chưa lưu được đánh giá sân. Hãy khởi động lại backend rồi thử lại.');
      }
      setVenueReviews((current) => ({ ...current, [bookingId]: review }));
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        try {
          const existing = await getBookingReview(token, bookingId);
          if (existing.bookingId === bookingId) {
            setVenueReviews((current) => ({ ...current, [bookingId]: existing }));
            return;
          }
        } catch {
          // Keep the original conflict when the booking still has no review.
        }
      }
      setError(reason instanceof Error ? reason.message : 'Không thể gửi đánh giá sân.');
    } finally {
      setBusyKey('');
    }
  };

  return (
    <section className="community-panel match-panel !p-4 sm:!p-5" aria-labelledby="post-match-review-title">
      <div className="match-section-heading">
        <div>
          <p className="match-eyebrow">sau trận đấu</p>
          <h2 className="!text-[19px]" id="post-match-review-title">Đánh giá sau trận</h2>
          <p className="!mt-1 !text-[11px]">Chọn số sao, nhận xét nếu cần rồi gửi riêng từng mục.</p>
        </div>
        <span className="match-soft-badge tabular-nums">1–5 sao</span>
      </div>

      {error && <div className="match-alert mt-4" role="alert">{error}</div>}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[13px] font-bold text-[#526158]">
          <Loader2 className="h-5 w-5 animate-spin" /> Đang tải đánh giá...
        </div>
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
          <section aria-labelledby="player-review-heading">
            <h3 className="text-[14px] font-extrabold text-[#0b2228]" id="player-review-heading">Người chơi cùng trận</h3>
            <div className="mt-2 space-y-2">
              {otherPlayers.map((player) => {
                const existing = playerReviews.find((review) => review.revieweePlayerId === player.playerId);
                const draft = playerDraft(player.playerId);
                const key = `player-${player.playerId}`;
                return (
                  <article className="rounded-xl bg-[#f3f8ef] p-3" key={player.playerId}>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#dcebd5] text-[11px] font-black text-primary">
                        {player.avatarUrl
                          ? <img alt="" className="h-full w-full object-cover" src={player.avatarUrl} />
                          : player.playerName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-extrabold">{player.playerName}</p><p className="text-[10px] text-[#718077]">Level {player.skillLevel.toFixed(1)}</p></div>
                    </div>
                    <div className="mt-2">
                      <RatingStars disabled={Boolean(existing)} onChange={(score) => updatePlayerDraft(player.playerId, { score })} score={existing?.score ?? draft.score} />
                    </div>
                    {existing ? (
                      <p className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Đã đánh giá</p>
                    ) : (
                      <>
                        <textarea className="community-control mt-2 !h-16 !min-h-16 resize-none !px-3 !py-2 !text-[12px]" maxLength={1000} onChange={(event) => updatePlayerDraft(player.playerId, { comment: event.target.value })} placeholder="Nhận xét (không bắt buộc)" value={draft.comment} />
                        <button className="community-button mt-2 w-full !min-h-9 !px-3 !py-2 !text-[11px] transition active:translate-y-px" disabled={Boolean(busyKey)} onClick={() => void submitPlayerReview(player.playerId)} type="button">
                          {busyKey === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />} Gửi đánh giá
                        </button>
                      </>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="border-t border-[#d8e4d4] pt-4 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0" aria-labelledby="venue-review-heading">
            <h3 className="text-[14px] font-extrabold text-[#0b2228]" id="venue-review-heading">Sân đã chơi</h3>
            <div className="mt-2 space-y-2">
              {endedBookings.map((booking) => {
                const existing = venueReviews[booking.bookingId];
                const draft = venueDraft(booking.bookingId);
                const key = `venue-${booking.bookingId}`;
                return (
                  <article className="rounded-xl bg-[#f7f9f4] p-3" key={booking.bookingId}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="text-[13px] font-extrabold">{booking.venueName}</p><p className="mt-0.5 text-[10px] tabular-nums text-[#718077]">#{booking.bookingId} · {new Date(booking.startTime).toLocaleString('vi-VN')}</p></div>
                      {existing && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Đã đánh giá</span>}
                    </div>
                    <div className="mt-2"><RatingStars disabled={Boolean(existing)} onChange={(score) => updateVenueDraft(booking.bookingId, { score })} score={existing?.score ?? draft.score} /></div>
                    {!existing && (
                      <div className="mt-2">
                        <textarea className="community-control !h-16 !min-h-16 resize-none !px-3 !py-2 !text-[12px]" maxLength={1000} onChange={(event) => updateVenueDraft(booking.bookingId, { comment: event.target.value })} placeholder="Nhận xét sân (không bắt buộc)" value={draft.comment} />
                        <button className="community-button mt-2 w-full !min-h-9 !px-3 !py-2 !text-[11px] transition active:translate-y-px" disabled={Boolean(busyKey)} onClick={() => void submitVenueReview(booking.bookingId)} type="button">
                          {busyKey === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />} Đánh giá sân
                        </button>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </section>
  );
};
