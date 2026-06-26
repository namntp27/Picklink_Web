import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarRange, CheckCircle2, Clock, CreditCard, Eye, MapPin, PlusCircle, Trophy, Users, XCircle } from 'lucide-react';
import { cancelMatch, getMyMatches, type MatchStatus, type MatchSummary } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { PaginationControls } from '../../components/PaginationControls';

type FilterStatus = 'all' | MatchStatus;

const statusConfig: Record<MatchStatus, { label: string; className: string; icon: React.ElementType }> = {
  Recruiting: { label: 'Đang tìm người', className: 'bg-primary/10 text-primary', icon: Users },
  ReadyToBook: { label: 'Sẵn sàng đặt sân', className: 'bg-blue-100 text-blue-700', icon: CalendarRange },
  BookingPending: { label: 'Chờ thanh toán', className: 'bg-amber-100 text-amber-800', icon: CreditCard },
  Booked: { label: 'Đã đặt sân', className: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  Completed: { label: 'Đã hoàn thành', className: 'bg-slate-100 text-slate-700', icon: Trophy },
  Cancelled: { label: 'Đã hủy', className: 'bg-red-100 text-red-700', icon: XCircle },
  Expired: { label: 'Đã hết hạn', className: 'bg-slate-100 text-slate-600', icon: Clock },
};

const filters: Array<{ label: string; value: FilterStatus }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang tìm người', value: 'Recruiting' },
  { label: 'Sẵn sàng đặt sân', value: 'ReadyToBook' },
  { label: 'Chờ thanh toán', value: 'BookingPending' },
  { label: 'Đã đặt sân', value: 'Booked' },
  { label: 'Đã kết thúc', value: 'Completed' },
  { label: 'Đã hủy / hết hạn', value: 'Cancelled' },
];

const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(`${value}T00:00:00`));
const timePart = (value: string) => value.slice(11, 16);

export const MyMatches = () => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [error, setError] = useState('');

  const load = async () => {
    if (!token) return;
    try {
      const result = await getMyMatches(token, { page, pageSize: 10 });
      setMatches(result.items);
      setPagination(result);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách phòng.');
    }
  };

  useEffect(() => { void load(); }, [page, token]);
  useMatchRealtime(() => { void load(); });

  const visible = useMemo(() => {
    if (activeFilter === 'all') return matches;
    if (activeFilter === 'Cancelled') return matches.filter((match) => match.status === 'Cancelled' || match.status === 'Expired');
    return matches.filter((match) => match.status === activeFilter);
  }, [activeFilter, matches]);

  const attentionCount = matches.filter((match) => match.status === 'ReadyToBook' || match.status === 'BookingPending').length;

  const handleCancel = async (matchId: number) => {
    if (!token || !window.confirm('Bạn chắc chắn muốn hủy phòng ghép trận này?')) return;
    try {
      await cancelMatch(token, matchId);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể hủy phòng.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-4 py-9 md:px-margin-desktop lg:grid-cols-[1fr_300px] lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold"><Trophy className="h-4 w-4" /> Phòng ghép trận cá nhân</span>
            <h1 className="mt-4 text-[34px] font-bold md:text-[44px]">Phòng của tôi</h1>
            <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/85">Theo dõi lời mời bạn tạo hoặc đã được duyệt tham gia, từ lúc tuyển người đến khi hoàn thành booking.</p>
            <Link className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-[14px] font-bold text-primary" to="/opponents"><PlusCircle className="h-5 w-5" /> Tạo lời mời mới</Link>
          </div>
          <div className="rounded-xl border border-white/20 bg-white/10 p-5"><p className="text-[13px] font-bold uppercase text-white/70">Cần xử lý</p><p className="mt-2 text-[34px] font-bold">{attentionCount}</p><p className="text-[13px] text-white/75">phòng chờ đặt sân hoặc thanh toán</p></div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] space-y-5 px-4 py-8 md:px-margin-desktop">
        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] font-bold text-red-700">{error}</div>}
        <section className="flex gap-2 overflow-x-auto rounded-xl border border-outline-variant bg-white p-3 shadow-sm">
          {filters.map((filter) => (
            <button className={`shrink-0 rounded-lg px-4 py-3 text-[13px] font-bold ${activeFilter === filter.value ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'}`} key={filter.value} onClick={() => setActiveFilter(filter.value)} type="button">{filter.label}</button>
          ))}
        </section>

        <section className="space-y-4">
          {visible.map((match) => {
            const status = statusConfig[match.status];
            const StatusIcon = status.icon;
            return (
              <article className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm hover:border-primary" key={match.matchId}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-bold ${status.className}`}><StatusIcon className="h-4 w-4" /> {status.label}</span>
                      <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold">{match.isHost ? 'Bạn là chủ phòng' : 'Bạn là thành viên'}</span>
                      <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold">{match.matchType}</span>
                    </div>
                    <Link to={`/matches/${match.matchId}`}><h2 className="mt-3 text-[22px] font-bold hover:text-primary">{match.title}</h2></Link>
                    <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{match.note || `Phòng đang ở trạng thái ${status.label.toLowerCase()}.`}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link className="inline-flex items-center gap-2 rounded-lg border border-primary px-4 py-3 text-[13px] font-bold text-primary" to={`/matches/${match.matchId}`}><Eye className="h-4 w-4" /> Xem phòng</Link>
                    {match.isHost && (match.status === 'Recruiting' || match.status === 'ReadyToBook') && (
                      <button className="inline-flex items-center gap-2 rounded-lg border border-red-300 px-4 py-3 text-[13px] font-bold text-red-700" onClick={() => void handleCancel(match.matchId)} type="button"><XCircle className="h-4 w-4" /> Hủy</button>
                    )}
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-lg bg-surface-container-low p-3"><p className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant"><CalendarRange className="h-4 w-4 text-primary" /> Ngày có thể chơi</p><p className="mt-1 text-[14px] font-bold">{dateLabel(match.availableDateFrom)} – {dateLabel(match.availableDateTo)}</p></div>
                  <div className="rounded-lg bg-surface-container-low p-3"><p className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant"><Clock className="h-4 w-4 text-primary" /> Khung giờ</p><p className="mt-1 text-[14px] font-bold">{match.startTime ? `${timePart(match.startTime)} – ${timePart(match.endTime!)}` : `${match.preferredTimeStart} – ${match.preferredTimeEnd}`}</p></div>
                  <div className="rounded-lg bg-surface-container-low p-3"><p className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant"><MapPin className="h-4 w-4 text-primary" /> {match.venueName ? 'Sân đã chọn' : 'Khu vực'}</p><p className="mt-1 text-[14px] font-bold">{match.venueName ? `${match.venueName} · Sân ${match.courtNumber}` : `${match.ward}, ${match.province}`}</p></div>
                  <div className="rounded-lg bg-surface-container-low p-3"><p className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant"><Users className="h-4 w-4 text-primary" /> Thành viên</p><p className="mt-1 text-[14px] font-bold">{match.acceptedPlayerCount}/{match.requiredPlayerCount} người</p></div>
                </div>
              </article>
            );
          })}
          {visible.length === 0 && <div className="rounded-xl border border-dashed border-outline-variant bg-white p-10 text-center"><h3 className="text-[18px] font-bold">Chưa có phòng trong nhóm này</h3></div>}
          <PaginationControls page={pagination} onPageChange={setPage} />
        </section>
      </main>
    </div>
  );
};
