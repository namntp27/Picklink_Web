import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Activity,
  ArrowLeft,
  Award,
  CalendarDays,
  CheckCircle2,
  Clock,
  Crown,
  Dumbbell,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  ShieldCheck,
  Star,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';

const club = {
  name: 'Hanoi Elite Pickleball Club',
  shortName: 'HEPC',
  city: 'Cầu Giấy, Hà Nội',
  address: '12 Trần Quốc Hoàn, Cầu Giấy, Hà Nội',
  level: '3.0 - 4.5+',
  members: '2,450',
  weeklyPlayers: '186',
  founded: '12/03/2022',
  responseTime: '15 phút',
  cover:
    'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1800&auto=format&fit=crop',
  gallery: [
    'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1629904853716-f0bc54eea481?q=80&w=800&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1642501518638-6f9d6e40496d?q=80&w=800&auto=format&fit=crop',
  ],
  manager: {
    name: 'Nguyễn Văn An',
    role: 'Chủ nhiệm CLB',
    avatar: 'https://i.pravatar.cc/160?img=13',
    phone: '0901 234 567',
  },
};

const stats = [
  { label: 'Thành viên', value: club.members, icon: Users },
  { label: 'Người chơi/tuần', value: club.weeklyPlayers, icon: Activity },
  { label: 'Trình độ', value: club.level, icon: Trophy },
  { label: 'Phản hồi', value: club.responseTime, icon: Clock },
];

const schedule = [
  {
    day: 'Thứ 3',
    date: '18',
    title: 'Open play trình 3.0 - 3.5',
    time: '18:00 - 20:00',
    location: 'Sân 1 & 2',
    status: 'Còn 8 chỗ',
  },
  {
    day: 'Thứ 5',
    date: '20',
    title: 'Lớp chiến thuật đánh đôi',
    time: '19:00 - 21:00',
    location: 'Sân trung tâm',
    status: 'Đang mở',
  },
  {
    day: 'Thứ 7',
    date: '22',
    title: 'Giải ladder nội bộ tháng 6',
    time: '07:30 - 11:30',
    location: 'Cụm sân A',
    status: 'Sắp đầy',
  },
];

const featuredMembers = [
  {
    name: 'Linh Nguyễn',
    level: '4.0',
    note: 'Đội trưởng nhóm nữ',
    avatar: 'https://i.pravatar.cc/160?img=47',
  },
  {
    name: 'Tuấn Trần',
    level: '3.5',
    note: 'Tổ chức open play',
    avatar: 'https://i.pravatar.cc/160?img=12',
  },
  {
    name: 'Minh Phạm',
    level: '4.5',
    note: 'HLV kỹ thuật',
    avatar: 'https://i.pravatar.cc/160?img=33',
  },
];

const posts = [
  {
    title: 'Kết quả ladder tuần này',
    meta: 'Hôm nay · 42 lượt thích',
    text: 'Bảng A có nhiều trận kéo dài tới set quyết định. CLB sẽ cập nhật điểm xếp hạng vào tối nay.',
  },
  {
    title: 'Mở đăng ký lớp beginner',
    meta: 'Hôm qua · 18 bình luận',
    text: 'Lớp nhập môn khai giảng tối thứ 5, phù hợp người mới mua vợt hoặc muốn học luật chơi căn bản.',
  },
];

const rules = ['Đến sân trước giờ chơi 10 phút', 'Mang giày đế non-marking', 'Xác nhận hủy kèo trước 6 giờ', 'Giữ tinh thần fair-play'];

type DetailTab = 'overview' | 'schedule' | 'members' | 'posts';

