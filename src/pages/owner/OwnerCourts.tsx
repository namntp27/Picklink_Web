import { useEffect, useMemo, useState } from 'react';
import { Building2, Edit3, Eye, MapPin, Plus, Power, RefreshCw, Save, Send, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  createOwnerCourt,
  deleteOwnerCourt,
  deleteOwnerVenue,
  getOwnerVenues,
  setOwnerVenueOpenStatus,
  submitOwnerVenue,
  updateOwnerCourt,
  type OwnerCourt,
  type OwnerCourtInput,
  type OwnerVenue,
} from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';

const inputClass = 'rounded-lg border border-outline-variant bg-white px-3 py-2 text-[13px] outline-none focus:border-primary';
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const approvalLabel: Record<OwnerVenue['approvalStatus'], string> = {
  Draft: 'Bản nháp', Pending: 'Chờ duyệt', Approved: 'Đã duyệt', Rejected: 'Bị từ chối',
};
const approvalClass: Record<OwnerVenue['approvalStatus'], string> = {
  Draft: 'bg-slate-100 text-slate-700', Pending: 'bg-amber-100 text-amber-800', Approved: 'bg-emerald-100 text-emerald-800', Rejected: 'bg-red-100 text-red-700',
};

const newCourtDraft = (courtNumber: number, basePrice: number): OwnerCourtInput => ({
  courtNumber,
  courtType: 'Tiêu chuẩn',
  surfaceType: 'Sơn acrylic',
  hourlyPrice: basePrice,
  isIndoor: false,
  availabilityStatus: 'Available',
});

