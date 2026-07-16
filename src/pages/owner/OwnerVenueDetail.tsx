import { useEffect, useState } from 'react';
import { ArrowLeft, Banknote, Building2, Camera, Check, Edit3, MapPin, Save, Send, Star, Trash2, Upload, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { previewOwnerListingFee, submitOwnerListingFeePayment, type OwnerListingFeePreview } from '../../api/listingFees';
import {
  deleteOwnerVenueImage,
  getOwnerVenue,
  setPrimaryOwnerVenueImage,
  submitOwnerVenue,
  updateOwnerCourt,
  uploadOwnerVenueImage,
  type OwnerCourt,
  type OwnerVenue,
} from '../../api/owner';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';

const currency = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const statusLabel: Record<OwnerVenue['approvalStatus'], string> = { Draft: 'Bản nháp', Pending: 'Chờ Admin duyệt', Approved: 'Đã duyệt', Rejected: 'Bị từ chối' };
const listingStatusLabel: Record<string, string> = {
  Unpaid: 'Chưa thanh toán phí lên sàn',
  PendingReview: 'Biên lai đang chờ Admin duyệt',
  Paid: 'Đã thanh toán phí lên sàn',
  Confirmed: 'Đã xác nhận',
  Rejected: 'Biên lai bị từ chối',
  Expired: 'Đã hết hạn phí lên sàn',
};

const CourtPriceEditor = ({
  court,
  disabled,
  onSave,
}: {
  court: OwnerCourt;
  disabled: boolean;
  onSave: (court: OwnerCourt, hourlyPrice: number) => Promise<void>;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [priceDraft, setPriceDraft] = useState(String(court.hourlyPrice));
  const [isSaving, setIsSaving] = useState(false);
  const hourlyPrice = Number(priceDraft);
  const isInvalid = priceDraft.trim() === '' || !Number.isFinite(hourlyPrice) || hourlyPrice < 0 || hourlyPrice > 100_000_000;

  useEffect(() => {
    if (!isEditing) setPriceDraft(String(court.hourlyPrice));
  }, [court.hourlyPrice, isEditing]);

  const cancel = () => {
    setPriceDraft(String(court.hourlyPrice));
    setIsEditing(false);
  };

  const save = async () => {
    if (isInvalid) return;
    setIsSaving(true);
    try {
      await onSave(court, hourlyPrice);
      setIsEditing(false);
    } catch {
      // The parent surfaces the API error and keeps the editor open for correction.
    } finally {
      setIsSaving(false);
    }
  };

  if (!isEditing) {
    return (
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-outline-variant pt-3">
        <div>
          <p className="text-[11px] font-bold uppercase text-on-surface-variant">Giá thuê</p>
          <p className="mt-1 text-[16px] font-bold text-primary">{currency.format(court.hourlyPrice)}/giờ</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg border border-primary px-3 py-2 text-[12px] font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
          disabled={disabled}
          onClick={() => setIsEditing(true)}
          type="button"
        >
          <Edit3 className="h-4 w-4" /> Sửa giá
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 border-t border-outline-variant pt-3">
      <label>
        <span className="mb-1.5 block text-[11px] font-bold uppercase text-on-surface-variant">Giá thuê mỗi giờ</span>
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <input
              aria-label={`Giá thuê sân ${court.courtNumber} mỗi giờ`}
              autoFocus
              className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 pr-10 text-[14px] font-bold outline-none focus:border-primary"
              inputMode="numeric"
              max="100000000"
              min="0"
              onChange={(event) => setPriceDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') void save();
                if (event.key === 'Escape') cancel();
              }}
              step="1000"
              type="number"
              value={priceDraft}
            />
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-on-surface-variant">đ</span>
          </div>
          <button
            className="rounded-lg bg-primary p-2.5 text-white disabled:opacity-50"
            disabled={disabled || isSaving || isInvalid}
            onClick={() => void save()}
            title="Lưu giá"
            type="button"
          >
            <Save className="h-4 w-4" />
          </button>
          <button
            className="rounded-lg border border-outline-variant p-2.5 text-on-surface-variant disabled:opacity-50"
            disabled={isSaving}
            onClick={cancel}
            title="Hủy"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </label>
      {isInvalid && <p className="mt-1.5 text-[11px] font-bold text-red-600">Giá phải từ 0 đến 100.000.000đ.</p>}
    </div>
  );
};

export const OwnerVenueDetail = () => {
  const { token } = useAuth();
  const { id } = useParams();
  const venueId = Number(id);
  const [venue, setVenue] = useState<OwnerVenue | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [listingMonths, setListingMonths] = useState(1);
  const [listingReceipt, setListingReceipt] = useState<File | null>(null);
  const [listingPreview, setListingPreview] = useState<OwnerListingFeePreview | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = async () => {
    if (!token || !Number.isInteger(venueId)) return;
    try { setVenue(await getOwnerVenue(token, venueId)); }
    catch (requestError) { setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải chi tiết cụm sân.'); }
  };

  useEffect(() => { void load(); }, [token, venueId]);

  useEffect(() => {
    if (!token || !venue || !Number.isInteger(venueId)) return;
    void previewOwnerListingFee(token, venueId, listingMonths)
      .then(setListingPreview)
      .catch(() => setListingPreview(null));
  }, [listingMonths, token, venue, venueId]);

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

  const submitListingFee = async () => {
    if (!token || !listingReceipt) return;
    await run(() => submitOwnerListingFeePayment(token, venueId, listingMonths, listingReceipt));
    setListingReceipt(null);
  };

  const saveCourtPrice = async (court: OwnerCourt, hourlyPrice: number) => {
    if (!token) return;
    setIsBusy(true);
    setError('');
    setNotice('');
    try {
      await updateOwnerCourt(token, court.courtId, {
        courtNumber: court.courtNumber,
        courtType: court.courtType,
        surfaceType: court.surfaceType ?? undefined,
        hourlyPrice,
        isIndoor: court.isIndoor,
        availabilityStatus: court.availabilityStatus,
      });
      await load();
      setNotice(`Đã cập nhật giá sân ${court.courtNumber} thành ${currency.format(hourlyPrice)}/giờ.`);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể cập nhật giá sân con.');
      throw requestError;
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <OwnerShell activeId="courts">
      <div className="owner-page-header flex flex-wrap items-center justify-between gap-3">
        <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/owner/courts"><ArrowLeft className="h-4 w-4" /> Danh sách cụm sân</Link>
        {venue && <div className="flex gap-2"><Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant bg-white px-4 py-2 text-[13px] font-bold" to={`/owner/courts/${venueId}/edit`}><Edit3 className="h-4 w-4" /> Sửa thông tin</Link>{venue.approvalStatus !== 'Pending' && <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={isBusy} onClick={() => token && void run(() => submitOwnerVenue(token, venueId))} type="button"><Send className="h-4 w-4" /> Gửi Admin duyệt</button>}</div>}
      </div>

      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700">{error}</div>}
      {notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-[13px] font-bold text-emerald-800">{notice}</div>}
      {!venue && !error && <div className="owner-panel p-10 text-center font-bold text-on-surface-variant">Đang tải chi tiết...</div>}
      {venue && <>
        <section className="owner-panel p-5">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div><div className="flex flex-wrap items-center gap-2"><h1 className="text-[30px] font-bold">{venue.venueName}</h1><span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">{statusLabel[venue.approvalStatus]}</span><span className={`rounded-full px-3 py-1 text-[12px] font-bold ${venue.isOpen ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'}`}>{venue.isOpen ? 'Đang mở cửa' : 'Đang đóng cửa'}</span></div><p className="mt-2 flex items-center gap-2 text-[14px] text-on-surface-variant"><MapPin className="h-4 w-4" /> {venue.address}</p><p className="mt-2 text-[13px] font-medium">Mở {venue.openTime.slice(0, 5)} - {venue.closeTime.slice(0, 5)} · Giá cơ bản {currency.format(venue.basePrice)}/giờ · {venue.phoneNumber || 'Chưa có số điện thoại'}</p>{venue.rejectionReason && <p className="mt-3 rounded-lg bg-red-50 p-3 text-[13px] font-bold text-red-700">Admin phản hồi: {venue.rejectionReason}</p>}</div>
            <div className="grid grid-cols-2 gap-3 text-center"><div className="rounded-lg bg-surface-container-low p-4"><p className="text-[24px] font-bold text-primary">{venue.courts.length}</p><p className="text-[12px] font-bold">Sân con</p></div><div className="rounded-lg bg-surface-container-low p-4"><p className="text-[24px] font-bold text-primary">{venue.images.length}</p><p className="text-[12px] font-bold">Hình ảnh</p></div></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">{venue.amenities.length ? venue.amenities.map((amenity) => <span className="rounded-full bg-primary/10 px-3 py-1.5 text-[12px] font-bold text-primary" key={amenity}>{amenity}</span>) : <span className="text-[13px] text-on-surface-variant">Chưa thiết lập tiện ích.</span>}</div>
        </section>

        <section className="owner-panel p-5">
          <div className="mb-4 flex items-center gap-3">
            <Banknote className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-[21px] font-bold">Phí lên sàn Picklink</h2>
              <p className="text-[13px] text-on-surface-variant">Sân chỉ hiển thị cho người chơi khi đã được duyệt và phí lên sàn còn hạn.</p>
            </div>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
              <p className="text-[12px] font-bold uppercase text-on-surface-variant">Trạng thái</p>
              <p className="mt-2 text-[18px] font-black text-primary">{listingStatusLabel[venue.listingStatus] ?? venue.listingStatus}</p>
              <p className="mt-2 text-[13px] text-on-surface-variant">
                Hạn hiển thị: {venue.listingExpiresAt ? new Date(venue.listingExpiresAt).toLocaleDateString('vi-VN') : 'Chưa có'}
              </p>
              {venue.latestListingPayment?.rejectionReason && (
                <p className="mt-3 rounded-lg bg-red-50 p-3 text-[13px] font-bold text-red-700">
                  Lý do từ chối: {venue.latestListingPayment.rejectionReason}
                </p>
              )}
            </div>
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
              <div className="grid gap-3 md:grid-cols-[140px_1fr]">
                <label>
                  <span className="mb-1.5 block text-[12px] font-bold">Số tháng</span>
                  <input
                    className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-[13px] font-bold outline-none focus:border-primary"
                    max={24}
                    min={1}
                    onChange={(event) => setListingMonths(Math.max(1, Math.min(24, Number(event.target.value) || 1)))}
                    type="number"
                    value={listingMonths}
                  />
                </label>
                <div>
                  <p className="text-[12px] font-bold uppercase text-on-surface-variant">Số tiền tạm tính</p>
                  <p className="mt-1 text-[22px] font-black text-primary">{currency.format(listingPreview?.amount ?? 0)}</p>
                  <p className="text-[12px] text-on-surface-variant">
                    {(listingPreview?.activeCourtCount ?? venue.courts.filter((court) => court.availabilityStatus !== 'Inactive').length)} sân con × {currency.format(listingPreview?.pricePerCourtPerMonth ?? 0)} × {listingMonths} tháng
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
                <label>
                  <span className="mb-1.5 block text-[12px] font-bold">Biên lai thanh toán phí lên sàn</span>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="block w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white"
                    onChange={(event) => setListingReceipt(event.target.files?.[0] ?? null)}
                    type="file"
                  />
                </label>
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50"
                  disabled={!listingReceipt || isBusy || !listingPreview}
                  onClick={() => void submitListingFee()}
                  type="button"
                >
                  <Upload className="h-4 w-4" /> Gửi biên lai
                </button>
              </div>
              {listingReceipt && <p className="mt-2 text-[12px] font-bold text-primary">Đã chọn: {listingReceipt.name}</p>}
            </div>
          </div>
        </section>

        <section className="owner-panel p-5">
          <div className="mb-4 flex items-center gap-3"><Camera className="h-6 w-6 text-primary" /><div><h2 className="text-[21px] font-bold">Hình ảnh cụm sân</h2><p className="text-[13px] text-on-surface-variant">Tối đa 10 ảnh, mỗi ảnh không quá 5MB. Chấp nhận JPG, PNG và WEBP.</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {venue.images.map((image) => <article className="group relative overflow-hidden rounded-xl border border-outline-variant" key={image.venueImageId}><img alt={image.caption ?? venue.venueName} className="h-48 w-full object-cover" decoding="async" loading="lazy" src={image.imageUrl} />{image.isPrimary && <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-bold text-white"><Star className="h-3 w-3 fill-current" /> Ảnh đại diện</span>}<div className="flex items-center justify-between gap-2 p-3"><p className="truncate text-[12px] font-medium">{image.caption || 'Ảnh sân'}</p><div className="flex gap-1">{!image.isPrimary && <button className="rounded-lg border border-outline-variant p-2 text-primary" disabled={isBusy} onClick={() => token && void run(() => setPrimaryOwnerVenueImage(token, venueId, image.venueImageId))} title="Đặt làm ảnh đại diện" type="button"><Check className="h-4 w-4" /></button>}<button className="rounded-lg border border-red-200 p-2 text-red-600" disabled={isBusy} onClick={() => token && window.confirm('Xóa ảnh này?') && void run(() => deleteOwnerVenueImage(token, venueId, image.venueImageId))} title="Xóa ảnh" type="button"><Trash2 className="h-4 w-4" /></button></div></div></article>)}
            {venue.images.length === 0 && <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-outline-variant text-on-surface-variant"><div className="text-center"><Building2 className="mx-auto h-8 w-8" /><p className="mt-2 text-[13px] font-bold">Chưa có hình ảnh</p></div></div>}
          </div>
          {venue.images.length < 10 && <div className="mt-5 grid gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><label><span className="mb-1.5 block text-[12px] font-bold">Chọn ảnh</span><input accept="image/jpeg,image/png,image/webp" className="block w-full text-[13px] file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} type="file" /></label><label><span className="mb-1.5 block text-[12px] font-bold">Chú thích</span><input className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-[13px] outline-none focus:border-primary" maxLength={200} onChange={(event) => setCaption(event.target.value)} placeholder="Mặt sân, khu vực khán giả..." value={caption} /></label><button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white disabled:opacity-50" disabled={!imageFile || isBusy} onClick={() => void upload()} type="button"><Upload className="h-4 w-4" /> Tải ảnh</button></div>}
        </section>

        <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h2 className="text-[21px] font-bold">Danh sách sân con</h2>
            <p className="mt-1 text-[13px] text-on-surface-variant">Giá mới áp dụng cho các booking được tạo sau khi cập nhật.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {venue.courts.map((court) => (
              <article className="rounded-xl border border-outline-variant p-4" key={court.courtId}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">Sân {court.courtNumber}</h3>
                  <span className={`rounded-full px-2 py-1 text-[11px] font-bold ${court.availabilityStatus === 'Available' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>{court.availabilityStatus === 'Available' ? 'Hoạt động' : court.availabilityStatus === 'Maintenance' ? 'Bảo trì' : 'Ngừng'}</span>
                </div>
                <p className="mt-3 text-[13px]">{court.courtType} · {court.surfaceType || 'Chưa rõ mặt sân'}</p>
                <p className="mt-1 text-[13px]">{court.isIndoor ? 'Trong nhà' : 'Ngoài trời'}</p>
                <CourtPriceEditor court={court} disabled={isBusy} onSave={saveCourtPrice} />
              </article>
            ))}
          </div>
        </section>
      </>}
    </OwnerShell>
  );
};
