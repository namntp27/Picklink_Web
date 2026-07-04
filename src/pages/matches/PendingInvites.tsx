import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarRange,
  Clock,
  Eye,
  Filter,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { getOpenMatches, type MatchFormat, type MatchSummary } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { PaginationControls } from '../../components/PaginationControls';
import { CommunityEmptyState, CommunityHero, CommunityPage } from '../community/CommunityUI';

type Filters = {
  owner: 'all' | 'mine' | 'other';
  format: 'all' | MatchFormat;
  skill: string;
  province: string;
  ward: string;
  date: string;
};

const defaults: Filters = {
  owner: 'all',
  format: 'all',
  skill: 'all',
  province: '',
  ward: '',
  date: '',
};

const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}).format(new Date(`${value}T00:00:00`));

export const PendingInvites = () => {
  const { token } = useAuth();
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [filters, setFilters] = useState<Filters>(defaults);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedProvince, setDebouncedProvince] = useState(filters.province);
  const [debouncedWard, setDebouncedWard] = useState(filters.ward);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      setDebouncedProvince(filters.province.trim());
      setDebouncedWard(filters.ward.trim());
    }, 350);

    return () => window.clearTimeout(timerId);
  }, [filters.province, filters.ward]);

  const load = useCallback(async (options?: { silent?: boolean }) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (!options?.silent) setIsLoading(true);
    try {
      const result = await getOpenMatches(token ?? undefined, {
        page,
        pageSize: 10,
        matchType: filters.format === 'all' ? undefined : filters.format,
        skillLevel: filters.skill === 'all' ? undefined : Number(filters.skill),
        from: filters.date || undefined,
        to: filters.date || undefined,
        province: debouncedProvince || undefined,
        ward: debouncedWard || undefined,
      }, { signal: controller.signal });

      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setMatches(result.items);
      setPagination(result);
      setError('');
    } catch (reason) {
      if (controller.signal.aborted || requestId !== requestIdRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách lời mời.');
    } finally {
      if (requestId === requestIdRef.current) {
        setIsLoading(false);
        if (abortRef.current === controller) abortRef.current = null;
      }
    }
  }, [debouncedProvince, debouncedWard, filters.date, filters.format, filters.skill, page, token]);

  useEffect(() => {
    void load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  useMatchRealtime(() => {
    void load({ silent: true });
  });

  const visibleMatches = useMemo(
    () => matches.filter((match) => (
      filters.owner === 'all' || (filters.owner === 'mine' ? match.isHost : !match.isHost)
    )),
    [filters.owner, matches],
  );
  const remainingSlots = visibleMatches.reduce((sum, match) => sum + match.availableSlotCount, 0);

  const update = (key: keyof Filters, value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }) as Filters);
  };

  return (
    <CommunityPage>
      <CommunityHero
        actions={(
          <>
            <Link className="community-button" to="/opponents/create">
              <UserPlus aria-hidden="true" className="h-4 w-4" />
              Tạo lời mời
            </Link>
            <Link className="community-button-secondary" to="/my-matches">
              <Trophy aria-hidden="true" className="h-4 w-4" />
              Phòng của tôi
            </Link>
          </>
        )}
        description="Lọc theo khu vực, thời gian và trình độ để tìm phòng phù hợp."
        icon={Users}
        label="Ghép trận cộng đồng"
        stats={(
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="font-mono text-[28px] font-extrabold text-[#e2ff57]">{pagination.totalCount}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/65">lời mời đang mở</p>
            </div>
            <div>
              <p className="font-mono text-[28px] font-extrabold text-[#e2ff57]">{remainingSlots}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/65">chỗ trống trên trang</p>
            </div>
          </div>
        )}
        title="Tìm đội hình phù hợp"
      />

      <main className="community-container space-y-5">
        <section className="community-panel sticky top-[72px] z-20 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-[#0b2228]">
                <Filter aria-hidden="true" className="h-[18px] w-[18px] text-[#477313]" />
                Bộ lọc trận
              </h2>
              <p className="mt-1 hidden text-[11px] font-semibold text-[#718077] sm:block">
                {isLoading ? 'Đang cập nhật kết quả...' : 'Kết quả cập nhật theo điều kiện đã chọn.'}
              </p>
            </div>
            <button
              className="community-button-quiet !min-h-9"
              onClick={() => {
                setFilters(defaults);
                setPage(1);
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" className="h-4 w-4" />
              Xóa lọc
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <select className="community-control" onChange={(event) => update('owner', event.target.value)} value={filters.owner}>
              <option value="all">Tất cả lời mời</option>
              <option value="other">Của người khác</option>
              <option value="mine">Của tôi</option>
            </select>
            <select className="community-control" onChange={(event) => update('format', event.target.value)} value={filters.format}>
              <option value="all">Mọi hình thức</option>
              <option value="1vs1">1vs1</option>
              <option value="2vs2">2vs2</option>
            </select>
            <select className="community-control" onChange={(event) => update('skill', event.target.value)} value={filters.skill}>
              <option value="all">Mọi trình độ</option>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Level {value}</option>)}
            </select>
            <input className="community-control" onChange={(event) => update('province', event.target.value)} placeholder="Tỉnh/thành" value={filters.province} />
            <input className="community-control" onChange={(event) => update('ward', event.target.value)} placeholder="Xã/phường" value={filters.ward} />
            <input aria-label="Ngày có thể chơi" className="community-control" onChange={(event) => update('date', event.target.value)} type="date" value={filters.date} />
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[12px] font-bold text-red-700" role="alert">
            {error}
          </div>
        )}

        <section className="grid gap-3">
          {visibleMatches.map((match) => (
            <article className="community-card p-4 sm:p-5" key={match.matchId}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="community-badge">{match.matchType}</span>
                    <span className="community-badge text-[#526158]">Level {match.minSkillLevel}-{match.maxSkillLevel}</span>
                    {match.isHost && <span className="community-badge !bg-[#fff4d8] !text-[#8a5b00]">Của tôi</span>}
                  </div>
                  <Link className="mt-3 block" to={`/matches/${match.matchId}`}>
                    <h2 className="text-[18px] font-extrabold leading-6 tracking-[-0.015em] text-[#0b2228] transition-colors hover:text-[#477313]">
                      {match.title}
                    </h2>
                  </Link>
                  <p className="mt-1 text-[11px] font-bold text-[#718077]">Chủ phòng: {match.isHost ? 'Bạn' : match.hostName}</p>
                  <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#526158]">{match.note || 'Chủ phòng chưa thêm mô tả.'}</p>
                </div>
                <Link className="community-button-secondary shrink-0" to={`/matches/${match.matchId}`}>
                  {match.isHost ? <ShieldCheck aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                  {match.isHost ? 'Quản lý' : 'Xem chi tiết'}
                </Link>
              </div>

              <div className="mt-4 grid gap-px overflow-hidden rounded-xl border border-[#d8e4d4] bg-[#d8e4d4] sm:grid-cols-2 xl:grid-cols-4">
                <div className="bg-[#f7faf5] p-3">
                  <p className="flex items-center gap-2 text-[11px] font-bold text-[#718077]"><MapPin className="h-3.5 w-3.5 text-[#477313]" />Khu vực</p>
                  <p className="mt-1 text-[13px] font-extrabold">{match.ward}, {match.province}</p>
                  <p className="mt-0.5 text-[11px] text-[#718077]">Bán kính {match.searchRadiusKm} km</p>
                </div>
                <div className="bg-[#f7faf5] p-3">
                  <p className="flex items-center gap-2 text-[11px] font-bold text-[#718077]"><CalendarRange className="h-3.5 w-3.5 text-[#477313]" />Khoảng ngày</p>
                  <p className="mt-1 text-[13px] font-extrabold">{dateLabel(match.availableDateFrom)} - {dateLabel(match.availableDateTo)}</p>
                </div>
                <div className="bg-[#f7faf5] p-3">
                  <p className="flex items-center gap-2 text-[11px] font-bold text-[#718077]"><Clock className="h-3.5 w-3.5 text-[#477313]" />Giờ mong muốn</p>
                  <p className="mt-1 text-[13px] font-extrabold">{match.preferredTimeStart} - {match.preferredTimeEnd}</p>
                </div>
                <div className="bg-[#f7faf5] p-3">
                  <p className="flex items-center gap-2 text-[11px] font-bold text-[#718077]"><Users className="h-3.5 w-3.5 text-[#477313]" />Thành viên</p>
                  <p className="mt-1 text-[13px] font-extrabold">{match.acceptedPlayerCount}/{match.requiredPlayerCount} người, còn {match.availableSlotCount}</p>
                </div>
              </div>

              {match.preferredVenues.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {match.preferredVenues.map((venue) => (
                    <span className="community-badge text-[#526158]" key={venue.venueId}>{venue.venueName}</span>
                  ))}
                </div>
              )}
            </article>
          ))}

          {visibleMatches.length === 0 && (
            <CommunityEmptyState
              action={<Link className="community-button" to="/opponents/create">Tạo lời mời</Link>}
              description="Thử nới bộ lọc hoặc tự tạo một lời mời mới."
              icon={Users}
              title="Chưa có lời mời phù hợp"
            />
          )}
          <PaginationControls page={pagination} onPageChange={setPage} />
        </section>
      </main>
    </CommunityPage>
  );
};
