import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  MapPin,
  Medal,
  Search,
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
  XCircle,
} from 'lucide-react';
import type { RegistrationStatus, TournamentDetail } from '../../data/tournaments';
import {
  formatTournamentCurrency,
  formatTournamentDate,
  formatTournamentDateTime,
  getMyTournamentRegistrations,
} from '../../data/tournaments';

type RegistrationFilter = 'all' | RegistrationStatus | 'paid' | 'unpaid';

const filterOptions: Array<{ label: string; value: RegistrationFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Đã xác nhận', value: 'confirmed' },
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Danh sách chờ', value: 'waitlist' },
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Chưa thanh toán', value: 'unpaid' },
];

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

const getRegistrationStatusClassName = (status: RegistrationStatus) => {
  if (status === 'confirmed') {
    return 'bg-[#eaf7df] text-primary';
  }

  if (status === 'pending') {
    return 'bg-[#fff4d8] text-[#7a5600]';
  }

  if (status === 'waitlist') {
    return 'bg-[#e7eefe] text-[#315f8f]';
  }

  return 'bg-[#ffdad6] text-[#ba1a1a]';
};

const getRegistrationStatusIcon = (status: RegistrationStatus) => {
  if (status === 'confirmed') {
    return CheckCircle2;
  }

  if (status === 'pending') {
    return Clock;
  }

  if (status === 'waitlist') {
    return AlertCircle;
  }

  return XCircle;
};

