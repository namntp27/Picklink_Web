import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CalendarCheck, CreditCard, Loader2, Search } from 'lucide-react';
import {
  listAdminBookings,
  type AdminBookingSummary,
} from '../../api/adminBookings';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { StatusBadge } from './components/StatusBadge';
import type { Tone } from './types';

const PAGE_SIZE = 12;
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const inputClass = 'h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';

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
  { label: 'Chờ owner xác nhận', value: 'WaitingForConfirmation' },
  { label: 'Đã xác nhận', value: 'Verified' },
  { label: 'Bị từ chối', value: 'Rejected' },
  { label: 'Chưa có thanh toán', value: 'NoPayment' },
];

const bookingTone = (status: string): Tone => {
  if (status === 'Confirmed' || status === 'Completed') return 'success';
  if (status === 'Holding') return 'warning';
  if (status === 'Cancelled' || status === 'Expired') return 'danger';
  return 'neutral';
};

const paymentTone = (status: string): Tone => {
  if (status === 'Verified' || status === 'Paid') return 'success';
  if (status === 'WaitingForConfirmation' || status === 'Pending') return 'warning';
  if (status === 'Rejected' || status === 'Expired') return 'danger';
  return 'neutral';
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export const AdminBookings = () => {
  const { token } = useAuth();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<AdminBookingSummary>>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setData(await listAdminBookings(token, {
        search: debouncedSearch,
        status,
        paymentStatus,
        page,
        pageSize: PAGE_SIZE,
      }));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải booking toàn sàn.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, paymentStatus, status, token]);

  useEffect(() => {
    void loadBookings();
  }, [loadBookings]);

  const waitingPayments = useMemo(
    () => data.items.filter((booking) => booking.paymentStatus === 'WaitingForConfirmation').length,
    [data.items],
  );

  return (
    <AdminShell activeId="bookings">
      <MobileAdminNav activeId="bookings" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Booking toàn sàn</p>
          <h1 className="text-[30px] font-bold leading-tight md:text-[36px]">Giám sát booking</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Admin xem booking thật để hỗ trợ lỗi thanh toán, tranh chấp và tình trạng giữ chỗ. Doanh thu vận hành vẫn thuộc owner.
          </p>
        </div>
        <div className="grid min-w-64 grid-cols-2 overflow-hidden rounded-xl border border-outline-variant bg-white">
          <div className="p-3">
            <p className="text-2xl font-bold text-primary">{data.totalCount}</p>
            <p className="text-xs text-on-surface-variant">booking phù hợp</p>
          </div>
          <div className="border-l border-outline-variant p-3">
            <p className="text-2xl font-bold text-[#9b6b00]">{waitingPayments}</p>
            <p className="text-xs text-on-surface-variant">chờ xác nhận trên trang</p>
          </div>
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
          <div className="flex gap-2 overflow-x-auto">
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
          <table className="w-full min-w-[1120px] text-left">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Mã booking', 'Người đặt', 'Sân', 'Thời gian', 'Số tiền', 'Thanh toán', 'Trạng thái'].map((heading) => (
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
                    <StatusBadge tone={paymentTone(booking.paymentStatus)}>{booking.paymentStatus}</StatusBadge>
                    <p className="mt-1 flex items-center gap-1 text-xs text-on-surface-variant">
                      <CreditCard className="h-3.5 w-3.5" />{booking.paymentMethod || 'Chưa có phương thức'}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={bookingTone(booking.status)}>{booking.status}</StatusBadge>
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
