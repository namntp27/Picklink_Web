import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Phone, User } from 'lucide-react';
import { ApiError } from '../../api/client';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import type { UserRole } from '../../types';

type RegisterRole = Extract<UserRole, 'player' | 'owner'>;

const getPasswordValidationMessage = (value: string) => {
  if (value.length < 8) {
    return 'Mật khẩu phải có ít nhất 8 ký tự.';
  }

  if (!/[a-z]/.test(value)) {
    return 'Mật khẩu phải có ít nhất một chữ thường.';
  }

  if (!/[A-Z]/.test(value)) {
    return 'Mật khẩu phải có ít nhất một chữ hoa.';
  }

  if (!/\d/.test(value)) {
    return 'Mật khẩu phải có ít nhất một chữ số.';
  }

  return '';
};

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RegisterRole>('player');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMessage('');

    const passwordValidationMessage = getPasswordValidationMessage(password);
    if (passwordValidationMessage) {
      setErrorMessage(passwordValidationMessage);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    setIsSubmitting(true);

    try {
      const authUser = await register({
        fullName,
        email,
        phoneNumber,
        password,
        role,
      });

      navigate(getDefaultPathForRole(authUser.role), { replace: true });
    } catch (error) {
      setErrorMessage(error instanceof ApiError ? error.message : 'Không thể kết nối backend. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-surface text-on-surface">
      <main className="flex flex-1 items-center justify-center px-4 py-8 md:px-8">
        <section className="grid w-full max-w-5xl overflow-hidden rounded-xl border border-surface-variant bg-surface-container-lowest shadow-lg lg:grid-cols-2">
          <div className="hidden min-h-[680px] bg-surface-variant lg:block">
            <img
              alt="Sân pickleball"
              className="h-full w-full object-cover"
              src="https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?auto=format&fit=crop&w=1200&q=80"
            />
          </div>

          <div className="flex items-center bg-surface-bright p-8 md:p-12 lg:p-16">
            <div className="mx-auto w-full max-w-md">
              <Link to="/" className="mb-6 inline-flex text-[24px] font-bold text-primary">
                Picklink
              </Link>
              <div className="mb-8">
                <h1 className="mb-2 text-[32px] font-bold tracking-tight text-on-surface">Tạo tài khoản</h1>
                <p className="text-[14px] font-medium text-secondary">Đăng ký bằng backend Picklink API.</p>
              </div>

              <form className="space-y-5" onSubmit={handleRegister}>
                {errorMessage && (
                  <div className="rounded-lg border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-[13px] font-bold text-[#ba1a1a]">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-[14px] font-bold" htmlFor="fullName">
                    Họ và tên
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
                    <input
                      id="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      required
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-bold" htmlFor="email">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-bold" htmlFor="phoneNumber">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
                    <input
                      id="phoneNumber"
                      value={phoneNumber}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-4 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-bold" htmlFor="role">
                    Vai trò
                  </label>
                  <select
                    id="role"
                    value={role}
                    onChange={(event) => setRole(event.target.value as RegisterRole)}
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  >
                    <option value="player">Người chơi</option>
                    <option value="owner">Chủ sân</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-bold" htmlFor="password">
                    Mật khẩu
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-outline" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={8}
                      placeholder="Ví dụ: Picklink123"
                      required
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest py-3 pl-10 pr-10 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[12px] font-medium text-secondary">
                    Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số.
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-[14px] font-bold" htmlFor="confirmPassword">
                    Xác nhận mật khẩu
                  </label>
                  <input
                    id="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    minLength={8}
                    required
                    className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-3 text-[14px] outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg border border-transparent bg-primary-container px-4 py-3.5 text-[14px] font-bold text-on-primary-container shadow-sm transition-colors hover:bg-primary hover:text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang tạo tài khoản...' : 'Đăng ký'}
                </button>
              </form>

              <p className="mt-8 text-center text-[14px] font-medium text-secondary">
                Đã có tài khoản?{' '}
                <Link to="/login" className="font-bold text-primary hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
