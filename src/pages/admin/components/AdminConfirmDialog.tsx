import { AlertTriangle, X } from 'lucide-react';
import type { AdminConfig, AdminRow } from '../types';

export type AdminActionTarget = {
  action: string;
  config: AdminConfig;
  row?: AdminRow | null;
};

const dangerousActionKeywords = [
  'khóa',
  'mở khóa',
  'từ chối',
  'ẩn',
  'xóa',
  'hoàn tiền',
  'duyệt hoàn',
];

export const isDangerousAdminAction = (action: string) => {
  const normalizedAction = action.trim().toLowerCase();
  return dangerousActionKeywords.some((keyword) => normalizedAction.includes(keyword));
};

const getActionMessage = (target: AdminActionTarget) => {
  const action = target.action.toLowerCase();

  if (action.includes('hoàn') || action.includes('duyệt hoàn')) {
    return 'Thao tác này có thể ảnh hưởng tới giao dịch, đối soát và số dư hoàn tiền.';
  }

  if (action.includes('xóa')) {
    return 'Thao tác xóa nên được ghi nhận như xóa mềm để giữ lịch sử kiểm duyệt.';
  }

  if (action.includes('ẩn')) {
    return 'Nội dung sẽ không còn hiển thị với người dùng sau khi xác nhận.';
  }

  if (action.includes('khóa')) {
    return 'Đối tượng liên quan có thể bị hạn chế truy cập hoặc ngừng hoạt động.';
  }

  if (action.includes('từ chối')) {
    return 'Yêu cầu sẽ bị từ chối và cần ghi nhận lý do xử lý trong nhật ký.';
  }

  return 'Thao tác này có tác động vận hành, hãy kiểm tra kỹ trước khi xác nhận.';
};

export const AdminConfirmDialog = ({
  target,
  onCancel,
  onConfirm,
}: {
  target: AdminActionTarget | null;
  onCancel: () => void;
  onConfirm: (target: AdminActionTarget) => void;
}) => {
  if (!target) {
    return null;
  }

  const title = target.row?.cells[0] ?? target.config.title;
  const subtitle = target.row?.cells.slice(1, 3).filter(Boolean).join(' • ') ?? target.config.description;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        aria-label="Đóng xác nhận"
        className="absolute inset-0 h-full w-full cursor-default bg-black/50"
        onClick={onCancel}
        type="button"
      />

      <section
        aria-labelledby="admin-confirm-title"
        aria-modal="true"
        className="relative w-full max-w-[520px] rounded-xl border border-error/30 bg-surface-container-lowest p-5 shadow-2xl"
        role="dialog"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="rounded-lg bg-error-container p-2 text-error">
              <AlertTriangle className="h-6 w-6" />
            </span>
            <div>
              <p className="text-[12px] font-bold uppercase tracking-[0.12em] text-error">Xác nhận thao tác</p>
              <h2 id="admin-confirm-title" className="mt-1 text-[24px] font-bold leading-tight text-on-background">
                {target.action}
              </h2>
            </div>
          </div>
          <button
            aria-label="Đóng"
            className="rounded-lg border border-outline-variant p-2 text-secondary transition-colors hover:border-error hover:text-error"
            onClick={onCancel}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-lg border border-outline-variant bg-surface p-4">
          <p className="text-[13px] font-bold text-secondary">Đối tượng</p>
          <p className="mt-1 text-[16px] font-bold text-on-background">{title}</p>
          <p className="mt-1 text-[13px] leading-5 text-secondary">{subtitle}</p>
        </div>

        <p className="mt-4 text-[14px] leading-6 text-secondary">{getActionMessage(target)}</p>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className="rounded-lg border border-outline-variant px-4 py-2.5 text-[14px] font-bold text-secondary transition-colors hover:border-primary hover:text-primary"
            onClick={onCancel}
            type="button"
          >
            Hủy
          </button>
          <button
            className="rounded-lg bg-error px-4 py-2.5 text-[14px] font-bold text-white transition-opacity hover:opacity-90"
            onClick={() => onConfirm(target)}
            type="button"
          >
            Xác nhận
          </button>
        </div>
      </section>
    </div>
  );
};
