import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Clipboard, Loader2, ShieldCheck, Upload } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cancelBookingHolding, getBookingHoldingGroup, type BookingHoldingGroup } from '../../api/booking';
import { ApiError } from '../../api/client';
import { submitBookingHoldingGroupTransfer } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { Button } from '../../components/ui/Button';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const allowedReceiptTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const utcTimestamp = (value: string) => new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`).getTime();

export const GroupedCheckout = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const paymentGroupId = params.get('paymentGroupId');
  const [group, setGroup] = useState<BookingHoldingGroup | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const loadGroup = async (silent = false) => {
    if (!token || !paymentGroupId) {
      setError('Nhóm thanh toán không hợp lệ.');
      return;
    }
    try {
      setGroup(await getBookingHoldingGroup(token, paymentGroupId));
      if (!silent) setError('');
    } catch (requestError) {
      if (!silent) setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải nhóm đặt sân.');
    }
  };

  useEffect(() => { void loadGroup(); }, [paymentGroupId, token]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  usePaymentRealtime((event) => {
    if (!group?.bookings.some((booking) => booking.bookingId === event.bookingId)) return;
    setGroup((current) => current ? {
      ...current,
      bookings: current.bookings.map((booking) => event.bookingId === booking.bookingId
        ? {
          ...booking,
          paymentStatus: event.paymentStatus,
          status: event.paymentStatus === 'Paid' ? 'Confirmed' : booking.status,
        }
        : booking),
    } : current);
    if (!isSubmitting) void loadGroup(true);
  });

  const booking = group?.bookings[0] ?? null;
  const transfer = booking?.bankTransfer;
  const holdExpiresAt = useMemo(() => group?.bookings
    .map((item) => item.holdExpiresAt)
    .filter((item): item is string => Boolean(item))
    .sort()[0] ?? null, [group]);
  const remainingSeconds = holdExpiresAt ? Math.max(0, Math.floor((utcTimestamp(holdExpiresAt) - now) / 1000)) : 0;
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const isPaid = Boolean(group?.bookings.length) && group!.bookings.every((item) => item.paymentStatus === 'Paid');
  const isWaiting = Boolean(group?.bookings.length) && group!.bookings.every((item) => item.paymentStatus === 'WaitingForConfirmation');
  const schedulePath = booking ? `/court/${booking.venueId}/schedule?date=${encodeURIComponent(params.get('date') ?? booking.startTime.slice(0, 10))}` : '/book-court';

  const copyContent = async () => {
    if (!transfer?.transferContent) return;
    await navigator.clipboard.writeText(transfer.transferContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const submit = async () => {
    if (!token || !paymentGroupId || !group || !transfer?.qrImageUrl || !receipt) return;
    if (receipt.size > 12 * 1024 * 1024 || !allowedReceiptTypes.has(receipt.type)) {
      setError('Biên lai phải là ảnh JPG, PNG hoặc WEBP, tối đa 12 MB.');
      return;
    }
    if (remainingSeconds <= 0 || group.bookings.some((item) => item.status !== 'Holding' || item.paymentStatus !== 'Pending')) {
      setError('Một hoặc nhiều slot không còn sẵn sàng để thanh toán.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await submitBookingHoldingGroupTransfer(token, paymentGroupId, receipt);
      setGroup((current) => current ? {
        ...current,
        bookings: current.bookings.map((item) => ({
          ...item,
          paymentStatus: result.payments.find((payment) => payment.bookingId === item.bookingId)?.paymentStatus ?? item.paymentStatus,
        })),
      } : current);
      setReceipt(null);
      void loadGroup(true);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể gửi biên lai.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const returnToSchedule = async () => {
    if (!token || !group) { navigate(schedulePath); return; }
    if (group.bookings.some((item) => item.status !== 'Holding' || item.paymentStatus !== 'Pending')) { navigate(schedulePath); return; }
    setIsReturning(true);
    try {
      await Promise.all(group.bookings.map((item) => cancelBookingHolding(token, item.bookingId)));
      navigate(schedulePath, { replace: true });
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể giải phóng toàn bộ slot.');
      setIsReturning(false);
    }
  };

  if (!group || !booking) return <div className="flex min-h-dvh items-center justify-center bg-[#f8fbf4] p-6 text-center"><p className="font-bold">{error || 'Đang tải thông tin chuyển khoản...'}</p></div>;

  return (
    <main className="min-h-dvh bg-[#f8fbf4] p-4 text-[#0b2228] sm:p-6">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#081d24] p-4 text-white">
          <div><h1 className="text-xl font-extrabold">Thanh toán đặt sân</h1><p className="text-sm text-white/75">{group.bookings.length} slot, một giao dịch</p></div>
          <div className="font-mono text-2xl font-black text-[#e2ff57]">{isPaid ? '--:--' : countdown}</div>
        </div>
        {error && <div className="flex gap-2 rounded-lg bg-error-container p-3 font-bold text-error"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}
        <section className="grid gap-4 rounded-xl border border-[#dbe8d3] bg-white p-4 lg:grid-cols-[1fr_300px]">
          <div className="space-y-3">
            <h2 className="font-extrabold">Các slot đã chọn</h2>
            {group.bookings.map((item) => <div className="flex justify-between gap-3 border-b border-[#dbe8d3] pb-2 text-sm" key={item.bookingId}><span>Sân {item.courtNumber}, {item.startTime.slice(0, 10)} {item.startTime.slice(11, 16)} - {item.endTime.slice(11, 16)}</span><strong>{currency.format(item.totalAmount)}</strong></div>)}
            <div className="flex justify-between text-lg font-black"><span>Tổng thanh toán</span><span>{currency.format(group.totalAmount)}</span></div>
          </div>
          <div className="space-y-3 rounded-lg bg-[#eef8e6] p-3">
            {isPaid ? <div className="text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-[#276b3f]" /><p className="mt-2 font-black">Thanh toán đã được xác nhận</p></div> : isWaiting ? <div className="text-center"><Loader2 className="mx-auto h-10 w-10 animate-spin text-[#276b3f]" /><p className="mt-2 font-black">Đang chờ xác nhận</p></div> : <>
              {transfer?.qrImageUrl && <img alt="QR chuyển khoản nhóm" className="w-full rounded-lg bg-white" src={transfer.qrImageUrl} />}
              <code className="block break-all rounded bg-white p-2 text-xs font-black">{transfer?.transferContent}</code>
              <Button className="w-full" onClick={() => void copyContent()} size="sm" type="button">{copied ? <CheckCircle2 className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}{copied ? 'Đã sao chép' : 'Sao chép nội dung'}</Button>
              <label className="block cursor-pointer rounded-lg border-2 border-dashed border-[#276b3f] p-3 text-center text-sm font-bold"><Upload className="mx-auto h-5 w-5" />{receipt?.name ?? 'Tải ảnh biên lai'}<input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" /></label>
              <Button aria-busy={isSubmitting} className="w-full bg-[#e2ff57] text-[#102414] hover:bg-[#d6f64d]" disabled={!receipt || isSubmitting} onClick={() => void submit()} type="button"><ShieldCheck className="h-4 w-4" />{isSubmitting ? 'Đang gửi...' : 'Tôi đã chuyển khoản'}</Button>
            </>}
          </div>
        </section>
        <Button disabled={isReturning} onClick={() => void returnToSchedule()} type="button"><ArrowLeft className="h-4 w-4" />{isReturning ? 'Đang giải phóng...' : 'Quay lại lịch sân'}</Button>
      </div>
    </main>
  );
};
