import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  Crown,
  Filter,
  Handshake,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';

type MemberRole = 'Chủ nhiệm' | 'Quản trị viên' | 'Huấn luyện viên' | 'Thành viên';
type MemberStatus = 'Đang hoạt động' | 'Thi đấu thường xuyên' | 'Tạm nghỉ';
type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

type ClubMember = {
  id: string;
  name: string;
  avatar: string;
  level: number;
  role: MemberRole;
  area: string;
  status: MemberStatus;
  joinedAt: string;
  lastActive: string;
  playStyle: string;
  hand: string;
  eventsJoined: number;
  winRate: number;
  badges: string[];
  note: string;
};

const clubInfo = {
  name: 'Hanoi Elite Pickleball Club',
  shortName: 'HEPC',
  city: 'Cầu Giấy, Hà Nội',
  level: '3.0 - 4.5+',
  members: 2450,
  weeklyPlayers: 186,
  cover: 'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1800&auto=format&fit=crop',
  manager: {
    name: 'Nguyễn Văn An',
    role: 'Chủ nhiệm CLB',
    avatar: 'https://i.pravatar.cc/160?img=13',
  },
};

const initialMembers: ClubMember[] = [
  {
    id: 'nguyen-van-an',
    name: 'Nguyễn Văn An',
    avatar: 'https://i.pravatar.cc/160?img=13',
    level: 4.5,
    role: 'Chủ nhiệm',
    area: 'Cầu Giấy',
    status: 'Thi đấu thường xuyên',
    joinedAt: '12/03/2022',
    lastActive: 'Đang online',
    playStyle: 'All-court, điều phối đánh đôi',
    hand: 'Tay phải',
    eventsJoined: 64,
    winRate: 72,
    badges: ['Founder', 'Ladder A', 'Mentor'],
    note: 'Phụ trách lịch open play và ghép trình nhóm nâng cao.',
  },
  {
    id: 'linh-nguyen',
    name: 'Linh Nguyễn',
    avatar: 'https://i.pravatar.cc/160?img=47',
    level: 4.0,
    role: 'Quản trị viên',
    area: 'Nam Từ Liêm',
    status: 'Đang hoạt động',
    joinedAt: '02/08/2023',
    lastActive: '15 phút trước',
    playStyle: 'Phòng thủ bền, reset tốt',
    hand: 'Tay phải',
    eventsJoined: 41,
    winRate: 66,
    badges: ['Đội trưởng nữ', 'Fair-play'],
    note: 'Thường hỗ trợ người mới trong nhóm trình 3.0 - 3.5.',
  },
  {
    id: 'tuan-tran',
    name: 'Tuấn Trần',
    avatar: 'https://i.pravatar.cc/160?img=12',
    level: 3.5,
    role: 'Huấn luyện viên',
    area: 'Thanh Xuân',
    status: 'Thi đấu thường xuyên',
    joinedAt: '18/11/2023',
    lastActive: '1 giờ trước',
    playStyle: 'Volley nhanh, bắt lưới chủ động',
    hand: 'Tay phải',
    eventsJoined: 36,
    winRate: 61,
    badges: ['Open play host', 'Coach'],
    note: 'Đứng lớp kỹ thuật dink, volley và chiến thuật đánh đôi cơ bản.',
  },
  {
    id: 'minh-pham',
    name: 'Minh Phạm',
    avatar: 'https://i.pravatar.cc/160?img=33',
    level: 4.5,
    role: 'Huấn luyện viên',
    area: 'Ba Đình',
    status: 'Đang hoạt động',
    joinedAt: '04/02/2024',
    lastActive: 'Hôm nay',
    playStyle: 'Tấn công biên, drive mạnh',
    hand: 'Tay trái',
    eventsJoined: 28,
    winRate: 69,
    badges: ['HLV kỹ thuật', 'Top ladder'],
    note: 'Ưu tiên ghép trận trình cao và chuẩn bị đội hình giao lưu.',
  },
  {
    id: 'mai-pham',
    name: 'Mai Phạm',
    avatar: 'https://i.pravatar.cc/160?img=32',
    level: 3.0,
    role: 'Thành viên',
    area: 'Cầu Giấy',
    status: 'Đang hoạt động',
    joinedAt: '09/01/2024',
    lastActive: '2 giờ trước',
    playStyle: 'Kiểm soát bóng, đánh an toàn',
    hand: 'Tay phải',
    eventsJoined: 19,
    winRate: 54,
    badges: ['New ladder', 'Đánh đôi'],
    note: 'Hay tham gia khung tối thứ 3 và thứ 5.',
  },
  {
    id: 'hoang-minh',
    name: 'Hoàng Minh',
    avatar: 'https://i.pravatar.cc/160?img=56',
    level: 5.0,
    role: 'Thành viên',
    area: 'Đống Đa',
    status: 'Thi đấu thường xuyên',
    joinedAt: '21/12/2023',
    lastActive: 'Đang online',
    playStyle: 'Power player, smash cuối điểm',
    hand: 'Tay phải',
    eventsJoined: 52,
    winRate: 75,
    badges: ['MVP tháng 6', 'Giải mở rộng'],
    note: 'Ứng viên chính cho đội giao lưu liên CLB.',
  },
  {
    id: 'do-lan-anh',
    name: 'Đỗ Lan Anh',
    avatar: 'https://i.pravatar.cc/160?img=44',
    level: 4.0,
    role: 'Thành viên',
    area: 'Hoàn Kiếm',
    status: 'Đang hoạt động',
    joinedAt: '11/04/2024',
    lastActive: 'Hôm qua',
    playStyle: 'Dink ổn định, đọc bóng tốt',
    hand: 'Tay phải',
    eventsJoined: 24,
    winRate: 63,
    badges: ['Fair-play', 'Dink master'],
    note: 'Phù hợp các trận đánh đôi trình trung cấp.',
  },
  {
    id: 'tran-quoc-bao',
    name: 'Trần Quốc Bảo',
    avatar: 'https://i.pravatar.cc/160?img=68',
    level: 2.5,
    role: 'Thành viên',
    area: 'Tây Hồ',
    status: 'Tạm nghỉ',
    joinedAt: '30/05/2024',
    lastActive: '5 ngày trước',
    playStyle: 'Người mới, đang tập giao bóng',
    hand: 'Tay phải',
    eventsJoined: 7,
    winRate: 38,
    badges: ['Beginner'],
    note: 'Đang tham gia lớp nhập môn cuối tuần.',
  },
];

