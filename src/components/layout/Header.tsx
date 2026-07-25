import { useEffect, useId, useState } from 'react';
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'motion/react';
import {
  Bell,
  CalendarClock,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Ticket,
  UserRound,
  X,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import { getUnreadNotificationCount } from '../../api/notifications';
import { useNotificationRealtime } from '../../hooks/useNotificationRealtime';
import { useUnreadMessageSenderCount } from '../../hooks/useUnreadMessageSenderCount';
import { Button } from '../ui/Button';

const navItems = [
  { path: '/', label: 'Trang chủ' },
  { path: '/book-court', label: 'Tìm sân' },
  { path: '/ticket-sessions', label: 'Xé vé' },
  { path: '/clubs', label: 'Câu lạc bộ' },
  { path: '/opponents', label: 'Tìm đối thủ' },
  { path: '/posts', label: 'Bài đăng' },
];

const utilityItems = [
  { path: '/my-bookings', label: 'Lịch sử đặt sân', icon: CalendarClock },
  { path: '/my-tickets', label: 'Vé của tôi', icon: Ticket },
  { path: '/messages', label: 'Tin nhắn', icon: MessageCircle },
  { path: '/notifications', label: 'Thông báo', icon: Bell },
];

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const { logout, token, user } = useAuth();
  const unreadMessageSenderCount = useUnreadMessageSenderCount(token);
  const location = useLocation();
  const mobileMenuId = useId();
  const shouldReduceMotion = useReducedMotion();
  const dashboardPath = user ? getDefaultPathForRole(user.role) : '/';
  const dashboardLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'owner' ? 'Chủ sân' : 'Nhân viên';
  const isPlayer = user?.role === 'player';
  const activeHeaderLinkClass = 'bg-[#e2ff57] text-[#102414] shadow-[0_10px_22px_rgba(226,255,87,0.18)]';
  const passiveHeaderLinkClass = 'text-white/72 hover:-translate-y-px hover:bg-white/10 hover:text-white';
  const headerSurfaceClass = 'border-[#143f34] bg-[#081d24]/98 shadow-[0_12px_30px_rgba(0,0,0,0.2)]';
  const headerGroupClass = 'border-white/12 bg-white/[0.07]';
  const logoLinkClass = 'hover:bg-white/10';
  const brandNameClass = 'text-white';
  const brandMetaClass = 'text-[#e2ff57]';
  const quietActionClass = 'text-white/72 hover:-translate-y-px hover:bg-white/10 hover:text-white';

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const loadUnreadNotificationCount = async () => {
    if (!token) {
      setUnreadNotificationCount(0);
      return;
    }

    try {
      const result = await getUnreadNotificationCount(token);
      setUnreadNotificationCount(result.count);
    } catch {
      setUnreadNotificationCount(0);
    }
  };

  useEffect(() => {
    void loadUnreadNotificationCount();
  }, [token]);

  useNotificationRealtime(token, () => {
    void loadUnreadNotificationCount();
  });

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileMenuOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const isActivePath = (path: string) => (
    path === '/' ? location.pathname === path : location.pathname.startsWith(path)
  );

  const getNavLinkClass = (path: string) => {
    const isActive = isActivePath(path);

    return `relative inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-bold transition-[color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px ${
      isActive
        ? activeHeaderLinkClass
        : passiveHeaderLinkClass
    }`;
  };

  const getUtilityLinkClass = (path: string) => {
    const isActive = isActivePath(path);

    return `relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-[color,background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px ${
      isActive
        ? activeHeaderLinkClass
        : passiveHeaderLinkClass
    }`;
  };

  const getMobileNavLinkClass = (path: string) => {
    const isActive = isActivePath(path);

    return isActive
      ? 'flex min-h-12 items-center rounded-xl bg-[#0b2228] px-4 py-3 text-[15px] font-bold text-white shadow-[0_12px_24px_rgba(8,29,36,0.16)]'
      : 'flex min-h-12 items-center rounded-xl px-4 py-3 text-[15px] font-bold text-[#53645a] transition-[color,background-color] duration-200 hover:bg-[#eef8e6] hover:text-[#0b2228] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:bg-white';
  };

  return (
    <header className={`fixed inset-x-0 top-0 z-50 h-16 border-b transition-[box-shadow,background-color,border-color] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] supports-[backdrop-filter]:backdrop-blur-xl ${
      headerSurfaceClass
    }`}>
      <div className="mx-auto flex h-full w-full max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            aria-label="Picklink - Trang chủ"
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-xl pr-2 transition-[background-color,transform] duration-200 hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px ${logoLinkClass}`}
            to="/"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b2228] shadow-[0_12px_24px_rgba(8,29,36,0.16)]">
              <span className="relative h-4 w-4 rounded-full bg-[#e2ff57] shadow-[0_0_18px_rgba(226,255,87,0.52)]">
                <span className="absolute inset-1 rounded-full border border-[#0b2228]/30" />
              </span>
            </span>
            <span className="hidden leading-none min-[420px]:block">
              <span className={`block text-[17px] font-extrabold tracking-[-0.03em] ${brandNameClass}`}>Picklink</span>
              <span className={`mt-0.5 block text-[10px] font-bold uppercase tracking-[0.12em] ${brandMetaClass}`}>
                pickleball
              </span>
            </span>
          </Link>

          <nav aria-label="Điều hướng chính" className={`hidden items-center gap-1 rounded-2xl border p-1 min-[1180px]:flex ${headerGroupClass}`}>
            {navItems.map((item) => (
              <Link
                aria-current={isActivePath(item.path) ? 'page' : undefined}
                className={getNavLinkClass(item.path)}
                key={item.path}
                to={item.path}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-1 min-[1180px]:flex">
          <div className={`flex items-center gap-1 rounded-2xl border p-1 ${headerGroupClass}`}>
            {utilityItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  aria-current={isActivePath(item.path) ? 'page' : undefined}
                  aria-label={item.label}
                  className={getUtilityLinkClass(item.path)}
                  key={item.path}
                  title={item.label}
                  to={item.path}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                  {item.path === '/messages' && unreadMessageSenderCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e2ff57] px-1 text-[11px] font-black text-[#102414] ring-2 ring-white">
                      {Math.min(unreadMessageSenderCount, 99)}
                    </span>
                  )}
                  {item.path === '/notifications' && unreadNotificationCount > 0 && (
                    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#e2ff57] px-1 text-[11px] font-black text-[#102414] ring-2 ring-white">
                      {Math.min(unreadNotificationCount, 99)}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          {user ? (
            <>
              {isPlayer ? (
                <Link
                  aria-label="Chỉnh sửa hồ sơ"
                  className={`ml-1 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white transition-[border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px ${location.pathname.startsWith('/profile') ? 'border-primary shadow-[0_0_0_4px_rgba(152,217,81,0.18)]' : 'border-[#dbe8d3]'}`}
                  title="Chỉnh sửa hồ sơ"
                  to="/profile"
                >
                  {user.avatar ? (
                    <img alt={`Ảnh đại diện của ${user.name}`} className="h-full w-full object-cover" src={user.avatar} />
                  ) : (
                    <UserRound className="h-6 w-6 text-primary" />
                  )}
                </Link>
              ) : (
                <Link
                  aria-current={isActivePath(dashboardPath) ? 'page' : undefined}
                  aria-label={dashboardLabel}
                  className="ml-1 inline-flex h-10 items-center gap-2 rounded-xl border border-[#dbe8d3] bg-white px-3 text-[13px] font-bold text-primary transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-primary-container hover:bg-[#eef8e6] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px"
                  to={dashboardPath}
                >
                  <LayoutDashboard aria-hidden="true" className="h-5 w-5" />
                  <span className="hidden min-[1400px]:inline">{dashboardLabel}</span>
                </Link>
              )}
              <Button
                aria-label="Đăng xuất"
                className={`h-10 gap-2 rounded-xl px-3 transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px ${quietActionClass}`}
                onClick={logout}
                type="button"
                variant="ghost"
              >
                <LogOut aria-hidden="true" className="h-5 w-5" />
                <span className="hidden min-[1400px]:inline">Đăng xuất</span>
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-1">
              <Link
                className={`inline-flex h-10 items-center rounded-xl px-4 text-[14px] font-bold transition-[color,background-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px ${quietActionClass}`}
                to="/login"
              >
                Đăng nhập
              </Link>
              <Link
                className="inline-flex h-10 items-center rounded-xl bg-[#e2ff57] px-5 text-[14px] font-black text-[#102414] shadow-[0_12px_24px_rgba(152,217,81,0.18)] transition-[background-color,transform,box-shadow] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:bg-[#d6f64d] hover:shadow-[0_14px_30px_rgba(152,217,81,0.24)] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
                to="/register"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 min-[1180px]:hidden">
          {isPlayer && user && (
            <Link
              aria-label="Chỉnh sửa hồ sơ"
              className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border-2 bg-white transition-[border-color,transform] duration-200 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px ${location.pathname.startsWith('/profile') ? 'border-primary' : 'border-[#dbe8d3]'}`}
              title="Chỉnh sửa hồ sơ"
              to="/profile"
            >
              {user.avatar ? (
                <img alt={`Ảnh đại diện của ${user.name}`} className="h-full w-full object-cover" src={user.avatar} />
              ) : (
                <UserRound className="h-5 w-5 text-primary" />
              )}
            </Link>
          )}
          <Button
            aria-controls={mobileMenuId}
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            className="h-11 w-11 rounded-xl border border-white/12 bg-white/[0.08] p-0 text-white transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)] hover:-translate-y-px hover:border-[#e2ff57]/50 hover:bg-white/[0.12] focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
            size="icon"
            type="button"
            variant="ghost"
          >
            {isMobileMenuOpen ? (
              <X aria-hidden="true" className="h-6 w-6" />
            ) : (
              <Menu aria-hidden="true" className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isMobileMenuOpen && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="absolute inset-x-0 top-full max-h-[calc(100dvh-64px)] overscroll-contain overflow-y-auto border-t border-[#dbe8d3] bg-[#f8fbf4]/98 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 shadow-[0_20px_46px_rgba(8,29,36,0.13)] supports-[backdrop-filter]:backdrop-blur-xl sm:px-6 min-[1180px]:hidden"
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            id={mobileMenuId}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.2, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="mx-auto max-w-2xl">
              <div className="mb-4 rounded-2xl bg-[#0b2228] p-4 text-white shadow-[0_14px_34px_rgba(8,29,36,0.14)]">
                <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-[#e2ff57]">Picklink</p>
                <p className="mt-1 text-[15px] font-semibold text-white/82">Tìm sân, ghép hội và theo dõi lịch chơi nhanh hơn.</p>
              </div>

              <nav aria-label="Điều hướng trên thiết bị di động" className="grid gap-1 rounded-2xl border border-[#dbe8d3] bg-white p-1 sm:grid-cols-2">
                {navItems.map((item) => (
                  <Link
                    aria-current={isActivePath(item.path) ? 'page' : undefined}
                    className={getMobileNavLinkClass(item.path)}
                    key={item.path}
                    to={item.path}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>

              <div className="mt-4 grid gap-1 rounded-2xl border border-[#dbe8d3] bg-white p-1 min-[420px]:grid-cols-3">
                {utilityItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      aria-current={isActivePath(item.path) ? 'page' : undefined}
                      className={`${getMobileNavLinkClass(item.path)} justify-between gap-2`}
                      key={item.path}
                      to={item.path}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                        {item.label}
                      </span>
                      {item.path === '/messages' && unreadMessageSenderCount > 0 && (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#e2ff57] px-1.5 text-[11px] font-black text-[#102414]">
                          {Math.min(unreadMessageSenderCount, 99)}
                        </span>
                      )}
                      {item.path === '/notifications' && unreadNotificationCount > 0 && (
                        <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#e2ff57] px-1.5 text-[11px] font-black text-[#102414]">
                          {Math.min(unreadNotificationCount, 99)}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {user ? (
                <div className={`mt-4 grid gap-3 border-t border-[#dbe8d3] pt-4 ${isPlayer ? 'grid-cols-1' : 'sm:grid-cols-2'}`}>
                  {!isPlayer && (
                    <Link
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-[#dbe8d3] bg-white px-4 py-3 text-center text-[15px] font-bold text-primary transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px hover:border-primary-container hover:bg-[#eef8e6] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px"
                      to={dashboardPath}
                    >
                      <LayoutDashboard aria-hidden="true" className="h-5 w-5" />
                      {dashboardLabel}
                    </Link>
                  )}
                  <Button
                    className="min-h-12 gap-2 rounded-xl border border-[#dbe8d3] bg-white px-4 py-3 text-center text-[15px] font-bold text-[#53645a] transition-[color,background-color,border-color,transform] duration-200 hover:-translate-y-px hover:border-primary-container hover:bg-[#eef8e6] hover:text-[#0b2228] focus-visible:ring-0 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px"
                    onClick={logout}
                    type="button"
                    variant="outline"
                  >
                    <LogOut aria-hidden="true" className="h-5 w-5" />
                    Đăng xuất
                  </Button>
                </div>
              ) : (
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[#dbe8d3] pt-4">
                  <Link
                    className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#dbe8d3] bg-white px-4 py-3 text-center text-[15px] font-bold text-primary transition-[background-color,border-color,transform] duration-200 hover:-translate-y-px hover:border-primary-container hover:bg-[#eef8e6] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary/70 active:translate-y-px"
                    to="/login"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#e2ff57] px-4 py-3 text-center text-[15px] font-black text-[#102414] transition-[background-color,transform] duration-200 hover:-translate-y-px hover:bg-[#d6f64d] focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99]"
                    to="/register"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
