import { lazy, Suspense, useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  ChevronRight,
  Clock,
  Eye,
  Filter,
  MapPin,
  RotateCcw,
  Route,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  Play,
  LogOut,
  MessageSquare,
  Plus,
  Settings,
} from 'lucide-react';
import { getOpenMatches, searchMatchVenues, type MatchFormat, type MatchPreferredVenue, type MatchSummary } from '../../api/matches';
import { getPublicQueues, joinPublicQueue, cancelQueue, type QueueStatusResponse } from '../../api/matchmaking';
import { useAuth } from '../../auth/AuthContext';
import { formatQueueSlots } from '../../utils/queueSlotFormatter';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { PaginationControls } from '../../components/PaginationControls';
import { CommunityEmptyState, CommunityHero, CommunityPage } from '../community/CommunityUI';
import { PlayerProfileDialog } from './components/PlayerProfileDialog';
import { AdministrativeAreaSelects } from '../../components/location/AdministrativeAreaSelects';

const MatchVenueMapDialog = lazy(async () => {
  const module = await import('./components/MatchVenueMapDialog');
  return { default: module.MatchVenueMapDialog };
});

type Filters = {
  owner: 'mine' | 'other';
  format: 'all' | MatchFormat;
  skill: string;
  province: string;
  ward: string;
  date: string;
};

