import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Building2, MapPin, Plus, Power, RefreshCw, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  deleteOwnerVenue,
  getOwnerVenues,
  setOwnerVenueOpenStatus,
  submitOwnerVenue,
  type OwnerVenue,
} from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const approvalLabel: Record<OwnerVenue['approvalStatus'], string> = {
  Draft: 'Bản nháp', Pending: 'Chờ duyệt', Approved: 'Đã duyệt', Rejected: 'Bị từ chối',
};
const approvalClass: Record<OwnerVenue['approvalStatus'], string> = {
  Draft: 'bg-slate-100 text-slate-700', Pending: 'bg-amber-100 text-amber-800', Approved: 'bg-emerald-100 text-emerald-800', Rejected: 'bg-red-100 text-red-700',
};

export const OwnerCourts = () => {
  const { token } = useAuth();
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyVenueId, setBusyVenueId] = useState<number | null>(null);

  const load = async () => {
    if (!token) return;
    setError('');
    try {
      const result = await getOwnerVenues(token);
      setVenues(result);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách sân.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void load(); }, [token]);

  const stats = useMemo(() => ({
    venues: venues.length,
    courts: venues.reduce((sum, venue) => sum + venue.courts.length, 0),
    available: venues.flatMap((venue) => venue.courts).filter((court) => court.availabilityStatus === 'Available').length,
    pending: venues.filter((venue) => venue.approvalStatus === 'Pending').length,
  }), [venues]);

  const runVenueAction = async (venueId: number, action: () => Promise<unknown>) => {
    setBusyVenueId(venueId);
    setError('');
    try { await action(); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật cụm sân.'); }
    finally { setBusyVenueId(null); }
  };

  const removeVenue = async (venue: OwnerVenue) => {
    if (!token || !window.confirm(`Xóa cụm sân “${venue.venueName}”?`)) return;
    await runVenueAction(venue.venueId, () => deleteOwnerVenue(token, venue.venueId));
  };

  return (
    <OwnerShell activeId="courts">
      <section className="owner-page-header">
        <div><p className="owner-kicker"><Building2 className="h-4 w-4" /> Quản lý cơ sở</p><h1 className="mt-2">Danh sách cụm sân</h1><p className="mt-1">Chọn một cụm sân để chỉnh sửa thông tin, hình ảnh và các sân con bên trong.</p></div>
        <div className="flex gap-2"><button className="rounded-lg border border-outline-variant bg-white p-3" onClick={load} title="Tải lại" type="button"><RefreshCw className="h-5 w-5" /></button><Link className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white" to="/owner/courts/create"><Plus className="h-5 w-5" /> Thêm cụm sân</Link></div>
      </section>

      <section className="owner-stat-grid sm:grid-cols-2 lg:grid-cols-4">{[{ label: 'Cụm sân', value: stats.venues }, { label: 'Tổng sân con', value: stats.courts }, { label: 'Đang hoạt động', value: stats.available }, { label: 'Chờ Admin duyệt', value: stats.pending }].map((item) => <div className="owner-stat-card" key={item.label}><p className="text-[12px] font-bold text-on-surface-variant">{item.label}</p><p className="mt-1 font-mono text-[24px] font-extrabold text-primary">{item.value}</p></div>)}</section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}
      {isLoading && <div className="rounded-xl bg-white p-12 text-center font-bold text-on-surface-variant">Đang tải dữ liệu sân...</div>}
      {!isLoading && venues.length === 0 && <div className="rounded-xl border border-dashed border-outline-variant bg-white p-12 text-center"><Building2 className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-3 text-[20px] font-bold">Chưa có cụm sân</h2><p className="mt-1 text-[14px] text-on-surface-variant">Tạo cụm sân đầu tiên để bắt đầu quản lý lịch.</p></div>}

      <div className="space-y-5">
        {venues.map((venue) => {
          const primaryImage = venue.images.find((image) => image.isPrimary) ?? venue.images[0];
          const disabled = busyVenueId === venue.venueId;
          return (
            <section className="owner-panel" key={venue.venueId}>
              <div className="flex flex-col gap-4 p-5 xl:flex-row xl:items-start xl:justify-between">
                <Link className="group flex min-w-0 gap-4 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary" to={`/owner/courts/${venue.venueId}`}>
                  <div className="hidden h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-surface-container sm:block">{primaryImage ? <img alt={primaryImage.caption ?? venue.venueName} className="h-full w-full object-cover" decoding="async" loading="lazy" src={primaryImage.imageUrl} /> : <Building2 className="m-auto h-full w-8 text-outline" />}</div>
                  <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[20px] font-bold">{venue.venueName}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${approvalClass[venue.approvalStatus]}`}>{approvalLabel[venue.approvalStatus]}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${venue.isOpen ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{venue.isOpen ? 'Đang mở' : 'Đã đóng'}</span></div><p className="mt-1 flex items-center gap-2 text-[13px] text-on-surface-variant"><MapPin className="h-4 w-4" /> {venue.address}</p><p className="mt-2 text-[13px] font-medium">{venue.openTime.slice(0, 5)}-{venue.closeTime.slice(0, 5)} · từ {currency.format(venue.basePrice)}/giờ · {venue.courts.length} sân con · {venue.images.length} ảnh</p>{venue.rejectionReason && <p className="mt-2 text-[12px] font-bold text-red-700">Lý do từ chối: {venue.rejectionReason}</p>}</div>
                </Link>
                <div className="flex flex-wrap gap-2">
                  <Link className="inline-flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-[13px] font-bold text-primary hover:bg-primary/5" to={`/owner/courts/${venue.venueId}`}><ArrowRight className="h-4 w-4" /> Quản lý sân</Link>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-bold disabled:opacity-50" disabled={disabled} onClick={() => token && void runVenueAction(venue.venueId, () => setOwnerVenueOpenStatus(token, venue.venueId, !venue.isOpen))} type="button"><Power className="h-4 w-4" /> {venue.isOpen ? 'Đóng sân' : 'Mở sân'}</button>
                  {venue.approvalStatus !== 'Pending' && <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={disabled} onClick={() => token && window.confirm('Gửi hồ sơ cụm sân cho Admin duyệt?') && void runVenueAction(venue.venueId, () => submitOwnerVenue(token, venue.venueId))} type="button"><Send className="h-4 w-4" /> Gửi duyệt</button>}
                  <button className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" disabled={disabled} onClick={() => void removeVenue(venue)} title="Xóa cụm sân" type="button"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </OwnerShell>
  );
};
