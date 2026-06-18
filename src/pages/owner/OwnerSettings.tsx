import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  Lock,
  MessageSquare,
  Save,
  Settings,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';
import { OwnerShell } from './components/OwnerShell';

type OwnerProfile = {
  businessName: string;
  representative: string;
  email: string;
  phone: string;
  taxCode: string;
  address: string;
};

type BookingRules = {
  minAdvanceHours: string;
  holdMinutes: string;
  cancellationHours: string;
  autoConfirmPaid: boolean;
  allowPayAtCourt: boolean;
  requireCheckInCode: boolean;
};

type NotificationSettings = {
  bookingCreated: boolean;
  paymentChanged: boolean;
  dailySummary: boolean;
  maintenanceReminder: boolean;
};

type PayoutSettings = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  payoutCycle: 'daily' | 'weekly' | 'monthly';
};

const initialProfile: OwnerProfile = {
  businessName: 'Pickleball Pro Duy Tân',
  representative: 'Nguyễn Văn An',
  email: 'owner@picklink.vn',
  phone: '0901 234 567',
  taxCode: '0109988776',
  address: 'Số 1 Duy Tân, Phường Cầu Giấy, Hà Nội',
};

const initialRules: BookingRules = {
  minAdvanceHours: '2',
  holdMinutes: '15',
  cancellationHours: '6',
  autoConfirmPaid: true,
  allowPayAtCourt: true,
  requireCheckInCode: true,
};

const initialNotifications: NotificationSettings = {
  bookingCreated: true,
  paymentChanged: true,
  dailySummary: true,
  maintenanceReminder: false,
};

const initialPayout: PayoutSettings = {
  bankName: 'Vietcombank',
  accountNumber: '1023456789',
  accountHolder: 'NGUYEN VAN AN',
  payoutCycle: 'weekly',
};

const payoutCycleLabels: Record<PayoutSettings['payoutCycle'], string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  monthly: 'Hằng tháng',
};

