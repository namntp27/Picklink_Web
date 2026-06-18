import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ChevronRight, 
  UserCircle, 
  QrCode, 
  Banknote, 
  MapPin, 
  CalendarDays, 
  Clock, 
  ShieldCheck, 
  Lightbulb, 
  ArrowRight 
} from 'lucide-react';
import { formatBookingCurrency, formatBookingDate, sampleBooking } from '../../data/bookings';

export const Checkout = () => {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [agreed, setAgreed] = useState(false);
  const booking = sampleBooking;
  const courtAmount = booking.pricePerHour * booking.durationHours;

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col w-full overflow-x-hidden">
      {/* Top Header */}
      <header className="bg-primary-container shadow-md h-[72px] flex items-center w-full sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 w-full flex justify-between items-center">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-[24px] font-bold text-white tracking-tight flex items-center gap-2">
              <svg className="w-8 h-8 fill-current text-white" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v4.5l3.8 2.3-1 1.7-4.8-2.9V7z"/>
              </svg>
            </Link>
            <nav className="flex items-center gap-2 text-white font-label-md text-[16px]">
              <Link to="/book-court" className="hover:underline opacity-80 font-medium">Đặt sân</Link>
              <ChevronRight className="w-5 h-5 opacity-80" />
              <span className="font-bold">Thanh toán</span>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-white hover:bg-white/10 p-2 rounded-full transition-all active:scale-95 outline-none">
              <UserCircle className="w-7 h-7" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mt-8 md:mt-12 mb-16 flex-grow w-full">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
            
            {/* Left Column: Payment Methods */}
            <div className="lg:col-span-6 space-y-8">
              <section>
                <h1 className="text-[24px] md:text-[28px] font-bold mb-6 text-on-surface">Phương thức thanh toán</h1>
                
                <div className="space-y-4">
                  {/* Radio Card 1: Wallet */}
                  <label className="block cursor-pointer group transition-all">
                    <div className={`p-5 md:p-6 bg-surface border rounded-xl hover:shadow-sm flex items-center justify-between transition-colors ${
                      paymentMethod === 'wallet' 
                        ? 'border-[#84C33E] bg-[#f2f9eb]' 
                        : 'border-outline-variant/60'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-colors ${
                          paymentMethod === 'wallet' ? 'border-[#84C33E]' : 'border-outline-variant'
                        }`}>
                          <div className={`w-3 h-3 bg-[#84C33E] rounded-full transition-opacity ${paymentMethod === 'wallet' ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>
                        <div>
                          <span className="text-[16px] font-bold text-on-surface block mb-0.5">Ví điện tử</span>
                          <p className="text-[14px] text-secondary font-medium">Hỗ trợ MoMo, ZaloPay, VNPay</p>
                        </div>
                      </div>
                      <div className={`flex gap-2 transition-opacity ${paymentMethod === 'wallet' ? 'opacity-100' : 'opacity-40'}`}>
                        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-outline-variant/40 shadow-sm p-1">
                          <img 
                            alt="MoMo" 
                            className="w-full h-full object-contain rounded-md" 
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDAD2Q4ofpJhARE5AlNf4TvCZxbPKg7TxK4jeQ7BeniYwj_ZI6zLdsHu1ieMC0qgmGKd9M3lnzEoPFoMizFI0UZc6BDItSIabLgiWR1zOenEnObY4Xoue_azF0OLlrWtjczCVyfg4YYprpos5BAsFTfC_Y-mqRYKS-Ff2tHhw2ktTjUQWM-Hw_OUSap6XsAZJR4BeibXZYxBQVOdvNNuStNq2s9DHCAPBsrQNyi-iZ9gmahdP8dyVq00LzaOrR_k-7MpSyefPc4KT1D" 
                          />
                        </div>
                        <div className="w-9 h-9 rounded-lg bg-[#005BAA] flex items-center justify-center overflow-hidden border border-outline-variant/40 shadow-sm p-1.5">
                          <span className="text-white font-bold text-[10px] leading-tight text-center">Zalo<br/>Pay</span>
                        </div>
                      </div>
                    </div>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="wallet" 
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                      className="hidden" 
                    />
                  </label>

                  {/* Radio Card 2: QR Bank */}
                  <label className="block cursor-pointer group transition-all">
                    <div className={`p-5 md:p-6 bg-surface border rounded-xl hover:shadow-sm flex items-center justify-between transition-colors ${
                      paymentMethod === 'bank' 
                        ? 'border-[#84C33E] bg-[#f2f9eb]' 
                        : 'border-outline-variant/60'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-colors ${
                          paymentMethod === 'bank' ? 'border-[#84C33E]' : 'border-outline-variant'
                        }`}>
                          <div className={`w-3 h-3 bg-[#84C33E] rounded-full transition-opacity ${paymentMethod === 'bank' ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>
                        <div>
                          <span className="text-[16px] font-bold text-on-surface block mb-0.5">Chuyển khoản ngân hàng (QR)</span>
                          <p className="text-[14px] text-secondary font-medium">Tạo mã QR VietQR thanh toán nhanh</p>
                        </div>
                      </div>
                      <QrCode className="w-7 h-7 text-secondary" />
                    </div>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="bank" 
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="hidden" 
                    />
                  </label>

                  {/* Radio Card 3: At Court */}
                  <label className="block cursor-pointer group transition-all">
                    <div className={`p-5 md:p-6 bg-surface border rounded-xl hover:shadow-sm flex items-center justify-between transition-colors ${
                      paymentMethod === 'at_court' 
                        ? 'border-[#84C33E] bg-[#f2f9eb]' 
                        : 'border-outline-variant/60'
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-6 h-6 border-2 rounded-full flex items-center justify-center transition-colors ${
                          paymentMethod === 'at_court' ? 'border-[#84C33E]' : 'border-outline-variant'
                        }`}>
                          <div className={`w-3 h-3 bg-[#84C33E] rounded-full transition-opacity ${paymentMethod === 'at_court' ? 'opacity-100' : 'opacity-0'}`}></div>
                        </div>
                        <div>
                          <span className="text-[16px] font-bold text-on-surface block mb-0.5">Thanh toán tại sân</span>
                          <p className="text-[14px] text-secondary font-medium">Thanh toán trực tiếp khi đến sân</p>
                        </div>
                      </div>
                      <Banknote className="w-7 h-7 text-secondary" />
                    </div>
                    <input 
                      type="radio" 
                      name="payment" 
                      value="at_court" 
                      checked={paymentMethod === 'at_court'}
                      onChange={() => setPaymentMethod('at_court')}
                      className="hidden" 
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 rounded w-5 h-5 text-[#84C33E] border-outline-variant focus:ring-[#84C33E] outline-none cursor-pointer" 
                  />
                  <span className="text-[15px] font-medium text-secondary leading-relaxed">
                    Tôi đã đọc và đồng ý với các <Link to="#" className="text-[#84C33E] font-bold hover:underline">Điều khoản sử dụng</Link> và <Link to="#" className="text-[#84C33E] font-bold hover:underline">Chính sách bảo mật</Link> của Picklink.
                  </span>
                </label>
                
                <button 
                  disabled={!agreed}
                  onClick={() => navigate('/checkout/success')}
                  type="button"
                  className="w-full py-4 bg-[#84C33E] text-white font-bold text-[18px] rounded-xl shadow-md hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                  <span>Xác nhận thanh toán</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </section>
            </div>

            {/* Right Column: Booking Info (Sticky) */}
            <aside className="lg:col-span-4 lg:sticky lg:top-24 mt-8 lg:mt-0">
              <div className="bg-white border border-outline-variant/60 rounded-xl p-6 shadow-sm">
                <div className="flex flex-wrap justify-between items-center mb-8 gap-4">
                  <h2 className="text-[24px] font-bold text-[#3d6a00]">Thông tin đặt sân</h2>
                  <span className="bg-surface-container-high text-on-surface-variant text-[12px] px-3 py-1.5 rounded-md font-bold">{booking.code}</span>
                </div>
                
                <div className="space-y-5 mb-8">
                  <div className="flex items-start gap-4">
                    <MapPin className="w-6 h-6 text-[#84C33E] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[16px] font-bold text-on-surface mb-1">{booking.courtName}</p>
                      <p className="text-[14px] font-medium text-secondary">{booking.address}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <CalendarDays className="w-6 h-6 text-[#84C33E] shrink-0" />
                    <p className="text-[15px] font-semibold text-on-surface">{formatBookingDate(booking.date)}</p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Clock className="w-6 h-6 text-[#84C33E] shrink-0" />
                    <p className="text-[15px] font-semibold text-on-surface">{booking.startTime} - {booking.endTime} ({booking.durationHours} giờ)</p>
                  </div>
                </div>
                
                <div className="border-t border-dashed border-outline-variant/60 my-6"></div>
                
                <div className="space-y-4 mb-6 text-[15px]">
                  <div className="flex justify-between">
                    <span className="font-medium text-secondary">Giá thuê sân ({formatBookingCurrency(booking.pricePerHour)}/h x {booking.durationHours})</span>
                    <span className="font-bold text-on-surface">{formatBookingCurrency(courtAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium text-secondary">Phí dịch vụ hệ thống</span>
                    <span className="font-bold text-on-surface">{formatBookingCurrency(booking.serviceFee)}</span>
                  </div>
                </div>
                
                <div className="bg-[#f4faef] p-5 rounded-xl flex justify-between items-center mb-6">
                  <span className="text-[18px] font-bold text-on-background">Tổng cộng</span>
                  <span className="text-[28px] font-bold text-[#3d6a00]">{formatBookingCurrency(booking.totalAmount)}</span>
                </div>
                
                <div className="flex items-center gap-2 text-[13px] font-medium text-secondary italic">
                  <ShieldCheck className="w-5 h-5" />
                  Giao dịch được bảo mật bởi cổng thanh toán liên kết.
                </div>
              </div>

              {/* Atmospheric Visual Tip */}
              <div className="mt-6 p-5 bg-surface-variant/30 rounded-xl border border-outline-variant/60 flex items-center xl:items-start gap-4">
                <div className="w-10 h-10 shrink-0 rounded-full bg-white flex items-center justify-center text-[#84C33E] shadow-sm border border-outline-variant/30">
                  <Lightbulb className="w-5 h-5 fill-current" />
                </div>
                <p className="text-[14px] font-medium text-on-surface-variant leading-relaxed">
                  <strong className="text-on-surface">Mẹo:</strong> Hoàn tất thanh toán trong vòng 10 phút để giữ chỗ của bạn!
                </p>
              </div>
            </aside>
            
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-highest border-t border-outline-variant/50 mt-auto">
        <div className="max-w-[1200px] mx-auto px-4 md:px-10 py-8 md:py-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-[20px] font-bold text-[#84C33E]">Picklink</span>
            <p className="text-[14px] font-medium text-secondary">© 2024 Picklink. All rights reserved.</p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6 text-[14px] font-bold">
            <Link to="#" className="text-secondary hover:text-primary transition-colors duration-200">Điều khoản sử dụng</Link>
            <Link to="#" className="text-secondary hover:text-primary transition-colors duration-200">Chính sách bảo mật</Link>
            <Link to="#" className="text-secondary hover:text-primary transition-colors duration-200">Liên hệ</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};
