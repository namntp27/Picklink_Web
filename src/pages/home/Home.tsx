import { motion, useReducedMotion } from 'motion/react';
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  Compass,
  Flame,
  MapPin,
  Network,
  Search,
  Shield,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const courts = [
  {
    name: 'Sân Pickleball Cầu Giấy',
    distance: '2km',
    price: '150.000đ/h',
    badge: 'Phổ biến',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuB0Qdw2Wmc_-W51c5ZoezQXI8dFBTxZg5wTzPgKauVrDI9FNgRvtd04Pgr-Q_Uom1Eqlz8mjN4fzoxj2VM9DWnQRjRF82hs4uQpBlWtKNhsZWlmXSZz1sobyvCLuz1PwuTKP9wLYkPdfn6zUG5ZXHXclJfxArhp5k3KUp0pZvcOzsL2qefgGju6XRJDOYYfSl3yZyJaaBL0z7OBxte0cyN0nQOqAH_Tmy6ZX1gZoHh-MRxhdFR6w3zl77fEcxuJlez1-ixxK8zTvBk-',
  },
  {
    name: 'Pickleball Center Quận 1',
    distance: '5.4km',
    price: '200.000đ/h',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBMENrky29olry-WOw1suBc_m2BMckEAfiOk6u-pHO-DC1znwLqcbZyY7T6l2tE2D6E0CP3iurktwUDtIagWzKvCdzFyXKXLC5LNRjLKvv9LftTSv20zf-MBnjaffJKDmCbhSVIZVwJl8CIsLTU0fZFidDW0e5uuf3oomlC7M6YWmakT0IdFi8iS8smBS6Rh7xDTyfwkIFaMz-WH4jVaMfGxF16iGlxUM9V7_lGIvNIMmvh50a9EODXtgUmOtwkm9gTkxKFARvHiDG5',
  },
  {
    name: 'Sân Westlake Club',
    distance: '1.2km',
    price: '180.000đ/h',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAQ__wr2AqzwI-e_CvZ1r-pZ7sC7ap_deQqmkqnaLvO-PugpHFI8TSyBnUVgF2hFYuEAUbpHYMw2HWDI-es2yjQUxUg7awHiLfZVjwiJk24Ppr0IFMVom-De5B6Qzs6M33NyARSiyAgI4HZjWMmklKmB-RdI1g-IGeUtKn9C2y6s5KQjOkNtHLXoZohYdUREt07P-alDBQP4strFeSFmXFdGe9nVZgmouxdocYskOOFoIBk--ueSvWixaIFBLa7E4B9qP1QclxWctFx',
  },
  {
    name: 'Sân Thể Thao Mỹ Đình',
    distance: '3.5km',
    price: '120.000đ/h',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAhNBoyqg4ux058JbthhhCf5oWz4Iz_fuEFvBV6R1tmJLVyEi7pQPdcfdAvB4m82pwbSxyVwQpOSEHpKxexl71bfc5Zx-Oq7KCjyUM1J6GDTCuckE2Gk4cCFIUyC_-02FL8wbz0Qr0nkKKhi1-LRZTkGrwd29KmfycgN72bn_qRgX-biTgOWW-0mYF8KCE9AtIXSQ48sxGwt6lCmFHTZvNPVn27FdFUi_puh3gp6PYeUFqlrILDzDYSCvKwnSlGpJUD_xBY7wnSeY9a',
  },
];

const tournaments = [
  {
    label: 'Hà Nội Open 2024',
    name: 'Giải Vô Địch Miền Bắc',
    date: '25/12/2024',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuCLdGuS7icP9FL_DoaxyJlD0VrbUbnC5lDSm03ye2Q8Qn3q-r2o9FcYKLuFwO0GuBjTkA07MPkviyig7xNVNq4-Masq7J9nlql2mwcR9_6wQXnf99LZWiD6bqmzAvwY4xHXgNnvyLgnmdZV3jK1UDrx6rUrFRa2--rtsq4H_EKMEyQ4nGbwmP039l56LsRanYlB4jaml8GmFAdsQ2zFaWJ5lSds6CUP9OUMUBWJqM3URfzEUE94BzJ85WDR6_fiRvbs8tr4CQ6TbWV7',
  },
  {
    label: 'Giao hữu',
    name: 'Vietnam Smash 2024',
    date: '05/01/2025',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuDpH19bFFlsN23aNwU7VQmfscEtba7KlewFcdiEo1sz-IMC9WCG7hhJtpGE9_WP2Gg38kxttaJ0dLy6yvgowupG2isVpZIfjTrgmUSKikfV8ya_kO6qlypAat2XpdI4jldLrtVPbOPYNCBekJrkh-ATBwcMn0l2LwXKtenZmqe3HMoJsUK8RwZ1q5NFMNljo2b4CM1hTwuiEOXVQKNaBl3VfVlbfCG5MllyrkDjuWgjLDZZZQYIvmqVWqj6Xo2qJEk8Bc_tLO5JHwzD',
  },
  {
    label: 'Chuyên nghiệp',
    name: 'Saigon Master Cup',
    date: '12/01/2025',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD17f_r92JIFzxFVM4g9F-m7zehFn4jSPVkMLJ3DzoNbZYJrexLp2g7I3E7V_hgXzW20Q-6kBXitdFfDpJotZCMEYkRfP1G5DiSA4Ap_eTr61IGT8RDpMNCgAzHZUryPq0rbrul0HYBqiN8yo4LZVt5I4sWvLFCcz_ruiDmAzhDu4NVwmw_8xtmTfBTLIR-AgbN9KCapSJGDn_mf0lI6MzBHebfJ4vKbsYytRIc81on7EUOejkwGrnjbfGc7MwsaSgXhyRnbsek9pdt',
  },
];

