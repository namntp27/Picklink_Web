import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CalendarRange,
  Check,
  Clock,
  CreditCard,
  MapPin,
  MessageCircle,
  Send,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserMinus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import { getCourtAvailability, type CourtAvailability } from '../../api/booking';
import {
  acceptParticipant,
  cancelMatch,
  createMatchBooking,
  getMatchDetail,
  getMatchMessages,
  joinMatch,
  leaveMatch,
  markMatchReadyToBook,
  rejectParticipant,
  removeParticipant,
  sendMatchMessage,
  type MatchDetailResponse,
  type MatchMessage,
} from '../../api/matches';
import { submitBankTransfer } from '../../api/payment';
import { useAuth } from '../../auth/AuthContext';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';

const statusLabels: Record<MatchDetailResponse['status'], string> = {
  Recruiting: 'Đang tìm người',
  ReadyToBook: 'Sẵn sàng đặt sân',
  BookingPending: 'Đã tạo booking, chờ thanh toán',
  Booked: 'Đã đặt sân',
  Completed: 'Đã hoàn thành',
  Cancelled: 'Đã hủy',
  Expired: 'Đã hết hạn',
};

const dateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric',
}).format(new Date(`${value}T00:00:00`));
const dateTimeLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
}).format(new Date(value));
const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency', currency: 'VND', maximumFractionDigits: 0,
});
const approvedStatus = (status: string) => status === 'Approved' || status === 'Accepted';
const timePart = (value: string) => value.slice(11, 16);

