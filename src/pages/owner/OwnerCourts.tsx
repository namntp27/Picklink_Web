import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Banknote,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit3,
  Eye,
  HelpCircle,
  Lock,
  Map,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  User,
  Users,
  Wrench,
} from 'lucide-react';

type CourtStatus = 'active' | 'maintenance' | 'closed';
type StatusFilter = 'all' | CourtStatus;

type SubCourt = {
  id: string;
  name: string;
  code: string;
  surface: string;
  indoor: boolean;
  lighting: string;
  status: CourtStatus;
  pricePerHour: number;
  nextMaintenance: string;
  note: string;
};

type CourtCluster = {
  id: string;
  name: string;
  sportType: string;
  area: string;
  address: string;
  openingHours: string;
  manager: string;
  phone: string;
  status: CourtStatus;
  basePrice: number;
  rating: number;
  amenities: string[];
  image: string;
  description: string;
  subCourts: SubCourt[];
};

type SubCourtDraft = {
  name: string;
  code: string;
  surface: string;
  pricePerHour: string;
  indoor: boolean;
};

const initialClusters: CourtCluster[] = [
  {
    id: 'duy-tan',
    name: 'Pickleball Pro Duy Tân',
    sportType: 'Pickleball',
    area: 'Cầu Giấy, Hà Nội',
    address: 'Số 1 Duy Tân, Phường Cầu Giấy',
    openingHours: '05:00 - 22:30',
    manager: 'Nguyễn Văn An',
    phone: '0901 234 567',
    status: 'active',
    basePrice: 220000,
    rating: 4.8,
    amenities: ['Đèn LED', 'Bãi xe', 'Phòng thay đồ', 'Cho thuê vợt'],
    image: 'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1000&auto=format&fit=crop',
    description: 'Cụm sân ngoài trời trung tâm Cầu Giấy, phù hợp đặt lẻ, ghép trận và tổ chức lớp kỹ thuật.',
    subCourts: [
      {
        id: 'dt-pb-1',
        name: 'PB 1',
        code: 'DT-PB1',
        surface: 'Acrylic',
        indoor: false,
        lighting: 'LED 600 lux',
        status: 'active',
        pricePerHour: 220000,
        nextMaintenance: '25/06/2026',
        note: 'Sân chính, ưu tiên khung giờ cao điểm.',
      },
      {
        id: 'dt-pb-2',
        name: 'PB 2',
        code: 'DT-PB2',
        surface: 'Acrylic',
        indoor: false,
        lighting: 'LED 600 lux',
        status: 'active',
        pricePerHour: 220000,
        nextMaintenance: '25/06/2026',
        note: 'Sân thường dùng cho ghép trận 2vs2.',
      },
      {
        id: 'dt-pb-3',
        name: 'PB 3',
        code: 'DT-PB3',
        surface: 'Acrylic',
        indoor: false,
        lighting: 'LED 500 lux',
        status: 'maintenance',
        pricePerHour: 200000,
        nextMaintenance: '18/06/2026',
        note: 'Đang kiểm tra lưới và vạch biên.',
      },
      {
        id: 'dt-pb-4',
        name: 'PB 4',
        code: 'DT-PB4',
        surface: 'Acrylic',
        indoor: false,
        lighting: 'LED 600 lux',
        status: 'active',
        pricePerHour: 240000,
        nextMaintenance: '30/06/2026',
        note: 'Sân gần khu check-in.',
      },
    ],
  },
  {
    id: 'indoor-premium',
    name: 'Indoor Premium Mỹ Đình',
    sportType: 'Pickleball trong nhà',
    area: 'Nam Từ Liêm, Hà Nội',
    address: 'KĐT Mỹ Đình 2, Nam Từ Liêm',
    openingHours: '06:00 - 23:00',
    manager: 'Trần Minh Huy',
    phone: '0918 888 222',
    status: 'active',
    basePrice: 280000,
    rating: 4.9,
    amenities: ['Điều hòa', 'Đèn thi đấu', 'Cafe', 'Tủ đồ'],
    image: 'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=1000&auto=format&fit=crop',
    description: 'Cụm sân trong nhà cho giải đấu, lớp học và khách đặt lịch cố định.',
    subCourts: [
      {
        id: 'md-in-1',
        name: 'Indoor 1',
        code: 'MD-IN1',
        surface: 'PU thể thao',
        indoor: true,
        lighting: 'LED thi đấu',
        status: 'active',
        pricePerHour: 300000,
        nextMaintenance: '28/06/2026',
        note: 'Sân dành cho livestream giải đấu.',
      },
      {
        id: 'md-in-2',
        name: 'Indoor 2',
        code: 'MD-IN2',
        surface: 'PU thể thao',
        indoor: true,
        lighting: 'LED thi đấu',
        status: 'active',
        pricePerHour: 280000,
        nextMaintenance: '28/06/2026',
        note: 'Sân tập lớp beginner.',
      },
      {
        id: 'md-in-3',
        name: 'Indoor 3',
        code: 'MD-IN3',
        surface: 'PU thể thao',
        indoor: true,
        lighting: 'LED 700 lux',
        status: 'closed',
        pricePerHour: 260000,
        nextMaintenance: '20/06/2026',
        note: 'Tạm đóng để thay thảm chống trượt.',
      },
    ],
  },
  {
    id: 'ba-dinh',
    name: 'Tennis & Pickleball Ba Đình',
    sportType: 'Tennis / Pickleball',
    area: 'Ba Đình, Hà Nội',
    address: 'Số 12 Quần Ngựa, Ba Đình',
    openingHours: '05:30 - 21:30',
    manager: 'Lê Thu Hà',
    phone: '0987 444 111',
    status: 'maintenance',
    basePrice: 180000,
    rating: 4.6,
    amenities: ['Bãi xe', 'Nước uống', 'Huấn luyện viên'],
    image: 'https://images.unsplash.com/photo-1642501518638-6f9d6e40496d?q=80&w=1000&auto=format&fit=crop',
    description: 'Cụm sân hỗn hợp tennis và pickleball, đang nâng cấp một phần mặt sân.',
    subCourts: [
      {
        id: 'bd-pb-1',
        name: 'Pickleball 1',
        code: 'BD-PB1',
        surface: 'Acrylic',
        indoor: false,
        lighting: 'LED 500 lux',
        status: 'active',
        pricePerHour: 180000,
        nextMaintenance: '27/06/2026',
        note: 'Sân mở cho khách đặt lẻ.',
      },
      {
        id: 'bd-tn-1',
        name: 'Tennis 1',
        code: 'BD-TN1',
        surface: 'Hard court',
        indoor: false,
        lighting: 'LED 500 lux',
        status: 'maintenance',
        pricePerHour: 260000,
        nextMaintenance: '19/06/2026',
        note: 'Đang xử lý vết nứt mặt sân.',
      },
    ],
  },
];

