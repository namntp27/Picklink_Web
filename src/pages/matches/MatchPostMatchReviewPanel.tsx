import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2, Pencil, Star, X } from 'lucide-react';
import { ApiError } from '../../api/client';
import {
  getMatchReviews,
  reviewPlayer,
  updatePlayerReview,
  type MatchDetailResponse,
  type MatchPlayerReview,
} from '../../api/matches';
import {
  createBookingReview,
  getMatchVenueReviews,
  updateVenueReview,
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
  const [editingKeys, setEditingKeys] = useState<Record<string, boolean>>({});
  const [busyKey, setBusyKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const otherPlayers = useMemo(() => match.participants.filter((participant) =>
    isApproved(participant.status) && participant.playerId !== match.myPlayerId), [match]);
  const endedBookings = useMemo(() => match.bookingCheckIns.filter((booking) =>
    booking.bookingStatus === 'Completed' || new Date(booking.endTime).getTime() <= Date.now()), [match]);
  // One review per venue per room: several rounds at the same venue collapse into one card.
  const playedVenues = useMemo(() => {
    const byVenue = new Map<number, { venueId: number; venueName: string; bookingId: number; endTime: string }>();
    [...endedBookings]
      .sort((left, right) => left.endTime.localeCompare(right.endTime))
      .forEach((booking) => byVenue.set(booking.venueId, {
        venueId: booking.venueId,
        venueName: booking.venueName,
        bookingId: booking.bookingId,
        endTime: booking.endTime,
      }));
    return [...byVenue.values()];
  }, [endedBookings]);
  // Staff scan every player individually, so only members who turned up may rate.
  const hasCheckedIn = useMemo(() => match.participants.some((participant) =>
    participant.playerId === match.myPlayerId && participant.checkInStatus === 'Present'), [match]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    void Promise.all([
      getMatchReviews(token, match.matchId),
      getMatchVenueReviews(token, match.matchId),
    ]).then(([reviews, bookingReviews]) => {
      if (!active) return;
      setPlayerReviews(reviews);
      setVenueReviews(Object.fromEntries(bookingReviews.map((review) => [review.venueId, review])));
    }).catch((reason) => {
      if (!active) return;
      setError(reason instanceof ApiError ? reason.message : 'Không thể tải trạng thái đánh giá.');
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, [match.matchId, token]);

  const playerDraft = (playerId: number) => playerDrafts[playerId] ?? { score: 5, comment: '' };
  const venueDraft = (venueId: number) => venueDrafts[venueId] ?? { score: 5, comment: '' };
  const updatePlayerDraft = (playerId: number, update: Partial<{ score: number; comment: string }>) =>
    setPlayerDrafts((current) => ({ ...current, [playerId]: { ...playerDraft(playerId), ...update } }));
  const updateVenueDraft = (venueId: number, update: Partial<{ score: number; comment: string }>) =>
    setVenueDrafts((current) => ({ ...current, [venueId]: { ...venueDraft(venueId), ...update } }));
  const setEditing = (key: string, editing: boolean) =>
    setEditingKeys((current) => ({ ...current, [key]: editing }));

  const startPlayerEdit = (playerId: number, existing: MatchPlayerReview) => {
    updatePlayerDraft(playerId, { score: existing.score, comment: existing.comment ?? '' });
    setEditing(`player-${playerId}`, true);
  };
  const startVenueEdit = (venueId: number, existing: BookingReview) => {
    updateVenueDraft(venueId, { score: existing.score, comment: existing.comment ?? '' });
    setEditing(`venue-${venueId}`, true);
  };

  const submitPlayerReview = async (playerId: number, existing?: MatchPlayerReview) => {
    const key = `player-${playerId}`;
    setBusyKey(key);
    setError('');
    try {
      const draft = playerDraft(playerId);
      const input = { score: draft.score, comment: draft.comment.trim() || undefined };
      const review = existing
        ? await updatePlayerReview(token, match.matchId, playerId, input)
        : await reviewPlayer(token, match.matchId, playerId, input);
      if (!review.matchPlayerReviewId || review.matchId !== match.matchId || review.revieweePlayerId !== playerId) {
        throw new Error('Backend chưa nạp phiên bản đánh giá mới. Hãy khởi động lại backend rồi thử lại.');
      }
      setPlayerReviews((current) => [...current.filter((item) => item.revieweePlayerId !== playerId), review]);
      setEditing(key, false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gửi đánh giá người chơi.');
    } finally {
      setBusyKey('');
    }
  };

  const submitVenueReview = async (venueId: number, bookingId: number, existing?: BookingReview) => {
    const key = `venue-${venueId}`;
    setBusyKey(key);
    setError('');
    try {
      const draft = venueDraft(venueId);
      const input = {
        score: draft.score,
        comment: draft.comment.trim() || undefined,
        tags: existing?.tags ?? [],
        isAnonymous: existing?.isAnonymous ?? false,
      };
      const review = existing
        ? await updateVenueReview(token, venueId, input)
        : await createBookingReview(token, bookingId, input);
      if (!review.venueId) {
        throw new Error('Backend chưa lưu được đánh giá sân. Hãy khởi động lại backend rồi thử lại.');
      }
      setVenueReviews((current) => ({ ...current, [review.venueId]: review }));
      setEditing(key, false);
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        // Somebody rated this venue from another round in the meantime.
        try {
          const reviews = await getMatchVenueReviews(token, match.matchId);
          setVenueReviews(Object.fromEntries(reviews.map((review) => [review.venueId, review])));
          setEditing(key, false);
          return;
        } catch {
          // Keep the original conflict when the room still has no review for this venue.
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
          <p className="!mt-1 !text-[11px]">Mỗi thành viên và mỗi sân chỉ đánh giá một lần, sửa lại lúc nào cũng được.</p>
        </div>
        <span className="match-soft-badge tabular-nums">1–5 sao</span>
      </div>

      <p className="mt-3 rounded-xl bg-[#eef8e6] px-3 py-2 text-[12px] font-bold leading-5 text-[#477313]">
        Đánh giá hoàn toàn không bắt buộc; bạn có thể bỏ qua hoặc chỉ đánh giá mục mình muốn.
      </p>
      {error && <div className="match-alert mt-4" role="alert">{error}</div>}
      {!hasCheckedIn && !loading && (
        <p className="mt-4 rounded-xl bg-[#fff8e6] px-3 py-2 text-[12px] font-bold leading-5 text-[#7a5600]" role="status">
          Bạn chưa check-in tại sân cho trận này nên chưa thể đánh giá.
        </p>
      )}
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
                const isEditing = Boolean(editingKeys[key]);
                const showForm = hasCheckedIn && isEditing;
                return (
                  <article className="rounded-xl bg-[#f3f8ef] p-3" key={player.playerId}>
                    <div className="flex items-center gap-2.5">
                      <div className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#dcebd5] text-[11px] font-black text-[#477313]">
                        {player.avatarUrl
                          ? <img alt="" className="h-full w-full object-cover" src={player.avatarUrl} />
                          : player.playerName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-extrabold">{player.playerName}</p><p className="text-[10px] text-[#718077]">Level {player.skillLevel.toFixed(1)}</p></div>
                    </div>
                    {(existing || showForm) && (
                      <div className="mt-2">
                        <RatingStars disabled={!showForm} onChange={(score) => updatePlayerDraft(player.playerId, { score })} score={showForm ? draft.score : existing!.score} />
                      </div>
                    )}
                    {existing && !isEditing && (
                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Đã đánh giá</p>
                        {hasCheckedIn && (
                          <button className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#477313] hover:bg-[#e6f3dc]" onClick={() => startPlayerEdit(player.playerId, existing)} type="button">
                            <Pencil className="h-3.5 w-3.5" /> Sửa đánh giá
                          </button>
                        )}
                      </div>
                    )}
                    {!existing && hasCheckedIn && !showForm && (
                      <button className="community-button-secondary mt-2 w-full !min-h-9 !px-3 !py-2 !text-[11px]" onClick={() => setEditing(key, true)} type="button">
                        <Star className="h-4 w-4" /> Đánh giá người chơi này
                      </button>
                    )}
                    {showForm && (
                      <>
                        <textarea className="community-control mt-2 !h-16 !min-h-16 resize-none !px-3 !py-2 !text-[12px]" maxLength={1000} onChange={(event) => updatePlayerDraft(player.playerId, { comment: event.target.value })} placeholder="Nhận xét (không bắt buộc)" value={draft.comment} />
                        <div className="mt-2 flex gap-2">
                          <button className="community-button w-full !min-h-9 !px-3 !py-2 !text-[11px] transition active:translate-y-px" disabled={Boolean(busyKey)} onClick={() => void submitPlayerReview(player.playerId, existing)} type="button">
                            {busyKey === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />} {existing ? 'Lưu thay đổi' : 'Gửi đánh giá'}
                          </button>
                          {isEditing && (
                            <button aria-label="Huỷ sửa" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#526158] hover:bg-[#e6f3dc]" onClick={() => setEditing(key, false)} type="button">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
              {playedVenues.map((venue) => {
                const existing = venueReviews[venue.venueId];
                const draft = venueDraft(venue.venueId);
                const key = `venue-${venue.venueId}`;
                const isEditing = Boolean(editingKeys[key]);
                const showForm = hasCheckedIn && isEditing;
                return (
                  <article className="rounded-xl bg-[#f7f9f4] p-3" key={venue.venueId}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div><p className="text-[13px] font-extrabold">{venue.venueName}</p><p className="mt-0.5 text-[10px] tabular-nums text-[#718077]">Lượt gần nhất: {new Date(venue.endTime).toLocaleString('vi-VN')}</p></div>
                      {existing && !isEditing && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" /> Đã đánh giá</span>}
                    </div>
                    {(existing || showForm) && (
                      <div className="mt-2"><RatingStars disabled={!showForm} onChange={(score) => updateVenueDraft(venue.venueId, { score })} score={showForm ? draft.score : existing!.score} /></div>
                    )}
                    {!existing && hasCheckedIn && !showForm && (
                      <button className="community-button-secondary mt-2 w-full !min-h-9 !px-3 !py-2 !text-[11px]" onClick={() => setEditing(key, true)} type="button">
                        <Star className="h-4 w-4" /> Đánh giá sân này
                      </button>
                    )}
                    {existing && !endedBookings.some((booking) => booking.bookingId === existing.bookingId) && (
                      <p className="mt-1 text-[10px] font-semibold text-[#718077]">Bạn đã đánh giá sân này từ một lần đặt trước.</p>
                    )}
                    {existing && !isEditing && hasCheckedIn && (
                      <button className="mt-2 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-[#477313] hover:bg-[#e6f3dc]" onClick={() => startVenueEdit(venue.venueId, existing)} type="button">
                        <Pencil className="h-3.5 w-3.5" /> Sửa đánh giá
                      </button>
                    )}
                    {showForm && (
                      <div className="mt-2">
                        <textarea className="community-control !h-16 !min-h-16 resize-none !px-3 !py-2 !text-[12px]" maxLength={1000} onChange={(event) => updateVenueDraft(venue.venueId, { comment: event.target.value })} placeholder="Nhận xét sân (không bắt buộc)" value={draft.comment} />
                        <div className="mt-2 flex gap-2">
                          <button className="community-button w-full !min-h-9 !px-3 !py-2 !text-[11px] transition active:translate-y-px" disabled={Boolean(busyKey)} onClick={() => void submitVenueReview(venue.venueId, venue.bookingId, existing)} type="button">
                            {busyKey === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />} {existing ? 'Lưu thay đổi' : 'Đánh giá sân'}
                          </button>
                          {isEditing && (
                            <button aria-label="Huỷ sửa" className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[#526158] hover:bg-[#e6f3dc]" onClick={() => setEditing(key, false)} type="button">
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
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
