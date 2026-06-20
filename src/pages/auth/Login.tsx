import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { ApiError } from '../../api/client';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import { GoogleAuthButton } from '../../components/auth/GoogleAuthButton';
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
  const { googleLogin, login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const navigateAfterLogin = (authUser: { role: UserRole }) => {
    const defaultPath = getDefaultPathForRole(authUser.role);
    const nextPath = fromPath && canReturnToPath(fromPath, authUser.role) ? fromPath : defaultPath;
    navigate(nextPath, { replace: true });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md w-full overflow-x-hidden">
      {/* TopAppBar */}
      <header className="bg-primary shadow-md w-full sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-6 py-4 max-w-[1200px] mx-auto">
          <Link to="/" className="text-[24px] md:text-headline-md font-bold text-on-primary tracking-tight">Picklink</Link>
          <div className="hidden md:flex items-center gap-4">
            <span className="text-on-primary/80 font-body-md text-[14px] hover:text-on-primary cursor-pointer transition-all duration-200">
              Bạn chưa có tài khoản?
            </span>
            <Link to="/register" className="font-label-md text-[14px] bg-on-primary text-primary px-4 py-2 rounded-lg font-bold hover:bg-surface-bright transition-all duration-200 active:scale-95 shadow-sm">
              Đăng ký
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex items-center justify-center p-4 md:p-8 w-full bg-surface">
        <div className="bg-surface-container-lowest rounded-xl shadow-lg w-full max-w-5xl flex flex-col md:flex-row overflow-hidden border border-surface-variant">
          
          {/* Image Section */}
          <div className="hidden md:block md:w-1/2 relative bg-surface-variant">
            <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 to-transparent z-10 mix-blend-multiply"></div>
            <img 
              alt="Pickleball Court" 
              className="object-cover w-full h-full object-center relative z-0" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLuHojmGm53CGpc2o6-TfB0PIib9gqEC3SRPFHPbo_reytERm7_aIGtc5Dtnr45rRcraJ_k1gPRj1KXmXQsOR1aIB5rtu-VvS3hZPcVAS4Rh1Qvy7AG-Bb-X0sDYouMIybe8KZAVNFfZbweZrkrUuhzpq3Ocuj3EfnO1AIpJ6zKtSYl4WBca7y71iYvCj1eMFIZvz3C0eyG758ONjHtQCpkKgiRdN0EDn2kQSPUNaa7LkjFz-8VxqxwfegA" 
            />
            <div className="absolute bottom-8 left-8 right-8 z-20 text-on-primary">
              <h2 className="text-[32px] md:text-headline-lg font-bold mb-2">Sẵn sàng ra sân.</h2>
              <p className="text-[16px] opacity-90 leading-relaxed font-medium">Tham gia cộng đồng Picklink để kết nối, đặt sân và thi đấu cùng những người đam mê.</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-surface-bright">
            <div className="max-w-md w-full mx-auto">
              <div className="mb-8 text-center md:text-left">
                <h1 className="text-[28px] md:text-[32px] font-bold text-on-surface mb-2 tracking-tight">Đăng nhập</h1>
                <p className="text-[14px] font-medium text-secondary">Chào mừng bạn trở lại! Vui lòng nhập thông tin.</p>
              </div>

              <form className="space-y-6" onSubmit={handleLogin}>
                {errorMessage && (
                  <div className="rounded-lg border border-[#ba1a1a]/30 bg-[#ffdad6] px-4 py-3 text-[13px] font-bold text-[#ba1a1a]">
                    {errorMessage}
                  </div>
                )}

                <div>
                  <label className="block text-[14px] font-bold text-on-surface mb-1.5" htmlFor="email">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary/60 w-5 h-5" />
                    <input 
                      id="email" 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com" 
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-[14px] font-medium text-on-surface" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[14px] font-bold text-on-surface mb-1.5" htmlFor="password">Mật khẩu</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary/60 w-5 h-5" />
                    <input 
                      id="password" 
                      type={showPassword ? 'text' : 'password'} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••" 
                      required
                      className="w-full pl-10 pr-10 py-3 rounded-lg border border-outline-variant bg-surface-container-lowest focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-colors text-[14px] font-medium text-on-surface" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary/60 hover:text-primary transition-colors focus:outline-none"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center cursor-pointer group">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary/20 bg-surface transition-colors cursor-pointer group-hover:border-primary outline-none" 
                    />
                    <span className="ml-2 text-[14px] font-medium text-on-surface-variant group-hover:text-on-surface transition-colors">Ghi nhớ đăng nhập</span>
                  </label>
                  <Link to="/forgot-password" className="text-[14px] text-primary font-bold hover:text-on-primary-container transition-colors">
                    Quên mật khẩu?
                  </Link>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-primary-container text-on-primary font-bold text-[16px] py-3.5 px-4 rounded-lg hover:bg-primary transition-colors duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 border border-transparent disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>

              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-surface-variant"></div>
                </div>
                <div className="relative flex justify-center text-[12px] font-medium">
                  <span className="px-2 bg-surface-bright text-secondary">Hoặc đăng nhập bằng</span>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <GoogleAuthButton mode="login" onCredential={handleGoogleLogin} onError={setErrorMessage} />
              </div>

              <div className="mt-8 text-center md:hidden block">
                <p className="text-[14px] font-medium text-secondary">
                  Bạn chưa có tài khoản?{' '}
                  <Link to="/register" className="text-primary font-bold hover:underline">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-primary w-full mt-auto">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 py-12 gap-6 max-w-[1200px] mx-auto">
          <div className="text-[24px] font-bold text-on-primary">Picklink</div>
          <div className="flex flex-wrap justify-center gap-6">
            <a href="#" className="font-body-md text-[12px] font-medium text-on-primary/70 hover:text-on-primary transition-opacity">Điều khoản</a>
            <a href="#" className="font-body-md text-[12px] font-medium text-on-primary/70 hover:text-on-primary transition-opacity">Bảo mật</a>
            <a href="#" className="font-body-md text-[12px] font-medium text-on-primary/70 hover:text-on-primary transition-opacity">Liên hệ</a>
            <a href="#" className="font-body-md text-[12px] font-medium text-on-primary/70 hover:text-on-primary transition-opacity">Hướng dẫn</a>
          </div>
          <div className="font-body-md text-[12px] font-medium text-on-primary/70 text-center md:text-right">
            © 2024 Picklink Pickleball Community. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