const roleOptions: Array<'all' | MemberRole> = ['all', 'Chủ nhiệm', 'Quản trị viên', 'Huấn luyện viên', 'Thành viên'];
const levelOptions: Array<{ label: string; value: LevelFilter }> = [
  { label: 'Tất cả trình độ', value: 'all' },
  { label: 'Dưới 3.0', value: 'beginner' },
  { label: '3.0 - 4.0', value: 'intermediate' },
  { label: 'Trên 4.0', value: 'advanced' },
];
const statusOptions: Array<'all' | MemberStatus> = ['all', 'Đang hoạt động', 'Thi đấu thường xuyên', 'Tạm nghỉ'];

const getRoleClassName = (role: MemberRole) => {
  if (role === 'Chủ nhiệm') {
    return 'bg-primary text-white';
  }

  if (role === 'Quản trị viên') {
    return 'bg-primary-container text-on-primary-container';
  }

  if (role === 'Huấn luyện viên') {
    return 'bg-[#fff4d8] text-[#7a5600]';
  }

  return 'bg-surface-container-low text-on-surface-variant';
};

const getStatusClassName = (status: MemberStatus) => {
  if (status === 'Thi đấu thường xuyên') {
    return 'bg-[#eaf7df] text-primary';
  }

  if (status === 'Đang hoạt động') {
    return 'bg-[#e7eefe] text-[#315f8f]';
  }

  return 'bg-[#eef0ef] text-[#57615b]';
};

const matchesLevelFilter = (level: number, filter: LevelFilter) => {
  if (filter === 'beginner') {
    return level < 3;
  }

  if (filter === 'intermediate') {
    return level >= 3 && level <= 4;
  }

  if (filter === 'advanced') {
    return level > 4;
  }

  return true;
};

