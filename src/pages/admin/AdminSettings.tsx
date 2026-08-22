import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Loader2, Save, Settings } from 'lucide-react';
import {
  getAdminSettings,
  updateAdminSetting,
  type AdminSetting,
} from '../../api/adminSettings';
import { ApiError } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useToast } from '../../components/ui/ToastRegion';
import { useApiQuery } from '../../hooks/useApiQuery';
import { AdminShell } from './components/AdminShell';
import { MobileAdminNav } from './components/MobileAdminNav';

const inputClass = 'h-9 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/15';
const primaryButton = 'inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3.5 text-xs font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50';

const labels: Record<string, string> = {
  bookingHoldMinutes: 'Thời gian giữ chỗ booking',
  listingExpiryReminderDays: 'Nhắc hạn phí lên sàn',
  maxReceiptUploadMb: 'Dung lượng biên lai',
  highPriorityReportMinutes: 'SLA báo cáo ưu tiên cao',
};

const units: Record<string, string> = {
  bookingHoldMinutes: 'phút',
  listingExpiryReminderDays: 'ngày',
  maxReceiptUploadMb: 'MB',
  highPriorityReportMinutes: 'phút',
};

const formatDateTime = (value?: string | null) =>
  value ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Chưa cập nhật';

const emptySettings: AdminSetting[] = [];

export const AdminSettings = () => {
  const { token } = useAuth();
  const notify = useToast();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const {
    data: settings = emptySettings,
    error,
    loading,
    refresh: loadSettings,
    setData: setSettings,
  } = useApiQuery(
    ['admin-settings', token],
    () => getAdminSettings(token!),
    { enabled: Boolean(token), errorMessage: 'Không thể tải cấu hình hệ thống.' },
  );

  // Editable drafts follow whatever the server last returned.
  useEffect(() => {
    setDrafts(Object.fromEntries(settings.map((item) => [item.settingKey, item.settingValue])));
  }, [settings]);

  const grouped = useMemo(() => {
    const groups = new Map<string, AdminSetting[]>();
    settings.forEach((setting) => {
      const items = groups.get(setting.settingGroup) ?? [];
      items.push(setting);
      groups.set(setting.settingGroup, items);
    });
    return [...groups.entries()];
  }, [settings]);

  const save = async (setting: AdminSetting) => {
    if (!token) return;
    const settingValue = drafts[setting.settingKey]?.trim() ?? '';
    setBusyKey(setting.settingKey);
    try {
      const updated = await updateAdminSetting(token, setting.settingKey, settingValue);
      setSettings((current) => (current ?? emptySettings).map((item) => item.settingKey === updated.settingKey ? updated : item));
      setDrafts((current) => ({ ...current, [updated.settingKey]: updated.settingValue }));
      notify('Đã lưu cấu hình.', 'success');
    } catch (requestError) {
      notify(requestError instanceof ApiError ? requestError.message : 'Không thể lưu cấu hình.', 'error');
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <AdminShell activeId="settings">
      <MobileAdminNav activeId="settings" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-primary">Cấu hình</p>
          <h1 className="text-[20px] font-bold leading-tight md:text-[24px]">Thiết lập hệ thống</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            Các cấu hình này được lưu trong database thật để admin điều chỉnh vận hành sàn.
          </p>
        </div>
        <button className={primaryButton} disabled={loading} onClick={() => void loadSettings()} type="button">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings className="h-4 w-4" />}
          Tải lại
        </button>
      </section>

      {error && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-error/25 bg-error-container p-4 text-sm font-semibold text-error">
          <AlertTriangle className="h-5 w-5 shrink-0" />{error}
          <button className="ml-auto underline" onClick={() => void loadSettings()} type="button">Thử lại</button>
        </div>
      )}

      {loading && (
        <div className="grid min-h-64 place-items-center rounded-xl border border-outline-variant bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
        </div>
      )}

      {!loading && (
        <div className="space-y-5">
          {grouped.map(([group, items]) => (
            <section className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm" key={group}>
              <div className="mb-4">
                <p className="text-xs font-bold uppercase text-primary">{group}</p>
                <h2 className="text-xl font-bold">Cấu hình {group.toLowerCase()}</h2>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {items.map((setting) => {
                  const value = drafts[setting.settingKey] ?? setting.settingValue;
                  const invalid = Number(value) < setting.minValue || Number(value) > setting.maxValue || !Number.isFinite(Number(value));
                  return (
                    <article className="rounded-xl border border-outline-variant bg-surface-container-low p-4" key={setting.settingKey}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="font-bold">{labels[setting.settingKey] ?? setting.settingKey}</h3>
                          <p className="mt-1 text-sm text-on-surface-variant">{setting.description}</p>
                          <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                            Cho phép {setting.minValue} - {setting.maxValue} {units[setting.settingKey] ?? ''}
                          </p>
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                          {units[setting.settingKey] ?? 'giá trị'}
                        </span>
                      </div>
                      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                        <input
                          className={inputClass}
                          max={setting.maxValue}
                          min={setting.minValue}
                          onChange={(event) => setDrafts((current) => ({ ...current, [setting.settingKey]: event.target.value }))}
                          type="number"
                          value={value}
                        />
                        <button className={primaryButton} disabled={busyKey === setting.settingKey || invalid} onClick={() => void save(setting)} type="button">
                          {busyKey === setting.settingKey ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                          Lưu
                        </button>
                      </div>
                      {invalid && <p className="mt-2 text-xs font-bold text-error">Giá trị ngoài phạm vi cho phép.</p>}
                      <p className="mt-2 text-xs text-on-surface-variant">Cập nhật: {formatDateTime(setting.updatedAt)}</p>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AdminShell>
  );
};
