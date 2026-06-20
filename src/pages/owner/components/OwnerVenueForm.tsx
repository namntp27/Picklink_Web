import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { OwnerVenueInput } from '../../../api/owner';
import { OpenStreetMapLocationPicker } from './OpenStreetMapLocationPicker';

type VenueFormDraft = {
  venueName: string;
  address: string;
  openTime: string;
  closeTime: string;
  phoneNumber: string;
  latitude: string;
  longitude: string;
  basePrice: string;
  initialCourtCount: string;
  amenities: string[];
};

const fieldClassName = 'w-full rounded-lg border border-outline-variant bg-white px-3 py-2.5 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary';

export const OwnerVenueForm = ({
  initial,
  isCreate = false,
  isSaving,
  onSubmit,
}: {
  initial?: Partial<VenueFormDraft>;
  isCreate?: boolean;
  isSaving: boolean;
  onSubmit: (input: OwnerVenueInput) => Promise<void>;
}) => {
  const [draft, setDraft] = useState<VenueFormDraft>({
    venueName: initial?.venueName ?? '',
    address: initial?.address ?? '',
    openTime: initial?.openTime?.slice(0, 5) ?? '06:00',
    closeTime: initial?.closeTime?.slice(0, 5) ?? '22:00',
    phoneNumber: initial?.phoneNumber ?? '',
    latitude: initial?.latitude ?? '',
    longitude: initial?.longitude ?? '',
    basePrice: initial?.basePrice ?? '100000',
    initialCourtCount: initial?.initialCourtCount ?? '1',
    amenities: initial?.amenities ?? [],
  });
  const [amenityDraft, setAmenityDraft] = useState('');

  const update = <K extends keyof VenueFormDraft>(key: K, value: VenueFormDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await onSubmit({
      venueName: draft.venueName.trim(),
      address: draft.address.trim(),
      openTime: draft.openTime,
      closeTime: draft.closeTime,
      phoneNumber: draft.phoneNumber.trim() || undefined,
      latitude: draft.latitude ? Number(draft.latitude) : null,
      longitude: draft.longitude ? Number(draft.longitude) : null,
      basePrice: Number(draft.basePrice) || 0,
      initialCourtCount: isCreate ? Number(draft.initialCourtCount) || 0 : 0,
      amenities: draft.amenities,
    });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="mb-1.5 block text-[13px] font-bold">Tên cụm sân</span>
          <input className={fieldClassName} minLength={3} onChange={(event) => update('venueName', event.target.value)} required value={draft.venueName} />
        </label>
        <OpenStreetMapLocationPicker
          onChange={(location) => setDraft((current) => ({
            ...current,
            address: location.address,
            latitude: location.latitude,
            longitude: location.longitude,
          }))}
          value={{ address: draft.address, latitude: draft.latitude, longitude: draft.longitude }}
        />
        <label>
          <span className="mb-1.5 block text-[13px] font-bold">Giờ mở cửa</span>
          <input className={fieldClassName} onChange={(event) => update('openTime', event.target.value)} required type="time" value={draft.openTime} />
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] font-bold">Giờ đóng cửa</span>
          <input className={fieldClassName} onChange={(event) => update('closeTime', event.target.value)} required type="time" value={draft.closeTime} />
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] font-bold">Số điện thoại</span>
          <input className={fieldClassName} onChange={(event) => update('phoneNumber', event.target.value)} type="tel" value={draft.phoneNumber} />
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] font-bold">Giá cơ bản / giờ</span>
          <input className={fieldClassName} min="0" onChange={(event) => update('basePrice', event.target.value)} required type="number" value={draft.basePrice} />
        </label>
        {isCreate && (
          <label>
            <span className="mb-1.5 block text-[13px] font-bold">Số sân con ban đầu</span>
            <input className={fieldClassName} max="100" min="0" onChange={(event) => update('initialCourtCount', event.target.value)} type="number" value={draft.initialCourtCount} />
          </label>
        )}
        <div className={isCreate ? '' : 'md:col-span-2'}>
          <span className="mb-1.5 block text-[13px] font-bold">Tiện ích</span>
          <div className="flex gap-2">
            <input
              className={fieldClassName}
              onChange={(event) => setAmenityDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter') return;
                event.preventDefault();
                const value = amenityDraft.trim();
                if (value && !draft.amenities.some((item) => item.toLowerCase() === value.toLowerCase())) {
                  setDraft((current) => ({ ...current, amenities: [...current.amenities, value] }));
                }
                setAmenityDraft('');
              }}
              placeholder="Ví dụ: Bãi xe"
              value={amenityDraft}
            />
            <button
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-primary px-3 text-[13px] font-bold text-primary"
              onClick={() => {
                const value = amenityDraft.trim();
                if (value && !draft.amenities.some((item) => item.toLowerCase() === value.toLowerCase())) {
                  setDraft((current) => ({ ...current, amenities: [...current.amenities, value] }));
                }
                setAmenityDraft('');
              }}
              type="button"
            ><Plus className="h-4 w-4" /> Thêm</button>
          </div>
          <div className="mt-2 flex min-h-7 flex-wrap gap-2">
            {draft.amenities.map((amenity) => (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary" key={amenity}>
                {amenity}
                <button aria-label={`Xóa ${amenity}`} onClick={() => setDraft((current) => ({ ...current, amenities: current.amenities.filter((item) => item !== amenity) }))} type="button"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
          </div>
        </div>
        {/* <label>
          <span className="mb-1.5 block text-[13px] font-bold">Vĩ độ</span>
          <input className={fieldClassName} max="90" min="-90" onChange={(event) => update('latitude', event.target.value)} step="any" type="number" value={draft.latitude} />
        </label>
        <label>
          <span className="mb-1.5 block text-[13px] font-bold">Kinh độ</span>
          <input className={fieldClassName} max="180" min="-180" onChange={(event) => update('longitude', event.target.value)} step="any" type="number" value={draft.longitude} />
        </label> */}
      </div>

      <div className="flex justify-end gap-3 border-t border-outline-variant pt-5">
        <Link className="rounded-lg border border-outline-variant px-5 py-2.5 text-[14px] font-bold hover:bg-surface-container-low" to="/owner/courts">Hủy</Link>
        <button className="rounded-lg bg-primary px-5 py-2.5 text-[14px] font-bold text-white disabled:opacity-60" disabled={isSaving} type="submit">
          {isSaving ? 'Đang lưu...' : isCreate ? 'Tạo cụm sân' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
};
