import * as React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, type, ...props }, ref) => {
    return (
      <div className="relative w-full min-w-0">
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#60665C]"
          >
            {icon}
          </span>
        )}
        <input
          className={cn(
            'flex h-12 w-full min-w-0 rounded-lg border border-[#D8DED1] bg-white px-3.5 py-2.5 text-[14px] leading-5 text-[#171A16] shadow-[0_1px_0_rgba(23,26,22,0.02)]',
            'placeholder:text-[#60665C]/70',
            'transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            'hover:border-primary/40',
            'focus:border-primary focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary/25',
            'aria-[invalid=true]:border-[#B42318] aria-[invalid=true]:focus:border-[#B42318] aria-[invalid=true]:focus:ring-[#B42318]/20',
            'read-only:bg-[#F7F8F3] read-only:text-[#60665C]',
            'disabled:cursor-not-allowed disabled:bg-[#F7F8F3] disabled:text-[#60665C] disabled:opacity-55',
            icon && 'pl-11',
            className,
          )}
          ref={ref}
          type={type}
          {...props}
        />
      </div>
    );
  },
);

Input.displayName = 'Input';

export { Input };
