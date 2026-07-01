import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Banknote,
  CalendarDays,
  Check,
  ClipboardCheck,
  Edit3,
  Eye,
  Loader2,
  Plus,
  QrCode,
  Search,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import {
  approveTournament,
  checkInTournamentTeam,
  createTournament,
  createTournamentDivision,
  createTournamentMatch,
  deleteTournament,
  deleteTournamentDivision,
  deleteTournamentMatch,
  formatTournamentCurrency,
  formatTournamentDate,
  formatTournamentDateTime,
  getAdminTournament,
  getAdminTournamentStats,
  getTournamentStatusLabel,
  listAdminTournaments,
  listTournamentPayments,
  listTournamentRegistrations,
  publishTournamentResults,
  recordTournamentResult,
  reviewTournamentPayment,
  reviewTournamentRegistration,
  updateTournament,
  updateTournamentDivision,
  updateTournamentMatch,
  updateTournamentStatus,
  type TournamentAdminStats,
  type TournamentDetail,
  type TournamentDivision,
  type TournamentDivisionInput,
  type TournamentInput,
  type TournamentMatch,
  type TournamentMatchInput,
  type TournamentRegistration,
  type TournamentStatus,
  type TournamentSummary,
} from '../../api/tournaments';
import { useAuth } from '../../auth/AuthContext';
import { AdminShell } from './components/AdminShell';

type DetailTab = 'overview' | 'divisions' | 'registrations' | 'schedule' | 'payments' | 'checkin';

const inputClass = 'h-10 w-full rounded-lg border border-outline-variant bg-white px-3 text-sm outline-none focus:border-primary';
const textareaClass = 'min-h-24 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm outline-none focus:border-primary';
const primaryButton = 'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50';
const outlineButton = 'inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-sm font-bold hover:bg-surface-container-low disabled:opacity-50';

const toLocalDateTime = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const futureDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const createEmptyTournament = (): TournamentInput => ({
  name: '',
  description: '',
  rules: '',
  imageUrl: '',
  venueName: '',
  address: '',
  city: '',
  organizerName: 'Picklink',
  organizerPhone: '',
  format: 'Đôi',
  bracketType: 'Nhập kết quả thủ công',
  skillLevel: '',
  startDate: futureDate(30),
  endDate: futureDate(31),
  registrationDeadline: `${futureDate(25)}T23:59`,
  capacity: 32,
  entryFee: 300000,
  prizePool: 0,
  divisions: [{
    name: 'Hạng mục mở rộng',
    skillLevel: '3.0 - 4.0',
    capacity: 32,
    entryFee: 300000,
    displayOrder: 1,
  }],
});

const tournamentToInput = (tournament: TournamentDetail): TournamentInput => ({
  name: tournament.name,
  slug: tournament.slug,
  description: tournament.description || '',
  rules: tournament.rules.join('\n'),
  imageUrl: tournament.imageUrl || '',
  venueName: tournament.venueName,
  address: tournament.address,
  city: tournament.city,
  organizerName: tournament.organizerName,
  organizerPhone: tournament.organizerPhone || '',
  format: tournament.format,
  bracketType: tournament.bracketType,
  skillLevel: tournament.skillLevel || '',
  startDate: tournament.startDate,
  endDate: tournament.endDate,
  registrationDeadline: toLocalDateTime(tournament.registrationDeadline),
  capacity: tournament.capacity,
  entryFee: tournament.entryFee,
  prizePool: tournament.prizePool,
  divisions: [],
});

const statusClass = (status: TournamentStatus) => {
  if (status === 'open') return 'bg-primary/10 text-primary';
  if (status === 'pendingApproval') return 'bg-[#fff4d8] text-[#7a5600]';
  if (status === 'inProgress') return 'bg-secondary-container text-secondary';
  if (status === 'cancelled') return 'bg-error-container text-error';
  return 'bg-surface-container text-on-surface-variant';
};

