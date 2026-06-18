import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  CreditCard,
  HelpCircle,
  Map,
  MapPin,
  MessageCircle,
  Phone,
  ReceiptText,
  Settings,
  ShieldCheck,
  User,
  UserRound,
  XCircle,
} from 'lucide-react';
import type { BookingCheckInStatus, BookingPaymentStatus, BookingStatus } from '../../data/bookings';
import { formatBookingCurrency, formatBookingDate, formatBookingDateTime, getBookingById } from '../../data/bookings';

type StatusConfig = {
  label: string;
  helper: string;
  className: string;
  icon: React.ElementType;
};

type TimelineState = 'done' | 'current' | 'upcoming' | 'failed';

const bookingStatusConfig: Record<BookingStatus, StatusConfig> = {
  confirmed: {
    label: 'Đã xác nhận',
    helper: 'Sân đã được giữ cho khách.',
    className: 'bg-[#eaf7df] text-primary',
    icon: CheckCircle2,
  },
  holding: {
    label: 'Chờ xử lý',
    helper: 'Cần xác nhận hoặc hủy đơn.',
    className: 'bg-[#fff4d8] text-[#755400]',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Đã hủy',
    helper: 'Đơn không còn giữ sân.',
    className: 'bg-[#ffdad6] text-[#ba1a1a]',
    icon: XCircle,
  },
};

const paymentStatusConfig: Record<BookingPaymentStatus, StatusConfig> = {
  paid: {
    label: 'Đã thanh toán',
    helper: 'Giao dịch đã được ghi nhận.',
    className: 'bg-[#eaf7df] text-primary',
    icon: CreditCard,
  },
  pending: {
    label: 'Chờ thanh toán',
    helper: 'Khách cần thanh toán tại sân hoặc hoàn tất online.',
    className: 'bg-[#fff4d8] text-[#755400]',
    icon: Clock,
  },
  failed: {
    label: 'Thanh toán lỗi',
    helper: 'Cần liên hệ khách để xử lý lại.',
    className: 'bg-[#ffdad6] text-[#ba1a1a]',
    icon: XCircle,
  },
};

const checkInStatusConfig: Record<BookingCheckInStatus, StatusConfig> = {
  not_open: {
    label: 'Chưa mở check-in',
    helper: 'Check-in sẽ mở gần giờ chơi.',
    className: 'bg-[#eef0ef] text-[#57615b]',
    icon: Clock,
  },
  ready: {
    label: 'Sẵn sàng check-in',
    helper: 'Khách có thể check-in tại quầy.',
    className: 'bg-[#eaf7df] text-primary',
    icon: ClipboardCheck,
  },
  checked_in: {
    label: 'Đã check-in',
    helper: 'Khách đã nhận sân.',
    className: 'bg-[#eaf7df] text-primary',
    icon: CheckCircle2,
  },
  missed: {
    label: 'Khách vắng mặt',
    helper: 'Đã quá giờ nhưng khách chưa đến.',
    className: 'bg-[#fff4d8] text-[#755400]',
    icon: AlertCircle,
  },
  cancelled: {
    label: 'Đã hủy check-in',
    helper: 'Không cần xử lý check-in.',
    className: 'bg-[#ffdad6] text-[#ba1a1a]',
    icon: XCircle,
  },
};

const getTimelineStateClassName = (state: TimelineState) => {
  if (state === 'done') {
    return 'border-primary bg-primary text-white';
  }

  if (state === 'failed') {
    return 'border-[#ba1a1a] bg-[#ffdad6] text-[#ba1a1a]';
  }

  if (state === 'current') {
    return 'border-[#755400] bg-[#fff4d8] text-[#755400]';
  }

  return 'border-outline-variant bg-white text-on-surface-variant';
};