const statusOptions: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đang mở', value: 'active' },
  { label: 'Bảo trì', value: 'maintenance' },
  { label: 'Tạm đóng', value: 'closed' },
];

const statusConfig: Record<CourtStatus, { label: string; className: string; icon: React.ElementType }> = {
  active: {
    label: 'Đang mở',
    className: 'bg-[#eaf7df] text-primary',
    icon: CheckCircle2,
  },
  maintenance: {
    label: 'Bảo trì',
    className: 'bg-[#fff4d8] text-[#755400]',
    icon: Wrench,
  },
  closed: {
    label: 'Tạm đóng',
    className: 'bg-[#ffdad6] text-[#ba1a1a]',
    icon: Lock,
  },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const makeSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const OwnerCourts = () => {
  const [clusters, setClusters] = useState(initialClusters);
  const [activeClusterId, setActiveClusterId] = useState(initialClusters[0].id);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [subCourtDraft, setSubCourtDraft] = useState<SubCourtDraft>({
    name: '',
    code: '',
    surface: 'Acrylic',
    pricePerHour: '220000',
    indoor: false,
  });

  const allSubCourts = clusters.flatMap((cluster) => cluster.subCourts);
  const activeSubCourts = allSubCourts.filter((court) => court.status === 'active');
  const maintenanceSubCourts = allSubCourts.filter((court) => court.status === 'maintenance');
  const activeCluster = clusters.find((cluster) => cluster.id === activeClusterId) ?? clusters[0];

  const filteredClusters = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return clusters.filter((cluster) => {
      const matchesKeyword =
        !keyword ||
        cluster.name.toLowerCase().includes(keyword) ||
        cluster.area.toLowerCase().includes(keyword) ||
        cluster.address.toLowerCase().includes(keyword) ||
        cluster.sportType.toLowerCase().includes(keyword);
      const matchesStatus = statusFilter === 'all' || cluster.status === statusFilter;

      return matchesKeyword && matchesStatus;
    });
  }, [clusters, searchTerm, statusFilter]);

  const setClusterStatus = (clusterId: string, status: CourtStatus) => {
    setClusters((currentClusters) =>
      currentClusters.map((cluster) =>
        cluster.id === clusterId
          ? {
              ...cluster,
              status,
            }
          : cluster,
      ),
    );
  };

  const setSubCourtStatus = (clusterId: string, subCourtId: string, status: CourtStatus) => {
    setClusters((currentClusters) =>
      currentClusters.map((cluster) =>
        cluster.id === clusterId
          ? {
              ...cluster,
              subCourts: cluster.subCourts.map((subCourt) =>
                subCourt.id === subCourtId
                  ? {
                      ...subCourt,
                      status,
                    }
                  : subCourt,
              ),
            }
          : cluster,
      ),
    );
  };

  const addSubCourt = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = subCourtDraft.name.trim();
    const code = subCourtDraft.code.trim() || `${activeCluster.name.slice(0, 2).toUpperCase()}-${activeCluster.subCourts.length + 1}`;

    if (!name) {
      return;
    }

    const newSubCourt: SubCourt = {
      id: `${activeCluster.id}-${makeSlug(name)}-${Date.now()}`,
      name,
      code,
      surface: subCourtDraft.surface,
      indoor: subCourtDraft.indoor,
      lighting: subCourtDraft.indoor ? 'LED trong nhà' : 'LED ngoài trời',
      status: 'active',
      pricePerHour: Number(subCourtDraft.pricePerHour) || activeCluster.basePrice,
      nextMaintenance: '30/06/2026',
      note: 'Sân mới thêm, cần kiểm tra lịch vận hành trước khi mở bán đại trà.',
    };

    setClusters((currentClusters) =>
      currentClusters.map((cluster) =>
        cluster.id === activeCluster.id
          ? {
              ...cluster,
              subCourts: [...cluster.subCourts, newSubCourt],
            }
          : cluster,
      ),
    );
    setSubCourtDraft({
      name: '',
      code: '',
      surface: 'Acrylic',
      pricePerHour: activeCluster.basePrice.toString(),
      indoor: false,
    });
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
          <Link className="hidden rounded-lg bg-white/10 px-4 py-2 text-[14px] font-bold hover:bg-white/16 md:inline-flex" to="/owner/bookings">
            Đơn đặt sân
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

      <div className="flex min-w-0">
        <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 shrink-0 border-r border-outline-variant bg-white p-4 md:block">
          <div className="mb-6 px-2 pt-2">
            <h2 className="text-[20px] font-bold text-primary">Picklink Admin</h2>
            <p className="mt-1 text-[12px] font-medium text-on-surface-variant">Quản lý vận hành sân</p>
          </div>

          <nav className="space-y-1">
            {[
              { label: 'Lịch đặt sân', icon: CalendarDays, to: '/owner', active: false },
              { label: 'Đơn đặt sân', icon: CreditCard, to: '/owner/bookings', active: false },
              { label: 'Sân & court', icon: Map, to: '/owner/courts', active: true },
              { label: 'Doanh thu', icon: Banknote, to: '/owner/revenue' },
              { label: 'Cài đặt', icon: Settings, to: '/owner' },
            ].map((item) => (
              <Link
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-bold transition-colors ${
                  item.active ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'
                }`}
                key={item.label}
                to={item.to}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8">
          <div className="mx-auto max-w-[1320px] space-y-6">
            <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary">
                  <Map className="h-4 w-4" />
                  Quản lý cụm sân và sân con
                </p>
                <h1 className="mt-3 text-[30px] font-bold leading-tight md:text-[40px]">Sân & court</h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-6 text-on-surface-variant">
                  Quản lý thông tin cụm sân, số lượng sân con, trạng thái mở bán, lịch bảo trì, tiện ích và giá theo từng sân.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
                  to={`/owner/courts/${activeCluster.id}/edit`}
                >
                  <Edit3 className="h-5 w-5" />
                  Sửa thông tin
                </Link>
                <Link
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                  to="/owner/courts/create"
                >
                  <Plus className="h-5 w-5" />
                  Thêm cụm sân
                </Link>
              </div>
            </section>

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Cụm sân', value: clusters.length, icon: Map, helper: `${allSubCourts.length} sân con đang quản lý` },
                { label: 'Sân đang mở', value: activeSubCourts.length, icon: CheckCircle2, helper: 'Có thể nhận đặt lịch' },
                { label: 'Cần bảo trì', value: maintenanceSubCourts.length, icon: Wrench, helper: 'Nên xử lý trước giờ cao điểm' },
                { label: 'Giá trung bình', value: formatCurrency(Math.round(allSubCourts.reduce((total, court) => total + court.pricePerHour, 0) / allSubCourts.length)), icon: Banknote, helper: 'Theo mỗi giờ đặt sân' },
              ].map((stat) => (
                <div className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm" key={stat.label}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-[13px] font-bold text-on-surface-variant">{stat.label}</p>
                      <p className="mt-2 text-[28px] font-bold leading-tight text-on-surface">{stat.value}</p>
                    </div>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                  <p className="mt-3 text-[12px] font-medium text-on-surface-variant">{stat.helper}</p>
                </div>
              ))}
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-[390px_minmax(0,1fr)]">
              <aside className="space-y-6 xl:sticky xl:top-20 xl:self-start">
                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <h2 className="text-[20px] font-bold">Danh sách cụm sân</h2>
                  <div className="relative mt-4">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                    <input
                      className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Tìm cụm sân, địa chỉ..."
                      type="text"
                      value={searchTerm}
                    />
                  </div>

                  <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                    {statusOptions.map((option) => (
                      <button
                        className={`h-9 shrink-0 rounded-lg px-3 text-[13px] font-bold transition-colors ${
                          statusFilter === option.value
                            ? 'bg-primary text-white'
                            : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                        key={option.value}
                        onClick={() => setStatusFilter(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="custom-scrollbar mt-4 max-h-[520px] space-y-3 overflow-y-auto pr-1">
                    {filteredClusters.map((cluster) => {
                      const isActive = cluster.id === activeCluster.id;
                      const StatusIcon = statusConfig[cluster.status].icon;

                      return (
                        <button
                          className={`w-full rounded-lg border p-3 text-left transition-colors ${
                            isActive
                              ? 'border-primary bg-primary/10'
                              : 'border-outline-variant bg-white hover:border-primary hover:bg-surface-container-low'
                          }`}
                          key={cluster.id}
                          onClick={() => setActiveClusterId(cluster.id)}
                          type="button"
                        >
                          <div className="flex gap-3">
                            <img alt={cluster.name} className="h-16 w-20 shrink-0 rounded-lg object-cover" src={cluster.image} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h3 className="line-clamp-2 text-[14px] font-bold">{cluster.name}</h3>
                                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${statusConfig[cluster.status].className}`}>
                                  <StatusIcon className="h-3 w-3" />
                                  {statusConfig[cluster.status].label}
                                </span>
                              </div>
                              <p className="mt-1 truncate text-[12px] font-medium text-on-surface-variant">{cluster.area}</p>
                              <p className="mt-2 text-[12px] font-bold text-primary">
                                {cluster.subCourts.length} sân con · từ {formatCurrency(cluster.basePrice)}/giờ
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section className="rounded-lg border border-primary bg-white p-5 shadow-sm">
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <Plus className="h-5 w-5 text-primary" />
                    Thêm sân mới
                  </h2>
                  <p className="mt-2 text-[13px] leading-5 text-on-surface-variant">
                    Tạo cụm sân mới ở màn riêng để nhập đầy đủ địa chỉ, ảnh, tiện ích và cấu hình sân con ban đầu.
                  </p>
                  <Link
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                    to="/owner/courts/create"
                  >
                    <Plus className="h-5 w-5" />
                    Đi tới thêm sân
                  </Link>
                </section>
              </aside>

              <div className="min-w-0 space-y-6">
                <section className="overflow-hidden rounded-lg border border-outline-variant bg-white shadow-sm">
                  <div className="relative min-h-[280px]">
                    <img alt={activeCluster.name} className="absolute inset-0 h-full w-full object-cover" src={activeCluster.image} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/90 via-[#101820]/50 to-[#101820]/10" />
                    <div className="relative z-10 flex min-h-[280px] flex-col justify-end p-5 text-white md:p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                          <div className="mb-3 flex flex-wrap gap-2">
                            <span className="rounded-full bg-white/16 px-3 py-1 text-[12px] font-bold backdrop-blur">{activeCluster.sportType}</span>
                            <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${statusConfig[activeCluster.status].className}`}>
                              {statusConfig[activeCluster.status].label}
                            </span>
                          </div>
                          <h2 className="max-w-3xl text-[28px] font-bold leading-tight md:text-[36px]">{activeCluster.name}</h2>
                          <p className="mt-3 max-w-2xl text-[14px] leading-6 text-white/84">{activeCluster.description}</p>
                        </div>
                        <div className="grid grid-cols-3 gap-2 rounded-lg border border-white/20 bg-white/12 p-3 backdrop-blur">
                          <div>
                            <p className="text-[11px] font-bold uppercase text-white/70">Sân con</p>
                            <p className="mt-1 text-[22px] font-bold">{activeCluster.subCourts.length}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase text-white/70">Đánh giá</p>
                            <p className="mt-1 text-[22px] font-bold">{activeCluster.rating || '-'}</p>
                          </div>
                          <div>
                            <p className="text-[11px] font-bold uppercase text-white/70">Giá từ</p>
                            <p className="mt-1 text-[18px] font-bold">{formatCurrency(activeCluster.basePrice)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 border-t border-outline-variant p-5 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      { label: 'Khu vực', value: activeCluster.area, icon: MapPin },
                      { label: 'Giờ mở cửa', value: activeCluster.openingHours, icon: Clock },
                      { label: 'Quản lý', value: activeCluster.manager, icon: User },
                      { label: 'Liên hệ', value: activeCluster.phone, icon: ShieldCheck },
                    ].map((item) => (
                      <div className="rounded-lg bg-surface-container-low p-4" key={item.label}>
                        <item.icon className="h-5 w-5 text-primary" />
                        <p className="mt-3 text-[12px] font-bold uppercase text-on-surface-variant">{item.label}</p>
                        <p className="mt-1 text-[14px] font-bold">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-[20px] font-bold">Trạng thái cụm sân</h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">Đổi trạng thái cụm sân sẽ giúp đội vận hành biết sân có nhận đặt mới hay không.</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {(['active', 'maintenance', 'closed'] as CourtStatus[]).map((status) => (
                        <button
                          className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-bold ${
                            activeCluster.status === status
                              ? 'bg-primary text-white'
                              : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                          }`}
                          key={status}
                          onClick={() => setClusterStatus(activeCluster.id, status)}
                          type="button"
                        >
                          {React.createElement(statusConfig[status].icon, { className: 'h-4 w-4' })}
                          {statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="flex items-center gap-2 text-[20px] font-bold">
                        <Edit3 className="h-5 w-5 text-primary" />
                        Sửa thông tin sân
                      </h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">
                        Cập nhật ảnh, tiện ích, địa chỉ và thông tin vận hành ở màn chỉnh sửa riêng.
                      </p>
                    </div>
                    <Link
                      className="inline-flex w-fit items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
                      to={`/owner/courts/${activeCluster.id}/edit`}
                    >
                      <Edit3 className="h-5 w-5" />
                      Sửa {activeCluster.name}
                    </Link>
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
                  <div className="rounded-lg border border-outline-variant bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-4 border-b border-outline-variant p-5">
                      <div>
                        <h2 className="text-[20px] font-bold">Danh sách sân con</h2>
                        <p className="mt-1 text-[13px] text-on-surface-variant">Quản lý từng court, giá riêng và trạng thái bảo trì.</p>
                      </div>
                      <button className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low" type="button">
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[900px] text-left">
                        <thead className="bg-surface-container-low">
                          <tr>
                            <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Sân con</th>
                            <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Mặt sân</th>
                            <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Giá/giờ</th>
                            <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Bảo trì</th>
                            <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Trạng thái</th>
                            <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Thao tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-outline-variant">
                          {activeCluster.subCourts.map((subCourt) => (
                            <tr className="hover:bg-[#f9f9ff]" key={subCourt.id}>
                              <td className="px-5 py-4">
                                <p className="text-[14px] font-bold">{subCourt.name}</p>
                                <p className="text-[12px] font-medium text-on-surface-variant">
                                  {subCourt.code} · {subCourt.indoor ? 'Trong nhà' : 'Ngoài trời'}
                                </p>
                                <p className="mt-1 max-w-[280px] text-[12px] leading-5 text-on-surface-variant">{subCourt.note}</p>
                              </td>
                              <td className="px-5 py-4">
                                <p className="text-[14px] font-bold">{subCourt.surface}</p>
                                <p className="text-[12px] text-on-surface-variant">{subCourt.lighting}</p>
                              </td>
                              <td className="px-5 py-4 text-[14px] font-bold text-primary">{formatCurrency(subCourt.pricePerHour)}</td>
                              <td className="px-5 py-4 text-[14px] font-medium">{subCourt.nextMaintenance}</td>
                              <td className="px-5 py-4">
                                <select
                                  className="h-10 rounded-lg border border-outline-variant bg-white px-3 text-[13px] font-bold outline-none focus:border-primary"
                                  onChange={(event) => setSubCourtStatus(activeCluster.id, subCourt.id, event.target.value as CourtStatus)}
                                  value={subCourt.status}
                                >
                                  <option value="active">Đang mở</option>
                                  <option value="maintenance">Bảo trì</option>
                                  <option value="closed">Tạm đóng</option>
                                </select>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex gap-2">
                                  <button aria-label="Xem sân con" className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low" type="button">
                                    <Eye className="h-4 w-4" />
                                  </button>
                                  <Link
                                    aria-label="Sửa cụm sân"
                                    className="rounded-lg border border-outline-variant p-2 text-on-surface-variant hover:bg-surface-container-low"
                                    to={`/owner/courts/${activeCluster.id}/edit`}
                                  >
                                    <Edit3 className="h-4 w-4" />
                                  </Link>
                                  <button aria-label="Xóa sân con" className="rounded-lg border border-outline-variant p-2 text-[#ba1a1a] hover:bg-[#ffdad6]/50" type="button">
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <aside className="space-y-6">
                    <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                      <h2 className="flex items-center gap-2 text-[20px] font-bold">
                        <Plus className="h-5 w-5 text-primary" />
                        Thêm sân con
                      </h2>
                      <form className="mt-4 space-y-4" onSubmit={addSubCourt}>
                        <label className="block">
                          <span className="text-[13px] font-bold text-on-surface-variant">Tên sân con</span>
                          <input
                            className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            onChange={(event) => setSubCourtDraft((draft) => ({ ...draft, name: event.target.value }))}
                            placeholder="Ví dụ: PB 5"
                            type="text"
                            value={subCourtDraft.name}
                          />
                        </label>
                        <label className="block">
                          <span className="text-[13px] font-bold text-on-surface-variant">Mã sân</span>
                          <input
                            className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                            onChange={(event) => setSubCourtDraft((draft) => ({ ...draft, code: event.target.value }))}
                            placeholder="Tự tạo nếu để trống"
                            type="text"
                            value={subCourtDraft.code}
                          />
                        </label>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1">
                          <label className="block">
                            <span className="text-[13px] font-bold text-on-surface-variant">Mặt sân</span>
                            <select
                              className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] outline-none focus:border-primary"
                              onChange={(event) => setSubCourtDraft((draft) => ({ ...draft, surface: event.target.value }))}
                              value={subCourtDraft.surface}
                            >
                              <option>Acrylic</option>
                              <option>PU thể thao</option>
                              <option>Hard court</option>
                              <option>Sport tile</option>
                            </select>
                          </label>
                          <label className="block">
                            <span className="text-[13px] font-bold text-on-surface-variant">Giá/giờ</span>
                            <input
                              className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                              onChange={(event) => setSubCourtDraft((draft) => ({ ...draft, pricePerHour: event.target.value }))}
                              type="number"
                              value={subCourtDraft.pricePerHour}
                            />
                          </label>
                        </div>
                        <label className="flex items-center gap-3 rounded-lg border border-outline-variant p-3 text-[13px] font-bold text-on-surface-variant">
                          <input
                            checked={subCourtDraft.indoor}
                            className="h-4 w-4 accent-primary"
                            onChange={(event) => setSubCourtDraft((draft) => ({ ...draft, indoor: event.target.checked }))}
                            type="checkbox"
                          />
                          Sân trong nhà
                        </label>
                        <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90" type="submit">
                          <Plus className="h-5 w-5" />
                          Thêm sân con
                        </button>
                      </form>
                    </section>

                    <section className="rounded-lg border border-outline-variant bg-[#fff8e6] p-5 shadow-sm">
                      <h2 className="flex items-center gap-2 text-[18px] font-bold text-[#755400]">
                        <AlertCircle className="h-5 w-5" />
                        Gợi ý vận hành
                      </h2>
                      <div className="mt-4 space-y-3 text-[13px] leading-5 text-[#755400]">
                        <p>Đổi sân con sang trạng thái bảo trì trước khi khóa lịch trong bảng lịch sân.</p>
                        <p>Giá từng sân con nên khớp với bảng giá theo khung giờ để tránh sai lệch khi thanh toán.</p>
                        <p>Cập nhật ảnh và tiện ích giúp người chơi chọn sân nhanh hơn.</p>
                      </div>
                    </section>
                  </aside>
                </section>

                <section className="rounded-lg border border-outline-variant bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h2 className="text-[20px] font-bold">Tiện ích cụm sân</h2>
                      <p className="mt-1 text-[13px] text-on-surface-variant">Những tiện ích này sẽ hiển thị ở trang chi tiết sân cho người chơi.</p>
                    </div>
                    <Link
                      className="rounded-lg border border-outline-variant px-4 py-2 text-[13px] font-bold hover:bg-surface-container-low"
                      to={`/owner/courts/${activeCluster.id}/edit`}
                    >
                      Sửa tiện ích
                    </Link>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {activeCluster.amenities.map((amenity) => (
                      <span className="rounded-full bg-surface-container-low px-3 py-2 text-[13px] font-bold text-on-surface-variant" key={amenity}>
                        {amenity}
                      </span>
                    ))}
                  </div>
                </section>
              </div>
            </section>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-50 grid h-16 grid-cols-5 border-t border-outline-variant bg-white md:hidden">
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner">
          <CalendarDays className="h-5 w-5" />
          <span className="text-[10px] font-bold">Lịch</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner/bookings">
          <CreditCard className="h-5 w-5" />
          <span className="text-[10px] font-bold">Đơn</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-primary" to="/owner/courts">
          <Map className="h-5 w-5" />
          <span className="text-[10px] font-bold">Sân</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner/revenue">
          <Banknote className="h-5 w-5" />
          <span className="text-[10px] font-bold">Doanh thu</span>
        </Link>
        <Link className="flex flex-col items-center justify-center gap-1 text-on-surface-variant" to="/owner">
          <Settings className="h-5 w-5" />
          <span className="text-[10px] font-bold">Cài đặt</span>
        </Link>
      </nav>
    </div>
  );
};
