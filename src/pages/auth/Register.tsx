import React, { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail, RotateCcw, User } from 'lucide-react';
import { ApiError } from '../../api/client';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';

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
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-surface font-body-md text-on-surface">
      <header className="sticky top-0 z-50 w-full bg-primary shadow-md">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4">
          <Link className="text-[24px] font-bold tracking-tight text-on-primary" to="/">Picklink</Link>
          <div className="hidden items-center gap-4 md:flex">
            <span className="text-[14px] font-medium text-on-primary/80">Đã có tài khoản?</span>
            <Link className="rounded-lg bg-on-primary px-4 py-2 text-[14px] font-bold text-primary shadow-sm hover:bg-surface-bright" to="/login">
              Đăng nhập
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center p-4 md:p-8">
        <div className="flex w-full max-w-4xl overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-lg">
          <section className="relative hidden min-h-[560px] w-1/2 overflow-hidden bg-surface-variant md:block">
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat"
              style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida/AP1WRLswP0GUxStp_f3QVH37j9ZLRomtkNyKyl0xB5H2m7FL1ZNKvGKto8zKVjQZSCq5EOdVtuIbToKXkeraYbMlTqPK7VKjwBv6H2K2A0Y13KyUe1XwhGokC6jI7NRgzsFundsOlb8DrT5VsmiB0YCp8w-j89zYBWQIAz1bsGpRs20ju69ATRqJ9cfCRBTg-4t5rqxRBpC_Blj26xoocpDDFwHN0076Qp8PacUVfJfPwmtcQ0Dv8Dmn9V-4Q_Ad')" }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <h2 className="text-[30px] font-bold leading-tight">Tham gia cộng đồng Picklink</h2>
              <p className="mt-3 text-[15px] font-medium leading-6 text-white/90">
                Kết nối với người chơi, tìm sân và nâng cao kỹ năng của bạn mỗi ngày.
              </p>
            </div>
          </section>

          <section className="flex w-full items-center bg-surface-bright p-6 md:w-1/2 md:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-sm">
              <div className="mb-5 text-center md:text-left">
                <h1 className="text-[28px] font-bold tracking-tight">Tạo tài khoản mới</h1>
                <p className="mt-1 text-[14px] font-medium text-secondary">Điền thông tin bên dưới để bắt đầu.</p>
              </div>

              <form className="space-y-3.5" onSubmit={handleRegister}>
                {errorMessage && (
                  <div className="rounded-lg border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-[13px] font-bold text-[#ba1a1a]">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-[13px] font-bold" htmlFor="fullname">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/60" />
                    <input className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-4 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary" id="fullname" minLength={3} onChange={(event) => setUsername(event.target.value)} placeholder="Nhập họ và tên của bạn" required type="text" value={username} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-bold" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/60" />
                    <input className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-4 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary" id="email" onChange={(event) => setEmail(event.target.value)} placeholder="Nhập địa chỉ email" required type="email" value={email} />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-bold" htmlFor="password">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/60" />
                    <input className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-10 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary" id="password" minLength={8} onChange={(event) => setPassword(event.target.value)} placeholder="Tạo mật khẩu" required type={showPassword ? 'text' : 'password'} value={password} />
                    <button aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60 hover:text-primary" onClick={() => setShowPassword((isVisible) => !isVisible)} type="button">
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] leading-4 text-on-surface-variant">Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-bold" htmlFor="confirm_password">Xác nhận mật khẩu</label>
                  <div className="relative">
                    <RotateCcw className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/60" />
                    <input className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-2.5 pl-10 pr-4 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary" id="confirm_password" onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Nhập lại mật khẩu" required type={showPassword ? 'text' : 'password'} value={confirmPassword} />
                  </div>
                </div>

                <label className="flex cursor-pointer items-start gap-2 text-[11px] font-medium leading-4 text-on-surface-variant">
                  <input className="mt-0.5 h-4 w-4 shrink-0 rounded border-outline-variant text-primary" required type="checkbox" />
                  <span>
                    Tôi đồng ý với <Link className="font-bold text-primary hover:underline" to="#">Điều khoản dịch vụ</Link>
                    {' '}và <Link className="font-bold text-primary hover:underline" to="#">Chính sách bảo mật</Link> của Picklink.
                  </span>
                </label>

                <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary-container px-4 py-3 text-[15px] font-bold text-on-primary shadow-sm hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60" disabled={isSubmitting} type="submit">
                  {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký ngay'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-variant" />
                </div>
                <div className="relative flex justify-center text-[11px] font-medium">
                  <span className="bg-surface-bright px-2 text-secondary">Hoặc đăng ký bằng</span>
                </div>
              </div>

              <GoogleAuthButton mode="register" onCredential={handleGoogleRegister} onError={setErrorMessage} />

              <p className="mt-4 text-center text-[14px] text-on-surface-variant md:hidden">
                Đã có tài khoản? <Link className="font-bold text-primary hover:underline" to="/login">Đăng nhập</Link>
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
