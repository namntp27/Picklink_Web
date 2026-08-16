import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Check,
  Clock,
  Eye,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Search,
  Star,
  UserRound,
  X,
  XCircle,
} from 'lucide-react';
import {
  approveAdminVenue,
  getAdminVenue,
  listAdminVenues,
  rejectAdminVenue,
  type AdminVenueApprovalStatus,
  type AdminVenueDetail,
  type AdminVenueSummary,
} from '../../api/adminVenues';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { ModalDialog } from '../../components/ui/ModalDialog';
import { useToast } from '../../components/ui/ToastRegion';
import { useApiQuery } from '../../hooks/useApiQuery';
import { useVenueRealtime } from '../../hooks/useVenueRealtime';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { useConfirm } from '../../components/ui/ConfirmDialogRegion';

const PAGE_SIZE = 10;
const inputClass = 'h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
const primaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50';
const outlineButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-low disabled:cursor-not-allowed disabled:opacity-50';

const statusOptions: Array<{ label: string; value: AdminVenueApprovalStatus | 'all' }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ duyệt', value: 'Pending' },
  { label: 'Đã duyệt', value: 'Approved' },
  { label: 'Từ chối', value: 'Rejected' },
  { label: 'Bản nháp', value: 'Draft' },
];

const emptyPage = (): PaginatedResponse<AdminVenueSummary> => ({
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
});

const statusLabel: Record<AdminVenueApprovalStatus, string> = {
  Draft: 'Bản nháp',
  Pending: 'Chờ duyệt',
  Approved: 'Đã duyệt',
  Rejected: 'Từ chối',
};

const statusClass: Record<AdminVenueApprovalStatus, string> = {
  Draft: 'bg-surface-container text-on-surface-variant',
  Pending: 'bg-[#fff4d8] text-[#7a5600]',
  Approved: 'bg-primary/10 text-primary',
  Rejected: 'bg-error-container text-error',
};

