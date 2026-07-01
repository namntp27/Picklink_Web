import { useState, type FormEvent } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Circle, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types';

interface LoginProps {}

const canReturnToPath = (path: string, role: UserRole) => {
  if (path.startsWith('/admin')) {
    return role === 'admin';
  }

  if (path.startsWith('/owner')) {
    return role === 'owner';
  }

  return role === 'player';
};

export const Login = (_props: Readonly<LoginProps>) => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { googleLogin, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const navigateAfterLogin = (authUser: { role: UserRole }) => {
    const defaultPath = getDefaultPathForRole(authUser.role);
    const nextPath = fromPath && canReturnToPath(fromPath, authUser.role) ? fromPath : defaultPath;
    navigate(nextPath, { replace: true });
  };

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const authUser = await login({ email, password });
      navigateAfterLogin(authUser);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể đăng nhập. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async (idToken: string) => {
    setErrorMessage('');
    try {
      const authUser = await googleLogin(idToken);
      navigateAfterLogin(authUser);
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể đăng nhập bằng Google. Vui lòng thử lại.');
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
            <span className="text-[14px] text-on-surface-variant">Bạn chưa có tài khoản?</span>
            <Link
              className="inline-flex min-h-11 items-center rounded-lg bg-primary-container px-4 py-2 text-[14px] font-semibold text-on-primary-container transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:bg-primary-fixed-dim focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
              to="/register"
            >
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      <main className="grid min-w-0 flex-1 grid-cols-1 md:grid-cols-2">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="hero-gradient relative flex min-h-[280px] min-w-0 items-center justify-center overflow-hidden px-4 py-10 text-on-primary sm:px-6 md:min-h-[620px] md:px-12 md:py-16"
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
            <div className="absolute left-[60%] top-[43%] h-6 w-6 rounded-full bg-primary-fixed shadow-[0_0_18px_rgba(152,217,81,0.42)]" />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 w-full max-w-lg text-center md:text-left">
            <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Sẵn sàng{' '}
              <span className="inline-block text-[1.12em] text-primary-fixed [text-shadow:0_0_8px_rgba(152,217,81,0.55),0_0_18px_rgba(152,217,81,0.28)]">
                ra sân.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-[58ch] text-[15px] font-medium leading-7 text-on-primary/88 md:mx-0 md:text-[17px]">
              Tham gia cộng đồng Picklink để kết nối, đặt sân và thi đấu cùng những
              người đam mê.
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
            <div className="mb-8 text-center md:text-left">
              <h2 className="text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.025em] text-form-heading [text-shadow:0_0_7px_rgba(152,217,81,0.32),0_0_16px_rgba(152,217,81,0.18)]">
                Đăng nhập
              </h2>
              <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">
                Chào mừng bạn trở lại! Vui lòng nhập thông tin.
              </p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleLogin}>
              {errorMessage && (
                <div
                  className="rounded-lg border border-error/30 bg-error-container px-4 py-3 text-[13px] font-semibold leading-5 text-error"
                  role="alert"
                >
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[14px] font-semibold text-on-surface" htmlFor="email">
                  Email
                </label>
                <Input
                  autoComplete="email"
                  icon={<Mail className="h-5 w-5" />}
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="email@example.com"
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
                    autoComplete="current-password"
                    className="pr-12"
                    icon={<Lock className="h-5 w-5" />}
                    id="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                  />
                  <button
                    aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-outline transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-surface-container-low hover:text-on-surface focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-[calc(-50%+1px)] active:scale-[0.99]"
                    onClick={() => setShowPassword(!showPassword)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff aria-hidden="true" className="h-5 w-5" />
                    ) : (
                      <Eye aria-hidden="true" className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <label className="group flex min-h-11 cursor-pointer items-center gap-2">
                  <input
                    className="h-4 w-4 cursor-pointer rounded border-outline-variant bg-surface text-primary-container outline-none transition-colors group-hover:border-primary-container focus:ring-primary-container/30"
                    type="checkbox"
                  />
                  <span className="text-[14px] font-medium text-on-surface-variant transition-colors group-hover:text-on-surface">
                    Ghi nhớ đăng nhập
                  </span>
                </label>
                <Link
                  className="inline-flex min-h-11 items-center rounded-md text-[14px] font-semibold text-primary transition-[color,transform] duration-200 hover:-translate-y-px hover:text-primary-container focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px"
                  to="/forgot-password"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                aria-busy={isSubmitting}
                className="w-full"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </Button>
            </form>

            <div className="relative my-6 flex items-center">
              <div className="h-px flex-1 bg-outline-variant" />
              <span className="mx-4 shrink-0 text-[13px] font-medium text-on-surface-variant">
                Hoặc đăng nhập bằng
              </span>
              <div className="h-px flex-1 bg-outline-variant" />
            </div>

            <GoogleAuthButton
              mode="login"
              onCredential={handleGoogleLogin}
              onError={setErrorMessage}
            />

            <p className="mt-6 text-center text-[14px] font-medium text-on-surface-variant md:hidden">
              Bạn chưa có tài khoản?{' '}
              <Link
                className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
                to="/register"
              >
                Đăng ký ngay
              </Link>
            </p>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-outline-variant/50 bg-surface-container-lowest">
        <div className="mx-auto flex w-full max-w-[1280px] flex-col items-center justify-between gap-3 px-4 py-4 text-[12px] font-medium text-on-surface-variant sm:px-6 md:flex-row">
          <Link
            className="rounded-md font-bold text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
            to="/"
          >
            Picklink
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-x-5">
            {['Điều khoản', 'Bảo mật', 'Liên hệ', 'Hướng dẫn'].map((label) => (
              <Link
                className="inline-flex min-h-11 items-center rounded-md transition-colors hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
                key={label}
                to="#"
              >
                {label}
              </Link>
            ))}
          </div>
          <p className="text-center md:text-right">
            © 2024 Picklink Pickleball Community. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};
