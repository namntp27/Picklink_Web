import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Banknote, Building2, Clock, CreditCard, Loader2, MapPin, ShieldCheck, WalletCards } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { completeBookingPayment, getBookingHolding, type BookingHolding } from '../../api/booking';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const time = (value: string) => value.slice(11, 16);

export const Checkout = () => {
  const [params] = useSearchParams();
  const bookingId = Number(params.get('bookingId'));
  const { token } = useAuth();
  const navigate = useNavigate();
  const [booking, setBooking] = useState<BookingHolding | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Wallet' | 'BankTransfer' | 'AtCourt'>('Wallet');
  const [agreed, setAgreed] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !Number.isInteger(bookingId)) { setError('Booking không hợp lệ.'); return; }
    getBookingHolding(token, bookingId).then(setBooking).catch((requestError) => setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải booking.'));
  }, [bookingId, token]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);

  const remainingSeconds = useMemo(() => booking?.holdExpiresAt ? Math.max(0, Math.floor((new Date(booking.holdExpiresAt).getTime() - now) / 1000)) : 0, [booking?.holdExpiresAt, now]);
  const countdown = `${Math.floor(remainingSeconds / 60).toString().padStart(2, '0')}:${(remainingSeconds % 60).toString().padStart(2, '0')}`;
  const canPay = booking?.status === 'Holding' && remainingSeconds > 0 && agreed && !isPaying;

  const pay = async () => {
    if (!token || !booking || !canPay) return;
    setIsPaying(true); setError('');
    try { const result = await completeBookingPayment(token, booking.bookingId, paymentMethod); navigate(`/checkout/success?bookingId=${result.bookingId}`, { replace: true }); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Thanh toán không thành công.'); }
    finally { setIsPaying(false); }
  };

  if (!booking) return <div className="flex min-h-[70vh] items-center justify-center bg-surface-container-low"><div className="text-center">{error ? <p className="font-bold text-red-700">{error}</p> : <><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><p className="mt-3 font-bold">Đang tải thông tin giữ chỗ...</p></>}</div></div>;

  return <div className="min-h-screen bg-surface-container-low px-4 py-7 md:px-10"><div className="mx-auto max-w-[1100px] space-y-5">
    <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary" to={`/court/${booking.venueId}/schedule`}><ArrowLeft className="h-4 w-4" /> Quay lại lịch sân</Link>
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 text-white ${remainingSeconds > 0 && booking.status === 'Holding' ? 'bg-primary' : 'bg-red-700'}`}><div><p className="text-[13px] font-bold uppercase tracking-wider">{booking.status === 'Holding' ? 'Slot đang được khóa tạm' : `Booking ${booking.status}`}</p><p className="mt-1 text-[14px] text-white/80">Mã {booking.bookingCode}</p></div><div className="text-right"><p className="text-[12px] font-bold text-white/75">Thời gian còn lại</p><p className="font-mono text-[30px] font-bold">{booking.status === 'Holding' ? countdown : '--:--'}</p></div></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] font-bold text-red-700">{error}</div>}
    <div className="grid gap-5 lg:grid-cols-[1fr_390px]"><section className="space-y-5 rounded-2xl border border-outline-variant bg-white p-6 shadow-sm"><div><h1 className="text-[28px] font-bold">Chọn phương thức thanh toán</h1><p className="mt-1 text-[13px] text-on-surface-variant">Backend đã kiểm tra slot và chốt giá thuê sân.</p></div><div className="space-y-3">{[
      { value: 'Wallet' as const, label: 'Ví Picklink', note: 'Thanh toán bằng số dư ví', icon: WalletCards },
      { value: 'BankTransfer' as const, label: 'Chuyển khoản ngân hàng', note: 'Thanh toán qua ngân hàng liên kết', icon: CreditCard },
      { value: 'AtCourt' as const, label: 'Thanh toán tại sân', note: 'Xác nhận booking và thanh toán khi đến', icon: Banknote },
    ].map((method) => <button className={`flex w-full items-center gap-4 rounded-xl border p-4 text-left ${paymentMethod === method.value ? 'border-primary bg-primary/5' : 'border-outline-variant'}`} key={method.value} onClick={() => setPaymentMethod(method.value)} type="button"><span className={`rounded-lg p-2 ${paymentMethod === method.value ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant'}`}><method.icon className="h-6 w-6" /></span><span className="flex-1"><strong className="block text-[15px]">{method.label}</strong><small className="text-[12px] text-on-surface-variant">{method.note}</small></span><i className={`h-5 w-5 rounded-full border-2 ${paymentMethod === method.value ? 'border-[6px] border-primary' : 'border-outline-variant'}`} /></button>)}</div><label className="flex items-start gap-3 rounded-xl bg-surface-container-low p-4 text-[13px]"><input checked={agreed} className="mt-0.5 h-5 w-5 accent-primary" onChange={(event) => setAgreed(event.target.checked)} type="checkbox" /><span>Tôi xác nhận thông tin sân và thời gian đã chọn là chính xác.</span></label><button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-[17px] font-bold text-white disabled:opacity-50" disabled={!canPay} onClick={() => void pay()} type="button">{isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}{isPaying ? 'Đang xử lý...' : `Thanh toán ${currency.format(booking.totalAmount)}`}</button></section>
      <aside className="h-fit rounded-2xl border border-outline-variant bg-white p-6 shadow-sm lg:sticky lg:top-24"><h2 className="text-[20px] font-bold">Thông tin đặt sân</h2><div className="mt-5 space-y-4 text-[13px]"><div className="flex gap-3"><Building2 className="h-5 w-5 shrink-0 text-primary" /><div><strong>{booking.venueName}</strong><p className="mt-1 text-on-surface-variant">Sân {booking.courtNumber}</p></div></div><div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span>{booking.address}</span></div><div className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-primary" /><div><strong>{dateTime(booking.startTime)}</strong><p className="mt-1 text-on-surface-variant">{time(booking.startTime)}–{time(booking.endTime)} · {booking.durationHours} giờ</p></div></div></div><div className="my-5 border-t border-dashed border-outline-variant" /><div className="space-y-3 text-[14px]"><div className="flex justify-between"><span>Đơn giá</span><strong>{currency.format(booking.hourlyPrice)}/giờ</strong></div><div className="flex justify-between"><span>Tiền sân ({booking.durationHours} giờ)</span><strong>{currency.format(booking.courtAmount)}</strong></div></div><div className="mt-5 flex items-center justify-between rounded-xl bg-primary/10 p-4"><strong>Tổng thanh toán</strong><strong className="text-[24px] text-primary">{currency.format(booking.totalAmount)}</strong></div><p className="mt-4 text-[11px] text-on-surface-variant">TotalAmount = HourlyPrice × Duration. Không có phí dịch vụ hoặc giảm giá.</p></aside></div>
  </div></div>;
};
