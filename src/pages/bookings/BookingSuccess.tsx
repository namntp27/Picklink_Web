import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, Clock, Home, MapPin } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { getBookingHolding, type BookingHolding } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const date = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date(value));

export const BookingSuccess = () => {
  const [params] = useSearchParams();
  const bookingId = Number(params.get('bookingId'));
  const { token } = useAuth();
  const [booking, setBooking] = useState<BookingHolding | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { if (token && Number.isInteger(bookingId)) getBookingHolding(token, bookingId).then(setBooking).catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải booking.')); }, [bookingId, token]);
  if (!booking) return <div className="flex min-h-[70vh] items-center justify-center font-bold">{error || 'Đang tải booking...'}</div>;
  return <div className="min-h-screen bg-surface-container-low px-4 py-10"><div className="mx-auto max-w-2xl rounded-2xl border border-outline-variant bg-white p-7 text-center shadow-sm md:p-10"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /><h1 className="mt-4 text-[32px] font-bold">Đặt sân thành công</h1><p className="mt-2 text-[14px] text-on-surface-variant">Booking đã được xác nhận và các slot đã được khóa chính thức.</p><p className="mt-5 font-mono text-[20px] font-bold text-primary">{booking.bookingCode}</p><div className="mt-7 grid gap-3 text-left sm:grid-cols-2">{[
    { icon: MapPin, label: 'Cụm sân', value: `${booking.venueName} · Sân ${booking.courtNumber}` },
    { icon: CalendarDays, label: 'Ngày chơi', value: date(booking.startTime) },
    { icon: Clock, label: 'Khung giờ', value: `${booking.startTime.slice(11,16)}–${booking.endTime.slice(11,16)} (${booking.durationHours} giờ)` },
    { icon: CheckCircle2, label: 'Tổng tiền sân', value: currency.format(booking.totalAmount) },
  ].map((item) => <div className="rounded-xl bg-surface-container-low p-4" key={item.label}><item.icon className="h-5 w-5 text-primary" /><p className="mt-2 text-[11px] font-bold uppercase text-on-surface-variant">{item.label}</p><p className="mt-1 text-[14px] font-bold">{item.value}</p></div>)}</div><div className="mt-7 flex flex-wrap justify-center gap-3"><Link className="rounded-xl border border-outline-variant px-5 py-3 text-[14px] font-bold" to="/my-bookings">Booking của tôi</Link><Link className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-[14px] font-bold text-white" to="/"><Home className="h-4 w-4" />Trang chủ</Link></div></div></div>;
};
