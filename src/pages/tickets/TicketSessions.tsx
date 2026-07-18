import { useEffect, useState, type FormEvent } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  MapPin,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Ticket,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getTicketSessions,
  type TicketSession,
  type TicketSessionSearch,
} from '../../api/ticketing';
import { ApiError } from '../../api/client';
import { PaginationControls } from '../../components/PaginationControls';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const playDate = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const playTime = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const formatPrice = (value: number) => value === 0 ? 'Miễn phí' : currency.format(value);
const formatDate = (value: string) => playDate.format(new Date(value));
const formatTime = (value: string) => playTime.format(new Date(value));

type FilterDraft = {
  search: string;
  date: string;
  skillLevel: string;
  playFormat: string;
  minPrice: string;
  maxPrice: string;
  onlyAvailable: boolean;
};

const emptyFilters: FilterDraft = {
  search: '',
  date: '',
  skillLevel: '',
  playFormat: '',
  minPrice: '',
  maxPrice: '',
  onlyAvailable: false,
};

const toSearch = (draft: FilterDraft): TicketSessionSearch => ({
  search: draft.search.trim() || undefined,
  date: draft.date || undefined,
  skillLevel: draft.skillLevel || undefined,
  playFormat: draft.playFormat || undefined,
  minPrice: draft.minPrice === '' ? undefined : Number(draft.minPrice),
  maxPrice: draft.maxPrice === '' ? undefined : Number(draft.maxPrice),
  onlyAvailable: draft.onlyAvailable || undefined,
});

