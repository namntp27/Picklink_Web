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
            className="pointer-events-none absolute left-3.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-outline"
          >
            {icon}
          </span>
        )}
        <input
          className={cn(
            'picklink-glow-control flex h-12 w-full min-w-0 rounded-lg border border-outline-variant bg-surface-container px-3.5 py-2.5 text-[14px] leading-5 text-on-surface shadow-[0_1px_0_rgba(25,29,20,0.02)]',
            'placeholder:text-outline',
            'transition-[border-color,box-shadow,background-color] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
            'hover:border-outline',
            'focus:border-primary-container focus:bg-surface-container focus:outline-none focus:ring-1 focus:ring-primary-container/30',
            'aria-[invalid=true]:border-error aria-[invalid=true]:focus:border-error aria-[invalid=true]:focus:ring-error/20',
            'read-only:bg-surface-container-low read-only:text-on-surface-variant',
            'disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:text-on-surface-variant disabled:opacity-55',
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
