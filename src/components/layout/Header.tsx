import React, { useState, useEffect } from 'react';
import { Bell, Menu, MessageCircle, UserRound, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { logout, user } = useAuth();
  const location = useLocation();
  const dashboardPath = user ? getDefaultPathForRole(user.role) : '/';
  const dashboardLabel = user?.role === 'admin' ? 'Admin' : user?.role === 'owner' ? 'Chủ sân' : 'Nhân viên';
  const isPlayer = user?.role === 'player';

  const navItems = [
    { path: '/', label: 'Trang chủ' },
    { path: '/book-court', label: 'Tìm sân' },
    { path: '/clubs', label: 'Câu lạc bộ' },
    { path: '/opponents', label: 'Tìm đối thủ' },
    { path: '/posts', label: 'Bài đăng' },
    { path: '/tournaments', label: 'Giải đấu' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const getNavLinkClass = (path: string) => {
    const isActive = path === '/' ? location.pathname === path : location.pathname.startsWith(path);

    return isActive 
      ? 'text-on-primary font-bold border-b-2 border-on-primary pb-1 font-label-md text-label-md transition-all'
      : 'text-on-primary/80 font-label-md text-label-md hover:text-on-primary transition-opacity';
  };

  const getMobileNavLinkClass = (path: string) => {
    const isActive = path === '/' ? location.pathname === path : location.pathname.startsWith(path);

    return isActive
      ? 'rounded-lg bg-primary-container px-4 py-3 text-[15px] font-bold text-on-primary-container'
      : 'rounded-lg px-4 py-3 text-[15px] font-bold text-on-primary/90 hover:bg-white/10';
  };

  return (
    <header className={`fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-margin-desktop shadow-md transition-all duration-300 ${isScrolled ? 'py-2 bg-primary/95 backdrop-blur-md' : 'py-4 bg-primary'}`}>
      <div className="flex items-center gap-12">
        <Link to="/">
          <img alt="Picklink Logo" className="h-10 object-contain" src="data:image/png;base64,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" />
        </Link>
        <nav className="hidden md:flex gap-8">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className={getNavLinkClass(item.path)}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="hidden items-center gap-4 md:flex">
        <Link
          className={`rounded-lg px-4 py-2 text-[14px] font-bold transition-colors ${
            location.pathname.startsWith('/my-bookings')
              ? 'bg-white text-primary'
              : 'text-on-primary/90 hover:bg-white/10'
          }`}
          to="/my-bookings"
        >
          Lịch sử đặt sân
        </Link>
        <Link
          className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[14px] font-bold transition-colors ${
            location.pathname.startsWith('/messages')
              ? 'bg-white text-primary'
              : 'text-on-primary/90 hover:bg-white/10'
          }`}
          to="/messages"
        >
          <MessageCircle className="h-5 w-5" />
          Tin nhắn
        </Link>
        <Link
          aria-label="Thông báo"
          className={`relative flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 transition-colors ${
            location.pathname.startsWith('/notifications')
              ? 'bg-white text-primary'
              : 'text-on-primary hover:bg-white/10'
          }`}
          to="/notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#eab526] px-1 text-[11px] font-bold text-white">
            3
          </span>
        </Link>
        {user ? (
          <>
            {isPlayer ? (
              <Link
                aria-label="Chỉnh sửa hồ sơ"
                className={`flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 bg-white shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary ${location.pathname.startsWith('/profile') ? 'border-[#eab526]' : 'border-white/80'}`}
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
              <Link to={dashboardPath} className="bg-surface-container-lowest text-primary font-bold px-6 py-2 rounded-lg text-label-md shadow-sm hover:scale-95 transition-transform">
                {dashboardLabel}
              </Link>
            )}
            <button
              className="text-on-primary/90 font-label-md text-label-md px-4 py-2 hover:opacity-80 transition-opacity"
              onClick={logout}
              type="button"
            >
              Đăng xuất
            </button>
          </>
        ) : (
          <>
        <Link to="/login">
            <button className="text-on-primary/90 font-label-md text-label-md px-4 py-2 hover:opacity-80 transition-opacity">Đăng nhập</button>
        </Link>
        <Link to="/register" className="bg-surface-container-lowest text-primary font-bold px-6 py-2 rounded-lg text-label-md shadow-sm hover:scale-95 transition-transform">
          Đăng ký
        </Link>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 md:hidden">
        {isPlayer && user && (
          <Link
            aria-label="Chỉnh sửa hồ sơ"
            className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 bg-white ${location.pathname.startsWith('/profile') ? 'border-[#eab526]' : 'border-white/80'}`}
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
        <button
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/20 text-on-primary transition-colors hover:bg-white/10"
          onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          type="button"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute left-0 right-0 top-full border-t border-white/15 bg-primary/98 px-4 py-4 shadow-xl backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className={getMobileNavLinkClass(item.path)}>
                {item.label}
              </Link>
            ))}
            <Link to="/messages" className={getMobileNavLinkClass('/messages')}>
              Tin nhắn
            </Link>
            <Link to="/my-bookings" className={getMobileNavLinkClass('/my-bookings')}>
              Lịch sử đặt sân
            </Link>
            <Link to="/notifications" className={`${getMobileNavLinkClass('/notifications')} flex items-center justify-between`}>
              <span>Thông báo</span>
              <span className="rounded-full bg-[#eab526] px-2 py-0.5 text-[12px] font-bold text-white">3</span>
            </Link>
          </nav>
          {user ? (
            <div className={`mt-4 grid gap-3 border-t border-white/15 pt-4 ${isPlayer ? 'grid-cols-1' : 'grid-cols-2'}`}>
              {!isPlayer && (
                <Link
                  to={dashboardPath}
                  className="rounded-lg bg-surface-container-lowest px-4 py-3 text-center text-[15px] font-bold text-primary"
                >
                  {dashboardLabel}
                </Link>
              )}
              <button
                className="rounded-lg border border-white/25 px-4 py-3 text-center text-[15px] font-bold text-on-primary hover:bg-white/10"
                onClick={logout}
                type="button"
              >
                Đăng xuất
              </button>
            </div>
          ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4">
            <Link
              to="/login"
              className="rounded-lg border border-white/25 px-4 py-3 text-center text-[15px] font-bold text-on-primary hover:bg-white/10"
            >
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-surface-container-lowest px-4 py-3 text-center text-[15px] font-bold text-primary"
            >
              Đăng ký
            </Link>
          </div>
          )}
        </div>
      )}
    </header>
  );
};
