import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Clipboard, Clock, Loader2, MapPin, ReceiptText, ShieldCheck, Upload, Users } from 'lucide-react';
import { getMatchDetail, type MatchDetailResponse } from '../../api/matches';
import { previewBatchPayment, submitBatchBankTransfer, type BatchPaymentPreview } from '../../api/payment';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const MAX_RECEIPT_SOURCE_BYTES = 12 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const approved = (status: string) => status === 'Approved' || status === 'Accepted';
const timeText = (value: string) => value.slice(11, 16);
const slotDateText = (value: string) => value.slice(0, 10).split('-').reverse().join('/');
const utcTimestamp = (value?: string | null) => {
  if (!value) return 0;
  return new Date(/(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}Z`).getTime();
};

export const MatchCheckout = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const bookingId = Number(params.get('bookingId'));
  const matchId = Number(params.get('matchId'));
  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [selectedPayerIds, setSelectedPayerIds] = useState<number[]>([]);
  const [preview, setPreview] = useState<BatchPaymentPreview | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [error, setError] = useState('');

  const loadMatch = async () => {
    if (!token || !Number.isInteger(bookingId) || !Number.isInteger(matchId)) {
      setError('Booking ghép trận không hợp lệ.');
      return;
    }
    try {
      const detail = await getMatchDetail(token, matchId);
      if (detail.bookingId !== bookingId) throw new Error('Booking không thuộc phòng ghép trận này.');
      setMatch(detail);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải thanh toán ghép trận.');
    }
  };

  useEffect(() => { void loadMatch(); }, [bookingId, matchId, token]);

  const paymentTargets = useMemo(() => match?.participants.filter((participant) => approved(participant.status) && participant.paymentId) ?? [], [match]);
  const pendingPayerIds = useMemo(() => new Set(paymentTargets.filter((participant) => participant.paymentStatus === 'Pending').map((participant) => participant.playerId)), [paymentTargets]);
  const rejectedPayment = paymentTargets.find((participant) => participant.paymentStatus === 'Pending' && participant.paymentRejectionReason);
  const myPaymentApproved = match?.myPaymentStatus === 'Paid';
  const selectedKey = useMemo(() => [...selectedPayerIds].sort((left, right) => left - right).join(','), [selectedPayerIds]);
  const isAwaitingReceiptReview = paymentTargets.some((participant) => participant.paymentStatus === 'WaitingForConfirmation');
  const deadline = utcTimestamp(match?.paymentDeadline);
  const remainingSeconds = isAwaitingReceiptReview && match?.paymentHoldRemainingSeconds != null
    ? match.paymentHoldRemainingSeconds
    : deadline ? Math.max(0, Math.floor((deadline - now) / 1000)) : 0;
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const paymentExpired = Boolean(deadline && remainingSeconds <= 0 && !isAwaitingReceiptReview);
  const bookingGroups = match?.bookingCheckIns.find((booking) => booking.bookingId === bookingId)?.checkInGroups ?? [];

  useEffect(() => {
    if (!match) return;
    setSelectedPayerIds((current) => {
      const retained = current.filter((playerId) => pendingPayerIds.has(playerId));
      if (retained.length) return retained;
      return match.myPlayerId && pendingPayerIds.has(match.myPlayerId) ? [match.myPlayerId] : [];
    });
  }, [match, pendingPayerIds]);

  useEffect(() => {
    if (!deadline || paymentExpired || isAwaitingReceiptReview) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [deadline, isAwaitingReceiptReview, paymentExpired]);

  useEffect(() => {
    if (!token || !match || !selectedKey || paymentExpired) {
      setPreview(null);
      return undefined;
    }
    let cancelled = false;
    setPreview(null);
    void previewBatchPayment(token, bookingId, selectedKey.split(',').map(Number))
      .then((value) => {
        if (cancelled) return;
        setPreview(value);
        void loadMatch();
      })
      .catch((reason) => { if (!cancelled) setError(reason instanceof Error ? reason.message : 'Không thể tạo mã thanh toán.'); });
    return () => { cancelled = true; };
  }, [bookingId, paymentExpired, selectedKey, token]);

  useEffect(() => {
    if (!receipt) { setReceiptPreview(''); return; }
    if (!ALLOWED_RECEIPT_TYPES.has(receipt.type)) {
      setReceipt(null);
      setError('Biên lai phải là ảnh JPG, PNG hoặc WEBP.');
      return;
    }
    if (receipt.size > MAX_RECEIPT_SOURCE_BYTES) {
      setReceipt(null);
      setError('Ảnh biên lai gốc không được vượt quá 12 MB.');
      return;
    }
    const previewUrl = URL.createObjectURL(receipt);
    setReceiptPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [receipt]);

  usePaymentRealtime((event) => {
    if (event.bookingId === bookingId && !isSubmitting) void loadMatch();
  });

  const copyContent = async () => {
    if (!preview?.transferContent) return;
    await navigator.clipboard.writeText(preview.transferContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  const submit = async () => {
    if (!token || !receipt || !preview || !selectedPayerIds.length || paymentExpired) {
      setError('Vui lòng chọn thành viên và ảnh biên lai trước khi gửi.');
      return;
    }
    if (!window.confirm(`Gửi biên lai thanh toán cho ${selectedPayerIds.length} thành viên đã chọn?`)) return;

    setIsSubmitting(true);
    setError('');
    try {
      await submitBatchBankTransfer(token, bookingId, selectedPayerIds, receipt);
      setReceipt(null);
      await loadMatch();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Không thể gửi xác nhận thanh toán.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!match) {
    return <div className="grid min-h-dvh place-items-center bg-[#f8fbf4] p-4"><div className="rounded-2xl border border-[#dbe8d3] bg-white p-6 text-center">{error ? <p className="font-bold text-error">{error}</p> : <><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><p className="mt-3 font-bold">Đang tải thanh toán ghép trận...</p></>}</div></div>;
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f8fbf4] p-4 text-[#0b2228] sm:p-6 lg:p-8">
      <main className="mx-auto w-full max-w-[1180px]">
        <header className="grid gap-4 rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <Link className="inline-flex items-center gap-2 rounded-xl border border-[#dbe8d3] px-3 py-2 text-[13px] font-bold text-primary hover:bg-[#eef8e6]" to={`/matches/${matchId}`}><ArrowLeft className="h-4 w-4" /> Quay lại phòng ghép trận</Link>
            <h1 className="mt-3 text-[clamp(1.55rem,2.7vw,2.25rem)] font-extrabold tracking-[-0.035em]">Thanh toán booking ghép trận</h1>
            <p className="mt-1 text-[13px] font-semibold text-[#66766d]">Booking #{bookingId} · {match.title}</p>
          </div>
          <div className="rounded-2xl bg-[#0b2228] px-5 py-3 text-white md:text-right"><p className="text-[12px] font-bold text-white/70">Thời gian giữ chỗ</p><p className="font-mono text-[32px] font-black leading-none text-[#e2ff57]">{deadline ? countdown : '--:--'}</p><p className="mt-1 text-[12px] font-bold text-white/80">{isAwaitingReceiptReview ? 'Đang chờ duyệt biên lai' : paymentExpired ? 'Đã hết hạn' : 'Chờ thanh toán'}</p></div>
        </header>

        {error && <div className="mt-4 flex items-start gap-2 rounded-xl border border-error/25 bg-error-container px-4 py-3 text-[13px] font-bold text-error" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />{error}</div>}
        {rejectedPayment && <div className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800" role="alert"><AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /><div><p className="font-extrabold">Biên lai thanh toán đã bị từ chối.</p><p className="mt-1">Lý do: {rejectedPayment.paymentRejectionReason}</p><p className="mt-1 font-semibold">Vui lòng kiểm tra và gửi lại biên lai trước khi hết thời gian giữ chỗ.</p></div></div>}

        {myPaymentApproved && (
          <div
            className="mt-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800"
            role="status"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-extrabold">Chủ sân đã xác nhận biên lai thanh toán.</p>
              <p className="mt-1 font-semibold">Thanh toán của bạn đã hoàn tất.</p>
            </div>
          </div>
        )}
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)]">
            {paymentExpired ? <div className="grid min-h-80 place-items-center text-center"><AlertCircle className="h-14 w-14 text-error" /><div><h2 className="mt-4 text-xl font-extrabold">Thời gian thanh toán đã hết</h2><p className="mt-2 text-[#66766d]">Quay lại phòng ghép trận để tạo booking mới.</p></div></div> : (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div>
                  <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h2 className="text-lg font-extrabold">Chọn thành viên thanh toán</h2></div>
                  <p className="mt-1 text-[13px] text-[#66766d]">Bạn có thể thanh toán một lần cho nhiều thành viên còn chờ.</p>
                  <div className="mt-4 space-y-2">
                    {paymentTargets.map((participant) => {
                      const canSelect = participant.paymentStatus === 'Pending';
                      const isSelected = selectedPayerIds.includes(participant.playerId);
                      return <label className={`flex items-center gap-3 rounded-xl border p-3 ${isSelected ? 'border-primary bg-[#eef8e6]' : 'border-[#dbe8d3]'} ${canSelect ? 'cursor-pointer' : 'opacity-60'}`} key={participant.playerId}><input checked={isSelected} className="h-4 w-4 accent-primary" disabled={!canSelect || isSubmitting} onChange={(event) => setSelectedPayerIds((current) => event.target.checked ? [...current, participant.playerId] : current.filter((id) => id !== participant.playerId))} type="checkbox" /><span className="min-w-0 flex-1"><strong className="block text-[13px]">{participant.playerName}</strong><span className="text-[12px] text-[#66766d]">{currency.format(participant.paymentAmount ?? match.amountPerPlayer)} · {participant.paymentStatus === 'Pending' ? 'Chờ thanh toán' : participant.paymentStatus}</span></span></label>;
                    })}
                    {!paymentTargets.length && <p className="rounded-xl bg-[#f8fbf4] p-4 text-center text-[13px] font-bold text-[#66766d]">Không có khoản thanh toán nào.</p>}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f8fbf4] p-4 text-center">
                  {!selectedPayerIds.length ? <p className="pt-12 text-[13px] font-bold text-[#66766d]">Chọn ít nhất một thành viên để tạo mã QR.</p> : !preview ? <div className="pt-12"><Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" /><p className="mt-3 text-[13px] font-bold">Đang tạo mã QR...</p></div> : <>
                    <p className="text-[12px] font-black text-primary">Thanh toán cho {preview.memberNames.join(', ')}</p>
                    <img alt="QR thanh toán ghép trận" className="mx-auto mt-3 w-full max-w-[250px] rounded-xl border border-[#dbe8d3] bg-white" src={preview.qrImageUrl} />
                    <p className="mt-3 text-[12px] font-bold text-[#66766d]">Tổng chuyển khoản</p><strong className="mt-1 block text-2xl font-black">{currency.format(preview.totalAmount)}</strong>
                    <div className="mt-3 rounded-xl border-2 border-[#e2ff57] bg-white p-3 text-left"><p className="text-[11px] font-bold text-primary">Nội dung chuyển khoản</p><code className="mt-1 block break-all text-[13px] font-black">{preview.transferContent}</code><button className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-primary" onClick={() => void copyContent()} type="button"><Clipboard className="h-4 w-4" />{copied ? 'Đã sao chép' : 'Sao chép'}</button></div>
                  </>}
                </div>
              </div>
            )}

            {!paymentExpired && preview && <div className="mt-5 border-t border-dashed border-[#dbe8d3] pt-5"><label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#dbe8d3] bg-[#f8fbf4] p-4 text-center hover:border-primary"><Upload className="mx-auto h-6 w-6 text-primary" /><span className="mt-2 block text-[13px] font-bold">{receipt ? receipt.name : 'Tải ảnh biên lai chuyển khoản'}</span><span className="mt-1 block text-[12px] text-[#66766d]">JPG, PNG hoặc WEBP · tối đa 12 MB</span><input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" /></label>{receiptPreview && <img alt="Xem trước biên lai" className="mx-auto mt-4 max-h-56 rounded-xl border border-[#dbe8d3] object-contain" src={receiptPreview} />}<button aria-busy={isSubmitting} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e2ff57] text-[14px] font-black text-[#102414] hover:bg-[#d6f64d] disabled:cursor-not-allowed disabled:opacity-60" disabled={!receipt || isSubmitting} onClick={() => void submit()} type="button"><ShieldCheck className="h-5 w-5" />{isSubmitting ? 'Đang gửi biên lai...' : `Gửi thanh toán cho ${selectedPayerIds.length} người`}</button></div>}
          </section>

          <aside className="h-fit rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] lg:sticky lg:top-4"><h2 className="flex items-center gap-2 text-lg font-extrabold"><ReceiptText className="h-5 w-5 text-primary" /> Thông tin booking</h2><div className="mt-4 space-y-4 text-[13px]"><div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-primary" /><div><strong>{match.venueName}</strong><p className="mt-1 text-[#66766d]">{match.address}</p></div></div><div className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-primary" /><div>{bookingGroups.map((group) => <p className="mt-1 text-[#66766d]" key={group.bookingCheckInGroupId}>Sân {group.courtNumber}: {slotDateText(group.startTime)} · {timeText(group.startTime)} - {timeText(group.endTime)}</p>)}</div></div></div><div className="my-4 border-t border-dashed border-[#dbe8d3]" /><div className="space-y-2 text-[14px]"><div className="flex justify-between gap-3"><span>Phần mỗi người</span><strong>{currency.format(match.amountPerPlayer)}</strong></div><div className="flex justify-between gap-3"><span>Tổng booking</span><strong>{currency.format(match.totalBookingAmount)}</strong></div></div>{preview && <div className="mt-4 rounded-2xl bg-[#0b2228] p-4 text-white"><p className="text-[12px] font-bold text-white/70">Tổng thanh toán đã chọn</p><strong className="mt-1 block text-2xl font-black text-[#e2ff57]">{currency.format(preview.totalAmount)}</strong></div>}</aside>
        </div>
      </main>
    </div>
  );
};
