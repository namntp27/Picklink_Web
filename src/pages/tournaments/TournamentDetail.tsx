import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Gavel,
  MapPin,
  Medal,
  Phone,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import type { RegistrationStatus, TournamentStatus } from '../../data/tournaments';
import {
  formatTournamentCurrency,
  formatTournamentDate,
  formatTournamentDateTime,
  getTournamentById,
} from '../../data/tournaments';

const getStatusLabel = (status: TournamentStatus) => {
  if (status === 'open') {
    return 'Đang mở đăng ký';
  }

  if (status === 'upcoming') {
    return 'Sắp diễn ra';
  }

  if (status === 'closed') {
    return 'Đã khóa đăng ký';
  }

  return 'Đã kết thúc';
};

const getStatusClassName = (status: TournamentStatus) => {
  if (status === 'open') {
    return 'bg-primary text-white';
  }

  if (status === 'upcoming') {
    return 'bg-[#fff4d8] text-[#7a5600]';
  }

  if (status === 'closed') {
    return 'bg-[#eef0ef] text-[#57615b]';
  }

  return 'bg-[#ffdad6] text-[#ba1a1a]';
};

const getRegistrationStatusLabel = (status: RegistrationStatus) => {
  if (status === 'confirmed') {
    return 'Đã xác nhận';
  }

  if (status === 'pending') {
    return 'Chờ duyệt';
  }

  if (status === 'waitlist') {
    return 'Danh sách chờ';
  }

  return 'Đã hủy';
};

const getTeamStatusLabel = (status: 'approved' | 'pending' | 'waitlist') => {
  if (status === 'approved') {
    return 'Đã duyệt';
  }

  if (status === 'pending') {
    return 'Đang chờ';
  }

  return 'Chờ slot';
};

const getTeamStatusClassName = (status: 'approved' | 'pending' | 'waitlist') => {
  if (status === 'approved') {
    return 'text-primary';
  }

  if (status === 'pending') {
    return 'text-[#7a5600]';
  }

  return 'text-on-surface-variant';
};

