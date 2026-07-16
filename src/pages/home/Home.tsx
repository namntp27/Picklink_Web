import { motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Clock,
  Compass,
  MapPin,
  Network,
  Radio,
  RefreshCw,
  Search,
  Shield,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBookingVenues, type BookingVenue } from '../../api/booking';
import { getGroups, type CommunityGroup } from '../../api/community';
import { getOpenMatches, type MatchSummary } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { AdministrativeAreaSelects } from '../../components/location/AdministrativeAreaSelects';
import { Button } from '../../components/ui/Button';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';

const benefits = [
  { label: 'Đặt sân nhanh', icon: Zap },
  { label: 'Tìm hội cùng trình', icon: Network },
  { label: 'Quản lý CLB', icon: Shield },
  { label: 'Theo dõi lịch chơi', icon: Calendar },
];

const quickMoves = [
  { label: 'Tìm sân gần bạn', to: '/book-court', icon: Compass },
  { label: 'Ghép trận hôm nay', to: '/opponents', icon: Radio },
  { label: 'Xem bảng tin cộng đồng', to: '/posts', icon: Users },
];

const interactiveLinkClass =
  'transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/72 active:translate-y-px active:scale-[0.99]';

const sectionRevealTransition = {
  duration: 0.32,
  ease: [0.2, 0.8, 0.2, 1],
} as const;

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const invitationDateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
}).format(new Date(value + 'T00:00:00'));

const SectionHeader = ({
  action,
  label,
  title,
}: {
  action?: ReactNode;
  label: string;
  title: string;
}) => (
  <div className="mb-7 flex flex-col items-start justify-between gap-4 sm:mb-9 md:flex-row md:items-end">
    <div className="max-w-2xl">
      <p className="text-[13px] font-bold text-primary">{label}</p>
      <h2 className="mt-2 max-w-[16ch] text-[clamp(1.65rem,3vw,2.35rem)] font-bold leading-[1.08] tracking-[-0.025em] text-on-background">
        {title}
      </h2>
    </div>
    {action}
  </div>
);

