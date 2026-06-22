import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, Clock, Eye, Loader2, ReceiptText, RefreshCw, Search, XCircle } from 'lucide-react';
import type { BankTransfer } from '../../api/booking';
import { ApiError } from '../../api/client';
import { approveOperatorPayment, getOperatorPayment, getOperatorPayments, rejectOperatorPayment } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { OwnerShell } from './components/OwnerShell';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' });
const dateTime = (value: string) => new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
const playDate = (value: string) => new Intl.DateTimeFormat('vi-VN', { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
const playTime = (value: string) => value.slice(11, 16);
const localDate = () => {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};
const paymentStatusLabels: Record<string, string> = {
  Pending: 'Chờ chuyển khoản',
  WaitingForConfirmation: 'Chờ xác nhận',
  Paid: 'Đã thanh toán',
  Expired: 'Đã hết hạn',
  Cancelled: 'Đã hủy',
};
const paymentActionLabels: Record<string, string> = {
  Created: 'Tạo yêu cầu thanh toán',
  Submitted: 'Player gửi biên lai',
  Approved: 'Đã xác nhận thanh toán',
  Rejected: 'Đã từ chối biên lai',
  BookingExpired: 'Booking hết hạn',
  BookingCancelled: 'Booking đã hủy',
};
const paymentStatusClassName = (status: string) => {
  if (status === 'Paid') return 'bg-emerald-100 text-emerald-700';
  if (status === 'WaitingForConfirmation') return 'bg-amber-100 text-amber-800';
  if (status === 'Expired' || status === 'Cancelled') return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
};

export const OwnerPayments = () => {
  const { token } = useAuth();
  const [payments, setPayments] = useState<BankTransfer[]>([]);
  const [dateFilter, setDateFilter] = useState(localDate);
  const [venueFilter, setVenueFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<BankTransfer | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    setError('');
    try { setPayments(await getOperatorPayments(token, 'All')); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách thanh toán.'); }
    finally { if (showLoading) setLoading(false); }
  };
  useEffect(() => { void load(); }, [token]);
  usePaymentRealtime((event) => {
    if (!token) return;
    void getOperatorPayment(token, event.paymentId)
      .then((updated) => {
        setPayments((current) => {
          const exists = current.some((item) => item.paymentId === updated.paymentId);
          return exists
            ? current.map((item) => item.paymentId === updated.paymentId ? updated : item)
            : [updated, ...current];
        });
        setSelected((current) => current?.paymentId === updated.paymentId ? updated : current);
      })
      .catch((requestError) => {
        if (requestError instanceof ApiError && requestError.status === 404) return;
        void load(false);
      });
  });
  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void load(false);
    };
    const fallbackTimer = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load(false);
    }, 15_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.clearInterval(fallbackTimer);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [token]);

  const venues = useMemo(() => [...new Map(payments.map((item) => [item.venueId, item.venueName])).entries()]
    .sort((first, second) => first[1].localeCompare(second[1], 'vi')), [payments]);

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return payments.filter((item) => {
      const matchesDate = !dateFilter || item.startTime.slice(0, 10) === dateFilter;
      const matchesVenue = venueFilter === 'all' || item.venueId.toString() === venueFilter;
      const matchesStatus = statusFilter === 'All' || item.paymentStatus === statusFilter;
      const matchesSearch = !keyword || [item.bookingCode, item.playerName, item.venueName, item.transferContent]
        .some((value) => value?.toLowerCase().includes(keyword));
      return matchesDate && matchesVenue && matchesStatus && matchesSearch;
    });
  }, [dateFilter, payments, search, statusFilter, venueFilter]);

  const approve = async (payment: BankTransfer) => {
    if (!token) return;
    setBusyId(payment.paymentId); setError('');
    try { await approveOperatorPayment(token, payment.paymentId); setSelected(null); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể xác nhận thanh toán.'); }
    finally { setBusyId(null); }
  };

  const reject = async (payment: BankTransfer) => {
    if (!token || rejectReason.trim().length < 3) return;
    setBusyId(payment.paymentId); setError('');
    try { await rejectOperatorPayment(token, payment.paymentId, rejectReason.trim()); setSelected(null); setRejectReason(''); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể từ chối thanh toán.'); }
    finally { setBusyId(null); }
  };

  return <OwnerShell activeId="payments" innerClassName="max-w-[1320px]">
    <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div><p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary"><ReceiptText className="h-4 w-4" /> Đối soát chuyển khoản</p><h1 className="mt-3 text-[30px] font-bold md:text-[40px]">Quản lý thanh toán</h1><p className="mt-2 text-[15px] text-on-surface-variant">Lọc giao dịch theo ngày chơi, sân và trạng thái trong phạm vi được phân quyền.</p></div>
      <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary" onClick={() => void load()} type="button"><RefreshCw className="h-4 w-4" /> Làm mới</button>
    </section>

    {error && <div className="flex gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"><AlertCircle className="h-5 w-5 shrink-0" />{error}</div>}

    <section className="rounded-xl border border-outline-variant bg-white shadow-sm">
      <div className="space-y-4 border-b border-outline-variant p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[200px_minmax(220px,1fr)_220px_auto]">
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Ngày chơi</span>
            <div className="relative"><CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-primary" /><input className="h-11 w-full rounded-lg border border-outline-variant bg-white pl-9 pr-3 text-[14px] font-bold outline-none focus:border-primary" onChange={(event) => setDateFilter(event.target.value)} type="date" value={dateFilter} /></div>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Sân</span>
            <select className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary" onChange={(event) => setVenueFilter(event.target.value)} value={venueFilter}>
              <option value="all">Tất cả sân</option>
              {venues.map(([venueId, venueName]) => <option key={venueId} value={venueId}>{venueName}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[12px] font-bold text-on-surface-variant">Trạng thái</span>
            <select className="h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary" onChange={(event) => setStatusFilter(event.target.value)} value={statusFilter}>
              <option value="All">Tất cả trạng thái</option>
              {Object.entries(paymentStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <button className="mt-auto h-11 rounded-lg border border-outline-variant px-4 text-[13px] font-bold text-on-surface-variant hover:bg-surface-container-low" onClick={() => { setDateFilter(localDate()); setVenueFilter('all'); setStatusFilter('All'); setSearch(''); }} type="button">Đặt lại</button>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] font-bold text-on-surface-variant">Tìm thấy {filtered.length} giao dịch</p>
          <div className="relative sm:w-80"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /><input className="h-10 w-full rounded-lg border border-outline-variant pl-9 pr-3 text-[14px] outline-none focus:border-primary" onChange={(event) => setSearch(event.target.value)} placeholder="Mã booking, người chơi, sân..." value={search} /></div>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <div className="overflow-x-auto"><table className="w-full min-w-[1080px] text-left"><thead className="bg-surface-container-low text-[12px] uppercase text-on-surface-variant"><tr><th className="px-5 py-4">Booking</th><th className="px-5 py-4">Người chuyển</th><th className="px-5 py-4">Sân</th><th className="px-5 py-4">Giờ chơi</th><th className="px-5 py-4">Số tiền</th><th className="px-5 py-4">Trạng thái</th><th className="px-5 py-4 text-right">Thao tác</th></tr></thead><tbody className="divide-y divide-outline-variant">
        {filtered.map((item) => <tr key={item.paymentId}><td className="px-5 py-4"><strong className="text-primary">{item.bookingCode}</strong><p className="mt-1 text-[12px] text-on-surface-variant">{item.submittedAt ? `Gửi lúc ${dateTime(item.submittedAt)}` : 'Chưa gửi biên lai'}</p></td><td className="px-5 py-4 text-[14px] font-bold">{item.playerName}</td><td className="px-5 py-4"><strong>{item.venueName}</strong><p className="mt-1 text-[12px] text-on-surface-variant">Sân {item.courtNumber}</p></td><td className="px-5 py-4"><strong className="whitespace-nowrap">{playTime(item.startTime)}–{playTime(item.endTime)}</strong><p className="mt-1 whitespace-nowrap text-[12px] text-on-surface-variant">{playDate(item.startTime)}</p></td><td className="px-5 py-4 font-bold">{currency.format(item.amount)}</td><td className="px-5 py-4"><span className={`whitespace-nowrap rounded-full px-3 py-1 text-[12px] font-bold ${paymentStatusClassName(item.paymentStatus)}`}>{paymentStatusLabels[item.paymentStatus] ?? item.paymentStatus}</span></td><td className="px-5 py-4 text-right"><button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-bold" onClick={() => { setSelected(item); setRejectReason(''); }} type="button"><Eye className="h-4 w-4" /> Kiểm tra</button></td></tr>)}
        {filtered.length === 0 && <tr><td className="px-5 py-14 text-center text-on-surface-variant" colSpan={7}>Không có thanh toán phù hợp.</td></tr>}
      </tbody></table></div>}
    </section>

    {selected && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
      <div className="flex items-start justify-between"><div><p className="text-[13px] font-bold text-primary">{selected.bookingCode}</p><h2 className="mt-1 text-[25px] font-bold">Kiểm tra giao dịch</h2></div><button className="rounded-lg p-2 hover:bg-surface-container-low" onClick={() => setSelected(null)} type="button"><XCircle className="h-6 w-6" /></button></div>
      <div className="mt-5 grid gap-5 md:grid-cols-2"><div>{selected.receiptImageUrl ? <img alt="Biên lai chuyển khoản" className="max-h-[460px] w-full rounded-xl border object-contain" src={selected.receiptImageUrl} /> : <div className="flex h-72 items-center justify-center rounded-xl bg-surface-container-low text-on-surface-variant">Không có ảnh biên lai</div>}</div><div className="space-y-3">{[['Người chơi', selected.playerName], ['Sân', `${selected.venueName} · Sân ${selected.courtNumber}`], ['Giờ chơi', `${playTime(selected.startTime)}–${playTime(selected.endTime)} · ${playDate(selected.startTime)}`], ['Trạng thái', paymentStatusLabels[selected.paymentStatus] ?? selected.paymentStatus], ['Số tiền cần trả', currency.format(selected.amount)], ['Nội dung CK', selected.transferContent ?? '—'], ['Tài khoản nhận', `${selected.bankName} · ${selected.bankAccountNumber}`], ['Hạn giữ chỗ', selected.holdExpiresAt ? dateTime(selected.holdExpiresAt) : '—']].map(([label, value]) => <div className="rounded-lg bg-surface-container-low p-3" key={label}><p className="text-[11px] font-bold uppercase text-on-surface-variant">{label}</p><p className="mt-1 text-[14px] font-bold">{value}</p></div>)}</div></div>
      {selected.paymentStatus === 'WaitingForConfirmation' && <><label className="mt-5 block"><span className="text-[13px] font-bold">Lý do từ chối (bắt buộc khi từ chối)</span><textarea className="mt-2 min-h-20 w-full rounded-lg border border-outline-variant p-3 text-[14px] outline-none focus:border-primary" onChange={(event) => setRejectReason(event.target.value)} placeholder="Ví dụ: Không tìm thấy giao dịch, sai số tiền..." value={rejectReason} /></label><div className="mt-4 grid gap-3 sm:grid-cols-2"><button className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-3 font-bold text-red-700 disabled:opacity-50" disabled={rejectReason.trim().length < 3 || busyId === selected.paymentId} onClick={() => void reject(selected)} type="button"><XCircle className="h-5 w-5" /> Từ chối</button><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-white disabled:opacity-50" disabled={busyId === selected.paymentId} onClick={() => void approve(selected)} type="button">{busyId === selected.paymentId ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />} Xác nhận đã nhận tiền</button></div></>}
      <div className="mt-5 border-t pt-4"><h3 className="flex items-center gap-2 font-bold"><Clock className="h-4 w-4 text-primary" /> Lịch sử</h3><div className="mt-3 space-y-2">{selected.history.map((entry, index) => <div className="text-[13px]" key={`${entry.createdAt}-${index}`}><strong>{paymentActionLabels[entry.action] ?? entry.action}</strong> · {paymentStatusLabels[entry.toStatus] ?? entry.toStatus}<span className="text-on-surface-variant"> · {dateTime(entry.createdAt)}{entry.reason ? ` · ${entry.reason}` : ''}</span></div>)}</div></div>
    </div></div>}
  </OwnerShell>;
};
