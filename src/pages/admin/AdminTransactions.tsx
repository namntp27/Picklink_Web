import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Banknote, CheckCircle2, Loader2, Search, Settings2, XCircle } from 'lucide-react';
import {
  confirmListingFeePayment,
  getListingFeeSettings,
  listListingFeePayments,
  rejectListingFeePayment,
  updateListingFeeSettings,
  type ListingFeePayment,
  type ListingFeePaymentListParams,
  type ListingFeeSettings,
} from '../../api/listingFees';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { useToast } from '../../components/ui/ToastRegion';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';
import { StatusBadge } from './components/StatusBadge';
import type { Tone } from './types';

const PAGE_SIZE = 12;
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const emptyPage: PaginatedResponse<ListingFeePayment> = {
  items: [],
  page: 1,
  pageSize: PAGE_SIZE,
  totalCount: 0,
  totalPages: 0,
};

const statusOptions: Array<{ label: string; value: ListingFeePaymentListParams['status'] }> = [
  { label: 'Chờ duyệt', value: 'PendingReview' },
  { label: 'Đã xác nhận', value: 'Confirmed' },
  { label: 'Từ chối', value: 'Rejected' },
  { label: 'Tất cả', value: 'all' },
];

const statusLabel: Record<string, string> = {
  PendingReview: 'Chờ duyệt',
  Confirmed: 'Đã xác nhận',
  Rejected: 'Từ chối',
};

const statusTone: Record<string, Tone> = {
  PendingReview: 'warning',
  Confirmed: 'success',
  Rejected: 'danger',
};

const inputClass = 'w-full rounded-xl border border-outline-variant bg-white px-3 py-2.5 text-sm font-semibold text-on-surface outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#0b2228] px-3 py-2 text-sm font-bold text-white transition hover:bg-[#143f34] disabled:cursor-not-allowed disabled:opacity-60';
const outlineButton = 'inline-flex items-center justify-center gap-2 rounded-xl border border-outline-variant bg-white px-3 py-2 text-sm font-bold text-[#0b2228] transition hover:border-primary hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60';

const formatDate = (value?: string | null) => value ? dateTime.format(new Date(value)) : '—';

