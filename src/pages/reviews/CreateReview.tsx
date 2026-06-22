import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Loader2, ShieldCheck, Star } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBookingHolding, type BookingHolding } from '../../api/booking';
import { ApiError } from '../../api/client';
import { createBookingReview, type BookingReview } from '../../api/reviews';
import { useAuth } from '../../auth/AuthContext';

const quickTags = ['Sân sạch', 'Ánh sáng tốt', 'Dễ tìm', 'Check-in nhanh', 'Giá hợp lý', 'Có chỗ gửi xe'];

export const CreateReview = () => {
  const { token } = useAuth();
  const [searchParams] = useSearchParams();
  const bookingId = Number(searchParams.get('bookingId'));
  const [booking, setBooking] = useState<BookingHolding | null>(null);
  const [review, setReview] = useState<BookingReview | null>(null);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !Number.isInteger(bookingId) || bookingId <= 0) {
      setError('Booking không hợp lệ. Hãy mở đánh giá từ trang Booking của tôi.');
      setLoading(false);
      return;
    }
    getBookingHolding(token, bookingId)
      .then(setBooking)
      .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải booking.'))
      .finally(() => setLoading(false));
  }, [bookingId, token]);

  const toggleTag = (tag: string) => setTags((current) =>
    current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]);

  const submit = async () => {
    if (!token || !booking) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await createBookingReview(token, booking.bookingId, {
        score,
        comment: comment.trim() || undefined,
        tags,
        isAnonymous,
      });
      setReview(result);
      setBooking({ ...booking, canReview: false, hasReviewed: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể gửi đánh giá.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="flex min-h-[70vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const eligible = booking?.canReview === true;
  const alreadyReviewed = booking?.hasReviewed === true || review !== null;

  return <div className="min-h-screen bg-surface-container-low pt-[72px] text-on-surface">
    <section className="bg-primary text-white"><div className="mx-auto max-w-[980px] px-4 py-9"><Link className="inline-flex items-center gap-2 text-[14px] font-bold text-white/80" to={booking ? `/bookings/${booking.bookingId}` : '/my-bookings'}><ArrowLeft className="h-4 w-4" /> Quay lại booking</Link><h1 className="mt-5 text-[34px] font-bold md:text-[44px]">Đánh giá sân</h1><p className="mt-2 text-white/80">Mỗi Player chỉ được đánh giá một lần cho một booking đủ điều kiện.</p></div></section>

    <main className="mx-auto grid max-w-[980px] gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
      <section className="rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        {error && <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-[14px] font-bold text-red-700">{error}</div>}
        {booking && <div className="rounded-xl bg-surface-container-low p-4"><p className="text-[12px] font-bold uppercase text-primary">{booking.bookingCode}</p><h2 className="mt-1 text-[21px] font-bold">{booking.venueName} · Sân {booking.courtNumber}</h2><p className="mt-1 text-[13px] text-on-surface-variant">{booking.address}</p></div>}

        {review || alreadyReviewed ? <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-6 text-center"><CheckCircle2 className="mx-auto h-11 w-11 text-emerald-600" /><h2 className="mt-3 text-[22px] font-bold">Đã gửi đánh giá</h2><p className="mt-2 text-[14px] text-emerald-800">Booking này đã được đánh giá và không thể gửi thêm lần nữa.</p></div> : booking && !eligible ? <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5"><h2 className="font-bold text-amber-900">Booking chưa đủ điều kiện đánh giá</h2><p className="mt-2 text-[14px] leading-6 text-amber-800">Chỉ cho đánh giá khi BookingStatus = Completed hoặc CheckInStatus = CheckedIn.</p></div> : booking && <div className="mt-6 space-y-6">
          <div><h2 className="text-[20px] font-bold">Điểm trải nghiệm</h2><div className="mt-3 flex items-center gap-2">{[1, 2, 3, 4, 5].map((value) => <button aria-label={`${value} sao`} className="p-1 text-amber-500" key={value} onClick={() => setScore(value)} type="button"><Star className={`h-8 w-8 ${value <= score ? 'fill-current' : ''}`} /></button>)}<strong className="ml-2 text-[18px]">{score}/5</strong></div></div>

          <div><h2 className="text-[16px] font-bold">Nhận xét nhanh</h2><div className="mt-3 flex flex-wrap gap-2">{quickTags.map((tag) => <button className={`rounded-full border px-3 py-2 text-[13px] font-bold ${tags.includes(tag) ? 'border-primary bg-primary text-white' : 'border-outline-variant text-on-surface-variant'}`} key={tag} onClick={() => toggleTag(tag)} type="button">{tag}</button>)}</div></div>

          <label className="block"><span className="text-[14px] font-bold">Nhận xét của bạn</span><textarea className="mt-2 min-h-32 w-full rounded-xl border border-outline-variant p-3 text-[14px] outline-none focus:border-primary" maxLength={1000} onChange={(event) => setComment(event.target.value)} placeholder="Chia sẻ trải nghiệm thực tế tại sân..." value={comment} /></label>
          <label className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4"><input checked={isAnonymous} className="mt-1 h-4 w-4 accent-primary" onChange={(event) => setIsAnonymous(event.target.checked)} type="checkbox" /><span><strong className="text-[14px]">Ẩn tên công khai</strong><span className="mt-1 block text-[12px] text-on-surface-variant">Hệ thống vẫn lưu tài khoản gửi để bảo đảm mỗi booking chỉ có một đánh giá.</span></span></label>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-[15px] font-bold text-white disabled:opacity-50" disabled={submitting} onClick={() => void submit()} type="button">{submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Star className="h-5 w-5 fill-current" />} Gửi đánh giá</button>
        </div>}
      </section>

      <aside className="h-fit rounded-2xl border border-primary bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-[19px] font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> Điều kiện đánh giá</h2><div className="mt-4 space-y-3 text-[13px] leading-6 text-on-surface-variant"><p>Booking phải thuộc chính Player đang đăng nhập.</p><p>BookingStatus là Completed, hoặc CheckInStatus là CheckedIn.</p><p>Mỗi Player chỉ được đánh giá một lần cho một booking.</p></div></aside>
    </main>
  </div>;
};