const TournamentForm = ({
  value,
  editing,
  busy,
  onChange,
  onClose,
  onSubmit,
}: {
  value: TournamentInput;
  editing: boolean;
  busy: boolean;
  onChange: (value: TournamentInput) => void;
  onClose: () => void;
  onSubmit: () => void;
}) => {
  const set = <K extends keyof TournamentInput>(key: K, next: TournamentInput[K]) => onChange({ ...value, [key]: next });
  const firstDivision = value.divisions[0];
  const setDivision = (patch: Partial<TournamentDivisionInput>) => {
    const base = firstDivision || { name: '', capacity: value.capacity, entryFee: value.entryFee, displayOrder: 1 };
    set('divisions', [{ ...base, ...patch }]);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/45 p-4 py-10">
      <div className="w-full max-w-4xl rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-outline-variant p-5">
          <div><h2 className="text-xl font-bold">{editing ? 'Chỉnh sửa giải đấu' : 'Tạo giải đấu'}</h2><p className="mt-1 text-xs text-on-surface-variant">Giải mới được lưu ở trạng thái nháp trước khi duyệt.</p></div>
          <button className="rounded-lg p-2 hover:bg-surface-container-low" onClick={onClose} type="button"><X className="h-5 w-5" /></button>
        </div>
        <form className="grid gap-4 p-5 md:grid-cols-2" onSubmit={(event) => { event.preventDefault(); onSubmit(); }}>
          <label className="md:col-span-2"><span className="text-xs font-bold">Tên giải *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('name', event.target.value)} required value={value.name} /></label>
          <label><span className="text-xs font-bold">Đơn vị tổ chức *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('organizerName', event.target.value)} required value={value.organizerName} /></label>
          <label><span className="text-xs font-bold">Điện thoại</span><input className={`${inputClass} mt-1`} onChange={(event) => set('organizerPhone', event.target.value)} value={value.organizerPhone} /></label>
          <label><span className="text-xs font-bold">Địa điểm *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('venueName', event.target.value)} required value={value.venueName} /></label>
          <label><span className="text-xs font-bold">Tỉnh / thành *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('city', event.target.value)} required value={value.city} /></label>
          <label className="md:col-span-2"><span className="text-xs font-bold">Địa chỉ *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('address', event.target.value)} required value={value.address} /></label>
          <label><span className="text-xs font-bold">Ngày bắt đầu *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('startDate', event.target.value)} required type="date" value={value.startDate} /></label>
          <label><span className="text-xs font-bold">Ngày kết thúc *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('endDate', event.target.value)} required type="date" value={value.endDate} /></label>
          <label><span className="text-xs font-bold">Hạn đăng ký *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('registrationDeadline', event.target.value)} required type="datetime-local" value={value.registrationDeadline} /></label>
          <label><span className="text-xs font-bold">Sức chứa toàn giải *</span><input className={`${inputClass} mt-1`} min={1} onChange={(event) => set('capacity', Number(event.target.value))} required type="number" value={value.capacity} /></label>
          <label><span className="text-xs font-bold">Thể thức *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('format', event.target.value)} required value={value.format} /></label>
          <label><span className="text-xs font-bold">Kiểu vòng đấu *</span><input className={`${inputClass} mt-1`} onChange={(event) => set('bracketType', event.target.value)} required value={value.bracketType} /></label>
          <label><span className="text-xs font-bold">Trình độ</span><input className={`${inputClass} mt-1`} onChange={(event) => set('skillLevel', event.target.value)} value={value.skillLevel} /></label>
          <label><span className="text-xs font-bold">Lệ phí mặc định</span><input className={`${inputClass} mt-1`} min={0} onChange={(event) => set('entryFee', Number(event.target.value))} type="number" value={value.entryFee} /></label>
          <label><span className="text-xs font-bold">Tổng giải thưởng</span><input className={`${inputClass} mt-1`} min={0} onChange={(event) => set('prizePool', Number(event.target.value))} type="number" value={value.prizePool} /></label>
          <label><span className="text-xs font-bold">URL ảnh bìa</span><input className={`${inputClass} mt-1`} onChange={(event) => set('imageUrl', event.target.value)} type="url" value={value.imageUrl} /></label>
          <label className="md:col-span-2"><span className="text-xs font-bold">Mô tả</span><textarea className={`${textareaClass} mt-1`} onChange={(event) => set('description', event.target.value)} value={value.description} /></label>
          <label className="md:col-span-2"><span className="text-xs font-bold">Điều lệ — mỗi dòng một điều</span><textarea className={`${textareaClass} mt-1`} onChange={(event) => set('rules', event.target.value)} value={value.rules} /></label>

          {!editing && (
            <div className="grid gap-3 rounded-xl bg-surface-container-low p-4 md:col-span-2 md:grid-cols-4">
              <p className="font-bold md:col-span-4">Hạng mục đầu tiên</p>
              <input className={inputClass} onChange={(event) => setDivision({ name: event.target.value })} placeholder="Tên hạng mục" required value={firstDivision?.name || ''} />
              <input className={inputClass} onChange={(event) => setDivision({ skillLevel: event.target.value })} placeholder="Trình độ" value={firstDivision?.skillLevel || ''} />
              <input className={inputClass} min={1} onChange={(event) => setDivision({ capacity: Number(event.target.value) })} placeholder="Số đội" required type="number" value={firstDivision?.capacity || ''} />
              <input className={inputClass} min={0} onChange={(event) => setDivision({ entryFee: Number(event.target.value) })} placeholder="Lệ phí" type="number" value={firstDivision?.entryFee ?? ''} />
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-outline-variant pt-4 md:col-span-2">
            <button className={outlineButton} onClick={onClose} type="button">Hủy</button>
            <button className={primaryButton} disabled={busy} type="submit">{busy && <Loader2 className="h-4 w-4 animate-spin" />}{editing ? 'Lưu thay đổi' : 'Tạo bản nháp'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AdminTournaments = () => {
  const { token } = useAuth();
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [stats, setStats] = useState<TournamentAdminStats | null>(null);
  const [selected, setSelected] = useState<TournamentDetail | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [payments, setPayments] = useState<TournamentRegistration[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [tab, setTab] = useState<DetailTab>('overview');
  const [form, setForm] = useState<TournamentInput | null>(null);
  const [editingTournament, setEditingTournament] = useState(false);
  const [divisionForm, setDivisionForm] = useState<TournamentDivisionInput>({ name: '', skillLevel: '', capacity: 16, entryFee: 0, displayOrder: 1 });
  const [editingDivisionId, setEditingDivisionId] = useState<number | null>(null);
  const [matchForm, setMatchForm] = useState<TournamentMatchInput>({ tournamentDivisionId: 0, roundName: 'Vòng bảng', matchNumber: 1, courtName: '' });
  const [editingMatchId, setEditingMatchId] = useState<number | null>(null);
  const [checkInCode, setCheckInCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const showError = (reason: unknown) => setError((reason as Error).message);
  const flash = (message: string) => {
    setNotice(message);
    setError('');
  };

  const loadList = useCallback(async () => {
    if (!token) return;
    try {
      const [list, nextStats] = await Promise.all([
        listAdminTournaments(token, { search, status, pageSize: 100 }),
        getAdminTournamentStats(token),
      ]);
      setTournaments(list.items);
      setStats(nextStats);
    } catch (reason) {
      showError(reason);
    } finally {
      setLoading(false);
    }
  }, [search, status, token]);

  const loadSelected = useCallback(async (tournamentId: number) => {
    if (!token) return;
    setBusy(true);
    try {
      const [detail, nextRegistrations, nextPayments] = await Promise.all([
        getAdminTournament(tournamentId, token),
        listTournamentRegistrations(tournamentId, token),
        listTournamentPayments(token, tournamentId),
      ]);
      setSelected(detail);
      setRegistrations(nextRegistrations);
      setPayments(nextPayments);
      setMatchForm((current) => ({ ...current, tournamentDivisionId: current.tournamentDivisionId || detail.divisions[0]?.tournamentDivisionId || 0 }));
    } catch (reason) {
      showError(reason);
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void loadList(), 250);
    return () => window.clearTimeout(timeout);
  }, [loadList]);

  const refresh = async () => {
    await loadList();
    if (selected) await loadSelected(selected.tournamentId);
  };

  const run = async (action: () => Promise<unknown>, success: string, reloadDetail = true) => {
    setBusy(true);
    setError('');
    try {
      await action();
      flash(success);
      await loadList();
      if (reloadDetail && selected) await loadSelected(selected.tournamentId);
    } catch (reason) {
      showError(reason);
    } finally {
      setBusy(false);
    }
  };

  const submitTournamentForm = async () => {
    if (!form || !token) return;
    setBusy(true);
    try {
      const payload = {
        ...form,
        registrationDeadline: new Date(form.registrationDeadline).toISOString(),
      };
      const saved = editingTournament && selected
        ? await updateTournament(selected.tournamentId, payload, token)
        : await createTournament(payload, token);
      setForm(null);
      setEditingTournament(false);
      flash(editingTournament ? 'Đã cập nhật giải đấu.' : 'Đã tạo bản nháp giải đấu.');
      await loadList();
      await loadSelected(saved.tournamentId);
    } catch (reason) {
      showError(reason);
    } finally {
      setBusy(false);
    }
  };

  const submitDivision = async () => {
    if (!selected || !token) return;
    await run(
      () => editingDivisionId
        ? updateTournamentDivision(selected.tournamentId, editingDivisionId, divisionForm, token)
        : createTournamentDivision(selected.tournamentId, divisionForm, token),
      editingDivisionId ? 'Đã cập nhật hạng mục.' : 'Đã thêm hạng mục.',
    );
    setEditingDivisionId(null);
    setDivisionForm({ name: '', skillLevel: '', capacity: 16, entryFee: selected.entryFee, displayOrder: selected.divisions.length + 1 });
  };

  const editDivision = (division: TournamentDivision) => {
    setEditingDivisionId(division.tournamentDivisionId);
    setDivisionForm({
      name: division.name,
      description: division.description,
      skillLevel: division.skillLevel,
      capacity: division.capacity,
      entryFee: division.entryFee,
      displayOrder: division.displayOrder,
    });
  };

  const submitMatch = async () => {
    if (!selected || !token) return;
    const payload = { ...matchForm, scheduledAt: matchForm.scheduledAt ? new Date(matchForm.scheduledAt).toISOString() : undefined };
    await run(
      () => editingMatchId
        ? updateTournamentMatch(selected.tournamentId, editingMatchId, payload, token)
        : createTournamentMatch(selected.tournamentId, payload, token),
      editingMatchId ? 'Đã cập nhật lịch trận.' : 'Đã thêm trận vào lịch.',
    );
    setEditingMatchId(null);
    setMatchForm({ tournamentDivisionId: selected.divisions[0]?.tournamentDivisionId || 0, roundName: 'Vòng bảng', matchNumber: selected.matches.length + 2, courtName: '' });
  };

  const editMatch = (match: TournamentMatch) => {
    setEditingMatchId(match.tournamentMatchId);
    setMatchForm({
      tournamentDivisionId: match.tournamentDivisionId,
      roundName: match.roundName,
      matchNumber: match.matchNumber,
      team1RegistrationId: match.team1RegistrationId,
      team2RegistrationId: match.team2RegistrationId,
      scheduledAt: toLocalDateTime(match.scheduledAt),
      courtName: match.courtName,
      notes: match.notes,
    });
  };

  const enterResult = async (match: TournamentMatch) => {
    if (!selected || !token || !match.team1RegistrationId || !match.team2RegistrationId) return;
    const team1Raw = window.prompt(`Điểm ${match.team1Name}`, String(match.team1Score ?? ''));
    if (team1Raw === null) return;
    const team2Raw = window.prompt(`Điểm ${match.team2Name}`, String(match.team2Score ?? ''));
    if (team2Raw === null) return;
    const team1Score = Number(team1Raw);
    const team2Score = Number(team2Raw);
    if (!Number.isInteger(team1Score) || !Number.isInteger(team2Score) || team1Score === team2Score) {
      setError('Tỷ số phải là hai số nguyên không bằng nhau.');
      return;
    }
    const winnerRegistrationId = team1Score > team2Score ? match.team1RegistrationId : match.team2RegistrationId;
    await run(
      () => recordTournamentResult(selected.tournamentId, match.tournamentMatchId, { team1Score, team2Score, winnerRegistrationId }, token),
      'Đã lưu kết quả thủ công.',
    );
  };

  const approvedByDivision = useMemo(() => {
    const result = new Map<number, TournamentRegistration[]>();
    registrations.filter((item) => item.status === 'approved').forEach((item) => {
      result.set(item.tournamentDivisionId, [...(result.get(item.tournamentDivisionId) || []), item]);
    });
    return result;
  }, [registrations]);

  const tabs: Array<{ id: DetailTab; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'divisions', label: 'Hạng mục' },
    { id: 'registrations', label: `Duyệt đội (${registrations.length})` },
    { id: 'schedule', label: `Lịch & kết quả (${selected?.matches.length || 0})` },
    { id: 'payments', label: `Đối soát (${payments.length})` },
    { id: 'checkin', label: 'Check-in' },
  ];

  return (
    <AdminShell activeId="tournaments">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div><p className="text-sm font-bold text-primary">PHASE 10 · BƯỚC 1</p><h1 className="mt-1 text-3xl font-bold">Điều hành giải đấu</h1><p className="mt-2 text-sm text-on-surface-variant">CRUD, đăng ký, lệ phí, check-in và kết quả thủ công trên dữ liệu thật.</p></div>
          <button className={primaryButton} onClick={() => { setEditingTournament(false); setForm(createEmptyTournament()); }} type="button"><Plus className="h-4 w-4" />Tạo giải đấu</button>
        </div>

        {error && <div className="rounded-lg border border-error/30 bg-error-container p-4 text-sm font-bold text-error">{error}</div>}
        {notice && <div className="rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm font-bold text-primary">{notice}</div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          {[
            { label: 'Tổng giải', value: stats?.totalTournaments ?? 0, icon: Trophy },
            { label: 'Chờ duyệt', value: stats?.pendingApproval ?? 0, icon: ClipboardCheck },
            { label: 'Đang mở', value: stats?.openTournaments ?? 0, icon: CalendarDays },
            { label: 'Đội chờ duyệt', value: stats?.pendingRegistrations ?? 0, icon: Users },
            { label: 'Lệ phí chờ', value: stats?.pendingPayments ?? 0, icon: Banknote },
            { label: 'Đã đối soát', value: formatTournamentCurrency(stats?.confirmedRevenue ?? 0), icon: Check },
          ].map((item) => (
            <div className="rounded-xl border border-outline-variant bg-white p-4 shadow-sm" key={item.label}>
              <div className="flex items-center justify-between"><p className="text-xs font-bold text-on-surface-variant">{item.label}</p><item.icon className="h-4 w-4 text-primary" /></div>
              <p className="mt-2 text-xl font-bold">{item.value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-outline-variant bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-outline-variant p-4 md:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /><input className={`${inputClass} pl-9`} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm giải, đơn vị tổ chức, địa điểm..." value={search} /></div>
            <select className="h-10 rounded-lg border border-outline-variant bg-white px-3 text-sm font-bold" onChange={(event) => setStatus(event.target.value)} value={status}>
              <option value="all">Tất cả trạng thái</option><option value="draft">Bản nháp</option><option value="pendingApproval">Chờ duyệt</option><option value="open">Đang mở</option><option value="closed">Đã khóa</option><option value="inProgress">Đang thi đấu</option><option value="completed">Đã kết thúc</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left">
              <thead className="bg-surface-container-low"><tr>{['Giải đấu', 'Đơn vị / địa điểm', 'Đăng ký', 'Thời gian', 'Trạng thái', ''].map((heading) => <th className="px-4 py-3 text-xs font-bold uppercase text-on-surface-variant" key={heading}>{heading}</th>)}</tr></thead>
              <tbody className="divide-y divide-outline-variant">
                {loading ? <tr><td className="p-8 text-center" colSpan={6}><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></td></tr> : tournaments.map((tournament) => (
                  <tr className={selected?.tournamentId === tournament.tournamentId ? 'bg-primary/5' : 'hover:bg-surface-container-low'} key={tournament.tournamentId}>
                    <td className="px-4 py-3"><p className="font-bold">{tournament.name}</p><p className="mt-1 text-xs text-on-surface-variant">#{tournament.tournamentId} · {tournament.format}</p></td>
                    <td className="px-4 py-3"><p className="text-sm font-bold">{tournament.venueName}</p><p className="text-xs text-on-surface-variant">{tournament.city}</p></td>
                    <td className="px-4 py-3 text-sm font-bold">{tournament.registeredCount}/{tournament.capacity}</td>
                    <td className="px-4 py-3 text-sm">{formatTournamentDate(tournament.startDate)}<p className="text-xs text-on-surface-variant">đến {formatTournamentDate(tournament.endDate)}</p></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(tournament.status)}`}>{getTournamentStatusLabel(tournament.status)}</span></td>
                    <td className="px-4 py-3 text-right"><button className={outlineButton} onClick={() => { setTab('overview'); void loadSelected(tournament.tournamentId); }} type="button"><Eye className="h-4 w-4" />Điều hành</button></td>
                  </tr>
                ))}
                {!loading && !tournaments.length && <tr><td className="p-8 text-center text-sm text-on-surface-variant" colSpan={6}>Chưa có giải đấu phù hợp.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <section className="rounded-xl border border-outline-variant bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-outline-variant p-5 xl:flex-row xl:items-start xl:justify-between">
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-2xl font-bold">{selected.name}</h2><span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass(selected.status)}`}>{getTournamentStatusLabel(selected.status)}</span></div><p className="mt-2 text-sm text-on-surface-variant">{selected.organizerName} · {selected.venueName}, {selected.city}</p></div>
              <div className="flex flex-wrap gap-2">
                <button className={outlineButton} onClick={() => { setEditingTournament(true); setForm(tournamentToInput(selected)); }} type="button"><Edit3 className="h-4 w-4" />Sửa</button>
                {(selected.status === 'draft' || selected.status === 'pendingApproval') && <button className={primaryButton} disabled={busy} onClick={() => token && void run(() => approveTournament(selected.tournamentId, token), 'Đã duyệt và mở đăng ký giải.')} type="button"><Check className="h-4 w-4" />Duyệt giải</button>}
                {selected.status === 'open' && <><button className={outlineButton} onClick={() => token && void run(() => updateTournamentStatus(selected.tournamentId, 'closed', token), 'Đã khóa đăng ký.')} type="button">Khóa đăng ký</button><button className={primaryButton} onClick={() => token && void run(() => updateTournamentStatus(selected.tournamentId, 'inProgress', token), 'Giải đã chuyển sang đang thi đấu.')} type="button">Bắt đầu giải</button></>}
                {selected.status === 'closed' && <><button className={outlineButton} onClick={() => token && void run(() => updateTournamentStatus(selected.tournamentId, 'open', token), 'Đã mở lại đăng ký.')} type="button">Mở đăng ký</button><button className={primaryButton} onClick={() => token && void run(() => updateTournamentStatus(selected.tournamentId, 'inProgress', token), 'Giải đã chuyển sang đang thi đấu.')} type="button">Bắt đầu giải</button></>}
                {selected.status === 'draft' && <button className={`${outlineButton} text-error`} onClick={() => { if (token && window.confirm('Xóa vĩnh viễn bản nháp này?')) void run(() => deleteTournament(selected.tournamentId, token), 'Đã xóa bản nháp.', false).then(() => setSelected(null)); }} type="button"><Trash2 className="h-4 w-4" />Xóa</button>}
              </div>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-outline-variant px-4 pt-2">
              {tabs.map((item) => <button className={`shrink-0 border-b-2 px-4 py-3 text-sm font-bold ${tab === item.id ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`} key={item.id} onClick={() => setTab(item.id)} type="button">{item.label}</button>)}
            </div>

            <div className="p-5">
              {busy && <div className="mb-4 flex items-center gap-2 rounded-lg bg-surface-container-low p-3 text-sm"><Loader2 className="h-4 w-4 animate-spin text-primary" />Đang đồng bộ dữ liệu...</div>}

              {tab === 'overview' && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Thời gian', `${formatTournamentDate(selected.startDate)} – ${formatTournamentDate(selected.endDate)}`],
                    ['Hạn đăng ký', formatTournamentDateTime(selected.registrationDeadline)],
                    ['Thể thức', `${selected.format} · ${selected.bracketType}`],
                    ['Tài chính', `${formatTournamentCurrency(selected.entryFee)} · thưởng ${formatTournamentCurrency(selected.prizePool)}`],
                  ].map(([label, value]) => <div className="rounded-xl bg-surface-container-low p-4" key={label}><p className="text-xs font-bold uppercase text-on-surface-variant">{label}</p><p className="mt-2 text-sm font-bold">{value}</p></div>)}
                  <div className="md:col-span-2 xl:col-span-4"><h3 className="font-bold">Điều lệ</h3><div className="mt-2 rounded-xl border border-outline-variant p-4">{selected.rules.length ? selected.rules.map((rule) => <p className="mb-2 text-sm text-on-surface-variant" key={rule}>• {rule}</p>) : <p className="text-sm text-on-surface-variant">Chưa có điều lệ.</p>}</div></div>
                </div>
              )}

              {tab === 'divisions' && (
                <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
                  <div className="space-y-3">
                    {selected.divisions.map((division) => (
                      <div className="flex flex-col gap-3 rounded-xl border border-outline-variant p-4 sm:flex-row sm:items-center sm:justify-between" key={division.tournamentDivisionId}>
                        <div><h3 className="font-bold">{division.name}</h3><p className="mt-1 text-sm text-on-surface-variant">{division.skillLevel || 'Mọi trình độ'} · {division.registeredCount}/{division.capacity} đội · {formatTournamentCurrency(division.entryFee)}</p></div>
                        <div className="flex gap-2"><button className={outlineButton} onClick={() => editDivision(division)} type="button"><Edit3 className="h-4 w-4" />Sửa</button><button className={`${outlineButton} text-error`} onClick={() => { if (token && window.confirm('Xóa hạng mục này?')) void run(() => deleteTournamentDivision(selected.tournamentId, division.tournamentDivisionId, token), 'Đã xóa hạng mục.'); }} type="button"><Trash2 className="h-4 w-4" /></button></div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-4">
                    <h3 className="font-bold">{editingDivisionId ? 'Sửa hạng mục' : 'Thêm hạng mục'}</h3>
                    <div className="mt-4 space-y-3">
                      <input className={inputClass} onChange={(event) => setDivisionForm({ ...divisionForm, name: event.target.value })} placeholder="Tên hạng mục" value={divisionForm.name} />
                      <input className={inputClass} onChange={(event) => setDivisionForm({ ...divisionForm, skillLevel: event.target.value })} placeholder="Trình độ" value={divisionForm.skillLevel || ''} />
                      <div className="grid grid-cols-2 gap-2"><input className={inputClass} min={1} onChange={(event) => setDivisionForm({ ...divisionForm, capacity: Number(event.target.value) })} placeholder="Số đội" type="number" value={divisionForm.capacity} /><input className={inputClass} min={0} onChange={(event) => setDivisionForm({ ...divisionForm, entryFee: Number(event.target.value) })} placeholder="Lệ phí" type="number" value={divisionForm.entryFee ?? ''} /></div>
                      <button className={`${primaryButton} w-full`} disabled={!divisionForm.name.trim() || busy} onClick={() => void submitDivision()} type="button">{editingDivisionId ? 'Lưu hạng mục' : 'Thêm hạng mục'}</button>
                      {editingDivisionId && <button className={`${outlineButton} w-full`} onClick={() => { setEditingDivisionId(null); setDivisionForm({ name: '', capacity: 16, entryFee: selected.entryFee, displayOrder: selected.divisions.length + 1 }); }} type="button">Hủy sửa</button>}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'registrations' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[920px] text-left">
                    <thead className="bg-surface-container-low"><tr>{['Đội / đại diện', 'Hạng mục', 'Đăng ký', 'Lệ phí', 'Trạng thái', 'Xử lý'].map((heading) => <th className="px-4 py-3 text-xs font-bold uppercase text-on-surface-variant" key={heading}>{heading}</th>)}</tr></thead>
                    <tbody className="divide-y divide-outline-variant">
                      {registrations.map((registration) => (
                        <tr key={registration.tournamentRegistrationId}>
                          <td className="px-4 py-3"><p className="font-bold">{registration.teamName}</p><p className="text-xs text-on-surface-variant">{registration.partnerName || '—'} · {registration.representativePhone}</p></td>
                          <td className="px-4 py-3 text-sm">{registration.divisionName}</td>
                          <td className="px-4 py-3 text-sm">{formatTournamentDateTime(registration.registeredAt)}</td>
                          <td className="px-4 py-3 text-sm font-bold">{formatTournamentCurrency(registration.amountDue)}<p className="text-xs text-on-surface-variant">{registration.paymentStatus}</p></td>
                          <td className="px-4 py-3"><span className="rounded-full bg-surface-container px-3 py-1 text-xs font-bold">{registration.status}</span>{registration.rejectionReason && <p className="mt-1 max-w-52 text-xs text-error">{registration.rejectionReason}</p>}</td>
                          <td className="px-4 py-3">
                            {registration.status !== 'cancelled' && <div className="flex flex-wrap gap-2">
                              <button className={primaryButton} disabled={registration.status === 'approved'} onClick={() => token && void run(() => reviewTournamentRegistration(registration.tournamentRegistrationId, { status: 'approved' }, token), 'Đã duyệt đội.')} type="button">Duyệt</button>
                              <button className={outlineButton} disabled={registration.status === 'waitlisted'} onClick={() => token && void run(() => reviewTournamentRegistration(registration.tournamentRegistrationId, { status: 'waitlisted' }, token), 'Đã chuyển đội vào danh sách chờ.')} type="button">Chờ</button>
                              <button className={`${outlineButton} text-error`} onClick={() => { const reason = window.prompt('Lý do từ chối đội:'); if (reason && token) void run(() => reviewTournamentRegistration(registration.tournamentRegistrationId, { status: 'rejected', reason }, token), 'Đã từ chối đội.'); }} type="button">Từ chối</button>
                            </div>}
                          </td>
                        </tr>
                      ))}
                      {!registrations.length && <tr><td className="p-8 text-center text-sm text-on-surface-variant" colSpan={6}>Chưa có đội đăng ký.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'schedule' && (
                <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
                  <div className="space-y-3">
                    {selected.matches.map((match) => (
                      <div className="rounded-xl border border-outline-variant p-4" key={match.tournamentMatchId}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div><p className="text-xs font-bold text-primary">{match.divisionName} · {match.roundName} #{match.matchNumber}</p><h3 className="mt-2 font-bold">{match.team1Name || 'Chờ đội'} <span className="mx-2 text-on-surface-variant">vs</span> {match.team2Name || 'Chờ đội'}</h3><p className="mt-1 text-xs text-on-surface-variant">{match.scheduledAt ? formatTournamentDateTime(match.scheduledAt) : 'Chưa xếp giờ'} · {match.courtName || 'Chưa xếp sân'}</p></div>
                          <div className="text-right"><p className="text-2xl font-bold text-primary">{match.team1Score === undefined ? '—' : `${match.team1Score} – ${match.team2Score}`}</p><p className="text-xs font-bold">{match.status === 'completed' ? `Thắng: ${match.winnerName}` : 'Chưa có kết quả'}</p></div>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2 border-t border-outline-variant pt-3"><button className={outlineButton} disabled={match.status === 'completed'} onClick={() => editMatch(match)} type="button"><Edit3 className="h-4 w-4" />Sửa lịch</button><button className={primaryButton} disabled={!match.team1RegistrationId || !match.team2RegistrationId} onClick={() => void enterResult(match)} type="button">Nhập kết quả</button><button className={`${outlineButton} text-error`} disabled={match.status === 'completed'} onClick={() => { if (token && window.confirm('Xóa trận khỏi lịch?')) void run(() => deleteTournamentMatch(selected.tournamentId, match.tournamentMatchId, token), 'Đã xóa trận.'); }} type="button"><Trash2 className="h-4 w-4" /></button></div>
                      </div>
                    ))}
                    {!selected.matches.length && <div className="rounded-xl border border-dashed border-outline-variant p-8 text-center text-sm text-on-surface-variant">Chưa có lịch thi đấu.</div>}
                    {selected.matches.length > 0 && <button className={primaryButton} onClick={() => token && void run(() => publishTournamentResults(selected.tournamentId, token), 'Đã công bố kết quả giải.')} type="button"><Trophy className="h-4 w-4" />Công bố kết quả</button>}
                  </div>
                  <div className="rounded-xl bg-surface-container-low p-4">
                    <h3 className="font-bold">{editingMatchId ? 'Sửa lịch trận' : 'Thêm trận thủ công'}</h3>
                    <div className="mt-4 space-y-3">
                      <select className={inputClass} onChange={(event) => setMatchForm({ ...matchForm, tournamentDivisionId: Number(event.target.value), team1RegistrationId: undefined, team2RegistrationId: undefined })} value={matchForm.tournamentDivisionId}>
                        <option value={0}>Chọn hạng mục</option>{selected.divisions.map((division) => <option key={division.tournamentDivisionId} value={division.tournamentDivisionId}>{division.name}</option>)}
                      </select>
                      <div className="grid grid-cols-2 gap-2"><input className={inputClass} onChange={(event) => setMatchForm({ ...matchForm, roundName: event.target.value })} placeholder="Tên vòng" value={matchForm.roundName} /><input className={inputClass} min={1} onChange={(event) => setMatchForm({ ...matchForm, matchNumber: Number(event.target.value) })} placeholder="Số trận" type="number" value={matchForm.matchNumber} /></div>
                      <select className={inputClass} onChange={(event) => setMatchForm({ ...matchForm, team1RegistrationId: Number(event.target.value) || undefined })} value={matchForm.team1RegistrationId || 0}><option value={0}>Đội 1 (có thể để trống)</option>{(approvedByDivision.get(matchForm.tournamentDivisionId) || []).map((item) => <option key={item.tournamentRegistrationId} value={item.tournamentRegistrationId}>{item.teamName}</option>)}</select>
                      <select className={inputClass} onChange={(event) => setMatchForm({ ...matchForm, team2RegistrationId: Number(event.target.value) || undefined })} value={matchForm.team2RegistrationId || 0}><option value={0}>Đội 2 (có thể để trống)</option>{(approvedByDivision.get(matchForm.tournamentDivisionId) || []).map((item) => <option key={item.tournamentRegistrationId} value={item.tournamentRegistrationId}>{item.teamName}</option>)}</select>
                      <input className={inputClass} onChange={(event) => setMatchForm({ ...matchForm, scheduledAt: event.target.value })} type="datetime-local" value={matchForm.scheduledAt || ''} />
                      <input className={inputClass} onChange={(event) => setMatchForm({ ...matchForm, courtName: event.target.value })} placeholder="Tên sân" value={matchForm.courtName || ''} />
                      <button className={`${primaryButton} w-full`} disabled={!matchForm.tournamentDivisionId || !matchForm.roundName.trim()} onClick={() => void submitMatch()} type="button">{editingMatchId ? 'Lưu lịch trận' : 'Thêm vào lịch'}</button>
                      {editingMatchId && <button className={`${outlineButton} w-full`} onClick={() => setEditingMatchId(null)} type="button">Hủy sửa</button>}
                    </div>
                  </div>
                </div>
              )}

              {tab === 'payments' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] text-left">
                    <thead className="bg-surface-container-low"><tr>{['Đội', 'Hạng mục', 'Số tiền', 'Biên lai', 'Gửi lúc', 'Trạng thái', 'Đối soát'].map((heading) => <th className="px-4 py-3 text-xs font-bold uppercase text-on-surface-variant" key={heading}>{heading}</th>)}</tr></thead>
                    <tbody className="divide-y divide-outline-variant">
                      {payments.map((registration) => (
                        <tr key={registration.tournamentRegistrationId}>
                          <td className="px-4 py-3 font-bold">{registration.teamName}</td><td className="px-4 py-3 text-sm">{registration.divisionName}</td><td className="px-4 py-3 font-bold">{formatTournamentCurrency(registration.amountDue)}</td>
                          <td className="px-4 py-3">{registration.payment?.receiptImageUrl ? <a className="font-bold text-primary underline" href={registration.payment.receiptImageUrl} rel="noreferrer" target="_blank">Xem ảnh</a> : '—'}</td>
                          <td className="px-4 py-3 text-sm">{registration.payment ? formatTournamentDateTime(registration.payment.submittedAt) : '—'}</td><td className="px-4 py-3 text-sm font-bold">{registration.payment?.status}</td>
                          <td className="px-4 py-3"><div className="flex gap-2"><button className={primaryButton} disabled={registration.payment?.status === 'confirmed'} onClick={() => registration.payment && token && void run(() => reviewTournamentPayment(registration.payment!.tournamentPaymentId, { status: 'confirmed' }, token), 'Đã xác nhận lệ phí và cấp mã check-in.')} type="button">Xác nhận</button><button className={`${outlineButton} text-error`} onClick={() => { const reason = window.prompt('Lý do từ chối giao dịch:'); if (reason && registration.payment && token) void run(() => reviewTournamentPayment(registration.payment!.tournamentPaymentId, { status: 'rejected', reason }, token), 'Đã từ chối giao dịch.'); }} type="button">Từ chối</button></div></td>
                        </tr>
                      ))}
                      {!payments.length && <tr><td className="p-8 text-center text-sm text-on-surface-variant" colSpan={7}>Chưa có lệ phí gửi đối soát.</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {tab === 'checkin' && (
                <div className="mx-auto max-w-xl py-8 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary"><QrCode className="h-8 w-8" /></div>
                  <h3 className="mt-4 text-xl font-bold">Check-in đội thi đấu</h3>
                  <p className="mt-2 text-sm text-on-surface-variant">Nhập mã player nhận được sau khi đội và lệ phí đều đã duyệt.</p>
                  <input className={`${inputClass} mt-5 text-center font-bold uppercase`} onChange={(event) => setCheckInCode(event.target.value.toUpperCase())} placeholder="PKL-T…-R…-…" value={checkInCode} />
                  <button className={`${primaryButton} mt-3 w-full`} disabled={!checkInCode.trim() || busy} onClick={() => token && void run(() => checkInTournamentTeam(checkInCode, token), 'Check-in thành công.').then(() => setCheckInCode(''))} type="button"><Check className="h-4 w-4" />Xác nhận check-in</button>
                  <div className="mt-6 space-y-2 text-left">
                    {registrations.filter((item) => item.checkedInAt).map((item) => <div className="flex items-center justify-between rounded-lg bg-surface-container-low p-3" key={item.tournamentRegistrationId}><div><p className="text-sm font-bold">{item.teamName}</p><p className="text-xs text-on-surface-variant">{item.divisionName}</p></div><p className="text-xs font-bold text-primary">{formatTournamentDateTime(item.checkedInAt!)}</p></div>)}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </div>

      {form && <TournamentForm busy={busy} editing={editingTournament} onChange={setForm} onClose={() => { setForm(null); setEditingTournament(false); }} onSubmit={() => void submitTournamentForm()} value={form} />}
    </AdminShell>
  );
};
