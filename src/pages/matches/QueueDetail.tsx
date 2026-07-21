import { useEffect, useState, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  CalendarRange,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  Plus,
  X,
  ChevronLeft,
  LogOut,
  MessageSquare,
  Play,
  Check,
  Building,
  Navigation
} from 'lucide-react';
import {
  getMyQueues,
  getPublicQueues,
  joinPublicQueue,
  approvePublicQueueRequest,
  rejectPublicQueueRequest,
  cancelQueue,
  resumeQueue,
  type QueueStatusResponse,
  type QueuePlayerResponse
} from '../../api/matchmaking';
import { searchMatchVenues, type MatchPreferredVenue } from '../../api/matches';
import { getFriends, type CommunityFriend } from '../../api/community';
import { getMyProfile } from '../../api/profile';
import { useAuth } from '../../auth/AuthContext';
import { ModalDialog } from '../../components/ui/ModalDialog';
import { useToast } from '../../components/ui/ToastRegion';
import { CommunityPage } from '../community/CommunityUI';
import { getCourtAvailability, type CourtAvailability } from '../../api/booking';
import { MapContainer, TileLayer, Marker, Popup as LeafletPopup } from 'react-leaflet';
import { divIcon, type LatLngTuple } from 'leaflet';
import 'leaflet/dist/leaflet.css';

const dayOfWeekOrder: Record<string, number> = {
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
  Sunday: 7
};

const longWeekdayMap: Record<string, string> = {
  Monday: 'Thứ 2',
  Tuesday: 'Thứ 3',
  Wednesday: 'Thứ 4',
  Thursday: 'Thứ 5',
  Friday: 'Thứ 6',
  Saturday: 'Thứ 7',
  Sunday: 'Chủ Nhật'
};

const normalizeDayOfWeek = (day: string | number): string => {
  const dayStr = String(day).trim();
  const numericMap: Record<string, string> = {
    '0': 'Sunday',
    '1': 'Monday',
    '2': 'Tuesday',
    '3': 'Wednesday',
    '4': 'Thursday',
    '5': 'Friday',
    '6': 'Saturday'
  };
  return numericMap[dayStr] || dayStr;
};

const parseTimeToMinutes = (timeStr: string) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const formatDuration = (totalSecs: number) => {
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  const hStr = h > 0 ? `${h}h ` : '';
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');

  return `${hStr}${mStr}:${sStr}`;
};

const dateLabel = (value: string) => {
  try {
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(`${value}T00:00:00`));
  } catch {
    return value;
  }
};

