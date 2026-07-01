import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import {
  AuthCardHeader,
  AuthShell,
  authPrimaryButtonClass,
} from './AuthShell';

export const NotFound = () => {
  return (
    <AuthShell
      subtitle="Đường dẫn có thể đã đổi, hoặc bạn đang mở một trang không còn tồn tại trong Picklink."
      title="Không tìm thấy trang."
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef8e6] text-primary">
        <SearchX aria-hidden="true" className="h-7 w-7" />
      </div>

      <div className="mt-5 text-center">
        <p className="mb-2 font-mono text-[13px] font-black text-primary">404</p>
        <AuthCardHeader
          subtitle="Đường dẫn này không tồn tại hoặc đã được chuyển sang vị trí khác."
          title="Không tìm thấy trang"
        />
      </div>

      <Link
        className={`mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-[14px] font-black transition-[background-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70 active:translate-y-px active:scale-[0.99] ${authPrimaryButtonClass}`}
        to="/"
      >
        <ArrowLeft aria-hidden="true" className="h-5 w-5" />
        Về trang chủ
      </Link>
    </AuthShell>
  );
};
