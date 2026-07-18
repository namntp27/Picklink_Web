import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarDays,
  Clock3,
  CreditCard,
  MapPin,
  Search,
  Ticket,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  getPlayerTickets,
  type SessionTicket,
  type SessionTicketStatus,
} from '../../api/ticketing';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { useVisiblePolling } from '../../hooks/useVisiblePolling';

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

const ticketStatusLabels: Record<string, string> = {
  PendingPayment: 'Chờ thanh toán',
  Paid: 'Đã thanh toán',
  CheckedIn: 'Đã check-in',
  Cancelled: 'Đã hủy',
  Expired: 'Hết thời gian giữ',
  RefundPending: 'Đang hoàn tiền',
  Refunded: 'Đã hoàn tiền',
};

const paymentStatusLabels: Record<string, string> = {
  Pending: 'Chờ chuyển khoản',
  Paid: 'Đã thanh toán',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
  RefundPending: 'Đang hoàn tiền',
  Refunded: 'Đã hoàn tiền',
};

const statusOptions: Array<{ value: '' | SessionTicketStatus; label: string }> = [
  { value: '', label: 'Tất cả vé' },
  { value: 'PendingPayment', label: 'Chờ thanh toán' },
  { value: 'Paid', label: 'Đã thanh toán' },
  { value: 'CheckedIn', label: 'Đã check-in' },
  { value: 'RefundPending', label: 'Đang hoàn tiền' },
  { value: 'Refunded', label: 'Đã hoàn tiền' },
  { value: 'Cancelled', label: 'Đã hủy' },
  { value: 'Expired', label: 'Đã hết hạn' },
];

const statusClass = (status: SessionTicketStatus) => {
  if (status === 'Paid' || status === 'CheckedIn') return 'border-primary-container/70 bg-primary-container text-on-primary-container';
  if (status === 'PendingPayment' || status === 'RefundPending') return 'border-outline-variant bg-surface-container-high text-on-surface';
  if (status === 'Refunded') return 'border-primary-container/50 bg-primary-container/20 text-[#477313]';
  return 'border-error/20 bg-error-container text-error';
};

