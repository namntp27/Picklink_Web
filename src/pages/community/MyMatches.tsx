import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  MapPin,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';
import { cancelMatch, getMyMatches, reopenMatch, type MatchSummary } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { PaginationControls } from '../../components/PaginationControls';

type MatchStatus = 'waiting' | 'payment' | 'confirmed' | 'cancelled';
type MatchRole = 'host' | 'participant';
type MatchFormat = '1vs1' | '2vs2';
type FilterStatus = 'all' | MatchStatus;

type MyMatch = {
  id: number;
  title: string;
  role: MatchRole;
  status: MatchStatus;
  level: string;
  format: MatchFormat;
  courtCluster: string;
  subCourt: string;
  ward: string;
  province: string;
  date: string;
  startTime: string;
  endTime: string;
  joined: number;
  needed: number;
  totalPrice: number;
  note: string;
};

const initialMatches: MyMatch[] = [
  {
    id: 1,
    title: 'Trận đôi sáng tại Cầu Giấy',
    role: 'host',
    status: 'waiting',
    level: '3.0 - 3.5',
    format: '2vs2',
    courtCluster: 'Pickleball Pro Duy Tân',
    subCourt: 'C.Lông 1',
    ward: 'Phường Cầu Giấy',
    province: 'Hà Nội',
    date: '2026-06-18',
    startTime: '7:00',
    endTime: '8:00',
    joined: 2,
    needed: 4,
    totalPrice: 240000,
    note: 'Đang chờ thêm 2 người để đủ trận. Ưu tiên đúng giờ và chia tiền sân sau khi đủ người.',
  },
  {
    id: 2,
    title: 'Ghép trận tối Thủ Đức',
    role: 'participant',
    status: 'payment',
    level: '3.5 - 4.0',
    format: '2vs2',
    courtCluster: 'Thủ Đức Pickleball Center',
    subCourt: 'Pickleball 2',
    ward: 'Phường Thủ Đức',
    province: 'Hồ Chí Minh',
    date: '2026-06-22',
    startTime: '18:00',
    endTime: '19:30',
    joined: 4,
    needed: 4,
    totalPrice: 375000,
    note: 'Trận đã đủ người. Bạn cần thanh toán phần tiền sân để giữ lịch.',
  },
  {
    id: 3,
    title: 'Đánh đơn nhẹ cuối tuần',
    role: 'participant',
    status: 'confirmed',
    level: '2.5 - 3.0',
    format: '1vs1',
    courtCluster: 'Sân Kỳ Hòa Pickleball',
    subCourt: 'PB 3',
    ward: 'Phường Hòa Hưng',
    province: 'Hồ Chí Minh',
    date: '2026-06-21',
    startTime: '7:00',
    endTime: '8:30',
    joined: 2,
    needed: 2,
    totalPrice: 330000,
    note: 'Lịch đã xác nhận. Đến sân trước 10 phút để check-in.',
  },
  {
    id: 4,
    title: 'Trận đôi Mỹ Đình',
    role: 'host',
    status: 'cancelled',
    level: '3.0 - 3.5',
    format: '2vs2',
    courtCluster: 'PickleHub Mỹ Đình',
    subCourt: 'PB 1',
    ward: 'Phường Từ Liêm',
    province: 'Hà Nội',
    date: '2026-06-19',
    startTime: '19:30',
    endTime: '21:00',
    joined: 1,
    needed: 4,
    totalPrice: 390000,
    note: 'Đã hủy do không đủ người trước thời hạn giữ sân.',
  },
];

const filters: Array<{ label: string; value: FilterStatus }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang chờ người', value: 'waiting' },
  { label: 'Chờ thanh toán', value: 'payment' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Đã hủy', value: 'cancelled' },
];

const statusConfig: Record<
  MatchStatus,
  {
    label: string;
    className: string;
    icon: React.ElementType;
  }
