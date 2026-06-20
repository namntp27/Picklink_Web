import { useEffect, useMemo, useState } from 'react';
import { Building2, Edit3, MapPin, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  createOwnerCourt,
  deleteOwnerCourt,
  deleteOwnerVenue,
  getOwnerVenues,
  updateOwnerCourt,
  type OwnerCourt,
  type OwnerCourtInput,
  type OwnerVenue,
} from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';

const inputClass = 'rounded-lg border border-outline-variant bg-white px-3 py-2 text-[13px] outline-none focus:border-primary';
const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

const CourtRow = ({ court, token, onChanged }: { court: OwnerCourt; token: string; onChanged: () => Promise<void> }) => {
  const [draft, setDraft] = useState<OwnerCourtInput>({
    courtNumber: court.courtNumber,
    surfaceType: court.surfaceType ?? '',
    isIndoor: court.isIndoor,
    availabilityStatus: court.availabilityStatus,
  });
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try { await updateOwnerCourt(token, court.courtId, draft); await onChanged(); } finally { setIsSaving(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Xóa sân con số ${court.courtNumber}?`)) return;
    await deleteOwnerCourt(token, court.courtId);
    await onChanged();
  };

  return (
    <div className="grid gap-3 rounded-lg border border-outline-variant bg-surface-container-low/45 p-3 md:grid-cols-[90px_1fr_150px_110px_auto] md:items-center">
      <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Số sân</span><input className={`${inputClass} w-full`} min="1" onChange={(e) => setDraft({ ...draft, courtNumber: Number(e.target.value) })} type="number" value={draft.courtNumber} /></label>
      <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Mặt sân</span><input className={`${inputClass} w-full`} onChange={(e) => setDraft({ ...draft, surfaceType: e.target.value })} value={draft.surfaceType} /></label>
      <label><span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Trạng thái</span><select className={`${inputClass} w-full`} onChange={(e) => setDraft({ ...draft, availabilityStatus: e.target.value as OwnerCourt['availabilityStatus'] })} value={draft.availabilityStatus}><option value="Available">Hoạt động</option><option value="Maintenance">Bảo trì</option><option value="Inactive">Ngừng hoạt động</option></select></label>
      <label className="flex items-center gap-2 pt-4 text-[13px] font-bold"><input checked={draft.isIndoor} onChange={(e) => setDraft({ ...draft, isIndoor: e.target.checked })} type="checkbox" /> Trong nhà</label>
      <div className="flex gap-2 md:justify-end"><button className="rounded-lg bg-primary p-2.5 text-white disabled:opacity-60" disabled={isSaving} onClick={save} title="Lưu sân con" type="button"><Save className="h-4 w-4" /></button><button className="rounded-lg border border-red-200 p-2.5 text-red-600 hover:bg-red-50" onClick={remove} title="Xóa sân con" type="button"><Trash2 className="h-4 w-4" /></button></div>
    </div>
  );
};

export const OwnerCourts = () => {
  const { token } = useAuth();
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [courtDrafts, setCourtDrafts] = useState<Record<number, OwnerCourtInput>>({});

  const load = async () => {
    if (!token) return;
    setError('');
    try {
      const result = await getOwnerVenues(token);
      setVenues(result);
      setCourtDrafts(Object.fromEntries(result.map((venue) => [venue.venueId, {
        courtNumber: Math.max(0, ...venue.courts.map((court) => court.courtNumber)) + 1,
        surfaceType: 'Hard court', isIndoor: false, availabilityStatus: 'Available' as const,
      }])));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách sân.');
    } finally { setIsLoading(false); }
  };

  useEffect(() => { void load(); }, [token]);

  const stats = useMemo(() => ({
    venues: venues.length,
    courts: venues.reduce((sum, venue) => sum + venue.courts.length, 0),
    available: venues.flatMap((venue) => venue.courts).filter((court) => court.availabilityStatus === 'Available').length,
  }), [venues]);

  const addCourt = async (venueId: number) => {
    if (!token || !courtDrafts[venueId]) return;
    setError('');
    try { await createOwnerCourt(token, venueId, courtDrafts[venueId]); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể thêm sân con.'); }
  };

  const removeVenue = async (venue: OwnerVenue) => {
    if (!token || !window.confirm(`Xóa cụm sân “${venue.venueName}”?`)) return;
    try { await deleteOwnerVenue(token, venue.venueId); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể xóa cụm sân.'); }
  };

  return (
    <OwnerShell activeId="courts">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div><p className="text-[13px] font-bold uppercase tracking-wider text-primary">Quản lý cơ sở</p><h1 className="mt-1 text-[30px] font-bold">Cụm sân & sân con</h1><p className="mt-1 text-[14px] text-on-surface-variant">Quản lý thông tin sân, trạng thái vận hành và từng court.</p></div>
        <div className="flex gap-2"><button className="rounded-lg border border-outline-variant bg-white p-3" onClick={load} title="Tải lại" type="button"><RefreshCw className="h-5 w-5" /></button><Link className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white" to="/owner/courts/create"><Plus className="h-5 w-5" /> Thêm cụm sân</Link></div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">{[{ label: 'Cụm sân', value: stats.venues }, { label: 'Tổng sân con', value: stats.courts }, { label: 'Đang hoạt động', value: stats.available }].map((item) => <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm" key={item.label}><p className="text-[13px] font-bold text-on-surface-variant">{item.label}</p><p className="mt-1 text-[28px] font-bold text-primary">{item.value}</p></div>)}</section>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}
      {isLoading && <div className="rounded-xl bg-white p-12 text-center font-bold text-on-surface-variant">Đang tải dữ liệu sân...</div>}
      {!isLoading && venues.length === 0 && <div className="rounded-xl border border-dashed border-outline-variant bg-white p-12 text-center"><Building2 className="mx-auto h-10 w-10 text-primary" /><h2 className="mt-3 text-[20px] font-bold">Chưa có cụm sân</h2><p className="mt-1 text-[14px] text-on-surface-variant">Tạo cụm sân đầu tiên để bắt đầu quản lý lịch.</p></div>}

      <div className="space-y-5">
        {venues.map((venue) => (
          <section className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm" key={venue.venueId}>
            <div className="flex flex-col gap-4 border-b border-outline-variant p-5 md:flex-row md:items-start md:justify-between">
              <div><h2 className="text-[22px] font-bold">{venue.venueName}</h2><p className="mt-1 flex items-center gap-2 text-[13px] text-on-surface-variant"><MapPin className="h-4 w-4" /> {venue.address}</p><p className="mt-2 text-[13px] font-medium">{venue.openTime.slice(0, 5)}–{venue.closeTime.slice(0, 5)} · {currency.format(venue.basePrice)}/giờ · {venue.courts.length} sân con</p></div>
              <div className="flex gap-2"><Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-[13px] font-bold hover:bg-surface-container-low" to={`/owner/courts/${venue.venueId}/edit`}><Edit3 className="h-4 w-4" /> Sửa</Link><button className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50" onClick={() => removeVenue(venue)} title="Xóa cụm sân" type="button"><Trash2 className="h-4 w-4" /></button></div>
            </div>
            <div className="space-y-3 p-5">
              {venue.courts.map((court) => <CourtRow court={court} key={court.courtId} onChanged={load} token={token!} />)}
              <div className="grid gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 md:grid-cols-[100px_1fr_150px_110px_auto] md:items-end">
                <label><span className="mb-1 block text-[11px] font-bold">Số sân</span><input className={`${inputClass} w-full`} min="1" onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], courtNumber: Number(e.target.value) } })} type="number" value={courtDrafts[venue.venueId]?.courtNumber ?? 1} /></label>
                <label><span className="mb-1 block text-[11px] font-bold">Mặt sân</span><input className={`${inputClass} w-full`} onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], surfaceType: e.target.value } })} value={courtDrafts[venue.venueId]?.surfaceType ?? ''} /></label>
                <select className={`${inputClass} w-full`} onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], availabilityStatus: e.target.value as OwnerCourt['availabilityStatus'] } })} value={courtDrafts[venue.venueId]?.availabilityStatus ?? 'Available'}><option value="Available">Hoạt động</option><option value="Maintenance">Bảo trì</option><option value="Inactive">Ngừng</option></select>
                <label className="flex items-center gap-2 pb-2 text-[13px] font-bold"><input checked={courtDrafts[venue.venueId]?.isIndoor ?? false} onChange={(e) => setCourtDrafts({ ...courtDrafts, [venue.venueId]: { ...courtDrafts[venue.venueId], isIndoor: e.target.checked } })} type="checkbox" /> Trong nhà</label>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white" onClick={() => addCourt(venue.venueId)} type="button"><Plus className="h-4 w-4" /> Thêm sân con</button>
              </div>
            </div>
          </section>
        ))}
      </div>
    </OwnerShell>
  );
};
