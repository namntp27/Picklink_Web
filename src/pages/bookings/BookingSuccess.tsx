import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarDays, CheckCircle2, Clock, Home, Loader2, MapPin, ReceiptText } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBookingHolding, type BookingHolding } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const date = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date(value));

export const BookingSuccess = () => {
  const [params] = useSearchParams();
  const bookingId = Number(params.get('bookingId'));
  const { token } = useAuth();
  const [booking, setBooking] = useState<BookingHolding | null>(null);
  const [error, setError] = useState('');
  const shouldReduceMotion = useReducedMotion();

  const load = () => {
    if (token && Number.isInteger(bookingId)) {
      void getBookingHolding(token, bookingId)
        .then(setBooking)
        .catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải booking.'));
    }
  };

  useEffect(load, [bookingId, token]);
  usePaymentRealtime((event) => {
    if (event.bookingId !== bookingId) return;
    setBooking((current) => current ? {
      ...current,
      paymentStatus: event.paymentStatus,
      status: event.paymentStatus === 'Paid' ? 'Confirmed' : current.status,
    } : current);
    load();
  });
  useScheduleRealtime((event) => {
    if (booking && event.venueId === booking.venueId && event.courtId === booking.courtId) load();
  });

  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 12 };

  if (!booking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-on-surface">
        <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-[0_16px_40px_rgba(25,29,20,0.08)]">
          {error ? (
            <>
              <ReceiptText className="mx-auto h-10 w-10 text-error" />
              <p className="mt-3 text-[14px] font-bold text-error">{error}</p>
            </>
          ) : (
            <>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
              <p className="mt-3 text-[14px] font-bold text-on-surface">Đang tải booking...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-on-surface">
      <section className="hero-gradient relative overflow-hidden px-4 py-10 text-on-primary sm:px-6 md:py-14">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute inset-x-0 top-1/2 h-px bg-on-primary" />
            <div className="absolute inset-y-0 left-1/4 w-px bg-on-primary/65" />
            <div className="absolute inset-y-0 right-1/4 w-px bg-on-primary/65" />
            <div className="absolute left-[12%] right-[12%] top-[20%] h-px bg-on-primary/55" />
            <div className="absolute bottom-[20%] left-[12%] right-[12%] h-px bg-on-primary/55" />
          </div>
          <div className="absolute inset-0 bg-black/50" />
        </div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto flex max-w-[1280px] flex-col gap-6 md:flex-row md:items-end md:justify-between"
          initial={revealInitial}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-on-primary/20 bg-on-primary/12 px-4 py-2 text-[13px] font-bold">
              <CheckCircle2 className="h-4 w-4 text-primary-fixed" />
              Thanh toán đã xác nhận
            </p>
            <h1 className="mt-5 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Đặt sân{' '}
              <span className="inline-block text-[1.12em] text-primary-fixed [text-shadow:0_0_8px_rgba(152,217,81,0.65),0_0_18px_rgba(152,217,81,0.38)]">
                thành công
              </span>
            </h1>
            <p className="mt-4 max-w-[58ch] text-[15px] font-medium leading-7 text-on-primary/88 md:text-[17px]">
              Booking đã được xác nhận và các slot đã được khóa chính thức.
            </p>
          </div>
          <div className="rounded-2xl border border-on-primary/15 bg-on-primary/12 p-4 backdrop-blur-sm">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-on-primary/70">Mã booking</p>
            <p className="mt-1 break-all font-mono text-[22px] font-extrabold text-primary-fixed">{booking.bookingCode}</p>
          </div>
        </motion.div>
      </section>

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:py-10">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_16px_40px_rgba(25,29,20,0.08)] md:p-7"
          data-motion-managed
          initial={revealInitial}
          transition={{
            delay: shouldReduceMotion ? 0 : 0.06,
            duration: shouldReduceMotion ? 0.01 : 0.35,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          <div className="grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: MapPin, label: 'Cụm sân', value: `${booking.venueName} · Sân ${booking.courtNumber}` },
              { icon: CalendarDays, label: 'Ngày chơi', value: date(booking.startTime) },
              { icon: Clock, label: 'Khung giờ', value: `${booking.startTime.slice(11, 16)} - ${booking.endTime.slice(11, 16)} (${booking.durationHours} giờ)` },
              { icon: CheckCircle2, label: 'Tổng tiền sân', value: currency.format(booking.totalAmount) },
            ].map((item) => (
              <div className="min-w-0 rounded-xl border border-outline-variant bg-surface-container-low p-4" key={item.label}>
                <item.icon className="h-5 w-5 text-primary" />
                <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">{item.label}</p>
                <p className="mt-1 break-words text-[14px] font-bold leading-6">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-3 text-[14px] font-semibold text-on-surface transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-primary-container hover:bg-surface-container-low hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
              to="/my-bookings"
            >
              Booking của tôi
            </Link>
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary-container bg-primary-container px-5 py-3 text-[14px] font-semibold text-on-primary-container shadow-[0_5px_14px_rgba(152,217,81,0.18)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-primary-fixed-dim hover:bg-primary-fixed-dim hover:shadow-[0_7px_16px_rgba(152,217,81,0.24)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
              to="/"
            >
              <Home className="h-4 w-4" />
              Trang chủ
            </Link>
          </div>
        </motion.section>
      </main>
    </div>
  );
};
