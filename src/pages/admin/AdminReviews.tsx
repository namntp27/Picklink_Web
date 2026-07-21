import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Loader2, Search, Star } from 'lucide-react';
import {
  listAdminReviews,
  moderateAdminReview,
  type AdminReview,
} from '../../api/adminReviews';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { useToast } from '../../components/ui/ToastRegion';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { StatusBadge } from './components/StatusBadge';
import type { Tone } from './types';

const PAGE_SIZE = 12;
const inputClass = 'h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
const primaryButton = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50';
const outlineButton = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';

const emptyPage: PaginatedResponse<AdminReview> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

const statusOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang hiển thị', value: 'Visible' },
  { label: 'Đã ẩn', value: 'Hidden' },
  { label: 'Cần kiểm tra', value: 'Flagged' },
];

const targetOptions = [
  { label: 'Mọi loại', value: 'all' },
  { label: 'Sân', value: 'Venue' },
  { label: 'Người chơi', value: 'Player' },
  { label: 'Booking', value: 'Booking' },
];

const statusTone = (status: string): Tone => {
  if (status === 'Visible') return 'success';
  if (status === 'Flagged') return 'warning';
  if (status === 'Hidden') return 'danger';
  return 'neutral';
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

const stars = (score: number) => '★'.repeat(score).padEnd(5, '☆');

export const AdminReviews = () => {
  const { token } = useAuth();
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [moderationStatus, setModerationStatus] = useState('Visible');
  const [targetType, setTargetType] = useState('all');
  const [score, setScore] = useState<number | 'all'>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<AdminReview>>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadReviews = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setData(await listAdminReviews(token, {
        search: debouncedSearch,
        moderationStatus,
        targetType,
        score,
        page,
        pageSize: PAGE_SIZE,
      }));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách đánh giá.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, moderationStatus, page, score, targetType, token]);

  useEffect(() => {
    void loadReviews();
  }, [loadReviews]);

  const hiddenOnPage = useMemo(() => data.items.filter((item) => item.isHidden).length, [data.items]);

  const moderate = async (review: AdminReview, isHidden: boolean, nextStatus: 'Visible' | 'Hidden' | 'Flagged') => {
    if (!token) return;
    const moderationNote = window.prompt(
      isHidden ? 'Lý do ẩn đánh giá:' : 'Ghi chú kiểm duyệt:',
      review.moderationNote ?? '',
    )?.trim();
    if (moderationNote === undefined) return;
    const actionLabel = nextStatus === 'Hidden' ? 'ẩn'
      : nextStatus === 'Flagged' ? 'gắn cờ' : 'hiện lại';
    if (!window.confirm(`Xác nhận ${actionLabel} đánh giá này?`)) return;


    setBusyId(review.ratingId);
    try {
      const updated = await moderateAdminReview(token, review.ratingId, {
        isHidden,
        moderationStatus: nextStatus,
        moderationNote,
      });
      setData((current) => ({
        ...current,
        items: current.items.map((item) => item.ratingId === updated.ratingId ? updated : item),
      }));
      notify('Đã cập nhật đánh giá.', 'success');
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật đánh giá.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell activeId="reviews">
      <MobileAdminNav activeId="reviews" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Kiểm duyệt đánh giá</p>
          <h1 className="text-[30px] font-bold leading-tight md:text-[36px]">Đánh giá người dùng</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Xem đánh giá thật từ booking và ẩn các nội dung spam, công kích hoặc vi phạm chính sách.
          </p>
        </div>
        <div className="grid min-w-64 grid-cols-2 overflow-hidden rounded-xl border border-outline-variant bg-white">
          <div className="p-3">
            <p className="text-2xl font-bold text-primary">{data.totalCount}</p>
            <p className="text-xs text-on-surface-variant">đánh giá phù hợp</p>
          </div>
          <div className="border-l border-outline-variant p-3">
            <p className="text-2xl font-bold text-error">{hiddenOnPage}</p>
            <p className="text-xs text-on-surface-variant">đang ẩn trên trang</p>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_160px_120px] xl:items-center">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input aria-label="Tìm đánh giá" className={`${inputClass} pl-9`} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm nội dung, tag, người đánh giá..." value={search} />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {statusOptions.map((option) => (
              <button
                aria-pressed={moderationStatus === option.value}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${moderationStatus === option.value ? 'bg-[#0b2228] text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                key={option.value}
                onClick={() => { setModerationStatus(option.value); setPage(1); }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <select aria-label="Lọc theo đối tượng" className={inputClass} onChange={(event) => { setTargetType(event.target.value); setPage(1); }} value={targetType}>
            {targetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <select aria-label="Lọc theo số sao" className={inputClass} onChange={(event) => { setScore(event.target.value === 'all' ? 'all' : Number(event.target.value)); setPage(1); }} value={score}>
            <option value="all">Mọi sao</option>
            {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} sao</option>)}
          </select>
        </div>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm font-semibold text-error" role="alert">
          <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          <button className="ml-auto underline" onClick={() => void loadReviews()} type="button">Thử lại</button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1060px] text-left">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Đánh giá', 'Người đánh giá', 'Đối tượng', 'Nội dung', 'Kiểm duyệt', 'Thao tác'].map((heading) => (
                  <th className="px-4 py-3 font-bold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {data.items.map((review) => (
                <tr className="align-top hover:bg-surface-container-low" key={review.ratingId}>
                  <td className="px-4 py-3">
                    <p className="font-bold">#{review.ratingId}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{formatDateTime(review.createdAt)}</p>
                    <p className="mt-2 text-sm font-black text-[#9b6b00]">{stars(review.score)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{review.reviewerName}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{review.reviewerEmail || 'Ẩn danh'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{review.targetType} #{review.targetId}</p>
                    {review.bookingId && <p className="mt-1 text-xs text-on-surface-variant">Booking #{review.bookingId}</p>}
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <p className="text-sm leading-6">{review.comment || 'Không có bình luận.'}</p>
                    {review.tags && <p className="mt-2 text-xs font-semibold text-primary">{review.tags}</p>}
                    {review.moderationNote && <p className="mt-2 rounded-lg bg-surface-container-low p-2 text-xs font-semibold text-on-surface-variant">Admin: {review.moderationNote}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={statusTone(review.moderationStatus)}>{review.moderationStatus}</StatusBadge>
                    {review.isHidden && <p className="mt-2 text-xs font-bold text-error">Đang ẩn</p>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className={outlineButton} disabled={busyId === review.ratingId || review.moderationStatus === 'Flagged'} onClick={() => void moderate(review, false, 'Flagged')} type="button">
                        {busyId === review.ratingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />}
                        Gắn cờ
                      </button>
                      <button className={`${outlineButton} text-error`} disabled={busyId === review.ratingId || review.isHidden} onClick={() => void moderate(review, true, 'Hidden')} type="button">
                        <EyeOff className="h-4 w-4" />Ẩn
                      </button>
                      <button className={primaryButton} disabled={busyId === review.ratingId || (!review.isHidden && review.moderationStatus === 'Visible')} onClick={() => void moderate(review, false, 'Visible')} type="button">
                        <Eye className="h-4 w-4" />Hiện
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="grid min-h-56 place-items-center border-t border-outline-variant">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}
        {!loading && !data.items.length && (
          <div className="grid min-h-56 place-items-center border-t border-outline-variant p-6 text-center">
            <div>
              <Star className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-bold">Không có đánh giá phù hợp</p>
              <p className="mt-1 text-sm text-on-surface-variant">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          </div>
        )}
      </section>

      <div className="mt-4">
        <PaginationControls page={data} onPageChange={setPage} />
      </div>
    </AdminShell>
  );
};
