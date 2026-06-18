import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  MapPin,
  ReceiptText,
  RefreshCcw,
  Search,
  ShieldCheck,
  TicketCheck,
  XCircle,
} from 'lucide-react';
import {
  BookingCheckInStatus,
  BookingDetail,
  BookingPaymentStatus,
  BookingStatus,
  formatBookingCurrency,
  formatBookingDate,
  playerBookings,
} from '../../data/bookings';

type BookingFilter = 'all' | 'upcoming' | 'pending' | 'checked_in' | 'cancelled';

const filterOptions: Array<{ label: string; value: BookingFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Sắp tới', value: 'upcoming' },
  { label: 'Chờ thanh toán', value: 'pending' },
  { label: 'Đã check-in', value: 'checked_in' },
  { label: 'Đã hủy', value: 'cancelled' },
];

const paymentStatusConfig: Record<BookingPaymentStatus, { label: string; className: string }> = {
  paid: {
    label: 'Đã thanh toán',
    className: 'bg-[#eaf7df] text-primary',
  },
  pending: {
    label: 'Chờ thanh toán',
    className: 'bg-[#fff4d8] text-[#7a5600]',
  },
  failed: {
    label: 'Thanh toán lỗi',
    className: 'bg-[#ffdad6] text-[#ba1a1a]',
  },
};

const bookingStatusConfig: Record<BookingStatus, { label: string; className: string }> = {
  confirmed: {
    label: 'Đã xác nhận',
    className: 'bg-[#eaf7df] text-primary',
  },
  holding: {
    label: 'Đang giữ tạm',
    className: 'bg-[#fff4d8] text-[#7a5600]',
  },
  cancelled: {
    label: 'Đã hủy',
    className: 'bg-[#ffdad6] text-[#ba1a1a]',
  },
};

const checkInStatusConfig: Record<BookingCheckInStatus, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  ready: {
    label: 'Có thể check-in',
    className: 'bg-primary text-white',
    icon: CheckCircle2,
  },
  not_open: {
    label: 'Chưa mở check-in',
    className: 'bg-surface-container-low text-on-surface-variant',
    icon: Clock,
  },
  checked_in: {
    label: 'Đã check-in',
    className: 'bg-[#eaf7df] text-primary',
    icon: TicketCheck,
  },
  missed: {
    label: 'Quá giờ',
    className: 'bg-[#ffdad6] text-[#ba1a1a]',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Không áp dụng',
    className: 'bg-surface-container-low text-on-surface-variant',
    icon: XCircle,
  },
};

const getFilterMatch = (booking: BookingDetail, filter: BookingFilter) => {
  if (filter === 'all') {
    return true;
  }

  if (filter === 'upcoming') {
    return booking.bookingStatus !== 'cancelled' && booking.checkInStatus !== 'checked_in';
  }

  if (filter === 'pending') {
    return booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed';
  }

  if (filter === 'checked_in') {
    return booking.checkInStatus === 'checked_in';
  }

  return booking.bookingStatus === 'cancelled';
};

const sortBookings = (bookings: BookingDetail[]) =>
  [...bookings].sort((first, second) => {
    const firstDate = `${first.date}T${first.startTime}:00`;
    const secondDate = `${second.date}T${second.startTime}:00`;

    return new Date(secondDate).getTime() - new Date(firstDate).getTime();
  });

