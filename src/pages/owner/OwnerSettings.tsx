import React, { useEffect, useMemo, useState } from 'react';
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
import { ApiError } from '../../api/client';
import { getOwnerBankAccount, saveOwnerBankAccount } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';

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
  bankCode: string;
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
  bankCode: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  payoutCycle: 'weekly',
};

const vietnameseBanks = [
  { code: 'VCB', name: 'Vietcombank' },
  { code: 'BIDV', name: 'BIDV' },
  { code: 'ICB', name: 'VietinBank' },
  { code: 'VBA', name: 'Agribank' },
  { code: 'TCB', name: 'Techcombank' },
  { code: 'MB', name: 'MB Bank' },
  { code: 'ACB', name: 'ACB' },
  { code: 'VPB', name: 'VPBank' },
  { code: 'TPB', name: 'TPBank' },
  { code: 'STB', name: 'Sacombank' },
  { code: 'VIB', name: 'VIB' },
  { code: 'HDB', name: 'HDBank' },
  { code: 'SHB', name: 'SHB' },
  { code: 'MSB', name: 'MSB' },
  { code: 'OCB', name: 'OCB' },
  { code: 'EIB', name: 'Eximbank' },
  { code: 'SCB', name: 'SCB' },
  { code: 'SEAB', name: 'SeABank' },
  { code: 'NAB', name: 'Nam A Bank' },
  { code: 'CAKE', name: 'CAKE by VPBank' },
] as const;

const payoutCycleLabels: Record<PayoutSettings['payoutCycle'], string> = {
  daily: 'Hằng ngày',
  weekly: 'Hằng tuần',
  monthly: 'Hằng tháng',
};

