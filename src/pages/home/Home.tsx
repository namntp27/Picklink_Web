import React from 'react';
import { Compass, Calendar, Clock, MapPin, Search, ArrowRight, Activity, Flame, Users, Zap, Network, Shield, Trophy } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col flex-1 pb-16">
      {/* Hero Banner */}
      <section className="relative md:pt-48 hero-gradient overflow-hidden pt-32">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-10 right-10 w-64 h-64 border-4 border-white rounded-full"></div>
          <div className="absolute bottom-[-50px] left-[-50px] w-96 h-96 border-[24px] border-white/20 rounded-full"></div>
        </div>
        <div className="relative z-10 max-w-container-max-width mx-auto px-margin-desktop text-center md:text-left text-on-primary">
          <h1 className="font-headline-xl text-headline-xl mb-6 max-w-3xl leading-tight">
            Kết nối cộng đồng Pickleball cùng Picklink
          </h1>
          <p className="font-body-lg text-body-lg mb-10 max-w-2xl text-on-primary/90">
            Tìm sân, đặt lịch, tham gia câu lạc bộ, tìm đối thủ và đăng ký giải đấu chỉ trong một nền tảng hiện đại và dễ dàng nhất.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start">
            <Link to="/book-court" className="bg-surface-container-lowest text-primary font-bold px-8 py-4 rounded-xl text-body-md shadow-lg flex items-center justify-center gap-2 hover:translate-y-[-2px] transition-all">
              Tìm sân ngay <Compass className="w-5 h-5" />
            </Link>
            <Link to="/tournaments" className="border-2 border-on-primary text-on-primary font-bold px-8 py-4 rounded-xl text-body-md hover:bg-on-primary/10 transition-all flex items-center justify-center">
              Khám phá giải đấu
            </Link>
          </div>
        </div>

        {/* Search Widget */}
        <div className="mx-auto w-full max-w-container-max-width px-margin-desktop relative mb-12 mt-12 z-40">
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="flex flex-col gap-2">
              <label className="font-label-md text-on-surface-variant flex items-center gap-2">
                <MapPin className="text-primary w-4 h-4" /> Chọn khu vực
              </label>
              <select className="w-full border-outline-variant rounded-lg p-3 text-body-md focus:ring-primary focus:border-primary border">
                <option>Hà Nội</option>
                <option>TP. Hồ Chí Minh</option>
                <option>Đà Nẵng</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
               <label className="font-label-md text-on-surface-variant flex items-center gap-2">
                 <Calendar className="text-primary w-4 h-4" /> Ngày chơi
               </label>
               <input className="w-full border-outline-variant rounded-lg p-3 text-body-md focus:ring-primary focus:border-primary border" type="date" />
            </div>
            <div className="flex flex-col gap-2">
               <label className="font-label-md text-on-surface-variant flex items-center gap-2">
                 <Clock className="text-primary w-4 h-4" /> Khung giờ
               </label>
               <select className="w-full border-outline-variant rounded-lg p-3 text-body-md focus:ring-primary focus:border-primary border">
                 <option>Sáng (06:00 - 12:00)</option>
                 <option>Chiều (12:00 - 18:00)</option>
                 <option>Tối (18:00 - 22:00)</option>
               </select>
            </div>
            <button onClick={() => navigate('/book-court')} className="bg-primary-container text-on-primary font-bold py-4 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-md hover:scale-105">
               Tìm kiếm <Search className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Featured Courts Section */}
      <section className="pt-32 pb-stack-lg bg-surface-container-low px-margin-desktop">
        <div className="max-w-container-max-width mx-auto">
          <div className="flex justify-between items-end mb-stack-lg">
            <div>
              <span className="text-primary font-bold text-label-sm uppercase tracking-widest">Sân tập hàng đầu</span>
              <h2 className="font-headline-lg text-headline-lg mt-2">Sân Pickleball nổi bật</h2>
            </div>
            <Link to="/book-court" className="text-primary font-bold flex items-center gap-1 hover:underline">
               Xem tất cả <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            {/* Card 1 */}
            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden hover:shadow-md transition-all group">
              <div className="relative h-48">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB0Qdw2Wmc_-W51c5ZoezQXI8dFBTxZg5wTzPgKauVrDI9FNgRvtd04Pgr-Q_Uom1Eqlz8mjN4fzoxj2VM9DWnQRjRF82hs4uQpBlWtKNhsZWlmXSZz1sobyvCLuz1PwuTKP9wLYkPdfn6zUG5ZXHXclJfxArhp5k3KUp0pZvcOzsL2qefgGju6XRJDOYYfSl3yZyJaaBL0z7OBxte0cyN0nQOqAH_Tmy6ZX1gZoHh-MRxhdFR6w3zl77fEcxuJlez1-ixxK8zTvBk-" alt="Sân Pickleball" />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[12px] font-bold text-primary">
                   Phổ biến
                </div>
              </div>
              <div className="p-5 flex flex-col gap-3">
                <h3 className="font-headline-md text-body-lg font-bold">Sân Pickleball Cầu Giấy</h3>
                <div className="flex items-center justify-between text-on-surface-variant text-[14px] font-semibold">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 2km</span>
                  <span className="text-primary font-bold">150.000đ/h</span>
                </div>
                <button className="w-full border border-primary text-primary font-bold py-2 rounded-lg hover:bg-primary hover:text-white transition-all">Đặt sân</button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden hover:shadow-md transition-all group">
              <div className="relative h-48">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMENrky29olry-WOw1suBc_m2BMckEAfiOk6u-pHO-DC1znwLqcbZyY7T6l2tE2D6E0CP3iurktwUDtIagWzKvCdzFyXKXLC5LNRjLKvv9LftTSv20zf-MBnjaffJKDmCbhSVIZVwJl8CIsLTU0fZFidDW0e5uuf3oomlC7M6YWmakT0IdFi8iS8smBS6Rh7xDTyfwkIFaMz-WH4jVaMfGxF16iGlxUM9V7_lGIvNIMmvh50a9EODXtgUmOtwkm9gTkxKFARvHiDG5" alt="Sân Pickleball" />
              </div>
              <div className="p-5 flex flex-col gap-3">
                <h3 className="font-headline-md text-body-lg font-bold">Pickleball Center Quận 1</h3>
                <div className="flex items-center justify-between text-on-surface-variant text-[14px] font-semibold">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 5.4km</span>
                  <span className="text-primary font-bold">200.000đ/h</span>
                </div>
                <button className="w-full border border-primary text-primary font-bold py-2 rounded-lg hover:bg-primary hover:text-white transition-all">Đặt sân</button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden hover:shadow-md transition-all group">
              <div className="relative h-48">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAQ__wr2AqzwI-e_CvZ1r-pZ7sC7ap_deQqmkqnaLvO-PugpHFI8TSyBnUVgF2hFYuEAUbpHYMw2HWDI-es2yjQUxUg7awHiLfZVjwiJk24Ppr0IFMVom-De5B6Qzs6M33NyARSiyAgI4HZjWMmklKmB-RdI1g-IGeUtKn9C2y6s5KQjOkNtHLXoZohYdUREt07P-alDBQP4strFeSFmXFdGe9nVZgmouxdocYskOOFoIBk--ueSvWixaIFBLa7E4B9qP1QclxWctFx" alt="Sân Pickleball" />
              </div>
              <div className="p-5 flex flex-col gap-3">
                <h3 className="font-headline-md text-body-lg font-bold">Sân Westlake Club</h3>
                <div className="flex items-center justify-between text-on-surface-variant text-[14px] font-semibold">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 1.2km</span>
                  <span className="text-primary font-bold">180.000đ/h</span>
                </div>
                <button className="w-full border border-primary text-primary font-bold py-2 rounded-lg hover:bg-primary hover:text-white transition-all">Đặt sân</button>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white rounded-xl border border-outline-variant overflow-hidden hover:shadow-md transition-all group">
              <div className="relative h-48">
                <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhNBoyqg4ux058JbthhhCf5oWz4Iz_fuEFvBV6R1tmJLVyEi7pQPdcfdAvB4m82pwbSxyVwQpOSEHpKxexl71bfc5Zx-Oq7KCjyUM1J6GDTCuckE2Gk4cCFIUyC_-02FL8wbz0Qr0nkKKhi1-LRZTkGrwd29KmfycgN72bn_qRgX-biTgOWW-0mYF8KCE9AtIXSQ48sxGwt6lCmFHTZvNPVn27FdFUi_puh3gp6PYeUFqlrILDzDYSCvKwnSlGpJUD_xBY7wnSeY9a" alt="Sân Pickleball" />
              </div>
              <div className="p-5 flex flex-col gap-3">
                <h3 className="font-headline-md text-body-lg font-bold">Sân Thể Thao Mỹ Đình</h3>
                <div className="flex items-center justify-between text-on-surface-variant text-[14px] font-semibold">
                  <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> 3.5km</span>
                  <span className="text-primary font-bold">120.000đ/h</span>
                </div>
                <button className="w-full border border-primary text-primary font-bold py-2 rounded-lg hover:bg-primary hover:text-white transition-all">Đặt sân</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tournaments Section */}
      <section className="py-stack-lg bg-white px-margin-desktop overflow-hidden">
        <div className="max-w-container-max-width mx-auto">
          <h2 className="font-headline-lg text-headline-lg mb-stack-lg text-center md:text-left">Giải đấu sắp diễn ra</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            {/* Tournament Card 1 */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] group cursor-pointer shadow-lg">
              <img className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCLdGuS7icP9FL_DoaxyJlD0VrbUbnC5lDSm03ye2Q8Qn3q-r2o9FcYKLuFwO0GuBjTkA07MPkviyig7xNVNq4-Masq7J9nlql2mwcR9_6wQXnf99LZWiD6bqmzAvwY4xHXgNnvyLgnmdZV3jK1UDrx6rUrFRa2--rtsq4H_EKMEyQ4nGbwmP039l56LsRanYlB4jaml8GmFAdsQ2zFaWJ5lSds6CUP9OUMUBWJqM3URfzEUE94BzJ85WDR6_fiRvbs8tr4CQ6TbWV7" alt="Tournament" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 text-white">
                <div className="bg-primary text-on-primary text-[12px] font-bold px-3 py-1 rounded-full mb-3 inline-block">
                  Hà Nội Open 2024
                </div>
                <h3 className="text-headline-md font-bold mb-2">Giải Vô Địch Miền Bắc</h3>
                <p className="text-[14px] font-semibold opacity-80 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 25/12/2024
                </p>
              </div>
            </div>

            {/* Tournament Card 2 */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] group cursor-pointer shadow-lg">
              <img className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpH19bFFlsN23aNwU7VQmfscEtba7KlewFcdiEo1sz-IMC9WCG7hhJtpGE9_WP2Gg38kxttaJ0dLy6yvgowupG2isVpZIfjTrgmUSKikfV8ya_kO6qlypAat2XpdI4jldLrtVPbOPYNCBekJrkh-ATBwcMn0l2LwXKtenZmqe3HMoJsUK8RwZ1q5NFMNljo2b4CM1hTwuiEOXVQKNaBl3VfVlbfCG5MllyrkDjuWgjLDZZZQYIvmqVWqj6Xo2qJEk8Bc_tLO5JHwzD" alt="Tournament" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 text-white">
                <div className="bg-primary text-on-primary text-[12px] font-bold px-3 py-1 rounded-full mb-3 inline-block">
                  Giao hữu
                </div>
                <h3 className="text-headline-md font-bold mb-2">Vietnam Smash 2024</h3>
                <p className="text-[14px] font-semibold opacity-80 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 05/01/2025
                </p>
              </div>
            </div>

            {/* Tournament Card 3 */}
            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] group cursor-pointer shadow-lg">
              <img className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD17f_r92JIFzxFVM4g9F-m7zehFn4jSPVkMLJ3DzoNbZYJrexLp2g7I3E7V_hgXzW20Q-6kBXitdFfDpJotZCMEYkRfP1G5DiSA4Ap_eTr61IGT8RDpMNCgAzHZUryPq0rbrul0HYBqiN8yo4LZVt5I4sWvLFCcz_ruiDmAzhDu4NVwmw_8xtmTfBTLIR-AgbN9KCapSJGDn_mf0lI6MzBHebfJ4vKbsYytRIc81on7EUOejkwGrnjbfGc7MwsaSgXhyRnbsek9pdt" alt="Tournament" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 text-white">
                <div className="bg-primary text-on-primary text-[12px] font-bold px-3 py-1 rounded-full mb-3 inline-block">
                  Chuyên nghiệp
                </div>
                <h3 className="text-headline-md font-bold mb-2">Saigon Master Cup</h3>
                <p className="text-[14px] font-semibold opacity-80 flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> 12/01/2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Clubs Section */}
      <section className="py-stack-lg bg-surface-container-low px-margin-desktop">
        <div className="max-w-container-max-width mx-auto">
          <h2 className="font-headline-lg text-headline-lg mb-stack-lg">Cộng đồng câu lạc bộ</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-white p-8 rounded-2xl border border-outline-variant hover:border-primary/40 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="font-headline-md text-headline-md mb-2">CLB Pickleball Hà Nội</h3>
              <p className="text-on-surface-variant text-[16px] leading-6 mb-6">Cộng đồng hơn 500 thành viên, sinh hoạt định kỳ hàng tuần tại khu vực Cầu Giấy.</p>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-primary">524 Thành viên</span>
                <Link to="/clubs" className="text-on-surface font-bold flex items-center gap-1 hover:text-primary transition-colors">Tham gia <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl border border-outline-variant hover:border-primary/40 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <Activity className="w-8 h-8" />
              </div>
              <h3 className="font-headline-md text-headline-md mb-2">CLB Sài Gòn Smash</h3>
              <p className="text-on-surface-variant text-[16px] leading-6 mb-6">Nơi hội tụ những tay vợt đam mê và kỹ thuật cao nhất tại TP. Hồ Chí Minh.</p>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-primary">312 Thành viên</span>
                <Link to="/clubs" className="text-on-surface font-bold flex items-center gap-1 hover:text-primary transition-colors">Tham gia <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-outline-variant hover:border-primary/40 transition-colors">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                <Flame className="w-8 h-8" />
              </div>
              <h3 className="font-headline-md text-headline-md mb-2">Pickleball Miền Tây</h3>
              <p className="text-on-surface-variant text-[16px] leading-6 mb-6">Câu lạc bộ mới nổi với nhiều hoạt động giao lưu sôi nổi và thân thiện.</p>
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold text-primary">185 Thành viên</span>
                <Link to="/clubs" className="text-on-surface font-bold flex items-center gap-1 hover:text-primary transition-colors">Tham gia <ArrowRight className="w-4 h-4" /></Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-white px-margin-desktop">
        <div className="max-w-container-max-width mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <Zap className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-headline-md text-body-lg">Đặt sân nhanh chóng</h4>
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <Network className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-headline-md text-body-lg">Kết nối người chơi</h4>
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <Shield className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-headline-md text-body-lg">Quản lý CLB</h4>
            </div>
            <div className="flex flex-col items-center gap-4 group">
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
                <Trophy className="w-10 h-10" />
              </div>
              <h4 className="font-bold text-headline-md text-body-lg">Tham gia giải đấu</h4>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
