import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Eye,
  HelpCircle,
  Map,
  Phone,
  Search,
  Settings,
  User,
  UserRound,
  UsersRound,
} from 'lucide-react';
import { OwnerShell } from './components/OwnerShell';
import {
  BookingDetail,
  BookingPaymentStatus,
  BookingStatus,
  formatBookingCurrency,
  formatBookingDate,
} from '../../data/bookings';
import { getOwnerBookings } from '../../api/owner';
import type { BankTransfer } from '../../api/booking';
import { getOperatorBookingPayments, getOperatorPayment } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';
import { PaginationControls } from '../../components/PaginationControls';
import { preloadReceiptImage } from '../../utils/receiptImage';
import { ownerBookingToDetail } from './ownerBookingAdapter';
import { OwnerMatchTransactionReviewModal } from './components/OwnerMatchTransactionReviewModal';
import { OwnerTransactionReviewModal } from './components/OwnerTransactionReviewModal';
import { OwnerBookingSlotSummary } from './components/OwnerBookingSlotSummary';

type BookingStateFilter = 'all' | BookingStatus | 'ready_checkin';
type OwnerBookingKind = 'regular' | 'match';
type OwnerBookingListItem = BookingDetail & {
  paymentId?: number | null;
  fallbackPayment?: BankTransfer;
  matchId?: number | null;
  matchType?: string | null;
  requiredPlayerCount?: number | null;
  acceptedPlayerCount?: number | null;
  refundAmount?: number;
  hasRefundPending?: boolean;
  hasRefunded?: boolean;
  matchPlayers: Array<{
    playerId: number;
    playerName: string;
    isHost: boolean;
    paymentStatus: string;
  }>;
};
type PrefetchedPayment = {
  promise: Promise<BankTransfer>;
  data?: BankTransfer;
};
type PrefetchedMatchPayments = {
  promise: Promise<BankTransfer[]>;
  data?: BankTransfer[];
};

const bookingStateFilterOptions: Array<{ label: string; value: BookingStateFilter }> = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Chờ xử lý', value: 'holding' },
  { label: 'Đã hủy', value: 'cancelled' },
  { label: 'Sẵn sàng check-in', value: 'ready_checkin' },
];

const getLocalDateValue = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatBookingCreatedTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));

const formatPlayDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));

const getBookingStatusLabel = (booking: OwnerBookingListItem) => {
  const needsRefund = booking.hasRefundPending
    || booking.matchPlayers?.some((p) => p.paymentStatus === 'RefundPending');

  if (needsRefund) {
    return 'Đã hủy · Chờ hoàn tiền';
  }

  if (booking.hasRefunded || booking.matchPlayers?.some((p) => p.paymentStatus === 'Refunded')) {
    return 'Đã hủy · Đã hoàn tiền';
  }

  if (booking.bookingStatus === 'cancelled') {
    return 'Đã hủy';
  }

  if (booking.paymentStatus === 'failed') {
    return 'Thanh toán lỗi';
  }

  if (booking.bookingStatus === 'confirmed') {
    return 'Đã xác nhận';
  }

  return 'Đang giữ tạm';
};

const getBookingStatusClassName = (booking: OwnerBookingListItem) => {
  const needsRefund = booking.hasRefundPending
    || booking.matchPlayers?.some((p) => p.paymentStatus === 'RefundPending');

  if (needsRefund) {
    return 'bg-amber-100 text-amber-900 border border-amber-300 font-bold';
  }

  if (booking.hasRefunded || booking.matchPlayers?.some((p) => p.paymentStatus === 'Refunded')) {
    return 'bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold';
  }

  if (booking.bookingStatus === 'cancelled' || booking.paymentStatus === 'failed') {
    return 'bg-[#ffdad6] text-[#ba1a1a]';
  }

  if (booking.bookingStatus === 'confirmed') {
    return 'bg-green-100 text-green-700';
  }

  return 'bg-[#fff4d8] text-[#7a5600]';
};

