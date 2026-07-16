import { useEffect, useMemo, useState } from 'react';
import {
  administrativeNamesEqual,
  listProvinces,
  listWards,
  type ProvinceOption,
  type WardOption,
} from '../../api/locations';

type AdministrativeAreaSelectsProps = {
  province?: string | null;
  ward?: string | null;
  onAreaChange?: (province: string | null, ward: string | null) => void;
  onProvinceChange?: (value: string | null) => void;
  onWardChange?: (value: string | null) => void;
  fieldClassName?: string;
  labelClassName?: string;
  selectClassName?: string;
  disabled?: boolean;
};

type AdministrativeOption = { code: string; name: string };

const AdministrativeSelect = ({
  disabled,
  error,
  fieldClassName,
  label,
  labelClassName,
  onRetry,
  onSelect,
  options,
  placeholder,
  selectClassName,
  selectedCode,
}: {
  disabled: boolean;
  error: string;
  fieldClassName: string;
  label: string;
  labelClassName: string;
  onRetry: () => void;
  onSelect: (code: string | null) => void;
  options: AdministrativeOption[];
  placeholder: string;
  selectClassName: string;
  selectedCode?: string;
}) => (
  <label className={fieldClassName}>
    <span className={labelClassName}>{label}</span>
    <select
      aria-label={label}
      className={[selectClassName, 'disabled:cursor-not-allowed disabled:opacity-60'].filter(Boolean).join(' ')}
      disabled={disabled}
      onChange={(event) => onSelect(event.target.value || null)}
      value={selectedCode ?? ''}
    >
      <option value="">{placeholder}</option>
      {options.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
    </select>
    {error && (
      <span className="mt-1 flex items-center gap-2 text-[11px] font-semibold text-error" role="alert">
        {error}
        <button className="underline" onClick={onRetry} type="button">Thử lại</button>
      </span>
    )}
  </label>
);

export const AdministrativeAreaSelects = ({
  province,
  ward,
  onAreaChange,
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
  const [provinceError, setProvinceError] = useState('');
  const [wardError, setWardError] = useState('');
  const [provinceRetry, setProvinceRetry] = useState(0);
  const [wardRetry, setWardRetry] = useState(0);

  const selectedProvince = useMemo(
    () => provinces.find((item) => province && (
      administrativeNamesEqual(item.name, province)
      || administrativeNamesEqual(item.fullName, province)
    )) ?? null,
    [province, provinces],
  );
  const selectedWard = useMemo(
    () => wards.find((item) => ward && (
      administrativeNamesEqual(item.name, ward)
      || administrativeNamesEqual(item.fullName, ward)
    )) ?? null,
    [ward, wards],
  );
  const selectedProvinceCode = selectedProvince?.code;

  useEffect(() => {
    const controller = new AbortController();
    setIsLoadingProvinces(true);
    setProvinceError('');
    listProvinces(controller.signal)
      .then(setProvinces)
      .catch(() => {
        if (!controller.signal.aborted) {
          setProvinces([]);
          setProvinceError('Không thể tải tỉnh/thành.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingProvinces(false);
      });
    return () => controller.abort();
  }, [provinceRetry]);

  useEffect(() => {
    setWards([]);
    setWardError('');
    if (!selectedProvinceCode) {
      setIsLoadingWards(false);
      return undefined;
    }

    const controller = new AbortController();
    setIsLoadingWards(true);
    listWards(selectedProvinceCode, controller.signal)
      .then(setWards)
      .catch(() => {
        if (!controller.signal.aborted) setWardError('Không thể tải xã/phường.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoadingWards(false);
      });
    return () => controller.abort();
  }, [selectedProvinceCode, wardRetry]);

  return (
    <>
      <AdministrativeSelect
        disabled={disabled || isLoadingProvinces}
        error={provinceError}
        fieldClassName={fieldClassName}
        label="Tỉnh hoặc thành phố"
        labelClassName={labelClassName}
        onRetry={() => setProvinceRetry((value) => value + 1)}
        onSelect={(code) => {
          const nextProvince = provinces.find((item) => item.code === code);
          const nextProvinceName = nextProvince?.name ?? null;
          if (onAreaChange) onAreaChange(nextProvinceName, null);
          else {
            onProvinceChange?.(nextProvinceName);
            onWardChange?.(null);
          }
        }}
        options={provinces}
        placeholder={isLoadingProvinces ? 'Đang tải...' : 'Tỉnh/thành'}
        selectClassName={selectClassName}
        selectedCode={selectedProvince?.code}
      />
      <AdministrativeSelect
        disabled={disabled || !selectedProvince || isLoadingWards || wards.length === 0}
        error={wardError}
        fieldClassName={fieldClassName}
        label="Xã hoặc phường"
        labelClassName={labelClassName}
        onRetry={() => setWardRetry((value) => value + 1)}
        onSelect={(code) => {
          const nextWard = wards.find((item) => item.code === code);
          const nextWardName = nextWard?.name ?? null;
          if (onAreaChange) onAreaChange(selectedProvince?.name ?? null, nextWardName);
          else onWardChange?.(nextWardName);
        }}
        options={wards}
        placeholder={isLoadingWards ? 'Đang tải...' : 'Xã/phường'}
        selectClassName={selectClassName}
        selectedCode={selectedWard?.code}
      />
    </>
  );
};