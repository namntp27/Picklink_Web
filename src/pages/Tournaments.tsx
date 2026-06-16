import React from 'react';
import { 
  PlusCircle, 
  Calendar, 
  MapPin, 
  Users, 
  Banknote, 
  ChevronRight, 
  Gavel, 
  Trophy 
} from 'lucide-react';

export const Tournaments = () => {
  return (
    <div className="flex-1 flex flex-col font-body-md w-full bg-background text-on-background">
      {/* Spacer for fixed Header */}
      <div className="bg-primary h-[72px] w-full" />

      {/* Banner Hero */}
      <section 
        className="relative w-full py-24 px-gutter overflow-hidden" 
        style={{ background: 'linear-gradient(135deg, #3d6a00 0%, #84C33E 100%)' }}
      >
        <div className="max-w-container-max-width mx-auto relative z-10 w-full">
          <div className="max-w-2xl">
            <h1 className="font-headline-xl text-headline-xl text-on-primary mb-stack-md font-bold">
              Giải Đấu Pickleball
            </h1>
            <p className="font-body-lg text-body-lg text-on-primary/90 mb-stack-lg leading-relaxed">
              Kết nối cộng đồng đam mê Pickleball thông qua những giải đấu kịch tính và chuyên nghiệp. Nơi tài năng được tỏa sáng và những tình bạn mới được hình thành.
            </p>
            <div className="flex flex-wrap gap-stack-md">
              <button className="px-8 py-3 bg-white text-primary font-label-md text-[14px] font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2">
                <PlusCircle className="w-5 h-5" />
                Tổ chức giải đấu
              </button>
              <button className="px-8 py-3 border-2 border-on-primary text-on-primary font-label-md text-[14px] font-bold rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                Xem lịch giải đấu
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="bg-surface py-stack-md shadow-sm sticky top-[72px] z-40 border-b border-outline-variant/30">
        <div className="max-w-container-max-width w-full mx-auto px-gutter flex flex-wrap items-center justify-between gap-stack-md">
          <div className="flex flex-wrap gap-stack-md items-center">
            <div className="flex flex-col">
              <span className="font-label-sm text-[12px] font-medium text-on-surface-variant mb-1">Khu vực</span>
              <select className="bg-white border focus:outline-none border-outline-variant rounded-lg font-label-md text-[14px] font-semibold px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary min-w-[160px]">
                <option>Tất cả khu vực</option>
                <option>Hà Nội</option>
                <option>TP.HCM</option>
                <option>Đà Nẵng</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-[12px] font-medium text-on-surface-variant mb-1">Trạng thái</span>
              <select className="bg-white border focus:outline-none border-outline-variant rounded-lg font-label-md text-[14px] font-semibold px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary min-w-[160px]">
                <option>Tất cả trạng thái</option>
                <option>Đang mở ĐK</option>
                <option>Sắp diễn ra</option>
                <option>Đã kết thúc</option>
              </select>
            </div>
            <div className="flex flex-col">
              <span className="font-label-sm text-[12px] font-medium text-on-surface-variant mb-1">Thời gian</span>
              <input 
                type="date" 
                className="bg-white border focus:outline-none border-outline-variant rounded-lg font-label-md text-[14px] font-semibold px-4 py-2 focus:ring-2 focus:ring-primary focus:border-primary" 
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="font-label-md text-[14px] font-semibold">Đang hiển thị 12 giải đấu</span>
          </div>
        </div>
      </section>

      {/* Tournament Grid */}
      <section className="max-w-container-max-width w-full mx-auto px-gutter py-stack-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden hover:shadow-xl transition-all group flex flex-col">
            <div className="h-48 relative overflow-hidden">
              <img 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCQergp7Ld1Y3VbS5Ir0uBCkBYpt-t4-199PUE7t2RUmC4o1jEHymprZ2f1UbPbHKP7uZo71pPZ2ixKYREWaowLQ8YWehETU28Rg3ZjsY8V4wE8_fH3ydYQDcuvYpAbgkimqkt1zXFtq72IYy_D9c3UMo7kSqM850DtHiWOuLaSZKzOZuheXevajnABGSyH742TYilZzQQLMe1eZzIoeTREDd8vujo2jjPYT79iloQGU2u-OpSuloK-K0U0iAnCmw4GjZqS0_tkWqiS" 
                alt="Tournament 1" 
              />
              <span className="absolute top-4 right-4 bg-primary text-on-primary px-3 py-1 rounded-full text-[12px] font-semibold">
                Đang mở ĐK
              </span>
            </div>
            <div className="p-stack-md flex-grow flex flex-col">
              <h3 className="font-headline-md text-[20px] font-bold text-on-surface mb-2">
                Giải Pickleball Mùa Hè 2026
              </h3>
              <div className="space-y-2 mb-stack-md">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Calendar className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">15/06/2026</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <MapPin className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">Picklink Cầu Giấy</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Users className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">Số đội: 32/40</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Banknote className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">500.000 VNĐ</span>
                </div>
              </div>
              <div className="flex gap-stack-sm mt-auto">
                <button className="flex-1 py-2 border border-outline text-on-surface font-label-md text-[14px] font-bold rounded-lg hover:bg-surface-container transition-colors">
                  Xem chi tiết
                </button>
                <button className="flex-1 py-2 bg-primary text-on-primary font-label-md text-[14px] font-bold rounded-lg shadow-md hover:opacity-90 transition-opacity">
                  Đăng ký
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden hover:shadow-xl transition-all group flex flex-col">
            <div className="h-48 relative overflow-hidden">
              <img 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCd1Ruvvim8Z3UfXh_-gC-D3B4RdEfCIkDnamC5sLxl24GbSkhAIrntSYkvJj-Hz2lWh7PLNJuE00BzaKqcGwV0nuLOaFGpxvRQ6eKOpk22502YhkvuKSMG8zF89DDboy0eQ6DSBTvsQsXUEBHJNSfHsIrrcbFUxABMxVf52KHzqJWJqV2dFi_cIEIFexoqtJLCUFdVug08v5zJfqY9KodSApjhQuY-LIG4J6qr2K4tDTghANvay7Gipi0REKYoA7j8D0YXEM6imlAD" 
                alt="Tournament 2" 
              />
              <span className="absolute top-4 right-4 bg-tertiary-container text-on-tertiary-container px-3 py-1 rounded-full text-[12px] font-semibold">
                Sắp diễn ra
              </span>
            </div>
            <div className="p-stack-md flex-grow flex flex-col">
              <h3 className="font-headline-md text-[20px] font-bold text-on-surface mb-2">
                Picklink Open Cup
              </h3>
              <div className="space-y-2 mb-stack-md">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Calendar className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">20/07/2026</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <MapPin className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">Quận 7, TP.HCM</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Users className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">Số đội: 12/24</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-bold">
                  <Banknote className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">300.000 VNĐ</span>
                </div>
              </div>
              <div className="flex gap-stack-sm mt-auto">
                <button className="w-full py-2 border border-outline text-on-surface font-label-md text-[14px] font-bold rounded-lg hover:bg-surface-container transition-colors">
                  Xem chi tiết
                </button>
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-surface-container-lowest border border-outline-variant/50 rounded-xl overflow-hidden hover:opacity-80 transition-all group flex flex-col grayscale">
            <div className="h-48 relative overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDylL9SO8fxVcBJyvXL6IbiJLb4s2I-BcEsQpZh5O1gE4GwIVPs2C7vkOK5tYf1oN3B8BRa9R0zm2eSm9DW8ynAsJJH_qTzFlXKksb10x6ex3fRFuKdylu_iK1N7jWZj0Az-extj9DtuK1K4cHOoQPKbmMqcprKupmRFHY7OziHSp-xjmqUPvvt74Nc25lei3Hrju3hK3J44Wg5zFoKNrw45KZkgZkXfT23LthM9OI3ENVU6BUAbrqgVBG3mCMPMdO3S5SQ5r2VQiqp" 
                alt="Tournament 3" 
              />
              <span className="absolute top-4 right-4 bg-secondary text-on-secondary px-3 py-1 rounded-full text-[12px] font-semibold">
                Đã kết thúc
              </span>
            </div>
            <div className="p-stack-md flex-grow flex flex-col opacity-60">
              <h3 className="font-headline-md text-[20px] font-bold text-on-surface mb-2">
                Weekend Tournament
              </h3>
              <div className="space-y-2 mb-stack-md">
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <Calendar className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">01/05/2026</span>
                </div>
                <div className="flex items-center gap-2 text-on-surface-variant">
                  <MapPin className="w-[18px] h-[18px]" />
                  <span className="text-[14px]">Mỹ Đình, Hà Nội</span>
                </div>
              </div>
              <div className="mt-auto">
                <button 
                  disabled
                  className="w-full py-2 border border-outline text-on-surface font-label-md text-[14px] font-bold rounded-lg cursor-not-allowed opacity-70"
                >
                  Xem kết quả
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-center mt-stack-lg gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline text-on-surface font-label-md bg-white font-semibold">1</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline text-on-surface font-label-md hover:bg-surface-container-low font-semibold transition-colors">2</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline text-on-surface font-label-md hover:bg-surface-container-low font-semibold transition-colors">3</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline text-on-surface font-label-md hover:bg-surface-container-low font-semibold transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Featured Tournament Detail Section */}
      <section className="bg-white py-stack-lg border-t border-outline-variant/30 flex-1">
        <div className="max-w-container-max-width w-full mx-auto px-gutter">
          
          <div className="mb-stack-lg border-b border-outline-variant/20 pb-stack-md">
            <div className="flex items-center gap-4 mb-2 flex-wrap">
              <h2 className="font-headline-lg text-[24px] md:text-[32px] font-bold text-on-surface">Giải Pickleball Mùa Hè 2026</h2>
              <span className="bg-primary-container text-on-primary-container px-3 py-1 rounded-full text-[12px] font-semibold">Đang mở ĐK</span>
            </div>
            <p className="font-body-lg text-[16px] text-on-surface-variant max-w-3xl leading-relaxed">
              Chào mừng các vận động viên đến với ngày hội Pickleball lớn nhất mùa hè này. Cơ hội cọ xát với những tay vợt hàng đầu và nhận được những giải thưởng giá trị từ ban tổ chức.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Left Column: Detailed Info */}
            <div className="lg:col-span-2 space-y-stack-lg">
              
              <div className="p-6 rounded-xl border border-outline-variant/40" style={{ background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(12px)' }}>
                <h4 className="font-headline-md text-[20px] font-bold mb-4 flex items-center gap-2 text-on-surface">
                  <Gavel className="w-6 h-6 text-primary" />
                  Điều lệ giải đấu
                </h4>
                <div className="text-[14px] text-on-surface-variant space-y-3 leading-relaxed">
                  <p>• Đối tượng: Người chơi Pickleball mọi lứa tuổi, trình độ từ 3.0 đến 4.5.</p>
                  <p>• Thể thức thi đấu: Chia bảng đấu vòng tròn, lấy 2 đội đứng đầu vào vòng knock-out.</p>
                  <p>• Thời gian đăng ký: Từ 01/05 đến hết ngày 10/06/2026.</p>
                  <p>• Trang bị: Vận động viên tự chuẩn bị vợt, ban tổ chức cung cấp bóng thi đấu đạt chuẩn USAPA.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
                  <h4 className="text-[14px] font-bold text-primary uppercase tracking-wider mb-4">Lịch trình thi đấu</h4>
                  <ul className="space-y-4 text-[14px]">
                    <li className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                      <span className="font-bold text-on-surface shrink-0">Ngày 1:</span>
                      <span className="text-on-surface-variant">Khai mạc &amp; Thi đấu vòng bảng</span>
                    </li>
                    <li className="flex flex-col sm:flex-row gap-1 sm:gap-4">
                      <span className="font-bold text-on-surface shrink-0">Ngày 2:</span>
                      <span className="text-on-surface-variant">Bán kết, Chung kết &amp; Trao giải</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-primary/5 p-6 rounded-xl border border-primary/20">
                  <h4 className="text-[14px] font-bold text-primary uppercase tracking-wider mb-4">Cơ cấu giải thưởng</h4>
                  <ul className="space-y-2 text-on-surface-variant text-[14px]">
                    <li className="flex items-center gap-2"><span>🥇</span> Giải nhất: 10.000.000 VNĐ + Cúp</li>
                    <li className="flex items-center gap-2"><span>🥈</span> Giải nhì: 5.000.000 VNĐ + Huy chương</li>
                    <li className="flex items-center gap-2"><span>🥉</span> Giải ba: 2.000.000 VNĐ + Huy chương</li>
                  </ul>
                </div>
              </div>

              <div>
                <h4 className="font-headline-md text-[20px] font-bold mb-4 text-on-surface">Danh sách đội đã đăng ký</h4>
                <div className="overflow-hidden border border-outline-variant/60 rounded-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead className="bg-[#eff1e9] border-b border-outline-variant/60">
                        <tr>
                          <th className="px-6 py-4 text-[14px] font-bold text-on-surface-variant whitespace-nowrap">STT</th>
                          <th className="px-6 py-4 text-[14px] font-bold text-on-surface-variant whitespace-nowrap">Tên đội/Người chơi</th>
                          <th className="px-6 py-4 text-[14px] font-bold text-on-surface-variant whitespace-nowrap">Trình độ</th>
                          <th className="px-6 py-4 text-[14px] font-bold text-on-surface-variant whitespace-nowrap">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-outline-variant/30 text-[14px]">
                        <tr className="hover:bg-surface-container-lowest transition-colors bg-white">
                          <td className="px-6 py-4 text-on-surface font-medium">01</td>
                          <td className="px-6 py-4 text-on-surface font-semibold">Hà Nội Aces</td>
                          <td className="px-6 py-4 text-on-surface-variant">4.0 - 4.5</td>
                          <td className="px-6 py-4"><span className="text-primary font-medium text-[12px]">Đã duyệt</span></td>
                        </tr>
                        <tr className="hover:bg-surface-container-lowest transition-colors bg-white">
                          <td className="px-6 py-4 text-on-surface font-medium">02</td>
                          <td className="px-6 py-4 text-on-surface font-semibold">Pickle Power</td>
                          <td className="px-6 py-4 text-on-surface-variant">3.5 - 4.0</td>
                          <td className="px-6 py-4"><span className="text-primary font-medium text-[12px]">Đã duyệt</span></td>
                        </tr>
                        <tr className="hover:bg-surface-container-lowest transition-colors bg-white">
                          <td className="px-6 py-4 text-on-surface font-medium">03</td>
                          <td className="px-6 py-4 text-on-surface font-semibold">Saigon Smashers</td>
                          <td className="px-6 py-4 text-on-surface-variant">4.0+</td>
                          <td className="px-6 py-4"><span className="text-secondary font-medium text-[12px]">Đang chờ</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column: Registration Form */}
            <div className="lg:col-span-1">
              <div className="sticky top-[100px] bg-white border border-outline-variant/40 p-8 rounded-2xl shadow-sm">
                <h4 className="font-headline-md text-[20px] font-bold mb-6 text-on-surface">Đăng ký tham gia</h4>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Tên đội / Người đại diện</label>
                    <input 
                      type="text" 
                      placeholder="Nhập tên đội của bạn" 
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[14px]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Số điện thoại</label>
                    <input 
                      type="tel" 
                      placeholder="0xxx xxx xxx" 
                      className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[14px]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-semibold text-on-surface-variant mb-2">Trình độ trung bình</label>
                    <select className="w-full bg-white border border-outline-variant rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-[14px]">
                      <option>Dưới 3.0</option>
                      <option>3.0 - 3.5</option>
                      <option>3.5 - 4.0</option>
                      <option>Trên 4.0</option>
                    </select>
                  </div>
                  <div className="bg-surface-container-low p-4 rounded-xl mb-4 border border-outline-variant/20">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[14px] font-medium text-on-surface-variant">Phí tham dự:</span>
                      <span className="text-[18px] font-bold text-primary">500.000 VNĐ</span>
                    </div>
                    <p className="text-[12px] font-medium text-on-surface-variant mt-2 leading-relaxed">
                      Bao gồm nước uống, áo thi đấu và bảo hiểm.
                    </p>
                  </div>
                  <button 
                    type="submit" 
                    className="w-full py-4 mt-2 bg-primary text-on-primary font-bold text-[18px] rounded-xl hover:bg-surface-tint transition-all"
                  >
                    Xác nhận đăng ký
                  </button>
                  <p className="text-center text-[12px] font-medium text-on-surface-variant mt-4 leading-relaxed">
                    Bằng cách đăng ký, bạn đồng ý với Điều khoản thi đấu của Picklink.
                  </p>
                </form>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
};
