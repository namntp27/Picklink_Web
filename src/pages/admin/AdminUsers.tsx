import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Loader2,
  Lock,
  Search,
  ShieldCheck,
  Unlock,
  UserRound,
  Users,
} from 'lucide-react';
import {
  listAdminUsers,
  lockAdminUser,
  unlockAdminUser,
  type AdminUserListParams,
  type AdminUserRole,
  type AdminUserSummary,
} from '../../api/adminUsers';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { useToast } from '../../components/ui/ToastRegion';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { StatusBadge } from './components/StatusBadge';
import type { Tone } from './types';

const PAGE_SIZE = 12;

const emptyPage: PaginatedResponse<AdminUserSummary> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

const roleOptions: Array<{ value: AdminUserRole | 'all'; label: string }> = [
  { value: 'all', label: 'Tất cả' },
  { value: 'Player', label: 'Người chơi' },
  { value: 'VenueOwner', label: 'Chủ sân' },
  { value: 'Staff', label: 'Nhân viên' },
  { value: 'Admin', label: 'Admin' },
  { value: 'User', label: 'Chưa chọn vai trò' },
];

const roleTone: Record<string, Tone> = {
  Admin: 'danger',
  Staff: 'warning',
  VenueOwner: 'info',
  Player: 'success',
  User: 'neutral',
};

const inputClass = 'w-full rounded-xl border border-outline-variant bg-white px-3 py-2.5 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b2228] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#143f34] disabled:cursor-not-allowed disabled:opacity-60';
const outlineButton = 'inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-[#0b2228] transition hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60';

const avatarLabel = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

const locationLabel = (user: AdminUserSummary) =>
  [user.commune, user.city].filter(Boolean).join(', ') || 'Chưa cập nhật';

