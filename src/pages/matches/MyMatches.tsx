import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  MapPin,
  PlusCircle,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import { cancelMatch, getMyMatches, type MatchStatus, type MatchSummary } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { CommunityEmptyState, CommunityHero, CommunityPage } from '../community/CommunityUI';

type FilterStatus = 'all' | MatchStatus;

const statusConfig: Record<MatchStatus, {
  className: string;
  icon: React.ElementType;
  label: string;
}> = {
  Recruiting: { label: 'Đang tìm người', className: 'bg-[#edf5e9] text-[#477313]', icon: Users },
  ReadyToBook: { label: 'Sẵn sàng đặt sân', className: 'bg-blue-50 text-blue-700', icon: CalendarRange },
  BookingPending: { label: 'Chờ thanh toán', className: 'bg-amber-50 text-amber-800', icon: CreditCard },
  Booked: { label: 'Đã đặt sân', className: 'bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  Completed: { label: 'Đã hoàn thành', className: 'bg-slate-100 text-slate-700', icon: Trophy },
  Cancelled: { label: 'Đã hủy', className: 'bg-red-50 text-red-700', icon: XCircle },
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
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
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

  useEffect(() => {
    void load();
  }, [page, token]);

  useMatchRealtime(() => {
    void load();
  });

  const visible = useMemo(() => {
    if (activeFilter === 'all') return matches;
    if (activeFilter === 'Cancelled') {
      return matches.filter((match) => match.status === 'Cancelled' || match.status === 'Expired');
    }
    return matches.filter((match) => match.status === activeFilter);
  }, [activeFilter, matches]);

  const attentionCount = matches.filter(
    (match) => match.status === 'ReadyToBook' || match.status === 'BookingPending',
  ).length;

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
    <CommunityPage>
      <CommunityHero
        actions={(
          <Link className="community-button" to="/opponents/create">
            <PlusCircle aria-hidden="true" className="h-4 w-4" />
            Tạo lời mời mới
          </Link>
        )}
        description="Theo dõi các phòng bạn tạo hoặc đã được duyệt tham gia, từ tuyển người đến hoàn tất booking."
        icon={Trophy}
        label="Phòng ghép trận cá nhân"
        stats={(
          <div>
            <p className="text-[11px] font-bold text-white/65">Cần xử lý</p>
            <p className="mt-1 font-mono text-[30px] font-extrabold text-[#e2ff57]">{attentionCount}</p>
            <p className="mt-1 text-[11px] leading-5 text-white/65">phòng chờ đặt sân hoặc thanh toán</p>
          </div>
        )}
        title="Phòng của tôi"
      />

      <main className="community-container space-y-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[12px] font-bold text-red-700" role="alert">
            {error}
          </div>
        )}

        <nav
          aria-label="Lọc phòng theo trạng thái"
          className="community-panel community-scroll sticky top-[72px] z-20 flex gap-1 overflow-x-auto p-2"
        >
          {filters.map((filter) => (
            <button
              aria-pressed={activeFilter === filter.value}
              className={`min-h-9 shrink-0 rounded-[9px] px-3 text-[12px] font-extrabold transition-[color,background-color,transform] duration-200 active:translate-y-px ${
                activeFilter === filter.value
                  ? 'bg-[#0b2228] text-white shadow-[0_7px_16px_rgba(8,29,36,0.14)]'
                  : 'text-[#66756b] hover:bg-[#edf5e9] hover:text-[#0b2228]'
              }`}
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </nav>

        <section className="grid gap-3">
          {visible.map((match) => {
            const status = statusConfig[match.status];
            const StatusIcon = status.icon;

            return (
              <article className="community-card p-4 sm:p-5" key={match.matchId}>
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className={`community-badge ${status.className}`}>
                        <StatusIcon aria-hidden="true" className="h-3.5 w-3.5" />
                        {status.label}
                      </span>
                      <span className="community-badge text-[#526158]">
                        {match.isHost ? 'Bạn là chủ phòng' : 'Bạn là thành viên'}
                      </span>
                      <span className="community-badge text-[#526158]">{match.matchType}</span>
                    </div>
                    <Link className="mt-3 block" to={`/matches/${match.matchId}`}>
                      <h2 className="text-[18px] font-extrabold leading-6 tracking-[-0.015em] text-[#0b2228] transition-colors hover:text-[#477313]">
                        {match.title}
                      </h2>
                    </Link>
                    <p className="mt-2 text-[13px] leading-6 text-[#526158]">
                      {match.note || `Phòng đang ở trạng thái ${status.label.toLowerCase()}.`}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Link className="community-button-secondary" to={`/matches/${match.matchId}`}>
                      <Eye aria-hidden="true" className="h-4 w-4" />
                      Xem phòng
                    </Link>
                    {match.isHost && (match.status === 'Recruiting' || match.status === 'ReadyToBook') && (
                      <button
                        aria-label={`Hủy phòng ${match.title}`}
                        className="community-button-danger h-10 w-10 !p-0"
                        onClick={() => void handleCancel(match.matchId)}
                        title="Hủy phòng"
                        type="button"
                      >
                        <XCircle aria-hidden="true" className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-[#d8e4d4] bg-[#d8e4d4] sm:grid-cols-2 xl:grid-cols-4">
                  <div className="bg-[#f7faf5] p-3">
                    <p className="flex items-center gap-2 text-[11px] font-bold text-[#718077]"><CalendarRange className="h-3.5 w-3.5 text-[#477313]" />Ngày có thể chơi</p>
                    <p className="mt-1 text-[13px] font-extrabold">{dateLabel(match.availableDateFrom)} - {dateLabel(match.availableDateTo)}</p>
                  </div>
                  <div className="bg-[#f7faf5] p-3">
                    <p className="flex items-center gap-2 text-[11px] font-bold text-[#718077]"><Clock className="h-3.5 w-3.5 text-[#477313]" />Khung giờ</p>
                    <p className="mt-1 text-[13px] font-extrabold">
                      {match.startTime
                        ? `${timePart(match.startTime)} - ${timePart(match.endTime!)}`
                        : `${match.preferredTimeStart} - ${match.preferredTimeEnd}`}
                    </p>
                  </div>
                  <div className="bg-[#f7faf5] p-3">
                    <p className="flex items-center gap-2 text-[11px] font-bold text-[#718077]"><MapPin className="h-3.5 w-3.5 text-[#477313]" />{match.venueName ? 'Sân đã chọn' : 'Khu vực'}</p>
                    <p className="mt-1 text-[13px] font-extrabold">
                      {match.venueName ? `${match.venueName} · Sân ${match.courtNumber}` : `${match.ward}, ${match.province}`}
                    </p>
                  </div>
                  <div className="bg-[#f7faf5] p-3">
                    <p className="flex items-center gap-2 text-[11px] font-bold text-[#718077]"><Users className="h-3.5 w-3.5 text-[#477313]" />Thành viên</p>
                    <p className="mt-1 text-[13px] font-extrabold">{match.acceptedPlayerCount}/{match.requiredPlayerCount} người</p>
                  </div>
                </div>
              </article>
            );
          })}

          {visible.length === 0 && (
            <CommunityEmptyState
              action={<Link className="community-button" to="/opponents/create">Tạo lời mời</Link>}
              description="Các phòng phù hợp với trạng thái này sẽ xuất hiện tại đây."
              icon={Trophy}
              title="Chưa có phòng trong nhóm này"
            />
          )}
          <PaginationControls page={pagination} onPageChange={setPage} />
        </section>
      </main>
    </CommunityPage>
  );
};
