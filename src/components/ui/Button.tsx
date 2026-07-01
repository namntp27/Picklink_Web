import * as React from 'react';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      'aria-busy': ariaBusy,
      children,
      className,
      disabled,
      size = 'default',
      variant = 'default',
      ...props
    },
    ref,
  ) => {
    const isLoading = ariaBusy === true || ariaBusy === 'true';
    const childArray = React.Children.toArray(children);
    const hasLeadingElement = React.isValidElement(childArray[0]);
    const visibleChildren = isLoading && hasLeadingElement ? childArray.slice(1) : childArray;

    return (
      <button
        aria-busy={ariaBusy}
        className={cn(
          'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg text-[14px] font-semibold',
          'transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.2,0.8,0.2,1)]',
          'hover:-translate-y-px active:translate-y-px active:scale-[0.99]',
          'focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-primary/70',
          'disabled:cursor-not-allowed disabled:opacity-55 disabled:hover:translate-y-0 disabled:active:scale-100',
          {
            'border border-primary bg-primary text-white shadow-[0_5px_14px_rgba(61,106,0,0.18)] hover:border-[#315600] hover:bg-[#315600] hover:shadow-[0_7px_16px_rgba(61,106,0,0.22)]':
              variant === 'default',
            'border border-[#D8DED1] bg-white text-[#171A16] hover:border-primary/40 hover:bg-primary/5 hover:text-primary':
              variant === 'outline',
            'border border-transparent bg-transparent text-[#60665C] hover:bg-primary/5 hover:text-primary':
              variant === 'ghost',
            'border border-transparent bg-transparent px-1 text-primary underline-offset-4 shadow-none hover:text-[#315600] hover:underline':
              variant === 'link',
            'border border-[#B42318] bg-[#B42318] text-white shadow-[0_5px_14px_rgba(180,35,24,0.16)] hover:border-[#8F1C13] hover:bg-[#8F1C13]':
              variant === 'danger',
            'h-12 px-5 py-2.5': size === 'default',
            'h-11 px-4 py-2': size === 'sm',
            'h-[52px] px-7 py-3': size === 'lg',
            'h-11 w-11 p-0': size === 'icon',
          },
          className,
        )}
        disabled={disabled || isLoading}
        ref={ref}
        {...props}
      >
        {isLoading && (
          <LoaderCircle
            aria-hidden="true"
            className="h-4 w-4 shrink-0 animate-spin motion-reduce:animate-none"
          />
        )}
        {visibleChildren}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
