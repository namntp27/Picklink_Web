import { useEffect } from 'react';
import {
  ClipboardCheck,
  FileText,
  History,
  ShieldCheck,
  X,
} from 'lucide-react';
import type { AdminConfig, AdminDataSectionId, AdminRow } from '../types';
import { isDangerousAdminAction } from './AdminConfirmDialog';
import { StatusBadge } from './StatusBadge';

type DetailCopy = {
  subject: string;
  description: string;
  checkpoints: string[];
  auditTrail: string[];
};

const detailCopy: Record<AdminDataSectionId, DetailCopy> = {
  overview: {
    subject: 'Việc vận hành',
    description: 'Theo dõi đầu việc, người phụ trách, SLA và trạng thái xử lý hiện tại.',
    checkpoints: ['Kiểm tra mức ưu tiên và SLA', 'Xem nhóm phụ trách', 'Ghi nhận quyết định xử lý'],
    auditTrail: ['Tạo luồng xử lý tự động', 'Cập nhật trạng thái gần nhất', 'Đồng bộ vào hàng chờ vận hành'],
  },
  users: {
    subject: 'Người dùng',
    description: 'Xem hồ sơ, vai trò, trạng thái xác minh và các thao tác an toàn tài khoản.',
    checkpoints: ['Xác minh email/số điện thoại', 'Kiểm tra vai trò và lịch sử khóa', 'Đối chiếu báo cáo liên quan'],
    auditTrail: ['Ghi nhận đăng nhập gần nhất', 'Cập nhật hồ sơ tài khoản', 'Theo dõi thay đổi quyền'],
  },
  courts: {
    subject: 'Sân',
    description: 'Kiểm tra hồ sơ sân, chủ sân, địa chỉ, số sân con và trạng thái kiểm duyệt.',
    checkpoints: ['Xem ảnh và địa chỉ sân', 'Đối chiếu thông tin chủ sân', 'Kiểm tra lý do khóa hoặc chờ duyệt'],
    auditTrail: ['Chủ sân cập nhật hồ sơ', 'Admin kiểm tra thông tin vận hành', 'Ghi nhận trạng thái kiểm duyệt'],
  },
  clubs: {
    subject: 'Câu lạc bộ',
    description: 'Theo dõi CLB, chủ nhiệm, thành viên, báo cáo và trạng thái kiểm duyệt.',
    checkpoints: ['Kiểm tra chủ nhiệm CLB', 'Xem số báo cáo mở', 'Đánh giá mức độ rủi ro cộng đồng'],
    auditTrail: ['CLB cập nhật nội dung', 'Admin xử lý báo cáo', 'Ghi nhận cảnh báo gần nhất'],
  },
  bookings: {
    subject: 'Booking',
    description: 'Xem mã đơn, người đặt, sân, thời gian, thanh toán và tranh chấp nếu có.',
    checkpoints: ['Đối chiếu trạng thái thanh toán', 'Kiểm tra lịch sân liên quan', 'Xem yêu cầu hỗ trợ/hoàn tiền'],
    auditTrail: ['Khởi tạo booking', 'Cập nhật thanh toán', 'Ghi nhận check-in hoặc hủy lịch'],
  },
  reports: {
    subject: 'Báo cáo',
    description: 'Xem loại báo cáo, đối tượng bị báo cáo, người gửi và mức độ ưu tiên.',
    checkpoints: ['Phân loại nội dung vi phạm', 'Kiểm tra bằng chứng liên quan', 'Ghi kết quả xử lý cho người gửi'],
    auditTrail: ['Tạo báo cáo từ người dùng', 'Đưa vào hàng chờ kiểm duyệt', 'Cập nhật kết quả xử lý'],
  },
  posts: {
    subject: 'Bài viết',
    description: 'Xem bài viết cộng đồng, tác giả, chủ đề, tương tác và số báo cáo.',
    checkpoints: ['Kiểm tra nội dung/hashtag', 'Xem lịch sử báo cáo', 'Quyết định hiển thị, ẩn hoặc ghim'],
    auditTrail: ['Bài viết được tạo', 'Cập nhật tương tác', 'Ghi nhận trạng thái kiểm duyệt'],
  },
  reviews: {
    subject: 'Đánh giá',
    description: 'Xem đối tượng được đánh giá, người đánh giá, điểm số, nội dung và báo cáo.',
    checkpoints: ['Kiểm tra nội dung đánh giá', 'Đối chiếu bằng chứng nếu bị báo cáo', 'Quyết định hiển thị hoặc ẩn'],
    auditTrail: ['Người dùng gửi đánh giá', 'Hệ thống quét spam', 'Admin cập nhật trạng thái'],
  },
  tournaments: {
    subject: 'Giải đấu',
    description: 'Xem thông tin giải, đơn vị tổ chức, địa điểm, đăng ký và trạng thái vận hành.',
    checkpoints: ['Kiểm tra điều lệ giải', 'Xem trạng thái đăng ký', 'Theo dõi lịch thi đấu/kết quả'],
    auditTrail: ['Tạo hồ sơ giải đấu', 'Cập nhật đăng ký', 'Ghi nhận kết quả hoặc đối soát'],
  },
  transactions: {
    subject: 'Giao dịch',
    description: 'Xem mã giao dịch, nguồn tiền, liên kết booking/giải đấu, số tiền và cổng thanh toán.',
    checkpoints: ['Đối chiếu mã giao dịch', 'Kiểm tra trạng thái cổng thanh toán', 'Xác minh hoàn tiền/đối soát'],
    auditTrail: ['Tạo giao dịch', 'Cập nhật từ cổng thanh toán', 'Ghi nhận đối soát tài chính'],
  },
};

