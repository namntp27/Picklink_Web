import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  HelpCircle,
  Image as ImageIcon,
  Map,
  MapPin,
  Plus,
  Settings,
  ShieldCheck,
  User,
} from 'lucide-react';

type CourtCreateDraft = {
  name: string;
  sportType: string;
  area: string;
  address: string;
  openingHours: string;
  manager: string;
  phone: string;
  basePrice: string;
  image: string;
  description: string;
  amenities: string;
  firstSubCourtName: string;
  firstSubCourtCount: string;
  surface: string;
  indoor: boolean;
};

const defaultImage =
  'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1200&auto=format&fit=crop';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export const OwnerCourtCreate = () => {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [draft, setDraft] = useState<CourtCreateDraft>({
    name: '',
    sportType: 'Pickleball',
    area: 'Cầu Giấy, Hà Nội',
    address: '',
    openingHours: '05:00 - 22:30',
    manager: 'Nguyễn Văn An',
    phone: '0901 234 567',
    basePrice: '220000',
    image: defaultImage,
    description: '',
    amenities: 'Đèn LED, Bãi xe, Phòng thay đồ, Cho thuê vợt',
    firstSubCourtName: 'PB',
    firstSubCourtCount: '4',
    surface: 'Acrylic',
    indoor: false,
  });

  const amenities = draft.amenities
    .split(/[\n,]+/)
    .map((amenity) => amenity.trim())
    .filter(Boolean);
  const subCourtCount = Number(draft.firstSubCourtCount) || 0;
  const basePrice = Number(draft.basePrice) || 0;

  const updateDraft = <K extends keyof CourtCreateDraft>(key: K, value: CourtCreateDraft[K]) => {
    setDraft((currentDraft) => ({ ...currentDraft, [key]: value }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(true);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-on-surface">
      <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-primary px-4 text-white shadow-md md:px-margin-desktop">
        <div className="flex items-center gap-4">
          <Link className="text-[24px] font-bold tracking-tight" to="/">
            Picklink
          </Link>
          <span className="hidden rounded-lg border border-white/20 px-3 py-1 text-[12px] font-bold text-white/86 md:inline-flex">
            Chủ sân
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link className="hidden rounded-lg bg-white/10 px-4 py-2 text-[14px] font-bold hover:bg-white/16 md:inline-flex" to="/owner">
            Lịch đặt sân
          </Link>
          <Link className="hidden rounded-lg bg-white px-4 py-2 text-[14px] font-bold text-primary md:inline-flex" to="/owner/courts">
            Sân & court
          </Link>
          <button aria-label="Thông báo chủ sân" className="rounded-lg p-2 hover:bg-white/10" type="button">
            <Bell className="h-5 w-5" />
          </button>
          <button aria-label="Trợ giúp" className="hidden rounded-lg p-2 hover:bg-white/10 sm:inline-flex" type="button">
            <HelpCircle className="h-5 w-5" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/12">
            <User className="h-5 w-5" />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 md:px-8">
        <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline" to="/owner/courts">
          <ArrowLeft className="h-4 w-4" />
          Quay lại quản lý sân
        </Link>

        <section className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h1 className="text-[28px] font-bold leading-tight md:text-[36px]">Thêm sân mới</h1>
              <p className="mt-2 max-w-3xl text-[15px] leading-6 text-on-surface-variant">
                Tạo cụm sân mới, khai báo thông tin vận hành và cấu hình số lượng sân con ban đầu.
              </p>

              {saved && (
                <div className="mt-5 flex items-start gap-3 rounded-lg border border-primary bg-[#eaf7df] p-4 text-primary">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                  <div>
                    <p className="text-[14px] font-bold">Đã lưu nháp sân mới.</p>
                    <p className="mt-1 text-[13px] leading-5">
                      Khi nối backend, thao tác này sẽ tạo cụm sân và chuyển về danh sách quản lý sân.
                    </p>
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <Map className="h-5 w-5 text-primary" />
                Thông tin cơ bản
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <label className="block lg:col-span-2">
                  <span className="text-[13px] font-bold text-on-surface-variant">Tên cụm sân</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('name', event.target.value)}
                    placeholder="Ví dụ: Pickleball Pro Tây Hồ"
                    type="text"
                    value={draft.name}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Loại sân</span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] outline-none focus:border-primary"
                    onChange={(event) => updateDraft('sportType', event.target.value)}
                    value={draft.sportType}
                  >
                    <option>Pickleball</option>
                    <option>Pickleball trong nhà</option>
                    <option>Tennis / Pickleball</option>
                    <option>Đa môn</option>
                  </select>
                </label>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Khu vực</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('area', event.target.value)}
                    type="text"
                    value={draft.area}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Địa chỉ chi tiết</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('address', event.target.value)}
                    placeholder="Số nhà, phường/xã, quận/huyện"
                    type="text"
                    value={draft.address}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Vận hành và giá
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Giờ mở cửa</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('openingHours', event.target.value)}
                    type="text"
                    value={draft.openingHours}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Giá cơ bản / giờ</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('basePrice', event.target.value)}
                    type="number"
                    value={draft.basePrice}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Người quản lý</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('manager', event.target.value)}
                    type="text"
                    value={draft.manager}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Số điện thoại</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('phone', event.target.value)}
                    type="tel"
                    value={draft.phone}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <ImageIcon className="h-5 w-5 text-primary" />
                Ảnh, mô tả và tiện ích
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">URL ảnh đại diện</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('image', event.target.value)}
                    type="url"
                    value={draft.image}
                  />
                </label>
                <div className="overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low">
                  <img alt="Xem trước sân mới" className="h-32 w-full object-cover" src={draft.image || defaultImage} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Mô tả sân</span>
                  <textarea
                    className="mt-2 min-h-28 w-full resize-none rounded-lg border border-outline-variant px-3 py-3 text-[14px] leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('description', event.target.value)}
                    placeholder="Mô tả vị trí, loại khách phù hợp, điểm nổi bật..."
                    value={draft.description}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Tiện ích</span>
                  <textarea
                    className="mt-2 min-h-28 w-full resize-none rounded-lg border border-outline-variant px-3 py-3 text-[14px] leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('amenities', event.target.value)}
                    value={draft.amenities}
                  />
                </label>
              </div>
            </section>

            <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <Plus className="h-5 w-5 text-primary" />
                Cấu hình sân con ban đầu
              </h2>
              <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-4">
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Tiền tố tên sân</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => updateDraft('firstSubCourtName', event.target.value)}
                    type="text"
                    value={draft.firstSubCourtName}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Số sân con</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    min="1"
                    onChange={(event) => updateDraft('firstSubCourtCount', event.target.value)}
                    type="number"
                    value={draft.firstSubCourtCount}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Mặt sân</span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] outline-none focus:border-primary"
                    onChange={(event) => updateDraft('surface', event.target.value)}
                    value={draft.surface}
                  >
                    <option>Acrylic</option>
                    <option>PU thể thao</option>
                    <option>Hard court</option>
                    <option>Sport tile</option>
                  </select>
                </label>
                <label className="mt-7 flex h-11 items-center gap-3 rounded-lg border border-outline-variant px-3 text-[13px] font-bold text-on-surface-variant">
                  <input
                    checked={draft.indoor}
                    className="h-4 w-4 accent-primary"
                    onChange={(event) => updateDraft('indoor', event.target.checked)}
                    type="checkbox"
                  />
                  Sân trong nhà
                </label>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                className="rounded-lg border border-outline-variant px-5 py-3 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container-low"
                onClick={() => navigate('/owner/courts')}
                type="button"
              >
                Hủy
              </button>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90" type="submit">
                <CheckCircle2 className="h-5 w-5" />
                Lưu sân mới
              </button>
            </div>
          </form>

          <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
            <section className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
              <div className="relative h-52">
                <img alt="Xem trước sân mới" className="absolute inset-0 h-full w-full object-cover" src={draft.image || defaultImage} />
                <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/86 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <span className="rounded-full bg-white/18 px-3 py-1 text-[12px] font-bold backdrop-blur">{draft.sportType}</span>
                  <h2 className="mt-3 text-[22px] font-bold leading-tight">{draft.name || 'Tên cụm sân mới'}</h2>
                  <p className="mt-1 text-[13px] text-white/80">{draft.area}</p>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-[12px] font-bold text-on-surface-variant">Giá từ</p>
                    <p className="mt-1 text-[16px] font-bold text-primary">{formatCurrency(basePrice)}</p>
                  </div>
                  <div className="rounded-lg bg-surface-container-low p-3">
                    <p className="text-[12px] font-bold text-on-surface-variant">Sân con</p>
                    <p className="mt-1 text-[16px] font-bold">{subCourtCount}</p>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {amenities.map((amenity) => (
                    <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold text-on-surface-variant" key={amenity}>
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-outline-variant bg-[#fff8e6] p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[18px] font-bold text-[#755400]">
                <MapPin className="h-5 w-5" />
                Sau khi tạo sân
              </h2>
              <div className="mt-4 space-y-3 text-[13px] leading-5 text-[#755400]">
                <p>Kiểm tra lại vị trí bản đồ và ảnh đại diện trước khi mở bán.</p>
                <p>Thiết lập bảng giá theo khung giờ ở bước quản lý giá sau khi sân được tạo.</p>
                <p>Sân con mới mặc định ở trạng thái đang mở, có thể đổi sang bảo trì trong danh sách sân.</p>
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};
