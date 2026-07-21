import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Flag, Loader2, Search, XCircle } from 'lucide-react';
import {
  listAdminReports,
  reviewAdminReport,
  type AdminReport,
  type AdminReportStatus,
} from '../../api/adminReports';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { useToast } from '../../components/ui/ToastRegion';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { StatusBadge } from './components/StatusBadge';
import type { Tone } from './types';

const PAGE_SIZE = 12;
const inputClass = 'h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
const primaryButton = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50';
const outlineButton = 'inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-3 py-2 text-xs font-bold text-on-surface hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';

const emptyPage: PaginatedResponse<AdminReport> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

const statusOptions: Array<{ label: string; value: AdminReportStatus | 'all' }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Mới', value: 'Open' },
  { label: 'Đang xử lý', value: 'InReview' },
  { label: 'Đã xử lý', value: 'Resolved' },
  { label: 'Bỏ qua', value: 'Dismissed' },
];

const targetOptions = [
  { label: 'Mọi loại', value: 'all' },
  { label: 'Sân', value: 'Venue' },
  { label: 'Booking', value: 'Booking' },
  { label: 'Người dùng', value: 'User' },
  { label: 'Bài viết', value: 'Post' },
  { label: 'CLB', value: 'Club' },
  { label: 'Khác', value: 'Other' },
];

const statusTone = (status: string): Tone => {
  if (status === 'Open') return 'warning';
  if (status === 'InReview') return 'info';
  if (status === 'Resolved') return 'success';
  if (status === 'Dismissed') return 'neutral';
  return 'neutral';
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

export const AdminReports = () => {
  const { token } = useAuth();
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<AdminReportStatus | 'all'>('Open');
  const [targetType, setTargetType] = useState('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<AdminReport>>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      setData(await listAdminReports(token, {
        search: debouncedSearch,
        status,
        targetType,
        page,
        pageSize: PAGE_SIZE,
      }));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách báo cáo.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, page, status, targetType, token]);

  useEffect(() => {
    void loadReports();
  }, [loadReports]);

  const openOnPage = useMemo(() => data.items.filter((item) => item.status === 'Open').length, [data.items]);

  const review = async (report: AdminReport, nextStatus: Exclude<AdminReportStatus, 'Open'>) => {
    if (!token) return;
    const resolutionNote = window.prompt(
      nextStatus === 'Resolved' ? 'Ghi chú xử lý báo cáo:' : 'Lý do bỏ qua/chuyển trạng thái:',
      report.resolutionNote ?? '',
    )?.trim();
    if (resolutionNote === undefined) return;
    const actionLabel = nextStatus === 'Resolved'
      ? 'đánh dấu báo cáo đã xử lý'
      : nextStatus === 'Dismissed' ? 'bỏ qua báo cáo' : 'nhận xử lý báo cáo';
    if (!window.confirm(`Xác nhận ${actionLabel} này?`)) return;


    setBusyId(report.communityReportId);
    try {
      const updated = await reviewAdminReport(token, report.communityReportId, { status: nextStatus, resolutionNote });
      setData((current) => ({
        ...current,
        items: current.items.map((item) => item.communityReportId === updated.communityReportId ? updated : item),
      }));
      notify('Đã cập nhật báo cáo.', 'success');
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật báo cáo.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell activeId="reports">
      <MobileAdminNav activeId="reports" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Khiếu nại & báo cáo</p>
          <h1 className="text-[30px] font-bold leading-tight md:text-[36px]">Xử lý báo cáo toàn sàn</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Theo dõi báo cáo thật từ người dùng về sân, booking, người chơi, bài viết hoặc nội dung khác.
          </p>
        </div>
        <div className="grid min-w-64 grid-cols-2 overflow-hidden rounded-xl border border-outline-variant bg-white">
          <div className="p-3">
            <p className="text-2xl font-bold text-primary">{data.totalCount}</p>
            <p className="text-xs text-on-surface-variant">báo cáo phù hợp</p>
          </div>
          <div className="border-l border-outline-variant p-3">
            <p className="text-2xl font-bold text-[#9b6b00]">{openOnPage}</p>
            <p className="text-xs text-on-surface-variant">mới trên trang</p>
          </div>
        </div>
      </section>

      <section className="mb-4 rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
        <div className="grid gap-3 xl:grid-cols-[minmax(260px,1fr)_auto_180px] xl:items-center">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              aria-label="Tìm báo cáo"
              className={`${inputClass} pl-9`}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm nội dung, người gửi, đối tượng..."
              value={search}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {statusOptions.map((option) => (
              <button
                aria-pressed={status === option.value}
                className={`shrink-0 rounded-lg px-3 py-2 text-xs font-bold ${status === option.value ? 'bg-[#0b2228] text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-primary/10 hover:text-primary'}`}
                key={option.value}
                onClick={() => { setStatus(option.value); setPage(1); }}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
          <select aria-label="Lọc theo đối tượng" className={inputClass} onChange={(event) => { setTargetType(event.target.value); setPage(1); }} value={targetType}>
            {targetOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </div>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm font-semibold text-error" role="alert">
          <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          <button className="ml-auto underline" onClick={() => void loadReports()} type="button">Thử lại</button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-left">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Báo cáo', 'Người gửi', 'Đối tượng', 'Lý do', 'Trạng thái', 'Thao tác'].map((heading) => (
                  <th className="px-4 py-3 font-bold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {data.items.map((report) => (
                <tr className="align-top hover:bg-surface-container-low" key={report.communityReportId}>
                  <td className="px-4 py-3">
                    <p className="font-bold">#{report.communityReportId}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{formatDateTime(report.createdAt)}</p>
                    <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                      <Flag className="h-3.5 w-3.5" />{report.priority}
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{report.reporterName}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{report.reporterEmail}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{report.targetLabel}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{report.targetType}{report.targetId ? ` #${report.targetId}` : ''}</p>
                  </td>
                  <td className="max-w-md px-4 py-3">
                    <p className="text-sm font-bold">{report.reason}</p>
                    {report.description && <p className="mt-1 text-xs leading-5 text-on-surface-variant">{report.description}</p>}
                    {report.resolutionNote && <p className="mt-2 rounded-lg bg-surface-container-low p-2 text-xs font-semibold text-on-surface-variant">Admin: {report.resolutionNote}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={statusTone(report.status)}>{report.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button className={outlineButton} disabled={busyId === report.communityReportId || report.status === 'InReview'} onClick={() => void review(report, 'InReview')} type="button">
                        {busyId === report.communityReportId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Flag className="h-4 w-4" />}
                        Nhận xử lý
                      </button>
                      <button className={primaryButton} disabled={busyId === report.communityReportId || report.status === 'Resolved'} onClick={() => void review(report, 'Resolved')} type="button">
                        <CheckCircle2 className="h-4 w-4" />Đã xử lý
                      </button>
                      <button className={`${outlineButton} text-error`} disabled={busyId === report.communityReportId || report.status === 'Dismissed'} onClick={() => void review(report, 'Dismissed')} type="button">
                        <XCircle className="h-4 w-4" />Bỏ qua
                      </button>
                    </div>
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
              <Flag className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-bold">Không có báo cáo phù hợp</p>
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
