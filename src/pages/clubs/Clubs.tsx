import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ClubsChat } from './ClubsChat';
import { 
  Search, 
  MapPin, 
  PlusCircle, 
  ChevronDown, 
  Activity, 
  Zap, 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  Award,
  User, 
  Users, 
  Calendar
} from 'lucide-react';

export const Clubs = () => {
  const [showGroups, setShowGroups] = useState(false);

  if (showGroups) {
    return <ClubsChat />;
  }

  return (
    <div className="flex-1 flex flex-col font-body-md overflow-x-hidden w-full bg-background">
      {/* Hero Section */}
      <div className="bg-primary">
        <div className="h-[72px] w-full" />
        <section className="relative overflow-hidden pt-12 pb-24 md:pt-16 md:pb-32">
          {/* Abstract background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>
          
          <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center">
            <h1 className="font-headline-xl text-[32px] md:text-headline-xl text-white mb-stack-md font-bold">Khám phá Câu Lạc Bộ Pickleball</h1>
            <p className="text-white/90 font-body-lg text-body-lg max-w-2xl mx-auto mb-stack-lg">
              Kết nối với những người đam mê, nâng cao kỹ năng và tham gia vào cộng đồng Pickleball sôi động nhất Việt Nam.
            </p>
            
            {/* Search Box */}
            <div className="flex flex-col md:flex-row gap-stack-sm items-center justify-center max-w-3xl mx-auto bg-white p-2 rounded-xl shadow-xl">
              <div className="flex items-center flex-1 w-full px-4 border-b md:border-b-0 md:border-r border-outline-variant">
                <Search className="text-outline w-[24px] h-[24px]" />
                <input className="w-full border-none focus:ring-0 text-body-md py-3 placeholder:text-outline/60 outline-none ml-2" placeholder="Tìm tên câu lạc bộ..." type="text" />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto px-4 relative">
                <MapPin className="text-outline w-[24px] h-[24px]" />
                <select className="border-none focus:ring-0 text-body-md py-3 bg-transparent pr-8 outline-none appearance-none cursor-pointer">
                  <option>Toàn quốc</option>
                  <option>Hà Nội</option>
                  <option>TP. Hồ Chí Minh</option>
                  <option>Đà Nẵng</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-5 h-5" />
              </div>
              <button className="w-full md:w-auto bg-primary-container text-on-primary-container font-label-md text-label-md px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all mt-2 md:mt-0">
                Tìm kiếm
              </button>
            </div>
            
            {/* Club Tabs */}
            <div className="mt-stack-lg flex items-center justify-center gap-4">
              <button 
                className="bg-primary-container text-on-primary-container font-label-md text-label-md px-6 py-3 rounded-lg flex items-center gap-2 transition-all shadow-md font-bold"
              >
                Dành cho bạn
              </button>
              <button 
                onClick={() => setShowGroups(true)}
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-label-md text-label-md px-6 py-3 rounded-lg flex items-center gap-2 transition-all backdrop-blur-sm"
              >
                Nhóm của bạn
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Filter Bar */}
      <section className="bg-surface-container-lowest border-b border-outline-variant py-4 sticky top-[72px] z-40 shadow-sm overflow-x-auto">
        <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-stack-md min-w-max">
          <div className="flex items-center gap-stack-md pb-2 md:pb-0">
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full border border-outline-variant text-label-md font-label-md text-on-surface-variant cursor-pointer hover:bg-surface-container-highest transition-colors">
              Khu vực <ChevronDown className="w-[18px] h-[18px]" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full border border-outline-variant text-label-md font-label-md text-on-surface-variant cursor-pointer hover:bg-surface-container-highest transition-colors">
              Quy mô <ChevronDown className="w-[18px] h-[18px]" />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container rounded-full border border-outline-variant text-label-md font-label-md text-on-surface-variant cursor-pointer hover:bg-surface-container-highest transition-colors">
              Trình độ <ChevronDown className="w-[18px] h-[18px]" />
            </div>
          </div>
          <div className="flex items-center gap-stack-sm ml-auto mr-4 md:mr-0 pl-4 border-l border-outline-variant md:border-none">
            <span className="text-label-sm font-label-sm text-outline whitespace-nowrap">Sắp xếp:</span>
            <div className="relative">
              <select className="bg-transparent border-none text-label-md font-label-md text-on-surface focus:ring-0 pr-8 outline-none appearance-none cursor-pointer">
                <option>Mới nhất</option>
                <option>Nhiều thành viên nhất</option>
                <option>Hoạt động sôi nổi</option>
              </select>
              <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-[18px] h-[18px]" />
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg w-full">
        {/* Clubs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-stack-lg">
          {/* Club Card 1 */}
          <div className="group bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="h-40 relative overflow-hidden bg-gradient-to-br from-primary-container to-primary">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 z-20">
                <div className="w-16 h-16 bg-white rounded-full p-1 border-2 border-white shadow-md transition-transform duration-300 group-hover:-translate-y-2">
                  <div className="w-full h-full bg-surface-container rounded-full flex items-center justify-center">
                    <Activity className="text-primary w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-stack-md pt-8 flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-headline-md text-[20px] md:text-headline-md text-on-surface">CLB Pickleball Hà Nội</h3>
                <span className="bg-surface-container text-on-secondary-container text-[12px] font-label-sm px-2 py-1 rounded whitespace-nowrap ml-2">Hà Nội</span>
              </div>
              <div className="flex items-center gap-2 text-outline mb-4">
                <Users className="w-[18px] h-[18px]" />
                <span className="text-label-md font-label-md">1,250 thành viên</span>
              </div>
              <p className="text-on-surface-variant line-clamp-2 mb-stack-md text-body-md">
                Sân chơi chuyên nghiệp cho mọi lứa tuổi tại khu vực Mỹ Đình. Tổ chức giao lưu định kỳ vào sáng thứ 7 hàng tuần.
              </p>
            </div>
            <div className="p-stack-md border-t border-outline-variant flex gap-stack-sm">
              <Link to="/clubs/hanoi-elite" className="flex-1 border border-primary text-primary font-label-md text-label-md py-2 rounded-lg hover:bg-primary/5 transition-colors text-center">Xem chi tiết</Link>
              <button className="flex-1 bg-primary text-white font-label-md text-label-md py-2 rounded-lg hover:opacity-90 transition-opacity">Tham gia</button>
            </div>
          </div>

          {/* Club Card 2 */}
          <div className="group bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="h-40 relative overflow-hidden bg-gradient-to-br from-[#2D5000] to-primary-container">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 z-20">
                <div className="w-16 h-16 bg-white rounded-full p-1 border-2 border-white shadow-md transition-transform duration-300 group-hover:-translate-y-2">
                  <div className="w-full h-full bg-surface-container rounded-full flex items-center justify-center">
                    <Zap className="text-secondary w-8 h-8" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-stack-md pt-8 flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-headline-md text-[20px] md:text-headline-md text-on-surface">CLB Pickle Trẻ</h3>
                <span className="bg-surface-container text-on-secondary-container text-[12px] font-label-sm px-2 py-1 rounded whitespace-nowrap ml-2">TP.HCM</span>
              </div>
              <div className="flex items-center gap-2 text-outline mb-4">
                <Users className="w-[18px] h-[18px]" />
                <span className="text-label-md font-label-md">840 thành viên</span>
              </div>
              <p className="text-on-surface-variant line-clamp-2 mb-stack-md text-body-md">
                Năng động - Sáng tạo - Kết nối. Nơi hội tụ của các bạn trẻ yêu thích Pickleball tại Quận 1 và Quận 3.
              </p>
            </div>
            <div className="p-stack-md border-t border-outline-variant flex gap-stack-sm">
              <Link to="/clubs/pickle-tre" className="flex-1 border border-primary text-primary font-label-md text-label-md py-2 rounded-lg hover:bg-primary/5 transition-colors text-center">Xem chi tiết</Link>
              <button className="flex-1 bg-primary text-white font-label-md text-label-md py-2 rounded-lg hover:opacity-90 transition-opacity">Tham gia</button>
            </div>
          </div>

          {/* Club Card 3 */}
          <div className="group bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col">
            <div className="h-40 relative overflow-hidden bg-gradient-to-br from-[#7e1c66] to-[#ffade0]">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
              <div className="absolute bottom-4 left-4 z-20">
                <div className="w-16 h-16 bg-white rounded-full p-1 border-2 border-white shadow-md transition-transform duration-300 group-hover:-translate-y-2">
                  <div className="w-full h-full bg-surface-container rounded-full flex items-center justify-center">
                    <Star className="text-tertiary w-8 h-8 fill-current" />
                  </div>
                </div>
              </div>
            </div>
            <div className="p-stack-md pt-8 flex-1">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-headline-md text-[20px] md:text-headline-md text-on-surface">Đà Nẵng Pro Picklers</h3>
                <span className="bg-surface-container text-on-secondary-container text-[12px] font-label-sm px-2 py-1 rounded whitespace-nowrap ml-2">Đà Nẵng</span>
              </div>
              <div className="flex items-center gap-2 text-outline mb-4">
                <Users className="w-[18px] h-[18px]" />
                <span className="text-label-md font-label-md">320 thành viên</span>
              </div>
              <p className="text-on-surface-variant line-clamp-2 mb-stack-md text-body-md">
                Tập trung huấn luyện kỹ thuật nâng cao và tham gia các giải đấu quốc tế. Thành lập bởi các HLV chuyên nghiệp.
              </p>
            </div>
            <div className="p-stack-md border-t border-outline-variant flex gap-stack-sm">
              <Link to="/clubs/da-nang-pro-picklers" className="flex-1 border border-primary text-primary font-label-md text-label-md py-2 rounded-lg hover:bg-primary/5 transition-colors text-center">Xem chi tiết</Link>
              <button className="flex-1 bg-primary text-white font-label-md text-label-md py-2 rounded-lg hover:opacity-90 transition-opacity">Tham gia</button>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-stack-sm mb-24">
          <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-outline hover:border-primary hover:text-primary transition-all">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button className="w-10 h-10 rounded-lg bg-primary text-white font-label-md text-label-md">1</button>
          <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary font-label-md text-label-md transition-all">2</button>
          <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary font-label-md text-label-md transition-all">3</button>
          <span className="px-2 text-outline font-semibold">...</span>
          <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-on-surface-variant hover:border-primary hover:text-primary font-label-md text-label-md transition-all">12</button>
          <button className="w-10 h-10 rounded-lg border border-outline-variant flex items-center justify-center text-outline hover:border-primary hover:text-primary transition-all">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Featured Club Detail */}
        <section className="mt-stack-lg bg-white rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
          <div className="h-64 md:h-80 relative overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBGUTGa2EKzG3kHw7AmvjTv4Qar_O-PgS-IRTm29jqbJ3lXpx75wwoiXTVyemB1eePxfOIFYpanHT01gnHaoAlKK3F9B0kLa6NkUEMyAK-ayYgzQIf2z2_2I9YuKJj6cSNynPDluI9ku5ZXtYLlN1IXnrYjkX496XA_ADJWpBp6ALREA_1L-INF_WlF5dyP1G9spZZOIyR0pFyQ7xPIbW_atiQs_xZSW2V3kmFWduZs-vOMcMuqbEeQmkYpJFUiPgD53_XSbrIfUx3p')" }}></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
            <div className="absolute bottom-8 left-8 right-8 flex flex-col md:flex-row md:items-end justify-between gap-stack-md">
              <div>
                <div className="flex items-center gap-stack-sm mb-4">
                  <div className="w-20 h-20 bg-white rounded-full p-1 shadow-xl">
                    <div className="w-full h-full bg-primary-container rounded-full flex items-center justify-center">
                      <Award className="text-white w-10 h-10" />
                    </div>
                  </div>
                  <div className="text-white">
                    <span className="bg-primary px-3 py-1 rounded-full text-label-sm font-label-sm uppercase tracking-wider mb-2 inline-block">CLB Nổi bật</span>
                    <h2 className="font-headline-lg text-[24px] md:text-headline-lg font-bold">Hanoi Elite Pickleball Club</h2>
                  </div>
                </div>
              </div>
              <div className="flex gap-stack-sm">
                <Link to="/clubs/hanoi-elite" className="bg-primary-container text-on-primary-container font-label-md text-label-md px-8 py-3 rounded-lg font-bold hover:scale-105 active:scale-95 transition-all shadow-lg whitespace-nowrap">
                  Xem chi tiết CLB
                </Link>
              </div>
            </div>
          </div>
          
          <div className="p-margin-mobile md:p-margin-desktop grid grid-cols-1 lg:grid-cols-3 gap-stack-lg">
            <div className="lg:col-span-2 space-y-stack-lg">
              <div>
                <h4 className="font-headline-md text-headline-md mb-stack-sm">Giới thiệu</h4>
                <p className="text-on-surface-variant text-body-lg leading-relaxed">
                  Hanoi Elite Pickleball Club là điểm đến hàng đầu dành cho những người chơi Pickleball tại Thủ đô. Với hệ thống 6 sân tiêu chuẩn quốc tế và đội ngũ huấn luyện viên giàu kinh nghiệm, chúng tôi cam kết mang đến môi trường tập luyện và thi đấu chuyên nghiệp nhất. Dù bạn là người mới bắt đầu hay một vận động viên trình độ cao, Elite luôn có lộ trình phát triển phù hợp cho bạn.
                </p>
              </div>
              <div>
                <h4 className="font-headline-md text-headline-md mb-stack-md mt-8">Hoạt động mới nhất</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                  <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant hover:shadow-md transition-all cursor-pointer">
                    <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAVqgr8lcW0tpxzv1Ac2jsZLY13iCsRXKifSQFy_-MZGONiuXnEwPPE_DFdLBn3tEXp4KF2eTQrYiDjYC6YcvgGCXklrqd51q8RV2iZDMjDFbCM6qBmPcqDvBuBt45PeUtzYUmFMWopYKyqvGQp-FFR-ezSswM0pHlqaUPvyKxio2PGOf3B8AITYam1TnY5qEXYDEGYVHMgxwE9HDsXGmtIby90CVyDYPf0gaJnlP68bdYw0BaHdv3BAQ7BFytZ4B07yq-618OWOLXl')" }}></div>
                    <div className="p-stack-md">
                      <span className="text-label-sm font-label-sm text-primary mb-1 block">Sự kiện • 20/05/2024</span>
                      <h5 className="font-label-md text-label-md mb-1">Giải đấu Nội bộ Mùa Hè 2024</h5>
                      <p className="text-on-surface-variant text-label-sm line-clamp-1 text-sm">Hơn 50 cặp đấu đã cống hiến những trận cầu mãn nhãn...</p>
                    </div>
                  </div>
                  
                  <div className="bg-surface-container rounded-xl overflow-hidden border border-outline-variant hover:shadow-md transition-all cursor-pointer">
                    <div className="h-40 bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCPmDm5RzB_9l7ybdH3WzumfhcLhVVHjsenuknEuyNVWMc-cKF2bXBAaaJDwUpm45b2i8OcpVLwunMEBMqCigBn6j3LHoYSqtfsa0ZBkOAuvJ2ONWMWvh4vADjaaPvURAVUF5izWsDega4BsmXWWozR7kNqLM_9tcIL73DN65vUuJeLrs4oV5JKnMxLelR6brKmpzcdnZwUxTkFthC4QkUQdVqGLeeVwp6tfXGg0jKRiN7L9fz3Ag8s3jBbcCAGIa5OVyP4my9-be7j')" }}></div>
                    <div className="p-stack-md">
                      <span className="text-label-sm font-label-sm text-primary mb-1 block">Tin tức • 15/05/2024</span>
                      <h5 className="font-label-md text-label-md mb-1">Chào mừng 20 thành viên mới gia nhập</h5>
                      <p className="text-on-surface-variant text-label-sm line-clamp-1 text-sm">Gia đình Elite ngày càng lớn mạnh với những gương mặt đầy tiềm năng...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-stack-lg">
              <div className="bg-surface-container-low p-stack-md rounded-xl border border-outline-variant">
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-outline mb-4">Thông tin chi tiết</h4>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <User className="text-primary w-6 h-6" />
                    <div>
                      <p className="text-label-sm text-outline">Quản lý</p>
                      <p className="font-label-md text-on-surface">Nguyễn Văn An</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <MapPin className="text-primary w-6 h-6" />
                    <div>
                      <p className="text-label-sm text-outline">Khu vực</p>
                      <p className="font-label-md text-on-surface">Cầu Giấy, Hà Nội</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <Users className="text-primary w-6 h-6" />
                    <div>
                      <p className="text-label-sm text-outline">Thành viên</p>
                      <p className="font-label-md text-on-surface">2,450 thành viên</p>
                    </div>
                  </li>
                  <li className="flex items-center gap-3">
                    <Calendar className="text-primary w-6 h-6" />
                    <div>
                      <p className="text-label-sm text-outline">Ngày thành lập</p>
                      <p className="font-label-md text-on-surface">12/03/2022</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-label-md text-label-md uppercase tracking-wide text-outline mb-4">Thành viên tiêu biểu</h4>
                <div className="flex items-center -space-x-3">
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-surface-container relative">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQXDlqCP6BsamyvGKhRsHkLXsKa_2avtk7EAX8brYsWbjxuEzjtDt3SuvAtcCrVfgSfPoJCD8njbrPyWLvLmDTJF-fFbiMPsXTYA7QkBRl0Rs8Zvs_085p6AJjlKdwnEii-WQp6IRVGzLFH0sLHIqYR9Gez-JSpstWzgAhwSTj2FAYnTeIXr3IopFp0wm2A7zzk3lRX0MwTQSjArSXCD4UjtYSm5Csb3XpiRZ1TcPlU_qKv89Zt0WN8UQ5xvmBLlnpHeUjcZ2vDKjC" alt="Member 1" />
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-surface-container relative">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB8liZ4cjh_k_ntOUF0Rz3tGZgDbpcqaKEsGH-0D2j6_c9RaQT-K8xzRb7nafpWmtTccWeWtNroUklGgcnAOBWFiFnlKZeEmNVIAYb0MdX2g-wcYq8vDzU3VK7wGyo4i5-768uS9dTsCU7E1I0nNs6tl4eanhNKvCLvVyn6IE8WnjdbO1foqYNlOeAXk6zy6-1ZtH9WlIKlkbYbDK1Tf27dSCwtL5YVX5UAY46qXCcmuhkPid2Bt6uwrtBtL1IBJfTD43g0mNu40lSQ" alt="Member 2" />
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-surface-container relative">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAbUnChWH1wh9w8VFpopgGnEJLS2VHsc2iT5HjAHvtHUjnukAK1KwEFLIvPmVO8tv2whtnP7h7VdmzJ4Hpgyqt2Sq8zaPtbagSm5vhnnfKJ0OZAZYWdaKQXhESWq2525GR1jnXIEw1vAxuTMF2OShNRMxBol-Ha5XTUaxNNRcuhz_tQZQEHI5EZCSNoPqdkaWO_uv0mxeI4I342evkcoJNMs3_kAsy8hD1GNrGc9JB09uXyxrLNFDx2vd5vVG-js8qTYgPyypnXezVC" alt="Member 3" />
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-surface-container relative">
                    <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZH0kpZlVD60prb3MCuA3hubODx-JMjt_5DeMrRJMt3j2Id2roUFH8qAWVCUZ468D3AdOV1mvqGGJLLEOxP0m7FVjdlbXQtvKbfsy6RKjqwGOuSyX5ladxjMdpub-oOF1GePrCpZHeerkfNJMZ_RtNUfWtIVSCKDHMT7YwmLUeKVCX5Ip3_eeW49v9atqIPyJ6-QUNnqRSJZsfo6BbUoTzaynDzagggzM6S3GwJr3arFIWRHDDshfb2r0ZJu9-gje6aZh2Ywtrzdn3" alt="Member 4" />
                  </div>
                  <div className="w-12 h-12 rounded-full border-2 border-white bg-primary flex items-center justify-center text-white text-[12px] font-bold z-10">
                    +2.4k
                  </div>
                </div>
                <p className="mt-2 text-[14px] font-medium text-outline">24 thành viên mới trong tuần này</p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