export const TournamentDetail = () => {
  const { id } = useParams();
  const tournament = getTournamentById(id);
  const [teamName, setTeamName] = useState(tournament.myRegistration?.teamName ?? '');
  const [representativePhone, setRepresentativePhone] = useState('');
  const [division, setDivision] = useState(tournament.divisions[0] ?? '');
  const [submitted, setSubmitted] = useState(false);

  const progress = Math.round((tournament.registered / tournament.capacity) * 100);
  const canRegister = tournament.status === 'open';
  const remainingSlots = Math.max(tournament.capacity - tournament.registered, 0);
  const hasMyRegistration = Boolean(tournament.myRegistration) || submitted;
  const currentRegistration = tournament.myRegistration;

  const timeline = useMemo(
    () => [
      { label: 'Hạn đăng ký', value: formatTournamentDate(tournament.registrationDeadline), icon: CalendarDays },
      { label: 'Ngày thi đấu', value: `${formatTournamentDate(tournament.startDate)} - ${formatTournamentDate(tournament.endDate)}`, icon: Trophy },
      { label: 'Thể thức', value: tournament.bracket, icon: Gavel },
      { label: 'Còn slot', value: `${remainingSlots}/${tournament.capacity}`, icon: Users },
    ],
    [remainingSlots, tournament.bracket, tournament.capacity, tournament.endDate, tournament.registrationDeadline, tournament.startDate],
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canRegister || !teamName.trim()) {
      return;
    }

    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="relative overflow-hidden bg-[#101820]">
        <img alt={tournament.title} className="absolute inset-0 h-full w-full object-cover opacity-42" src={tournament.image} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#101820] via-[#101820]/78 to-[#101820]/30" />
        <div className="relative z-10 mx-auto max-w-container-max-width px-gutter py-8 text-white">
          <Link className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-[14px] font-bold backdrop-blur hover:bg-white/20" to="/tournaments">
            <ArrowLeft className="h-4 w-4" />
            Quay lại giải đấu
          </Link>

          <div className="mt-16 max-w-4xl">
            <div className="flex flex-wrap items-center gap-3">
              <span className={`rounded-full px-4 py-2 text-[13px] font-bold ${getStatusClassName(tournament.status)}`}>
                {getStatusLabel(tournament.status)}
              </span>
              <span className="rounded-full bg-white/14 px-4 py-2 text-[13px] font-bold backdrop-blur">{tournament.format}</span>
              <span className="rounded-full bg-white/14 px-4 py-2 text-[13px] font-bold backdrop-blur">Trình {tournament.level}</span>
            </div>
            <h1 className="mt-5 text-[36px] font-bold leading-tight md:text-[56px]">{tournament.title}</h1>
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
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-6">
            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-[24px] font-bold">
                    <MapPin className="h-6 w-6 text-primary" />
                    Thông tin địa điểm
                  </h2>
                  <p className="mt-3 text-[16px] font-bold">{tournament.venue}</p>
                  <p className="mt-1 text-[14px] leading-6 text-on-surface-variant">{tournament.address}</p>
                  <p className="mt-3 inline-flex items-center gap-2 rounded-lg bg-surface-container-low px-3 py-2 text-[13px] font-bold text-on-surface-variant">
                    <Phone className="h-4 w-4 text-primary" />
                    {tournament.organizer} · {tournament.organizerPhone}
                  </p>
                </div>
                <div className="rounded-xl bg-primary/10 p-5 text-primary">
                  <p className="text-[12px] font-bold uppercase">Tổng giải thưởng</p>
                  <p className="mt-2 text-[26px] font-bold">{formatTournamentCurrency(tournament.prizePool)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-[24px] font-bold">
                <Gavel className="h-6 w-6 text-primary" />
                Điều lệ giải đấu
              </h2>
              <div className="mt-5 space-y-3">
                {tournament.rules.map((rule) => (
                  <p className="flex gap-3 text-[15px] leading-7 text-on-surface-variant" key={rule}>
                    <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" />
                    {rule}
                  </p>
                ))}
              </div>
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-[24px] font-bold">
                  <Clock className="h-6 w-6 text-primary" />
                  Lịch trình
                </h2>
                <div className="mt-5 space-y-4">
                  {tournament.schedule.map((item) => (
                    <div className="rounded-lg border border-outline-variant p-4" key={`${item.time}-${item.title}`}>
                      <p className="text-[13px] font-bold text-primary">{item.time}</p>
                      <h3 className="mt-1 text-[16px] font-bold">{item.title}</h3>
                      <p className="mt-2 text-[14px] leading-6 text-on-surface-variant">{item.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-[24px] font-bold">
                  <Medal className="h-6 w-6 text-primary" />
                  Cơ cấu giải thưởng
                </h2>
                <div className="mt-5 space-y-4">
                  {tournament.prizes.map((prize, index) => (
                    <div className="flex gap-4 rounded-lg bg-surface-container-low p-4" key={prize.rank}>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-[14px] font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-[16px] font-bold">{prize.rank}</h3>
                        <p className="mt-1 text-[14px] leading-6 text-on-surface-variant">{prize.reward}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white shadow-sm">
              <div className="flex flex-col gap-2 border-b border-outline-variant p-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="flex items-center gap-2 text-[24px] font-bold">
                    <Users className="h-6 w-6 text-primary" />
                    Danh sách đội đã đăng ký
                  </h2>
                  <p className="mt-1 text-[14px] text-on-surface-variant">{tournament.registered}/{tournament.capacity} đội trong giải.</p>
                </div>
                <div className="w-full md:w-[220px]">
                  <div className="flex justify-between text-[12px] font-bold text-on-surface-variant">
                    <span>Đã đăng ký</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-surface-container-low">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left">
                  <thead className="bg-surface-container-low">
                    <tr>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">STT</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Tên đội / người chơi</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Khu vực</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Trình độ</th>
                      <th className="px-5 py-4 text-[12px] font-bold uppercase text-on-surface-variant">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {tournament.teams.map((team, index) => (
                      <tr className="hover:bg-[#f9f9ff]" key={team.id}>
                        <td className="px-5 py-4 text-[14px] font-bold">{(index + 1).toString().padStart(2, '0')}</td>
                        <td className="px-5 py-4 text-[14px] font-bold">{team.name}</td>
                        <td className="px-5 py-4 text-[14px] text-on-surface-variant">{team.area}</td>
                        <td className="px-5 py-4 text-[14px] text-on-surface-variant">{team.level}</td>
                        <td className={`px-5 py-4 text-[13px] font-bold ${getTeamStatusClassName(team.status)}`}>{getTeamStatusLabel(team.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-[96px] lg:self-start">
            {hasMyRegistration && currentRegistration && (
              <section className="rounded-xl border border-primary bg-white p-6 shadow-sm">
                <h2 className="flex items-center gap-2 text-[20px] font-bold">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                  Đăng ký của bạn
                </h2>
                <div className="mt-5 space-y-3 text-[14px]">
                  <div className="rounded-lg bg-surface-container-low p-4">
                    <p className="text-[12px] font-bold uppercase text-on-surface-variant">Đội</p>
                    <p className="mt-1 font-bold">{currentRegistration.teamName}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-outline-variant p-3">
                      <p className="text-[12px] font-bold text-on-surface-variant">Trạng thái</p>
                      <p className="mt-1 font-bold text-primary">{getRegistrationStatusLabel(currentRegistration.status)}</p>
                    </div>
                    <div className="rounded-lg border border-outline-variant p-3">
                      <p className="text-[12px] font-bold text-on-surface-variant">Thanh toán</p>
                      <p className="mt-1 font-bold">{currentRegistration.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
                    </div>
                  </div>
                  <p className="text-[13px] text-on-surface-variant">Mã check-in: <span className="font-bold text-on-surface">{currentRegistration.checkInCode}</span></p>
                  <p className="text-[13px] text-on-surface-variant">Đăng ký lúc {formatTournamentDateTime(currentRegistration.registeredAt)}</p>
                </div>
              </section>
            )}

            {submitted && !currentRegistration && (
              <section className="rounded-xl border border-primary bg-[#eaf7df] p-6 text-primary shadow-sm">
                <h2 className="flex items-center gap-2 text-[20px] font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                  Đã gửi đăng ký
                </h2>
                <p className="mt-3 text-[14px] leading-6">Ban tổ chức sẽ duyệt đội {teamName} và gửi thông báo thanh toán trong thời gian sớm nhất.</p>
              </section>
            )}

            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <UserPlus className="h-5 w-5 text-primary" />
                Đăng ký tham gia
              </h2>
              <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Tên đội / đại diện</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    disabled={!canRegister}
                    onChange={(event) => setTeamName(event.target.value)}
                    placeholder="Nhập tên đội"
                    value={teamName}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Số điện thoại</span>
                  <input
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant px-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    disabled={!canRegister}
                    onChange={(event) => setRepresentativePhone(event.target.value)}
                    placeholder="0xxx xxx xxx"
                    value={representativePhone}
                  />
                </label>
                <label className="block">
                  <span className="text-[13px] font-bold text-on-surface-variant">Nội dung thi đấu</span>
                  <select
                    className="mt-2 h-11 w-full rounded-lg border border-outline-variant bg-white px-3 text-[14px] outline-none focus:border-primary"
                    disabled={!canRegister}
                    onChange={(event) => setDivision(event.target.value)}
                    value={division}
                  >
                    {tournament.divisions.map((item) => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
                <div className="rounded-xl bg-surface-container-low p-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[14px] font-bold text-on-surface-variant">Phí tham dự</span>
                    <span className="text-[18px] font-bold text-primary">{formatTournamentCurrency(tournament.entryFee)}</span>
                  </div>
                  <p className="mt-2 text-[12px] leading-5 text-on-surface-variant">Bao gồm nước uống, bóng thi đấu và chi phí điều phối trọng tài.</p>
                </div>
                <button
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-[15px] font-bold text-white hover:bg-primary/90 disabled:bg-outline-variant disabled:text-on-surface-variant"
                  disabled={!canRegister || !teamName.trim()}
                  type="submit"
                >
                  <UserPlus className="h-5 w-5" />
                  {canRegister ? 'Xác nhận đăng ký' : 'Không mở đăng ký'}
                </button>
              </form>
            </section>

            <section className="rounded-xl border border-outline-variant bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-[20px] font-bold">
                <Banknote className="h-5 w-5 text-primary" />
                Thông tin nhanh
              </h2>
              <div className="mt-5 space-y-3">
                {[
                  { label: 'Lệ phí', value: formatTournamentCurrency(tournament.entryFee) },
                  { label: 'Giải thưởng', value: formatTournamentCurrency(tournament.prizePool) },
                  { label: 'Thành phố', value: tournament.city },
                  { label: 'Thể thức', value: tournament.format },
                ].map((item) => (
                  <div className="flex items-center justify-between gap-4 rounded-lg bg-surface-container-low p-3" key={item.label}>
                    <span className="text-[13px] font-bold text-on-surface-variant">{item.label}</span>
                    <span className="text-right text-[13px] font-bold">{item.value}</span>
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