export const AdminTransactions = () => {
  const { token } = useAuth();
  const notify = useToast();
  const [settings, setSettings] = useState<ListingFeeSettings | null>(null);
  const [priceDraft, setPriceDraft] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ListingFeePaymentListParams['status']>('PendingReview');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<PaginatedResponse<ListingFeePayment>>(emptyPage);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      const [nextSettings, payments] = await Promise.all([
        getListingFeeSettings(token),
        listListingFeePayments(token, {
          status,
          search: search.trim(),
          page,
          pageSize: PAGE_SIZE,
        }),
      ]);
      setSettings(nextSettings);
      setPriceDraft(String(nextSettings.pricePerCourtPerMonth || ''));
      setData(payments);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải dữ liệu phí lên sàn.');
    } finally {
      setLoading(false);
    }
  }, [page, search, status, token]);

  useEffect(() => {
    void load();
  }, [load]);

  const saveSettings = async () => {
    if (!token) return;
    const price = Number(priceDraft);
    if (!Number.isFinite(price) || price <= 0) {
      notify('Đơn giá phải lớn hơn 0.', 'error');
      return;
    }
    setSavingSettings(true);
    try {
      const updated = await updateListingFeeSettings(token, price);
      setSettings(updated);
      notify('Đã cập nhật đơn giá phí lên sàn.', 'success');
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật đơn giá.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  const confirmPayment = async (payment: ListingFeePayment) => {
    if (!token) return;
    setBusyId(payment.venueListingPaymentId);
    try {
      await confirmListingFeePayment(token, payment.venueListingPaymentId);
      notify('Đã xác nhận phí lên sàn.', 'success');
      await load();
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể xác nhận giao dịch.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  const rejectPayment = async (payment: ListingFeePayment) => {
    if (!token) return;
    const reason = window.prompt('Lý do từ chối biên lai phí lên sàn?')?.trim();
    if (!reason) return;
    setBusyId(payment.venueListingPaymentId);
    try {
      await rejectListingFeePayment(token, payment.venueListingPaymentId, reason);
      notify('Đã từ chối biên lai phí lên sàn.', 'success');
      await load();
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể từ chối giao dịch.', 'error');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminShell activeId="transactions">
      <MobileAdminNav activeId="transactions" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Phí lên sàn</p>
          <h1 className="text-[30px] font-bold leading-tight md:text-[36px]">Thu phí chủ sân</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Quản lý đơn giá theo sân con/tháng và xác nhận biên lai owner gửi để sân được hiển thị trên sàn.
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm">
          <p className="text-xs font-bold uppercase text-on-surface-variant">Đơn giá hiện tại</p>
          <p className="mt-1 text-2xl font-black text-primary">{currency.format(settings?.pricePerCourtPerMonth ?? 0)}</p>
          <p className="mt-1 text-xs text-on-surface-variant">/ sân con / tháng</p>
        </div>
      </section>

      <section className="mb-4 grid gap-4 rounded-xl border border-outline-variant bg-white p-4 shadow-sm lg:grid-cols-[380px_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <h2 className="font-bold">Cấu hình đơn giá</h2>
          </div>
          <div className="flex gap-2">
            <input
              className={inputClass}
              min={1}
              onChange={(event) => setPriceDraft(event.target.value)}
              placeholder="VD: 150000"
              type="number"
              value={priceDraft}
            />
            <button className={primaryButton} disabled={savingSettings} onClick={() => void saveSettings()} type="button">
              {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Banknote className="h-4 w-4" />}
              Lưu
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="relative w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
            <input
              className={`${inputClass} pl-9`}
              onChange={(event) => { setSearch(event.target.value); setPage(1); }}
              placeholder="Tìm cụm sân, owner, email..."
              value={search}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
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
          <button className="ml-auto underline" onClick={() => void load()} type="button">Thử lại</button>
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1040px] text-left">
            <thead className="border-b border-outline-variant bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                {['Cụm sân', 'Owner', 'Công thức', 'Số tiền', 'Biên lai', 'Thời hạn', 'Trạng thái', ''].map((heading) => (
                  <th className="px-4 py-3 font-bold" key={heading}>{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {data.items.map((payment) => (
                <tr className="hover:bg-surface-container-low" key={payment.venueListingPaymentId}>
                  <td className="px-4 py-3">
                    <p className="font-bold">{payment.venueName}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">#{payment.venueId} · gửi {formatDate(payment.submittedAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold">{payment.ownerName}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{payment.ownerEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">
                    {payment.activeCourtCount} sân × {currency.format(payment.pricePerCourtPerMonth)} × {payment.months} tháng
                  </td>
                  <td className="px-4 py-3 text-sm font-black text-primary">{currency.format(payment.amount)}</td>
                  <td className="px-4 py-3">
                    {payment.receiptImageUrl ? (
                      <a className="text-sm font-bold text-primary underline" href={payment.receiptImageUrl} rel="noreferrer" target="_blank">Xem biên lai</a>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">
                    {payment.paidUntil ? `Đến ${formatDate(payment.paidUntil)}` : 'Chưa kích hoạt'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={statusTone[payment.status] ?? 'neutral'}>{statusLabel[payment.status] ?? payment.status}</StatusBadge>
                    {payment.rejectionReason && <p className="mt-1 max-w-52 text-xs text-error">{payment.rejectionReason}</p>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {payment.status === 'PendingReview' && (
                      <div className="flex justify-end gap-2">
                        <button className={primaryButton} disabled={busyId === payment.venueListingPaymentId} onClick={() => void confirmPayment(payment)} type="button">
                          {busyId === payment.venueListingPaymentId ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Xác nhận
                        </button>
                        <button className={`${outlineButton} border-error/40 text-error`} disabled={busyId === payment.venueListingPaymentId} onClick={() => void rejectPayment(payment)} type="button">
                          <XCircle className="h-4 w-4" />Từ chối
                        </button>
                      </div>
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
              <Banknote className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 font-bold">Không có giao dịch phí lên sàn phù hợp</p>
              <p className="mt-1 text-sm text-on-surface-variant">Thử đổi trạng thái hoặc từ khóa tìm kiếm.</p>
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
