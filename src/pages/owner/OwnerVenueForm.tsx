import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ImagePlus, MapPin, Save, Trash2 } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, toMediaUrl } from '../../api/client';
import { administrativeApi, ownerVenueApi, uploadApi } from '../../api/venues';
import { LocationMap } from '../../components/maps/LocationMap';
import type { OpeningHour, Province, VenueImage, VenueInput, Ward } from '../../types/venue';
import { OwnerShell } from './components/OwnerShell';

const dayNames = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
const defaultHours: OpeningHour[] = dayNames.map((_, dayOfWeek) => ({
  dayOfWeek,
  isClosed: false,
  openTime: '06:00',
  closeTime: '22:00',
}));

export const OwnerVenueForm = () => {
  const { id } = useParams();
  const editing = Boolean(id);
  const navigate = useNavigate();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [wardId, setWardId] = useState('');
  const [latitude, setLatitude] = useState(21.028511);
  const [longitude, setLongitude] = useState(105.804817);
  const [amenitiesText, setAmenitiesText] = useState('');
  const [images, setImages] = useState<VenueImage[]>([]);
  const [openingHours, setOpeningHours] = useState<OpeningHour[]>(defaultHours);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    administrativeApi.provinces().then(setProvinces).catch((reason) => setError(reason.message));
  }, []);

  useEffect(() => {
    if (!provinceId) {
      setWards([]);
      return;
    }
    administrativeApi.wards(provinceId).then(setWards).catch((reason) => setError(reason.message));
  }, [provinceId]);

  useEffect(() => {
    if (!id) return;
    ownerVenueApi.venue(id)
      .then((venue) => {
        setName(venue.name);
        setDescription(venue.description ?? '');
        setPhoneNumber(venue.phoneNumber);
        setStreetAddress(venue.streetAddress);
        setProvinceId(venue.provinceId);
        setWardId(venue.wardId);
        setLatitude(venue.latitude);
        setLongitude(venue.longitude);
        setAmenitiesText(venue.amenities.join(', '));
        setImages(venue.images);
        setOpeningHours(venue.openingHours.length === 7 ? venue.openingHours : defaultHours);
      })
      .catch((reason) => setError(reason.message))
      .finally(() => setLoading(false));
  }, [id]);

  const amenities = useMemo(() => amenitiesText.split(/[,\n]+/).map((item) => item.trim()).filter(Boolean), [amenitiesText]);

  const updateOpeningHour = (dayOfWeek: number, patch: Partial<OpeningHour>) => {
    setOpeningHours((current) => current.map((item) => item.dayOfWeek === dayOfWeek ? { ...item, ...patch } : item));
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    if (images.length + files.length > 10) {
      setError('Mỗi cơ sở chỉ được tối đa 10 ảnh.');
      return;
    }
    setUploading(true);
    setError('');
    try {
      const uploaded = await Promise.all(Array.from(files).map((file) => uploadApi.image(file)));
      setImages((current) => [
        ...current,
        ...uploaded.map((item, index) => ({
          url: item.url,
          sortOrder: current.length + index,
          isPrimary: current.length === 0 && index === 0,
        })),
      ]);
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
    const input: VenueInput = {
      name,
      description,
      phoneNumber,
      streetAddress,
      provinceId,
      wardId,
      latitude,
      longitude,
      amenities,
      images: images.map(({ url, sortOrder, isPrimary }) => ({ url, sortOrder, isPrimary })),
      openingHours: openingHours.map((item) => ({
        ...item,
        openTime: item.openTime && item.openTime.length === 5 ? `${item.openTime}:00` : item.openTime,
        closeTime: item.closeTime && item.closeTime.length === 5 ? `${item.closeTime}:00` : item.closeTime,
      })),
    };
    try {
      if (id) await ownerVenueApi.updateVenue(id, input);
      else await ownerVenueApi.createVenue(input);
      navigate('/owner/courts', { replace: true });
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : 'Không thể lưu cơ sở.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <OwnerShell activeId="courts"><p>Đang tải cơ sở...</p></OwnerShell>;

  return (
    <OwnerShell activeId="courts" innerClassName="max-w-[1180px]">
      <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/owner/courts">
        <ArrowLeft className="h-4 w-4" /> Quay lại quản lý sân
      </Link>

      <form className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]" onSubmit={handleSubmit}>
        <div className="space-y-6">
          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h1 className="text-[28px] font-bold">{editing ? 'Chỉnh sửa cơ sở' : 'Tạo cơ sở mới'}</h1>
            <p className="mt-1 text-[14px] text-secondary">Cơ sở được lưu nháp và cần gửi Admin duyệt trước khi công khai.</p>
            {error && <p className="mt-4 rounded-lg bg-error-container p-3 text-[13px] font-bold text-error">{error}</p>}

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="space-y-1 text-[13px] font-bold">Tên cơ sở
                <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium" />
              </label>
              <label className="space-y-1 text-[13px] font-bold">Số điện thoại
                <input required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium" />
              </label>
              <label className="space-y-1 text-[13px] font-bold md:col-span-2">Mô tả
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full resize-none rounded-lg border border-outline-variant px-3 py-2.5 font-medium" />
              </label>
              <label className="space-y-1 text-[13px] font-bold">Tỉnh/Thành phố
                <select required value={provinceId} onChange={(e) => { setProvinceId(e.target.value); setWardId(''); }} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium">
                  <option value="">Chọn tỉnh/thành</option>
                  {provinces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[13px] font-bold">Xã/Phường
                <select required value={wardId} onChange={(e) => setWardId(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium">
                  <option value="">Chọn xã/phường</option>
                  {wards.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-[13px] font-bold md:col-span-2">Địa chỉ chi tiết
                <input required value={streetAddress} onChange={(e) => setStreetAddress(e.target.value)} className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium" />
              </label>
              <label className="space-y-1 text-[13px] font-bold md:col-span-2">Tiện ích (phân tách bằng dấu phẩy)
                <input value={amenitiesText} onChange={(e) => setAmenitiesText(e.target.value)} placeholder="Bãi đỗ xe, phòng thay đồ, cho thuê vợt" className="w-full rounded-lg border border-outline-variant px-3 py-2.5 font-medium" />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /><h2 className="text-[18px] font-bold">Vị trí bản đồ</h2></div>
            <div className="overflow-hidden rounded-lg border border-outline-variant">
              <LocationMap latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); }} />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-[12px] text-secondary">
              <span>Vĩ độ: {latitude.toFixed(6)}</span><span>Kinh độ: {longitude.toFixed(6)}</span>
            </div>
          </section>

          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-[18px] font-bold">Giờ hoạt động</h2>
            <div className="space-y-2">
              {openingHours.slice().sort((a, b) => a.dayOfWeek - b.dayOfWeek).map((item) => (
                <div key={item.dayOfWeek} className="grid grid-cols-[100px_70px_1fr_1fr] items-center gap-2 text-[13px]">
                  <strong>{dayNames[item.dayOfWeek]}</strong>
                  <label className="flex items-center gap-1"><input type="checkbox" checked={item.isClosed} onChange={(e) => updateOpeningHour(item.dayOfWeek, { isClosed: e.target.checked })} /> Nghỉ</label>
                  <input type="time" disabled={item.isClosed} value={item.openTime?.slice(0, 5) ?? ''} onChange={(e) => updateOpeningHour(item.dayOfWeek, { openTime: e.target.value })} className="rounded-lg border border-outline-variant px-2 py-2" />
                  <input type="time" disabled={item.isClosed} value={item.closeTime?.slice(0, 5) ?? ''} onChange={(e) => updateOpeningHour(item.dayOfWeek, { closeTime: e.target.value })} className="rounded-lg border border-outline-variant px-2 py-2" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-20 xl:self-start">
          <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between"><h2 className="text-[18px] font-bold">Hình ảnh</h2><span className="text-[12px] text-secondary">{images.length}/10</span></div>
            <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-primary px-4 py-4 text-[13px] font-bold text-primary hover:bg-primary/5">
              <ImagePlus className="h-5 w-5" /> {uploading ? 'Đang tải...' : 'Thêm ảnh'}
              <input className="hidden" type="file" accept="image/*" multiple disabled={uploading} onChange={(e) => void handleFiles(e.target.files)} />
            </label>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {images.map((image, index) => (
                <div key={`${image.url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-lg border border-outline-variant">
                  <img src={toMediaUrl(image.url)} alt="Ảnh cơ sở" className="h-full w-full object-cover" />
                  <button type="button" aria-label="Xóa ảnh" onClick={() => setImages((current) => current.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-1 top-1 rounded-md bg-white p-1 text-error shadow"><Trash2 className="h-4 w-4" /></button>
                  {image.isPrimary && <span className="absolute bottom-1 left-1 rounded bg-primary px-2 py-1 text-[10px] font-bold text-white">Ảnh chính</span>}
                </div>
              ))}
            </div>
          </section>
          <button disabled={saving || uploading} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white disabled:opacity-60">
            <Save className="h-5 w-5" /> {saving ? 'Đang lưu...' : 'Lưu bản nháp'}
          </button>
        </aside>
      </form>
    </OwnerShell>
  );
};