export const OwnerSettings = () => {
  const [profile, setProfile] = useState<OwnerProfile>(initialProfile);
  const [rules, setRules] = useState<BookingRules>(initialRules);
  const [notifications, setNotifications] = useState<NotificationSettings>(initialNotifications);
  const [payout, setPayout] = useState<PayoutSettings>(initialPayout);
  const [savedMessage, setSavedMessage] = useState('');

  const enabledNotifications = useMemo(
    () => Object.values(notifications).filter(Boolean).length,
    [notifications],
  );

  const updateProfile = <Field extends keyof OwnerProfile>(field: Field, value: OwnerProfile[Field]) => {
    setProfile((current) => ({ ...current, [field]: value }));
    setSavedMessage('');
  };

  const updateRules = <Field extends keyof BookingRules>(field: Field, value: BookingRules[Field]) => {
    setRules((current) => ({ ...current, [field]: value }));
    setSavedMessage('');
  };

  const updateNotifications = (field: keyof NotificationSettings, value: boolean) => {
    setNotifications((current) => ({ ...current, [field]: value }));
    setSavedMessage('');
  };

  const updatePayout = <Field extends keyof PayoutSettings>(field: Field, value: PayoutSettings[Field]) => {
    setPayout((current) => ({ ...current, [field]: value }));
    setSavedMessage('');
  };

  const handleSave = () => {
    setSavedMessage('Đã lưu cấu hình chủ sân.');
  };

  return (
    <OwnerShell activeId="settings" innerClassName="max-w-[1320px]">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary">
                  <Settings className="h-4 w-4" />
                  Cấu hình vận hành chủ sân
                </p>
                <h1 className="mt-3 text-[30px] font-bold leading-tight md:text-[40px]">Cài đặt chủ sân</h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-on-surface-variant">
                  Quản lý hồ sơ đơn vị vận hành, quy tắc đặt sân, nhận thông báo và thông tin đối soát doanh thu.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {savedMessage && (
                  <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#eaf7df] px-4 py-3 text-[14px] font-bold text-primary">
                    <CheckCircle2 className="h-5 w-5" />
                    {savedMessage}
                  </span>
                )}
                <button
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                  onClick={handleSave}
                  type="button"
                >
                  <Save className="h-5 w-5" />
                  Lưu cấu hình
                </button>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Hồ sơ vận hành', value: 'Đã xác minh', icon: ShieldCheck, helper: profile.businessName },
                { label: 'Giữ chỗ tạm', value: `${rules.holdMinutes} phút`, icon: Clock, helper: 'Trước khi giải phóng slot' },
                { label: 'Thông báo bật', value: `${enabledNotifications}/4`, icon: Bell, helper: 'Email và cảnh báo trong app' },
                { label: 'Đối soát', value: payoutCycleLabels[payout.payoutCycle], icon: Banknote, helper: payout.bankName },
              ].map((stat) => (
                <div className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm" key={stat.label}>
                  <stat.icon className="h-6 w-6 text-primary" />
                  <p className="mt-4 text-[12px] font-bold uppercase text-on-surface-variant">{stat.label}</p>
                  <p className="mt-1 text-[24px] font-bold leading-tight">{stat.value}</p>
                  <p className="mt-2 text-[13px] font-medium text-on-surface-variant">{stat.helper}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="space-y-6">
                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <User className="h-5 w-5 text-primary" />
                    Hồ sơ đơn vị vận hành
                  </h2>
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Tên đơn vị / cụm sân</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => updateProfile('businessName', event.target.value)}
                        value={profile.businessName}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Người đại diện</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => updateProfile('representative', event.target.value)}
                        value={profile.representative}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Email nhận thông báo</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => updateProfile('email', event.target.value)}
                        type="email"
                        value={profile.email}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Số điện thoại vận hành</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => updateProfile('phone', event.target.value)}
                        value={profile.phone}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Mã số thuế</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => updateProfile('taxCode', event.target.value)}
                        value={profile.taxCode}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Địa chỉ xuất hóa đơn</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => updateProfile('address', event.target.value)}
                        value={profile.address}
                      />
                    </label>
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <CalendarDays className="h-5 w-5 text-primary" />
                    Quy tắc đặt sân
                  </h2>
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Đặt trước tối thiểu</span>
                      <div className="mt-2 flex h-11 overflow-hidden rounded-lg border border-outline-variant bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                        <input
                          className="min-w-0 flex-1 px-3 text-[14px] font-bold outline-none"
                          min="0"
                          onChange={(event) => updateRules('minAdvanceHours', event.target.value)}
                          type="number"
                          value={rules.minAdvanceHours}
                        />
                        <span className="flex items-center border-l border-outline-variant px-3 text-[13px] font-bold text-on-surface-variant">giờ</span>
                      </div>
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Giữ chỗ chờ thanh toán</span>
                      <div className="mt-2 flex h-11 overflow-hidden rounded-lg border border-outline-variant bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                        <input
                          className="min-w-0 flex-1 px-3 text-[14px] font-bold outline-none"
                          min="1"
                          onChange={(event) => updateRules('holdMinutes', event.target.value)}
                          type="number"
                          value={rules.holdMinutes}
                        />
                        <span className="flex items-center border-l border-outline-variant px-3 text-[13px] font-bold text-on-surface-variant">phút</span>
                      </div>
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Hủy miễn phí trước</span>
                      <div className="mt-2 flex h-11 overflow-hidden rounded-lg border border-outline-variant bg-white focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                        <input
                          className="min-w-0 flex-1 px-3 text-[14px] font-bold outline-none"
                          min="0"
                          onChange={(event) => updateRules('cancellationHours', event.target.value)}
                          type="number"
                          value={rules.cancellationHours}
                        />
                        <span className="flex items-center border-l border-outline-variant px-3 text-[13px] font-bold text-on-surface-variant">giờ</span>
                      </div>
                    </label>
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-3">
                    {[
                      {
                        key: 'autoConfirmPaid' as const,
                        label: 'Tự xác nhận đơn đã thanh toán',
                        helper: 'Đơn online chuyển sang đã xác nhận ngay khi thanh toán thành công.',
                      },
                      {
                        key: 'allowPayAtCourt' as const,
                        label: 'Cho phép thanh toán tại sân',
                        helper: 'Khách có thể giữ slot và trả tiền khi check-in.',
                      },
                      {
                        key: 'requireCheckInCode' as const,
                        label: 'Bắt buộc mã check-in',
                        helper: 'Lễ tân cần quét hoặc nhập mã đặt sân khi khách đến.',
                      },
                    ].map((item) => (
                      <label className="flex min-h-[118px] cursor-pointer flex-col justify-between rounded-lg border border-outline-variant p-4 hover:bg-surface-container-low" key={item.key}>
                        <span>
                          <span className="block text-[14px] font-bold">{item.label}</span>
                          <span className="mt-2 block text-[13px] leading-5 text-on-surface-variant">{item.helper}</span>
                        </span>
                        <input
                          checked={rules[item.key]}
                          className="mt-4 h-5 w-5 accent-primary"
                          onChange={(event) => updateRules(item.key, event.target.checked)}
                          type="checkbox"
                        />
                      </label>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <Banknote className="h-5 w-5 text-primary" />
                    Tài khoản đối soát
                  </h2>
                  <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Ngân hàng</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => updatePayout('bankName', event.target.value)}
                        value={payout.bankName}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Số tài khoản</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => updatePayout('accountNumber', event.target.value)}
                        value={payout.accountNumber}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Chủ tài khoản</span>
                      <input
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                        onChange={(event) => updatePayout('accountHolder', event.target.value)}
                        value={payout.accountHolder}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[13px] font-bold text-on-surface-variant">Chu kỳ chuyển khoản</span>
                      <select
                        className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary"
                        onChange={(event) => updatePayout('payoutCycle', event.target.value as PayoutSettings['payoutCycle'])}
                        value={payout.payoutCycle}
                      >
                        <option value="daily">Hằng ngày</option>
                        <option value="weekly">Hằng tuần</option>
                        <option value="monthly">Hằng tháng</option>
                      </select>
                    </label>
                  </div>
                </section>
              </div>

              <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <Bell className="h-5 w-5 text-primary" />
                    Thông báo
                  </h2>
                  <div className="mt-5 space-y-3">
                    {[
                      { key: 'bookingCreated' as const, label: 'Có đơn đặt sân mới', helper: 'Gửi khi khách tạo booking hoặc yêu cầu giữ chỗ.' },
                      { key: 'paymentChanged' as const, label: 'Thanh toán thay đổi', helper: 'Báo khi đơn đã trả, lỗi thanh toán hoặc hoàn tiền.' },
                      { key: 'dailySummary' as const, label: 'Tổng kết cuối ngày', helper: 'Tóm tắt doanh thu, check-in và slot trống.' },
                      { key: 'maintenanceReminder' as const, label: 'Nhắc lịch bảo trì', helper: 'Cảnh báo trước các block khóa sân và lịch bảo trì.' },
                    ].map((item) => (
                      <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-outline-variant p-4 hover:bg-surface-container-low" key={item.key}>
                        <span>
                          <span className="block text-[14px] font-bold">{item.label}</span>
                          <span className="mt-1 block text-[13px] leading-5 text-on-surface-variant">{item.helper}</span>
                        </span>
                        <input
                          checked={notifications[item.key]}
                          className="mt-1 h-5 w-5 shrink-0 accent-primary"
                          onChange={(event) => updateNotifications(item.key, event.target.checked)}
                          type="checkbox"
                        />
                      </label>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <Lock className="h-5 w-5 text-primary" />
                    Bảo mật & phân quyền
                  </h2>
                  <div className="mt-5 space-y-3">
                    {[
                      { label: 'OTP cho quản lý sân', value: 'Đang bật', icon: ShieldCheck },
                      { label: 'Nhân sự có quyền check-in', value: '4 người', icon: Users },
                      { label: 'Kênh hỗ trợ khách', value: 'Tin nhắn Picklink', icon: MessageSquare },
                    ].map((item) => (
                      <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-4" key={item.label}>
                        <div className="flex items-center gap-3">
                          <item.icon className="h-5 w-5 text-primary" />
                          <span className="text-[13px] font-bold text-on-surface-variant">{item.label}</span>
                        </div>
                        <span className="text-right text-[14px] font-bold">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 rounded-lg bg-[#fff8e6] p-4 text-[13px] leading-5 text-[#755400]">
                    Những thay đổi liên quan đến tài khoản ngân hàng, OTP hoặc phân quyền nhân sự nên được ghi nhận vào nhật ký vận hành trước khi áp dụng thật.
                  </p>
                </section>
              </aside>
            </section>
    </OwnerShell>
  );
};
