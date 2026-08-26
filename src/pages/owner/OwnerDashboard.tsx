import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  ImageUp,
  Lock,
  MessageCircle,
  RefreshCw,
  Ticket,
  Unlock,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  cancelOwnerBookingCheckInGroup,
  createOwnerScheduleEntry,
  deleteOwnerScheduleEntry,
  getOwnerSchedule,
  searchOwnerPlayers,
  submitOwnerBookingRefundProof,
  updateOwnerBookingStatus,
  type OwnerPlayerSearchResult,
  type OwnerSchedule,
  type OwnerScheduleItem,
  type OwnerScheduleSlot,
  type OwnerWalkInPaymentMethod,
} from '../../api/owner';
import { createOwnerTicketSession } from '../../api/ticketing';
import { useAuth } from '../../auth/AuthContext';
import { useApiQuery } from '../../hooks/useApiQuery';
import { ModalDialog } from '../../components/ui/ModalDialog';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { OwnerShell } from './components/OwnerShell';
import { OwnerTimelineGrid } from './components/OwnerTimelineGrid';
import { useConfirm } from '../../components/ui/ConfirmDialogRegion';
import { lastBookableDate } from '../../utils/bookingDateRange';

const toLocalDate = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const addDays = (value: string, days: number) => {
  const date = new Date(`${value}T00:00:00`);
  date.setDate(date.getDate() + days);
  return toLocalDate(date);
};

const timeValue = (dateTime: string) => dateTime.slice(11, 16);
/// Lịch sân dùng giờ địa phương nên chuỗi không hậu tố Z được so thẳng với đồng hồ máy.
const hasPassed = (localDateTime: string) => new Date(localDateTime).getTime() <= Date.now();
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateLabel = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit' }).format(new Date(`${value}T00:00:00`));

const statusLabel: Record<string, string> = {
  Holding: 'Giữ chỗ',
  Pending: 'Chờ xác nhận',
  Confirmed: 'Đã đặt',
  Blocked: 'Đã khóa',
  Cancelled: 'Đã hủy',
};

const paymentStatusLabel: Record<string, string> = {
  Pending: 'Chờ thanh toán',
  WaitingForConfirmation: 'Chờ xác nhận thanh toán',
  Paid: 'Đã thanh toán',
  Expired: 'Đã hết hạn',
  Cancelled: 'Đã hủy',
  Rejected: 'Đã từ chối',
  Failed: 'Thanh toán lỗi',
};

const slotStatusLabel: Record<OwnerScheduleSlot['status'], string> = {
  Available: 'Trống',
  Holding: 'Đang giữ',
  Booked: 'Đã đặt',
  Blocked: 'Đã khóa',
  // Maintenance is merged into Blocked; the key only survives for older payloads.
  Maintenance: 'Đã khóa',
  Event: 'Sự kiện',
  TicketSession: 'Xé vé',
  Closed: 'Đã đóng cửa',
  Inactive: 'Ngừng hoạt động',
};

type OwnerSlotEntryType = 'Blocked' | 'WalkIn' | 'TicketSession';

const entryLabel: Record<OwnerSlotEntryType, string> = {
  Blocked: 'Khóa khung giờ',
  WalkIn: 'Lưu đơn đặt tại sân',
  TicketSession: 'Tạo bản nháp xé vé',
};

const slotCountBetween = (start: string, end: string) => {
  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3, 5));
  return Math.max(0, Math.round((toMinutes(end) - toMinutes(start)) / 30));
};

const operationTimeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2).toString().padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

const getPaymentStatusLabel = (status?: string | null) => status ? paymentStatusLabel[status] ?? status : '-';

const checkInStatusLabel: Record<string, string> = {
  NotOpen: 'Chưa đến giờ check-in',
  Ready: 'Sẵn sàng check-in',
  CheckedIn: 'Đã check-in',
  PartiallyCheckedIn: 'Đã check-in một phần',
  NoShow: 'Vắng mặt',
  Cancelled: 'Đã hủy',
};

