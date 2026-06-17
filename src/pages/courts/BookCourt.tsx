import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  ChevronDown, 
  SlidersHorizontal, 
  Star, 
  CheckCircle, 
  CalendarOff, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Minus, 
  LocateFixed, 
  RefreshCcw, 
  Map 
} from 'lucide-react';

export const BookCourt = () => {
  const navigate = useNavigate();
  return (
    <div className="flex-1 flex flex-col md:flex-row pt-[72px] h-[100vh] overflow-hidden w-full bg-white">
      {/* Left Column: List & Filters (60%) */}
      <section className="w-full md:w-[60%] flex flex-col h-full bg-white border-r border-outline-variant">
        {/* Filter Bar */}
        <div className="p-6 bg-white border-b border-outline-variant shadow-sm z-10 shrink-0">
          <div className="flex flex-col gap-4">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-5 h-5" />
              <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none text-body-md" placeholder="Tìm theo tên sân" type="text" />
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[120px]">
                <select className="w-full appearance-none bg-surface-container-low border border-outline-variant px-4 py-2 rounded-lg text-label-md pr-10 focus:ring-2 focus:ring-primary outline-none">
                  <option>Hà Nội</option>
                  <option>Hồ Chí Minh</option>
                  <option>Đà Nẵng</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-5 h-5" />
              </div>
              <div className="relative flex-1 min-w-[120px]">
                <select className="w-full appearance-none bg-surface-container-low border border-outline-variant px-4 py-2 rounded-lg text-label-md pr-10 focus:ring-2 focus:ring-primary outline-none">
                  <option>Khoảng cách</option>
                  <option>&lt; 2km</option>
                  <option>&lt; 5km</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-5 h-5" />
              </div>
              <div className="relative flex-1 min-w-[120px]">
                <select className="w-full appearance-none bg-surface-container-low border border-outline-variant px-4 py-2 rounded-lg text-label-md pr-10 focus:ring-2 focus:ring-primary outline-none">
                  <option>Giá thuê</option>
                  <option>Dưới 100k</option>
                  <option>100k - 200k</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-5 h-5" />
              </div>
              <button className="flex items-center gap-2 bg-surface-container-high px-4 py-2 rounded-lg text-label-md font-bold text-on-surface hover:bg-surface-container-highest transition-colors">
                <SlidersHorizontal className="w-[18px] h-[18px]" />
                Lọc nâng cao
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Results Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-headline-md font-headline-md text-on-surface">Tìm thấy 12 sân Pickleball gần bạn</h2>
            <div className="flex items-center gap-2 text-[12px] font-medium text-outline">
              Sắp xếp: <span className="font-bold text-on-surface cursor-pointer">Gần nhất</span>
            </div>
          </div>

          {/* Court Cards Container */}
          <div className="space-y-4">
            {/* Card 1 */}
            <div className="flex flex-col lg:flex-row bg-white border border-outline-variant rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
              <div className="w-full lg:w-48 h-48 relative shrink-0">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5ndyiBzksZGcSrJaNEVWItqJLZxREdHcr_L6k_hcNkGMDc_M3M2SG8R0ZntXdC89b3IZ9lvq9c1sd3NWPibIyULS_V4YEbPO7ZG8hwD3IExb46dylBy0jqu3JU6IgBsJy9vnSmAPC-VN6ipTDh4GR725xK_W9613WXDvlYFOkVy3sZTq7D5EakBm5tWg1RhPm6Rw1j8224OhM0S-rWdF_RPkLMFSLIKMQvIAW-MxIMtalvErXVMwJlyvU2dZQ_j56m0KCZMWFzOs6" alt="Sân Pickleball Cầu Giấy" />
                <div className="absolute top-2 left-2 bg-primary-container text-on-primary text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Phổ biến</div>
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-headline-md font-headline-md text-on-surface leading-tight">Sân Pickleball Cầu Giấy</h3>
                    <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded">
                      <Star className="w-[18px] h-[18px] text-yellow-500 fill-current" />
                      <span className="text-label-md font-bold">4.8</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-outline text-[16px] mt-1">
                    <MapPin className="w-[18px] h-[18px]" />
                    Số 1 Duy Tân, Cầu Giấy, Hà Nội • 2.5 km
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="text-primary font-bold text-headline-md">150.000đ<span className="text-[12px] font-normal text-outline">/giờ</span></div>
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle className="w-[16px] h-[16px]" />
                      <span className="text-[12px] font-medium">Còn 3 sân trống vào giờ này</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => navigate('/court/1')} className="px-6 py-2 border border-outline-variant rounded-lg text-label-md font-bold text-on-surface hover:bg-surface-container transition-colors">Xem chi tiết</button>
                  <button onClick={() => navigate('/checkout')} className="px-6 py-2 bg-primary-container text-on-primary rounded-lg text-label-md font-bold hover:brightness-110 active:scale-95 transition-all">Đặt sân</button>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col lg:flex-row bg-white border border-outline-variant rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
              <div className="w-full lg:w-48 h-48 relative shrink-0">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBG6ng7l5Ka8XdqPVwe4OuashfTGBY6fWIbPW1T3l85rgKlXTGUt5Xq1Sooa2Nc4G1GOppFaedsbxbGy1QgLFuc4tTNpC3NXeQDR3c71ddUH_pTIhq4nJrXqaxSelnnwWLkAgoiR2K10KxkSGtq556-soMtjw0cDsikEkO8pn5G-9oHFmSl89eK1mr8axY03nJBL4Nxtrh_mKbwksB3sqbrOUFMZJ8p3OnyS0QzCOepys1D4Ptwk9xCBYomrYlwHXHPJ4Oceg6xMefv" alt="PickleHub Mỹ Đình" />
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-headline-md font-headline-md text-on-surface leading-tight">PickleHub Mỹ Đình</h3>
                    <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded">
                      <Star className="w-[18px] h-[18px] text-yellow-500 fill-current" />
                      <span className="text-label-md font-bold">4.9</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-outline text-[16px] mt-1">
                    <MapPin className="w-[18px] h-[18px]" />
                    KĐT Mỹ Đình 2, Nam Từ Liêm, Hà Nội • 3.2 km
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="text-primary font-bold text-headline-md">180.000đ<span className="text-[12px] font-normal text-outline">/giờ</span></div>
                    <div className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle className="w-[16px] h-[16px]" />
                      <span className="text-[12px] font-medium">Còn 5 sân trống</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => navigate('/court/2')} className="px-6 py-2 border border-outline-variant rounded-lg text-label-md font-bold text-on-surface hover:bg-surface-container transition-colors">Xem chi tiết</button>
                  <button onClick={() => navigate('/checkout')} className="px-6 py-2 bg-primary-container text-on-primary rounded-lg text-label-md font-bold hover:brightness-110 active:scale-95 transition-all">Đặt sân</button>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col lg:flex-row bg-white border border-outline-variant rounded-xl overflow-hidden hover:shadow-md transition-shadow group opacity-90">
              <div className="w-full lg:w-48 h-48 relative shrink-0">
                <img className="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3A9IARFpmrhTaQx4zEsw9-ZyfQtRaetxRJUh3zCUHB407ZnmlRtUkzjrjgbcTdAAD4tasVrmPssdCiSDGQ2ftdHy6RzmU74J71N3dAv_YxIuWPygHE6RD0uFpKwJt_obUOb2yu-gPBL6oLs1GlCn2-yV3BV8QSlBljWEpxfxux7gVvBqazyRWh91Tv-8UM02DGPpA3mIfQhklt_boKUEtKKnyR9mv0inorOXBQZcMrhR3a1TV1Rqpb3Cgqujlfb-z8chBrsFcBSFD" alt="Sân Tennis & Pickleball Ba Đình" />
              </div>
              <div className="flex-1 p-5 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h3 className="text-headline-md font-headline-md text-on-surface leading-tight">Sân Tennis & Pickleball Ba Đình</h3>
                    <div className="flex items-center gap-1 bg-surface-container-low px-2 py-1 rounded">
                      <Star className="w-[18px] h-[18px] text-yellow-500 fill-current" />
                      <span className="text-label-md font-bold">4.7</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-outline text-[16px] mt-1">
                    <MapPin className="w-[18px] h-[18px]" />
                    Số 12 Quần Ngựa, Ba Đình, Hà Nội • 4.5 km
                  </div>
                  <div className="mt-3 flex items-center gap-4">
                    <div className="text-primary font-bold text-headline-md">140.000đ<span className="text-[12px] font-normal text-outline">/giờ</span></div>
                    <div className="flex items-center gap-1 text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      <CalendarOff className="w-[16px] h-[16px]" />
                      <span className="text-[12px] font-medium">Chỉ còn 1 sân trống</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 mt-4">
                  <button onClick={() => navigate('/court/3')} className="px-6 py-2 border border-outline-variant rounded-lg text-label-md font-bold text-on-surface hover:bg-surface-container transition-colors">Xem chi tiết</button>
                  <button onClick={() => navigate('/checkout')} className="px-6 py-2 bg-primary-container text-on-primary rounded-lg text-label-md font-bold hover:brightness-110 active:scale-95 transition-all">Đặt sân</button>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-2 pt-8 pb-4">
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary-container text-on-primary font-bold">1</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors font-semibold">2</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors font-semibold">3</button>
            <span className="px-2 font-semibold text-outline">...</span>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors font-semibold">12</button>
            <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-outline-variant hover:bg-surface-container transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Right Column: Map View (40%) */}
      <section className="hidden md:block w-[40%] h-full relative bg-surface-container-low shrink-0">
        {/* Simulated Map Interface */}
        <div className="absolute inset-0 bg-[#e5e7eb] overflow-hidden">
          {/* Grid pattern for map look */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
          
          {/* Map Pins */}
          {/* Pin 1 */}
          <div className="absolute top-1/4 left-1/3 group cursor-pointer z-20">
            <div className="relative flex flex-col items-center">
              <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-outline-variant mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <p className="text-[12px] font-bold">Cầu Giấy • 150k</p>
              </div>
              <div className="w-8 h-8 bg-primary-container text-on-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white map-pin-pulse">
                <MapPin className="w-5 h-5 fill-current text-white" />
              </div>
            </div>
          </div>
          
          {/* Pin 2 */}
          <div className="absolute top-1/2 left-2/3 group cursor-pointer z-20">
            <div className="relative flex flex-col items-center">
              <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-outline-variant mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <p className="text-[12px] font-bold">Mỹ Đình • 180k</p>
              </div>
              <div className="w-8 h-8 bg-primary-container text-on-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin className="w-5 h-5 fill-current text-white" />
              </div>
            </div>
          </div>

          {/* Pin 3 */}
          <div className="absolute bottom-1/3 left-1/2 group cursor-pointer z-20">
            <div className="relative flex flex-col items-center">
              <div className="bg-white px-3 py-1.5 rounded-lg shadow-lg border border-outline-variant mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                <p className="text-[12px] font-bold">Ba Đình • 140k</p>
              </div>
              <div className="w-8 h-8 bg-primary-container text-on-primary rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <MapPin className="w-5 h-5 fill-current text-white" />
              </div>
            </div>
          </div>

          {/* Map Controls */}
          <div className="absolute bottom-6 right-6 flex flex-col gap-2">
            <button className="w-12 h-12 bg-white rounded-xl shadow-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors">
              <Plus className="w-6 h-6 text-on-surface" />
            </button>
            <button className="w-12 h-12 bg-white rounded-xl shadow-lg border border-outline-variant flex items-center justify-center hover:bg-surface-container transition-colors">
              <Minus className="w-6 h-6 text-on-surface" />
            </button>
            <button className="w-12 h-12 bg-white rounded-xl shadow-lg border border-outline-variant flex items-center justify-center text-primary hover:bg-surface-container transition-colors mt-4">
              <LocateFixed className="w-6 h-6" />
            </button>
          </div>

          {/* Search This Area Button */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2">
            <button className="bg-white px-6 py-3 rounded-full shadow-lg border border-outline-variant text-[14px] font-bold flex items-center gap-2 hover:bg-surface-container transition-colors">
              <RefreshCcw className="w-5 h-5" />
              Tìm ở khu vực này
            </button>
          </div>

          {/* Map Attribution */}
          <div className="absolute bottom-2 left-4 text-[10px] text-outline">
            © Google Maps Data 2024
          </div>
        </div>
      </section>

      {/* Map Toggle Mobile (Visible only on mobile) */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <button className="bg-primary text-on-primary px-6 py-3 rounded-full shadow-xl font-bold flex items-center gap-2 active:scale-95 transition-transform">
          <Map className="w-5 h-5" />
          Xem bản đồ
        </button>
      </div>
    </div>
  );
};
