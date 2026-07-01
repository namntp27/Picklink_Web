import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, Clipboard, Clock, Loader2, MapPin, ReceiptText, ShieldCheck, Upload } from 'lucide-react';
import { cancelBookingHolding, getBookingHolding, type BookingHolding } from '../../api/booking';
import { ApiError } from '../../api/client';
import { submitBankTransfer } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { Button } from '../../components/ui/Button';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const dateText = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'full' }).format(new Date(value));
const timeText = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const statusText: Record<string, string> = {
  Pending: 'Chờ bạn chuyển khoản',
  WaitingForConfirmation: 'Đang chờ chủ sân xác nhận',
  Paid: 'Đã thanh toán',
  Expired: 'Đã hết hạn',
  Cancelled: 'Đã hủy',
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
  const shouldReduceMotion = useReducedMotion();

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
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể gửi xác nhận chuyển khoản.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!booking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4">
        <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-[0_16px_40px_rgba(25,29,20,0.08)]">
          {error ? (
            <p className="font-bold text-error">{error}</p>
          ) : (
            <>
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary motion-reduce:animate-none" />
              <p className="mt-3 font-bold">Đang tải thông tin chuyển khoản...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  const status = booking.paymentStatus;
  const isPaid = status === 'Paid';
  const isWaiting = status === 'WaitingForConfirmation';
  const scheduleDate = params.get('date') ?? booking.startTime.slice(0, 10);
  const schedulePath = `/court/${booking.venueId}/schedule?date=${encodeURIComponent(scheduleDate)}`;
  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 12 };

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

  return (
    <div className="min-h-dvh overflow-x-clip bg-background text-on-surface">
      <section className="hero-gradient relative overflow-hidden px-4 py-8 text-on-primary sm:px-6 md:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 opacity-15">
            <div className="absolute inset-x-0 top-1/2 h-px bg-on-primary" />
            <div className="absolute inset-y-0 left-1/4 w-px bg-on-primary" />
            <div className="absolute inset-y-0 right-1/4 w-px bg-on-primary" />
          </div>
        </div>
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10 mx-auto flex max-w-[1280px] flex-col gap-5 md:flex-row md:items-center md:justify-between"
          initial={revealInitial}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div>
            <button
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-on-primary/15 bg-on-primary/12 px-3 py-2 text-[14px] font-bold text-on-primary transition-[background-color,transform,opacity] duration-200 hover:-translate-y-px hover:bg-on-primary/18 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55"
              disabled={isReturning}
              onClick={() => void returnToSchedule()}
              type="button"
            >
              {isReturning ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <ArrowLeft className="h-4 w-4" />}
              {isReturning ? 'Đang giải phóng khung giờ...' : booking.status === 'Holding' && booking.paymentStatus === 'Pending' ? 'Quay lại và chọn giờ khác' : 'Quay lại lịch sân'}
            </button>
            <h1 className="mt-5 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Thanh toán{' '}
              <span className="inline-block text-[1.12em] text-primary-fixed [text-shadow:0_0_8px_rgba(152,217,81,0.55),0_0_18px_rgba(152,217,81,0.28)]">
                đặt sân
              </span>
            </h1>
            <p className="mt-3 max-w-[58ch] text-[15px] font-medium leading-7 text-on-primary/88">
              Mã booking {booking.bookingCode}
            </p>
          </div>
          <div className="rounded-2xl border border-on-primary/15 bg-on-primary/12 p-4 text-left backdrop-blur-sm md:text-right">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-on-primary/70">Thời gian giữ chỗ</p>
            <p className="font-mono text-[34px] font-extrabold text-primary-fixed">{booking.status === 'Holding' ? countdown : '--:--'}</p>
            <p className="mt-1 text-[13px] font-bold text-on-primary/82">{statusText[status] ?? status}</p>
          </div>
        </motion.div>
      </section>

      <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-8 sm:px-6 md:py-10">
        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-error/25 bg-error-container p-4 text-[14px] font-medium text-error" role="alert">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}
        {transfer?.rejectionReason && status === 'Pending' && (
          <div className="rounded-xl border border-outline-variant bg-surface-container-high p-4 text-[14px] text-on-surface">
            <strong>Biên lai trước chưa được chấp nhận:</strong> {transfer.rejectionReason}. Bạn có thể kiểm tra và gửi lại biên lai mới.
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5 rounded-2xl border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_16px_40px_rgba(25,29,20,0.08)] md:p-6"
            initial={revealInitial}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.06,
              duration: shouldReduceMotion ? 0.01 : 0.35,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            {isPaid ? (
              <div className="py-10 text-center">
                <CheckCircle2 className="mx-auto h-16 w-16 text-primary" />
                <h2 className="mt-4 text-[28px] font-extrabold">Thanh toán đã được xác nhận</h2>
                <p className="mt-2 text-on-surface-variant">Booking đã chuyển sang Confirmed và sân được giữ cho bạn.</p>
                <Button className="mt-6" onClick={() => navigate(`/bookings/${booking.bookingId}`)} type="button">
                  Xem chi tiết booking
                </Button>
              </div>
            ) : isWaiting ? (
              <div className="py-10 text-center">
                <Loader2 className="mx-auto h-14 w-14 animate-spin text-primary motion-reduce:animate-none" />
                <h2 className="mt-5 text-[26px] font-extrabold">Đang đối soát giao dịch</h2>
                <p className="mx-auto mt-2 max-w-lg text-[14px] leading-6 text-on-surface-variant">Biên lai đã được gửi. Chủ sân hoặc nhân viên sẽ kiểm tra giao dịch. Trang tự cập nhật mỗi 5 giây.</p>
                {transfer?.receiptImageUrl && <img alt="Biên lai đã gửi" className="mx-auto mt-6 max-h-72 rounded-xl border border-outline-variant object-contain" src={transfer.receiptImageUrl} />}
              </div>
            ) : transfer?.qrImageUrl ? (
              <>
                <div className="text-center">
                  <p className="text-[13px] font-bold uppercase tracking-wide text-primary">Quét QR bằng ứng dụng ngân hàng</p>
                  <img alt={`QR chuyển khoản ${booking.bookingCode}`} className="mx-auto mt-3 w-full max-w-[340px] rounded-xl border border-outline-variant" src={transfer.qrImageUrl} />
                  <p className="mt-2 text-[12px] text-on-surface-variant">QR đã điền sẵn đúng số tiền và nội dung chuyển khoản.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ['Ngân hàng nhận', transfer.bankName],
                    ['Tên chủ tài khoản', transfer.bankAccountName],
                    ['Số tài khoản', transfer.bankAccountNumber],
                    ['Số tiền', currency.format(booking.totalAmount)],
                  ].map(([label, value]) => <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4" key={label}><p className="text-[11px] font-bold uppercase text-on-surface-variant">{label}</p><p className="mt-1 break-words text-[15px] font-bold">{value}</p></div>)}
                </div>
                <div className="rounded-xl border-2 border-primary-container bg-surface-container-low p-4">
                  <p className="text-[12px] font-bold uppercase text-primary">Nội dung chuyển khoản bắt buộc</p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <code className="min-w-0 break-all text-[20px] font-bold">{transfer.transferContent}</code>
                    <Button onClick={() => void copyContent()} size="sm" type="button">
                      {copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                      {copied ? 'Đã sao chép' : 'Sao chép'}
                    </Button>
                  </div>
                </div>
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-outline-variant p-5 text-center transition-[border-color,background-color,transform] duration-200 hover:-translate-y-px hover:border-primary-container hover:bg-surface-container-low">
                  <Upload className="mx-auto h-7 w-7 text-primary" />
                  <span className="mt-2 block break-words text-[14px] font-bold">{receipt ? receipt.name : 'Tải ảnh biên lai chuyển khoản'}</span>
                  <span className="mt-1 block text-[12px] text-on-surface-variant">JPG, PNG hoặc WEBP · tự nén trước khi gửi</span>
                  <input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" />
                </label>
                {receiptPreview && <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3"><p className="mb-2 text-center text-[12px] font-bold text-primary">Ảnh biên lai đã chọn</p><img alt="Xem trước biên lai" className="mx-auto max-h-64 rounded-lg border border-outline-variant bg-surface-container-lowest object-contain" src={receiptPreview} /></div>}
                <Button aria-busy={isSubmitting} className="w-full" disabled={isSubmitting} onClick={() => void submit()} size="lg" type="button">
                  <ShieldCheck className="h-5 w-5" />
                  {isSubmitting ? 'Đang tối ưu và gửi biên lai...' : 'Tôi đã chuyển khoản'}
                </Button>
              </>
            ) : (
              <div className="py-12 text-center">
                <AlertCircle className="mx-auto h-14 w-14 text-error" />
                <h2 className="mt-4 text-[24px] font-extrabold">Sân chưa cấu hình tài khoản nhận tiền</h2>
                <p className="mt-2 text-on-surface-variant">Vui lòng liên hệ chủ sân hoặc chọn khung giờ khác.</p>
              </div>
            )}
          </motion.section>

          <aside className="h-fit rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-[0_12px_30px_rgba(25,29,20,0.06)] lg:sticky lg:top-6">
            <h2 className="flex items-center gap-2 text-[20px] font-extrabold"><ReceiptText className="h-5 w-5 text-primary" /> Thông tin đặt sân</h2>
            <div className="mt-5 space-y-4 text-[13px]">
              <div className="flex gap-3"><Building2 className="h-5 w-5 shrink-0 text-primary" /><div><strong>{booking.venueName}</strong><p className="mt-1 text-on-surface-variant">Sân {booking.courtNumber}</p></div></div>
              <div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /><span className="min-w-0 break-words">{booking.address}</span></div>
              <div className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-primary" /><div><strong>{dateText(booking.startTime)}</strong><p className="mt-1 text-on-surface-variant">{timeText(booking.startTime)}–{timeText(booking.endTime)} · {booking.durationHours} giờ</p></div></div>
            </div>
            <div className="my-5 border-t border-dashed border-outline-variant" />
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between gap-3"><span>Đơn giá</span><strong>{currency.format(booking.hourlyPrice)}/giờ</strong></div>
              <div className="flex justify-between gap-3"><span>Tiền sân</span><strong>{currency.format(booking.courtAmount)}</strong></div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-3 rounded-xl bg-surface-container-low p-4">
              <strong>Tổng thanh toán</strong>
              <strong className="text-right text-[23px] text-primary">{currency.format(booking.totalAmount)}</strong>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};
