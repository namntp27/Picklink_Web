import { NavLink } from 'react-router-dom';
import { adminNavItems } from '../adminNavigation';
import type { AdminSectionId } from '../types';

export const MobileAdminNav = ({ activeId }: { activeId: AdminSectionId }) => (
  <nav aria-label="Điều hướng quản trị trên di động" className="custom-scrollbar mb-5 flex gap-2 overflow-x-auto pb-2 lg:hidden">
    {adminNavItems.map((item) => {
      const Icon = item.icon;
      return (
        <NavLink
          key={item.id}
          to={item.to}
          end={item.id === 'overview'}
          className={({ isActive }) =>
            `picklink-glow-control flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[12px] font-extrabold ${
              isActive || activeId === item.id
                ? 'border-[#0b2228] bg-[#0b2228] text-white shadow-[0_8px_18px_rgba(8,29,36,0.12)]'
                : 'border-[#d8e4d4] bg-white text-[#66766d] hover:border-[#98d951] hover:bg-[#edf5e9] hover:text-[#0b2228]'
            }`
          }
        >
          <Icon className={`h-4 w-4 ${activeId === item.id ? 'text-[#e2ff57]' : ''}`} />
          {item.label}
        </NavLink>
      );
    })}
  </nav>
);
