import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Clipboard, Clock, Loader2, MapPin, ReceiptText, ShieldCheck, Upload, Users } from 'lucide-react';
import { getMatchDetail, type MatchDetailResponse } from '../../api/matches';
import { previewBatchPayment, requestPaymentSponsorship, respondPaymentSponsorship, submitBatchBankTransfer, type BatchPaymentPreview } from '../../api/payment';
import { ApiError, ApiErrorCodes } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useVisiblePolling } from '../../hooks/useVisiblePolling';
import { reconcileSelectedPayerIds } from '../../utils/matchPaymentSelection';
import { useConfirm } from '../../components/ui/ConfirmDialogRegion';
import { useToast } from '../../components/ui/ToastRegion';
import { HistoryBackLink } from '../../components/navigation/HistoryBackLink';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const MAX_RECEIPT_SOURCE_BYTES = 12 * 1024 * 1024;
const ALLOWED_RECEIPT_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const approved = (status: string) => status === 'Approved' || status === 'Accepted';
const timeText = (value: string) => value.slice(11, 16);
const slotDateText = (value: string) => value.slice(0, 10).split('-').reverse().join('/');
const utcTimestamp = (value?: string | null) => {
  if (!value) return 0;
  const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value) ? value : `${value}+07:00`;
  return new Date(normalized).getTime();
};
const activeClaimedBy = (playerId?: number | null, expiresAt?: string | null, now = Date.now()) =>
  playerId && utcTimestamp(expiresAt) > now ? playerId : null;

