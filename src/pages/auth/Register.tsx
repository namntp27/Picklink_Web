import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Phone, Lock, Eye, EyeOff, RotateCcw } from 'lucide-react';

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col w-full overflow-x-hidden">
      {/* Main Content: Split Layout */}
      <main className="flex-grow flex w-full">
        {/* Left Side: Image (Hidden on mobile) */}
        <div className="hidden lg:block lg:w-1/2 relative bg-surface-variant overflow-hidden">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat" 
            style={{ backgroundImage: `url('https://lh3.googleusercontent.com/aida/AP1WRLswP0GUxStp_f3QVH37j9ZLRomtkNyKyl0xB5H2m7FL1ZNKvGKto8zKVjQZSCq5EOdVtuIbToKXkeraYbMlTqPK7VKjwBv6H2K2A0Y13KyUe1XwhGokC6jI7NRgzsFundsOlb8DrT5VsmiB0YCp8w-j89zYBWQIAz1bsGpRs20ju69ATRqJ9cfCRBTg-4t5rqxRBpC_Blj26xoocpDDFwHN0076Qp8PacUVfJfPwmtcQ0Dv8Dmn9V-4Q_Ad')` }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 text-white">
            <h2 className="font-headline-xl text-[40px] font-bold mb-4 text-white leading-tight">Tham gia cộng đồng Picklink</h2>
            <p className="font-body-lg text-[18px] text-white/90 leading-relaxed">
              Kết nối với hàng ngàn tay vợt, tìm kiếm sân chơi và nâng cao kỹ năng của bạn mỗi ngày.
            </p>
          </div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-16 bg-surface">
          <div className="w-full max-w-md">
            
            <div className="mb-8 text-center lg:text-left">
              <Link to="/" className="inline-flex items-center text-primary font-headline-md text-[24px] font-bold mb-6 gap-2">
                <svg className="w-6 h-6 fill-current text-primary" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4.5l3.8 2.3-1 1.7-4.8-2.9V7z"/>
                </svg>
                Picklink
              </Link>
              <h1 className="font-headline-lg text-[32px] font-bold text-on-surface mb-2">Tạo tài khoản mới</h1>
              <p className="text-on-surface-variant font-body-md text-[16px]">Điền thông tin bên dưới để bắt đầu.</p>
            </div>

            <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-1">
                <label className="block font-label-md text-[14px] font-bold text-on-surface" htmlFor="fullname">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    id="fullname" 
                    type="text" 
                    placeholder="Nhập họ và tên của bạn" 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-[14px] transition-all outline-none text-on-surface placeholder-secondary focus:outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-label-md text-[14px] font-bold text-on-surface" htmlFor="email">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    id="email" 
                    type="email" 
                    placeholder="Nhập địa chỉ email" 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-[14px] transition-all outline-none text-on-surface placeholder-secondary focus:outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-label-md text-[14px] font-bold text-on-surface" htmlFor="phone">Số điện thoại</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    id="phone" 
                    type="tel" 
                    placeholder="Nhập số điện thoại" 
                    required 
                    className="w-full pl-10 pr-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-[14px] transition-all outline-none text-on-surface placeholder-secondary focus:outline-none" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-label-md text-[14px] font-bold text-on-surface" htmlFor="password">Mật khẩu</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    id="password" 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Tạo mật khẩu" 
                    required 
                    className="w-full pl-10 pr-10 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-[14px] transition-all outline-none text-on-surface placeholder-secondary focus:outline-none" 
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block font-label-md text-[14px] font-bold text-on-surface" htmlFor="confirm_password">Xác nhận mật khẩu</label>
                <div className="relative">
                  <RotateCcw className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
                  <input 
                    id="confirm_password" 
                    type="password" 
                    placeholder="Nhập lại mật khẩu" 
                    required 
                    className="w-full pl-10 pr-10 py-3 bg-surface-container-lowest border border-outline-variant rounded-lg focus:ring-1 focus:ring-primary focus:border-primary text-[14px] transition-all outline-none text-on-surface placeholder-secondary focus:outline-none" 
                  />
                </div>
              </div>

              <div className="flex items-start gap-2 pt-2">
                <div className="flex items-center h-5">
                  <input 
                    id="terms" 
                    type="checkbox" 
                    required 
                    className="w-4 h-4 rounded border-outline-variant text-primary focus:ring-primary bg-surface-container-lowest cursor-pointer outline-none" 
                  />
                </div>
                <label htmlFor="terms" className="font-body-md text-[12px] font-medium text-on-surface-variant leading-tight">
                  Tôi đồng ý với <Link to="#" className="text-primary font-bold hover:underline">Điều khoản dịch vụ</Link> và <Link to="#" className="text-primary font-bold hover:underline">Chính sách bảo mật</Link> của Picklink.
                </label>
              </div>

              <button 
                type="submit" 
                className="w-full bg-primary-container text-on-primary-container text-[14px] py-3.5 px-4 rounded-lg font-bold hover:bg-primary hover:text-on-primary transition-colors duration-200 shadow-sm mt-4 border border-transparent"
              >
                Đăng ký ngay
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="font-body-md text-[16px] text-on-surface-variant">
                Đã có tài khoản?{' '}
                <Link to="/login" className="text-primary text-[14px] font-bold hover:underline">
                  Đăng nhập
                </Link>
              </p>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};
