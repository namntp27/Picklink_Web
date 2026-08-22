import { useEffect, useState, type ReactNode } from 'react';
import { ChevronDown, ReceiptText } from 'lucide-react';

export interface ReceiptFallbackPanelProps {
  children: ReactNode;
  hasSePayConfigured?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

export const ReceiptFallbackPanel = ({
  children,
  hasSePayConfigured = true,
  defaultOpen = !hasSePayConfigured,
  className = '',
}: ReceiptFallbackPanelProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  useEffect(() => {
    if (defaultOpen) setIsOpen(true);
  }, [defaultOpen]);

  return (
  <details
    className={`group rounded-xl border border-[#dbe8d3] bg-white open:bg-[#f8fbf4] ${className}`}
    onToggle={(event) => setIsOpen(event.currentTarget.open)}
    open={isOpen}
  >
    <summary className='flex cursor-pointer list-none items-center gap-3 p-4 text-left [&::-webkit-details-marker]:hidden'>
      <span className='grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eef8e6] text-[#477313]'>
        <ReceiptText className='h-4 w-4' />
      </span>
      <span className='min-w-0 flex-1'>
        <strong className='block text-[13px] font-black text-[#0b2228]'>
          {hasSePayConfigured ? 'Chưa thấy xác nhận? Gửi biên lai' : 'Gửi biên lai để chủ sân xác nhận'}
        </strong>
        <span className='mt-1 block text-[12px] leading-5 text-[#66766d]'>
          {hasSePayConfigured
            ? 'SePay đang được ưu tiên kiểm tra tự động. Chỉ gửi biên lai nếu bạn đã thanh toán nhưng sau vài lần kiểm tra vẫn chưa thấy hệ thống phản hồi.'
            : 'Thanh toán này chưa thể đối soát tự động qua SePay. Hãy gửi ảnh biên lai để chủ sân kiểm tra.'}
        </span>
      </span>
      <ChevronDown className='h-5 w-5 shrink-0 text-[#66766d] transition-transform group-open:rotate-180' />
    </summary>
    <div className='space-y-3 border-t border-[#dbe8d3] p-4'>{children}</div>
  </details>
  );
};
