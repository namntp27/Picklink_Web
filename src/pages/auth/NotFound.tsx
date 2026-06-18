import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';

export const NotFound = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f9f9ff] px-4 text-on-surface">
    <section className="w-full max-w-lg rounded-lg border border-outline-variant bg-white p-6 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <SearchX className="h-7 w-7" />
      </div>
      <p className="mt-5 text-[13px] font-bold uppercase text-primary">404</p>
      <h1 className="mt-2 text-[28px] font-bold leading-tight">Không tìm thấy trang</h1>
      <p className="mt-3 text-[15px] leading-6 text-on-surface-variant">
        Đường dẫn này không tồn tại hoặc đã được chuyển sang vị trí khác.
      </p>
      <Link
        className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-[14px] font-bold text-white hover:bg-primary/90"
        to="/"
      >
        <ArrowLeft className="h-5 w-5" />
        Về trang chủ
      </Link>
    </section>
  </div>
);