export const AdminUsers = () => {
  const { token, user: currentUser } = useAuth();
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState<AdminUserRole | 'all'>('all');
  const [lockedOnly, setLockedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<AdminUserSummary>>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyUserId, setBusyUserId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadUsers = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const params: AdminUserListParams = {
        search: debouncedSearch,
        role,
        lockedOnly,
        page,
        pageSize: PAGE_SIZE,
      };
      setData(await listAdminUsers(token, params));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách người dùng.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, lockedOnly, page, role, token]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const toggleLock = async (target: AdminUserSummary) => {
    if (!token) return;
    if (target.userId === Number(currentUser?.id)) {
      notify('Không thể khóa tài khoản admin đang đăng nhập.', 'error');
      return;
    }

    const reason = target.isLocked
      ? ''
      : window.prompt(`Lý do khóa tài khoản ${target.name}?`, '')?.trim();
    if (!target.isLocked && reason === undefined) return;

    const actionLabel = target.isLocked ? 'mở khóa' : 'khóa';
    if (!window.confirm(`Xác nhận ${actionLabel} tài khoản ${target.name}?`)) return;

    setBusyUserId(target.userId);
    try {
      const updated = target.isLocked
        ? await unlockAdminUser(target.userId, token)
        : await lockAdminUser(target.userId, reason ?? '', token);
      setData((current) => ({
        ...current,
        items: current.items.map((item) => item.userId === updated.userId ? updated : item),
      }));
      notify(target.isLocked ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản.', 'success');
      if (lockedOnly && target.isLocked) {
        await loadUsers();
      }
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật trạng thái tài khoản.', 'error');
    } finally {
      setBusyUserId(null);
    }
  };

  const lockedOnPage = useMemo(
    () => data.items.filter((item) => item.isLocked).length,
    [data.items],
  );

  return (
    <AdminShell activeId="users">
      <MobileAdminNav activeId="users" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Quản lý người dùng</p>
          <h1 className="text-[30px] font-bold leading-tight md:text-[36px]">Tài khoản hệ thống</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Xem dữ liệu người dùng thật, lọc theo vai trò và khóa hoặc mở khóa tài khoản khi cần xử lý vận hành.
          </p>
        </div>
        <div className="grid min-w-64 grid-cols-2 overflow-hidden rounded-xl border border-outline-variant bg-white">
          <div className="p-3">
            <p className="text-2xl font-bold text-primary">{data.totalCount}</p>
            <p className="text-xs text-on-surface-variant">tài khoản phù hợp</p>
          </div>
          <div className="border-l border-outline-variant p-3">
            <p className="text-2xl font-bold text-error">{lockedOnPage}</p>
            <p className="text-xs text-on-surface-variant">đang khóa trên trang</p>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              className={`${inputClass} pl-9`}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm tên, email, thành phố, phường/xã..."
              value={search}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            {roleOptions.map((option) => (
              <button
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${role === option.value ? 'bg-[#0b2228] text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                key={option.value}
                onClick={() => { setRole(option.value); setPage(1); }}
                type="button"
              >
                {option.label}
              </button>
            ))}
            <button
              className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${lockedOnly ? 'bg-error text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-error/10 hover:text-error'}`}
              onClick={() => { setLockedOnly((value) => !value); setPage(1); }}
              type="button"
            >
              Chỉ tài khoản khóa
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm font-semibold text-error">
          <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          <button className="ml-auto underline" onClick={() => void loadUsers()} type="button">Thử lại</button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Người dùng', 'Vai trò', 'Khu vực', 'Hoạt động', 'Trạng thái', ''].map((heading) => (
                  <th className="px-4 py-3 font-bold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {data.items.map((account) => (
                <tr className="hover:bg-surface-container-low" key={account.userId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {account.avatarUrl ? (
                        <img alt={account.name} className="h-11 w-11 rounded-xl object-cover" decoding="async" loading="lazy" src={account.avatarUrl} />
                      ) : (
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#0b2228] text-sm font-black text-[#e2ff57]">
                          {avatarLabel(account.name)}
                        </span>
                      )}
                      <div>
                        <p className="font-bold">{account.name}</p>
                        <p className="mt-1 text-xs text-on-surface-variant">{account.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={roleTone[account.role] ?? 'neutral'}>{account.roleLabel}</StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{locationLabel(account)}</td>
                  <td className="px-4 py-3">
                    <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold text-on-surface-variant">
                      <span className="rounded-lg bg-surface-container-low px-2 py-1"><Users className="mx-auto mb-1 h-4 w-4" />{account.joinedClubCount} CLB</span>
                      <span className="rounded-lg bg-surface-container-low px-2 py-1"><ShieldCheck className="mx-auto mb-1 h-4 w-4" />{account.ownedVenueCount} sân</span>
                      <span className="rounded-lg bg-surface-container-low px-2 py-1"><CheckCircle2 className="mx-auto mb-1 h-4 w-4" />{account.bookingCount} booking</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {account.isLocked ? (
                      <StatusBadge tone="danger">Đã khóa</StatusBadge>
                    ) : (
                      <StatusBadge tone="success">Đang hoạt động</StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      className={account.isLocked ? primaryButton : `${outlineButton} border-error/35 text-error hover:bg-error/10`}
                      disabled={busyUserId === account.userId}
                      onClick={() => void toggleLock(account)}
                      type="button"
                    >
                      {busyUserId === account.userId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : account.isLocked ? (
                        <Unlock className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      {account.isLocked ? 'Mở khóa' : 'Khóa'}
                    </button>
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
              <UserRound className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-bold">Không có tài khoản phù hợp</p>
              <p className="mt-1 text-sm text-on-surface-variant">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          </div>
        )}
      </section>

      <div className="mt-4">
        <PaginationControls page={data} onPageChange={setPage} />
      </div>

      {lockedOnly && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm text-error">
          <Ban className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-semibold">Đang lọc tài khoản bị khóa. Tắt bộ lọc để xem toàn bộ người dùng.</p>
        </div>
      )}
    </AdminShell>
  );
};