export const Home = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const [openInvitations, setOpenInvitations] = useState<MatchSummary[]>([]);
  const [openInvitationCount, setOpenInvitationCount] = useState(0);
  const [isLoadingInvitations, setIsLoadingInvitations] = useState(true);
  const [invitationError, setInvitationError] = useState('');
  const [venues, setVenues] = useState<BookingVenue[]>([]);
  const [clubs, setClubs] = useState<CommunityGroup[]>([]);
  const [isLoadingVenues, setIsLoadingVenues] = useState(true);
  const [isLoadingClubs, setIsLoadingClubs] = useState(true);
  const [venueError, setVenueError] = useState('');
  const [clubError, setClubError] = useState('');
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 18 };
  const selectedArea = [selectedWard, selectedProvince].filter(Boolean).join(' ');
  const selectedAreaLabel = [selectedWard, selectedProvince].filter(Boolean).join(', ');
  const courtSearchPath = selectedArea
    ? '/book-court?area=' + encodeURIComponent(selectedArea)
    : '/book-court';

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    setIsLoadingVenues(true);
    setIsLoadingClubs(true);
    setVenueError('');
    setClubError('');
    setVenues([]);
    setClubs([]);

    void getBookingVenues(
      { area: selectedArea || undefined, page: 1, pageSize: 4 },
      token,
      controller.signal,
    )
      .then((result) => {
        if (active) setVenues(result.items);
      })
      .catch((reason) => {
        if (!active || controller.signal.aborted) return;
        setVenueError(reason instanceof Error ? reason.message : 'Không thể tải danh sách sân.');
      })
      .finally(() => {
        if (active) setIsLoadingVenues(false);
      });

    void getGroups(token, selectedArea || undefined, 1, 3, 'All', 'members')
      .then((result) => {
        if (active) setClubs(result);
      })
      .catch((reason) => {
        if (!active) return;
        setClubError(reason instanceof Error ? reason.message : 'Không thể tải danh sách câu lạc bộ.');
      })
      .finally(() => {
        if (active) setIsLoadingClubs(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [reloadKey, selectedArea, token]);

  const loadOpenInvitations = useCallback(async () => {
    setIsLoadingInvitations(true);
    try {
      const result = await getOpenMatches(token ?? undefined, { page: 1, pageSize: 3 });
      setOpenInvitations(result.items);
      setOpenInvitationCount(result.totalCount);
      setInvitationError('');
    } catch (reason) {
      setInvitationError(reason instanceof Error ? reason.message : 'Không thể tải danh sách lời mời.');
    } finally {
      setIsLoadingInvitations(false);
    }
  }, [token]);

  useEffect(() => {
    void loadOpenInvitations();
  }, [loadOpenInvitations]);

  useMatchRealtime(() => {
    void loadOpenInvitations();
  });

  const availableInvitationSlots = openInvitations.reduce(
    (total, invitation) => total + invitation.availableSlotCount,
    0,
  );
  const featuredVenue = venues[0];

  return (
    <div className="min-w-0 flex-1 overflow-x-clip bg-[#f8fbf4] text-on-background">
      <section className="relative overflow-hidden bg-[#081d24] px-4 pb-10 pt-24 text-white sm:px-6 md:pb-14 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(152,217,81,0.22),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(225,255,87,0.16),transparent_28%),linear-gradient(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(to_top,rgba(248,251,244,1),rgba(248,251,244,0))]" />
        </div>

        <div className="relative mx-auto grid w-full max-w-[1180px] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)] lg:items-center">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0"
            initial={revealInitial}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <p className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/14 bg-white/8 px-3 py-2 text-[13px] font-semibold text-white/88">
              <Zap aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
              Cộng đồng pickleball cho người chơi thật
            </p>
            <h1 className="mt-5 max-w-[12ch] text-balance text-[clamp(2.35rem,6vw,4.9rem)] font-bold leading-[0.98] tracking-[-0.04em]">
              Chơi đều hơn. Kết nối nhanh hơn.
            </h1>
            <p className="mt-5 max-w-[58ch] text-[15px] leading-7 text-white/76 md:text-[17px] md:leading-8">
              Picklink giúp bạn tìm sân, ghép hội, vào câu lạc bộ và theo dõi lịch chơi trong một nơi.
            </p>
            <div className="mt-7 flex">
              <Link
                className={'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#e2ff57] px-5 py-3 text-[15px] font-bold text-[#102414] shadow-[0_14px_30px_rgba(152,217,81,0.24)] hover:bg-[#d6f64d] ' + interactiveLinkClass}
                to={courtSearchPath}
              >
                Tìm sân ngay
                <Compass aria-hidden="true" className="h-5 w-5" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.08, duration: shouldReduceMotion ? 0.01 : 0.42 }}
          >
            <div className="overflow-hidden rounded-2xl border border-white/14 bg-white text-on-surface shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              {isLoadingVenues ? (
                <div aria-label="Đang tải sân nổi bật" className="h-52 animate-pulse bg-[#dce8d7] motion-reduce:animate-none" role="status" />
              ) : venueError ? (
                <div className="grid min-h-52 place-items-center bg-[#143f34] p-6 text-center text-white" role="alert">
                  <div>
                    <AlertTriangle aria-hidden="true" className="mx-auto h-6 w-6 text-[#e2ff57]" />
                    <p className="mt-3 text-[14px] font-bold">Chưa thể tải sân nổi bật</p>
                  </div>
                </div>
              ) : featuredVenue ? (
                featuredVenue.imageUrl ? (
                  <figure>
                    <img
                      alt={featuredVenue.venueName}
                      className="h-44 w-full object-cover sm:h-52"
                      fetchPriority="high"
                      height="420"
                      src={featuredVenue.imageUrl}
                      width="720"
                    />
                    <figcaption className="border-b border-outline-variant bg-[#edf5e9] px-4 py-3">
                      <p className="line-clamp-1 text-[14px] font-bold">{featuredVenue.venueName}</p>
                      <p className="mt-1 line-clamp-1 text-[12px] font-semibold text-on-surface-variant">{featuredVenue.address}</p>
                    </figcaption>
                  </figure>
                ) : (
                  <div className="grid min-h-52 place-items-center bg-[#276b3f] p-6 text-center text-white">
                    <div>
                      <Building2 aria-hidden="true" className="mx-auto h-9 w-9 text-[#e2ff57]" />
                      <p className="mt-3 text-[16px] font-bold">{featuredVenue.venueName}</p>
                      <p className="mt-1 text-[12px] font-semibold text-white/70">{featuredVenue.address}</p>
                    </div>
                  </div>
                )
              ) : (
                <div className="grid min-h-52 place-items-center bg-[#143f34] p-6 text-center text-white">
                  <div>
                    <MapPin aria-hidden="true" className="mx-auto h-8 w-8 text-[#e2ff57]" />
                    <p className="mt-3 text-[14px] font-bold">Chưa có sân trong khu vực này</p>
                  </div>
                </div>
              )}

              <div className="grid min-w-0 gap-4 p-4 sm:p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <AdministrativeAreaSelects
                    fieldClassName="grid min-w-0 gap-1.5"
                    labelClassName="text-[12px] font-bold text-on-surface-variant"
                    onAreaChange={(province, ward) => {
                      setSelectedProvince(province ?? '');
                      setSelectedWard(ward ?? '');
                    }}
                    province={selectedProvince}
                    selectClassName="h-11 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container px-3 text-[13px] font-semibold text-on-surface outline-none focus:border-primary-container focus:ring-2 focus:ring-primary-container/25"
                    ward={selectedWard}
                  />
                </div>
                <Button
                  className="h-12 w-full justify-center bg-[#e2ff57] text-[#102414] hover:bg-[#d6f64d]"
                  onClick={() => navigate(courtSearchPath)}
                  type="button"
                >
                  Tìm sân phù hợp
                  <Search aria-hidden="true" className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
      <section className="px-4 pb-8 pt-2 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-3 rounded-2xl border border-outline-variant bg-white p-3 shadow-[0_16px_42px_rgba(18,45,34,0.07)] md:grid-cols-3">
          {quickMoves.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                className={'group flex min-h-16 items-center justify-between gap-4 rounded-xl px-4 py-3 text-on-surface hover:bg-[#f0f8e8] ' + interactiveLinkClass}
                key={item.label}
                to={item.to}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f8cf] text-primary">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="text-[14px] font-bold">{item.label}</span>
                </span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-on-surface-variant transition-transform group-hover:translate-x-1" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeader
            action={(
              <Link
                className={'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[14px] font-bold text-primary hover:bg-primary/5 ' + interactiveLinkClass}
                to={courtSearchPath}
              >
                Xem tất cả
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            )}
            label="Sân có thể đặt"
            title={selectedAreaLabel ? 'Sân tại ' + selectedAreaLabel : 'Sân thật, lịch đặt rõ ràng'}
          />

          {isLoadingVenues ? (
            <div aria-label="Đang tải danh sách sân" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" role="status">
              {[0, 1, 2, 3].map((item) => (
                <article className="overflow-hidden rounded-2xl border border-outline-variant bg-white" key={item}>
                  <div className="h-48 animate-pulse bg-[#dce8d7] motion-reduce:animate-none" />
                  <div className="grid gap-3 p-5">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-[#dce8d7] motion-reduce:animate-none" />
                    <div className="h-4 animate-pulse rounded bg-[#edf5e9] motion-reduce:animate-none" />
                  </div>
                </article>
              ))}
            </div>
          ) : venueError ? (
            <div className="rounded-2xl border border-[#e7c8c4] bg-white p-6" role="alert">
              <AlertTriangle aria-hidden="true" className="h-7 w-7 text-[#ba1a1a]" />
              <h3 className="mt-4 text-[19px] font-bold">Không thể tải danh sách sân</h3>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-on-surface-variant">{venueError}</p>
              <button
                className={'mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0b2228] px-4 py-2.5 text-[14px] font-bold text-white ' + interactiveLinkClass}
                onClick={() => setReloadKey((value) => value + 1)}
                type="button"
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
                Thử tải lại
              </button>
            </div>
          ) : venues.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-8 text-center">
              <Building2 aria-hidden="true" className="mx-auto h-9 w-9 text-primary" />
              <h3 className="mt-4 text-[19px] font-bold">Chưa có sân phù hợp</h3>
              <p className="mx-auto mt-2 max-w-xl text-[14px] leading-6 text-on-surface-variant">
                {selectedArea ? 'Hãy chọn khu vực khác hoặc xem toàn bộ sân.' : 'Hiện chưa có sân nào được mở để đặt.'}
              </p>
              <Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#e2ff57] px-4 text-[14px] font-bold text-[#102414]" to="/book-court">
                Xem tất cả sân
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {venues.map((venue, index) => (
                <motion.article
                  className={'group min-w-0 overflow-hidden rounded-2xl bg-white shadow-[0_14px_34px_rgba(18,45,34,0.07)] ring-1 ring-outline-variant/80 '
                    + (index === 0 ? 'md:col-span-2 xl:col-span-1 xl:row-span-2 ' : '')
                    + (index === 3 ? 'xl:col-span-2 ' : '')}
                  initial={revealInitial}
                  key={venue.venueId}
                  transition={{ ...sectionRevealTransition, delay: shouldReduceMotion ? 0 : index * 0.04 }}
                  viewport={{ amount: 0.15, once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className={index === 0 ? 'h-60 overflow-hidden bg-[#276b3f] xl:h-[330px]' : 'h-48 overflow-hidden bg-[#276b3f]'}>
                    {venue.imageUrl ? (
                      <img
                        alt={venue.venueName}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none"
                        decoding="async"
                        loading="lazy"
                        src={venue.imageUrl}
                      />
                    ) : (
                      <div className="grid h-full place-items-center bg-[#276b3f]">
                        <Building2 aria-hidden="true" className="h-12 w-12 text-[#e2ff57]" />
                      </div>
                    )}
                  </div>
                  <div className="grid gap-4 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="min-w-0 text-[17px] font-bold leading-6">{venue.venueName}</h3>
                      <span className="shrink-0 rounded-lg bg-[#f0f8e8] px-2.5 py-1 text-[13px] font-bold text-primary">
                        {currency.format(venue.fromPrice)}/giờ
                      </span>
                    </div>
                    <p className="line-clamp-2 text-[13px] font-semibold leading-5 text-on-surface-variant">
                      <MapPin aria-hidden="true" className="mr-1.5 inline h-4 w-4 text-primary" />
                      {venue.address}
                    </p>
                    <div className="flex flex-wrap gap-3 text-[12px] font-semibold text-on-surface-variant">
                      <span><Clock aria-hidden="true" className="mr-1 inline h-4 w-4 text-primary" />{venue.openTime.slice(0, 5)} - {venue.closeTime.slice(0, 5)}</span>
                      <span>{venue.courtCount.toLocaleString('vi-VN')} sân</span>
                      {venue.overallRating > 0 && <span><Star aria-hidden="true" className="mr-1 inline h-4 w-4 fill-[#e2ff57] text-primary" />{venue.overallRating.toFixed(1)}</span>}
                    </div>
                    <Button onClick={() => navigate('/court/' + venue.venueId + '/schedule')} type="button" variant="outline">
                      Đặt sân
                    </Button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>
      <section className="px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-5 rounded-2xl bg-[#0b2228] p-5 text-white shadow-[0_20px_60px_rgba(8,29,36,0.14)] lg:grid-cols-[0.68fr_1.32fr] lg:p-8">
          <div className="flex flex-col justify-between gap-6 rounded-xl border border-white/12 bg-white/7 p-5">
            <div>
              <p className="text-[13px] font-bold text-[#e2ff57]">Lời mời đang mở</p>
              <h2 className="mt-2 max-w-[11ch] text-[clamp(1.7rem,3vw,2.45rem)] font-bold leading-[1.06]">
                Có hội đang chờ bạn vào sân
              </h2>
              <p className="mt-4 max-w-[34ch] text-[13px] leading-6 text-white/68">
                Chọn phòng phù hợp với khu vực, thời gian và trình độ của bạn.
              </p>
            </div>
            <div>
              <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/12 bg-white/12">
                <div className="bg-white/5 p-3">
                  <p className="font-mono text-[22px] font-bold text-[#e2ff57]">{openInvitationCount}</p>
                  <p className="mt-1 text-[11px] font-semibold text-white/58">lời mời đang mở</p>
                </div>
                <div className="bg-white/5 p-3">
                  <p className="font-mono text-[22px] font-bold text-[#e2ff57]">{availableInvitationSlots}</p>
                  <p className="mt-1 text-[11px] font-semibold text-white/58">chỗ trống đang xem</p>
                </div>
              </div>
              <Link
                className={'inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#e2ff57] px-4 py-2.5 text-[14px] font-bold text-[#102414] ' + interactiveLinkClass}
                to="/opponents"
              >
                Xem tất cả lời mời
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid min-w-0 gap-3">
            {isLoadingInvitations ? (
              [0, 1, 2].map((item) => (
                <div aria-hidden="true" className="min-h-[132px] animate-pulse rounded-xl border border-white/10 bg-white/7 motion-reduce:animate-none" key={item} />
              ))
            ) : invitationError ? (
              <div className="grid min-h-[250px] place-items-center rounded-xl border border-red-200/20 bg-red-950/20 p-6 text-center" role="alert">
                <div>
                  <AlertTriangle aria-hidden="true" className="mx-auto h-6 w-6 text-[#e2ff57]" />
                  <p className="mt-3 text-[14px] font-bold">Chưa thể tải lời mời</p>
                  <p className="mt-1 text-[12px] text-white/62">{invitationError}</p>
                </div>
              </div>
            ) : openInvitations.length === 0 ? (
              <div className="grid min-h-[250px] place-items-center rounded-xl border border-dashed border-white/18 bg-white/5 p-6 text-center">
                <div>
                  <Users aria-hidden="true" className="mx-auto h-7 w-7 text-[#e2ff57]" />
                  <p className="mt-3 text-[14px] font-bold">Chưa có lời mời đang mở</p>
                  <p className="mt-1 text-[12px] text-white/62">Bạn có thể tạo phòng mới trên trang tìm đối thủ.</p>
                </div>
              </div>
            ) : (
              openInvitations.map((invitation, index) => (
                <motion.article
                  className="group rounded-xl border border-white/12 bg-white/7 transition-colors hover:bg-white/10"
                  initial={revealInitial}
                  key={invitation.matchId}
                  transition={{ ...sectionRevealTransition, delay: shouldReduceMotion ? 0 : index * 0.05 }}
                  viewport={{ amount: 0.15, once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <Link
                    className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    to={'/matches/' + invitation.matchId}
                  >
                    <div className="min-w-0">
                      <div className="flex items-start gap-3">
                        {invitation.hostAvatarUrl ? (
                          <img
                            alt={'Ảnh đại diện của ' + invitation.hostName}
                            className="h-10 w-10 shrink-0 rounded-xl object-cover"
                            decoding="async"
                            loading="lazy"
                            src={invitation.hostAvatarUrl}
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e2ff57] text-[14px] font-black text-[#102414]">
                            {invitation.hostName.trim().charAt(0).toUpperCase() || 'P'}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <span className="rounded-lg bg-[#e2ff57] px-2 py-1 text-[10px] font-bold text-[#102414]">{invitation.matchType}</span>
                            <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white/78">
                              Level {invitation.minSkillLevel}-{invitation.maxSkillLevel}
                            </span>
                          </div>
                          <h3 className="mt-2 line-clamp-1 text-[15px] font-bold group-hover:text-[#e2ff57]">{invitation.title}</h3>
                          <p className="mt-1 text-[11px] font-semibold text-white/56">Chủ phòng: {invitation.isHost ? 'Bạn' : invitation.hostName}</p>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-2 text-[11px] font-semibold text-white/68 sm:grid-cols-3">
                        <span className="truncate"><MapPin aria-hidden="true" className="mr-1 inline h-3.5 w-3.5 text-[#e2ff57]" />{invitation.ward}, {invitation.province}</span>
                        <span><Calendar aria-hidden="true" className="mr-1 inline h-3.5 w-3.5 text-[#e2ff57]" />{invitationDateLabel(invitation.availableDateFrom)}</span>
                        <span><Clock aria-hidden="true" className="mr-1 inline h-3.5 w-3.5 text-[#e2ff57]" />{invitation.preferredTimeStart.slice(0, 5)} - {invitation.preferredTimeEnd.slice(0, 5)}</span>
                      </div>
                    </div>
                    <div className="border-t border-white/10 pt-3 text-right sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                      <p className="font-mono text-[20px] font-bold text-[#e2ff57]">{invitation.availableSlotCount}</p>
                      <p className="text-[10px] font-semibold text-white/56">chỗ còn lại</p>
                    </div>
                  </Link>
                </motion.article>
              ))
            )}
          </div>
        </div>
      </section>
      <section className="px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <div className="mx-auto max-w-[1180px]">
          <SectionHeader
            action={(
              <Link
                className={'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[14px] font-bold text-primary hover:bg-primary/5 ' + interactiveLinkClass}
                to="/clubs"
              >
                Xem tất cả
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            )}
            label="Câu lạc bộ"
            title={selectedAreaLabel ? 'Cộng đồng tại ' + selectedAreaLabel : 'Tìm hội chơi đúng nhịp của bạn'}
          />

          {isLoadingClubs ? (
            <div aria-label="Đang tải câu lạc bộ" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status">
              {[0, 1, 2].map((item) => (
                <article className="overflow-hidden rounded-2xl border border-outline-variant bg-white" key={item}>
                  <div className="h-40 animate-pulse bg-[#dce8d7] motion-reduce:animate-none" />
                  <div className="grid gap-3 p-5">
                    <div className="h-5 w-2/3 animate-pulse rounded bg-[#dce8d7] motion-reduce:animate-none" />
                    <div className="h-4 animate-pulse rounded bg-[#edf5e9] motion-reduce:animate-none" />
                  </div>
                </article>
              ))}
            </div>
          ) : clubError ? (
            <div className="rounded-2xl border border-[#e7c8c4] bg-white p-6" role="alert">
              <AlertTriangle aria-hidden="true" className="h-7 w-7 text-[#ba1a1a]" />
              <h3 className="mt-4 text-[19px] font-bold">Không thể tải câu lạc bộ</h3>
              <p className="mt-2 max-w-xl text-[14px] leading-6 text-on-surface-variant">{clubError}</p>
              <button
                className={'mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-[#0b2228] px-4 py-2.5 text-[14px] font-bold text-white ' + interactiveLinkClass}
                onClick={() => setReloadKey((value) => value + 1)}
                type="button"
              >
                <RefreshCw aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
                Thử tải lại
              </button>
            </div>
          ) : clubs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-outline-variant bg-white p-8 text-center">
              <Users aria-hidden="true" className="mx-auto h-9 w-9 text-primary" />
              <h3 className="mt-4 text-[19px] font-bold">Chưa có câu lạc bộ phù hợp</h3>
              <p className="mx-auto mt-2 max-w-xl text-[14px] leading-6 text-on-surface-variant">
                {selectedArea ? 'Hãy chọn khu vực khác hoặc xem toàn bộ câu lạc bộ.' : 'Bạn có thể bắt đầu cộng đồng đầu tiên.'}
              </p>
              <Link className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-[#e2ff57] px-4 text-[14px] font-bold text-[#102414]" to="/clubs/create">
                Tạo câu lạc bộ
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.15fr_0.925fr_0.925fr]">
              {clubs.map((club, index) => (
                <motion.article
                  className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_14px_34px_rgba(18,45,34,0.06)] ring-1 ring-outline-variant/80"
                  initial={revealInitial}
                  key={club.groupId}
                  transition={{ ...sectionRevealTransition, delay: shouldReduceMotion ? 0 : index * 0.05 }}
                  viewport={{ amount: 0.15, once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className="h-40 overflow-hidden bg-[#276b3f]">
                    {club.coverImageUrl ? (
                      <img
                        alt={club.groupName}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04] motion-reduce:transform-none"
                        decoding="async"
                        loading="lazy"
                        src={club.coverImageUrl}
                      />
                    ) : (
                      <div className="grid h-full place-items-center bg-[#143f34]">
                        <Users aria-hidden="true" className="h-11 w-11 text-[#e2ff57]" />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap gap-3 text-[12px] font-bold text-primary">
                      <span>{club.memberCount.toLocaleString('vi-VN')} thành viên</span>
                      {club.activeLocation && <span className="line-clamp-1">{club.activeLocation}</span>}
                    </div>
                    <h3 className="mt-3 text-[19px] font-bold leading-7">{club.groupName}</h3>
                    <p className="mt-2 line-clamp-3 text-[14px] leading-6 text-on-surface-variant">
                      {club.description || 'Câu lạc bộ chưa có mô tả.'}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-3 pt-6">
                      <span className="text-[12px] font-semibold text-on-surface-variant">
                        {club.groupType === 'Private' ? 'Riêng tư' : 'Công khai'}
                      </span>
                      <Link
                        className={'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[14px] font-bold hover:bg-primary/5 hover:text-primary ' + interactiveLinkClass}
                        to={'/clubs/' + club.groupId}
                      >
                        Xem câu lạc bộ
                        <ArrowRight aria-hidden="true" className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="px-4 pb-16 pt-8 sm:px-6 md:pb-20 lg:px-8">
        <div className="mx-auto max-w-[1180px] overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[0_16px_42px_rgba(18,45,34,0.07)]">
          <div className="grid divide-y divide-outline-variant md:grid-cols-4 md:divide-x md:divide-y-0">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  className="flex min-w-0 items-center gap-4 p-5 md:flex-col md:items-start md:p-6"
                  initial={revealInitial}
                  key={benefit.label}
                  transition={{ ...sectionRevealTransition, delay: shouldReduceMotion ? 0 : index * 0.04 }}
                  viewport={{ amount: 0.2, once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e2ff57] text-[#102414]">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </div>
                  <h3 className="text-[15px] font-bold leading-6">{benefit.label}</h3>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};