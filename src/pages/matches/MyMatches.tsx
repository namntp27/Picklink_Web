import { useEffect, useMemo, useRef, useState } from 'react';
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
  UserPlus,
  Users,
  XCircle,
  Play,
  LogOut,
  MessageSquare,
} from 'lucide-react';
import { cancelMatch, getMyMatches, type MatchStatus, type MatchSummary } from '../../api/matches';
import { getMyQueues, cancelQueue, resumeQueue, type QueueStatusResponse } from '../../api/matchmaking';
import { useAuth } from '../../auth/AuthContext';
import { formatQueueSlots } from '../../utils/queueSlotFormatter';
import { PaginationControls } from '../../components/PaginationControls';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { CommunityEmptyState, CommunityHero, CommunityPage } from '../community/CommunityUI';

type FilterStatus = 'all' | MatchStatus | 'ActiveQueues';

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
  { label: 'Lời mời đang hoạt động', value: 'ActiveQueues' },
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
const matchListRefreshActions = new Set([
  'Created',
  'JoinRequested',
  'ParticipantWithdrawn',
  'ParticipantApproved',
  'ParticipantRejected',
  'ParticipantRemoved',
  'ReadyToBook',
  'BookingCreated',
  'Cancelled',
  'Reopened',
  'Completed',
  'BookingExpired',
  'Expired',
  'PlayersInvited',
  'InvitationAccepted',
  'InvitationDeclined',
]);

type MyMatchesResult = Awaited<ReturnType<typeof getMyMatches>>;

let myMatchesCache: {
  token: string;
  page: number;
  result: MyMatchesResult;
} | null = null;

