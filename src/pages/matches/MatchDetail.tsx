import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  CalendarRange,
  Check,
  ChevronDown,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  Plus,
  Route,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { getCourtAvailabilities, getCourtAvailability, type AvailabilitySlot, type CourtAvailability } from '../../api/booking';
import {
  acceptMatchInvitation,
  acceptParticipant,
  cancelPendingMatchBooking,
  createMatchBooking,
  declineMatchInvitation,
  getMatchSlotOptions,
  getMatchDetail,
  inviteMatchPlayers,
  joinMatch,
  leaveMatch,
  markMatchReadyToBook,
  rejectParticipant,
  removeParticipant,
  searchMatchVenues,
  unvoteMatchSlot,
  updateMatchInvitation,
  voteMatchSlot,
  type MatchDetailResponse,
  type MatchFormat,
  type MatchPreferredVenue,
  type MatchParticipant,
  type MatchSlotOption,
} from '../../api/matches';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { useScheduleRealtime, type ScheduleRealtimeEvent } from '../../hooks/useScheduleRealtime';
import { CommunityHero, CommunityPage } from '../community/CommunityUI';
import { MatchSlotReplacementPanel } from './MatchSlotReplacementPanel';
import { CourtTimelineGrid } from '../courts/components/CourtTimelineGrid';
import { PlayerProfileDialog } from './components/PlayerProfileDialog';
import { ModalDialog } from '../../components/ui/ModalDialog';
import { addCalendarMonths, datesForMonthDuration, formatDateKey, maximumAdvanceBookingMonths } from '../../utils/bookingDateRange';

const MatchVenueMapDialog = lazy(async () => {
  const module = await import('./components/MatchVenueMapDialog');
  return { default: module.MatchVenueMapDialog };
});

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
const dateTimeLabel = (value: string) => `${datePart(value)} · ${timePart(value)}`;
const chatExpiryLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(value));
const datePart = (value: string) => value.slice(0, 10).split('-').reverse().join('/');
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
const invitationTimeOptions = Array.from({ length: 48 }, (_, index) => timeFromMinutes(index * 30));
const slotIdentity = (courtId: number, startTimeValue: string, endTimeValue: string) =>
  `${courtId}|${startTimeValue}|${endTimeValue}`;
type MatchBookingSlotSelection = {
  courtId: number;
  startTime: string;
  endTime: string;
  hourlyPrice: number;
};
type MonthUnavailableSlot = {
  date: string;
  courtId: number;
  courtNumber: number;
  startTime: string;
  endTime: string;
  status: AvailabilitySlot['status'];
};
type ScheduleConflict = {
  playerName: string;
  selectedSlot: {
    venueName: string;
    courtNumber: number;
    startTime: string;
    endTime: string;
  };
  conflictingSlot: {
    venueName: string;
    courtNumber: number;
    startTime: string;
    endTime: string;
  };
};type InvitationDraft = {
  title: string;
  note: string;
  neededPlayerCount: number;
  province: string;
  ward: string;
  searchRadiusKm: number;
  searchLatitude?: number | null;
  searchLongitude?: number | null;
  preferredVenueIds: number[];
  availableDateFrom: string;
  availableDateTo: string;
  preferredTimeStart: string;
  preferredTimeEnd: string;
  availabilitySlots: Array<{ timeStart: string; timeEnd: string }>;
  minSkillLevel: number;
  maxSkillLevel: number;
  matchType: MatchFormat;
};
const maxMatchBookingSlots = 496;
const todayDateKey = () => {
  const today = new Date();
  return [today.getFullYear(), String(today.getMonth() + 1).padStart(2, '0'), String(today.getDate()).padStart(2, '0')].join('-');
};
const maxMatchBookingDate = () => addCalendarMonths(todayDateKey(), maximumAdvanceBookingMonths);
const maximumMonthDurationFrom = (startDate: string) => {
  for (let months = maximumAdvanceBookingMonths; months >= 1; months -= 1) {
    if (addCalendarMonths(startDate, months) <= maxMatchBookingDate()) return months;
  }
  return 0;
};
export const defaultMatchBookingDate = (availableDateFrom: string, availableDateTo: string, today = todayDateKey()) =>
  today >= availableDateFrom && today <= availableDateTo ? today : availableDateFrom;