export const ClubDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');

  const clubCode = useMemo(() => id?.replace(/-/g, ' ') || 'hanoi elite', [id]);

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'schedule', label: 'Lịch hoạt động' },
    { id: 'members', label: 'Thành viên' },
    { id: 'posts', label: 'Bài viết' },
  ];

  return (
    <div className="min-h-screen bg-[#f9f9ff] font-body-md text-on-surface">
      <section className="relative min-h-[520px] overflow-hidden bg-[#101820] pt-[72px]">
        <img alt={club.name} className="absolute inset-0 h-full w-full object-cover" src={club.cover} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-[#101820]/62 to-[#101820]/12" />

        <div className="relative z-10 mx-auto flex min-h-[448px] max-w-container-max-width flex-col justify-end px-margin-mobile pb-8 md:px-margin-desktop">
          <Link
            className="mb-8 inline-flex w-fit items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-[14px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
            to="/clubs"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại CLB
          </Link>

          <div className="max-w-4xl text-white">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-2 text-[13px] font-bold text-on-primary-container">
                <ShieldCheck className="h-4 w-4" />
                CLB đã xác thực
              </span>
              <span className="rounded-full bg-white/14 px-4 py-2 text-[13px] font-bold backdrop-blur">
                Mã CLB: {clubCode.toUpperCase()}
              </span>
            </div>
            <h1 className="text-[34px] font-bold leading-tight md:text-[48px]">{club.name}</h1>
            <p className="mt-4 max-w-3xl text-[17px] leading-7 text-white/90 md:text-[18px]">
              Cộng đồng pickleball năng động tại Hà Nội, phù hợp người chơi muốn tập luyện đều đặn, tìm bạn đánh đôi và tham gia giải nội bộ hàng tháng.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-[15px] font-bold text-on-primary-container shadow-lg transition-transform hover:scale-[0.98]"
                type="button"
              >
                <UserPlus className="h-5 w-5" />
                Tham gia CLB
              </button>
              <button
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/30 bg-white/12 px-6 py-3 text-[15px] font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
                onClick={() => navigate('/book-court')}
                type="button"
              >
                <CalendarDays className="h-5 w-5" />
                Đặt lịch chơi
              </button>
              <button
                aria-label="Chia sẻ câu lạc bộ"
                className="inline-flex items-center justify-center rounded-lg border border-white/30 bg-white/12 px-4 py-3 text-white backdrop-blur transition-colors hover:bg-white/20"
                type="button"
              >
                <Share2 className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-container-max-width px-margin-mobile py-8 md:px-margin-desktop">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-gutter">
          {stats.map((item) => (
            <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm" key={item.label}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#f0f3ff] text-primary">
                <item.icon className="h-5 w-5" />
              </div>
              <p className="text-[13px] font-bold text-on-surface-variant">{item.label}</p>
              <p className="mt-1 text-[24px] font-bold leading-tight text-on-surface">{item.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-gutter lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 space-y-6">
            <div className="sticky top-[72px] z-30 overflow-x-auto border-b border-outline-variant bg-[#f9f9ff]/95 py-2 backdrop-blur">
              <div className="flex min-w-max gap-2">
                {tabs.map((tab) => (
                  <button
                    className={`rounded-lg px-4 py-2 text-[14px] font-bold transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-white'
                        : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                    }`}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    type="button"
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-6">
                <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                  <h2 className="text-[24px] font-bold text-on-surface">Giới thiệu</h2>
                  <p className="mt-4 text-[16px] leading-7 text-on-surface-variant">
                    Hanoi Elite Pickleball Club duy trì lịch chơi cố định 5 buổi mỗi tuần, có nhóm trình độ rõ ràng và đội ngũ điều phối giúp người mới dễ hòa nhập. CLB thường tổ chức open play, lớp kỹ thuật, ladder nội bộ và các buổi giao lưu với CLB khác trong khu vực.
                  </p>
                  <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                    {[
                      { icon: Dumbbell, title: 'Tập luyện kỹ thuật', text: 'Drill dink, volley, reset và chiến thuật đánh đôi.' },
                      { icon: Trophy, title: 'Thi đấu nội bộ', text: 'Ladder hàng tuần, điểm xếp hạng theo trình độ.' },
                      { icon: Users, title: 'Ghép nhóm nhanh', text: 'Tìm bạn chơi cùng khung giờ và trình tương đương.' },
                    ].map((item) => (
                      <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4" key={item.title}>
                        <item.icon className="h-6 w-6 text-primary" />
                        <h3 className="mt-3 text-[16px] font-bold">{item.title}</h3>
                        <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                  <div className="mb-5 flex items-center justify-between gap-4">
                    <h2 className="text-[24px] font-bold text-on-surface">Ảnh hoạt động</h2>
                    <span className="inline-flex items-center gap-2 text-[13px] font-bold text-primary">
                      <ImageIcon className="h-4 w-4" />
                      36 ảnh
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {club.gallery.map((image, index) => (
                      <img
                        alt={`Hoạt động CLB ${index + 1}`}
                        className="h-48 w-full rounded-lg object-cover"
                        key={image}
                        src={image}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )}

            {(activeTab === 'overview' || activeTab === 'schedule') && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[24px] font-bold text-on-surface">Lịch hoạt động sắp tới</h2>
                  <button className="w-fit rounded-lg border border-primary px-4 py-2 text-[14px] font-bold text-primary hover:bg-primary/5" type="button">
                    Xem lịch đầy đủ
                  </button>
                </div>
                <div className="space-y-4">
                  {schedule.map((event) => (
                    <div className="flex flex-col gap-4 rounded-lg border border-outline-variant p-4 transition-colors hover:border-primary md:flex-row md:items-center" key={event.title}>
                      <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-lg bg-primary text-white">
                        <span className="text-[12px] font-bold uppercase">{event.day}</span>
                        <span className="text-[24px] font-bold leading-none">{event.date}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[17px] font-bold text-on-surface">{event.title}</h3>
                        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[13px] font-medium text-on-surface-variant">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {event.time}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </span>
                        </div>
                      </div>
                      <button className="rounded-lg bg-primary-container px-4 py-2 text-[14px] font-bold text-on-primary-container" type="button">
                        {event.status}
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === 'overview' || activeTab === 'members') && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[24px] font-bold text-on-surface">Thành viên nổi bật</h2>
                  <button className="w-fit rounded-lg border border-outline-variant px-4 py-2 text-[14px] font-bold text-on-surface hover:bg-surface-container-low" type="button">
                    Xem tất cả
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {featuredMembers.map((member) => (
                    <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4" key={member.name}>
                      <div className="flex items-center gap-3">
                        <img alt={member.name} className="h-12 w-12 rounded-full object-cover" src={member.avatar} />
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-bold">{member.name}</h3>
                          <p className="text-[13px] font-bold text-primary">Level {member.level}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-[14px] text-on-surface-variant">{member.note}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(activeTab === 'overview' || activeTab === 'posts') && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="mb-5 text-[24px] font-bold text-on-surface">Bảng tin CLB</h2>
                <div className="space-y-4">
                  {posts.map((post) => (
                    <article className="rounded-lg border border-outline-variant p-4" key={post.title}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="text-[17px] font-bold text-on-surface">{post.title}</h3>
                          <p className="mt-1 text-[13px] font-bold text-primary">{post.meta}</p>
                        </div>
                        <MessageCircle className="h-5 w-5 shrink-0 text-on-surface-variant" />
                      </div>
                      <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">{post.text}</p>
                    </article>
                  ))}
                </div>
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-[24px] font-bold text-white">
                  {club.shortName}
                </div>
                <div>
                  <p className="text-[13px] font-bold uppercase text-on-surface-variant">Thông tin CLB</p>
                  <h2 className="text-[20px] font-bold text-on-surface">{club.name}</h2>
                </div>
              </div>

              <div className="mt-6 space-y-4 text-[14px]">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-bold text-on-surface">Địa điểm</p>
                    <p className="mt-1 text-on-surface-variant">{club.address}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-bold text-on-surface">Thành lập</p>
                    <p className="mt-1 text-on-surface-variant">{club.founded}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Award className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-bold text-on-surface">Thành tích</p>
                    <p className="mt-1 text-on-surface-variant">Top 3 CLB hoạt động sôi nổi khu vực Hà Nội</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="text-[20px] font-bold text-on-surface">Quản lý CLB</h2>
              <div className="mt-4 flex items-center gap-3">
                <img alt={club.manager.name} className="h-14 w-14 rounded-full object-cover" src={club.manager.avatar} />
                <div>
                  <p className="font-bold text-on-surface">{club.manager.name}</p>
                  <p className="text-[13px] font-medium text-on-surface-variant">{club.manager.role}</p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <button className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-[14px] font-bold hover:bg-surface-container-low" type="button">
                  <Phone className="h-4 w-4" />
                  Gọi
                </button>
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-[14px] font-bold text-white hover:bg-primary/90" type="button">
                  <MessageCircle className="h-4 w-4" />
                  Chat
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-[#f0f3ff] p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold text-on-surface">
                <Crown className="h-5 w-5 text-primary" />
                Quy định nhanh
              </h2>
              <ul className="mt-4 space-y-3">
                {rules.map((rule) => (
                  <li className="flex gap-2 text-[14px] font-medium text-on-surface-variant" key={rule}>
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {rule}
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-[20px] font-bold text-on-surface">Đánh giá cộng đồng</h2>
              <div className="flex items-end gap-3">
                <span className="text-[40px] font-bold leading-none text-on-surface">4.8</span>
                <div className="pb-1">
                  <div className="flex text-primary-container">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star className="h-4 w-4 fill-current" key={index} />
                    ))}
                  </div>
                  <p className="mt-1 text-[13px] font-bold text-on-surface-variant">128 lượt đánh giá</p>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
};
