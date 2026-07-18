import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CalendarDays, Loader2, Plus, Ticket, UsersRound, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { ApiError, type PaginatedResponse } from '../../api/client';
import { getOwnerVenues, type OwnerVenue } from '../../api/owner';
import {
  createOwnerTicketSession,
  getOwnerTicketSessions,
  type TicketSession,
  type TicketSessionInput,
  type TicketSessionStatus,
} from '../../api/ticketing';
import { useAuth } from '../../auth/AuthContext';
import { PaginationControls } from '../../components/PaginationControls';
import { ModalDialog } from '../../components/ui/ModalDialog';
import { useToast } from '../../components/ui/ToastRegion';
import { usePaymentRealtime } from '../../hooks/usePaymentRealtime';
import { useScheduleRealtime } from '../../hooks/useScheduleRealtime';
import { OwnerShell } from './components/OwnerShell';

const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('vi-VN', {
  weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const statusLabels: Record<TicketSessionStatus, string> = {
  Draft: 'Bản nháp', Published: 'Đang bán vé', Completed: 'Đã kết thúc', Cancelled: 'Đã hủy',
};
const statusClasses: Record<TicketSessionStatus, string> = {
  Draft: 'bg-[#eef2e8] text-[#596151]',
  Published: 'bg-[#e2ff57]/55 text-[#17310a]',
  Completed: 'bg-[#edf4e9] text-[#477313]',
  Cancelled: 'bg-red-50 text-red-700',
};
const emptyPage: PaginatedResponse<TicketSession> = {
  items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0,
};
const tomorrow = () => {
  const value = new Date();
  value.setDate(value.getDate() + 1);
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};
const today = () => {
  const value = new Date();
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
};
const withSeconds = (value: string) => value.length === 5 ? `${value}:00` : value;

const CreateSessionModal = ({ token, venues, onClose, onCreated }: {
  token: string;
  venues: OwnerVenue[];
  onClose: () => void;
  onCreated: (session: TicketSession) => void;
}) => {
  const notify = useToast();
  const selectableVenues = useMemo(
    () => venues.filter((venue) => venue.approvalStatus === 'Approved' && venue.isOpen),
    [venues],
  );
  const initialVenue = selectableVenues[0];
  const initialCourt = initialVenue?.courts.find((court) => court.availabilityStatus === 'Available');
  const [venueId, setVenueId] = useState(initialVenue ? String(initialVenue.venueId) : '');
  const [courtId, setCourtId] = useState(initialCourt ? String(initialCourt.courtId) : '');
  const [date, setDate] = useState(tomorrow);
  const [startTime, setStartTime] = useState('18:00');
  const [endTime, setEndTime] = useState('19:00');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [skillLevel, setSkillLevel] = useState('3');
  const [playFormat, setPlayFormat] = useState('2vs2');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [ticketPrice, setTicketPrice] = useState('100000');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const selectedVenue = selectableVenues.find((venue) => venue.venueId === Number(venueId));
  const courts = selectedVenue?.courts.filter((court) => court.availabilityStatus === 'Available') ?? [];

  useEffect(() => {
    if (venueId || !selectableVenues[0]) return;
    const venue = selectableVenues[0];
    setVenueId(String(venue.venueId));
    setCourtId(String(venue.courts.find((court) => court.availabilityStatus === 'Available')?.courtId ?? ''));
  }, [selectableVenues, venueId]);

  const changeVenue = (value: string) => {
    setVenueId(value);
    const venue = selectableVenues.find((item) => item.venueId === Number(value));
    setCourtId(String(venue?.courts.find((court) => court.availabilityStatus === 'Available')?.courtId ?? ''));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    const players = Number(maxPlayers);
    const price = Number(ticketPrice);
    const start = new Date(`${date}T${startTime}:00`);
    const end = new Date(`${date}T${endTime}:00`);
    const validation = !venueId || !courtId
      ? 'Hãy chọn cụm sân và sân đang hoạt động.'
      : title.trim().length < 3
        ? 'Tên buổi chơi cần ít nhất 3 ký tự.'
        : !(start < end)
          ? 'Giờ kết thúc phải sau giờ bắt đầu.'
          : start <= new Date()
            ? 'Khung giờ chơi phải ở trong tương lai.'
            : !Number.isInteger(players) || players < 1 || players > 100
              ? 'Số người tối đa phải từ 1 đến 100.'
              : !Number.isInteger(price) || price < 0
                ? 'Giá vé phải là số nguyên VND không âm.'
                : '';
    if (validation) { setError(validation); return; }

    const input: TicketSessionInput = {
      venueId: Number(venueId), courtId: Number(courtId), date,
      startTime: withSeconds(startTime), endTime: withSeconds(endTime),
      title: title.trim(), description: description.trim() || undefined,
      skillLevel, playFormat, maxPlayers: players, ticketPrice: price,
    };
    setSaving(true);
    try {
      const session = await createOwnerTicketSession(token, input);
      notify('Đã tạo bản nháp buổi xé vé.', 'success');
      onCreated(session);
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tạo buổi xé vé.');
    } finally { setSaving(false); }
  };

  return (
    <ModalDialog aria-labelledby="create-ticket-session-title" canClose={!saving} className="owner-modal max-w-4xl" onRequestClose={onClose} style={{ width: 'calc(100% - 1.75rem)' }}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="owner-kicker"><Ticket className="h-4 w-4" /> Buổi chơi mới</p>
          <h2 className="mt-1 text-[25px]" id="create-ticket-session-title">Tạo buổi xé vé</h2>
          <p className="mt-1 text-[13px] text-on-surface-variant">Lưu bản nháp để kiểm tra trước khi đăng bán.</p>
        </div>
        <button aria-label="Đóng" className="rounded-lg p-2 hover:bg-surface-container-low" disabled={saving} onClick={onClose} type="button"><X className="h-5 w-5" /></button>
      </div>
      <form className="mt-5 grid gap-4" onSubmit={submit}>
        {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700" role="alert">{error}</div>}
        {selectableVenues.length === 0 && <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] font-bold text-amber-800">Chưa có cụm sân đã duyệt và đang mở.</div>}
        <div className="grid gap-4 sm:grid-cols-2">
          <label><span className="mb-1.5 block text-[13px] font-bold">Cụm sân *</span><select className="w-full" onChange={(event) => changeVenue(event.target.value)} required value={venueId}><option value="">Chọn cụm sân</option>{selectableVenues.map((venue) => <option key={venue.venueId} value={venue.venueId}>{venue.venueName}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[13px] font-bold">Sân *</span><select className="w-full" onChange={(event) => setCourtId(event.target.value)} required value={courtId}><option value="">Chọn sân</option>{courts.map((court) => <option key={court.courtId} value={court.courtId}>Sân {court.courtNumber} · {court.courtType}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[13px] font-bold">Ngày chơi *</span><input className="w-full px-3" min={today()} onChange={(event) => setDate(event.target.value)} required type="date" value={date} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label><span className="mb-1.5 block text-[13px] font-bold">Bắt đầu *</span><input className="w-full px-3" onChange={(event) => setStartTime(event.target.value)} required step={1800} type="time" value={startTime} /></label>
            <label><span className="mb-1.5 block text-[13px] font-bold">Kết thúc *</span><input className="w-full px-3" onChange={(event) => setEndTime(event.target.value)} required step={1800} type="time" value={endTime} /></label>
          </div>
        </div>
        <label><span className="mb-1.5 block text-[13px] font-bold">Tên buổi chơi *</span><input className="w-full px-3" maxLength={200} minLength={3} onChange={(event) => setTitle(event.target.value)} placeholder="Ví dụ: Kèo vui tối thứ Sáu" required value={title} /></label>
        <label><span className="mb-1.5 block text-[13px] font-bold">Mô tả</span><textarea className="min-h-24 w-full border p-3" maxLength={2000} onChange={(event) => setDescription(event.target.value)} value={description} /></label>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label><span className="mb-1.5 block text-[13px] font-bold">Trình độ *</span><select className="w-full" onChange={(event) => setSkillLevel(event.target.value)} value={skillLevel}>{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>Level {value}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[13px] font-bold">Hình thức *</span><select className="w-full" onChange={(event) => setPlayFormat(event.target.value)} value={playFormat}><option value="1vs1">Đánh đơn · 1vs1</option><option value="2vs2">Đánh đôi · 2vs2</option></select></label>
          <label><span className="mb-1.5 block text-[13px] font-bold">Số người tối đa *</span><input className="w-full px-3" max={100} min={1} onChange={(event) => setMaxPlayers(event.target.value)} required type="number" value={maxPlayers} /></label>
          <label><span className="mb-1.5 block text-[13px] font-bold">Giá mỗi vé (VND) *</span><input className="w-full px-3" min={0} onChange={(event) => setTicketPrice(event.target.value)} required step={1} type="number" value={ticketPrice} /></label>
        </div>
        <div className="flex justify-end gap-3 border-t border-outline-variant pt-4">
          <button className="rounded-lg border border-outline-variant px-4 py-2.5 text-[13px] font-bold" disabled={saving} onClick={onClose} type="button">Đóng</button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-[13px] font-bold disabled:opacity-50" disabled={saving || selectableVenues.length === 0} type="submit">{saving && <Loader2 className="h-4 w-4 animate-spin" />} Lưu bản nháp</button>
        </div>
      </form>
    </ModalDialog>
  );
};

export const OwnerTicketSessions = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [result, setResult] = useState(emptyPage);
  const [venues, setVenues] = useState<OwnerVenue[]>([]);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async (showLoading = true) => {
    if (!token) return;
    if (showLoading) setLoading(true);
    setError('');
    try {
      setResult(await getOwnerTicketSessions(token, {
        status: status || undefined,
        page,
        pageSize: 10,
      }));
    } catch (requestError) {
      setError(requestError instanceof ApiError ? requestError.message : 'Không thể tải danh sách buổi xé vé.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [page, status, token]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!token) return;
    void getOwnerVenues(token).then(setVenues).catch(() => setVenues([]));
  }, [token]);
  useScheduleRealtime((event) => { if (event.entryType === 'TicketSession') void load(false); });
  usePaymentRealtime(() => { void load(false); });

  return (
    <OwnerShell activeId="ticketSessions">
      <section className="owner-page-header">
        <div>
          <p className="owner-kicker"><Ticket className="h-4 w-4" /> Xé vé Pickleball</p>
          <h1 className="mt-2">Quản lý buổi xé vé</h1>
          <p className="mt-1">Tạo buổi chơi có sân và giờ cụ thể, mở bán từng vé và theo dõi người tham gia.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-[13px] font-bold" onClick={() => setCreating(true)} type="button">
          <Plus className="h-4 w-4" /> Tạo buổi mới
        </button>
      </section>

      <section className="owner-stat-grid sm:grid-cols-3">
        <div className="owner-stat-card"><p className="text-[12px] font-bold text-on-surface-variant">Tổng theo bộ lọc</p><p className="mt-2 text-[24px] font-extrabold">{result.totalCount}</p></div>
        <div className="owner-stat-card"><p className="text-[12px] font-bold text-on-surface-variant">Vé đã bán trên trang</p><p className="mt-2 text-[24px] font-extrabold">{result.items.reduce((sum, item) => sum + item.soldTickets, 0)}</p></div>
        <div className="owner-stat-card"><p className="text-[12px] font-bold text-on-surface-variant">Đang giữ chỗ trên trang</p><p className="mt-2 text-[24px] font-extrabold">{result.items.reduce((sum, item) => sum + item.reservedTickets, 0)}</p></div>
      </section>

      <section className="owner-panel">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-outline-variant p-4">
          <div>
            <h2 className="text-[18px]">Danh sách buổi chơi</h2>
            <p className="mt-1 text-[12px] text-on-surface-variant">Xé vé do Owner tạo, tách biệt hoàn toàn với Ghép trận.</p>
          </div>
          <label className="min-w-44">
            <span className="mb-1 block text-[11px] font-bold text-on-surface-variant">Trạng thái</span>
            <select className="w-full" onChange={(event) => { setStatus(event.target.value); setPage(1); }} value={status}>
              <option value="">Tất cả</option>
              {(Object.keys(statusLabels) as TicketSessionStatus[]).map((value) => <option key={value} value={value}>{statusLabels[value]}</option>)}
            </select>
          </label>
        </div>

        {error && <div className="m-4 rounded-lg border border-red-200 bg-red-50 p-3 text-[13px] font-bold text-red-700" role="alert">{error}</div>}
        {loading ? (
          <div className="flex min-h-52 items-center justify-center" role="status"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span className="sr-only">Đang tải</span></div>
        ) : result.items.length === 0 ? (
          <div className="grid min-h-52 place-items-center p-8 text-center"><div><Ticket className="mx-auto h-9 w-9 text-on-surface-variant" /><p className="mt-3 font-bold">Chưa có buổi xé vé trong bộ lọc này.</p></div></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead><tr><th>Buổi chơi</th><th>Sân & thời gian</th><th>Vé</th><th>Giá vé</th><th>Trạng thái</th><th className="text-right">Thao tác</th></tr></thead>
              <tbody>{result.items.map((session) => (
                <tr className="border-t border-outline-variant" key={session.ticketSessionId}>
                  <td><p className="font-bold">{session.title}</p><p className="mt-1 text-[12px] text-on-surface-variant">{session.skillLevel} · {session.playFormat}</p></td>
                  <td><p className="font-bold">{session.venueName} · Sân {session.courtNumber}</p><p className="mt-1 text-[12px] text-on-surface-variant"><CalendarDays className="mr-1 inline h-3.5 w-3.5" />{dateTime.format(new Date(session.startTime))} – {session.endTime.slice(11, 16)}</p></td>
                  <td><p className="font-bold"><UsersRound className="mr-1 inline h-4 w-4" />{session.soldTickets}/{session.maxPlayers}</p><p className="mt-1 text-[12px] text-on-surface-variant">{session.reservedTickets} đang giữ · {session.remainingTickets} còn lại</p></td>
                  <td className="font-bold">{session.ticketPrice === 0 ? 'Miễn phí' : money.format(session.ticketPrice)}</td>
                  <td><span className={`rounded-full px-3 py-1 text-[11px] font-bold ${statusClasses[session.status]}`}>{statusLabels[session.status]}</span></td>
                  <td className="text-right"><Link className="inline-flex rounded-lg border border-outline-variant px-3 py-2 text-[12px] font-bold hover:bg-surface-container-low" to={`/owner/ticket-sessions/${session.ticketSessionId}`}>Quản lý</Link></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      <PaginationControls page={result} onPageChange={setPage} />
      {creating && token && (
        <CreateSessionModal
          onClose={() => setCreating(false)}
          onCreated={(session) => navigate(`/owner/ticket-sessions/${session.ticketSessionId}`)}
          token={token}
          venues={venues}
        />
      )}
    </OwnerShell>
  );
};
