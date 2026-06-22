import React from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  Bell,
  CalendarDays,
  CreditCard,
  HelpCircle,
  Map,
  Settings,
  User,
} from 'lucide-react';
import { cn } from '../../../utils/cn';

export type OwnerSectionId = 'schedule' | 'bookings' | 'payments' | 'courts' | 'revenue' | 'settings';

const ownerNavItems: Array<{
  id: OwnerSectionId;
  label: string;
  shortLabel: string;
  to: string;
  icon: React.ElementType;
}> = [
  { id: 'schedule', label: 'Lịch đặt sân', shortLabel: 'Lịch', to: '/owner', icon: CalendarDays },
  { id: 'bookings', label: 'Đơn đặt sân', shortLabel: 'Đơn', to: '/owner/bookings', icon: CreditCard },
  { id: 'payments', label: 'Xác nhận thanh toán', shortLabel: 'Thanh toán', to: '/owner/payments', icon: Banknote },
  { id: 'courts', label: 'Sân & court', shortLabel: 'Sân', to: '/owner/courts', icon: Map },
  { id: 'revenue', label: 'Doanh thu', shortLabel: 'Doanh thu', to: '/owner/revenue', icon: Banknote },
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
}) => (
  <div className="min-h-screen bg-[#f9f9ff] text-on-surface">
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-primary px-4 text-white shadow-md md:px-margin-desktop">
      <div className="flex items-center gap-4">
        <Link className="text-[24px] font-bold tracking-tight" to="/">
          Picklink
        </Link>
        <span className="hidden rounded-lg border border-white/20 px-3 py-1 text-[12px] font-bold text-white/86 md:inline-flex">
          Chủ sân
        </span>
      </div>

      <div className="flex items-center gap-2">
        {ownerNavItems.slice(0, 3).map((item) => (
          <Link
            className={cn(
              'hidden rounded-lg px-4 py-2 text-[14px] font-bold md:inline-flex',
              activeId === item.id ? 'bg-white text-primary' : 'bg-white/10 hover:bg-white/16',
            )}
            key={item.id}
            to={item.to}
          >
            {item.label}
          </Link>
        ))}
        <button aria-label="Thông báo chủ sân" className="rounded-lg p-2 hover:bg-white/10" type="button">
          <Bell className="h-5 w-5" />
        </button>
        <button aria-label="Trợ giúp" className="hidden rounded-lg p-2 hover:bg-white/10 sm:inline-flex" type="button">
          <HelpCircle className="h-5 w-5" />
        </button>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/30 bg-white/12">
          <User className="h-5 w-5" />
        </div>
      </div>
    </header>

    <div className="flex min-w-0">
      <aside className="sticky top-16 hidden h-[calc(100vh-64px)] w-64 shrink-0 border-r border-outline-variant bg-white p-4 md:block">
        <div className="mb-6 px-2 pt-2">
          <h2 className="text-[20px] font-bold text-primary">Picklink Admin</h2>
          <p className="mt-1 text-[12px] font-medium text-on-surface-variant">Quản lý vận hành sân</p>
        </div>

        <nav className="space-y-1">
          {ownerNavItems.map((item) => (
            <Link
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-bold transition-colors',
                activeId === item.id ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary',
              )}
              key={item.id}
              to={item.to}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className={cn('min-w-0 flex-1 px-4 py-6 pb-24 md:px-8 md:pb-8', contentClassName)}>
        <div className={cn('mx-auto max-w-[1320px] space-y-6', innerClassName)}>{children}</div>
      </main>
    </div>

    <nav className="fixed bottom-0 left-0 right-0 z-50 grid h-16 grid-cols-6 border-t border-outline-variant bg-white md:hidden">
      {ownerNavItems.map((item) => (
        <Link
          className={cn(
            'flex flex-col items-center justify-center gap-1',
            activeId === item.id ? 'text-primary' : 'text-on-surface-variant',
          )}
          key={item.id}
          to={item.to}
        >
          <item.icon className="h-5 w-5" />
          <span className="text-[10px] font-bold">{item.shortLabel}</span>
        </Link>
      ))}
    </nav>
  </div>
);