const RegistrationCard = ({ tournament }: { tournament: TournamentDetail }) => {
  const registration = tournament.myRegistration;

  if (!registration) {
    return null;
  }

  const StatusIcon = getRegistrationStatusIcon(registration.status);

  return (
    <article className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Link className="relative block h-56 overflow-hidden lg:h-full" to={`/tournaments/${tournament.id}`}>
          <img alt={tournament.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-105" src={tournament.image} />
          <span className={`absolute left-4 top-4 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold ${getRegistrationStatusClassName(registration.status)}`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {getRegistrationStatusLabel(registration.status)}
          </span>
        </Link>

        <div className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <Link to={`/tournaments/${tournament.id}`}>
                <h2 className="text-[22px] font-bold leading-7 hover:text-primary">{tournament.title}</h2>
              </Link>
              <p className="mt-2 line-clamp-2 text-[14px] leading-6 text-on-surface-variant">{tournament.description}</p>
            </div>
            <div className="rounded-lg bg-primary/10 px-4 py-3 text-primary">
              <p className="text-[12px] font-bold uppercase">Mã check-in</p>
              <p className="mt-1 text-[15px] font-bold">{registration.checkInCode}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Đội đăng ký', value: registration.teamName, icon: Users },
              { label: 'Nội dung', value: registration.division, icon: Medal },
              { label: 'Ngày thi đấu', value: formatTournamentDate(tournament.startDate), icon: CalendarDays },
              { label: 'Địa điểm', value: tournament.venue, icon: MapPin },
            ].map((item) => (
              <div className="rounded-lg bg-surface-container-low p-3" key={item.label}>
                <item.icon className="h-4 w-4 text-primary" />
                <p className="mt-2 text-[11px] font-bold uppercase text-on-surface-variant">{item.label}</p>
                <p className="mt-1 text-[13px] font-bold leading-5">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-outline-variant pt-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold ${registration.paid ? 'bg-[#eaf7df] text-primary' : 'bg-[#fff4d8] text-[#7a5600]'}`}>
                <Banknote className="h-3.5 w-3.5" />
                {registration.paid ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </span>
              <span className="rounded-full bg-surface-container-low px-3 py-1 text-[12px] font-bold text-on-surface-variant">
                Đăng ký lúc {formatTournamentDateTime(registration.registeredAt)}
              </span>
              {registration.seed && (
                <span className="rounded-full bg-primary/10 px-3 py-1 text-[12px] font-bold text-primary">Seed #{registration.seed}</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              {!registration.paid && (
                <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[13px] font-bold text-white hover:bg-primary/90" type="button">
                  <Banknote className="h-4 w-4" />
                  Thanh toán
                </button>
              )}
              <Link className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-[13px] font-bold text-on-surface hover:bg-surface-container-low" to={`/tournaments/${tournament.id}`}>
                <Eye className="h-4 w-4" />
                Chi tiết
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export const MyTournaments = () => {
  const [activeFilter, setActiveFilter] = useState<RegistrationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const registeredTournaments = useMemo(() => getMyTournamentRegistrations(), []);

  const filteredTournaments = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return registeredTournaments.filter((tournament) => {
      const registration = tournament.myRegistration;

      if (!registration) {
        return false;
      }

      const matchesKeyword =
        !keyword ||
        tournament.title.toLowerCase().includes(keyword) ||
        tournament.venue.toLowerCase().includes(keyword) ||
        registration.teamName.toLowerCase().includes(keyword) ||
        registration.division.toLowerCase().includes(keyword);
      const matchesFilter =
        activeFilter === 'all' ||
        registration.status === activeFilter ||
        (activeFilter === 'paid' && registration.paid) ||
        (activeFilter === 'unpaid' && !registration.paid);

      return matchesKeyword && matchesFilter;
    });
  }, [activeFilter, registeredTournaments, searchTerm]);

  const confirmedCount = registeredTournaments.filter((tournament) => tournament.myRegistration?.status === 'confirmed').length;
  const pendingCount = registeredTournaments.filter((tournament) => tournament.myRegistration?.status === 'pending').length;
  const paidAmount = registeredTournaments
    .filter((tournament) => tournament.myRegistration?.paid)
    .reduce((total, tournament) => total + tournament.entryFee, 0);
  const upcomingCount = registeredTournaments.filter((tournament) => tournament.status === 'open' || tournament.status === 'upcoming').length;

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-container-max-width px-gutter py-10">
          <Link className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-[14px] font-bold backdrop-blur hover:bg-white/20" to="/tournaments">
            <Trophy className="h-4 w-4" />
            Xem tất cả giải đấu
          </Link>
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-[13px] font-bold backdrop-blur">
                <ShieldCheck className="h-4 w-4" />
                Hồ sơ thi đấu
              </p>
              <h1 className="mt-4 text-[34px] font-bold leading-tight md:text-[48px]">Giải đấu tôi đã đăng ký</h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/86">
                Theo dõi trạng thái duyệt, thanh toán, lịch thi đấu, mã check-in và các giải bạn đang tham gia.
              </p>
            </div>
            <Link className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-3 text-[14px] font-bold text-primary hover:bg-white/92" to="/tournaments">
              <Ticket className="h-5 w-5" />
              Đăng ký giải mới
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-container-max-width px-gutter py-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng đăng ký', value: registeredTournaments.length, icon: Ticket, helper: `${upcomingCount} giải sắp tới` },
            { label: 'Đã xác nhận', value: confirmedCount, icon: CheckCircle2, helper: 'Sẵn sàng check-in' },
            { label: 'Chờ duyệt', value: pendingCount, icon: Clock, helper: 'Cần theo dõi phản hồi BTC' },
            { label: 'Đã thanh toán', value: formatTournamentCurrency(paidAmount), icon: Banknote, helper: 'Tổng lệ phí đã trả' },
          ].map((stat) => (
            <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm" key={stat.label}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[13px] font-bold text-on-surface-variant">{stat.label}</p>
                  <p className="mt-2 text-[28px] font-bold leading-tight">{stat.value}</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <stat.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-[12px] font-medium text-on-surface-variant">{stat.helper}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-[20px] font-bold">Danh sách đăng ký</h2>
              <p className="mt-1 text-[13px] text-on-surface-variant">Lọc theo trạng thái đăng ký hoặc thanh toán.</p>
            </div>
            <div className="relative w-full lg:w-[360px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
              <input
                className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-3 text-[14px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Tìm tên giải, đội, nội dung..."
                value={searchTerm}
              />
            </div>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {filterOptions.map((option) => (
              <button
                className={`h-9 shrink-0 rounded-lg px-3 text-[13px] font-bold transition-colors ${
                  activeFilter === option.value
                    ? 'bg-primary text-white'
                    : 'border border-outline-variant bg-white text-on-surface-variant hover:bg-surface-container-low'
                }`}
                key={option.value}
                onClick={() => setActiveFilter(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-6 space-y-5">
          {filteredTournaments.map((tournament) => (
            <RegistrationCard key={tournament.id} tournament={tournament} />
          ))}

          {filteredTournaments.length === 0 && (
            <div className="rounded-xl border border-outline-variant bg-white p-10 text-center shadow-sm">
              <Trophy className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 text-[22px] font-bold">Không có giải phù hợp</h2>
              <p className="mt-2 text-[14px] text-on-surface-variant">Thử đổi bộ lọc hoặc đăng ký thêm giải mới.</p>
              <Link className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-3 text-[14px] font-bold text-white hover:bg-primary/90" to="/tournaments">
                Khám phá giải đấu
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};
