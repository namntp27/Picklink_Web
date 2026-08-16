import { lazy, Suspense, useEffect, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarRange,
  Clock,
  Eye,
  Filter,
  MapPin,
  RotateCcw,
  Route,
  Trophy,
  UserPlus,
  Users,
  LogOut,
  MessageSquare,
  Plus,
} from 'lucide-react';
import { searchMatchVenues, type MatchFormat, type MatchPreferredVenue } from '../../api/matches';
import {
  cancelQueue,
  getPublicQueues,
  joinPublicQueue,
  type QueueStatusResponse,
} from '../../api/matchmaking';
import { useAuth } from '../../auth/AuthContext';
import { formatQueueSlots } from '../../utils/queueSlotFormatter';
import { PaginationControls } from '../../components/PaginationControls';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { CommunityEmptyState, CommunityHero, CommunityPage } from '../community/CommunityUI';
import { AdministrativeAreaSelects } from '../../components/location/AdministrativeAreaSelects';
import { PlayerHoverCard } from './components/PlayerHoverCard';
import { useConfirm } from '../../components/ui/ConfirmDialogRegion';

const MatchVenueMapDialog = lazy(async () => {
  const module = await import('./components/MatchVenueMapDialog');
  return { default: module.MatchVenueMapDialog };
});

type Filters = {
  format: 'all' | MatchFormat;
  skill: string;
  province: string;
  ward: string;
  date: string;
};

