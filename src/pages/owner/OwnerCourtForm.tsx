import { useEffect, useState } from 'react';
import { ArrowLeft, CalendarOff, ImagePlus, Save, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, toMediaUrl } from '../../api/client';
import { ownerVenueApi, uploadApi } from '../../api/venues';
import type { BlockedSlot, CourtStatus, VenueImage, VenueListItem } from '../../types/venue';
import { OwnerShell } from './components/OwnerShell';

export const OwnerCourtForm = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [venues, setVenues] = useState<VenueListItem[]>([]);
  const [venueId, setVenueId] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [price, setPrice] = useState('200000');
  const [slotDuration, setSlotDuration] = useState('60');
  const [status, setStatus] = useState<CourtStatus>('Available');
  const [images, setImages] = useState<VenueImage[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [maintenanceStart, setMaintenanceStart] = useState('');
  const [maintenanceEnd, setMaintenanceEnd] = useState('');
  const [maintenanceReason, setMaintenanceReason] = useState('');
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    ownerVenueApi.venues().then((items) => {
      setVenues(items);
      if (!editing && items.length) setVenueId(items[0].id);
    }).catch((reason) => setError(reason.message));
  }, [editing]);

  useEffect(() => {
    if (!id) return;
    ownerVenueApi.court(id).then((court) => {
      setVenueId(court.venueId);
      setName(court.name);
      setCode(court.code);
      setPrice(String(court.pricePerHour));
      setSlotDuration(String(court.slotDurationMinutes));
      setStatus(court.status);
      setImages(court.images);
      setBlockedSlots(court.blockedSlots);
    }).catch((reason) => setError(reason.message)).finally(() => setLoading(false));
  }, [id]);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (images.length + files.length > 5) return setError('Mỗi sân chỉ được tối đa 5 ảnh.');
    setUploading(true);
    try {
      const uploaded = await Promise.all(Array.from(files).map(uploadApi.image));
      setImages((current) => [...current, ...uploaded.map((item, index) => ({
        url: item.url, sortOrder: current.length + index, isPrimary: current.length === 0 && index === 0,
      }))]);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Không thể tải ảnh lên.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const input = {
      name,
      code,
      pricePerHour: Number(price),
      slotDurationMinutes: Number(slotDuration),
      status,
      images: images.map(({ url, sortOrder, isPrimary }) => ({ url, sortOrder, isPrimary })),
    };
    try {
      if (id) await ownerVenueApi.updateCourt(id, input);
      else await ownerVenueApi.createCourt({ ...input, venueId });
      navigate('/owner/courts', { replace: true });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Không thể lưu sân.');
    } finally {
      setSaving(false);
    }
  };

  const addMaintenance = async () => {
    if (!id || !maintenanceStart || !maintenanceEnd) return;
    try {
      await ownerVenueApi.addBlockedSlot(id, {
        startTime: new Date(maintenanceStart).toISOString(),
        endTime: new Date(maintenanceEnd).toISOString(),
        reason: maintenanceReason,
      });
      const court = await ownerVenueApi.court(id);
      setBlockedSlots(court.blockedSlots);
      setMaintenanceStart(''); setMaintenanceEnd(''); setMaintenanceReason('');
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Không thể tạo lịch bảo trì.');
    }
  };

  const removeMaintenance = async (slotId: string) => {
    if (!id) return;
    await ownerVenueApi.deleteBlockedSlot(id, slotId);
    setBlockedSlots((current) => current.filter((item) => item.id !== slotId));
  };

  if (loading) return <OwnerShell activeId="courts"><p>Đang tải sân...</p></OwnerShell>;

  return (
    <OwnerShell activeId="courts" innerClassName="max-w-[1100px]">
      <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/owner/courts"><ArrowLeft className="h-4 w-4" /> Quay lại</Link>
      <form className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px]" onSubmit={handleSubmit}>
        <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
          <h1 className="text-[28px] font-bold">{editing ? 'Chỉnh sửa sân' : 'Thêm sân Pickleball'}</h1>
          <p className="mt-1 text-[14px] text-secondary">Giá cố định theo giờ; độ dài slot chọn theo bước 30 phút.</p>
          {error && <p className="mt-4 rounded-lg bg-error-container p-3 text-[13px] font-bold text-error">{error}</p>}
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-[13px] font-bold sm:col-span-2">Cơ sở
              <select disabled={editing} required value={venueId} onChange={(e) => setVenueId(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium disabled:bg-surface-container">
                <option value="">Chọn cơ sở</option>{venues.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </label>
            <label className="space-y-1 text-[13px] font-bold">Tên sân
              <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium" />
            </label>
            <label className="space-y-1 text-[13px] font-bold">Mã sân
              <input required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="PK-01" className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium uppercase" />
            </label>
            <label className="space-y-1 text-[13px] font-bold">Giá mỗi giờ
              <input required min="1" type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium" />
            </label>
            <label className="space-y-1 text-[13px] font-bold">Độ dài slot
              <select value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium">
                {[30, 60, 90, 120, 150, 180].map((value) => <option key={value} value={value}>{value} phút</option>)}
              </select>
            </label>
            <label className="space-y-1 text-[13px] font-bold sm:col-span-2">Trạng thái
              <select value={status} onChange={(e) => setStatus(e.target.value as CourtStatus)} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium">
                <option value="Available">Sẵn sàng</option><option value="Maintenance">Bảo trì</option><option value="Inactive">Ngừng hoạt động</option>
              </select>
            </label>
          </div>

          {editing && (
            <div className="mt-8 border-t border-outline-variant pt-5">
              <div className="mb-3 flex items-center gap-2"><CalendarOff className="h-5 w-5 text-primary" /><h2 className="text-[18px] font-bold">Lịch bảo trì</h2></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input type="datetime-local" value={maintenanceStart} onChange={(e) => setMaintenanceStart(e.target.value)} className="rounded-lg border border-outline-variant px-3 py-2.5" />
                <input type="datetime-local" value={maintenanceEnd} onChange={(e) => setMaintenanceEnd(e.target.value)} className="rounded-lg border border-outline-variant px-3 py-2.5" />
                <input value={maintenanceReason} onChange={(e) => setMaintenanceReason(e.target.value)} placeholder="Lý do bảo trì" className="rounded-lg border border-outline-variant px-3 py-2.5 sm:col-span-2" />
                <button type="button" onClick={() => void addMaintenance()} className="rounded-lg border border-primary px-4 py-2.5 text-[13px] font-bold text-primary sm:col-span-2">Thêm lịch bảo trì</button>
              </div>
              <div className="mt-4 space-y-2">
                {blockedSlots.map((slot) => <div key={slot.id} className="flex items-center justify-between rounded-lg bg-surface p-3 text-[12px]"><span>{new Date(slot.startTime).toLocaleString('vi-VN')} - {new Date(slot.endTime).toLocaleString('vi-VN')} · {slot.reason || 'Bảo trì'}</span><button type="button" aria-label="Xóa lịch bảo trì" onClick={() => void removeMaintenance(slot.id)} className="text-error"><Trash2 className="h-4 w-4" /></button></div>)}
              </div>
            </div>
          )}
        </section>

        <aside className="space-y-5">
          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <div className="flex justify-between"><h2 className="text-[18px] font-bold">Ảnh sân</h2><span className="text-[12px] text-secondary">{images.length}/5</span></div>
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary p-4 text-[13px] font-bold text-primary"><ImagePlus className="h-5 w-5" />{uploading ? 'Đang tải...' : 'Thêm ảnh'}<input className="hidden" type="file" multiple accept="image/*" onChange={(e) => void handleFiles(e.target.files)} /></label>
            <div className="mt-3 grid grid-cols-2 gap-2">{images.map((image, index) => <div key={`${image.url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-lg"><img src={toMediaUrl(image.url)} className="h-full w-full object-cover" alt="Ảnh sân" /><button type="button" aria-label="Xóa ảnh" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded bg-white p-1 text-error"><Trash2 className="h-4 w-4" /></button></div>)}</div>
          </section>
          <button disabled={saving || uploading || !venueId} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white disabled:opacity-60"><Save className="h-5 w-5" />{saving ? 'Đang lưu...' : 'Lưu sân'}</button>
        </aside>
      </form>
    </OwnerShell>
  );
};
