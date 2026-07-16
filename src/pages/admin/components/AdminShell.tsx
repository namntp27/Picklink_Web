import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CircleGauge } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { adminNavItems } from '../adminNavigation';
import type { AdminSectionId } from '../types';
import { useAuth } from '../../../auth/AuthContext';

export const AdminShell = ({
  activeId,
  children,
}: {
  activeId: AdminSectionId;
  children: ReactNode;
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();
  const initials = user?.name
    ? user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <div className="min-h-dvh bg-[#f8fbf4] text-[#0b2228]" data-motion-scope="product">
      <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-[radial-gradient(circle_at_78%_-180%,rgba(226,255,87,0.24),transparent_20rem),linear-gradient(135deg,#081d24,#0b2228_62%,#143f34)] px-4 text-white shadow-[0_12px_30px_rgba(8,29,36,0.16)] md:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            aria-label="Picklink - Trang chủ"
            className="inline-flex min-w-0 items-center gap-2.5 rounded-xl pr-2"
            to="/"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#e2ff57] text-[#102414] shadow-[0_9px_20px_rgba(152,217,81,0.24)]">
              <CircleGauge aria-hidden="true" className="h-[19px] w-[19px]" />
            </span>
            <span className="truncate text-[19px] font-extrabold tracking-[-0.035em]">Picklink</span>
          </Link>
          <span className="hidden rounded-lg border border-white/12 bg-white/8 px-2.5 py-1.5 text-[11px] font-extrabold text-[#e2ff57] sm:inline-flex">
            Quản trị viên
          </span>
        </div>
        <div className="flex items-center gap-2 text-white">
          <div className="hidden text-right md:block">
            <p className="text-[13px] font-extrabold">{user?.name || 'Quản trị viên'}</p>
            {user?.email && <p className="mt-0.5 text-[10px] leading-none text-white/58">{user.email}</p>}
          </div>
          <div aria-label={user?.name || 'Tài khoản quản trị'} className="grid h-10 w-10 place-items-center overflow-hidden rounded-xl border border-[#e2ff57]/45 bg-[#e2ff57]/10 text-[12px] font-extrabold text-[#e2ff57]">
            {user?.avatar ? <img alt="" className="h-full w-full object-cover" src={user.avatar} /> : initials}
          </div>
        </div>
      </header>

      <aside className="custom-scrollbar fixed left-0 top-16 hidden h-[calc(100dvh-64px)] w-64 flex-col overflow-y-auto border-r border-[#d8e4d4] bg-white/88 p-3 backdrop-blur-xl lg:flex">
        <div className="mb-4 rounded-2xl bg-[#0b2228] p-4 text-white shadow-[0_12px_26px_rgba(8,29,36,0.13)]">
          <p className="text-[12px] font-extrabold text-[#e2ff57]">Trung tâm quản trị</p>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-white/62">
            Theo dõi vận hành và xử lý các hàng chờ trong một workspace.
          </p>
        </div>
        <nav className="flex flex-col gap-1" aria-label="Điều hướng quản trị">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.id === 'overview'}
                className={({ isActive }) =>
                  `flex min-h-11 items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-extrabold transition-[color,background-color,box-shadow,transform] ${
                    isActive || activeId === item.id
                      ? 'bg-[#0b2228] text-white shadow-[0_8px_18px_rgba(8,29,36,0.12)]'
                      : 'text-[#66766d] hover:translate-x-0.5 hover:bg-[#edf5e9] hover:text-[#0b2228]'
                  }`
                }
              >
                <Icon className={`h-[18px] w-[18px] ${activeId === item.id ? 'text-[#e2ff57]' : ''}`} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="min-h-dvh pt-16 lg:ml-64">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto w-full max-w-[1480px] p-4 sm:p-5 md:p-7 lg:p-8"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
          key={activeId}
          transition={{
            duration: shouldReduceMotion ? 0.01 : 0.32,
            ease: [0.2, 0.8, 0.2, 1],
          }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
};
