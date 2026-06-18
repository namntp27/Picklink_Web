import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { settingsGroups } from '../adminData';
import { AdminShell } from './AdminShell';
import { MobileAdminNav } from './MobileAdminNav';

export const AdminSettingsPage = () => {
  return (
    <AdminShell activeId="settings">
      <MobileAdminNav activeId="settings" />

      <section className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-primary">Thiết lập hệ thống</p>
          <h1 className="text-[30px] font-bold leading-tight text-on-background md:text-[36px]">Cấu hình hệ thống</h1>
          <p className="mt-2 max-w-3xl text-[15px] leading-6 text-secondary">
            Quản lý các tham số vận hành chung cho booking, thanh toán, kiểm duyệt, bảo mật và thông báo hệ thống.
          </p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-on-primary shadow-sm transition-opacity hover:opacity-90">
          <CheckCircle2 className="h-5 w-5" />
          Lưu cấu hình
        </button>
      </section>

      <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Quy tắc đang bật', value: '42', helper: '5 nhóm cấu hình', icon: Settings },
          { label: 'Cấu hình thanh toán', value: 'Ổn định', helper: 'Đối soát mỗi ngày', icon: CreditCard },
          { label: 'Kiểm duyệt tự động', value: '86%', helper: 'Độ chính xác tuần này', icon: ShieldCheck },
          { label: 'Cảnh báo bảo mật', value: '3', helper: 'Cần xem lại trong ngày', icon: AlertTriangle },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <span className="mb-4 inline-flex rounded-lg bg-primary-container/25 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <p className="text-[13px] font-bold text-secondary">{stat.label}</p>
              <h2 className="mt-1 text-[28px] font-bold text-on-background">{stat.value}</h2>
              <p className="mt-1 text-[12px] text-secondary">{stat.helper}</p>
            </div>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="space-y-5">
          {settingsGroups.map((group) => (
            <div key={group.title} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
              <div className="mb-5 border-b border-outline-variant pb-4">
                <h2 className="text-[20px] font-bold text-on-background">{group.title}</h2>
                <p className="mt-1 text-[14px] leading-6 text-secondary">{group.description}</p>
              </div>
              <div className="divide-y divide-outline-variant">
                {group.items.map((item) => (
                  <div key={item.label} className="grid gap-4 py-4 md:grid-cols-[minmax(0,1fr)_220px] md:items-center">
                    <div>
                      <p className="text-[15px] font-bold text-on-background">{item.label}</p>
                      <p className="mt-1 text-[13px] leading-5 text-secondary">{item.helper}</p>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-outline-variant bg-surface px-3 py-2">
                      <span className="text-[14px] font-bold text-on-background">{item.value}</span>
                      {typeof item.enabled === 'boolean' ? (
                        <button
                          className={`relative h-6 w-11 rounded-full transition-colors ${
                            item.enabled ? 'bg-primary' : 'bg-outline-variant'
                          }`}
                          title={item.enabled ? 'Đang bật' : 'Đang tắt'}
                        >
                          <span
                            className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                              item.enabled ? 'left-6' : 'left-1'
                            }`}
                          />
                        </button>
                      ) : (
                        <button className="rounded-md border border-outline-variant px-2 py-1 text-[12px] font-bold text-secondary hover:border-primary hover:text-primary">
                          Sửa
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-sm">
            <h2 className="mb-4 text-[18px] font-bold text-on-background">Nhật ký thay đổi</h2>
            <div className="space-y-4">
              {[
                ['18/06/2026 09:20', 'Bật OTP cho tài khoản admin'],
                ['17/06/2026 18:05', 'Cập nhật SLA báo cáo ưu tiên cao'],
                ['16/06/2026 14:12', 'Điều chỉnh phí nền tảng mặc định'],
              ].map(([time, action]) => (
                <div key={time} className="border-l-2 border-primary pl-3">
                  <p className="text-[13px] font-bold text-on-background">{action}</p>
                  <p className="mt-1 text-[12px] text-secondary">{time}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-error/30 bg-error-container/80 p-5 text-error shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="text-[18px] font-bold">Cấu hình nhạy cảm</h2>
            </div>
            <p className="text-[13px] leading-5">
              Các thay đổi về thanh toán, hoàn tiền và bảo mật admin nên được ghi nhận vào nhật ký vận hành trước khi áp dụng.
            </p>
          </section>
        </aside>
      </div>
    </AdminShell>
  );
};
