import { CalendarClock, CalendarDays, Ticket, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

/**
 * Shared switcher across the four "my stuff" screens.
 *
 * The calendar answers "what do I have on", the three lists answer "what happened to X" — they hold
 * the cancelled rows, the full-history search and the pay/cancel/review actions the calendar leaves
 * out. Rather than fold them into one screen, they keep their own routes and share this strip, so
 * the header needs a single entry and every existing link still resolves.
 */
const tabs = [
  { icon: CalendarDays, label: 'Lịch', to: '/my-schedule' },
  { icon: CalendarClock, label: 'Đặt sân', to: '/my-bookings' },
  { icon: Ticket, label: 'Vé', to: '/my-tickets' },
  { icon: Users, label: 'Ghép trận', to: '/my-matches' },
];

export const MyActivityTabs = () => (
  <nav aria-label="Hoạt động của tôi" className="mb-4 flex min-w-0 gap-1.5 overflow-x-auto pb-1">
    {tabs.map((tab) => {
      const Icon = tab.icon;

      return (
        <NavLink
          className={({ isActive }) => `inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-[13px] font-bold transition-[background-color,border-color,color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px ${
            isActive
              ? 'border-[#e2ff57] bg-[#081d24] text-[#e2ff57]'
              : 'border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-[#e2ff57] hover:bg-[#081d24] hover:text-[#e2ff57]'
          }`}
          end
          key={tab.to}
          to={tab.to}
        >
          <Icon aria-hidden="true" className="h-4 w-4" />
          {tab.label}
        </NavLink>
      );
    })}
  </nav>
);
