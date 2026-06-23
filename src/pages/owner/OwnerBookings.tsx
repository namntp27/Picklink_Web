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
import { getOperatorPayment } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { ownerBookingToDetail } from './ownerBookingAdapter';
import { OwnerMatchTransactionReviewModal } from './components/OwnerMatchTransactionReviewModal';
import { OwnerTransactionReviewModal } from './components/OwnerTransactionReviewModal';

type PaymentFilter = 'all' | BookingPaymentStatus;
type BookingStateFilter = 'all' | BookingStatus | 'ready_checkin';
type OwnerBookingKind = 'regular' | 'match';
type OwnerBookingListItem = BookingDetail & {
  paymentId?: number | null;
  matchId?: number | null;
  matchType?: string | null;
  requiredPlayerCount?: number | null;
  acceptedPlayerCount?: number | null;
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

const paymentFilterOptions: Array<{ label: string; value: PaymentFilter }> = [
  { label: 'Tất cả thanh toán', value: 'all' },
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Chờ thanh toán', value: 'pending' },
  { label: 'Thanh toán lỗi', value: 'failed' },
];

const bookingStateFilterOptions: Array<{ label: string; value: BookingStateFilter }> = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Chờ xử lý', value: 'holding' },
  { label: 'Đã hủy', value: 'cancelled' },
  { label: 'Sẵn sàng check-in', value: 'ready_checkin' },
];

const getLocalDateValue = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
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

