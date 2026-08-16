import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Lock, Search, Unlock, Users } from 'lucide-react';
import {
  listAdminClubs,
  moderateAdminClub,
  type AdminClub,
} from '../../api/adminClubs';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { useToast } from '../../components/ui/ToastRegion';
import { useApiQuery } from '../../hooks/useApiQuery';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { StatusBadge } from './components/StatusBadge';
import { useConfirm, usePrompt } from '../../components/ui/ConfirmDialogRegion';

const PAGE_SIZE = 12;
const inputClass = 'h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
const primaryButton = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50';
const outlineButton = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';

const emptyPage: PaginatedResponse<AdminClub> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

const statusOptions = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang hoạt động', value: 'active' },
  { label: 'Đã tạm khóa', value: 'suspended' },
];

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export const AdminClubs = () => {
  const { token } = useAuth();
  const confirm = useConfirm();
  const prompt = usePrompt();
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const {
    data = emptyPage,
    error,
    loading,
    refresh: loadClubs,
    setData,
  } = useApiQuery(
    ['admin-clubs', token, debouncedSearch, statusFilter, page],
    () => listAdminClubs(token!, {
      search: debouncedSearch,
      suspendedOnly: statusFilter === 'suspended' ? true : undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
    { enabled: Boolean(token), errorMessage: 'Không thể tải danh sách câu lạc bộ.' },
  );

  const suspendedOnPage = useMemo(() => data.items.filter((item) => item.isSuspended).length, [data.items]);

  const moderate = async (club: AdminClub, isSuspended: boolean) => {
    if (!token) return;
    let suspensionReason = '';
    if (isSuspended) {
      const typed = await prompt({
        title: 'Tạm khóa câu lạc bộ này?',
        message: 'Thành viên sẽ không truy cập được câu lạc bộ cho tới khi mở lại.',
        label: 'Lý do tạm khóa',
        defaultValue: club.suspensionReason ?? '',
        required: true,
        confirmLabel: 'Tạm khóa',
        tone: 'danger',
      });
      if (typed === null) return;
      suspensionReason = typed.trim();
    } else if (!(await confirm({
      title: 'Mở lại câu lạc bộ này?',
      message: 'Câu lạc bộ sẽ hoạt động trở lại bình thường.',
      confirmLabel: 'Mở lại',
      tone: 'success',
    }))) return;

    setBusyId(club.groupId);
    try {
      const updated = await moderateAdminClub(token, club.groupId, {
        isSuspended,
        suspensionReason: suspensionReason || undefined,
      });
      setData((current) => {
        const page = current ?? emptyPage;
        return {
          ...page,
          items: page.items.map((item) => item.groupId === updated.groupId ? updated : item),
        };
      });
      notify(isSuspended ? 'Đã tạm khóa câu lạc bộ.' : 'Đã mở lại câu lạc bộ.', 'success');
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật câu lạc bộ.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell activeId="clubs">
      <MobileAdminNav activeId="clubs" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Kiểm duyệt cộng đồng</p>
          <h1 className="text-[30px] font-bold leading-tight md:text-[36px]">Quản lý câu lạc bộ</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Xem các câu lạc bộ thật trên hệ thống và tạm khóa những nhóm vi phạm chính sách cộng đồng.
          </p>
        </div>
        <div className="grid min-w-64 grid-cols-2 overflow-hidden rounded-xl border border-outline-variant bg-white">
          <div className="p-3">
            <p className="text-2xl font-bold text-primary">{data.totalCount}</p>
            <p className="text-xs text-on-surface-variant">câu lạc bộ phù hợp</p>
          </div>
          <div className="border-l border-outline-variant p-3">
            <p className="text-2xl font-bold text-error">{suspendedOnPage}</p>
            <p className="text-xs text-on-surface-variant">đang tạm khóa trên trang</p>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto] lg:items-center">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input aria-label="Tìm câu lạc bộ" className={`${inputClass} pl-9`} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên câu lạc bộ, chủ nhóm..." value={search} />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {statusOptions.map((option) => (
              <button
                aria-pressed={statusFilter === option.value}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${statusFilter === option.value ? 'bg-[#0b2228] text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                key={option.value}
                onClick={() => { setStatusFilter(option.value); setPage(1); }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm font-semibold text-error" role="alert">
          <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          <button className="ml-auto underline" onClick={() => void loadClubs()} type="button">Thử lại</button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1000px] text-left">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Câu lạc bộ', 'Chủ nhóm', 'Quy mô', 'Trạng thái', 'Thao tác'].map((heading) => (
                  <th className="px-4 py-3 font-bold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {data.items.map((club) => (
                <tr className="align-top hover:bg-surface-container-low" key={club.groupId}>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{club.groupName}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{club.groupType} · Tạo {formatDateTime(club.createdAt)}</p>
                    {club.description && <p className="mt-2 max-w-md text-sm leading-6 text-on-surface-variant">{club.description}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{club.ownerName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container-low px-2 py-1 text-xs font-bold text-on-surface-variant">
                      <Users className="h-3.5 w-3.5" />{club.memberCount} thành viên
                    </span>
                    <p className="mt-1 text-xs text-on-surface-variant">{club.postCount} bài viết</p>
                  </td>
                  <td className="px-4 py-3">
                    {club.isSuspended ? (
                      <>
                        <StatusBadge tone="danger">Đã tạm khóa</StatusBadge>
                        {club.suspensionReason && <p className="mt-1 max-w-52 text-xs text-error">{club.suspensionReason}</p>}
                        {club.moderatedByName && club.moderatedAt && (
                          <p className="mt-1 max-w-52 text-xs text-on-surface-variant">Bởi {club.moderatedByName} · {formatDateTime(club.moderatedAt)}</p>
                        )}
                      </>
                    ) : (
                      <StatusBadge tone="success">Đang hoạt động</StatusBadge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      className={club.isSuspended ? primaryButton : `${outlineButton} text-error`}
                      disabled={busyId === club.groupId}
                      onClick={() => void moderate(club, !club.isSuspended)}
                      type="button"
                    >
                      {busyId === club.groupId ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : club.isSuspended ? (
                        <Unlock className="h-4 w-4" />
                      ) : (
                        <Lock className="h-4 w-4" />
                      )}
                      {club.isSuspended ? 'Mở lại' : 'Tạm khóa'}
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
              <Users className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-bold">Không có câu lạc bộ phù hợp</p>
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