const formatDateTime = (value?: string | null) => {
  if (!value) return 'Chưa gửi duyệt';
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const ReviewDialog = ({
  venue,
  busy,
  onClose,
  onSubmit,
}: {
  venue: AdminVenueDetail;
  busy: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  return (
    <ModalDialog
      aria-labelledby="reject-venue-title"
      canClose={!busy}
      className="w-[calc(100%-2rem)] max-w-lg rounded-2xl bg-white shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-none"
      closeOnBackdrop={false}
      onRequestClose={onClose}
    >
        <div className="flex items-start justify-between gap-4 border-b border-outline-variant p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-error">Từ chối hồ sơ sân</p>
            <h2 className="mt-1 text-xl font-bold" id="reject-venue-title">{venue.venueName}</h2>
          </div>
          <button aria-label="Đóng" className="rounded-lg p-2 hover:bg-surface-container-low" disabled={busy} onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form className="p-5" onSubmit={(event) => { event.preventDefault(); onSubmit(rejectionReason.trim()); }}>
          <label>
            <span className="text-sm font-bold">Lý do từ chối *</span>
            <textarea
              autoFocus
              className="mt-2 min-h-32 w-full resize-y rounded-lg border border-outline-variant bg-white p-3 text-sm outline-none focus:border-error focus:ring-2 focus:ring-error/15"
              maxLength={500}
              minLength={3}
              onChange={(event) => setRejectionReason(event.target.value)}
              placeholder="Nêu rõ thông tin hoặc hình ảnh Owner cần bổ sung..."
              required
              value={rejectionReason}
            />
          </label>
          <div className="mt-1 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Tối thiểu 3 ký tự</span>
            <span>{rejectionReason.length}/500</span>
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button className={outlineButton} disabled={busy} onClick={onClose} type="button">Hủy</button>
            <button
              className={`${primaryButton} bg-error hover:bg-error/90`}
              disabled={busy || rejectionReason.trim().length < 3}
              type="submit"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Xác nhận từ chối
            </button>
          </div>
        </form>
    </ModalDialog>
  );
};

const VenueDetailDialog = ({
  venue,
  loading,
  busy,
  onApprove,
  onClose,
  onReject,
}: {
  venue: AdminVenueDetail | null;
  loading: boolean;
  busy: boolean;
  onApprove: () => void;
  onClose: () => void;
  onReject: () => void;
}) => {
  if (!venue && !loading) return null;

  return (
    <ModalDialog
      aria-labelledby="venue-detail-title"
      canClose={!busy}
      className="m-0 h-dvh w-full max-w-none overflow-hidden rounded-none bg-white shadow-[0_24px_80px_rgba(24,50,35,0.24)] backdrop:bg-[#17251d]/45 backdrop:backdrop-blur-sm sm:w-1/2 sm:rounded-r-2xl"
      closeOnBackdrop={false}
      onRequestClose={onClose}
      style={{ maxHeight: '100dvh' }}
    >
      <div className="flex h-dvh flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-outline-variant px-4 py-3">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Hồ sơ sân</p>
            <h2 className="mt-0.5 truncate text-base font-bold tracking-tight" id="venue-detail-title">{venue?.venueName ?? 'Đang tải...'}</h2>
          </div>
          <div className="flex items-center gap-2">
            {venue && (
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${statusClass[venue.approvalStatus]}`}>
                {statusLabel[venue.approvalStatus]}
              </span>
            )}
            <button aria-label="Đóng" className="rounded-lg p-2 transition-colors hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50" disabled={busy} onClick={onClose} type="button">
              <X className="h-5 w-5" />
            </button>
          </div>
        </header>

        {loading || !venue ? (
          <div className="grid min-h-56 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <section className="grid gap-4 p-4 sm:grid-cols-[7rem_minmax(0,1fr)]">
              {venue.primaryImageUrl ? (
                <img alt={venue.venueName} className="h-28 w-full rounded-lg object-cover" src={venue.primaryImageUrl} />
              ) : (
                <div className="grid h-28 place-items-center rounded-lg bg-surface-container-low text-on-surface-variant">
                  <ImageIcon className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="flex items-start gap-1.5 text-xs leading-4 text-on-surface-variant">
                  <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span>{venue.address}</span>
                </p>
                {venue.rejectionReason && (
                  <p className="mt-2 rounded-md bg-error-container px-2.5 py-1.5 text-xs font-semibold text-error">
                    {venue.rejectionReason}
                  </p>
                )}
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-3 border-t border-outline-variant pt-3">
                  <div>
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant"><UserRound className="h-3.5 w-3.5 text-primary" />Chủ sân</dt>
                    <dd className="mt-1 truncate text-sm font-semibold" title={venue.ownerName}>{venue.ownerName}</dd>
                    <dd className="truncate text-xs text-on-surface-variant" title={venue.ownerEmail}>{venue.ownerEmail}</dd>
                    {venue.phoneNumber && <dd className="text-xs text-on-surface-variant">{venue.phoneNumber}</dd>}
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant"><Clock className="h-3.5 w-3.5 text-primary" />Vận hành</dt>
                    <dd className="mt-1 text-sm font-semibold tabular-nums">{venue.openTime}–{venue.closeTime}</dd>
                    <dd className="text-xs text-on-surface-variant">{venue.isOpen ? 'Đang mở nhận lịch' : 'Đang đóng sân'}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-on-surface-variant">Giá cơ sở</dt>
                    <dd className="mt-1 text-sm font-bold tabular-nums text-primary">{formatCurrency(venue.basePrice)}<span className="font-medium">/giờ</span></dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-[11px] font-semibold text-on-surface-variant"><Star className="h-3.5 w-3.5 text-primary" />Đánh giá</dt>
                    <dd className="mt-1 text-sm font-bold tabular-nums">{venue.overallRating.toFixed(1)} / 5</dd>
                  </div>
                </dl>
              </div>
            </section>

            <section className="border-t border-outline-variant px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-bold">Sân con</h3>
                <span className="text-xs font-semibold text-on-surface-variant">{venue.courts.length} sân</span>
              </div>
              <div className="mt-2 divide-y divide-outline-variant">
                {venue.courts.map((court) => (
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2 text-sm" key={court.courtId}>
                    <div className="min-w-0 text-left">
                      <p className="font-semibold">Sân {court.courtNumber} · {court.courtType}</p>
                      <p className="mt-0.5 text-xs text-on-surface-variant">{court.surfaceType || 'Chưa cập nhật mặt sân'} · {court.isIndoor ? 'Trong nhà' : 'Ngoài trời'} · {court.availabilityStatus}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="whitespace-nowrap font-semibold tabular-nums text-primary">{formatCurrency(court.hourlyPrice)}/giờ</p>
                    </div>
                  </div>
                ))}
                {!venue.courts.length && <p className="py-3 text-sm text-on-surface-variant">Chưa có sân con.</p>}
              </div>
            </section>

            <section className="border-t border-outline-variant px-4 py-3">
              <h3 className="text-sm font-bold">Tiện ích</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {venue.amenities.map((amenity) => <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary" key={amenity}>{amenity}</span>)}
                {!venue.amenities.length && <span className="text-sm text-on-surface-variant">Chưa khai báo tiện ích.</span>}
              </div>
            </section>

            {venue.images.length > 1 && (
              <section className="border-t border-outline-variant px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold">Hình ảnh</h3>
                  <span className="text-xs font-semibold text-on-surface-variant">{venue.images.length} ảnh</span>
                </div>
                <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                  {venue.images.map((image) => (
                    <img alt={image.caption || venue.venueName} className="h-16 w-24 shrink-0 rounded-md object-cover" decoding="async" key={image.venueImageId} loading="lazy" src={image.imageUrl} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {venue?.approvalStatus === 'Pending' && (
          <footer className="grid shrink-0 grid-cols-2 gap-2.5 border-t border-outline-variant bg-white px-4 py-3">
            <button className={`${outlineButton} border-error/40 text-error`} disabled={busy} onClick={onReject} type="button">
              <XCircle className="h-4 w-4" />Từ chối
            </button>
            <button className={primaryButton} disabled={busy} onClick={onApprove} type="button">
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Duyệt sân
            </button>
          </footer>
        )}
      </div>
    </ModalDialog>
  );
};

export const AdminCourts = () => {
  const { token } = useAuth();
  const confirm = useConfirm();
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<AdminVenueApprovalStatus | 'all'>('Pending');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<AdminVenueDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const {
    data = emptyPage(),
    error,
    loading,
    refresh: loadVenues,
  } = useApiQuery(
    ['admin-venues', token, debouncedSearch, status, page],
    () => listAdminVenues(token!, {
      search: debouncedSearch,
      status,
      page,
      pageSize: PAGE_SIZE,
    }),
    { enabled: Boolean(token), errorMessage: 'Không thể tải danh sách sân.' },
  );

  useVenueRealtime((event) => {
    if (!token) return;
    void loadVenues();
    if (event.venueId === selectedId) {
      setLoadingDetail(true);
      void getAdminVenue(event.venueId, token)
        .then(setSelected)
        .catch(() => undefined)
        .finally(() => setLoadingDetail(false));
    }
  });

  const openDetail = async (venueId: number) => {
    if (!token) return;
    setSelectedId(venueId);
    setSelected(null);
    setLoadingDetail(true);
    try {
      setSelected(await getAdminVenue(venueId, token));
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể tải hồ sơ sân.', 'error');
      setSelectedId(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const approve = async () => {
    if (!token || !selected) return;
    if (!(await confirm({
      title: `Duyệt cụm sân “${selected.venueName}”?`,
      message: 'Cụm sân sẽ hiển thị công khai và người chơi có thể đặt ngay.',
      confirmLabel: 'Duyệt cụm sân',
      tone: 'success',
    }))) return;
    setBusy(true);
    try {
      const updated = await approveAdminVenue(selected.venueId, token);
      setSelected(updated);
      notify('Đã duyệt sân. Sân có thể xuất hiện trong luồng đặt sân.', 'success');
      await loadVenues();
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể duyệt sân.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const reject = async (reason: string) => {
    if (!token || !selected || reason.length < 3) return;
    if (!(await confirm({
      title: `Từ chối hồ sơ “${selected.venueName}”?`,
      message: 'Chủ sân sẽ nhận được thông báo và cần nộp lại hồ sơ.',
      confirmLabel: 'Từ chối hồ sơ',
      tone: 'danger',
    }))) return;
    setBusy(true);
    try {
      const updated = await rejectAdminVenue(selected.venueId, reason, token);
      setSelected(updated);
      setShowRejectDialog(false);
      notify('Đã từ chối hồ sơ và gửi lý do cho Owner.', 'success');
      await loadVenues();
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể từ chối sân.', 'error');
    } finally {
      setBusy(false);
    }
  };

  const currentPendingCount = useMemo(
    () => data.items.filter((venue) => venue.approvalStatus === 'Pending').length,
    [data.items],
  );

  return (
    <AdminShell activeId="courts">
      <MobileAdminNav activeId="courts" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Kiểm duyệt sân</p>
          <h1 className="text-[30px] font-bold leading-tight md:text-[36px]">Duyệt hồ sơ sân</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Kiểm tra thông tin vận hành, vị trí, sân con và hình ảnh trước khi cho phép sân xuất hiện với người chơi.
          </p>
        </div>
        <div className="grid min-w-48 grid-cols-2 overflow-hidden rounded-xl border border-outline-variant bg-white">
          <div className="p-3">
            <p className="text-2xl font-bold text-primary">{data.totalCount}</p>
            <p className="text-xs text-on-surface-variant">hồ sơ phù hợp</p>
          </div>
          <div className="border-l border-outline-variant p-3">
            <p className="text-2xl font-bold text-[#9b6b00]">{currentPendingCount}</p>
            <p className="text-xs text-on-surface-variant">chờ trên trang</p>
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
              placeholder="Tìm tên sân, chủ sân, email, địa chỉ..."
              value={search}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 xl:pb-0">
            {statusOptions.map((option) => (
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
        </div>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm font-semibold text-error">
          <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          <button className="ml-auto underline" onClick={() => void loadVenues()} type="button">Thử lại</button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Sân', 'Chủ sân', 'Địa chỉ', 'Quy mô', 'Gửi duyệt', 'Trạng thái', ''].map((heading) => (
                  <th className="px-4 py-3 font-bold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {data.items.map((venue) => (
                <tr className="hover:bg-surface-container-low" key={venue.venueId}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {venue.primaryImageUrl ? (
                        <img alt="" className="h-11 w-14 rounded-lg object-cover" decoding="async" loading="lazy" src={venue.primaryImageUrl} />
                      ) : (
                        <span className="grid h-11 w-14 place-items-center rounded-lg bg-surface-container text-on-surface-variant"><Building2 className="h-5 w-5" /></span>
                      )}
                      <div><p className="font-bold">{venue.venueName}</p><p className="mt-1 text-xs text-on-surface-variant">{venue.phoneNumber || 'Chưa có SĐT'}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><p className="text-sm font-bold">{venue.ownerName}</p><p className="mt-1 text-xs text-on-surface-variant">{venue.ownerEmail}</p></td>
                  <td className="max-w-64 px-4 py-3 text-sm text-on-surface-variant">{venue.address}</td>
                  <td className="px-4 py-3 text-sm font-bold">{venue.courtCount} sân</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{formatDateTime(venue.submittedAt)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[venue.approvalStatus]}`}>{statusLabel[venue.approvalStatus]}</span></td>
                  <td className="px-4 py-3 text-right">
                    <button className={outlineButton} onClick={() => void openDetail(venue.venueId)} type="button"><Eye className="h-4 w-4" />Chi tiết</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="grid min-h-56 place-items-center border-t border-outline-variant"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        )}
        {!loading && !data.items.length && (
          <div className="grid min-h-56 place-items-center border-t border-outline-variant p-6 text-center">
            <div><Building2 className="mx-auto h-8 w-8 text-primary" /><p className="mt-3 font-bold">Không có hồ sơ sân phù hợp</p><p className="mt-1 text-sm text-on-surface-variant">Thử đổi bộ lọc hoặc từ khóa tìm kiếm.</p></div>
          </div>
        )}
      </section>

      <div className="mt-4">
        <PaginationControls page={data} onPageChange={setPage} />
      </div>

      <VenueDetailDialog
        busy={busy}
        loading={loadingDetail && selectedId !== null}
        onApprove={() => void approve()}
        onClose={() => { if (!busy) { setSelectedId(null); setSelected(null); } }}
        onReject={() => setShowRejectDialog(true)}
        venue={selected}
      />
      {showRejectDialog && selected && (
        <ReviewDialog
          busy={busy}
          onClose={() => { if (!busy) setShowRejectDialog(false); }}
          onSubmit={(reason) => void reject(reason)}
          venue={selected}
        />
      )}
    </AdminShell>
  );
};
