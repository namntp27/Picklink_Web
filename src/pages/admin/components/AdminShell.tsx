import type { ReactNode } from 'react';
import { Bell } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { adminNavItems } from '../adminNavigation';
import type { AdminSectionId } from '../types';

export const AdminShell = ({
  activeId,
  children,
}: {
  activeId: AdminSectionId;
  children: ReactNode;
}) => {
  return (
    <div className="min-h-screen bg-background text-on-background">
      <header className="fixed left-0 top-0 z-50 flex h-16 w-full items-center justify-between px-4 shadow-md md:px-8" style={{ backgroundColor: '#98D951' }}>
        <div className="flex items-center gap-3">
          <Link to="/" className="text-[24px] font-bold text-white">
            Picklink
          </Link>
          <span className="rounded-full bg-surface-container-lowest px-3 py-1 text-[12px] font-bold text-primary shadow-sm">
            Quản trị viên
          </span>
        </div>
        <div className="flex items-center gap-4 text-white">
          <button className="relative rounded-full p-2 transition-colors hover:bg-black/10" title="Thông báo">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary-container bg-error" />
          </button>
          <div className="hidden border-l border-white/30 pl-4 text-right md:block">
            <p className="text-[14px] font-bold">Admin Cao Cấp</p>
            <p className="text-[11px] leading-none opacity-80">admin@picklink.vn</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/50 bg-white/20 text-[14px] font-bold">
            AD
          </div>
        </div>
      </header>

      <aside className="custom-scrollbar fixed left-0 top-16 hidden h-[calc(100vh-64px)] w-64 flex-col overflow-y-auto border-r border-outline-variant bg-surface p-4 lg:flex">
        <div className="mb-4 px-3 py-2">
          <p className="text-[18px] font-bold text-primary">Hệ thống Picklink</p>
          <p className="text-[12px] text-secondary">Trung tâm quản trị</p>
        </div>
        <nav className="flex flex-col gap-1">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.id}
                to={item.to}
                end={item.id === 'overview'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-bold transition-all ${
                    isActive || activeId === item.id
                      ? 'translate-x-1 bg-primary-container text-on-primary-container'
                      : 'text-secondary hover:bg-secondary-container/30'
                  }`
                }
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="pt-16 lg:ml-64">
        <div className="mx-auto w-full max-w-[1600px] p-4 md:p-8">{children}</div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #DDE5D5;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
