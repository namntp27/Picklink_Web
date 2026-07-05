import { useEffect, useRef, useState } from 'react';
import {
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  UserRound,
  X,
} from 'lucide-react';
import {
  getPublicPlayerProfile,
  type PublicPlayerProfile,
} from '../../../api/profile';

type PlayerProfileDialogProps = {
  fallbackAvatarUrl?: string | null;
  fallbackName: string;
  onClose: () => void;
  playerId: number;
  roleLabel?: string;
};

export const PlayerProfileDialog = ({
  fallbackAvatarUrl,
  fallbackName,
  onClose,
  playerId,
  roleLabel = 'Chủ phòng',
}: PlayerProfileDialogProps) => {
  const [profile, setProfile] = useState<PublicPlayerProfile | null>(null);
  const [error, setError] = useState('');
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    getPublicPlayerProfile(playerId, { signal: controller.signal })
      .then((result) => {
        setProfile(result);
        setError('');
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : 'Không thể tải thông tin người chơi.');
      });

    return () => controller.abort();
  }, [playerId]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const name = profile?.username || fallbackName;
  const avatarUrl = profile?.profileImageUrl || fallbackAvatarUrl;
  const location = [profile?.commune, profile?.city].filter(Boolean).join(', ');
  const details = [
    { icon: UserRound, label: 'Phong cách chơi', value: profile?.playerSubType },
    { icon: Sparkles, label: 'Tần suất', value: profile?.playFrequency },
    { icon: Clock3, label: 'Khung giờ yêu thích', value: profile?.preferredTimeSlot },
  ].filter((item) => item.value);

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-[#081d24]/65 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="player-profile-title"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-xl border border-[#d8e4d4] bg-white shadow-[0_24px_70px_rgba(8,29,36,0.24)]"
        role="dialog"
      >
        <header className="relative border-b border-[#d8e4d4] bg-[#f3f8f0] px-5 py-5">
          <button
            aria-label="Đóng hồ sơ"
            className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-[#66756b] transition-colors hover:bg-white hover:text-[#0b2228] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#477313]/50"
            onClick={onClose}
            ref={closeButtonRef}
            title="Đóng"
            type="button"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>

          <div className="flex items-center gap-3 pr-9">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl border-2 border-white bg-[#dfead9] text-[20px] font-extrabold text-[#477313] shadow-[0_5px_14px_rgba(8,29,36,0.1)]">
              {avatarUrl ? (
                <img alt={`Ảnh đại diện của ${name}`} className="h-full w-full object-cover" src={avatarUrl} />
              ) : (
                <span aria-hidden="true">{name.charAt(0).toUpperCase() || '?'}</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-extrabold uppercase text-[#477313]">{roleLabel}</p>
              <h2 className="truncate text-[20px] font-extrabold leading-7 text-[#0b2228]" id="player-profile-title">
                {name}
              </h2>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-[#718077]">
                <MapPin aria-hidden="true" className="h-3 w-3" />
                {location || 'Chưa cập nhật khu vực'}
              </p>
            </div>
          </div>
        </header>

        <div className="p-5">
          {!profile && !error && (
            <div aria-label={`Đang tải thông tin ${roleLabel.toLocaleLowerCase('vi-VN')}`} className="animate-pulse motion-reduce:animate-none" role="status">
              <div className="grid grid-cols-3 divide-x divide-[#d8e4d4] rounded-lg border border-[#d8e4d4] bg-[#fbfcfa] py-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div className="px-3 text-center" key={index}>
                    <div className="mx-auto h-5 w-8 rounded bg-[#dfe8dc]" />
                    <div className="mx-auto mt-2 h-2.5 w-12 rounded bg-[#e8efe5]" />
                  </div>
                ))}
              </div>
              <div className="mt-4 h-20 rounded-lg bg-[#f0f5ed]" />
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-[12px] font-semibold text-red-700" role="alert">
              {error}
            </div>
          )}

          {profile && (
            <>
              <div className="grid grid-cols-3 divide-x divide-[#d8e4d4] rounded-lg border border-[#d8e4d4] bg-[#fbfcfa] py-3">
                <div className="px-2 text-center">
                  <strong className="block text-[17px] text-[#0b2228]">{profile.skillLevel.toFixed(1)}</strong>
                  <span className="text-[10px] font-bold text-[#718077]">Trình độ</span>
                </div>
                <div className="px-2 text-center">
                  <strong className="block text-[17px] text-[#0b2228]">{profile.prestige}</strong>
                  <span className="text-[10px] font-bold text-[#718077]">Uy tín</span>
                </div>
                <div className="px-2 text-center">
                  <strong className="block text-[17px] text-[#0b2228]">{profile.matchesPlayed}</strong>
                  <span className="text-[10px] font-bold text-[#718077]">Trận đã chơi</span>
                </div>
              </div>

              {profile.bio && (
                <p className="mt-4 text-[12px] leading-5 text-[#526158]">{profile.bio}</p>
              )}

              {details.length > 0 && (
                <div className="mt-4 divide-y divide-[#e2eae0] border-y border-[#e2eae0]">
                  {details.map(({ icon: Icon, label, value }) => (
                    <div className="flex items-center gap-3 py-2.5" key={label}>
                      <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-[#477313]" />
                      <span className="min-w-0 flex-1 text-[11px] font-semibold text-[#718077]">{label}</span>
                      <span className="max-w-[52%] text-right text-[11px] font-bold text-[#0b2228]">{value}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-center gap-1.5 text-[10px] font-bold text-[#718077]">
                <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" />
                Hồ sơ người chơi Picklink
                <Trophy aria-hidden="true" className="h-3.5 w-3.5 text-[#477313]" />
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