const defaults: Filters = {
  owner: 'other',
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

const timeLabel = (value: string) => value.slice(0, 5);

const availabilitySlotsFor = (match: MatchSummary) => match.availabilitySlots?.length
  ? match.availabilitySlots
  : [{
    matchAvailabilitySlotId: -match.matchId,
    timeStart: match.preferredTimeStart,
    timeEnd: match.preferredTimeEnd,
  }];

const queueVenueIds = (sharedVenues?: string | null) => sharedVenues?.split(',').map(Number).filter(Number.isInteger) ?? [];

const queueDateRange = (queue: QueueStatusResponse) => {
  const dates = queue.queueSlots.flatMap((slot) => slot.specificDate ? [slot.specificDate] : []).sort();
  if (!dates.length) return queue.replayType === 'Daily' ? 'Hàng ngày' : queue.replayType;
  return dateLabel(dates[0]) + ' - ' + dateLabel(dates[dates.length - 1]);
};


const skillLevelName = (level?: number) => ({ 1: 'Mới chơi', 2: 'Cơ bản', 3: 'Trung bình', 4: 'Khá', 5: 'Nâng cao' }[level ?? 1] ?? 'Mới chơi');
export const PendingInvites = () => {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'manual' | 'queue'>('manual');
  const [queues, setQueues] = useState<QueueStatusResponse[]>([]);
  const [queuesLoading, setQueuesLoading] = useState(false);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [selectedHost, setSelectedHost] = useState<Pick<
    MatchSummary,
    'hostPlayerId' | 'hostName' | 'hostAvatarUrl'
  > | null>(null);
  const [mappedMatch, setMappedMatch] = useState<Pick<
    MatchSummary,
    'title' | 'preferredVenues'
  > | null>(null);
  const [queueVenues, setQueueVenues] = useState<Record<number, MatchPreferredVenue[]>>({});
  const [mappedQueue, setMappedQueue] = useState<QueueStatusResponse | null>(null);
  const [filters, setFilters] = useState<Filters>(defaults);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 10, totalCount: 0, totalPages: 1 });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [debouncedProvince, setDebouncedProvince] = useState(filters.province);
  const [debouncedWard, setDebouncedWard] = useState(filters.ward);
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  const loadQueues = useCallback(async () => {
    setQueuesLoading(true);
    try {
      const res = await getPublicQueues(token);
      setQueues(res);
      setError('');
    } catch (err) {
      console.error('Failed to load public queues', err);
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách hàng chờ.');
    } finally {
      setQueuesLoading(false);
    }
  }, [token]);

  useEffect(() => {
    let disposed = false;
    void (async () => {
      const resolved: Record<number, MatchPreferredVenue[]> = {};
      await Promise.all(queues.map(async (queue) => {
        const queueId = queue.matchmakingQueueId;
        const venueIds = queueVenueIds(queue.sharedVenues);
        if (queueId == null || venueIds.length === 0) return;
        try {
          const venues = await searchMatchVenues({
            radiusKm: 10,
            latitude: queue.searchLatitude ?? undefined,
            longitude: queue.searchLongitude ?? undefined,
            province: queue.province ?? undefined,
            ward: queue.ward ?? undefined,
          });
          resolved[queueId] = venueIds.flatMap((venueId) => venues.filter((venue) => venue.venueId === venueId));
        } catch {
          resolved[queueId] = [];
        }
      }));
      if (!disposed) setQueueVenues(resolved);
    })();
    return () => {
      disposed = true;
    };
  }, [queues]);

  const handleJoinQueue = async (queueId: number) => {
    if (!token) {
      navigate('/login');
      return;
    }
    try {
      await joinPublicQueue(token, queueId);
      void loadQueues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tham gia hàng chờ.');
    }
  };

  const handleLeaveQueue = async () => {
    if (!token) return;
    if (!window.confirm('Bạn có chắc chắn muốn rời hàng chờ ghép trận này?')) return;
    try {
      await cancelQueue(token);
      void loadQueues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể rời hàng chờ.');
    }
  };

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
        owner: filters.owner,
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
  }, [debouncedProvince, debouncedWard, filters.date, filters.format, filters.owner, filters.skill, page, token]);

  useEffect(() => {
    if (activeTab === 'manual') {
      void load();
    } else {
      void loadQueues();
    }
    return () => {
      abortRef.current?.abort();
    };
  }, [load, loadQueues, activeTab]);

  useMatchRealtime(() => {
    void load({ silent: true });
  });

  const visibleMatches = matches;
  
  const filteredQueues = useMemo(() => {
    return queues.filter((q) => {
      if (!q.isPublic) return false;
      if (filters.format !== 'all' && q.matchType !== filters.format) return false;
      if (filters.province && q.province !== filters.province) return false;
      if (filters.ward && q.ward !== filters.ward) return false;
      
      const isMine = q.queuePlayers.some((p) => String(p.playerId) === user?.id && p.status !== 'Pending' && p.status !== 'Rejected');
      if (filters.owner === 'mine' && !isMine) return false;
      if (filters.owner === 'other' && isMine) return false;
      return true;
    });
  }, [queues, filters.format, filters.province, filters.ward, filters.owner, user?.id]);

  const remainingSlots = useMemo(() => {
    if (activeTab === 'manual') {
      return visibleMatches.reduce((sum, match) => sum + match.availableSlotCount, 0);
    }
    return filteredQueues.reduce((sum, q) => {
      const maxCap = q.playerCount ?? (q.matchType === '1vs1' ? 2 : 4);
      return sum + Math.max(0, maxCap - q.queuePlayers.filter((p) => p.status !== 'Pending' && p.status !== 'Rejected').length);
    }, 0);
  }, [activeTab, visibleMatches, filteredQueues]);

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
              <p className="font-mono text-[28px] font-extrabold text-[#e2ff57]">
                {activeTab === 'manual' ? pagination.totalCount : filteredQueues.length}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-white/65">
                {activeTab === 'manual' ? 'lời mời đang mở' : 'hàng chờ công khai'}
              </p>
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
        <section className="community-panel p-4 lg:sticky lg:top-[72px] lg:z-20">
          <div className="mb-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="flex items-center gap-2 text-[16px] font-extrabold text-[#0b2228]">
                <Filter aria-hidden="true" className="h-[18px] w-[18px] text-[#477313]" />
                Bộ lọc trận
              </h2>
              <p className="mt-1 hidden text-[11px] font-semibold text-[#718077] sm:block">
                {activeTab === 'manual'
                  ? (isLoading ? 'Đang cập nhật kết quả...' : 'Kết quả cập nhật theo điều kiện đã chọn.')
                  : (queuesLoading ? 'Đang cập nhật hàng chờ...' : 'Đang hiển thị hàng chờ ghép cặp công khai.')}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex gap-2 items-center flex-wrap">
              <div className="flex gap-1 bg-[#edf2ea] p-1 rounded-lg shrink-0">
                <button
                  aria-pressed={activeTab === 'manual'}
                  type="button"
                  onClick={() => {
                    setActiveTab('manual');
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded text-[11px] font-extrabold transition-colors ${
                    activeTab === 'manual' ? 'bg-[#0b2228] text-white shadow-sm' : 'text-[#718077] hover:text-[#0b2228]'
                  }`}
                >
                  Lời mời giao lưu
                </button>
                <button
                  aria-pressed={activeTab === 'queue'}
                  type="button"
                  onClick={() => {
                    setActiveTab('queue');
                    setPage(1);
                  }}
                  className={`px-3 py-1 rounded text-[11px] font-extrabold transition-colors ${
                    activeTab === 'queue' ? 'bg-[#0b2228] text-white shadow-sm' : 'text-[#718077] hover:text-[#0b2228]'
                  }`}
                >
                  Lời mời thủ công
                </button>
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
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <select aria-label="Người tạo lời mời" className="community-control" onChange={(event) => update('owner', event.target.value)} value={filters.owner}>
              <option value="other">Của người khác</option>
              <option value="mine">Của tôi</option>
            </select>
            <AdministrativeAreaSelects
              fieldClassName="min-w-0"
              labelClassName="sr-only"
              onProvinceChange={(value) => {
                update('province', value ?? '');
                update('ward', '');
              }}
              onWardChange={(value) => update('ward', value ?? '')}
              province={filters.province}
              selectClassName="community-control"
              ward={filters.ward}
            />
            <input aria-label="Ngày có thể chơi" className="community-control" onChange={(event) => update('date', event.target.value)} type="date" value={filters.date} />
            <select aria-label="Hình thức thi đấu" className="community-control" onChange={(event) => update('format', event.target.value)} value={filters.format}>
              <option value="all">Mọi hình thức</option>
              <option value="1vs1">1vs1</option>
              <option value="2vs2">2vs2</option>
            </select>
            <select aria-label="Trình độ" className="community-control" onChange={(event) => update('skill', event.target.value)} value={filters.skill}>
              <option value="all">Mọi trình độ</option>
              {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Level {value}</option>)}
            </select>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[12px] font-bold text-red-700" role="alert">
            {error}
          </div>
        )}

        <section className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {activeTab === 'manual' ? (
            <>
              {visibleMatches.map((match) => (
                <article className="community-card h-full p-3" key={match.matchId}>
                  <div className="flex flex-col gap-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px]">{match.matchType}</span>
                        <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] text-[#526158]">Level {match.minSkillLevel}-{match.maxSkillLevel}</span>
                        {match.isHost && <span className="community-badge !min-h-5 !bg-[#fff4d8] !px-1.5 !py-1 !text-[10px] !text-[#8a5b00]">Của tôi</span>}
                        {match.replacementSlotCount > 0 && <span className="community-badge !min-h-5 !bg-[#eef8e6] !px-1.5 !py-1 !text-[10px] !text-[#477313]">Cần {match.replacementSlotCount} người thay thế</span>}
                      </div>
                      <Link className="mt-2 block" to={`/matches/${match.matchId}`}>
                        <h2 className="text-[15px] font-extrabold leading-5 text-[#0b2228] transition-colors hover:text-[#477313]">
                          {match.title}
                        </h2>
                      </Link>
                      <button
                        className="group mt-1 inline-flex max-w-full items-center gap-2 rounded-lg py-0.5 pr-1 text-left focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#477313]/45"
                        onClick={() => setSelectedHost(match)}
                        title={`Xem hồ sơ của ${match.hostName}`}
                        type="button"
                      >
                        <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#d8e4d4] bg-[#edf5e9] text-[10px] font-extrabold text-[#477313]">
                          {match.hostAvatarUrl ? (
                            <img
                              alt={`Ảnh đại diện của ${match.hostName}`}
                              className="h-full w-full object-cover"
                              decoding="async"
                              loading="lazy"
                              src={match.hostAvatarUrl}
                            />
                          ) : (
                            <span aria-hidden="true">{match.hostName.charAt(0).toUpperCase() || '?'}</span>
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[9px] font-bold leading-3 text-[#718077]">Chủ phòng</span>
                          <span className="block truncate text-[10px] font-extrabold leading-4 text-[#526158] transition-colors group-hover:text-[#477313]">
                            {match.hostName}
                          </span>
                        </span>
                        <ChevronRight
                          aria-hidden="true"
                          className="h-3 w-3 shrink-0 text-[#98a39b] transition-transform group-hover:translate-x-0.5 group-hover:text-[#477313]"
                        />
                      </button>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#526158]">{match.note || 'Chủ phòng chưa thêm mô tả.'}</p>
                    </div>
                    <Link className="community-button-secondary !min-h-8 w-full justify-center !px-2.5 !py-1.5 !text-[11px]" to={`/matches/${match.matchId}`}>
                      {match.isHost ? <ShieldCheck aria-hidden="true" className="h-3 w-3" /> : <Eye aria-hidden="true" className="h-3 w-3" />}
                      {match.isHost ? 'Quản lý' : 'Xem chi tiết'}
                    </Link>
                  </div>

                  <div className="mt-2.5 divide-y divide-[#e2eae0] overflow-hidden rounded-lg border border-[#d8e4d4] bg-[#fbfcfa]">
                    <div className="px-2.5 py-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><MapPin className="h-3 w-3 text-[#477313]" />Khu vực</p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#0b2228]">{match.ward}, {match.province}</p>
                      <p className="mt-0.5 text-[10px] text-[#718077]">Bán kính {match.searchRadiusKm} km</p>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><CalendarRange className="h-3 w-3 text-[#477313]" />Khoảng ngày</p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#0b2228]">{dateLabel(match.availableDateFrom)} - {dateLabel(match.availableDateTo)}</p>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><Clock className="h-3 w-3 text-[#477313]" />Các slot đã chọn</p>
                      <div className="community-scroll mt-1 flex max-h-14 flex-wrap gap-1 overflow-y-auto pr-1">
                        {availabilitySlotsFor(match).map((slot) => (
                          <span
                            className="inline-flex min-h-5 items-center rounded-md border border-[#d8e4d4] bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0b2228]"
                            key={slot.matchAvailabilitySlotId}
                          >
                            {timeLabel(slot.timeStart)} - {timeLabel(slot.timeEnd)}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><Users className="h-3 w-3 text-[#477313]" />Thành viên</p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#0b2228]">{match.acceptedPlayerCount}/{match.requiredPlayerCount} người, còn {match.availableSlotCount}</p>
                    </div>
                  </div>

                  {match.preferredVenues.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {match.preferredVenues.map((venue) => (
                        <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] text-[#526158]" key={venue.venueId}>{venue.venueName}</span>
                      ))}
                      {match.preferredVenues.some((venue) =>
                        typeof venue.latitude === 'number'
                        && typeof venue.longitude === 'number') && (
                        <button
                          className="community-button-secondary !min-h-5 !gap-1 !px-1.5 !py-1 !text-[10px]"
                          onClick={() => setMappedMatch(match)}
                          title="Xem vị trí, khoảng cách và lộ trình"
                          type="button"
                        >
                          <Route aria-hidden="true" className="h-3 w-3" />
                          Bản đồ
                        </button>
                      )}
                    </div>
                  )}
                </article>
              ))}

              {visibleMatches.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <CommunityEmptyState
                    action={<Link className="community-button" to="/opponents/create">Tạo lời mời</Link>}
                    description="Thử nới bộ lọc hoặc tự tạo một lời mời mới."
                    icon={Users}
                    title="Chưa có lời mời phù hợp"
                  />
                </div>
              )}
              <div className="sm:col-span-2 lg:col-span-3">
                <PaginationControls page={pagination} onPageChange={setPage} />
              </div>
            </>
          ) : (
            <>
              {filteredQueues.map((q) => {
                const maxCap = q.playerCount ?? (q.matchType === '1vs1' ? 2 : 4);
                const approvedPlayers = q.queuePlayers.filter((qp) => qp.status !== 'Pending' && qp.status !== 'Rejected');
                const myRequest = q.queuePlayers.find((qp) => String(qp.playerId) === user?.id);
                const isMine = myRequest?.status !== 'Pending' && myRequest?.status !== 'Rejected';
                const host = approvedPlayers.find((qp) => qp.isHost);
                const isFull = approvedPlayers.length >= maxCap;
                const venueList = queueVenues[q.matchmakingQueueId ?? 0] ?? [];
                const hasMappableVenue = venueList.some((venue) => venue.latitude != null && venue.longitude != null);

                return (
                  <article className="community-card h-full p-3 flex flex-col justify-between" key={q.matchmakingQueueId}>
                    <div className="flex flex-col gap-2.5">
                      <div className="min-w-0">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px]">{q.matchType}</span>
                          <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] text-[#526158]">Trình độ tối thiểu: {skillLevelName(q.minSkillLevel)}</span>
                          <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] text-[#526158]">Trình độ tối đa: {skillLevelName(q.maxSkillLevel)}</span>
                          {isMine && <span className="community-badge !min-h-5 !bg-[#edf5e9] !px-1.5 !py-1 !text-[10px] !text-[#477313] border border-[#477313]/25">Đã tham gia</span>}
                          <span className="community-badge !min-h-5 !bg-[#fff4d8] !px-1.5 !py-1 !text-[10px] !text-[#8a5b00]">Ghép thủ công (Công khai)</span>
                        </div>
                        
                        <Link to={q.matchId ? `/matches/${q.matchId}` : `/opponents/queue/${q.matchmakingQueueId}`} className="block mt-2">
                          <h2 className="text-[15px] font-extrabold leading-5 text-[#0b2228] transition-colors hover:text-[#477313]">
                            {q.title?.trim() || 'Lời mời ghép trận thủ công'}
                          </h2>
                        </Link>

                        {host && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <span className="grid h-6 w-6 shrink-0 place-items-center overflow-hidden rounded-lg border border-[#d8e4d4] bg-[#edf5e9] text-[10px] font-extrabold text-[#477313]">
                              {host.avatarUrl ? (
                                <img
                                  alt=""
                                  className="h-full w-full object-cover"
                                  decoding="async"
                                  loading="lazy"
                                  src={host.avatarUrl}
                                />
                              ) : (
                                <span>{host.playerName.charAt(0).toUpperCase()}</span>
                              )}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-[9px] font-bold leading-3 text-[#718077]">Chủ phòng</span>
                              <span className="block truncate text-[10px] font-extrabold leading-4 text-[#526158]">
                                {host.playerName}
                              </span>
                            </span>
                          </div>
                        )}
                        
                        <p className="mt-2 text-[11px] leading-4 text-[#526158]">
                          Tần suất tìm lại: <strong className="text-[#0b2228] font-bold">{q.replayType === 'None' ? 'Một lần' : q.replayType}</strong>
                        </p>
                      </div>

                      <div className="mt-2.5 divide-y divide-[#e2eae0] overflow-hidden rounded-lg border border-[#d8e4d4] bg-[#fbfcfa]">
                        <div className="px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><MapPin className="h-3 w-3 text-[#477313]" />Khu vực</p>
                          <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#0b2228]">{q.ward || 'Tự do'}, {q.province || 'Toàn quốc'}</p>
                          <p className="mt-0.5 text-[10px] text-[#718077]">Bán kính {q.searchRadiusKm} km</p>
                        </div>

                        <div className="px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><CalendarRange className="h-3 w-3 text-[#477313]" />Khoảng ngày</p>
                          <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#0b2228]">{queueDateRange(q)}</p>
                        </div>

                        <div className="px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><Clock className="h-3 w-3 text-[#477313]" />Các slot đã chọn</p>
                          <div className="community-scroll mt-1 flex max-h-20 flex-wrap gap-1 overflow-y-auto pr-1">
                            {formatQueueSlots(q.queueSlots, q.replayType, true).map((slot, idx) => (
                              <span
                                className="inline-flex min-h-5 items-center rounded-md border border-[#d8e4d4] bg-white px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#0b2228]"
                                key={idx}
                              >
                                {slot.timeStart} - {slot.timeEnd}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="px-2.5 py-2">
                          <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><Users className="h-3 w-3 text-[#477313]" />Thành viên nhóm ({approvedPlayers.length}/{maxCap})</p>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {approvedPlayers.map((player) => (
                              <span key={player.playerId} className="inline-flex items-center bg-[#edf5e9] border border-[#d8e4d4] text-[10px] px-1.5 py-0.5 rounded font-medium text-[#477313]">
                                {player.playerName}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {venueList.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {venueList.map((venue) => (
                            <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] text-[#526158]" key={venue.venueId}>
                              {venue.venueName}
                            </span>
                          ))}
                          {hasMappableVenue && (
                            <button
                              className="community-button-secondary !min-h-5 !gap-1 !px-1.5 !py-1 !text-[10px]"
                              onClick={() => setMappedQueue(q)}
                              title="Xem vị trí, khoảng cách và lộ trình"
                              type="button"
                            >
                              <Route aria-hidden="true" className="h-3 w-3" />
                              Bản đồ
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Link
                        to={q.matchId ? `/matches/${q.matchId}` : `/opponents/queue/${q.matchmakingQueueId}`}
                        className="community-button-secondary !min-h-8 flex-1 !text-[11px] flex items-center justify-center gap-1"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </Link>
                      {isMine ? (
                        <>
                          {q.conversationId && (
                            <Link
                              to={`/messages?chat=${q.conversationId}`}
                              className="community-button !min-h-8 flex-1 !text-[11px] !bg-[#477313] hover:!bg-[#588e18] !text-white flex items-center justify-center gap-1"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Chat nhóm
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={() => void handleLeaveQueue()}
                            className="community-button-secondary !min-h-8 flex-1 !text-[11px] hover:!bg-red-500/20 hover:!text-red-700 hover:!border-red-500/30 flex items-center justify-center gap-1"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                            Rời hàng chờ
                          </button>
                        </>
                      ) : myRequest?.status === 'Pending' ? (
                        <button type="button" disabled className="community-button-secondary !min-h-8 flex-1 !text-[11px]">Chờ chủ phòng duyệt</button>
                      ) : myRequest?.status === 'Rejected' ? (
                        <button type="button" disabled className="community-button-secondary !min-h-8 flex-1 !text-[11px]">Đã bị từ chối</button>
                      ) : (
                        <button
                          type="button"
                          disabled={isFull}
                          onClick={() => void handleJoinQueue(q.matchmakingQueueId!)}
                          className="community-button !min-h-8 flex-1 !text-[11px] flex items-center justify-center gap-1"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          {isFull ? 'Đã đầy' : 'Gửi yêu cầu'}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}

              {filteredQueues.length === 0 && (
                <div className="sm:col-span-2 lg:col-span-3">
                  <CommunityEmptyState
                    action={<Link className="community-button" to="/opponents/create">Tạo hàng chờ</Link>}
                    description="Hiện tại chưa có lời mời thủ công công khai nào phù hợp với bộ lọc."
                    icon={Users}
                    title="Chưa có hàng chờ phù hợp"
                  />
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {selectedHost && (
        <PlayerProfileDialog
          fallbackAvatarUrl={selectedHost.hostAvatarUrl}
          fallbackName={selectedHost.hostName}
          onClose={() => setSelectedHost(null)}
          playerId={selectedHost.hostPlayerId}
        />
      )}

      {mappedMatch && (
        <Suspense fallback={<p className="p-4 text-center" role="status">Đang tải bản đồ...</p>}>
          <MatchVenueMapDialog
            matchTitle={mappedMatch.title}
            onClose={() => setMappedMatch(null)}
            venues={mappedMatch.preferredVenues}
          />
        </Suspense>
      )}
      {mappedQueue && (
        <Suspense fallback={<p className="p-4 text-center" role="status">Đang tải bản đồ...</p>}>
          <MatchVenueMapDialog
            matchTitle={mappedQueue.title?.trim() || 'Lời mời ghép trận thủ công'}
            onClose={() => setMappedQueue(null)}
            selectedVenueIds={queueVenueIds(mappedQueue.sharedVenues)}
            venues={queueVenues[mappedQueue.matchmakingQueueId ?? 0] ?? []}
          />
        </Suspense>
      )}
    </CommunityPage>
  );
};
