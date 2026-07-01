import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, ShieldAlert } from 'lucide-react';
import { getDefaultPathForRole, useAuth } from '../../auth/AuthContext';
import { Button } from '../../components/ui/Button';
import {
  AuthCardHeader,
  AuthShell,
  authPrimaryButtonClass,
} from './AuthShell';

export const Unauthorized = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const fallbackPath = user ? getDefaultPathForRole(user.role) : '/login';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <AuthShell
      subtitle="Picklink bảo vệ từng khu vực theo vai trò để dữ liệu sân, lịch và người chơi luôn đúng quyền."
      title="Không có quyền truy cập."
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-error-container text-error">
        <ShieldAlert aria-hidden="true" className="h-7 w-7" />
      </div>

      <div className="mt-5 text-center">
        <AuthCardHeader
          subtitle="Tài khoản hiện tại không được phép mở màn hình này. Hãy quay lại khu vực phù hợp hoặc đăng nhập bằng tài khoản khác."
          title="Không có quyền truy cập"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Link
          className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-black transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99] ${authPrimaryButtonClass}`}
          to={fallbackPath}
        >
          <ArrowLeft aria-hidden="true" className="h-5 w-5" />
          Về trang của tôi
        </Link>
        <Button className="h-11 rounded-xl" onClick={handleLogout} type="button" variant="outline">
          <LogOut aria-hidden="true" className="h-5 w-5" />
          Đăng nhập lại
        </Button>
      </div>
    </AuthShell>
  );
};
