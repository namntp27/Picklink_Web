import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Image as ImageIcon,
  Info,
  Phone,
  PlusCircle,
  Search,
  Send,
  Smile,
  Video,
} from 'lucide-react';

const paddleImage =
  'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=900&auto=format&fit=crop';
const courtImage =
  'https://images.unsplash.com/photo-1599474924187-334a4ae5bd3c?q=80&w=900&auto=format&fit=crop';
const clubImage =
  'https://images.unsplash.com/photo-1629904853716-f0bc54eea481?q=80&w=900&auto=format&fit=crop';

const groups = [
  {
    name: 'Pickleball Hà Nội',
    preview: 'Minh: Cuối tuần này ai ra sân...',
    time: '10:42',
    avatar: paddleImage,
    unread: true,
  },
  {
    name: 'Sài Gòn Smash',
    preview: 'Đã lên lịch giải đấu tháng 10...',
    time: 'Hôm qua',
    avatar: courtImage,
  },
  {
    name: 'Đà Nẵng Dinker',
    preview: 'Hoa: Sân D2 chiều nay trống không?',
    time: 'T2',
    avatar: clubImage,
  },
  {
    name: 'Hội Thể Thao Quận 7',
    preview: 'Bạn: Ok, hẹn gặp lúc 6h.',
    time: '20/09',
    initial: 'H',
  },
];

const messages = [
  {
    id: 1,
    name: 'Linh Nguyễn',
    time: '09:15',
    avatar: 'https://i.pravatar.cc/150?img=47',
    text: 'Mọi người ơi, sân Bách Khoa tối nay từ 19h-21h còn trống 1 sân, có nhóm nào muốn giao lưu không ạ? Trình độ 3.0-3.5 nhé!',
  },
  {
    id: 2,
    name: 'Tuấn Trần',
    time: '09:42',
    avatar: 'https://i.pravatar.cc/150?img=12',
    text: 'Nhóm mình chốt kèo nhé Linh! Vừa sắm cây vợt mới xong phải test ngay.',
    image: paddleImage,
  },
  {
    id: 3,
    name: 'Bạn',
    time: '10:05',
    text: 'Tuyệt vời! Cho mình xin 1 slot nhé, lâu rồi chưa đánh sân BK.',
    mine: true,
  },
  {
    id: 4,
    name: 'Minh Phạm',
    time: '10:42',
    avatar: 'https://i.pravatar.cc/150?img=33',
    text: 'Cuối tuần này ai ra sân thi đấu giải nội bộ không? Hạn đăng ký là chiều nay nhé anh em.',
  },
];

