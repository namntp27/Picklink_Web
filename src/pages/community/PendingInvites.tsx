import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarRange, Clock, Eye, Filter, MapPin, RotateCcw, ShieldCheck, Trophy, UserPlus, Users } from 'lucide-react';
import { getOpenMatches, type MatchFormat, type MatchSummary } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { PaginationControls } from '../../components/PaginationControls';

type Filters = {
  owner: 'all' | 'mine' | 'other';
  format: 'all' | MatchFormat;
  skill: string;
  province: string;
  ward: string;
  date: string;
};

const defaults: Filters = { owner: 'all', format: 'all', skill: 'all', province: '', ward: '', date: '' };
const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(`${value}T00:00:00`));

export const PendingInvites = () => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [filters, setFilters] = useState<Filters>(defaults);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const result = await getOpenMatches(token ?? undefined, {
        page,
        pageSize: 10,
        matchType: filters.format === 'all' ? undefined : filters.format,
        skillLevel: filters.skill === 'all' ? undefined : Number(filters.skill),
        from: filters.date || undefined,
        to: filters.date || undefined,
        province: filters.province || undefined,
        ward: filters.ward || undefined,
      });
      setMatches(result.items);
      setPagination(result);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách lời mời.');
    }
  };

  useEffect(() => { void load(); }, [page, token, filters.format, filters.skill, filters.province, filters.ward, filters.date]);
  useMatchRealtime(() => { void load(); });

  const visibleMatches = useMemo(
    () => matches.filter((match) =>
      filters.owner === 'all' || (filters.owner === 'mine' ? match.isHost : !match.isHost)),
    [filters.owner, matches],
  );
  const remainingSlots = visibleMatches.reduce((sum, match) => sum + match.availableSlotCount, 0);
  const update = (key: keyof Filters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }) as Filters);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-9 md:px-margin-desktop">
          <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-white/85" to="/opponents">
            <ArrowLeft className="h-4 w-4" /> Quay lại tạo lời mời
          </Link>
          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold"><Users className="h-4 w-4" /> Danh sách ghép trận</span>
              <h1 className="mt-4 text-[34px] font-bold md:text-[44px]">Lời mời đang tuyển người</h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/85">
                Tìm phòng phù hợp với khu vực, khoảng ngày và trình độ của bạn. Yêu cầu tham gia cần được chủ phòng duyệt.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-3 text-[14px] font-bold text-primary" to="/opponents"><UserPlus className="h-5 w-5" /> Tạo lời mời</Link>
                <Link className="inline-flex items-center gap-2 rounded-lg border border-white/40 px-4 py-3 text-[14px] font-bold" to="/my-matches"><Trophy className="h-5 w-5" /> Phòng của tôi</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-white/20 bg-white/10 p-5">
              <div><p className="text-[30px] font-bold">{pagination.totalCount}</p><p className="text-[13px] text-white/75">lời mời</p></div>
              <div><p className="text-[30px] font-bold">{remainingSlots}</p><p className="text-[13px] text-white/75">chỗ trống trên trang</p></div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] space-y-6 px-4 py-8 md:px-margin-desktop">
        <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div><h2 className="flex items-center gap-2 text-[21px] font-bold"><Filter className="h-5 w-5 text-primary" /> Bộ lọc</h2><p className="mt-1 text-[13px] text-on-surface-variant">Lọc theo hình thức, trình độ, khu vực và ngày có thể chơi.</p></div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-bold" onClick={() => { setFilters(defaults); setPage(1); }} type="button"><RotateCcw className="h-4 w-4" /> Xóa lọc</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
            <select className="h-11 rounded-lg border border-outline-variant px-3 text-[14px]" onChange={(event) => update('owner', event.target.value)} value={filters.owner}>
              <option value="all">Tất cả lời mời</option><option value="other">Của người khác</option><option value="mine">Của tôi</option>
            </select>
            <select className="h-11 rounded-lg border border-outline-variant px-3 text-[14px]" onChange={(event) => update('format', event.target.value)} value={filters.format}>
              <option value="all">Mọi hình thức</option><option value="1vs1">1vs1</option><option value="2vs2">2vs2</option>
            </select>
            <select className="h-11 rounded-lg border border-outline-variant px-3 text-[14px]" onChange={(event) => update('skill', event.target.value)} value={filters.skill}>
              <option value="all">Mọi trình độ</option>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Level {value}</option>)}
            </select>
            <input className="h-11 rounded-lg border border-outline-variant px-3 text-[14px]" onChange={(event) => update('province', event.target.value)} placeholder="Tỉnh/thành" value={filters.province} />
            <input className="h-11 rounded-lg border border-outline-variant px-3 text-[14px]" onChange={(event) => update('ward', event.target.value)} placeholder="Xã/phường" value={filters.ward} />
            <input className="h-11 rounded-lg border border-outline-variant px-3 text-[14px]" onChange={(event) => update('date', event.target.value)} type="date" value={filters.date} />
          </div>
        </section>

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] font-bold text-red-700">{error}</div>}

        <section className="space-y-4">
          {visibleMatches.map((match) => (
            <article className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm transition hover:border-primary" key={match.matchId}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">{match.matchType}</span>
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold">Level {match.minSkillLevel}–{match.maxSkillLevel}</span>
                    {match.isHost && <span className="rounded-full bg-amber-100 px-3 py-1 text-[12px] font-bold text-amber-800">Của tôi</span>}
                  </div>
                  <Link to={`/matches/${match.matchId}`}><h2 className="mt-3 text-[22px] font-bold hover:text-primary">{match.title}</h2></Link>
                  <p className="mt-1 text-[13px] font-bold text-on-surface-variant">Chủ phòng: {match.isHost ? 'Bạn' : match.hostName}</p>
                  <p className="mt-3 max-w-3xl text-[14px] leading-6 text-on-surface-variant">{match.note || 'Chủ phòng chưa thêm mô tả.'}</p>
                </div>
                <Link className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10" to={`/matches/${match.matchId}`}>
                  {match.isHost ? <ShieldCheck className="h-5 w-5" /> : <Eye className="h-5 w-5" />} {match.isHost ? 'Quản lý' : 'Xem chi tiết'}
                </Link>
              </div>

              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg bg-surface-container-low p-3"><p className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant"><MapPin className="h-4 w-4 text-primary" /> Khu vực</p><p className="mt-1 text-[14px] font-bold">{match.ward}, {match.province}</p><p className="mt-1 text-[12px] text-on-surface-variant">Bán kính {match.searchRadiusKm} km</p></div>
                <div className="rounded-lg bg-surface-container-low p-3"><p className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant"><CalendarRange className="h-4 w-4 text-primary" /> Khoảng ngày</p><p className="mt-1 text-[14px] font-bold">{dateLabel(match.availableDateFrom)} – {dateLabel(match.availableDateTo)}</p></div>
                <div className="rounded-lg bg-surface-container-low p-3"><p className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant"><Clock className="h-4 w-4 text-primary" /> Giờ mong muốn</p><p className="mt-1 text-[14px] font-bold">{match.preferredTimeStart} – {match.preferredTimeEnd}</p></div>
                <div className="rounded-lg bg-surface-container-low p-3"><p className="flex items-center gap-2 text-[12px] font-bold text-on-surface-variant"><Users className="h-4 w-4 text-primary" /> Thành viên</p><p className="mt-1 text-[14px] font-bold">{match.acceptedPlayerCount}/{match.requiredPlayerCount} người · còn {match.availableSlotCount}</p></div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {match.preferredVenues.map((venue) => <span className="rounded-full border border-outline-variant px-3 py-1 text-[12px] font-bold" key={venue.venueId}>{venue.venueName}</span>)}
              </div>
            </article>
          ))}

          {visibleMatches.length === 0 && (
            <div className="rounded-xl border border-dashed border-outline-variant bg-white p-10 text-center">
              <h3 className="text-[19px] font-bold">Chưa có lời mời phù hợp</h3>
              <p className="mt-2 text-[14px] text-on-surface-variant">Thử nới bộ lọc hoặc tự tạo một lời mời mới.</p>
            </div>
          )}
          <PaginationControls page={pagination} onPageChange={setPage} />
        </section>
      </main>
    </div>
  );
};
