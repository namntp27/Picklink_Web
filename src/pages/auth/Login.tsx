import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { UserRole } from '../../types';
import {
  AuthCardHeader,
  AuthDivider,
  AuthMessage,
  AuthShell,
  AuthTopAction,
  authFieldClass,
  authInputClass,
  authLabelClass,
  authPasswordButtonClass,
  authPrimaryButtonClass,
  authSecondaryLinkClass,
} from './AuthShell';

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

  return (
    <AuthShell
      action={<AuthTopAction label="Đăng ký" to="/register" />}
      subtitle="Đặt sân, ghép hội và theo dõi giải đấu trong một tài khoản gọn gàng."
      title="Sẵn sàng ra sân."
    >
      <AuthCardHeader
        subtitle="Chào mừng bạn trở lại. Nhập thông tin để tiếp tục."
        title="Đăng nhập"
      />

      <form className="grid gap-3" onSubmit={handleLogin}>
        {errorMessage && <AuthMessage>{errorMessage}</AuthMessage>}

        <div className={authFieldClass}>
          <label className={authLabelClass} htmlFor="email">
            Email
          </label>
          <Input
            autoComplete="email"
            className={authInputClass}
            icon={<Mail className="h-5 w-5" />}
            id="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@example.com"
            required
            type="email"
            value={email}
          />
        </div>

        <div className={authFieldClass}>
          <label className={authLabelClass} htmlFor="password">
            Mật khẩu
          </label>
          <div className="relative">
            <Input
              autoComplete="current-password"
              className={`${authInputClass} pr-11`}
              icon={<Lock className="h-5 w-5" />}
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Nhập mật khẩu"
              required
              type={showPassword ? 'text' : 'password'}
              value={password}
            />
            <button
              aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              className={authPasswordButtonClass}
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

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
          <label className="group flex min-h-10 cursor-pointer items-center gap-2">
            <input
              className="h-4 w-4 cursor-pointer rounded border-[#dbe8d3] bg-white text-primary-container outline-none transition-colors group-hover:border-primary-container focus:ring-primary-container/30"
              type="checkbox"
            />
            <span className="text-[13px] font-semibold text-[#66766d] transition-colors group-hover:text-[#0b2228]">
              Ghi nhớ đăng nhập
            </span>
          </label>
          <Link className={authSecondaryLinkClass} to="/forgot-password">
            Quên mật khẩu?
          </Link>
        </div>

        <Button
          aria-busy={isSubmitting}
          className={authPrimaryButtonClass}
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
        </Button>
      </form>

      <AuthDivider>Hoặc đăng nhập bằng</AuthDivider>

      <GoogleAuthButton
        mode="login"
        onCredential={handleGoogleLogin}
        onError={setErrorMessage}
      />

      <p className="mt-4 text-center text-[13px] font-semibold text-[#66766d] md:hidden">
        Bạn chưa có tài khoản?{' '}
        <Link
          className="font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
          to="/register"
        >
          Đăng ký ngay
        </Link>
      </p>
    </AuthShell>
  );
};
