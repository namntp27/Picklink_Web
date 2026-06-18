import React, { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Trophy,
  UserCheck,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';

type MatchFormat = '1vs1' | '2vs2';
type PaymentStatus = 'paid' | 'pending' | 'not_joined';

type Player = {
  id: number;
  name: string;
  avatar: string;
  level: string;
  role: 'Chủ trận' | 'Người tham gia' | 'Chỗ trống';
  paymentStatus: PaymentStatus;
};

type MatchDetailData = {
  id: string;
  host: string;
  level: string;
  format: MatchFormat;
  status: 'waiting' | 'matched' | 'payment_pending' | 'confirmed';
  province: string;
  ward: string;
  courtCluster: string;
  subCourt: string;
  address: string;
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  totalPrice: number;
  needed: number;
  note: string;
  players: Player[];
};

const matchDetail: MatchDetailData = {
  id: '1',
  host: 'Trần Quốc Bảo',
  level: '3.0 - 3.5',
  format: '2vs2',
  status: 'waiting',
  province: 'Hà Nội',
  ward: 'Phường Cầu Giấy',
  courtCluster: 'Pickleball Pro Duy Tân',
  subCourt: 'C.Lông 1',
  address: 'Số 1 Duy Tân, Phường Cầu Giấy',
  date: '2026-06-18',
  startTime: '7:00',
  endTime: '8:00',
  durationHours: 1,
  totalPrice: 240000,
  needed: 4,
  note: 'Đánh đôi vui vẻ, ưu tiên đúng giờ. Sau khi đủ người, cả nhóm cùng thanh toán phần tiền sân để giữ lịch.',
  players: [
    {
      id: 1,
      name: 'Trần Quốc Bảo',
      avatar: 'TB',
      level: '3.5',
      role: 'Chủ trận',
      paymentStatus: 'pending',
    },
    {
      id: 2,
      name: 'Nguyễn Minh Anh',
      avatar: 'MA',
      level: '3.0',
      role: 'Người tham gia',
      paymentStatus: 'pending',
    },
  ],
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));

const getPaymentLabel = (status: PaymentStatus) => {
  if (status === 'paid') {
    return 'Đã thanh toán';
  }

  if (status === 'pending') {
    return 'Chờ thanh toán';
  }

  return 'Chưa tham gia';
};

const getPaymentClassName = (status: PaymentStatus) => {
  if (status === 'paid') {
    return 'bg-[#eaf7df] text-primary';
  }

  if (status === 'pending') {
    return 'bg-[#fff4d8] text-[#7a5600]';
  }

  return 'bg-surface-container-low text-on-surface-variant';
};

