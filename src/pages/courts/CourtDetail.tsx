import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  Headset,
  MapPin,
  ShieldCheck,
  User,
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export const CourtDetail = () => {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const [activeDate, setActiveDate] = useState('12');
  const [activeTime, setActiveTime] = useState('08:00 - 09:00');

  const dates = [
    { day: 'Thứ Hai', date: '12', month: 'Th08' },
    { day: 'Thứ Ba', date: '13', month: 'Th08' },
    { day: 'Thứ Tư', date: '14', month: 'Th08' },
    { day: 'Thứ Năm', date: '15', month: 'Th08' },
    { day: 'Thứ Sáu', date: '16', month: 'Th08' },
    { day: 'Thứ Bảy', date: '17', month: 'Th08' },
    { day: 'Chủ Nhật', date: '18', month: 'Th08' },
  ];

  const times = [
    { time: '06:00 - 07:00', status: 'available' },
    { time: '07:00 - 08:00', status: 'available' },
    { time: '08:00 - 09:00', status: 'available' },
    { time: '09:00 - 10:00', status: 'booked' },
    { time: '10:00 - 11:00', status: 'available' },
    { time: '11:00 - 12:00', status: 'available' },
    { time: '13:00 - 14:00', status: 'booked' },
    { time: '14:00 - 15:00', status: 'available' },
    { time: '15:00 - 16:00', status: 'available' },
    { time: '16:00 - 17:00', status: 'available' },
    { time: '17:00 - 18:00', status: 'available' },
    { time: '18:00 - 19:00', status: 'available' },
  ];

  const selectedDate = dates.find((item) => item.date === activeDate);
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 14 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.38, ease: 'easeOut' as const },
      };

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-surface-container-low text-on-surface">
      <header className="sticky top-0 z-50 border-b border-outline-variant bg-surface-container-lowest/92 shadow-[0_12px_30px_rgba(25,29,20,0.06)] backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between gap-4 px-4 py-3 md:px-10">
          <Link
            className="inline-flex items-center gap-2 text-[24px] font-black tracking-[-0.04em] text-primary transition hover:text-primary-container focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/60"
            to="/"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary-container shadow-[0_8px_18px_rgba(152,217,81,0.18)]">
              <span className="h-3.5 w-3.5 rounded-full bg-on-primary" />
            </span>
            Picklink
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {[
              ['Sân chơi', '/book'],
              ['Cộng đồng', '#'],
              ['Giải đấu', '/tournaments'],
              ['Về chúng tôi', '#'],
            ].map(([label, href]) => (
              <Link
                className="rounded-full px-4 py-2 text-[13px] font-bold text-on-surface-variant transition hover:bg-primary-fixed/25 hover:text-primary focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/60"
                key={label}
                to={href}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button className="hidden lg:inline-flex" size="sm" variant="ghost" onClick={() => navigate('/login')} type="button">
              <User className="h-4 w-4" />
              Đăng nhập
            </Button>
            <Button size="sm" onClick={() => navigate('/register')} type="button">
              <ArrowRight className="h-4 w-4" />
              Đăng ký
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-10 md:py-10">
        <motion.section
          {...motionProps}
          className="relative mb-6 overflow-hidden rounded-[30px] border border-primary-fixed-dim/60 bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_100%)] p-5 text-on-primary shadow-[0_22px_60px_rgba(152,217,81,0.18)] md:p-8"
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-primary-fixed/30 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-1/2 h-48 w-48 rounded-full bg-secondary-container/30 blur-3xl" />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_330px] lg:items-end">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[12px] font-bold uppercase tracking-[0.18em] text-primary-fixed">
                <ShieldCheck className="h-4 w-4" />
                Đặt sân Pickleball
              </p>
              <h1 className="mt-4 max-w-2xl text-[36px] font-black leading-tight tracking-[-0.05em] text-white md:text-[54px]">
                Chọn lịch sân rõ ràng, thanh toán gọn gàng
              </h1>
              <p className="mt-3 max-w-xl text-[15px] font-semibold leading-7 text-white/78">
                Hoàn tất ngày chơi, khung giờ và thông tin người đặt trong một luồng đặt sân nhất quán với hệ màu Picklink.
              </p>
            </div>

            <div className="rounded-2xl border border-white/15 bg-white/12 p-4 backdrop-blur">
              <p className="text-[12px] font-black uppercase tracking-[0.16em] text-primary-fixed">Đang chọn</p>
              <div className="mt-3 space-y-2 text-[14px] font-bold text-white">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary-fixed" />
                  {selectedDate ? `${selectedDate.day}, ${selectedDate.date}/${selectedDate.month.replace('Th', '')}` : 'Chưa chọn ngày'}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary-fixed" />
                  {activeTime}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          <div className="min-w-0 space-y-6 lg:col-span-8">
            <motion.div
              {...motionProps}
              className="grid grid-cols-3 overflow-hidden rounded-[24px] border border-outline-variant bg-surface-container-lowest shadow-[0_14px_34px_rgba(25,29,20,0.05)]"
            >
              {[
                ['1', 'Chọn ngày & giờ'],
                ['2', 'Thông tin'],
                ['3', 'Thanh toán'],
              ].map(([step, label], index) => (
                <div
                  className={`flex min-w-0 flex-col items-center gap-2 border-outline-variant px-3 py-5 text-center ${index > 0 ? 'border-l' : ''}`}
                  key={step}
                >
                  <span
                    className={`grid h-10 w-10 place-items-center rounded-full text-[14px] font-black ${
                      index === 0 ? 'bg-primary-container text-on-primary-container shadow-[0_10px_18px_rgba(152,217,81,0.18)]' : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {step}
                  </span>
                  <span className={`text-[12px] font-black md:text-[14px] ${index === 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </motion.div>

            <motion.section
              {...motionProps}
              className="rounded-[24px] border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_14px_34px_rgba(25,29,20,0.05)] md:p-6"
            >
              <h2 className="flex items-center gap-2 text-[20px] font-black tracking-[-0.02em] text-on-surface">
                <CalendarDays className="h-6 w-6 text-primary" />
                Bước 1: Chọn ngày
              </h2>
              <div className="mt-4 flex snap-x gap-3 overflow-x-auto pb-2">
                {dates.map((item) => {
                  const selected = activeDate === item.date;
                  return (
                    <button
                      className={`flex h-28 w-24 shrink-0 snap-start flex-col items-center justify-center rounded-2xl border p-3 text-center transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:-translate-y-1 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/60 active:translate-y-px ${
                        selected
                          ? 'border-primary-container bg-primary-container text-on-primary-container shadow-[0_12px_22px_rgba(152,217,81,0.18)]'
                          : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary-fixed-dim hover:bg-primary-fixed/20'
                      }`}
                      key={item.date}
                      onClick={() => setActiveDate(item.date)}
                      type="button"
                    >
                      <span className="text-[11px] font-black uppercase tracking-[0.08em] opacity-80">{item.day}</span>
                      <span className="mt-1 text-[28px] font-black leading-none">{item.date}</span>
                      <span className="mt-1 text-[12px] font-bold">{item.month}</span>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            <motion.section
              {...motionProps}
              className="rounded-[24px] border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_14px_34px_rgba(25,29,20,0.05)] md:p-6"
            >
              <h2 className="flex items-center gap-2 text-[20px] font-black tracking-[-0.02em] text-on-surface">
                <Clock className="h-6 w-6 text-primary" />
                Bước 2: Chọn khung giờ
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {times.map((item) => {
                  const selected = activeTime === item.time;
                  const booked = item.status === 'booked';
                  return (
                    <button
                      className={`min-w-0 rounded-xl border px-3 py-3 text-center text-[13px] font-black transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/60 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 ${
                        booked
                          ? 'border-outline-variant bg-surface-container text-outline'
                          : selected
                            ? 'border-primary-container bg-primary-container text-on-primary-container shadow-[0_10px_18px_rgba(152,217,81,0.18)]'
                            : 'border-outline-variant bg-surface-container-low text-on-surface hover:border-primary-fixed-dim hover:bg-primary-fixed/20'
                      }`}
                      disabled={booked}
                      key={item.time}
                      onClick={() => item.status === 'available' && setActiveTime(item.time)}
                      type="button"
                    >
                      <span className="block truncate">{item.time}</span>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            <motion.section
              {...motionProps}
              className="rounded-[24px] border border-outline-variant bg-surface-container-lowest p-5 shadow-[0_14px_34px_rgba(25,29,20,0.05)] md:p-6"
            >
              <h2 className="flex items-center gap-2 text-[20px] font-black tracking-[-0.02em] text-on-surface">
                <User className="h-6 w-6 text-primary" />
                Bước 3: Thông tin người đặt
              </h2>
              <form className="mt-5 space-y-4" onSubmit={(event) => event.preventDefault()}>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="text-[13px] font-black text-on-surface-variant">Họ và tên</span>
                    <Input placeholder="Nhập họ và tên" type="text" />
                  </label>
                  <label className="space-y-1.5">
                    <span className="text-[13px] font-black text-on-surface-variant">Số điện thoại</span>
                    <Input placeholder="Nhập số điện thoại" type="tel" />
                  </label>
                </div>

                <label className="space-y-1.5">
                  <span className="text-[13px] font-black text-on-surface-variant">Nhóm người chơi</span>
                  <select className="h-12 w-full rounded-lg border border-outline-variant bg-surface-container px-3.5 py-2.5 text-[14px] font-semibold text-on-surface transition hover:border-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/30">
                    <option>Mới chơi (3.0 - 3.5)</option>
                    <option>Trung bình (3.5 - 4.5)</option>
                    <option>Nâng cao (4.5+)</option>
                    <option>Nhóm bạn bè / Gia đình</option>
                  </select>
                </label>

                <label className="space-y-1.5">
                  <span className="text-[13px] font-black text-on-surface-variant">Ghi chú</span>
                  <textarea
                    className="min-h-[112px] w-full resize-none rounded-lg border border-outline-variant bg-surface-container px-3.5 py-3 text-[14px] font-semibold text-on-surface transition placeholder:text-outline hover:border-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/30"
                    placeholder="Yêu cầu thêm về dụng cụ hoặc dịch vụ..."
                    rows={3}
                  />
                </label>
              </form>
            </motion.section>
          </div>

          <motion.aside
            {...motionProps}
            className="min-w-0 space-y-4 lg:col-span-4 lg:sticky lg:top-24"
          >
            <div className="overflow-hidden rounded-[24px] border border-outline-variant bg-surface-container-lowest shadow-[0_18px_44px_rgba(25,29,20,0.08)]">
              <div className="relative min-h-[150px] overflow-hidden bg-[linear-gradient(135deg,var(--color-primary)_0%,var(--color-primary-container)_62%,var(--color-secondary)_100%)] p-5 text-white">
                <div className="pointer-events-none absolute -right-10 -top-16 h-36 w-36 rounded-full bg-primary-fixed/40 blur-2xl" />
                <div className="relative z-10 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-black uppercase tracking-[0.16em] text-primary-fixed">Xác nhận</p>
                    <h3 className="mt-2 text-[26px] font-black leading-tight tracking-[-0.04em]">Đặt sân</h3>
                  </div>
                  <BadgeCheck className="h-8 w-8 text-primary-fixed" />
                </div>
                <div className="absolute bottom-4 left-5 right-5 h-14 rounded-full border border-white/10 bg-white/10" />
              </div>

              <div className="space-y-5 p-5">
                <div className="rounded-2xl border border-outline-variant bg-surface-container-low p-4">
                  <span className="text-[12px] font-black uppercase tracking-[0.12em] text-primary">Hệ thống sân</span>
                  <p className="mt-1 text-[20px] font-black tracking-[-0.02em] text-on-surface">Picklink Cầu Giấy</p>
                  <p className="mt-2 flex items-start gap-2 text-[12px] font-semibold leading-5 text-on-surface-variant">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Thông tin sân được giữ nguyên theo màn hiện tại.
                  </p>
                </div>

                <ul className="space-y-3 text-[14px]">
                  <li className="flex items-center justify-between gap-4">
                    <span className="font-bold text-on-surface-variant">Ngày chơi</span>
                    <span className="text-right font-black text-on-surface">
                      {selectedDate ? `${selectedDate.date}/08/2024` : '12/08/2024'}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span className="font-bold text-on-surface-variant">Thời gian</span>
                    <span className="text-right font-black text-on-surface">{activeTime}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span className="font-bold text-on-surface-variant">Số giờ</span>
                    <span className="text-right font-black text-on-surface">1.0 giờ</span>
                  </li>
                </ul>

                <div className="border-t border-outline-variant pt-5">
                  <div className="flex items-end justify-between gap-4">
                    <span className="text-[14px] font-bold text-on-surface-variant">Tổng cộng</span>
                    <span className="text-right text-[34px] font-black leading-none tracking-[-0.05em] text-primary md:text-[40px]">
                      200.000 VNĐ
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary-fixed-dim/60 bg-primary-fixed/20 p-4">
                  <p className="text-[12px] font-semibold leading-5 text-on-surface-variant">
                    Bằng việc đặt sân, bạn đồng ý với chính sách hủy và thay đổi thời gian của Picklink.
                  </p>
                </div>

                <Button
                  className="h-[54px] w-full rounded-2xl text-[15px] shadow-[0_14px_26px_rgba(152,217,81,0.18)]"
                  onClick={() => navigate('/checkout')}
                  type="button"
                >
                  <ArrowRight className="h-5 w-5" />
                  Tiếp tục thanh toán
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 rounded-[22px] border border-primary-fixed-dim/70 bg-primary-fixed/20 p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-fixed/50 text-primary">
                <Headset className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-black text-on-surface">Cần hỗ trợ?</p>
                <p className="mt-0.5 text-[12px] font-semibold text-on-surface-variant">Hotline: 1900 6789</p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-primary" />
            </div>
          </motion.aside>
        </div>
      </main>

      <footer className="mt-auto border-t border-outline-variant bg-surface-container-lowest">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-5 px-4 py-8 md:flex-row md:items-center md:justify-between md:px-10">
          <div className="max-w-md">
            <span className="text-[22px] font-black tracking-[-0.04em] text-primary">Picklink</span>
            <p className="mt-2 text-[13px] font-semibold leading-5 text-on-surface-variant">
              © 2024 Picklink. Nền tảng kết nối Pickleball hàng đầu Việt Nam.
            </p>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-3">
            {['Điều khoản sử dụng', 'Chính sách bảo mật', 'Liên hệ quảng cáo', 'Trung tâm hỗ trợ'].map((label) => (
              <Link
                className="text-[12px] font-black text-on-surface-variant transition hover:text-primary hover:underline focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/60"
                key={label}
                to="#"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
