import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, ShieldAlert } from 'lucide-react';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';

export const Unauthorized = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const fallbackPath = user ? getDefaultPathForRole(user.role) : '/login';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f9f9ff] px-4 text-on-surface">
      <section className="w-full max-w-lg rounded-lg border border-outline-variant bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ffdad6] text-[#ba1a1a]">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-[28px] font-bold leading-tight">Không có quyền truy cập</h1>
        <p className="mt-3 text-[15px] leading-6 text-on-surface-variant">
          Tài khoản hiện tại không được phép mở màn hình này. Hãy quay lại khu vực phù hợp với vai trò của bạn hoặc đăng nhập bằng tài khoản khác.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
            to={fallbackPath}
          >
            <ArrowLeft className="h-5 w-5" />
            Về trang của tôi
          </Link>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-outline-variant px-5 py-3 text-[14px] font-bold text-on-surface-variant hover:bg-surface-container-low"
            onClick={handleLogout}
            type="button"
          >
            <LogOut className="h-5 w-5" />
            Đăng nhập lại
          </button>
        </div>
      </section>
    </div>
  );
};
