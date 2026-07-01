import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

type AuthShellProps = {
  action?: ReactNode;
  children: ReactNode;
  kicker?: string;
  panelSize?: 'md' | 'lg';
  subtitle: string;
  title: string;
};

type AuthMessageProps = {
  children: ReactNode;
  tone?: 'error' | 'info' | 'success';
};

const revealTransition = {
  duration: 0.32,
  ease: [0.2, 0.8, 0.2, 1],
} as const;

export const authFieldClass = 'flex min-w-0 flex-col gap-1.5';
export const authLabelClass = 'text-[13px] font-bold leading-5 text-[#0b2228]';
export const authHintClass = 'text-[12px] leading-5 text-[#66766d]';
export const authInputClass = 'h-11 rounded-xl border-[#dbe8d3] bg-white text-[14px] focus:border-primary-container focus:ring-primary-container/30';
export const authPasswordButtonClass =
  'absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-[#66766d] transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:bg-[#eef8e6] hover:text-[#0b2228] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-[calc(-50%+1px)] active:scale-[0.99]';
export const authPrimaryButtonClass =
  'h-11 w-full rounded-xl bg-[#e2ff57] text-[#102414] shadow-[0_12px_24px_rgba(152,217,81,0.18)] hover:bg-[#d6f64d] hover:shadow-[0_14px_28px_rgba(152,217,81,0.24)]';
export const authSecondaryLinkClass =
  'inline-flex min-h-10 items-center rounded-xl px-2 text-[13px] font-bold text-primary transition-[color,background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#eef8e6] hover:text-[#0b2228] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px';

const BrandMark = () => (
  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b2228] shadow-[0_12px_24px_rgba(8,29,36,0.16)]">
    <span className="relative h-4 w-4 rounded-full bg-[#e2ff57] shadow-[0_0_18px_rgba(226,255,87,0.52)]">
      <span className="absolute inset-1 rounded-full border border-[#0b2228]/30" />
    </span>
  </span>
);

const CourtVisual = () => (
  <div className="relative min-h-[260px] overflow-hidden rounded-2xl border border-white/12 bg-[#276b3f] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
    <div
      aria-hidden="true"
      className="relative h-full min-h-[228px] rounded-xl border-2 border-white/70 bg-[linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:30px_30px]"
    >
      <div className="absolute inset-y-0 left-1/2 w-px bg-white/55" />
      <div className="absolute inset-x-[9%] top-1/2 h-px bg-white/55" />
      <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/55" />
      <div className="absolute left-[16%] top-[20%] h-5 w-5 rounded-full bg-[#e2ff57] shadow-[0_0_20px_rgba(226,255,87,0.55)]" />
      <div className="absolute bottom-[16%] right-[14%] h-5 w-5 rounded-full border-4 border-white/85" />
    </div>
    <div className="absolute right-6 top-6 rounded-lg bg-[#e2ff57] px-3 py-2 text-[12px] font-black text-[#102414]">
      Picklink court
    </div>
  </div>
);