export const ClubMembers = () => {
  const { id } = useParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | MemberRole>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | MemberStatus>('all');

  const clubCode = id ?? 'hanoi-elite';
  const filteredMembers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return initialMembers.filter((member) => {
      const matchesKeyword =
        !keyword ||
        member.name.toLowerCase().includes(keyword) ||
        member.area.toLowerCase().includes(keyword) ||
        member.role.toLowerCase().includes(keyword) ||
        member.playStyle.toLowerCase().includes(keyword) ||
        member.badges.some((badge) => badge.toLowerCase().includes(keyword));
      const matchesRole = roleFilter === 'all' || member.role === roleFilter;
      const matchesLevel = matchesLevelFilter(member.level, levelFilter);
      const matchesStatus = statusFilter === 'all' || member.status === statusFilter;

      return matchesKeyword && matchesRole && matchesLevel && matchesStatus;
    });
  }, [levelFilter, roleFilter, searchTerm, statusFilter]);

  const activeMembers = initialMembers.filter((member) => member.status !== 'Tạm nghỉ').length;
  const staffMembers = initialMembers.filter((member) => member.role !== 'Thành viên').length;
  const averageLevel = initialMembers.reduce((total, member) => total + member.level, 0) / initialMembers.length;
  const topMembers = [...initialMembers].sort((first, second) => second.winRate - first.winRate).slice(0, 3);

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="relative overflow-hidden border-b border-outline-variant bg-[#101820]">
        <img alt={clubInfo.name} className="absolute inset-0 h-full w-full object-cover opacity-34" src={clubInfo.cover} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#101820] via-[#101820]/82 to-[#101820]/48" />
        <div className="relative z-10 mx-auto max-w-container-max-width px-margin-mobile py-8 text-white md:px-margin-desktop">
          <Link className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-[14px] font-bold backdrop-blur hover:bg-white/20" to={`/clubs/${clubCode}`}>
            <ArrowLeft className="h-4 w-4" />
            Quay lại CLB
          </Link>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-[13px] font-bold text-on-primary-container">
                <Users className="h-4 w-4" />
                Danh sách thành viên
              </p>
              <h1 className="mt-4 text-[32px] font-bold leading-tight md:text-[44px]">{clubInfo.name}</h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/86">
                Tra cứu thành viên CLB, trình độ chơi, vai trò, lịch sử tham gia sự kiện và trạng thái hoạt động để ghép trận phù hợp.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/10 px-4 py-3 text-[14px] font-bold text-white backdrop-blur hover:bg-white/20" to={`/clubs/${clubCode}/dashboard`}>
                <ShieldCheck className="h-5 w-5" />
                Quản lý CLB
              </Link>
              <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-4 py-3 text-[14px] font-bold text-on-primary-container hover:bg-primary-container/90" type="button">
                <UserPlus className="h-5 w-5" />
                Mời thành viên
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-container-max-width px-margin-mobile py-8 md:px-margin-desktop">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng thành viên', value: clubInfo.members.toLocaleString('vi-VN'), icon: Users, helper: `${filteredMembers.length} đang hiển thị` },
            { label: 'Đang hoạt động', value: activeMembers, icon: CheckCircle2, helper: 'Có thể ghép lịch tuần này' },
            { label: 'Ban điều phối', value: staffMembers, icon: Crown, helper: 'Chủ nhiệm, quản trị, HLV' },
            { label: 'Trình độ trung bình', value: averageLevel.toFixed(1), icon: Trophy, helper: clubInfo.level },
          ].map((stat) => (
            <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm" key={stat.label}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-bold text-on-surface-variant">{stat.label}</p>
                  <p className="mt-2 text-[30px] font-bold leading-tight">{stat.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-[12px] font-medium text-on-surface-variant">{stat.helper}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-[20px] font-bold">
                    <Filter className="h-5 w-5 text-primary" />
                    Tìm kiếm thành viên
                  </h2>
                  <p className="mt-1 text-[13px] text-on-surface-variant">Lọc theo tên, khu vực, vai trò, trình độ hoặc phong cách chơi.</p>
                </div>
                <div className="relative w-full lg:w-[360px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
                  <input
                    className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm thành viên, khu vực, badge..."
                    value={searchTerm}
                  />
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="block">
                  <span className="text-[12px] font-bold uppercase text-on-surface-variant">Vai trò</span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary"
                    onChange={(event) => setRoleFilter(event.target.value as 'all' | MemberRole)}
                    value={roleFilter}
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role === 'all' ? 'Tất cả vai trò' : role}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[12px] font-bold uppercase text-on-surface-variant">Trình độ</span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary"
                    onChange={(event) => setLevelFilter(event.target.value as LevelFilter)}
                    value={levelFilter}
                  >
                    {levelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[12px] font-bold uppercase text-on-surface-variant">Trạng thái</span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] font-bold outline-none focus:border-primary"
                    onChange={(event) => setStatusFilter(event.target.value as 'all' | MemberStatus)}
                    value={statusFilter}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status === 'all' ? 'Tất cả trạng thái' : status}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-outline-variant p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-[20px] font-bold">Thành viên CLB</h2>
                  <p className="mt-1 text-[13px] text-on-surface-variant">{filteredMembers.length} thành viên phù hợp bộ lọc hiện tại.</p>
                </div>
                <span className="w-fit rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">
                  Mã CLB: {clubCode.toUpperCase()}
                </span>
              </div>

              <div className="divide-y divide-outline-variant">
                {filteredMembers.map((member) => (
                  <article className="p-5" key={member.id}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <img alt={member.name} className="h-16 w-16 shrink-0 rounded-xl object-cover" src={member.avatar} />
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-[18px] font-bold">{member.name}</h3>
                            <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${getRoleClassName(member.role)}`}>{member.role}</span>
                            <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${getStatusClassName(member.status)}`}>{member.status}</span>
                          </div>
                          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-bold text-on-surface-variant">
                            <span className="inline-flex items-center gap-1">
                              <Trophy className="h-4 w-4 text-primary" />
                              Level {member.level.toFixed(1)}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-primary" />
                              {member.area}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CalendarDays className="h-4 w-4 text-primary" />
                              Tham gia {member.joinedAt}
                            </span>
                          </div>
                          <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">{member.note}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {member.badges.map((badge) => (
                              <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold text-on-surface-variant" key={badge}>
                                {badge}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex lg:flex-col">
                        <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[13px] font-bold text-on-surface-variant hover:bg-surface-container-low" to="/messages">
                          <MessageCircle className="h-4 w-4" />
                          Nhắn tin
                        </Link>
                        <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-[13px] font-bold text-white hover:bg-primary/90" type="button">
                          <Handshake className="h-4 w-4" />
                          Mời đánh
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      {[
                        { label: 'Phong cách', value: member.playStyle },
                        { label: 'Tay thuận', value: member.hand },
                        { label: 'Sự kiện', value: `${member.eventsJoined} lần` },
                        { label: 'Tỷ lệ thắng', value: `${member.winRate}%` },
                      ].map((item) => (
                        <div className="rounded-lg bg-surface-container-low p-3" key={item.label}>
                          <p className="text-[11px] font-bold uppercase text-on-surface-variant">{item.label}</p>
                          <p className="mt-1 text-[13px] font-bold leading-5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}

                {filteredMembers.length === 0 && (
                  <div className="p-8 text-center">
                    <Users className="mx-auto h-10 w-10 text-primary" />
                    <h3 className="mt-4 text-[20px] font-bold">Không tìm thấy thành viên</h3>
                    <p className="mt-2 text-[14px] text-on-surface-variant">Thử đổi bộ lọc hoặc tìm bằng từ khóa khác.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
            <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <Crown className="h-5 w-5 text-primary" />
                Ban điều phối
              </h2>
              <div className="mt-5 space-y-4">
                {[clubInfo.manager, ...initialMembers.filter((member) => member.role === 'Quản trị viên' || member.role === 'Huấn luyện viên').slice(0, 3)].map((member) => (
                  <div className="flex items-center gap-3 rounded-lg border border-outline-variant p-3" key={member.name}>
                    <img alt={member.name} className="h-11 w-11 rounded-lg object-cover" src={member.avatar} />
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-bold">{member.name}</p>
                      <p className="text-[12px] text-on-surface-variant">{'level' in member ? member.role : member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <Star className="h-5 w-5 text-primary" />
                Thành viên nổi bật
              </h2>
              <div className="mt-5 space-y-4">
                {topMembers.map((member, index) => (
                  <div className="rounded-lg bg-surface-container-low p-4" key={member.id}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-[13px] font-bold text-white">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-bold">{member.name}</p>
                          <p className="text-[12px] text-on-surface-variant">Level {member.level.toFixed(1)}</p>
                        </div>
                      </div>
                      <p className="text-[14px] font-bold text-primary">{member.winRate}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-[#f0f3ff] p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <Sparkles className="h-5 w-5 text-primary" />
                Gợi ý ghép trận
              </h2>
              <div className="mt-4 space-y-3 text-[13px] leading-5 text-on-surface-variant">
                <p>Ghép người chơi cùng khu vực và lệch trình tối đa 0.5 để trận cân bằng hơn.</p>
                <p>Ưu tiên thành viên có trạng thái “Thi đấu thường xuyên” khi tạo open play trong tuần.</p>
                <p>Thành viên mới dưới level 3.0 nên được ghép với huấn luyện viên trong 2 buổi đầu.</p>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <Award className="h-5 w-5 text-primary" />
                Cơ cấu vai trò
              </h2>
              <div className="mt-4 space-y-3">
                {roleOptions
                  .filter((role): role is MemberRole => role !== 'all')
                  .map((role) => (
                    <div className="flex items-center justify-between gap-4 rounded-lg border border-outline-variant p-3" key={role}>
                      <span className={`rounded-full px-3 py-1 text-[12px] font-bold ${getRoleClassName(role)}`}>{role}</span>
                      <span className="text-[13px] font-bold text-on-surface-variant">
                        {initialMembers.filter((member) => member.role === role).length} người
                      </span>
                    </div>
                  ))}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};