export const MatchDetail = () => {
  const { id } = useParams();
  const matchId = Number(id);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [availability, setAvailability] = useState<CourtAvailability | null>(null);
  const [slotOptions, setSlotOptions] = useState<MatchSlotOption[]>([]);
  const [selectedSlotsByDate, setSelectedSlotsByDate] = useState<Record<string, MatchBookingSlotSelection[]>>({});
  const [bookingMonths, setBookingMonths] = useState(1);
  const [monthUnavailableSlots, setMonthUnavailableSlots] = useState<MonthUnavailableSlot[]>([]);
  const [showVenueMap, setShowVenueMap] = useState(false);
  const [showBookingRounds, setShowBookingRounds] = useState(false);
  const [showEditBookingConfirmation, setShowEditBookingConfirmation] = useState(false);
  const [showInvitationEditor, setShowInvitationEditor] = useState(false);
  const [invitationDraft, setInvitationDraft] = useState<InvitationDraft>({
    title: '', note: '', neededPlayerCount: 1, province: '', ward: '', searchRadiusKm: 5,
    preferredVenueIds: [], availableDateFrom: '', availableDateTo: '', preferredTimeStart: '',
    preferredTimeEnd: '', availabilitySlots: [], minSkillLevel: 1, maxSkillLevel: 5, matchType: '2vs2',
  });
  const [invitationVenues, setInvitationVenues] = useState<MatchPreferredVenue[]>([]);
  const [isSearchingInvitationVenues, setIsSearchingInvitationVenues] = useState(false);
  const [openInvitationTimePicker, setOpenInvitationTimePicker] = useState<{ slotIndex: number; field: 'start' | 'end' } | null>(null);
  const [selectedProfilePlayer, setSelectedProfilePlayer] = useState<MatchParticipant | null>(null);
  const [bookingClock, setBookingClock] = useState(() => Date.now());
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const canBookAnotherRound = match?.status === 'ReadyToBook' || match?.status === 'Booked';

  const loadMatch = async () => {
    if (!token || !Number.isInteger(matchId)) return;
    try {
      const result = await getMatchDetail(token, matchId);
      const defaultBookingDate = defaultMatchBookingDate(result.availableDateFrom, result.availableDateTo);
      setMatch(result);
      setSelectedVenueId((current) => current ?? result.preferredVenues[0]?.venueId ?? null);
      setBookingDate((current) => current || defaultBookingDate);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải phòng ghép trận.');
    }
  };

  useEffect(() => { void loadMatch(); }, [matchId, token]);

  useEffect(() => {
    const now = Date.now();
    const refreshTimes = [
      match?.status === 'Booked' && match.endTime ? new Date(match.endTime).getTime() + 1_000 : 0,
      ...(match?.bookingCheckIns ?? []).flatMap((booking) => booking.checkInGroups.flatMap((group) => [
        new Date(group.startTime).getTime() - 30 * 60 * 1_000 + 1_000,
        new Date(group.endTime).getTime() + 1_000,
      ])),
    ].filter((time) => time > now);
    const nextRefresh = Math.min(...refreshTimes);
    if (!Number.isFinite(nextRefresh)) return;
    const timeout = window.setTimeout(() => {
      setBookingClock(Date.now());
      void loadMatch();
    }, Math.max(1_000, nextRefresh - now));
    return () => window.clearTimeout(timeout);
  }, [match?.endTime, match?.status, match?.bookingCheckIns]);

  const loadAvailability = async () => {
    if (!selectedVenueId || !bookingDate || !canBookAnotherRound) {
      setAvailability(null);
      return;
    }
    try {
      const result = await getCourtAvailability(selectedVenueId, bookingDate, token);
      setAvailability(result);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải lịch sân.');
    }
  };

  const loadSlotOptions = async () => {
    if (!token || !selectedVenueId || !bookingDate || !canBookAnotherRound) {
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
    if (event.action === 'MessageSent') return;
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


  const notificationTouchesSelection = (notification: ScheduleRealtimeEvent) => {
    if (notification.venueId !== selectedVenueId || notification.startTime.slice(0, 10) !== bookingDate) return false;
    return availability?.slots.some((slot) =>
      selectedSlotKeys.includes(`${slot.courtId}:${timePart(slot.startTime)}`)
      && slot.courtId === notification.courtId
      && slot.startTime < notification.endTime
      && slot.endTime > notification.startTime,
    ) ?? false;
  };

  useScheduleRealtime((notification) => {
    if (notification.venueId !== selectedVenueId || notification.startTime.slice(0, 10) !== bookingDate) return;
    if (notification.action !== 'Deleted' && notificationTouchesSelection(notification)) {
      setSelectedSlotsByDate((current) => {
        const next = { ...current };
        delete next[bookingDate];
        return next;
      });
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
  const isFull = Boolean(match && approved.length === match.requiredPlayerCount);
  const canEditPendingBooking = match?.status === 'BookingPending'
    && approved.length === match.requiredPlayerCount
    && approved.every((participant) => participant.paymentStatus === 'Pending');
  const slotKey = (slot: AvailabilitySlot) => String(slot.courtId) + ":" + timePart(slot.startTime);
  const selectedSlotsForDate = selectedSlotsByDate[bookingDate] ?? [];
  const selectedSlotKeys = selectedSlotsForDate.map((slot) => String(slot.courtId) + ':' + timePart(slot.startTime));
  const unavailableSlotKeysForDate = useMemo(
    () => monthUnavailableSlots.filter((slot) => slot.date === bookingDate)
      .map((slot) => String(slot.courtId) + ':' + timePart(slot.startTime)),
    [bookingDate, monthUnavailableSlots],
  );
  const maximumMonthDuration = maximumMonthDurationFrom(bookingDate);
  const bookingRangeEnd = addCalendarMonths(bookingDate, bookingMonths);
  const slotMinutes = availability?.slotMinutes ?? 30;
  const selectedSlots = useMemo(
    () => Object.values(selectedSlotsByDate).flat()
      .sort((left, right) => left.startTime.localeCompare(right.startTime) || left.courtId - right.courtId),
    [selectedSlotsByDate],
  );
  const selectedDates = useMemo(
    () => Object.keys(selectedSlotsByDate).filter((date) => selectedSlotsByDate[date].length).sort(),
    [selectedSlotsByDate],
  );
  const estimatedTotalAmount = selectedSlots.reduce(
    (total, slot) => total + Math.round(slot.hourlyPrice * (slotMinutes / 60)),
    0,
  );
  const estimatedAmountPerPlayer = (match?.requiredPlayerCount ?? 0) > 0
    ? Math.ceil(estimatedTotalAmount / match!.requiredPlayerCount)
    : 0;
  const removeSelectedDate = (date: string) => {
    setSelectedSlotsByDate((current) => {
      const next = { ...current };
      delete next[date];
      return next;
    });
    setMonthUnavailableSlots((current) => current.filter((slot) => slot.date !== date));
  };
  const changeBookingDate = (nextDate: string) => {
    setBookingDate(nextDate);
    setBookingMonths((current) => Math.min(current, maximumMonthDurationFrom(nextDate)));
  };


  const applyCurrentSlotsForMonths = async () => {
    if (!token || !selectedVenueId || bookingMonths < 1 || !selectedSlotsForDate.length) {
      setError('Hãy chọn ít nhất một slot ở ngày đang xem trước khi áp dụng theo số tháng.');
      return;
    }
    const targetDates = datesForMonthDuration(bookingDate, bookingMonths);
    if (!targetDates.length || bookingRangeEnd > maxMatchBookingDate()) {
      setError('Khoảng đặt sân phải kết thúc trong vòng 12 tháng kể từ hôm nay.');
      return;
    }

    setIsBusy(true);
    try {
      const calendars = await getCourtAvailabilities(selectedVenueId, targetDates, token);
      const unavailable: MonthUnavailableSlot[] = [];
      const pastSlotKeys = new Set<string>();
      const validSlots: MatchBookingSlotSelection[] = [];
      for (const { date, availability: dailyAvailability } of calendars) {
        for (const templateSlot of selectedSlotsForDate) {
          const startTime = date + 'T' + timePart(templateSlot.startTime) + ':00';
          const endTime = date + 'T' + timePart(templateSlot.endTime) + ':00';
          const currentSlot = dailyAvailability.slots.find((slot) =>
            slot.courtId === templateSlot.courtId && timePart(slot.startTime) === timePart(templateSlot.startTime));
          if (new Date(startTime).getTime() <= Date.now()) {
            pastSlotKeys.add(slotIdentity(templateSlot.courtId, startTime, endTime));
            continue;
          }
          const available = currentSlot?.status === 'Available';
          if (available) {
            validSlots.push({ ...templateSlot, startTime, endTime });
            continue;
          }
          const court = dailyAvailability.courts.find((item) => item.courtId === templateSlot.courtId);
          unavailable.push({
            date,
            courtId: templateSlot.courtId,
            courtNumber: court?.courtNumber ?? templateSlot.courtId,
            startTime,
            endTime,
            status: currentSlot?.status ?? 'Closed',
          });
        }
      }

      const unavailableKeys = new Set([...pastSlotKeys, ...unavailable.map((slot) => slotIdentity(slot.courtId, slot.startTime, slot.endTime))]);
      const existingKeys = new Set(selectedSlots.map((slot) => slotIdentity(slot.courtId, slot.startTime, slot.endTime)));
      const additions = validSlots.filter((slot) => !existingKeys.has(slotIdentity(slot.courtId, slot.startTime, slot.endTime)));
      const invalidSelectedCount = selectedSlots.filter((slot) => unavailableKeys.has(slotIdentity(slot.courtId, slot.startTime, slot.endTime))).length;
      if (selectedSlots.length - invalidSelectedCount + additions.length > maxMatchBookingSlots) {
        setError('Một booking chỉ hỗ trợ tối đa ' + maxMatchBookingSlots + ' slot. Hãy giảm số slot hoặc số ngày.');
        return;
      }

      setSelectedSlotsByDate((current) => {
        const next = { ...current };
        targetDates.forEach((date) => {
          const retained = (next[date] ?? []).filter((slot) => !unavailableKeys.has(slotIdentity(slot.courtId, slot.startTime, slot.endTime)));
          const newSlots = additions.filter((slot) => slot.startTime.slice(0, 10) === date);
          const merged = [...retained, ...newSlots];
          if (merged.length) next[date] = merged;
          else delete next[date];
        });
        return next;
      });
      setMonthUnavailableSlots(unavailable);
      setError(unavailable.length
        ? 'Không áp dụng ' + unavailable.length + ' slot không còn trống. Xem danh sách sân, ngày và giờ bên dưới.'
        : '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể kiểm tra lịch theo số tháng.');
    } finally {
      setIsBusy(false);
    }
  };


  const selectSlot = (slot: AvailabilitySlot) => {
    if (slot.status !== 'Available'
      || unavailableSlotKeysForDate.includes(slotKey(slot))
      || new Date(slot.startTime).getTime() <= Date.now()
      || !bookingDate) return;
    const court = availability?.courts.find((item) => item.courtId === slot.courtId);
    const key = slotIdentity(slot.courtId, slot.startTime, slot.endTime);
    setSelectedSlotsByDate((current) => {
      const currentDateSlots = current[bookingDate] ?? [];
      const nextDateSlots = currentDateSlots.some((item) => slotIdentity(item.courtId, item.startTime, item.endTime) === key)
        ? currentDateSlots.filter((item) => slotIdentity(item.courtId, item.startTime, item.endTime) !== key)
        : [...currentDateSlots, {
          courtId: slot.courtId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          hourlyPrice: court?.hourlyPrice ?? 0,
        }].sort((left, right) => left.startTime.localeCompare(right.startTime) || left.courtId - right.courtId);
      if (!nextDateSlots.length) {
        const next = { ...current };
        delete next[bookingDate];
        return next;
      }
      return { ...current, [bookingDate]: nextDateSlots };
    });
    setError('');
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


  const openInvitationEditor = () => {
    if (!match) return;
    const slots = match.availabilitySlots.length > 0
      ? match.availabilitySlots.map((slot) => ({ timeStart: slot.timeStart.slice(0, 5), timeEnd: slot.timeEnd.slice(0, 5) }))
      : [{ timeStart: match.preferredTimeStart.slice(0, 5), timeEnd: match.preferredTimeEnd.slice(0, 5) }];
    setInvitationDraft({
      title: match.title, note: match.note ?? '', neededPlayerCount: match.neededPlayerCount,
      province: match.province, ward: match.ward, searchRadiusKm: match.searchRadiusKm,
      searchLatitude: match.searchLatitude, searchLongitude: match.searchLongitude,
      preferredVenueIds: match.preferredVenues.map((venue) => venue.venueId),
      availableDateFrom: match.availableDateFrom, availableDateTo: match.availableDateTo,
      preferredTimeStart: match.preferredTimeStart.slice(0, 5), preferredTimeEnd: match.preferredTimeEnd.slice(0, 5),
      availabilitySlots: slots, minSkillLevel: match.minSkillLevel, maxSkillLevel: match.maxSkillLevel, matchType: match.matchType,
    });
    setInvitationVenues(match.preferredVenues);
    setShowInvitationEditor(true);
  };

  const searchInvitationVenues = async () => {
    setIsSearchingInvitationVenues(true);
    setError('');
    try {
      const venues = await searchMatchVenues({
        province: invitationDraft.province, ward: invitationDraft.ward, radiusKm: invitationDraft.searchRadiusKm,
        latitude: invitationDraft.searchLatitude ?? undefined, longitude: invitationDraft.searchLongitude ?? undefined,
      });
      setInvitationVenues(venues);
      setInvitationDraft((current) => ({
        ...current,
        preferredVenueIds: current.preferredVenueIds.filter((venueId) => venues.some((venue) => venue.venueId === venueId)),
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tìm cụm sân.');
    } finally {
      setIsSearchingInvitationVenues(false);
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

  const createBooking = async (allowScheduleConflicts = false) => {
    if (!token || !selectedSlots.length) {
      setError('Vui lòng chọn ít nhất một slot.');
      return;
    }
    setIsBusy(true);
    setError('');
    try {
      await createMatchBooking(token, matchId, {
        slots: selectedSlots.map(({ courtId, startTime, endTime }) => ({ courtId, startTime, endTime })),
        allowScheduleConflicts,
      });
      await loadMatch();
    } catch (reason) {
      const body = reason instanceof ApiError ? reason.body as {
        requiresScheduleConflictConfirmation?: boolean;
        conflicts?: ScheduleConflict[];
      } | undefined : undefined;
      if (!allowScheduleConflicts && body?.requiresScheduleConflictConfirmation && body.conflicts?.length) {
        const details = body.conflicts.map((conflict) =>
          `${conflict.playerName} đã có lịch trùng với slot được chọn.\n`
          + `Lịch đã có: ${conflict.conflictingSlot.venueName} · Sân ${conflict.conflictingSlot.courtNumber} · ${datePart(conflict.conflictingSlot.startTime)} · ${timePart(conflict.conflictingSlot.startTime)}–${timePart(conflict.conflictingSlot.endTime)}`
          + `\nSlot đang chọn: ${conflict.selectedSlot.venueName} · Sân ${conflict.selectedSlot.courtNumber} · ${datePart(conflict.selectedSlot.startTime)} · ${timePart(conflict.selectedSlot.startTime)}–${timePart(conflict.selectedSlot.endTime)}`,
        );
        if (window.confirm(`${details.join('\n\n')}\n\nBạn có muốn tiếp tục tạo booking trùng lịch không?`)) {
          await createBooking(true);
        }
        return;
      }
      setError(reason instanceof Error ? reason.message : 'Không thể tạo booking.');
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
  const bookingHasEnded = match.status === 'Booked'
    && Boolean(match.endTime)
    && new Date(match.endTime!).getTime() <= bookingClock;
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
              <div className="flex items-center gap-2">
                <span className="match-soft-badge">{match.preferredVenues.length} cụm sân</span>
                {match.isHost && ['Recruiting', 'ReadyToBook'].includes(match.status) && (
                  <button aria-expanded={showInvitationEditor} className="community-button-secondary !min-h-8 !px-2.5 !py-1.5 !text-[10px]" disabled={isBusy} onClick={showInvitationEditor ? () => setShowInvitationEditor(false) : openInvitationEditor} type="button">
                    {showInvitationEditor ? 'Hủy sửa' : 'Sửa lời mời'}
                  </button>
                )}
              </div>
            </div>
          {!showInvitationEditor && (
            <>
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
            </>
          )}
          {match.isHost && showInvitationEditor && (
            <div className="mt-4 border-t border-[#d8e7d4] pt-4">
              <p className="mb-3 text-[11px] font-bold text-[#526158]">Chỉnh sửa trực tiếp trong thẻ phạm vi lời mời.</p>
            <form className="mt-4 space-y-4" onSubmit={(event) => {
              event.preventDefault();
              if (!token) return;
              void run(async () => {
                await updateMatchInvitation(token, matchId, invitationDraft);
                setShowInvitationEditor(false);
              });
            }}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-[11px] font-bold text-[#526158] sm:col-span-2">Tiêu đề lời mời
                  <input className="community-input mt-1 w-full" disabled={isBusy} maxLength={200} onChange={(event) => setInvitationDraft((current) => ({ ...current, title: event.target.value }))} required value={invitationDraft.title} />
                </label>
                <label className="block text-[11px] font-bold text-[#526158]">Tỉnh / thành phố
                  <input className="community-input mt-1 w-full" disabled={isBusy} maxLength={100} onChange={(event) => { setInvitationDraft((current) => ({ ...current, province: event.target.value, searchLatitude: null, searchLongitude: null, preferredVenueIds: [] })); setInvitationVenues([]); }} required value={invitationDraft.province} />
                </label>
                <label className="block text-[11px] font-bold text-[#526158]">Xã / phường
                  <input className="community-input mt-1 w-full" disabled={isBusy} maxLength={150} onChange={(event) => { setInvitationDraft((current) => ({ ...current, ward: event.target.value, searchLatitude: null, searchLongitude: null, preferredVenueIds: [] })); setInvitationVenues([]); }} required value={invitationDraft.ward} />
                </label>
                <label className="block text-[11px] font-bold text-[#526158]">Bán kính tìm sân (km)
                  <input className="community-input mt-1 w-full" disabled={isBusy} max={10} min={0.5} onChange={(event) => setInvitationDraft((current) => ({ ...current, searchRadiusKm: Number(event.target.value) }))} required step={0.5} type="number" value={invitationDraft.searchRadiusKm} />
                </label>
                <label className="block text-[11px] font-bold text-[#526158]">Cần thêm thành viên
                  <input className="community-input mt-1 w-full" disabled={isBusy} max={8} min={Math.max(1, approved.length - 1)} onChange={(event) => setInvitationDraft((current) => ({ ...current, neededPlayerCount: Number(event.target.value) }))} required type="number" value={invitationDraft.neededPlayerCount} />
                </label>
                <label className="block text-[11px] font-bold text-[#526158]">Từ ngày
                  <input className="community-input mt-1 w-full" disabled={isBusy} min={todayDateKey()} onChange={(event) => setInvitationDraft((current) => ({ ...current, availableDateFrom: event.target.value }))} required type="date" value={invitationDraft.availableDateFrom} />
                </label>
                <label className="block text-[11px] font-bold text-[#526158]">Đến ngày
                  <input className="community-input mt-1 w-full" disabled={isBusy} min={invitationDraft.availableDateFrom || todayDateKey()} onChange={(event) => setInvitationDraft((current) => ({ ...current, availableDateTo: event.target.value }))} required type="date" value={invitationDraft.availableDateTo} />
                </label>
                <label className="block text-[11px] font-bold text-[#526158]">Trình độ thấp nhất
                  <select className="community-input mt-1 w-full" disabled={isBusy} onChange={(event) => setInvitationDraft((current) => ({ ...current, minSkillLevel: Number(event.target.value) }))} value={invitationDraft.minSkillLevel}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Level {level}</option>)}</select>
                </label>
                <label className="block text-[11px] font-bold text-[#526158]">Trình độ cao nhất
                  <select className="community-input mt-1 w-full" disabled={isBusy} onChange={(event) => setInvitationDraft((current) => ({ ...current, maxSkillLevel: Number(event.target.value) }))} value={invitationDraft.maxSkillLevel}>{[1, 2, 3, 4, 5].map((level) => <option key={level} value={level}>Level {level}</option>)}</select>
                </label>
                <label className="block text-[11px] font-bold text-[#526158]">Hình thức
                  <select className="community-input mt-1 w-full" disabled={isBusy} onChange={(event) => setInvitationDraft((current) => ({ ...current, matchType: event.target.value as MatchFormat }))} value={invitationDraft.matchType}><option value="1vs1">1 vs 1</option><option value="2vs2">2 vs 2</option></select>
                </label>
              </div>

              <div className="rounded-lg border border-[#d8e7d4] bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[12px] font-extrabold text-[#0b2228]">Các slot có thể chơi</p><p className="text-[10px] text-[#718077]">Bạn có thể thêm các khung giờ rời nhau.</p></div><button className="community-button-secondary !min-h-8 !px-2.5 !py-1.5 !text-[11px]" disabled={isBusy || invitationDraft.availabilitySlots.length >= 20} onClick={() => setInvitationDraft((current) => ({ ...current, availabilitySlots: [...current.availabilitySlots, { timeStart: '18:00', timeEnd: '19:00' }] }))} type="button"><Plus className="h-3.5 w-3.5" /> Thêm slot</button></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {invitationDraft.availabilitySlots.map((slot, index) => (
                    <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_2.25rem] items-end gap-2 rounded-md border border-[#e0ebdc] bg-[#f8fbf7] p-2" key={`slot-${index}`}>
                      <div className="min-w-0"><p className="text-[10px] font-bold text-[#526158]">Bắt đầu</p><button aria-expanded={openInvitationTimePicker?.slotIndex === index && openInvitationTimePicker.field === 'start'} className="community-input mt-1 flex w-full items-center justify-between gap-1 text-left" disabled={isBusy} onClick={() => setOpenInvitationTimePicker((current) => current?.slotIndex === index && current.field === 'start' ? null : { slotIndex: index, field: 'start' })} type="button"><span>{slot.timeStart}</span><ChevronDown className="h-3.5 w-3.5 shrink-0" /></button></div>
                      <div className="min-w-0"><p className="text-[10px] font-bold text-[#526158]">Kết thúc</p><button aria-expanded={openInvitationTimePicker?.slotIndex === index && openInvitationTimePicker.field === 'end'} className="community-input mt-1 flex w-full items-center justify-between gap-1 text-left" disabled={isBusy} onClick={() => setOpenInvitationTimePicker((current) => current?.slotIndex === index && current.field === 'end' ? null : { slotIndex: index, field: 'end' })} type="button"><span>{slot.timeEnd}</span><ChevronDown className="h-3.5 w-3.5 shrink-0" /></button></div>
                      <button aria-label={`Xóa slot ${index + 1}`} className="grid h-9 w-9 place-items-center rounded-md border border-red-200 text-red-600 disabled:opacity-50" disabled={isBusy || invitationDraft.availabilitySlots.length === 1} onClick={() => setInvitationDraft((current) => ({ ...current, availabilitySlots: current.availabilitySlots.filter((_, itemIndex) => itemIndex !== index) }))} type="button"><Trash2 className="h-3.5 w-3.5" /></button>
                      {openInvitationTimePicker?.slotIndex === index && (
                        <div className="col-span-3 h-[258px] overflow-y-scroll rounded-md border border-[#cfe0c8] bg-white shadow-sm" role="listbox">
                          {invitationTimeOptions.map((time) => {
                            const field = openInvitationTimePicker.field;
                            const selectedTime = field === 'start' ? slot.timeStart : slot.timeEnd;
                            return <button aria-selected={time === selectedTime} className={`block h-8 w-full px-3 text-left text-[12px] font-semibold hover:bg-[#eff7ec] ${time === selectedTime ? 'bg-[#e5f2df] text-[#265615]' : 'text-[#35433a]'}`} key={time} onClick={() => { setInvitationDraft((current) => ({ ...current, availabilitySlots: current.availabilitySlots.map((item, itemIndex) => itemIndex === index ? (field === 'start' ? { ...item, timeStart: time } : { ...item, timeEnd: time }) : item) })); setOpenInvitationTimePicker(null); }} role="option" type="button">{time}</button>;
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[#d8e7d4] bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-[12px] font-extrabold text-[#0b2228]">Cụm sân mong muốn</p><p className="text-[10px] text-[#718077]">Đổi khu vực rồi tìm lại để chọn cụm sân phù hợp.</p></div><button className="community-button-secondary !min-h-8 !px-2.5 !py-1.5 !text-[11px]" disabled={isBusy || isSearchingInvitationVenues} onClick={() => void searchInvitationVenues()} type="button">{isSearchingInvitationVenues ? 'Đang tìm...' : 'Tìm cụm sân'}</button></div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {invitationVenues.map((venue) => <label className="flex cursor-pointer items-start gap-2 rounded-md border border-[#e0ebdc] p-2 text-[11px] font-bold text-[#35433a]" key={venue.venueId}><input checked={invitationDraft.preferredVenueIds.includes(venue.venueId)} className="mt-0.5 h-4 w-4 accent-[#4b7a32]" disabled={isBusy} onChange={(event) => setInvitationDraft((current) => ({ ...current, preferredVenueIds: event.target.checked ? [...current.preferredVenueIds, venue.venueId] : current.preferredVenueIds.filter((venueId) => venueId !== venue.venueId) }))} type="checkbox" /><span>{venue.venueName}{venue.distanceKm != null && <small className="mt-0.5 block font-semibold text-[#718077]">Cách {venue.distanceKm.toFixed(1)} km</small>}</span></label>)}
                  {invitationVenues.length === 0 && <p className="text-[11px] text-[#718077]">Chưa có cụm sân. Hãy tìm cụm sân trước khi lưu.</p>}
                </div>
              </div>

              <label className="block text-[11px] font-bold text-[#526158]">Nội dung lời mời
                <textarea className="community-input mt-1 min-h-20 w-full" disabled={isBusy} maxLength={1000} onChange={(event) => setInvitationDraft((current) => ({ ...current, note: event.target.value }))} value={invitationDraft.note} />
              </label>
              <div className="flex justify-end gap-2"><button className="community-button-secondary" disabled={isBusy} onClick={() => setShowInvitationEditor(false)} type="button">Hủy</button><button className="community-button" disabled={isBusy} type="submit"><Check className="h-4 w-4" /> Lưu phạm vi lời mời</button></div>
            </form>
            </div>
          )}
          </section>

          <section className="community-panel match-panel match-roster-panel">
            <div className="match-section-heading">
              <div><p className="match-eyebrow">đội hình ghép trận</p><h2>Thành viên</h2></div>
              <span className="match-count-pill">{approved.length}/{match.requiredPlayerCount}</span>
            </div>

            {isApprovedMember && pending.length > 0 && (
              <div className="mt-3 space-y-1.5 rounded-lg border border-amber-200 bg-amber-50 p-2">
                <p className="text-[11px] font-bold text-amber-900">Chờ duyệt ({pending.length})</p>
                {pending.map((participant) => (
                  <div className="flex items-center justify-between gap-2 rounded-md bg-white p-2" key={participant.participantId}>
                    <div className="min-w-0"><p className="truncate text-[11px] font-bold">{participant.playerName}</p><p className="text-[10px] text-on-surface-variant">Level {participant.skillLevel.toFixed(1)}</p></div>
                    <div className="flex shrink-0 gap-1">
                      <button className="grid h-7 w-7 place-items-center rounded-md border border-red-300 text-red-700" disabled={isBusy} onClick={() => token && window.confirm(`Từ chối yêu cầu tham gia của ${participant.playerName}?`) && void run(() => rejectParticipant(token, matchId, participant.participantId))} title="Từ chối" type="button"><X className="h-3.5 w-3.5" /></button>
                      <button aria-label={`Chấp nhận ${participant.playerName}`} className="community-button h-7 w-7 !min-h-7 !p-0" disabled={isBusy} onClick={() => token && window.confirm(`Chấp nhận ${participant.playerName} vào phòng?`) && void run(() => acceptParticipant(token, matchId, participant.participantId))} title="Chấp nhận" type="button"><Check className="h-3.5 w-3.5" /></button>
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
                        ? <img alt="" className="h-full w-full object-cover" decoding="async" loading="lazy" src={participant.avatarUrl} />
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
                      <button className="grid h-7 w-7 shrink-0 place-items-center text-red-600" disabled={isBusy} onClick={() => token && window.confirm(`Loại ${participant.playerName} khỏi phòng?`) && void run(() => removeParticipant(token, matchId, participant.participantId))} title="Loại thành viên" type="button"><Trash2 className="h-4 w-4" /></button>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
          </div>

          {isApprovedMember && match.status === 'Booked' && (
            <section className="match-alert" role="alert">
              <strong>{bookingHasEnded ? 'Lượt booking gần nhất đã hết giờ.' : 'Booking đã thanh toán thành công.'}</strong> Bạn có thể chọn slot bên dưới để tạo booking tiếp theo ngay.
            </section>
          )}

          {isApprovedMember && canBookAnotherRound && (
            <section className="community-panel match-panel match-schedule-panel">
              <div className="match-section-heading">
                <div>
                  <p className="match-eyebrow">giữ sân</p>
                  <h2>Chọn lịch và tạo booking</h2>
                  <p>Chọn tự do các slot trống, kể cả slot rời nhau hoặc nhiều sân cùng một khung giờ. Chủ phòng hoặc thành viên đã được duyệt đều có thể tạo booking.</p>
                  <p>Dùng chat để thảo luận, vote các slot rảnh chung rồi tạo booking khi cả nhóm chốt.</p>
                </div>
                <span className="match-soft-badge">{selectedSlots.length ? `${selectedSlots.length} slot` : 'Chưa chọn'}</span>
              </div>
              <div className="match-booking-form">
                <label><span className="mb-1 block text-[13px] font-bold">Cụm sân</span><select className={inputClass} onChange={(event) => { setSelectedVenueId(Number(event.target.value)); setSelectedSlotsByDate({}); setMonthUnavailableSlots([]); }} value={selectedVenueId ?? ''}>{match.preferredVenues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select></label>
                <label>
                  <span className="mb-1 block text-[13px] font-bold">Ngày đang xem</span>
                  <input className={inputClass} max={maxMatchBookingDate()} min={todayDateKey()} onChange={(event) => changeBookingDate(event.target.value)} type="date" value={bookingDate} />
                </label>
                <div className="md:col-span-2 rounded-xl border border-[#d8e4d4] bg-[#f7faf5] p-3">
                  <div className="flex flex-wrap items-end gap-2">
                    <label className="min-w-[160px] flex-1">
                      <span className="mb-1 block text-[12px] font-bold text-[#526158]">Số tháng áp dụng</span>
                      <input
                        className={inputClass}
                        max={maximumMonthDuration}
                        min={1}
                        onChange={(event) => setBookingMonths(Math.max(1, Math.min(maximumMonthDuration, Math.trunc(Number(event.target.value)) || 1)))}
                        step={1}
                        type="number"
                        value={bookingMonths}
                      />
                    </label>
                    <button className="rounded-xl bg-[#0b2228] px-3 py-2 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={isBusy || maximumMonthDuration < 1 || !selectedSlotsForDate.length} onClick={() => void applyCurrentSlotsForMonths()} type="button">Áp dụng {bookingMonths} tháng</button>
                  </div>
                  <p className="mt-2 text-[12px] font-medium text-[#718077]">Sao chép các slot đang chọn từ {formatDateKey(bookingDate)} đến {formatDateKey(bookingRangeEnd)}, bao gồm ngày kết thúc.</p>
                  {monthUnavailableSlots.length > 0 && <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-3 text-amber-950"><p className="flex items-center gap-2 text-[12px] font-extrabold"><AlertCircle className="h-4 w-4" /> Slot không còn trống ({monthUnavailableSlots.length})</p><div className="mt-2 flex max-h-28 flex-wrap gap-2 overflow-y-auto">{monthUnavailableSlots.map((slot) => <span className="rounded-full bg-white px-2 py-1 text-[11px] font-bold" key={slotIdentity(slot.courtId, slot.startTime, slot.endTime)}>Sân {slot.courtNumber} · {dateLabel(slot.date)} · {timePart(slot.startTime)}-{timePart(slot.endTime)}</span>)}</div></div>}
                  {selectedDates.length > 0 && (
                    <div className="mt-3 max-h-64 overflow-y-auto pr-1">
                      <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                        {selectedDates.map((date) => (
                          <div className={'flex items-start justify-between gap-2 rounded-lg border px-2 py-1.5 text-[11px] font-bold ' + (date === bookingDate ? 'border-primary bg-[#eef8e6] text-primary' : 'border-[#d8e4d4] bg-white text-[#526158]')} key={date}>
                            <button className="min-w-0 flex-1 text-left" onClick={() => changeBookingDate(date)} type="button">
                              <span className="block truncate">{dateLabel(date)}</span>
                              <span className="mt-1 block text-[10px]">{selectedSlotsByDate[date].length} slot</span>
                            </button>
                            <button aria-label={'Bỏ ngày ' + date} onClick={() => removeSelectedDate(date)} type="button"><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[13px] font-bold text-[#0b2228]">Slot khả dụng ngày {bookingDate} ({slotMinutes} phút/slot)</span>
                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                      <span className="rounded-full border border-[#b9dca8] bg-[#eef8e6] px-2 py-1 text-primary">Trống</span>
                      <span className="rounded-full border border-[#0b2228] bg-[#0b2228] px-2 py-1 text-white">Đã chọn</span>
                      <span className="rounded-full border border-[#d8e4d4] bg-white px-2 py-1 text-[#8a968f]">Không khả dụng</span>
                    </div>
                  </div>
                  {availability && <CourtTimelineGrid availability={availability} disabledSlotKeys={unavailableSlotKeysForDate} onSelectSlot={selectSlot} selectedSlotKeys={selectedSlotKeys} />}
                </div>
              </div>
              {selectedSlots.length > 0 && (
                <div className="match-price-summary">
                  <div><p className="text-[11px] font-bold text-[#718077]">Tổng lịch</p><p className="mt-1 font-extrabold text-[#0b2228]">{selectedSlots.length} slot · {selectedDates.length} ngày</p></div>
                  <div><p className="text-[11px] font-bold text-[#718077]">Tổng tiền sân</p><p className="mt-1 font-extrabold text-[#0b2228]">{currency.format(estimatedTotalAmount)}</p></div>
                  <div><p className="text-[11px] font-bold text-[#718077]">Dự kiến mỗi người</p><p className="mt-1 font-extrabold text-primary">{currency.format(estimatedAmountPerPlayer)}</p></div>
                </div>
              )}
              <button className="community-button mt-4 w-full" disabled={isBusy || !selectedSlots.length} onClick={() => void createBooking()} type="button"><CreditCard className="h-4 w-4" /> Tạo booking và chuyển sang thanh toán</button>
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
          {isApprovedMember && match.bookingCheckIns.length > 0 && (
            <section className="match-checkin-card">
              <p className="match-eyebrow">check-in theo lượt</p>
              <div className="flex items-center justify-between gap-3"><h3>Các lượt booking</h3><button className="rounded-lg bg-white/15 px-3 py-1.5 text-[11px] font-extrabold text-white hover:bg-white/25" onClick={() => setShowBookingRounds(true)} type="button">{`Xem danh s\u00e1ch (${match.bookingCheckIns.length})`}</button></div>

            </section>
          )}

          {!isApprovedMember && match.bookingCheckIns.length > 0 && (
            <section className="match-checkin-card">
              <p className="match-eyebrow">tuyển theo buổi</p>
              <div className="flex items-center justify-between gap-3">
                <h3>Cần người thay thế</h3>
                <button className="rounded-lg bg-[#e2ff57] px-3 py-1.5 text-[11px] font-extrabold text-[#092129] hover:bg-white" onClick={() => setShowBookingRounds(true)} type="button">Xem các buổi trống</button>
              </div>
              <p className="mt-2 text-[11px] text-white/70">Đăng ký đúng ngày và khung giờ bạn có thể tham gia.</p>
            </section>
          )}
          {!(isApprovedMember && match.bookingCheckIns.length > 0) && (
            <section className="community-panel match-side-panel">
              <h3 className="text-[18px] font-bold">Thao tác</h3>
              {match.isHost && ['Recruiting', 'ReadyToBook'].includes(match.status) && (
                <div className="mt-4 space-y-2">
                  {match.status === 'Recruiting' && !isFull && (
                    <button className="community-button w-full" disabled={isBusy} onClick={() => token && void run(() => inviteMatchPlayers(token, matchId, { automatic: true }))} type="button"><UserCheck className="h-4 w-4" /> Tuyển thêm thành viên</button>
                  )}
                </div>
              )}
              {!match.isHost && match.myParticipantStatus === 'Invited' && match.status === 'Recruiting' && (
                <div className="mt-4 border-y border-[#cfe0c8] py-4">
                  <p className="text-center text-[13px] font-extrabold text-[#0b2228]">Bạn được mời tham gia trận này</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button className="community-button-secondary" disabled={isBusy} onClick={() => token && window.confirm('Từ chối lời mời tham gia phòng này?') && void run(() => declineMatchInvitation(token, matchId))} type="button">
                      <X className="h-4 w-4" /> Từ chối
                    </button>
                    <button className="community-button" disabled={isBusy} onClick={() => token && window.confirm('Chấp nhận lời mời và tham gia phòng này?') && void run(() => acceptMatchInvitation(token, matchId))} type="button">
                      <Check className="h-4 w-4" /> Chấp nhận
                    </button>
                  </div>
                </div>
              )}
              {!match.isHost && !isApprovedMember && match.myParticipantStatus !== 'Pending' && match.myParticipantStatus !== 'Invited' && match.status === 'Recruiting' && (
                <button className="community-button mt-4 w-full" disabled={isBusy} onClick={() => token && void run(() => joinMatch(token, matchId))} type="button"><UserCheck className="h-4 w-4" /> Yêu cầu tham gia</button>
              )}
              {!match.isHost && match.myParticipantStatus === 'Pending' && <div className="mt-4 rounded-lg bg-amber-50 p-3 text-center text-[13px] font-bold text-amber-800">Đang chờ chủ phòng hoặc thành viên trong phòng duyệt</div>}
              {isApprovedMember && ['Recruiting', 'ReadyToBook'].includes(match.status) && (
                <button className="community-button-secondary mt-3 w-full" disabled={isBusy} onClick={() => token && window.confirm('Bạn có chắc chắn muốn rời phòng ghép trận này?') && void run(() => leaveMatch(token, matchId))} type="button"><XCircle className="h-4 w-4" /> Rút yêu cầu / rời phòng</button>
              )}
              {match.isHost && match.status === 'Recruiting' && isFull && (
                <button className="community-button mt-4 w-full" disabled={isBusy} onClick={() => token && window.confirm('Xác nhận chốt danh sách và chuyển phòng sang sẵn sàng đặt sân?') && void run(() => markMatchReadyToBook(token, matchId))} type="button"><ShieldCheck className="h-4 w-4" /> Chuyển sang sẵn sàng đặt sân</button>
              )}
            </section>
          )}

          {match.status === 'BookingPending' && isApprovedMember && (
            <section className="community-panel match-payment-card">
              <p className="match-eyebrow">thanh toán</p>
              <h3 className="flex items-center gap-2 text-[18px] font-bold"><CreditCard className="h-5 w-5 text-primary" /> Thanh toán booking</h3>
              <p className="mt-3 text-[13px] leading-6 text-on-surface-variant">Chọn người cần thanh toán, quét QR và gửi biên lai tại trang thanh toán riêng.</p>
              <button
                className="community-button mt-4 w-full"
                onClick={() => navigate(`/checkout?bookingId=${match.bookingId}&date=${encodeURIComponent(match.startTime?.slice(0, 10) ?? bookingDate)}&matchId=${matchId}`)}
                type="button"
              >
                <CreditCard className="h-4 w-4" /> Mở trang thanh toán
              </button>
              {canEditPendingBooking && (
                <button className="community-button-secondary mt-2 w-full" disabled={isBusy} onClick={() => setShowEditBookingConfirmation(true)} type="button">
                  <CalendarRange className="h-4 w-4" /> Sửa booking
                </button>
              )}
            </section>
          )}
          {!match.conversationId ? (
            <section className="community-panel p-4">
              <p className="rounded-lg bg-surface-container-low p-4 text-[13px] leading-6 text-on-surface-variant">
                Chủ phòng, thành viên đã được duyệt và người thay thế đang còn hiệu lực mới truy cập được chat.
              </p>
            </section>
          ) : (
            <div>
              <button
                className="community-button w-full py-3"
                onClick={() => navigate(`/messages?matchId=${matchId}`)}
                type="button"
              >
                <MessageCircle className="h-5 w-5" /> Chat phòng
              </button>
              {match.chatAccessRole === 'Replacement' && (
                <p className="mt-2 rounded-lg bg-[#fff8e6] px-3 py-2 text-[12px] leading-5 text-[#7a5600]">
                  <strong>Quyền người thay thế.</strong> Bạn xem tin nhắn từ lúc được duyệt
                  {match.chatAccessExpiresAt ? ` và được chat đến ${chatExpiryLabel(match.chatAccessExpiresAt)}` : ''}.
                </p>
              )}
            </div>
          )}

        </aside>
      </main>


      {showEditBookingConfirmation && (
        <ModalDialog aria-labelledby="edit-match-booking-title" canClose={!isBusy} className="w-[calc(100%-2rem)] max-w-md rounded-2xl bg-white p-5 text-[#0b2228] shadow-2xl" closeOnBackdrop={!isBusy} onRequestClose={() => setShowEditBookingConfirmation(false)}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-primary">Sửa booking</p>
              <h2 className="mt-1 text-xl font-black" id="edit-match-booking-title">Chọn lại slot?</h2>
            </div>
            <button aria-label="Đóng" className="rounded-lg p-2 hover:bg-[#eef8e6]" disabled={isBusy} onClick={() => setShowEditBookingConfirmation(false)} type="button"><X className="h-5 w-5" /></button>
          </div>
          <p className="mt-3 text-sm leading-6 text-[#526158]">Booking giữ chỗ hiện tại sẽ được hủy và các slot sẽ được mở lại. Chưa có khoản thanh toán nào bị ảnh hưởng.</p>
          <div className="mt-5 flex justify-end gap-2">
            <button className="community-button-secondary" disabled={isBusy} onClick={() => setShowEditBookingConfirmation(false)} type="button">Giữ booking</button>
            <button
              className="community-button"
              disabled={isBusy}
              onClick={() => {
                if (!token) return;
                setShowEditBookingConfirmation(false);
                setSelectedSlotsByDate({});
                void run(() => cancelPendingMatchBooking(token, matchId));
              }}
              type="button"
            >
              Hủy giữ chỗ và sửa
            </button>
          </div>
        </ModalDialog>
      )}

      {showBookingRounds && (
        <ModalDialog aria-labelledby="match-booking-rounds-title" className="max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-2xl bg-[#0b2228] p-5 text-white shadow-2xl" onRequestClose={() => setShowBookingRounds(false)}>
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#e2ff57]">{'Check-in theo l\u01b0\u1ee3t'}</p><h2 className="mt-1 text-xl font-black" id="match-booking-rounds-title">{'Danh s\u00e1ch l\u01b0\u1ee3t booking'}</h2></div>
            <button aria-label={'\u0110\u00f3ng'} className="rounded-lg p-2 hover:bg-white/10" onClick={() => setShowBookingRounds(false)} type="button"><X className="h-5 w-5" /></button>
          </div>
          <div className="mt-4 space-y-3">
                {match.bookingCheckIns.map((booking, bookingIndex) => (
                  <article className="rounded-xl border border-white/20 bg-white/10 p-2.5" key={booking.bookingId}>
                    <div className="flex items-start justify-between gap-2">
                      <div><p className="text-[11px] font-extrabold text-white">Lượt {bookingIndex + 1} · {dateTimeLabel(booking.startTime)}</p><p className="mt-0.5 text-[10px] text-white/70">{booking.bookingStatus === 'Confirmed' ? 'Đã thanh toán' : 'Chờ thanh toán'}</p></div>
                      <span className="rounded-full bg-white/15 px-2 py-1 text-[9px] font-bold">{booking.checkInGroups.length} sân / khung giờ</span>
                    </div>
                    <div className="mt-2 space-y-2">
                      {booking.checkInGroups.map((group) => (
                        <div className="rounded-lg bg-[#082127]/75 px-2.5 py-2" key={group.bookingCheckInGroupId}>
                          <p className="text-[11px] font-bold text-white">Sân {group.courtNumber} · {dateTimeLabel(group.startTime)}–{timePart(group.endTime)}</p>
                          {group.checkInCode && <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#e2ff57]">Mã check-in cá nhân của bạn</p>}
                          {group.checkInCode ? (
                            <div className="match-checkin-code">{group.checkInCode}</div>
                          ) : (
                            <p className="mt-1 text-[10px] font-semibold text-white/75">{booking.bookingStatus !== 'Confirmed' ? 'Mã mở sau khi thanh toán.' : group.checkInStatus === 'CheckedIn' ? 'Đã check-in.' : group.checkInStatus === 'NoShow' ? 'Đã ghi nhận vắng mặt.' : group.isCheckInWindowOpen ? 'Đang chờ nhân viên xác nhận.' : new Date(group.endTime).getTime() < bookingClock ? 'Đã hết thời gian check-in.' : 'Mã mở trước giờ chơi 30 phút.'}</p>
                          )}
                          <MatchSlotReplacementPanel
                            group={group}
                            isBusy={isBusy}
                            canReview={isApprovedMember}
                            matchId={matchId}
                            run={run}
                            token={token}
                          />
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
                        </div>
        </ModalDialog>
      )}
      {showVenueMap && (
        <Suspense fallback={<p className="p-4 text-center" role="status">Đang tải bản đồ...</p>}>
          <MatchVenueMapDialog
            matchTitle={match.title}
            onClose={() => setShowVenueMap(false)}
            venues={match.preferredVenues}
          />
        </Suspense>
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
