import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  BarChart3,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  HelpCircle,
  Map as MapIcon,
  ReceiptText,
  Search,
  Settings,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react';
import { OwnerShell } from './components/OwnerShell';
import { PaginationControls } from '../../components/PaginationControls';
import type { BookingDetail } from '../../data/bookings';
import { formatBookingCurrency, formatBookingDateTime } from '../../data/bookings';
import { getOwnerRevenueReport, type OwnerRevenueReport, type OwnerRevenueSource } from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { ownerBookingToDetail, ownerTicketToDetail } from './ownerBookingAdapter';

type RevenuePeriod = 'today' | 'week' | 'month' | 'custom';
type PresetRevenuePeriod = Exclude<RevenuePeriod, 'custom'>;
type TransactionStatus = 'all' | 'paid' | 'pending' | 'failed' | 'refunded';

const historyPageSize = 10;
const maxRevenueRangeDays = 367;

type PaymentTransaction = {
  id: string;
  booking: BookingDetail;
  viewHref: string;
  status: Exclude<TransactionStatus, 'all'>;
  paidAt: string;
  revenueDate: string;
  refundAmount: number;
  // Whether money actually changed hands (raw server payment status), independent of `status`
  // above — a booking/ticket that expired or got cancelled before ever being paid still derives
  // `status: 'refunded'` from its cancelled booking status, which would wrongly keep it visible.
  hadPayment: boolean;
};

const isPaidPaymentStatus = (paymentStatus: string) =>
  paymentStatus === 'Paid' || paymentStatus === 'RefundPending' || paymentStatus === 'Refunded';

const reportDate = new Date();
const reportWeekStart = new Date(reportDate);
reportWeekStart.setDate(reportDate.getDate() - ((reportDate.getDay() + 6) % 7));
const reportWeekEnd = new Date(reportWeekStart);
reportWeekEnd.setDate(reportWeekStart.getDate() + 6);
const shortDate = (value: Date) => new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(value);

const periodOptions: Array<{ label: string; value: RevenuePeriod; helper: string }> = [
  { label: 'Hôm nay', value: 'today', helper: new Intl.DateTimeFormat('vi-VN').format(reportDate) },
  { label: 'Tuần này', value: 'week', helper: `${shortDate(reportWeekStart)} - ${shortDate(reportWeekEnd)}` },
  { label: 'Tháng này', value: 'month', helper: `Tháng ${String(reportDate.getMonth() + 1).padStart(2, '0')}/${reportDate.getFullYear()}` },
];

// Pending/failed transactions never had money change hands (the player just held a slot without
// paying), so the itemized list below only ever contains paid or paid-then-refunded rows — those
// two tabs would always be empty and are left out on purpose.
const transactionStatusOptions: Array<{ label: string; value: TransactionStatus }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Đã hoàn / hủy', value: 'refunded' },
];

const revenueSourceOptions: Array<{ label: string; value: 'all' | OwnerRevenueSource }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đặt sân', value: 'Court' },
  { label: 'Ghép trận', value: 'Match' },
  { label: 'Xé vé', value: 'Ticket' },
];

const getTransactionStatus = (booking: BookingDetail): Exclude<TransactionStatus, 'all'> => {
  if (booking.bookingStatus === 'cancelled') {
    return 'refunded';
  }

  if (booking.paymentStatus === 'failed') {
    return 'failed';
  }

  if (booking.paymentStatus === 'pending') {
    return 'pending';
  }

  return 'paid';
};

const getStatusLabel = (status: Exclude<TransactionStatus, 'all'>) => {
  if (status === 'paid') {
    return 'Đã thanh toán';
  }

  if (status === 'pending') {
    return 'Chờ thanh toán';
  }

  if (status === 'failed') {
    return 'Thanh toán lỗi';
  }

  return 'Đã hoàn / hủy';
};

const getStatusClassName = (status: Exclude<TransactionStatus, 'all'>) => {
  if (status === 'paid') {
    return 'bg-[#F6F8F3] text-primary';
  }

  if (status === 'pending') {
    return 'bg-[#fff4d8] text-[#755400]';
  }

  if (status === 'failed') {
    return 'bg-[#ffdad6] text-[#ba1a1a]';
  }

  return 'bg-[#eef0ef] text-[#57615b]';
};