export const QueueDetail = () => {
  const { id } = useParams();
  const queueId = Number(id);
  const navigate = useNavigate();
  const { token, user } = useAuth();
  const notify = useToast();

  const [queue, setQueue] = useState<QueueStatusResponse | null>(null);
  const [venues, setVenues] = useState<MatchPreferredVenue[]>([]);
  const [friends, setFriends] = useState<CommunityFriend[]>([]);
  const [myPlayerId, setMyPlayerId] = useState<number | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedPopupVenue, setSelectedPopupVenue] = useState<MatchPreferredVenue | null>(null);
  const [courtAvailability, setCourtAvailability] = useState<CourtAvailability | null>(null);
  const [isLoadingCourts, setIsLoadingCourts] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [error, setError] = useState('');

  const loadQueue = async () => {
    if (!token || !queueId) {
      setIsLoading(false);
      return;
    }
    setError('');
    try {
      const [myQueues, publicQueues] = await Promise.all([
        getMyQueues(token).catch(() => []),
        getPublicQueues(token).catch(() => [])
      ]);

      const foundQueue =
        myQueues.find((q) => q.matchmakingQueueId === queueId) ||
        publicQueues.find((q) => q.matchmakingQueueId === queueId);

      if (foundQueue) {
        if (foundQueue.matchId) {
          navigate(`/matches/${foundQueue.matchId}`, { replace: true });
          return;
        }
        setQueue(foundQueue);
        if (foundQueue.sharedVenues) {
          const venueIds = foundQueue.sharedVenues.split(',').map(Number);
          const allVenues = await searchMatchVenues({
            radiusKm: 10,
            latitude: foundQueue.searchLatitude ?? undefined,
            longitude: foundQueue.searchLongitude ?? undefined,
            province: foundQueue.province ?? undefined,
            ward: foundQueue.ward ?? undefined
          });
          const filtered = allVenues.filter((v) => venueIds.includes(v.venueId));
          setVenues(filtered);
        }
      } else {
        setError('Không tìm thấy lời mời ghép trận này hoặc bạn không có quyền xem.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải chi tiết lời mời ghép trận.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQueue();
  }, [queueId, token]);

  useEffect(() => {
    if (token) {
      getFriends(token)
        .then((res) => setFriends(res))
        .catch((err) => console.error('Failed to load friends', err));

      getMyProfile(token)
        .then((p) => setMyPlayerId(p.playerId ?? null))
        .catch((err) => console.error('Failed to load profile', err));
    }
  }, [token]);

  useEffect(() => {
    if (selectedPopupVenue && token) {
      setIsLoadingCourts(true);
      setCourtAvailability(null);
      const todayStr = new Date().toISOString().split('T')[0];
      getCourtAvailability(selectedPopupVenue.venueId, todayStr, token)
        .then((res) => setCourtAvailability(res))
        .catch((err) => console.error('Failed to load court availability', err))
        .finally(() => setIsLoadingCourts(false));
    }
  }, [selectedPopupVenue, token]);

  useEffect(() => {
    if (!queue || !queue.isActive || !queue.updatedAt) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      let dateStr = queue.updatedAt!;
      // Append 'Z' to parse the database UTC string correctly if no timezone offsets exist
      if (!dateStr.endsWith('Z') && !dateStr.includes('+') && !dateStr.includes('-')) {
        dateStr += 'Z';
      }
      const updatedTime = new Date(dateStr).getTime();
      const now = Date.now();
      const diffMs = now - updatedTime;
      setElapsedSeconds(Math.max(0, Math.floor(diffMs / 1000)));
    };

    updateTimer();

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [queue?.isActive, queue?.updatedAt]);

  const handleJoin = async () => {
    if (!token || !queueId) return;
    setIsActionBusy(true);
    try {
      await joinPublicQueue(token, queueId);
      notify('Đã gửi yêu cầu, chờ chủ phòng duyệt.', 'success');
      void loadQueue();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể tham gia hàng chờ này.', 'error');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleReviewRequest = async (playerId: number, approve: boolean) => {
    if (!token || !queueId) return;
    const playerName = queue?.queuePlayers.find((player) => player.playerId === playerId)?.playerName ?? 'người chơi này';
    if (!window.confirm(`${approve ? 'Chấp nhận' : 'Từ chối'} yêu cầu tham gia của ${playerName}?`)) return;

    setIsActionBusy(true);
    try {
      await (approve
        ? approvePublicQueueRequest(token, queueId, playerId)
        : rejectPublicQueueRequest(token, queueId, playerId));
      notify(approve ? 'Đã chấp nhận yêu cầu tham gia.' : 'Đã từ chối yêu cầu tham gia.', 'success');
      void loadQueue();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể cập nhật yêu cầu.', 'error');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleLeaveOrCancel = async () => {
    if (!token || !queue) return;
    const isHost = queue.queuePlayers.find((p) => String(p.playerId) === user?.id || p.playerId === myPlayerId || p.playerName === user?.name)?.isHost;
    const msg = isHost
      ? 'Bạn là chủ hàng chờ, hủy hàng chờ sẽ giải tán cả nhóm. Bạn có chắc chắn?'
      : 'Bạn có chắc chắn muốn rời khỏi hàng chờ ghép trận này?';
    if (!window.confirm(msg)) return;

    setIsActionBusy(true);
    try {
      await cancelQueue(token, queueId);
      notify(isHost ? 'Đã hủy hàng chờ thành công!' : 'Đã rời khỏi hàng chờ!', 'success');
      navigate('/my-matches');
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể rời hàng chờ.', 'error');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleResume = async () => {
    if (!token || !queueId) return;
    setIsActionBusy(true);
    try {
      await resumeQueue(token, queueId);
      notify('Đã kích hoạt lại hàng chờ để tiếp tục tìm đối thủ!', 'success');
      void loadQueue();
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Không thể tiếp tục tìm kiếm.', 'error');
    } finally {
      setIsActionBusy(false);
    }
  };

  const handleInviteFriend = (friendName: string) => {
    notify(`Đã gửi lời mời tham gia hàng chờ cho ${friendName}!`, 'success');
    setShowInviteModal(false);
  };

  const approvedPlayers = useMemo(
    () => queue?.queuePlayers.filter((p) => p.status !== 'Pending' && p.status !== 'Rejected') ?? [],
    [queue]
  );
  const pendingRequests = useMemo(() => queue?.queuePlayers.filter((p) => p.status === 'Pending') ?? [], [queue]);
  const myRequest = useMemo(
    () => queue?.queuePlayers.find((p) => String(p.playerId) === user?.id || p.playerId === myPlayerId || p.playerName === user?.name),
    [queue, user, myPlayerId]
  );

  const isMember = useMemo(() => {
    if (!queue || !user) return false;
    return approvedPlayers.some((p) => String(p.playerId) === user.id || p.playerId === myPlayerId || p.playerName === user.name);
  }, [approvedPlayers, user, myPlayerId]);

  const isHost = useMemo(() => {
    if (!queue || !user) return false;
    return approvedPlayers.some((p) => (String(p.playerId) === user.id || p.playerId === myPlayerId || p.playerName === user.name) && p.isHost);
  }, [approvedPlayers, user, myPlayerId]);

  // Calendar visualization
  const calendarComponent = useMemo(() => {
    if (!queue) return null;

    const { replayType, queueSlots } = queue;

    if (replayType === 'Weekly') {
      const selectedWeekdays = new Set(
        queueSlots.map((slot) => normalizeDayOfWeek(slot.dayOfWeek || ''))
      );
      const weekdays = [
        { key: 'Monday', label: 'T2', name: 'Thứ 2' },
        { key: 'Tuesday', label: 'T3', name: 'Thứ 3' },
        { key: 'Wednesday', label: 'T4', name: 'Thứ 4' },
        { key: 'Thursday', label: 'T5', name: 'Thứ 5' },
        { key: 'Friday', label: 'T6', name: 'Thứ 6' },
        { key: 'Saturday', label: 'T7', name: 'Thứ 7' },
        { key: 'Sunday', label: 'CN', name: 'Chủ Nhật' },
      ];

      return (
        <div className="space-y-2">
          <p className="text-[12px] font-extrabold text-[#526158]">Lịch lặp theo tuần</p>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-[#d8e4d4] bg-[#fbfdfa] p-4 shadow-sm">
            {weekdays.map((day) => {
              const isActive = selectedWeekdays.has(day.key);
              return (
                <div
                  key={day.key}
                  className={`flex w-12 flex-col items-center rounded-xl border pb-2 shadow-sm transition-all duration-300 ${isActive
                      ? 'border-[#b9dca8] bg-[#edf5e9] scale-105'
                      : 'border-slate-200 bg-slate-50 opacity-40'
                    }`}
                >
                  <div
                    className={`w-full py-1 text-center text-[10px] font-bold rounded-t-xl text-white ${isActive ? 'bg-[#477313]' : 'bg-slate-400'
                      }`}
                  >
                    {day.label}
                  </div>
                  <div className="mt-2 text-[14px] font-extrabold text-[#0b2228]">
                    {isActive ? '✓' : '-'}
                  </div>
                  <div className="mt-1 text-[8px] font-bold text-slate-500 uppercase">
                    {day.label === 'CN' ? 'Sun' : day.key.slice(0, 3)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (replayType === 'Monthly') {
      const selectedMonthDays = new Set(
        queueSlots.map((slot) => slot.dayOfMonth).filter(Boolean)
      );

      return (
        <div className="space-y-2">
          <p className="text-[12px] font-extrabold text-[#526158]">Lịch lặp theo tháng</p>
          <div className="grid max-w-sm grid-cols-7 gap-1.5 rounded-2xl border border-[#d8e4d4] bg-[#fbfdfa] p-4 shadow-sm">
            {Array.from({ length: 31 }, (_, i) => {
              const dayNum = i + 1;
              const isActive = selectedMonthDays.has(dayNum);
              return (
                <div
                  key={dayNum}
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-[11px] font-bold border transition-all duration-300 ${isActive
                      ? 'border-[#b9dca8] bg-[#edf5e9] text-[#477313] scale-105 shadow-sm'
                      : 'border-slate-100 bg-slate-50/50 text-slate-350'
                    }`}
                >
                  {dayNum}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (replayType === 'Daily') {
      return (
        <div className="space-y-2">
          <p className="text-[12px] font-extrabold text-[#526158]">Tần suất lịch</p>
          <div className="flex w-28 flex-col overflow-hidden rounded-xl border border-primary/20 bg-white shadow-sm">
            <div className="bg-primary py-1 text-center text-[10px] font-bold text-white uppercase">
              Tần suất
            </div>
            <div className="flex flex-col items-center justify-center py-4">
              <span className="text-[14px] font-black text-[#0b2228]">HÀNG NGÀY</span>
              <span className="mt-1 text-[8px] font-semibold text-slate-400">Daily Replay</span>
            </div>
          </div>
        </div>
      );
    }

    // None (One-off / Specific dates)
    const uniqueDates = Array.from(new Set(queueSlots.map((s) => s.specificDate).filter(Boolean)));
    return (
      <div className="space-y-2">
        <p className="text-[12px] font-extrabold text-[#526158]">Ngày diễn ra</p>
        <div className="flex flex-wrap gap-3">
          {uniqueDates.map((dateStr) => {
            const dateObj = new Date(`${dateStr}T00:00:00`);
            const day = dateObj.getDate().toString().padStart(2, '0');
            const monthStr = `Th ${dateObj.getMonth() + 1}`;
            const year = dateObj.getFullYear();
            return (
              <div
                key={dateStr}
                className="flex w-20 flex-col overflow-hidden rounded-xl border border-red-200 bg-white shadow-sm"
              >
                <div className="bg-red-500 py-1 text-center text-[10px] font-bold text-white uppercase">
                  {monthStr}
                </div>
                <div className="flex flex-col items-center justify-center py-2">
                  <span className="text-[20px] font-black leading-none text-[#0b2228]">{day}</span>
                  <span className="mt-1 text-[9px] font-semibold text-slate-400">{year}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [queue]);

  // Clock / Timeline visualization
  const clockComponent = useMemo(() => {
    if (!queue) return null;

    const uniqueTimes = Array.from(
      new Set(queue.queueSlots.map((s) => `${s.timeStart}-${s.timeEnd}`))
    ).map((t) => {
      const [start, end] = t.split('-');
      return { start, end };
    });

    return (
      <div className="space-y-2">
        <p className="text-[12px] font-extrabold text-[#526158]">Khung giờ chơi</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {uniqueTimes.map(({ start, end }) => {
            const startMin = parseTimeToMinutes(start);
            const endMin = parseTimeToMinutes(end);
            const leftPercent = (startMin / 1440) * 100;
            const widthPercent = ((endMin - startMin) / 1440) * 100;

            return (
              <div
                key={`${start}-${end}`}
                className="space-y-3 rounded-2xl border border-[#d8e4d4] bg-[#fbfdfa] p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-8 w-8 place-items-center rounded-lg bg-[#edf5e9] text-[#477313]">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[14px] font-black text-[#0b2228]">
                      {start} - {end}
                    </p>
                    <p className="text-[10px] font-semibold text-slate-400">Giờ hoạt động</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative h-2.5 w-full overflow-hidden rounded-full border border-slate-200/50 bg-slate-100">
                    <div
                      className="absolute h-full bg-gradient-to-r from-[#477313] to-[#e2ff57] rounded-full"
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    />
                  </div>
                  <div className="flex justify-between px-0.5 text-[8px] font-extrabold text-slate-400">
                    <span>00:00</span>
                    <span>06:00</span>
                    <span>12:00</span>
                    <span>18:00</span>
                    <span>24:00</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }, [queue]);

  if (isLoading) {
    return (
      <CommunityPage>
        <div className="mx-auto mt-24 max-w-md rounded-2xl border border-[#d8e4d4] bg-white p-8 text-center text-[13px] font-bold text-[#526158] shadow-sm animate-pulse">
          Đang tải thông tin hàng chờ ghép trận...
        </div>
      </CommunityPage>
    );
  }

  if (error || !queue) {
    return (
      <CommunityPage>
        <div className="mx-auto mt-16 max-w-lg space-y-4 text-center">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-[13px] font-bold text-red-700 shadow-sm">
            {error || 'Không tìm thấy lời mời ghép trận này.'}
          </div>
          <Link
            to="/my-matches"
            className="community-button-secondary inline-flex items-center gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" /> Quay lại phòng của tôi
          </Link>
        </div>
      </CommunityPage>
    );
  }

  // Create one slot card for each configured player.
  const totalSlots = queue.playerCount ?? (queue.matchType === '1vs1' ? 2 : 4);
  const slotsList = Array.from({ length: totalSlots }, (_, i) => approvedPlayers[i] || null);

  return (
    <CommunityPage>
      {/* Header Panel */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 text-white shadow-xl mb-6"
        style={{
          background: 'linear-gradient(135deg, #0b2228 0%, #173b43 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <Link
              to="/my-matches"
              className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-wider text-[#e2ff57] hover:underline"
            >
              <ChevronLeft className="h-4 w-4" /> Quay lại phòng của tôi
            </Link>
            <h1 className="text-[24px] sm:text-[28px] font-black leading-tight">
              Chi tiết lời mời ghép trận
            </h1>
            <p className="text-[13px] leading-relaxed text-white/70 max-w-xl">
              Hàng chờ #{queue.matchmakingQueueId} · Tìm kiếm tự động cặp đấu phù hợp.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            {isMember && queue.conversationId && (
              <Link
                to={`/messages?chat=${queue.conversationId}`}
                className="community-button flex items-center justify-center gap-1.5 !bg-[#477313] hover:!bg-[#588e18] !text-white"
              >
                <MessageSquare className="h-4 w-4" /> Chat nhóm
              </Link>
            )}
            {isMember && !queue.isActive && (
              <button
                type="button"
                disabled={isActionBusy}
                onClick={handleResume}
                className="community-button flex items-center justify-center gap-1.5 !bg-[#e2ff57] !text-[#0b2228] hover:!bg-[#d4f046]"
              >
                <Play className="h-4 w-4" /> Tìm tiếp
              </button>
            )}
            {isMember ? (
              <button
                type="button"
                disabled={isActionBusy}
                onClick={handleLeaveOrCancel}
                className="community-button-secondary !border-red-500/30 !bg-red-500/10 !text-red-400 hover:!bg-red-500/25 hover:!text-red-200"
              >
                <LogOut className="h-4 w-4" /> {isHost ? 'Hủy hàng chờ' : 'Rời hàng chờ'}
              </button>
            ) : myRequest?.status === 'Pending' ? (
              <button type="button" disabled className="community-button-secondary">Chờ chủ phòng duyệt</button>
            ) : myRequest?.status === 'Rejected' ? (
              <button type="button" disabled className="community-button-secondary">Đã bị từ chối</button>
            ) : (
              <button
                type="button"
                disabled={isActionBusy || slotsList.filter(Boolean).length >= totalSlots}
                onClick={handleJoin}
                className="community-button flex items-center justify-center gap-1.5 !bg-[#e2ff57] !text-[#0b2228] hover:!bg-[#d4f046]"
              >
                <Plus className="h-4 w-4" /> Gửi yêu cầu
              </button>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-48 w-48 rounded-full bg-gradient-to-br from-white/10 to-transparent blur-2xl pointer-events-none" />
      </div>

      <main className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Left Side: General Info & Visual Schedule */}
        <div className="lg:col-span-8 space-y-6">
          {/* Main Info Card */}
          <section className="community-panel p-5 space-y-5">
            <div className="flex items-center gap-3 border-b border-[#e2eae0] pb-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b2228] text-[#e2ff57]">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[17px] font-extrabold text-[#0b2228]">Thông tin cơ bản</h2>
                <p className="text-[11px] font-semibold text-[#718077]">Chi tiết cấu hình ghép trận</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Hình thức</p>
                <p className="mt-1 text-[16px] font-extrabold text-[#0b2228]">{queue.matchType}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Lobby {totalSlots} người chơi</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase">Trình độ yêu cầu</p>
                <p className="mt-1 text-[16px] font-extrabold text-[#0b2228]">⭐ Level {queue.minSkillLevel ?? 1}-{queue.maxSkillLevel ?? 5}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Khoảng trình độ đã chọn</p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase">Trạng thái tìm</p>
                  <span
                    className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold ${queue.isActive
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                  >
                    <span
                      className={`mr-1.5 h-1.5 w-1.5 rounded-full ${queue.isActive ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                        }`}
                    />
                    {queue.isActive ? 'Đang tìm đối thủ' : 'Đang tạm dừng'}
                  </span>
                </div>
                {queue.isActive && elapsedSeconds > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-between">
                    <span className="text-[9px] font-bold text-[#718077] uppercase">Thời gian tìm:</span>
                    <span className="text-[12px] font-mono font-black text-[#477313] animate-pulse">
                      ⏳ {formatDuration(elapsedSeconds)}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 mt-1">Hàng chờ {queue.isPublic ? 'Công khai' : 'Riêng tư'}</p>
              </div>
            </div>

            {/* Region Details */}
            <div className="rounded-2xl border border-[#d8e4d4] bg-[#fbfdfa] p-4 flex gap-4 items-start shadow-sm">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#edf5e9] text-[#477313] shrink-0">
                <MapPin className="h-5 w-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <p className="text-[12px] font-extrabold text-[#526158]">Khu vực tìm kiếm</p>
                <p className="text-[15px] font-black text-[#0b2228] truncate">
                  {queue.province
                    ? `${queue.ward ? `${queue.ward}, ` : ''}${queue.province}`
                    : 'Định vị GPS tự động'}
                </p>
                <p className="text-[11px] font-semibold text-slate-400">
                  Tìm sân chơi trong bán kính {queue.searchRadiusKm} km
                </p>
              </div>
            </div>
          </section>

          {/* Preferred Venues Panel */}
          <section className="community-panel p-5 space-y-4">
            <div className="flex items-center gap-3 border-b border-[#e2eae0] pb-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b2228] text-[#e2ff57]">
                <Building className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[17px] font-extrabold text-[#0b2228]">Sân ưu tiên</h2>
                <p className="text-[11px] font-semibold text-[#718077]">
                  {venues.length} cụm sân đã chọn · Ấn vào sân để xem chi tiết & bản đồ
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {venues.map((venue) => (
                <button
                  key={venue.venueId}
                  type="button"
                  onClick={() => setSelectedPopupVenue(venue)}
                  className="p-3.5 border border-[#d8e4d4] bg-[#fbfdfa] rounded-2xl shadow-sm hover:border-[#b9dca8] hover:bg-[#edf5e9]/10 transition-colors text-left w-full cursor-pointer group animate-in fade-in duration-300"
                >
                  <strong className="block text-[13px] text-[#0b2228] group-hover:text-[#477313] transition-colors">{venue.venueName}</strong>
                  <span className="mt-1 block text-[11px] leading-relaxed text-slate-500">
                    {venue.address}
                  </span>
                  {venue.distanceKm != null && (
                    <span className="mt-1.5 inline-block text-[10px] font-extrabold text-[#477313]">
                      📍 Cách {venue.distanceKm.toFixed(2)} km
                    </span>
                  )}
                </button>
              ))}
              {venues.length === 0 && (
                <p className="text-center text-[12px] text-slate-400 py-4 font-semibold col-span-2">
                  Chưa chọn cụm sân ưu tiên nào.
                </p>
              )}
            </div>
          </section>

        </div>

        {/* Right Side: Slots */}
        <div className="lg:col-span-4 space-y-6">
          {/* Members Slots Panel */}
          <section className="community-panel p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#e2eae0] pb-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b2228] text-[#e2ff57]">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h2 className="text-[17px] font-extrabold text-[#0b2228]">Thành viên</h2>
                  <p className="text-[11px] font-semibold text-[#718077]">
                    Sức chứa: {slotsList.filter(Boolean).length}/{totalSlots}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {slotsList.map((player, sIdx) => {
                if (player) {
                  return (
                    <div
                      key={player.playerId}
                      className={`flex items-center gap-3 p-3 rounded-2xl bg-white border transition-all duration-300 ${player.isHost
                          ? 'border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.12)] ring-2 ring-amber-400 ring-offset-1'
                          : 'border-[#d8e4d4]'
                        }`}
                    >
                      <span
                        className={`grid h-10 w-10 place-items-center overflow-hidden rounded-xl border font-extrabold text-[13px] ${player.isHost
                            ? 'border-amber-400 bg-amber-50 text-amber-800'
                            : 'border-[#d8e4d4] bg-[#edf5e9] text-[#477313]'
                          }`}
                      >
                        {player.avatarUrl ? (
                          <img
                            src={player.avatarUrl}
                            alt=""
                            decoding="async"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{player.playerName.charAt(0).toUpperCase()}</span>
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[13px] font-bold text-[#0b2228] truncate block">
                            {player.playerName}
                          </span>
                          {player.isHost && (
                            <span className="inline-flex items-center gap-0.5 bg-amber-50 border border-amber-200 text-amber-800 text-[8px] font-bold px-1.5 py-0.5 rounded-full uppercase">
                              Host
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">Thành viên phòng</p>
                      </div>
                    </div>
                  );
                }

                // Empty Slot
                return (
                  <button
                    key={`empty-${sIdx}`}
                    onClick={() => {
                      if (!isMember) {
                        notify('Bạn cần tham gia vào hàng chờ này trước để mời bạn bè.', 'error');
                        return;
                      }
                      setShowInviteModal(true);
                    }}
                    className="flex flex-col items-center justify-center h-20 w-full border-2 border-dashed border-[#b9dca8] hover:border-primary hover:bg-[#edf5e9]/20 bg-[#fbfdfa] rounded-2xl transition-all duration-300 group cursor-pointer"
                  >
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-[#edf5e9] text-[#477313] group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Plus className="h-4 w-4" />
                    </span>
                    <span className="mt-1.5 text-[10px] font-bold text-[#526158] group-hover:text-[#0b2228] transition-colors">
                      Trống · Mời bạn bè
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {isHost && pendingRequests.length > 0 && (
            <section className="community-panel p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-[17px] font-extrabold text-[#0b2228]">Yêu cầu tham gia</h2>
                  <p className="text-[11px] font-semibold text-[#718077]">Chỉ người được chấp nhận mới vào phòng.</p>
                </div>
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-bold text-amber-800">{pendingRequests.length}</span>
              </div>
              {pendingRequests.map((request) => (
                <div key={request.playerId} className="flex items-center justify-between gap-3 rounded-xl border border-[#d8e4d4] bg-[#fbfdfa] p-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <img src={request.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(request.playerName)}&background=edf5e9&color=477313`} alt="" className="h-8 w-8 rounded-full object-cover" />
                    <span className="truncate text-[12px] font-bold text-[#0b2228]">{request.playerName}</span>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" disabled={isActionBusy} onClick={() => void handleReviewRequest(request.playerId, true)} className="rounded-lg bg-[#477313] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#588e18] disabled:opacity-50">Chấp nhận</button>
                    <button type="button" disabled={isActionBusy} onClick={() => void handleReviewRequest(request.playerId, false)} className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-[11px] font-bold text-red-700 hover:bg-red-100 disabled:opacity-50">Từ chối</button>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* Visual Schedule Details */}
          <section className="community-panel p-5 space-y-6">
            <div className="flex items-center gap-3 border-b border-[#e2eae0] pb-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#0b2228] text-[#e2ff57]">
                <CalendarRange className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-[17px] font-extrabold text-[#0b2228]">Thời gian hoạt động</h2>
                <p className="text-[11px] font-semibold text-[#718077]">Trực quan lịch hẹn & khung giờ</p>
              </div>
            </div>

            {calendarComponent}
            {clockComponent}
          </section>
        </div>
      </main>

      {/* Friends Invite Modal */}
      {showInviteModal && (
        <ModalDialog
          aria-labelledby="queue-invite-title"
          className="w-[calc(100%-2rem)] max-w-md bg-transparent shadow-none animate-in fade-in duration-200 backdrop:bg-black/60"
          closeOnBackdrop={false}
          onRequestClose={() => setShowInviteModal(false)}
        >
          <div className="w-full max-w-md rounded-2xl border border-[#d8e4d4] bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2eae0]">
              <h3 className="text-[16px] font-extrabold text-[#0b2228]" id="queue-invite-title">Mời bạn bè</h3>
              <button
                aria-label="Đóng danh sách mời bạn bè"
                onClick={() => setShowInviteModal(false)}
                type="button"
                className="text-slate-400 hover:text-slate-650 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="community-scroll mt-4 max-h-72 overflow-y-auto space-y-2 pr-1">
              {friends.length === 0 ? (
                <p className="text-center text-[13px] text-slate-400 py-8 font-semibold">
                  Bạn chưa kết bạn với ai hoặc không thể tải danh sách.
                </p>
              ) : (
                friends.map((friend) => (
                  <div
                    key={friend.userId}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 hover:bg-[#edf5e9]/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 place-items-center overflow-hidden rounded-xl border border-[#d8e4d4] bg-[#edf5e9] text-[12px] font-extrabold text-[#477313]">
                        {friend.profileImageUrl ? (
                          <img
                            src={friend.profileImageUrl}
                            alt=""
                            decoding="async"
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span>{friend.username.charAt(0).toUpperCase()}</span>
                        )}
                      </span>
                      <span className="text-[13px] font-bold text-[#0b2228]">
                        {friend.username}
                      </span>
                    </div>
                    <button
                      onClick={() => handleInviteFriend(friend.username)}
                      className="community-button !min-h-8 !px-3 !py-1 !text-[11px] flex items-center gap-1"
                    >
                      Mời
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </ModalDialog>
      )}

      {/* Venue Detail Popup Dialog */}
      {selectedPopupVenue && (
        <ModalDialog
          aria-labelledby="queue-venue-title"
          className="w-[calc(100%-2rem)] max-w-2xl bg-transparent shadow-none animate-in fade-in duration-200 backdrop:bg-black/60"
          closeOnBackdrop={false}
          onRequestClose={() => setSelectedPopupVenue(null)}
        >
          <div className="w-full max-w-2xl rounded-2xl border border-[#d8e4d4] bg-white p-5 shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2eae0] shrink-0">
              <div>
                <h3 className="text-[16px] font-extrabold text-[#0b2228]" id="queue-venue-title">{selectedPopupVenue.venueName}</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{selectedPopupVenue.address}</p>
              </div>
              <button
                aria-label="Đóng chi tiết cụm sân"
                type="button"
                onClick={() => setSelectedPopupVenue(null)}
                className="text-[#718077] hover:bg-[#edf5e9] hover:text-[#0b2228] p-1 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 py-4 space-y-4 pr-1 community-scroll">
              {/* Map Section */}
              {selectedPopupVenue.latitude != null && selectedPopupVenue.longitude != null ? (
                <div className="h-60 rounded-xl overflow-hidden border border-[#d8e4d4] shadow-sm relative z-10">
                  <MapContainer
                    center={[selectedPopupVenue.latitude, selectedPopupVenue.longitude] as LatLngTuple}
                    zoom={15}
                    className="h-full w-full"
                    scrollWheelZoom
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker
                      position={[selectedPopupVenue.latitude, selectedPopupVenue.longitude] as LatLngTuple}
                      icon={divIcon({
                        className: '',
                        html: '<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:#477313;border:3px solid white;box-shadow:0 5px 14px rgba(8,29,36,.28);transform:rotate(-45deg);display:grid;place-items:center"><div style="width:8px;height:8px;border-radius:50%;background:#e2ff57"></div></div>',
                        iconAnchor: [15, 30],
                        popupAnchor: [0, -30],
                        iconSize: [30, 30],
                      })}
                    >
                      <LeafletPopup>
                        <strong>{selectedPopupVenue.venueName}</strong>
                        <br />
                        <span>{selectedPopupVenue.address}</span>
                      </LeafletPopup>
                    </Marker>
                  </MapContainer>
                </div>
              ) : (
                <div className="h-32 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[12px] font-semibold text-slate-400">
                  Chưa cấu hình tọa độ cho cụm sân này.
                </div>
              )}

              {/* Sub-courts and Prices */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-[#e2eae0] pb-2">
                  <span className="text-[14px] font-extrabold text-[#0b2228]">Danh sách sân con và giá</span>
                  {courtAvailability && courtAvailability.courts.length > 0 && (
                    <span className="text-[11px] font-bold text-[#477313] bg-[#edf5e9] px-2.5 py-0.5 rounded-full">
                      Khoảng giá: {Math.min(...courtAvailability.courts.map(c => c.hourlyPrice)).toLocaleString('vi-VN')}đ - {Math.max(...courtAvailability.courts.map(c => c.hourlyPrice)).toLocaleString('vi-VN')}đ / giờ
                    </span>
                  )}
                </div>

                {isLoadingCourts ? (
                  <p className="text-center text-[13px] text-slate-500 font-bold py-6 animate-pulse">
                    Đang tải danh sách sân con và giá vé...
                  </p>
                ) : courtAvailability && courtAvailability.courts.length > 0 ? (
                  <div className="grid gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto pr-1 community-scroll">
                    {courtAvailability.courts.map((court) => (
                      <div key={court.courtId} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 flex flex-col justify-between gap-1.5 shadow-sm hover:border-[#b9dca8] transition-colors">
                        <div>
                          <p className="text-[13px] font-extrabold text-[#0b2228]">
                            Sân số {court.courtNumber}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                              {court.courtType}
                            </span>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#edf5e9] text-[#477313]">
                              {court.isIndoor ? 'Trong nhà' : 'Ngoài trời'}
                            </span>
                          </div>
                        </div>
                        <p className="text-[14px] font-black text-[#477313] mt-2">
                          {court.hourlyPrice.toLocaleString('vi-VN')}đ <span className="text-[10px] text-slate-400 font-semibold">/ giờ</span>
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[11px] text-slate-400 py-6 font-semibold border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                    Cụm sân chưa cấu hình danh sách sân con hoặc giá.
                  </p>
                )}
              </div>
            </div>

            <div className="border-t border-[#e2eae0] pt-3 mt-2 flex justify-between items-center shrink-0">
              <a
                href={
                  selectedPopupVenue.latitude != null && selectedPopupVenue.longitude != null
                    ? `https://www.google.com/maps/dir/?api=1&destination=${selectedPopupVenue.latitude},${selectedPopupVenue.longitude}`
                    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${selectedPopupVenue.venueName} ${selectedPopupVenue.address}`
                      )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="community-button !bg-[#4285F4] hover:!bg-[#357AE8] !text-white flex items-center gap-1.5 !min-h-9 !px-4 hover:shadow-md transition-shadow font-extrabold"
              >
                <Navigation className="h-4 w-4" />
                Chỉ đường (Google Maps)
              </a>

              <button
                aria-label="Đóng chi tiết cụm sân"
                type="button"
                onClick={() => setSelectedPopupVenue(null)}
                className="community-button-secondary !min-h-9 !px-4"
              >
                Đóng
              </button>
            </div>
          </div>
        </ModalDialog>
      )}
    </CommunityPage>
  );
};
