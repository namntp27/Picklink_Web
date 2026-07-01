import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Circle, SearchX } from 'lucide-react';

export const NotFound = () => {
  const shouldReduceMotion = useReducedMotion();
  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 12 };

  return (
    <div className="flex min-h-dvh w-full min-w-0 flex-col overflow-x-clip bg-background font-sans text-on-background">
      <header className="sticky top-0 z-30 border-b border-outline-variant/50 bg-surface-container-lowest">
        <div className="mx-auto flex min-h-16 w-full max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            aria-label="Picklink - Trang chủ"
            className="group inline-flex min-h-11 items-center gap-2 rounded-md focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70"
            to="/"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded bg-primary-container">
              <Circle aria-hidden="true" className="h-4 w-4 fill-on-primary text-on-primary" />
            </span>
            <span className="text-[clamp(1.25rem,2vw,1.6rem)] font-extrabold tracking-[-0.035em] text-primary [text-shadow:0_0_10px_rgba(152,217,81,0.32)] transition-[text-shadow] duration-200 group-hover:[text-shadow:0_0_12px_rgba(152,217,81,0.42)]">
              Picklink
            </span>
          </Link>
        </div>
      </header>

      <main className="grid min-w-0 flex-1 grid-cols-1 lg:grid-cols-[0.9fr_1.1fr]">
        <motion.section
          animate={{ opacity: 1, y: 0 }}
          className="hero-gradient relative flex min-h-[240px] min-w-0 items-center justify-center overflow-hidden px-4 py-10 text-on-primary sm:px-6 md:min-h-[340px] lg:min-h-[620px] lg:px-12"
          initial={revealInitial}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.35, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-x-0 top-1/2 h-px bg-on-primary" />
              <div className="absolute inset-y-0 left-1/4 w-px bg-on-primary/65" />
              <div className="absolute inset-y-0 right-1/4 w-px bg-on-primary/65" />
              <div className="absolute left-[12%] right-[12%] top-[18%] h-px bg-on-primary/55" />
              <div className="absolute bottom-[18%] left-[12%] right-[12%] h-px bg-on-primary/55" />
            </div>
            <div className="absolute inset-x-0 top-1/2 h-12 -translate-y-1/2 border-y border-on-primary/20 bg-on-primary/10 backdrop-blur-sm" />
            <div className="absolute left-[60%] top-[43%] h-6 w-6 rounded-full bg-primary-fixed shadow-[0_0_18px_rgba(152,217,81,0.42)]" />
            <div className="absolute inset-0 bg-black/50" />
          </div>

          <div className="relative z-10 w-full max-w-lg text-center lg:text-left">
            <p className="text-[13px] font-bold text-primary-fixed">404</p>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.08] tracking-[-0.03em]">
              Không tìm thấy{' '}
              <span className="inline-block text-[1.12em] text-primary-fixed [text-shadow:0_0_8px_rgba(152,217,81,0.55),0_0_18px_rgba(152,217,81,0.28)]">
                trang
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-[58ch] text-[15px] font-medium leading-7 text-on-primary/88 lg:mx-0 lg:text-[17px]">
              Đường dẫn này không tồn tại hoặc đã được chuyển sang vị trí khác.
            </p>
          </div>
        </motion.section>

        <section className="flex min-w-0 items-center justify-center bg-surface-container-lowest px-4 py-10 sm:px-6 md:px-10 md:py-14 lg:px-16">
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md rounded-xl border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-[0_16px_40px_rgba(25,29,20,0.08)] sm:p-8"
            initial={revealInitial}
            transition={{
              delay: shouldReduceMotion ? 0 : 0.06,
              duration: shouldReduceMotion ? 0.01 : 0.35,
              ease: [0.2, 0.8, 0.2, 1],
            }}
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-surface-container text-primary">
              <SearchX aria-hidden="true" className="h-7 w-7" />
            </div>
            <h2 className="mt-5 text-[clamp(1.75rem,3vw,2.25rem)] font-extrabold leading-[1.15] tracking-[-0.025em] text-form-heading [text-shadow:0_0_7px_rgba(152,217,81,0.32),0_0_16px_rgba(152,217,81,0.18)]">
              Không tìm thấy trang
            </h2>
            <p className="mt-3 text-[15px] leading-6 text-on-surface-variant">
              Đường dẫn này không tồn tại hoặc đã được chuyển sang vị trí khác.
            </p>
            <Link
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg border border-primary-container bg-primary-container px-5 py-3 text-[14px] font-semibold text-on-primary-container shadow-[0_5px_14px_rgba(152,217,81,0.18)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-primary-fixed-dim hover:bg-primary-fixed-dim hover:shadow-[0_7px_16px_rgba(152,217,81,0.24)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
              to="/"
            >
              <ArrowLeft aria-hidden="true" className="h-5 w-5" />
              Về trang chủ
            </Link>
          </motion.div>
        </section>
      </main>
    </div>
  );
};
