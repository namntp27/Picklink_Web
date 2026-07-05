import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CalendarRange,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  Route,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { getCourtAvailability, type AvailabilitySlot, type CourtAvailability } from '../../api/booking';
import {
  acceptMatchInvitation,
  acceptParticipant,
  cancelMatch,
  createMatchBooking,
  declineMatchInvitation,
  getMatchSlotOptions,
  getMatchDetail,
  getMatchMessages,
  joinMatch,
  leaveMatch,
  markMatchReadyToBook,
  rejectParticipant,
  removeParticipant,
  sendMatchMessage,
  unvoteMatchSlot,
  voteMatchSlot,
  type MatchDetailResponse,
  type MatchMessage,
  type MatchParticipant,
  type MatchSlotOption,
} from '../../api/matches';
import { ApiError } from '../../api/client';
import {
  previewBatchPayment,
  submitBatchBankTransfer,
  type BatchPaymentPreview,
} from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { useScheduleRealtime, type ScheduleRealtimeEvent } from '../../hooks/useScheduleRealtime';
import { CommunityHero, CommunityPage } from '../community/CommunityUI';
import { MatchVenueMapDialog } from './components/MatchVenueMapDialog';
import { PlayerProfileDialog } from './components/PlayerProfileDialog';

const statusLabels: Record<MatchDetailResponse['status'], string> = {
  Recruiting: 'Đang tìm người',
  ReadyToBook: 'Sẵn sàng đặt sân',
  BookingPending: 'Đã tạo booking, chờ thanh toán',
  Booked: 'Đã đặt sân',
  Completed: 'Đã hoàn thành',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
};
const paymentStatusLabels: Record<string, string> = {
  Pending: 'Chờ thanh toán',
  WaitingForConfirmation: 'Chờ xác nhận',
  Paid: 'Đã thanh toán',
  Rejected: 'Bị từ chối',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
  Failed: 'Thanh toán lỗi',
};
const paymentStatusClass = (status?: string | null) => {
  if (status === 'Paid') return 'bg-emerald-100 text-emerald-700';
  if (status === 'WaitingForConfirmation') return 'bg-amber-100 text-amber-800';
  if (status === 'Rejected' || status === 'Failed' || status === 'Cancelled' || status === 'Expired') return 'bg-red-100 text-red-700';
  return 'bg-slate-100 text-slate-700';
};