const clubs = [
  {
    name: 'CLB Pickleball Hà Nội',
    description:
      'Cộng đồng hơn 500 thành viên, sinh hoạt định kỳ hàng tuần tại khu vực Cầu Giấy.',
    members: '524 Thành viên',
    icon: Users,
  },
  {
    name: 'CLB Sài Gòn Smash',
    description:
      'Nơi hội tụ những tay vợt đam mê và kỹ thuật cao nhất tại TP. Hồ Chí Minh.',
    members: '312 Thành viên',
    icon: Activity,
  },
  {
    name: 'Pickleball Miền Tây',
    description:
      'Câu lạc bộ mới nổi với nhiều hoạt động giao lưu sôi nổi và thân thiện.',
    members: '185 Thành viên',
    icon: Flame,
  },
];

const benefits = [
  { label: 'Đặt sân nhanh chóng', icon: Zap },
  { label: 'Kết nối người chơi', icon: Network },
  { label: 'Quản lý CLB', icon: Shield },
  { label: 'Tham gia giải đấu', icon: Trophy },
];

const interactiveLinkClass =
  'transition-[color,background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/72 active:translate-y-px active:scale-[0.99]';

export const Home = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 18 };

  return (
    <div className="min-w-0 flex-1 overflow-x-clip bg-background text-on-background">
      <section className="hero-gradient relative overflow-hidden pb-10 pt-[112px] text-on-primary md:pb-14 md:pt-[132px]">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(25,29,20,0.2),rgba(25,29,20,0.68))]" />
          <div className="absolute inset-x-[8%] bottom-0 h-px bg-on-primary/20" />
          <div className="absolute left-[12%] top-24 h-px w-[76%] bg-on-primary/10" />
          <div className="absolute bottom-0 right-[18%] h-40 w-px bg-on-primary/12" />
        </div>

        <div className="relative mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(340px,0.92fr)] lg:gap-10">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="flex min-w-0 flex-col justify-center py-2"
              initial={revealInitial}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <p className="inline-flex w-fit items-center gap-2 rounded-full border border-on-primary/18 bg-on-primary/10 px-4 py-2 text-[13px] font-bold text-on-primary/88">
                <Zap aria-hidden="true" className="h-4 w-4 text-primary-fixed" />
                Đặt sân, tìm hội, vào giải
              </p>
              <h1 className="mt-5 max-w-[17ch] text-[clamp(2rem,5vw,3.65rem)] font-bold leading-[1.06] tracking-[-0.03em]">
                Kết nối{' '}
                <span className="mx-1 inline-flex h-[0.82em] w-[1.42em] translate-y-[0.08em] overflow-hidden rounded-md border border-on-primary/25 align-baseline shadow-[0_8px_20px_rgba(25,29,20,0.22)]">
                  <img alt="" className="h-full w-full object-cover" src={courts[0].image} />
                </span>{' '}
                cộng đồng Pickleball cùng{' '}
                <span className="inline-block text-[1.08em] text-primary-fixed [text-shadow:0_0_8px_rgba(152,217,81,0.5),0_0_18px_rgba(152,217,81,0.24)]">
                  Picklink
                </span>
              </h1>
              <p className="mt-6 max-w-[65ch] text-[16px] leading-7 text-white/78 md:text-[18px] md:leading-8">
                Tìm sân, đặt lịch, tham gia câu lạc bộ, tìm đối thủ và đăng ký giải
                đấu chỉ trong một nền tảng hiện đại và dễ dàng nhất.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary-container px-6 py-3 text-[15px] font-bold text-on-primary-container shadow-[0_8px_22px_rgba(152,217,81,0.22)] hover:bg-primary-fixed-dim ${interactiveLinkClass}`}
                  to="/book-court"
                >
                  Tìm sân ngay
                  <Compass aria-hidden="true" className="h-5 w-5" />
                </Link>
                <Link
                  className={`inline-flex min-h-12 items-center justify-center rounded-lg border border-white/45 px-6 py-3 text-[15px] font-bold text-white hover:border-white/70 hover:bg-white/10 ${interactiveLinkClass}`}
                  to="/tournaments"
                >
                  Khám phá giải đấu
                </Link>
              </div>
            </motion.div>

            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="overflow-hidden rounded-xl border border-on-primary/18 bg-surface-container-lowest text-on-surface shadow-[0_20px_50px_rgba(25,29,20,0.18)]"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
              transition={{ delay: shouldReduceMotion ? 0 : 0.08, duration: shouldReduceMotion ? 0.01 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="relative h-44 overflow-hidden bg-primary p-5 text-on-primary sm:h-52">
                <div aria-hidden="true" className="relative h-full rounded-lg border-2 border-on-primary/60">
                  <div className="absolute inset-y-0 left-1/2 w-px bg-on-primary/45" />
                  <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-on-primary/45" />
                  <div className="absolute inset-x-[10%] top-1/2 h-px bg-on-primary/45" />
                  <div className="absolute left-[12%] top-[18%] h-5 w-5 rounded-full bg-primary-fixed shadow-[0_0_14px_rgba(152,217,81,0.42)]" />
                  <div className="absolute bottom-[16%] right-[14%] h-5 w-5 rounded-full border-4 border-on-primary/80" />
                </div>
              </div>
              <div className="grid min-w-0 gap-4 p-5 sm:p-6">
                <div className="flex min-w-0 flex-col gap-2">
                  <label className="flex items-center gap-2 text-[14px] font-semibold text-on-surface-variant" htmlFor="home-area">
                    <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
                    Chọn khu vực
                  </label>
                  <select
                    className="h-12 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container px-3.5 text-[14px] text-on-surface transition-[border-color,box-shadow] duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/30"
                    id="home-area"
                  >
                    <option>Hà Nội</option>
                    <option>TP. Hồ Chí Minh</option>
                    <option>Đà Nẵng</option>
                  </select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="flex items-center gap-2 text-[14px] font-semibold text-on-surface-variant" htmlFor="home-date">
                      <Calendar aria-hidden="true" className="h-4 w-4 text-primary" />
                      Ngày chơi
                    </label>
                    <Input id="home-date" type="date" />
                  </div>
                  <div className="flex min-w-0 flex-col gap-2">
                    <label className="flex items-center gap-2 text-[14px] font-semibold text-on-surface-variant" htmlFor="home-time">
                      <Clock aria-hidden="true" className="h-4 w-4 text-primary" />
                      Khung giờ
                    </label>
                    <select
                      className="h-12 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container px-3.5 text-[14px] text-on-surface transition-[border-color,box-shadow] duration-200 hover:border-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/30"
                      id="home-time"
                    >
                      <option>Sáng (06:00 - 12:00)</option>
                      <option>Chiều (12:00 - 18:00)</option>
                      <option>Tối (18:00 - 22:00)</option>
                    </select>
                  </div>
                </div>
                <Button className="w-full justify-center" onClick={() => navigate('/book-court')} type="button">
                  Tìm kiếm
                  <Search aria-hidden="true" className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-[14px] font-bold text-primary">Sân tập hàng đầu</p>
              <h2 className="mt-2 text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-tight tracking-[-0.025em]">
                Sân Pickleball nổi bật
              </h2>
            </div>
            <Link
              className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-[14px] font-bold text-primary hover:bg-primary/5 ${interactiveLinkClass}`}
              to="/book-court"
            >
              Xem tất cả
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-[1.12fr_0.94fr_0.94fr]">
            {courts.map((court, index) => (
              <motion.article
                className={`group min-w-0 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-primary-container hover:shadow-[0_12px_28px_rgba(25,29,20,0.08)] ${index === 0 ? 'md:col-span-2 xl:col-span-1 xl:row-span-2' : ''} ${index === 3 ? 'xl:col-span-2' : ''}`}
                initial={revealInitial}
                key={court.name}
                transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, duration: shouldReduceMotion ? 0.01 : 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                viewport={{ amount: 0.15, once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className={`relative overflow-hidden ${index === 0 ? 'h-64 xl:h-80' : 'h-52'} ${index === 3 ? 'xl:h-56' : ''}`}>
                  <img
                    alt={court.name}
                    className="h-full w-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04] motion-reduce:transform-none"
                    loading="lazy"
                    src={court.image}
                  />
                  {court.badge && (
                    <span className="absolute left-3 top-3 rounded-full border border-primary-container/40 bg-surface-container-lowest/92 px-3 py-1.5 text-[12px] font-bold text-primary shadow-sm backdrop-blur-sm">
                      {court.badge}
                    </span>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-4 p-5">
                  <h3 className="text-[18px] font-bold leading-7 tracking-[-0.015em]">{court.name}</h3>
                  <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 text-[14px] font-semibold text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin aria-hidden="true" className="h-4 w-4 text-primary" />
                      {court.distance}
                    </span>
                    <span className="font-bold text-primary">{court.price}</span>
                  </div>
                  <Button className="w-full" type="button" variant="outline">
                    Đặt sân
                  </Button>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-outline-variant bg-surface-container-lowest px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="mb-8 text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-tight tracking-[-0.025em]">
            Lịch giải đấu tiêu biểu
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.2fr_0.8fr] md:grid-rows-2">
            {tournaments.map((tournament, index) => (
              <motion.article
                className={`group relative min-h-[340px] overflow-hidden rounded-xl border border-outline-variant bg-inverse-surface ${index === 0 ? 'md:row-span-2 md:min-h-[560px]' : 'md:min-h-[270px]'}`}
                initial={revealInitial}
                key={tournament.name}
                transition={{ delay: shouldReduceMotion ? 0 : index * 0.05, duration: shouldReduceMotion ? 0.01 : 0.32, ease: [0.2, 0.8, 0.2, 1] }}
                viewport={{ amount: 0.15, once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <img
                  alt={tournament.name}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04] motion-reduce:transform-none"
                  loading="lazy"
                  src={tournament.image}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(25,29,20,0.94),rgba(25,29,20,0.18)_68%,rgba(25,29,20,0.04))]" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6 md:p-7">
                  <span className="inline-flex rounded-full bg-primary-container px-3 py-1.5 text-[12px] font-bold text-on-primary-container">
                    {tournament.label}
                  </span>
                  <h3 className="mt-3 text-[clamp(1.25rem,2.4vw,1.75rem)] font-bold leading-tight tracking-[-0.02em]">{tournament.name}</h3>
                  <p className="mt-2 flex items-center gap-2 text-[14px] font-semibold text-white/75">
                    <Calendar aria-hidden="true" className="h-4 w-4" />
                    {tournament.date}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 md:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-[1280px]">
          <h2 className="mb-8 text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-tight tracking-[-0.025em]">
            Cộng đồng câu lạc bộ
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1.15fr_0.85fr] md:grid-rows-2">
            {clubs.map((club, index) => {
              const Icon = club.icon;

              return (
                <motion.article
                  className={`flex min-w-0 flex-col border border-outline-variant bg-surface-container-lowest p-6 transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-primary-container hover:shadow-[0_12px_28px_rgba(25,29,20,0.07)] sm:p-7 ${index === 0 ? 'rounded-xl md:row-span-2 md:justify-center md:p-10' : 'rounded-lg'}`}
                  initial={revealInitial}
                  key={club.name}
                  transition={{ delay: shouldReduceMotion ? 0 : index * 0.05, duration: shouldReduceMotion ? 0.01 : 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                  viewport={{ amount: 0.15, once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-primary-container/20 text-primary">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="text-[20px] font-bold leading-7 tracking-[-0.015em]">{club.name}</h3>
                  <p className="mt-3 max-w-[65ch] text-[15px] leading-7 text-on-surface-variant">{club.description}</p>
                  <div className="mt-6 flex flex-col items-start justify-between gap-3 border-t border-outline-variant pt-4 sm:flex-row sm:items-center">
                    <span className="text-[14px] font-bold text-primary">{club.members}</span>
                    <Link
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-md px-2 text-[14px] font-bold text-on-surface hover:bg-primary/5 hover:text-primary ${interactiveLinkClass}`}
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

      <section className="border-t border-outline-variant bg-surface-container-lowest px-4 py-14 sm:px-6 md:py-16 lg:px-8">
        <div className="mx-auto max-w-[1280px]">
          <div className="grid grid-cols-1 divide-y divide-outline-variant md:grid-cols-[1.18fr_0.92fr_1.08fr_0.82fr] md:divide-x md:divide-y-0">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <motion.div
                  className="flex min-w-0 items-center gap-4 py-6 md:flex-col md:px-5 md:text-center"
                  initial={revealInitial}
                  key={benefit.label}
                  transition={{ delay: shouldReduceMotion ? 0 : index * 0.04, duration: shouldReduceMotion ? 0.01 : 0.28, ease: [0.2, 0.8, 0.2, 1] }}
                  viewport={{ amount: 0.2, once: true }}
                  whileInView={{ opacity: 1, y: 0 }}
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-container text-on-primary-container shadow-[0_5px_14px_rgba(152,217,81,0.18)]">
                    <Icon aria-hidden="true" className="h-6 w-6" />
                  </div>
                  <h3 className="text-[16px] font-bold leading-6">{benefit.label}</h3>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