export const AdminDetailDrawer = ({
  config,
  row,
  onClose,
  onActionSelect,
}: {
  config: AdminConfig;
  row: AdminRow | null;
  onClose: () => void;
  onActionSelect?: (row: AdminRow, action: string) => void;
}) => {
  useEffect(() => {
    if (!row) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, row]);

  if (!row) {
    return null;
  }

  const copy = detailCopy[config.id];
  const title = row.cells[0] ?? row.id;
  const subtitle = row.cells.slice(1, 3).filter(Boolean).join(' • ');
  const fields = config.columns.map((column, index) => ({
    label: column,
    value: row.cells[index] ?? '-',
  }));

  return (
    <div className="fixed inset-0 z-[80]">
      <button
        aria-label="Đóng chi tiết"
        className="absolute inset-0 h-full w-full cursor-default bg-black/40"
        onClick={onClose}
        type="button"
      />

      <aside
        aria-labelledby="admin-detail-title"
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-[720px] flex-col overflow-hidden bg-surface-container-lowest shadow-2xl"
        role="dialog"
      >
        <header className="sticky top-0 z-10 border-b border-outline-variant bg-surface-container-lowest px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-primary">
                Chi tiết {copy.subject}
              </p>
              <h2 id="admin-detail-title" className="mt-1 text-[26px] font-bold leading-tight text-on-background">
                {title}
              </h2>
              {subtitle && <p className="mt-1 text-[14px] text-secondary">{subtitle}</p>}
            </div>
            <button
              aria-label="Đóng"
              className="rounded-lg border border-outline-variant p-2 text-secondary transition-colors hover:border-primary hover:text-primary"
              onClick={onClose}
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <StatusBadge tone={row.statusTone}>{row.status}</StatusBadge>
            <span className="rounded-full bg-surface px-2.5 py-1 text-[12px] font-bold text-secondary">
              ID: {row.id}
            </span>
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto p-5">
          <section className="rounded-xl border border-outline-variant bg-surface p-5">
            <div className="flex items-start gap-3">
              <span className="rounded-lg bg-primary-container/25 p-2 text-primary">
                <FileText className="h-5 w-5" />
              </span>
              <div>
                <h3 className="text-[18px] font-bold text-on-background">Thông tin chính</h3>
                <p className="mt-1 text-[14px] leading-6 text-secondary">{copy.description}</p>
              </div>
            </div>

            <dl className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.label} className="rounded-lg border border-outline-variant bg-surface-container-lowest p-4">
                  <dt className="text-[12px] font-bold uppercase tracking-[0.08em] text-secondary">{field.label}</dt>
                  <dd className="mt-1 text-[15px] font-bold text-on-background">{field.value}</dd>
                </div>
              ))}
            </dl>

            {row.note && (
              <div className="mt-3 rounded-lg border border-secondary/20 bg-secondary-container/30 p-4 text-[14px] leading-6 text-secondary">
                {row.note}
              </div>
            )}
          </section>

          <section className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-outline-variant bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-primary" />
                <h3 className="text-[18px] font-bold text-on-background">Cần kiểm tra</h3>
              </div>
              <ul className="space-y-3">
                {copy.checkpoints.map((item) => (
                  <li key={item} className="flex gap-3 text-[14px] leading-5 text-secondary">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-outline-variant bg-surface p-5">
              <div className="mb-4 flex items-center gap-2">
                <History className="h-5 w-5 text-primary" />
                <h3 className="text-[18px] font-bold text-on-background">Nhật ký gần đây</h3>
              </div>
              <div className="space-y-3">
                {copy.auditTrail.map((item, index) => (
                  <div key={item} className="border-l-2 border-primary/40 pl-3">
                    <p className="text-[14px] font-bold text-on-background">{item}</p>
                    <p className="mt-0.5 text-[12px] text-secondary">Bước {index + 1}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-5 rounded-xl border border-outline-variant bg-surface p-5">
            <h3 className="text-[18px] font-bold text-on-background">Luồng xử lý</h3>
            <div className="mt-4 flex flex-wrap gap-2">
              {row.filters.map((filter) => (
                <span key={filter} className="rounded-full bg-secondary-container px-3 py-1 text-[12px] font-bold text-secondary">
                  {filter}
                </span>
              ))}
            </div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {row.actions.map((action) => (
                <button
                  className={`rounded-lg border bg-surface-container-lowest px-4 py-3 text-left text-[13px] font-bold transition-colors ${
                    isDangerousAdminAction(action)
                      ? 'border-error/30 text-error hover:bg-error-container/60'
                      : 'border-outline-variant text-secondary hover:border-primary hover:text-primary'
                  }`}
                  key={action}
                  onClick={() => onActionSelect?.(row, action)}
                  type="button"
                >
                  {action}
                </button>
              ))}
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
};
