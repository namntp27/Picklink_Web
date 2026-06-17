import React, { useState } from 'react';
import { 
  Bell, 
  LayoutDashboard, 
  Users, 
  LandPlot, 
  CalendarCheck, 
  UsersRound, 
  Trophy, 
  BarChart2, 
  Settings,
  User,
  Ticket,
  Medal,
  Search,
  Plus,
  Eye,
  Pencil,
  Lock,
  Unlock
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const AdminDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('overview');

  const menuItems = [
    { id: 'overview', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Tổng quan' },
    { id: 'users', icon: <Users className="w-5 h-5" />, label: 'Quản lý người dùng' },
    { id: 'courts', icon: <LandPlot className="w-5 h-5" />, label: 'Quản lý sân' },
    { id: 'bookings', icon: <CalendarCheck className="w-5 h-5" />, label: 'Quản lý đặt sân' },
    { id: 'clubs', icon: <UsersRound className="w-5 h-5" />, label: 'Quản lý câu lạc bộ' },
    { id: 'tournaments', icon: <Trophy className="w-5 h-5" />, label: 'Quản lý giải đấu' },
    { id: 'reports', icon: <BarChart2 className="w-5 h-5" />, label: 'Báo cáo thống kê' },
  ];

  return (
    <div className="bg-background text-on-background font-body-md min-h-screen">
      {/* TopNavBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-margin-desktop h-16 shadow-md" style={{ backgroundColor: '#84C33E' }}>
        <div className="flex items-center gap-stack-md">
          <Link to="/" className="text-[24px] font-bold text-white">Picklink</Link>
          <span className="px-3 py-1 rounded-full text-[12px] font-medium shadow-sm bg-surface-container-lowest text-primary">
            Quản trị viên
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="relative group">
            <button className="p-2 rounded-full hover:bg-black/10 transition-colors text-white relative">
              <Bell className="w-6 h-6" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-error rounded-full border-2 border-[#84C33E]"></span>
            </button>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-white/30">
            <div className="text-right hidden md:block text-white">
              <p className="text-[14px] font-bold">Admin Cao Cấp</p>
              <p className="text-[10px] leading-none opacity-80">admin@picklink.vn</p>
            </div>
            <img 
              alt="Avatar quản trị viên" 
              className="w-10 h-10 rounded-full object-cover border-2 border-white/50" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuC7AniXmQ4NnMvKDZXdHh6Y_QEdCvL8GJ_75dmPW2DJjI9WCA1KWLN1xC8qTAdiTZCpXO8MdYzVzQryGjwwhgDweEqxZCTqC6zXR41NrDYXUhojyHQ5yo4cj9lULmtVcmurDwngpt7fAwti0CsRjDIqgUq7YgPazZe-l7Hxf8oaNdMftuWtSOruuWt_oM_scZ-mei-UhZXPPkdmNgBO7JfALHRDQ1lRRI5nHJblInitW4SwmouwOxcfTMjfLeeXd5YkLdf6tqqWJjR0" 
            />
          </div>
        </div>
      </header>

      <div className="flex pt-16 min-h-screen">
        {/* SideNavBar */}
        <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface border-r border-outline-variant p-stack-md flex flex-col gap-base custom-scrollbar overflow-y-auto">
          <div className="mb-4 px-4 py-2">
            <h2 className="text-[18px] font-bold text-primary">Hệ thống Picklink</h2>
            <p className="text-[12px] text-secondary">Quản trị viên cao cấp</p>
          </div>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-bold transition-all ${
                  activeMenu === item.id 
                    ? 'bg-primary-container text-on-primary-container translate-x-1' 
                    : 'text-secondary hover:bg-secondary-container/30'
                }`}
              >
                {item.icon}
                <span className="text-[14px]">{item.label}</span>
              </button>
            ))}
            <div className="my-4 border-t border-outline-variant/50"></div>
            <button className="flex items-center gap-3 px-4 py-3 text-secondary hover:bg-secondary-container/30 rounded-lg transition-all font-bold">
              <Settings className="w-5 h-5" />
              <span className="text-[14px]">Cài đặt hệ thống</span>
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="ml-64 flex-1 p-margin-desktop bg-background w-full overflow-hidden">
          {/* Statistics Cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-gutter mb-stack-lg">
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-primary-container/20 text-primary rounded-lg">
                  <User className="w-5 h-5" />
                </span>
                <span className="text-primary font-bold text-[12px]">+12</span>
              </div>
              <p className="text-secondary text-[12px] font-medium">Tổng người dùng</p>
              <h3 className="text-[24px] font-bold text-on-background mt-1">1.240</h3>
            </div>
            
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-secondary-container text-secondary rounded-lg">
                  <LandPlot className="w-5 h-5" />
                </span>
              </div>
              <p className="text-secondary text-[12px] font-medium">Tổng sân</p>
              <h3 className="text-[24px] font-bold text-on-background mt-1">48</h3>
            </div>
            
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-tertiary-container/30 text-tertiary rounded-lg">
                  <Ticket className="w-5 h-5" />
                </span>
              </div>
              <p className="text-secondary text-[12px] font-medium">Tổng đặt sân</p>
              <h3 className="text-[24px] font-bold text-on-background mt-1">5.681</h3>
            </div>
            
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-primary-container/20 text-primary rounded-lg">
                  <Users className="w-5 h-5" />
                </span>
              </div>
              <p className="text-secondary text-[12px] font-medium">Tổng CLB</p>
              <h3 className="text-[24px] font-bold text-on-background mt-1">23</h3>
            </div>
            
            <div className="bg-surface-container-lowest p-stack-md rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 bg-error-container text-error rounded-lg">
                  <Medal className="w-5 h-5" />
                </span>
              </div>
              <p className="text-secondary text-[12px] font-medium">Tổng giải đấu</p>
              <h3 className="text-[24px] font-bold text-on-background mt-1">7</h3>
            </div>
          </section>

          {/* Chart Section */}
          <section className="mb-stack-lg bg-surface-container-lowest p-stack-lg rounded-xl border border-outline-variant shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-bold">Số lượt đặt sân theo tháng</h2>
              <select className="bg-surface border border-outline-variant rounded-lg text-[14px] font-medium px-4 py-2 outline-none focus:border-primary">
                <option>Năm 2024</option>
                <option>Năm 2023</option>
              </select>
            </div>
            <div className="h-64 w-full flex items-end justify-between gap-2 px-0 md:px-4">
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[40%]" title="Tháng 1"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[55%]" title="Tháng 2"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[45%]" title="Tháng 3"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[70%]" title="Tháng 4"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[85%]" title="Tháng 5"></div>
              <div className="flex-1 bg-primary-container rounded-t-lg h-[100%]" title="Tháng 6 (Hiện tại)"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[60%]" title="Tháng 7"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[50%]" title="Tháng 8"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[65%]" title="Tháng 9"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[75%]" title="Tháng 10"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[80%]" title="Tháng 11"></div>
              <div className="flex-1 bg-secondary-container/70 hover:bg-primary-container transition-colors rounded-t-lg h-[90%]" title="Tháng 12"></div>
            </div>
            <div className="flex justify-between mt-4 px-0 md:px-4 text-[12px] font-medium text-secondary">
              <span>Th.1</span><span>Th.2</span><span>Th.3</span><span>Th.4</span><span>Th.5</span><span>Th.6</span>
              <span>Th.7</span><span>Th.8</span><span>Th.9</span><span>Th.10</span><span>Th.11</span><span>Th.12</span>
            </div>
          </section>

          {/* User Management Table */}
          <section className="mb-stack-lg bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden">
            <div className="p-stack-md border-b border-outline-variant flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-[20px] font-bold">Quản lý Người dùng</h2>
              <div className="flex flex-wrap gap-stack-sm">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary w-5 h-5" />
                  <input 
                    type="text" 
                    placeholder="Tìm kiếm tên, email..." 
                    className="pl-10 pr-4 py-2 bg-surface border border-outline-variant rounded-lg text-[14px] w-full md:w-64 focus:ring-1 focus:ring-primary focus:border-primary outline-none" 
                  />
                </div>
                <select className="px-4 py-2 bg-surface border border-outline-variant rounded-lg text-[14px] font-medium outline-none focus:border-primary">
                  <option>Tất cả vai trò</option>
                  <option>Người chơi</option>
                  <option>Chủ sân</option>
                  <option>Admin</option>
                </select>
                <button className="bg-primary text-on-primary px-4 py-2 rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity">
                  <Plus className="w-5 h-5" />
                  Thêm người dùng
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-surface text-secondary text-[12px] uppercase tracking-wider border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-4 font-bold">#</th>
                    <th className="px-6 py-4 font-bold">Tên</th>
                    <th className="px-6 py-4 font-bold">Email</th>
                    <th className="px-6 py-4 font-bold">Số điện thoại</th>
                    <th className="px-6 py-4 font-bold">Vai trò</th>
                    <th className="px-6 py-4 font-bold">Trạng thái</th>
                    <th className="px-6 py-4 font-bold">Ngày tạo</th>
                    <th className="px-6 py-4 font-bold text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 text-[14px]">1</td>
                    <td className="px-6 py-4 text-[14px] font-bold">Nguyễn Văn An</td>
                    <td className="px-6 py-4 text-[14px] text-secondary">an.nguyen@gmail.com</td>
                    <td className="px-6 py-4 text-[14px]">0901234567</td>
                    <td className="px-6 py-4"><span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-[11px] font-bold uppercase">Người chơi</span></td>
                    <td className="px-6 py-4"><span className="bg-primary-container/40 text-primary px-2 py-1 rounded text-[11px] font-bold">Hoạt động</span></td>
                    <td className="px-6 py-4 text-[14px] text-secondary">12/05/2024</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Eye className="w-5 h-5" /></button>
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Pencil className="w-5 h-5" /></button>
                        <button className="p-1 text-secondary hover:text-error transition-colors"><Lock className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 text-[14px]">2</td>
                    <td className="px-6 py-4 text-[14px] font-bold">Trần Thị Bình</td>
                    <td className="px-6 py-4 text-[14px] text-secondary">binh.tran@yahoo.com</td>
                    <td className="px-6 py-4 text-[14px]">0912233445</td>
                    <td className="px-6 py-4"><span className="bg-tertiary-container/40 text-tertiary px-2 py-1 rounded text-[11px] font-bold uppercase">Chủ sân</span></td>
                    <td className="px-6 py-4"><span className="bg-primary-container/40 text-primary px-2 py-1 rounded text-[11px] font-bold">Hoạt động</span></td>
                    <td className="px-6 py-4 text-[14px] text-secondary">15/05/2024</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Eye className="w-5 h-5" /></button>
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Pencil className="w-5 h-5" /></button>
                        <button className="p-1 text-secondary hover:text-error transition-colors"><Lock className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 text-[14px]">3</td>
                    <td className="px-6 py-4 text-[14px] font-bold">Lê Hoàng Cường</td>
                    <td className="px-6 py-4 text-[14px] text-secondary">cuong.le@outlook.com</td>
                    <td className="px-6 py-4 text-[14px]">0988776655</td>
                    <td className="px-6 py-4"><span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-[11px] font-bold uppercase">Người chơi</span></td>
                    <td className="px-6 py-4"><span className="bg-error-container text-error px-2 py-1 rounded text-[11px] font-bold">Đã khóa</span></td>
                    <td className="px-6 py-4 text-[14px] text-secondary">20/05/2024</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Eye className="w-5 h-5" /></button>
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Pencil className="w-5 h-5" /></button>
                        <button className="p-1 text-primary hover:text-primary/80 transition-colors"><Unlock className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 text-[14px]">4</td>
                    <td className="px-6 py-4 text-[14px] font-bold">Phạm Minh Đức</td>
                    <td className="px-6 py-4 text-[14px] text-secondary">duc.pham@gmail.com</td>
                    <td className="px-6 py-4 text-[14px]">0933445566</td>
                    <td className="px-6 py-4"><span className="bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-[11px] font-bold uppercase">Người chơi</span></td>
                    <td className="px-6 py-4"><span className="bg-primary-container/40 text-primary px-2 py-1 rounded text-[11px] font-bold">Hoạt động</span></td>
                    <td className="px-6 py-4 text-[14px] text-secondary">22/05/2024</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Eye className="w-5 h-5" /></button>
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Pencil className="w-5 h-5" /></button>
                        <button className="p-1 text-secondary hover:text-error transition-colors"><Lock className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 text-[14px]">5</td>
                    <td className="px-6 py-4 text-[14px] font-bold">Hoàng Bảo Anh</td>
                    <td className="px-6 py-4 text-[14px] text-secondary">anh.hoang@picklink.vn</td>
                    <td className="px-6 py-4 text-[14px]">0944556677</td>
                    <td className="px-6 py-4"><span className="bg-primary text-on-primary px-2 py-1 rounded text-[11px] font-bold uppercase">Admin</span></td>
                    <td className="px-6 py-4"><span className="bg-primary-container/40 text-primary px-2 py-1 rounded text-[11px] font-bold">Hoạt động</span></td>
                    <td className="px-6 py-4 text-[14px] text-secondary">01/01/2024</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-2">
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Eye className="w-5 h-5" /></button>
                        <button className="p-1 text-secondary hover:text-primary transition-colors"><Pencil className="w-5 h-5" /></button>
                        <button className="p-1 text-secondary hover:text-error transition-colors"><Lock className="w-5 h-5" /></button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="p-4 border-t border-outline-variant flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface">
              <p className="text-[12px] font-medium text-secondary">Hiển thị 5 trên 1.240 người dùng</p>
              <div className="flex gap-2">
                <button className="px-3 py-1 border border-outline-variant rounded-md hover:bg-surface-container text-[12px] font-medium disabled:opacity-50" disabled>Trước</button>
                <button className="px-3 py-1 bg-primary text-on-primary rounded-md text-[12px] font-bold">1</button>
                <button className="px-3 py-1 border border-outline-variant rounded-md hover:bg-surface-container text-[12px] font-medium">2</button>
                <button className="px-3 py-1 border border-outline-variant rounded-md hover:bg-surface-container text-[12px] font-medium">3</button>
                <button className="px-3 py-1 border border-outline-variant rounded-md hover:bg-surface-container text-[12px] font-medium">Sau</button>
              </div>
            </div>
          </section>

          {/* Court Management Table */}
          <section className="bg-surface-container-lowest rounded-xl border border-outline-variant shadow-sm overflow-hidden mb-stack-lg">
            <div className="p-stack-md border-b border-outline-variant flex justify-between items-center">
              <h2 className="text-[20px] font-bold">Quản lý Sân</h2>
              <button className="text-primary text-[14px] font-bold hover:underline">Xem tất cả</button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead className="bg-surface text-secondary text-[12px] uppercase tracking-wider border-b border-outline-variant">
                  <tr>
                    <th className="px-6 py-4 font-bold">Tên Sân</th>
                    <th className="px-6 py-4 font-bold">Chủ sân</th>
                    <th className="px-6 py-4 font-bold">Khu vực</th>
                    <th className="px-6 py-4 font-bold">Số court</th>
                    <th className="px-6 py-4 font-bold">Trạng thái</th>
                    <th className="px-6 py-4 font-bold text-center">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-bold text-[14px]">Pickleball Diamond Q7</td>
                    <td className="px-6 py-4 text-[14px]">Nguyễn Hoàng Nam</td>
                    <td className="px-6 py-4 text-[14px] text-secondary">Quận 7, TP.HCM</td>
                    <td className="px-6 py-4 text-[14px] font-medium">8</td>
                    <td className="px-6 py-4"><span className="bg-primary-container/40 text-primary px-2 py-1 rounded text-[11px] font-bold">Hoạt động</span></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button className="text-[12px] font-bold text-primary hover:underline">Xem</button>
                        <button className="text-[12px] font-bold text-secondary hover:underline">Sửa</button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-bold text-[14px]">Sân Pickleball Thảo Điền</td>
                    <td className="px-6 py-4 text-[14px]">Trần Văn Tú</td>
                    <td className="px-6 py-4 text-[14px] text-secondary">TP. Thủ Đức, TP.HCM</td>
                    <td className="px-6 py-4 text-[14px] font-medium">4</td>
                    <td className="px-6 py-4"><span className="bg-secondary-container text-secondary px-2 py-1 rounded text-[11px] font-bold">Chờ duyệt</span></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button className="text-[12px] font-bold text-primary hover:underline">Duyệt</button>
                        <button className="text-[12px] font-bold text-error hover:underline">Từ chối</button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-bold text-[14px]">Hồ Tây Pickleball Club</td>
                    <td className="px-6 py-4 text-[14px]">Phạm Thanh Tùng</td>
                    <td className="px-6 py-4 text-[14px] text-secondary">Tây Hồ, Hà Nội</td>
                    <td className="px-6 py-4 text-[14px] font-medium">12</td>
                    <td className="px-6 py-4"><span className="bg-primary-container/40 text-primary px-2 py-1 rounded text-[11px] font-bold">Hoạt động</span></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button className="text-[12px] font-bold text-primary hover:underline">Xem</button>
                        <button className="text-[12px] font-bold text-secondary hover:underline">Sửa</button>
                      </div>
                    </td>
                  </tr>
                  <tr className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4 font-bold text-[14px]">Sân Cầu Giấy Gold</td>
                    <td className="px-6 py-4 text-[14px]">Lê Minh Quân</td>
                    <td className="px-6 py-4 text-[14px] text-secondary">Cầu Giấy, Hà Nội</td>
                    <td className="px-6 py-4 text-[14px] font-medium">6</td>
                    <td className="px-6 py-4"><span className="bg-error-container text-error px-2 py-1 rounded text-[11px] font-bold">Đã khóa</span></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        <button className="text-[12px] font-bold text-primary hover:underline">Xem</button>
                        <button className="text-[12px] font-bold text-primary hover:underline">Mở khóa</button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #dce2f3;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
