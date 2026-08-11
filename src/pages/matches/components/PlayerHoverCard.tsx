import { useId, useState, type ReactNode } from 'react';
import { getPublicPlayerProfile } from '../../../api/profile';
import { useApiQuery } from '../../../hooks/useApiQuery';

type PlayerHoverCardProps = {
  children: ReactNode;
  focusable?: boolean;
  playerId: number;
  playerName: string;
};

export const PlayerHoverCard = ({ children, focusable = true, playerId, playerName }: PlayerHoverCardProps) => {
  const [open, setOpen] = useState(false);
  const tooltipId = useId();
  const { data: profile, error, loading } = useApiQuery(
    ['public-player-hover', playerId],
    () => getPublicPlayerProfile(playerId),
    { enabled: open, errorMessage: 'Không thể tải hồ sơ người chơi.' },
  );
  const location = profile && [profile.commune, profile.city].filter(Boolean).join(', ');

  return (
    <span
      aria-describedby={focusable && open ? tooltipId : undefined}
      aria-label={focusable ? `Xem hồ sơ ${playerName}` : undefined}
      className="relative inline-flex shrink-0 cursor-help"
      onBlur={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      tabIndex={focusable ? 0 : undefined}
    >
      {children}
      {open && (
        <span
          className="pointer-events-none absolute left-0 top-full z-[100] mt-2 w-64 rounded-xl border border-[#d8e4d4] bg-white p-3 text-left shadow-xl"
          id={tooltipId}
          role="tooltip"
        >
          {loading ? (
            <span className="block text-[11px] font-semibold text-[#718077]">Đang tải hồ sơ...</span>
          ) : error || !profile ? (
            <span className="block text-[11px] font-semibold text-red-600">{error || 'Không tìm thấy hồ sơ.'}</span>
          ) : (
            <>
              <span className="block truncate text-[13px] font-extrabold text-[#0b2228]">{profile.username}</span>
              {location && <span className="mt-0.5 block truncate text-[10px] font-semibold text-[#718077]">{location}</span>}
              <span className="mt-2 grid grid-cols-3 gap-1.5">
                <span className="rounded-lg bg-[#edf5e9] p-1.5">
                  <span className="block text-[9px] font-bold text-[#718077]">Trình độ</span>
                  <span className="block text-[12px] font-extrabold text-[#477313]">{profile.skillLevel.toFixed(1)}</span>
                </span>
                <span className="rounded-lg bg-[#edf5e9] p-1.5">
                  <span className="block text-[9px] font-bold text-[#718077]">Uy tín</span>
                  <span className="block text-[12px] font-extrabold text-[#477313]">{profile.prestige.toFixed(1)} ★</span>
                </span>
                <span className="rounded-lg bg-[#edf5e9] p-1.5">
                  <span className="block text-[9px] font-bold text-[#718077]">Số trận</span>
                  <span className="block text-[12px] font-extrabold text-[#477313]">{profile.matchesPlayed}</span>
                </span>
              </span>
              {profile.bio && <span className="mt-2 line-clamp-2 block text-[10px] leading-4 text-[#526158]">{profile.bio}</span>}
            </>
          )}
        </span>
      )}
    </span>
  );
};
