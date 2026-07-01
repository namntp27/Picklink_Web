import { type FormEvent, type KeyboardEvent, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RotateCcw,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { forgotPasswordRequest, resetPasswordRequest, verifyPasswordResetCodeRequest } from '../../api/auth';
import { ApiError } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

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
  const shouldReduceMotion = useReducedMotion();

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
      <div className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors ${
            isDone || isActive
              ? 'bg-primary-container text-on-primary'
              : 'bg-surface-container text-on-surface-variant'
          }`}
        >
          {isDone ? <CheckCircle2 aria-hidden="true" className="h-4 w-4" /> : order}
        </span>
        <span className={`truncate text-[13px] font-bold ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
          {label}
        </span>
      </div>
    );
  };

  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 12 };

  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip bg-background font-sans text-on-background">
      <header className="sticky top-0 z-30 border-b border-outline-variant/50 bg-surface-container-lowest">
        <div className="mx-auto flex min-h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            aria-label="Picklink - Trang chủ"
            className="group inline-flex min-h-11 items-center gap-2 rounded-md focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70"
            to="/"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded bg-primary-container">
              <Circle aria-hidden="true" className="h-4 w-4 fill-on-primary text-on-primary" />
            </span>
            <span className="text-[clamp(1.25rem,2vw,1.6rem)] font-extrabold tracking-[-0.035em] text-primary [text-shadow:0_0_10px_rgba(152,217,81,0.32)] transition-[text-shadow] duration-200 group-hover:[text-shadow:0_0_12px_rgba(152,217,81,0.42)]">
              Picklink
            </span>
          </Link>

          <Link
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-[14px] font-semibold text-on-surface transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-primary-container hover:bg-surface-container-low hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
            to="/login"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Đăng nhập
          </Link>
        </div>
      </header>

      <main className="grid min-w-0 flex-1 grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="hero-gradient relative flex min-h-[260px] min-w-0 items-center justify-center overflow-hidden px-4 py-10 text-on-primary sm:px-6 md:min-h-[360px] lg:min-h-[680px] lg:px-12 lg:py-16"
          initial={revealInitial}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-x-0 top-1/2 h-px bg-on-primary" />
              <div className="absolute inset-y-0 left-1/4 w-px bg-on-primary/65" />
              <div className="absolute inset-y-0 right-1/4 w-px bg-on-primary/65" />
              <div className="absolute left-[12%] right-[12%] top-[18%] h-px bg-on-primary/55" />
              <div className="absolute bottom-[18%] left-[12%] right-[12%] h-px bg-on-primary/55" />
            </div>
            <div className="absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 border-y border-on-primary/20 bg-on-primary/10 backdrop-blur-sm" />
            <div className="absolute left-[58%] top-[44%] h-6 w-6 rounded-full bg-primary-fixed shadow-[0_0_18px_rgba(152,217,81,0.42)]" />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 w-full max-w-lg text-center lg:text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-on-primary/20 bg-on-primary/12 px-4 py-2 text-[13px] font-bold text-on-primary">
              <ShieldCheck aria-hidden="true" className="h-4 w-4 text-primary-fixed" />
              Khôi phục tài khoản
            </span>
            <h1 className="mt-5 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Lấy lại{' '}
              <span className="inline-block text-[1.12em] text-primary-fixed [text-shadow:0_0_8px_rgba(152,217,81,0.55),0_0_18px_rgba(152,217,81,0.28)]">
                quyền truy cập
              </span>{' '}
              Picklink
            </h1>
            <p className="mx-auto mt-5 max-w-[58ch] text-[15px] font-medium leading-7 text-on-primary/88 lg:mx-0 lg:text-[17px]">
              Xác thực OTP giúp bảo vệ lịch đặt sân, trận đấu và thông tin thanh toán của bạn.
            </p>
          </div>
        </motion.section>

        <section className="flex min-w-0 items-center justify-center bg-surface-container-lowest px-4 py-10 sm:px-6 md:px-10 md:py-14 lg:px-16">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md"
            initial={revealInitial}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.06,
              duration: shouldReduceMotion ? 0.01 : 0.35,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            <div className="mb-7 text-center lg:text-left">
              <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.025em] text-form-heading [text-shadow:0_0_7px_rgba(152,217,81,0.32),0_0_16px_rgba(152,217,81,0.18)]">
                Quên mật khẩu
              </h2>
              <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">
                Nhập tài khoản, xác thực OTP và tạo mật khẩu mới.
              </p>
            </div>

            <div className="mb-7 grid grid-cols-1 gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-3 sm:grid-cols-3">
              {renderStepBadge('request', 'Tài khoản', 1)}
              {renderStepBadge('otp', 'OTP', 2)}
              {renderStepBadge('reset', 'Mật khẩu', 3)}
            </div>

            {message && (
              <div
                className="mb-5 rounded-lg border border-primary-container/35 bg-surface-container-low px-4 py-3 text-[13px] font-semibold leading-5 text-primary"
                role="status"
              >
                {message}
              </div>
            )}

            {step === 'request' && (
              <form className="flex flex-col gap-5" onSubmit={handleRequestOtp}>
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-on-surface" htmlFor="account">
                    Email đã đăng ký
                  </label>
                  <Input
                    autoComplete="email"
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

                <Button aria-busy={isSubmitting} className="w-full" disabled={isSubmitting} type="submit">
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                  {isSubmitting ? 'Đang gửi...' : 'Gửi mã xác thực'}
                </Button>
              </form>
            )}

            {step === 'otp' && (
              <form className="flex flex-col gap-5" onSubmit={handleVerifyOtp}>
                <div>
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-[14px] font-semibold text-on-surface">
                    <Smartphone aria-hidden="true" className="h-5 w-5 text-primary" />
                    <span className="min-w-0 break-words">Mã xác thực gửi tới {maskedAccount}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
                    {otp.map((value, index) => (
                      <input
                        aria-label={`OTP số ${index + 1}`}
                        className="h-12 min-w-0 rounded-lg border border-outline-variant bg-surface-container text-center text-[20px] font-bold text-on-surface outline-none transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:border-outline focus:border-primary-container focus:bg-surface-container focus:ring-1 focus:ring-primary-container/30"
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
                  <Button
                    aria-busy={isSubmitting}
                    className="flex-1"
                    disabled={isSubmitting}
                    onClick={handleResendOtp}
                    type="button"
                    variant="outline"
                  >
                    <RotateCcw aria-hidden="true" className="h-5 w-5" />
                    Gửi lại OTP
                  </Button>
                  <Button aria-busy={isSubmitting} className="flex-1" disabled={isSubmitting} type="submit">
                    <ArrowRight aria-hidden="true" className="h-5 w-5" />
                    {isSubmitting ? 'Đang xác thực...' : 'Xác thực'}
                  </Button>
                </div>
              </form>
            )}

            {step === 'reset' && (
              <form className="flex flex-col gap-5" onSubmit={handleResetPassword}>
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-on-surface" htmlFor="newPassword">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <Input
                      autoComplete="new-password"
                      className="pr-12"
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
                      className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-outline transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-[calc(-50%+1px)] active:scale-[0.99]"
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
                  <p className="text-[12px] leading-5 text-on-surface-variant">
                    Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[14px] font-semibold text-on-surface" htmlFor="confirmPassword">
                    Nhập lại mật khẩu
                  </label>
                  <div className="relative">
                    <Input
                      autoComplete="new-password"
                      className="pr-12"
                      icon={<KeyRound className="h-5 w-5" />}
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
                      aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-outline transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-[calc(-50%+1px)] active:scale-[0.99]"
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

                <Button aria-busy={isSubmitting} className="w-full" disabled={isSubmitting} type="submit">
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                  {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
                </Button>
              </form>
            )}

            {step === 'success' && (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-primary-container/35 bg-surface-container-low p-6 text-center"
                initial={revealInitial}
                transition={{ duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <CheckCircle2 className="mx-auto h-14 w-14 text-primary" />
                <h3 className="mt-4 text-[22px] font-extrabold leading-tight text-on-surface">
                  Mật khẩu đã được cập nhật
                </h3>
                <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">
                  Bạn có thể đăng nhập lại bằng mật khẩu mới.
                </p>
                <Button className="mt-5 w-full" onClick={() => navigate('/login')} type="button">
                  <ArrowRight aria-hidden="true" className="h-5 w-5" />
                  Về trang đăng nhập
                </Button>
              </motion.div>
            )}
          </motion.div>
        </section>
      </main>
    </div>
  );
};
