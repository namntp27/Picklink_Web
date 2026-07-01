import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Facebook, Mail, MapPin, Phone } from 'lucide-react';

export const Footer = () => {
  const shouldReduceMotion = useReducedMotion();
  const revealFrom = shouldReduceMotion ? false : { opacity: 0, y: 16 };

  return (
    <footer className="w-full border-t-4 border-primary bg-[#171A16] px-4 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid grid-cols-1 gap-10 py-12 md:grid-cols-12 md:gap-8 lg:py-14">
          <motion.div
            initial={revealFrom}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
            className="min-w-0 md:col-span-5 lg:col-span-6"
          >
            <img alt="Picklink Logo" className="h-10 object-contain brightness-0 invert mb-6" src="data:image/png;base64,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" />
            <p className="mb-6 max-w-[58ch] text-[15px] leading-7 text-white/70">
              Nền tảng số hóa trải nghiệm Pickleball hàng đầu tại Việt Nam, kết nối mọi đam mê trên sân đấu.
            </p>
            <div className="flex flex-wrap gap-3">
              <motion.a
                aria-label="Facebook"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 text-white/80 transition-[color,background-color,border-color] duration-200 hover:border-primary/60 hover:bg-primary/20 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/80"
                href="#"
                whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                whileTap={shouldReduceMotion ? undefined : { y: 1, scale: 0.99 }}
              >
                <Facebook aria-hidden="true" className="h-5 w-5" />
              </motion.a>
              <motion.a
                aria-label="Email"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 text-white/80 transition-[color,background-color,border-color] duration-200 hover:border-primary/60 hover:bg-primary/20 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/80"
                href="#"
                whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                whileTap={shouldReduceMotion ? undefined : { y: 1, scale: 0.99 }}
              >
                <Mail aria-hidden="true" className="h-5 w-5" />
              </motion.a>
            </div>
          </motion.div>

          <motion.div
            className="min-w-0 md:col-span-3"
            initial={revealFrom}
            transition={{ delay: shouldReduceMotion ? 0 : 0.06, duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h3 className="mb-5 text-[18px] font-bold tracking-[-0.01em] text-white">Liên kết nhanh</h3>
            <ul className="flex flex-col text-[14px]">
              <li>
                <Link className="group inline-flex min-h-11 items-center gap-2 rounded-md text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/80" to="/book-court">
                  Tìm sân Pickleball
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-container transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
              <li>
                <Link className="group inline-flex min-h-11 items-center gap-2 rounded-md text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/80" to="/clubs">
                  Khám phá Câu lạc bộ
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-container transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
              <li>
                <Link className="group inline-flex min-h-11 items-center gap-2 rounded-md text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/80" to="/tournaments">
                  Giải đấu đang diễn ra
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-container transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
              </li>
              <li>
                <a className="group inline-flex min-h-11 items-center gap-2 rounded-md text-white/70 transition-colors duration-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/80" href="#">
                  Về chúng tôi
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4 shrink-0 text-primary-container transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
              </li>
            </ul>
          </motion.div>

          <motion.div
            className="min-w-0 md:col-span-4 lg:col-span-3"
            initial={revealFrom}
            transition={{ delay: shouldReduceMotion ? 0 : 0.12, duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <motion.h3
              className="mb-5 w-fit text-[20px] font-extrabold tracking-[-0.01em] text-[#9BD850] [text-shadow:0_0_9px_rgba(132,195,62,0.28)] transition-[text-shadow] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:[text-shadow:0_0_12px_rgba(132,195,62,0.42)]"
              whileHover={shouldReduceMotion ? undefined : { y: -1 }}
            >
              Liên hệ
            </motion.h3>
            <ul className="flex flex-col gap-4 text-[14px] leading-6 text-white/70">
              <li className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-[#9BD850]">
                  <MapPin aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 pt-1.5">Duy Tân, Cầu Giấy, Hà Nội</span>
              </li>
              <li className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-[#9BD850]">
                  <Phone aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 pt-1.5">+84 123 456 789</span>
              </li>
              <li className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-[#9BD850]">
                  <Mail aria-hidden="true" className="h-5 w-5" />
                </span>
                <span className="min-w-0 break-all pt-1.5">contact@picklink.vn</span>
              </li>
            </ul>
          </motion.div>
        </div>

        <div className="flex flex-col gap-3 border-t border-white/15 py-6 text-[12px] font-medium text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-5">&copy; {new Date().getFullYear()} Picklink. All rights reserved.</p>
          <div className="flex flex-wrap gap-x-5">
            <a className="inline-flex min-h-11 items-center rounded-md transition-colors duration-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/80" href="#">
              Chính sách bảo mật
            </a>
            <a className="inline-flex min-h-11 items-center rounded-md transition-colors duration-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/80" href="#">
              Điều khoản dịch vụ
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};
