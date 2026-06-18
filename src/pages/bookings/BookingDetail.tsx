import React from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  MapPin,
  Phone,
  ReceiptText,
  RefreshCcw,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import {
  BookingTimelineStep,
  formatBookingCurrency,
  formatBookingDate,
  formatBookingDateTime,
  getBookingById,
} from '../../data/bookings';

const getTimelineClassName = (status: BookingTimelineStep['status']) => {
  if (status === 'done') {
    return 'bg-primary text-white';
  }

  if (status === 'current') {
    return 'bg-[#eab526] text-white';
  }

  if (status === 'failed') {
    return 'bg-[#ba1a1a] text-white';
  }

  return 'bg-surface-container-low text-on-surface-variant';
};

const getStatusLabel = (bookingStatus: string, paymentStatus: string) => {
  if (paymentStatus === 'failed') {
    return 'Thanh toan loi';
  }

  if (bookingStatus === 'confirmed') {
    return 'Da xac nhan';
  }

  if (bookingStatus === 'holding') {
    return 'Dang giu tam';
  }

  return 'Da huy';
};

const getStatusClassName = (bookingStatus: string, paymentStatus: string) => {
  if (paymentStatus === 'failed' || bookingStatus === 'cancelled') {
    return 'bg-[#ffdad6] text-[#ba1a1a]';
  }

  if (bookingStatus === 'confirmed') {
    return 'bg-[#eaf7df] text-primary';
  }

  return 'bg-[#fff4d8] text-[#7a5600]';
};

export const BookingDetail = () => {
  const { id } = useParams();
  const booking = getBookingById(id);
  const courtAmount = booking.pricePerHour * booking.durationHours;
  const statusLabel = getStatusLabel(booking.bookingStatus, booking.paymentStatus);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-on-surface">
      <header className="border-b border-outline-variant bg-primary text-white">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 md:px-margin-desktop">
          <Link className="text-[24px] font-bold tracking-tight" to="/">
            Picklink
          </Link>
          <span className="rounded-lg bg-white/14 px-3 py-2 text-[13px] font-bold">Chi tiet don dat san</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
        <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/book-court">
          <ArrowLeft className="h-4 w-4" />
          Quay lai tim san
        </Link>

        <section className="mt-6 rounded-lg border border-outline-variant bg-white p-6 shadow-sm md:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <span className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold ${getStatusClassName(booking.bookingStatus, booking.paymentStatus)}`}>
                {statusLabel}
              </span>
              <h1 className="mt-4 text-[30px] font-bold leading-tight md:text-[42px]">{booking.courtName}</h1>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-on-surface-variant">{booking.address}</p>
            </div>

            <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4 lg:w-[320px]">
              <p className="text-[12px] font-bold uppercase text-on-surface-variant">Ma dat san</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="break-all text-[20px] font-bold text-primary">{booking.code}</p>
                <button aria-label="Sao chep ma dat san" className="rounded-lg p-2 text-primary hover:bg-primary/10" type="button">
                  <Copy className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-3 text-[12px] font-medium text-on-surface-variant">
                Tao luc {formatBookingDateTime(booking.createdAt)}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            {[
              { icon: CalendarDays, label: 'Ngay choi', value: formatBookingDate(booking.date) },
              { icon: Clock, label: 'Khung gio', value: `${booking.startTime} - ${booking.endTime}` },
              { icon: MapPin, label: 'San con', value: booking.subCourt },
              { icon: CreditCard, label: 'Thanh toan', value: booking.paymentMethod },
            ].map((item) => (
              <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4" key={item.label}>
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-[12px] font-bold uppercase text-on-surface-variant">{item.label}</p>
                <p className="mt-1 text-[15px] font-bold leading-6">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="text-[22px] font-bold">Tien trinh don</h2>
              <div className="mt-5 space-y-4">
                {booking.timeline.map((step, index) => (
                  <div className="flex gap-3" key={step.label}>
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${getTimelineClassName(step.status)}`}>
                      {step.status === 'failed' ? <XCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[15px] font-bold">{step.label}</p>
                        <span className="text-[12px] font-bold text-on-surface-variant">Buoc {index + 1}</span>
                      </div>
                      <p className="mt-1 text-[13px] leading-5 text-on-surface-variant">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="text-[22px] font-bold">Thong tin nguoi dat</h2>
              <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-outline-variant p-4">
                  <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                    <UserRound className="h-4 w-4 text-primary" />
                    Ho ten
                  </p>
                  <p className="mt-2 text-[16px] font-bold">{booking.customerName}</p>
                </div>
                <div className="rounded-lg border border-outline-variant p-4">
                  <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                    <Phone className="h-4 w-4 text-primary" />
                    So dien thoai
                  </p>
                  <p className="mt-2 text-[16px] font-bold">{booking.customerPhone}</p>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-[#84c33e]/40 bg-[#f2f9eb] p-5">
              <h2 className="flex items-center gap-2 text-[18px] font-bold">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Ghi chu tu san
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">{booking.note}</p>
            </section>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <ReceiptText className="h-5 w-5 text-primary" />
                Chi phi
              </h2>
              <div className="mt-5 space-y-3 text-[14px]">
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-on-surface-variant">{formatBookingCurrency(booking.pricePerHour)} x {booking.durationHours}h</span>
                  <span className="font-bold">{formatBookingCurrency(courtAmount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-on-surface-variant">Phi dich vu</span>
                  <span className="font-bold">{formatBookingCurrency(booking.serviceFee)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-outline-variant pt-3">
                  <span className="font-bold text-on-surface-variant">Tong thanh toan</span>
                  <span className="text-[24px] font-bold text-primary">{formatBookingCurrency(booking.totalAmount)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="text-[20px] font-bold">Hanh dong</h2>
              <div className="mt-5 space-y-3">
                <Link
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                  to={`/court/${booking.courtId}/schedule`}
                >
                  <RefreshCcw className="h-5 w-5" />
                  Doi lich
                </Link>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#ba1a1a] px-4 py-3 text-[14px] font-bold text-[#ba1a1a] hover:bg-[#ffdad6]/40"
                  type="button"
                >
                  <XCircle className="h-5 w-5" />
                  Huy dat san
                </button>
              </div>
            </section>

            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[18px] font-bold">
                <AlertCircle className="h-5 w-5 text-primary" />
                Ho tro
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">
                Lien he chu san qua {booking.ownerPhone} neu ban can doi thong tin check-in hoac bao den tre.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};
