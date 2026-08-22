import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  ExternalLink,
  History,
  ImageUp,
  Mail,
  MapPin,
  ReceiptText,
  ShieldCheck,
  UserRound,
  XCircle,
} from 'lucide-react';
import { getOwnerBooking, submitOwnerBookingRefundProof, updateOwnerBookingStatus, type OwnerBookingRecord } from '../../api/owner';
import { getRefundProofObjectUrl } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { useApiQuery } from '../../hooks/useApiQuery';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { OwnerShell } from './components/OwnerShell';
import { OwnerBackLink } from './components/OwnerBackLink';
import { useConfirm } from '../../components/ui/ConfirmDialogRegion';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = (value?: string | null) => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
  : '-';
const time = (value: string) => new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));

const statusLabel: Record<string, string> = {
  Holding: 'Đang giữ chỗ', Confirmed: 'Đã xác nhận', Cancelled: 'Đã hủy', Expired: 'Đã hết hạn',
  Pending: 'Chờ thanh toán', WaitingForConfirmation: 'Chờ duyệt thanh toán', Paid: 'Đã thanh toán',
  Ready: 'Sẵn sàng check-in', NotOpen: 'Chưa mở check-in', CheckedIn: 'Đã check-in', NoShow: 'Vắng mặt',
  PartiallyCheckedIn: 'Đã check-in một phần',
};
const statusClass = (status: string) => {
  if (status === 'Confirmed' || status === 'Paid' || status === 'CheckedIn') return 'bg-green-100 text-green-700';
  if (status === 'Cancelled' || status === 'Expired') return 'bg-red-100 text-red-700';
  if (status === 'NoShow' || status === 'Pending' || status === 'WaitingForConfirmation' || status === 'Holding') return 'bg-amber-100 text-amber-700';
  return 'bg-slate-100 text-slate-600';
};

type TimelineEvent = { label: string; detail: string; actor?: string | null; at: string };

