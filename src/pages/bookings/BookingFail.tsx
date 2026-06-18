import React from 'react';
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

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-on-surface">
      <header className="border-b border-outline-variant bg-primary text-white">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 md:px-margin-desktop">
          <Link className="text-[24px] font-bold tracking-tight" to="/">
            Picklink
          </Link>
          <span className="rounded-lg bg-white/14 px-3 py-2 text-[13px] font-bold">Thanh toán chưa hoàn tất</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-[#f0c2c2] bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#ffdad6] text-[#ba1a1a]">
                <AlertTriangle className="h-9 w-9" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold uppercase text-[#ba1a1a]">Giao dịch bị gián đoạn</p>
                <h1 className="mt-2 text-[30px] font-bold leading-tight md:text-[42px]">
                  Chưa thể xác nhận giữ sân
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-on-surface-variant">
                  Hệ thống chưa nhận được xác nhận thanh toán. Khung giờ vẫn đang được giữ tạm, bạn có thể thử lại trước khi hết thời gian giữ chỗ.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                    to="/checkout"
                  >
                    Thử thanh toán lại
                    <RefreshCcw className="h-5 w-5" />
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-5 py-3 text-[14px] font-bold text-on-surface hover:bg-surface-container-low"
                    to="/book-court"
                  >
                    Chọn khung giờ khác
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg border border-[#f0c2c2] bg-[#fff8f7] p-5">
              <h2 className="flex items-center gap-2 text-[20px] font-bold text-[#7a271a]">
                <ShieldAlert className="h-5 w-5" />
                Nguyên nhân thường gặp
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                {[
                  'Ngân hàng hoặc ví điện tử chưa trả về kết quả.',
                  'Mã QR đã hết hiệu lực trước khi thanh toán.',
                  'Khung giờ bị hủy giữ tạm do quá thời gian.',
                ].map((reason) => (
                  <p className="rounded-lg border border-[#f0c2c2] bg-white p-4 text-[13px] font-medium leading-6 text-on-surface-variant" key={reason}>
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
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4" key={item.label}>
                  <item.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-[12px] font-bold uppercase text-on-surface-variant">{item.label}</p>
                  <p className="mt-1 text-[15px] font-bold leading-6">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <CreditCard className="h-5 w-5 text-primary" />
                Đơn đang giữ tạm
              </h2>
              <div className="mt-5 space-y-3 text-[14px]">
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-on-surface-variant">Mã đơn</span>
                  <span className="text-right font-bold">{booking.code}</span>
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

            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
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
