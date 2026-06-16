import React, { useState } from 'react';
import { 
  Filter, 
  MapPin, 
  Star, 
  LandPlot, 
  Clock 
} from 'lucide-react';

export const Opponents = () => {
  const [activeTab, setActiveTab] = useState<'players' | 'invites'>('players');

  return (
    <div className="flex-1 flex flex-col font-body-md overflow-x-hidden w-full bg-surface">
      {/* Hero Section */}
      <div className="bg-primary">
        <div className="h-[72px] w-full" />
      </div>
      <section className="bg-surface-container-low py-stack-lg border-b border-outline-variant">
        <div className="max-w-[1200px] mx-auto px-margin-mobile md:px-margin-desktop text-center">
          <h1 className="font-headline-xl text-[28px] md:text-headline-xl text-primary mb-2 font-bold">Tìm Đối Thủ & Nhóm Chơi Pickleball</h1>
          <p className="font-body-lg text-body-lg text-secondary max-w-2xl mx-auto">
            Kết nối với những người chơi cùng trình độ, tạo nên những trận đấu đầy kịch tính và thú vị.
          </p>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-[1200px] mx-auto py-stack-lg px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-12 gap-gutter w-full">
        {/* Left Column: Filters (25%) */}
        <aside className="md:col-span-3 space-y-stack-md shrink-0">
          {/* Filter Card */}
          <div className="bg-white p-6 rounded-xl border border-outline-variant shadow-sm">
            <div className="flex items-center gap-2 mb-4 text-primary">
              <Filter className="w-6 h-6" />
              <h3 className="font-headline-md text-[20px] font-bold">Bộ lọc tìm kiếm</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-bold">Khu vực</label>
                <select className="w-full rounded-lg border border-outline-variant px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary text-body-md font-body-md outline-none bg-white">
                  <option>Hà Nội</option>
                  <option>TP.HCM</option>
                  <option>Đà Nẵng</option>
                </select>
              </div>
              
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-bold">Trình độ</label>
                <select className="w-full rounded-lg border border-outline-variant px-3 py-2 focus:border-primary focus:ring-1 focus:ring-primary text-body-md font-body-md outline-none bg-white">
                  <option>Tất cả trình độ</option>
                  <option>1.0 - 2.5 (Người mới)</option>
                  <option>3.0 - 3.5 (Trung bình)</option>
                  <option>4.0 - 4.5 (Khá/Giỏi)</option>
                  <option>5.0+ (Chuyên nghiệp)</option>
                </select>
              </div>
              
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1 font-bold">Thời gian</label>
                <div className="grid grid-cols-1 gap-2">
                  <label className="flex items-center gap-2 text-body-md cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                    Sáng
                  </label>
                  <label className="flex items-center gap-2 text-body-md cursor-pointer">
                    <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                    Chiều
                  </label>
                  <label className="flex items-center gap-2 text-body-md cursor-pointer">
                    <input type="checkbox" className="rounded border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                    Tối
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-2 font-bold">Hình thức</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-body-md cursor-pointer">
                    <input type="radio" name="format" defaultChecked className="border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                    Đấu đơn 1vs1
                  </label>
                  <label className="flex items-center gap-2 text-body-md cursor-pointer">
                    <input type="radio" name="format" className="border-outline-variant text-primary focus:ring-primary w-4 h-4 cursor-pointer" />
                    Đấu đôi 2vs2
                  </label>
                </div>
              </div>
              
              <button className="w-full bg-primary text-on-primary py-3 rounded-lg font-bold hover:bg-surface-tint transition-colors mt-4">
                Áp dụng
              </button>
            </div>
          </div>
          
          {/* Quick Post Card */}
          <div className="bg-primary-container/10 p-6 rounded-xl border border-primary/20">
            <h3 className="font-headline-md text-[20px] font-bold text-primary mb-3">Đăng lời mời</h3>
            <p className="text-[12px] font-medium text-on-surface-variant mb-4 leading-relaxed">
              Bạn chưa tìm thấy trận đấu? Hãy tạo một lời mời mới ngay.
            </p>
            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="text" 
                placeholder="Tên sân..." 
                className="w-full px-3 py-2 rounded-lg border border-outline-variant text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <input 
                type="datetime-local" 
                className="w-full px-3 py-2 rounded-lg border border-outline-variant text-body-md font-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              />
              <button 
                type="submit" 
                className="w-full bg-white text-primary border border-primary font-bold py-2 rounded-lg hover:bg-primary hover:text-white transition-all"
              >
                Tạo lời mời
              </button>
            </form>
          </div>
        </aside>

        {/* Right Column: Tabs and Content (75%) */}
        <div className="md:col-span-9 shrink-0 flex-1 w-full min-w-0">
          {/* Tabs Navigation */}
          <div className="flex border-b border-outline-variant mb-gutter overflow-x-auto">
            <button 
              className={`px-6 md:px-8 py-4 font-bold text-[20px] transition-all whitespace-nowrap ${
                activeTab === 'players' 
                  ? 'border-b-4 border-primary text-primary' 
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => setActiveTab('players')}
            >
              Người chơi
            </button>
            <button 
              className={`px-6 md:px-8 py-4 font-bold text-[20px] transition-all whitespace-nowrap ${
                activeTab === 'invites' 
                  ? 'border-b-4 border-primary text-primary' 
                  : 'text-secondary hover:text-primary'
              }`}
              onClick={() => setActiveTab('invites')}
            >
              Lời mời đang chờ
            </button>
          </div>

          {/* Tab Content: Players Grid */}
          {activeTab === 'players' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-stack-md">
              {/* Player Card 1 */}
              <div className="bg-white rounded-xl border border-outline-variant p-5 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                    <img 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVPaFHDF1c_bM2MJselLBm0dVmfA2-P-0cVChIAGGlbbCXZ2GTrzAJW9S0c-ASCvau_fg2svCQBNh_0aKfts6XelZhyHlkXvUYO_Oog-HBYcqAl6TwhHersMLFlPuusHX9OQwus3_pyTl5PDorp5cfGUwWCrOeUzSYqf2SGvgUwT16HVBjngA0zVOutNrfi9EIp-7ftSxOWfFpKQHK4vuxUc7Twk52RobrFSvHc4lj3GnQZ5gZ0mhysCuY0rSFRka1ERj00Yj_LcZd" 
                      alt="Minh Tuấn" 
                    />
                  </div>
                  <h4 className="font-headline-md text-[20px] font-bold text-on-surface">Minh Tuấn</h4>
                  <div className="bg-primary-container/20 text-primary px-3 py-1 rounded-full text-[14px] font-semibold mt-2">
                    3.5 Intermediate
                  </div>
                  <div className="flex items-center gap-1 text-secondary mt-2">
                    <MapPin className="w-[18px] h-[18px]" />
                    <span className="text-[12px] font-medium">Cầu Giấy, Hà Nội</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[12px] font-medium border border-outline-variant/30">Cuối tuần</span>
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[12px] font-medium border border-outline-variant/30">Sáng sớm</span>
                  </div>
                  <p className="text-body-md font-body-md text-secondary mt-4 line-clamp-2 min-h-[48px]">
                    Đam mê pickleball, muốn giao lưu học hỏi với mọi người.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full mt-6">
                    <button className="bg-primary text-on-primary py-2 rounded-lg font-bold text-[14px] hover:bg-surface-tint transition-all">Mời chơi</button>
                    <button className="bg-surface border border-outline-variant text-on-surface-variant py-2 rounded-lg font-bold text-[14px] hover:bg-surface-variant transition-all">Hồ sơ</button>
                  </div>
                </div>
              </div>

              {/* Player Card 2 */}
              <div className="bg-white rounded-xl border border-outline-variant p-5 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                    <img 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuClUkwhba9rRmsiHGTVN1PjhFPCZkabGAAFjvBJfH6m2hHPZKa-xi7CaHI9WFsNyg7IvLYZ9nVPBV5FiXBgNTM99qPCbwAmGsmKvoAqus4ib1f0VqPZGuDsZnIIA9m5v8fFPVwT_nVbseCPcyhyRgLqlr9G1SAIW2VFOCbPEGRJ8S99mk77U9eQf-cufAoZhnIM2ihETQha49h78-JwN6tCIZ3yxcceibNII5Kh2AWoKHXKTeUO45grkDfr0x8uDSlC-cfBO4O9mCb7" 
                      alt="Hoàng Nam" 
                    />
                  </div>
                  <h4 className="font-headline-md text-[20px] font-bold text-on-surface">Hoàng Nam</h4>
                  <div className="bg-primary-container/20 text-primary px-3 py-1 rounded-full text-[14px] font-semibold mt-2">
                    4.0 Advanced
                  </div>
                  <div className="flex items-center gap-1 text-secondary mt-2">
                    <MapPin className="w-[18px] h-[18px]" />
                    <span className="text-[12px] font-medium">Quận 7, TP.HCM</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[12px] font-medium border border-outline-variant/30">Các buổi tối</span>
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[12px] font-medium border border-outline-variant/30">Trong tuần</span>
                  </div>
                  <p className="text-body-md font-body-md text-secondary mt-4 line-clamp-2 min-h-[48px]">
                    Tìm kiếm đối thủ cứng tay để tập luyện cho giải đấu sắp tới.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full mt-6">
                    <button className="bg-primary text-on-primary py-2 rounded-lg font-bold text-[14px] hover:bg-surface-tint transition-all">Mời chơi</button>
                    <button className="bg-surface border border-outline-variant text-on-surface-variant py-2 rounded-lg font-bold text-[14px] hover:bg-surface-variant transition-all">Hồ sơ</button>
                  </div>
                </div>
              </div>

              {/* Player Card 3 */}
              <div className="bg-white rounded-xl border border-outline-variant p-5 hover:shadow-lg transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4 border-4 border-primary/20">
                    <img 
                      className="w-full h-full object-cover" 
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMWbOBNZNFb4iDrtIViX2uU_YtxRnqlLxa3EqK55OZQk5eYqSSTqITfD4-i6vHkt-g2TEzFC7JjChIxAD37bM_m-iuJ6TaiYOyjJAsS-sc9BqIWvoGZHe07RQWsIjo0BVmYGY45j-bpOFLdAha2wURx1um0rllNj2m7zKfa39VJKtDDnRaZ_8Tl6MV3e8JDQjFFVYlmcLilBEGxUV-3lzPb85YdctOUmH4qDMe7fzV0VbSSnZuVaEWfngFMQi_ZlaNn-P6UgZLVnaS" 
                      alt="Lan Anh" 
                    />
                  </div>
                  <h4 className="font-headline-md text-[20px] font-bold text-on-surface">Lan Anh</h4>
                  <div className="bg-primary-container/20 text-primary px-3 py-1 rounded-full text-[14px] font-semibold mt-2">
                    3.0 Intermediate
                  </div>
                  <div className="flex items-center gap-1 text-secondary mt-2">
                    <MapPin className="w-[18px] h-[18px]" />
                    <span className="text-[12px] font-medium">Thanh Xuân, Hà Nội</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-1 mt-3">
                    <span className="bg-surface-variant text-on-surface-variant px-2 py-0.5 rounded text-[12px] font-medium border border-outline-variant/30">Chiều T7/CN</span>
                  </div>
                  <p className="text-body-md font-body-md text-secondary mt-4 line-clamp-2 min-h-[48px]">
                    Thích chơi đôi nữ hoặc đôi nam nữ. Vui vẻ, hòa đồng là chính.
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full mt-6">
                    <button className="bg-primary text-on-primary py-2 rounded-lg font-bold text-[14px] hover:bg-surface-tint transition-all">Mời chơi</button>
                    <button className="bg-surface border border-outline-variant text-on-surface-variant py-2 rounded-lg font-bold text-[14px] hover:bg-surface-variant transition-all">Hồ sơ</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content: Invites List */}
          {activeTab === 'invites' && (
            <div className="space-y-stack-md">
              {/* Invite Card 1 */}
              <div className="bg-white rounded-xl border border-outline-variant p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
                  <img 
                    className="w-16 h-16 rounded-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnAOrjW3rgCACayaK-eZ9iRbVYA_DKZ_Oue-09H6vWSloDPONbOFnfNEpuyh70ycnZX3SBYtdhV5zrEpl5qC095yUcdOibOSxGazJW_tzRcjgmSxyGjWtQjsJT7kCONWtILdIsItEEjDa8Y-T61-J8wlfQj_GXoa1Jc3Wf_xdLYN9wTdHMJjn1EDxVznz03sg2u1eEI4Wf1_OssxaCOcZjktBwvB0fefaZnNgQkTLkMaHfPZIHEPQRbB6sE4n_qWEgrf_B7b1uPH-M" 
                    alt="Host" 
                  />
                  <div>
                    <h4 className="font-headline-md text-[20px] font-bold text-on-surface">Trần Quốc Bảo</h4>
                    <p className="text-[12px] font-medium text-secondary flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-current text-primary" />
                      Trình độ: 3.5 - 4.0
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  <div>
                    <span className="text-[12px] font-medium text-on-surface-variant block mb-1">Sân chơi</span>
                    <span className="text-[14px] font-semibold flex items-start gap-1 leading-tight">
                      <LandPlot className="w-[18px] h-[18px] text-primary shrink-0 mt-[2px]" />
                      Pickleball Pro Duy Tân
                    </span>
                  </div>
                  <div>
                    <span className="text-[12px] font-medium text-on-surface-variant block mb-1">Thời gian</span>
                    <span className="text-[14px] font-semibold flex items-start gap-1 leading-tight">
                      <Clock className="w-[18px] h-[18px] text-primary shrink-0 mt-[2px]" />
                      18:00 - Thứ 5 (12/10)
                    </span>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <span className="text-[12px] font-medium text-on-surface-variant block mb-1">Vị trí trống</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-3 h-3 rounded-full bg-primary/80"></span>
                      <span className="w-3 h-3 rounded-full bg-primary/80"></span>
                      <span className="w-3 h-3 rounded-full bg-outline-variant/40"></span>
                      <span className="w-3 h-3 rounded-full bg-outline-variant/40"></span>
                      <span className="ml-2 font-medium text-[12px] text-on-surface-variant">Thiếu 2 người</span>
                    </div>
                  </div>
                </div>
                
                <button className="w-full md:w-auto px-10 py-3 bg-primary text-on-primary rounded-lg font-bold hover:bg-surface-tint transition-all whitespace-nowrap shrink-0 border border-transparent">
                  Tham gia
                </button>
              </div>

              {/* Invite Card 2 */}
              <div className="bg-white rounded-xl border border-outline-variant p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
                  <img 
                    className="w-16 h-16 rounded-full object-cover" 
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCy80Pr7PG-yOrBfCMHgfVg2x13-pMbDURproU1yc8PyZw9e6vN6nU64UkwBDmRUE5hb920r5OJx_kfP2ygKgpTY4J7O7FufJCFeuDKGUnhQ6-wkwpttbbXBYWDCrxoLHLbwzfdNUyXdNxptRnb9epb3p6nNoB9zRXlvPe93a90MlOYyvP_pIHxkBmJ2aS0NOdYy867f666ZCHM_pB9fRVYB3M_19x92qL74b91zs2Idb84uCwTgSo5WPL1Bm6F77koOlTC5iUg_FW8" 
                    alt="Host" 
                  />
                  <div>
                    <h4 className="font-headline-md text-[20px] font-bold text-on-surface">Lê Tuyết Mai</h4>
                    <p className="text-[12px] font-medium text-secondary flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-current text-primary" />
                      Trình độ: 2.5 - 3.0
                    </p>
                  </div>
                </div>
                
                <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                  <div>
                    <span className="text-[12px] font-medium text-on-surface-variant block mb-1">Sân chơi</span>
                    <span className="text-[14px] font-semibold flex items-start gap-1 leading-tight">
                      <LandPlot className="w-[18px] h-[18px] text-primary shrink-0 mt-[2px]" />
                      Sân Kỳ Hòa, Q.10
                    </span>
                  </div>
                  <div>
                    <span className="text-[12px] font-medium text-on-surface-variant block mb-1">Thời gian</span>
                    <span className="text-[14px] font-semibold flex items-start gap-1 leading-tight">
                      <Clock className="w-[18px] h-[18px] text-primary shrink-0 mt-[2px]" />
                      07:00 - Chủ Nhật (15/10)
                    </span>
                  </div>
                  <div className="col-span-2 lg:col-span-1">
                    <span className="text-[12px] font-medium text-on-surface-variant block mb-1">Vị trí trống</span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="w-3 h-3 rounded-full bg-primary/80"></span>
                      <span className="w-3 h-3 rounded-full bg-outline-variant/40"></span>
                      <span className="ml-2 font-medium text-[12px] text-on-surface-variant">Thiếu 1 người</span>
                    </div>
                  </div>
                </div>
                
                <button className="w-full md:w-auto px-10 py-3 bg-primary text-on-primary rounded-lg font-bold hover:bg-surface-tint transition-all whitespace-nowrap shrink-0 border border-transparent">
                  Tham gia
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

