import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, Ban, CalendarCheck, CreditCard, ExternalLink, Loader2, Search } from 'lucide-react';
import {
  cancelAdminBooking,
  listAdminBookings,
  resolveAdminRefundDispute,
  type AdminBookingSummary,
} from '../../api/adminBookings';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { useToast } from '../../components/ui/ToastRegion';
import { useApiQuery } from '../../hooks/useApiQuery';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { StatusBadge } from './components/StatusBadge';
import type { Tone } from './types';
import { useConfirm, usePrompt } from '../../components/ui/ConfirmDialogRegion';

const PAGE_SIZE = 12;
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const inputClass = 'h-9 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
const outlineButton = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';
const cancellableStatuses = ['Holding', 'Confirmed'];

const emptyPage: PaginatedResponse<AdminBookingSummary> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

const bookingStatuses = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đã giữ chỗ', value: 'Holding' },
  { label: 'Đã xác nhận', value: 'Confirmed' },
  { label: 'Hoàn tất', value: 'Completed' },
  { label: 'Đã hủy', value: 'Cancelled' },
  { label: 'Hết hạn', value: 'Expired' },
];

const paymentStatuses = [
  { label: 'Mọi thanh toán', value: 'all' },
  { label: 'Chờ thanh toán', value: 'Pending' },
  { label: 'Chờ owner xác nhận', value: 'WaitingForConfirmation' },
  { label: 'Đã thanh toán', value: 'Paid' },
  { label: 'Đã xác nhận', value: 'Verified' },
  { label: 'Bị từ chối', value: 'Rejected' },
  { label: 'Đang khiếu nại hoàn tiền', value: 'RefundDisputed' },
  { label: 'Chờ hoàn tiền', value: 'RefundPending' },
  { label: 'Đã hoàn tiền', value: 'Refunded' },
  { label: 'Đã hết hạn', value: 'Expired' },
  { label: 'Đã hủy', value: 'Cancelled' },
  { label: 'Chưa có thanh toán', value: 'NoPayment' },
];

const bookingLabels: Record<string, string> = {
  Holding: 'Đang giữ chỗ',
  Confirmed: 'Đã xác nhận',
  Completed: 'Hoàn tất',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
};

const paymentLabels: Record<string, string> = {
  Pending: 'Chờ thanh toán',
  WaitingForConfirmation: 'Chờ owner xác nhận',
  Paid: 'Đã thanh toán',
  Verified: 'Đã xác nhận',
  Rejected: 'Bị từ chối',
  RefundDisputed: 'Đang khiếu nại',
  RefundPending: 'Chờ hoàn tiền',
  Refunded: 'Đã hoàn tiền',
  Expired: 'Đã hết hạn',
  Cancelled: 'Đã hủy',
  NoPayment: 'Chưa có thanh toán',
};

const bookingTone = (status: string): Tone => {
  if (status === 'Confirmed' || status === 'Completed') return 'success';
  if (status === 'Holding') return 'warning';
  if (status === 'Cancelled' || status === 'Expired') return 'danger';
  return 'neutral';
};

