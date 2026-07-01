import { type FormEvent, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Circle, Eye, EyeOff, Lock, Mail, RotateCcw, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { googleRegister, register } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận chưa khớp.');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await register({
        username,
        email,
        password,
        role: 'player',
        experience: 'Beginner',
      });
      navigate(getDefaultPathForRole(user.role), { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể đăng ký. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleRegister = async (idToken: string) => {
    setErrorMessage('');
    try {
      const user = await googleRegister(idToken);
      navigate(getDefaultPathForRole(user.role), { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể đăng ký bằng Google. Vui lòng thử lại.');
    }
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

          <div className="hidden items-center gap-4 md:flex">
            <span className="text-[14px] text-on-surface-variant">Đã có tài khoản?</span>
            <Link
              className="inline-flex min-h-11 items-center rounded-lg bg-primary-container px-4 py-2 text-[14px] font-semibold text-on-primary-container transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:bg-primary-fixed-dim focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
              to="/login"
            >
              Đăng nhập
            </Link>
          </div>
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
            <div className="absolute left-[61%] top-[42%] h-6 w-6 rounded-full bg-primary-fixed shadow-[0_0_18px_rgba(152,217,81,0.42)]" />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 w-full max-w-lg text-center lg:text-left">
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Tham gia{' '}
              <span className="inline-block text-[1.12em] text-primary-fixed [text-shadow:0_0_8px_rgba(152,217,81,0.55),0_0_18px_rgba(152,217,81,0.28)]">
                cộng đồng
              </span>{' '}
              Picklink
            </h1>
            <p className="mx-auto mt-5 max-w-[58ch] text-[15px] font-medium leading-7 text-on-primary/88 lg:mx-0 lg:text-[17px]">
              Kết nối với người chơi, tìm sân và nâng cao kỹ năng của bạn mỗi ngày.
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
                Tạo tài khoản mới
              </h2>
              <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">
                Điền thông tin bên dưới để bắt đầu.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={handleRegister}>
              {errorMessage && (
                <div
                  className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-[13px] font-semibold leading-5 text-error"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-on-surface" htmlFor="fullname">
                  Họ và tên
                </label>
                <Input
                  autoComplete="name"
                  icon={<User className="h-5 w-5" />}
                  id="fullname"
                  minLength={3}
                  onChange={(event) => setUsername(event.target.value)}
                  placeholder="Nhập họ và tên của bạn"
                  required
                  type="text"
                  value={username}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-on-surface" htmlFor="email">
                  Email
                </label>
                <Input
                  autoComplete="email"
                  icon={<Mail className="h-5 w-5" />}
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Nhập địa chỉ email"
                  required
                  type="email"
                  value={email}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-on-surface" htmlFor="password">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Input
                    autoComplete="new-password"
                    className="pr-12"
                    icon={<Lock className="h-5 w-5" />}
                    id="password"
                    minLength={8}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Tạo mật khẩu"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-outline transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-[calc(-50%+1px)] active:scale-[0.99]"
                    onClick={() => setShowPassword((isVisible) => !isVisible)}
                    type="button"
                  >
                    {showPassword ? (
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
                <label className="text-[14px] font-semibold text-on-surface" htmlFor="confirm_password">
                  Xác nhận mật khẩu
                </label>
                <Input
                  autoComplete="new-password"
                  icon={<RotateCcw className="h-5 w-5" />}
                  id="confirm_password"
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Nhập lại mật khẩu"
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                />
              </div>

              <label className="group flex min-h-11 cursor-pointer items-start gap-2 text-[12px] font-medium leading-5 text-on-surface-variant">
                <input
                  className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-outline-variant bg-surface text-primary-container outline-none transition-colors group-hover:border-primary-container focus:ring-primary-container/30"
                  required
                  type="checkbox"
                />
                <span>
                  Tôi đồng ý với{' '}
                  <Link
                    className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
                    to="#"
                  >
                    Điều khoản dịch vụ
                  </Link>{' '}
                  và{' '}
                  <Link
                    className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
                    to="#"
                  >
                    Chính sách bảo mật
                  </Link>{' '}
                  của Picklink.
                </span>
              </label>

              <Button aria-busy={isSubmitting} className="w-full" disabled={isSubmitting} type="submit">
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
                {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
              </Button>
            </form>

            <div className="relative my-6 flex items-center">
              <div className="h-px flex-1 bg-outline-variant" />
              <span className="mx-4 shrink-0 text-[13px] font-medium text-on-surface-variant">
                Hoặc đăng ký bằng
              </span>
              <div className="h-px flex-1 bg-outline-variant" />
            </div>

            <GoogleAuthButton
              mode="register"
              onCredential={handleGoogleRegister}
              onError={setErrorMessage}
            />

            <p className="mt-6 text-center text-[14px] font-medium text-on-surface-variant md:hidden">
              Đã có tài khoản?{' '}
              <Link
                className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
                to="/login"
              >
                Đăng nhập
              </Link>
            </p>
          </motion.div>
        </section>
      </main>
    </div>
  );
};