export const MatchDetail = () => {
  const { id } = useParams();
  const matchId = Number(id);
  const navigate = useNavigate();
  const { token } = useAuth();
  const [match, setMatch] = useState<MatchDetailResponse | null>(null);
  const [messages, setMessages] = useState<MatchMessage[]>([]);
  const [message, setMessage] = useState('');
  const [selectedVenueId, setSelectedVenueId] = useState<number | null>(null);
  const [bookingDate, setBookingDate] = useState('');
  const [availability, setAvailability] = useState<CourtAvailability | null>(null);
  const [courtId, setCourtId] = useState<number | null>(null);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const loadMatch = async () => {
    if (!token || !Number.isInteger(matchId)) return;
    try {
      const result = await getMatchDetail(token, matchId);
      setMatch(result);
      setSelectedVenueId((current) => current ?? result.preferredVenues[0]?.venueId ?? null);
      setBookingDate((current) => current || result.availableDateFrom);
      setError('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải phòng ghép trận.');
    }
  };

  const loadMessages = async () => {
    if (!token || !match?.conversationId) return;
    try {
      setMessages(await getMatchMessages(token, matchId));
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => { void loadMatch(); }, [matchId, token]);
  useEffect(() => { void loadMessages(); }, [match?.conversationId, token]);
  useMatchRealtime((event) => {
    if (event.matchId !== matchId) return;
    if (event.action === 'Expired') {
      navigate('/opponents?expired=1', { replace: true });
      return;
    }
    if (event.action === 'MessageSent') {
      void loadMessages();
      return;
    }
    void loadMatch();
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    if (!selectedVenueId || !bookingDate || match?.status !== 'ReadyToBook') {
      setAvailability(null);
      return;
    }
    getCourtAvailability(selectedVenueId, bookingDate, token)
      .then((result) => {
        setAvailability(result);
        setCourtId((current) => result.courts.some((court) => court.courtId === current)
          ? current
          : result.courts[0]?.courtId ?? null);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Không thể tải lịch sân.'));
  }, [selectedVenueId, bookingDate, match?.status, token]);

  const approved = useMemo(
    () => match?.participants.filter((participant) => approvedStatus(participant.status)) ?? [],
    [match],
  );
  const pending = match?.participants.filter((participant) => participant.status === 'Pending') ?? [];
  const isApprovedMember = Boolean(match?.isHost || match?.myParticipantStatus && approvedStatus(match.myParticipantStatus));
  const isFull = Boolean(match && approved.length === match.requiredPlayerCount);
  const availableSlots = useMemo(
    () => availability?.slots
      .filter((slot) =>
        slot.courtId === courtId
        && slot.status === 'Available'
        && timePart(slot.startTime) >= (match?.preferredTimeStart ?? '00:00')
        && timePart(slot.endTime) <= (match?.preferredTimeEnd ?? '23:59'))
      .sort((left, right) => left.startTime.localeCompare(right.startTime)) ?? [],
    [availability, courtId, match?.preferredTimeStart, match?.preferredTimeEnd],
  );
  const startOptions = useMemo(
    () => Array.from(new Set(availableSlots.map((slot) => timePart(slot.startTime)))),
    [availableSlots],
  );
  const endOptions = useMemo(() => {
    if (!startTime) return [];
    const startIndex = availableSlots.findIndex((slot) => timePart(slot.startTime) === startTime);
    if (startIndex < 0) return [];
    const values: string[] = [];
    for (let index = startIndex; index < availableSlots.length; index += 1) {
      if (index > startIndex && availableSlots[index].startTime !== availableSlots[index - 1].endTime) break;
      values.push(timePart(availableSlots[index].endTime));
    }
    return values;
  }, [availableSlots, startTime]);

  const run = async (action: () => Promise<unknown>) => {
    setIsBusy(true);
    setError('');
    try {
      await action();
      await loadMatch();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể thực hiện thao tác.');
    } finally {
      setIsBusy(false);
    }
  };

  const createBooking = () => {
    if (!token || !courtId || !bookingDate || !startTime || !endTime) {
      setError('Vui lòng chọn đủ cụm sân, sân con, ngày và giờ.');
      return;
    }
    void run(() => createMatchBooking(token, matchId, {
      courtId,
      startTime: `${bookingDate}T${startTime}:00`,
      endTime: `${bookingDate}T${endTime}:00`,
    }));
  };

  const sendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!token || !message.trim()) return;
    try {
      const sent = await sendMatchMessage(token, matchId, message.trim());
      setMessages((current) => current.some((item) => item.messageId === sent.messageId)
        ? current
        : [...current, sent]);
      setMessage('');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Không thể gửi tin nhắn.');
    }
  };

  const pay = async () => {
    if (!token || !match?.bookingId || !receipt) {
      setError('Vui lòng chọn ảnh biên lai.');
      return;
    }
    await run(() => submitBankTransfer(token, match.bookingId!, receipt));
    setReceipt(null);
  };

  if (!match) {
    return <div className="min-h-screen bg-[#f9f9ff] pt-32 text-center text-[15px] font-bold">{error || 'Đang tải phòng ghép trận...'}</div>;
  }

  const inputClass = 'h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] outline-none focus:border-primary';

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-[1200px] px-4 py-9 md:px-margin-desktop">
          <Link className="inline-flex items-center gap-2 text-[14px] font-bold text-white/85" to="/opponents/pending">
            <ArrowLeft className="h-4 w-4" /> Danh sách lời mời
          </Link>
          <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 text-[13px] font-bold"><ShieldCheck className="h-4 w-4" /> Phòng #{match.matchId}</span>
              <h1 className="mt-4 text-[32px] font-bold md:text-[42px]">{match.title}</h1>
              <p className="mt-2 text-[14px] font-bold text-white/75">Chủ phòng: {match.hostName}</p>
              <p className="mt-3 max-w-3xl text-[16px] leading-7 text-white/85">{match.note || 'Chủ phòng chưa thêm mô tả.'}</p>
            </div>
            <div className="rounded-xl border border-white/20 bg-white/10 p-5">
              <p className="text-[12px] font-bold uppercase text-white/70">Trạng thái</p>
              <p className="mt-2 text-[20px] font-bold">{statusLabels[match.status]}</p>
              <p className="mt-2 text-[14px]">{approved.length}/{match.requiredPlayerCount} thành viên chính thức</p>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto grid max-w-[1200px] gap-6 px-4 py-8 md:px-margin-desktop lg:grid-cols-[minmax(0,1fr)_370px]">
        <div className="space-y-6">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[13px] font-bold text-red-700">{error}</div>}

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h2 className="text-[21px] font-bold">Phạm vi lời mời</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-lg bg-surface-container-low p-4"><MapPin className="h-5 w-5 text-primary" /><p className="mt-2 text-[12px] font-bold text-on-surface-variant">Khu vực</p><p className="mt-1 text-[14px] font-bold">{match.ward}, {match.province}</p><p className="text-[12px]">Bán kính {match.searchRadiusKm} km</p></div>
              <div className="rounded-lg bg-surface-container-low p-4"><CalendarRange className="h-5 w-5 text-primary" /><p className="mt-2 text-[12px] font-bold text-on-surface-variant">Ngày có thể chơi</p><p className="mt-1 text-[14px] font-bold">{dateLabel(match.availableDateFrom)} – {dateLabel(match.availableDateTo)}</p></div>
              <div className="rounded-lg bg-surface-container-low p-4"><Clock className="h-5 w-5 text-primary" /><p className="mt-2 text-[12px] font-bold text-on-surface-variant">Giờ mong muốn</p><p className="mt-1 text-[14px] font-bold">{match.preferredTimeStart} – {match.preferredTimeEnd}</p></div>
              <div className="rounded-lg bg-surface-container-low p-4"><Users className="h-5 w-5 text-primary" /><p className="mt-2 text-[12px] font-bold text-on-surface-variant">Trình độ / hình thức</p><p className="mt-1 text-[14px] font-bold">Level {match.minSkillLevel}–{match.maxSkillLevel} · {match.matchType}</p></div>
            </div>
            <div className="mt-4">
              <p className="mb-2 text-[13px] font-bold">Cụm sân mong muốn</p>
              <div className="flex flex-wrap gap-2">{match.preferredVenues.map((venue) => <span className="rounded-full border border-outline-variant px-3 py-2 text-[12px] font-bold" key={venue.venueId}>{venue.venueName}</span>)}</div>
            </div>
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div><h2 className="text-[21px] font-bold">Thành viên</h2><p className="mt-1 text-[13px] text-on-surface-variant">Yêu cầu chờ duyệt chưa được tính và chưa thể truy cập chat.</p></div>
              <span className="rounded-full bg-primary/10 px-3 py-2 text-[13px] font-bold text-primary">{approved.length}/{match.requiredPlayerCount}</span>
            </div>

            {match.isHost && pending.length > 0 && (
              <div className="mt-5 space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-[14px] font-bold text-amber-900">Yêu cầu đang chờ duyệt</p>
                {pending.map((participant) => (
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-3" key={participant.participantId}>
                    <div><p className="text-[14px] font-bold">{participant.playerName}</p><p className="text-[12px] text-on-surface-variant">Level {participant.skillLevel.toFixed(1)}</p></div>
                    <div className="flex gap-2">
                      <button className="grid h-9 w-9 place-items-center rounded-lg border border-red-300 text-red-700" disabled={isBusy} onClick={() => token && void run(() => rejectParticipant(token, matchId, participant.participantId))} title="Từ chối" type="button"><X className="h-4 w-4" /></button>
                      <button className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-white" disabled={isBusy} onClick={() => token && void run(() => acceptParticipant(token, matchId, participant.participantId))} title="Chấp nhận" type="button"><Check className="h-4 w-4" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {approved.map((participant) => (
                <article className="flex items-center gap-3 rounded-lg border border-outline-variant p-4" key={participant.participantId}>
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary text-[13px] font-bold text-white">{participant.playerName.split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase()}</div>
                  <div className="min-w-0 flex-1"><p className="truncate text-[14px] font-bold">{participant.playerName}</p><p className="text-[12px] text-on-surface-variant">{participant.isHost ? 'Chủ phòng' : 'Thành viên'} · Level {participant.skillLevel.toFixed(1)}</p></div>
                  {match.isHost && !participant.isHost && match.status !== 'BookingPending' && match.status !== 'Booked' && (
                    <button className="text-red-600" disabled={isBusy} onClick={() => token && void run(() => removeParticipant(token, matchId, participant.participantId))} title="Loại thành viên" type="button"><Trash2 className="h-5 w-5" /></button>
                  )}
                </article>
              ))}
            </div>
          </section>

          {match.isHost && match.status === 'ReadyToBook' && (
            <section className="rounded-xl border-2 border-primary bg-white p-5 shadow-sm">
              <h2 className="text-[22px] font-bold">Chọn lịch và tạo booking</h2>
              <p className="mt-1 text-[13px] text-on-surface-variant">Chỉ các cụm sân, ngày và giờ nằm trong lời mời mới được chấp nhận.</p>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <label><span className="mb-1 block text-[13px] font-bold">Cụm sân</span><select className={inputClass} onChange={(event) => { setSelectedVenueId(Number(event.target.value)); setCourtId(null); setStartTime(''); setEndTime(''); }} value={selectedVenueId ?? ''}>{match.preferredVenues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select></label>
                <label><span className="mb-1 block text-[13px] font-bold">Ngày chơi chính xác</span><input className={inputClass} max={match.availableDateTo} min={match.availableDateFrom} onChange={(event) => { setBookingDate(event.target.value); setStartTime(''); setEndTime(''); }} type="date" value={bookingDate} /></label>
                <label><span className="mb-1 block text-[13px] font-bold">Sân con</span><select className={inputClass} onChange={(event) => { setCourtId(Number(event.target.value)); setStartTime(''); setEndTime(''); }} value={courtId ?? ''}><option value="">Chọn sân</option>{availability?.courts.map((court) => <option key={court.courtId} value={court.courtId}>Sân {court.courtNumber} · {court.courtType}</option>)}</select></label>
                <div className="grid grid-cols-2 gap-2">
                  <label><span className="mb-1 block text-[13px] font-bold">Bắt đầu</span><select className={inputClass} onChange={(event) => { setStartTime(event.target.value); setEndTime(''); }} value={startTime}><option value="">Chọn giờ</option>{startOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label><span className="mb-1 block text-[13px] font-bold">Kết thúc</span><select className={inputClass} onChange={(event) => setEndTime(event.target.value)} value={endTime}><option value="">Chọn giờ</option>{endOptions.map((value) => <option key={value}>{value}</option>)}</select></label>
                </div>
              </div>
              <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[15px] font-bold text-white disabled:opacity-50" disabled={isBusy || !courtId || !startTime || !endTime} onClick={createBooking} type="button"><CreditCard className="h-5 w-5" /> Tạo booking và chuyển sang thanh toán</button>
            </section>
          )}

          {match.bookingId && (
            <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
              <h2 className="text-[21px] font-bold">Booking đã chọn</h2>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <div className="rounded-lg bg-surface-container-low p-4"><p className="text-[12px] font-bold text-on-surface-variant">Sân</p><p className="mt-1 text-[14px] font-bold">{match.venueName} · Sân {match.courtNumber}</p><p className="mt-1 text-[12px]">{match.address}</p></div>
                <div className="rounded-lg bg-surface-container-low p-4"><p className="text-[12px] font-bold text-on-surface-variant">Thời gian</p><p className="mt-1 text-[14px] font-bold">{match.startTime && dateTimeLabel(match.startTime)}</p><p className="mt-1 text-[12px]">Đến {match.endTime && dateTimeLabel(match.endTime)}</p></div>
                <div className="rounded-lg bg-surface-container-low p-4"><p className="text-[12px] font-bold text-on-surface-variant">Chi phí</p><p className="mt-1 text-[17px] font-bold text-primary">{currency.format(match.amountPerPlayer)}/người</p><p className="mt-1 text-[12px]">Tổng {currency.format(match.totalBookingAmount)}</p></div>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
          <section className="rounded-xl border border-primary bg-white p-5 shadow-sm">
            <h3 className="text-[18px] font-bold">Thao tác</h3>
            {!match.isHost && !isApprovedMember && match.myParticipantStatus !== 'Pending' && match.status === 'Recruiting' && (
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white" disabled={isBusy} onClick={() => token && void run(() => joinMatch(token, matchId))} type="button"><UserCheck className="h-5 w-5" /> Yêu cầu tham gia</button>
            )}
            {!match.isHost && match.myParticipantStatus === 'Pending' && <div className="mt-4 rounded-lg bg-amber-50 p-3 text-center text-[13px] font-bold text-amber-800">Đang chờ chủ phòng duyệt</div>}
            {!match.isHost && (match.myParticipantStatus === 'Pending' || isApprovedMember) && match.status !== 'BookingPending' && match.status !== 'Booked' && (
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-3 text-[14px] font-bold" disabled={isBusy} onClick={() => token && void run(() => leaveMatch(token, matchId))} type="button"><XCircle className="h-5 w-5" /> Rút yêu cầu / rời phòng</button>
            )}
            {match.isHost && match.status === 'Recruiting' && isFull && (
              <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white" disabled={isBusy} onClick={() => token && void run(() => markMatchReadyToBook(token, matchId))} type="button"><ShieldCheck className="h-5 w-5" /> Chuyển sang sẵn sàng đặt sân</button>
            )}
            {match.isHost && ['Recruiting', 'ReadyToBook', 'BookingPending'].includes(match.status) && (
              <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-red-300 px-4 py-3 text-[14px] font-bold text-red-700" disabled={isBusy} onClick={() => token && window.confirm('Hủy phòng ghép trận này?') && void run(() => cancelMatch(token, matchId))} type="button"><XCircle className="h-5 w-5" /> Hủy phòng</button>
            )}
          </section>

          {match.status === 'BookingPending' && isApprovedMember && (
            <section className="rounded-xl border border-primary bg-white p-5 shadow-sm">
              <h3 className="flex items-center gap-2 text-[18px] font-bold"><CreditCard className="h-5 w-5 text-primary" /> Thanh toán booking</h3>
              <p className="mt-2 text-[14px]">Phần của bạn: <strong className="text-primary">{currency.format(match.amountPerPlayer)}</strong></p>
              {match.myQrImageUrl && match.myPaymentStatus === 'Pending' && <img alt="QR thanh toán" className="mx-auto mt-4 w-full max-w-[250px] rounded-lg border" src={match.myQrImageUrl} />}
              {match.myTransferContent && <p className="mt-3 rounded-lg bg-surface-container-low p-3 text-center text-[12px]">Nội dung: <strong>{match.myTransferContent}</strong></p>}
              {match.myPaymentStatus === 'Pending' && (
                <>
                  <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-primary p-3 text-center text-[13px] font-bold text-primary">
                    {receipt?.name || 'Chọn ảnh biên lai'}<input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] ?? null)} type="file" />
                  </label>
                  <button className="mt-3 w-full rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white disabled:opacity-50" disabled={!receipt || isBusy} onClick={() => void pay()} type="button">Gửi biên lai</button>
                </>
              )}
              {match.myPaymentStatus === 'WaitingForConfirmation' && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-center text-[13px] font-bold text-amber-800">Đang chờ sân xác nhận biên lai</p>}
              {match.myPaymentStatus === 'Paid' && <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-center text-[13px] font-bold text-emerald-700">Đã thanh toán</p>}
            </section>
          )}

          <section className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
            <h3 className="flex items-center gap-2 text-[18px] font-bold"><MessageCircle className="h-5 w-5 text-primary" /> Chat phòng</h3>
            {!match.conversationId ? (
              <p className="mt-3 rounded-lg bg-surface-container-low p-4 text-[13px] leading-6 text-on-surface-variant">
                Chỉ chủ phòng và thành viên đã được duyệt mới truy cập được chat.
              </p>
            ) : (
              <>
                <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-lg bg-surface-container-low p-3">
                  {messages.map((item) => (
                    <div className={`max-w-[88%] rounded-lg px-3 py-2 text-[13px] ${item.isMine ? 'ml-auto bg-primary text-white' : 'bg-white'}`} key={item.messageId}>
                      {!item.isMine && <p className="mb-1 text-[11px] font-bold text-primary">{item.senderName}</p>}
                      <p className="whitespace-pre-wrap">{item.content}</p>
                    </div>
                  ))}
                  {messages.length === 0 && <p className="py-6 text-center text-[12px] text-on-surface-variant">Chưa có tin nhắn. Hãy bắt đầu thống nhất sân và lịch chơi.</p>}
                  <div ref={messagesEndRef} />
                </div>
                <form className="mt-3 flex gap-2" onSubmit={sendMessage}>
                  <input className="h-11 min-w-0 flex-1 rounded-lg border border-outline-variant px-3 text-[13px]" maxLength={1000} onChange={(event) => setMessage(event.target.value)} placeholder="Nhập tin nhắn..." value={message} />
                  <button className="grid h-11 w-11 place-items-center rounded-lg bg-primary text-white" type="submit"><Send className="h-5 w-5" /></button>
                </form>
              </>
            )}
          </section>

          <section className="rounded-xl border border-outline-variant bg-white p-5 text-[13px] leading-6 text-on-surface-variant shadow-sm">
            <h3 className="flex items-center gap-2 text-[17px] font-bold text-on-surface"><AlertCircle className="h-5 w-5 text-primary" /> Lưu ý</h3>
            <p className="mt-2">Lời mời không giữ chỗ sân. Nếu booking hết hạn thanh toán, phòng quay lại trạng thái sẵn sàng đặt sân để chủ phòng chọn slot khác.</p>
          </section>
        </aside>
      </main>
    </div>
  );
};
