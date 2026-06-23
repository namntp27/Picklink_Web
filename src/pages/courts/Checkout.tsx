import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, Clipboard, Clock, Loader2, MapPin, ReceiptText, ShieldCheck, Upload } from 'lucide-react';
import { cancelBookingHolding, getBookingHolding, type BookingHolding } from '../../api/booking';
import { ApiError } from '../../api/client';
import { submitBankTransfer } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const dateText = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date(value));
const timeText = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const statusText: Record<string, string> = {
  Pending: 'Chờ bạn chuyển khoản', WaitingForConfirmation: 'Đang chờ chủ sân xác nhận', Paid: 'Đã thanh toán', Expired: 'Đã hết hạn', Cancelled: 'Đã hủy',
};
const MAX_RECEIPT_SOURCE_BYTES = 12 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const utcTimestamp = (value: string) => {
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`;
  return new Date(normalized).getTime();
};

export const Checkout = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const bookingId = Number(params.get('bookingId'));
  const { token } = useAuth();
  const navigationBooking = (location.state as { booking?: BookingHolding } | null)?.booking;
  const initialBooking = navigationBooking?.bookingId === bookingId ? navigationBooking : null;
  const [booking, setBooking] = useState<BookingHolding | null>(initialBooking);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const loadBooking = async (silent = false) => {
    if (!token || !Number.isInteger(bookingId)) { setError('Booking không hợp lệ.'); return; }
    try {
      setBooking(await getBookingHolding(token, bookingId));
      if (!silent) setError('');
    } catch (requestError) {
      if (!silent) setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải booking.');
    }
  };

  useEffect(() => {
    if (initialBooking) return;
    void loadBooking();
  }, [bookingId, token]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => {
    if (!receipt) { setReceiptPreview(''); return; }
    if (!ALLOWED_RECEIPT_TYPES.has(receipt.type)) {
      setReceipt(null);
      setError('Biên lai phải là ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    if (receipt.size > MAX_RECEIPT_SOURCE_BYTES) {
      setReceipt(null);
      setError(`Ảnh biên lai gốc vượt quá 12 MB (${(receipt.size / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    setError('');
    const previewUrl = URL.createObjectURL(receipt);
    setReceiptPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [receipt]);
  usePaymentRealtime((event) => {
    if (!isSubmitting && event.bookingId === bookingId) void loadBooking(true);
  });
  useScheduleRealtime((event) => {
    if (!isSubmitting && booking && event.venueId === booking.venueId && event.courtId === booking.courtId) void loadBooking(true);
  });

  const remainingSeconds = useMemo(() => booking?.holdExpiresAt
    ? Math.max(0, Math.floor((utcTimestamp(booking.holdExpiresAt) - now) / 1000)) : 0, [booking?.holdExpiresAt, now]);
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const transfer = booking?.bankTransfer;

  const copyContent = async () => {
    if (!transfer?.transferContent) return;
    await navigator.clipboard.writeText(transfer.transferContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const submit = async () => {
    if (!token) { setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); return; }
    if (booking.status !== 'Holding') { setError(`Booking đang ở trạng thái ${booking.status}, không thể gửi thanh toán.`); return; }
    if (booking.paymentStatus !== 'Pending') { setError(`Thanh toán đang ở trạng thái ${booking.paymentStatus}.`); return; }
    if (remainingSeconds <= 0) { setError('Thời gian giữ chỗ đã hết. Vui lòng chọn lại khung giờ.'); return; }
    if (!transfer?.qrImageUrl) { setError('Sân chưa cấu hình tài khoản nhận chuyển khoản.'); return; }
    if (!receipt) { setError('Vui lòng chọn ảnh biên lai trước khi xác nhận đã chuyển khoản.'); return; }
    setIsSubmitting(true); setError('');
    try {
      const updatedPayment = await submitBankTransfer(token, bookingId, receipt);
      setBooking((current) => current ? {
        ...current,
        paymentStatus: updatedPayment.paymentStatus,
        bankTransfer: updatedPayment,
      } : current);
      setReceipt(null);
    }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể gửi xác nhận chuyển khoản.'); }
    finally { setIsSubmitting(false); }
  };

  if (!booking) return <div className="flex min-h-[70vh] items-center justify-center bg-surface-container-low"><div className="text-center">{error ? <p className="font-bold text-red-700">{error}</p> : <><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><p className="mt-3 font-bold">Đang tải thông tin chuyển khoản...</p></>}</div></div>;

  const status = booking.paymentStatus;
  const isPaid = status === 'Paid';
  const isWaiting = status === 'WaitingForConfirmation';
  const scheduleDate = params.get('date') ?? booking.startTime.slice(0, 10);
  const schedulePath = `/court/${booking.venueId}/schedule?date=${encodeURIComponent(scheduleDate)}`;

  const returnToSchedule = async () => {
    if (!token) { navigate(schedulePath); return; }
    if (booking.status !== 'Holding' || booking.paymentStatus !== 'Pending') {
      navigate(schedulePath);
      return;
    }

    setIsReturning(true);
    setError('');
    try {
      await cancelBookingHolding(token, booking.bookingId);
      navigate(schedulePath, { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể giải phóng khung giờ đang giữ.');
      setIsReturning(false);
    }
  };

  return <div className="min-h-screen bg-surface-container-low py-8 text-on-surface"><div className="mx-auto max-w-6xl space-y-5 px-4">
    <button className="inline-flex items-center gap-2 text-[14px] font-bold text-primary disabled:opacity-60" disabled={isReturning} onClick={() => void returnToSchedule()} type="button">{isReturning ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeft className="h-4 w-4" />} {isReturning ? 'Đang giải phóng khung giờ...' : booking.status === 'Holding' && booking.paymentStatus === 'Pending' ? 'Quay lại và chọn giờ khác' : 'Quay lại lịch sân'}</button>
    <div className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 text-white ${isPaid ? 'bg-emerald-700' : remainingSeconds > 0 && booking.status === 'Holding' ? 'bg-primary' : 'bg-red-700'}`}>
      <div><p className="text-[13px] font-bold uppercase tracking-wider">{statusText[status] ?? status}</p><p className="mt-1 text-[14px] text-white/80">Mã booking {booking.bookingCode}</p></div>
      <div className="text-right"><p className="text-[12px] font-bold text-white/75">Thời gian giữ chỗ</p><p className="font-mono text-[30px] font-bold">{booking.status === 'Holding' ? countdown : '--:--'}</p></div>
    </div>
    {error && <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-[14px] font-medium text-red-700"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
    {transfer?.rejectionReason && status === 'Pending' && <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-[14px] text-amber-900"><strong>Biên lai trước chưa được chấp nhận:</strong> {transfer.rejectionReason}. Bạn có thể kiểm tra và gửi lại biên lai mới.</div>}

    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="space-y-5 rounded-2xl border border-outline-variant bg-white p-6 shadow-sm">
        {isPaid ? <div className="py-10 text-center"><CheckCircle2 className="mx-auto h-16 w-16 text-emerald-600" /><h1 className="mt-4 text-[28px] font-bold">Thanh toán đã được xác nhận</h1><p className="mt-2 text-on-surface-variant">Booking đã chuyển sang Confirmed và sân được giữ cho bạn.</p><button className="mt-6 rounded-xl bg-primary px-6 py-3 font-bold text-white" onClick={() => navigate(`/bookings/${booking.bookingId}`)} type="button">Xem chi tiết booking</button></div>
          : isWaiting ? <div className="py-10 text-center"><Loader2 className="mx-auto h-14 w-14 animate-spin text-primary" /><h1 className="mt-5 text-[26px] font-bold">Đang đối soát giao dịch</h1><p className="mx-auto mt-2 max-w-lg text-[14px] leading-6 text-on-surface-variant">Biên lai đã được gửi. Chủ sân hoặc nhân viên sẽ kiểm tra giao dịch. Trang tự cập nhật mỗi 5 giây.</p>{transfer?.receiptImageUrl && <img alt="Biên lai đã gửi" className="mx-auto mt-6 max-h-72 rounded-xl border object-contain" src={transfer.receiptImageUrl} />}</div>
          : transfer?.qrImageUrl ? <>
            <div className="text-center"><p className="text-[13px] font-bold uppercase tracking-wide text-primary">Quét QR bằng ứng dụng ngân hàng</p><img alt={`QR chuyển khoản ${booking.bookingCode}`} className="mx-auto mt-3 w-full max-w-[340px] rounded-xl border border-outline-variant" src={transfer.qrImageUrl} /><p className="mt-2 text-[12px] text-on-surface-variant">QR đã điền sẵn đúng số tiền và nội dung chuyển khoản.</p></div>
            <div className="grid gap-3 sm:grid-cols-2">{[
              ['Ngân hàng nhận', transfer.bankName], ['Tên chủ tài khoản', transfer.bankAccountName], ['Số tài khoản', transfer.bankAccountNumber], ['Số tiền', currency.format(booking.totalAmount)],
            ].map(([label, value]) => <div className="rounded-xl bg-surface-container-low p-4" key={label}><p className="text-[11px] font-bold uppercase text-on-surface-variant">{label}</p><p className="mt-1 break-words text-[15px] font-bold">{value}</p></div>)}</div>
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-4"><p className="text-[12px] font-bold uppercase text-primary">Nội dung chuyển khoản bắt buộc</p><div className="mt-2 flex items-center justify-between gap-3"><code className="text-[20px] font-bold">{transfer.transferContent}</code><button className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[13px] font-bold text-white" onClick={() => void copyContent()} type="button">{copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{copied ? 'Đã sao chép' : 'Sao chép'}</button></div></div>
            <label className="block cursor-pointer rounded-xl border-2 border-dashed border-outline-variant p-5 text-center hover:border-primary hover:bg-primary/5"><Upload className="mx-auto h-7 w-7 text-primary" /><span className="mt-2 block text-[14px] font-bold">{receipt ? receipt.name : 'Tải ảnh biên lai chuyển khoản'}</span><span className="mt-1 block text-[12px] text-on-surface-variant">JPG, PNG hoặc WEBP · tự nén trước khi gửi</span><input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" /></label>
            {receiptPreview && <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="mb-2 text-center text-[12px] font-bold text-primary">Ảnh biên lai đã chọn</p><img alt="Xem trước biên lai" className="mx-auto max-h-64 rounded-lg border bg-white object-contain" src={receiptPreview} /></div>}
            <button className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 text-[17px] font-bold text-white disabled:cursor-wait disabled:opacity-60" disabled={isSubmitting} onClick={() => void submit()} type="button">{isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShieldCheck className="h-5 w-5" />}{isSubmitting ? 'Đang tối ưu và gửi biên lai...' : 'Tôi đã chuyển khoản'}</button>
          </> : <div className="py-12 text-center"><AlertCircle className="mx-auto h-14 w-14 text-amber-600" /><h1 className="mt-4 text-[24px] font-bold">Sân chưa cấu hình tài khoản nhận tiền</h1><p className="mt-2 text-on-surface-variant">Vui lòng liên hệ chủ sân hoặc chọn khung giờ khác.</p></div>}
      </section>

      <aside className="h-fit rounded-2xl border border-outline-variant bg-white p-6 shadow-sm lg:sticky lg:top-24">
        <h2 className="flex items-center gap-2 text-[20px] font-bold"><ReceiptText className="h-5 w-5 text-primary" /> Thông tin đặt sân</h2>
        <div className="mt-5 space-y-4 text-[13px]"><div className="flex gap-3"><Building2 className="h-5 w-5 shrink-0 text-primary" /><div><strong>{booking.venueName}</strong><p className="mt-1 text-on-surface-variant">Sân {booking.courtNumber}</p></div></div><div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span>{booking.address}</span></div><div className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-primary" /><div><strong>{dateText(booking.startTime)}</strong><p className="mt-1 text-on-surface-variant">{timeText(booking.startTime)}–{timeText(booking.endTime)} · {booking.durationHours} giờ</p></div></div></div>
        <div className="my-5 border-t border-dashed border-outline-variant" /><div className="space-y-3 text-[14px]"><div className="flex justify-between"><span>Đơn giá</span><strong>{currency.format(booking.hourlyPrice)}/giờ</strong></div><div className="flex justify-between"><span>Tiền sân</span><strong>{currency.format(booking.courtAmount)}</strong></div></div><div className="mt-5 flex items-center justify-between rounded-xl bg-primary/10 p-4"><strong>Tổng thanh toán</strong><strong className="text-[23px] text-primary">{currency.format(booking.totalAmount)}</strong></div>
      </aside>
    </div>
  </div></div>;
};
