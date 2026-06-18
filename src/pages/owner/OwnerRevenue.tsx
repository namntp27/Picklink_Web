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
  Download,
  Eye,
  Filter,
  HelpCircle,
  Map as MapIcon,
  ReceiptText,
  Search,
  Settings,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react';
import type { BookingDetail } from '../../data/bookings';
import { formatBookingCurrency, formatBookingDateTime, playerBookings } from '../../data/bookings';

type RevenuePeriod = 'today' | 'week' | 'month';
type TransactionStatus = 'all' | 'paid' | 'pending' | 'failed' | 'refunded';

type PaymentTransaction = {
  id: string;
  booking: BookingDetail;
  status: Exclude<TransactionStatus, 'all'>;
  paidAt: string;
};

const reportDate = new Date('2026-06-18T00:00:00');

const periodOptions: Array<{ label: string; value: RevenuePeriod; helper: string }> = [
  { label: 'Hôm nay', value: 'today', helper: '18/06/2026' },
  { label: 'Tuần này', value: 'week', helper: '15/06 - 21/06' },
  { label: 'Tháng này', value: 'month', helper: 'Tháng 06/2026' },
];

const transactionStatusOptions: Array<{ label: string; value: TransactionStatus }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Chờ thanh toán', value: 'pending' },
  { label: 'Thanh toán lỗi', value: 'failed' },
  { label: 'Đã hoàn / hủy', value: 'refunded' },
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
    return 'bg-[#eaf7df] text-primary';
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

const getDateRange = (period: RevenuePeriod) => {
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

  return Array.from({ length: 30 }, (_, index) => `2026-06-${(index + 1).toString().padStart(2, '0')}`);
};

const formatShortDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(`${date}T00:00:00`));

const formatPercent = (value: number) => `${Math.round(value)}%`;