const getStatusIcon = (status: Exclude<TransactionStatus, 'all'>) => {
  if (status === 'paid') {
    return CheckCircle2;
  }

  if (status === 'pending') {
    return Clock;
  }

  if (status === 'failed') {
    return XCircle;
  }

  return ReceiptText;
};

const toDateValue = (date: Date) =>
  `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;

const getWeekStart = (date: Date) => {
  const weekStart = new Date(date);
  const dayOffset = (weekStart.getDay() + 6) % 7;
  weekStart.setDate(weekStart.getDate() - dayOffset);

  return weekStart;
};

const getDateRange = (period: PresetRevenuePeriod) => {
  if (period === 'today') {
    return [toDateValue(reportDate)];
  }

  if (period === 'week') {
    const weekStart = getWeekStart(reportDate);

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);

      return toDateValue(date);
    });
  }

  const year = reportDate.getFullYear();
  const month = reportDate.getMonth();
  const dayCount = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: dayCount }, (_, index) => `${year}-${String(month + 1).padStart(2, '0')}-${String(index + 1).padStart(2, '0')}`);
};

const getCustomDateRange = (from: string, to: string) => {
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;

  return Array.from({ length: dayCount }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return toDateValue(date);
  });
};

const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`));

const formatPercent = (value: number) => `${Math.round(value)}%`;

