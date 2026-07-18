import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  Ticket,
  Users,
  XCircle,
} from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { buySessionTicket, getTicketSession, type TicketSession } from '../../api/ticketing';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const fullDate = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'long',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const clockTime = new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit',
  minute: '2-digit',
});

const formatPrice = (value: number) => value === 0 ? 'Miễn phí' : currency.format(value);

export const TicketSessionDetail = () => {
  const ticketSessionId = Number(useParams().id);
  const { token, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<TicketSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [error, setError] = useState('');

  const load = async (silent = false) => {
    if (!Number.isInteger(ticketSessionId) || ticketSessionId <= 0) {
      setError('Mã buổi xé vé không hợp lệ.');
      setLoading(false);
      return;
    }
    if (!silent) setLoading(true);
    try {
      setSession(await getTicketSession(ticketSessionId));
      setError('');
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError.message
        : 'Không thể tải thông tin buổi xé vé.');
      if (silent && requestError instanceof ApiError && requestError.status === 404) setSession(null);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [ticketSessionId]);

  useScheduleRealtime((event) => {
    if (!session || event.entryType !== 'TicketSession') return;
    if (event.venueId === session.venueId && event.courtId === session.courtId) void load(true);
  });

  usePaymentRealtime((event) => {
    if (session && event.bookingId === session.bookingId) void load(true);
  });

  const purchase = async () => {
    if (!user || !token) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (user.role !== 'player') {
      setError('Chỉ tài khoản Player mới có thể mua vé.');
      return;
    }
    if (!session) return;
    setBuying(true);
    setError('');
    try {
      const ticket = await buySessionTicket(token, session.ticketSessionId);
      navigate(`/my-tickets/${ticket.sessionTicketId}`, { state: { ticket } });
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError.message
        : 'Không thể giữ vé. Vui lòng thử lại.');
      await load(true);
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-dvh place-items-center bg-white px-4 pt-16" role="status">
        <div className="text-center">
          <Loader2 aria-hidden="true" className="mx-auto h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
          <p className="mt-3 text-[14px] font-semibold text-on-surface-variant">Đang tải buổi xé vé...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="grid min-h-dvh place-items-center bg-white px-4 pt-16">
        <section className="w-full max-w-md rounded-xl border border-error/25 bg-white p-7 text-center shadow-[0_12px_32px_rgba(22,26,18,0.08)]">
          <XCircle aria-hidden="true" className="mx-auto h-11 w-11 text-error" />
          <h1 className="mt-4 text-[22px] font-bold">Không thể mở buổi xé vé</h1>
          <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{error || 'Buổi chơi không tồn tại hoặc đã ngừng công khai.'}</p>
          <Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary-container px-4 text-[14px] font-bold text-on-primary-container" to="/ticket-sessions">
            Xem các buổi khác
          </Link>
        </section>
      </div>
    );
  }

  const hasStarted = new Date(session.startTime).getTime() <= Date.now();
  const canPurchase = session.status === 'Published' && !hasStarted && session.remainingTickets > 0;
  const mapQuery = session.venueLatitude != null && session.venueLongitude != null
    ? `${session.venueLatitude},${session.venueLongitude}`
    : session.venueAddress;
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`;

  return (
    <div className="min-h-dvh bg-white pb-14 pt-[84px] text-on-background" data-ticket-session-detail>
      <main className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <Link className="inline-flex min-h-11 items-center gap-2 rounded-lg text-[13px] font-bold text-primary hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70" to="/ticket-sessions">
          <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Tất cả buổi xé vé
        </Link>

        {error && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-[14px] font-semibold text-error" role="alert">
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" /> {error}
          </div>
        )}

        <section className="mt-3 overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[0_12px_34px_rgba(22,26,18,0.07)]">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="p-5 sm:p-7 lg:p-9">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg bg-primary-container px-2.5 py-1 text-[12px] font-bold text-on-primary-container">{session.playFormat}</span>
                <span className="rounded-lg border border-outline-variant bg-surface-container-low px-2.5 py-1 text-[12px] font-bold">Level {session.skillLevel}</span>
                <span className={`rounded-lg border px-2.5 py-1 text-[12px] font-bold ${session.remainingTickets > 0 ? 'border-primary-container/60 bg-primary-container/20 text-[#477313]' : 'border-error/25 bg-error-container text-error'}`}>
                  {session.remainingTickets > 0 ? `Còn ${session.remainingTickets} chỗ` : 'Đã hết chỗ'}
                </span>
              </div>
              <h1 className="mt-5 max-w-[20ch] text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.04] tracking-[-0.03em]">{session.title}</h1>
              <p className="mt-5 flex max-w-2xl items-start gap-2 text-[14px] leading-6 text-on-surface-variant">
                <MapPin aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span><strong className="text-on-surface">{session.venueName}</strong><br />{session.venueAddress}</span>
              </p>
              {session.description && (
                <div className="mt-7 border-t border-outline-variant pt-6">
                  <h2 className="text-[15px] font-bold">Về buổi chơi</h2>
                  <p className="mt-2 max-w-[65ch] whitespace-pre-line text-[14px] leading-7 text-on-surface-variant">{session.description}</p>
                </div>
              )}
            </div>

            <aside className="border-t border-outline-variant bg-surface-container-low p-5 sm:p-7 lg:border-l lg:border-t-0">
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-on-surface-variant">Giá mỗi vé</p>
              <p className="mt-2 text-[32px] font-bold tracking-[-0.03em]">{formatPrice(session.ticketPrice)}</p>
              <div className="mt-5 grid gap-3 border-y border-outline-variant py-5 text-[13px]">
                <div className="flex items-start gap-3"><CalendarDays aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span><strong className="block text-on-surface">Ngày chơi</strong><span className="text-on-surface-variant">{fullDate.format(new Date(session.startTime))}</span></span></div>
                <div className="flex items-start gap-3"><Clock3 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span><strong className="block text-on-surface">Khung giờ</strong><span className="text-on-surface-variant">{clockTime.format(new Date(session.startTime))} – {clockTime.format(new Date(session.endTime))}</span></span></div>
                <div className="flex items-start gap-3"><Ticket aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span><strong className="block text-on-surface">Sân thi đấu</strong><span className="text-on-surface-variant">Sân {session.courtNumber}{session.courtType ? ` · ${session.courtType}` : ''}</span></span></div>
                <div className="flex items-start gap-3"><Users aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><span><strong className="block text-on-surface">Người tham gia</strong><span className="text-on-surface-variant">{session.soldTickets} đã trả · {session.reservedTickets} đang giữ</span></span></div>
              </div>
              <Button aria-busy={buying} className="mt-5 w-full" disabled={!canPurchase || buying} onClick={() => void purchase()} size="lg" type="button">
                {buying && <Loader2 aria-hidden="true" className="h-4 w-4" />}
                {!canPurchase ? (session.remainingTickets <= 0 ? 'Đã hết vé' : 'Đã ngừng bán') : user ? 'Giữ vé & thanh toán' : 'Đăng nhập để mua vé'}
              </Button>
              <p className="mt-3 text-center text-[12px] leading-5 text-on-surface-variant">
                Vé được giữ trong thời gian giới hạn. Thanh toán đúng nội dung QR để xác nhận tự động.
              </p>
            </aside>
          </div>
        </section>

        <section className="mt-5 grid gap-px overflow-hidden rounded-xl border border-outline-variant bg-outline-variant md:grid-cols-3">
          <div className="bg-white p-5">
            <ShieldCheck aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-[15px] font-bold">Chính sách hủy</h2>
            <p className="mt-1 text-[13px] leading-6 text-on-surface-variant">Hủy trước giờ chơi ít nhất {session.cancellationDeadlineHours} giờ để được xử lý theo chính sách.</p>
          </div>
          <div className="bg-white p-5">
            <CheckCircle2 aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-[15px] font-bold">Check-in một lần</h2>
            <p className="mt-1 text-[13px] leading-6 text-on-surface-variant">Chỉ vé đã thanh toán mới được Staff check-in tại sân.</p>
          </div>
          <div className="bg-white p-5">
            <ExternalLink aria-hidden="true" className="h-6 w-6 text-primary" />
            <h2 className="mt-3 text-[15px] font-bold">Thông tin sân</h2>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold">
              <a className="inline-flex items-center gap-1.5 text-primary hover:underline" href={mapUrl} rel="noreferrer" target="_blank"><MapPin aria-hidden="true" className="h-4 w-4" /> Mở bản đồ</a>
              {session.venuePhone && <a className="inline-flex items-center gap-1.5 text-primary hover:underline" href={`tel:${session.venuePhone}`}><Phone aria-hidden="true" className="h-4 w-4" /> {session.venuePhone}</a>}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
