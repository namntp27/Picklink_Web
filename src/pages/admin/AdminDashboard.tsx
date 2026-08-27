import { useMemo } from 'react';
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  Loader2,
  Lock,
  RefreshCw,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  getAdminDashboard,
  type AdminDashboardActionItem,
  type AdminDashboardMetrics,
} from '../../api/adminDashboard';
import { useAuth } from '../../auth/AuthContext';
import { useApiQuery } from '../../hooks/useApiQuery';
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

const cardClass = 'rounded-xl border border-outline-variant bg-white p-4 shadow-sm';
const actionButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b2228] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#143f34] disabled:opacity-60';

const actionHref = (item: AdminDashboardActionItem) => item.linkTo || '/admin';

export const AdminDashboard = () => {
  const { token } = useAuth();
  const {
    data: dashboard = emptyDashboard,
    error,
    loading,
    refresh: loadDashboard,
  } = useApiQuery(
    ['admin-dashboard', token],
    () => getAdminDashboard(token!),
    { enabled: Boolean(token), errorMessage: 'Không thể tải tổng quan admin.' },
  );

  const hasLoaded = dashboard !== emptyDashboard;

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
      label: 'Tổng số sân con',
      value: number.format(dashboard.totalCourtCount),
      helper: 'Sân sẵn sàng phục vụ đặt lịch',
      icon: CheckCircle2,
      tone: 'text-primary',
    },
    {
      label: 'Booking hôm nay',
      value: number.format(dashboard.todayBookingCount),
      helper: currency.format(dashboard.todayBookingRevenue),
      icon: CalendarCheck,
      tone: 'text-primary',
    },
  ], [dashboard]);

  return (
    <AdminShell activeId="overview">
      <MobileAdminNav activeId="overview" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Bảng điều khiển</p>
          <h1 className="text-[20px] font-bold leading-tight md:text-[24px]">Tổng quan vận hành Picklink</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Dữ liệu thật từ người dùng, cụm sân, sân con và booking. Ưu tiên các việc admin cần xử lý ngay.
          </p>
        </div>
        <button className={actionButton} disabled={loading} onClick={() => void loadDashboard()} type="button">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Làm mới
        </button>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm font-semibold text-error" role="alert">
          <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          <button className="ml-auto underline" onClick={() => void loadDashboard()} type="button">Thử lại</button>
        </div>
      )}

      {loading && !hasLoaded && (
        <section className="grid min-h-56 place-items-center rounded-2xl border border-outline-variant bg-white">
          <div className="text-center text-on-surface-variant">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
            <p className="mt-3 text-sm font-semibold">Đang tải số liệu vận hành...</p>
          </div>
        </section>
      )}

      {hasLoaded && (
        <>
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
                  <h2 className={`mt-1 text-[22px] font-black ${stat.tone}`}>{stat.value}</h2>
                  <p className="mt-1 text-xs font-semibold text-on-surface-variant">{stat.helper}</p>
                </article>
              );
            })}
          </section>

          <section className="mb-6 grid gap-4 md:grid-cols-2">
            <article className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-on-surface-variant">Hàng chờ duyệt sân</p>
                  <h2 className="mt-1 text-2xl font-black">{number.format(dashboard.pendingVenueCount)}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">Hồ sơ cụm sân mới từ Owner chờ Admin xét duyệt.</p>
                </div>
                <ShieldAlert className="h-6 w-6 text-[#9b6b00]" />
              </div>
              <Link className="mt-4 inline-flex text-sm font-bold text-primary hover:underline" to="/admin/courts">
                Mở duyệt sân →
              </Link>
            </article>

            <article className={cardClass}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-on-surface-variant">Tài khoản đang khóa</p>
                  <h2 className="mt-1 text-2xl font-black">{number.format(dashboard.lockedUserCount)}</h2>
                  <p className="mt-1 text-sm text-on-surface-variant">Tài khoản vi phạm hoặc đang chờ mở khóa.</p>
                </div>
                <Lock className="h-6 w-6 text-error" />
              </div>
              <Link className="mt-4 inline-flex text-sm font-bold text-primary hover:underline" to="/admin/users">
                Quản lý tài khoản →
              </Link>
            </article>
          </section>

          <section className="overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-sm">
            <div className="border-b border-outline-variant p-5">
              <h2 className="text-xl font-bold">Việc admin cần xử lý</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Tổng hợp hồ sơ duyệt sân, báo cáo và thanh toán quá hạn.</p>
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
        </>
      )}
    </AdminShell>
  );
};