export const MyBookings = () => {
  const [bookings, setBookings] = useState<BookingDetail[]>(playerBookings);
  const [activeFilter, setActiveFilter] = useState<BookingFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredBookings = useMemo(
    () =>
      sortBookings(
        bookings.filter((booking) => {
          const matchesFilter = getFilterMatch(booking, activeFilter);
          const searchableText = `${booking.code} ${booking.courtName} ${booking.subCourt} ${booking.area}`.toLowerCase();

          return matchesFilter && (!normalizedSearchTerm || searchableText.includes(normalizedSearchTerm));
        }),
      ),
    [activeFilter, bookings, normalizedSearchTerm],
  );

  const nextBooking = useMemo(
    () =>
      sortBookings(
        bookings.filter((booking) => booking.bookingStatus !== 'cancelled' && booking.checkInStatus !== 'checked_in'),
      ).at(-1),
    [bookings],
  );

  const paidCount = bookings.filter((booking) => booking.paymentStatus === 'paid').length;
  const pendingCount = bookings.filter((booking) => booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed').length;
  const checkedInCount = bookings.filter((booking) => booking.checkInStatus === 'checked_in').length;

  const cancelBooking = (bookingId: string) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              bookingStatus: 'cancelled',
              checkInStatus: 'cancelled',
              note: 'Đơn đã hủy theo yêu cầu của người chơi.',
            }
          : booking,
      ),
    );
  };

  const checkInBooking = (bookingId: string) => {
    setBookings((currentBookings) =>
      currentBookings.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              checkInStatus: 'checked_in',
              paymentStatus: booking.paymentStatus === 'pending' ? 'paid' : booking.paymentStatus,
              bookingStatus: 'confirmed',
              note: 'Người chơi đã check-in thành công tại sân.',
            }
          : booking,
      ),
    );
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-lg bg-white/12 px-3 py-2 text-[13px] font-bold text-white/88">
                <ReceiptText className="h-4 w-4" />
                Lịch sử đặt sân
              </p>
              <h1 className="mt-4 text-[32px] font-bold leading-tight md:text-[44px]">Đơn đặt sân của tôi</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-white/84">
                Theo dõi lịch sắp tới, trạng thái thanh toán, check-in và thao tác nhanh với từng đơn đặt sân.
              </p>
            </div>

            <div className="rounded-lg border border-white/18 bg-white/10 p-5">
              <p className="text-[13px] font-bold uppercase text-white/72">Tổng quan</p>
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Đã thanh toán', value: paidCount },
                  { label: 'Cần xử lý', value: pendingCount },
                  { label: 'Check-in', value: checkedInCount },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[24px] font-bold">{item.value}</p>
                    <p className="text-[11px] font-medium text-white/72">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-outline-variant bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-variant" />
                <input
                  className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-10 pr-4 text-[14px] font-medium outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Tìm theo mã đơn, tên sân, khu vực..."
                  type="text"
                  value={searchTerm}
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
                <Filter className="h-5 w-5 shrink-0 text-primary" />
                {filterOptions.map((option) => (
                  <button
                    className={`h-10 shrink-0 rounded-lg px-4 text-[13px] font-bold transition-colors ${
                      activeFilter === option.value
                        ? 'bg-primary text-white'
                        : 'border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low'
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
          </section>

          <section className="space-y-4">
            {filteredBookings.map((booking) => {
              const paymentStatus = paymentStatusConfig[booking.paymentStatus];
              const bookingStatus = bookingStatusConfig[booking.bookingStatus];
              const checkInStatus = checkInStatusConfig[booking.checkInStatus];
              const CheckInIcon = checkInStatus.icon;
              const canCheckIn = booking.checkInStatus === 'ready' && booking.bookingStatus === 'confirmed';
              const canCancel = booking.bookingStatus !== 'cancelled' && booking.checkInStatus !== 'checked_in';
              const canPay = booking.paymentStatus === 'pending' || booking.paymentStatus === 'failed';

              return (
                <article className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm" key={booking.id}>
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${bookingStatus.className}`}>
                          {bookingStatus.label}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${paymentStatus.className}`}>
                          {paymentStatus.label}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold ${checkInStatus.className}`}>
                          <CheckInIcon className="h-4 w-4" />
                          {checkInStatus.label}
                        </span>
                      </div>

                      <Link className="mt-3 block text-[22px] font-bold leading-tight hover:text-primary" to={`/bookings/${booking.id}`}>
                        {booking.courtName}
                      </Link>
                      <p className="mt-2 text-[14px] font-medium text-on-surface-variant">{booking.code}</p>

                      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <div className="flex gap-2 rounded-lg bg-surface-container-low p-3">
                          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <div>
                            <p className="text-[12px] font-bold text-on-surface-variant">Ngày chơi</p>
                            <p className="mt-1 text-[13px] font-bold">{formatBookingDate(booking.date)}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 rounded-lg bg-surface-container-low p-3">
                          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <div>
                            <p className="text-[12px] font-bold text-on-surface-variant">Khung giờ</p>
                            <p className="mt-1 text-[13px] font-bold">
                              {booking.startTime} - {booking.endTime}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 rounded-lg bg-surface-container-low p-3">
                          <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <div>
                            <p className="text-[12px] font-bold text-on-surface-variant">Sân con</p>
                            <p className="mt-1 text-[13px] font-bold">{booking.subCourt}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-lg border border-outline-variant p-4 xl:w-[220px]">
                      <p className="text-[12px] font-bold uppercase text-on-surface-variant">Tổng tiền</p>
                      <p className="mt-1 text-[24px] font-bold text-primary">{formatBookingCurrency(booking.totalAmount)}</p>
                      <p className="mt-1 text-[12px] font-medium text-on-surface-variant">{booking.paymentMethod}</p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-col gap-3 border-t border-outline-variant pt-4 md:flex-row md:flex-wrap md:items-center">
                    <Link
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-on-surface hover:bg-surface-container-low"
                      to={`/bookings/${booking.id}`}
                    >
                      <ReceiptText className="h-5 w-5" />
                      Chi tiết
                    </Link>

                    {canPay && (
                      <Link
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                        to="/checkout"
                      >
                        <CreditCard className="h-5 w-5" />
                        Thanh toán
                      </Link>
                    )}

                    <button
                      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-bold ${
                        canCheckIn
                          ? 'bg-[#eab526] text-white hover:bg-[#d6a51f]'
                          : 'cursor-not-allowed bg-surface-container-low text-on-surface-variant'
                      }`}
                      disabled={!canCheckIn}
                      onClick={() => checkInBooking(booking.id)}
                      type="button"
                    >
                      <TicketCheck className="h-5 w-5" />
                      Check-in
                    </button>

                    <button
                      className={`inline-flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-[14px] font-bold ${
                        canCancel
                          ? 'border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ffdad6]/40'
                          : 'cursor-not-allowed border-outline-variant text-on-surface-variant'
                      }`}
                      disabled={!canCancel}
                      onClick={() => cancelBooking(booking.id)}
                      type="button"
                    >
                      <XCircle className="h-5 w-5" />
                      Hủy lịch
                    </button>

                    <Link
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                      to={`/court/${booking.courtId}/schedule`}
                    >
                      <RefreshCcw className="h-5 w-5" />
                      Đặt lại
                    </Link>
                  </div>
                </article>
              );
            })}

            {filteredBookings.length === 0 && (
              <div className="rounded-lg border border-outline-variant bg-white p-8 text-center shadow-sm">
                <CalendarDays className="mx-auto h-10 w-10 text-primary" />
                <h2 className="mt-3 text-[20px] font-bold">Không có đơn phù hợp</h2>
                <p className="mt-2 text-[14px] text-on-surface-variant">Thử đổi bộ lọc hoặc tìm theo mã đơn khác.</p>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-lg border border-primary bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Lịch gần nhất
            </h2>
            {nextBooking ? (
              <div className="mt-5">
                <p className="text-[16px] font-bold">{nextBooking.courtName}</p>
                <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">
                  {formatBookingDate(nextBooking.date)} · {nextBooking.startTime} - {nextBooking.endTime}
                </p>
                <Link
                  className="mt-4 flex items-center justify-center rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                  to={`/bookings/${nextBooking.id}`}
                >
                  Xem đơn gần nhất
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">Bạn chưa có lịch sắp tới.</p>
            )}
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[20px] font-bold">
              <AlertCircle className="h-5 w-5 text-primary" />
              Quy định nhanh
            </h2>
            <div className="mt-4 space-y-3 text-[13px] font-medium leading-6 text-on-surface-variant">
              <p>Check-in mở khi đơn đã xác nhận và gần giờ chơi.</p>
              <p>Đơn đã check-in không thể hủy trực tiếp trên giao diện này.</p>
              <p>Đặt lại sẽ đưa bạn về lịch sân của cùng cụm sân.</p>
            </div>
          </section>

          <Link
            className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white shadow-sm hover:bg-primary/90"
            to="/book-court"
          >
            <CalendarDays className="h-5 w-5" />
            Đặt sân mới
          </Link>
        </aside>
      </main>
    </div>
  );
};
