import { Search } from 'lucide-react';
import type { KeyboardEvent } from 'react';

export const submitSearchOnEnter = (
  event: Pick<KeyboardEvent<HTMLInputElement>, 'key' | 'preventDefault'>,
  onSearch: () => void,
) => {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  onSearch();
};

export const LocationSearchControls = ({
  isSearching,
  onQueryChange,
  onSearch,
  query,
}: {
  isSearching: boolean;
  onQueryChange: (value: string) => void;
  onSearch: () => void;
  query: string;
}) => (
  <div className="flex gap-2" role="search">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant" />
      <input
        className="w-full rounded-lg border border-outline-variant bg-white py-2.5 pl-9 pr-3 text-[14px] outline-none focus:border-primary"
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={(event) => submitSearchOnEnter(event, onSearch)}
        placeholder="Tìm tên đường, phường/xã, quận/huyện..."
        value={query}
      />
    </div>
    <button
      className="rounded-lg bg-primary px-4 py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
      disabled={isSearching}
      onClick={onSearch}
      type="button"
    >
      {isSearching ? 'Đang tìm...' : 'Tìm'}
    </button>
  </div>
);
