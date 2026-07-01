import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  Clock,
  CreditCard,
  Headset,
  MapPin,
  RefreshCcw,
  ShieldAlert,
} from 'lucide-react';
import {
  failedBooking,
  formatBookingCurrency,
  formatBookingDate,
  formatBookingDateTime,
} from '../../data/bookings';

export const BookingFail = () => {
  const booking = failedBooking;
  const shouldReduceMotion = useReducedMotion();
  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 12 };

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-on-surface">
      <header className="border-b border-outline-variant/50 bg-surface-container-lowest">
        <div className="mx-auto flex min-h-16 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            className="rounded-md text-[24px] font-extrabold tracking-[-0.035em] text-primary [text-shadow:0_0_10px_rgba(152,217,81,0.38)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70"
            to="/"
          >
            Picklink
          </Link>
          <span className="rounded-lg border border-error/25 bg-error-container px-3 py-2 text-[13px] font-bold text-error">
            Thanh toán chưa hoàn tất
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 md:py-10">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="overflow-hidden rounded-2xl border border-error/25 bg-surface-container-lowest shadow-[0_16px_40px_rgba(25,29,20,0.08)]"
            initial={revealInitial}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="hero-gradient relative px-6 py-8 text-on-primary md:px-8">
              <div aria-hidden="true" className="pointer-events-none absolute inset-0">
                <div className="absolute inset-0 bg-black/50" />
                <div className="absolute inset-0 opacity-15">
                  <div className="absolute inset-x-0 top-1/2 h-px bg-on-primary" />
                  <div className="absolute inset-y-0 left-1/3 w-px bg-on-primary" />
                  <div className="absolute inset-y-0 right-1/3 w-px bg-on-primary" />
                </div>
              </div>
              <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-start">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-error-container text-error">
                  <AlertTriangle className="h-9 w-9" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-primary-fixed">Giao dịch bị gián đoạn</p>
                  <h1 className="mt-3 text-[clamp(2rem,4vw,3.1rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
                    Chưa thể xác nhận{' '}
                    <span className="inline-block text-[1.12em] text-primary-fixed [text-shadow:0_0_8px_rgba(152,217,81,0.65),0_0_18px_rgba(152,217,81,0.38)]">
                      giữ sân
                    </span>
                  </h1>
                  <p className="mt-4 max-w-2xl text-[15px] font-medium leading-7 text-on-primary/88">
                    Hệ thống chưa nhận được xác nhận thanh toán. Khung giờ vẫn đang được giữ tạm, bạn có thể thử lại trước khi hết thời gian giữ chỗ.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-primary-container bg-primary-container px-5 py-3 text-[14px] font-semibold text-on-primary-container shadow-[0_5px_14px_rgba(152,217,81,0.18)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-primary-fixed-dim hover:bg-primary-fixed-dim hover:shadow-[0_7px_16px_rgba(152,217,81,0.24)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
                  to="/checkout"
                >
                  Thử thanh toán lại
                  <RefreshCcw className="h-5 w-5" />
                </Link>
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-5 py-3 text-[14px] font-semibold text-on-surface transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-primary-container hover:bg-surface-container-low hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
                  to="/book-court"
                >
                  Chọn khung giờ khác
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>

              <div className="mt-8 rounded-xl border border-error/25 bg-error-container/55 p-5">
                <h2 className="flex items-center gap-2 text-[20px] font-bold text-error">
                  <ShieldAlert className="h-5 w-5" />
                  Nguyên nhân thường gặp
                </h2>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {[
                    'Ngân hàng hoặc ví điện tử chưa trả về kết quả.',
                    'Mã QR đã hết hiệu lực trước khi thanh toán.',
                    'Khung giờ bị hủy giữ tạm do quá thời gian.',
                  ].map((reason) => (
                    <p className="rounded-lg border border-error/20 bg-surface-container-lowest p-4 text-[13px] font-medium leading-6 text-on-surface-variant" key={reason}>
                      {reason}
                    </p>
                  ))}
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                {[
                  { icon: CalendarDays, label: 'Ngày chơi', value: formatBookingDate(booking.date) },
                  { icon: Clock, label: 'Khung giờ', value: `${booking.startTime} - ${booking.endTime}` },
                  { icon: MapPin, label: 'Sân con', value: booking.subCourt },
                ].map((item) => (
                  <div className="min-w-0 rounded-xl border border-outline-variant bg-surface-container-low p-4" key={item.label}>
                    <item.icon className="h-5 w-5 text-primary" />
                    <p className="mt-3 text-[12px] font-bold uppercase tracking-[0.08em] text-on-surface-variant">{item.label}</p>
                    <p className="mt-1 break-words text-[15px] font-bold leading-6">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
            <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_12px_30px_rgba(25,29,20,0.06)]">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <CreditCard className="h-5 w-5 text-primary" />
                Đơn đang giữ tạm
              </h2>
              <div className="mt-5 space-y-3 text-[14px]">
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-on-surface-variant">Mã đơn</span>
                  <span className="break-all text-right font-bold">{booking.code}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-on-surface-variant">Tổng tiền</span>
                  <span className="font-bold">{formatBookingCurrency(booking.totalAmount)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-on-surface-variant">Giữ đến</span>
                  <span className="text-right font-bold">{formatBookingDateTime(booking.holdExpiresAt)}</span>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_12px_30px_rgba(25,29,20,0.06)]">
              <h2 className="flex items-center gap-2 text-[18px] font-bold">
                <Headset className="h-5 w-5 text-primary" />
                Cần hỗ trợ?
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">
                Gọi sân qua số {booking.ownerPhone} hoặc liên hệ hỗ trợ Picklink nếu tiền đã bị trừ nhưng đơn chưa được xác nhận.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};