export const OwnerRevenue = () => {
  const [activePeriod, setActivePeriod] = useState<RevenuePeriod>('month');
  const [activeStatus, setActiveStatus] = useState<TransactionStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const transactions = useMemo<PaymentTransaction[]>(
    () =>
      playerBookings.map((booking) => ({
        id: `pay-${booking.id}`,
        booking,
        status: getTransactionStatus(booking),
        paidAt: booking.paymentStatus === 'paid' ? booking.createdAt : booking.holdExpiresAt,
      })),
    [],
  );

  const periodDates = useMemo(() => getDateRange(activePeriod), [activePeriod]);
  const periodTransactions = useMemo(
    () => transactions.filter((transaction) => periodDates.includes(transaction.booking.date)),
    [periodDates, transactions],
  );

  const filteredTransactions = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return periodTransactions.filter((transaction) => {
      const { booking } = transaction;
      const matchesStatus = activeStatus === 'all' || transaction.status === activeStatus;
      const matchesKeyword =
        !keyword ||
        booking.code.toLowerCase().includes(keyword) ||
        booking.customerName.toLowerCase().includes(keyword) ||
        booking.courtName.toLowerCase().includes(keyword) ||
        booking.paymentMethod.toLowerCase().includes(keyword);

      return matchesStatus && matchesKeyword;
    });
  }, [activeStatus, periodTransactions, searchTerm]);

  const paidTransactions = periodTransactions.filter((transaction) => transaction.status === 'paid');
  const pendingTransactions = periodTransactions.filter((transaction) => transaction.status === 'pending');
  const refundedTransactions = periodTransactions.filter((transaction) => transaction.status === 'refunded');
  const failedTransactions = periodTransactions.filter((transaction) => transaction.status === 'failed');
  const grossRevenue = paidTransactions.reduce((total, transaction) => total + transaction.booking.totalAmount, 0);
  const pendingAmount = pendingTransactions.reduce((total, transaction) => total + transaction.booking.totalAmount, 0);
  const refundedAmount = refundedTransactions.reduce((total, transaction) => total + transaction.booking.totalAmount, 0);
  const serviceFees = paidTransactions.reduce((total, transaction) => total + transaction.booking.serviceFee, 0);
  const netRevenue = grossRevenue - serviceFees;
  const successRate = periodTransactions.length > 0 ? (paidTransactions.length / periodTransactions.length) * 100 : 0;
  const averageOrderValue = paidTransactions.length > 0 ? grossRevenue / paidTransactions.length : 0;

  const chartDates = activePeriod === 'month' ? periodDates.filter((date) => periodTransactions.some((transaction) => transaction.booking.date === date)) : periodDates;
  const dailyRevenue = chartDates.map((date) => {
    const dayTransactions = periodTransactions.filter((transaction) => transaction.booking.date === date);
    const revenue = dayTransactions
      .filter((transaction) => transaction.status === 'paid')
      .reduce((total, transaction) => total + transaction.booking.totalAmount, 0);

    return {
      date,
      label: formatShortDate(date),
      revenue,
      bookings: dayTransactions.length,
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
    <div className="min-h-screen bg-[#f9f9ff] text-on-surface">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-primary px-4 text-white shadow-md md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <Link className="text-[24px] font-bold tracking-tight" to="/">
            Picklink
          </Link>
          <span className="hidden rounded-lg border border-white/20 px-3 py-1 text-[12px] font-bold text-white/86 md:inline-flex">
            Chủ sân
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link className="hidden rounded-lg bg-white/10 px-4 py-2 text-[14px] font-bold hover:bg-white/16 md:inline-flex" to="/owner">
            Lịch sân
          </Link>
          <Link className="hidden rounded-lg bg-white/10 px-4 py-2 text-[14px] font-bold hover:bg-white/16 md:inline-flex" to="/owner/bookings">
            Đơn đặt sân
          </Link>
          <Link className="hidden rounded-lg bg-white px-4 py-2 text-[14px] font-bold text-primary md:inline-flex" to="/owner/revenue">
            Doanh thu
          </Link>
          <button aria-label="Thông báo chủ sân" className="rounded-lg p-2 hover:bg-white/10" type="button">
            <Bell className="h-5 w-5" />
          </button>
          <button aria-label="Trợ giúp" className="hidden rounded-lg p-2 hover:bg-white/10 sm:inline-flex" type="button">
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/12">
            <User className="h-5 w-5" />
          </div>
        </div>
      </header>

      <div className="flex min-w-0">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 shrink-0 border-r border-outline-variant bg-white p-4 md:block">
          <div className="mb-6 px-2 pt-2">
            <h2 className="text-[20px] font-bold text-primary">Picklink Admin</h2>
            <p className="mt-1 text-[12px] font-medium text-on-surface-variant">Quản lý vận hành sân</p>
          </div>

          <nav className="space-y-1">
            {[
              { label: 'Lịch đặt sân', icon: CalendarDays, to: '/owner', active: false },
              { label: 'Đơn đặt sân', icon: CreditCard, to: '/owner/bookings', active: false },
              { label: 'Sân & court', icon: MapIcon, to: '/owner/courts', active: false },
              { label: 'Doanh thu', icon: Banknote, to: '/owner/revenue', active: true },
              { label: 'Cài đặt', icon: Settings, to: '/owner', active: false },
            ].map((item) => (
              <Link
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-bold transition-colors ${
                  item.active ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                }`}
                key={item.label}
                to={item.to}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <div className="mx-auto max-w-[1320px] space-y-6">
            <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary">
                  <BarChart3 className="h-4 w-4" />
                  Doanh thu và đối soát
                </p>
                <h1 className="mt-3 text-[30px] font-bold leading-tight md:text-[40px]">Doanh thu chủ sân</h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-on-surface-variant">
                  Theo dõi doanh thu đã nhận, khoản chờ thanh toán, hiệu suất theo sân và lịch sử giao dịch từ các đơn đặt sân.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                  type="button"
                >
                  <Filter className="h-5 w-5" />
                  Lọc nâng cao
                </button>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                  type="button"
                >
                  <Download className="h-5 w-5" />
                  Xuất báo cáo
                </button>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {periodOptions.map((option) => (
                <button
                  className={`rounded-lg border p-4 text-left transition-colors ${
                    activePeriod === option.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-outline-variant bg-white text-on-surface hover:bg-surface-container-low'
                  }`}
                  key={option.value}
                  onClick={() => setActivePeriod(option.value)}
                  type="button"
                >
                  <span className="text-[14px] font-bold">{option.label}</span>
                  <span className={`mt-1 block text-[12px] font-medium ${activePeriod === option.value ? 'text-white/76' : 'text-on-surface-variant'}`}>
                    {option.helper}
                  </span>
                </button>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  label: 'Doanh thu đã nhận',
                  value: formatBookingCurrency(grossRevenue),
                  icon: Banknote,
                  helper: `${paidTransactions.length} giao dịch thành công`,
                },
                {
                  label: 'Chờ thanh toán',
                  value: formatBookingCurrency(pendingAmount),
                  icon: Clock,
                  helper: `${pendingTransactions.length} đơn cần thu`,
                },
                {
                  label: 'Doanh thu ròng',
                  value: formatBookingCurrency(netRevenue),
                  icon: TrendingUp,
                  helper: `Đã trừ ${formatBookingCurrency(serviceFees)} phí`,
                },
                {
                  label: 'Tỷ lệ thành công',
                  value: formatPercent(successRate),
                  icon: CheckCircle2,
                  helper: `${failedTransactions.length} lỗi, ${refundedTransactions.length} hoàn/hủy`,
                },
              ].map((stat) => (
                <div className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm" key={stat.label}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-bold text-on-surface-variant">{stat.label}</p>
                      <p className="mt-2 text-[26px] font-bold leading-tight text-on-surface">{stat.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-[12px] font-medium text-on-surface-variant">{stat.helper}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
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

                  <div className="mt-6 h-[280px] overflow-x-auto">
                    <div className="flex h-full min-w-[640px] items-end gap-3 border-b border-outline-variant px-2">
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

                <section className="rounded-lg border border-outline-variant bg-white shadow-sm">
                  <div className="flex flex-col gap-4 border-b border-outline-variant p-5 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-[20px] font-bold">
                        <ReceiptText className="h-5 w-5 text-primary" />
                        Lịch sử thanh toán
                      </h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">Tra cứu giao dịch theo trạng thái, mã đơn, khách hàng hoặc phương thức thanh toán.</p>
                    </div>
                    <div className="relative w-full lg:w-[360px]">
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

                  <div className="border-b border-outline-variant px-5 py-3">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {transactionStatusOptions.map((option) => (
                        <button
                          className={`h-9 shrink-0 rounded-lg px-3 text-[13px] font-bold transition-colors ${
                            activeStatus === option.value
                              ? 'bg-primary text-white'
                              : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                          key={option.value}
                          onClick={() => setActiveStatus(option.value)}
                          type="button"
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1120px] text-left">
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
                        {filteredTransactions.map((transaction) => {
                          const StatusIcon = getStatusIcon(transaction.status);

                          return (
                            <tr className="hover:bg-[#f9f9ff]" key={transaction.id}>
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
                                <p className="text-[15px] font-bold">{formatBookingCurrency(transaction.booking.totalAmount)}</p>
                                <p className="mt-1 text-[12px] text-on-surface-variant">Phí {formatBookingCurrency(transaction.booking.serviceFee)}</p>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex justify-end gap-2">
                                  <Link
                                    aria-label={`Xem ${transaction.booking.code}`}
                                    className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low"
                                    to={`/owner/bookings/${transaction.booking.id}`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                  <button
                                    className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low"
                                    type="button"
                                    aria-label="Tải biên nhận"
                                  >
                                    <Download className="h-4 w-4" />
                                  </button>
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
                </section>
              </div>

              <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
                <section className="rounded-lg border border-primary bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Đối soát kỳ này
                  </h2>
                  <div className="mt-5 space-y-4">
                    <div className="rounded-lg bg-surface-container-low p-4">
                      <p className="text-[12px] font-bold uppercase text-on-surface-variant">Có thể rút</p>
                      <p className="mt-1 text-[28px] font-bold text-primary">{formatBookingCurrency(netRevenue)}</p>
                      <p className="mt-2 text-[12px] text-on-surface-variant">Dự kiến chuyển khoản vào 19/06/2026.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-outline-variant p-3">
                        <p className="text-[12px] font-bold text-on-surface-variant">Hoàn / hủy</p>
                        <p className="mt-1 text-[16px] font-bold">{formatBookingCurrency(refundedAmount)}</p>
                      </div>
                      <div className="rounded-lg border border-outline-variant p-3">
                        <p className="text-[12px] font-bold text-on-surface-variant">Phí nền tảng</p>
                        <p className="mt-1 text-[16px] font-bold">{formatBookingCurrency(serviceFees)}</p>
                      </div>
                    </div>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90" type="button">
                      <Download className="h-5 w-5" />
                      Tải bảng đối soát
                    </button>
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
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

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
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
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid h-16 grid-cols-5 border-t border-outline-variant bg-white md:hidden">
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner">
          <CalendarDays className="h-5 w-5" />
          <span className="text-[10px] font-bold">Lịch</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner/bookings">
          <CreditCard className="h-5 w-5" />
          <span className="text-[10px] font-bold">Đơn</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner/courts">
          <MapIcon className="h-5 w-5" />
          <span className="text-[10px] font-bold">Sân</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-primary" to="/owner/revenue">
          <Banknote className="h-5 w-5" />
          <span className="text-[10px] font-bold">Doanh thu</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner">
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-bold">Cài đặt</span>
        </Link>
      </nav>
    </div>
  );
};