export const OwnerDashboard = () => {
  const { token } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [date, setDate] = useState(toLocalDate);
  const [venueFilter, setVenueFilter] = useState('all');
  const [courtId, setCourtId] = useState('');
  const [entryType, setEntryType] = useState<OwnerSlotEntryType>('Blocked');
  const [title, setTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketMinSkillLevel, setTicketMinSkillLevel] = useState('1');
  const [ticketMaxSkillLevel, setTicketMaxSkillLevel] = useState('5');
  const [ticketPlayFormat, setTicketPlayFormat] = useState('2vs2');
  const [ticketMaxPlayers, setTicketMaxPlayers] = useState('4');
  const [ticketPrice, setTicketPrice] = useState('100000');
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('08:30');
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<OwnerScheduleSlot | null>(null);
  const [customerPlayer, setCustomerPlayer] = useState<OwnerPlayerSearchResult | null>(null);
  const [customerQuery, setCustomerQuery] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelPanelOpen, setIsCancelPanelOpen] = useState(false);
  const [refundReference, setRefundReference] = useState('');
  const [refundProof, setRefundProof] = useState<File | null>(null);
  const [playerResults, setPlayerResults] = useState<OwnerPlayerSearchResult[]>([]);
  const [amountOverride, setAmountOverride] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<OwnerWalkInPaymentMethod>('Cash');

  const {
    data: schedule = null,
    error: loadError,
    loading: isLoading,
    refresh: load,
  } = useApiQuery(
    ['owner-schedule', token, date],
    () => getOwnerSchedule(token!, date, 'day'),
    { enabled: Boolean(token), errorMessage: 'Không thể tải lịch sân.' },
  );

  const error = actionError || loadError;
  const setError = setActionError;

  // Keep the selected court valid for whichever schedule is on screen.
  useEffect(() => {
    if (!schedule) return;
    const firstCourt = schedule.venues
      .flatMap((venue) => venue.courts)
      .find((court) => court.availabilityStatus !== 'Inactive');
    setCourtId((current) =>
      schedule.venues.some((venue) => venue.courts.some((court) => court.courtId.toString() === current))
        ? current
        : firstCourt?.courtId.toString() || '',
    );
  }, [schedule]);

  useScheduleRealtime((notification) => {
    const visibleVenue = schedule?.venues.some((venue) => venue.venueId === notification.venueId);
    if (visibleVenue && notification.startTime.slice(0, 10) === date) void load();
  });

  usePaymentRealtime((notification) => {
    if (schedule?.venues.some((venue) => venue.venueId === notification.venueId)) void load();
  });

  const visibleVenueIds = useMemo(
    () => new Set((schedule?.venues ?? [])
      .filter((venue) => venueFilter === 'all' || venue.venueId.toString() === venueFilter)
      .map((venue) => venue.venueId)),
    [schedule, venueFilter],
  );
  const visibleItems = useMemo(
    () => schedule?.items.filter((item) => visibleVenueIds.has(item.venueId)) ?? [],
    [schedule, visibleVenueIds],
  );
  const visibleSlots = useMemo(
    () => schedule?.slots.filter((slot) => visibleVenueIds.has(slot.venueId)) ?? [],
    [schedule, visibleVenueIds],
  );
  const bookedCount = visibleSlots.filter((slot) => slot.status === 'Booked').length;
  const holdingCount = visibleSlots.filter((slot) => slot.status === 'Holding').length;
  const availableCount = visibleSlots.filter((slot) => slot.status === 'Available').length;

  const selectedSlotItem = selectedSlot?.bookingId
    ? visibleItems.find((item) => item.bookingId === selectedSlot.bookingId)
    : undefined;
  // Đơn đã thanh toán giờ hủy được, khoản đã thu chuyển sang chờ hoàn tiền; chỉ buổi đã bắt
  // đầu là không lùi lại được nữa.
  const cancellationBlockedMessage = 'Buổi này đã bắt đầu hoặc người chơi đã check-in nên không thể hủy.';

  const selectedCourt = useMemo(
    () => schedule?.venues.flatMap((venue) => venue.courts).find((court) => court.courtId.toString() === courtId),
    [schedule, courtId],
  );
  const walkInSlotCount = slotCountBetween(startTime, endTime);
  // Số slot × giá sân: một slot là 30 phút nên bằng nửa giá giờ.
  const defaultAmount = Math.round((selectedCourt?.hourlyPrice ?? 0) * walkInSlotCount * 0.5);
  const amountValue = amountOverride ?? String(defaultAmount);
  const isWalkInEntry = entryType === 'WalkIn';
  const isTicketEntry = entryType === 'TicketSession';
  // Chủ sân sửa được giờ trong form, nên cảnh báo phải bám khung giờ sắp gửi đi chứ không
  // phải ô đã bấm trên lưới.
  const isPastEntryRange = hasPassed(`${date}T${endTime}:00`);
  const pastRangeLabel = `${dateLabel(date)} ${startTime}–${endTime}`;

  const applySlotToForm = (slot: OwnerScheduleSlot) => {
    setError('');
    setSelectedSlot(slot);
    setCourtId(slot.courtId.toString());
    setStartTime(timeValue(slot.startTime));
    setEndTime(timeValue(slot.endTime));
    setDate(slot.startTime.slice(0, 10));
    setEntryType('Blocked');
    setTitle('');
    setTicketDescription('');
    setTicketMinSkillLevel('1');
    setTicketMaxSkillLevel('5');
    setTicketPlayFormat('2vs2');
    setTicketMaxPlayers('4');
    setTicketPrice('100000');
    setCustomerPlayer(null);
    setCustomerQuery('');
    setCustomerPhone('');
    setIsCancelPanelOpen(false);
    setCancelReason('');
    setRefundReference('');
    setPlayerResults([]);
    setAmountOverride(null);
    setPaymentMethod('Cash');
  };

  // Người trực quầy gõ tên hoặc số điện thoại; chỉ tra khi đã đủ hai ký tự.
  useEffect(() => {
    if (!token || customerPlayer || customerQuery.trim().length < 2) {
      setPlayerResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void searchOwnerPlayers(token, customerQuery.trim())
        .then(setPlayerResults)
        .catch(() => setPlayerResults([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [token, customerQuery, customerPlayer]);

  const createEntry = async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!token || !courtId) return;
    const ticketPlayers = Number(ticketMaxPlayers);
    const ticketPriceValue = Number(ticketPrice);
    const ticketMinSkill = Number(ticketMinSkillLevel);
    const ticketMaxSkill = Number(ticketMaxSkillLevel);
    const ticketStart = new Date(`${date}T${startTime}:00`);
    const ticketEnd = new Date(`${date}T${endTime}:00`);
    const ticketValidation = !isTicketEntry
      ? ''
      : !selectedCourt
        ? 'Không tìm thấy sân đã chọn.'
        : title.trim().length < 3
          ? 'Tên buổi chơi cần ít nhất 3 ký tự.'
          : !(ticketStart < ticketEnd)
            ? 'Giờ kết thúc phải sau giờ bắt đầu.'
            : ticketStart <= new Date()
              ? 'Khung giờ chơi phải ở trong tương lai.'
              : date > lastBookableDate(toLocalDate())
                ? 'Chỉ được tạo buổi xé vé trong tháng hiện tại hoặc tháng kế tiếp.'
                : ticketMinSkill > ticketMaxSkill
                  ? 'Trình độ tối thiểu không được lớn hơn trình độ tối đa.'
                  : !Number.isInteger(ticketPlayers) || ticketPlayers < 1 || ticketPlayers > 100
                    ? 'Số người tối đa phải từ 1 đến 100.'
                    : !Number.isInteger(ticketPriceValue) || ticketPriceValue < 0
                      ? 'Giá vé phải là số nguyên VND không âm.'
                      : '';
    if (ticketValidation) {
      setError(ticketValidation);
      return;
    }
    if (!isTicketEntry && isPastEntryRange && !(await confirm({
      title: 'Khung giờ này đã trôi qua',
      message: isWalkInEntry
        ? `${pastRangeLabel} nằm trong quá khứ. Đơn vẫn được lưu và tính vào doanh thu nếu đã thu tiền.`
        : `${pastRangeLabel} nằm trong quá khứ nên việc khóa sân sẽ không còn tác dụng với người chơi.`,
      confirmLabel: 'Vẫn lưu',
      tone: 'danger',
    }))) return;
    setError('');
    setIsSaving(true);
    try {
      if (isTicketEntry && selectedCourt) {
        const session = await createOwnerTicketSession(token, {
          venueId: selectedCourt.venueId,
          courtId: Number(courtId),
          date,
          startTime: `${startTime}:00`,
          endTime: `${endTime}:00`,
          title: title.trim(),
          description: ticketDescription.trim() || undefined,
          minSkillLevel: ticketMinSkill,
          maxSkillLevel: ticketMaxSkill,
          playFormat: ticketPlayFormat,
          maxPlayers: ticketPlayers,
          ticketPrice: ticketPriceValue,
        });
        setSelectedSlot(null);
        navigate(`/owner/ticket-sessions/${session.ticketSessionId}`);
        return;
      }
      await createOwnerScheduleEntry(token, {
        courtId: Number(courtId),
        startTime: `${date}T${startTime}:00`,
        endTime: `${date}T${endTime}:00`,
        entryType: entryType === 'WalkIn' ? 'WalkIn' : 'Blocked',
        title: isWalkInEntry ? undefined : title.trim() || undefined,
        customerPlayerId: isWalkInEntry ? customerPlayer?.playerId : undefined,
        customerName: isWalkInEntry && !customerPlayer ? customerQuery.trim() : undefined,
        customerPhone: isWalkInEntry && !customerPlayer ? customerPhone.trim() || undefined : undefined,
        amount: isWalkInEntry ? Number(amountValue) : undefined,
        paymentMethod: isWalkInEntry ? paymentMethod : undefined,
      });
      setTitle('');
      setSelectedSlot(null);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError
        ? requestError.message
        : isTicketEntry ? 'Không thể tạo buổi xé vé.' : 'Không thể tạo lịch vận hành.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateStatus = async (item: OwnerScheduleItem, status: 'Confirmed' | 'Cancelled') => {
    if (!token) return;
    // Cancelling from a multi-slot booking (e.g. a whole-month package) only cancels the clicked
    // occurrence, not the whole booking — mirrors selectedSlotItem.canCancel below.
    const groupId = status === 'Cancelled' ? selectedSlot?.bookingCheckInGroupId : null;
    if (status === 'Cancelled' && !(await confirm({
      title: groupId
        ? `Hủy buổi ${dateLabel(selectedSlot!.startTime.slice(0, 10))} ${timeValue(selectedSlot!.startTime)}?`
        : `Hủy booking #${item.bookingId}?`,
      message: groupId
        ? 'Chỉ buổi này bị hủy, các buổi khác trong gói vẫn giữ nguyên. Nếu buổi này đã thanh toán, khoản tương ứng sẽ chuyển sang chờ hoàn tiền.'
        : item.requiresRefund
          ? 'Khoản đã thanh toán sẽ chuyển sang chờ hoàn tiền và người chơi nhận được thông báo kèm lý do.'
          : 'Slot sẽ được trả về trạng thái trống và người chơi nhận được thông báo kèm lý do.',
      confirmLabel: groupId ? 'Hủy buổi này' : 'Hủy booking',
      tone: 'danger',
    }))) return;
    if (status === 'Confirmed' && !(await confirm({
      title: `Xác nhận booking #${item.bookingId}?`,
      message: 'Người chơi sẽ nhận thông báo booking đã được xác nhận.',
      confirmLabel: 'Xác nhận booking',
      tone: 'success',
    }))) return;
    try {
      if (groupId) {
        await cancelOwnerBookingCheckInGroup(token, item.bookingId, groupId, cancelReason.trim());
      } else {
        await updateOwnerBookingStatus(token, item.bookingId, status, cancelReason.trim() || undefined);
      }
      setSelectedSlot(null);
      setIsCancelPanelOpen(false);
      setCancelReason('');
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật booking.');
    }
  };

  const markRefunded = async (item: OwnerScheduleItem) => {
    if (!token) return;
    if (!refundProof) {
      setError('Vui lòng chọn ảnh minh chứng chuyển khoản hoàn tiền.');
      return;
    }
    if (!(await confirm({
      title: `Gửi minh chứng hoàn tiền booking #${item.bookingId}?`,
      message: 'Player sẽ xem ảnh để xác nhận đã nhận tiền hoặc gửi khiếu nại.',
      confirmLabel: 'Gửi minh chứng',
      tone: 'success',
    }))) return;
    try {
      await submitOwnerBookingRefundProof(token, item.bookingId, refundProof, refundReference.trim() || undefined);
      setSelectedSlot(null);
      setRefundReference('');
      setRefundProof(null);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể gửi minh chứng hoàn tiền.');
    }
  };

  const unlock = async (item: OwnerScheduleItem) => {
    if (!token) return;
    const isPastItem = hasPassed(item.endTime);
    if (!(await confirm({
      title: `Mở khóa lịch “${item.title || `#${item.bookingId}`}”?`,
      message: isPastItem
        ? 'Khung giờ này đã trôi qua nên mở khóa không giúp người chơi đặt lại được.'
        : 'Slot sẽ trở lại trạng thái trống và người chơi có thể đặt.',
      confirmLabel: 'Mở khóa lịch',
      tone: isPastItem ? 'danger' : 'default',
    }))) return;
    try {
      await deleteOwnerScheduleEntry(token, item.bookingId);
      setSelectedSlot(null);
      await load();
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể mở khóa lịch.');
    }
  };

  const moveDate = (days: number) => setDate((current) => addDays(current, days));

  return (
    <OwnerShell activeId="schedule">
      <section className="owner-page-header">
        <div>
          <p className="owner-kicker"><CalendarDays className="h-4 w-4" /> Lịch vận hành</p>
          <h1 className="mt-2">Quản lý lịch đặt sân</h1>
          <p className="mt-1">Theo dõi toàn bộ sân con theo trục thời gian 30 phút và thao tác trực tiếp trên từng ô.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button aria-label="Ngày trước" className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={() => moveDate(-1)} title="Ngày trước" type="button">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <input
            className="rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-[14px] font-bold"
            aria-label="Ngày xem lịch"
            onChange={(event) => setDate(event.target.value)}
            type="date"
            value={date}
          />
          <button aria-label="Ngày sau" className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={() => moveDate(1)} title="Ngày sau" type="button">
            <ChevronRight className="h-5 w-5" />
          </button>
          <select aria-label="Lọc theo cụm sân" className="rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-[14px] font-bold" onChange={(event) => setVenueFilter(event.target.value)} value={venueFilter}>
            <option value="all">Tất cả cụm sân</option>
            {schedule?.venues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}
          </select>
          <button aria-label="Tải lại lịch" className="rounded-lg border border-outline-variant bg-white p-2.5" onClick={() => void load()} title="Tải lại" type="button">
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="owner-stat-grid sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: 'Slot còn trống', value: availableCount, icon: Clock },
          { label: 'Slot đang giữ', value: holdingCount, icon: Clock },
          { label: 'Slot đã đặt', value: bookedCount, icon: CheckCircle2 },
        ].map((item) => (
          <div className="owner-stat-card" key={item.label}>
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold text-on-surface-variant">{item.label}</p>
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <p className="mt-2 font-mono text-[22px] font-extrabold">{item.value}</p>
          </div>
        ))}
      </section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700" role="alert">{error}</div>}

      <section className="owner-schedule-stage owner-panel">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant p-4">
          <div>
            <h2 className="text-[18px] font-bold">Bảng lịch ngày {dateLabel(date)}</h2>
            <p className="mt-1 text-[12px] text-on-surface-variant">
              {schedule ? `${schedule.venues.length} cụm sân · bước ${schedule.slotMinutes} phút` : 'Đang tải lịch'}
            </p>
          </div>
          <Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[12px] font-bold hover:bg-surface-container-low" to="/owner/bookings">
            <Eye className="h-4 w-4" /> Danh sách đơn
          </Link>
        </div>

        {isLoading && <p className="p-10 text-center font-bold text-on-surface-variant">Đang sinh lịch...</p>}
        {!isLoading && schedule && visibleSlots.length === 0 && (
          <p className="p-10 text-center font-bold text-on-surface-variant">Chưa có sân con hoặc chưa thiết lập giờ mở cửa.</p>
        )}
        {!isLoading && schedule && visibleSlots.length > 0 && (
          <OwnerTimelineGrid
            onSelectSlot={applySlotToForm}
            schedule={schedule}
            selectedSlot={selectedSlot}
            venueFilter={venueFilter}
          />
        )}
      </section>

      <section className="owner-panel p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[18px] font-bold">Giờ mở cửa</h2>
            <p className="mt-1 text-[12px] text-on-surface-variant">Thiết lập giờ vận hành tại hồ sơ từng cụm sân.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {schedule?.venues.map((venue) => (
              <Link className="rounded-lg bg-surface-container-low px-3 py-2 text-[12px] font-bold hover:bg-white" key={venue.venueId} to={`/owner/courts/${venue.venueId}/edit`}>
                {venue.venueName}: {venue.openTime.slice(0, 5)}-{venue.closeTime.slice(0, 5)}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {selectedSlot && (
        <ModalDialog
          aria-labelledby="owner-slot-title"
          className="owner-modal max-w-2xl p-5"
          onRequestClose={() => setSelectedSlot(null)}
          style={{ width: 'calc(100% - 1.75rem)' }}
        >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[12px] font-bold uppercase tracking-wide text-primary">Thông tin khung giờ</p>
                <h2 className="mt-1 text-[24px] font-bold" id="owner-slot-title">{selectedSlot.venueName} · Sân {selectedSlot.courtNumber}</h2>
              </div>
              <button aria-label="Đóng" className="rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-low" onClick={() => setSelectedSlot(null)} type="button">
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 text-[13px] md:grid-cols-4">
              <div className="rounded-lg bg-surface-container-low p-3"><p className="font-bold text-on-surface-variant">Ngày</p><p className="mt-1 font-bold">{dateLabel(selectedSlot.startTime.slice(0, 10))}</p></div>
              <div className="rounded-lg bg-surface-container-low p-3">
                <p className="font-bold text-on-surface-variant">Thời gian</p>
                <p className="mt-1 font-bold">{timeValue(selectedSlot.startTime)}-{timeValue(selectedSlot.endTime)}</p>
                {hasPassed(selectedSlot.endTime) && (
                  <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                    <AlertTriangle aria-hidden="true" className="h-3 w-3" /> Đã qua
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-surface-container-low p-3"><p className="font-bold text-on-surface-variant">Trạng thái</p><p className="mt-1 font-bold">{slotStatusLabel[selectedSlot.status]}</p></div>
              <div className="rounded-lg bg-surface-container-low p-3"><p className="font-bold text-on-surface-variant">Mã booking</p><p className="mt-1 font-bold">{selectedSlot.bookingId ? `#${selectedSlot.bookingId}` : '-'}</p></div>
            </div>

            {selectedSlotItem && (
              <div className="mt-4 rounded-xl border border-outline-variant p-4">
                <p className="flex items-center gap-2 text-[14px] font-bold"><Eye className="h-4 w-4 text-primary" /> Chi tiết booking</p>
                <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Nội dung</span><strong className="text-right">{selectedSlotItem.title || (statusLabel[selectedSlotItem.status] ?? selectedSlotItem.status)}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Khách hàng</span><strong className="text-right">{selectedSlotItem.customerName || '-'}</strong></div>
                  <div className="flex justify-between gap-4">
                    <span className="text-on-surface-variant">Số điện thoại</span>
                    {selectedSlotItem.customerPhone
                      ? <a className="text-right font-bold text-primary hover:underline" href={`tel:${selectedSlotItem.customerPhone}`}>{selectedSlotItem.customerPhone}</a>
                      : <strong className="text-right text-on-surface-variant">Chưa cập nhật</strong>}
                  </div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Thanh toán</span><strong className="text-right">{getPaymentStatusLabel(selectedSlotItem.paymentStatus)}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Số tiền</span><strong className="text-right">{selectedSlotItem.amount ? money.format(selectedSlotItem.amount) : '-'}</strong></div>
                  <div className="flex justify-between gap-4"><span className="text-on-surface-variant">Trạng thái check-in</span><strong className="text-right">{checkInStatusLabel[selectedSlot.checkInStatus ?? selectedSlotItem.checkInStatus ?? ''] ?? selectedSlot.checkInStatus ?? selectedSlotItem.checkInStatus ?? '-'}</strong></div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedSlotItem.entryType === 'TicketSession' ? (
                    <Link className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white" to="/owner/ticket-sessions">
                      <Ticket className="h-4 w-4" /> Quản lý buổi xé vé
                    </Link>
                  ) : selectedSlotItem.isOwnerEntry ? (
                    <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-[13px] font-bold" onClick={() => void unlock(selectedSlotItem)} type="button">
                      <Unlock className="h-4 w-4" /> Mở khóa lịch
                    </button>
                  ) : (
                    <>
                      {selectedSlotItem.customerUserId && (
                        <Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-[13px] font-bold text-primary" to={`/owner/messages?chatWithUserId=${selectedSlotItem.customerUserId}&bookingId=${selectedSlotItem.bookingId}`}>
                          <MessageCircle className="h-4 w-4" /> Liên hệ khách hàng
                        </Link>
                      )}
                      {selectedSlotItem.status === 'Holding' && (
                        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white" onClick={() => void updateStatus(selectedSlotItem, 'Confirmed')} type="button">
                          <CheckCircle2 className="h-4 w-4" /> Xác nhận đặt sân
                        </button>
                      )}
                      {selectedSlotItem.refundPending ? (
                        <div className="basis-full rounded-lg border border-amber-300 bg-amber-50 p-3">
                          <p className="flex items-center gap-2 text-[13px] font-bold text-amber-900">
                            <AlertTriangle aria-hidden="true" className="h-4 w-4" /> Booking đã hủy, còn nợ khách khoản đã thanh toán.
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-amber-400 bg-white px-3 py-2 text-[13px] font-bold text-amber-900">
                              <ImageUp className="h-4 w-4" /> {refundProof?.name ?? 'Chọn ảnh minh chứng'}
                              <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setRefundProof(event.target.files?.[0] ?? null)} type="file" />
                            </label>
                            <input aria-label="Tham chiếu chuyển khoản hoàn tiền" className="min-w-[180px] flex-1 rounded-lg border border-outline-variant px-3 py-2 text-[13px]" maxLength={200} onChange={(event) => setRefundReference(event.target.value)} placeholder="Mã giao dịch hoàn tiền (không bắt buộc)" value={refundReference} />
                            <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={!refundProof} onClick={() => void markRefunded(selectedSlotItem)} type="button">
                              <Banknote className="h-4 w-4" /> Gửi minh chứng
                            </button>
                          </div>
                        </div>
                      ) : isCancelPanelOpen ? (
                        <div className="basis-full rounded-lg border border-red-200 bg-red-50 p-3">
                          <label className="block text-[13px] font-bold text-red-700">
                            Lý do hủy *
                            <textarea className="mt-1.5 h-16 w-full resize-none rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-normal text-on-surface" maxLength={500} onChange={(event) => setCancelReason(event.target.value)} placeholder="Ví dụ: sân ngập nước, mất điện..." value={cancelReason} />
                          </label>
                          {selectedSlot!.bookingCheckInGroupId && (
                            <p className="mt-1 text-[12px] font-bold text-on-surface-variant">Chỉ buổi này bị hủy, các buổi khác trong gói vẫn giữ nguyên.</p>
                          )}
                          {selectedSlotItem.requiresRefund && (
                            <p className="mt-1 text-[12px] font-bold text-amber-900">Đơn đã thanh toán: hủy xong sẽ phải hoàn tiền cho khách.</p>
                          )}
                          <div className="mt-2 flex flex-wrap gap-2">
                            <button className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={!cancelReason.trim()} onClick={() => void updateStatus(selectedSlotItem, 'Cancelled')} type="button">
                              <XCircle className="h-4 w-4" /> Xác nhận hủy
                            </button>
                            <button className="rounded-lg border border-outline-variant px-4 py-2 text-[13px] font-bold" onClick={() => { setIsCancelPanelOpen(false); setCancelReason(''); }} type="button">
                              Giữ booking
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <button className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-[13px] font-bold text-red-600 disabled:cursor-not-allowed disabled:bg-red-50 disabled:opacity-50" disabled={!selectedSlot!.canCancel} onClick={() => setIsCancelPanelOpen(true)} title={!selectedSlot!.canCancel ? cancellationBlockedMessage : undefined} type="button">
                            <XCircle className="h-4 w-4" /> {selectedSlot!.bookingCheckInGroupId ? 'Hủy buổi này' : 'Hủy booking'}
                          </button>
                          {!selectedSlot!.canCancel && <p className="basis-full text-[12px] font-bold text-red-600">{cancellationBlockedMessage}</p>}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {selectedSlot.status === 'Available' && (
              <form className="mt-4 rounded-xl border border-outline-variant p-4" onSubmit={createEntry}>
                <p className="text-[14px] font-bold">{isTicketEntry ? 'Tạo buổi xé vé cho khung giờ này' : 'Tạo lịch vận hành cho khung giờ này'}</p>
                {actionError && (
                  <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13px] font-bold text-red-700" role="alert">{actionError}</p>
                )}
                {isPastEntryRange && (
                  <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-[13px] font-bold text-amber-900" role="alert">
                    <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{isTicketEntry ? 'Buổi xé vé chỉ được tạo cho khung giờ trong tương lai.' : `Khung giờ ${pastRangeLabel} đã trôi qua. Kiểm tra lại ngày giờ trước khi lưu.`}</span>
                  </p>
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-[13px] font-bold">Loại lịch</span>
                    <select className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" onChange={(event) => setEntryType(event.target.value as OwnerSlotEntryType)} value={entryType}>
                      <option value="Blocked">Khóa khung giờ</option>
                      <option value="WalkIn">Đặt tại sân cho player</option>
                      <option value="TicketSession">Xé vé</option>
                    </select>
                  </label>
                  {isWalkInEntry ? (
                    <>
                    <label className="relative">
                      <span className="mb-1.5 block text-[13px] font-bold">Khách hàng *</span>
                      {customerPlayer ? (
                        <span className="flex items-center justify-between gap-2 rounded-lg border border-primary bg-primary/5 px-3 py-2.5 text-[14px] font-bold">
                          {customerPlayer.playerName}
                          <button aria-label="Bỏ chọn người chơi" className="rounded p-1 hover:bg-primary/10" onClick={() => { setCustomerPlayer(null); setCustomerQuery(''); }} type="button">
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      ) : (
                        <input className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" maxLength={200} onChange={(event) => setCustomerQuery(event.target.value)} placeholder="Tìm player theo tên/SĐT, hoặc gõ tên khách" required value={customerQuery} />
                      )}
                      {playerResults.length > 0 && !customerPlayer && (
                        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-outline-variant bg-white shadow-lg">
                          {playerResults.map((player) => (
                            <button className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] hover:bg-surface-container-low" key={player.playerId} onClick={() => { setCustomerPlayer(player); setPlayerResults([]); }} type="button">
                              <UserPlus className="h-4 w-4 text-primary" />
                              <span className="font-bold">{player.playerName}</span>
                              <span className="text-on-surface-variant">{player.phoneNumber ?? ''}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {!customerPlayer && customerQuery.trim().length > 0 && (
                        <span className="mt-1 block text-[12px] text-on-surface-variant">Không chọn player thì lưu là khách vãng lai.</span>
                      )}
                    </label>
                    <label>
                      <span className="mb-1.5 block text-[13px] font-bold">Số điện thoại</span>
                      {customerPlayer ? (
                        <span className="block rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2.5 text-[14px] font-bold text-on-surface-variant">
                          {customerPlayer.phoneNumber || 'Hồ sơ player chưa có số'}
                        </span>
                      ) : (
                        <input className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" maxLength={30} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="Không bắt buộc" type="tel" value={customerPhone} />
                      )}
                    </label>
                    </>
                  ) : isTicketEntry ? (
                    <label>
                      <span className="mb-1.5 block text-[13px] font-bold">Tên buổi xé vé *</span>
                      <input className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" maxLength={200} minLength={3} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Kèo đôi tối Chủ nhật" required value={title} />
                    </label>
                  ) : (
                    <label>
                      <span className="mb-1.5 block text-[13px] font-bold">Ghi chú</span>
                      <input className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" maxLength={200} onChange={(event) => setTitle(event.target.value)} value={title} />
                    </label>
                  )}
                  <label>
                    <span className="mb-1.5 block text-[13px] font-bold">Bắt đầu</span>
                    <select className="w-full rounded-lg border border-outline-variant px-3 py-2.5" onChange={(event) => setStartTime(event.target.value)} required value={startTime}>
                      {operationTimeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[13px] font-bold">Kết thúc</span>
                    <select className="w-full rounded-lg border border-outline-variant px-3 py-2.5" onChange={(event) => setEndTime(event.target.value)} required value={endTime}>
                      {operationTimeOptions.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                </div>

                {isTicketEntry && (
                  <div className="mt-3 rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-[13px] font-bold">Mô tả</span>
                        <textarea className="min-h-20 w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-[14px]" maxLength={2000} onChange={(event) => setTicketDescription(event.target.value)} placeholder="Thông tin dành cho player (không bắt buộc)" value={ticketDescription} />
                      </label>
                      <label>
                        <span className="mb-1.5 block text-[13px] font-bold">Trình độ tối thiểu</span>
                        <select className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5" onChange={(event) => { setTicketMinSkillLevel(event.target.value); if (Number(event.target.value) > Number(ticketMaxSkillLevel)) setTicketMaxSkillLevel(event.target.value); }} value={ticketMinSkillLevel}>
                          {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Level {value}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="mb-1.5 block text-[13px] font-bold">Trình độ tối đa</span>
                        <select className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5" onChange={(event) => { setTicketMaxSkillLevel(event.target.value); if (Number(event.target.value) < Number(ticketMinSkillLevel)) setTicketMinSkillLevel(event.target.value); }} value={ticketMaxSkillLevel}>
                          {[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Level {value}</option>)}
                        </select>
                      </label>
                      <label>
                        <span className="mb-1.5 block text-[13px] font-bold">Hình thức</span>
                        <select className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5" onChange={(event) => setTicketPlayFormat(event.target.value)} value={ticketPlayFormat}>
                          <option value="1vs1">Đánh đơn · 1vs1</option>
                          <option value="2vs2">Đánh đôi · 2vs2</option>
                        </select>
                      </label>
                      <label>
                        <span className="mb-1.5 block text-[13px] font-bold">Số người tối đa</span>
                        <input className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5" max={100} min={1} onChange={(event) => setTicketMaxPlayers(event.target.value)} required step={1} type="number" value={ticketMaxPlayers} />
                      </label>
                      <label className="sm:col-span-2">
                        <span className="mb-1.5 block text-[13px] font-bold">Giá mỗi vé (VND)</span>
                        <input className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5 font-bold" min={0} onChange={(event) => setTicketPrice(event.target.value)} required step={1} type="number" value={ticketPrice} />
                      </label>
                    </div>
                    <p className="mt-3 text-[12px] text-on-surface-variant">Buổi xé vé sẽ được lưu dưới dạng bản nháp. Sau khi tạo, bạn sẽ được chuyển tới trang quản lý để kiểm tra và mở bán.</p>
                  </div>
                )}

                {isWalkInEntry && (
                  <div className="mt-3 rounded-xl border border-outline-variant bg-surface-container-low p-3">
                    <div className="flex flex-wrap items-end gap-3">
                      <label className="min-w-[160px] flex-1">
                        <span className="mb-1.5 block text-[13px] font-bold">Số tiền thu</span>
                        <input className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px] font-bold" min={0} onChange={(event) => setAmountOverride(event.target.value)} step={1000} type="number" value={amountValue} />
                      </label>
                      {amountOverride !== null && amountOverride !== String(defaultAmount) && (
                        <button className="rounded-lg border border-outline-variant px-3 py-2.5 text-[13px] font-bold" onClick={() => setAmountOverride(null)} type="button">
                          Về giá sân
                        </button>
                      )}
                    </div>
                    <p className="mt-2 text-[12px] text-on-surface-variant">
                      {walkInSlotCount} slot × {money.format(selectedCourt?.hourlyPrice ?? 0)}/giờ = <strong>{money.format(defaultAmount)}</strong>
                    </p>

                    {customerPlayer ? (
                      <label className="mt-3 block">
                        <span className="mb-1.5 block text-[13px] font-bold">Thanh toán</span>
                        <select className="w-full rounded-lg border border-outline-variant px-3 py-2.5 text-[14px]" onChange={(event) => setPaymentMethod(event.target.value as OwnerWalkInPaymentMethod)} value={paymentMethod}>
                          <option value="Cash">Đã thu tiền mặt</option>
                          <option value="BankTransfer">Đã thu chuyển khoản</option>
                          <option value="Unpaid">Chưa thu</option>
                        </select>
                      </label>
                    ) : (
                      <label className="mt-3 flex items-center gap-2 text-[13px] font-bold">
                        <input checked={paymentMethod !== 'Unpaid'} className="h-4 w-4" onChange={(event) => setPaymentMethod(event.target.checked ? 'Cash' : 'Unpaid')} type="checkbox" />
                        Đã thu tiền
                      </label>
                    )}
                    <p className="mt-2 text-[12px] text-on-surface-variant">
                      {paymentMethod === 'Unpaid'
                        ? 'Đơn chưa thu sẽ không được tính vào doanh thu cho tới khi thu tiền.'
                        : 'Đơn sẽ được tính vào doanh thu ngay.'}
                    </p>
                  </div>
                )}

                <button className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white disabled:opacity-60" disabled={isSaving || !courtId || (isWalkInEntry && !customerPlayer && !customerQuery.trim()) || (isTicketEntry && title.trim().length < 3)} type="submit">
                  {isWalkInEntry ? <Banknote className="h-4 w-4" /> : isTicketEntry ? <Ticket className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                  {isSaving ? 'Đang lưu...' : entryLabel[entryType]}
                </button>
              </form>
            )}
        </ModalDialog>
      )}
    </OwnerShell>
  );
};
