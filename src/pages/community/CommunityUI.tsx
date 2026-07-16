import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Bookmark,
  Flame,
  Home,
  Settings,
  TrendingUp,
  Users,
  UserRound,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getMyProfile, type PlayerProfile } from '../../api/profile';
import { getOutstandingPlayers, type OutstandingPlayer } from '../../api/community';
import './community.css';

type CommunityPageProps = {
  children: ReactNode;
  className?: string;
};

type CommunityHeroProps = {
  actions?: ReactNode;
  backLink?: { label: string; to: string };
  description: string;
  icon: LucideIcon;
  label: string;
  stats?: ReactNode;
  title: string;
};

const feedLinks: Array<{ label: string; icon: LucideIcon; to: string }> = [
  { label: 'Bảng tin', icon: Home, to: '/posts' },
  { label: 'Câu lạc bộ', icon: Users, to: '/posts/clubs' },
  { label: 'Cài đặt', icon: Settings, to: '/profile' },
];

export const CommunityPage = ({ children, className = '' }: CommunityPageProps) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`community-root ${className}`}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : 0.24,
        ease: [0.2, 0.8, 0.2, 1],
      }}
    >
      {children}
    </motion.div>
  );
};

export const CommunityHero = ({
  actions,
  backLink,
  description,
  icon: Icon,
  label,
  stats,
  title,
}: CommunityHeroProps) => (
  <section className="community-hero">
    <div className="community-hero__inner">
      <div className="min-w-0">
        {backLink && (
          <Link className="community-back-link" to={backLink.to}>
            <span aria-hidden="true">←</span>
            {backLink.label}
          </Link>
        )}
        <p className="community-kicker">
          <Icon aria-hidden="true" className="h-4 w-4" />
          {label}
        </p>
        <h1 className="community-hero__title">{title}</h1>
        <p className="community-hero__description">{description}</p>
        {actions && <div className="community-hero__actions">{actions}</div>}
      </div>
      {stats && <div className="community-hero__stats">{stats}</div>}
    </div>
  </section>
);

export const CommunityFeedNav = ({ activePath }: { activePath: string }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);

  useEffect(() => {
    if (token && user?.role === 'player') {
      getMyProfile(token)
        .then(setProfile)
        .catch(() => {});
    }
  }, [token, user]);

  const name = user?.name || '';
  const avatarUrl = user?.avatar || profile?.profileImageUrl;

  let levelLabel = '';
  if (user) {
    if (user.role === 'player') {
      const levelStr = profile?.skillLevel != null ? profile.skillLevel.toFixed(1) : 'Chưa cập nhật';
      levelLabel = `Trình độ ${levelStr}`;
    } else if (user.role === 'owner') {
      levelLabel = 'Chủ sân';
    } else if (user.role === 'admin') {
      levelLabel = 'Quản trị viên';
    } else if (user.role === 'staff') {
      levelLabel = 'Nhân viên';
    }
  }

  return (
    <aside className="community-feed-nav">
      {isAuthenticated ? (
        <div className="community-profile-chip">
          {avatarUrl ? (
            <img
              alt={name}
              className="community-avatar community-avatar--lg"
              src={avatarUrl}
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#e0e9dc] text-[#477313]">
              <UserRound className="h-6 w-6" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold text-[#0b2228]" title={name}>
              {name}
            </p>
            <p className="mt-0.5 text-[12px] font-semibold text-[#66756b]">
              {levelLabel}
            </p>
          </div>
        </div>
      ) : (
        <div className="community-profile-chip">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#e0e9dc] text-[#477313]">
            <UserRound aria-hidden="true" className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold text-[#0b2228]">Khách</p>
            <Link className="mt-0.5 block text-[12px] font-semibold text-[#477313] hover:underline" to="/login">
              Đăng nhập để tham gia
            </Link>
          </div>
        </div>
      )}

      <nav aria-label="Điều hướng cộng đồng" className="community-feed-nav__links">
        {feedLinks.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.to;

          return (
            <Link
              aria-current={isActive ? 'page' : undefined}
              className={`community-feed-nav__link ${isActive ? 'is-active' : ''}`}
              key={item.to}
              to={item.to}
            >
              <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export const CommunityInsights = () => {
  const { token } = useAuth();
  const [players, setPlayers] = useState<OutstandingPlayer[]>([]);

  useEffect(() => {
    let cancelled = false;
    getOutstandingPlayers(token)
      .then((data) => {
        if (!cancelled) {
          setPlayers(data);
        }
      })
      .catch((err) => {
        console.error('Failed to load outstanding players:', err);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const displayPlayers = players.map((player) => ({
    userId: player.userId,
    name: player.name,
    level: player.level,
    avatar: player.avatar,
  }));

  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <aside className="community-insights">
      <section className="community-panel p-4 mb-4">
        <div className="relative">
          <Search aria-hidden="true" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718077]" />
          <input
            aria-label="Tìm bài viết"
            className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#d8e4d4] bg-[#f4f8f2] text-[13px] font-semibold text-[#0b2228] placeholder-[#718077]/70 outline-none focus:border-[#477313] focus:ring-1 focus:ring-[#477313]"
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                setSearchParams({ search: val });
              } else {
                setSearchParams({});
              }
            }}
            placeholder="Tìm bài viết, tiêu đề, hashtag..."
            type="text"
            value={searchParams.get('search') || ''}
          />
        </div>
      </section>


      <section className="community-panel p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-[15px] font-extrabold text-[#0b2228]">Người chơi nổi bật</h2>
          <Users aria-hidden="true" className="h-[18px] w-[18px] text-[#477313]" />
        </div>
        <div className="grid gap-3">
          {displayPlayers.length === 0 && (
            <p className="text-[12px] font-semibold text-[#718077]">Chưa có dữ liệu người chơi nổi bật.</p>
          )}
          {displayPlayers.map((player) => (
            <div className="flex items-center gap-3" key={player.userId}>
              {player.avatar ? (
                <img alt={player.name} className="community-avatar" decoding="async" loading="lazy" src={player.avatar} />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e0e9dc] text-[#477313]">
                  <UserRound className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-extrabold text-[#0b2228]">{player.name}</p>
                <p className="text-[11px] font-semibold text-[#718077]">Trình độ {player.level}</p>
              </div>
              <Link
                aria-label={`Nhắn tin với ${player.name}`}
                className="community-icon-button h-8 w-8 flex items-center justify-center text-lg text-[#477313] hover:bg-[#e0e9dc]"
                title={`Nhắn tin với ${player.name}`}
                to={`/messages?chatWithUserId=${player.userId}`}
              >
                <span className="text-base leading-none">💬</span>
              </Link>
            </div>
          ))}
        </div>
      </section>
    </aside>
  );
};

export const CommunityFeedShell = ({
  activePath,
  children,
}: {
  activePath: string;
  children: ReactNode;
}) => {
  const usesHeroPanels = activePath === '/posts';

  return (
    <div className={`community-feed-shell ${usesHeroPanels ? 'community-feed-shell--hero-panels' : ''}`}>
      <CommunityFeedNav activePath={activePath} />
      <main className="community-feed-main">{children}</main>
      <CommunityInsights />
    </div>
  );
};

export const CommunityEmptyState = ({
  action,
  description,
  icon: Icon,
  title,
}: {
  action?: ReactNode;
  description: string;
  icon: LucideIcon;
  title: string;
}) => (
  <div className="community-empty">
    <span className="community-empty__icon">
      <Icon aria-hidden="true" className="h-6 w-6" />
    </span>
    <h2>{title}</h2>
    <p>{description}</p>
    {action}
  </div>
);
