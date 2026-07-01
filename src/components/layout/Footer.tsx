import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Facebook, Mail, MapPin, Phone } from 'lucide-react';

const footerGroups = [
  {
    title: 'Khám phá',
    links: [
      { label: 'Tìm sân', to: '/book-court' },
      { label: 'Giải đấu', to: '/tournaments' },
      { label: 'Bảng tin', to: '/posts' },
    ],
  },
  {
    title: 'Cộng đồng',
    links: [
      { label: 'Câu lạc bộ', to: '/clubs' },
      { label: 'Tìm đối thủ', to: '/opponents' },
      { label: 'Tin nhắn', to: '/messages' },
    ],
  },
  {
    title: 'Hỗ trợ',
    links: [
      { label: 'Liên hệ', href: '#footer-contact' },
      { label: 'Chính sách bảo mật', href: '#' },
      { label: 'Điều khoản dịch vụ', href: '#' },
    ],
  },
];

const contactItems = [
  { label: 'Duy Tân, Cầu Giấy, Hà Nội', icon: MapPin },
  { label: '+84 123 456 789', icon: Phone },
  { label: 'contact@picklink.vn', icon: Mail },
];

export const Footer = () => {
  const shouldReduceMotion = useReducedMotion();
  const revealFrom = shouldReduceMotion ? false : { opacity: 0, y: 16 };

  return (
    <footer className="relative overflow-hidden bg-[#081d24] px-4 text-white sm:px-6 lg:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_8%,rgba(152,217,81,0.2),transparent_30%),radial-gradient(circle_at_86%_18%,rgba(226,255,87,0.14),transparent_24%),linear-gradient(135deg,#081d24_0%,#0b2228_58%,#12362f_100%)]" />
        <div className="absolute left-[7%] top-10 h-px w-[86%] bg-white/10" />
      </div>

      <div className="relative mx-auto max-w-[1180px] py-10 md:py-12">
        <motion.div
          className="mb-8 rounded-2xl border border-white/12 bg-white/[0.07] p-4 shadow-[0_20px_60px_rgba(0,0,0,0.16)] sm:p-5 md:flex md:items-center md:justify-between md:gap-6"
          initial={revealFrom}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          viewport={{ amount: 0.2, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="min-w-0">
            <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#e2ff57]">Ready to play</p>
            <h2 className="mt-2 max-w-[18ch] text-[clamp(1.35rem,2.4vw,2rem)] font-bold leading-tight tracking-[-0.025em]">
              Tìm sân đẹp và hội chơi đúng nhịp.
            </h2>
          </div>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row md:mt-0">
            <Link
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e2ff57] px-4 py-2.5 text-[14px] font-black text-[#102414] shadow-[0_14px_30px_rgba(152,217,81,0.22)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:bg-[#d6f64d] hover:shadow-[0_16px_34px_rgba(152,217,81,0.28)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#e2ff57]/80 active:translate-y-px"
              to="/book-court"
            >
              Tìm sân gần bạn
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/18 bg-white/[0.06] px-4 py-2.5 text-[14px] font-bold text-white transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px hover:border-white/34 hover:bg-white/[0.12] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#e2ff57]/80 active:translate-y-px"
              to="/clubs"
            >
              Tham gia cộng đồng
            </Link>
          </div>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] lg:grid-cols-[1.15fr_1.35fr_0.85fr] lg:gap-10">
          <motion.div
            className="min-w-0"
            initial={revealFrom}
            transition={{ delay: shouldReduceMotion ? 0 : 0.04, duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <Link
              aria-label="Picklink - Trang chủ"
              className="inline-flex w-fit items-center gap-3 rounded-xl pr-2 transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-white/[0.06] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#e2ff57]/80 active:translate-y-px"
              to="/"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#0b2228] shadow-[0_16px_34px_rgba(0,0,0,0.2)]">
                <span className="h-4 w-4 rounded-full bg-[#e2ff57] shadow-[0_0_18px_rgba(226,255,87,0.58)]" />
              </span>
              <span className="leading-none">
                <span className="block text-[22px] font-extrabold tracking-[-0.035em]">Picklink</span>
                <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.14em] text-[#e2ff57]">
                  pickleball community
                </span>
              </span>
            </Link>
            <p className="mt-5 max-w-[45ch] text-[15px] leading-7 text-white/70">
              Một nơi gọn gàng để tìm sân, ghép hội, theo dõi giải và giữ nhịp chơi đều hơn mỗi tuần.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <motion.a
                aria-label="Facebook"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/14 bg-white/[0.06] text-white/76 transition-[color,background-color,border-color] duration-200 hover:border-[#e2ff57]/60 hover:bg-[#e2ff57]/12 hover:text-[#e2ff57] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#e2ff57]/80"
                href="#"
                whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                whileTap={shouldReduceMotion ? undefined : { y: 1, scale: 0.99 }}
              >
                <Facebook aria-hidden="true" className="h-5 w-5" />
              </motion.a>
              <motion.a
                aria-label="Email"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/14 bg-white/[0.06] text-white/76 transition-[color,background-color,border-color] duration-200 hover:border-[#e2ff57]/60 hover:bg-[#e2ff57]/12 hover:text-[#e2ff57] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-[#e2ff57]/80"
                href="mailto:contact@picklink.vn"
                whileHover={shouldReduceMotion ? undefined : { y: -1 }}
                whileTap={shouldReduceMotion ? undefined : { y: 1, scale: 0.99 }}
              >
                <Mail aria-hidden="true" className="h-5 w-5" />
              </motion.a>
            </div>
          </motion.div>

          <motion.nav
            aria-label="Điều hướng chân trang"
            className="grid gap-5 sm:grid-cols-3 md:col-span-1 lg:col-span-1"
            initial={revealFrom}
            transition={{ delay: shouldReduceMotion ? 0 : 0.08, duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {footerGroups.map((group) => (
              <div key={group.title}>
                <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-[#e2ff57]">{group.title}</h3>
                <ul className="mt-3 grid gap-1 text-[14px] font-semibold text-white/66">
                  {group.links.map((link) => (
                    <li key={link.label}>
                      {'to' in link ? (
                        <Link
                          className="inline-flex min-h-9 items-center rounded-lg transition-colors duration-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e2ff57]/80"
                          to={link.to}
                        >
                          {link.label}
                        </Link>
                      ) : (
                        <a
                          className="inline-flex min-h-9 items-center rounded-lg transition-colors duration-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#e2ff57]/80"
                          href={link.href}
                        >
                          {link.label}
                        </a>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </motion.nav>

          <motion.div
            className="min-w-0 rounded-2xl border border-white/12 bg-white/[0.06] p-4 md:col-span-2 lg:col-span-1"
            id="footer-contact"
            initial={revealFrom}
            transition={{ delay: shouldReduceMotion ? 0 : 0.12, duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            viewport={{ amount: 0.2, once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            <h3 className="text-[13px] font-black uppercase tracking-[0.12em] text-[#e2ff57]">Kết nối</h3>
            <ul className="mt-4 grid gap-3 text-[14px] leading-6 text-white/70">
              {contactItems.map((item) => {
                const Icon = item.icon;

                return (
                  <li className="flex min-w-0 items-start gap-3" key={item.label}>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e2ff57]/12 text-[#e2ff57]">
                      <Icon aria-hidden="true" className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 pt-1.5">{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-white/12 pt-5 text-[12px] font-medium text-white/52 sm:flex-row sm:items-center sm:justify-between">
          <p className="leading-5">&copy; {new Date().getFullYear()} Picklink. All rights reserved.</p>
          <p className="leading-5 text-white/48">Designed for Vietnam pickleball players.</p>
        </div>
      </div>
    </footer>
  );
};