export const OwnerSettings = () => {
  const { token } = useAuth();
  const [profile, setProfile] = useState<OwnerProfile>(initialProfile);
  const [rules, setRules] = useState<BookingRules>(initialRules);
  const [notifications, setNotifications] = useState<NotificationSettings>(initialNotifications);
  const [payout, setPayout] = useState<PayoutSettings>(initialPayout);
  const [savedMessage, setSavedMessage] = useState('');

  useEffect(() => {
    if (!token) return;
    getOwnerBankAccount(token).then((account) => setPayout((current) => ({
      ...current,
      bankCode: account.bankCode,
      bankName: account.bankName,
      accountNumber: account.accountNumber,
      accountHolder: account.accountHolderName,
    }))).catch((requestError) => {
      if (requestError instanceof ApiError && requestError.status !== 404) setSavedMessage(requestError.message);
    });
  }, [token]);

  const enabledNotifications = useMemo(
    () => Object.values(notifications).filter(Boolean).length,
    [notifications],
  );

  const payoutIsValid = Boolean(
    payout.bankCode
      && /^\d{5,30}$/.test(payout.accountNumber)
      && payout.accountHolder.trim().length >= 2,
  );
  const qrPreviewUrl = payoutIsValid
    ? `https://img.vietqr.io/image/${encodeURIComponent(payout.bankCode)}-${encodeURIComponent(payout.accountNumber)}-compact2.png?amount=10000&addInfo=${encodeURIComponent('PICKLINK TEST')}&accountName=${encodeURIComponent(payout.accountHolder.trim().toUpperCase())}`
    : '';

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

  const selectBank = (bankCode: string) => {
    const bank = vietnameseBanks.find((item) => item.code === bankCode);
    setPayout((current) => ({ ...current, bankCode, bankName: bank?.name ?? current.bankName }));
    setSavedMessage('');
  };

  const handleSave = async () => {
    if (!token) return;
    if (!payoutIsValid) {
      setSavedMessage('Vui lòng chọn ngân hàng, nhập đúng số tài khoản và tên chủ tài khoản.');
      return;
    }
    try {
      await saveOwnerBankAccount(token, {
        bankCode: payout.bankCode,
        bankName: payout.bankName,
        accountNumber: payout.accountNumber,
        accountHolderName: payout.accountHolder,
      });
      setSavedMessage('Đã lưu tài khoản nhận chuyển khoản.');
    } catch (requestError) {
      setSavedMessage(requestError instanceof ApiError ? requestError.message : 'Không thể lưu tài khoản ngân hàng.');
    }
  };

  return (
    <OwnerShell activeId="settings" innerClassName="max-w-[1320px]">
            <section className="owner-page-header">
              <div>
                <p className="owner-kicker">
                  <Settings className="h-4 w-4" />
                  Cấu hình vận hành chủ sân
                </p>
                <h1 className="mt-2">Cài đặt chủ sân</h1>
                <p className="mt-2">
                  Quản lý hồ sơ đơn vị vận hành, quy tắc đặt sân, nhận thông báo và thông tin đối soát doanh thu.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {savedMessage && (
                  <span className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#F6F8F3] px-4 py-3 text-[14px] font-bold text-primary">
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

            <section className="owner-stat-grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Hồ sơ vận hành', value: 'Đã xác minh', icon: ShieldCheck, helper: profile.businessName },
                { label: 'Giữ chỗ tạm', value: `${rules.holdMinutes} phút`, icon: Clock, helper: 'Trước khi giải phóng slot' },
                { label: 'Thông báo bật', value: `${enabledNotifications}/4`, icon: Bell, helper: 'Email và cảnh báo trong app' },
                { label: 'Đối soát', value: payoutCycleLabels[payout.payoutCycle], icon: Banknote, helper: payout.bankName },
              ].map((stat) => (
                <div className="owner-stat-card" key={stat.label}>
                  <stat.icon className="h-6 w-6 text-primary" />
                  <p className="mt-4 text-[12px] font-bold uppercase text-on-surface-variant">{stat.label}</p>
                  <p className="mt-1 font-mono text-[21px] font-extrabold leading-tight">{stat.value}</p>
                  <p className="mt-2 text-[13px] font-medium text-on-surface-variant">{stat.helper}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
              <div className="space-y-6">
                <section className="owner-panel p-4 sm:p-5">
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

                <section className="owner-panel p-4 sm:p-5">
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

                <section className="owner-panel p-4 sm:p-5">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <Banknote className="h-5 w-5 text-primary" />
                    Tài khoản đối soát
                  </h2>
                  <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
                    Chọn ngân hàng, sau đó chỉ cần nhập số tài khoản và tên chủ tài khoản. Picklink tự cấu hình mã VietQR.
                  </p>
                  <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <div className="grid content-start gap-4 sm:grid-cols-2">
                      <label className="block sm:col-span-2">
                        <span className="text-[13px] font-bold text-on-surface-variant">1. Chọn ngân hàng</span>
                        <select
                          className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          onChange={(event) => selectBank(event.target.value)}
                          value={payout.bankCode}
                        >
                          <option value="">-- Chọn ngân hàng nhận tiền --</option>
                          {!vietnameseBanks.some((bank) => bank.code === payout.bankCode) && payout.bankCode && (
                            <option value={payout.bankCode}>{payout.bankName || payout.bankCode}</option>
                          )}
                          {vietnameseBanks.map((bank) => (
                            <option key={bank.code} value={bank.code}>{bank.name} ({bank.code})</option>
                          ))}
                        </select>
                      </label>
                      <label className="block">
                        <span className="text-[13px] font-bold text-on-surface-variant">2. Số tài khoản</span>
                        <input
                          className="mt-2 h-12 w-full rounded-lg border border-outline-variant px-3 text-[16px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          inputMode="numeric"
                          maxLength={30}
                          onChange={(event) => updatePayout('accountNumber', event.target.value.replace(/\D/g, ''))}
                          placeholder="Nhập số tài khoản"
                          value={payout.accountNumber}
                        />
                        {payout.accountNumber && payout.accountNumber.length < 5 && <span className="mt-1 block text-[12px] text-red-600">Số tài khoản cần ít nhất 5 chữ số.</span>}
                      </label>
                      <label className="block">
                        <span className="text-[13px] font-bold text-on-surface-variant">3. Tên chủ tài khoản</span>
                        <input
                          className="mt-2 h-12 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                          maxLength={200}
                          onChange={(event) => updatePayout('accountHolder', event.target.value.toUpperCase())}
                          placeholder="NGUYEN VAN AN"
                          value={payout.accountHolder}
                        />
                      </label>
                      <div className="rounded-lg bg-primary/5 p-4 text-[13px] sm:col-span-2">
                        <p className="font-bold text-primary">Thông tin sẽ hiển thị cho người chuyển</p>
                        <p className="mt-1 text-on-surface-variant">
                          {payout.bankName || 'Chưa chọn ngân hàng'} · {payout.accountNumber || 'Chưa nhập số tài khoản'} · {payout.accountHolder || 'Chưa nhập chủ tài khoản'}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 text-center">
                      <p className="text-[12px] font-bold uppercase text-on-surface-variant">QR kiểm tra</p>
                      {qrPreviewUrl ? (
                        <>
                          <img alt="QR kiểm tra tài khoản nhận tiền" className="mx-auto mt-3 w-full max-w-[220px] rounded-lg bg-white" src={qrPreviewUrl} />
                          <p className="mt-2 text-[11px] leading-4 text-on-surface-variant">QR mẫu 10.000đ · PICKLINK TEST</p>
                        </>
                      ) : (
                        <div className="mt-3 flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-white px-5 text-[13px] text-on-surface-variant">
                          Điền đủ 3 bước để xem QR mẫu
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              </div>

              <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
                <section className="owner-panel p-4">
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

                <section className="owner-panel p-4">
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