export const MatchCheckout = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const confirm = useConfirm();
  const notify = useToast();
  const bookingId = Number(params.get('bookingId'));
  const matchId = Number(params.get('matchId'));
  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [selectedPayerIds, setSelectedPayerIds] = useState<number[]>([]);
  const [preview, setPreview] = useState<BatchPaymentPreview | null>(null);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sponsorshipActionPlayerId, setSponsorshipActionPlayerId] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [paymentDeadlineAt, setPaymentDeadlineAt] = useState(0);
  const [isPaymentReviewPaused, setIsPaymentReviewPaused] = useState(false);
  const [error, setError] = useState('');
  const phoneRedirecting = useRef(false);

  const redirectToPhoneProfile = (reason: unknown) => {
    if (!(reason instanceof ApiError) || reason.body?.errorCode !== ApiErrorCodes.phoneNumberRequired) return false;
    if (phoneRedirecting.current) return true;
    phoneRedirecting.current = true;
    notify(reason.message, 'error');
    navigate('/profile');
    return true;
  };

  const loadMatch = async (reconcilePayments = false) => {
    if (!token || !Number.isInteger(bookingId) || !Number.isInteger(matchId)) {
      setError('Booking ghép trận không hợp lệ.');
      return;
    }
    try {
      const detail = await getMatchDetail(token, matchId, reconcilePayments);
      if (detail.bookingId !== bookingId) throw new Error('Booking không thuộc phòng ghép trận này.');
      const receivedAt = Date.now();
      setMatch(detail);
      setNow(receivedAt);
      setIsPaymentReviewPaused(!detail.paymentDeadline && detail.paymentHoldRemainingSeconds != null);
      setPaymentDeadlineAt(detail.paymentHoldRemainingSeconds != null
        ? receivedAt + Math.max(0, detail.paymentHoldRemainingSeconds) * 1_000
        : utcTimestamp(detail.paymentDeadline));
      setError('');
    } catch (reason) {
      console.error('[MatchCheckout] Error loading match:', reason);
      setError(reason instanceof Error ? reason.message : 'Không thể tải thanh toán ghép trận.');
    }
  };

  useEffect(() => { void loadMatch(); }, [bookingId, matchId, token]);

  const paymentTargets = useMemo(() => {
    const targets = match?.participants.filter((participant) => approved(participant.status) && participant.paymentId) ?? [];
    return targets;
  }, [match]);
  const pendingPayerIds = useMemo(() => new Set(paymentTargets.filter((participant) => participant.paymentStatus === 'Pending').map((participant) => participant.playerId)), [paymentTargets]);
  const selectablePayerIds = useMemo(() => new Set(paymentTargets.filter((participant) => {
    if (participant.paymentStatus !== 'Pending') return false;
    const claimedBy = participant.allowPaymentByOthers
      ? participant.paymentClaimedByPlayerId
      : activeClaimedBy(participant.paymentClaimedByPlayerId, participant.paymentClaimExpiresAt, now);
    if (participant.playerId === match?.myPlayerId)
      return !participant.paymentSponsorshipRequestedByPlayerId && (!claimedBy || claimedBy === match.myPlayerId);
    return participant.allowPaymentByOthers && claimedBy === match?.myPlayerId;
  }).map((participant) => participant.playerId)), [match?.myPlayerId, now, paymentTargets]);
  const myPayment = paymentTargets.find((participant) => participant.playerId === match?.myPlayerId);
  const incomingSponsorshipRequester = paymentTargets.find((participant) =>
    participant.playerId === myPayment?.paymentSponsorshipRequestedByPlayerId);
  const rejectedPayment = paymentTargets.find((participant) => participant.paymentStatus === 'Pending' && participant.paymentRejectionReason);
  const myPaymentApproved = match?.myPaymentStatus === 'Paid';
  const selectedKey = useMemo(() => [...selectedPayerIds].sort((left, right) => left - right).join(','), [selectedPayerIds]);
  const hasInvalidSelection = selectedPayerIds.some((playerId) => !selectablePayerIds.has(playerId));
  const hasPendingPayments = pendingPayerIds.size > 0;
  const hasReceiptAwaitingReview = paymentTargets.some((participant) => participant.paymentStatus === 'WaitingForConfirmation');
  const isAwaitingReceiptReview = !hasPendingPayments && hasReceiptAwaitingReview;
  const hasRefundPending = paymentTargets.some((participant) => participant.paymentStatus === 'RefundPending');
  const hasTerminalPaymentStatus = hasRefundPending
    || paymentTargets.some((participant) => participant.paymentStatus === 'Expired');
  const deadline = paymentDeadlineAt;
  const remainingSeconds = deadline ? Math.max(0, Math.floor((deadline - now) / 1000)) : 0;
  const countdown = `${String(Math.floor(remainingSeconds / 60)).padStart(2, '0')}:${String(remainingSeconds % 60).padStart(2, '0')}`;
  const paymentExpired = hasTerminalPaymentStatus
    || Boolean(!isPaymentReviewPaused && deadline && remainingSeconds <= 0 && hasPendingPayments);
  const bookingGroups = match?.bookingCheckIns.find((booking) => booking.bookingId === bookingId)?.checkInGroups ?? [];

  useEffect(() => {
    if (!match) return;
    setSelectedPayerIds((current) => reconcileSelectedPayerIds(
      current,
      selectablePayerIds,
      selectablePayerIds.has(match.myPlayerId) ? match.myPlayerId : null,
    ));
  }, [match, selectablePayerIds]);

  useEffect(() => {
    if (!deadline || paymentExpired || !hasPendingPayments || isPaymentReviewPaused) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [deadline, hasPendingPayments, isPaymentReviewPaused, paymentExpired]);

  useEffect(() => {
    if (!token || !match || !selectedKey || hasInvalidSelection || paymentExpired) {
      setPreview(null);
      return undefined;
    }
    let cancelled = false;
    setPreview(null);
    void previewBatchPayment(token, bookingId, selectedKey.split(',').map(Number))
      .then((value) => {
        if (cancelled) return;
        setPreview(value);
        setError('');
      })
      .catch((reason) => {
        if (cancelled) return;
        if (redirectToPhoneProfile(reason)) return;
        setError(reason instanceof Error ? reason.message : 'Không thể tạo mã thanh toán.');
        if (reason instanceof ApiError && reason.status === 409) void loadMatch();
      });
    return () => { cancelled = true; };
  }, [bookingId, hasInvalidSelection, paymentExpired, selectedKey, token]);

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

  // Mirrors the polling already used on the other checkout screens: while a teammate's
  // payment is still outstanding, actively re-check every few seconds instead of waiting
  // solely on the realtime push (the backend opportunistically reconciles with SePay on
  // this same call, see MatchService.ReconcilePendingMatchPaymentsAsync).
  useVisiblePolling(
    () => loadMatch(true),
    7_500,
    Boolean(match && !isSubmitting && (hasPendingPayments || hasReceiptAwaitingReview)),
  );

  const copyContent = async () => {
    if (!preview?.transferContent) return;
    await navigator.clipboard.writeText(preview.transferContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1_500);
  };

  const requestSponsorship = async (targetPlayerId: number) => {
    if (!token) return;
    setSponsorshipActionPlayerId(targetPlayerId);
    setError('');
    try {
      await requestPaymentSponsorship(token, bookingId, targetPlayerId);
      await loadMatch();
    } catch (reason) {
      if (redirectToPhoneProfile(reason)) return;
      setError(reason instanceof ApiError ? reason.message : 'Không thể gửi yêu cầu trả hộ.');
      if (reason instanceof ApiError && reason.status === 409) await loadMatch();
    } finally {
      setSponsorshipActionPlayerId(null);
    }
  };

  const respondSponsorship = async (accept: boolean) => {
    if (!token || !myPayment?.paymentSponsorshipRequestedByPlayerId) return;
    setSponsorshipActionPlayerId(myPayment.playerId);
    setError('');
    try {
      await respondPaymentSponsorship(token, bookingId, accept);
      await loadMatch();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Không thể phản hồi yêu cầu trả hộ.');
      if (reason instanceof ApiError && reason.status === 409) await loadMatch();
    } finally {
      setSponsorshipActionPlayerId(null);
    }
  };

  const submit = async () => {
    if (!token || !receipt || !preview || !selectedPayerIds.length || paymentExpired) {
      setError('Vui lòng chọn thành viên và ảnh biên lai trước khi gửi.');
      return;
    }
    if (!(await confirm({
      title: `Gửi biên lai cho ${selectedPayerIds.length} thành viên đã chọn?`,
      message: 'Chủ sân sẽ đối chiếu biên lai với giao dịch nhận được rồi xác nhận.',
      confirmLabel: 'Gửi biên lai',
      tone: 'success',
    }))) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    setError('');
    try {
      await submitBatchBankTransfer(token, bookingId, selectedPayerIds, receipt, setUploadProgress);
      setReceipt(null);
      await loadMatch();
    } catch (reason) {
      if (redirectToPhoneProfile(reason)) return;
      setError(reason instanceof ApiError ? reason.message : 'Không thể gửi xác nhận thanh toán.');
      if (reason instanceof ApiError && reason.status === 409) await loadMatch();
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  };

  if (!match) {
    return <div className="grid min-h-dvh place-items-center bg-[#f8fbf4] p-4"><div className="rounded-2xl border border-[#dbe8d3] bg-white p-6 text-center">{error ? <p className="font-bold text-error">{error}</p> : <><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#477313]" /><p className="mt-3 font-bold">Đang tải thanh toán ghép trận...</p></>}</div></div>;
  }

  return (
    <div className="min-h-dvh overflow-x-clip bg-[#f8fbf4] p-4 text-[#0b2228] sm:p-6 lg:p-8">
      <main className="mx-auto w-full max-w-[1180px]">
        <header className="grid gap-4 rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
          <div>
            <HistoryBackLink className="inline-flex items-center gap-2 rounded-xl border border-[#dbe8d3] px-3 py-2 text-[13px] font-bold text-[#477313] hover:bg-[#eef8e6]" fallback={`/matches/${matchId}`}><ArrowLeft className="h-4 w-4" /> Quay lại phòng ghép trận</HistoryBackLink>
            <h1 className="mt-3 text-[clamp(1.55rem,2.7vw,2.25rem)] font-extrabold tracking-[-0.035em]">Thanh toán booking ghép trận</h1>
            <p className="mt-1 text-[13px] font-semibold text-[#66766d]">Booking #{bookingId} · {match.title}</p>
          </div>
          <div className="rounded-2xl bg-[#0b2228] px-5 py-3 text-white md:text-right"><p className="text-[12px] font-bold text-white/70">Thời gian giữ chỗ</p><p className="font-mono text-[26px] font-black leading-none text-[#e2ff57]">{deadline ? countdown : '--:--'}</p><p className="mt-1 text-[12px] font-bold text-white/80">{hasRefundPending ? 'Đang chờ hoàn tiền' : paymentExpired ? 'Đã hết hạn' : isPaymentReviewPaused ? 'Tạm dừng khi owner duyệt' : hasPendingPayments ? 'Chờ các phần còn lại thanh toán' : isAwaitingReceiptReview ? 'Đang chờ duyệt biên lai' : 'Chờ thanh toán'}</p></div>
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
            {paymentExpired ? <div className="grid min-h-80 place-items-center text-center"><AlertCircle className="h-14 w-14 text-error" /><div><h2 className="mt-4 text-xl font-extrabold">{hasRefundPending ? 'Booking đã hủy vì thiếu thanh toán' : 'Thời gian thanh toán đã hết'}</h2><p className="mt-2 text-[#66766d]">{hasRefundPending ? 'Các khoản đã chuyển được đánh dấu chờ hoàn tiền. Thành viên chưa thanh toán đã bị đưa khỏi phòng.' : 'Quay lại phòng ghép trận để tạo booking mới.'}</p></div></div> : (
              <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
                <div>
                  <div className="flex items-center gap-2"><Users className="h-5 w-5 text-[#477313]" /><h2 className="text-lg font-extrabold">Chọn phần cần thanh toán</h2></div>
                  <p className="mt-1 text-[13px] text-[#66766d]">Phần của bạn được chọn tự động. Muốn trả hộ người khác, hãy gửi yêu cầu và chỉ thanh toán sau khi họ đồng ý.</p>
                  {myPayment?.paymentStatus === 'Pending' && myPayment.paymentSponsorshipRequestedByPlayerId && (
                    <div className="mt-3 rounded-xl border border-[#b9cbb0] bg-[#f3f9ed] p-3">
                      <p className="text-[13px] font-extrabold">{incomingSponsorshipRequester?.playerName ?? 'Một thành viên'} muốn trả hộ phần của bạn</p>
                      <p className="mt-1 text-[11px] text-[#66766d]">Nếu đồng ý, phần này sẽ chỉ được thanh toán bởi người gửi yêu cầu.</p>
                      <div className="mt-3 flex gap-2">
                        <button className="rounded-lg bg-[#0b2228] px-3 py-2 text-[12px] font-black text-white disabled:opacity-60" disabled={sponsorshipActionPlayerId !== null || isSubmitting} onClick={() => void respondSponsorship(true)} type="button">Đồng ý</button>
                        <button className="rounded-lg border border-[#b9cbb0] bg-white px-3 py-2 text-[12px] font-black text-[#66766d] disabled:opacity-60" disabled={sponsorshipActionPlayerId !== null || isSubmitting} onClick={() => void respondSponsorship(false)} type="button">Từ chối</button>
                      </div>
                    </div>
                  )}
                  <div className="mt-4 space-y-2">
                    {paymentTargets.map((participant) => {
                      const isCurrentPayer = participant.playerId === match.myPlayerId;
                      const acceptedSponsorId = participant.allowPaymentByOthers ? participant.paymentClaimedByPlayerId : null;
                      const claimedBy = acceptedSponsorId ?? activeClaimedBy(participant.paymentClaimedByPlayerId, participant.paymentClaimExpiresAt, now);
                      const claimedByMe = claimedBy === match.myPlayerId;
                      const claimedByOther = Boolean(claimedBy && !claimedByMe);
                      const requestPendingByMe = participant.paymentSponsorshipRequestedByPlayerId === match.myPlayerId;
                      const requestPending = Boolean(participant.paymentSponsorshipRequestedByPlayerId);
                      const canSelect = selectablePayerIds.has(participant.playerId);
                      const isAutoSelected = canSelect && isCurrentPayer;
                      const isSelected = selectedPayerIds.includes(participant.playerId);
                      const canRequestSponsorship = !isCurrentPayer
                        && participant.paymentStatus === 'Pending'
                        && !acceptedSponsorId
                        && !requestPending
                        && !claimedBy;
                      const paymentState = participant.paymentStatus !== 'Pending'
                        ? participant.paymentStatus
                        : acceptedSponsorId === match.myPlayerId
                          ? 'Đã đồng ý để bạn trả hộ'
                          : acceptedSponsorId
                            ? 'Đã giao phần thanh toán cho thành viên khác'
                            : requestPendingByMe
                              ? 'Đang chờ thành viên đồng ý'
                              : requestPending
                                ? isCurrentPayer ? 'Đang chờ bạn phản hồi yêu cầu trả hộ' : 'Đang xem một yêu cầu trả hộ khác'
                                : claimedByMe
                          ? isCurrentPayer ? 'Bạn đang thanh toán' : 'Bạn đang trả hộ'
                          : claimedByOther
                            ? claimedBy === participant.playerId ? 'Đang tự thanh toán' : 'Đang được thành viên khác thanh toán'
                            : isCurrentPayer
                              ? 'Chờ bạn thanh toán'
                              : 'Có thể gửi yêu cầu trả hộ';

                      return (
                        <div className={`flex items-center gap-3 rounded-xl border p-3 ${isSelected ? 'border-primary bg-[#eef8e6]' : 'border-[#dbe8d3]'} ${canSelect || canRequestSponsorship ? '' : 'opacity-75'}`} key={participant.playerId}>
                          <label className={`flex min-w-0 flex-1 items-center gap-3 ${canSelect && !isAutoSelected ? 'cursor-pointer' : ''}`}>
                            <input checked={isSelected} className="h-4 w-4 accent-primary" disabled={!canSelect || isAutoSelected || isSubmitting} onChange={(event) => setSelectedPayerIds((current) => event.target.checked ? [...current, participant.playerId] : current.filter((id) => id !== participant.playerId))} type="checkbox" />
                            <span className="min-w-0 flex-1">
                              <strong className="flex flex-wrap items-center gap-2 text-[13px]">
                                {participant.playerName}
                                {isCurrentPayer && <span className="rounded-full bg-[#dff4cf] px-2 py-0.5 text-[10px] font-black text-[#477313]">{isAutoSelected ? 'Bạn · Tự động' : 'Bạn'}</span>}
                                {!isCurrentPayer && acceptedSponsorId === match.myPlayerId && <span className="rounded-full bg-[#e7f0ff] px-2 py-0.5 text-[10px] font-black text-[#315c9a]">Đã đồng ý trả hộ</span>}
                              </strong>
                              <span className="text-[12px] text-[#66766d]">{currency.format(participant.paymentAmount ?? match.amountPerPlayer)} · {paymentState}</span>
                            </span>
                          </label>
                          {!isCurrentPayer && participant.paymentStatus === 'Pending' && !acceptedSponsorId && (
                            <button className="shrink-0 rounded-lg border border-[#b9cbb0] bg-white px-3 py-2 text-[11px] font-black text-[#477313] disabled:cursor-not-allowed disabled:opacity-60" disabled={!canRequestSponsorship || requestPendingByMe || sponsorshipActionPlayerId !== null || isSubmitting} onClick={() => void requestSponsorship(participant.playerId)} type="button">{sponsorshipActionPlayerId === participant.playerId ? 'Đang gửi...' : requestPendingByMe ? 'Đã gửi yêu cầu' : requestPending ? 'Đang có yêu cầu' : 'Yêu cầu trả hộ'}</button>
                          )}
                        </div>
                      );
                    })}
                    {!paymentTargets.length && <p className="rounded-xl bg-[#f8fbf4] p-4 text-center text-[13px] font-bold text-[#66766d]">Không có khoản thanh toán nào.</p>}
                  </div>
                </div>

                <div className="rounded-2xl bg-[#f8fbf4] p-4 text-center">
                  {!selectedPayerIds.length ? <p className="pt-12 text-[13px] font-bold text-[#66766d]">Chọn ít nhất một thành viên để tạo mã QR.</p> : !preview ? <div className="pt-12"><Loader2 className="mx-auto h-7 w-7 animate-spin text-[#477313]" /><p className="mt-3 text-[13px] font-bold">Đang tạo mã QR...</p></div> : <>
                    <p className="text-[12px] font-black text-[#477313]">Thanh toán cho {preview.memberNames.join(', ')}</p>
                    <img alt="QR thanh toán ghép trận" className="mx-auto mt-3 w-full max-w-[250px] rounded-xl border border-[#dbe8d3] bg-white" src={preview.qrImageUrl} />
                    <p className="mt-3 text-[12px] font-bold text-[#66766d]">Tổng chuyển khoản</p><strong className="mt-1 block text-2xl font-black">{currency.format(preview.totalAmount)}</strong>
                    <div className="mt-3 rounded-xl border-2 border-[#e2ff57] bg-white p-3 text-left"><p className="text-[11px] font-bold text-[#477313]">Nội dung chuyển khoản</p><code className="mt-1 block break-all text-[13px] font-black">{preview.transferContent}</code><button className="mt-2 inline-flex items-center gap-1 text-[12px] font-bold text-[#477313]" onClick={() => void copyContent()} type="button"><Clipboard className="h-4 w-4" />{copied ? 'Đã sao chép' : 'Sao chép'}</button></div>
                  </>}
                </div>
              </div>
            )}

            {!paymentExpired && preview && (
              <div className="mt-5 border-t border-dashed border-[#dbe8d3] pt-5">
                <label className="block cursor-pointer rounded-xl border-2 border-dashed border-[#dbe8d3] bg-[#f8fbf4] p-4 text-center hover:border-primary">
                  <Upload className="mx-auto h-6 w-6 text-[#477313]" />
                  <span className="mt-2 block text-[13px] font-bold">{receipt ? receipt.name : 'Tải ảnh biên lai chuyển khoản'}</span>
                  <span className="mt-1 block text-[12px] text-[#66766d]">JPG, PNG hoặc WEBP · tối đa 12 MB</span>
                  <input accept="image/jpeg,image/png,image/webp" className="hidden" disabled={isSubmitting} onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" />
                </label>

                {uploadProgress !== null && isSubmitting && (
                  <div className="mt-3 rounded-xl border border-[#dbe8d3] bg-[#f8fbf4] p-3">
                    <div className="flex items-center justify-between text-[12px] font-bold text-[#477313]">
                      <span>Đang tải ảnh biên lai lên Cloud...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#dbe8d3]">
                      <div
                        className="h-full bg-[#477313] transition-all duration-200"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {receiptPreview && <img alt="Xem trước biên lai" className="mx-auto mt-4 max-h-56 rounded-xl border border-[#dbe8d3] object-contain" src={receiptPreview} />}

                <button aria-busy={isSubmitting} className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#e2ff57] text-[14px] font-black text-[#102414] hover:bg-[#d6f64d] disabled:cursor-not-allowed disabled:opacity-60" disabled={!receipt || isSubmitting} onClick={() => void submit()} type="button">
                  <ShieldCheck className="h-5 w-5" />
                  {isSubmitting ? (uploadProgress !== null ? `Đang tải ảnh (${uploadProgress}%)...` : 'Đang gửi biên lai...') : `Gửi thanh toán cho ${selectedPayerIds.length} người`}
                </button>
              </div>
            )}
          </section>

          <aside className="h-fit rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)] lg:sticky lg:top-4"><h2 className="flex items-center gap-2 text-lg font-extrabold"><ReceiptText className="h-5 w-5 text-[#477313]" /> Thông tin booking</h2><div className="mt-4 space-y-4 text-[13px]"><div className="flex gap-3"><MapPin className="h-5 w-5 shrink-0 text-[#477313]" /><div><strong>{match.venueName}</strong><p className="mt-1 text-[#66766d]">{match.address}</p></div></div><div className="flex gap-3"><Clock className="h-5 w-5 shrink-0 text-[#477313]" /><div>{bookingGroups.map((group) => <p className="mt-1 text-[#66766d]" key={group.bookingCheckInGroupId}>Sân {group.courtNumber}: {slotDateText(group.startTime)} · {timeText(group.startTime)} - {timeText(group.endTime)}</p>)}</div></div></div><div className="my-4 border-t border-dashed border-[#dbe8d3]" /><div className="space-y-2 text-[14px]"><div className="flex justify-between gap-3"><span>Phần mỗi người</span><strong>{currency.format(match.amountPerPlayer)}</strong></div><div className="flex justify-between gap-3"><span>Tổng booking</span><strong>{currency.format(match.totalBookingAmount)}</strong></div></div>{preview && <div className="mt-4 rounded-2xl bg-[#0b2228] p-4 text-white"><p className="text-[12px] font-bold text-white/70">Tổng thanh toán đã chọn</p><strong className="mt-1 block text-2xl font-black text-[#e2ff57]">{currency.format(preview.totalAmount)}</strong></div>}</aside>
        </div>
      </main>
    </div>
  );
};