export const MatchDetail = () => {
  const { id } = useParams();
  const [hasJoined, setHasJoined] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  const players = useMemo(() => {
    const joinedPlayers = hasJoined
      ? [
          ...matchDetail.players,
          {
            id: 99,
            name: 'Bạn',
            avatar: 'B',
            level: '3.0',
            role: 'Người tham gia' as const,
            paymentStatus: hasPaid ? ('paid' as const) : ('pending' as const),
          },
        ]
      : matchDetail.players;

    const emptySlots = Math.max(matchDetail.needed - joinedPlayers.length, 0);
    const placeholders: Player[] = Array.from({ length: emptySlots }, (_, index) => ({
      id: 1000 + index,
      name: 'Đang chờ',
      avatar: '+',
      level: '-',
      role: 'Chỗ trống',
      paymentStatus: 'not_joined',
    }));

    return [...joinedPlayers, ...placeholders];
  }, [hasJoined, hasPaid]);

  const joinedCount = players.filter((player) => player.role !== 'Chỗ trống').length;
  const availableSlots = Math.max(matchDetail.needed - joinedCount, 0);
  const perPlayerPrice = Math.ceil(matchDetail.totalPrice / matchDetail.needed);
  const isFull = availableSlots === 0;
  const detailId = id ?? matchDetail.id;

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-8 md:px-margin-desktop md:py-10">
          <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-white/86 hover:text-white" to="/opponents">
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách ghép trận
          </Link>

          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-end">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold">
                <ShieldCheck className="h-4 w-4" />
                Mã trận #{detailId}
              </span>
              <h1 className="mt-4 max-w-3xl text-[30px] font-bold leading-tight md:text-[42px]">
                {matchDetail.host} đang tìm người chơi {matchDetail.format}
              </h1>
              <p className="mt-4 max-w-2xl text-[16px] leading-7 text-white/85">{matchDetail.note}</p>
            </div>

            <div className="rounded-xl border border-white/18 bg-white/10 p-5">
              <p className="text-[13px] font-bold uppercase text-white/72">Trạng thái</p>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[28px] font-bold">
                    {joinedCount}/{matchDetail.needed}
                  </p>
                  <p className="text-[13px] font-medium text-white/78">người đã tham gia</p>
                </div>
                <span className="rounded-full bg-white px-3 py-2 text-[13px] font-bold text-primary">
                  {isFull ? 'Đã đủ người' : `Còn ${availableSlots} chỗ`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              {[
                { icon: CalendarClock, label: 'Ngày chơi', value: formatDate(matchDetail.date) },
                { icon: Clock, label: 'Khung giờ', value: `${matchDetail.startTime} - ${matchDetail.endTime}` },
                { icon: Trophy, label: 'Trình độ', value: matchDetail.level },
                { icon: Users, label: 'Hình thức', value: matchDetail.format },
              ].map((item) => (
                <div className="rounded-lg border border-outline-variant bg-surface-container-low p-4" key={item.label}>
                  <item.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 text-[13px] font-bold text-on-surface-variant">{item.label}</p>
                  <p className="mt-1 text-[15px] font-bold text-on-surface">{item.value}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[22px] font-bold">Thông tin sân</h2>
                <p className="mt-1 text-[14px] text-on-surface-variant">Cụm sân và sân con đã chọn cho trận này.</p>
              </div>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">Đã giữ tạm</span>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-outline-variant p-4">
                <p className="text-[13px] font-bold text-on-surface-variant">Cụm sân</p>
                <p className="mt-2 text-[18px] font-bold">{matchDetail.courtCluster}</p>
                <p className="mt-2 inline-flex rounded-full bg-[#eaf7df] px-3 py-1 text-[12px] font-bold text-primary">
                  Sân con: {matchDetail.subCourt}
                </p>
              </div>
              <div className="rounded-lg border border-outline-variant p-4">
                <p className="flex items-center gap-2 text-[13px] font-bold text-on-surface-variant">
                  <MapPin className="h-4 w-4 text-primary" />
                  Địa chỉ
                </p>
                <p className="mt-2 text-[15px] font-bold">{matchDetail.address}</p>
                <p className="mt-1 text-[13px] text-on-surface-variant">
                  {matchDetail.ward}, {matchDetail.province}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-[22px] font-bold">Người chơi</h2>
                <p className="mt-1 text-[14px] text-on-surface-variant">Theo dõi ai đã tham gia và trạng thái thanh toán.</p>
              </div>
              <span className="w-fit rounded-full bg-surface-container-low px-3 py-2 text-[13px] font-bold text-primary">
                Cần {matchDetail.needed} người
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {players.map((player) => (
                <article className="rounded-lg border border-outline-variant p-4" key={player.id}>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold ${
                        player.role === 'Chỗ trống' ? 'bg-surface-container-low text-on-surface-variant' : 'bg-primary text-white'
                      }`}
                    >
                      {player.avatar}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-bold">{player.name}</p>
                      <p className="text-[12px] font-medium text-on-surface-variant">
                        {player.role} {player.level !== '-' ? `· Level ${player.level}` : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-[12px] font-bold ${getPaymentClassName(player.paymentStatus)}`}>
                    {getPaymentLabel(player.paymentStatus)}
                  </span>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="text-[22px] font-bold">Tiến trình trận đấu</h2>
            <div className="mt-5 space-y-4">
              {[
                { icon: UserPlus, title: 'Tạo lời mời', text: 'Lời mời được đăng lên danh sách đang chờ.', done: true },
                { icon: Users, title: 'Ghép đủ người', text: isFull ? 'Trận đã đủ người chơi.' : `Còn ${availableSlots} vị trí trống.`, done: isFull },
                { icon: CreditCard, title: 'Cùng thanh toán', text: 'Mỗi người thanh toán phần tiền sân của mình.', done: hasPaid },
                { icon: CheckCircle2, title: 'Xác nhận giữ sân', text: 'Sân được xác nhận sau khi các bên hoàn tất thanh toán.', done: false },
              ].map((step) => (
                <div className="flex gap-3" key={step.title}>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                      step.done ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    <step.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[15px] font-bold">{step.title}</p>
                    <p className="text-[13px] leading-5 text-on-surface-variant">{step.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border border-primary bg-white p-5 shadow-sm">
            <p className="text-[13px] font-bold uppercase text-on-surface-variant">Thanh toán sân</p>
            <div className="mt-4 space-y-3 text-[14px]">
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface-variant">Tổng tiền sân</span>
                <span className="font-bold">{formatCurrency(matchDetail.totalPrice)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-on-surface-variant">Thời lượng</span>
                <span className="font-bold">{matchDetail.durationHours}h</span>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant pt-3">
                <span className="font-bold text-on-surface-variant">Mỗi người</span>
                <span className="text-[24px] font-bold text-primary">{formatCurrency(perPlayerPrice)}</span>
              </div>
            </div>

            {!hasJoined ? (
              <button
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[15px] font-bold text-white hover:bg-primary/90"
                onClick={() => setHasJoined(true)}
                type="button"
              >
                <UserCheck className="h-5 w-5" />
                Tham gia trận
              </button>
            ) : (
              <button
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[15px] font-bold text-white ${
                  hasPaid ? 'bg-[#6f7a61]' : 'bg-primary hover:bg-primary/90'
                }`}
                disabled={hasPaid}
                onClick={() => setHasPaid(true)}
                type="button"
              >
                <CreditCard className="h-5 w-5" />
                {hasPaid ? 'Bạn đã thanh toán' : 'Thanh toán phần của tôi'}
              </button>
            )}

            {hasJoined && !hasPaid && (
              <button
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[15px] font-bold text-on-surface hover:bg-surface-container-low"
                onClick={() => setHasJoined(false)}
                type="button"
              >
                <XCircle className="h-5 w-5" />
                Hủy tham gia
              </button>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[18px] font-bold">
              <AlertCircle className="h-5 w-5 text-primary" />
              Lưu ý
            </h3>
            <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">
              Sau khi trận đủ người, hệ thống sẽ chuyển sang trạng thái chờ thanh toán. Nếu quá thời gian giữ chỗ, lịch sân có thể được mở lại cho người khác.
            </p>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[18px] font-bold">
              <MessageCircle className="h-5 w-5 text-primary" />
              Trao đổi nhanh
            </h3>
            <div className="mt-4 rounded-lg bg-surface-container-low p-4 text-[14px] leading-6 text-on-surface-variant">
              Chat nhóm sẽ hiển thị ở đây sau khi bạn tham gia trận.
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[18px] font-bold">
              <Star className="h-5 w-5 fill-current text-[#eab526]" />
              Đánh giá sau trận
            </h3>
            <p className="mt-3 text-[14px] leading-6 text-on-surface-variant">
              Sau khi hoàn tất trận, bạn có thể đánh giá người chơi để cập nhật điểm uy tín cộng đồng.
            </p>
            <Link
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-[14px] font-bold text-primary hover:bg-primary/10"
              to={`/reviews/create?type=player&matchId=${detailId}`}
            >
              <Star className="h-5 w-5 fill-current" />
              Đánh giá người chơi
            </Link>
          </section>
        </aside>
      </main>
    </div>
  );
};