const CourtRow = ({ court, token, onChanged, onError }: { court: OwnerCourt; token: string; onChanged: () => Promise<void>; onError: (message: string) => void }) => {
  const [draft, setDraft] = useState<OwnerCourtInput>({
    courtNumber: court.courtNumber,
    courtType: court.courtType,
    surfaceType: court.surfaceType ?? '',
    hourlyPrice: court.hourlyPrice,
    isIndoor: court.isIndoor,
    availabilityStatus: court.availabilityStatus,
  });
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try { await updateOwnerCourt(token, court.courtId, draft); await onChanged(); }
    catch (error) { onError(error instanceof ApiError ? error.message : 'Không thể cập nhật sân con.'); }
    finally { setIsSaving(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Xóa sân con số ${court.courtNumber}? Nếu sân đã có lịch đặt, hệ thống sẽ chuyển sang ngừng hoạt động thay vì cho xóa.`)) return;
    try { await deleteOwnerCourt(token, court.courtId); await onChanged(); }
    catch (error) { onError(error instanceof ApiError ? error.message : 'Không thể xóa sân con. Hãy chuyển trạng thái sang ngừng hoạt động.'); }
  };

  return (
    <div className="grid gap-3 rounded-lg border border-outline-variant bg-surface-container-low/45 p-3 lg:grid-cols-[72px_1fr_1fr_140px_130px_150px_auto] lg:items-end">
      <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Số sân</span><input className={`${inputClass} w-full`} min="1" onChange={(e) => setDraft({ ...draft, courtNumber: Number(e.target.value) })} type="number" value={draft.courtNumber} /></label>
      <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Loại sân</span><input className={`${inputClass} w-full`} onChange={(e) => setDraft({ ...draft, courtType: e.target.value })} placeholder="Tiêu chuẩn" value={draft.courtType} /></label>
      <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Mặt sân</span><input className={`${inputClass} w-full`} onChange={(e) => setDraft({ ...draft, surfaceType: e.target.value })} placeholder="Sơn acrylic" value={draft.surfaceType} /></label>
      <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Giá / giờ</span><input className={`${inputClass} w-full`} min="0" onChange={(e) => setDraft({ ...draft, hourlyPrice: Number(e.target.value) })} type="number" value={draft.hourlyPrice} /></label>
      <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Không gian</span><select className={`${inputClass} w-full`} onChange={(e) => setDraft({ ...draft, isIndoor: e.target.value === 'indoor' })} value={draft.isIndoor ? 'indoor' : 'outdoor'}><option value="indoor">Trong nhà</option><option value="outdoor">Ngoài trời</option></select></label>
      <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Trạng thái</span><select className={`${inputClass} w-full`} onChange={(e) => setDraft({ ...draft, availabilityStatus: e.target.value as OwnerCourt['availabilityStatus'] })} value={draft.availabilityStatus}><option value="Available">Hoạt động</option><option value="Maintenance">Bảo trì</option><option value="Inactive">Ngừng hoạt động</option></select></label>
      <div className="flex gap-2"><button className="rounded-lg bg-primary p-2.5 text-white disabled:opacity-60" disabled={isSaving} onClick={save} title="Lưu sân con" type="button"><Save className="h-4 w-4" /></button><button className="rounded-lg border border-red-200 p-2.5 text-red-600 hover:bg-red-50" onClick={remove} title="Xóa sân con" type="button"><Trash2 className="h-4 w-4" /></button></div>
    </div>
  );
};

export const OwnerCourts = () => {
  const { token } = useAuth();
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [courtDrafts, setCourtDrafts] = useState<Record<number, OwnerCourtInput>>({});
  const [busyVenueId, setBusyVenueId] = useState<number | null>(null);

  const load = async () => {
    if (!token) return;
    setError('');
    try {
      const result = await getOwnerVenues(token);
      setVenues(result);
      setCourtDrafts(Object.fromEntries(result.map((venue) => [venue.venueId, newCourtDraft(Math.max(0, ...venue.courts.map((court) => court.courtNumber)) + 1, venue.basePrice)])));
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

  const addCourt = async (venueId: number) => {
    if (!token || !courtDrafts[venueId]) return;
    setError('');
    try { await createOwnerCourt(token, venueId, courtDrafts[venueId]); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể thêm sân con.'); }
  };

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
        <div><p className="owner-kicker"><Building2 className="h-4 w-4" /> Quản lý cơ sở</p><h1 className="mt-2">Cụm sân & sân con</h1><p className="mt-1">Quản lý vận hành, hồ sơ duyệt và cấu hình từng sân con.</p></div>
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
              <div className="flex flex-col gap-4 border-b border-outline-variant p-5 xl:flex-row xl:items-start xl:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="hidden h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-surface-container sm:block">{primaryImage ? <img alt={primaryImage.caption ?? venue.venueName} className="h-full w-full object-cover" decoding="async" loading="lazy" src={primaryImage.imageUrl} /> : <Building2 className="m-auto h-full w-8 text-outline" />}</div>
                  <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-[20px] font-bold">{venue.venueName}</h2><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${approvalClass[venue.approvalStatus]}`}>{approvalLabel[venue.approvalStatus]}</span><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${venue.isOpen ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{venue.isOpen ? 'Đang mở' : 'Đã đóng'}</span></div><p className="mt-1 flex items-center gap-2 text-[13px] text-on-surface-variant"><MapPin className="h-4 w-4" /> {venue.address}</p><p className="mt-2 text-[13px] font-medium">{venue.openTime.slice(0, 5)}-{venue.closeTime.slice(0, 5)} · từ {currency.format(venue.basePrice)}/giờ · {venue.courts.length} sân con · {venue.images.length} ảnh</p>{venue.rejectionReason && <p className="mt-2 text-[12px] font-bold text-red-700">Lý do từ chối: {venue.rejectionReason}</p>}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-bold hover:bg-surface-container-low" to={`/owner/courts/${venue.venueId}`}><Eye className="h-4 w-4" /> Chi tiết & ảnh</Link>
                  <Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-bold hover:bg-surface-container-low" to={`/owner/courts/${venue.venueId}/edit`}><Edit3 className="h-4 w-4" /> Sửa</Link>
                  <button className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-bold disabled:opacity-50" disabled={disabled} onClick={() => token && void runVenueAction(venue.venueId, () => setOwnerVenueOpenStatus(token, venue.venueId, !venue.isOpen))} type="button"><Power className="h-4 w-4" /> {venue.isOpen ? 'Đóng sân' : 'Mở sân'}</button>
                  {venue.approvalStatus !== 'Pending' && <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={disabled} onClick={() => token && window.confirm('Gửi hồ sơ cụm sân cho Admin duyệt?') && void runVenueAction(venue.venueId, () => submitOwnerVenue(token, venue.venueId))} type="button"><Send className="h-4 w-4" /> Gửi duyệt</button>}
                  <button className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" disabled={disabled} onClick={() => void removeVenue(venue)} title="Xóa cụm sân" type="button"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="space-y-3 p-5">
                {venue.courts.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-[13px] font-bold text-amber-800">Chưa có sân con. Hãy thêm sân trước khi gửi duyệt.</p>}
                {venue.courts.map((court) => <CourtRow court={court} key={court.courtId} onChanged={load} onError={setError} token={token!} />)}
                <div className="grid gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 lg:grid-cols-[72px_1fr_1fr_140px_130px_150px_auto] lg:items-end">
                  <label><span className="mb-1 block text-[11px] font-bold">Số sân</span><input className={`${inputClass} w-full`} min="1" onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], courtNumber: Number(e.target.value) } })} type="number" value={courtDrafts[venue.venueId]?.courtNumber ?? 1} /></label>
                  <label><span className="mb-1 block text-[11px] font-bold">Loại sân</span><input className={`${inputClass} w-full`} onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], courtType: e.target.value } })} value={courtDrafts[venue.venueId]?.courtType ?? ''} /></label>
                  <label><span className="mb-1 block text-[11px] font-bold">Mặt sân</span><input className={`${inputClass} w-full`} onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], surfaceType: e.target.value } })} value={courtDrafts[venue.venueId]?.surfaceType ?? ''} /></label>
                  <label><span className="mb-1 block text-[11px] font-bold">Giá / giờ</span><input className={`${inputClass} w-full`} min="0" onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], hourlyPrice: Number(e.target.value) } })} type="number" value={courtDrafts[venue.venueId]?.hourlyPrice ?? venue.basePrice} /></label>
                  <select className={`${inputClass} w-full`} onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], isIndoor: e.target.value === 'indoor' } })} value={courtDrafts[venue.venueId]?.isIndoor ? 'indoor' : 'outdoor'}><option value="indoor">Trong nhà</option><option value="outdoor">Ngoài trời</option></select>
                  <select className={`${inputClass} w-full`} onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], availabilityStatus: e.target.value as OwnerCourt['availabilityStatus'] } })} value={courtDrafts[venue.venueId]?.availabilityStatus ?? 'Available'}><option value="Available">Hoạt động</option><option value="Maintenance">Bảo trì</option><option value="Inactive">Ngừng</option></select>
                  <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white" onClick={() => void addCourt(venue.venueId)} type="button"><Plus className="h-4 w-4" /> Thêm sân</button>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </OwnerShell>
  );
};