const normalizePaymentStatus = (status: string): BookingPaymentStatus =>
  status === 'Paid' ? 'paid' : status === 'Cancelled' || status === 'Expired' ? 'failed' : 'pending';

const normalizeBookingStatus = (status: string): BookingStatus =>
  status === 'Confirmed' ? 'confirmed' : status === 'Cancelled' || status === 'Expired' ? 'cancelled' : 'holding';

const normalizeBankTransferStatus = (status: string): BankTransfer['paymentStatus'] => {
  if (status === 'WaitingForConfirmation' || status === 'Paid' || status === 'Expired' || status === 'Cancelled' || status === 'RefundPending' || status === 'Refunded') return status;
  return 'Pending';
};

const emptyBookings: OwnerBookingListItem[] = [];
const emptyPagination = { page: 1, pageSize: 10, totalCount: 0, totalPages: 1 };

type OwnerBookingsPage = {
  pagination: typeof emptyPagination;
  bookings: OwnerBookingListItem[];
};

export const OwnerBookings = ({ kind = 'regular' }: { kind?: OwnerBookingKind }) => {
  const { token } = useAuth();
  const isMatchBooking = kind === 'match';
  const today = useMemo(getLocalDateValue, []);
  const [selectedDate, setSelectedDate] = useState(today);
  const [bookingStateFilter, setBookingStateFilter] = useState<BookingStateFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);
  const [actionError, setActionError] = useState('');
  const [transactionTarget, setTransactionTarget] = useState<{
    paymentId: number;
    bookingCode: string;
    prefetched: PrefetchedPayment;
  } | null>(null);
  const [matchTransactionTarget, setMatchTransactionTarget] = useState<{
    bookingId: number;
    bookingCode: string;
    booking: OwnerBookingListItem;
    prefetched?: PrefetchedMatchPayments | null;
  } | null>(null);
  const paymentPrefetchCache = useRef(new globalThis.Map<number, PrefetchedPayment>());
  const matchPaymentPrefetchCache = useRef(new globalThis.Map<number, PrefetchedMatchPayments>());
  const realtimeReloadTimer = useRef<number | null>(null);

  const applyPaymentUpdate = useCallback((payment: BankTransfer) => {
    setBookings((current) => current.map((booking) => Number(booking.id) === payment.bookingId
      ? {
          ...booking,
          paymentId: payment.paymentId,
          paymentStatus: normalizePaymentStatus(payment.paymentStatus),
          bookingStatus: payment.bookingStatus
            ? normalizeBookingStatus(payment.bookingStatus)
            : payment.paymentStatus === 'Paid' ? 'confirmed' : booking.bookingStatus,
          holdExpiresAt: payment.holdExpiresAt ?? booking.holdExpiresAt,
          fallbackPayment: booking.fallbackPayment
            ? { ...booking.fallbackPayment, ...payment }
            : payment,
        }
      : booking));
  }, []);

  const prefetchPayment = useCallback((paymentId: number, fallbackPayment?: BankTransfer) => {
    if (!token) return null;
    const cached = paymentPrefetchCache.current.get(paymentId);
    if (cached) return cached;

    const prefetched: PrefetchedPayment = {
      promise: Promise.resolve(null as unknown as BankTransfer),
    };
    prefetched.promise = getOperatorPayment(token, paymentId)
      .then((payment) => {
        const resolvedPayment = payment.paymentId === paymentId ? payment : fallbackPayment;
        if (!resolvedPayment) throw new Error('API không trả về thông tin giao dịch.');
        prefetched.data = resolvedPayment;
        preloadReceiptImage(resolvedPayment.receiptImageUrl);
        return resolvedPayment;
      })
      .catch((reason) => {
        paymentPrefetchCache.current.delete(paymentId);
        throw reason;
      });
    void prefetched.promise.catch(() => undefined);
    paymentPrefetchCache.current.set(paymentId, prefetched);
    return prefetched;
  }, [token]);

  const prefetchMatchPayments = useCallback((bookingId: number) => {
    if (!token) return null;
    const cached = matchPaymentPrefetchCache.current.get(bookingId);
    if (cached) return cached;

    const prefetched: PrefetchedMatchPayments = {
      promise: Promise.resolve([]),
    };
    prefetched.promise = getOperatorBookingPayments(token, bookingId)
      .then((payments) => {
        prefetched.data = payments;
        payments.forEach((payment) => preloadReceiptImage(payment.receiptImageUrl));
        return payments;
      })
      .catch((reason) => {
        matchPaymentPrefetchCache.current.delete(bookingId);
        throw reason;
      });
    void prefetched.promise.catch(() => undefined);
    matchPaymentPrefetchCache.current.set(bookingId, prefetched);
    return prefetched;
  }, [token]);

  const {
    data,
    error: loadError,
    loading: isLoading,
    refresh: load,
    setData,
  } = useApiQuery<OwnerBookingsPage>(
    ['owner-bookings', token, kind, selectedDate, debouncedSearchTerm, page],
    async () => {
      const result = await getOwnerBookings(token!, {
        bookingType: kind,
        from: selectedDate,
        to: selectedDate,
        search: debouncedSearchTerm || undefined,
        page,
        pageSize: 10,
      });
      return {
        pagination: {
          page: result.page,
          pageSize: result.pageSize,
          totalCount: result.totalCount,
          totalPages: result.totalPages,
        },
        bookings: result.items.map((record) => {
          const fallbackPayment: BankTransfer | undefined = record.paymentId ? {
            paymentId: record.paymentId,
            groupPaymentCount: 1,
            groupTotalAmount: record.totalAmount,
            bookingId: record.bookingId,
            bookingCode: record.bookingCode,
            bookingStatus: record.bookingStatus,
            paymentStatus: normalizeBankTransferStatus(record.paymentStatus),
            amount: record.totalAmount,
            transferCode: record.transferCode,
            transferContent: record.transferCode,
            receiptImageUrl: record.receiptImageUrl,
            verifiedAt: record.paymentVerifiedAt,
            rejectionReason: record.rejectionReason,
            holdExpiresAt: record.holdExpiresAt,
            venueId: record.venueId,
            venueName: record.venueName,
            courtNumber: record.courtNumber,
            startTime: record.startTime,
            endTime: record.endTime,
            playerName: record.playerName,
            slots: record.slots.map((slot) => ({
              courtId: slot.courtId,
              courtNumber: slot.courtNumber,
              startTime: slot.startTime,
              endTime: slot.endTime,
            })),
            history: record.paymentHistory.map((entry) => ({
              fromStatus: entry.fromStatus,
              toStatus: entry.toStatus,
              action: entry.action,
              reason: entry.reason,
              createdAt: entry.createdAt,
            })),
          } : undefined;

          return {
            ...ownerBookingToDetail(record),
            paymentId: record.paymentId,
            fallbackPayment,
            matchId: record.matchId,
            matchType: record.matchType,
            requiredPlayerCount: record.requiredPlayerCount,
            acceptedPlayerCount: record.acceptedPlayerCount,
            matchPlayers: record.matchPlayers ?? [],
            refundAmount: record.refundAmount,
            hasRefundPending: record.paymentStatus === 'RefundPending'
              || (record.matchPlayers ?? []).some((p) => p.paymentStatus === 'RefundPending'),
            hasRefunded: record.paymentStatus === 'Refunded'
              || (record.matchPlayers ?? []).some((p) => p.paymentStatus === 'Refunded'),
          };
        }),
      };
    },
    { enabled: Boolean(token), errorMessage: 'Không thể tải booking.' },
  );

  const bookings = data?.bookings ?? emptyBookings;
  const pagination = data?.pagination ?? emptyPagination;
  const error = actionError || loadError;
  const setError = setActionError;

  const openMatchTransaction = (booking: OwnerBookingListItem) => {
    setError('');
    const prefetched = prefetchMatchPayments(Number(booking.id));
    setMatchTransactionTarget({
      bookingId: Number(booking.id),
      bookingCode: booking.code,
      booking,
      prefetched,
    });
  };

  const setBookings = useCallback((
    updater: (current: OwnerBookingListItem[]) => OwnerBookingListItem[],
  ) => {
    setData((current) => ({
      pagination: current?.pagination ?? emptyPagination,
      bookings: updater(current?.bookings ?? emptyBookings),
    }));
  }, [setData]);

  const scheduleRealtimeReload = useCallback(() => {
    if (realtimeReloadTimer.current !== null) window.clearTimeout(realtimeReloadTimer.current);
    realtimeReloadTimer.current = window.setTimeout(() => {
      realtimeReloadTimer.current = null;
      void load();
    }, 120);
  }, [load]);

  useEffect(() => () => {
    if (realtimeReloadTimer.current !== null) window.clearTimeout(realtimeReloadTimer.current);
  }, []);
  useScheduleRealtime((event) => {
    if (!event.action.startsWith('Payment')) scheduleRealtimeReload();
  });
  useMatchRealtime(() => {
    if (kind === 'match') scheduleRealtimeReload();
  });
  usePaymentRealtime((event) => {
    paymentPrefetchCache.current.delete(event.paymentId);
    matchPaymentPrefetchCache.current.delete(event.bookingId);
    setBookings((current) => current.map((booking) => Number(booking.id) === event.bookingId
      ? {
          ...booking,
          paymentStatus: normalizePaymentStatus(event.paymentStatus),
          bookingStatus: event.paymentStatus === 'Paid' ? 'confirmed' : booking.bookingStatus,
          fallbackPayment: booking.fallbackPayment ? {
            ...booking.fallbackPayment,
            paymentStatus: normalizeBankTransferStatus(event.paymentStatus),
            bookingStatus: event.paymentStatus === 'Paid' ? 'Confirmed' : booking.fallbackPayment.bookingStatus,
          } : booking.fallbackPayment,
        }
      : booking));

    if (kind === 'match') {
      const prefetched = prefetchMatchPayments(event.bookingId);
      void prefetched?.promise.catch(() => undefined);
      return;
    }

    const prefetched = prefetchPayment(event.paymentId);
    void prefetched?.promise
      .then((payment) => applyPaymentUpdate(payment))
      .catch(() => undefined);
  });

  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        const matchesSelectedDate = getLocalDateValue(new Date(booking.createdAt)) === selectedDate;
        const matchesKeyword =
          !keyword ||
          booking.code.toLowerCase().includes(keyword) ||
          booking.customerName.toLowerCase().includes(keyword) ||
          booking.customerPhone.toLowerCase().includes(keyword) ||
          booking.courtName.toLowerCase().includes(keyword) ||
          booking.subCourt.toLowerCase().includes(keyword);
        const matchesBookingState =
          bookingStateFilter === 'all' ||
          (bookingStateFilter === 'ready_checkin'
            ? booking.checkInStatus === 'ready'
            : booking.bookingStatus === bookingStateFilter);

        return matchesSelectedDate && matchesKeyword && matchesBookingState;
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [bookingStateFilter, bookings, searchTerm, selectedDate]);

  const changeSelectedDate = (dayOffset: number) => {
    const nextDate = new Date(`${selectedDate}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + dayOffset);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setPage(1);
  };

  const pendingBookings = bookings.filter((booking) => booking.bookingStatus === 'holding');
  const confirmedBookings = bookings.filter((booking) => booking.bookingStatus === 'confirmed');
  const readyCheckIns = bookings.filter((booking) => booking.checkInStatus === 'ready');
  const totalRevenue = bookings
    .filter((booking) => booking.paymentStatus === 'paid' && booking.bookingStatus !== 'cancelled')
    .reduce((total, booking) => total + booking.totalAmount, 0);

  return (
    <OwnerShell activeId={isMatchBooking ? 'matchBookings' : 'bookings'} innerClassName="owner-bookings-page max-w-[1320px]">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] font-bold text-red-700">{error}</div>}
            {isLoading && <div className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-[12px] font-bold text-on-surface-variant">Đang tải booking thực tế...</div>}
            <section className="owner-bookings-header owner-page-header">
              <div>
                <p className="owner-kicker">
                  {isMatchBooking ? <UsersRound className="h-3.5 w-3.5" /> : <CreditCard className="h-3.5 w-3.5" />}
                  {isMatchBooking ? 'Danh sách đơn ghép trận' : 'Danh sách đơn đặt sân'}
                </p>
                <h1 className="mt-1">
                  {isMatchBooking ? 'Quản lý đơn ghép trận' : 'Quản lý đơn đặt sân'}
                </h1>
                <p className="mt-1">
                  {isMatchBooking
                    ? 'Theo dõi các trận ghép sử dụng sân của bạn, số người tham gia và trạng thái thanh toán.'
                    : 'Theo dõi đơn mới, trạng thái thanh toán, check-in và xử lý nhanh từng lịch đặt của người chơi.'}
                </p>
              </div>

              <div className="owner-bookings-header-actions grid grid-cols-2 gap-2 sm:flex">
                <Link
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary px-3 text-[12px] font-bold text-primary hover:bg-primary/10"
                  to="/owner"
                >
                  <CalendarDays className="h-4 w-4" />
                  Xem lịch sân
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[12px] font-bold text-white hover:bg-primary/90"
                  to="/owner/courts"
                >
                  <Map className="h-4 w-4" />
                  Quản lý sân
                </Link>
              </div>
            </section>

            <section aria-label="Tổng quan đơn đặt sân" className="owner-bookings-metrics owner-panel">
              {[
                { label: isMatchBooking ? 'Tổng trận ghép' : 'Tổng đơn', value: bookings.length, icon: isMatchBooking ? UsersRound : CreditCard, helper: `${pendingBookings.length} đơn chờ xử lý` },
                { label: 'Đã xác nhận', value: confirmedBookings.length, icon: CheckCircle2, helper: 'Đang giữ sân cho khách' },
                { label: 'Sẵn sàng check-in', value: readyCheckIns.length, icon: UserRound, helper: 'Có thể check-in tại quầy' },
                { label: 'Doanh thu', value: formatBookingCurrency(totalRevenue), icon: Banknote, helper: 'Từ các đơn đã thanh toán' },
              ].map((stat) => (
                <div className="owner-bookings-metric" key={stat.label}>
                  <div className="owner-bookings-metric__icon">
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="owner-bookings-metric__main flex items-baseline gap-2">
                      <p className="truncate text-[11px] font-bold text-on-surface-variant">{stat.label}</p>
                      <p className="font-mono text-[18px] font-extrabold leading-none text-on-surface">{stat.value}</p>
                    </div>
                    <p className="owner-bookings-metric__helper mt-1 truncate text-[10px] font-medium text-on-surface-variant">{stat.helper}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="owner-bookings-table owner-panel">
              <div className="owner-bookings-toolbar flex flex-col gap-3 border-b border-outline-variant p-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-[17px] font-bold">
                    {selectedDate === today
                      ? isMatchBooking ? 'Đơn ghép trận hôm nay' : 'Đơn đặt sân hôm nay'
                      : isMatchBooking ? 'Đơn ghép trận theo ngày chơi' : 'Đơn đặt sân theo ngày'}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-on-surface-variant">
                    Có {pagination.totalCount} {isMatchBooking ? '\u0111\u01a1n gh\u00e9p tr\u1eadn \u0111\u01b0\u1ee3c \u0111\u1eb7t' : '\u0111\u01a1n \u0111\u01b0\u1ee3c \u0111\u1eb7t'} ngày {formatBookingDate(selectedDate)}.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap xl:w-auto xl:flex-nowrap">
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Xem ngày trước"
                      className="owner-bookings-control flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low"
                      onClick={() => changeSelectedDate(-1)}
                      type="button"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <label className="relative min-w-0 flex-1 sm:w-[156px]">
                      <span className="sr-only">{isMatchBooking ? 'Chọn ngày chơi đơn ghép trận' : 'Chọn ngày đặt sân'}</span>
                      <input
                        className="owner-bookings-control h-9 w-full rounded-lg border border-outline-variant bg-white px-2.5 text-[12px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        max="9999-12-31"
                        onChange={(event) => {
                          setSelectedDate(event.target.value);
                          setPage(1);
                        }}
                        type="date"
                        value={selectedDate}
                      />
                    </label>
                    <button
                      aria-label="Xem ngày tiếp theo"
                      className="owner-bookings-control flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low"
                      onClick={() => changeSelectedDate(1)}
                      type="button"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="relative w-full sm:w-[240px]">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      className="owner-bookings-control h-9 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-8 pr-2.5 text-[12px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm mã đơn, khách, sân..."
                      type="text"
                      value={searchTerm}
                    />
                  </div>
                  <label className="block w-full sm:w-[164px]">
                    <span className="sr-only">Lọc theo trạng thái</span>
                    <select
                      aria-label="Lọc theo trạng thái"
                      className="owner-bookings-control h-9 w-full rounded-lg border border-outline-variant bg-white px-2.5 text-[11px] font-bold text-on-surface outline-none focus:border-primary"
                      onChange={(event) => setBookingStateFilter(event.target.value as BookingStateFilter)}
                      value={bookingStateFilter}
                    >
                      {bookingStateFilterOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="owner-bookings-table__grid w-full min-w-[1040px] text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="w-16 px-5 py-4 text-center text-[12px] font-bold uppercase text-on-surface-variant">STT</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Mã đơn</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">
                        {isMatchBooking ? 'Chủ trận' : 'Khách hàng'}
                      </th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Sân</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Giờ chơi</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Giá tiền</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Trạng thái</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredBookings.map((booking, index) => (
                      <tr className="hover:bg-[#FAFBF8]" key={booking.id}>
                        <td className="px-5 py-4 text-center text-[14px] font-bold text-primary">{index + 1}</td>
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-bold text-primary">{booking.code}</p>
                          <p className="mt-1 text-[12px] font-medium text-on-surface-variant">
                            Đặt lúc {formatBookingCreatedTime(booking.createdAt)}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          {isMatchBooking ? (
                            <div>
                              <p className="text-[14px] font-bold">{booking.customerName}</p>
                              <p className="text-[12px] font-bold text-primary">
                                {booking.matchType ?? 'Ghép trận'} · {booking.acceptedPlayerCount ?? 0}/{booking.requiredPlayerCount ?? 0} người
                              </p>
                            </div>
                          ) : (
                            <>
                              <p className="text-[14px] font-bold">{booking.customerName}</p>
                              <p className="mt-1 flex items-center gap-1 text-[12px] text-on-surface-variant">
                                <Phone className="h-3.5 w-3.5" />
                                {booking.customerPhone}
                              </p>
                            </>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-bold">{booking.courtName}</p>
                        </td>
                        <td className="px-5 py-4">
                          {booking.slots?.length ? (
                            <OwnerBookingSlotSummary
                              dense
                              durationHours={booking.durationHours}
                              showDuration
                              slots={booking.slots}
                            />
                          ) : (
                            <>
                              <p className="text-[14px] font-bold">{booking.startTime} - {booking.endTime}</p>
                              <p className="mt-1 text-[12px] text-on-surface-variant">{formatPlayDate(booking.date)}</p>
                              <p className="mt-1 text-[12px] text-on-surface-variant">{booking.durationHours} giờ</p>
                            </>
                          )}
                        </td>
                        <td className="px-5 py-4 font-mono text-[12px] font-bold">{formatBookingCurrency(booking.totalAmount)}</td>
                        <td className="px-5 py-4">
                          <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${getBookingStatusClassName(booking)}`}>
                            {getBookingStatusLabel(booking)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            {isMatchBooking && booking.hasRefundPending && (
                              <button
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                                onClick={() => openMatchTransaction(booking)}
                                type="button"
                              >
                                <Banknote className="h-3.5 w-3.5" />
                                Xử lý hoàn tiền
                              </button>
                            )}
                            {!isMatchBooking && booking.hasRefundPending && (
                              <Link
                                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                                to={`/owner/bookings/${booking.id}`}
                              >
                                <Banknote className="h-3.5 w-3.5" />
                                Xử lý hoàn tiền
                              </Link>
                            )}
                            <button
                              aria-label={`Xem ${booking.code}`}
                              className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                              onClick={() => {
                                if (isMatchBooking) {
                                  openMatchTransaction(booking);
                                  return;
                                }
                                if (!booking.paymentId) {
                                  setError(`Đơn ${booking.code} chưa có giao dịch thanh toán để kiểm tra.`);
                                  return;
                                }
                                const prefetched = prefetchPayment(booking.paymentId, booking.fallbackPayment);
                                if (!prefetched) return;
                                setError('');
                                setTransactionTarget({
                                  paymentId: booking.paymentId,
                                  bookingCode: booking.code,
                                  prefetched,
                                });
                              }}
                              onFocus={() => {
                                if (isMatchBooking) prefetchMatchPayments(Number(booking.id));
                                else if (booking.paymentId) prefetchPayment(booking.paymentId, booking.fallbackPayment);
                              }}
                              onMouseEnter={() => {
                                if (isMatchBooking) prefetchMatchPayments(Number(booking.id));
                                else if (booking.paymentId) prefetchPayment(booking.paymentId, booking.fallbackPayment);
                              }}
                              onPointerDown={() => {
                                if (isMatchBooking) prefetchMatchPayments(Number(booking.id));
                                else if (booking.paymentId) prefetchPayment(booking.paymentId, booking.fallbackPayment);
                              }}
                              title={isMatchBooking ? 'Xem biên lai của nhóm' : 'Kiểm tra giao dịch'}
                              type="button"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredBookings.length === 0 && (
                      <tr>
                        <td className="px-5 py-10 text-center text-[14px] font-bold text-on-surface-variant" colSpan={8}>
                          Không tìm thấy đơn đặt sân phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-outline-variant p-3">
                <PaginationControls page={pagination} onPageChange={setPage} />
              </div>
            </section>
            {transactionTarget && (
              <OwnerTransactionReviewModal
                bookingCode={transactionTarget.bookingCode}
                initialPayment={transactionTarget.prefetched.data}
                initialPaymentRequest={transactionTarget.prefetched.promise}
                onClose={() => setTransactionTarget(null)}
                onUpdated={(payment) => {
                  const prefetched = { data: payment, promise: Promise.resolve(payment) };
                  paymentPrefetchCache.current.set(transactionTarget.paymentId, prefetched);
                  preloadReceiptImage(payment.receiptImageUrl);
                  applyPaymentUpdate(payment);
                }}
                paymentId={transactionTarget.paymentId}
              />
            )}
            {matchTransactionTarget && (
              <OwnerMatchTransactionReviewModal
                booking={matchTransactionTarget.booking}
                bookingCode={matchTransactionTarget.bookingCode}
                bookingId={matchTransactionTarget.bookingId}
                initialPayments={matchTransactionTarget.prefetched?.data}
                initialPaymentsRequest={matchTransactionTarget.prefetched?.promise}
                onClose={() => setMatchTransactionTarget(null)}
                onUpdated={() => load()}
              />
            )}
    </OwnerShell>
  );
};
