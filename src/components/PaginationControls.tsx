import { motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginatedResponse } from '../api/client';
import { Button } from './ui/Button';

type PaginationControlsProps = {
  page: Pick<PaginatedResponse<unknown>, 'page' | 'pageSize' | 'totalCount' | 'totalPages'>;
  onPageChange: (page: number) => void;
};

export const PaginationControls = ({ page, onPageChange }: PaginationControlsProps) => {
  const shouldReduceMotion = useReducedMotion();

  if (page.totalPages <= 1 && page.totalCount <= page.pageSize) return null;

  const firstItem = page.totalCount === 0 ? 0 : (page.page - 1) * page.pageSize + 1;
  const lastItem = Math.min(page.page * page.pageSize, page.totalCount);

  return (
    <nav
      aria-label="Phân trang"
      className="picklink-glow-surface flex min-w-0 flex-col gap-3 rounded-lg border border-outline-variant bg-surface-container-low px-4 py-3 text-[13px] font-semibold text-on-surface-variant sm:flex-row sm:items-center sm:justify-between"
    >
      <span className="whitespace-nowrap" aria-live="polite">
        {firstItem}-{lastItem} / {page.totalCount}
      </span>
      <div className="flex min-w-0 items-center justify-between gap-2 sm:justify-end">
        <Button
          aria-label="Trang trước"
          disabled={page.page <= 1}
          onClick={() => onPageChange(page.page - 1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronLeft aria-hidden="true" className="h-4 w-4" />
        </Button>
        <motion.span
          animate={{ opacity: 1, y: 0 }}
          aria-atomic="true"
          aria-live="polite"
          className="min-w-24 whitespace-nowrap text-center text-[13px] font-bold text-on-surface"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 3 }}
          key={page.page}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.18, ease: [0.2, 0.8, 0.2, 1] }}
        >
          Trang {page.page}/{Math.max(page.totalPages, 1)}
        </motion.span>
        <Button
          aria-label="Trang sau"
          disabled={page.page >= page.totalPages}
          onClick={() => onPageChange(page.page + 1)}
          size="icon"
          type="button"
          variant="outline"
        >
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </nav>
  );
};
