import React, { useState } from 'react';
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
  amenities: string;
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
    amenities: initial?.amenities ?? '',
  });

  const update = (key: keyof VenueFormDraft, value: string) => setDraft((current) => ({ ...current, [key]: value }));

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
      amenities: draft.amenities.split(',').map((item) => item.trim()).filter(Boolean),
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
        <label className={isCreate ? '' : 'md:col-span-2'}>
          <span className="mb-1.5 block text-[13px] font-bold">Tiện ích</span>
          <input className={fieldClassName} onChange={(event) => update('amenities', event.target.value)} placeholder="Bãi xe, phòng thay đồ, nước uống" value={draft.amenities} />
        </label>
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