export const TicketSessions = () => {
  const [sessions, setSessions] = useState<TicketSession[]>([]);
  const [draft, setDraft] = useState<FilterDraft>(emptyFilters);
  const [filters, setFilters] = useState<TicketSessionSearch>({});
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 9,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const result = await getTicketSessions({ ...filters, page, pageSize: 9 });
      setSessions(result.items);
      setPagination(result);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError.message
        : 'Không thể tải danh sách buổi xé vé.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    getTicketSessions({ ...filters, page, pageSize: 9 })
      .then((result) => {
        if (!active) return;
        setSessions(result.items);
        setPagination(result);
        setError('');
      })
      .catch((requestError: unknown) => {
        if (!active) return;
        setError(requestError instanceof ApiError
          ? requestError.message
          : 'Không thể tải danh sách buổi xé vé.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [filters, page]);

  useScheduleRealtime((event) => {
    if (event.entryType === 'TicketSession') void load(false);
  });

  usePaymentRealtime((event) => {
    if (sessions.some((session) => session.bookingId === event.bookingId)) void load(false);
  });

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    const next = toSearch(draft);
    if (next.minPrice !== undefined && next.maxPrice !== undefined && next.minPrice > next.maxPrice) {
      setError('Giá tối thiểu không được lớn hơn giá tối đa.');
      return;
    }
    setPage(1);
    setFilters(next);
  };

  const clearFilters = () => {
    setDraft(emptyFilters);
    setFilters({});
    setPage(1);
    setError('');
  };

  return (
    <div className="min-h-dvh bg-white pb-14 pt-[88px] text-on-background" data-ticket-sessions-page>
      <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <section className="grid gap-6 border-b border-outline-variant pb-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-lg bg-primary-container px-3 py-1.5 text-[12px] font-bold text-on-primary-container">
              <Ticket aria-hidden="true" className="h-4 w-4" /> Xé vé Pickleball
            </span>
            <h1 className="mt-4 text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.05] tracking-[-0.03em]">
              Có sân, có giờ. Chỉ cần vào đội.
            </h1>
            <p className="mt-4 max-w-[65ch] text-[15px] leading-7 text-on-surface-variant">
              Chọn một buổi chơi do chủ sân tổ chức, giữ chỗ bằng vé và thanh toán QR trực tiếp.
            </p>
          </div>
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
            <p className="text-[12px] font-semibold text-on-surface-variant">Buổi đang hiển thị</p>
            <p className="mt-1 font-mono text-[30px] font-bold text-on-surface">
              {pagination.totalCount.toLocaleString('vi-VN')}
            </p>
            <p className="mt-1 text-[13px] text-on-surface-variant">Kết quả còn hiệu lực và đã được Owner đăng.</p>
          </div>
        </section>

        <form className="mt-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-4 shadow-[0_8px_24px_rgba(22,26,18,0.05)]" onSubmit={applyFilters}>
          <div className="flex items-center gap-2 text-[14px] font-bold">
            <SlidersHorizontal aria-hidden="true" className="h-5 w-5 text-primary" />
            Tìm buổi phù hợp
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <div className="md:col-span-2 xl:col-span-2">
              <Input
                aria-label="Tìm tên buổi, sân hoặc địa chỉ"
                icon={<Search className="h-5 w-5" />}
                onChange={(event) => setDraft((current) => ({ ...current, search: event.target.value }))}
                placeholder="Tên buổi, sân hoặc địa chỉ"
                value={draft.search}
              />
            </div>
            <Input
              aria-label="Ngày chơi"
              min={new Date().toISOString().slice(0, 10)}
              onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))}
              type="date"
              value={draft.date}
            />
            <select
              aria-label="Trình độ"
              className="h-12 rounded-lg border border-outline-variant bg-surface-container px-3.5 text-[14px] text-on-surface outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/30"
              onChange={(event) => setDraft((current) => ({ ...current, skillLevel: event.target.value }))}
              value={draft.skillLevel}
            >
              <option value="">Mọi trình độ</option>
              {[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Level {level}</option>)}
            </select>
            <select
              aria-label="Hình thức chơi"
              className="h-12 rounded-lg border border-outline-variant bg-surface-container px-3.5 text-[14px] text-on-surface outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/30"
              onChange={(event) => setDraft((current) => ({ ...current, playFormat: event.target.value }))}
              value={draft.playFormat}
            >
              <option value="">Mọi hình thức</option>
              <option value="1vs1">Đánh đơn · 1vs1</option>
              <option value="2vs2">Đánh đôi · 2vs2</option>
            </select>
            <label className="flex min-h-12 items-center gap-3 rounded-lg border border-outline-variant bg-surface-container px-3.5 text-[13px] font-semibold">
              <input
                checked={draft.onlyAvailable}
                className="h-5 w-5 accent-[#98D951]"
                onChange={(event) => setDraft((current) => ({ ...current, onlyAvailable: event.target.checked }))}
                type="checkbox"
              />
              Chỉ còn chỗ
            </label>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,180px)_minmax(0,180px)_auto] sm:items-center">
            <Input
              aria-label="Giá vé tối thiểu"
              min="0"
              onChange={(event) => setDraft((current) => ({ ...current, minPrice: event.target.value }))}
              placeholder="Giá từ"
              step="1000"
              type="number"
              value={draft.minPrice}
            />
            <Input
              aria-label="Giá vé tối đa"
              min="0"
              onChange={(event) => setDraft((current) => ({ ...current, maxPrice: event.target.value }))}
              placeholder="Giá đến"
              step="1000"
              type="number"
              value={draft.maxPrice}
            />
            <div className="flex flex-wrap gap-2 sm:justify-end">
              <Button onClick={clearFilters} type="button" variant="ghost">Xóa lọc</Button>
              <Button type="submit"><Search aria-hidden="true" className="h-4 w-4" /> Tìm kiếm</Button>
            </div>
          </div>
        </form>

        {error && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-[14px] font-semibold text-error" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button className="ml-auto shrink-0 underline" onClick={() => void load()} type="button">Thử lại</button>
          </div>
        )}

        {loading ? (
          <div aria-label="Đang tải buổi xé vé" className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status">
            {Array.from({ length: 6 }, (_, index) => (
              <div className="h-64 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low motion-reduce:animate-none" key={index} />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <section className="mt-6 rounded-xl border border-dashed border-outline-variant px-6 py-14 text-center">
            <Ticket aria-hidden="true" className="mx-auto h-10 w-10 text-outline" />
            <h2 className="mt-4 text-[20px] font-bold">Chưa có buổi phù hợp</h2>
            <p className="mx-auto mt-2 max-w-xl text-[14px] leading-6 text-on-surface-variant">
              Thử đổi ngày, khoảng giá hoặc bỏ bộ lọc “chỉ còn chỗ”.
            </p>
            <Button className="mt-5" onClick={clearFilters} type="button" variant="outline">Xem tất cả</Button>
          </section>
        ) : (
          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Danh sách buổi xé vé">
            {sessions.map((session) => {
              const soldOut = session.remainingTickets <= 0;
              return (
                <article className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-outline-variant bg-white shadow-[0_8px_24px_rgba(22,26,18,0.05)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-px hover:border-primary-container hover:shadow-[0_12px_28px_rgba(22,26,18,0.08)]" key={session.ticketSessionId}>
                  <div className="flex items-center justify-between gap-3 border-b border-outline-variant bg-surface-container-low px-4 py-3">
                    <span className="rounded-md bg-primary-container px-2 py-1 text-[11px] font-bold text-on-primary-container">{session.playFormat}</span>
                    <span className={`text-[12px] font-bold ${soldOut ? 'text-error' : 'text-[#477313]'}`}>
                      {soldOut ? 'Đã hết chỗ' : `Còn ${session.remainingTickets}/${session.maxPlayers} chỗ`}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <p className="text-[12px] font-bold text-primary">Level {session.skillLevel}</p>
                    <h2 className="mt-2 line-clamp-2 text-[20px] font-bold leading-7 tracking-[-0.02em]">{session.title}</h2>
                    <div className="mt-4 grid gap-2 text-[13px] text-on-surface-variant">
                      <span className="flex items-start gap-2"><MapPin aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{session.venueName} · Sân {session.courtNumber}</span></span>
                      <span className="flex items-start gap-2"><CalendarDays aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{formatDate(session.startTime)}</span></span>
                      <span className="flex items-start gap-2"><Clock3 aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{formatTime(session.startTime)} – {formatTime(session.endTime)}</span></span>
                      <span className="flex items-start gap-2"><Users aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{session.soldTickets} đã thanh toán · {session.reservedTickets} đang giữ</span></span>
                    </div>
                    <div className="mt-auto flex items-end justify-between gap-4 border-t border-outline-variant pt-5">
                      <div>
                        <p className="text-[11px] font-semibold text-on-surface-variant">Mỗi vé</p>
                        <p className="mt-0.5 text-[19px] font-bold text-on-surface">{formatPrice(session.ticketPrice)}</p>
                      </div>
                      <Link className="inline-flex min-h-11 items-center rounded-lg bg-primary-container px-4 text-[13px] font-bold text-on-primary-container transition-transform hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70" to={`/ticket-sessions/${session.ticketSessionId}`}>
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!loading && sessions.length > 0 && (
          <div className="mt-6">
            <PaginationControls page={pagination} onPageChange={setPage} />
          </div>
        )}

        {!loading && error && (
          <Button className="mt-4" onClick={() => void load()} type="button" variant="outline">
            <RefreshCw aria-hidden="true" className="h-4 w-4" /> Tải lại
          </Button>
        )}
      </main>
    </div>
  );
};
