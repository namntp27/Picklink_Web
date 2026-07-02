import { motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  Clock,
  Compass,
  Flame,
  MapPin,
  Network,
  Radio,
  Search,
  Shield,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getOpenMatches, type MatchSummary } from '../../api/matches';
import { useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useMatchRealtime } from '../../hooks/useMatchRealtime';

const courts = [
  {
    name: 'Sân Pickleball Cầu Giấy',
    distance: '2 km',
    price: '150.000đ/h',
    badge: 'Phổ biến',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB0Qdw2Wmc_-W51c5ZoezQXI8dFBTxZg5wTzPgKauVrDI9FNgRvtd04Pgr-Q_Uom1Eqlz8mjN4fzoxj2VM9DWnQRjRF82hs4uQpBlWtKNhsZWlmXSZz1sobyvCLuz1PwuTKP9wLYkPdfn6zUG5ZXHXclJfxArhp5k3KUp0pZvcOzsL2qefgGju6XRJDOYYfSl3yZyJaaBL0z7OBxte0cyN0nQOqAH_Tmy6ZX1gZoHh-MRxhdFR6w3zl77fEcxuJlez1-ixxK8zTvBk-',
  },
  {
    name: 'Pickleball Center Quận 1',
    distance: '5.4 km',
    price: '200.000đ/h',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMENrky29olry-WOw1suBc_m2BMckEAfiOk6u-pHO-DC1znwLqcbZyY7T6l2tE2D6E0CP3iurktwUDtIagWzKvCdzFyXKXLC5LNRjLKvv9LftTSv20zf-MBnjaffJKDmCbhSVIZVwJl8CIsLTU0fZFidDW0e5uuf3oomlC7M6YWmakT0IdFi8iS8smBS6Rh7xDTyfwkIFaMz-WH4jVaMfGxF16iGlxUM9V7_lGIvNIMmvh50a9EODXtgUmOtwkm9gTkxKFARvHiDG5',
  },
  {
    name: 'Sân Westlake Club',
    distance: '1.2 km',
    price: '180.000đ/h',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ__wr2AqzwI-e_CvZ1r-pZ7sC7ap_deQqmkqnaLvO-PugpHFI8TSyBnUVgF2hFYuEAUbpHYMw2HWDI-es2yjQUxUg7awHiLfZVjwiJk24Ppr0IFMVom-De5B6Qzs6M33NyARSiyAgI4HZjWMmklKmB-RdI1g-IGeUtKn9C2y6s5KQjOkNtHLXoZohYdUREt07P-alDBQP4strFeSFmXFdGe9nVZgmouxdocYskOOFoIBk--ueSvWixaIFBLa7E4B9qP1QclxWctFx',
  },
  {
    name: 'Sân Thể Thao Mỹ Đình',
    distance: '3.5 km',
    price: '120.000đ/h',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAhNBoyqg4ux058JbthhhCf5oWz4Iz_fuEFvBV6R1tmJLVyEi7pQPdcfdAvB4m82pwbSxyVwQpOSEHpKxexl71bfc5Zx-Oq7KCjyUM1J6GDTCuckE2Gk4cCFIUyC_-02FL8wbz0Qr0nkKKhi1-LRZTkGrwd29KmfycgN72bn_qRgX-biTgOWW-0mYF8KCE9AtIXSQ48sxGwt6lCmFHTZvNPVn27FdFUi_puh3gp6PYeUFqlrILDzDYSCvKwnSlGpJUD_xBY7wnSeY9a',
  },
];

const clubs = [
  {
    name: 'CLB Pickleball Hà Nội',
    description:
      'Cộng đồng hơn 500 thành viên, sinh hoạt hàng tuần quanh Cầu Giấy, Tây Hồ và Mỹ Đình.',
    members: '524 thành viên',
    icon: Users,
  },
  {
    name: 'CLB Sài Gòn Smash',
    description:
      'Nhóm chơi năng động tại TP. Hồ Chí Minh với lịch giao lưu đều và nhiều trận phân hạng.',
    members: '312 thành viên',
    icon: Activity,
  },
  {
    name: 'Pickleball Miền Tây',
    description:
      'Câu lạc bộ mới nổi dành cho người chơi thích không khí thân thiện và lịch chơi linh hoạt.',
    members: '185 thành viên',
    icon: Flame,
  },
];

const benefits = [
  { label: 'Đặt sân nhanh', icon: Zap },
  { label: 'Tìm hội cùng trình', icon: Network },
  { label: 'Quản lý CLB', icon: Shield },
  { label: 'Vào giải đấu', icon: Trophy },
];

