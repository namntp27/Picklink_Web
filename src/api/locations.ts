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

export const listProvinces = () => apiRequest<ProvinceOption[]>('/api/locations/provinces');

export const listWards = (provinceCode: string) =>
  apiRequest<WardOption[]>(`/api/locations/provinces/${encodeURIComponent(provinceCode)}/wards`);