export const MyMatches = () => {
  const { token, user } = useAuth();
  const cachedPage = myMatchesCache?.token === token && myMatchesCache.page === 1
    ? myMatchesCache.result
    : null;
  const [matches, setMatches] = useState<MatchSummary[]>(() => cachedPage?.items ?? []);
  const [myQueues, setMyQueues] = useState<QueueStatusResponse[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(
    () => cachedPage ?? { page: 1, pageSize: 9, totalCount: 0, totalPages: 1 },
  );
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(Boolean(token) && !cachedPage);
  const requestIdRef = useRef(0);

  const load = async (
    options: Pick<RequestInit, 'signal'> = {},
    behavior: { silent?: boolean } = {},
  ) => {
    if (!token) {
      setIsLoading(false);
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    if (!behavior.silent) setIsLoading(true);
    try {
      const [result, queues] = await Promise.all([
        getMyMatches(token, { page, pageSize: 9 }, options),
        getMyQueues(token).catch(() => []),
      ]);
      if (requestId !== requestIdRef.current) return;
      myMatchesCache = { token, page, result };
      setMatches(result.items);
      setPagination(result);
      setMyQueues(queues);
      setError('');
    } catch (reason) {
      if (options.signal?.aborted || requestId !== requestIdRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách phòng.');
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    if (myMatchesCache?.token === token && myMatchesCache.page === page) {
      setMatches(myMatchesCache.result.items);
      setPagination(myMatchesCache.result);
    }
    void load({ signal: controller.signal });
    return () => controller.abort();
  }, [page, token]);

  useMatchRealtime((event) => {
    if (!matchListRefreshActions.has(event.action)) return;
    void load({}, { silent: true });
  });

  const visible = useMemo(() => {
    if (activeFilter === 'all') return matches;
    if (activeFilter === 'Cancelled') {
      return matches.filter((match) => match.status === 'Cancelled' || match.status === 'Expired');
    }
    return matches.filter((match) => match.status === activeFilter);
  }, [activeFilter, matches]);

  const attentionCount = matches.filter(
    (match) => match.myParticipantStatus === 'Invited'
      || match.status === 'ReadyToBook'
      || match.status === 'BookingPending',
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

  const handleResumeQueue = async (queueId: number) => {
    if (!token) return;
    try {
      await resumeQueue(token, queueId);
      await load();
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tìm tiếp trận đấu.');
    }
  };

  const handleCancelQueue = async (queue: QueueStatusResponse) => {
    if (!token) return;
    const isHost = queue.queuePlayers.find((p) => String(p.playerId) === user?.id)?.isHost;
    const msg = isHost
      ? 'Bạn là chủ hàng chờ, hủy hàng chờ sẽ giải tán cả nhóm. Bạn có chắc chắn?'
      : 'Bạn có chắc chắn muốn rời khỏi hàng chờ ghép trận này?';
    if (!window.confirm(msg)) return;

    try {
      await cancelQueue(token, queue.matchmakingQueueId ?? undefined);
      await load();
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể rời hàng chờ.');
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
        description="Theo dõi lời mời nhận được, các phòng bạn tạo hoặc đã tham gia, từ tuyển người đến hoàn tất booking."
        icon={Trophy}
        label="Phòng ghép trận cá nhân"
        stats={(
          <div>
            <p className="text-[11px] font-bold text-white/65">Cần xử lý</p>
            <p className="mt-1 font-mono text-[30px] font-extrabold text-[#e2ff57]">{attentionCount}</p>
            <p className="mt-1 text-[11px] leading-5 text-white/65">lời mời hoặc phòng cần xử lý</p>
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

        <section
          aria-busy={isLoading}
          className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3"
        >
          {isLoading && matches.length === 0 && (
            <>
              <span className="sr-only" role="status">Đang tải phòng của bạn...</span>
              {Array.from({ length: 6 }, (_, index) => (
                <article
                  aria-hidden="true"
                  className="community-card animate-pulse p-3 motion-reduce:animate-none"
                  key={index}
                >
                  <div className="flex gap-1.5">
                    <div className="h-5 w-24 rounded-md bg-[#e8efe5]" />
                    <div className="h-5 w-16 rounded-md bg-[#eef3ec]" />
                  </div>
                  <div className="mt-2 h-5 w-3/4 rounded bg-[#e8efe5]" />
                  <div className="mt-2 h-3 w-full rounded bg-[#eef3ec]" />
                  <div className="mt-2.5 h-8 rounded-lg bg-[#e8efe5]" />
                  <div className="mt-2.5 h-44 rounded-lg border border-[#e2eae0] bg-[#f6f9f4]" />
                </article>
              ))}
            </>
          )}

          {activeFilter === 'ActiveQueues' ? (
            myQueues.length === 0 ? (
              <div className="col-span-full py-8 text-center text-sm font-semibold text-[#526158]">
                Không có lời mời tìm trận nào đang hoạt động.
              </div>
            ) : (
              myQueues.map((queue) => (
                <article
                  key={queue.matchmakingQueueId}
                  className="community-card h-full p-3 flex flex-col justify-between"
                  style={{ background: 'linear-gradient(135deg, #f6f9f4 0%, #edf2ea 100%)' }}
                >
                  <div className="flex flex-col gap-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] ${
                          queue.isActive
                            ? 'bg-[#edf5e9] text-[#477313] border border-[#d2e4c8]'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full mr-1 ${queue.isActive ? 'bg-[#477313] animate-ping' : 'bg-amber-500'}`} />
                          {queue.isActive ? 'Đang tìm đối thủ' : 'Tạm dừng tìm kiếm'}
                        </span>
                        <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] text-[#526158]">
                          {queue.matchType}
                        </span>
                        <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] text-[#526158]">
                          Trình độ: ⭐ {queue.skillLevel}
                        </span>
                        {queue.isPublic && (
                          <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] bg-[#e2ff57]/20 text-[#283e0b] border border-[#cbe54f]">
                            Công khai
                          </span>
                        )}
                      </div>
                      <Link className="mt-2 block" to={`/opponents/queue/${queue.matchmakingQueueId}`}>
                        <h2 className="text-[15px] font-extrabold leading-5 text-[#0b2228] transition-colors hover:text-[#477313]">
                          {queue.isActive ? 'Lời mời tìm trận đấu tự động' : 'Tìm trận đấu đang tạm dừng'}
                        </h2>
                      </Link>
                      <p className="mt-1 text-[11px] leading-4 text-[#526158] line-clamp-2">
                        {queue.province ? `Khu vực: ${queue.ward ? `${queue.ward}, ` : ''}${queue.province}` : 'Sử dụng GPS định vị tìm sân gần nhất'}
                        {queue.sharedVenues && ` · Sân ưu tiên: ${queue.sharedVenues}`}
                      </p>
                    </div>

                    <div className="mt-2.5 divide-y divide-[#e2eae0] overflow-hidden rounded-lg border border-[#d8e4d4] bg-[#fbfcfa]">
                      <div className="px-2.5 py-2">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]">
                          <Clock className="h-3 w-3 text-[#477313]" />Khung giờ & Lịch hẹn
                        </p>
                        <div className="mt-1 flex flex-col gap-0.5 max-h-[80px] overflow-y-auto">
                          {formatQueueSlots(queue.queueSlots, queue.replayType, false).map((slot, sIdx) => (
                            <span key={sIdx} className="text-[10px] font-semibold text-[#0b2228]">
                              • {slot.dayLabel} · {slot.timeStart} - {slot.timeEnd}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="px-2.5 py-2">
                        <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]">
                          <Users className="h-3 w-3 text-[#477313]" />Thành viên ({queue.queuePlayers.length})
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {queue.queuePlayers.map((player) => (
                            <span key={player.playerId} className="inline-flex items-center gap-1 bg-[#edf5e9] text-[#477313] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#d2e4c8]">
                              {player.playerName}
                              {player.isHost && <span className="text-[7px] text-amber-700 bg-amber-100 px-0.5 rounded">Host</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex gap-1.5 w-full">
                    <Link
                      to={`/opponents/queue/${queue.matchmakingQueueId}`}
                      className="community-button-secondary !min-h-8 min-w-0 flex-1 !px-2.5 !py-1.5 !text-[11px] flex items-center justify-center gap-1"
                    >
                      <Eye className="h-3 w-3" />
                      Chi tiết
                    </Link>
                    {queue.conversationId && (
                      <Link
                        to={`/messages?chat=${queue.conversationId}`}
                        className="community-button !min-h-8 min-w-0 flex-1 !px-2 !py-1.5 !text-[11px] !bg-[#477313] hover:!bg-[#588e18] !text-white flex items-center justify-center gap-1"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Chat
                      </Link>
                    )}
                    {!queue.isActive && (
                      <button
                        type="button"
                        onClick={() => void handleResumeQueue(queue.matchmakingQueueId!)}
                        className="community-button !min-h-8 min-w-0 flex-1 !px-2 !py-1.5 !text-[11px] !bg-[#e2ff57] !text-[#0b2228] hover:!bg-[#d4f046] flex items-center justify-center gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Tìm tiếp
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleCancelQueue(queue)}
                      className="community-button-secondary !min-h-8 !px-2.5 !py-1.5 !text-[11px] hover:!bg-red-500/20 hover:!text-red-750 hover:!border-red-500/30 flex items-center justify-center gap-1"
                    >
                      <LogOut className="h-3 w-3" />
                      {queue.queuePlayers.find((p) => String(p.playerId) === user?.id)?.isHost ? 'Hủy' : 'Rời'}
                    </button>
                  </div>
                </article>
              ))
            )
          ) : (
            visible.map((match) => {
              const status = statusConfig[match.status];
              const StatusIcon = status.icon;
              const isInvitation = match.myParticipantStatus === 'Invited';

              return (
                <article className="community-card h-full p-3" key={match.matchId}>
                  <div className="flex flex-col gap-2.5">
                    <div className="min-w-0">
                      <div className="flex flex-wrap gap-1.5">
                        <span className={`community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] ${status.className}`}>
                          <StatusIcon aria-hidden="true" className="h-3 w-3" />
                          {status.label}
                        </span>
                        <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] text-[#526158]">
                          {match.isHost ? 'Bạn là chủ phòng' : isInvitation ? 'Đang mời bạn' : 'Bạn là thành viên'}
                        </span>
                        {isInvitation && (
                          <span className="community-badge !min-h-5 !bg-[#fff4d8] !px-1.5 !py-1 !text-[10px] !text-[#8a5b00]">
                            <UserPlus aria-hidden="true" className="h-3 w-3" />
                            Cần phản hồi
                          </span>
                        )}
                        <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[10px] text-[#526158]">{match.matchType}</span>
                      </div>
                      <Link className="mt-2 block" to={`/matches/${match.matchId}`}>
                        <h2 className="text-[15px] font-extrabold leading-5 text-[#0b2228] transition-colors hover:text-[#477313]">
                          {match.title}
                        </h2>
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#526158]">
                        {match.note || `Phòng đang ở trạng thái ${status.label.toLowerCase()}.`}
                      </p>
                    </div>
                    <div className="flex w-full gap-1.5">
                      <Link className="community-button-secondary !min-h-8 min-w-0 flex-1 !px-2.5 !py-1.5 !text-[11px]" to={`/matches/${match.matchId}`}>
                        <Eye aria-hidden="true" className="h-3 w-3" />
                        {isInvitation ? 'Phản hồi' : 'Xem phòng'}
                      </Link>
                      {match.isHost && (match.status === 'Recruiting' || match.status === 'ReadyToBook') && (
                        <button
                          aria-label={`Hủy phòng ${match.title}`}
                          className="community-button-danger !h-8 !min-h-8 !w-8 shrink-0 !p-0"
                          onClick={() => void handleCancel(match.matchId)}
                          title="Hủy phòng"
                          type="button"
                        >
                          <XCircle aria-hidden="true" className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2.5 divide-y divide-[#e2eae0] overflow-hidden rounded-lg border border-[#d8e4d4] bg-[#fbfcfa]">
                    <div className="px-2.5 py-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><CalendarRange className="h-3 w-3 text-[#477313]" />Ngày có thể chơi</p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#0b2228]">{dateLabel(match.availableDateFrom)} - {dateLabel(match.availableDateTo)}</p>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><Clock className="h-3 w-3 text-[#477313]" />Khung giờ</p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#0b2228]">
                        {match.startTime
                          ? `${timePart(match.startTime)} - ${timePart(match.endTime!)}`
                          : `${match.preferredTimeStart} - ${match.preferredTimeEnd}`}
                      </p>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><MapPin className="h-3 w-3 text-[#477313]" />{match.venueName ? 'Sân đã chọn' : 'Khu vực'}</p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#0b2228]">
                        {match.venueName ? `${match.venueName} · Sân ${match.courtNumber}` : `${match.ward}, ${match.province}`}
                      </p>
                    </div>
                    <div className="px-2.5 py-2">
                      <p className="flex items-center gap-1.5 text-[10px] font-bold text-[#718077]"><Users className="h-3 w-3 text-[#477313]" />Thành viên</p>
                      <p className="mt-0.5 text-[11px] font-semibold leading-4 text-[#0b2228]">{match.acceptedPlayerCount}/{match.requiredPlayerCount} người</p>
                    </div>
                  </div>
                </article>
              );
            })
          )}

          {!isLoading && (activeFilter === 'ActiveQueues' ? myQueues.length === 0 : visible.length === 0) && (
            <div className="sm:col-span-2 lg:col-span-3">
              <CommunityEmptyState
                action={<Link className="community-button" to="/opponents/create">Tạo lời mời</Link>}
                description="Các phòng phù hợp với trạng thái này sẽ xuất hiện tại đây."
                icon={Trophy}
                title="Chưa có phòng trong nhóm này"
              />
            </div>
          )}
          {activeFilter !== 'ActiveQueues' && (
            <div className="sm:col-span-2 lg:col-span-3">
              <PaginationControls page={pagination} onPageChange={setPage} />
            </div>
          )}
        </section>
      </main>
    </CommunityPage>
  );
};
