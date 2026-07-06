import { apiRequest } from './client';

export type AdminSetting = {
  settingKey: string;
  settingValue: string;
  settingGroup: string;
  description: string;
  minValue: number;
  maxValue: number;
  updatedAt?: string | null;
};

export const getAdminSettings = (accessToken: string) =>
  apiRequest<AdminSetting[]>('/api/admin/settings', {}, accessToken);

export const updateAdminSetting = (
  accessToken: string,
  settingKey: string,
  settingValue: string,
) =>
  apiRequest<AdminSetting>(
    `/api/admin/settings/${encodeURIComponent(settingKey)}`,
    { method: 'PUT', body: JSON.stringify({ settingValue }) },
    accessToken,
  );