export const OwnerBookingDetail = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const confirm = useConfirm();
  const bookingId = Number(id);
  const [isBusy, setIsBusy] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [refundReference, setRefundReference] = useState('');
  const [refundProof, setRefundProof] = useState<File | null>(null);
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');

  const hasValidId = Boolean(token) && Number.isInteger(bookingId) && bookingId > 0;
  const { data: booking = null, error: loadError, loading: isLoading, refresh: load } = useApiQuery(
    ['owner-booking-detail', token, bookingId],
    () => getOwnerBooking(token!, bookingId),
    { enabled: hasValidId, errorMessage: 'Không thể tải chi tiết booking.' },
  );

  const error = actionError || (hasValidId ? loadError : 'Mã booking không hợp lệ.');
  const setError = setActionError;

  useScheduleRealtime((event) => {
    if (booking && event.venueId === booking.venueId && event.courtId === booking.courtId) void load();
  });
  usePaymentRealtime((event) => {
    if (event.bookingId === bookingId) void load();
  });

  const timeline = useMemo<TimelineEvent[]>(() => {
    if (!booking) return [];
    const events: TimelineEvent[] = [
      { label: 'Player tạo booking', detail: `Mã ${booking.bookingCode}`, actor: booking.playerName, at: booking.createdAt },
      ...booking.bookingHistory.map((item) => ({
        label: `Booking → ${statusLabel[item.toStatus] ?? item.toStatus}`,
        detail: item.reason || 'Cập nhật trạng thái booking', actor: item.actorName, at: item.changedAt,
      })),
      ...booking.paymentHistory.map((item) => ({
        label: `Thanh toán → ${statusLabel[item.toStatus] ?? item.toStatus}`,
        detail: item.reason || item.action, actor: item.actorName, at: item.createdAt,
      })),
    ];
    if (booking.codeVerifiedAt) events.push({ label: 'Đã xác minh mã booking', detail: 'Mã hợp lệ tại đúng cụm sân', actor: booking.codeVerifiedBy, at: booking.codeVerifiedAt });
    if (booking.paymentConfirmedAt) events.push({ label: 'Đã thu tiền tại sân', detail: 'Staff xác nhận thanh toán tại quầy', actor: booking.paymentConfirmedBy, at: booking.paymentConfirmedAt });
    if (booking.checkedInAt) events.push({ label: 'Player đã check-in', detail: 'Bàn giao sân thành công', actor: booking.checkedInBy, at: booking.checkedInAt });
    if (booking.noShowAt) events.push({ label: 'Đánh dấu no-show', detail: 'Player không đến sân đúng thời gian', actor: booking.noShowBy, at: booking.noShowAt });
    return events.sort((left, right) => new Date(left.at).getTime() - new Date(right.at).getTime());
  }, [booking]);

  const updateStatus = async (status: 'Confirmed' | 'Cancelled') => {
    if (!token || !booking) return;
    const message = status === 'Confirmed'
      ? `Xác nhận booking ${booking.bookingCode}?` : `Từ chối/hủy booking ${booking.bookingCode}?`;
    if (!(await confirm({
      title: message,
      message: status === 'Confirmed'
        ? 'Người chơi sẽ nhận thông báo booking đã được xác nhận.'
        : booking.paymentStatus === 'Paid'
          ? 'Khoản đã thanh toán sẽ chuyển sang chờ hoàn tiền và người chơi nhận được thông báo kèm lý do.'
          : 'Slot sẽ được trả về trạng thái trống và người chơi nhận được thông báo kèm lý do.',
      confirmLabel: status === 'Confirmed' ? 'Xác nhận booking' : 'Hủy booking',
      tone: status === 'Confirmed' ? 'success' : 'danger',
    }))) return;
    setIsBusy(true); setError(''); setSuccess('');
    try {
      await updateOwnerBookingStatus(token, booking.bookingId, status, cancelReason.trim() || undefined);
      setSuccess(status === 'Confirmed' ? 'Đã xác nhận booking.' : 'Đã hủy booking.');
      setCancelReason('');
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể cập nhật booking.');
    } finally { setIsBusy(false); }
  };

  const markRefunded = async () => {
    if (!token || !booking) return;
    if (!refundProof) {
      setError('Vui lòng chọn ảnh minh chứng chuyển khoản hoàn tiền.');
      return;
    }
    if (!(await confirm({
      title: `Gửi minh chứng hoàn tiền booking ${booking.bookingCode}?`,
      message: 'Player sẽ xem ảnh này để xác nhận đã nhận tiền hoặc gửi khiếu nại.',
      confirmLabel: 'Gửi minh chứng',
      tone: 'success',
    }))) return;
    setIsBusy(true); setError(''); setSuccess('');
    try {
      await submitOwnerBookingRefundProof(token, booking.bookingId, refundProof, refundReference.trim() || undefined);
      setSuccess('Đã gửi minh chứng cho player kiểm tra.');
      setRefundReference('');
      setRefundProof(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể đánh dấu hoàn tiền.');
    } finally { setIsBusy(false); }
  };

  const viewRefundProof = async () => {
    if (!token || !booking?.paymentId) return;
    try {
      const objectUrl = await getRefundProofObjectUrl(token, booking.paymentId);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải ảnh minh chứng.');
    }
  };

  if (isLoading) return <OwnerShell activeId="bookings"><div className="owner-panel p-10 text-center font-bold text-on-surface-variant">Đang tải chi tiết booking...</div></OwnerShell>;
  if (!booking) return <OwnerShell activeId="bookings"><div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700"><AlertCircle className="mx-auto h-7 w-7" /><p className="mt-3 font-bold">{error || 'Không tìm thấy booking.'}</p><OwnerBackLink className="mt-4 inline-flex font-bold underline" fallback="/owner/bookings">Quay lại danh sách</OwnerBackLink></div></OwnerShell>;

  const serviceFee = Math.max(0, booking.totalAmount - booking.courtAmount);
  const bookingSlots = booking.slots.length ? booking.slots : [{ bookingSlotId: booking.bookingId, courtId: booking.courtId, courtNumber: booking.courtNumber, startTime: booking.startTime, endTime: booking.endTime, courtAmount: booking.courtAmount }];
  const courts = Array.from(new Set(bookingSlots.map((slot) => `Sân ${slot.courtNumber}`))).join(', ');
  const playTime = bookingSlots.map((slot) => `Sân ${slot.courtNumber}: ${time(slot.startTime)} - ${time(slot.endTime)}`).join(' · ');
  const playerLocation = [booking.playerCommune, booking.playerCity].filter(Boolean).join(', ') || 'Chưa cập nhật';
  // Đơn đã thanh toán hủy được, khoản đã thu chuyển sang chờ hoàn tiền.
  const canCancel = booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Expired';
  const isRefundPending = booking.paymentStatus === 'RefundPending';

  return (
    <OwnerShell activeId="bookings">
      <section className="owner-page-header flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div><OwnerBackLink className="inline-flex items-center gap-2 text-[13px] font-bold text-primary hover:underline" fallback="/owner/bookings"><ArrowLeft className="h-4 w-4" /> Quay lại danh sách</OwnerBackLink><h1 className="mt-3 font-bold">Chi tiết booking của Player</h1><p className="mt-2 text-[14px] text-on-surface-variant">Thông tin được lấy trực tiếp từ booking thuộc cụm sân của bạn.</p></div>
        <div className="flex flex-wrap gap-2">{booking.bookingStatus === 'Holding' && <button className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-50" disabled={isBusy} onClick={() => void updateStatus('Confirmed')} type="button">Xác nhận booking</button>}{canCancel && <button className="rounded-lg border border-red-200 px-4 py-2.5 text-[13px] font-bold text-red-600 disabled:opacity-50" disabled={isBusy || !cancelReason.trim()} onClick={() => void updateStatus('Cancelled')} title={cancelReason.trim() ? undefined : 'Nhập lý do hủy trước'} type="button">Từ chối / Hủy</button>}</div>
        {canCancel && (
          <label className="w-full text-[12px] font-bold text-on-surface-variant lg:max-w-md">
            Lý do hủy {booking.paymentStatus === 'Paid' && <span className="text-amber-700">· đơn đã thanh toán, hủy xong phải hoàn tiền</span>}
            <textarea className="mt-1 h-14 w-full resize-none rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-normal text-on-surface" maxLength={500} onChange={(event) => setCancelReason(event.target.value)} placeholder="Bắt buộc khi hủy, sẽ gửi cho người chơi" value={cancelReason} />
          </label>
        )}
        {isRefundPending && (
          <div className="w-full rounded-lg border border-amber-300 bg-amber-50 p-3 lg:max-w-md">
            <p className="text-[13px] font-bold text-amber-900">
              {booking.refundProofSubmittedAt ? 'Đã gửi minh chứng · Chờ player phản hồi' : 'Booking đã hủy, còn nợ khách khoản đã thanh toán.'}
            </p>
            {booking.refundDisputeStatus === 'Open' && (
              <p className="mt-2 rounded-md border border-red-200 bg-red-50 px-2.5 py-2 text-[12px] font-bold text-red-700">
                Player khiếu nại: {booking.refundDisputeReason}
              </p>
            )}
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-amber-400 bg-white px-3 py-2 text-[12px] font-bold text-amber-900">
                <ImageUp className="h-4 w-4" />
                <span className="truncate">{refundProof?.name ?? 'Chọn ảnh minh chứng'}</span>
                <input accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => setRefundProof(event.target.files?.[0] ?? null)} type="file" />
              </label>
              <input aria-label="Tham chiếu chuyển khoản hoàn tiền" className="min-w-[160px] flex-1 rounded-lg border border-outline-variant px-3 py-2 text-[13px]" maxLength={200} onChange={(event) => setRefundReference(event.target.value)} placeholder="Mã giao dịch hoàn tiền (không bắt buộc)" value={refundReference} />
              <button className="rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={isBusy || !refundProof} onClick={() => void markRefunded()} type="button">{booking.refundProofSubmittedAt ? 'Cập nhật minh chứng' : 'Gửi minh chứng'}</button>
              {booking.refundProofImageUrl && booking.paymentId && (
                <button className="rounded-lg border border-amber-400 bg-white px-4 py-2 text-[13px] font-bold text-amber-900" onClick={() => void viewRefundProof()} type="button">Xem ảnh đã gửi</button>
              )}
            </div>
          </div>
        )}
      </section>

      {(error || success) && <div className={`rounded-lg border px-4 py-3 text-[13px] font-bold ${error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'}`}>{error || success}</div>}

      <section className="owner-panel overflow-hidden">
        <div className="bg-primary p-6 text-white"><p className="text-[11px] font-bold uppercase text-white/70">Mã booking</p><div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><h2 className="text-[30px] font-bold">{booking.bookingCode}</h2><div className="flex flex-wrap gap-2">{[booking.bookingStatus, booking.paymentStatus, booking.checkInStatus].map((status) => <span className="rounded-full bg-white/15 px-3 py-1.5 text-[11px] font-bold" key={status}>{statusLabel[status] ?? status}</span>)}</div></div></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-4">{[
          { icon: CalendarDays, label: 'Ngày chơi', value: dateTime(bookingSlots[0].startTime) },
          { icon: Clock3, label: 'Khung giờ', value: playTime },
          { icon: MapPin, label: 'Sân', value: `${booking.venueName} · ${courts}` },
          { icon: ReceiptText, label: 'Tổng tiền', value: currency.format(booking.totalAmount) },
        ].map((item) => <div className="rounded-lg bg-surface-container-low p-4" key={item.label}><item.icon className="h-5 w-5 text-primary" /><p className="mt-3 text-[11px] font-bold uppercase text-on-surface-variant">{item.label}</p><p className="mt-1 text-[14px] font-bold">{item.value}</p></div>)}</div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-6">
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-[18px] font-bold"><UserRound className="h-5 w-5 text-primary" /> Thông tin Player</h2><div className="mt-4 space-y-3">{[
              { label: 'Tên tài khoản', value: booking.playerName },
              { label: 'Email', value: booking.playerEmail || 'Chưa cập nhật' },
              { label: 'Khu vực', value: playerLocation },
            ].map((item) => <div className="rounded-lg bg-surface-container-low p-3" key={item.label}><p className="text-[11px] font-bold uppercase text-on-surface-variant">{item.label}</p><p className="mt-1 break-words text-[13px] font-bold">{item.value}</p></div>)}</div>{booking.playerEmail && <a className="mt-4 inline-flex items-center gap-2 text-[13px] font-bold text-primary" href={`mailto:${booking.playerEmail}`}><Mail className="h-4 w-4" /> Gửi email cho Player</a>}</div>
            <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-[18px] font-bold"><MapPin className="h-5 w-5 text-primary" /> Thông tin sân</h2><div className="mt-4 space-y-3"><div className="rounded-lg bg-surface-container-low p-3"><p className="text-[11px] font-bold uppercase text-on-surface-variant">Cụm sân</p><p className="mt-1 text-[13px] font-bold">{booking.venueName}</p></div><div className="rounded-lg bg-surface-container-low p-3"><p className="text-[11px] font-bold uppercase text-on-surface-variant">Sân con</p><p className="mt-1 text-[13px] font-bold">{courts}</p></div><div className="rounded-lg bg-surface-container-low p-3"><p className="text-[11px] font-bold uppercase text-on-surface-variant">Địa chỉ</p><p className="mt-1 text-[13px] font-bold">{booking.address}</p></div></div></div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 text-[18px] font-bold"><CalendarDays className="h-5 w-5 text-primary" /> Sân con và trạng thái check-in</h2>
            <div className="mt-4 space-y-3">
              {booking.slots.map((slot) => (
                <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-container-low p-3" key={slot.bookingSlotId}>
                  <span className="text-[13px] font-bold">Sân {slot.courtNumber}</span>
                  <span className="text-[12px] text-on-surface-variant">{time(slot.startTime)} - {time(slot.endTime)}</span>
                </div>
              ))}
            </div>
            {booking.checkInGroups.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-outline-variant pt-4">
                {booking.checkInGroups.map((group) => (
                  <div className="flex items-center justify-between gap-3 text-[12px]" key={group.bookingCheckInGroupId}>
                    <span>Sân {group.courtNumber}: {time(group.startTime)} - {time(group.endTime)}</span>
                    <span className="font-bold text-primary">{statusLabel[group.checkInStatus] ?? group.checkInStatus}</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-[18px] font-bold"><History className="h-5 w-5 text-primary" /> Lịch sử booking</h2><div className="mt-5 space-y-4">{timeline.map((item, index) => <div className="grid grid-cols-[28px_1fr] gap-3" key={`${item.label}-${item.at}-${index}`}><div className="flex flex-col items-center"><span className="mt-1 h-3 w-3 rounded-full bg-primary" />{index < timeline.length - 1 && <span className="mt-1 h-full min-h-10 w-px bg-outline-variant" />}</div><div className="pb-2"><p className="text-[13px] font-bold">{item.label}</p><p className="mt-1 text-[12px] text-on-surface-variant">{item.detail}</p><p className="mt-1 text-[11px] font-bold text-on-surface-variant">{dateTime(item.at)}{item.actor ? ` · ${item.actor}` : ''}</p></div></div>)}</div></section>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-[18px] font-bold"><CreditCard className="h-5 w-5 text-primary" /> Thanh toán</h2><div className="mt-4 space-y-3 text-[13px]">{[
            { label: 'Tiền sân', value: currency.format(booking.courtAmount) },
            { label: 'Phí dịch vụ', value: currency.format(serviceFee) },
            { label: 'Phương thức', value: booking.paymentMethod === 'AtCourt' ? 'Tại sân' : booking.paymentMethod || 'Chưa chọn' },
            { label: 'Trạng thái', value: statusLabel[booking.paymentStatus] ?? booking.paymentStatus },
            { label: 'Đã thanh toán lúc', value: dateTime(booking.paymentPaidAt) },
          ].map((item) => <div className="flex justify-between gap-4" key={item.label}><span className="text-on-surface-variant">{item.label}</span><span className="text-right font-bold">{item.value}</span></div>)}<div className="border-t border-outline-variant pt-3"><div className="flex items-center justify-between"><span className="font-bold">Tổng cộng</span><span className="text-[20px] font-bold text-primary">{currency.format(booking.totalAmount)}</span></div></div></div>{booking.transferCode && <p className="mt-4 rounded-lg bg-surface-container-low p-3 text-[12px]"><span className="text-on-surface-variant">Mã giao dịch:</span> <strong>{booking.transferCode}</strong></p>}{booking.rejectionReason && <p className="mt-3 rounded-lg bg-red-50 p-3 text-[12px] font-bold text-red-700">{booking.rejectionReason}</p>}{booking.receiptImageUrl && <a className="mt-4 inline-flex items-center gap-2 text-[13px] font-bold text-primary" href={booking.receiptImageUrl} rel="noreferrer" target="_blank"><ExternalLink className="h-4 w-4" /> Xem biên lai</a>}</section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h2 className="flex items-center gap-2 text-[18px] font-bold"><ShieldCheck className="h-5 w-5 text-primary" /> Vận hành tại sân</h2><div className="mt-4 space-y-3">{[
            { label: 'Xác minh mã', status: booking.codeVerifiedAt ? 'Đã hoàn tất' : 'Chưa thực hiện', actor: booking.codeVerifiedBy, at: booking.codeVerifiedAt, icon: CheckCircle2 },
            { label: 'Thu tiền tại sân', status: booking.paymentConfirmedAt ? 'Đã hoàn tất' : 'Không có/Chưa thực hiện', actor: booking.paymentConfirmedBy, at: booking.paymentConfirmedAt, icon: Banknote },
            { label: booking.noShowAt ? 'No-show' : 'Check-in', status: statusLabel[booking.checkInStatus] ?? booking.checkInStatus, actor: booking.checkedInBy || booking.noShowBy, at: booking.checkedInAt || booking.noShowAt, icon: booking.noShowAt ? XCircle : ShieldCheck },
          ].map((item) => <div className="flex gap-3 rounded-lg bg-surface-container-low p-3" key={item.label}><item.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div><p className="text-[12px] font-bold">{item.label}: {item.status}</p><p className="mt-1 text-[11px] text-on-surface-variant">{item.actor || '-'} · {dateTime(item.at)}</p></div></div>)}</div></section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm"><h2 className="text-[18px] font-bold">Trạng thái hiện tại</h2><div className="mt-4 flex flex-wrap gap-2">{[booking.bookingStatus, booking.paymentStatus, booking.checkInStatus].map((status) => <span className={`rounded-full px-3 py-1.5 text-[11px] font-bold ${statusClass(status)}`} key={status}>{statusLabel[status] ?? status}</span>)}</div></section>
        </aside>
      </section>
    </OwnerShell>
  );
};
