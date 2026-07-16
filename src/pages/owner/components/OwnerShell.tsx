import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  CalendarDays,
  CircleGauge,
  CreditCard,
  Map,
  Settings,
  User,
  UsersRound,
} from 'lucide-react';
import { cn } from '../../../utils/cn';
import { useAuth } from '../../../auth/AuthContext';
import '../owner.css';

export type OwnerSectionId = 'schedule' | 'bookings' | 'matchBookings' | 'courts' | 'revenue' | 'staff' | 'settings';

const ownerNavItems: Array<{
  id: OwnerSectionId;
  label: string;
  shortLabel: string;
  to: string;
  icon: React.ElementType;
}> = [
  { id: 'schedule', label: 'Lịch đặt sân', shortLabel: 'Lịch', to: '/owner', icon: CalendarDays },
  { id: 'bookings', label: 'Đơn đặt sân', shortLabel: 'Đơn', to: '/owner/bookings', icon: CreditCard },
  { id: 'matchBookings', label: 'Đơn ghép trận', shortLabel: 'Ghép trận', to: '/owner/match-bookings', icon: UsersRound },
  { id: 'courts', label: 'Sân & court', shortLabel: 'Sân', to: '/owner/courts', icon: Map },
  { id: 'revenue', label: 'Doanh thu', shortLabel: 'Doanh thu', to: '/owner/revenue', icon: Banknote },
  { id: 'staff', label: 'Nhân viên & CheckIn', shortLabel: 'Staff', to: '/owner/staff', icon: UsersRound },
  { id: 'settings', label: 'Cài đặt', shortLabel: 'Cài đặt', to: '/owner/settings', icon: Settings },
];

export const OwnerShell = ({
  activeId,
  children,
  contentClassName,
  innerClassName,
}: {
  activeId: OwnerSectionId;
  children: React.ReactNode;
  contentClassName?: string;
  innerClassName?: string;
}) => {
  const shouldReduceMotion = useReducedMotion();
  const { user } = useAuth();
  const initials = user?.name
    ? user.name.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()
    : '';

  return (
    <div className="owner-root">
      <header className="owner-topbar">
        <Link aria-label="Picklink - Trang chủ" className="owner-brand" to="/">
          <span className="owner-brand__mark">
            <CircleGauge aria-hidden="true" className="h-[18px] w-[18px]" />
          </span>
          <span className="min-w-0 leading-none">
            <span className="block text-[16px] font-extrabold tracking-[-0.03em]">Picklink</span>
            <span className="mt-1 hidden text-[9px] font-bold uppercase tracking-[0.13em] text-[#e2ff57] sm:block">
              owner workspace
            </span>
          </span>
        </Link>

        <nav aria-label="Lối tắt chủ sân" className="owner-topbar__nav">
          {ownerNavItems.slice(0, 3).map((item) => (
            <Link
              aria-current={activeId === item.id ? 'page' : undefined}
              className={cn('owner-topbar__link', activeId === item.id && 'is-active')}
              key={item.id}
              to={item.to}
            >
              {item.label}
            </Link>
          ))}
        </nav>        <div className="flex items-center gap-2">
          <span className="hidden max-w-40 truncate text-[12px] font-bold text-white/76 sm:block">
            {user?.name || 'Chủ sân'}
          </span>
          <span
            aria-label={user?.name ? 'Tài khoản ' + user.name : 'Tài khoản chủ sân'}
            className="owner-topbar__action overflow-hidden text-[#e2ff57]"
            title={user?.name || 'Tài khoản chủ sân'}
          >
            {user?.avatar ? (
              <img alt="" className="h-full w-full object-cover" src={user.avatar} />
            ) : initials ? (
              <span className="text-[11px] font-extrabold">{initials}</span>
            ) : (
              <User aria-hidden="true" className="h-[18px] w-[18px]" />
            )}
          </span>
        </div>
      </header>

      <div className="owner-layout">
        <aside className="owner-sidebar">
          <div className="owner-sidebar__summary">
            <p className="text-[11px] font-extrabold text-[#e2ff57]">Trung tâm vận hành</p>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-white/64">
              Lịch sân, booking và doanh thu trong một workspace.
            </p>
          </div>

          <nav aria-label="Điều hướng chủ sân" className="owner-nav">
            {ownerNavItems.map((item) => (
              <Link
                aria-current={activeId === item.id ? 'page' : undefined}
                className={cn('owner-nav__link', activeId === item.id && 'is-active')}
                key={item.id}
                to={item.to}
              >
                <item.icon aria-hidden="true" className="h-[18px] w-[18px] shrink-0" />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <main className={cn('owner-content', contentClassName)}>
          <div className={cn('owner-content__inner', innerClassName)}>
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className="owner-content__motion"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 7 }}
              transition={{
                duration: shouldReduceMotion ? 0.01 : 0.22,
                ease: [0.2, 0.8, 0.2, 1],
              }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>

      <nav aria-label="Điều hướng chủ sân trên di động" className="owner-mobile-nav">
        {ownerNavItems.map((item) => (
          <Link
            aria-current={activeId === item.id ? 'page' : undefined}
            className={cn('owner-mobile-nav__link', activeId === item.id && 'is-active')}
            key={item.id}
            to={item.to}
          >
            <item.icon aria-hidden="true" className="h-[18px] w-[18px]" />
            <span>{item.shortLabel}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};
