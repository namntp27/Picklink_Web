import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDownLeft,
  BadgeAlert,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ExternalLink,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  Settings2,
  XCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  listAdminBookings,
  resolveAdminRefundDispute,
  type AdminBookingSummary,
} from '../../api/adminBookings';
import {
  confirmListingFeePayment,
  getListingFeeSettings,
  listListingFeePayments,
  rejectListingFeePayment,
  updateListingFeeSettings,
  type ListingFeePayment,
} from '../../api/listingFees';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { useConfirm, usePrompt } from '../../components/ui/ConfirmDialogRegion';
import { useToast } from '../../components/ui/ToastRegion';
import { useApiQuery } from '../../hooks/useApiQuery';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { StatusBadge } from './components/StatusBadge';
import type { Tone } from './types';

const PAGE_SIZE = 10;
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const number = new Intl.NumberFormat('vi-VN');

type TransactionTab = 'bookings' | 'refunds' | 'listing-fees';

const emptyBookingPage: PaginatedResponse<AdminBookingSummary> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

const emptyListingPage: PaginatedResponse<ListingFeePayment> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

const paymentStatusOptions = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Đã xác nhận', value: 'Verified' },
  { label: 'Chờ Owner duyệt', value: 'WaitingForConfirmation' },
  { label: 'Đang khiếu nại', value: 'RefundDisputed' },
  { label: 'Chờ hoàn tiền', value: 'RefundPending' },
  { label: 'Đã hoàn tiền', value: 'Refunded' },
  { label: 'Chờ thanh toán', value: 'Pending' },
  { label: 'Từ chối', value: 'Rejected' },
];

const paymentStatusToneMap: Record<string, Tone> = {
  Verified: 'success',
  Paid: 'success',
  Confirmed: 'success',
  WaitingForConfirmation: 'warning',
  Pending: 'warning',
  PendingReview: 'warning',
  RefundPending: 'warning',
  RefundDisputed: 'danger',
  Rejected: 'danger',
  Cancelled: 'neutral',
  Expired: 'neutral',
};

const paymentStatusLabelMap: Record<string, string> = {
  Verified: 'Đã xác nhận',
  Paid: 'Đã thanh toán',
  Confirmed: 'Đã thanh toán',
  WaitingForConfirmation: 'Chờ xác nhận',
  Pending: 'Chờ thanh toán',
  PendingReview: 'Chờ duyệt',
  RefundPending: 'Chờ hoàn tiền',
  RefundDisputed: 'Đang khiếu nại',
  Refunded: 'Đã hoàn tiền',
  Rejected: 'Bị từ chối',
  Cancelled: 'Đã hủy',
  Expired: 'Hết hạn',
  NoPayment: 'Chưa thanh toán',
};

const cardClass = 'rounded-xl border border-outline-variant bg-white p-4 shadow-sm';
const inputClass = 'h-9 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15';
const primaryButton = 'inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50';
const outlineButton = 'inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-[#0b2228] transition hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60';

const formatDate = (value?: string | null) => (value ? dateTime.format(new Date(value)) : '—');