export const AuthShell = ({
  action,
  children,
  kicker = 'Picklink access',
  panelSize = 'md',
  subtitle,
  title,
}: AuthShellProps) => {
  const shouldReduceMotion = useReducedMotion();
  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 14 };
  const maxWidthClass = panelSize === 'lg' ? 'max-w-xl' : 'max-w-md';

  return (
    <div className="min-h-dvh w-full min-w-0 overflow-x-clip bg-[#f8fbf4] font-sans text-on-background">
      <header className="sticky top-0 z-30 h-16 border-b border-[#dbe8d3] bg-white/92 supports-[backdrop-filter]:backdrop-blur-xl">
        <div className="mx-auto flex h-full w-full max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            aria-label="Picklink - Trang chủ"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl pr-2 transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#eef8e6] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px"
            to="/"
          >
            <BrandMark />
            <span className="leading-none">
              <span className="block text-[17px] font-extrabold tracking-[-0.03em] text-[#0b2228]">Picklink</span>
              <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
                pickleball
              </span>
            </span>
          </Link>
          {action}
        </div>
      </header>

      <main className="px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
        <div className="mx-auto grid min-h-[calc(100dvh-104px)] w-full max-w-[1180px] overflow-hidden rounded-2xl border border-[#dbe8d3] bg-white shadow-[0_20px_60px_rgba(18,45,34,0.09)] lg:grid-cols-[0.86fr_1.14fr]">
          <motion.aside
            animate={{ opacity: 1, y: 0 }}
            className="relative hidden min-h-[520px] flex-col justify-between overflow-hidden bg-[#081d24] p-6 text-white lg:flex"
            initial={revealInitial}
            transition={{ ...revealTransition, duration: shouldReduceMotion ? 0.01 : revealTransition.duration }}
          >
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#081d24_0%,#0b2228_58%,#143f34_100%)]" />
              <div className="absolute left-[8%] top-14 h-px w-[84%] bg-white/10" />
              <div className="absolute bottom-14 left-[8%] h-px w-[84%] bg-white/10" />
            </div>
            <div className="relative z-10">
              <p className="w-fit rounded-lg border border-white/14 bg-white/8 px-3 py-2 text-[13px] font-bold text-[#e2ff57]">
                {kicker}
              </p>
              <h1 className="mt-5 max-w-[12ch] text-[clamp(2.05rem,3.3vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.04em]">
                {title}
              </h1>
              <p className="mt-4 max-w-[42ch] text-[15px] leading-7 text-white/72">
                {subtitle}
              </p>
            </div>
            <div className="relative z-10">
              <CourtVisual />
              <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-white/12 bg-white/12">
                {[
                  ['48', 'sân mở'],
                  ['1.2k', 'người chơi'],
                  ['27', 'giải tháng'],
                ].map(([value, label]) => (
                  <div className="bg-[#0d2a2f]/88 p-3" key={label}>
                    <p className="font-mono text-[20px] font-bold leading-none text-[#e2ff57]">{value}</p>
                    <p className="mt-1 text-[12px] font-medium leading-4 text-white/62">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.aside>

          <section className="flex min-w-0 items-center justify-center bg-[#f8fbf4] p-3 sm:p-5">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={`w-full ${maxWidthClass} rounded-2xl border border-[#dbe8d3] bg-white p-4 shadow-[0_16px_42px_rgba(18,45,34,0.08)] sm:p-5 lg:p-6`}
              initial={revealInitial}
              transition={{
                delay: shouldReduceMotion ? 0 : 0.06,
                duration: shouldReduceMotion ? 0.01 : 0.32,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            >
              {children}
            </motion.div>
          </section>
        </div>
      </main>
    </div>
  );
};

export const AuthTopAction = ({ label, to }: { label: string; to: string }) => (
  <Link
    className="inline-flex h-10 items-center rounded-xl bg-[#e2ff57] px-4 text-[14px] font-black text-[#102414] shadow-[0_12px_24px_rgba(152,217,81,0.18)] transition-[background-color,transform,box-shadow] duration-200 hover:-translate-y-px hover:bg-[#d6f64d] hover:shadow-[0_14px_28px_rgba(152,217,81,0.24)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
    to={to}
  >
    {label}
  </Link>
);

export const BackTopAction = ({ label, to }: { label: string; to: string }) => (
  <Link
    className="inline-flex h-10 items-center gap-2 rounded-xl border border-[#dbe8d3] bg-white px-4 text-[14px] font-bold text-[#0b2228] transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px hover:border-primary-container hover:bg-[#eef8e6] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
    to={to}
  >
    <ArrowLeft aria-hidden="true" className="h-4 w-4" />
    {label}
  </Link>
);

export const AuthCardHeader = ({ subtitle, title }: { subtitle: string; title: string }) => (
  <div className="mb-4">
    <h2 className="text-[clamp(1.55rem,2.4vw,2rem)] font-extrabold leading-[1.12] tracking-[-0.03em] text-[#0b2228]">
      {title}
    </h2>
    <p className="mt-1.5 text-[14px] leading-6 text-[#66766d]">{subtitle}</p>
  </div>
);

export const AuthMessage = ({ children, tone = 'error' }: AuthMessageProps) => {
  const toneClass = {
    error: 'border-error/30 bg-error-container text-error',
    info: 'border-[#dbe8d3] bg-[#eef8e6] text-primary',
    success: 'border-[#dbe8d3] bg-[#eef8e6] text-[#0b2228]',
  }[tone];

  return (
    <div className={`rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold leading-5 ${toneClass}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  );
};

export const AuthDivider = ({ children }: { children: ReactNode }) => (
  <div className="relative my-4 flex items-center">
    <div className="h-px flex-1 bg-[#dbe8d3]" />
    <span className="mx-3 shrink-0 text-[12px] font-semibold text-[#66766d]">{children}</span>
    <div className="h-px flex-1 bg-[#dbe8d3]" />
  </div>
);
