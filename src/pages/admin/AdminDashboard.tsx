import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CalendarCheck,
  Clock3,
  CreditCard,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Users,
  WalletCards,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getAdminDashboard,
  type AdminDashboardActionItem,
  type AdminDashboardMetrics,
} from '../../api/adminDashboard';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { StatusBadge } from './components/StatusBadge';
import type { Tone } from './types';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('vi-VN');

const emptyDashboard: AdminDashboardMetrics = {
  totalUsers: 0,
  lockedUserCount: 0,
  activeVenueCount: 0,
  pendingVenueCount: 0,
  totalCourtCount: 0,
  todayBookingCount: 0,
  todayBookingRevenue: 0,
  pendingBookingPaymentCount: 0,
  pendingListingPaymentCount: 0,
  listingRevenueThisMonth: 0,
  expiringListingCount: 0,
  expiredListingCount: 0,
  actionItems: [],
  expiringListings: [],
};

const toneMap: Record<string, Tone> = {
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  info: 'info',
  neutral: 'neutral',
};

const cardClass = 'rounded-2xl border border-outline-variant bg-white p-5 shadow-sm';
const actionButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b2228] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#143f34] disabled:opacity-60';

const formatDate = (value?: string | null) => {
  if (!value) return 'Chưa có';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' }).format(new Date(value));
};

const actionHref = (item: AdminDashboardActionItem) => item.linkTo || '/admin';

export const AdminDashboard = () => {
  const { token } = useAuth();
  const [dashboard, setDashboard] = useState<AdminDashboardMetrics>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setDashboard(await getAdminDashboard(token));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải tổng quan admin.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const stats = useMemo(() => [
    {
      label: 'Người dùng',
      value: number.format(dashboard.totalUsers),
      helper: `${number.format(dashboard.lockedUserCount)} tài khoản đang khóa`,
      icon: Users,
      tone: 'text-primary',
    },
    {
      label: 'Sân đang hoạt động',
      value: number.format(dashboard.activeVenueCount),
      helper: `${number.format(dashboard.pendingVenueCount)} hồ sơ sân chờ duyệt`,
      icon: ShieldAlert,
      tone: 'text-[#9b6b00]',
    },
    {
      label: 'Booking hôm nay',
      value: number.format(dashboard.todayBookingCount),
      helper: currency.format(dashboard.todayBookingRevenue),
      icon: CalendarCheck,
      tone: 'text-primary',
    },
    {
      label: 'Phí lên sàn tháng này',
      value: currency.format(dashboard.listingRevenueThisMonth),
      helper: `${number.format(dashboard.pendingListingPaymentCount)} biên lai chờ duyệt`,
      icon: Banknote,
      tone: 'text-primary',
    },
  ], [dashboard]);

  return (
    <AdminShell activeId="overview">
      <MobileAdminNav activeId="overview" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Bảng điều khiển</p>
          <h1 className="text-[30px] font-bold leading-tight md:text-[36px]">Tổng quan vận hành Picklink</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Dữ liệu thật từ người dùng, sân, booking và phí lên sàn. Ưu tiên các việc admin cần xử lý ngay.
          </p>
        </div>
        <button className={actionButton} disabled={loading} onClick={() => void loadDashboard()} type="button">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Làm mới
        </button>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm font-semibold text-error">
          <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          <button className="ml-auto underline" onClick={() => void loadDashboard()} type="button">Thử lại</button>
        </div>
      )}

      <section className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <article className={cardClass} key={stat.label}>
              <div className="mb-4 flex items-center justify-between">
                <span className="rounded-xl bg-primary/10 p-2.5 text-primary"><Icon className="h-5 w-5" /></span>
                {loading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
              </div>
              <p className="text-sm font-bold text-on-surface-variant">{stat.label}</p>
              <h2 className={`mt-1 text-[28px] font-black ${stat.tone}`}>{stat.value}</h2>
              <p className="mt-1 text-xs font-semibold text-on-surface-variant">{stat.helper}</p>
            </article>
          );
        })}
      </section>

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <article className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-on-surface-variant">Hàng chờ sân</p>
              <h2 className="mt-1 text-2xl font-black">{number.format(dashboard.pendingVenueCount)}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Hồ sơ owner gửi admin duyệt.</p>
            </div>
            <ShieldAlert className="h-6 w-6 text-[#9b6b00]" />
          </div>
          <Link className="mt-4 inline-flex text-sm font-bold text-primary hover:underline" to="/admin/courts">Mở duyệt sân</Link>
        </article>
        <article className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-on-surface-variant">Biên lai phí lên sàn</p>
              <h2 className="mt-1 text-2xl font-black">{number.format(dashboard.pendingListingPaymentCount)}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Owner đã gửi biên lai, chờ admin xác nhận.</p>
            </div>
            <WalletCards className="h-6 w-6 text-primary" />
          </div>
          <Link className="mt-4 inline-flex text-sm font-bold text-primary hover:underline" to="/admin/transactions">Mở giao dịch</Link>
        </article>
        <article className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase text-on-surface-variant">Cảnh báo phí</p>
              <h2 className="mt-1 text-2xl font-black">{number.format(dashboard.expiringListingCount)}</h2>
              <p className="mt-1 text-sm text-on-surface-variant">
                Sắp hết hạn trong 7 ngày · {number.format(dashboard.expiredListingCount)} đã hết hạn.
              </p>
            </div>
            <Clock3 className="h-6 w-6 text-error" />
          </div>
          <Link className="mt-4 inline-flex text-sm font-bold text-primary hover:underline" to="/admin/transactions">Xem phí lên sàn</Link>
        </article>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
          <div className="border-b border-outline-variant p-5">
            <h2 className="text-xl font-bold">Việc admin cần xử lý</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Tổng hợp từ duyệt sân, biên lai phí lên sàn và thanh toán booking quá hạn.</p>
          </div>
          <div className="divide-y divide-outline-variant">
            {dashboard.actionItems.map((item, index) => (
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between" key={`${item.type}-${item.title}-${index}`}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold">{item.title}</h3>
                    <StatusBadge tone={toneMap[item.tone] ?? 'neutral'}>{item.status}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">{item.description}</p>
                </div>
                <Link className="shrink-0 rounded-lg border border-outline-variant px-3 py-2 text-sm font-bold hover:border-primary hover:text-primary" to={actionHref(item)}>
                  Xử lý
                </Link>
              </div>
            ))}
            {!loading && dashboard.actionItems.length === 0 && (
              <div className="grid min-h-40 place-items-center p-6 text-center text-on-surface-variant">
                <p className="font-semibold">Chưa có việc cần xử lý ngay.</p>
              </div>
            )}
            {loading && (
              <div className="grid min-h-40 place-items-center p-6">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className={cardClass}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase text-on-surface-variant">Sân sắp hết phí</p>
                <h2 className="text-xl font-bold">Trong 7 ngày</h2>
              </div>
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-3">
              {dashboard.expiringListings.map((venue) => (
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-3" key={venue.venueId}>
                  <p className="font-bold">{venue.venueName}</p>
                  <p className="mt-1 text-xs text-on-surface-variant">{venue.ownerName} · {venue.ownerEmail}</p>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold">
                    <span>{venue.courtCount} sân con</span>
                    <span className="text-error">Hết hạn {formatDate(venue.paidUntil)}</span>
                  </div>
                </div>
              ))}
              {!loading && dashboard.expiringListings.length === 0 && (
                <p className="rounded-xl bg-surface-container-low p-4 text-sm font-semibold text-on-surface-variant">
                  Chưa có sân nào sắp hết hạn phí.
                </p>
              )}
            </div>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
};