export const OwnerBookingDetail = () => {
  const { id } = useParams();
  const booking = getBookingById(id);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>(booking.bookingStatus);
  const [paymentStatus, setPaymentStatus] = useState<BookingPaymentStatus>(booking.paymentStatus);
  const [checkInStatus, setCheckInStatus] = useState<BookingCheckInStatus>(booking.checkInStatus);
  const [ownerNote, setOwnerNote] = useState(
    `Khách ưu tiên ${booking.subCourt}. Kiểm tra trạng thái thanh toán và chuẩn bị sân trước ${booking.startTime}.`,
  );

  useEffect(() => {
    setBookingStatus(booking.bookingStatus);
    setPaymentStatus(booking.paymentStatus);
    setCheckInStatus(booking.checkInStatus);
    setOwnerNote(`Khách ưu tiên ${booking.subCourt}. Kiểm tra trạng thái thanh toán và chuẩn bị sân trước ${booking.startTime}.`);
  }, [booking.bookingStatus, booking.checkInStatus, booking.id, booking.paymentStatus, booking.startTime, booking.subCourt]);

  const activeBookingStatusConfig = bookingStatusConfig[bookingStatus];
  const activePaymentStatusConfig = paymentStatusConfig[paymentStatus];
  const activeCheckInStatusConfig = checkInStatusConfig[checkInStatus];

  const timelineSteps = useMemo(
    () => [
      {
        label: 'Tiếp nhận đơn',
        description: `Đơn được tạo lúc ${formatBookingDateTime(booking.createdAt)}.`,
        state: 'done' as TimelineState,
      },
      {
        label: 'Thanh toán',
        description: activePaymentStatusConfig.helper,
        state: paymentStatus === 'paid' ? ('done' as TimelineState) : paymentStatus === 'failed' ? ('failed' as TimelineState) : ('current' as TimelineState),
      },
      {
        label: 'Xác nhận sân',
        description: activeBookingStatusConfig.helper,
        state:
          bookingStatus === 'confirmed' ? ('done' as TimelineState) : bookingStatus === 'cancelled' ? ('failed' as TimelineState) : ('current' as TimelineState),
      },
      {
        label: 'Check-in',
        description: activeCheckInStatusConfig.helper,
        state:
          checkInStatus === 'checked_in'
            ? ('done' as TimelineState)
            : checkInStatus === 'missed' || checkInStatus === 'cancelled'
              ? ('failed' as TimelineState)
              : checkInStatus === 'ready'
                ? ('current' as TimelineState)
                : ('upcoming' as TimelineState),
      },
    ],
    [
      activeBookingStatusConfig.helper,
      activeCheckInStatusConfig.helper,
      activePaymentStatusConfig.helper,
      booking.createdAt,
      bookingStatus,
      checkInStatus,
      paymentStatus,
    ],
  );

  const confirmBooking = () => {
    setBookingStatus('confirmed');
    setPaymentStatus((currentPaymentStatus) => (currentPaymentStatus === 'failed' ? 'pending' : currentPaymentStatus));
    setCheckInStatus((currentCheckInStatus) => (currentCheckInStatus === 'not_open' ? 'ready' : currentCheckInStatus));
  };

  const cancelBooking = () => {
    setBookingStatus('cancelled');
    setCheckInStatus('cancelled');
  };

  const canConfirm = bookingStatus === 'holding';
  const canCheckIn = bookingStatus !== 'cancelled' && checkInStatus === 'ready';
  const canMarkMissed = bookingStatus !== 'cancelled' && checkInStatus !== 'checked_in' && checkInStatus !== 'cancelled';
  const phoneHref = `tel:${booking.customerPhone.replace(/\s/g, '')}`;

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
              { label: 'Doanh thu', icon: Banknote, to: '/owner/revenue', active: false },
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
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/owner/bookings">
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại danh sách đơn
                </Link>
                <h1 className="mt-3 text-[30px] font-bold leading-tight md:text-[40px]">Chi tiết đơn đặt sân</h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-on-surface-variant">
                  Kiểm tra thông tin khách, thanh toán, check-in và xử lý trạng thái đơn từ một màn hình dành cho chủ sân.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <a
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                  href={phoneHref}
                >
                  <Phone className="h-5 w-5" />
                  Gọi khách
                </a>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                  to="/messages"
                >
                  <MessageCircle className="h-5 w-5" />
                  Nhắn khách
                </Link>
              </div>
            </section>

            <section className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
              <div className="bg-primary px-5 py-6 text-white md:px-6">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="text-[13px] font-bold uppercase text-white/70">Mã đơn</p>
                    <h2 className="mt-2 text-[28px] font-bold leading-tight md:text-[36px]">{booking.code}</h2>
                    <p className="mt-3 max-w-3xl text-[14px] leading-6 text-white/82">
                      {booking.courtName} · {booking.subCourt} · {formatBookingDate(booking.date)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { config: activeBookingStatusConfig, value: bookingStatus },
                      { config: activePaymentStatusConfig, value: paymentStatus },
                      { config: activeCheckInStatusConfig, value: checkInStatus },
                    ].map((item) => (
                      <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-bold ${item.config.className}`} key={item.value}>
                        <item.config.icon className="h-4 w-4" />
                        {item.config.label}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Ngày chơi', value: formatBookingDate(booking.date), icon: CalendarDays },
                  { label: 'Khung giờ', value: `${booking.startTime} - ${booking.endTime}`, icon: Clock },
                  { label: 'Sân con', value: booking.subCourt, icon: MapPin },
                  { label: 'Tổng tiền', value: formatBookingCurrency(booking.totalAmount), icon: ReceiptText },
                ].map((item) => (
                  <div className="rounded-lg bg-surface-container-low p-4" key={item.label}>
                    <item.icon className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-[12px] font-bold uppercase text-on-surface-variant">{item.label}</p>
                    <p className="mt-1 text-[15px] font-bold leading-5">{item.value}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-6">
                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-[20px] font-bold">
                        <ClipboardCheck className="h-5 w-5 text-primary" />
                        Tiến trình xử lý
                      </h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">Theo dõi các bước từ lúc tiếp nhận đến khi khách check-in.</p>
                    </div>
                    <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">
                      Tạo lúc {formatBookingDateTime(booking.createdAt)}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
                    {timelineSteps.map((step, index) => {
                      const StepIcon = step.state === 'failed' ? XCircle : step.state === 'done' ? CheckCircle2 : Clock;

                      return (
                        <div className="rounded-lg border border-outline-variant p-4" key={step.label}>
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-[13px] font-bold ${getTimelineStateClassName(
                                step.state,
                              )}`}
                            >
                              <StepIcon className="h-4 w-4" />
                            </span>
                            <span className="text-[12px] font-bold text-on-surface-variant">Bước {index + 1}</span>
                          </div>
                          <h3 className="mt-4 text-[15px] font-bold">{step.label}</h3>
                          <p className="mt-2 min-h-[48px] text-[13px] leading-5 text-on-surface-variant">{step.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <div className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 text-[20px] font-bold">
                      <UserRound className="h-5 w-5 text-primary" />
                      Thông tin khách
                    </h2>
                    <div className="mt-5 space-y-4">
                      {[
                        { label: 'Họ tên', value: booking.customerName },
                        { label: 'Số điện thoại', value: booking.customerPhone },
                        { label: 'Ghi chú khách', value: booking.note },
                      ].map((item) => (
                        <div className="rounded-lg bg-surface-container-low p-4" key={item.label}>
                          <p className="text-[12px] font-bold uppercase text-on-surface-variant">{item.label}</p>
                          <p className="mt-1 text-[14px] font-bold leading-6">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                    <h2 className="flex items-center gap-2 text-[20px] font-bold">
                      <MapPin className="h-5 w-5 text-primary" />
                      Thông tin sân
                    </h2>
                    <div className="mt-5 space-y-4">
                      {[
                        { label: 'Cụm sân', value: booking.courtName },
                        { label: 'Địa chỉ', value: booking.address },
                        { label: 'Khu vực', value: booking.area },
                      ].map((item) => (
                        <div className="rounded-lg bg-surface-container-low p-4" key={item.label}>
                          <p className="text-[12px] font-bold uppercase text-on-surface-variant">{item.label}</p>
                          <p className="mt-1 text-[14px] font-bold leading-6">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-[20px] font-bold">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        Ghi chú vận hành
                      </h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">Ghi chú nội bộ cho lễ tân, điều phối sân hoặc bộ phận hỗ trợ.</p>
                    </div>
                    <button className="w-fit rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white hover:bg-primary/90" type="button">
                      Lưu ghi chú
                    </button>
                  </div>
                  <textarea
                    className="mt-4 min-h-[120px] w-full rounded-lg border border-outline-variant bg-surface-container-low p-4 text-[14px] leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => setOwnerNote(event.target.value)}
                    value={ownerNote}
                  />
                </section>
              </div>

              <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
                <section className="rounded-lg border border-primary bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <ReceiptText className="h-5 w-5 text-primary" />
                    Thanh toán
                  </h2>
                  <div className="mt-5 space-y-3">
                    {[
                      { label: 'Giá theo giờ', value: `${formatBookingCurrency(booking.pricePerHour)} x ${booking.durationHours} giờ` },
                      { label: 'Phí dịch vụ', value: formatBookingCurrency(booking.serviceFee) },
                      { label: 'Phương thức', value: booking.paymentMethod },
                    ].map((item) => (
                      <div className="flex items-center justify-between gap-4 text-[14px]" key={item.label}>
                        <span className="text-on-surface-variant">{item.label}</span>
                        <span className="text-right font-bold">{item.value}</span>
                      </div>
                    ))}
                    <div className="border-t border-outline-variant pt-3">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-[14px] font-bold">Tổng cộng</span>
                        <span className="text-[22px] font-bold text-primary">{formatBookingCurrency(booking.totalAmount)}</span>
                      </div>
                    </div>
                  </div>

                  {paymentStatus !== 'paid' && (
                    <button
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                      onClick={() => setPaymentStatus('paid')}
                      type="button"
                    >
                      <CreditCard className="h-5 w-5" />
                      Ghi nhận đã thanh toán
                    </button>
                  )}
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <Settings className="h-5 w-5 text-primary" />
                    Thao tác đơn
                  </h2>
                  <div className="mt-5 space-y-3">
                    <button
                      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-bold ${
                        canConfirm ? 'bg-primary text-white hover:bg-primary/90' : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                      disabled={!canConfirm}
                      onClick={confirmBooking}
                      type="button"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                      Xác nhận đơn
                    </button>
                    <button
                      className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[14px] font-bold ${
                        canCheckIn ? 'bg-primary text-white hover:bg-primary/90' : 'bg-surface-container-low text-on-surface-variant'
                      }`}
                      disabled={!canCheckIn}
                      onClick={() => setCheckInStatus('checked_in')}
                      type="button"
                    >
                      <ClipboardCheck className="h-5 w-5" />
                      Check-in khách
                    </button>
                    <button
                      className={`flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-3 text-[14px] font-bold ${
                        canMarkMissed
                          ? 'border-outline-variant text-[#755400] hover:bg-[#fff4d8]'
                          : 'border-outline-variant bg-surface-container-low text-on-surface-variant'
                      }`}
                      disabled={!canMarkMissed}
                      onClick={() => setCheckInStatus('missed')}
                      type="button"
                    >
                      <AlertCircle className="h-5 w-5" />
                      Đánh dấu vắng mặt
                    </button>
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/50"
                      disabled={bookingStatus === 'cancelled'}
                      onClick={cancelBooking}
                      type="button"
                    >
                      <XCircle className="h-5 w-5" />
                      Hủy đơn
                    </button>
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-[#fff8e6] p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[18px] font-bold text-[#755400]">
                    <AlertCircle className="h-5 w-5" />
                    Lưu ý xử lý
                  </h2>
                  <div className="mt-4 space-y-3 text-[13px] leading-5 text-[#755400]">
                    <p>Đơn chờ xử lý nên được xác nhận trước giờ chơi để tránh giữ sân quá lâu.</p>
                    <p>Nếu khách thanh toán tại sân, hãy ghi nhận thanh toán trước khi check-in.</p>
                    <p>Khi hủy đơn, sân con sẽ cần được mở lại trên lịch vận hành.</p>
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
