import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  CalendarDays, 
  Clock, 
  User, 
  ArrowRight,
  Headset
} from 'lucide-react';

export const CourtDetail = () => {
  const navigate = useNavigate();
  const [activeDate, setActiveDate] = useState('12');
  const [activeTime, setActiveTime] = useState('08:00 - 09:00');

  const dates = [
    { day: 'Thứ Hai', date: '12', month: 'Th08' },
    { day: 'Thứ Ba', date: '13', month: 'Th08' },
    { day: 'Thứ Tư', date: '14', month: 'Th08' },
    { day: 'Thứ Năm', date: '15', month: 'Th08' },
    { day: 'Thứ Sáu', date: '16', month: 'Th08' },
    { day: 'Thứ Bảy', date: '17', month: 'Th08' },
    { day: 'Chủ Nhật', date: '18', month: 'Th08' },
  ];

  const times = [
    { time: '06:00 - 07:00', status: 'available' },
    { time: '07:00 - 08:00', status: 'available' },
    { time: '08:00 - 09:00', status: 'available' },
    { time: '09:00 - 10:00', status: 'booked' },
    { time: '10:00 - 11:00', status: 'available' },
    { time: '11:00 - 12:00', status: 'available' },
    { time: '13:00 - 14:00', status: 'booked' },
    { time: '14:00 - 15:00', status: 'available' },
    { time: '15:00 - 16:00', status: 'available' },
    { time: '16:00 - 17:00', status: 'available' },
    { time: '17:00 - 18:00', status: 'available' },
    { time: '18:00 - 19:00', status: 'available' },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="sticky top-0 z-50 flex justify-between items-center w-full px-4 md:px-10 py-4 max-w-[1200px] mx-auto bg-primary shadow-md">
        <div className="flex items-center gap-2">
          <Link to="/" className="text-[24px] md:text-[32px] font-bold text-white tracking-tight">Picklink</Link>
        </div>
        <nav className="hidden md:flex items-center gap-6">
          <Link to="/book" className="text-white font-bold border-b-2 border-white pb-1 text-[14px]">Sân chơi</Link>
          <Link to="#" className="text-white/80 font-medium hover:text-white text-[14px]">Cộng đồng</Link>
          <Link to="/tournaments" className="text-white/80 font-medium hover:text-white text-[14px]">Giải đấu</Link>
          <Link to="#" className="text-white/80 font-medium hover:text-white text-[14px]">Về chúng tôi</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Link to="/login" className="hidden lg:flex items-center text-white hover:bg-white/10 px-4 py-2 rounded-lg transition-colors text-[14px] font-bold">
            Đăng nhập
          </Link>
          <Link to="/register" className="bg-[#84c33e] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#84c33e]/90 transition-all text-[14px] shadow-sm">
            Đăng ký
          </Link>
        </div>
      </header>

      <main className="max-w-[1200px] w-full mx-auto px-4 md:px-10 py-8">
        <h1 className="text-[32px] md:text-[40px] font-bold mb-8 text-[#3d6a00] tracking-tight">Đặt sân Pickleball</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN (65%) */}
          <div className="lg:col-span-8 space-y-8">
            {/* Stepper */}
            <div className="flex items-center justify-between px-4 py-6 bg-white rounded-xl shadow-sm border border-outline-variant/60">
              <div className="flex flex-col items-center flex-1">
                <div className="w-10 h-10 rounded-full bg-[#84c33e] text-white flex items-center justify-center font-bold mb-2">1</div>
                <span className="text-[14px] font-bold text-[#3d6a00]">Chọn ngày & giờ</span>
              </div>
              <div className="h-[2px] w-12 bg-outline-variant/60 flex-none mx-2 mb-8"></div>
              <div className="flex flex-col items-center flex-1 opacity-50">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold mb-2">2</div>
                <span className="text-[14px] font-bold text-on-surface-variant">Thông tin</span>
              </div>
              <div className="h-[2px] w-12 bg-outline-variant/60 flex-none mx-2 mb-8"></div>
              <div className="flex flex-col items-center flex-1 opacity-50">
                <div className="w-10 h-10 rounded-full bg-surface-container-highest text-on-surface flex items-center justify-center font-bold mb-2">3</div>
                <span className="text-[14px] font-bold text-on-surface-variant">Thanh toán</span>
              </div>
            </div>

            {/* Block 1: Chọn ngày */}
            <section className="bg-white p-6 rounded-xl border border-outline-variant/60 shadow-sm">
              <h2 className="text-[20px] font-bold mb-4 flex items-center gap-2 text-on-background">
                <CalendarDays className="text-[#3d6a00] w-6 h-6" />
                Bước 1: Chọn ngày
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {dates.map((item) => (
                  <button 
                    key={item.date}
                    onClick={() => setActiveDate(item.date)}
                    className={`flex-shrink-0 flex flex-col items-center justify-center w-24 h-28 border rounded-xl transition-all p-4 ${
                      activeDate === item.date 
                        ? 'border-[#3d6a00] bg-[#84c33e] text-white' 
                        : 'border-outline-variant/60 hover:border-[#3d6a00] bg-white text-on-background'
                    }`}
                  >
                    <span className={`text-[12px] font-medium uppercase ${activeDate === item.date ? 'opacity-90' : 'opacity-70'}`}>{item.day}</span>
                    <span className="text-[24px] font-bold mt-1">{item.date}</span>
                    <span className="text-[12px] font-medium mt-1">{item.month}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Block 2: Chọn khung giờ */}
            <section className="bg-white p-6 rounded-xl border border-outline-variant/60 shadow-sm">
              <h2 className="text-[20px] font-bold mb-4 flex items-center gap-2 text-on-background">
                <Clock className="text-[#3d6a00] w-6 h-6" />
                Bước 2: Chọn khung giờ
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {times.map((item) => (
                  <button 
                    key={item.time}
                    disabled={item.status === 'booked'}
                    onClick={() => item.status === 'available' && setActiveTime(item.time)}
                    className={`rounded-lg py-3 px-4 text-center text-[14px] font-bold transition-all border ${
                      item.status === 'booked' 
                        ? 'opacity-40 cursor-not-allowed bg-surface-container-highest border-outline-variant/40' 
                        : activeTime === item.time
                          ? 'bg-[#84c33e] text-white border-[#3d6a00]'
                          : 'border-outline-variant/50 hover:border-[#3d6a00] bg-white'
                    }`}
                  >
                    {item.time}
                  </button>
                ))}
              </div>
            </section>

            {/* Block 3: Thông tin người đặt */}
            <section className="bg-white p-6 rounded-xl border border-outline-variant/60 shadow-sm">
              <h2 className="text-[20px] font-bold mb-6 flex items-center gap-2 text-on-background">
                <User className="text-[#3d6a00] w-6 h-6" />
                Bước 3: Thông tin người đặt
              </h2>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[14px] font-bold text-on-surface-variant">Họ và tên</label>
                    <input 
                      type="text" 
                      placeholder="Nhập họ và tên" 
                      className="w-full bg-white border border-outline-variant/60 rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#84c33e] focus:border-[#84c33e] outline-none transition-all text-[14px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[14px] font-bold text-on-surface-variant">Số điện thoại</label>
                    <input 
                      type="tel" 
                      placeholder="Nhập số điện thoại" 
                      className="w-full bg-white border border-outline-variant/60 rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#84c33e] focus:border-[#84c33e] outline-none transition-all text-[14px]"
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[14px] font-bold text-on-surface-variant">Nhóm người chơi</label>
                  <select className="w-full bg-white border border-outline-variant/60 rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#84c33e] focus:border-[#84c33e] outline-none transition-all text-[14px]">
                    <option>Mới chơi (3.0 - 3.5)</option>
                    <option>Trung bình (3.5 - 4.5)</option>
                    <option>Nâng cao (4.5+)</option>
                    <option>Nhóm bạn bè / Gia đình</option>
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[14px] font-bold text-on-surface-variant">Ghi chú</label>
                  <textarea 
                    placeholder="Yêu cầu thêm về dụng cụ hoặc dịch vụ..." 
                    rows={3}
                    className="w-full bg-white border border-outline-variant/60 rounded-lg px-4 py-3 focus:ring-1 focus:ring-[#84c33e] focus:border-[#84c33e] outline-none transition-all text-[14px] resize-none"
                  ></textarea>
                </div>
              </form>
            </section>
          </div>

          {/* RIGHT SIDEBAR (35%) */}
          <aside className="lg:col-span-4 sticky top-24">
            <div className="bg-white p-6 rounded-xl border border-outline-variant/60 shadow-md space-y-6">
              <h3 className="text-[24px] font-bold border-b border-outline-variant/60 pb-4 text-on-background">Xác nhận đặt sân</h3>
              
              <div className="flex gap-4">
                <img 
                  alt="Sân Picklink Cầu Giấy" 
                  className="w-24 h-24 object-cover rounded-lg shadow-sm" 
                  src="https://lh3.googleusercontent.com/aida/AP1WRLvvQdGuxp_93C7nGLo2YBzPLjS4ECESxlpu01ddVvQEOH3MhLQEv6JXebYssu8Wxs5TdVc4vloNSB6tNLib5do5KVtUct6n2ZkAuj_H-xt_8ColnsEwHqkECdGcf92D5v6SQmi_2Np4QLAMDbX3l36McqFag5ubSehc5ABe1AxqQ73kd-VIvBiKNdKGbwyHjHQUXZmSr8mSjB8No9l0dzJwtd7GBVwLLhZ6OElKE34XqQqg23FMga5Pk7hJ" 
                />
                <div className="flex flex-col justify-center">
                  <span className="text-[#3d6a00] font-bold text-[14px] mb-1">Hệ thống sân</span>
                  <span className="text-[20px] font-bold text-on-background leading-tight">Picklink Cầu Giấy</span>
                </div>
              </div>
              
              <ul className="space-y-4 text-[14px]">
                <li className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-bold">Ngày chơi</span>
                  <span className="font-bold text-on-background">12/08/2024</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-bold">Thời gian</span>
                  <span className="font-bold text-on-background">{activeTime}</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-on-surface-variant font-bold">Số giờ</span>
                  <span className="font-bold text-on-background">1.0 giờ</span>
                </li>
              </ul>
              
              <hr className="border-outline-variant/60" />
              
              <div className="flex justify-between items-end">
                <span className="text-on-surface-variant font-bold text-[14px]">Tổng cộng</span>
                <span className="text-[32px] md:text-[40px] font-bold text-[#3d6a00] leading-none">200.000 VNĐ</span>
              </div>
              
              <div className="bg-[#f0f3ff] p-4 rounded-lg">
                <p className="text-[12px] font-medium text-on-surface-variant italic">
                  Bằng việc đặt sân, bạn đồng ý với chính sách hủy và thay đổi thời gian của Picklink.
                </p>
              </div>
              
              <button 
                onClick={() => navigate('/checkout')}
                className="w-full bg-[#84c33e] text-white py-4 rounded-xl font-bold text-[18px] shadow-sm hover:bg-[#84c33e]/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>Tiếp tục thanh toán</span>
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>

            {/* Assistance Card */}
            <div className="mt-4 p-4 bg-[#f2f9eb] rounded-xl border border-[#84c33e]/30 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[#84c33e]/20 flex items-center justify-center text-[#3d6a00] shrink-0">
                <Headset className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[14px] font-bold text-on-background">Cần hỗ trợ?</p>
                <p className="text-[12px] text-on-surface-variant font-medium mt-0.5">Hotline: 1900 6789</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full mt-auto py-8 px-4 md:px-10 max-w-[1200px] mx-auto flex flex-col md:flex-row justify-between bg-surface-container-highest border-t border-outline-variant/60">
        <div className="flex flex-col gap-2 max-w-md">
          <span className="text-[20px] font-bold text-[#3d6a00]">Picklink</span>
          <p className="text-[14px] font-medium text-[#151c27]">© 2024 Picklink. Nền tảng kết nối Pickleball hàng đầu Việt Nam.</p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-3 mt-6 md:mt-0">
          <Link to="#" className="text-[12px] font-bold text-on-surface-variant hover:text-[#3d6a00] hover:underline transition-all">Điều khoản sử dụng</Link>
          <Link to="#" className="text-[12px] font-bold text-on-surface-variant hover:text-[#3d6a00] hover:underline transition-all">Chính sách bảo mật</Link>
          <Link to="#" className="text-[12px] font-bold text-on-surface-variant hover:text-[#3d6a00] hover:underline transition-all">Liên hệ quảng cáo</Link>
          <Link to="#" className="text-[12px] font-bold text-on-surface-variant hover:text-[#3d6a00] hover:underline transition-all">Trung tâm hỗ trợ</Link>
        </div>
      </footer>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div>
  );
};