const paymentTone = (status: string): Tone => {
  if (status === 'Verified' || status === 'Paid' || status === 'Refunded') return 'success';
  if (status === 'WaitingForConfirmation' || status === 'Pending' || status === 'RefundPending') return 'warning';
  if (status === 'RefundDisputed') return 'danger';
  if (status === 'Rejected' || status === 'Expired') return 'danger';
  return 'neutral';
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export const AdminBookings = () => {
  const { token } = useAuth();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState(() => new URLSearchParams(window.location.search).get('paymentStatus') ?? 'all');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data = emptyPage, error, loading, refresh: loadBookings, setData } = useApiQuery(
    ['admin-bookings', token, debouncedSearch, status, paymentStatus, page],
    () => listAdminBookings(token!, {
      search: debouncedSearch,
      status,
      paymentStatus,
      page,
      pageSize: PAGE_SIZE,
    }),
    { enabled: Boolean(token), errorMessage: 'Không thể tải booking toàn sàn.' },
  );

  const waitingPayments = useMemo(
    () => data.items.filter((booking) => booking.paymentStatus === 'WaitingForConfirmation').length,
    [data.items],
  );
  const pendingRefunds = useMemo(
    () => data.items.filter((booking) => booking.paymentStatus === 'RefundDisputed').length,
    [data.items],
  );

  const cancelBooking = async (booking: AdminBookingSummary) => {
    if (!token) return;
    const reason = (await prompt({
      title: `Hủy booking ${booking.bookingCode || `#${booking.bookingId}`}?`,
      message: 'Booking sẽ chuyển sang trạng thái đã hủy và người chơi nhận được thông báo.',
      label: 'Lý do hủy',
      placeholder: 'Dùng cho tranh chấp và hoàn tiền về sau...',
      required: true,
      confirmLabel: 'Hủy booking',
      tone: 'danger',
    }))?.trim();
    if (!reason) return;

    setBusyId(booking.bookingId);
    try {
      const updated = await cancelAdminBooking(token, booking.bookingId, reason);
      setData((current) => {
        const page = current ?? emptyPage;
        return {
          ...page,
          items: page.items.map((item) => item.bookingId === updated.bookingId ? updated : item),
        };
      });
      notify('Đã hủy booking.', 'success');
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể hủy booking.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const resolveRefundDispute = async (booking: AdminBookingSummary) => {
    if (!token) return;
    const resolution = (await prompt({
      title: `Kết luận khiếu nại ${booking.bookingCode || `#${booking.bookingId}`}`,
      message: 'Ghi nhận kết quả kiểm tra minh chứng. Admin không chuyển tiền và không tự đánh dấu khoản hoàn là đã nhận.',
      label: 'Kết luận của Admin',
      placeholder: 'Ví dụ: Owner cần chuyển lại đúng số tài khoản; player kiểm tra lại mã giao dịch...',
      required: true,
      confirmLabel: 'Ghi nhận kết luận',
    }))?.trim();
    if (!resolution) return;
    if (resolution.length < 5) {
      notify('Kết luận phải có ít nhất 5 ký tự.', 'error');
      return;
    }
    if (!(await confirm({
      title: 'Gửi kết luận cho hai bên?',
      message: 'Player và owner sẽ nhận kết luận. Khoản tiền vẫn ở trạng thái chờ hoàn cho đến khi player tự xác nhận đã nhận.',
      confirmLabel: 'Gửi kết luận',
    }))) return;

    setBusyId(booking.bookingId);
    try {
      await resolveAdminRefundDispute(token, booking.bookingId, resolution);
      await loadBookings();
      notify('Đã gửi kết luận khiếu nại cho player và owner.', 'success');
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể xử lý khiếu nại.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const viewRefundProof = (booking: AdminBookingSummary) => {
    if (!booking.refundProofImageUrl) return;
    window.open(booking.refundProofImageUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AdminShell activeId="bookings">
      <MobileAdminNav activeId="bookings" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Booking toàn sàn</p>
          <h1 className="text-[20px] font-bold leading-tight md:text-[24px]">Giám sát booking</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Admin xem booking thật để hỗ trợ lỗi thanh toán, tranh chấp và tình trạng giữ chỗ. Doanh thu vận hành vẫn thuộc owner.
          </p>
        </div>
        <div className="grid w-full grid-cols-3 overflow-hidden rounded-xl border border-outline-variant bg-white md:w-auto md:min-w-[420px]">
          <div className="p-3">
            <p className="text-2xl font-bold text-primary">{data.totalCount}</p>
            <p className="text-xs text-on-surface-variant">booking phù hợp</p>
          </div>
          <div className="border-l border-outline-variant p-3">
            <p className="text-2xl font-bold text-[#9b6b00]">{waitingPayments}</p>
            <p className="text-xs text-on-surface-variant">chờ xác nhận trên trang</p>
          </div>
          <button
            className="border-l border-outline-variant p-3 text-left transition-colors hover:bg-amber-50"
            onClick={() => { setPaymentStatus('RefundDisputed'); setPage(1); }}
            type="button"
          >
            <p className="text-2xl font-bold text-amber-700">{pendingRefunds}</p>
            <p className="text-xs text-on-surface-variant">khiếu nại trên trang</p>
          </button>
        </div>
      </section>

      <section className="mb-4 rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_auto] xl:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              className={`${inputClass} pl-9`}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm mã booking, sân, owner, player..."
              value={search}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {bookingStatuses.map((option) => (
              <button
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${status === option.value ? 'bg-[#0b2228] text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                key={option.value}
                onClick={() => { setStatus(option.value); setPage(1); }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <select
            className={inputClass}
            onChange={(event) => { setPaymentStatus(event.target.value); setPage(1); }}
            value={paymentStatus}
          >
            {paymentStatuses.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm font-semibold text-error">
          <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          <button className="ml-auto underline" onClick={() => void loadBookings()} type="button">Thử lại</button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1220px] text-left">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Mã booking', 'Người đặt', 'Sân', 'Thời gian', 'Số tiền', 'Thanh toán', 'Trạng thái', 'Thao tác'].map((heading) => (
                  <th className="px-4 py-3 font-bold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {data.items.map((booking) => (
                <tr className="hover:bg-surface-container-low" key={booking.bookingId}>
                  <td className="px-4 py-3">
                    <p className="font-bold">{booking.bookingCode || `#${booking.bookingId}`}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Tạo {formatDateTime(booking.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{booking.playerName}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{booking.playerEmail || 'Booking nội bộ owner'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{booking.venueName} · Sân {booking.courtNumber}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{booking.ownerName} · {booking.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      <span>{formatDateTime(booking.startTime)} - {new Date(booking.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-primary">{currency.format(booking.totalAmount)}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Sân: {currency.format(booking.courtAmount)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={paymentTone(booking.paymentStatus)}>{paymentLabels[booking.paymentStatus] ?? 'Chưa xác định'}</StatusBadge>
                    {(booking.paymentStatus === 'RefundPending' || booking.paymentStatus === 'RefundDisputed') && (
                      <div className={`mt-2 space-y-1 text-xs ${booking.paymentStatus === 'RefundDisputed' ? 'text-red-700' : 'text-amber-800'}`}>
                        <p className="font-bold">Cần hoàn {currency.format(booking.refundAmount)}</p>
                        {booking.refundPendingSince && <p>Chờ từ {formatDateTime(booking.refundPendingSince)}</p>}
                        {booking.refundDisputedAt && <p>Khiếu nại lúc {formatDateTime(booking.refundDisputedAt)}</p>}
                        {booking.refundDisputeReason && <p className="max-w-xs font-bold">“{booking.refundDisputeReason}”</p>}
                        {booking.refundReference && <p>Mã hoàn: {booking.refundReference}</p>}
                      </div>
                    )}
                    <p className="mt-1 flex items-center gap-1 text-xs text-on-surface-variant">
                      <CreditCard className="h-3.5 w-3.5" />{booking.paymentMethod || 'Chưa có phương thức'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={bookingTone(booking.status)}>{bookingLabels[booking.status] ?? 'Chưa xác định'}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    {booking.paymentStatus === 'RefundDisputed' ? (
                      <div className="flex flex-wrap gap-2">
                        {booking.refundProofImageUrl && <button className={`${outlineButton} border-blue-300 text-blue-800 hover:bg-blue-50`} onClick={() => viewRefundProof(booking)} type="button"><ExternalLink className="h-4 w-4" />Xem minh chứng</button>}
                        <button
                          className={`${outlineButton} border-emerald-300 text-emerald-800 hover:bg-emerald-50`}
                          disabled={busyId === booking.bookingId}
                          onClick={() => void resolveRefundDispute(booking)}
                          type="button"
                        >
                          {busyId === booking.bookingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                          Ghi kết luận
                        </button>
                      </div>
                    ) : booking.paymentStatus === 'RefundPending' ? (
                      <span className="text-xs font-bold text-on-surface-variant">Chỉ theo dõi · Chờ player phản hồi</span>
                    ) : (
                      <button
                        className={`${outlineButton} text-error`}
                        disabled={busyId === booking.bookingId || !cancellableStatuses.includes(booking.status)}
                        onClick={() => void cancelBooking(booking)}
                        type="button"
                      >
                        {busyId === booking.bookingId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ban className="h-4 w-4" />}
                        Hủy
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="grid min-h-56 place-items-center border-t border-outline-variant">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}
        {!loading && !data.items.length && (
          <div className="grid min-h-56 place-items-center border-t border-outline-variant p-6 text-center">
            <div>
              <CalendarCheck className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-bold">Không có booking phù hợp</p>
              <p className="mt-1 text-sm text-on-surface-variant">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          </div>
        )}
      </section>

      <div className="mt-4">
        <PaginationControls page={data} onPageChange={setPage} />
      </div>
    </AdminShell>
  );
};
