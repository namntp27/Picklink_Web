import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { listProvinces, listWards, type ProvinceOption, type WardOption } from '../../api/locations';

type AdministrativeAreaSelectsProps = {
  province?: string | null;
  ward?: string | null;
  onProvinceChange: (value: string | null) => void;
  onWardChange: (value: string | null) => void;
  fieldClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  disabled?: boolean;
};

type AdministrativeOption = {
  code: string;
  name: string;
};

type AdministrativeDropdownProps = {
  label: string;
  placeholder: string;
  options: AdministrativeOption[];
  selectedCode?: string;
  disabled?: boolean;
  fieldClassName: string;
  labelClassName: string;
  selectClassName: string;
  onSelect: (code: string | null) => void;
};

const AdministrativeDropdown = ({
  label,
  placeholder,
  options,
  selectedCode,
  disabled = false,
  fieldClassName,
  labelClassName,
  selectClassName,
  onSelect,
}: AdministrativeDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const listboxId = useId();
  const selectedOption = options.find((item) => item.code === selectedCode) ?? null;

  useEffect(() => {
    if (!isOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isOpen]);

  useEffect(() => {
    if (disabled) setIsOpen(false);
  }, [disabled]);

  const choose = (code: string | null) => {
    onSelect(code);
    setIsOpen(false);
  };

  return (
    <div className={`${fieldClassName} relative`} ref={rootRef}>
      <span className={labelClassName} id={labelId}>{label}</span>
      <div className="relative min-w-0 flex-1 w-full">
        <button
          aria-controls={isOpen ? listboxId : undefined}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={label}
          className={`${selectClassName} flex items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-60`}
          disabled={disabled}
          onClick={() => setIsOpen((current) => !current)}
          type="button"
        >
          <span className="min-w-0 truncate">{selectedOption?.name ?? placeholder}</span>
          <ChevronDown aria-hidden="true" className={`h-4 w-4 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div
            aria-labelledby={labelId}
            className="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-52 overflow-y-auto rounded-xl border border-[#d8e4d4] bg-white py-1 shadow-[0_14px_30px_rgba(8,29,36,0.16)]"
            id={listboxId}
            role="listbox"
          >
            <button
              aria-selected={!selectedCode}
              className="block min-h-10 w-full px-3 py-2 text-left text-[13px] font-semibold text-[#718077] hover:bg-[#edf5e9]"
              onClick={() => choose(null)}
              role="option"
              type="button"
            >
              {placeholder}
            </button>
            {options.map((item) => (
              <button
                aria-selected={item.code === selectedCode}
                className={`block min-h-10 w-full px-3 py-2 text-left text-[13px] font-semibold hover:bg-[#edf5e9] ${item.code === selectedCode ? 'bg-[#edf5e9] text-[#0b2228]' : 'text-[#26342d]'}`}
                key={item.code}
                onClick={() => choose(item.code)}
                role="option"
                type="button"
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const AdministrativeAreaSelects = ({
  province,
  ward,
  onProvinceChange,
  onWardChange,
  fieldClassName = '',
  labelClassName = '',
  selectClassName = '',
  disabled = false,
}: AdministrativeAreaSelectsProps) => {
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [wards, setWards] = useState<WardOption[]>([]);
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false);
  const [isLoadingWards, setIsLoadingWards] = useState(false);

  const selectedProvince = useMemo(
    () => provinces.find((item) => item.name === province) ?? null,
    [province, provinces],
  );
  const selectedWard = useMemo(
    () => wards.find((item) => item.name === ward) ?? null,
    [ward, wards],
  );
  const selectedProvinceCode = selectedProvince?.code;
  const provincePlaceholder = isLoadingProvinces ? 'Đang tải...' : 'Tỉnh/thành';
  const wardPlaceholder = isLoadingWards ? 'Đang tải...' : 'Xã/phường';

  useEffect(() => {
    let isMounted = true;
    setIsLoadingProvinces(true);

    listProvinces()
      .then((items) => {
        if (isMounted) setProvinces(items);
      })
      .catch(() => {
        if (isMounted) setProvinces([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingProvinces(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedProvinceCode) {
      setWards([]);
      return;
    }

    let isMounted = true;
    setIsLoadingWards(true);

    listWards(selectedProvinceCode)
      .then((items) => {
        if (isMounted) setWards(items);
      })
      .catch(() => {
        if (isMounted) setWards([]);
      })
      .finally(() => {
        if (isMounted) setIsLoadingWards(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedProvinceCode]);

  return (
    <>
      <AdministrativeDropdown
        disabled={disabled || isLoadingProvinces}
        fieldClassName={fieldClassName}
        label="Tỉnh hoặc thành phố"
        labelClassName={labelClassName}
        onSelect={(code) => {
          const nextProvince = provinces.find((item) => item.code === code);
          onProvinceChange(nextProvince?.name ?? null);
          onWardChange(null);
        }}
        options={provinces}
        placeholder={provincePlaceholder}
        selectClassName={selectClassName}
        selectedCode={selectedProvince?.code}
      />
      <AdministrativeDropdown
        disabled={disabled || !selectedProvince || isLoadingWards || wards.length === 0}
        fieldClassName={fieldClassName}
        label="Xã hoặc phường"
        labelClassName={labelClassName}
        onSelect={(code) => {
          const nextWard = wards.find((item) => item.code === code);
          onWardChange(nextWard?.name ?? null);
        }}
        options={wards}
        placeholder={wardPlaceholder}
        selectClassName={selectClassName}
        selectedCode={selectedWard?.code}
      />
    </>
  );
};