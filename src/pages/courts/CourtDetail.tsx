import { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  Clock,
  Headset,
  MapPin,
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
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.28, ease: [0.2, 0.8, 0.2, 1] as const },
      };

  return (
    <div className="min-h-dvh overflow-x-hidden bg-[#f8fbf4] text-[#0b2228]">
      <main className="mx-auto flex min-h-dvh w-full max-w-[1440px] flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
        <motion.section
          {...motionProps}
          className="rounded-2xl border border-[#dbe8d3] bg-white p-3 shadow-[0_14px_34px_rgba(18,45,34,0.07)]"
          data-motion-managed
        >
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <div className="min-w-0">
              <Link
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-[#dbe8d3] bg-white px-3 text-[13px] font-bold text-primary transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#eef8e6] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px"
                to="/book-court"
              >
                <ArrowLeft className="h-4 w-4" />
                Tìm sân khác
              </Link>
              <h1 className="mt-3 max-w-3xl text-[clamp(1.55rem,2.7vw,2.3rem)] font-extrabold leading-tight tracking-[-0.035em]">
                Chọn lịch sân rõ ràng, thanh toán gọn gàng.
              </h1>
              <p className="mt-1 flex max-w-2xl items-start gap-2 text-[13px] font-semibold leading-5 text-[#66766d]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                Picklink Cầu Giấy. Thông tin sân mẫu được giữ nguyên cho màn hiện tại.
              </p>
            </div>

            <div className="rounded-2xl bg-[#0b2228] p-4 text-white">
              <p className="text-[12px] font-bold text-[#e2ff57]">Đang chọn</p>
              <div className="mt-2 space-y-1 text-[13px] font-bold">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-[#e2ff57]" />
                  {selectedDate ? `${selectedDate.day}, ${selectedDate.date}/08` : 'Chưa chọn ngày'}
                </p>
                <p className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#e2ff57]" />
                  {activeTime}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="grid min-h-0 gap-3 xl:grid-rows-[auto_1fr_auto]">
            <motion.section
              {...motionProps}
              className="rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)]"
              data-motion-managed
            >
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                <h2 className="text-[18px] font-extrabold tracking-[-0.02em]">Chọn ngày</h2>
              </div>
              <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
                {dates.map((item) => {
                  const selected = activeDate === item.date;
                  return (
                    <button
                      className={`flex h-20 w-20 shrink-0 snap-start flex-col items-center justify-center rounded-xl border p-2 text-center transition-[background-color,border-color,color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px ${
                        selected
                          ? 'border-[#0b2228] bg-[#0b2228] text-white shadow-[0_10px_20px_rgba(8,29,36,0.16)]'
                          : 'border-[#dbe8d3] bg-[#f8fbf4] text-[#53645a] hover:bg-[#eef8e6]'
                      }`}
                      key={item.date}
                      onClick={() => setActiveDate(item.date)}
                      type="button"
                    >
                      <span className="text-[10px] font-black">{item.day}</span>
                      <span className="mt-1 text-[24px] font-black leading-none">{item.date}</span>
                      <span className="mt-1 text-[11px] font-bold">{item.month}</span>
                    </button>
                  );
                })}
              </div>
            </motion.section>

            <motion.section
              {...motionProps}
              className="min-h-[360px] overflow-hidden rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)]"
              data-motion-managed
            >
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                <h2 className="text-[18px] font-extrabold tracking-[-0.02em]">Chọn khung giờ</h2>
              </div>
              <div className="mt-3 grid max-h-[calc(100dvh-410px)] min-h-[240px] grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
                {times.map((item) => {
                  const selected = activeTime === item.time;
                  const booked = item.status === 'booked';
                  return (
                    <button
                      className={`min-w-0 rounded-xl border px-2.5 py-2.5 text-center text-[12px] font-black transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45 ${
                        booked
                          ? 'border-[#dbe8d3] bg-white text-[#9aa39d]'
                          : selected
                            ? 'border-[#0b2228] bg-[#0b2228] text-white shadow-[0_10px_20px_rgba(8,29,36,0.16)]'
                            : 'border-[#b9dca8] bg-[#eef8e6] text-primary hover:bg-[#e2ff57] hover:text-[#102414]'
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
              className="rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.07)]"
              data-motion-managed
            >
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h2 className="text-[18px] font-extrabold tracking-[-0.02em]">Thông tin người đặt</h2>
              </div>
              <form className="mt-3 grid gap-3 md:grid-cols-3" onSubmit={(event) => event.preventDefault()}>
                <label className="space-y-1.5">
                  <span className="text-[12px] font-black text-[#66766d]">Họ và tên</span>
                  <Input className="h-10 rounded-xl border-[#dbe8d3] bg-white text-[13px]" placeholder="Nhập họ và tên" type="text" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[12px] font-black text-[#66766d]">Số điện thoại</span>
                  <Input className="h-10 rounded-xl border-[#dbe8d3] bg-white text-[13px]" placeholder="Nhập số điện thoại" type="tel" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[12px] font-black text-[#66766d]">Nhóm người chơi</span>
                  <select className="h-10 w-full rounded-xl border border-[#dbe8d3] bg-white px-3 text-[13px] font-semibold text-[#0b2228] transition hover:border-outline focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container/30">
                    <option>Mới chơi (3.0 - 3.5)</option>
                    <option>Trung bình (3.5 - 4.5)</option>
                    <option>Nâng cao (4.5+)</option>
                    <option>Nhóm bạn bè / Gia đình</option>
                  </select>
                </label>
              </form>
            </motion.section>
          </div>

          <motion.aside
            {...motionProps}
            className="h-fit min-w-0 space-y-3 lg:sticky lg:top-4"
          >
            <div className="overflow-hidden rounded-2xl border border-[#dbe8d3] bg-white shadow-[0_14px_34px_rgba(18,45,34,0.07)]">
              <div className="bg-[#0b2228] p-4 text-white">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[12px] font-black text-[#e2ff57]">Xác nhận</p>
                    <h3 className="mt-1 text-[26px] font-black leading-tight tracking-[-0.04em]">Đặt sân</h3>
                  </div>
                  <BadgeCheck className="h-8 w-8 text-[#e2ff57]" />
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="rounded-2xl bg-[#f8fbf4] p-4">
                  <span className="text-[12px] font-black text-primary">Hệ thống sân</span>
                  <p className="mt-1 text-[19px] font-black tracking-[-0.02em]">Picklink Cầu Giấy</p>
                  <p className="mt-2 flex items-start gap-2 text-[12px] font-semibold leading-5 text-[#66766d]">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    Thông tin sân được giữ nguyên theo màn hiện tại.
                  </p>
                </div>

                <ul className="space-y-3 text-[14px]">
                  <li className="flex items-center justify-between gap-4">
                    <span className="font-bold text-[#66766d]">Ngày chơi</span>
                    <span className="text-right font-black">
                      {selectedDate ? `${selectedDate.date}/08/2024` : '12/08/2024'}
                    </span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span className="font-bold text-[#66766d]">Thời gian</span>
                    <span className="text-right font-black">{activeTime}</span>
                  </li>
                  <li className="flex items-center justify-between gap-4">
                    <span className="font-bold text-[#66766d]">Số giờ</span>
                    <span className="text-right font-black">1.0 giờ</span>
                  </li>
                </ul>

                <div className="rounded-2xl bg-[#0b2228] p-4 text-white">
                  <span className="text-[12px] font-bold text-white/70">Tổng cộng</span>
                  <span className="mt-1 block text-[32px] font-black leading-none tracking-[-0.05em] text-[#e2ff57]">
                    200.000 VNĐ
                  </span>
                </div>

                <p className="rounded-2xl border border-[#dbe8d3] bg-[#eef8e6] p-3 text-[12px] font-semibold leading-5 text-[#53645a]">
                  Bằng việc đặt sân, bạn đồng ý với chính sách hủy và thay đổi thời gian của Picklink.
                </p>

                <Button
                  className="h-11 w-full rounded-xl bg-[#e2ff57] text-[14px] font-black text-[#102414] shadow-[0_12px_24px_rgba(152,217,81,0.2)] hover:bg-[#d6f64d]"
                  onClick={() => navigate('/checkout')}
                  type="button"
                >
                  <ArrowRight className="h-5 w-5" />
                  Tiếp tục thanh toán
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_14px_34px_rgba(18,45,34,0.06)]">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#eef8e6] text-primary">
                <Headset className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[14px] font-black">Cần hỗ trợ?</p>
                <p className="mt-0.5 text-[12px] font-semibold text-[#66766d]">Hotline: 1900 6789</p>
              </div>
              <ChevronRight className="ml-auto h-5 w-5 shrink-0 text-primary" />
            </div>
          </motion.aside>
        </div>
      </main>
    </div>
  );
};
