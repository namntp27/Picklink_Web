import { useEffect, useRef, useState } from 'react';

const HOURS = Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0'));
const MINUTES = ['00', '30'];
const VISIBLE_HOUR_ROWS = 6;

const HourDropdown = ({ value, onChange, disabled }: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        aria-expanded={open}
        aria-label="Giờ"
        className="w-16 rounded-lg border border-outline-variant px-2 py-1.5 text-center disabled:opacity-50"
        disabled={disabled}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {value}
      </button>
      {open && (
        <div
          className="absolute z-10 mt-1 w-16 overflow-y-auto rounded-lg border border-outline-variant bg-surface shadow-lg"
          style={{ maxHeight: `${VISIBLE_HOUR_ROWS * 2}rem` }}
        >
          {HOURS.map((item) => (
            <button
              className={`block w-full px-2 py-1.5 text-center hover:bg-surface-container-low ${item === value ? 'bg-surface-container-low font-bold' : ''}`}
              key={item}
              onClick={() => { onChange(item); setOpen(false); }}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const HalfHourTimeSelect = ({ value, onChange, disabled }: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const [hour, minute] = value.split(':');
  return (
    <div className="flex gap-1.5">
      <HourDropdown disabled={disabled} onChange={(item) => onChange(`${item}:${minute}`)} value={hour} />
      <select
        aria-label="Phút"
        className="w-16 text-center"
        disabled={disabled}
        onChange={(event) => onChange(`${hour}:${event.target.value}`)}
        value={minute}
      >
        {MINUTES.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </div>
  );
};