const defaults: Filters = {
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

const queueVenueIds = (sharedVenues?: string | null) => sharedVenues?.split(',').map(Number).filter(Number.isInteger) ?? [];

const queueDateRange = (queue: QueueStatusResponse) => {
  const dates = queue.queueSlots.flatMap((slot) => slot.specificDate ? [slot.specificDate] : []).sort();
  if (!dates.length) return queue.replayType === 'Daily' ? 'Hàng ngày' : queue.replayType;
  return dateLabel(dates[0]) + ' - ' + dateLabel(dates[dates.length - 1]);
};

const weekdayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const queueMatchesDate = (queue: QueueStatusResponse, selectedDate: string) => {
  if (!selectedDate) return true;
  const date = new Date(`${selectedDate}T00:00:00`);
  const weekday = weekdayNames[date.getDay()];
  return queue.queueSlots.some((slot) =>
    slot.specificDate === selectedDate
    || queue.replayType === 'Daily'
    || (queue.replayType === 'Weekly'
      && (String(slot.dayOfWeek) === weekday || Number(slot.dayOfWeek) === date.getDay()))
    || (queue.replayType === 'Monthly' && slot.dayOfMonth === date.getDate()));
};


const skillLevelName = (level?: number) => ({ 1: 'Mới chơi', 2: 'Cơ bản', 3: 'Trung bình', 4: 'Khá', 5: 'Nâng cao' }[level ?? 1] ?? 'Mới chơi');

const PAGE_SIZE = 15;
const emptyQueues: QueueStatusResponse[] = [];
export const PendingInvites = () => {
  const { token } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [queueVenues, setQueueVenues] = useState<Record<number, MatchPreferredVenue[]>>({});
  const [mappedQueue, setMappedQueue] = useState<QueueStatusResponse | null>(null);
  const [filters, setFilters] = useState<Filters>(defaults);
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState('');
  const setError = setActionError;

  const {
    data: queues = emptyQueues,
    error: queuesError,
    loading: queuesLoading,
    refresh: loadQueues,
  } = useApiQuery(
    ['public-queues', token],
    () => getPublicQueues(token),
    { errorMessage: 'Không thể tải danh sách lời mời thủ công.' },
  );

  useEffect(() => {
    let disposed = false;
    void (async () => {
      const selectedVenueIds = new Set(queues.flatMap((queue) => queueVenueIds(queue.sharedVenues)));
      if (selectedVenueIds.size === 0) {
        if (!disposed) setQueueVenues({});
        return;
      }

      const venues = await searchMatchVenues({ radiusKm: 0 }).catch((): MatchPreferredVenue[] => []);
      const venueLookup = new Map(venues.map((venue) => [venue.venueId, venue]));
      const resolved: Record<number, MatchPreferredVenue[]> = {};
      queues.forEach((queue) => {
        if (queue.matchmakingQueueId == null) return;
        resolved[queue.matchmakingQueueId] = queueVenueIds(queue.sharedVenues)
          .flatMap((venueId) => venueLookup.get(venueId) ? [venueLookup.get(venueId)!] : []);
      });
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
    if (!(await confirm({
      title: 'Rời hàng chờ ghép trận này?',
      message: 'Bạn sẽ không được ghép vào trận nào từ hàng chờ này nữa.',
      confirmLabel: 'Rời hàng chờ',
      tone: 'danger',
    }))) return;
    try {
      await cancelQueue(token);
      void loadQueues();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể rời hàng chờ.');
    }
  };

  const handleOpenQueue = (queue: QueueStatusResponse) => {
    const queueId = queue.matchmakingQueueId;
    if (queueId == null) {
      setError('Không thể xác định lời mời thủ công này.');
      return;
    }
    navigate(`/opponents/queue/${queueId}`);
  };

  const error = actionError || queuesError;

  useMatchRealtime(() => {
    void loadQueues();
  });
  
  const filteredQueues = useMemo(() => {
    return queues.filter((q) => {
      if (!q.isPublic) return false;
      const maxCapacity = q.playerCount ?? (q.matchType === '1vs1' ? 2 : 4);
      const approvedPlayerCount = q.queuePlayers.filter((player) =>
        player.status === 'Approved' || player.status === 'Accepted').length;
      if (approvedPlayerCount >= maxCapacity) return false;
      const currentPlayer = q.queuePlayers.find((player) => player.isCurrentPlayer);
      if (currentPlayer?.status === 'Approved' || currentPlayer?.status === 'Accepted') return false;
      if (filters.format !== 'all' && q.matchType !== filters.format) return false;
      if (filters.skill !== 'all') {
        const skill = Number(filters.skill);
        if (skill < (q.minSkillLevel ?? 1) || skill > (q.maxSkillLevel ?? 5)) return false;
      }
      if (filters.province && q.province !== filters.province) return false;
      if (filters.ward && q.ward !== filters.ward) return false;
      if (!queueMatchesDate(q, filters.date)) return false;
      
      return true;
    });
  }, [queues, filters.date, filters.format, filters.province, filters.skill, filters.ward]);

  const pagination = useMemo(() => ({
    page,
    pageSize: PAGE_SIZE,
    totalCount: filteredQueues.length,
    totalPages: Math.max(1, Math.ceil(filteredQueues.length / PAGE_SIZE)),
  }), [filteredQueues.length, page]);

  const paginatedQueues = useMemo(
    () => filteredQueues.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredQueues, page],
  );

  useEffect(() => {
    if (page > pagination.totalPages) setPage(pagination.totalPages);
  }, [page, pagination.totalPages]);

  const remainingSlots = useMemo(() => {
    return filteredQueues.reduce((sum, q) => {
      const maxCap = q.playerCount ?? (q.matchType === '1vs1' ? 2 : 4);
      return sum + Math.max(0, maxCap - q.queuePlayers.filter((p) => p.status !== 'Pending' && p.status !== 'Rejected').length);
    }, 0);
  }, [filteredQueues]);

  const update = (key: keyof Filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }) as Filters);
    setPage(1);
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
        description="Lọc các lời mời thủ công công khai theo khu vực, thời gian và trình độ."
        icon={Users}
        label="Lời mời thủ công"
        stats={(
          <div className="grid grid-cols-2 gap-5">
            <div>
              <p className="font-mono text-[23px] font-extrabold text-[#e2ff57]">
                {filteredQueues.length}
              </p>
              <p className="mt-1 text-[11px] font-semibold text-white/65">
                lời mời thủ công
              </p>
            </div>
            <div>
              <p className="font-mono text-[23px] font-extrabold text-[#e2ff57]">{remainingSlots}</p>
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
                {queuesLoading ? 'Đang cập nhật lời mời...' : 'Đang hiển thị các lời mời thủ công công khai.'}
              </p>
            </div>

            <div className="flex gap-2 items-center flex-wrap">
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
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

        <section aria-busy={queuesLoading} className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {queuesLoading && queues.length === 0 && Array.from({ length: 6 }, (_, index) => (
            <article aria-hidden="true" className="community-card animate-pulse p-3 motion-reduce:animate-none" key={index}>
              <div className="h-5 w-28 rounded bg-[#e8efe5]" />
              <div className="mt-3 h-4 w-3/4 rounded bg-[#edf2ea]" />
              <div className="mt-3 h-28 rounded-lg bg-[#f2f5f0]" />
            </article>
          ))}
          {paginatedQueues.map((q) => {
                const maxCap = q.playerCount ?? (q.matchType === '1vs1' ? 2 : 4);
                const approvedPlayers = q.queuePlayers.filter((qp) => qp.status === 'Approved' || qp.status === 'Accepted');
                const myRequest = q.queuePlayers.find((player) => player.isCurrentPlayer);
                const isMine = myRequest?.status === 'Approved' || myRequest?.status === 'Accepted';
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
                        
                        <button
                          className="mt-2 block w-full text-left disabled:cursor-wait disabled:opacity-60"
                          onClick={() => handleOpenQueue(q)}
                          type="button"
                        >
                          <h2 className="text-[15px] font-extrabold leading-5 text-[#0b2228] transition-colors hover:text-[#477313]">
                            {q.title?.trim() || 'Lời mời ghép trận thủ công'}
                          </h2>
                        </button>

                        {host && (
                          <div className="mt-2.5 flex items-center gap-2">
                            <PlayerHoverCard playerId={host.playerId} playerName={host.playerName}>
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
                            </PlayerHoverCard>
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
                      <button
                        className="community-button-secondary !min-h-8 flex-1 !text-[11px] flex items-center justify-center gap-1"
                        onClick={() => handleOpenQueue(q)}
                        type="button"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Chi tiết
                      </button>
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

          {!queuesLoading && filteredQueues.length === 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <CommunityEmptyState
                action={<Link className="community-button" to="/opponents/create">Tạo lời mời</Link>}
                description="Hiện tại chưa có lời mời thủ công công khai nào phù hợp với bộ lọc."
                icon={Users}
                title="Chưa có lời mời thủ công phù hợp"
              />
            </div>
          )}
          <div className="sm:col-span-2 lg:col-span-3">
            <PaginationControls page={pagination} onPageChange={setPage} />
          </div>
        </section>
      </main>
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