export const AdminTransactions = () => {
  const { token } = useAuth();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const notify = useToast();

  const [activeTab, setActiveTab] = useState<TransactionTab>('bookings');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [priceDraft, setPriceDraft] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Tab 1 & 2: Booking & Refund Data
  const {
    data: bookingsData = emptyBookingPage,
    loading: bookingsLoading,
    refresh: reloadBookings,
  } = useApiQuery(
    ['admin-transactions-bookings', token, debouncedSearch, paymentStatus, page, activeTab],
    () =>
      listAdminBookings(token!, {
        search: debouncedSearch || undefined,
        paymentStatus:
          activeTab === 'refunds'
            ? undefined
            : paymentStatus !== 'all'
              ? paymentStatus
              : undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    {
      enabled: Boolean(token) && (activeTab === 'bookings' || activeTab === 'refunds'),
      errorMessage: 'Không thể tải danh sách giao dịch đặt sân.',
    },
  );

  // Tab 3: Listing Fee Settings
  const {
    data: settings = null,
    loading: settingsLoading,
    setData: setSettings,
  } = useApiQuery(
    ['admin-listing-fee-settings', token],
    () => getListingFeeSettings(token!),
    { enabled: Boolean(token) && activeTab === 'listing-fees', errorMessage: 'Không thể tải cấu hình phí lên sàn.' },
  );

  useEffect(() => {
    if (settings) setPriceDraft(String(settings.pricePerCourtPerMonth || ''));
  }, [settings]);

  // Tab 3: Listing Fee Payments
  const {
    data: listingFeesData = emptyListingPage,
    loading: listingFeesLoading,
    refresh: reloadListingFees,
  } = useApiQuery(
    ['admin-listing-fee-payments', token, debouncedSearch, page, activeTab],
    () =>
      listListingFeePayments(token!, {
        search: debouncedSearch || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    {
      enabled: Boolean(token) && activeTab === 'listing-fees',
      errorMessage: 'Không thể tải dữ liệu phí lên sàn.',
    },
  );

  // Handle Update Listing Fee Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = Number(priceDraft.replace(/[^\d]/g, ''));
    if (!Number.isFinite(price) || price < 0) {
      notify('Đơn giá không hợp lệ.', 'error');
      return;
    }
    const ok = await confirm({
      title: `Cập nhật phí lên sàn thành ${currency.format(price)}?`,
      message: 'Mức giá mới sẽ áp dụng cho tất cả các kỳ thanh toán tiếp theo của chủ sân.',
      confirmLabel: 'Lưu thay đổi',
    });
    if (!ok) return;

    setSavingSettings(true);
    try {
      const updated = await updateListingFeeSettings(token!, price);
      setSettings(updated);
      notify('Đã cập nhật đơn giá phí lên sàn.', 'success');
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Không thể lưu cấu hình.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Handle Confirm Listing Fee
  const handleConfirmListingFee = async (paymentId: number) => {
    const ok = await confirm({
      title: 'Xác nhận khoản phí lên sàn này?',
      message: 'Khoản phí lên sàn sẽ được ghi nhận là đã thanh toán thành công.',
      confirmLabel: 'Xác nhận',
    });
    if (!ok) return;

    setBusyId(paymentId);
    try {
      await confirmListingFeePayment(token!, paymentId);
      notify('Đã xác nhận phí lên sàn thành công.', 'success');
      await reloadListingFees();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Không thể xác nhận giao dịch.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  // Handle Reject Listing Fee
  const handleRejectListingFee = async (paymentId: number) => {
    const reason = await prompt({
      title: 'Từ chối biên lai phí lên sàn này?',
      message: 'Vui lòng nhập lý do từ chối để thông báo cho chủ sân biết.',
      label: 'Lý do từ chối',
      placeholder: 'Ví dụ: Ảnh biên lai mờ, số tiền không khớp...',
      confirmLabel: 'Từ chối',
      cancelLabel: 'Hủy',
      tone: 'danger',
    });
    if (!reason?.trim()) return;

    setBusyId(paymentId);
    try {
      await rejectListingFeePayment(token!, paymentId, reason.trim());
      notify('Đã từ chối biên lai phí lên sàn.', 'success');
      await reloadListingFees();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Không thể từ chối giao dịch.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  // Handle Resolve Refund Dispute
  const handleResolveDispute = async (bookingId: number) => {
    const resolution = await prompt({
      title: 'Giải quyết khiếu nại hoàn tiền',
      message: 'Nhập kết luận phân xử của Admin cho trường hợp hoàn tiền này:',
      label: 'Kết luận phân xử',
      placeholder: 'Ví dụ: Đã xác minh chuyển khoản hợp lệ từ chủ sân...',
      confirmLabel: 'Lưu kết luận',
      cancelLabel: 'Đóng',
    });
    if (!resolution?.trim()) return;

    setBusyId(bookingId);
    try {
      await resolveAdminRefundDispute(token!, bookingId, resolution.trim());
      notify('Đã ghi nhận kết luận giải quyết khiếu nại.', 'success');
      await reloadBookings();
    } catch (err) {
      notify(err instanceof ApiError ? err.message : 'Không thể lưu kết luận.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  // Calculated Stats
  const bookingItems = bookingsData.items;
  const verifiedCount = useMemo(() => bookingItems.filter((i) => i.paymentStatus === 'Verified' || i.paymentStatus === 'Paid').length, [bookingItems]);
  const disputeCount = useMemo(() => bookingItems.filter((i) => i.refundDisputeStatus === 'Open' || i.paymentStatus === 'RefundDisputed').length, [bookingItems]);
  const totalBookingRevenue = useMemo(() => bookingItems.reduce((sum, item) => sum + (item.totalAmount || 0), 0), [bookingItems]);

  return (
    <AdminShell activeId="transactions">
      <MobileAdminNav activeId="transactions" />

      {/* Header */}
      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Tài chính & Dòng tiền</p>
          <h1 className="text-[20px] font-bold leading-tight md:text-[24px]">Trung tâm Giao dịch Toàn hệ thống</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Tổng hợp và đối soát toàn bộ dòng tiền từ đặt sân của khách hàng, thanh toán vé, hoàn tiền và phí dịch vụ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className={outlineButton}
            onClick={() => {
              if (activeTab === 'listing-fees') void reloadListingFees();
              else void reloadBookings();
            }}
            type="button"
          >
            <RefreshCw className="h-4 w-4" /> Làm mới
          </button>
        </div>
      </section>

      {/* KPI Cards */}
      <section className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><CalendarCheck className="h-5 w-5" /></span>
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Booking</span>
          </div>
          <p className="mt-3 text-sm font-bold text-on-surface-variant">Giao dịch Đặt sân</p>
          <h2 className="mt-1 text-2xl font-black">{number.format(bookingsData.totalCount)} đơn</h2>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">Trên trang: {currency.format(totalBookingRevenue)}</p>
        </article>

        <article className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="rounded-xl bg-emerald-500/10 p-2.5 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Thành công</span>
          </div>
          <p className="mt-3 text-sm font-bold text-on-surface-variant">Đã xác nhận thanh toán</p>
          <h2 className="mt-1 text-2xl font-black text-emerald-700">{number.format(verifiedCount)} đơn</h2>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">Khách đã thanh toán & giữ sân</p>
        </article>

        <article className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600"><ArrowDownLeft className="h-5 w-5" /></span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Hoàn tiền</span>
          </div>
          <p className="mt-3 text-sm font-bold text-on-surface-variant">Khiếu nại / Chờ hoàn tiền</p>
          <h2 className="mt-1 text-2xl font-black text-amber-700">{number.format(disputeCount)} vụ</h2>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">Yêu cầu Admin đối soát & xử lý</p>
        </article>

        <article className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="rounded-xl bg-blue-500/10 p-2.5 text-blue-600"><Building2 className="h-5 w-5" /></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Phí sàn</span>
          </div>
          <p className="mt-3 text-sm font-bold text-on-surface-variant">Phí niêm yết từ Chủ sân</p>
          <h2 className="mt-1 text-2xl font-black text-blue-700">{number.format(listingFeesData.totalCount)} lượt</h2>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">Đơn giá: {settings ? currency.format(settings.pricePerCourtPerMonth) : '—'}/sân/tháng</p>
        </article>
      </section>

      {/* Tabs Navigation */}
      <div className="mb-6 border-b border-outline-variant">
        <nav className="flex space-x-8">
          <button
            className={`border-b-2 pb-4 text-sm font-bold transition ${
              activeTab === 'bookings'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveTab('bookings');
              setPage(1);
            }}
            type="button"
          >
            🏸 Giao dịch Đặt sân ({bookingsData.totalCount})
          </button>

          <button
            className={`border-b-2 pb-4 text-sm font-bold transition ${
              activeTab === 'refunds'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveTab('refunds');
              setPage(1);
            }}
            type="button"
          >
            💸 Hoàn tiền & Tranh chấp
          </button>

          <button
            className={`border-b-2 pb-4 text-sm font-bold transition ${
              activeTab === 'listing-fees'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:border-outline hover:text-on-surface'
            }`}
            onClick={() => {
              setActiveTab('listing-fees');
              setPage(1);
            }}
            type="button"
          >
            🏢 Phí lên sàn & Cấu hình ({listingFeesData.totalCount})
          </button>
        </nav>
      </div>

      {/* Filters Bar */}
      <section className="mb-6 flex flex-col gap-3 rounded-2xl border border-outline-variant bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-on-surface-variant" />
          <input
            className={`${inputClass} pl-9`}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'listing-fees'
                ? 'Tìm kiếm theo tên sân, tên chủ sân...'
                : 'Tìm kiếm mã booking, tên người chơi, tên sân...'
            }
            type="search"
            value={search}
          />
        </div>

        {activeTab === 'bookings' && (
          <div className="w-full sm:w-56">
            <select
              className={inputClass}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
              value={paymentStatus}
            >
              {paymentStatusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </section>

      {/* TAB 1: GIAO DỊCH ĐẶT SÂN */}
      {activeTab === 'bookings' && (
        <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant bg-surface-container-low text-xs font-bold uppercase text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3.5">Mã đơn / Thời gian</th>
                  <th className="px-4 py-3.5">Người chơi</th>
                  <th className="px-4 py-3.5">Sân / Chủ sân</th>
                  <th className="px-4 py-3.5">Số tiền</th>
                  <th className="px-4 py-3.5">Phương thức</th>
                  <th className="px-4 py-3.5">Trạng thái thanh toán</th>
                  <th className="px-4 py-3.5 text-right">Chi tiết</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {bookingsLoading && (
                  <tr>
                    <td className="p-8 text-center" colSpan={7}>
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                      <p className="mt-2 text-xs font-semibold text-on-surface-variant">Đang tải giao dịch...</p>
                    </td>
                  </tr>
                )}

                {!bookingsLoading && bookingsData.items.length === 0 && (
                  <tr>
                    <td className="p-8 text-center text-on-surface-variant" colSpan={7}>
                      Không tìm thấy giao dịch nào phù hợp.
                    </td>
                  </tr>
                )}

                {!bookingsLoading &&
                  bookingsData.items.map((booking) => (
                    <tr className="transition hover:bg-surface-container-low/60" key={booking.bookingId}>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-primary">#{booking.bookingCode || booking.bookingId}</p>
                        <p className="text-xs text-on-surface-variant">{formatDate(booking.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold">{booking.playerName}</p>
                        <p className="text-xs text-on-surface-variant">{booking.playerEmail || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold">{booking.venueName}</p>
                        <p className="text-xs text-on-surface-variant">Sân {booking.courtNumber} · Owner: {booking.ownerName}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-on-surface">
                        {currency.format(booking.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-on-surface-variant">
                        {booking.paymentMethod || 'Chuyển khoản QR'}
                      </td>
                      <td className="px-4 py-3.5">
                        <StatusBadge tone={paymentStatusToneMap[booking.paymentStatus] ?? 'neutral'}>
                          {paymentStatusLabelMap[booking.paymentStatus] ?? booking.paymentStatus}
                        </StatusBadge>
                        {booking.refundDisputeStatus === 'Open' && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-error/15 px-2 py-0.5 text-[10px] font-bold text-error">
                            Có khiếu nại
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <Link
                          className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1.5 text-xs font-bold hover:border-primary hover:text-primary"
                          to={`/admin/bookings?search=${booking.bookingCode || booking.bookingId}`}
                        >
                          Xem đơn <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className="border-t border-outline-variant p-4">
            <PaginationControls
              onPageChange={setPage}
              page={bookingsData}
            />
          </div>
        </section>
      )}

      {/* TAB 2: HOÀN TIỀN & TRANH CHẤP */}
      {activeTab === 'refunds' && (
        <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
          <div className="border-b border-outline-variant p-4 bg-amber-50/50">
            <h2 className="text-base font-bold text-amber-900 flex items-center gap-2">
              <BadgeAlert className="h-5 w-5 text-amber-600" />
              Danh sách Giao dịch Yêu cầu Hoàn tiền & Tranh chấp Đối soát
            </h2>
            <p className="mt-1 text-xs text-amber-700">
              Admin có quyền kiểm tra bằng chứng hoàn tiền của Chủ sân và giải quyết khiếu nại của Người chơi.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-outline-variant bg-surface-container-low text-xs font-bold uppercase text-on-surface-variant">
                <tr>
                  <th className="px-4 py-3.5">Mã đơn</th>
                  <th className="px-4 py-3.5">Người chơi</th>
                  <th className="px-4 py-3.5">Chủ sân</th>
                  <th className="px-4 py-3.5">Tiền hoàn</th>
                  <th className="px-4 py-3.5">Bằng chứng chuyển khoản</th>
                  <th className="px-4 py-3.5">Trạng thái tranh chấp</th>
                  <th className="px-4 py-3.5 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {bookingsLoading && (
                  <tr>
                    <td className="p-8 text-center" colSpan={7}>
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </td>
                  </tr>
                )}

                {!bookingsLoading && bookingsData.items.length === 0 && (
                  <tr>
                    <td className="p-8 text-center text-on-surface-variant" colSpan={7}>
                      Hiện không có yêu cầu hoàn tiền hoặc tranh chấp nào.
                    </td>
                  </tr>
                )}

                {!bookingsLoading &&
                  bookingsData.items.map((item) => (
                    <tr className="transition hover:bg-surface-container-low/60" key={item.bookingId}>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-primary">#{item.bookingCode || item.bookingId}</p>
                        <p className="text-xs text-on-surface-variant">{formatDate(item.createdAt)}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold">{item.playerName}</p>
                        <p className="text-xs text-on-surface-variant">{item.playerEmail || '—'}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold">{item.ownerName}</p>
                        <p className="text-xs text-on-surface-variant">{item.venueName}</p>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-error">
                        {currency.format(item.refundAmount || item.totalAmount)}
                      </td>
                      <td className="px-4 py-3.5">
                        {item.refundProofImageUrl ? (
                          <button
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary underline"
                            onClick={() => setPreviewImage(item.refundProofImageUrl!)}
                            type="button"
                          >
                            <Eye className="h-3.5 w-3.5" /> Xem ảnh biên lai
                          </button>
                        ) : (
                          <span className="text-xs text-on-surface-variant italic">Chưa tải ảnh</span>
                        )}
                        {item.refundReference && (
                          <p className="text-[11px] text-on-surface-variant font-mono mt-0.5">Mã: {item.refundReference}</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        {item.refundDisputeStatus === 'Open' ? (
                          <span className="inline-flex items-center rounded-full bg-error/15 px-2 py-0.5 text-xs font-bold text-error">
                            Đang khiếu nại
                          </span>
                        ) : item.refundDisputeStatus === 'Resolved' ? (
                          <span className="inline-flex items-center rounded-full bg-success/15 px-2 py-0.5 text-xs font-bold text-success">
                            Đã giải quyết
                          </span>
                        ) : (
                          <StatusBadge tone={paymentStatusToneMap[item.paymentStatus] ?? 'neutral'}>
                            {paymentStatusLabelMap[item.paymentStatus] ?? item.paymentStatus}
                          </StatusBadge>
                        )}
                        {item.refundDisputeReason && (
                          <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">"{item.refundDisputeReason}"</p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        {item.refundDisputeStatus === 'Open' ? (
                          <button
                            className={primaryButton}
                            disabled={busyId === item.bookingId}
                            onClick={() => void handleResolveDispute(item.bookingId)}
                            type="button"
                          >
                            {busyId === item.bookingId ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Xử lý kết luận'}
                          </button>
                        ) : (
                          <Link
                            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                            to={`/admin/bookings?search=${item.bookingCode || item.bookingId}`}
                          >
                            Chi tiết <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: PHÍ LÊN SÀN & CẤU HÌNH */}
      {activeTab === 'listing-fees' && (
        <div className="space-y-6">
          {/* Cấu hình đơn giá */}
          <section className="rounded-2xl border border-outline-variant bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold flex items-center gap-2">
                  <Settings2 className="h-5 w-5 text-primary" />
                  Cấu hình Đơn giá Phí niêm yết Sân
                </h2>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Mức phí tính trên mỗi sân con / tháng khi Chủ sân đăng ký mở cụm sân hoạt động trên nền tảng.
                </p>
              </div>
            </div>

            <form className="flex flex-wrap items-end gap-3" onSubmit={(e) => void handleSaveSettings(e)}>
              <div className="w-full sm:w-72">
                <label className="mb-1 block text-xs font-bold uppercase text-on-surface-variant">
                  Đơn giá mỗi sân con / tháng (VNĐ)
                </label>
                <input
                  className={inputClass}
                  disabled={settingsLoading || savingSettings}
                  onChange={(e) => setPriceDraft(e.target.value)}
                  placeholder="Ví dụ: 150000"
                  type="number"
                  value={priceDraft}
                />
              </div>
              <button className={primaryButton} disabled={settingsLoading || savingSettings} type="submit">
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Lưu cấu hình
              </button>
            </form>
          </section>

          {/* Danh sách biên lai phí */}
          <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
            <div className="border-b border-outline-variant p-4">
              <h2 className="text-base font-bold">Biên lai Phí lên sàn chờ Duyệt ({listingFeesData.totalCount})</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-outline-variant bg-surface-container-low text-xs font-bold uppercase text-on-surface-variant">
                  <tr>
                    <th className="px-4 py-3.5">Mã GD / Ngày gửi</th>
                    <th className="px-4 py-3.5">Cụm sân</th>
                    <th className="px-4 py-3.5">Chủ sân</th>
                    <th className="px-4 py-3.5">Thời hạn</th>
                    <th className="px-4 py-3.5">Số tiền</th>
                    <th className="px-4 py-3.5">Biên lai</th>
                    <th className="px-4 py-3.5">Trạng thái</th>
                    <th className="px-4 py-3.5 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {listingFeesLoading && (
                    <tr>
                      <td className="p-8 text-center" colSpan={8}>
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                      </td>
                    </tr>
                  )}

                  {!listingFeesLoading && listingFeesData.items.length === 0 && (
                    <tr>
                      <td className="p-8 text-center text-on-surface-variant" colSpan={8}>
                        Không có biên lai phí lên sàn nào.
                      </td>
                    </tr>
                  )}

                  {!listingFeesLoading &&
                    listingFeesData.items.map((payment) => (
                      <tr className="transition hover:bg-surface-container-low/60" key={payment.venueListingPaymentId}>
                        <td className="px-4 py-3.5">
                          <p className="font-bold text-primary">#{payment.venueListingPaymentId}</p>
                          <p className="text-xs text-on-surface-variant">{formatDate(payment.submittedAt)}</p>
                        </td>
                        <td className="px-4 py-3.5 font-bold">{payment.venueName}</td>
                        <td className="px-4 py-3.5">
                          <p className="font-bold">{payment.ownerName}</p>
                          <p className="text-xs text-on-surface-variant">{payment.ownerEmail}</p>
                        </td>
                        <td className="px-4 py-3.5 text-xs text-on-surface-variant">
                          {payment.months} tháng ({payment.activeCourtCount} sân)
                        </td>
                        <td className="px-4 py-3.5 font-bold text-emerald-700">
                          {currency.format(payment.amount)}
                        </td>
                        <td className="px-4 py-3.5">
                          {payment.receiptImageUrl ? (
                            <button
                              className="inline-flex items-center gap-1 text-xs font-bold text-primary underline"
                              onClick={() => setPreviewImage(payment.receiptImageUrl!)}
                              type="button"
                            >
                              <Eye className="h-3.5 w-3.5" /> Xem ảnh
                            </button>
                          ) : (
                            <span className="text-xs text-on-surface-variant italic">Không có ảnh</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusBadge tone={paymentStatusToneMap[payment.status] ?? 'neutral'}>
                            {paymentStatusLabelMap[payment.status] ?? payment.status}
                          </StatusBadge>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {payment.status === 'PendingReview' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                className="inline-flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-xs font-bold text-white hover:bg-emerald-700"
                                disabled={busyId === payment.venueListingPaymentId}
                                onClick={() => void handleConfirmListingFee(payment.venueListingPaymentId)}
                                type="button"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt
                              </button>
                              <button
                                className="inline-flex h-8 items-center gap-1 rounded-lg border border-error/30 bg-error/10 px-2.5 text-xs font-bold text-error hover:bg-error/20"
                                disabled={busyId === payment.venueListingPaymentId}
                                onClick={() => void handleRejectListingFee(payment.venueListingPaymentId)}
                                type="button"
                              >
                                <XCircle className="h-3.5 w-3.5" /> Từ chối
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-on-surface-variant font-semibold">Đã xử lý</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-outline-variant p-4">
              <PaginationControls
                onPageChange={setPage}
                page={listingFeesData}
              />
            </div>
          </section>
        </div>
      )}

      {/* Modal xem ảnh biên lai phóng to */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-h-[90vh] max-w-2xl overflow-hidden rounded-2xl bg-white p-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <img alt="Ảnh biên lai" className="max-h-[80vh] w-auto rounded-xl object-contain" src={previewImage} />
            <div className="mt-2 flex justify-end">
              <button className={primaryButton} onClick={() => setPreviewImage(null)} type="button">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
};
