import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, Camera, Check, Edit3, MapPin, Send, Star, Trash2, Upload } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import {
  deleteOwnerVenueImage,
  getOwnerVenue,
  setPrimaryOwnerVenueImage,
  submitOwnerVenue,
  uploadOwnerVenueImage,
  type OwnerVenue,
} from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const statusLabel: Record<OwnerVenue['approvalStatus'], string> = { Draft: 'Bản nháp', Pending: 'Chờ Admin duyệt', Approved: 'Đã duyệt', Rejected: 'Bị từ chối' };

export const OwnerVenueDetail = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const venueId = Number(id);
  const [venue, setVenue] = useState<OwnerVenue | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    if (!token || !Number.isInteger(venueId)) return;
    try { setVenue(await getOwnerVenue(token, venueId)); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải chi tiết cụm sân.'); }
  };

  useEffect(() => { void load(); }, [token, venueId]);

  const run = async (action: () => Promise<unknown>) => {
    setIsBusy(true);
    setError('');
    try { await action(); await load(); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Thao tác không thành công.'); }
    finally { setIsBusy(false); }
  };

  const upload = async () => {
    if (!token || !imageFile) return;
    await run(() => uploadOwnerVenueImage(token, venueId, imageFile, caption));
    setImageFile(null);
    setCaption('');
  };

  return (
    <OwnerShell activeId="courts">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/owner/courts"><ArrowLeft className="h-4 w-4" /> Danh sách cụm sân</Link>
        {venue && <div className="flex gap-2"><Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-[13px] font-bold" to={`/owner/courts/${venueId}/edit`}><Edit3 className="h-4 w-4" /> Sửa thông tin</Link>{venue.approvalStatus !== 'Pending' && <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={isBusy} onClick={() => token && void run(() => submitOwnerVenue(token, venueId))} type="button"><Send className="h-4 w-4" /> Gửi Admin duyệt</button>}</div>}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}
      {!venue && !error && <div className="rounded-xl bg-white p-12 text-center font-bold text-on-surface-variant">Đang tải chi tiết...</div>}
      {venue && <>
        <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-[30px] font-bold">{venue.venueName}</h1><span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">{statusLabel[venue.approvalStatus]}</span><span className={`rounded-full px-3 py-1 text-[12px] font-bold ${venue.isOpen ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{venue.isOpen ? 'Đang mở cửa' : 'Đang đóng cửa'}</span></div><p className="mt-2 flex items-center gap-2 text-[14px] text-on-surface-variant"><MapPin className="h-4 w-4" /> {venue.address}</p><p className="mt-2 text-[13px] font-medium">Mở {venue.openTime.slice(0, 5)}–{venue.closeTime.slice(0, 5)} · Giá cơ bản {currency.format(venue.basePrice)}/giờ · {venue.phoneNumber || 'Chưa có số điện thoại'}</p>{venue.rejectionReason && <p className="mt-3 rounded-lg bg-red-50 p-3 text-[13px] font-bold text-red-700">Admin phản hồi: {venue.rejectionReason}</p>}</div>
            <div className="grid grid-cols-2 gap-3 text-center"><div className="rounded-lg bg-surface-container-low p-4"><p className="text-[24px] font-bold text-primary">{venue.courts.length}</p><p className="text-[12px] font-bold">Sân con</p></div><div className="rounded-lg bg-surface-container-low p-4"><p className="text-[24px] font-bold text-primary">{venue.images.length}</p><p className="text-[12px] font-bold">Hình ảnh</p></div></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{venue.amenities.length ? venue.amenities.map((amenity) => <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary" key={amenity}>{amenity}</span>) : <span className="text-[13px] text-on-surface-variant">Chưa thiết lập tiện ích.</span>}</div>
        </section>

        <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-3"><Camera className="h-6 w-6 text-primary" /><div><h2 className="text-[21px] font-bold">Hình ảnh cụm sân</h2><p className="text-[13px] text-on-surface-variant">Tối đa 10 ảnh, mỗi ảnh không quá 5MB. Chấp nhận JPG, PNG và WEBP.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venue.images.map((image) => <article className="group relative overflow-hidden rounded-xl border border-outline-variant" key={image.venueImageId}><img alt={image.caption ?? venue.venueName} className="h-48 w-full object-cover" src={image.imageUrl} />{image.isPrimary && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white"><Star className="h-3 w-3 fill-current" /> Ảnh đại diện</span>}<div className="flex items-center justify-between gap-2 p-3"><p className="truncate text-[12px] font-medium">{image.caption || 'Ảnh sân'}</p><div className="flex gap-1">{!image.isPrimary && <button className="rounded-lg border border-outline-variant p-2 text-primary" disabled={isBusy} onClick={() => token && void run(() => setPrimaryOwnerVenueImage(token, venueId, image.venueImageId))} title="Đặt làm ảnh đại diện" type="button"><Check className="h-4 w-4" /></button>}<button className="rounded-lg border border-red-200 p-2 text-red-600" disabled={isBusy} onClick={() => token && window.confirm('Xóa ảnh này?') && void run(() => deleteOwnerVenueImage(token, venueId, image.venueImageId))} title="Xóa ảnh" type="button"><Trash2 className="h-4 w-4" /></button></div></div></article>)}
            {venue.images.length === 0 && <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-outline-variant text-on-surface-variant"><div className="text-center"><Building2 className="mx-auto h-8 w-8" /><p className="mt-2 text-[13px] font-bold">Chưa có hình ảnh</p></div></div>}
          </div>
          {venue.images.length < 10 && <div className="mt-5 grid gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><label><span className="mb-1.5 block text-[12px] font-bold">Chọn ảnh</span><input accept="image/jpeg,image/png,image/webp" className="block w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} type="file" /></label><label><span className="mb-1.5 block text-[12px] font-bold">Chú thích</span><input className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-[13px] outline-none focus:border-primary" maxLength={200} onChange={(event) => setCaption(event.target.value)} placeholder="Mặt sân, khu vực khán giả..." value={caption} /></label><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={!imageFile || isBusy} onClick={() => void upload()} type="button"><Upload className="h-4 w-4" /> Tải ảnh</button></div>}
        </section>

        <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm"><h2 className="mb-4 text-[21px] font-bold">Danh sách sân con</h2><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{venue.courts.map((court) => <article className="rounded-xl border border-outline-variant p-4" key={court.courtId}><div className="flex items-center justify-between"><h3 className="font-bold">Sân {court.courtNumber}</h3><span className={`rounded-full px-2 py-1 text-[11px] font-bold ${court.availabilityStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>{court.availabilityStatus === 'Available' ? 'Hoạt động' : court.availabilityStatus === 'Maintenance' ? 'Bảo trì' : 'Ngừng'}</span></div><p className="mt-3 text-[13px]">{court.courtType} · {court.surfaceType || 'Chưa rõ mặt sân'}</p><p className="mt-1 text-[13px]">{court.isIndoor ? 'Trong nhà' : 'Ngoài trời'} · <strong>{currency.format(court.hourlyPrice)}/giờ</strong></p></article>)}</div></section>
      </>}
    </OwnerShell>
  );
};
