import { useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clipboard,
  Clock,
  Loader2,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { cancelBookingHolding, getBookingHolding, type BookingHolding } from '../../api/booking';
import { ApiError } from '../../api/client';
import { getPlayerBookingPayment, submitBankTransfer } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { Button } from '../../components/ui/Button';
import { MatchCheckout } from '../matches/MatchCheckout';

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

type CheckoutSlotSummary = {
  courtId: number;
  courtNumber: number;
  startTime: string;
  endTime: string;
};

const buildSlotSummaries = (booking: BookingHolding) => {
  const slots: CheckoutSlotSummary[] = booking.slots.length
    ? booking.slots.map((slot) => ({ courtId: slot.courtId, courtNumber: slot.courtNumber, startTime: slot.startTime, endTime: slot.endTime }))
    : [{ courtId: booking.courtId, courtNumber: booking.courtNumber, startTime: booking.startTime, endTime: booking.endTime }];

  return [...slots]
    .sort((left, right) => left.startTime.localeCompare(right.startTime) || left.courtId - right.courtId)
    .reduce<CheckoutSlotSummary[]>((summaries, slot) => {
      const previous = summaries[summaries.length - 1];
      if (previous && previous.courtId === slot.courtId && previous.endTime === slot.startTime) {
        previous.endTime = slot.endTime;
        return summaries;
      }

      summaries.push({ ...slot });
      return summaries;
    }, []);
};

const hoursText = (hours: number) => Number.isInteger(hours) ? String(hours) : hours.toFixed(1).replace(/\.0$/, '');

const CourtCheckout = () => {
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

  const isHoldCountdownActive = booking?.status === 'Holding' && booking.paymentStatus === 'Pending';
  useEffect(() => {
    if (initialBooking) return;
    void loadBooking();
  }, [bookingId, token]);

  useEffect(() => {
    if (!isHoldCountdownActive) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isHoldCountdownActive]);

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
    if (event.bookingId === bookingId && !isSubmitting) {
      setBooking((current) => current ? {
        ...current,
        paymentStatus: event.paymentStatus,
        status: event.paymentStatus === 'Paid' ? 'Confirmed' : current.status,
      } : current);
      if (!token) return;
      void getPlayerBookingPayment(token, bookingId)
        .then((payment) => setBooking((current) => current ? {
          ...current,
          paymentStatus: payment.paymentStatus,
          status: payment.bookingStatus as BookingHolding['status'],
          holdExpiresAt: payment.holdExpiresAt,
          bankTransfer: payment,
        } : current))
        .catch(() => undefined);
    }
  });

  const remainingSeconds = useMemo(() => booking?.holdExpiresAt
    ? Math.max(0, Math.floor((utcTimestamp(booking.holdExpiresAt) - now) / 1000)) : 0, [booking?.holdExpiresAt, now]);
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const transfer = booking?.bankTransfer;
  const scheduleDate = params.get('date') ?? booking?.startTime.slice(0, 10) ?? '';
  const schedulePath = booking ? `/court/${booking.venueId}/schedule?date=${encodeURIComponent(scheduleDate)}` : '/book-court';
  const isPaymentExpired = booking?.status === 'Expired' || booking?.paymentStatus === 'Expired' ||
    Boolean(booking && isHoldCountdownActive && remainingSeconds <= 0);

  useEffect(() => {
    if (!isPaymentExpired) return;
    setError('Thời gian thanh toán đã hết hạn. Đang chuyển về lịch sân...');
    const timer = window.setTimeout(() => navigate(schedulePath, { replace: true }), 1500);
    return () => window.clearTimeout(timer);
  }, [isPaymentExpired, navigate, schedulePath]);

  const copyContent = async () => {
    if (!transfer?.transferContent) return;
    await navigator.clipboard.writeText(transfer.transferContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const submit = async () => {
    if (!booking) return;
    if (!token) { setError('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); return; }
    if (booking.status !== 'Holding') { setError(`Booking đang ở trạng thái ${booking.status}, không thể gửi thanh toán.`); return; }
    if (booking.paymentStatus !== 'Pending') { setError(`Thanh toán đang ở trạng thái ${booking.paymentStatus}.`); return; }
    if (remainingSeconds <= 0) { setError('Thời gian giữ chỗ đã hết. Vui lòng chọn lại khung giờ.'); return; }
    if (!transfer?.qrImageUrl) { setError('Sân chưa cấu hình tài khoản nhận chuyển khoản.'); return; }
    if (!receipt) { setError('Vui lòng chọn ảnh biên lai trước khi xác nhận đã chuyển khoản.'); return; }
    if (!window.confirm(`Gửi biên lai và xác nhận đã chuyển ${currency.format(booking.totalAmount)}?`)) return;

    setIsSubmitting(true);
    setError('');
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
      <div className="flex min-h-dvh items-center justify-center bg-[#f8fbf4] px-4">
        <div className="rounded-2xl border border-[#dbe8d3] bg-white p-6 text-center shadow-[0_16px_40px_rgba(18,45,34,0.08)]">
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
  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 10 };
  const slotSummaries = buildSlotSummaries(booking);
  const selectedCourtNumbers = Array.from(new Set(slotSummaries.map((slot) => slot.courtNumber))).sort((left, right) => left - right);
  const selectedDurationHours = booking.slots.length ? booking.slots.length * 0.5 : booking.durationHours;

  const returnToSchedule = async () => {
    if (!token) { navigate(schedulePath); return; }
    if (booking.status !== 'Holding' || booking.paymentStatus !== 'Pending') {
      navigate(schedulePath);
      return;
    }
    if (!window.confirm('Hủy giữ chỗ hiện tại và quay lại chọn lịch sân?')) return;

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
    <div className="min-h-dvh overflow-x-clip bg-[#f8fbf4] text-[#0b2228]">
      <main className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[#dbe8d3] bg-white p-3 shadow-[0_14px_34px_rgba(18,45,34,0.07)]"
          data-motion-managed
          initial={revealInitial}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0">
              <button
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#dbe8d3] bg-white px-3 text-[13px] font-bold text-primary transition-[background-color,transform,opacity] duration-200 hover:-translate-y-px hover:bg-[#eef8e6] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55"
                disabled={isReturning}
                onClick={() => void returnToSchedule()}
                type="button"
              >
                {isReturning ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <ArrowLeft className="h-4 w-4" />}
                {isReturning ? 'Đang giải phóng...' : booking.status === 'Holding' && booking.paymentStatus === 'Pending' ? 'Quay lại chọn giờ' : 'Quay lại lịch sân'}
              </button>
              <h1 className="mt-3 text-[clamp(1.55rem,2.7vw,2.25rem)] font-extrabold leading-tight tracking-[-0.035em]">
                Thanh toán đặt sân
              </h1>
              <p className="mt-1 text-[13px] font-semibold text-[#66766d]">Mã booking {booking.bookingCode}</p>
            </div>
            <div className="rounded-2xl bg-[#0b2228] px-5 py-3 text-white md:text-right">
              <p className="text-[12px] font-bold text-white/70">Thời gian giữ chỗ</p>
              <p className="font-mono text-[32px] font-black leading-none text-[#e2ff57]">{isHoldCountdownActive ? countdown : '--:--'}</p>
              <p className="mt-1 text-[13px] font-bold text-white/82">{statusText[status] ?? status}</p>
            </div>
          </div>
        </motion.section>

        {error && (
          <div className="flex items-start gap-2 rounded-xl border border-error/25 bg-error-container px-4 py-3 text-[13px] font-bold text-error" role="alert">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span className="min-w-0 break-words">{error}</span>
          </div>
        )}

        {transfer?.rejectionReason && status === 'Pending' && (
          <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span><strong>Biên lai trước chưa được chấp nhận:</strong> {transfer.rejectionReason}. Bạn có thể kiểm tra và gửi lại biên lai mới.</span>
          </div>
        )}

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_360px]">
          <motion.section
            animate={{ opacity: 1, y: 0 }}
            className="min-h-[520px] overflow-hidden rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)]"
            data-motion-managed
            initial={revealInitial}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.04,
              duration: shouldReduceMotion ? 0.01 : 0.28,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            {isPaid ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <CheckCircle2 className="h-16 w-16 text-primary" />
                <h2 className="mt-4 text-[28px] font-extrabold">Thanh toán đã được xác nhận</h2>
                <p className="mt-2 text-[#66766d]">Booking đã chuyển sang Confirmed và sân được giữ cho bạn.</p>
                <Button className="mt-6 h-11 rounded-xl bg-[#e2ff57] text-[#102414] hover:bg-[#d6f64d]" onClick={() => navigate(`/bookings/${booking.bookingId}`)} type="button">
                  Xem chi tiết booking
                </Button>
              </div>
            ) : isWaiting ? (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <Loader2 className="h-14 w-14 animate-spin text-primary motion-reduce:animate-none" />
                <h2 className="mt-5 text-[26px] font-extrabold">Đang đối soát giao dịch</h2>
                <p className="mx-auto mt-2 max-w-lg text-[14px] leading-6 text-[#66766d]">Biên lai đã được gửi. Chủ sân hoặc nhân viên sẽ kiểm tra giao dịch.</p>
                {transfer?.receiptImageUrl && <img alt="Biên lai đã gửi" className="mx-auto mt-6 max-h-72 rounded-xl border border-[#dbe8d3] object-contain" src={transfer.receiptImageUrl} />}
              </div>
            ) : transfer?.qrImageUrl ? (
              <div className="grid h-full gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-2xl bg-[#f8fbf4] p-4 text-center">
                  <p className="text-[12px] font-black text-primary">Quét QR bằng ứng dụng ngân hàng</p>
                  <img alt={`QR chuyển khoản ${booking.bookingCode}`} className="mx-auto mt-3 w-full max-w-[280px] rounded-xl border border-[#dbe8d3] bg-white" src={transfer.qrImageUrl} />
                  <p className="mt-2 text-[12px] text-[#66766d]">QR đã điền sẵn số tiền và nội dung chuyển khoản.</p>
                </div>

                <div className="grid content-start gap-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      ['Ngân hàng nhận', transfer.bankName],
                      ['Tên chủ tài khoản', transfer.bankAccountName],
                      ['Số tài khoản', transfer.bankAccountNumber],
                      ['Số tiền', currency.format(booking.totalAmount)],
                    ].map(([label, value]) => (
                      <div className="rounded-xl border border-[#dbe8d3] bg-white p-3" key={label}>
                        <p className="text-[11px] font-bold text-[#66766d]">{label}</p>
                        <p className="mt-1 break-words text-[15px] font-black">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border-2 border-[#e2ff57] bg-[#eef8e6] p-3">
                    <p className="text-[12px] font-black text-primary">Nội dung chuyển khoản bắt buộc</p>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <code className="min-w-0 break-all text-[18px] font-black">{transfer.transferContent}</code>
                      <Button className="h-10 rounded-xl text-[13px]" onClick={() => void copyContent()} size="sm" type="button">
                        {copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
                        {copied ? 'Đã sao chép' : 'Sao chép'}
                      </Button>
                    </div>
                  </div>

                  <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#dbe8d3] bg-[#f8fbf4] p-4 text-center transition-[border-color,background-color,transform] duration-200 hover:-translate-y-px hover:border-primary-container hover:bg-[#eef8e6]">
                    <Upload className="mx-auto h-6 w-6 text-primary" />
                    <span className="mt-2 block break-words text-[13px] font-bold">{receipt ? receipt.name : 'Tải ảnh biên lai chuyển khoản'}</span>
                    <span className="mt-1 block text-[12px] text-[#66766d]">JPG, PNG hoặc WEBP. Tối đa 12 MB.</span>
                    <input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" />
                  </label>

                  {receiptPreview && (
                    <div className="rounded-xl border border-[#dbe8d3] bg-[#f8fbf4] p-3">
                      <p className="mb-2 text-center text-[12px] font-bold text-primary">Ảnh biên lai đã chọn</p>
                      <img alt="Xem trước biên lai" className="mx-auto max-h-56 rounded-lg border border-[#dbe8d3] bg-white object-contain" src={receiptPreview} />
                    </div>
                  )}

                  <Button aria-busy={isSubmitting} className="h-11 w-full rounded-xl bg-[#e2ff57] text-[14px] font-black text-[#102414] hover:bg-[#d6f64d]" disabled={isSubmitting} onClick={() => void submit()} type="button">
                    <ShieldCheck className="h-5 w-5" />
                    {isSubmitting ? 'Đang gửi biên lai...' : 'Tôi đã chuyển khoản'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
                <AlertCircle className="h-14 w-14 text-error" />
                <h2 className="mt-4 text-[24px] font-extrabold">Sân chưa cấu hình tài khoản nhận tiền</h2>
                <p className="mt-2 text-[#66766d]">Vui lòng liên hệ chủ sân hoặc chọn khung giờ khác.</p>
              </div>
            )}
          </motion.section>

          <aside className="h-fit rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] lg:sticky lg:top-4">
            <h2 className="flex items-center gap-2 text-[19px] font-extrabold">
              <ReceiptText className="h-5 w-5 text-primary" />
              Thông tin đặt sân
            </h2>
            <div className="mt-4 space-y-3 text-[13px]">
              <div className="flex gap-3">
                <Building2 className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <strong>{booking.venueName}</strong>
                  <p className="mt-1 text-[#66766d]">{selectedCourtNumbers.map((courtNumber) => `Sân ${courtNumber}`).join(', ')}</p>
                </div>
              </div>
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 shrink-0 text-primary" />
                <span className="min-w-0 break-words">{booking.address}</span>
              </div>
              <div className="flex gap-3">
                <Clock className="h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="space-y-2 text-[#66766d]">
                    {slotSummaries.map((slot) => (
                      <p key={`${slot.courtId}-${slot.startTime}`}>
                        <strong className="block text-[#0b2228]">{dateText(slot.startTime)}</strong>
                        <span className="mt-0.5 block">
                          {slotSummaries.length > 1 ? `Sân ${slot.courtNumber}: ` : ''}{timeText(slot.startTime)} - {timeText(slot.endTime)}
                        </span>
                      </p>
                    ))}
                    <p>{hoursText(selectedDurationHours)} giờ</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="my-4 border-t border-dashed border-[#dbe8d3]" />

            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between gap-3">
                <span>Đơn giá</span>
                <strong>{currency.format(booking.hourlyPrice)}/giờ</strong>
              </div>
              <div className="flex justify-between gap-3">
                <span>Tiền sân</span>
                <strong>{currency.format(booking.courtAmount)}</strong>
              </div>
            </div>
            <div className="mt-4 rounded-2xl bg-[#0b2228] p-4 text-white">
              <p className="text-[12px] font-bold text-white/70">Tổng thanh toán</p>
              <strong className="mt-1 block text-[26px] font-black leading-none tracking-[-0.035em] text-[#e2ff57]">{currency.format(booking.totalAmount)}</strong>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export const Checkout = () => {
  const [params] = useSearchParams();
  const matchId = params.get('matchId');
  const isMatchCheckout = matchId !== null && /^\d+$/.test(matchId) && Number(matchId) > 0;
  return isMatchCheckout ? <MatchCheckout /> : <CourtCheckout />;
};