const getBookingStatusLabel = (booking: BookingDetail) => {
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

const getBookingStatusClassName = (booking: BookingDetail) => {
  if (booking.bookingStatus === 'cancelled' || booking.paymentStatus === 'failed') {
    return 'bg-[#ffdad6] text-[#ba1a1a]';
  }

  if (booking.bookingStatus === 'confirmed') {
    return 'bg-[#eaf7df] text-primary';
  }

  return 'bg-[#fff4d8] text-[#7a5600]';
};

const getPaymentLabel = (paymentStatus: BookingDetail['paymentStatus']) => {
  if (paymentStatus === 'paid') {
    return 'Đã thanh toán';
  }

  if (paymentStatus === 'failed') {
    return 'Thanh toán lỗi';
  }

  return 'Chờ thanh toán';
};

const getPaymentClassName = (paymentStatus: BookingDetail['paymentStatus']) => {
  if (paymentStatus === 'paid') {
    return 'bg-[#eaf7df] text-primary';
  }

  if (paymentStatus === 'failed') {
    return 'bg-[#ffdad6] text-[#ba1a1a]';
  }

  return 'bg-[#fff4d8] text-[#7a5600]';
};

export const OwnerBookings = ({ kind = 'regular' }: { kind?: OwnerBookingKind }) => {
  const { token } = useAuth();
  const isMatchBooking = kind === 'match';
  const today = useMemo(getLocalDateValue, []);
  const [bookings, setBookings] = useState<OwnerBookingListItem[]>([]);
  const [selectedDate, setSelectedDate] = useState(today);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [bookingStateFilter, setBookingStateFilter] = useState<BookingStateFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [transactionTarget, setTransactionTarget] = useState<{
    paymentId: number;
    bookingCode: string;
    prefetched: PrefetchedPayment;
  } | null>(null);
  const [matchTransactionTarget, setMatchTransactionTarget] = useState<{
    bookingId: number;
    bookingCode: string;
  } | null>(null);
  const paymentPrefetchCache = useRef(new globalThis.Map<number, PrefetchedPayment>());

  const prefetchPayment = useCallback((paymentId: number) => {
    if (!token) return null;
    const cached = paymentPrefetchCache.current.get(paymentId);
    if (cached) return cached;

    const prefetched: PrefetchedPayment = {
      promise: Promise.resolve(null as unknown as BankTransfer),
    };
    prefetched.promise = getOperatorPayment(token, paymentId)
      .then((payment) => {
        prefetched.data = payment;
        if (payment.receiptImageUrl) {
          const receiptImage = new Image();
          receiptImage.src = payment.receiptImageUrl;
        }
        return payment;
      })
      .catch((reason) => {
        paymentPrefetchCache.current.delete(paymentId);
        throw reason;
      });
    void prefetched.promise.catch(() => undefined);
    paymentPrefetchCache.current.set(paymentId, prefetched);
    return prefetched;
  }, [token]);

  const load = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setIsLoading(true);
    setError('');
    try {
      setBookings((await getOwnerBookings(token, { bookingType: kind })).map((record) => ({
        ...ownerBookingToDetail(record),
        paymentId: record.paymentId,
        matchId: record.matchId,
        matchType: record.matchType,
        requiredPlayerCount: record.requiredPlayerCount,
        acceptedPlayerCount: record.acceptedPlayerCount,
        matchPlayers: record.matchPlayers ?? [],
      })));
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Không thể tải booking.'); }
    finally { if (showLoading) setIsLoading(false); }
  }, [kind, token]);

  useEffect(() => { void load(); }, [load]);
  useScheduleRealtime(() => { void load(false); });
  usePaymentRealtime((event) => {
    paymentPrefetchCache.current.delete(event.paymentId);
    void load(false);
  });

  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return bookings
      .filter((booking) => {
        const matchesSelectedDate = booking.date === selectedDate;
        const matchesKeyword =
          !keyword ||
          booking.code.toLowerCase().includes(keyword) ||
          booking.customerName.toLowerCase().includes(keyword) ||
          booking.customerPhone.toLowerCase().includes(keyword) ||
          booking.courtName.toLowerCase().includes(keyword) ||
          booking.subCourt.toLowerCase().includes(keyword);
        const matchesPayment =
          paymentFilter === 'all' || booking.paymentStatus === paymentFilter;
        const matchesBookingState =
          bookingStateFilter === 'all' ||
          (bookingStateFilter === 'ready_checkin'
            ? booking.checkInStatus === 'ready'
            : booking.bookingStatus === bookingStateFilter);

        return matchesSelectedDate && matchesKeyword && matchesPayment && matchesBookingState;
      })
      .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
  }, [bookingStateFilter, bookings, paymentFilter, searchTerm, selectedDate]);

  const changeSelectedDate = (dayOffset: number) => {
    const nextDate = new Date(`${selectedDate}T00:00:00`);
    nextDate.setDate(nextDate.getDate() + dayOffset);
    const year = nextDate.getFullYear();
    const month = String(nextDate.getMonth() + 1).padStart(2, '0');
    const day = String(nextDate.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const pendingBookings = bookings.filter((booking) => booking.bookingStatus === 'holding');
  const confirmedBookings = bookings.filter((booking) => booking.bookingStatus === 'confirmed');
  const readyCheckIns = bookings.filter((booking) => booking.checkInStatus === 'ready');
  const totalRevenue = bookings
    .filter((booking) => booking.paymentStatus === 'paid' && booking.bookingStatus !== 'cancelled')
    .reduce((total, booking) => total + booking.totalAmount, 0);

  return (
    <OwnerShell activeId={isMatchBooking ? 'matchBookings' : 'bookings'} innerClassName="max-w-[1320px]">
            {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-bold text-red-700">{error}</div>}
            {isLoading && <div className="rounded-lg border border-outline-variant bg-white px-4 py-3 text-[13px] font-bold text-on-surface-variant">Đang tải booking thực tế...</div>}
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary">
                  {isMatchBooking ? <UsersRound className="h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                  {isMatchBooking ? 'Danh sách đơn ghép trận' : 'Danh sách đơn đặt sân'}
                </p>
                <h1 className="mt-3 text-[30px] font-bold leading-tight md:text-[40px]">
                  {isMatchBooking ? 'Quản lý đơn ghép trận' : 'Quản lý đơn đặt sân'}
                </h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-on-surface-variant">
                  {isMatchBooking
                    ? 'Theo dõi các trận ghép sử dụng sân của bạn, số người tham gia và trạng thái thanh toán.'
                    : 'Theo dõi đơn mới, trạng thái thanh toán, check-in và xử lý nhanh từng lịch đặt của người chơi.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                  to="/owner"
                >
                  <CalendarDays className="h-5 w-5" />
                  Xem lịch sân
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                  to="/owner/courts"
                >
                  <Map className="h-5 w-5" />
                  Quản lý sân
                </Link>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: isMatchBooking ? 'Tổng trận ghép' : 'Tổng đơn', value: bookings.length, icon: isMatchBooking ? UsersRound : CreditCard, helper: `${pendingBookings.length} đơn chờ xử lý` },
                { label: 'Đã xác nhận', value: confirmedBookings.length, icon: CheckCircle2, helper: 'Đang giữ sân cho khách' },
                { label: 'Sẵn sàng check-in', value: readyCheckIns.length, icon: UserRound, helper: 'Có thể check-in tại quầy' },
                { label: 'Doanh thu đã trả', value: formatBookingCurrency(totalRevenue), icon: Banknote, helper: 'Từ các đơn đã thanh toán' },
              ].map((stat) => (
                <div className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm" key={stat.label}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-bold text-on-surface-variant">{stat.label}</p>
                      <p className="mt-2 text-[28px] font-bold leading-tight text-on-surface">{stat.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-[12px] font-medium text-on-surface-variant">{stat.helper}</p>
                </div>
              ))}
            </section>

            <section className="rounded-lg border border-outline-variant bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-outline-variant p-5 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <h2 className="text-[20px] font-bold">
                    {selectedDate === today
                      ? isMatchBooking ? 'Đơn ghép trận hôm nay' : 'Đơn đặt sân hôm nay'
                      : isMatchBooking ? 'Đơn ghép trận theo ngày' : 'Đơn đặt sân theo ngày'}
                  </h2>
                  <p className="mt-1 text-[13px] text-on-surface-variant">
                    Có {filteredBookings.length} đơn có thời gian chơi ngày {formatBookingDate(selectedDate)}.
                  </p>
                </div>
                <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
                  <div className="flex items-center gap-2">
                    <button
                      aria-label="Xem ngày trước"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low"
                      onClick={() => changeSelectedDate(-1)}
                      type="button"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <label className="relative min-w-0 flex-1 sm:w-[180px]">
                      <span className="sr-only">Chọn ngày đặt sân</span>
                      <input
                        className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        max="9999-12-31"
                        onChange={(event) => setSelectedDate(event.target.value)}
                        type="date"
                        value={selectedDate}
                      />
                    </label>
                    <button
                      aria-label="Xem ngày tiếp theo"
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low"
                      onClick={() => changeSelectedDate(1)}
                      type="button"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="relative w-full sm:w-[320px]">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm mã đơn, khách, sân..."
                      type="text"
                      value={searchTerm}
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1120px] text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="w-16 px-5 py-4 text-center text-[12px] font-bold uppercase text-on-surface-variant">STT</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Mã đơn</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">
                        {isMatchBooking ? 'Chủ trận' : 'Khách hàng'}
                      </th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Sân</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Giờ chơi</th>
                      <th className="px-5 py-3 text-[12px] font-bold uppercase text-on-surface-variant">
                        <label className="block">
                          <span className="sr-only">Lọc theo thanh toán</span>
                          <select
                            className="h-9 min-w-40 rounded-lg border border-outline-variant bg-white px-3 text-[12px] font-bold normal-case text-on-surface outline-none focus:border-primary"
                            onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
                            value={paymentFilter}
                          >
                            {paymentFilterOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                      </th>
                      <th className="px-5 py-3 text-[12px] font-bold uppercase text-on-surface-variant">
                        <label className="block">
                          <span className="sr-only">Lọc theo trạng thái</span>
                          <select
                            className="h-9 min-w-40 rounded-lg border border-outline-variant bg-white px-3 text-[12px] font-bold normal-case text-on-surface outline-none focus:border-primary"
                            onChange={(event) => setBookingStateFilter(event.target.value as BookingStateFilter)}
                            value={bookingStateFilter}
                          >
                            {bookingStateFilterOptions.map((option) => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                      </th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredBookings.map((booking, index) => (
                      <tr className="hover:bg-[#f9f9ff]" key={booking.id}>
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
                          <p className="mt-1 text-[12px] text-on-surface-variant">{booking.subCourt}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-bold">
                            {booking.startTime} - {booking.endTime}
                          </p>
                          <p className="mt-1 text-[12px] text-on-surface-variant">{formatPlayDate(booking.date)}</p>
                          <p className="mt-1 text-[12px] text-on-surface-variant">{booking.durationHours} giờ</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${getPaymentClassName(booking.paymentStatus)}`}>
                            {getPaymentLabel(booking.paymentStatus)}
                          </span>
                          <p className="mt-2 text-[13px] font-bold">{formatBookingCurrency(booking.totalAmount)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${getBookingStatusClassName(booking)}`}>
                            {getBookingStatusLabel(booking)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              aria-label={`Xem ${booking.code}`}
                              className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low"
                              onClick={() => {
                                if (isMatchBooking) {
                                  setError('');
                                  setMatchTransactionTarget({
                                    bookingId: Number(booking.id),
                                    bookingCode: booking.code,
                                  });
                                  return;
                                }
                                if (!booking.paymentId) {
                                  setError(`Đơn ${booking.code} chưa có giao dịch thanh toán để kiểm tra.`);
                                  return;
                                }
                                const prefetched = prefetchPayment(booking.paymentId);
                                if (!prefetched) return;
                                setError('');
                                setTransactionTarget({
                                  paymentId: booking.paymentId,
                                  bookingCode: booking.code,
                                  prefetched,
                                });
                              }}
                              onFocus={() => {
                                if (!isMatchBooking && booking.paymentId) prefetchPayment(booking.paymentId);
                              }}
                              onMouseEnter={() => {
                                if (!isMatchBooking && booking.paymentId) prefetchPayment(booking.paymentId);
                              }}
                              onPointerDown={() => {
                                if (!isMatchBooking && booking.paymentId) prefetchPayment(booking.paymentId);
                              }}
                              title={isMatchBooking ? 'Xem biên lai của nhóm' : 'Kiểm tra giao dịch'}
                              type="button"
                            >
                              <Eye className="h-4 w-4" />
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
            </section>
            {transactionTarget && (
              <OwnerTransactionReviewModal
                bookingCode={transactionTarget.bookingCode}
                initialPayment={transactionTarget.prefetched.data}
                initialPaymentRequest={transactionTarget.prefetched.promise}
                onClose={() => setTransactionTarget(null)}
                onUpdated={() => {
                  paymentPrefetchCache.current.delete(transactionTarget.paymentId);
                  return load(false);
                }}
                paymentId={transactionTarget.paymentId}
              />
            )}
            {matchTransactionTarget && (
              <OwnerMatchTransactionReviewModal
                bookingCode={matchTransactionTarget.bookingCode}
                bookingId={matchTransactionTarget.bookingId}
                onClose={() => setMatchTransactionTarget(null)}
                onUpdated={() => load(false)}
              />
            )}
    </OwnerShell>
  );
};
