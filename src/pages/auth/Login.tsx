import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
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
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    const authUser = login({ email, password });

    if (!authUser) {
      setErrorMessage('Email hoặc mật khẩu không đúng với tài khoản test.');
      return;
    }

    const defaultPath = getDefaultPathForRole(authUser.role);
    const nextPath = fromPath && canReturnToPath(fromPath, authUser.role) ? fromPath : defaultPath;

    navigate(nextPath, { replace: true });
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
                <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg text-[13px] text-primary">
                  <span className="font-bold">Tài khoản Admin Test:</span><br/>
                  Email: admin@picklink.vn<br/>
                  Mật khẩu: admin123<br/>
                  <div className="h-px bg-primary/20 my-2"></div>
                  <span className="font-bold">Tài khoản Chủ Sân Test:</span><br/>
                  Email: owner@picklink.vn<br/>
                  Mật khẩu: owner123<br/>
                  <div className="h-px bg-primary/20 my-2"></div>
                  <span className="font-bold">Tài khoản Người Chơi Test:</span><br/>
                  Email: player@picklink.vn<br/>
                  Mật khẩu: player123
                </div>
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
                  className="w-full bg-primary-container text-on-primary font-bold text-[16px] py-3.5 px-4 rounded-lg hover:bg-primary transition-colors duration-200 active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 border border-transparent"
                >
                  Đăng nhập
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

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button className="flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition-colors duration-200 text-[14px] font-bold text-on-surface outline-none">
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path><path d="M1 1h22v22H1z" fill="none"></path></svg>
                  Google
                </button>
                <button className="flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg border border-outline-variant bg-surface-container-lowest hover:bg-surface-container-low transition-colors duration-200 text-[14px] font-bold text-on-surface outline-none">
                  <svg className="w-5 h-5 shrink-0" fill="#1877F2" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"></path></svg>
                  Facebook
                </button>
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