const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(`${value}T00:00:00`));
const dateTimeLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));
const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
});
const approvedStatus = (status: string) => status === 'Approved' || status === 'Accepted';
const timePart = (value: string) => value.slice(11, 16);
const minuteOfDay = (value: string) => {
  const [hour, minute] = value.split(':').map(Number);
  return hour * 60 + minute;
};
const timeFromMinutes = (value: number) => {
  const hours = Math.floor(value / 60).toString().padStart(2, '0');
  const minutes = (value % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};
const unavailableLabel: Record<string, string> = {
  Holding: 'Đang giữ',
  Booked: 'Đã đặt',
  Blocked: 'Đã khóa',
  Maintenance: 'Bảo trì',
  Event: 'Sự kiện',
  Closed: 'Đóng cửa',
};
const slotIdentity = (courtId: number, startTimeValue: string, endTimeValue: string) =>
  `${courtId}|${startTimeValue}|${endTimeValue}`;

export const MatchDetail = () => {
  const { id } = useParams();
  const matchId = Number(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [message, setMessage] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [availability, setAvailability] = useState<CourtAvailability | null>(null);
  const [slotOptions, setSlotOptions] = useState<MatchSlotOption[]>([]);
  const [courtId, setCourtId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [selectedPaymentPlayerIds, setSelectedPaymentPlayerIds] = useState<number[]>([]);
  const [batchPreview, setBatchPreview] = useState<BatchPaymentPreview | null>(null);
  const [showVenueMap, setShowVenueMap] = useState(false);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState<MatchParticipant | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const loadMatch = async () => {
    if (!token || !Number.isInteger(matchId)) return;
    try {
      const result = await getMatchDetail(token, matchId);
      setMatch(result);
      setSelectedVenueId((current) => current ?? result.preferredVenues[0]?.venueId ?? null);
      setBookingDate((current) => current || result.availableDateFrom);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải phòng ghép trận.');
    }
  };

  const loadMessages = async () => {
    if (!token || !match?.conversationId) return;
    try {
      setMessages(await getMatchMessages(token, matchId));
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => { void loadMatch(); }, [matchId, token]);
  useEffect(() => { void loadMessages(); }, [match?.conversationId, token]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [messages]);

  const loadAvailability = async () => {
    if (!selectedVenueId || !bookingDate || match?.status !== 'ReadyToBook') {
      setAvailability(null);
      return;
    }
    try {
      const result = await getCourtAvailability(selectedVenueId, bookingDate, token);
      setAvailability(result);
      setCourtId((current) => result.courts.some((court) => court.courtId === current)
        ? current
        : result.courts[0]?.courtId ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải lịch sân.');
    }
  };

  const loadSlotOptions = async () => {
    if (!token || !selectedVenueId || !bookingDate || match?.status !== 'ReadyToBook') {
      setSlotOptions([]);
      return;
    }
    try {
      const result = await getMatchSlotOptions(token, matchId, selectedVenueId, bookingDate);
      setSlotOptions(result);
    } catch (reason) {
      setSlotOptions([]);
      setError(reason instanceof Error ? reason.message : 'Không thể tải khung giờ rảnh chung.');
    }
  };

  useMatchRealtime((event) => {
    if (event.matchId !== matchId) return;
    if (event.action === 'Expired') {
      navigate('/opponents/create?expired=1', { replace: true });
      return;
    }
    if (event.action === 'MessageSent') {
      void loadMessages();
      return;
    }
    if (event.action === 'SlotVoteChanged') {
      void loadSlotOptions();
      return;
    }
    void loadMatch();
  });

  useEffect(() => {
    void loadAvailability();
  }, [selectedVenueId, bookingDate, match?.status, token]);

  useEffect(() => {
    void loadSlotOptions();
  }, [selectedVenueId, bookingDate, match?.status, token]);

  useEffect(() => {
    if (!match || match.status !== 'BookingPending') {
      setSelectedPaymentPlayerIds([]);
      setBatchPreview(null);
      setReceipt(null);
      return;
    }

    const targets = match.participants.filter((participant) =>
      approvedStatus(participant.status)
      && participant.paymentId
      && participant.paymentStatus === 'Pending');
    if (!targets.length) {
      setSelectedPaymentPlayerIds([]);
      setBatchPreview(null);
      setReceipt(null);
      return;
    }

    const eligibleIds = new Set(targets.map((participant) => participant.playerId));
    setSelectedPaymentPlayerIds((current) => {
      const retained = current.filter((playerId) => eligibleIds.has(playerId));
      if (retained.length) return retained;
      return targets.some((participant) => participant.playerId === match.myPlayerId)
        ? [match.myPlayerId!]
        : [];
    });
  }, [match]);

  const notificationTouchesSelection = (notification: ScheduleRealtimeEvent) => {
    if (!selectedVenueId || !courtId || !startTime || !endTime) return false;
    if (notification.venueId !== selectedVenueId || notification.courtId !== courtId || notification.startTime.slice(0, 10) !== bookingDate) return false;

    const changedStart = minuteOfDay(timePart(notification.startTime));
    const changedEnd = minuteOfDay(timePart(notification.endTime));
    const selectedStart = minuteOfDay(startTime);
    const selectedEnd = minuteOfDay(endTime);
    return selectedStart < changedEnd && selectedEnd > changedStart;
  };

  useScheduleRealtime((notification) => {
    if (notification.venueId !== selectedVenueId || notification.startTime.slice(0, 10) !== bookingDate) return;
    if (notification.action !== 'Deleted' && notificationTouchesSelection(notification)) {
      setStartTime('');
      setEndTime('');
      setError('Khung giờ bạn vừa chọn đã được cập nhật và không còn trống. Vui lòng chọn giờ khác.');
    }
    void loadAvailability();
    void loadSlotOptions();
  });

  const approved = useMemo(
    () => match?.participants.filter((participant) => approvedStatus(participant.status)) ?? [],
    [match],
  );
  const pending = match?.participants.filter((participant) => participant.status === 'Pending') ?? [];
  const invited = match?.participants.filter((participant) => participant.status === 'Invited') ?? [];
  const isApprovedMember = Boolean(match?.isHost || match?.myParticipantStatus && approvedStatus(match.myParticipantStatus));
  const paymentTargets = useMemo(
    () => approved.filter((participant) => participant.paymentId),
    [approved],
  );
  const selectedPaymentKey = useMemo(
    () => [...selectedPaymentPlayerIds].sort((left, right) => left - right).join(','),
    [selectedPaymentPlayerIds],
  );
  const isFull = Boolean(match && approved.length === match.requiredPlayerCount);
  const selectedCourt = availability?.courts.find((court) => court.courtId === courtId);
  const slotOptionLookup = useMemo(
    () => new Map(slotOptions.map((option) =>
      [slotIdentity(option.courtId, option.startTime, option.endTime), option])),
    [slotOptions],
  );
  const slotMinutes = availability?.slotMinutes ?? 30;
  const slotPrice = selectedCourt ? Math.round(selectedCourt.hourlyPrice * slotMinutes / 60) : 0;
  const visibleSlots = useMemo(
    () => availability?.slots
      .filter((slot) => {
        if (slot.courtId !== courtId) return false;
        if (match?.availabilitySlots.length) {
          return match.availabilitySlots.some((declared) =>
            timePart(slot.startTime) >= declared.timeStart
            && timePart(slot.endTime) <= declared.timeEnd);
        }
        return timePart(slot.startTime) >= (match?.preferredTimeStart ?? '00:00')
          && timePart(slot.endTime) <= (match?.preferredTimeEnd ?? '23:59');
      })
      .sort((left, right) => left.startTime.localeCompare(right.startTime)) ?? [],
    [availability, courtId, match?.availabilitySlots, match?.preferredTimeStart, match?.preferredTimeEnd],
  );
  const availableSlots = useMemo(
    () => visibleSlots.filter((slot) => slot.status === 'Available' && new Date(slot.startTime).getTime() > Date.now()),
    [visibleSlots],
  );
  const startOptions = useMemo(
    () => Array.from(new Set(availableSlots.map((slot) => timePart(slot.startTime)))),
    [availableSlots],
  );
  const endOptions = useMemo(() => {
    if (!startTime) return [];
    const startIndex = availableSlots.findIndex((slot) => timePart(slot.startTime) === startTime);
    if (startIndex < 0) return [];
    const values: string[] = [];
    for (let index = startIndex; index < availableSlots.length; index += 1) {
      if (index > startIndex && availableSlots[index].startTime !== availableSlots[index - 1].endTime) break;
      values.push(timePart(availableSlots[index].endTime));
    }
    return values;
  }, [availableSlots, startTime]);
  const selectedSlotStarts = useMemo(() => {
    if (!startTime || !endTime) return [];
    const start = minuteOfDay(startTime);
    const end = minuteOfDay(endTime);
    return visibleSlots
      .filter((slot) => {
        const slotStart = minuteOfDay(timePart(slot.startTime));
        const slotEnd = minuteOfDay(timePart(slot.endTime));
        return slotStart >= start && slotEnd <= end;
      })
      .map((slot) => timePart(slot.startTime));
  }, [visibleSlots, startTime, endTime]);
  const selectedDurationHours = startTime && endTime
    ? Math.max(0, (minuteOfDay(endTime) - minuteOfDay(startTime)) / 60)
    : 0;
  const estimatedTotalAmount = selectedCourt ? Math.round(selectedCourt.hourlyPrice * selectedDurationHours) : 0;
  const estimatedAmountPerPlayer = (match?.requiredPlayerCount ?? 0) > 0
    ? Math.ceil(estimatedTotalAmount / match!.requiredPlayerCount)
    : 0;

  useEffect(() => {
    if (!token || !match?.bookingId || !selectedPaymentKey) {
      setBatchPreview(null);
      return undefined;
    }

    let cancelled = false;
    setBatchPreview(null);
    const payerIds = selectedPaymentKey.split(',').map(Number);
    void previewBatchPayment(token, match.bookingId, payerIds)
      .then((preview) => {
        if (!cancelled) setBatchPreview(preview);
      })
      .catch((reason) => {
        if (cancelled) return;
        setBatchPreview(null);
        setError(reason instanceof Error ? reason.message : 'Không thể tạo mã thanh toán gộp.');
      });
    return () => {
      cancelled = true;
    };
  }, [match?.bookingId, selectedPaymentKey, token]);

  useEffect(() => {
    if (!startTime) return;
    if (!startOptions.includes(startTime)) {
      setStartTime('');
      setEndTime('');
      setError('Khung giờ bạn vừa chọn đã được cập nhật và không còn trống. Vui lòng chọn giờ khác.');
      return;
    }
    if (endTime && !endOptions.includes(endTime)) {
      setEndTime('');
      setError('Khung giờ kết thúc vừa chọn không còn khả dụng. Vui lòng chọn lại.');
    }
  }, [startOptions, endOptions, startTime, endTime]);

  const applySlotSelection = (slotStarts: string[]) => {
    const sorted = [...slotStarts].sort((left, right) => minuteOfDay(left) - minuteOfDay(right));
    if (!sorted.length) {
      setStartTime('');
      setEndTime('');
      return;
    }
    const lastSlot = availableSlots.find((slot) => timePart(slot.startTime) === sorted.at(-1));
    setStartTime(sorted[0]);
    setEndTime(lastSlot ? timePart(lastSlot.endTime) : timeFromMinutes(minuteOfDay(sorted.at(-1)!) + slotMinutes));
  };

  const selectSlot = (slot: AvailabilitySlot) => {
    const slotStart = timePart(slot.startTime);
    const slotEnd = timePart(slot.endTime);
    if (slot.status !== 'Available' || new Date(slot.startTime).getTime() <= Date.now()) return;

    setError('');
    if (!selectedSlotStarts.length) {
      setStartTime(slotStart);
      setEndTime(slotEnd);
      return;
    }

    if (selectedSlotStarts.includes(slotStart)) {
      const sorted = [...selectedSlotStarts].sort((left, right) => minuteOfDay(left) - minuteOfDay(right));
      if (sorted.length === 1) {
        applySlotSelection([]);
      } else if (slotStart === sorted[0]) {
        applySlotSelection(sorted.slice(1));
      } else if (slotStart === sorted.at(-1)) {
        applySlotSelection(sorted.slice(0, -1));
      } else {
        setStartTime(slotStart);
        setEndTime(slotEnd);
      }
      return;
    }

    const candidate = [...selectedSlotStarts, slotStart].sort((left, right) => minuteOfDay(left) - minuteOfDay(right));
    const consecutive = candidate.every((value, index) =>
      index === 0 || minuteOfDay(value) - minuteOfDay(candidate[index - 1]) === slotMinutes);
    if (consecutive) {
      applySlotSelection(candidate);
    } else {
      setStartTime(slotStart);
      setEndTime(slotEnd);
      setError('Chỉ được chọn các slot liên tiếp. Hệ thống đã bắt đầu một lựa chọn mới.');
    }
  };

  const toggleSlotVote = async (option: MatchSlotOption) => {
    if (!token) return;
    setIsBusy(true);
    setError('');
    try {
      const input = {
        courtId: option.courtId,
        startTime: option.startTime,
        endTime: option.endTime,
      };
      const nextOptions = option.isVotedByMe
        ? await unvoteMatchSlot(token, matchId, input)
        : await voteMatchSlot(token, matchId, input);
      setSlotOptions(nextOptions);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật vote khung giờ.');
      await loadSlotOptions();
    } finally {
      setIsBusy(false);
    }
  };


  const run = async (action: () => Promise<unknown>) => {
    setIsBusy(true);
    setError('');
    try {
      await action();
      await loadMatch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể thực hiện thao tác.');
    } finally {
      setIsBusy(false);
    }
  };

  const createBooking = () => {
    if (!token || !courtId || !bookingDate || !startTime || !endTime) {
      setError('Vui lòng chọn đủ cụm sân, sân con, ngày và giờ.');
      return;
    }
    void run(() => createMatchBooking(token, matchId, {
      courtId,
      startTime: `${bookingDate}T${startTime}:00`,
      endTime: `${bookingDate}T${endTime}:00`,
    }));
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !message.trim()) return;
    try {
      const sent = await sendMatchMessage(token, matchId, message.trim());
      setMessages((current) => current.some((item) => item.messageId === sent.messageId)
        ? current
        : [...current, sent]);
      setMessage('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gửi tin nhắn.');
    }
  };

  const pay = async () => {
    if (!token || !match?.bookingId || !receipt || !batchPreview || selectedPaymentPlayerIds.length === 0) {
      setError('Vui lòng chọn thành viên và ảnh biên lai.');
      return;
    }
    setIsBusy(true);
    setError('');
    try {
      await submitBatchBankTransfer(token, match.bookingId!, selectedPaymentPlayerIds, receipt);
      setReceipt(null);
      setSelectedPaymentPlayerIds([]);
      setBatchPreview(null);
      await loadMatch();
    } catch (reason) {
      if (reason instanceof ApiError && reason.status === 409) {
        setReceipt(null);
        setSelectedPaymentPlayerIds([]);
        setBatchPreview(null);
        await loadMatch();
      }
      setError(reason instanceof Error ? reason.message : 'Không thể gửi thanh toán gộp.');
    } finally {
      setIsBusy(false);
    }
  };

  if (!match) {
    return (
      <CommunityPage>
        <div className="community-container">
          <div className="community-panel mx-auto mt-12 max-w-lg p-8 text-center text-[13px] font-bold text-[#526158]">
            {error || 'Đang tải phòng ghép trận...'}
          </div>
        </div>
      </CommunityPage>
    );
  }

  const inputClass = 'community-control';
  const playableSlotLabels = match.availabilitySlots.length > 0
    ? match.availabilitySlots.map((slot) => `${slot.timeStart.slice(0, 5)} - ${slot.timeEnd.slice(0, 5)}`)
    : [`${match.preferredTimeStart.slice(0, 5)} - ${match.preferredTimeEnd.slice(0, 5)}`];

  return (
    <CommunityPage className="match-detail-page">
      <CommunityHero
        backLink={{ label: 'Danh sách lời mời', to: '/opponents' }}
        description={`Chủ phòng: ${match.hostName}${match.note ? ` · ${match.note}` : ''}`}
        icon={ShieldCheck}
        label={`Phòng #${match.matchId}`}
        stats={(
          <div>
              <p className="text-[11px] font-bold text-white/65">Trạng thái</p>
              <p className="mt-2 text-[17px] font-extrabold text-white">{statusLabels[match.status]}</p>
              <p className="mt-1 text-[11px] font-semibold text-white/65">{approved.length}/{match.requiredPlayerCount} thành viên chính thức</p>
          </div>
        )}
        title={match.title}
      />

      <main className="community-container match-detail-shell grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="match-detail-main space-y-5">
          {error && <div className="match-alert" role="alert">{error}</div>}
          {searchParams.get('invite') === 'failed' && (
            <div className="match-alert" role="alert">
              Phòng đã được tạo nhưng chưa gửi được lời mời. Bạn có thể chia sẻ phòng để người chơi gửi yêu cầu tham gia.
            </div>
          )}

          <div className="match-overview-grid">
          <section className="community-panel match-panel match-scope-panel">
            <div className="match-section-heading">
              <div>
                <p className="match-eyebrow">điều kiện ghép trận</p>
                <h2>Phạm vi lời mời</h2>
              </div>
              <span className="match-soft-badge">{match.preferredVenues.length} cụm sân</span>
            </div>
            <div className="match-scope-grid">
              <div className="match-info-tile"><MapPin className="h-4 w-4" /><p>Khu vực</p><strong>{match.ward}, {match.province}</strong><span>Bán kính {match.searchRadiusKm} km</span></div>
              <div className="match-info-tile"><CalendarRange className="h-4 w-4" /><p>Ngày có thể chơi</p><strong>{dateLabel(match.availableDateFrom)}</strong><span>đến {dateLabel(match.availableDateTo)}</span></div>
              <div className="match-info-tile">
                <Clock className="h-4 w-4" />
                <p>Các slot có thể chơi</p>
                <strong>{playableSlotLabels.join(' · ')}</strong>
                <span>{playableSlotLabels.length} khung/ngày</span>
              </div>
              <div className="match-info-tile"><Users className="h-4 w-4" /><p>Trình độ / hình thức</p><strong>Level {match.minSkillLevel}-{match.maxSkillLevel}</strong><span>{match.matchType}</span></div>
            </div>
            <div className="mt-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[12px] font-extrabold text-[#526158]">Cụm sân mong muốn</p>
                {match.preferredVenues.some((venue) =>
                  typeof venue.latitude === 'number'
                  && typeof venue.longitude === 'number') && (
                  <button
                    className="community-button-secondary !min-h-8 !px-2.5 !py-1.5 !text-[10px]"
                    onClick={() => setShowVenueMap(true)}
                    title="Xem vị trí, khoảng cách và lộ trình"
                    type="button"
                  >
                    <Route aria-hidden="true" className="h-3 w-3" />
                    Bản đồ và lộ trình
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">{match.preferredVenues.map((venue) => <span className="community-badge text-[#526158]" key={venue.venueId}>{venue.venueName}</span>)}</div>
            </div>
          </section>

          <section className="community-panel match-panel match-roster-panel">
            <div className="match-section-heading">
              <div><p className="match-eyebrow">đội hình ghép trận</p><h2>Thành viên</h2></div>
              <span className="match-count-pill">{approved.length}/{match.requiredPlayerCount}</span>
            </div>

            {match.isHost && pending.length > 0 && (
              <div className="mt-3 space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2">
                <p className="text-[11px] font-bold text-amber-900">Chờ duyệt ({pending.length})</p>
                {pending.map((participant) => (
                  <div className="flex items-center justify-between gap-2 rounded-md bg-white p-2" key={participant.participantId}>
                    <div className="min-w-0"><p className="truncate text-[11px] font-bold">{participant.playerName}</p><p className="text-[10px] text-on-surface-variant">Level {participant.skillLevel.toFixed(1)}</p></div>
                    <div className="flex shrink-0 gap-1">
                      <button className="grid h-7 w-7 place-items-center rounded-md border border-red-300 text-red-700" disabled={isBusy} onClick={() => token && void run(() => rejectParticipant(token, matchId, participant.participantId))} title="Từ chối" type="button"><X className="h-3.5 w-3.5" /></button>
                      <button aria-label={`Chấp nhận ${participant.playerName}`} className="community-button h-7 w-7 !min-h-7 !p-0" disabled={isBusy} onClick={() => token && void run(() => acceptParticipant(token, matchId, participant.participantId))} title="Chấp nhận" type="button"><Check className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {match.isHost && invited.length > 0 && (
              <div className="mt-3 border-y border-[#d8e4d4] py-2.5">
                <p className="text-[11px] font-extrabold text-[#0b2228]">Đang chờ phản hồi ({invited.length})</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {invited.map((participant) => (
                    <span className="community-badge !min-h-5 !px-1.5 !py-1 !text-[9px] text-[#526158]" key={participant.participantId}>
                      {participant.playerName} · Level {participant.skillLevel.toFixed(1)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="match-member-grid">
              {approved.map((participant) => {
                const roleLabel = participant.isHost ? 'Chủ phòng' : 'Thành viên';
                const isCurrentPlayer = match.myPlayerId === participant.playerId;
                return (
                  <article
                    aria-label={`${participant.isHost ? 'Chủ phòng' : 'Thành viên'}: ${participant.playerName}`}
                    className={`match-member-card ${participant.isHost ? 'match-member-card--host' : 'match-member-card--participant'}`}
                    key={participant.participantId}
                  >
                    <button
                      aria-label={`Xem thông tin ${participant.playerName}`}
                      className="match-member-avatar overflow-hidden transition-transform hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313]"
                      onClick={() => setSelectedProfilePlayer(participant)}
                      title="Xem thông tin người chơi"
                      type="button"
                    >
                      {participant.avatarUrl
                        ? <img alt="" className="h-full w-full object-cover" src={participant.avatarUrl} />
                        : participant.playerName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span className={`match-role-badge ${participant.isHost ? 'match-role-badge--host' : 'match-role-badge--participant'}`}>
                          {participant.isHost ? <ShieldCheck className="h-3.5 w-3.5" /> : <Users className="h-3.5 w-3.5" />}
                          {roleLabel}
                        </span>
                        {isCurrentPlayer && <span className="match-self-badge">Bạn</span>}
                      </div>
                      <button
                        className="block max-w-full truncate text-left text-[12px] font-bold hover:text-[#477313] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#477313]"
                        onClick={() => setSelectedProfilePlayer(participant)}
                        title={`Xem thông tin ${participant.playerName}`}
                        type="button"
                      >
                        {participant.playerName}
                      </button>
                      <p className="text-[10px] text-on-surface-variant">Level {participant.skillLevel.toFixed(1)}</p>
                    </div>
                    {match.bookingId && isApprovedMember && participant.paymentStatus && (
                      <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${paymentStatusClass(participant.paymentStatus)}`}>
                        {participant.paymentStatus === 'Paid' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {paymentStatusLabels[participant.paymentStatus] ?? participant.paymentStatus}
                      </span>
                    )}
                    {match.isHost && !participant.isHost && match.status !== 'BookingPending' && match.status !== 'Booked' && (
                      <button className="grid h-7 w-7 shrink-0 place-items-center text-red-600" disabled={isBusy} onClick={() => token && void run(() => removeParticipant(token, matchId, participant.participantId))} title="Loại thành viên" type="button"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
          </div>

          {isApprovedMember && match.status === 'ReadyToBook' && (
            <section className="community-panel match-panel match-schedule-panel">
              <div className="match-section-heading">
                <div>
                  <p className="match-eyebrow">giữ sân</p>
                  <h2>Chọn lịch và tạo booking</h2>
                  <p>Chọn các slot liền nhau trong phạm vi lời mời. Chủ phòng hoặc thành viên đã được duyệt đều có thể tạo booking.</p>
                  <p>Dùng chat để thảo luận, vote các slot rảnh chung rồi tạo booking khi cả nhóm chốt.</p>
                </div>
                <span className="match-soft-badge">{startTime && endTime ? `${startTime} - ${endTime}` : 'Chưa chọn'}</span>
              </div>
              <div className="match-booking-form">
                <label><span className="mb-1 block text-[13px] font-bold">Cụm sân</span><select className={inputClass} onChange={(event) => { setSelectedVenueId(Number(event.target.value)); setCourtId(null); setStartTime(''); setEndTime(''); }} value={selectedVenueId ?? ''}>{match.preferredVenues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select></label>
                <label>
                  <span className="mb-1 block text-[13px] font-bold">Ngày chơi chính xác</span>
                  <input className={inputClass} max={match.availableDateTo} min={match.availableDateFrom} onChange={(event) => { setBookingDate(event.target.value); setStartTime(''); setEndTime(''); }} type="date" value={bookingDate} />
                </label>
                <label><span className="mb-1 block text-[13px] font-bold">Sân con</span><select className={inputClass} onChange={(event) => { setCourtId(Number(event.target.value)); setStartTime(''); setEndTime(''); }} value={courtId ?? ''}><option value="">Chọn sân</option>{availability?.courts.map((court) => <option key={court.courtId} value={court.courtId}>Sân {court.courtNumber} · {court.courtType} · {currency.format(court.hourlyPrice)}/giờ</option>)}</select></label>
                <div className="match-selected-time">
                  <p className="text-[12px] font-bold text-[#526158]">Khung giờ đã chọn</p>
                  <p className="mt-1 text-[15px] font-extrabold text-[#0b2228]">{startTime && endTime ? `${startTime} - ${endTime}` : 'Chưa chọn slot'}</p>
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-[#0b2228]">Slot khả dụng ({slotMinutes} phút/slot)</span>
                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-full border border-[#b9dca8] bg-[#eef8e6] px-2 py-1 text-primary">Trống</span>
                      <span className="rounded-full border border-[#0b2228] bg-[#0b2228] px-2 py-1 text-white">Đã chọn</span>
                      <span className="rounded-full border border-[#d8e4d4] bg-white px-2 py-1 text-[#8a968f]">Không khả dụng</span>
                    </div>
                  </div>
                  <div className="match-slot-grid">
                    {visibleSlots.map((slot) => {
                      const slotTime = timePart(slot.startTime);
                      const option = slotOptionLookup.get(slotIdentity(slot.courtId, slot.startTime, slot.endTime));
                      const selected = selectedSlotStarts.includes(slotTime);
                      const past = new Date(slot.startTime).getTime() <= Date.now();
                      const disabled = slot.status !== 'Available' || past;
                      const compatible = Boolean(option?.isCompatibleForAll);
                      const voted = Boolean(option?.isVotedByMe);
                      const className = selected
                        ? 'match-slot-button--selected'
                        : disabled
                          ? 'cursor-not-allowed border-[#d8e4d4] bg-white text-[#98a39d]'
                          : compatible
                            ? 'match-slot-button--compatible'
                            : 'border-[#b9dca8] bg-[#eef8e6] text-primary hover:border-primary hover:bg-[#e2ff57] hover:text-[#102414]';
                      return (
                        <div className="match-slot-card" key={`${slot.courtId}-${slot.startTime}`}>
                          <button
                            className={`match-slot-button ${className} ${voted ? 'match-slot-button--voted' : ''}`}
                            disabled={disabled}
                            onClick={() => selectSlot(slot)}
                            title={past ? 'Đã qua' : unavailableLabel[slot.status] ?? 'Còn trống'}
                            type="button"
                          >
                            <span className="block">{slotTime}</span>
                            <span className="mt-0.5 block text-[10px] font-bold opacity-75">{disabled ? (past ? 'Đã qua' : unavailableLabel[slot.status] ?? slot.status) : currency.format(slotPrice)}</span>
                            {compatible && option && (
                              <span className="match-slot-vote-meta">
                                Rảnh {option.compatiblePlayerCount}/{option.requiredPlayerCount}
                                {option.voteCount > 0 ? ` · ${option.voteCount} vote` : ''}
                              </span>
                            )}
                          </button>
                          {compatible && option && (
                            <button
                              className="match-slot-vote-button"
                              disabled={isBusy}
                              onClick={() => void toggleSlotVote(option)}
                              type="button"
                            >
                              {option.isVotedByMe ? 'Bỏ vote' : 'Vote slot này'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {!visibleSlots.length && <p className="rounded-xl bg-[#f7faf5] p-4 text-center text-[13px] font-bold text-[#718077]">Không có slot phù hợp với ngày và sân đã chọn.</p>}
                </div>
              </div>
              {selectedCourt && (
                <div className="match-price-summary">
                  <div><p className="text-[11px] font-bold text-[#718077]">Giá slot {slotMinutes} phút</p><p className="mt-1 font-extrabold text-[#0b2228]">{currency.format(slotPrice)}</p></div>
                  <div><p className="text-[11px] font-bold text-[#718077]">Tổng tiền sân</p><p className="mt-1 font-extrabold text-[#0b2228]">{selectedDurationHours ? currency.format(estimatedTotalAmount) : 'Chưa chọn giờ'}</p></div>
                  <div><p className="text-[11px] font-bold text-[#718077]">Dự kiến mỗi người</p><p className="mt-1 font-extrabold text-primary">{selectedDurationHours ? currency.format(estimatedAmountPerPlayer) : 'Chưa chọn giờ'}</p></div>
                </div>
              )}
              <button className="community-button mt-4 w-full" disabled={isBusy || !courtId || !startTime || !endTime} onClick={createBooking} type="button"><CreditCard className="h-4 w-4" /> Tạo booking và chuyển sang thanh toán</button>
            </section>
          )}

          {match.bookingId && (
            <section className="community-panel match-panel match-booking-card">
              <div className="match-section-heading">
                <div><p className="match-eyebrow">booking đã tạo</p><h2>Booking đã chọn</h2></div>
                <span className="match-soft-badge">{statusLabels[match.status]}</span>
              </div>
              <div className="match-booking-grid">
                <div><p>Sân</p><strong>{match.venueName} · Sân {match.courtNumber}</strong><span>{match.address}</span></div>
                <div><p>Thời gian</p><strong>{match.startTime && dateTimeLabel(match.startTime)}</strong><span>Đến {match.endTime && dateTimeLabel(match.endTime)}</span></div>
                <div><p>Chi phí</p><strong>{currency.format(match.amountPerPlayer)}/người</strong><span>Tổng {currency.format(match.totalBookingAmount)}</span></div>
              </div>
            </section>
          )}
        </div>

        <aside className="match-aside space-y-4 lg:sticky lg:top-20 lg:self-start">
          {match.checkInCode && isApprovedMember && (
            <section className="match-checkin-card">
              <p className="match-eyebrow">check-in tại sân</p>
              <h3>Mã check-in</h3>
              <div className="match-checkin-code">{match.checkInCode}</div>
              <p>Xuất trình mã này cho nhân viên sân khi tới giờ chơi. Mã chỉ hiển thị sau khi booking hợp lệ.</p>
            </section>
          )}

          {!(match.checkInCode && isApprovedMember) && (
            <section className="community-panel match-side-panel">
              <h3 className="text-[18px] font-bold">Thao tác</h3>
              {!match.isHost && match.myParticipantStatus === 'Invited' && match.status === 'Recruiting' && (
                <div className="mt-4 border-y border-[#cfe0c8] py-4">
                  <p className="text-center text-[13px] font-extrabold text-[#0b2228]">Bạn được mời tham gia trận này</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="community-button-secondary" disabled={isBusy} onClick={() => token && void run(() => declineMatchInvitation(token, matchId))} type="button">
                      <X className="h-4 w-4" /> Từ chối
                    </button>
                    <button className="community-button" disabled={isBusy} onClick={() => token && void run(() => acceptMatchInvitation(token, matchId))} type="button">
                      <Check className="h-4 w-4" /> Chấp nhận
                    </button>
                  </div>
                </div>
              )}
              {!match.isHost && !isApprovedMember && match.myParticipantStatus !== 'Pending' && match.myParticipantStatus !== 'Invited' && match.status === 'Recruiting' && (
                <button className="community-button mt-4 w-full" disabled={isBusy} onClick={() => token && void run(() => joinMatch(token, matchId))} type="button"><UserCheck className="h-4 w-4" /> Yêu cầu tham gia</button>
              )}
              {!match.isHost && match.myParticipantStatus === 'Pending' && <div className="mt-4 rounded-lg bg-amber-50 p-3 text-center text-[13px] font-bold text-amber-800">Đang chờ chủ phòng duyệt</div>}
              {!match.isHost && (match.myParticipantStatus === 'Pending' || isApprovedMember) && match.status !== 'BookingPending' && match.status !== 'Booked' && (
                <button className="community-button-secondary mt-3 w-full" disabled={isBusy} onClick={() => token && void run(() => leaveMatch(token, matchId))} type="button"><XCircle className="h-4 w-4" /> Rút yêu cầu / rời phòng</button>
              )}
              {match.isHost && match.status === 'Recruiting' && isFull && (
                <button className="community-button mt-4 w-full" disabled={isBusy} onClick={() => token && void run(() => markMatchReadyToBook(token, matchId))} type="button"><ShieldCheck className="h-4 w-4" /> Chuyển sang sẵn sàng đặt sân</button>
              )}
              {match.isHost && ['Recruiting', 'ReadyToBook', 'BookingPending'].includes(match.status) && (
                <button className="community-button-danger mt-3 w-full" disabled={isBusy} onClick={() => token && window.confirm('Hủy phòng ghép trận này?') && void run(() => cancelMatch(token, matchId))} type="button"><XCircle className="h-4 w-4" /> Hủy phòng</button>
              )}
            </section>
          )}

          {match.status === 'BookingPending' && isApprovedMember && (
            <section className="community-panel match-payment-card">
              <p className="match-eyebrow">thanh toán</p>
              <h3 className="flex items-center gap-2 text-[18px] font-bold"><CreditCard className="h-5 w-5 text-primary" /> Thanh toán booking</h3>
              <div className="match-payment-amount">
                <span>{selectedPaymentPlayerIds.length} phần đã chọn</span>
                <strong>{batchPreview ? currency.format(batchPreview.totalAmount) : '—'}</strong>
              </div>
              {paymentTargets.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-[12px] font-bold text-on-surface-variant">Chọn các thành viên bạn muốn thanh toán cùng lúc</p>
                  {paymentTargets.map((participant) => {
                    const canSelect = participant.paymentStatus === 'Pending';
                    const isSelected = selectedPaymentPlayerIds.includes(participant.playerId);
                    return (
                      <label
                        className={`flex items-start gap-3 rounded-lg border p-3 ${isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant'} ${canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-70'}`}
                        key={participant.playerId}
                      >
                        <input
                          checked={isSelected}
                          className="mt-1 h-4 w-4 accent-primary"
                          disabled={!canSelect || isBusy}
                          onChange={(event) => {
                            setSelectedPaymentPlayerIds((current) => event.target.checked
                              ? [...current, participant.playerId]
                              : current.filter((playerId) => playerId !== participant.playerId));
                            setReceipt(null);
                          }}
                          type="checkbox"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="flex flex-wrap items-center justify-between gap-2">
                            <strong className="text-[13px]">{participant.playerName}</strong>
                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${paymentStatusClass(participant.paymentStatus)}`}>
                              {paymentStatusLabels[participant.paymentStatus ?? ''] ?? participant.paymentStatus ?? 'Chưa có trạng thái'}
                            </span>
                          </span>
                          <span className="mt-1 block text-[12px] text-on-surface-variant">
                            {currency.format(match.amountPerPlayer)}
                          </span>
                          {participant.paymentStatus === 'Pending' && participant.paymentRejectionReason && (
                            <span className="mt-2 block text-[12px] font-bold text-red-700">
                              Lần gửi trước bị từ chối: {participant.paymentRejectionReason}
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
              {paymentTargets.length === 0 && (
                <p className="mt-3 rounded-lg bg-amber-50 p-3 text-center text-[13px] font-bold text-amber-800">
                  Chưa có khoản thanh toán nào cho nhóm chơi này.
                </p>
              )}
              {selectedPaymentPlayerIds.length > 0 && !batchPreview && (
                <p className="mt-3 rounded-lg bg-surface-container-low p-3 text-center text-[12px] font-bold text-on-surface-variant">
                  Đang tạo mã QR cho giao dịch gộp...
                </p>
              )}
              {batchPreview && (
                <>
                  <p className="mt-3 rounded-lg bg-surface-container-low p-3 text-center text-[12px]">
                    Thanh toán một lần cho <strong>{batchPreview.memberNames.join(', ')}</strong>.
                  </p>
                  <img alt="QR thanh toán gộp" className="mx-auto mt-4 w-full max-w-[250px] rounded-lg border" src={batchPreview.qrImageUrl} />
                  <p className="mt-3 rounded-lg bg-surface-container-low p-3 text-center text-[12px]">
                    Nội dung: <strong>{batchPreview.transferContent}</strong>
                  </p>
                  <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-primary p-3 text-center text-[13px] font-bold text-primary">
                    {receipt?.name || 'Chọn một ảnh biên lai'}
                    <input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" />
                  </label>
                  <button className="community-button mt-3 w-full" disabled={!receipt || isBusy || !batchPreview} onClick={() => void pay()} type="button">
                    Gửi thanh toán cho {selectedPaymentPlayerIds.length} người
                  </button>
                </>
              )}
            </section>
          )}

          <section className="community-panel p-4">
            <h3 className="flex items-center gap-2 text-[18px] font-bold"><MessageCircle className="h-5 w-5 text-primary" /> Chat phòng</h3>
            {!match.conversationId ? (
              <p className="mt-3 rounded-lg bg-surface-container-low p-4 text-[13px] leading-6 text-on-surface-variant">
                Chỉ chủ phòng và thành viên đã được duyệt mới truy cập được chat.
              </p>
            ) : (
              <>
                <div ref={messagesContainerRef} className="community-scroll mt-4 max-h-[min(34rem,50dvh)] space-y-3 overflow-y-auto overscroll-contain rounded-xl bg-[#edf5e9] p-3">
                  {messages.map((item) => (
                    <div className={`max-w-[88%] rounded-xl px-3 py-2 text-[12px] leading-5 ${item.isMine ? 'ml-auto bg-[#0b2228] text-white' : 'bg-white'}`} key={item.messageId}>
                      {!item.isMine && <p className="mb-1 text-[11px] font-bold text-primary">{item.senderName}</p>}
                      <p className="whitespace-pre-wrap">{item.content}</p>
                    </div>
                  ))}
                  {messages.length === 0 && <p className="py-6 text-center text-[12px] text-on-surface-variant">Chưa có tin nhắn. Hãy bắt đầu thống nhất sân và lịch chơi.</p>}
                </div>
                <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
                  <input className="community-control min-w-0 flex-1" maxLength={1000} onChange={(event) => setMessage(event.target.value)} placeholder="Nhập tin nhắn..." value={message} />
                  <button aria-label="Gửi tin nhắn" className="community-button h-10 w-10 !p-0" title="Gửi tin nhắn" type="submit"><Send className="h-4 w-4" /></button>
                </form>
              </>
            )}
          </section>

        </aside>
      </main>

      {showVenueMap && (
        <MatchVenueMapDialog
          matchTitle={match.title}
          onClose={() => setShowVenueMap(false)}
          venues={match.preferredVenues}
        />
      )}

      {selectedProfilePlayer && (
        <PlayerProfileDialog
          fallbackAvatarUrl={selectedProfilePlayer.avatarUrl}
          fallbackName={selectedProfilePlayer.playerName}
          onClose={() => setSelectedProfilePlayer(null)}
          playerId={selectedProfilePlayer.playerId}
          roleLabel={selectedProfilePlayer.isHost ? 'Chủ phòng' : 'Thành viên'}
        />
      )}
    </CommunityPage>
  );
};
