import React, { FormEvent, KeyboardEvent, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { forgotPasswordRequest, resetPasswordRequest } from '../../api/auth';
import { ApiError } from '../../api/client';

type RecoveryStep = 'request' | 'otp' | 'reset' | 'success';

const otpLength = 8;

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

  const handleVerifyOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (completedOtp.length < otpLength) {
      setMessage(`Vui lòng nhập đủ ${otpLength} số trong mã.`);
      return;
    }

    setMessage('Hãy tạo mật khẩu mới để hoàn tất xác thực mã.');
    setStep('reset');
  };

  const handleResetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (newPassword.length < 8) {
      setMessage('Mật khẩu mới cần tối thiểu 8 ký tự.');
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
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
            isDone || isActive ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'
          }`}
        >
          {isDone ? <CheckCircle2 className="h-4 w-4" /> : order}
        </span>
        <span className={`truncate text-[13px] font-bold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-surface font-body-md text-on-surface">
      <header className="sticky top-0 z-50 w-full bg-primary shadow-md">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <Link className="text-[24px] font-bold tracking-tight text-on-primary md:text-headline-md" to="/">
            Picklink
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2 text-[14px] font-bold text-on-primary hover:bg-white/10"
            to="/login"
          >
            <ArrowLeft className="h-4 w-4" />
            Đăng nhập
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-lg md:grid-cols-[0.9fr_1.1fr]">
          <section className="hidden bg-primary text-white md:block">
            <div className="relative flex h-full min-h-[620px] flex-col justify-between overflow-hidden p-10">
              <img
                alt="Sân pickleball"
                className="absolute inset-0 h-full w-full object-cover opacity-35"
                src="https://lh3.googleusercontent.com/aida/AP1WRLuHojmGm53CGpc2o6-TfB0PIib9gqEC3SRPFHPbo_reytERm7_aIGtc5Dtnr45rRcraJ_k1gPRj1KXmXQsOR1aIB5rtu-VvS3hZPcVAS4Rh1Qvy7AG-Bb-X0sDYouMIybe8KZAVNFfZbweZrkrUuhzpq3Ocuj3EfnO1AIpJ6zKtSYl4WBca7y71iYvCj1eMFIZvz3C0eyG758ONjHtQCpkKgiRdN0EDn2kQSPUNaa7LkjFz-8VxqxwfegA"
              />
              <div className="absolute inset-0 bg-primary/70" />
              <div className="relative">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-[13px] font-bold">
                  <ShieldCheck className="h-4 w-4" />
                  Khôi phục tài khoản
                </span>
                <h1 className="mt-5 text-[36px] font-bold leading-tight">Lấy lại quyền truy cập Picklink</h1>
                <p className="mt-4 text-[16px] leading-7 text-white/86">
                  Xác thực OTP giúp bảo vệ lịch đặt sân, trận đấu và thông tin thanh toán của bạn.
                </p>
              </div>
              <div className="relative rounded-lg border border-white/20 bg-white/12 p-5">
                <p className="text-[14px] font-bold text-white/80">Bảo mật tài khoản</p>
                <p className="mt-2 text-[14px] leading-6">Mã đặt lại mật khẩu chỉ có hiệu lực trong 15 phút và được gửi tới email đã đăng ký.</p>
              </div>
            </div>
          </section>

          <section className="flex flex-col justify-center bg-surface-bright p-6 md:p-10 lg:p-14">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-7">
                <h2 className="text-[30px] font-bold tracking-tight text-on-surface">Quên mật khẩu</h2>
                <p className="mt-2 text-[14px] font-medium leading-6 text-on-surface-variant">
                  Nhập tài khoản, xác thực OTP và tạo mật khẩu mới.
                </p>
              </div>

              <div className="mb-7 grid grid-cols-3 gap-3">
                {renderStepBadge('request', 'Tài khoản', 1)}
                {renderStepBadge('otp', 'OTP', 2)}
                {renderStepBadge('reset', 'Mật khẩu', 3)}
              </div>

              {message && (
                <div className="mb-5 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-[13px] font-bold text-primary">
                  {message}
                </div>
              )}

              {step === 'request' && (
                <form className="space-y-5" onSubmit={handleRequestOtp}>
                  <div>
                    <label className="mb-1.5 block text-[14px] font-bold text-on-surface" htmlFor="account">
                      Email đã đăng ký
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/60" />
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-[14px] font-medium text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
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
                  </div>

                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary-container px-4 py-3.5 text-[16px] font-bold text-on-primary transition-colors hover:bg-primary"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Đang gửi...' : 'Gửi mã xác thực'}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>
              )}

              {step === 'otp' && (
                <form className="space-y-5" onSubmit={handleVerifyOtp}>
                  <div>
                    <div className="mb-3 flex items-center gap-2 text-[14px] font-bold text-on-surface">
                      <Smartphone className="h-5 w-5 text-primary" />
                      Mã xác thực gửi tới {maskedAccount}
                    </div>
                    <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                      {otp.map((value, index) => (
                        <input
                          aria-label={`OTP số ${index + 1}`}
                          className="h-12 rounded-lg border border-outline-variant bg-surface-container-lowest text-center text-[20px] font-bold text-on-surface outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
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

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold text-on-surface transition-colors hover:bg-surface-container-low"
                      disabled={isSubmitting}
                      onClick={handleResendOtp}
                      type="button"
                    >
                      <RotateCcw className="h-5 w-5" />
                      Gửi lại OTP
                    </button>
                    <button
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-primary/90"
                      type="submit"
                    >
                      Xác thực
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  </div>
                </form>
              )}

              {step === 'reset' && (
                <form className="space-y-5" onSubmit={handleResetPassword}>
                  <div>
                    <label className="mb-1.5 block text-[14px] font-bold text-on-surface" htmlFor="newPassword">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/60" />
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-10 text-[14px] font-medium text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                        id="newPassword"
                        onChange={(event) => {
                          setNewPassword(event.target.value);
                          setMessage('');
                        }}
                        placeholder="Tạo mật khẩu mới"
                        required
                        minLength={8}
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-primary"
                        onClick={() => setShowNewPassword((isVisible) => !isVisible)}
                        type="button"
                      >
                        {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[14px] font-bold text-on-surface" htmlFor="confirmPassword">
                      Nhập lại mật khẩu
                    </label>
                    <div className="relative">
                      <KeyRound className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/60" />
                      <input
                        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-10 text-[14px] font-medium text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                        id="confirmPassword"
                        onChange={(event) => {
                          setConfirmPassword(event.target.value);
                          setMessage('');
                        }}
                        placeholder="Nhập lại mật khẩu mới"
                        required
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                      />
                      <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-primary"
                        onClick={() => setShowConfirmPassword((isVisible) => !isVisible)}
                        type="button"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary-container px-4 py-3.5 text-[16px] font-bold text-on-primary transition-colors hover:bg-primary"
                    disabled={isSubmitting}
                    type="submit"
                  >
                    {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>
              )}

              {step === 'success' && (
                <div className="rounded-xl border border-primary/20 bg-primary/10 p-6 text-center">
                  <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
                  <h3 className="mt-4 text-[22px] font-bold text-on-surface">Mật khẩu đã được cập nhật</h3>
                  <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">
                    Bạn có thể đăng nhập lại bằng mật khẩu mới.
                  </p>
                  <button
                    className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-primary/90"
                    onClick={() => navigate('/login')}
                    type="button"
                  >
                    Về trang đăng nhập
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
