import { AlertTriangle, ArrowRight, RefreshCcw } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export const BookingFail = () => {
  const [params] = useSearchParams();
  const bookingId = params.get('bookingId');
  const canRetry = Boolean(bookingId && /^\d+$/.test(bookingId));
  const retryPath = canRetry ? '/checkout?bookingId=' + bookingId : '/my-bookings';

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-12 text-on-surface">
      <section className="w-full max-w-2xl rounded-2xl border border-error/25 bg-white p-6 shadow-[0_18px_50px_rgba(25,29,20,0.08)] sm:p-10" role="alert">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-error-container text-error">
          <AlertTriangle aria-hidden="true" className="h-7 w-7" />
        </span>
        <p className="mt-6 text-sm font-bold text-error">Thanh toán chưa hoàn tất</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.03em]">Chưa thể xác nhận giữ sân</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-on-surface-variant">
          Hệ thống chưa nhận được xác nhận thanh toán. Kiểm tra trạng thái đơn trước khi thử lại để tránh thanh toán hai lần.
        </p>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
            to={retryPath}
          >
            {canRetry ? 'Thử lại thanh toán' : 'Xem đơn của tôi'}
            {canRetry ? <RefreshCcw aria-hidden="true" className="h-4 w-4" /> : <ArrowRight aria-hidden="true" className="h-4 w-4" />}
          </Link>
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-outline-variant px-4 py-2.5 text-sm font-bold hover:bg-surface-container-low"
            to="/book-court"
          >
            Chọn khung giờ khác
          </Link>
        </div>
      </section>
    </main>
  );
};