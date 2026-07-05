import React, { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronDown } from 'lucide-react';

export interface DropdownOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

export interface DropdownProps<T extends string> {
  options: readonly DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  triggerClassName?: string;
  dropdownClassName?: string;
  align?: 'left' | 'right';
}

export const Dropdown = <T extends string>({
  options,
  value,
  onChange,
  triggerClassName = '',
  dropdownClassName = '',
  align = 'right',
}: DropdownProps<T>) => {
  const [isOpen, setIsOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`picklink-glow-control flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-low hover:bg-surface-container text-label-md font-label-md text-on-surface font-semibold shadow-sm transition-all outline-none ${triggerClassName}`}
        type="button"
      >
        <span>{selectedOption?.label ?? value}</span>
        <ChevronDown
          className={`w-[16px] h-[16px] text-outline transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <button
          aria-label="Đóng danh sách"
          className="picklink-no-glow fixed inset-0 z-40 cursor-default"
          onClick={() => setIsOpen(false)}
          type="button"
        />
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className={`absolute z-50 mt-2 w-52 rounded-lg border border-outline-variant bg-white p-1 shadow-[0_18px_42px_rgba(8,29,36,0.14)] ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${dropdownClassName}`}
            exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98, y: -5 }}
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: -7 }}
            transition={{ duration: shouldReduceMotion ? 0.01 : 0.18, ease: [0.2, 0.8, 0.2, 1] }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`picklink-glow-control w-full text-left px-3 py-2 text-label-md rounded-md transition-colors ${
                  value === option.value
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
