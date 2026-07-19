import { useEffect, useState } from 'react';
import { Plus, Save, Trash2 } from 'lucide-react';
import { ApiError } from '../../../api/client';
import {
  createOwnerCourt,
  deleteOwnerCourt,
  updateOwnerCourt,
  type OwnerCourt,
  type OwnerCourtInput,
  type OwnerVenue,
} from '../../../api/owner';

const inputClass = 'rounded-lg border border-outline-variant bg-white px-3 py-2 text-[13px] outline-none focus:border-primary';

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
    onError('');
    try { await updateOwnerCourt(token, court.courtId, draft); await onChanged(); }
    catch (error) { onError(error instanceof ApiError ? error.message : 'Không thể cập nhật sân con.'); }
    finally { setIsSaving(false); }
  };

  const remove = async () => {
    if (!window.confirm(`Xóa sân con số ${court.courtNumber}? Nếu sân đã có lịch đặt, hệ thống sẽ chuyển sang ngừng hoạt động thay vì cho xóa.`)) return;
    onError('');
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

export const OwnerCourtManager = ({ venue, token, onChanged, onError }: { venue: OwnerVenue; token: string; onChanged: () => Promise<void>; onError: (message: string) => void }) => {
  const nextCourtNumber = Math.max(0, ...venue.courts.map((court) => court.courtNumber)) + 1;
  const [draft, setDraft] = useState<OwnerCourtInput>(() => newCourtDraft(nextCourtNumber, venue.basePrice));
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    setDraft(newCourtDraft(nextCourtNumber, venue.basePrice));
  }, [nextCourtNumber, venue.basePrice]);

  const addCourt = async () => {
    setIsAdding(true);
    onError('');
    try { await createOwnerCourt(token, venue.venueId, draft); await onChanged(); }
    catch (error) { onError(error instanceof ApiError ? error.message : 'Không thể thêm sân con.'); }
    finally { setIsAdding(false); }
  };

  return (
    <section className="owner-panel p-5">
      <div className="mb-4">
        <h2 className="text-[21px] font-bold">Quản lý sân con</h2>
        <p className="mt-1 text-[13px] text-on-surface-variant">Thêm hoặc chỉnh sửa từng sân con của {venue.venueName}. Giá mới áp dụng cho booking được tạo sau khi cập nhật.</p>
      </div>
      <div className="space-y-3">
        {venue.courts.length === 0 && <p className="rounded-lg bg-amber-50 p-3 text-[13px] font-bold text-amber-800">Chưa có sân con. Hãy thêm sân trước khi gửi duyệt.</p>}
        {venue.courts.map((court) => <CourtRow court={court} key={court.courtId} onChanged={onChanged} onError={onError} token={token} />)}
        <div className="grid gap-3 rounded-lg border border-dashed border-primary/40 bg-primary/5 p-3 lg:grid-cols-[72px_1fr_1fr_140px_130px_150px_auto] lg:items-end">
          <label><span className="mb-1 block text-[11px] font-bold">Số sân</span><input className={`${inputClass} w-full`} min="1" onChange={(event) => setDraft({ ...draft, courtNumber: Number(event.target.value) })} type="number" value={draft.courtNumber} /></label>
          <label><span className="mb-1 block text-[11px] font-bold">Loại sân</span><input className={`${inputClass} w-full`} onChange={(event) => setDraft({ ...draft, courtType: event.target.value })} value={draft.courtType} /></label>
          <label><span className="mb-1 block text-[11px] font-bold">Mặt sân</span><input className={`${inputClass} w-full`} onChange={(event) => setDraft({ ...draft, surfaceType: event.target.value })} value={draft.surfaceType} /></label>
          <label><span className="mb-1 block text-[11px] font-bold">Giá / giờ</span><input className={`${inputClass} w-full`} min="0" onChange={(event) => setDraft({ ...draft, hourlyPrice: Number(event.target.value) })} type="number" value={draft.hourlyPrice} /></label>
          <select aria-label="Không gian sân con mới" className={`${inputClass} w-full`} onChange={(event) => setDraft({ ...draft, isIndoor: event.target.value === 'indoor' })} value={draft.isIndoor ? 'indoor' : 'outdoor'}><option value="indoor">Trong nhà</option><option value="outdoor">Ngoài trời</option></select>
          <select aria-label="Trạng thái sân con mới" className={`${inputClass} w-full`} onChange={(event) => setDraft({ ...draft, availabilityStatus: event.target.value as OwnerCourt['availabilityStatus'] })} value={draft.availabilityStatus}><option value="Available">Hoạt động</option><option value="Maintenance">Bảo trì</option><option value="Inactive">Ngừng</option></select>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60" disabled={isAdding} onClick={() => void addCourt()} type="button"><Plus className="h-4 w-4" /> Thêm sân</button>
        </div>
      </div>
    </section>
  );
};
