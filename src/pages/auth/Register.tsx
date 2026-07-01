import { type FormEvent, useState } from 'react';
import { ArrowRight, Eye, EyeOff, Lock, Mail, RotateCcw, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/client';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import {
  AuthCardHeader,
  AuthDivider,
  AuthMessage,
  AuthShell,
  AuthTopAction,
  authFieldClass,
  authHintClass,
  authInputClass,
  authLabelClass,
  authPasswordButtonClass,
  authPrimaryButtonClass,
} from './AuthShell';

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

  return (
    <AuthShell
      action={<AuthTopAction label="Đăng nhập" to="/login" />}
      panelSize="lg"
      subtitle="Tạo hồ sơ người chơi để đặt sân, tìm đối thủ và tham gia giải đấu."
      title="Tham gia cộng đồng Picklink."
    >
      <AuthCardHeader
        subtitle="Điền thông tin bên dưới để bắt đầu."
        title="Tạo tài khoản mới"
      />

      <form className="grid gap-3" onSubmit={handleRegister}>
        {errorMessage && <AuthMessage>{errorMessage}</AuthMessage>}

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={authFieldClass}>
            <label className={authLabelClass} htmlFor="fullname">
              Họ và tên
            </label>
            <Input
              autoComplete="name"
              className={authInputClass}
              icon={<User className="h-5 w-5" />}
              id="fullname"
              minLength={3}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Tên của bạn"
              required
              type="text"
              value={username}
            />
          </div>

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
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className={authFieldClass}>
            <label className={authLabelClass} htmlFor="password">
              Mật khẩu
            </label>
            <div className="relative">
              <Input
                autoComplete="new-password"
                className={`${authInputClass} pr-11`}
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
                className={authPasswordButtonClass}
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
          </div>

          <div className={authFieldClass}>
            <label className={authLabelClass} htmlFor="confirm_password">
              Xác nhận mật khẩu
            </label>
            <Input
              autoComplete="new-password"
              className={authInputClass}
              icon={<RotateCcw className="h-5 w-5" />}
              id="confirm_password"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Nhập lại mật khẩu"
              required
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
            />
          </div>
        </div>

        <p className={authHintClass}>
          Mật khẩu tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.
        </p>

        <label className="group flex min-h-10 cursor-pointer items-start gap-2 text-[12px] font-semibold leading-5 text-[#66766d]">
          <input
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-[#dbe8d3] bg-white text-primary-container outline-none transition-colors group-hover:border-primary-container focus:ring-primary-container/30"
            required
            type="checkbox"
          />
          <span>
            Tôi đồng ý với{' '}
            <Link
              className="font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
              to="#"
            >
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link
              className="font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
              to="#"
            >
              Chính sách bảo mật
            </Link>{' '}
            của Picklink.
          </span>
        </label>

        <Button aria-busy={isSubmitting} className={authPrimaryButtonClass} disabled={isSubmitting} type="submit">
          <ArrowRight aria-hidden="true" className="h-5 w-5" />
          {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
        </Button>
      </form>

      <AuthDivider>Hoặc đăng ký bằng</AuthDivider>

      <GoogleAuthButton
        mode="register"
        onCredential={handleGoogleRegister}
        onError={setErrorMessage}
      />

      <p className="mt-4 text-center text-[13px] font-semibold text-[#66766d] md:hidden">
        Đã có tài khoản?{' '}
        <Link
          className="font-bold text-primary underline-offset-4 hover:underline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70"
          to="/login"
        >
          Đăng nhập
        </Link>
      </p>
    </AuthShell>
  );
};
