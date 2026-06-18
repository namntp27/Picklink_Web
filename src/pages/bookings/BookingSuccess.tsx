import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  MapPin,
  ReceiptText,
  ShieldCheck,
} from 'lucide-react';
import {
  formatBookingCurrency,
  formatBookingDate,
  formatBookingDateTime,
  sampleBooking,
} from '../../data/bookings';

export const BookingSuccess = () => {
  const booking = sampleBooking;

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-on-surface">
      <header className="border-b border-outline-variant bg-primary text-white">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-4 md:px-margin-desktop">
          <Link className="text-[24px] font-bold tracking-tight" to="/">
            Picklink
          </Link>
          <span className="rounded-lg bg-white/14 px-3 py-2 text-[13px] font-bold">Dat san thanh cong</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="rounded-lg border border-[#b7d9ad] bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#eaf7df] text-primary">
                <CheckCircle2 className="h-9 w-9" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-bold uppercase text-primary">Thanh toan da duoc xac nhan</p>
                <h1 className="mt-2 text-[30px] font-bold leading-tight md:text-[42px]">
                  San cua ban da duoc giu thanh cong
                </h1>
                <p className="mt-3 max-w-2xl text-[15px] leading-7 text-on-surface-variant">
                  Hay luu ma dat san va den truoc gio choi 10 phut de check-in. Thong tin chi tiet da duoc cap nhat trong don dat san.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                    to={`/bookings/${booking.id}`}
                  >
                    Xem chi tiet don
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-5 py-3 text-[14px] font-bold text-on-surface hover:bg-surface-container-low"
                    to="/book-court"
                  >
                    Dat san khac
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { icon: CalendarDays, label: 'Ngay choi', value: formatBookingDate(booking.date) },
                { icon: Clock, label: 'Khung gio', value: `${booking.startTime} - ${booking.endTime}` },
                { icon: MapPin, label: 'San con', value: booking.subCourt },
              ].map((item) => (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4" key={item.label}>
                  <item.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-[12px] font-bold uppercase text-on-surface-variant">{item.label}</p>
                  <p className="mt-1 text-[15px] font-bold leading-6">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-lg border border-outline-variant p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[13px] font-bold uppercase text-on-surface-variant">Ma dat san</p>
                  <p className="mt-1 break-all text-[26px] font-bold tracking-wide text-primary">{booking.code}</p>
                </div>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                  type="button"
                >
                  <Copy className="h-5 w-5" />
                  Sao chep ma
                </button>
              </div>
              <p className="mt-4 text-[13px] leading-6 text-on-surface-variant">
                Tao luc {formatBookingDateTime(booking.createdAt)}. Neu can ho tro, lien he san qua so {booking.ownerPhone}.
              </p>
            </div>
          </div>

          <aside className="space-y-5">
            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <ReceiptText className="h-5 w-5 text-primary" />
                Tom tat thanh toan
              </h2>
              <div className="mt-5 space-y-3 text-[14px]">
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-on-surface-variant">Tien san</span>
                  <span className="font-bold">{formatBookingCurrency(booking.pricePerHour * booking.durationHours)}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="font-bold text-on-surface-variant">Phi dich vu</span>
                  <span className="font-bold">{formatBookingCurrency(booking.serviceFee)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t border-outline-variant pt-3">
                  <span className="font-bold text-on-surface-variant">Tong cong</span>
                  <span className="text-[24px] font-bold text-primary">{formatBookingCurrency(booking.totalAmount)}</span>
                </div>
              </div>
              <button
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-on-surface hover:bg-surface-container-low"
                type="button"
              >
                <Download className="h-5 w-5" />
                Tai hoa don
              </button>
            </section>

            <section className="rounded-lg border border-[#84c33e]/40 bg-[#f2f9eb] p-5">
              <h2 className="flex items-center gap-2 text-[18px] font-bold">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Luu y check-in
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">
                Xuat trinh ma dat san cho le tan. San co the huy lich neu nguoi choi den tre hon 15 phut ma khong lien he truoc.
              </p>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};