> = {
  waiting: {
    label: 'Đang chờ người',
    className: 'bg-primary/10 text-primary',
    icon: Users,
  },
  payment: {
    label: 'Chờ thanh toán',
    className: 'bg-[#fff4d8] text-[#755400]',
    icon: CreditCard,
  },
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-[#eaf7df] text-primary',
    icon: CheckCircle2,
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-[#ffe8e8] text-[#a33535]',
    icon: XCircle,
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

export const MyMatches = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [matches, setMatches] = useState<MyMatch[]>([]);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });

  const mapStatus = (status: MatchSummary['status']): MatchStatus => {
    if (status === 'Waiting' || status === 'Full') return 'waiting';
    if (status === 'PaymentPending') return 'payment';
    if (status === 'Cancelled') return 'cancelled';
    return 'confirmed';
  };

  const mapMatch = (match: MatchSummary): MyMatch => ({
    id: match.matchId,
    title: `${match.matchType} tại ${match.venueName}`,
    role: match.isHost ? 'host' : 'participant',
    status: mapStatus(match.status),
    level: String(match.matchSkillLevel),
    format: match.matchType,
    courtCluster: match.venueName,
    subCourt: `Sân ${match.courtNumber}`,
    ward: match.address,
    province: '',
    date: match.startTime.slice(0, 10),
    startTime: match.startTime.slice(11, 16),
    endTime: match.endTime.slice(11, 16),
    joined: match.acceptedPlayerCount,
    needed: match.requiredPlayerCount,
    totalPrice: match.totalBookingAmount,
    note: match.note || `Trạng thái hiện tại: ${match.status}.`,
  });

  const loadMatches = async () => {
    if (!token) return;
    try {
      const result = await getMyMatches(token, { page, pageSize: 10 });
      setMatches(result.items.map(mapMatch));
      setPagination(result);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách trận.');
    }
  };

  useEffect(() => { void loadMatches(); }, [page, token]);
  useMatchRealtime(() => { void loadMatches(); });

  const filteredMatches = useMemo(
    () => (activeFilter === 'all' ? matches : matches.filter((match) => match.status === activeFilter)),
    [activeFilter, matches],
  );

  const statusCounts = useMemo(
    () =>
      matches.reduce(
        (counts, match) => ({
          ...counts,
          [match.status]: counts[match.status] + 1,
          all: counts.all + 1,
        }),
        { all: 0, waiting: 0, payment: 0, confirmed: 0, cancelled: 0 } as Record<FilterStatus, number>,
      ),
    [matches],
  );

  const nextMatch = useMemo(
    () =>
      matches
        .filter((match) => match.status === 'confirmed' || match.status === 'payment')
        .sort((first, second) => `${first.date} ${first.startTime}`.localeCompare(`${second.date} ${second.startTime}`))[0],
    [matches],
  );

  const paymentMatches = matches.filter((match) => match.status === 'payment');
  const waitingMatches = matches.filter((match) => match.status === 'waiting');

  const handlePay = (matchId: number) => {
    navigate(`/matches/${matchId}`);
  };

  const handleCancel = async (matchId: number) => {
    if (!token || !window.confirm('Bạn chắc chắn muốn hủy trận này?')) return;
    await cancelMatch(token, matchId);
    await loadMatches();
  };

  const handleReopen = async (matchId: number) => {
    if (!token) return;
    await reopenMatch(token, matchId);
    await loadMatches();
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold">
                <Trophy className="h-4 w-4" />
                Lịch thi đấu cá nhân
              </span>
              <h1 className="mt-4 text-[32px] font-bold leading-tight md:text-[44px]">Trận của tôi</h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/85">
                Theo dõi các trận bạn đã tạo hoặc tham gia, kiểm tra trạng thái ghép người, thanh toán và lịch đã xác nhận.
              </p>
            </div>

            <div className="rounded-xl border border-white/18 bg-white/10 p-5">
              <p className="text-[13px] font-bold uppercase text-white/72">Cần xử lý</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-white/12 p-4">
                  <p className="text-[28px] font-bold">{paymentMatches.length}</p>
                  <p className="text-[13px] font-medium text-white/78">chờ thanh toán</p>
                </div>
                <div className="rounded-lg bg-white/12 p-4">
                  <p className="text-[28px] font-bold">{waitingMatches.length}</p>
                  <p className="text-[13px] font-medium text-white/78">chờ người</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] font-bold text-red-700">{error}</div>}
          <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((filter) => (
                <button
                  className={`shrink-0 rounded-lg px-4 py-3 text-[14px] font-bold transition-colors ${
                    activeFilter === filter.value
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary'
                  }`}
                  key={filter.value}
                  onClick={() => {
                    setActiveFilter(filter.value);
                    setPage(1);
                  }}
                  type="button"
                >
                  {filter.label} ({statusCounts[filter.value]})
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            {filteredMatches.map((match) => {
              const status = statusConfig[match.status];
              const StatusIcon = status.icon;
              const perPlayerPrice = Math.ceil(match.totalPrice / match.needed);
              const availableSlots = Math.max(match.needed - match.joined, 0);

              return (
                <article className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm transition-colors hover:border-primary" key={match.id}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-bold ${status.className}`}>
                          <StatusIcon className="h-4 w-4" />
                          {status.label}
                        </span>
                        <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold text-on-surface-variant">
                          {match.role === 'host' ? 'Bạn tạo trận' : 'Bạn tham gia'}
                        </span>
                        <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold text-on-surface-variant">
                          {match.format}
                        </span>
                      </div>

                      <Link to={`/matches/${match.id}`}>
                        <h2 className="mt-3 text-[22px] font-bold transition-colors hover:text-primary">{match.title}</h2>
                      </Link>
                      <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{match.note}</p>
                    </div>

                    <div className="flex w-full flex-col gap-2 sm:flex-row xl:w-auto">
                      <Link
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10 xl:w-auto"
                        to={`/matches/${match.id}`}
                      >
                        <Eye className="h-5 w-5" />
                        Xem chi tiết
                      </Link>

                      {match.status === 'payment' && (
                        <button
                          aria-label={`Thanh toán trận ${match.title}`}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90 xl:w-auto"
                          onClick={() => handlePay(match.id)}
                          type="button"
                        >
                          <CreditCard className="h-5 w-5" />
                          Thanh toán
                        </button>
                      )}

                      {match.status === 'waiting' && match.role === 'host' && (
                        <button
                          className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-on-surface hover:bg-surface-container-low xl:w-auto"
                          onClick={() => void handleCancel(match.id)}
                          type="button"
                        >
                          <XCircle className="h-5 w-5" />
                          Hủy
                        </button>
                      )}

                      {match.status === 'cancelled' && match.role === 'host' && (
                        <button
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90 xl:w-auto"
                          onClick={() => void handleReopen(match.id)}
                          type="button"
                        >
                          <RotateCcw className="h-5 w-5" />
                          Tạo lại
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-lg bg-surface-container-low p-3">
                      <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                        <CalendarClock className="h-4 w-4 text-primary" />
                        Lịch chơi
                      </p>
                      <p className="mt-1 text-[14px] font-bold">
                        {match.startTime} - {match.endTime} · {formatDate(match.date)}
                      </p>
                    </div>

                    <div className="rounded-lg bg-surface-container-low p-3">
                      <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                        <MapPin className="h-4 w-4 text-primary" />
                        Sân
                      </p>
                      <p className="mt-1 text-[14px] font-bold">
                        {match.courtCluster} - {match.subCourt}
                      </p>
                    </div>

                    <div className="rounded-lg bg-surface-container-low p-3">
                      <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                        <Users className="h-4 w-4 text-primary" />
                        Người chơi
                      </p>
                      <p className="mt-1 text-[14px] font-bold">
                        {match.joined}/{match.needed} người {availableSlots > 0 ? `· còn ${availableSlots}` : ''}
                      </p>
                    </div>

                    <div className="rounded-lg bg-surface-container-low p-3">
                      <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                        <CreditCard className="h-4 w-4 text-primary" />
                        Phần của bạn
                      </p>
                      <p className="mt-1 text-[14px] font-bold">{formatCurrency(perPlayerPrice)}</p>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredMatches.length === 0 && (
              <div className="rounded-xl border border-outline-variant bg-white p-8 text-center shadow-sm">
                <Users className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-3 text-[20px] font-bold">Chưa có trận nào trong trạng thái này</h2>
                <p className="mt-2 text-[14px] text-on-surface-variant">Bạn có thể tạo lời mời mới hoặc tham gia một trận đang chờ.</p>
                <Link
                  className="mt-5 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                  to="/opponents"
                >
                  <PlusCircle className="h-5 w-5" />
                  Tạo lời mời
                </Link>
              </div>
            )}
            <PaginationControls page={pagination} onPageChange={setPage} />
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border border-primary bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <AlertCircle className="h-5 w-5 text-primary" />
              Việc cần làm
            </h2>

            <div className="mt-4 space-y-3">
              {paymentMatches.length > 0 ? (
                paymentMatches.map((match) => (
                  <div className="rounded-lg border border-outline-variant p-4" key={match.id}>
                    <p className="text-[14px] font-bold">{match.title}</p>
                    <p className="mt-1 text-[13px] text-on-surface-variant">Cần thanh toán {formatCurrency(Math.ceil(match.totalPrice / match.needed))}</p>
                    <button
                      aria-label={`Thanh toán ngay ${match.title}`}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white hover:bg-primary/90"
                      onClick={() => handlePay(match.id)}
                      type="button"
                    >
                      <CreditCard className="h-4 w-4" />
                      Thanh toán ngay
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-[#eaf7df] p-4 text-[14px] font-bold text-primary">Không có khoản thanh toán đang chờ.</div>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <Clock className="h-5 w-5 text-primary" />
              Trận gần nhất
            </h2>

            {nextMatch ? (
              <div className="mt-4 rounded-lg bg-surface-container-low p-4">
                <p className="text-[15px] font-bold">{nextMatch.title}</p>
                <p className="mt-2 text-[13px] font-medium text-on-surface-variant">
                  {nextMatch.startTime} - {nextMatch.endTime}, {formatDate(nextMatch.date)}
                </p>
                <p className="mt-2 text-[13px] font-medium text-on-surface-variant">
                  {nextMatch.courtCluster} - {nextMatch.subCourt}
                </p>
                <Link
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-2 text-[13px] font-bold text-primary hover:bg-primary/10"
                  to={`/matches/${nextMatch.id}`}
                >
                  <Eye className="h-4 w-4" />
                  Xem chi tiết
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-[14px] text-on-surface-variant">Bạn chưa có trận sắp diễn ra.</p>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Gợi ý luồng tiếp theo
            </h2>
            <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">
              Sau khi màn này ổn, phần backend nên trả về danh sách trận theo tài khoản, trạng thái thanh toán của từng người và quyền hủy trận theo thời hạn giữ sân.
            </p>
          </section>
        </aside>
      </main>
    </div>
  );
};