export const MyTickets = () => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<SessionTicket[]>([]);
  const [status, setStatus] = useState<'' | SessionTicketStatus>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    totalCount: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (showLoading = true) => {
    if (!token) {
      setLoading(false);
      return;
    }
    if (showLoading) setLoading(true);
    try {
      const result = await getPlayerTickets(token, {
        status: status || undefined,
        page,
        pageSize: 10,
      });
      setTickets(result.items);
      setPagination(result);
      setError('');
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError.message
        : 'Không thể tải lịch sử vé.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, status, token]);

  usePaymentRealtime((event) => {
    if (tickets.some((ticket) => ticket.paymentId === event.paymentId)) void load(false);
  });

  useScheduleRealtime((event) => {
    if (event.entryType !== 'TicketSession') return;
    if (tickets.some((ticket) => ticket.session?.venueId === event.venueId
      && ticket.session?.courtId === event.courtId)) void load(false);
  });

  useVisiblePolling(
    () => load(false),
    10_000,
    tickets.some((ticket) => ticket.status === 'PendingPayment'),
  );

  const visibleTickets = useMemo(() => {
    const keyword = search.trim().toLocaleLowerCase('vi-VN');
    if (!keyword) return tickets;
    return tickets.filter((ticket) => {
      const session = ticket.session;
      return `${ticket.ticketCode} ${session?.title ?? ''} ${session?.venueName ?? ''} ${session?.venueAddress ?? ''}`
        .toLocaleLowerCase('vi-VN')
        .includes(keyword);
    });
  }, [search, tickets]);

  return (
    <div className="min-h-dvh bg-white pb-14 pt-[88px] text-on-background" data-my-tickets-page>
      <main className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <header className="grid gap-5 border-b border-outline-variant pb-7 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
          <div>
            <span className="inline-flex items-center gap-2 text-[13px] font-bold text-primary"><Ticket aria-hidden="true" className="h-5 w-5" /> Vé của tôi</span>
            <h1 className="mt-2 text-[clamp(2rem,5vw,3.25rem)] font-bold leading-tight tracking-[-0.03em]">Lịch sử xé vé</h1>
            <p className="mt-2 max-w-[65ch] text-[14px] leading-6 text-on-surface-variant">Theo dõi thanh toán, mã check-in, hủy vé và hoàn tiền của từng buổi chơi.</p>
          </div>
          <Link className="inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-container px-4 text-[14px] font-bold text-on-primary-container transition-transform hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70" to="/ticket-sessions">
            Tìm buổi mới
          </Link>
        </header>

        <section className="mt-5 grid gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-3 md:grid-cols-[minmax(0,1fr)_240px]">
          <Input
            aria-label="Tìm trong lịch sử vé"
            icon={<Search className="h-5 w-5" />}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Mã vé, tên buổi hoặc sân..."
            value={search}
          />
          <select
            aria-label="Lọc trạng thái vé"
            className="h-12 rounded-lg border border-outline-variant bg-white px-3.5 text-[14px] font-semibold text-on-surface outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container/30"
            onChange={(event) => {
              setStatus(event.target.value as '' | SessionTicketStatus);
              setPage(1);
            }}
            value={status}
          >
            {statusOptions.map((option) => <option key={option.value || 'all'} value={option.value}>{option.label}</option>)}
          </select>
        </section>

        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-[14px] font-semibold text-error" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
            <button className="ml-auto shrink-0 underline" onClick={() => void load()} type="button">Thử lại</button>
          </div>
        )}

        {loading ? (
          <div aria-label="Đang tải vé" className="mt-5 grid gap-3" role="status">
            {Array.from({ length: 4 }, (_, index) => <div className="h-44 animate-pulse rounded-xl border border-outline-variant bg-surface-container-low motion-reduce:animate-none" key={index} />)}
          </div>
        ) : visibleTickets.length === 0 ? (
          <section className="mt-5 rounded-xl border border-dashed border-outline-variant px-6 py-14 text-center">
            <Ticket aria-hidden="true" className="mx-auto h-10 w-10 text-outline" />
            <h2 className="mt-4 text-[20px] font-bold">{search ? 'Không tìm thấy vé' : 'Chưa có vé trong mục này'}</h2>
            <p className="mx-auto mt-2 max-w-lg text-[14px] leading-6 text-on-surface-variant">
              {search ? 'Thử tìm bằng mã vé, tên buổi hoặc tên sân khác.' : 'Khám phá các buổi đang mở bán và chọn khung giờ phù hợp.'}
            </p>
            {!search && <Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary-container px-4 text-[14px] font-bold text-on-primary-container" to="/ticket-sessions">Xem buổi đang bán</Link>}
          </section>
        ) : (
          <section aria-label="Danh sách vé đã mua" className="mt-5 grid gap-3">
            {visibleTickets.map((ticket) => {
              const session = ticket.session;
              return (
                <article className="grid min-w-0 gap-4 rounded-xl border border-outline-variant bg-white p-4 shadow-[0_7px_20px_rgba(22,26,18,0.04)] transition-[border-color,box-shadow] hover:border-primary-container hover:shadow-[0_10px_24px_rgba(22,26,18,0.07)] md:grid-cols-[minmax(0,1fr)_190px] md:items-center" key={ticket.sessionTicketId}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-lg border px-2.5 py-1 text-[11px] font-bold ${statusClass(ticket.status)}`}>{ticketStatusLabels[ticket.status] ?? ticket.status}</span>
                      <span className="rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[11px] font-semibold text-on-surface-variant">{paymentStatusLabels[ticket.paymentStatus] ?? ticket.paymentStatus}</span>
                    </div>
                    <h2 className="mt-3 truncate text-[19px] font-bold tracking-[-0.02em]">{session?.title ?? `Buổi #${ticket.ticketSessionId}`}</h2>
                    <p className="mt-1 break-all font-mono text-[12px] font-bold text-primary">{ticket.ticketCode}</p>
                    {session && (
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-medium text-on-surface-variant">
                        <span className="inline-flex items-center gap-1.5"><MapPin aria-hidden="true" className="h-4 w-4 text-primary" /> {session.venueName} · Sân {session.courtNumber}</span>
                        <span className="inline-flex items-center gap-1.5"><CalendarDays aria-hidden="true" className="h-4 w-4 text-primary" /> {playDate.format(new Date(session.startTime))}</span>
                        <span className="inline-flex items-center gap-1.5"><Clock3 aria-hidden="true" className="h-4 w-4 text-primary" /> {playTime.format(new Date(session.startTime))} – {playTime.format(new Date(session.endTime))}</span>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-outline-variant pt-4 md:border-l md:border-t-0 md:pl-5 md:pt-0">
                    <p className="flex items-center gap-2 text-[12px] font-semibold text-on-surface-variant"><CreditCard aria-hidden="true" className="h-4 w-4" /> Giá vé</p>
                    <p className="mt-1 text-[18px] font-bold">{ticket.amount === 0 ? 'Miễn phí' : currency.format(ticket.amount)}</p>
                    <Link className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-outline-variant bg-white px-3 text-[13px] font-bold text-primary transition-colors hover:border-primary-container hover:bg-surface-container-low focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70" to={`/my-tickets/${ticket.sessionTicketId}`}>
                      Xem vé
                    </Link>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {!loading && tickets.length > 0 && (
          <div className="mt-5">
            <PaginationControls page={pagination} onPageChange={setPage} />
          </div>
        )}

        {!loading && error && (
          <Button className="mt-4" onClick={() => void load()} type="button" variant="outline">Tải lại</Button>
        )}
      </main>
    </div>
  );
};