export const ClubsChat = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full bg-[#f9f9ff] pt-[72px] font-body-md text-on-surface">
      <div className="flex h-[calc(100vh-72px)] min-h-[640px] flex-col overflow-hidden border-t border-outline-variant bg-[#f9f9ff] md:flex-row">
        <aside className="flex h-[290px] w-full shrink-0 flex-col border-b border-outline-variant bg-white md:h-full md:w-80 md:border-b-0 md:border-r">
          <div className="border-b border-outline-variant p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-[18px] font-bold text-on-surface">Cộng đồng</h2>
              <button
                className="rounded-full border border-outline-variant px-3 py-1 text-[12px] font-bold text-primary transition-colors hover:bg-surface-container-low"
                onClick={() => navigate('/clubs/create')}
                type="button"
              >
                Tạo câu lạc bộ
              </button>
            </div>
            <div className="relative mt-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="w-full rounded-full border border-outline-variant bg-surface-container-low py-2 pl-9 pr-4 text-[14px] outline-none placeholder:text-on-surface-variant/70 focus:border-primary focus:ring-2 focus:ring-primary/20"
                placeholder="Tìm kiếm nhóm..."
                type="text"
              />
            </div>
          </div>

          <div className="custom-scrollbar flex-1 space-y-1 overflow-y-auto p-2">
            {groups.map((group, index) => (
              <button
                className={`flex w-full items-center rounded-lg p-3 text-left transition-colors ${
                  index === 0
                    ? 'bg-primary-container text-on-primary-container shadow-sm'
                    : 'text-on-surface hover:bg-[#eef3ff]'
                }`}
                key={group.name}
                type="button"
              >
                {group.avatar ? (
                  <img
                    alt={group.name}
                    className="mr-3 h-12 w-12 rounded-full object-cover shadow-sm"
                    src={group.avatar}
                  />
                ) : (
                  <div className="mr-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#d6e0f3] text-[18px] font-bold text-[#3d4756] shadow-sm">
                    {group.initial}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className={`truncate text-[14px] ${index === 0 ? 'font-bold' : 'font-semibold'}`}>
                    {group.name}
                  </h3>
                  <p
                    className={`truncate text-[12px] ${
                      index === 0 ? 'text-on-primary-container/80' : 'text-on-surface-variant'
                    }`}
                  >
                    {group.preview}
                  </p>
                </div>
                <div className="ml-2 flex h-11 flex-col items-end justify-between">
                  <span
                    className={`text-[11px] font-medium ${
                      index === 0 ? 'text-on-primary-container/70' : 'text-on-surface-variant'
                    }`}
                  >
                    {group.time}
                  </span>
                  {group.unread && <span className="h-2 w-2 rounded-full bg-primary" />}
                </div>
              </button>
            ))}
          </div>
        </aside>

        <main className="flex min-h-0 flex-1 flex-col bg-[#f9f9ff]">
          <header className="flex h-16 shrink-0 items-center justify-between border-b border-outline-variant bg-white px-4 shadow-sm md:px-6">
            <div className="flex min-w-0 items-center">
              <img alt="Pickleball Hà Nội" className="mr-3 h-10 w-10 rounded-full object-cover" src={paddleImage} />
              <div className="min-w-0">
                <h2 className="truncate text-[16px] font-bold text-on-surface">Pickleball Hà Nội</h2>
                <p className="truncate text-[12px] font-medium text-on-surface-variant">
                  1,240 thành viên · 45 đang trực tuyến
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant">
              <button aria-label="Gọi thoại" className="rounded-full p-2 transition-colors hover:bg-surface-container-low" type="button">
                <Phone className="h-5 w-5" />
              </button>
              <button aria-label="Gọi video" className="rounded-full p-2 transition-colors hover:bg-surface-container-low" type="button">
                <Video className="h-5 w-5" />
              </button>
              <button aria-label="Thông tin nhóm" className="rounded-full p-2 transition-colors hover:bg-surface-container-low" type="button">
                <Info className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div
            className="custom-scrollbar flex-1 space-y-6 overflow-y-auto p-4 md:p-6"
            style={{
              backgroundImage: 'radial-gradient(#dce2f3 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          >
            <div className="flex justify-center">
              <span className="rounded-full bg-[#e2e8f8] px-3 py-1 text-[11px] font-bold text-on-surface-variant">
                Hôm nay
              </span>
            </div>

            {messages.map((message) => (
              <div className={`flex max-w-3xl items-start ${message.mine ? 'ml-auto justify-end' : ''}`} key={message.id}>
                {!message.mine && (
                  <img alt={message.name} className="mr-3 mt-1 h-8 w-8 rounded-full object-cover" src={message.avatar} />
                )}
                <div className={`flex flex-col ${message.mine ? 'items-end' : ''}`}>
                  <div className="mb-1 flex items-baseline gap-2">
                    {message.mine && <span className="text-[11px] text-on-surface-variant">{message.time}</span>}
                    <span className="text-[13px] font-bold text-on-surface">{message.name}</span>
                    {!message.mine && <span className="text-[11px] text-on-surface-variant">{message.time}</span>}
                  </div>
                  <div
                    className={`space-y-2 rounded-2xl p-3 text-[14px] leading-5 shadow-sm ${
                      message.mine
                        ? 'rounded-tr-sm bg-primary text-white'
                        : 'rounded-tl-sm border border-outline-variant bg-white text-on-surface'
                    }`}
                  >
                    <p>{message.text}</p>
                    {message.image && (
                      <img
                        alt="Vợt pickleball mới"
                        className="max-h-56 w-full max-w-[240px] rounded-lg border border-outline-variant object-cover"
                        src={message.image}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="shrink-0 border-t border-outline-variant bg-white p-3 md:p-4">
            <div className="mx-auto flex max-w-4xl items-end gap-2">
              <button
                aria-label="Thêm nội dung"
                className="shrink-0 rounded-full p-3 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                type="button"
              >
                <PlusCircle className="h-5 w-5" />
              </button>
              <button
                aria-label="Gửi hình ảnh"
                className="shrink-0 rounded-full p-3 text-on-surface-variant transition-colors hover:bg-surface-container-low hover:text-primary"
                type="button"
              >
                <ImageIcon className="h-5 w-5" />
              </button>
              <div className="relative flex-1 rounded-xl border border-outline-variant bg-surface-container-low focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                <textarea
                  className="max-h-32 min-h-12 w-full resize-none bg-transparent px-4 py-3 pr-10 text-[14px] outline-none"
                  placeholder="Nhập tin nhắn..."
                  rows={1}
                />
                <button
                  aria-label="Biểu cảm"
                  className="absolute bottom-2 right-2 rounded-full p-1 text-on-surface-variant transition-colors hover:text-primary"
                  type="button"
                >
                  <Smile className="h-5 w-5" />
                </button>
              </div>
              <button
                aria-label="Gửi tin nhắn"
                className="shrink-0 rounded-xl bg-primary p-3 text-white shadow-sm transition-transform hover:bg-primary/90 active:scale-95"
                type="button"
              >
                <Send className="h-5 w-5" fill="currentColor" />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
