import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  HelpCircle, 
  LogOut,
  Search,
  Bell,
  UserCircle,
  TrendingUp,
  UserPlus,
  CheckCircle2,
  XCircle,
  MoreVertical,
  PlusCircle,
  Megaphone,
  MapPin
} from 'lucide-react';

export const ClubDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex bg-[#f9f9ff] min-h-screen font-body-md text-[#151c27] w-full">
      {/* Sidebar */}
      <aside className="w-[280px] bg-white border-r border-[#c2c9b3]/60 flex flex-col hidden md:flex shrink-0 fixed h-screen z-20">
        <div className="p-6">
          <Link to="/" className="text-[24px] font-bold text-[#3d6a00] tracking-tight">Picklink</Link>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link to="#" className="flex items-center gap-3 px-4 py-3 bg-[#84c33e] text-white rounded-xl font-bold transition-all">
            <LayoutDashboard className="w-5 h-5" />
            Tổng quan
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-[#555f6f] hover:bg-[#f0f3ff] hover:text-[#3d6a00] rounded-xl font-medium transition-all">
            <Users className="w-5 h-5" />
            Thành viên
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-[#555f6f] hover:bg-[#f0f3ff] hover:text-[#3d6a00] rounded-xl font-medium transition-all">
            <Calendar className="w-5 h-5" />
            Sự kiện
          </Link>
          <Link to="#" className="flex items-center gap-3 px-4 py-3 text-[#555f6f] hover:bg-[#f0f3ff] hover:text-[#3d6a00] rounded-xl font-medium transition-all">
            <Settings className="w-5 h-5" />
            Cài đặt
          </Link>
        </nav>

        <div className="p-4 space-y-4">
          <button className="w-full bg-[#3d6a00] text-white font-bold py-3 px-4 rounded-xl hover:bg-[#2b4d00] transition-colors flex items-center justify-center gap-2">
            Sự kiện mới
          </button>
          
          <div className="pt-4 border-t border-[#c2c9b3]/40 space-y-2">
            <Link to="#" className="flex items-center gap-3 px-4 py-2 text-[#555f6f] hover:text-[#151c27] font-medium transition-all">
              <HelpCircle className="w-5 h-5" />
              Hỗ trợ
            </Link>
            <button onClick={() => navigate('/')} className="flex items-center gap-3 px-4 py-2 text-[#ba1a1a] hover:bg-[#ffdad6]/50 rounded-lg w-full font-bold transition-all">
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-[280px] w-full">
        {/* Top Header */}
        <header className="h-[72px] bg-white border-b border-[#c2c9b3]/60 px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="relative w-full max-w-[400px]">
            <Search className="w-5 h-5 text-[#555f6f] absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Tìm kiếm thành viên, sân tập..." 
              className="w-full bg-[#f0f3ff] border-none rounded-xl pl-10 pr-4 py-2.5 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#84c33e]/50"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-[#555f6f] hover:bg-[#f0f3ff] rounded-full transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white"></span>
            </button>
            <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#84c33e]/30">
              <img src="https://i.pravatar.cc/150?u=a042581f4e29026704d" alt="Profile" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>

        <div className="p-8 max-w-[1200px] mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-[#151c27] mb-2 tracking-tight">Tổng quan</h1>
            <p className="text-[16px] text-[#555f6f]">Chào mừng trở lại, đây là những gì đang diễn ra tại câu lạc bộ của bạn hôm nay.</p>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 border border-[#c2c9b3]/60 shadow-sm flex items-start justify-between">
              <div>
                <h3 className="text-[13px] font-bold text-[#555f6f] uppercase tracking-wider mb-2">Tổng thành viên</h3>
                <div className="flex items-end gap-3">
                  <span className="text-[32px] font-bold text-[#151c27] leading-none">245</span>
                  <span className="flex items-center text-[#3d6a00] text-[14px] font-bold pb-1 text-[#84c33e]">
                    <TrendingUp className="w-4 h-4 mr-1" />
                    12 tháng này
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#e7eefe] flex items-center justify-center text-[#3d6a00]">
                <Users className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#c2c9b3]/60 shadow-sm flex items-start justify-between">
              <div>
                <h3 className="text-[13px] font-bold text-[#555f6f] uppercase tracking-wider mb-2">Sự kiện sắp tới</h3>
                <div className="flex items-end gap-3">
                  <span className="text-[32px] font-bold text-[#151c27] leading-none">12</span>
                  <span className="text-[#555f6f] text-[14px] font-medium pb-1">Tuần này</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#ffdad6]/50 flex items-center justify-center text-[#ba1a1a]">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-[#c2c9b3]/60 shadow-sm flex items-start justify-between">
              <div>
                <h3 className="text-[13px] font-bold text-[#555f6f] uppercase tracking-wider mb-2">Yêu cầu tham gia mới</h3>
                <div className="flex items-end gap-3">
                  <span className="text-[32px] font-bold text-[#ba1a1a] leading-none">8</span>
                  <span className="text-[#ba1a1a] text-[14px] font-bold pb-1">Chưa xử lý</span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#e7eefe] flex items-center justify-center text-[#3d6a00]">
                <UserPlus className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column (Span 2) */}
            <div className="lg:col-span-2 space-y-8">
              {/* Join Requests */}
              <div className="bg-white rounded-2xl border border-[#c2c9b3]/60 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center px-6 py-5 border-b border-[#c2c9b3]/40">
                  <h2 className="text-[18px] font-bold text-[#151c27]">Yêu cầu tham gia</h2>
                  <Link to="#" className="text-[#3d6a00] text-[14px] font-bold hover:underline">Xem tất cả</Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-[#f9f9ff]">
                      <tr>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#555f6f] uppercase tracking-wider">Tên người chơi</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#555f6f] uppercase tracking-wider text-center">Trình độ</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#555f6f] uppercase tracking-wider">Ngày đăng ký</th>
                        <th className="px-6 py-4 text-[13px] font-bold text-[#555f6f] uppercase tracking-wider text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#c2c9b3]/40">
                      <tr className="hover:bg-[#f9f9ff] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#d6e0f3] flex items-center justify-center text-[#151c27] font-bold text-[12px]">NL</div>
                            <span className="font-bold text-[#151c27]">Nguyen Linh</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-[#f0f3ff] text-[#3d6a00] font-bold rounded-lg text-[13px]">3.5</span>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#555f6f] font-medium">24 Thg 10, 2023</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button className="text-[#84c33e] hover:text-[#3d6a00] hover:bg-[#e7eefe] p-1.5 rounded-full transition-colors"><CheckCircle2 className="w-5 h-5" /></button>
                            <button className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#f9f9ff] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#ffade0] flex items-center justify-center text-[#7b1963] font-bold text-[12px]">TA</div>
                            <span className="font-bold text-[#151c27]">Tran Anh</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-[#f0f3ff] text-[#3d6a00] font-bold rounded-lg text-[13px]">4.0</span>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#555f6f] font-medium">24 Thg 10, 2023</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button className="text-[#84c33e] hover:text-[#3d6a00] hover:bg-[#e7eefe] p-1.5 rounded-full transition-colors"><CheckCircle2 className="w-5 h-5" /></button>
                            <button className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                      <tr className="hover:bg-[#f9f9ff] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#b3f66a] flex items-center justify-center text-[#0f2000] font-bold text-[12px]">LM</div>
                            <span className="font-bold text-[#151c27]">Le Minh</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-block px-3 py-1 bg-[#f0f3ff] text-[#3d6a00] font-bold rounded-lg text-[13px]">2.5</span>
                        </td>
                        <td className="px-6 py-4 text-[14px] text-[#555f6f] font-medium">23 Thg 10, 2023</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-2">
                            <button className="text-[#84c33e] hover:text-[#3d6a00] hover:bg-[#e7eefe] p-1.5 rounded-full transition-colors"><CheckCircle2 className="w-5 h-5" /></button>
                            <button className="text-[#ba1a1a] hover:bg-[#ffdad6] p-1.5 rounded-full transition-colors"><XCircle className="w-5 h-5" /></button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Event Schedule */}
              <div className="bg-white rounded-2xl border border-[#c2c9b3]/60 shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-[18px] font-bold text-[#151c27]">Lịch trình sự kiện tuần này</h2>
                  <button className="text-[#555f6f] hover:bg-[#f0f3ff] p-2 rounded-full transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#c2c9b3]/60 shadow-sm bg-white hover:border-[#84c33e] transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#84c33e] text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-[12px] font-bold uppercase opacity-90">TH 4</span>
                        <span className="text-[20px] font-bold leading-tight">25</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-[#151c27] text-[16px] mb-1 group-hover:text-[#3d6a00] transition-colors">Giao lưu Pickleball Nam/Nữ</h4>
                        <div className="flex items-center text-[#555f6f] text-[13px] font-medium">
                          <span>18:00 - 20:00</span>
                          <span className="mx-2">•</span>
                          <span>24 người tham gia</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-4 py-1.5 bg-[#2b4d00] text-white font-bold rounded-full text-[13px]">
                      Đang mở
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl border border-[#c2c9b3]/60 shadow-sm bg-[#f9f9ff]">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-[#dce2f3] text-[#151c27] flex flex-col items-center justify-center shrink-0">
                        <span className="text-[12px] font-bold uppercase opacity-70">TH 6</span>
                        <span className="text-[20px] font-bold leading-tight">27</span>
                      </div>
                      <div>
                        <h4 className="font-bold text-[#151c27] text-[16px] mb-1">Giải đấu Nội bộ Tháng 10</h4>
                        <div className="flex items-center text-[#555f6f] text-[13px] font-medium">
                          <span>08:00 - 17:00</span>
                          <span className="mx-2">•</span>
                          <span>48 người tham gia</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-4 py-1.5 bg-[#e7eefe] text-[#3d6a00] font-bold rounded-full text-[13px]">
                      Sắp diễn ra
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column (Span 1) */}
            <div className="lg:col-span-1 space-y-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-2xl border border-[#c2c9b3]/60 shadow-sm p-6">
                <h2 className="text-[18px] font-bold text-[#151c27] mb-6">Thao tác nhanh</h2>
                <div className="grid grid-cols-3 gap-4">
                  <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-[#c2c9b3]/60 hover:bg-[#f0f3ff] hover:border-[#84c33e] transition-all group">
                    <div className="text-[#3d6a00] group-hover:scale-110 transition-transform"><PlusCircle className="w-6 h-6" /></div>
                    <span className="text-[13px] font-bold text-[#151c27] text-center">Tạo<br/>sự kiện</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-[#c2c9b3]/60 hover:bg-[#f0f3ff] hover:border-[#84c33e] transition-all group">
                    <div className="text-[#3d6a00] group-hover:scale-110 transition-transform"><Megaphone className="w-6 h-6" /></div>
                    <span className="text-[13px] font-bold text-[#151c27] text-center">Thông<br/>báo</span>
                  </button>
                  <button className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl border border-[#c2c9b3]/60 hover:bg-[#f0f3ff] hover:border-[#84c33e] transition-all group">
                    <div className="text-[#3d6a00] group-hover:scale-110 transition-transform"><UserPlus className="w-6 h-6" /></div>
                    <span className="text-[13px] font-bold text-[#151c27] text-center">Mời<br/>thành viên</span>
                  </button>
                </div>
              </div>

              {/* Upcoming Sessions */}
              <div className="bg-[#f0f3ff] rounded-2xl border border-[#c2c9b3]/40 shadow-sm p-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#84c33e] opacity-5 rounded-full -mr-16 -mt-16 pointer-events-none"></div>
                <h2 className="text-[18px] font-bold text-[#151c27] mb-6 relative z-10">Các phiên sắp tới</h2>
                <div className="relative border-l-2 border-[#dce2f3] ml-3 pl-5 space-y-6 z-10">
                  <div className="relative">
                    <div className="absolute w-3 h-3 bg-[#84c33e] rounded-full -left-[27px] top-1"></div>
                    <div className="bg-[#84c33e] text-white text-[12px] font-bold px-2 py-0.5 rounded-md inline-block mb-1">17:00</div>
                    <h4 className="font-bold text-[#151c27] text-[15px]">Đánh đôi Nâng cao</h4>
                    <p className="text-[13px] text-[#555f6f] font-medium flex items-center mt-1"><MapPin className="w-3.5 h-3.5 mr-1" /> Sân 1 & 2</p>
                  </div>
                  <div className="relative">
                    <div className="absolute w-3 h-3 bg-[#dce2f3] rounded-full -left-[27px] top-1"></div>
                    <div className="bg-[#dce2f3] text-[#151c27] text-[12px] font-bold px-2 py-0.5 rounded-md inline-block mb-1">19:00</div>
                    <h4 className="font-bold text-[#151c27] text-[15px]">Lớp học cho người mới</h4>
                    <p className="text-[13px] text-[#555f6f] font-medium flex items-center mt-1"><MapPin className="w-3.5 h-3.5 mr-1" /> Sân 3</p>
                  </div>
                </div>
                
                <button className="w-full mt-6 text-center text-[#3d6a00] font-bold text-[14px] hover:underline relative z-10">
                  Xem toàn bộ lịch trình
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
