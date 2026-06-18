import { NavLink } from 'react-router-dom';
import { adminNavItems } from '../adminNavigation';
import type { AdminSectionId } from '../types';

export const MobileAdminNav = ({ activeId }: { activeId: AdminSectionId }) => (
  <div className="mb-5 flex gap-2 overflow-x-auto pb-1 lg:hidden">
    {adminNavItems.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.id}
          to={item.to}
          end={item.id === 'overview'}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-bold ${
              isActive || activeId === item.id
                ? 'border-primary bg-primary-container text-on-primary-container'
                : 'border-outline-variant bg-surface text-secondary'
            }`
          }
        >
          <Icon className="h-4 w-4" />
          {item.label}
        </NavLink>
      );
    })}
  </div>
);