const heroStats = [
  { value: '48', label: 'sân đang mở' },
  { value: '1.2k', label: 'người chơi hoạt động' },
  { value: '27', label: 'giải trong tháng' },
];

const quickMoves = [
  { label: 'Tìm sân gần bạn', to: '/book-court', icon: Compass },
  { label: 'Ghép trận hôm nay', to: '/opponents', icon: Radio },
  { label: 'Xem lịch giải', to: '/tournaments', icon: Calendar },
];

const interactiveLinkClass =
  'transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/72 active:translate-y-px active:scale-[0.99]';

const sectionRevealTransition = {
  duration: 0.32,
  ease: [0.2, 0.8, 0.2, 1],
} as const;

const invitationDateLabel = (value: string) => new Intl.DateTimeFormat('vi-VN', {
  day: '2-digit',
  month: '2-digit',
}).format(new Date(`${value}T00:00:00`));

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
      <h2 className="mt-2 max-w-[13ch] text-[clamp(1.65rem,3vw,2.35rem)] font-bold leading-[1.08] tracking-[-0.025em] text-on-background">
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
  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 18 };

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

  return (
    <div className="min-w-0 flex-1 overflow-x-clip bg-[#f8fbf4] text-on-background">
      <section className="relative overflow-hidden bg-[#081d24] px-4 pb-10 pt-24 text-white sm:px-6 md:pb-14 md:pt-28 lg:px-8">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(152,217,81,0.22),transparent_32%),radial-gradient(circle_at_88%_12%,rgba(225,255,87,0.16),transparent_28%),linear-gradient(135deg,#081d24_0%,#0f2e32_50%,#143f34_100%)]" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-[linear-gradient(to_top,rgba(248,251,244,1),rgba(248,251,244,0))]" />
          <div className="absolute left-[7%] top-[118px] h-px w-[86%] bg-white/10" />
          <div className="absolute bottom-16 left-[8%] h-px w-[84%] bg-white/10" />
        </div>

        <div className="relative mx-auto grid w-full max-w-[1180px] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(340px,440px)] lg:items-center">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="min-w-0"
            initial={revealInitial}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <p className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/14 bg-white/8 px-3 py-2 text-[13px] font-semibold text-white/88 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur">
              <Zap aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
              Cộng đồng pickleball cho người chơi thật
            </p>
            <h1 className="mt-5 max-w-[12ch] text-[clamp(2.35rem,6vw,4.9rem)] font-bold leading-[0.98] tracking-[-0.04em] text-balance">
              Chơi đều hơn. Kết nối nhanh hơn.
            </h1>
            <p className="mt-5 max-w-[58ch] text-[15px] leading-7 text-white/76 md:text-[17px] md:leading-8">
              Picklink giúp bạn tìm sân, ghép hội, tham gia câu lạc bộ và đăng ký giải đấu trong một nền tảng gọn gàng.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-[#e2ff57] px-5 py-3 text-[15px] font-bold text-[#102414] shadow-[0_14px_30px_rgba(152,217,81,0.24)] hover:bg-[#d6f64d] ${interactiveLinkClass}`}
                to="/book-court"
              >
                Tìm sân ngay
                <Compass aria-hidden="true" className="h-5 w-5" />
              </Link>
              <Link
                className={`inline-flex min-h-12 items-center justify-center rounded-lg border border-white/28 bg-white/6 px-5 py-3 text-[15px] font-bold text-white hover:border-white/48 hover:bg-white/12 ${interactiveLinkClass}`}
                to="/tournaments"
              >
                Xem giải đấu
              </Link>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/12 bg-white/12">
              {heroStats.map((item) => (
                <div className="bg-[#0d2a2f]/88 p-4" key={item.label}>
                  <p className="font-mono text-[22px] font-bold leading-none text-[#e2ff57]">{item.value}</p>
                  <p className="mt-1 text-[12px] font-medium leading-5 text-white/62">{item.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="relative"
            initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
            transition={{ delay: shouldReduceMotion ? 0 : 0.08, duration: shouldReduceMotion ? 0.01 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="overflow-hidden rounded-2xl border border-white/14 bg-white text-on-surface shadow-[0_24px_80px_rgba(0,0,0,0.24)]">
              <div className="relative overflow-hidden bg-[#276b3f] p-4 text-white">
                <div aria-hidden="true" className="relative h-44 rounded-xl border-2 border-white/70 bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:30px_30px] sm:h-52">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-white/55" />
                  <div className="absolute inset-x-[9%] top-1/2 h-px bg-white/55" />
                  <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/55" />
                  <div className="absolute left-[14%] top-[20%] h-5 w-5 rounded-full bg-[#e2ff57] shadow-[0_0_20px_rgba(226,255,87,0.55)]" />
                  <div className="absolute bottom-[16%] right-[14%] h-5 w-5 rounded-full border-4 border-white/85" />
                </div>
                <div className="absolute right-5 top-5 rounded-lg bg-[#e2ff57] px-3 py-2 text-[12px] font-bold text-[#102414]">
                  Live courts
                </div>
              </div>

              <div className="grid min-w-0 gap-4 p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-[1fr_0.85fr]">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="flex items-center gap-2 text-[13px] font-semibold text-on-surface-variant" htmlFor="home-area">
                      <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
                      Khu vực
                    </label>
                    <select
                      className="h-11 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container px-3 text-[14px] text-on-surface transition-[border-color,box-shadow] duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/30"
                      id="home-area"
                    >
                      <option>Hà Nội</option>
                      <option>TP. Hồ Chí Minh</option>
                      <option>Đà Nẵng</option>
                    </select>
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="flex items-center gap-2 text-[13px] font-semibold text-on-surface-variant" htmlFor="home-time">
                      <Clock aria-hidden="true" className="h-4 w-4 text-primary" />
                      Khung giờ
                    </label>
                    <select
                      className="h-11 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container px-3 text-[14px] text-on-surface transition-[border-color,box-shadow] duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/30"
                      id="home-time"
                    >
                      <option>Sáng 06:00 - 12:00</option>
                      <option>Chiều 12:00 - 18:00</option>
                      <option>Tối 18:00 - 22:00</option>
                    </select>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col gap-2">
                  <label className="flex items-center gap-2 text-[13px] font-semibold text-on-surface-variant" htmlFor="home-date">
                    <Calendar aria-hidden="true" className="h-4 w-4 text-primary" />
                    Ngày chơi
                  </label>
                  <Input className="h-11" id="home-date" type="date" />
                </div>
                <Button className="h-12 w-full justify-center bg-[#e2ff57] text-[#102414] hover:bg-[#d6f64d]" onClick={() => navigate('/book-court')} type="button">
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
                className={`group flex min-h-16 items-center justify-between gap-4 rounded-xl px-4 py-3 text-on-surface hover:bg-[#f0f8e8] ${interactiveLinkClass}`}
                key={item.label}
                to={item.to}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e8f8cf] text-primary">
                    <Icon aria-hidden="true" className="h-5 w-5" />
                  </span>
                  <span className="truncate text-[14px] font-bold">{item.label}</span>
                </span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-on-surface-variant transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary" />
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
                className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[14px] font-bold text-primary hover:bg-primary/5 ${interactiveLinkClass}`}
                to="/book-court"
              >
                Xem tất cả
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            )}
            label="Sân tập hàng đầu"
            title="Sân đẹp, giờ chơi rõ ràng"
          />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-[1.1fr_0.95fr_0.95fr]">
            {courts.map((court, index) => (
              <motion.article
                className={`group min-w-0 overflow-hidden rounded-2xl bg-white shadow-[0_14px_34px_rgba(18,45,34,0.07)] ring-1 ring-outline-variant/80 transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(18,45,34,0.11)] ${index === 0 ? 'md:col-span-2 xl:col-span-1 xl:row-span-2' : ''} ${index === 3 ? 'xl:col-span-2' : ''}`}
                initial={revealInitial}
                key={court.name}
                transition={{ ...sectionRevealTransition, delay: shouldReduceMotion ? 0 : index * 0.04, duration: shouldReduceMotion ? 0.01 : 0.3 }}
                viewport={{ amount: 0.15, once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className={`relative overflow-hidden ${index === 0 ? 'h-60 xl:h-[360px]' : 'h-48'} ${index === 3 ? 'xl:h-52' : ''}`}>
                  <img
                    alt={court.name}
                    className="h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04] motion-reduce:transform-none"
                    loading="lazy"
                    src={court.image}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,29,36,0.52),rgba(8,29,36,0.02)_62%)]" />
                  {court.badge && (
                    <span className="absolute left-3 top-3 rounded-lg bg-[#e2ff57] px-3 py-1.5 text-[12px] font-bold text-[#102414] shadow-[0_8px_20px_rgba(0,0,0,0.14)]">
                      {court.badge}
                    </span>
                  )}
                </div>
                <div className="grid min-w-0 gap-4 p-4 sm:p-5">
                  <div className="flex min-w-0 items-start justify-between gap-4">
                    <h3 className="min-w-0 text-[17px] font-bold leading-6 tracking-[-0.015em]">{court.name}</h3>
                    <span className="shrink-0 rounded-lg bg-[#f0f8e8] px-2.5 py-1 text-[13px] font-bold text-primary">{court.price}</span>
                  </div>
                  <div className="flex min-w-0 items-center justify-between gap-3 text-[13px] font-semibold text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
                      {court.distance}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock aria-hidden="true" className="h-4 w-4 text-primary" />
                      còn giờ đẹp
                    </span>
                  </div>
                  <Button className="w-full" onClick={() => navigate('/book-court')} type="button" variant="outline">
                    Đặt sân
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 md:py-12 lg:px-8">
        <div className="mx-auto grid max-w-[1180px] gap-5 rounded-2xl bg-[#0b2228] p-4 text-white shadow-[0_20px_60px_rgba(8,29,36,0.14)] md:p-6 lg:grid-cols-[0.68fr_1.32fr] lg:p-8">
          <div className="flex min-w-0 flex-col justify-between gap-6 rounded-xl border border-white/12 bg-white/7 p-5">
            <div>
              <p className="text-[13px] font-bold text-[#e2ff57]">Lời mời đang mở</p>
              <h2 className="mt-2 max-w-[11ch] text-[clamp(1.7rem,3vw,2.45rem)] font-bold leading-[1.06] tracking-[-0.025em]">
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
                className={`inline-flex min-h-11 w-fit items-center gap-2 rounded-lg bg-[#e2ff57] px-4 py-2.5 text-[14px] font-bold text-[#102414] hover:bg-[#d6f64d] ${interactiveLinkClass}`}
                to="/opponents"
              >
                Xem tất cả lời mời
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="grid min-w-0 gap-3">
            {isLoadingInvitations ? (
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  aria-hidden="true"
                  className="min-h-[136px] animate-pulse rounded-xl border border-white/10 bg-white/7 motion-reduce:animate-none"
                  key={index}
                />
              ))
            ) : invitationError ? (
              <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-red-200/20 bg-red-950/20 p-6 text-center">
                <div>
                  <AlertTriangle aria-hidden="true" className="mx-auto h-6 w-6 text-[#e2ff57]" />
                  <p className="mt-3 text-[14px] font-bold">Chưa thể tải lời mời</p>
                  <p className="mt-1 text-[12px] text-white/62">Mở trang ghép trận để thử lại.</p>
                </div>
              </div>
            ) : openInvitations.length === 0 ? (
              <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-dashed border-white/18 bg-white/5 p-6 text-center">
                <div>
                  <Users aria-hidden="true" className="mx-auto h-7 w-7 text-[#e2ff57]" />
                  <p className="mt-3 text-[14px] font-bold">Chưa có lời mời đang mở</p>
                  <p className="mt-1 text-[12px] text-white/62">Bạn có thể tạo phòng mới trên trang tìm đối thủ.</p>
                </div>
              </div>
            ) : (
              openInvitations.map((invitation, index) => (
                <motion.article
                  className="group min-w-0 rounded-xl border border-white/12 bg-white/7 transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px hover:border-white/24 hover:bg-white/10"
                  initial={revealInitial}
                  key={invitation.matchId}
                  transition={{ ...sectionRevealTransition, delay: shouldReduceMotion ? 0 : index * 0.05, duration: shouldReduceMotion ? 0.01 : 0.28 }}
                  viewport={{ amount: 0.15, once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <Link
                    className="grid min-w-0 gap-4 p-4 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e2ff57]/75 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                    to={`/matches/${invitation.matchId}`}
                  >
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-start gap-3">
                        {invitation.hostAvatarUrl ? (
                          <img
                            alt={`Ảnh đại diện của ${invitation.hostName}`}
                            className="h-10 w-10 shrink-0 rounded-xl object-cover ring-1 ring-white/18"
                            src={invitation.hostAvatarUrl}
                          />
                        ) : (
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e2ff57] text-[14px] font-black text-[#102414]">
                            {invitation.hostName.trim().charAt(0).toUpperCase() || 'P'}
                          </span>
                        )}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-lg bg-[#e2ff57] px-2 py-1 text-[10px] font-bold text-[#102414]">
                              {invitation.matchType}
                            </span>
                            <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-white/78">
                              Level {invitation.minSkillLevel}-{invitation.maxSkillLevel}
                            </span>
                            {invitation.isHost && (
                              <span className="rounded-lg bg-white/10 px-2 py-1 text-[10px] font-bold text-[#e2ff57]">
                                Của bạn
                              </span>
                            )}
                          </div>
                          <h3 className="mt-2 line-clamp-1 text-[15px] font-bold tracking-[-0.015em] text-white group-hover:text-[#e2ff57]">
                            {invitation.title}
                          </h3>
                          <p className="mt-1 text-[11px] font-semibold text-white/56">
                            Chủ phòng: {invitation.isHost ? 'Bạn' : invitation.hostName}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 grid gap-2 text-[11px] font-semibold text-white/68 min-[520px]:grid-cols-3">
                        <span className="inline-flex min-w-0 items-center gap-1.5">
                          <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#e2ff57]" />
                          <span className="truncate">{invitation.ward}, {invitation.province}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#e2ff57]" />
                          {invitationDateLabel(invitation.availableDateFrom)}
                          {invitation.availableDateFrom !== invitation.availableDateTo
                            ? ` - ${invitationDateLabel(invitation.availableDateTo)}`
                            : ''}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Clock aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#e2ff57]" />
                          {invitation.preferredTimeStart.slice(0, 5)} - {invitation.preferredTimeEnd.slice(0, 5)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-3 sm:block sm:min-w-20 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0 sm:text-right">
                      <div>
                        <p className="font-mono text-[20px] font-bold text-[#e2ff57]">{invitation.availableSlotCount}</p>
                        <p className="text-[10px] font-semibold text-white/56">chỗ còn lại</p>
                      </div>
                      <ArrowRight aria-hidden="true" className="h-4 w-4 text-white/58 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-[#e2ff57] sm:ml-auto sm:mt-3" />
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
          <SectionHeader label="Câu lạc bộ" title="Tìm hội chơi đúng nhịp của bạn" />
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {clubs.map((club, index) => {
              const Icon = club.icon;

              return (
                <motion.article
                  className="group flex min-w-0 flex-col rounded-2xl bg-white p-5 shadow-[0_14px_34px_rgba(18,45,34,0.06)] ring-1 ring-outline-variant/80 transition-[box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-1 hover:shadow-[0_20px_44px_rgba(18,45,34,0.1)] sm:p-6"
                  initial={revealInitial}
                  key={club.name}
                  transition={{ ...sectionRevealTransition, delay: shouldReduceMotion ? 0 : index * 0.05, duration: shouldReduceMotion ? 0.01 : 0.3 }}
                  viewport={{ amount: 0.15, once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e8f8cf] text-primary">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="text-[19px] font-bold leading-7 tracking-[-0.015em]">{club.name}</h3>
                  <p className="mt-3 text-[14px] leading-7 text-on-surface-variant">{club.description}</p>
                  <div className="mt-auto flex flex-col items-start justify-between gap-3 pt-6 sm:flex-row sm:items-center">
                    <span className="rounded-lg bg-[#f0f8e8] px-3 py-1.5 text-[13px] font-bold text-primary">{club.members}</span>
                    <Link
                      className={`inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-[14px] font-bold text-on-surface hover:bg-primary/5 hover:text-primary ${interactiveLinkClass}`}
                      to="/clubs"
                    >
                      Tham gia
                      <ArrowRight aria-hidden="true" className="h-4 w-4" />
                    </Link>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-8 sm:px-6 md:pb-20 lg:px-8">
        <div className="mx-auto max-w-[1180px] overflow-hidden rounded-2xl border border-outline-variant bg-white shadow-[0_16px_42px_rgba(18,45,34,0.07)]">
          <div className="grid grid-cols-1 divide-y divide-outline-variant md:grid-cols-4 md:divide-x md:divide-y-0">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <motion.div
                  className="flex min-w-0 items-center gap-4 p-5 md:flex-col md:items-start md:p-6"
                  initial={revealInitial}
                  key={benefit.label}
                  transition={{ ...sectionRevealTransition, delay: shouldReduceMotion ? 0 : index * 0.04, duration: shouldReduceMotion ? 0.01 : 0.28 }}
                  viewport={{ amount: 0.2, once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e2ff57] text-[#102414] shadow-[0_10px_24px_rgba(152,217,81,0.18)]">
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
