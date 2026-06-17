import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Map, 
  Clock, 
  Banknote, 
  Settings, 
  Bell, 
  HelpCircle, 
  Calendar,
  AlertCircle,
  BarChart2,
  ClipboardList,
  LayoutGrid,
  Plus,
  Star,
  Pencil,
  Eye,
  CheckCircle,
  XCircle,
  User,
  Menu,
  X
} from 'lucide-react';

export const OwnerDashboard = () => {
  const [activeMenu, setActiveMenu] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const menuItems = [
    { id: 'overview', icon: <LayoutDashboard className="w-5 h-5" />, label: 'Tổng quan' },
    { id: 'bookings', icon: <CalendarDays className="w-5 h-5" />, label: 'Quản lý đặt sân' },
    { id: 'courts', icon: <Map className="w-5 h-5" />, label: 'Quản lý sân & court' },
    { id: 'schedule', icon: <Clock className="w-5 h-5" />, label: 'Quản lý khung giờ' },
    { id: 'revenue', icon: <Banknote className="w-5 h-5" />, label: 'Doanh thu' },
    { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Cài đặt' },
  ];

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md w-full overflow-x-hidden">
      {/* TopNavBar */}
      <header className="bg-primary text-on-primary w-full sticky top-0 z-50 shadow-md flex justify-between items-center px-4 md:px-margin-desktop h-16">
        <div className="flex items-center gap-4 md:gap-gutter">
          <Link to="/" className="text-[24px] font-bold tracking-tight text-white flex items-center gap-2">
            Picklink
          </Link>
          <nav className="hidden md:flex gap-stack-md pt-1">
            <Link to="#" className="text-on-primary font-bold border-b-2 border-on-primary pb-1 px-2 transition-colors duration-200 text-[14px]">Tổ quản lý</Link>
            <Link to="#" className="text-on-primary/80 hover:bg-on-primary/10 pb-1 px-2 rounded transition-colors duration-200 text-[14px]">Báo cáo</Link>
          </nav>
        </div>
        
        <div className="flex items-center gap-2 md:gap-stack-md">
          <span className="hidden sm:inline-block font-bold text-on-primary px-4 py-1 rounded-full border border-on-primary/30 text-[12px]">Chủ Sân</span>
          <div className="flex gap-2 items-center">
            <button className="hover:bg-on-primary/10 p-2 rounded-full transition-colors text-white">
              <Bell className="w-5 h-5" />
            </button>
            <button className="hidden sm:block hover:bg-on-primary/10 p-2 rounded-full transition-colors text-white">
              <HelpCircle className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-full bg-on-primary/20 flex items-center justify-center overflow-hidden border-2 border-on-primary/40 cursor-pointer">
              <img 
                alt="User avatar" 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAACzRtPoxB4kCuH9GSakR6EGBDxqQGrDCfCUT5L0MsfIFOslDErbVbvojc09NKwchHQXpJ5AHlapanbMpxB2-f2NgmJpH0FOeq8OZU8koFE6tls41-5ixMgwq1E7KTqjlM0aJvd-XPvfsVkDOdmR1Ub9qyIWp6LIc34Q36LMKFYl-GA6lc9tNZ3g_ygx3iHkTPE1T0gOC_hiMFCoRHxs9t8w6R3AsCAqLMQMyvPXLHWbkxejqbXMIQ-vY-Fk0QaMupHYKn4SWr01G1" 
              />
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row pb-16 md:pb-0">
        {/* SideNavBar (Desktop) */}
        <aside className="h-[calc(100vh-64px)] w-64 sticky top-16 bg-surface border-r border-outline-variant flex-col gap-stack-sm p-stack-md hidden md:flex overflow-y-auto">
          <div className="mb-stack-lg px-2 mt-4">
            <h2 className="text-[20px] font-bold text-primary">Picklink Admin</h2>
            <p className="text-[12px] text-on-surface-variant font-medium">Quản lý sân Pickleball</p>
          </div>
          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-150 ease-in-out text-left ${
                  activeMenu === item.id 
                    ? 'text-primary font-bold bg-secondary-container' 
                    : 'text-on-surface-variant hover:bg-surface-container-high font-semibold text-[14px]'
                }`}
              >
                {item.icon}
                <span className="text-[14px]">{item.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Canvas */}
        <main className="flex-1 p-4 md:p-8 space-y-8 w-full max-w-[1200px] mx-auto">
          {/* Dashboard Greeting */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-[24px] md:text-[32px] font-bold text-on-background mb-2">Chào mừng trở lại, Picklink Admin!</h1>
              <p className="text-[14px] md:text-[16px] text-on-surface-variant font-medium">Hôm nay, ngày 24 tháng 05, 2024. Cùng xem các hoạt động tại sân.</p>
            </div>
          </div>

          {/* Statistic Cards Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Stat 1 */}
            <div className="bg-white/80 backdrop-blur-md border border-outline-variant/50 p-6 rounded-xl flex flex-col justify-between h-32 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-bold text-on-surface-variant">Lượt đặt hôm nay</span>
                <Calendar className="text-primary w-5 h-5" />
              </div>
              <span className="text-[32px] md:text-[40px] font-bold leading-none">8</span>
            </div>

            {/* Stat 2 */}
            <div className="bg-white/80 backdrop-blur-md border-2 border-tertiary-container p-6 rounded-xl flex flex-col justify-between h-32 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-bold text-on-surface-variant">Chờ duyệt</span>
                <span className="bg-tertiary-container text-on-tertiary-container px-2 py-0.5 rounded-full text-[12px] font-bold animate-pulse">Cần xử lý</span>
              </div>
              <span className="text-[32px] md:text-[40px] font-bold leading-none text-tertiary">3</span>
            </div>

            {/* Stat 3 */}
            <div className="bg-white/80 backdrop-blur-md border border-outline-variant/50 p-6 rounded-xl flex flex-col justify-between h-32 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-bold text-on-surface-variant">Tỷ lệ lấp đầy</span>
                <BarChart2 className="text-secondary w-5 h-5" />
              </div>
              <div className="flex items-center gap-4 mt-auto">
                <span className="text-[32px] md:text-[40px] font-bold leading-none shrink-0">75%</span>
                <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden flex-1 mt-2">
                  <div className="bg-primary h-full w-[75%] rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="bg-white/80 backdrop-blur-md border border-outline-variant/50 p-6 rounded-xl flex flex-col justify-between h-32 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="text-[14px] font-bold text-on-surface-variant">Doanh thu tháng này</span>
                <Banknote className="text-primary w-5 h-5" />
              </div>
              <span className="text-[24px] font-bold text-on-background leading-none">4.500.000đ</span>
            </div>
          </div>

          {/* Today's Bookings Section */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-[20px] font-bold flex items-center gap-2 text-on-background">
                <ClipboardList className="w-6 h-6 text-on-surface" />
                Đơn đặt sân hôm nay
              </h3>
              <button className="text-primary text-[14px] font-bold hover:underline">Xem tất cả</button>
            </div>
            
            <div className="bg-surface rounded-xl border border-outline-variant/60 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[900px]">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-outline-variant/60">
                      <th className="p-4 text-[14px] font-bold text-on-surface-variant">Mã đơn</th>
                      <th className="p-4 text-[14px] font-bold text-on-surface-variant">Người đặt</th>
                      <th className="p-4 text-[14px] font-bold text-on-surface-variant">Court</th>
                      <th className="p-4 text-[14px] font-bold text-on-surface-variant">Ngày</th>
                      <th className="p-4 text-[14px] font-bold text-on-surface-variant">Khung giờ</th>
                      <th className="p-4 text-[14px] font-bold text-on-surface-variant">Tổng tiền</th>
                      <th className="p-4 text-[14px] font-bold text-on-surface-variant">Trạng thái</th>
                      <th className="p-4 text-[14px] font-bold text-on-surface-variant text-center">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/40">
                    <tr className="hover:bg-surface-container-high transition-colors bg-white">
                      <td className="p-4 text-[14px] font-bold text-on-surface">PKL-001</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Anh Nguyễn</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Sân 1</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">24/05/2024</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">17:00 - 19:00</td>
                      <td className="p-4 text-[14px] font-bold text-on-surface">300.000đ</td>
                      <td className="p-4">
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-[12px] font-bold inline-block">Chờ xác nhận</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><Eye className="w-5 h-5"/></button>
                          <button className="bg-primary-container text-on-primary-container px-3 py-1.5 rounded-md text-[12px] font-bold hover:brightness-95 transition-all">Xác nhận</button>
                          <button className="bg-error-container text-on-error-container px-3 py-1.5 rounded-md text-[12px] font-bold hover:brightness-95 transition-all">Từ chối</button>
                        </div>
                      </td>
                    </tr>
                    
                    <tr className="hover:bg-surface-container-high transition-colors bg-white">
                      <td className="p-4 text-[14px] font-bold text-on-surface">PKL-002</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Chị Lan</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Sân 2</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">24/05/2024</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">08:00 - 10:00</td>
                      <td className="p-4 text-[14px] font-bold text-on-surface">250.000đ</td>
                      <td className="p-4">
                        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-[12px] font-bold inline-block">Đã xác nhận</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><Eye className="w-5 h-5"/></button>
                          <button className="bg-outline-variant/30 text-on-surface-variant px-3 py-1.5 rounded-md text-[12px] font-bold cursor-not-allowed opacity-50">Xác nhận</button>
                          <button className="bg-error-container text-on-error-container px-3 py-1.5 rounded-md text-[12px] font-bold hover:brightness-95 transition-all">Hủy</button>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-container-high transition-colors bg-white">
                      <td className="p-4 text-[14px] font-bold text-on-surface">PKL-003</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Anh Tuấn</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Sân 1</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">24/05/2024</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">19:00 - 21:00</td>
                      <td className="p-4 text-[14px] font-bold text-on-surface">350.000đ</td>
                      <td className="p-4">
                        <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-[12px] font-bold inline-block">Đã hủy</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><Eye className="w-5 h-5"/></button>
                          <span className="text-[12px] font-medium text-on-surface-variant px-2">Không thao tác</span>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-container-high transition-colors bg-white">
                      <td className="p-4 text-[14px] font-bold text-on-surface">PKL-004</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Chị Mai</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Sân 3</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">24/05/2024</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">16:00 - 18:00</td>
                      <td className="p-4 text-[14px] font-bold text-on-surface">280.000đ</td>
                      <td className="p-4">
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-[12px] font-bold inline-block">Chờ xác nhận</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><Eye className="w-5 h-5"/></button>
                          <button className="bg-primary-container text-on-primary-container px-3 py-1.5 rounded-md text-[12px] font-bold hover:brightness-95 transition-all">Xác nhận</button>
                          <button className="bg-error-container text-on-error-container px-3 py-1.5 rounded-md text-[12px] font-bold hover:brightness-95 transition-all">Từ chối</button>
                        </div>
                      </td>
                    </tr>

                    <tr className="hover:bg-surface-container-high transition-colors bg-white">
                      <td className="p-4 text-[14px] font-bold text-on-surface">PKL-005</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Anh Hùng</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">Sân 2</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">24/05/2024</td>
                      <td className="p-4 text-[14px] font-medium text-on-surface">20:00 - 22:00</td>
                      <td className="p-4 text-[14px] font-bold text-on-surface">320.000đ</td>
                      <td className="p-4">
                        <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-[12px] font-bold inline-block">Chờ xác nhận</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button className="text-on-surface-variant hover:text-primary transition-colors p-1"><Eye className="w-5 h-5"/></button>
                          <button className="bg-primary-container text-on-primary-container px-3 py-1.5 rounded-md text-[12px] font-bold hover:brightness-95 transition-all">Xác nhận</button>
                          <button className="bg-error-container text-on-error-container px-3 py-1.5 rounded-md text-[12px] font-bold hover:brightness-95 transition-all">Từ chối</button>
                        </div>
                      </td>
                    </tr>

                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Court Management Section */}
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-[20px] font-bold flex items-center gap-2 text-on-background">
                <LayoutGrid className="w-6 h-6 text-on-surface" />
                Quản lý Sân/Court
              </h3>
              <button className="bg-primary-container text-on-primary-container px-4 py-2 rounded-lg text-[14px] font-bold hover:opacity-90 flex items-center justify-center gap-2 transition-all shadow-sm w-full sm:w-auto">
                <Plus className="w-5 h-5" />
                Thêm court mới
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Court Card 1 */}
              <div className="bg-white/80 backdrop-blur border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col">
                <div className="h-40 relative">
                  <img 
                    alt="Pickleball Court 1" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCBOh69ru3mFoVMGI22B3EV1xQ3fWERQK_mh0PnhSNxM_20gPDefZWBIGugQpxUxmi43mh94W64GYsbPXlQFiRnZKK2ky4GPEWh6mNKd3-4MIjSuNY1TY-Zf-CoG9-hhiQex2WSW5j4RxvBc6vmlsVw4aOpG1p-ji-D3hjwDz7cETwt9ARdz4TotQPXds9RIIj0X6T40ePy2WCEx8MPISG1-VEmW8_4LPQ1HI7q3s0v_CTrayIAGaOwFDG3-JUeluh5rNK__1N9zowr" 
                  />
                  <div className="absolute top-3 right-3 bg-[#22c55e] text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                    Hoạt động
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="text-[20px] font-bold text-on-background mb-1">Court 1</h4>
                  <p className="text-[14px] font-medium text-on-surface-variant mb-4 flex-1">Sân tiêu chuẩn quốc tế, đèn LED sáng.</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-[12px] font-medium text-secondary flex items-center gap-1.5 bg-surface-container py-1 px-2 rounded-md">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> 
                      <span className="text-on-surface font-bold">4.8</span> (120 reviews)
                    </span>
                    <button className="text-primary font-bold text-[14px] hover:bg-primary-container/30 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all">
                      <Pencil className="w-4 h-4" /> Chỉnh sửa
                    </button>
                  </div>
                </div>
              </div>

              {/* Court Card 2 */}
              <div className="bg-white/80 backdrop-blur border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col">
                <div className="h-40 relative">
                  <img 
                    alt="Pickleball Court 2" 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuASCYEcuql4WAZrlB07pfupWmRBvzd3NL9vdsZqwCyR8GWjeFzMQ8rUqy2OaQqq5iFy35qM1lmHKc3TPTt-p-OYFqAezamRzBOUIzTJNA7HSQV_I3i-cvjQCqtt_SwhtoGPJx3NtT-PSfYdThaTi9Zj1hZaLO2sBB9mxpwovUkBv_sAxthzZsG5Y0W-PvLw3RipYH0c5Ew7DhH9pKqmIi2sHJ1jpuzExRCahhLmcrJ0HhR1Hxl8TePQomCKj6d1CONxOQqlD9L7K5bD" 
                  />
                  <div className="absolute top-3 right-3 bg-[#22c55e] text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                    Hoạt động
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="text-[20px] font-bold text-on-background mb-1">Court 2</h4>
                  <p className="text-[14px] font-medium text-on-surface-variant mb-4 flex-1">Sân trong nhà, mặt thảm chuyên dụng.</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-[12px] font-medium text-secondary flex items-center gap-1.5 bg-surface-container py-1 px-2 rounded-md">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> 
                      <span className="text-on-surface font-bold">4.9</span> (85 reviews)
                    </span>
                    <button className="text-primary font-bold text-[14px] hover:bg-primary-container/30 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all">
                      <Pencil className="w-4 h-4" /> Chỉnh sửa
                    </button>
                  </div>
                </div>
              </div>

              {/* Court Card 3 */}
              <div className="bg-white/80 backdrop-blur border border-outline-variant/40 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all group flex flex-col">
                <div className="h-40 relative bg-surface-container-highest">
                  <img 
                    alt="Pickleball Court 3" 
                    className="w-full h-full object-cover opacity-60 mix-blend-multiply grayscale-[50%]" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuC4KDTllxUkPn6CUMZa_kh70sauIGwJWXr3qP-nu1Vw1GIT1w8DsNFz5oU5D7W8dT_30U-ckECwQrjA-_evZKgiYp3YyHC0Ppy2tBZ2YU1KPOgeI7Tug7q5pTryFZBuyGuH70Cgitr1gLsCt3nLPHQFByzBCaYV7Aem6HT7wwHjKCp14jf0kzTgBb42BhW5AyD8aYJQmuQnNgX10Ibu6gTYV1JN3FK3_Hefp-rYKKRzkqEidEeHY3MpIa-_mhe_gwpuTeV6mYs-wpu1" 
                  />
                  <div className="absolute top-3 right-3 bg-orange-500 text-white text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm">
                    Bảo trì
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h4 className="text-[20px] font-bold text-on-background mb-1">Court 3</h4>
                  <p className="text-[14px] font-medium text-on-surface-variant mb-4 flex-1">Sân VIP, bao gồm phòng chờ riêng.</p>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-[12px] font-medium text-secondary flex items-center gap-1.5 bg-surface-container py-1 px-2 rounded-md">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" /> 
                      <span className="text-on-surface font-bold">5.0</span> (42 reviews)
                    </span>
                    <button className="text-primary font-bold text-[14px] hover:bg-primary-container/30 px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all">
                      <Pencil className="w-4 h-4" /> Chỉnh sửa
                    </button>
                  </div>
                </div>
              </div>
              
            </div>
          </section>
        </main>
      </div>

      {/* Mobile Navigation Bar (Bottom) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant flex justify-around items-center h-16 z-50">
        <Link to="#" className="flex flex-col items-center gap-1 text-primary">
          <LayoutDashboard className="w-6 h-6 fill-primary/10" />
          <span className="text-[10px] font-bold">Tổ quản lý</span>
        </Link>
        <Link to="#" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <CalendarDays className="w-6 h-6" />
          <span className="text-[10px] font-bold">Lịch đặt</span>
        </Link>
        <Link to="#" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <Map className="w-6 h-6" />
          <span className="text-[10px] font-bold">Sân tập</span>
        </Link>
        <Link to="#" className="flex flex-col items-center gap-1 text-on-surface-variant hover:text-primary transition-colors">
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold">Tài khoản</span>
        </Link>
      </nav>

    </div>
  );
};