export const OwnerRevenue = () => {
  const { token } = useAuth();
  const [activePeriod, setActivePeriod] = useState<RevenuePeriod>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [customRange, setCustomRange] = useState<{ from: string; to: string } | null>(null);
  const [customRangeError, setCustomRangeError] = useState('');
  const [activeStatus, setActiveStatus] = useState<TransactionStatus>('all');
  const [revenueSource, setRevenueSource] = useState<'all' | OwnerRevenueSource>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const showTransactions = (status: TransactionStatus) => {
    setActiveStatus(status);
    setSearchTerm('');
    setHistoryPage(1);
    document.getElementById('owner-revenue-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  const applyCustomRange = () => {
    if (!customFrom || !customTo) {
      setCustomRangeError('Chọn đủ ngày bắt đầu và kết thúc.');
      return;
    }

    const start = new Date(customFrom + 'T00:00:00');
    const end = new Date(customTo + 'T00:00:00');
    const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
    if (dayCount < 1) {
      setCustomRangeError('Ngày kết thúc phải từ ngày bắt đầu trở đi.');
      return;
    }
    if (dayCount > maxRevenueRangeDays) {
      setCustomRangeError('Chỉ chọn tối đa ' + maxRevenueRangeDays + ' ngày.');
      return;
    }

    setCustomRange({ from: customFrom, to: customTo });
    setCustomRangeError('');
    setActivePeriod('custom');
    setHistoryPage(1);
  };
  const periodDates = useMemo(
    () => activePeriod === 'custom' && customRange
      ? getCustomDateRange(customRange.from, customRange.to)
      : getDateRange(activePeriod === 'custom' ? 'month' : activePeriod),
    [activePeriod, customRange],
  );
  const from = periodDates[0];
  const to = periodDates[periodDates.length - 1];

  const { data: revenueReport, refresh: loadRevenue } = useApiQuery<OwnerRevenueReport>(
    ['owner-revenue', from, to, revenueSource],
    () => getOwnerRevenueReport(token!, from!, to!, revenueSource === 'all' ? undefined : revenueSource),
    { enabled: Boolean(token && from && to) },
  );
  const reloadRevenue = () => { void loadRevenue(); };
  useScheduleRealtime(reloadRevenue);
  usePaymentRealtime(reloadRevenue);

  const transactions = useMemo<PaymentTransaction[]>(
    () => {
      const bookingTransactions = (revenueReport?.bookings ?? []).map((record) => {
        const booking = ownerBookingToDetail(record);
        const refundAmount = record.refundAmount ?? (
          record.paymentStatus === 'RefundPending' || record.paymentStatus === 'Refunded'
            ? record.totalAmount
            : 0
        );
        // Money in, not court usage: mirrors the server's revenue-date rule (paidAt, falling back
        // to createdAt while still unpaid) so this list lines up with the totals above it.
        const revenueAt = record.paymentPaidAt ?? record.createdAt;
        return {
          id: 'booking-' + booking.id,
          booking,
          viewHref: `/owner/bookings/${booking.id}`,
          status: getTransactionStatus(booking),
          paidAt: revenueAt,
          revenueDate: revenueAt.slice(0, 10),
          refundAmount,
          hadPayment: isPaidPaymentStatus(record.paymentStatus),
        };
      });
      const ticketTransactions = (revenueReport?.tickets ?? []).map((ticket) => {
        const booking = ownerTicketToDetail(ticket);
        const revenueAt = ticket.paymentPaidAt ?? ticket.createdAt;
        return {
          id: 'ticket-' + ticket.sessionTicketId,
          booking,
          viewHref: `/owner/ticket-sessions/${ticket.ticketSessionId}`,
          status: getTransactionStatus(booking),
          paidAt: revenueAt,
          revenueDate: revenueAt.slice(0, 10),
          refundAmount: ticket.refundAmount,
          hadPayment: isPaidPaymentStatus(ticket.paymentStatus),
        };
      });
      return [...bookingTransactions, ...ticketTransactions];
    },
    [revenueReport],
  );

  // `transactions` already comes from an API call scoped to exactly [from, to] (the same range
  // `periodDates` spans), and the server attributes a refund-pending/refunded record to the period
  // the refund itself landed in rather than the original payment date. Re-filtering here by
  // `revenueDate` (derived client-side from paymentPaidAt, which isn't refund-aware) would silently
  // drop those refund rows again even though the server correctly included them.
  const periodTransactions = transactions;

  // The itemized list only shows rows money actually touched — a hold the player never paid for
  // is not a transaction. Everything else on the page (stat cards, court/method breakdowns) keeps
  // reading periodTransactions (the full set) since those numbers are specifically meant to include
  // pending/failed activity.
  const visibleTransactions = useMemo(
    () => periodTransactions.filter((transaction) => transaction.hadPayment),
    [periodTransactions],
  );

  const filteredTransactions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return visibleTransactions
      .filter((transaction) => {
        const { booking } = transaction;
        const matchesStatus = activeStatus === 'all' || (activeStatus === 'refunded'
          ? transaction.refundAmount > 0
          : transaction.status === activeStatus);
        const matchesKeyword =
          !keyword ||
          booking.code.toLowerCase().includes(keyword) ||
          booking.customerName.toLowerCase().includes(keyword) ||
          booking.courtName.toLowerCase().includes(keyword) ||
          booking.paymentMethod.toLowerCase().includes(keyword);

        return matchesStatus && matchesKeyword;
      })
      .sort((first, second) => Date.parse(second.paidAt) - Date.parse(first.paidAt));
  }, [activeStatus, visibleTransactions, searchTerm]);

  // Clamped rather than reset in an effect so a realtime reload that shrinks the list lands on
  // the last page instead of flashing an empty table.
  const historyTotalPages = Math.max(1, Math.ceil(filteredTransactions.length / historyPageSize));
  const currentHistoryPage = Math.min(historyPage, historyTotalPages);
  const historyPagination = {
    page: currentHistoryPage,
    pageSize: historyPageSize,
    totalCount: filteredTransactions.length,
    totalPages: historyTotalPages,
  };
  const pagedTransactions = filteredTransactions.slice(
    (currentHistoryPage - 1) * historyPageSize,
    currentHistoryPage * historyPageSize,
  );

  const paidTransactions = periodTransactions.filter((transaction) => transaction.status === 'paid');
  const pendingTransactions = periodTransactions.filter((transaction) => transaction.status === 'pending');
  const refundedTransactions = periodTransactions.filter((transaction) => transaction.refundAmount > 0);
  const failedTransactions = periodTransactions.filter((transaction) => transaction.status === 'failed');
  // Court/match bookings only cover part of the picture: a ticket-session sells many tickets under
  // one booking, each with its own payment, so the server aggregates those separately and this reads
  // that combined total instead of re-deriving it from the booking-shaped transaction list below.
  const grossRevenue = revenueReport?.grossRevenue ?? 0;
  const pendingAmount = revenueReport?.pendingAmount ?? 0;
  const refundedAmount = revenueReport?.refundedAmount ?? 0;
  const serviceFees = paidTransactions.reduce((total, transaction) => total + transaction.booking.serviceFee, 0);
  const netRevenue = grossRevenue - serviceFees;
  const successRate = periodTransactions.length > 0 ? (paidTransactions.length / periodTransactions.length) * 100 : 0;
  const averageOrderValue = revenueReport?.averageBookingValue ?? 0;

  const dailyRevenueByDate = new Map((revenueReport?.daily ?? []).map((entry) => [entry.date, entry]));
  const chartDates = activePeriod === 'month'
    ? periodDates.filter((date) => dailyRevenueByDate.has(date) || periodTransactions.some((transaction) => transaction.revenueDate === date))
    : periodDates;
  const dailyRevenue = chartDates.map((date) => {
    const serverEntry = dailyRevenueByDate.get(date);
    return {
      date,
      label: formatShortDate(date),
      revenue: serverEntry?.revenue ?? 0,
      bookings: serverEntry?.bookingCount ?? 0,
    };
  });
  const maxDailyRevenue = Math.max(...dailyRevenue.map((item) => item.revenue), 1);

  const courtRevenue = Array.from(
    periodTransactions.reduce<Map<string, { name: string; revenue: number; bookings: number; paidBookings: number }>>((lookup, transaction) => {
      const court = lookup.get(transaction.booking.courtName) ?? {
        name: transaction.booking.courtName,
        revenue: 0,
        bookings: 0,
        paidBookings: 0,
      };

      court.bookings += 1;

      if (transaction.status === 'paid') {
        court.revenue += transaction.booking.totalAmount;
        court.paidBookings += 1;
      }

      lookup.set(transaction.booking.courtName, court);

      return lookup;
    }, new Map()).values(),
  ).sort((first, second) => second.revenue - first.revenue);

  const methodSummary = Array.from(
    periodTransactions.reduce<Map<string, { method: string; amount: number; count: number }>>((lookup, transaction) => {
      const method = lookup.get(transaction.booking.paymentMethod) ?? {
        method: transaction.booking.paymentMethod,
        amount: 0,
        count: 0,
      };

      method.count += 1;

      if (transaction.status === 'paid') {
        method.amount += transaction.booking.totalAmount;
      }

      lookup.set(transaction.booking.paymentMethod, method);

      return lookup;
    }, new Map()).values(),
  ).sort((first, second) => second.amount - first.amount);

  return (
    <OwnerShell activeId="revenue" innerClassName="max-w-[1320px]">
            <section className="owner-page-header">
              <div>
                <p className="owner-kicker">
                  <BarChart3 className="h-4 w-4" />
                  Doanh thu và đối soát
                </p>
                <h1 className="mt-2">Doanh thu chủ sân</h1>
                <p className="mt-2">
                  Theo dõi doanh thu đã nhận, khoản chờ thanh toán, hiệu suất theo sân và lịch sử giao dịch từ các đơn đặt sân.
                </p>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {periodOptions.map((option) => (
                <button
                  aria-pressed={activePeriod === option.value}
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    activePeriod === option.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant bg-white text-on-surface hover:bg-surface-container-low'
                  }`}
                  key={option.value}
                  onClick={() => { setActivePeriod(option.value); setHistoryPage(1); }}
                  type="button"
                >
                  <span className="text-[14px] font-bold">{option.label}</span>
                  <span className={`mt-1 block text-[12px] font-medium ${activePeriod === option.value ? 'text-white/76' : 'text-on-surface-variant'}`}>
                    {option.helper}
                  </span>
                </button>
              ))}
            </section>

            <form
              className={'mt-3 flex flex-col gap-3 rounded-lg border p-4 lg:flex-row lg:items-end ' + (activePeriod === 'custom' ? 'border-primary bg-primary/5' : 'border-outline-variant bg-white')}
              onSubmit={(event) => { event.preventDefault(); applyCustomRange(); }}
            >
              <div className="min-w-[180px]">
                <p className="flex items-center gap-2 text-[14px] font-bold"><CalendarDays className="h-4 w-4 text-primary" /> Tùy chọn khoảng ngày</p>
                <p className="mt-1 text-[12px] text-on-surface-variant">Tối đa 367 ngày.</p>
              </div>
              <label className="flex flex-1 flex-col gap-1 text-[12px] font-bold text-on-surface-variant">
                Từ ngày
                <input aria-label="Từ ngày doanh thu" className="h-10 rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-medium text-on-surface" max={customTo || undefined} onChange={(event) => setCustomFrom(event.target.value)} type="date" value={customFrom} />
              </label>
              <label className="flex flex-1 flex-col gap-1 text-[12px] font-bold text-on-surface-variant">
                Đến ngày
                <input aria-label="Đến ngày doanh thu" className="h-10 rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-medium text-on-surface" min={customFrom || undefined} onChange={(event) => setCustomTo(event.target.value)} type="date" value={customTo} />
              </label>
              <button className="h-10 rounded-lg bg-primary px-5 text-[13px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50" disabled={!customFrom || !customTo} type="submit">Áp dụng</button>
              {customRangeError && <p className="text-[12px] font-medium text-error" role="alert">{customRangeError}</p>}
            </form>

            <section className="mt-3 flex flex-col gap-2 rounded-lg border border-outline-variant bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-[14px] font-bold"><ReceiptText className="h-4 w-4 text-primary" /> Lọc theo loại doanh thu</p>
              <div className="flex flex-wrap gap-2">
                {revenueSourceOptions.map((option) => (
                  <button
                    aria-pressed={revenueSource === option.value}
                    className={`h-9 rounded-lg px-3 text-[13px] font-bold transition-colors ${
                      revenueSource === option.value
                        ? 'bg-primary text-white'
                        : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                    }`}
                    key={option.value}
                    onClick={() => { setRevenueSource(option.value); setHistoryPage(1); }}
                    type="button"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="owner-stat-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Doanh thu đã nhận',
                  value: formatBookingCurrency(grossRevenue),
                  icon: Banknote,
                  onClick: () => showTransactions('paid'),
                  helper: `${revenueReport?.paidBookings ?? paidTransactions.length} giao dịch thành công (gồm cả xé vé)`,
                },
                {
                  label: 'Chờ thanh toán',
                  value: formatBookingCurrency(pendingAmount),
                  icon: Clock,
                  // Not-yet-paid holds don't appear in the itemized list below (nothing to show
                  // there yet), so this jumps to the list rather than filtering to an empty view.
                  onClick: () => showTransactions('all'),
                  helper: `${pendingTransactions.length} đơn cần thu`,
                },
                {
                  label: 'Doanh thu ròng',
                  value: formatBookingCurrency(netRevenue),
                  icon: TrendingUp,
                  onClick: () => showTransactions('paid'),
                  helper: `Đã trừ ${formatBookingCurrency(serviceFees)} phí`,
                },
                {
                  label: 'Tỷ lệ thành công',
                  value: formatPercent(successRate),
                  icon: CheckCircle2,
                  onClick: () => showTransactions('paid'),
                  helper: `${failedTransactions.length} lỗi, ${refundedTransactions.length} hoàn/hủy`,
                },
              ].map((stat) => (
                <button
                  className="owner-stat-card w-full cursor-pointer text-left transition-colors hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
                  key={stat.label}
                  onClick={stat.onClick}
                  type="button"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-bold text-on-surface-variant">{stat.label}</p>
                      <p className="mt-2 font-mono text-[23px] font-extrabold leading-tight text-on-surface">{stat.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-[12px] font-medium text-on-surface-variant">{stat.helper}</p>
                </button>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <section className="owner-panel p-4 sm:p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-[20px] font-bold">
                        <BarChart3 className="h-5 w-5 text-primary" />
                        Biểu đồ doanh thu
                      </h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">Cột thể hiện doanh thu đã thanh toán theo ngày trong kỳ đang chọn.</p>
                    </div>
                    <div className="rounded-lg bg-surface-container-low px-4 py-3">
                      <p className="text-[12px] font-bold uppercase text-on-surface-variant">Giá trị đơn trung bình</p>
                      <p className="mt-1 text-[18px] font-bold text-primary">{formatBookingCurrency(averageOrderValue)}</p>
                    </div>
                  </div>

                  <div className="mt-6 h-[280px] overflow-x-scroll pb-3">
                    <div className="flex h-full min-w-full w-max items-end gap-3 border-b border-outline-variant px-2">
                      {dailyRevenue.length > 0 ? (
                        dailyRevenue.map((item) => {
                          const barHeight = item.revenue > 0 ? Math.max(14, Math.round((item.revenue / maxDailyRevenue) * 100)) : 4;

                          return (
                            <div className="flex h-full min-w-[72px] flex-1 flex-col items-center justify-end gap-2" key={item.date}>
                              <div className="flex min-h-[44px] flex-col items-center justify-end text-center">
                                <span className="text-[12px] font-bold text-on-surface">{formatBookingCurrency(item.revenue)}</span>
                                <span className="text-[11px] text-on-surface-variant">{item.bookings} đơn</span>
                              </div>
                              <div className="flex h-[170px] w-full items-end justify-center">
                                <div
                                  className={`w-10 rounded-t-lg ${item.revenue > 0 ? 'bg-primary' : 'bg-outline-variant'}`}
                                  style={{ height: `${barHeight}%` }}
                                />
                              </div>
                              <span className="h-8 text-[12px] font-bold text-on-surface-variant">{item.label}</span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[14px] font-bold text-on-surface-variant">
                          Chưa có dữ liệu doanh thu trong kỳ này.
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section className="owner-panel scroll-mt-24" id="owner-revenue-history">
                  <div className="flex flex-col gap-4 border-b border-outline-variant p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-[20px] font-bold">
                        <ReceiptText className="h-5 w-5 text-primary" />
                        Lịch sử thanh toán
                      </h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">Tra cứu giao dịch theo trạng thái, mã đơn, khách hàng hoặc phương thức thanh toán.</p>
                    </div>
                    <div className="relative w-full lg:w-[360px]">
                      <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                      <input
                        aria-label="Tìm giao dịch"
                        className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => { setSearchTerm(event.target.value); setHistoryPage(1); }}
                        placeholder="Tìm mã đơn, khách, sân..."
                        type="text"
                        value={searchTerm}
                      />
                    </div>
                  </div>

                  <div className="border-b border-outline-variant px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      {transactionStatusOptions.map((option) => (
                        <button
                          aria-pressed={activeStatus === option.value}
                        className={`h-9 rounded-lg px-3 text-[13px] font-bold transition-colors ${
                            activeStatus === option.value
                              ? 'bg-primary text-white'
                              : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                          key={option.value}
                          onClick={() => { setActiveStatus(option.value); setHistoryPage(1); }}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-surface-container-low">
                        <tr>
                          <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Giao dịch</th>
                          <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Khách hàng</th>
                          <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Sân</th>
                          <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Thời gian</th>
                          <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Phương thức</th>
                          <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Số tiền</th>
                          <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant">
                        {pagedTransactions.map((transaction) => {
                          const StatusIcon = getStatusIcon(transaction.status);
                          const displayAmount = transaction.status === 'refunded' ? transaction.refundAmount : transaction.booking.totalAmount;

                          return (
                            <tr className="hover:bg-[#FAFBF8]" key={transaction.id}>
                              <td className="px-5 py-4">
                                <p className="text-[14px] font-bold text-primary">{transaction.booking.code}</p>
                                <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold ${getStatusClassName(transaction.status)}`}>
                                  <StatusIcon className="h-3.5 w-3.5" />
                                  {getStatusLabel(transaction.status)}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-[14px] font-bold">{transaction.booking.customerName}</p>
                                <p className="mt-1 text-[12px] text-on-surface-variant">{transaction.booking.customerPhone}</p>
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-[14px] font-bold">{transaction.booking.courtName}</p>
                                <p className="mt-1 text-[12px] text-on-surface-variant">{transaction.booking.subCourt}</p>
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-[14px] font-bold">{formatBookingDateTime(transaction.paidAt)}</p>
                                <p className="mt-1 text-[12px] text-on-surface-variant">
                                  {transaction.booking.startTime} - {transaction.booking.endTime}
                                </p>
                              </td>
                              <td className="px-5 py-4 text-[14px] font-bold">{transaction.booking.paymentMethod}</td>
                              <td className="px-5 py-4">
                                <p className="text-[15px] font-bold">{formatBookingCurrency(displayAmount)}</p>
                                <p className="mt-1 text-[12px] text-on-surface-variant">
                                  {transaction.status === 'refunded' ? 'Khoản đang chờ/đã hoàn' : 'Phí ' + formatBookingCurrency(transaction.booking.serviceFee)}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  <Link
                                    aria-label={`Xem ${transaction.booking.code}`}
                                    className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low"
                                    to={transaction.viewHref}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {filteredTransactions.length === 0 && (
                          <tr>
                            <td className="px-5 py-10 text-center text-[14px] font-bold text-on-surface-variant" colSpan={7}>
                              Không tìm thấy giao dịch phù hợp.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* PaginationControls hides itself on a single page, so the framing must too. */}
                  {filteredTransactions.length > historyPageSize && (
                    <div className="border-t border-outline-variant p-4">
                      <PaginationControls onPageChange={setHistoryPage} page={historyPagination} />
                    </div>
                  )}
                </section>
              </div>

              <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
                <section className="owner-panel border-[#b8ccaf] p-4">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Tổng hợp kỳ này
                  </h2>
                  <div className="mt-5 space-y-4">
                    <button
                      className="w-full rounded-lg bg-surface-container-low p-4 text-left transition-colors hover:bg-surface-container focus:outline-none focus:ring-2 focus:ring-primary/30"
                      onClick={() => showTransactions('paid')}
                      type="button"
                    >
                      <p className="text-[12px] font-bold uppercase text-on-surface-variant">Doanh thu ròng</p>
                      <p className="mt-1 text-[28px] font-bold text-primary">{formatBookingCurrency(netRevenue)}</p>
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        className="rounded-lg border border-outline-variant p-3 text-left transition-colors hover:bg-surface-container-low focus:outline-none focus:ring-2 focus:ring-primary/30"
                        onClick={() => showTransactions('refunded')}
                        type="button"
                      >
                        <p className="text-[12px] font-bold text-on-surface-variant">Hoàn / hủy</p>
                        <p className="mt-1 text-[16px] font-bold">{formatBookingCurrency(refundedAmount)}</p>
                      </button>
                      <div className="rounded-lg border border-outline-variant p-3">
                        <p className="text-[12px] font-bold text-on-surface-variant">Phí nền tảng</p>
                        <p className="mt-1 text-[16px] font-bold">{formatBookingCurrency(serviceFees)}</p>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="owner-panel p-4">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <MapIcon className="h-5 w-5 text-primary" />
                    Doanh thu theo sân
                  </h2>
                  <div className="mt-5 space-y-4">
                    {courtRevenue.map((court) => {
                      const width = grossRevenue > 0 ? Math.max(8, Math.round((court.revenue / grossRevenue) * 100)) : 8;

                      return (
                        <div className="rounded-lg border border-outline-variant p-4" key={court.name}>
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-[14px] font-bold">{court.name}</p>
                              <p className="mt-1 text-[12px] text-on-surface-variant">
                                {court.paidBookings}/{court.bookings} đơn đã thanh toán
                              </p>
                            </div>
                            <p className="text-right text-[14px] font-bold text-primary">{formatBookingCurrency(court.revenue)}</p>
                          </div>
                          <div className="mt-3 h-2 rounded-full bg-surface-container-low">
                            <div className="h-2 rounded-full bg-primary" style={{ width: `${width}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="owner-panel p-4">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <ReceiptText className="h-5 w-5 text-primary" />
                    Phương thức thanh toán
                  </h2>
                  <div className="mt-5 space-y-3">
                    {methodSummary.map((method) => (
                      <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-3" key={method.method}>
                        <div>
                          <p className="text-[13px] font-bold">{method.method}</p>
                          <p className="mt-1 text-[12px] text-on-surface-variant">{method.count} giao dịch</p>
                        </div>
                        <p className="text-right text-[14px] font-bold">{formatBookingCurrency(method.amount)}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </aside>
            </section>
    </OwnerShell>
  );
};
