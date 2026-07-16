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
  ariaLabel: string;
}

export const Dropdown = <T extends string>({
  ariaLabel,
  dropdownClassName = '',
  onChange,
  options,
  triggerClassName = '',
  value,
}: DropdownProps<T>) => (
  <select
    aria-label={ariaLabel}
    className={[
      'picklink-glow-control rounded-lg border border-outline-variant bg-surface-container-low px-3 py-1.5 text-label-md font-semibold text-on-surface shadow-sm outline-none transition-colors hover:bg-surface-container',
      triggerClassName,
      dropdownClassName,
    ].filter(Boolean).join(' ')}
    onChange={(event) => onChange(event.target.value as T)}
    value={value}
  >
    {!options.some((option) => option.value === value) && (
      <option value="">Chọn...</option>
    )}
    {options.map((option) => (
      <option key={option.value} value={option.value}>{option.label}</option>
    ))}
  </select>
);