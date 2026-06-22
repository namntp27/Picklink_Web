import React, { useEffect, useMemo, useState } from 'react';
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
import { submitBankTransfer } from '../../api/payment';
import { acceptParticipant, getMatchDetail, joinMatch, leaveMatch, rejectParticipant, type MatchDetailResponse } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';

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

const fallbackMatchDetail: MatchDetailData = {
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
  const matchId = Number(id);
  const { token } = useAuth();
  const [matchDetail, setMatchDetail] = useState<MatchDetailData>(fallbackMatchDetail);
  const [rawMatch, setRawMatch] = useState<MatchDetailResponse | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const mapDetail = (match: MatchDetailResponse): MatchDetailData => ({
    id: String(match.matchId),
    host: match.hostName,
    level: String(match.matchSkillLevel),
    format: match.matchType,
    status: match.status === 'Waiting' ? 'waiting' : match.status === 'PaymentPending' ? 'payment_pending' : match.status === 'Confirmed' || match.status === 'Completed' ? 'confirmed' : 'matched',
    province: '',
    ward: match.address,
    courtCluster: match.venueName,
    subCourt: `Sân ${match.courtNumber}`,
    address: match.address,
    date: match.startTime.slice(0, 10),
    startTime: match.startTime.slice(11, 16),
    endTime: match.endTime.slice(11, 16),
    durationHours: (new Date(match.endTime).getTime() - new Date(match.startTime).getTime()) / 3_600_000,
    totalPrice: match.totalBookingAmount,
    needed: match.requiredPlayerCount,
    note: match.note || 'Đang chờ người chơi phù hợp tham gia.',
    players: match.participants.filter((participant) => participant.status === 'Accepted').map((participant) => ({
      id: participant.playerId,
      name: participant.playerName,
      avatar: participant.playerName.split(/\s+/).slice(-2).map((part) => part[0]?.toUpperCase()).join(''),
      level: participant.skillLevel.toFixed(1),
      role: participant.isHost ? 'Chủ trận' : 'Người tham gia',
      paymentStatus: participant.paymentStatus === 'Paid' ? 'paid' : 'pending',
    })),
  });

  const loadMatch = async () => {
    if (!token || !Number.isInteger(matchId)) return;
    try {
      const match = await getMatchDetail(token, matchId);
      setRawMatch(match);
      setMatchDetail(mapDetail(match));
      setHasJoined(match.myParticipantStatus === 'Accepted');
      setHasPaid(match.myPaymentStatus === 'Paid');
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải chi tiết trận.');
    }
  };

  useEffect(() => { void loadMatch(); }, [matchId, token]);
  useMatchRealtime((event) => {
    if (event.matchId === matchId) void loadMatch();
  });

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  const players = useMemo(() => {
    const joinedPlayers = matchDetail.players;

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
  }, [matchDetail]);

  const handleJoin = async () => {
    if (!token) return;
    await joinMatch(token, matchId);
    await loadMatch();
  };

  const handleLeave = async () => {
    if (!token) return;
    await leaveMatch(token, matchId);
    await loadMatch();
  };

  const handlePayment = async () => {
    if (!token || !rawMatch || !receipt) { setError('Vui lòng chọn ảnh biên lai.'); return; }
    await submitBankTransfer(token, rawMatch.bookingId, receipt);
    setReceipt(null);
    await loadMatch();
  };

  const joinedCount = players.filter((player) => player.role !== 'Chỗ trống').length;
  const availableSlots = Math.max(matchDetail.needed - joinedCount, 0);
  const perPlayerPrice = Math.ceil(matchDetail.totalPrice / matchDetail.needed);
  const isFull = availableSlots === 0;
  const detailId = id ?? matchDetail.id;
  const isPaymentCountdown = rawMatch?.status === 'PaymentPending' && Boolean(rawMatch.paymentDeadline);
  const countdownTarget = isPaymentCountdown
    ? new Date(rawMatch!.paymentDeadline!).getTime()
    : new Date(rawMatch?.startTime ?? `${matchDetail.date}T${matchDetail.startTime}:00`).getTime();
  const countdownMilliseconds = Number.isFinite(countdownTarget) ? Math.max(0, countdownTarget - currentTime) : 0;
  const countdownSeconds = Math.floor(countdownMilliseconds / 1_000);
  const countdownDays = Math.floor(countdownSeconds / 86_400);
  const countdownHours = Math.floor((countdownSeconds % 86_400) / 3_600);
  const countdownMinutes = Math.floor((countdownSeconds % 3_600) / 60);
  const countdownRemainingSeconds = countdownSeconds % 60;
  const showCountdown = rawMatch?.status === 'Waiting' || rawMatch?.status === 'Full' || isPaymentCountdown;
  const twoDigits = (value: number) => value.toString().padStart(2, '0');

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
              {showCountdown && (
                <div className="mt-5 border-t border-white/20 pt-4">
                  <p className="text-[12px] font-bold uppercase tracking-wide text-white/72">
                    {isPaymentCountdown ? 'Hạn thanh toán còn' : 'Trận bắt đầu sau'}
                  </p>
                  {countdownMilliseconds > 0 ? (
                    <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                      {[
                        { value: countdownDays, label: 'Ngày' },
                        { value: countdownHours, label: 'Giờ' },
                        { value: countdownMinutes, label: 'Phút' },
                        { value: countdownRemainingSeconds, label: 'Giây' },
                      ].map((item) => (
                        <div className="rounded-lg bg-white/12 px-2 py-2" key={item.label}>
                          <p className="text-[20px] font-bold tabular-nums">{twoDigits(item.value)}</p>
                          <p className="mt-0.5 text-[10px] font-bold uppercase text-white/65">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 rounded-lg bg-white/12 px-3 py-3 text-center text-[14px] font-bold">
                      {isPaymentCountdown ? 'Đã hết thời gian thanh toán' : 'Đã đến giờ thi đấu'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1200px] grid-cols-1 gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] font-bold text-red-700">{error}</div>}
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

            {rawMatch?.isHost && rawMatch.participants.some((participant) => participant.status === 'Pending') && (
              <div className="mb-5 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[14px] font-bold text-amber-900">Yêu cầu đang chờ chủ trận duyệt</p>
                {rawMatch.participants.filter((participant) => participant.status === 'Pending').map((participant) => (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3" key={participant.participantId}>
                    <span className="text-[14px] font-bold">{participant.playerName} · Level {participant.skillLevel.toFixed(1)}</span>
                    <div className="flex gap-2">
                      <button className="rounded-lg border border-red-300 px-3 py-2 text-[12px] font-bold text-red-700" onClick={() => token && void rejectParticipant(token, matchId, participant.participantId).then(loadMatch)} type="button">Từ chối</button>
                      <button className="rounded-lg bg-primary px-3 py-2 text-[12px] font-bold text-white" onClick={() => token && void acceptParticipant(token, matchId, participant.participantId).then(loadMatch)} type="button">Chấp nhận</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

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

            {rawMatch?.myQrImageUrl && rawMatch.myPaymentStatus === 'Pending' && (
              <img alt="QR thanh toán" className="mx-auto mt-5 w-full max-w-[260px] rounded-xl border border-outline-variant" src={rawMatch.myQrImageUrl} />
            )}
            {rawMatch?.myTransferContent && rawMatch.myPaymentStatus === 'Pending' && (
              <div className="mt-3 rounded-lg bg-surface-container-low p-3 text-center text-[13px]">Nội dung chuyển khoản: <strong>{rawMatch.myTransferContent}</strong></div>
            )}
            {hasJoined && rawMatch?.myPaymentStatus === 'Pending' && (
              <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-primary p-3 text-center text-[13px] font-bold text-primary">
                {receipt ? receipt.name : 'Chọn ảnh biên lai'}
                <input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" />
              </label>
            )}

            {rawMatch?.isHost ? (
              <div className="mt-5 rounded-lg bg-primary/10 p-3 text-center text-[13px] font-bold text-primary">Bạn là chủ trận. Hãy duyệt người chơi ở danh sách bên trái.</div>
            ) : !hasJoined ? (
              <button
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[15px] font-bold text-white hover:bg-primary/90"
                disabled={rawMatch?.myParticipantStatus === 'Pending'}
                onClick={() => void handleJoin()}
                type="button"
              >
                <UserCheck className="h-5 w-5" />
                {rawMatch?.myParticipantStatus === 'Pending' ? 'Đang chờ chủ trận duyệt' : 'Tham gia trận'}
              </button>
            ) : (
              <button
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-[15px] font-bold text-white ${
                  hasPaid ? 'bg-[#6f7a61]' : 'bg-primary hover:bg-primary/90'
                }`}
                disabled={hasPaid || rawMatch?.myPaymentStatus === 'WaitingForConfirmation' || rawMatch?.myPaymentStatus !== 'Pending'}
                onClick={() => void handlePayment()}
                type="button"
              >
                <CreditCard className="h-5 w-5" />
                {hasPaid ? 'Bạn đã thanh toán' : rawMatch?.myPaymentStatus === 'WaitingForConfirmation' ? 'Đang chờ xác nhận biên lai' : rawMatch?.myPaymentStatus === 'Pending' ? 'Gửi biên lai thanh toán' : 'Chờ trận đủ người'}
              </button>
            )}

            {!rawMatch?.isHost && (hasJoined || rawMatch?.myParticipantStatus === 'Pending') && !hasPaid && (
              <button
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[15px] font-bold text-on-surface hover:bg-surface-container-low"
                onClick={() => void handleLeave()}
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
