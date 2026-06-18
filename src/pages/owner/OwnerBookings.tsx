import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
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
  XCircle,
} from 'lucide-react';
import {
  BookingDetail,
  BookingStatus,
  formatBookingCurrency,
  formatBookingDate,
  playerBookings,
} from '../../data/bookings';

type OwnerBookingFilter = 'all' | BookingStatus | 'paid' | 'pending_payment' | 'ready_checkin';

const filterOptions: Array<{ label: string; value: OwnerBookingFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Chờ xử lý', value: 'holding' },
  { label: 'Đã hủy', value: 'cancelled' },
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Chờ thanh toán', value: 'pending_payment' },
  { label: 'Sẵn sàng check-in', value: 'ready_checkin' },
];

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

export const OwnerBookings = () => {
  const [bookings, setBookings] = useState<BookingDetail[]>(playerBookings);
  const [activeFilter, setActiveFilter] = useState<OwnerBookingFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredBookings = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return bookings.filter((booking) => {
      const matchesKeyword =
        !keyword ||
        booking.code.toLowerCase().includes(keyword) ||
        booking.customerName.toLowerCase().includes(keyword) ||
        booking.customerPhone.toLowerCase().includes(keyword) ||
        booking.courtName.toLowerCase().includes(keyword) ||
        booking.subCourt.toLowerCase().includes(keyword);
      const matchesFilter =
        activeFilter === 'all' ||
        booking.bookingStatus === activeFilter ||
        (activeFilter === 'paid' && booking.paymentStatus === 'paid') ||
        (activeFilter === 'pending_payment' && booking.paymentStatus === 'pending') ||
        (activeFilter === 'ready_checkin' && booking.checkInStatus === 'ready');

      return matchesKeyword && matchesFilter;
    });
  }, [activeFilter, bookings, searchTerm]);

  const pendingBookings = bookings.filter((booking) => booking.bookingStatus === 'holding');
  const confirmedBookings = bookings.filter((booking) => booking.bookingStatus === 'confirmed');
  const readyCheckIns = bookings.filter((booking) => booking.checkInStatus === 'ready');
  const totalRevenue = bookings
    .filter((booking) => booking.paymentStatus === 'paid' && booking.bookingStatus !== 'cancelled')
    .reduce((total, booking) => total + booking.totalAmount, 0);

  const confirmBooking = (bookingId: string) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              bookingStatus: 'confirmed',
              paymentStatus: booking.paymentStatus === 'failed' ? 'pending' : booking.paymentStatus,
              checkInStatus: booking.checkInStatus === 'not_open' ? 'ready' : booking.checkInStatus,
            }
          : booking,
      ),
    );
  };

  const cancelBooking = (bookingId: string) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              bookingStatus: 'cancelled',
              checkInStatus: 'cancelled',
            }
          : booking,
      ),
    );
  };

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
          <Link className="hidden rounded-lg bg-white px-4 py-2 text-[14px] font-bold text-primary md:inline-flex" to="/owner/bookings">
            Đơn đặt sân
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
              { label: 'Đơn đặt sân', icon: CreditCard, to: '/owner/bookings', active: true },
              { label: 'Sân & court', icon: Map, to: '/owner/courts', active: false },
              { label: 'Doanh thu', icon: Banknote, to: '/owner/revenue' },
              { label: 'Cài đặt', icon: Settings, to: '/owner' },
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
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary">
                  <CreditCard className="h-4 w-4" />
                  Danh sách đơn đặt sân
                </p>
                <h1 className="mt-3 text-[30px] font-bold leading-tight md:text-[40px]">Quản lý đơn đặt sân</h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-on-surface-variant">
                  Theo dõi đơn mới, trạng thái thanh toán, check-in và xử lý nhanh từng lịch đặt của người chơi.
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
                { label: 'Tổng đơn', value: bookings.length, icon: CreditCard, helper: `${pendingBookings.length} đơn chờ xử lý` },
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
              <div className="flex flex-col gap-4 border-b border-outline-variant p-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-[20px] font-bold">Tất cả đơn đặt sân</h2>
                  <p className="mt-1 text-[13px] text-on-surface-variant">Lọc theo trạng thái đơn, thanh toán hoặc check-in.</p>
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
                  {filterOptions.map((option) => (
                    <button
                      className={`h-9 shrink-0 rounded-lg px-3 text-[13px] font-bold transition-colors ${
                        activeFilter === option.value
                          ? 'bg-primary text-white'
                          : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                      }`}
                      key={option.value}
                      onClick={() => setActiveFilter(option.value)}
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
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Mã đơn</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Khách hàng</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Sân</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Thời gian</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Thanh toán</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Trạng thái</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {filteredBookings.map((booking) => (
                      <tr className="hover:bg-[#f9f9ff]" key={booking.id}>
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-bold text-primary">{booking.code}</p>
                          <p className="mt-1 text-[12px] text-on-surface-variant">{formatBookingDate(booking.date)}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-bold">{booking.customerName}</p>
                          <p className="mt-1 flex items-center gap-1 text-[12px] text-on-surface-variant">
                            <Phone className="h-3.5 w-3.5" />
                            {booking.customerPhone}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-bold">{booking.courtName}</p>
                          <p className="mt-1 text-[12px] text-on-surface-variant">{booking.subCourt}</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-[14px] font-bold">
                            {booking.startTime} - {booking.endTime}
                          </p>
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
                            <Link
                              aria-label={`Xem ${booking.code}`}
                              className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low"
                              to={`/owner/bookings/${booking.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {booking.bookingStatus === 'holding' && (
                              <button
                                className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-primary/90"
                                onClick={() => confirmBooking(booking.id)}
                                type="button"
                              >
                                Xác nhận
                              </button>
                            )}
                            {booking.bookingStatus !== 'cancelled' && (
                              <button
                                className="rounded-lg border border-outline-variant px-3 py-2 text-[12px] font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/50"
                                onClick={() => cancelBooking(booking.id)}
                                type="button"
                              >
                                Hủy
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}

                    {filteredBookings.length === 0 && (
                      <tr>
                        <td className="px-5 py-10 text-center text-[14px] font-bold text-on-surface-variant" colSpan={7}>
                          Không tìm thấy đơn đặt sân phù hợp.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid h-16 grid-cols-5 border-t border-outline-variant bg-white md:hidden">
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner">
          <CalendarDays className="h-5 w-5" />
          <span className="text-[10px] font-bold">Lịch</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-primary" to="/owner/bookings">
          <CreditCard className="h-5 w-5" />
          <span className="text-[10px] font-bold">Đơn</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner/courts">
          <Map className="h-5 w-5" />
          <span className="text-[10px] font-bold">Sân</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner/revenue">
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
