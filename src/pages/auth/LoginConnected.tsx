import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { ApiError } from '../../api/client';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import type { UserRole } from '../../types';

const canReturnToPath = (path: string, role: UserRole) => {
  if (path.startsWith('/admin')) {
    return role === 'admin';
  }

  if (path.startsWith('/owner')) {
    return role === 'owner';
  }

  return role === 'player';
};

export const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const authUser = await login({ email, password });

      if (!authUser) {
        setErrorMessage('Email hoặc mật khẩu không đúng.');
        return;
      }

      const defaultPath = getDefaultPathForRole(authUser.role);
      const nextPath = fromPath && canReturnToPath(fromPath, authUser.role) ? fromPath : defaultPath;
      navigate(nextPath, { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể kết nối backend. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <header className="w-full bg-primary shadow-md">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-6 py-4">
          <Link to="/" className="text-[24px] font-bold tracking-tight text-on-primary">
            Picklink
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-on-primary px-4 py-2 text-[14px] font-bold text-primary shadow-sm transition-colors hover:bg-surface-bright"
          >
            Đăng ký
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8 md:px-8">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-lg md:grid-cols-2">
          <div className="hidden min-h-[560px] bg-surface-variant md:block">
            <img
              alt="Sân pickleball"
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80"
            />
          </div>

          <div className="flex items-center bg-surface-bright p-8 md:p-12 lg:p-16">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <h1 className="mb-2 text-[32px] font-bold tracking-tight text-on-surface">Đăng nhập</h1>
                <p className="text-[14px] font-medium text-secondary">Sử dụng tài khoản Picklink của bạn.</p>
              </div>

              <form className="space-y-6" onSubmit={handleLogin}>
                {errorMessage && (
                  <div className="rounded-lg border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-[13px] font-bold text-[#ba1a1a]">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[14px] font-bold text-on-surface" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/60" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="email@example.com"
                      required
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-[14px] font-medium text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-bold text-on-surface" htmlFor="password">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-secondary/60" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Nhập mật khẩu"
                      required
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-10 text-[14px] font-medium text-on-surface outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60 transition-colors hover:text-primary"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-transparent bg-primary-container px-4 py-3.5 text-[16px] font-bold text-on-primary shadow-sm transition-colors hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>

              <p className="mt-8 text-center text-[14px] font-medium text-secondary">
                Chưa có tài khoản?{' '}
                <Link to="/register" className="font-bold text-primary hover:underline">
                  Đăng ký ngay
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
