import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginatedResponse } from '../api/client';

type PaginationControlsProps = {
  page: Pick<PaginatedResponse<unknown>, 'page' | 'pageSize' | 'totalCount' | 'totalPages'>;
  onPageChange: (page: number) => void;
};

export const PaginationControls = ({ page, onPageChange }: PaginationControlsProps) => {
  if (page.totalPages <= 1 && page.totalCount <= page.pageSize) return null;
  const firstItem = page.totalCount === 0 ? 0 : (page.page - 1) * page.pageSize + 1;
  const lastItem = Math.min(page.page * page.pageSize, page.totalCount);
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-outline-variant bg-white px-4 py-3 text-[13px] font-bold text-on-surface-variant sm:flex-row sm:items-center sm:justify-between">
      <span>
        {firstItem}-{lastItem} / {page.totalCount}
      </span>
      <div className="flex items-center gap-2">
        <button
          aria-label="Trang trước"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface disabled:cursor-not-allowed disabled:opacity-45"
          disabled={page.page <= 1}
          onClick={() => onPageChange(page.page - 1)}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="min-w-24 text-center">
          Trang {page.page}/{Math.max(page.totalPages, 1)}
        </span>
        <button
          aria-label="Trang sau"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant text-on-surface disabled:cursor-not-allowed disabled:opacity-45"
          disabled={page.page >= page.totalPages}
          onClick={() => onPageChange(page.page + 1)}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
