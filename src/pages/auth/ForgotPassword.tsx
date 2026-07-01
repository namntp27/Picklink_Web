import { type FormEvent, type KeyboardEvent, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  Smartphone,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { forgotPasswordRequest, resetPasswordRequest, verifyPasswordResetCodeRequest } from '../../api/auth';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  AuthCardHeader,
  AuthMessage,
  AuthShell,
  BackTopAction,
  authFieldClass,
  authHintClass,
  authInputClass,
  authLabelClass,
  authPasswordButtonClass,
  authPrimaryButtonClass,
} from './AuthShell';

type RecoveryStep = 'request' | 'otp' | 'reset' | 'success';

const otpLength = 8;
const strongPasswordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).+$/;

export const ForgotPassword = () => {
  const [step, setStep] = useState<RecoveryStep>('request');
  const [account, setAccount] = useState('');
  const [otp, setOtp] = useState(Array.from({ length: otpLength }, () => ''));
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const navigate = useNavigate();

  const completedOtp = useMemo(() => otp.join(''), [otp]);
  const maskedAccount = account;

  const handleRequestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordRequest(account.trim().toLowerCase());
      setMessage(result.message);
      setStep('otp');
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Không thể gửi mã. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    const nextValue = value.replace(/\D/g, '').slice(-1);

    setOtp((current) => {
      const nextOtp = [...current];
      nextOtp[index] = nextValue;
      return nextOtp;
    });

    if (nextValue && index < otpLength - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (completedOtp.length < otpLength) {
      setMessage(`Vui lòng nhập đủ ${otpLength} số trong mã.`);
      return;
    }

    setMessage('');
    setIsSubmitting(true);
    try {
      const result = await verifyPasswordResetCodeRequest(
        account.trim().toLowerCase(),
        completedOtp,
      );
      setMessage(result.message);
      setStep('reset');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Không thể xác thực mã. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setMessage('Mật khẩu mới cần tối thiểu 8 ký tự.');
      return;
    }

    if (!strongPasswordPattern.test(newPassword)) {
      setMessage('Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('Mật khẩu nhập lại chưa khớp.');
      return;
    }

    setMessage('');
    setIsSubmitting(true);
    try {
      await resetPasswordRequest(account.trim().toLowerCase(), completedOtp, newPassword);
      setStep('success');
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Không thể đổi mật khẩu. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setOtp(Array.from({ length: otpLength }, () => ''));
    setMessage('');
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordRequest(account.trim().toLowerCase());
      setMessage(result.message);
      window.setTimeout(() => otpRefs.current[0]?.focus(), 50);
    } catch (error) {
      setMessage(error instanceof ApiError ? error.message : 'Không thể gửi lại mã. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepBadge = (currentStep: RecoveryStep, label: string, order: number) => {
    const stepOrder: Record<RecoveryStep, number> = {
      request: 1,
      otp: 2,
      reset: 3,
      success: 4,
    };
    const isDone = stepOrder[step] > order;
    const isActive = step === currentStep;

    return (
      <div
        className={`flex min-w-0 items-center gap-2 rounded-xl px-2.5 py-2 transition-colors ${
          isDone || isActive ? 'bg-[#0b2228] text-white' : 'bg-white text-[#66766d]'
        }`}
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-black ${
            isDone || isActive ? 'bg-[#e2ff57] text-[#102414]' : 'bg-[#eef8e6] text-primary'
          }`}
        >
          {isDone ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : order}
        </span>
        <span className="truncate text-[12px] font-bold">{label}</span>
      </div>
    );
  };

  return (
    <AuthShell
      action={<BackTopAction label="Đăng nhập" to="/login" />}
      panelSize="lg"
      subtitle="Xác thực OTP để bảo vệ lịch đặt sân, trận đấu và thông tin tài khoản."
      title="Lấy lại quyền truy cập Picklink."
    >
      <AuthCardHeader
        subtitle="Nhập email, xác thực OTP và tạo mật khẩu mới."
        title="Quên mật khẩu"
      />

      <div className="mb-3 grid grid-cols-3 gap-1 rounded-2xl border border-[#dbe8d3] bg-[#f8fbf4] p-1">
        {renderStepBadge('request', 'Tài khoản', 1)}
        {renderStepBadge('otp', 'OTP', 2)}
        {renderStepBadge('reset', 'Mật khẩu', 3)}
      </div>

      <div className="grid gap-3">
        {message && <AuthMessage tone="info">{message}</AuthMessage>}

        {step === 'request' && (
          <form className="grid gap-3" onSubmit={handleRequestOtp}>
            <div className={authFieldClass}>
              <label className={authLabelClass} htmlFor="account">
                Email đã đăng ký
              </label>
              <Input
                autoComplete="email"
                className={authInputClass}
                icon={<Mail className="h-5 w-5" />}
                id="account"
                onChange={(event) => {
                  setAccount(event.target.value);
                  setMessage('');
                }}
                placeholder="email@example.com"
                required
                type="email"
                value={account}
              />
            </div>

            <Button aria-busy={isSubmitting} className={authPrimaryButtonClass} disabled={isSubmitting} type="submit">
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
              {isSubmitting ? 'Đang gửi...' : 'Gửi mã xác thực'}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form className="grid gap-3" onSubmit={handleVerifyOtp}>
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[13px] font-bold text-[#0b2228]">
                <Smartphone aria-hidden="true" className="h-5 w-5 text-primary" />
                <span className="min-w-0 break-words">Mã xác thực gửi tới {maskedAccount}</span>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                {otp.map((value, index) => (
                  <input
                    aria-label={`OTP số ${index + 1}`}
                    className="h-11 min-w-0 rounded-xl border border-[#dbe8d3] bg-white text-center text-[18px] font-black text-[#0b2228] outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:border-outline focus:border-primary-container focus:bg-white focus:ring-1 focus:ring-primary-container/30"
                    inputMode="numeric"
                    key={index}
                    maxLength={1}
                    onChange={(event) => handleOtpChange(index, event.target.value)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    ref={(element) => {
                      otpRefs.current[index] = element;
                    }}
                    value={value}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                aria-busy={isSubmitting}
                className="h-11 rounded-xl"
                disabled={isSubmitting}
                onClick={handleResendOtp}
                type="button"
                variant="outline"
              >
                <RotateCcw aria-hidden="true" className="h-5 w-5" />
                Gửi lại OTP
              </Button>
              <Button aria-busy={isSubmitting} className={authPrimaryButtonClass} disabled={isSubmitting} type="submit">
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
                {isSubmitting ? 'Đang xác thực...' : 'Xác thực'}
              </Button>
            </div>
          </form>
        )}

        {step === 'reset' && (
          <form className="grid gap-3" onSubmit={handleResetPassword}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className={authFieldClass}>
                <label className={authLabelClass} htmlFor="newPassword">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Input
                    autoComplete="new-password"
                    className={`${authInputClass} pr-11`}
                    icon={<Lock className="h-5 w-5" />}
                    id="newPassword"
                    minLength={8}
                    onChange={(event) => {
                      setNewPassword(event.target.value);
                      setMessage('');
                    }}
                    placeholder="Tạo mật khẩu mới"
                    required
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                  />
                  <button
                    aria-label={showNewPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className={authPasswordButtonClass}
                    onClick={() => setShowNewPassword((isVisible) => !isVisible)}
                    type="button"
                  >
                    {showNewPassword ? (
                      <EyeOff aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      <Eye aria-hidden="true" className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className={authFieldClass}>
                <label className={authLabelClass} htmlFor="confirmPassword">
                  Nhập lại mật khẩu
                </label>
                <div className="relative">
                  <Input
                    autoComplete="new-password"
                    className={`${authInputClass} pr-11`}
                    icon={<KeyRound className="h-5 w-5" />}
                    id="confirmPassword"
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      setMessage('');
                    }}
                    placeholder="Nhập lại mật khẩu"
                    required
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                  />
                  <button
                    aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className={authPasswordButtonClass}
                    onClick={() => setShowConfirmPassword((isVisible) => !isVisible)}
                    type="button"
                  >
                    {showConfirmPassword ? (
                      <EyeOff aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      <Eye aria-hidden="true" className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <p className={authHintClass}>
              Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
            </p>

            <Button aria-busy={isSubmitting} className={authPrimaryButtonClass} disabled={isSubmitting} type="submit">
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
            </Button>
          </form>
        )}

        {step === 'success' && (
          <div className="rounded-2xl border border-[#dbe8d3] bg-[#eef8e6] p-5 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
            <h3 className="mt-3 text-[22px] font-extrabold leading-tight text-[#0b2228]">
              Mật khẩu đã được cập nhật
            </h3>
            <p className="mt-2 text-[14px] leading-6 text-[#66766d]">
              Bạn có thể đăng nhập lại bằng mật khẩu mới.
            </p>
            <Button className={`${authPrimaryButtonClass} mt-4`} onClick={() => navigate('/login')} type="button">
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
              Về trang đăng nhập
            </Button>
          </div>
        )}
      </div>
    </AuthShell>
  );
};
