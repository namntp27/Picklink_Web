import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  CheckCircle2,
  Clock,
  Eye,
  Loader2,
  Search,
  ShieldCheck,
  Ticket,
  TicketCheck,
  Trophy,
} from 'lucide-react';
import {
  formatTournamentCurrency,
  formatTournamentDate,
  formatTournamentDateTime,
  getMyTournamentRegistrations,
  getTournamentRegistrationStatusLabel,
  type TournamentRegistration,
} from '../../api/tournaments';
import { useAuth } from '../../auth/AuthContext';

type RegistrationFilter = 'all' | 'pending' | 'approved' | 'waitlisted' | 'paid' | 'unpaid';

const filterOptions: Array<{ label: string; value: RegistrationFilter }> = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Chờ duyệt', value: 'pending' },
  { label: 'Đã duyệt', value: 'approved' },
  { label: 'Danh sách chờ', value: 'waitlisted' },
  { label: 'Đã thanh toán', value: 'paid' },
  { label: 'Chưa thanh toán', value: 'unpaid' },
];

const RegistrationCard = ({ registration }: { registration: TournamentRegistration }) => (
  <article className="overflow-hidden rounded-xl border border-outline-variant bg-white shadow-sm">
    <div className="grid md:grid-cols-[220px_1fr]">
      <img
        alt={registration.tournamentName}
        className="h-48 w-full object-cover md:h-full"
        src={registration.tournamentImageUrl || 'https://images.unsplash.com/photo-1626245465352-87ff55a6d0ab?q=80&w=900&auto=format&fit=crop'}
      />
      <div className="p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link to={`/tournaments/${registration.tournamentSlug}`}>
              <h2 className="text-xl font-bold hover:text-primary">{registration.tournamentName}</h2>
            </Link>
            <p className="mt-1 text-sm text-on-surface-variant">{registration.venueName} · {formatTournamentDate(registration.startDate)} - {formatTournamentDate(registration.endDate)}</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${
            registration.status === 'approved' ? 'bg-primary/10 text-primary' : registration.status === 'rejected' ? 'bg-error-container text-on-error-container' : 'bg-[#fff4d8] text-[#7a5600]'
          }`}>{getTournamentRegistrationStatusLabel(registration.status)}</span>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Đội', value: registration.teamName },
            { label: 'Hạng mục', value: registration.divisionName },
            { label: 'Lệ phí', value: formatTournamentCurrency(registration.amountDue) },
            { label: 'Thanh toán', value: registration.paymentStatus === 'confirmed' ? 'Đã xác nhận' : registration.paymentStatus === 'pending' ? 'Chờ đối soát' : 'Chưa thanh toán' },
          ].map((item) => (
            <div className="rounded-lg bg-surface-container-low p-3" key={item.label}>
              <p className="text-[11px] font-bold uppercase text-on-surface-variant">{item.label}</p>
              <p className="mt-1 text-sm font-bold">{item.value}</p>
            </div>
          ))}
        </div>

        {registration.checkInCode && (
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-primary/30 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-primary"><TicketCheck className="h-5 w-5" /><span className="text-sm font-bold">Mã check-in</span></div>
            <strong className="break-all text-primary">{registration.checkInCode}</strong>
          </div>
        )}
        {registration.rejectionReason && <p className="mt-4 rounded-lg bg-error-container p-3 text-sm font-bold text-on-error-container">{registration.rejectionReason}</p>}

        <div className="mt-5 flex flex-col gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-on-surface-variant">Đăng ký lúc {formatTournamentDateTime(registration.registeredAt)}</p>
          <div className="flex gap-2">
            {registration.status === 'approved' && registration.paymentStatus !== 'confirmed' && registration.paymentStatus !== 'pending' && (
              <Link className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white" to={`/tournaments/${registration.tournamentSlug}`}>
                <Banknote className="h-4 w-4" />Thanh toán
              </Link>
            )}
            <Link className="inline-flex items-center gap-2 rounded-lg border border-outline-variant px-4 py-2 text-sm font-bold" to={`/tournaments/${registration.tournamentSlug}`}>
              <Eye className="h-4 w-4" />Chi tiết
            </Link>
          </div>
        </div>
      </div>
    </div>
  </article>
);

export const MyTournaments = () => {
  const { token } = useAuth();
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([]);
  const [activeFilter, setActiveFilter] = useState<RegistrationFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) return;
    let active = true;
    getMyTournamentRegistrations(token)
      .then((items) => {
        if (active) setRegistrations(items);
      })
      .catch((reason: Error) => {
        if (active) setError(reason.message);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const filteredRegistrations = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    return registrations.filter((registration) => {
      const matchesKeyword =
        !keyword ||
        registration.tournamentName.toLowerCase().includes(keyword) ||
        registration.venueName.toLowerCase().includes(keyword) ||
        registration.teamName.toLowerCase().includes(keyword) ||
        registration.divisionName.toLowerCase().includes(keyword);
      const matchesFilter =
        activeFilter === 'all' ||
        registration.status === activeFilter ||
        (activeFilter === 'paid' && registration.paymentStatus === 'confirmed') ||
        (activeFilter === 'unpaid' && registration.paymentStatus !== 'confirmed');
      return matchesKeyword && matchesFilter;
    });
  }, [activeFilter, registrations, searchTerm]);

  const approvedCount = registrations.filter((item) => item.status === 'approved').length;
  const pendingCount = registrations.filter((item) => item.status === 'pending').length;
  const paidAmount = registrations.filter((item) => item.paymentStatus === 'confirmed').reduce((total, item) => total + item.amountDue, 0);

  return (
    <div className="min-h-screen bg-[#f9f9ff] pt-[72px] text-on-surface">
      <section className="bg-primary text-white">
        <div className="mx-auto max-w-container-max-width px-gutter py-10">
          <Link className="inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-4 py-2 text-sm font-bold" to="/tournaments"><Trophy className="h-4 w-4" />Xem tất cả giải đấu</Link>
          <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/14 px-4 py-2 text-sm font-bold"><ShieldCheck className="h-4 w-4" />Hồ sơ thi đấu</p>
              <h1 className="mt-4 text-[34px] font-bold md:text-[48px]">Giải đấu tôi đã đăng ký</h1>
              <p className="mt-3 max-w-2xl text-[16px] leading-7 text-white/86">Theo dõi duyệt đội, đối soát lệ phí và mã check-in từ một nơi.</p>
            </div>
            <Link className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-primary" to="/tournaments"><Ticket className="h-5 w-5" />Đăng ký giải mới</Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-container-max-width px-gutter py-8">
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Tổng đăng ký', value: registrations.length, icon: Ticket, helper: 'Tất cả giải đã tham gia' },
            { label: 'Đã duyệt', value: approvedCount, icon: CheckCircle2, helper: 'Đủ điều kiện thanh toán' },
            { label: 'Chờ duyệt', value: pendingCount, icon: Clock, helper: 'Đang chờ admin xử lý' },
            { label: 'Đã thanh toán', value: formatTournamentCurrency(paidAmount), icon: Banknote, helper: 'Tổng lệ phí xác nhận' },
          ].map((stat) => (
            <div className="rounded-xl border border-outline-variant bg-white p-5 shadow-sm" key={stat.label}>
              <div className="flex items-start justify-between gap-4"><div><p className="text-sm font-bold text-on-surface-variant">{stat.label}</p><p className="mt-2 text-[28px] font-bold">{stat.value}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary"><stat.icon className="h-5 w-5" /></div></div>
              <p className="mt-3 text-xs text-on-surface-variant">{stat.helper}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 rounded-xl border border-outline-variant bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-xl font-bold">Danh sách đăng ký</h2><p className="mt-1 text-sm text-on-surface-variant">Lọc theo trạng thái đăng ký hoặc thanh toán.</p></div>
            <div className="relative w-full lg:w-[360px]"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" /><input className="h-11 w-full rounded-lg border border-outline-variant bg-surface-container-low pl-9 pr-3 text-sm" onChange={(event) => setSearchTerm(event.target.value)} placeholder="Tìm tên giải, đội, hạng mục..." value={searchTerm} /></div>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            {filterOptions.map((option) => <button className={`h-9 shrink-0 rounded-lg px-3 text-sm font-bold ${activeFilter === option.value ? 'bg-primary text-white' : 'border border-outline-variant bg-white text-on-surface-variant'}`} key={option.value} onClick={() => setActiveFilter(option.value)} type="button">{option.label}</button>)}
          </div>
        </section>

        {error && <div className="mt-6 rounded-lg bg-error-container p-4 text-sm text-on-error-container">{error}</div>}
        <section className="mt-6 space-y-5">
          {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : filteredRegistrations.map((registration) => <RegistrationCard key={registration.tournamentRegistrationId} registration={registration} />)}
          {!isLoading && filteredRegistrations.length === 0 && <div className="rounded-xl border border-outline-variant bg-white p-10 text-center"><Trophy className="mx-auto h-12 w-12 text-primary" /><h2 className="mt-4 text-xl font-bold">Không có đăng ký phù hợp</h2><Link className="mt-5 inline-flex rounded-lg bg-primary px-4 py-3 text-sm font-bold text-white" to="/tournaments">Khám phá giải đấu</Link></div>}
        </section>
      </main>
    </div>
  );
};
