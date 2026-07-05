import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Gavel,
  Loader2,
  MapPin,
  Medal,
  Phone,
  ShieldCheck,
  TicketCheck,
  Trophy,
  Upload,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  formatTournamentCurrency,
  formatTournamentDate,
  formatTournamentDateTime,
  getTournament,
  getTournamentRegistrationStatusLabel,
  getTournamentStatusLabel,
  registerTournament,
  submitTournamentPaymentReceipt,
  type TournamentDetail as TournamentDetailData,
  type TournamentStatus,
} from '../../api/tournaments';
import { useAuth } from '../../auth/AuthContext';

const getStatusClassName = (status: TournamentStatus) => {
  if (status === 'open') return 'bg-primary text-white';
  if (status === 'inProgress') return 'bg-[#d9e7ff] text-[#00458f]';
  if (status === 'closed') return 'bg-[#fff4d8] text-[#7a5600]';
  return 'bg-[#eef0ef] text-[#57615b]';
};

export const TournamentDetail = () => {
  const { id } = useParams();
  const { token, isAuthenticated } = useAuth();
  const [tournament, setTournament] = useState<TournamentDetailData | null>(null);
  const [teamName, setTeamName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [representativePhone, setRepresentativePhone] = useState('');
  const [divisionId, setDivisionId] = useState(0);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [transferContent, setTransferContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadTournament = useCallback(async () => {
    if (!id) return;
    setError('');
    try {
      const response = await getTournament(id, token ?? undefined);
      setTournament(response);
      setDivisionId((current) => current || response.divisions.find((item) => item.status === 'open')?.tournamentDivisionId || 0);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    void loadTournament();
  }, [loadTournament]);

  const canRegister = tournament?.status === 'open' && !tournament.myRegistration;
  const currentDivision = tournament?.divisions.find((item) => item.tournamentDivisionId === divisionId);
  const progress = tournament?.capacity
    ? Math.round((tournament.registeredCount / tournament.capacity) * 100)
    : 0;
  const remainingSlots = tournament
    ? Math.max(tournament.capacity - tournament.registeredCount, 0)
    : 0;
  const groupedMatches = useMemo(() => {
    if (!tournament) return [];
    return Object.entries(
      tournament.matches.reduce<Record<string, typeof tournament.matches>>((groups, match) => {
        const key = `${match.divisionName} · ${match.roundName}`;
        groups[key] = [...(groups[key] || []), match];
        return groups;
      }, {}),
    );
  }, [tournament]);

  const handleRegister = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tournament || !token || !divisionId) return;
    setIsBusy(true);
    setError('');
    setNotice('');
    try {
      await registerTournament(tournament.tournamentId, {
        tournamentDivisionId: divisionId,
        teamName,
        partnerName: partnerName || undefined,
        representativePhone,
      }, token);
      setNotice('Đã gửi đăng ký. Bạn có thể theo dõi trạng thái ngay trên trang này.');
      await loadTournament();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setIsBusy(false);
    }
  };

  const handlePayment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const registration = tournament?.myRegistration;
    if (!registration || !token || !receipt) return;
    setIsBusy(true);
    setError('');
    setNotice('');
    try {
      await submitTournamentPaymentReceipt(
        registration.tournamentRegistrationId,
        receipt,
        transferContent,
        token,
      );
      setReceipt(null);
      setNotice('Đã gửi biên lai. Admin sẽ đối soát và cấp mã check-in khi thanh toán hợp lệ.');
      await loadTournament();
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setIsBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#f9f9ff] pt-[72px]">
        <Loader2 className="h-9 w-9 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-dvh bg-[#f9f9ff] px-gutter pt-[120px] text-center">
        <Trophy className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-bold">Không thể mở giải đấu</h1>
        <p className="mt-2 text-sm text-on-surface-variant">{error || 'Giải đấu không tồn tại.'}</p>
        <Link className="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 font-bold text-white" to="/tournaments">Quay lại danh sách</Link>
      </div>
    );
  }

  const registration = tournament.myRegistration;
  const timeline = [
    { label: 'Hạn đăng ký', value: formatTournamentDate(tournament.registrationDeadline), icon: CalendarDays },
    { label: 'Ngày thi đấu', value: `${formatTournamentDate(tournament.startDate)} - ${formatTournamentDate(tournament.endDate)}`, icon: Trophy },
    { label: 'Thể thức', value: tournament.bracketType, icon: Gavel },
    { label: 'Còn slot', value: `${remainingSlots}/${tournament.capacity}`, icon: Users },
  ];

  return (
    <div className="min-h-dvh bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="relative overflow-hidden bg-[#081d24]">
        <img alt={tournament.name} className="absolute inset-0 h-full w-full object-cover opacity-42" src={tournament.imageUrl || 'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=1600&auto=format&fit=crop'} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#081d24] via-[#081d24]/78 to-[#081d24]/30" />
        <div className="relative z-10 mx-auto max-w-container-max-width px-gutter py-8 text-white">
          <Link className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-[14px] font-bold backdrop-blur hover:bg-white/20" to="/tournaments">
            <ArrowLeft className="h-4 w-4" />
            Quay lại giải đấu
          </Link>
          <div className="mt-16 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-[13px] font-bold ${getStatusClassName(tournament.status)}`}>{getTournamentStatusLabel(tournament.status)}</span>
              <span className="rounded-full bg-white/14 px-4 py-2 text-[13px] font-bold backdrop-blur">{tournament.format}</span>
              {tournament.skillLevel && <span className="rounded-full bg-white/14 px-4 py-2 text-[13px] font-bold backdrop-blur">Trình {tournament.skillLevel}</span>}
            </div>
            <h1 className="mt-5 text-[36px] font-bold leading-tight md:text-[56px]">{tournament.name}</h1>
            <p className="mt-4 max-w-3xl text-[17px] leading-7 text-white/88">{tournament.description}</p>
            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {timeline.map((item) => (
                <div className="rounded-lg border border-white/16 bg-white/10 p-4 backdrop-blur" key={item.label}>
                  <item.icon className="h-5 w-5 text-primary-container" />
                  <p className="mt-3 text-[12px] font-bold uppercase text-white/68">{item.label}</p>
                  <p className="mt-1 text-[14px] font-bold leading-5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-container-max-width px-gutter py-8">
        {error && <div className="mb-5 rounded-lg border border-error/30 bg-error-container p-4 text-sm text-on-error-container">{error}</div>}
        {notice && <div className="mb-5 rounded-lg border border-primary/30 bg-primary/10 p-4 text-sm font-bold text-primary">{notice}</div>}

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-[24px] font-bold"><MapPin className="h-6 w-6 text-primary" />Thông tin địa điểm</h2>
                  <p className="mt-3 text-[16px] font-bold">{tournament.venueName}</p>
                  <p className="mt-1 text-[14px] leading-6 text-on-surface-variant">{tournament.address}, {tournament.city}</p>
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-[13px] font-bold text-on-surface-variant">
                    <Phone className="h-4 w-4 text-primary" />{tournament.organizerName}{tournament.organizerPhone ? ` · ${tournament.organizerPhone}` : ''}
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-5 text-primary">
                  <p className="text-[12px] font-bold uppercase">Tổng giải thưởng</p>
                  <p className="mt-2 text-[26px] font-bold">{formatTournamentCurrency(tournament.prizePool)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-[24px] font-bold"><Gavel className="h-6 w-6 text-primary" />Điều lệ giải đấu</h2>
              <div className="mt-5 space-y-3">
                {tournament.rules.length ? tournament.rules.map((rule) => (
                  <p className="flex gap-3 text-[15px] leading-7 text-on-surface-variant" key={rule}>
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />{rule}
                  </p>
                )) : <p className="text-sm text-on-surface-variant">Ban tổ chức chưa cập nhật điều lệ chi tiết.</p>}
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-[24px] font-bold"><Medal className="h-6 w-6 text-primary" />Hạng mục thi đấu</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {tournament.divisions.map((division) => (
                  <div className="rounded-lg border border-outline-variant p-4" key={division.tournamentDivisionId}>
                    <div className="flex items-start justify-between gap-3">
                      <div><h3 className="font-bold">{division.name}</h3><p className="mt-1 text-sm text-on-surface-variant">{division.skillLevel || division.description || 'Mọi trình độ'}</p></div>
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{division.registeredCount}/{division.capacity}</span>
                    </div>
                    <p className="mt-3 font-bold text-primary">{formatTournamentCurrency(division.entryFee)}</p>
                  </div>
                ))}
              </div>
            </section>

            {groupedMatches.length > 0 && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-[24px] font-bold"><Clock className="h-6 w-6 text-primary" />Lịch và kết quả</h2>
                <div className="mt-5 space-y-5">
                  {groupedMatches.map(([group, matches]) => (
                    <div key={group}>
                      <h3 className="mb-2 text-sm font-bold text-primary">{group}</h3>
                      <div className="space-y-2">
                        {matches.map((match) => (
                          <div className="grid gap-3 rounded-lg bg-surface-container-low p-4 md:grid-cols-[150px_1fr_auto] md:items-center" key={match.tournamentMatchId}>
                            <div className="text-xs text-on-surface-variant">
                              <p className="font-bold">{match.scheduledAt ? formatTournamentDateTime(match.scheduledAt) : 'Chưa xếp giờ'}</p>
                              <p>{match.courtName || 'Chưa xếp sân'}</p>
                            </div>
                            <p className="text-sm font-bold">{match.team1Name || 'Chờ đội'} <span className="mx-2 text-on-surface-variant">vs</span> {match.team2Name || 'Chờ đội'}</p>
                            <p className="text-lg font-bold text-primary">{match.team1Score === undefined ? 'Chưa có' : `${match.team1Score} - ${match.team2Score}`}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="rounded-xl border border-outline-variant bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-outline-variant p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-[24px] font-bold"><Users className="h-6 w-6 text-primary" />Đội đã được duyệt</h2>
                  <p className="mt-1 text-[14px] text-on-surface-variant">{tournament.registeredCount}/{tournament.capacity} đăng ký trong giải.</p>
                </div>
                <div className="w-full md:w-[220px]">
                  <div className="flex justify-between text-[12px] font-bold text-on-surface-variant"><span>Đã đăng ký</span><span>{progress}%</span></div>
                  <div className="mt-2 h-2 rounded-full bg-surface-container-low"><div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} /></div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="bg-surface-container-low"><tr>{['STT', 'Tên đội', 'Hạng mục', 'Khu vực', 'Trạng thái'].map((heading) => <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant" key={heading}>{heading}</th>)}</tr></thead>
                  <tbody className="divide-y divide-outline-variant">
                    {tournament.teams.map((team, index) => (
                      <tr key={team.registrationId}><td className="px-5 py-4 text-sm font-bold">{index + 1}</td><td className="px-5 py-4 text-sm font-bold">{team.teamName}</td><td className="px-5 py-4 text-sm">{team.divisionName}</td><td className="px-5 py-4 text-sm text-on-surface-variant">{team.area || 'Chưa có'}</td><td className="px-5 py-4 text-sm font-bold text-primary">{getTournamentRegistrationStatusLabel(team.status)}</td></tr>
                    ))}
                    {!tournament.teams.length && <tr><td className="px-5 py-8 text-center text-sm text-on-surface-variant" colSpan={5}>Chưa có đội được duyệt.</td></tr>}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-[96px] lg:self-start">
            {registration && (
              <section className="rounded-xl border border-primary bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-[20px] font-bold"><ShieldCheck className="h-5 w-5 text-primary" />Đăng ký của bạn</h2>
                <div className="mt-5 space-y-3 text-[14px]">
                  <div className="rounded-lg bg-surface-container-low p-4"><p className="text-[12px] font-bold uppercase text-on-surface-variant">Đội · Hạng mục</p><p className="mt-1 font-bold">{registration.teamName}</p><p className="mt-1 text-xs text-on-surface-variant">{registration.divisionName}</p></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-outline-variant p-3"><p className="text-[12px] font-bold text-on-surface-variant">Trạng thái</p><p className="mt-1 font-bold text-primary">{getTournamentRegistrationStatusLabel(registration.status)}</p></div>
                    <div className="rounded-lg border border-outline-variant p-3"><p className="text-[12px] font-bold text-on-surface-variant">Lệ phí</p><p className="mt-1 font-bold">{registration.paymentStatus === 'confirmed' ? 'Đã xác nhận' : registration.paymentStatus === 'pending' ? 'Chờ đối soát' : 'Chưa thanh toán'}</p></div>
                  </div>
                  {registration.rejectionReason && <p className="rounded-lg bg-error-container p-3 text-xs font-bold text-on-error-container">{registration.rejectionReason}</p>}
                  {registration.checkInCode && (
                    <div className="rounded-xl border-2 border-dashed border-primary bg-primary/5 p-4 text-center">
                      <TicketCheck className="mx-auto h-6 w-6 text-primary" />
                      <p className="mt-2 text-xs font-bold uppercase text-on-surface-variant">Mã check-in</p>
                      <p className="mt-1 break-all text-lg font-black text-primary">{registration.checkInCode}</p>
                      {registration.checkedInAt && <p className="mt-2 text-xs font-bold text-primary">Đã check-in {formatTournamentDateTime(registration.checkedInAt)}</p>}
                    </div>
                  )}
                  <p className="text-[12px] text-on-surface-variant">Đăng ký lúc {formatTournamentDateTime(registration.registeredAt)}</p>
                </div>
              </section>
            )}

            {registration?.status === 'approved' && registration.paymentStatus !== 'confirmed' && registration.paymentStatus !== 'pending' && registration.amountDue > 0 && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-[20px] font-bold"><Banknote className="h-5 w-5 text-primary" />Thanh toán lệ phí</h2>
                <p className="mt-2 text-sm text-on-surface-variant">Số tiền: <strong className="text-primary">{formatTournamentCurrency(registration.amountDue)}</strong></p>
                <form className="mt-4 space-y-3" onSubmit={handlePayment}>
                  <input className="h-11 w-full rounded-lg border border-outline-variant px-3 text-sm" onChange={(event) => setTransferContent(event.target.value)} placeholder={`Nội dung CK: TOURNAMENT ${registration.tournamentRegistrationId}`} value={transferContent} />
                  <label className="block cursor-pointer rounded-xl border-2 border-dashed border-outline-variant p-4 text-center hover:border-primary">
                    <Upload className="mx-auto h-6 w-6 text-primary" />
                    <span className="mt-2 block text-sm font-bold">{receipt?.name || 'Tải ảnh biên lai'}</span>
                    <input accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(event) => setReceipt(event.target.files?.[0] || null)} type="file" />
                  </label>
                  <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-50" disabled={!receipt || isBusy} type="submit">
                    {isBusy && <Loader2 className="h-4 w-4 animate-spin" />}Gửi biên lai đối soát
                  </button>
                </form>
              </section>
            )}

            {!registration && (
              <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-[20px] font-bold"><UserPlus className="h-5 w-5 text-primary" />Đăng ký đội</h2>
                {!isAuthenticated ? (
                  <div className="mt-4"><p className="text-sm leading-6 text-on-surface-variant">Đăng nhập tài khoản player để đăng ký giải.</p><Link className="mt-4 flex w-full justify-center rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white" to={`/login?returnUrl=/tournaments/${tournament.slug}`}>Đăng nhập để đăng ký</Link></div>
                ) : (
                  <form className="mt-5 space-y-4" onSubmit={handleRegister}>
                    <label className="block"><span className="text-[13px] font-bold text-on-surface-variant">Tên đội</span><input className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px]" disabled={!canRegister} onChange={(event) => setTeamName(event.target.value)} required value={teamName} /></label>
                    <label className="block"><span className="text-[13px] font-bold text-on-surface-variant">Thành viên cùng đội</span><input className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px]" disabled={!canRegister} onChange={(event) => setPartnerName(event.target.value)} value={partnerName} /></label>
                    <label className="block"><span className="text-[13px] font-bold text-on-surface-variant">Số điện thoại đại diện</span><input className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px]" disabled={!canRegister} onChange={(event) => setRepresentativePhone(event.target.value)} required type="tel" value={representativePhone} /></label>
                    <label className="block"><span className="text-[13px] font-bold text-on-surface-variant">Hạng mục</span><select className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px]" disabled={!canRegister} onChange={(event) => setDivisionId(Number(event.target.value))} required value={divisionId}>{tournament.divisions.filter((item) => item.status === 'open').map((item) => <option key={item.tournamentDivisionId} value={item.tournamentDivisionId}>{item.name} · {formatTournamentCurrency(item.entryFee)}</option>)}</select></label>
                    <div className="rounded-xl bg-surface-container-low p-4"><div className="flex items-center justify-between gap-4"><span className="text-sm font-bold text-on-surface-variant">Lệ phí hạng mục</span><span className="text-lg font-bold text-primary">{formatTournamentCurrency(currentDivision?.entryFee ?? tournament.entryFee)}</span></div></div>
                    <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[15px] font-bold text-white disabled:bg-outline-variant disabled:text-on-surface-variant" disabled={!canRegister || !teamName.trim() || !representativePhone.trim() || !divisionId || isBusy} type="submit">{isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus className="h-5 w-5" />}{canRegister ? 'Gửi đăng ký' : 'Không mở đăng ký'}</button>
                  </form>
                )}
              </section>
            )}

            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold"><Banknote className="h-5 w-5 text-primary" />Thông tin nhanh</h2>
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Lệ phí từ', value: formatTournamentCurrency(tournament.entryFee) },
                  { label: 'Giải thưởng', value: formatTournamentCurrency(tournament.prizePool) },
                  { label: 'Thành phố', value: tournament.city },
                  { label: 'Thể thức', value: tournament.format },
                ].map((item) => <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-3" key={item.label}><span className="text-[13px] font-bold text-on-surface-variant">{item.label}</span><span className="text-right text-[13px] font-bold">{item.value}</span></div>)}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </div>
  );
};
