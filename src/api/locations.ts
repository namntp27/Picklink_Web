import { apiRequest } from './client';

export type ProvinceOption = {
  code: string;
  name: string;
  fullName: string;
};

export type WardOption = {
  code: string;
  provinceCode: string;
  name: string;
  fullName: string;
};

let provinceCache: ProvinceOption[] | null = null;
const wardCache = new Map<string, WardOption[]>();

const normalizeAdministrativeName = (value: string) => value
  .normalize('NFD')
  .replace(/\p{M}/gu, '')
  .replace(/đ/gi, 'd')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .replace(/^(thanh pho|tinh|tp|phuong|xa|thi tran|dac khu|quan|huyen|thi xa)\s+/, '')
  .trim();

export const administrativeNamesEqual = (left: string, right: string) =>
  normalizeAdministrativeName(left) === normalizeAdministrativeName(right);

export const listProvinces = async (signal?: AbortSignal) => {
  if (provinceCache) return provinceCache;
  const provinces = await apiRequest<ProvinceOption[]>('/api/locations/provinces', signal ? { signal } : {});
  provinceCache = provinces;
  return provinces;
};

export const listWards = async (provinceCode: string, signal?: AbortSignal) => {
  const cached = wardCache.get(provinceCode);
  if (cached) return cached;
  const wards = await apiRequest<WardOption[]>(
    '/api/locations/provinces/' + encodeURIComponent(provinceCode) + '/wards',
    signal ? { signal } : {},
  );
  wardCache.set(provinceCode, wards);
  return wards;
};

export const resolveAdministrativeArea = async (
  province: string,
  ward = '',
  signal?: AbortSignal,
) => {
  if (!province.trim()) return { province: '', ward: '' };

  const provinces = await listProvinces(signal);
  const provinceOption = provinces.find((item) =>
    administrativeNamesEqual(item.name, province)
    || administrativeNamesEqual(item.fullName, province));
  if (!provinceOption) return { province: '', ward: '' };
  if (!ward.trim()) return { province: provinceOption.name, ward: '' };

  const wards = await listWards(provinceOption.code, signal);
  const wardOption = wards.find((item) =>
    administrativeNamesEqual(item.name, ward)
    || administrativeNamesEqual(item.fullName, ward));
  return {
    province: provinceOption.name,
    ward: wardOption?.name ?? '',
  };
};