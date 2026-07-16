import { useEffect, useState } from 'react';
import {
  Banknote,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Save,
  Settings,
} from 'lucide-react';
import { ApiError } from '../../api/client';
import { getOwnerBankAccount, saveOwnerBankAccount } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { OwnerShell } from './components/OwnerShell';

type PayoutSettings = {
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};

type Feedback = {
  message: string;
  tone: 'error' | 'success';
};

const initialPayout: PayoutSettings = {
  bankCode: '',
  bankName: '',
  accountNumber: '',
  accountHolder: '',
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

export const OwnerSettings = () => {
  const { token } = useAuth();
  const [payout, setPayout] = useState<PayoutSettings>(initialPayout);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(token));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let active = true;
    setIsLoading(true);
    setFeedback(null);

    getOwnerBankAccount(token)
      .then((account) => {
        if (!active) return;
        setPayout({
          bankCode: account.bankCode,
          bankName: account.bankName,
          accountNumber: account.accountNumber,
          accountHolder: account.accountHolderName,
        });
      })
      .catch((requestError) => {
        if (!active || (requestError instanceof ApiError && requestError.status === 404)) return;
        setFeedback({
          message: requestError instanceof ApiError
            ? requestError.message
            : 'Không thể tải tài khoản nhận tiền.',
          tone: 'error',
        });
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const payoutIsValid = Boolean(
    payout.bankCode
      && /^d{5,30}$/.test(payout.accountNumber)
      && payout.accountHolder.trim().length >= 2,
  );

  const qrPreviewUrl = payoutIsValid
    ? 'https://img.vietqr.io/image/'
      + encodeURIComponent(payout.bankCode)
      + '-'
      + encodeURIComponent(payout.accountNumber)
      + '-compact2.png?amount=10000&addInfo='
      + encodeURIComponent('PICKLINK TEST')
      + '&accountName='
      + encodeURIComponent(payout.accountHolder.trim().toUpperCase())
    : '';

  const updatePayout = <Field extends keyof PayoutSettings>(
    field: Field,
    value: PayoutSettings[Field],
  ) => {
    setPayout((current) => ({ ...current, [field]: value }));
    setFeedback(null);
  };

  const selectBank = (bankCode: string) => {
    const bank = vietnameseBanks.find((item) => item.code === bankCode);
    setPayout((current) => ({
      ...current,
      bankCode,
      bankName: bank?.name ?? '',
    }));
    setFeedback(null);
  };

  const handleSave = async () => {
    if (!token || isSaving) return;
    if (!payoutIsValid) {
      setFeedback({
        message: 'Vui lòng chọn ngân hàng, nhập đúng số tài khoản và tên chủ tài khoản.',
        tone: 'error',
      });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      const account = await saveOwnerBankAccount(token, {
        bankCode: payout.bankCode,
        bankName: payout.bankName,
        accountNumber: payout.accountNumber,
        accountHolderName: payout.accountHolder.trim(),
      });
      setPayout({
        bankCode: account.bankCode,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        accountHolder: account.accountHolderName,
      });
      setFeedback({ message: 'Đã lưu tài khoản nhận chuyển khoản.', tone: 'success' });
    } catch (requestError) {
      setFeedback({
        message: requestError instanceof ApiError
          ? requestError.message
          : 'Không thể lưu tài khoản ngân hàng.',
        tone: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <OwnerShell activeId="settings" innerClassName="max-w-[1120px]">
      <section className="owner-page-header">
        <div>
          <p className="owner-kicker">
            <Settings className="h-4 w-4" />
            Cài đặt có dữ liệu đồng bộ
          </p>
          <h1 className="mt-2">Tài khoản nhận tiền</h1>
          <p className="mt-2">
            Thông tin dưới đây được đọc và lưu trực tiếp qua hệ thống thanh toán Picklink.
          </p>
        </div>
        <button
          aria-busy={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading || isSaving}
          onClick={() => void handleSave()}
          type="button"
        >
          {isSaving ? <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin" /> : <Save aria-hidden="true" className="h-5 w-5" />}
          {isSaving ? 'Đang lưu...' : 'Lưu tài khoản'}
        </button>
      </section>

      {feedback && (
        <div
          className={'flex items-start gap-3 rounded-xl border p-4 text-[13px] font-bold '
            + (feedback.tone === 'error'
              ? 'border-[#e7c8c4] bg-[#fff1ef] text-[#a33535]'
              : 'border-[#b9dca8] bg-[#edf5e9] text-primary')}
          role={feedback.tone === 'error' ? 'alert' : 'status'}
        >
          {feedback.tone === 'error'
            ? <CircleAlert aria-hidden="true" className="h-5 w-5 shrink-0" />
            : <CheckCircle2 aria-hidden="true" className="h-5 w-5 shrink-0" />}
          <span>{feedback.message}</span>
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="owner-panel p-4 sm:p-5">
          <h2 className="flex items-center gap-2 text-[20px] font-bold">
            <Banknote aria-hidden="true" className="h-5 w-5 text-primary" />
            Thông tin đối soát
          </h2>
          <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
            Chọn ngân hàng, nhập số tài khoản và tên chủ tài khoản. Picklink dùng dữ liệu này để tạo mã chuyển khoản.
          </p>

          {isLoading ? (
            <div className="mt-6 flex min-h-48 items-center justify-center" role="status">
              <Loader2 aria-hidden="true" className="h-7 w-7 animate-spin text-primary" />
              <span className="ml-3 text-[13px] font-bold text-on-surface-variant">Đang tải tài khoản...</span>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-[13px] font-bold text-on-surface-variant">Ngân hàng nhận tiền</span>
                <select
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  onChange={(event) => selectBank(event.target.value)}
                  value={payout.bankCode}
                >
                  <option value="">Chọn ngân hàng</option>
                  {!vietnameseBanks.some((bank) => bank.code === payout.bankCode) && payout.bankCode && (
                    <option value={payout.bankCode}>{payout.bankName || payout.bankCode}</option>
                  )}
                  {vietnameseBanks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name} ({bank.code})
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-[13px] font-bold text-on-surface-variant">Số tài khoản</span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant px-3 text-[16px] font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  inputMode="numeric"
                  maxLength={30}
                  onChange={(event) => updatePayout('accountNumber', event.target.value.replace(/D/g, ''))}
                  placeholder="Nhập số tài khoản"
                  value={payout.accountNumber}
                />
                {payout.accountNumber && payout.accountNumber.length < 5 && (
                  <span className="mt-1 block text-[12px] text-red-600">Số tài khoản cần ít nhất 5 chữ số.</span>
                )}
              </label>

              <label className="block">
                <span className="text-[13px] font-bold text-on-surface-variant">Tên chủ tài khoản</span>
                <input
                  className="mt-2 h-12 w-full rounded-lg border border-outline-variant px-3 text-[14px] font-bold uppercase outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  maxLength={200}
                  onChange={(event) => updatePayout('accountHolder', event.target.value.toUpperCase())}
                  placeholder="NGUYEN VAN AN"
                  value={payout.accountHolder}
                />
              </label>

              <div className="rounded-lg bg-primary/5 p-4 text-[13px] sm:col-span-2">
                <p className="font-bold text-primary">Thông tin người chuyển sẽ thấy</p>
                <p className="mt-1 break-words text-on-surface-variant">
                  {payout.bankName || 'Chưa chọn ngân hàng'} · {payout.accountNumber || 'Chưa nhập số tài khoản'} · {payout.accountHolder || 'Chưa nhập chủ tài khoản'}
                </p>
              </div>
            </div>
          )}
        </div>

        <aside className="owner-panel p-4 text-center xl:sticky xl:top-20 xl:self-start">
          <p className="text-[12px] font-bold uppercase text-on-surface-variant">QR kiểm tra</p>
          {qrPreviewUrl ? (
            <>
              <img
                alt="QR kiểm tra tài khoản nhận tiền"
                className="mx-auto mt-3 w-full max-w-[220px] rounded-lg bg-white"
                src={qrPreviewUrl}
              />
              <p className="mt-2 text-[11px] leading-4 text-on-surface-variant">
                QR mẫu 10.000đ · PICKLINK TEST
              </p>
            </>
          ) : (
            <div className="mt-3 flex aspect-square items-center justify-center rounded-lg border-2 border-dashed border-outline-variant bg-white px-5 text-[13px] text-on-surface-variant">
              Điền đủ thông tin để xem QR mẫu
            </div>
          )}
          <p className="mt-4 text-left text-[12px] leading-5 text-on-surface-variant">
            Hồ sơ doanh nghiệp, quy tắc đặt sân và tùy chọn thông báo chưa có API chỉnh sửa nên không được hiển thị như cấu hình có thể lưu.
          </p>
        </aside>
      </section>
    </OwnerShell>
  );
};