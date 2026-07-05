import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  CalendarDays,
  Filter,
  MapPin,
  Search,
  ShieldCheck,
  Trophy,
  Users,
} from 'lucide-react';
import {
  formatTournamentCurrency,
  formatTournamentDate,
  getTournamentStatusLabel,
  listTournaments,
  type TournamentStatus,
  type TournamentSummary,
} from '../../api/tournaments';

type StatusFilter = 'all' | Extract<TournamentStatus, 'open' | 'closed' | 'inProgress' | 'completed'>;

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Đang mở đăng ký', value: 'open' },
  { label: 'Đã khóa đăng ký', value: 'closed' },
  { label: 'Đang thi đấu', value: 'inProgress' },
  { label: 'Đã kết thúc', value: 'completed' },
];

const getStatusClassName = (status: TournamentStatus) => {
  if (status === 'open') return 'bg-primary text-white';
  if (status === 'inProgress') return 'bg-[#d9e7ff] text-[#00458f]';
  if (status === 'closed') return 'bg-[#fff4d8] text-[#7a5600]';
  return 'bg-[#eef0ef] text-[#57615b]';
};

const TournamentCard = ({ tournament }: { tournament: TournamentSummary }) => {
  const progress = tournament.capacity
    ? Math.round((tournament.registeredCount / tournament.capacity) * 100)
    : 0;

  return (
    <article className="picklink-glow-surface flex overflow-hidden rounded-2xl border border-[#d8e4d4] bg-white shadow-[0_12px_30px_rgba(8,29,36,0.055)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1">
      <div className="flex min-w-0 flex-1 flex-col">
        <Link className="relative block h-52 overflow-hidden" to={`/tournaments/${tournament.slug}`}>
          <img
            alt={tournament.name}
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            src={tournament.imageUrl || 'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1200&auto=format&fit=crop'}
          />
          <span className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[12px] font-bold ${getStatusClassName(tournament.status)}`}>
            {getTournamentStatusLabel(tournament.status)}
          </span>
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <Link to={`/tournaments/${tournament.slug}`}>
            <h2 className="text-[21px] font-bold leading-7 text-on-surface hover:text-primary">{tournament.name}</h2>
          </Link>
          <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-on-surface-variant">
            {tournament.description || 'Thông tin chi tiết sẽ được ban tổ chức cập nhật.'}
          </p>

          <div className="mt-4 space-y-2">
            <p className="flex items-center gap-2 text-[14px] font-medium text-on-surface-variant">
              <CalendarDays className="h-4 w-4 text-primary" />
              {formatTournamentDate(tournament.startDate)} - {formatTournamentDate(tournament.endDate)}
            </p>
            <p className="flex items-center gap-2 text-[14px] font-medium text-on-surface-variant">
              <MapPin className="h-4 w-4 text-primary" />
              {tournament.venueName}, {tournament.city}
            </p>
            <p className="flex items-center gap-2 text-[14px] font-medium text-on-surface-variant">
              <Users className="h-4 w-4 text-primary" />
              {tournament.registeredCount}/{tournament.capacity} đội đã đăng ký
            </p>
            <p className="flex items-center gap-2 text-[14px] font-bold text-primary">
              <Banknote className="h-4 w-4" />
              {formatTournamentCurrency(tournament.entryFee)}
            </p>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[12px] font-bold text-on-surface-variant">
              <span>Tỷ lệ đăng ký</span>
              <span>{progress}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-surface-container-low">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <Link className="inline-flex items-center justify-center rounded-lg border border-outline-variant px-3 py-3 text-[14px] font-bold text-on-surface hover:bg-surface-container-low" to={`/tournaments/${tournament.slug}`}>
              Xem chi tiết
            </Link>
            <Link
              className={`inline-flex items-center justify-center rounded-lg px-3 py-3 text-[14px] font-bold ${
                tournament.status === 'open'
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-surface-container-low text-on-surface-variant'
              }`}
              to={`/tournaments/${tournament.slug}`}
            >
              {tournament.status === 'open' ? 'Đăng ký' : 'Theo dõi'}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

export const Tournaments = () => {
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    listTournaments({ pageSize: 100 })
      .then((response) => {
        if (active) setTournaments(response.items);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const cities = useMemo(
    () => ['all', ...Array.from(new Set(tournaments.map((tournament) => tournament.city)))],
    [tournaments],
  );
  const filteredTournaments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return tournaments.filter((tournament) => {
      const matchesKeyword =
        !keyword ||
        tournament.name.toLowerCase().includes(keyword) ||
        tournament.venueName.toLowerCase().includes(keyword) ||
        tournament.city.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || tournament.status === statusFilter;
      const matchesCity = cityFilter === 'all' || tournament.city === cityFilter;
      return matchesKeyword && matchesStatus && matchesCity;
    });
  }, [cityFilter, searchTerm, statusFilter, tournaments]);

  return (
    <div className="flex min-h-dvh flex-col bg-background text-on-background">
      <div className="h-[72px] w-full bg-primary" />

      <section className="relative overflow-hidden bg-[#081d24]">
        <img alt="Giải đấu Pickleball" className="absolute inset-0 h-full w-full object-cover opacity-38" src="https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1800&auto=format&fit=crop" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#081d24] via-[#081d24]/82 to-primary/60" />
        <div className="relative z-10 mx-auto max-w-container-max-width px-gutter py-20 text-white">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold backdrop-blur">
              <Trophy className="h-4 w-4" />
              Lịch thi đấu Picklink
            </p>
            <h1 className="mt-5 text-[38px] font-bold leading-tight md:text-[56px]">Giải đấu Pickleball</h1>
            <p className="mt-4 max-w-2xl text-[17px] leading-7 text-white/88">
              Xem điều lệ, đăng ký đúng hạng mục, thanh toán lệ phí và theo dõi kết quả trên một luồng thống nhất.
            </p>
            <Link className="mt-7 inline-flex items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-[15px] font-bold text-primary shadow-lg hover:bg-white/92" to="/my-tournaments">
              <ShieldCheck className="h-5 w-5" />
              Giải của tôi
            </Link>
          </div>
        </div>
      </section>

      <section className="sticky top-[72px] z-40 border-b border-outline-variant bg-white/95 py-4 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-container-max-width flex-col gap-4 px-gutter xl:flex-row xl:items-end xl:justify-between">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="block">
              <span className="text-[12px] font-bold uppercase text-on-surface-variant">Tìm kiếm</span>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                <input className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-9 pr-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 md:w-[260px]" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tên giải, sân, khu vực..." value={searchTerm} />
              </div>
            </label>
            <label className="block">
              <span className="text-[12px] font-bold uppercase text-on-surface-variant">Khu vực</span>
              <select className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary md:w-[180px]" onChange={(event) => setCityFilter(event.target.value)} value={cityFilter}>
                {cities.map((city) => <option key={city} value={city}>{city === 'all' ? 'Tất cả khu vực' : city}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[12px] font-bold uppercase text-on-surface-variant">Trạng thái</span>
              <select className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary md:w-[190px]" onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} value={statusFilter}>
                {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-4 py-3 text-[14px] font-bold text-on-surface-variant">
            <Filter className="h-4 w-4" />
            Đang hiển thị {filteredTournaments.length} giải đấu
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-container-max-width flex-1 px-gutter py-8">
        {error && <div className="mb-5 rounded-lg border border-error/30 bg-error-container p-4 text-sm text-on-error-container">{error}</div>}
        {isLoading ? (
          <div className="rounded-xl border border-outline-variant bg-white p-10 text-center text-on-surface-variant">Đang tải danh sách giải đấu...</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredTournaments.map((tournament) => <TournamentCard key={tournament.tournamentId} tournament={tournament} />)}
          </div>
        )}

        {!isLoading && filteredTournaments.length === 0 && (
          <div className="rounded-xl border border-outline-variant bg-white p-10 text-center shadow-sm">
            <Trophy className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-[22px] font-bold">Không tìm thấy giải đấu</h2>
            <p className="mt-2 text-[14px] text-on-surface-variant">Thử đổi bộ lọc hoặc tìm bằng từ khóa khác.</p>
          </div>
        )}
      </main>
    </div>
  );
};
