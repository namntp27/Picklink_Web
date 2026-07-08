import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import {
  ArrowRight,
  Search,
  Activity,
  Zap,
  Star,
  Award,
  Users,
  Loader2,
  AlertCircle,
  Building2,
  Globe2,
  LockKeyhole,
  Plus,
  RefreshCw,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  getGroups,
  joinGroup,
  type CommunityGroup,
} from '../../api/community';
import { Dropdown, type DropdownOption } from '../../components/ui/Dropdown';
import { AdministrativeAreaSelects } from '../../components/location/AdministrativeAreaSelects';
import { useToast } from '../../components/ui/ToastRegion';
import './club-pages.css';

// Color gradient pairs for club cards without cover images
const cardGradients = [
  'from-[#081d24] to-[#276b3f]',
  'from-[#0b2228] to-[#477313]',
  'from-[#143f34] to-[#5f8f20]',
  'from-[#244b34] to-[#98d951]',
  'from-[#102414] to-[#477313]',
  'from-[#276b3f] to-[#86c844]',
];

const cardIcons = [Activity, Zap, Star, Award, Users, Activity];

const sortOptions: readonly DropdownOption<'newest' | 'members' | 'active'>[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'members', label: 'Nhiều thành viên nhất' },
  { value: 'active', label: 'Hoạt động sôi nổi' },
];

const filterOptions = [
  { value: 'All', label: 'Tất cả', icon: Building2 },
  { value: 'Public', label: 'Công khai', icon: Globe2 },
  { value: 'Private', label: 'Riêng tư', icon: LockKeyhole },
  { value: 'Mine', label: 'Của tôi', icon: Users },
] as const;

export const Clubs = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
  const notify = useToast();
  const shouldReduceMotion = useReducedMotion();
  const { setShowFooter } = useOutletContext<{ setShowFooter: (val: boolean) => void }>() || {};

  useEffect(() => {
    if (setShowFooter) {
      setShowFooter(true);
    }
  }, [setShowFooter]);

  // API state
  const [clubs, setClubs] = useState<CommunityGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [joiningId, setJoiningId] = useState<number | null>(null);

  // Filter & Pagination states
  const [typeFilter, setTypeFilter] = useState<'All' | 'Public' | 'Private' | 'Mine'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'members' | 'active'>('newest');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedWard, setSelectedWard] = useState('');
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const buildSearchQuery = useCallback((search: string, area: string) => `${search} ${area}`.trim(), []);
  const areaFilter = [selectedWard, selectedProvince].filter(Boolean).join(' ');

  const loadClubs = useCallback(
    async (pageNum: number = 1, replace: boolean = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const queryVal = buildSearchQuery(searchTerm, areaFilter) || undefined;
        const data = await getGroups(token, queryVal, pageNum, 3, typeFilter, sortBy);
        if (replace || pageNum === 1) {
          setClubs(data);
        } else {
          setClubs((prev) => {
            const existingIds = new Set(prev.map((c) => c.groupId));
            const newItems = data.filter((c) => !existingIds.has(c.groupId));
            return [...prev, ...newItems];
          });
        }
        setHasMore(data.length === 3);
      } catch (err: any) {
        setError(err?.message ?? 'Không thể tải danh sách câu lạc bộ.');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [token, typeFilter, sortBy, searchTerm, areaFilter, buildSearchQuery],
  );

  // Load page 1 on filter or sort change
  useEffect(() => {
    setPage(1);
    loadClubs(1, true);
  }, [token, typeFilter, sortBy, areaFilter]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || loading || loadingMore || !hasMore) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        observer.unobserve(sentinel);
        setPage((prev) => {
          const next = prev + 1;
          void loadClubs(next, false);
          return next;
        });
      }
    }, { rootMargin: '240px 0px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, loadClubs]);

  const handleSearch = (event?: React.FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setPage(1);
    loadClubs(1, true);
  };

  const handleJoin = async (groupId: number) => {
    if (!token) {
      navigate('/login');
      return;
    }
    setJoiningId(groupId);
    try {
      await joinGroup(token, groupId);
      setPage(1);
      await loadClubs(1, true);
      notify('Yêu cầu tham gia câu lạc bộ đã được gửi.', 'success');
    } catch (reason) {
      notify(reason instanceof Error ? reason.message : 'Không thể gửi yêu cầu tham gia.', 'error');
    } finally {
      setJoiningId(null);
    }
  };

  const loadedMemberCount = useMemo(
    () => clubs.reduce((total, club) => total + club.memberCount, 0),
    [clubs],
  );
  const visibleFilterOptions = isAuthenticated
    ? filterOptions
    : filterOptions.filter((option) => option.value !== 'Mine');
  const revealInitial = shouldReduceMotion ? false : { opacity: 0, y: 18 };


  return (
    <div className="min-w-0 flex-1 overflow-x-clip bg-[#f8fbf4] text-[#0b2228]" data-club-ui>
      {/* Hero Section */}
      <section
        className="relative overflow-hidden bg-[#081d24] px-4 pb-12 pt-24 text-white sm:px-6 md:pb-16 md:pt-28 lg:px-8"
        data-no-reveal
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(152,217,81,0.22),transparent_31%),radial-gradient(circle_at_88%_18%,rgba(226,255,87,0.13),transparent_25%),linear-gradient(135deg,#081d24_0%,#0f2e32_54%,#143f34_100%)]" />
          <div className="absolute inset-x-[7%] top-[118px] h-px bg-white/10" />
          <div className="absolute bottom-16 left-[8%] h-px w-[84%] bg-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-[linear-gradient(to_top,rgba(248,251,244,1),rgba(248,251,244,0))]" />
        </div>
        <div>
          <div className="relative z-10 mx-auto grid w-full max-w-[1180px] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,460px)] lg:items-center">
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              initial={revealInitial}
              transition={{ duration: shouldReduceMotion ? 0.01 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <p className="inline-flex w-fit items-center gap-2 rounded-lg border border-white/14 bg-white/8 px-3 py-2 text-[13px] font-semibold text-white/88 backdrop-blur">
                <Sparkles aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
                Cộng đồng tạo nên nhịp chơi
              </p>
              <h1 className="mt-5 max-w-[11ch] text-[clamp(2.5rem,6vw,4.85rem)] font-bold leading-[0.96] tracking-[-0.045em] text-balance">
                Tìm đúng hội. Chơi đúng nhịp.
              </h1>
              <p className="mt-5 max-w-[52ch] text-[15px] leading-7 text-white/74 md:text-[17px] md:leading-8">
                Khám phá câu lạc bộ phù hợp với khu vực, nhịp chơi và tinh thần cộng đồng của bạn.
              </p>
              <div className="mt-8 grid max-w-xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/12 bg-white/12">
                <div className="bg-[#0d2a2f]/88 p-4">
                  <p className="font-mono text-[24px] font-bold leading-none text-[#e2ff57]">
                    {loading ? '...' : clubs.length.toLocaleString('vi-VN')}
                  </p>
                  <p className="mt-1.5 text-[12px] font-medium leading-5 text-white/62">CLB đang hiển thị</p>
                </div>
                <div className="bg-[#0d2a2f]/88 p-4">
                  <p className="font-mono text-[24px] font-bold leading-none text-[#e2ff57]">
                    {loading ? '...' : loadedMemberCount.toLocaleString('vi-VN')}
                  </p>
                  <p className="mt-1.5 text-[12px] font-medium leading-5 text-white/62">thành viên kết nối</p>
                </div>
              </div>
            </motion.div>
            
            <motion.form
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="picklink-glow-surface overflow-hidden rounded-2xl border border-white/14 bg-white text-[#0b2228] shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
              initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.98, y: 22 }}
              onSubmit={handleSearch}
              transition={{ delay: shouldReduceMotion ? 0 : 0.08, duration: shouldReduceMotion ? 0.01 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <div className="border-b border-[#d8e4d4] bg-[#edf5e9] px-5 py-4">
                <p className="text-[12px] font-bold text-[#477313]">Bộ tìm kiếm cộng đồng</p>
                <h2 className="mt-1 text-[20px] font-bold tracking-[-0.025em]">Bắt đầu từ nơi bạn muốn chơi</h2>
              </div>
              <div className="grid gap-4 p-5">
                <label className="grid gap-2 text-[13px] font-semibold text-[#53645b]" htmlFor="club-search">
                  Tên câu lạc bộ
                  <span className="picklink-glow-control flex h-12 items-center gap-3 rounded-xl border border-[#d8e4d4] bg-[#fbfdf8] px-3 transition-[border-color,box-shadow] focus-within:border-[#98d951]">
                    <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-[#477313]" />
                    <input
                      className="h-full min-w-0 flex-1 border-0 bg-transparent text-[14px] font-medium text-[#0b2228] outline-none placeholder:text-[#849187]"
                      id="club-search"
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Nhập tên hoặc từ khóa"
                      type="search"
                      value={searchTerm}
                    />
                  </span>
                </label>

                <div className="grid gap-3">
                  <p className="text-[13px] font-semibold text-[#53645b]">Khu vực</p>
                  <AdministrativeAreaSelects
                    fieldClassName="grid gap-2 text-[13px] font-semibold text-[#53645b]"
                    labelClassName="text-[12px] font-bold text-[#718077]"
                    onProvinceChange={(value) => {
                      setSelectedProvince(value ?? '');
                      setSelectedWard('');
                    }}
                    onWardChange={(value) => setSelectedWard(value ?? '')}
                    province={selectedProvince}
                    selectClassName="picklink-glow-control h-12 w-full rounded-xl border border-[#d8e4d4] bg-[#fbfdf8] px-3 text-[14px] font-medium text-[#0b2228] outline-none transition-[border-color,box-shadow] focus:border-[#98d951]"
                    ward={selectedWard}
                  />
                </div>

                <button
                  className="picklink-glow-control inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#e2ff57] px-5 py-3 text-[14px] font-bold text-[#102414] shadow-[0_12px_28px_rgba(152,217,81,0.22)] transition-[background-color,transform] hover:bg-[#d6f64d] active:scale-[0.98]"
                  type="submit"
                >
                  Khám phá câu lạc bộ
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </div>
            </motion.form>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section
        className="sticky top-[72px] z-40 border-b border-[#d8e4d4] bg-[#f8fbf4]/94 px-4 py-3 shadow-[0_8px_24px_rgba(8,29,36,0.05)] backdrop-blur-xl sm:px-6 lg:px-8"
        data-no-reveal
      >
        <div className="mx-auto flex w-full max-w-[1180px] flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 scrollbar-none lg:pb-0">
            <span className="mr-1 hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#d8e4d4] bg-white text-[#477313] sm:flex">
              <SlidersHorizontal aria-hidden="true" className="h-4 w-4" />
            </span>
            {visibleFilterOptions.map((option) => {
              const Icon = option.icon;
              const active = typeFilter === option.value;

              return (
                <button
                  aria-pressed={active}
                  className={`picklink-glow-control inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-bold transition-[background-color,border-color,color,box-shadow,transform] ${
                    active
                      ? 'border-[#0b2228] bg-[#0b2228] text-white shadow-[0_10px_22px_rgba(8,29,36,0.14)]'
                      : 'border-[#d8e4d4] bg-white text-[#53645b] hover:border-[#98d951] hover:bg-[#edf5e9] hover:text-[#0b2228]'
                  }`}
                  key={option.value}
                  onClick={() => setTypeFilter(option.value)}
                  type="button"
                >
                  <Icon aria-hidden="true" className={`h-4 w-4 ${active ? 'text-[#e2ff57]' : 'text-[#477313]'}`} />
                  {option.label}
                </button>
              );
            })}
          </div>

          <div className="relative z-40 flex items-center gap-3 border-t border-[#d8e4d4] pt-3 lg:border-l lg:border-t-0 lg:pl-4 lg:pt-0">
            <span className="shrink-0 text-[12px] font-bold text-[#718077]">Sắp xếp</span>
            <div className="min-w-0 flex-1 lg:min-w-[210px]">
            <Dropdown<'newest' | 'members' | 'active'>
              onChange={setSortBy}
              options={sortOptions}
              value={sortBy}
            />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 md:py-10 lg:px-8">
        {/* Create Club call to action banner */}
        <motion.section
          className="picklink-glow-surface mb-10 grid gap-5 overflow-hidden rounded-2xl border border-[#c9dfa9] bg-[#edf5e9] p-5 shadow-[0_14px_34px_rgba(18,45,34,0.06)] sm:p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
          data-motion-managed
          initial={revealInitial}
          transition={{ duration: shouldReduceMotion ? 0.01 : 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          viewport={{ amount: 0.25, once: true }}
          whileInView={{ opacity: 1, y: 0 }}
        >
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold text-[#477313]">Dẫn dắt cộng đồng của riêng bạn</p>
            <h2 className="mt-2 text-[clamp(1.35rem,3vw,2rem)] font-bold leading-tight tracking-[-0.03em]">
              Chưa có câu lạc bộ đúng tinh thần của bạn?
            </h2>
            <p className="mt-2 max-w-[62ch] text-[14px] leading-6 text-[#53645b]">
              Tạo một không gian để thành viên kết nối, lên lịch và duy trì những buổi chơi đều đặn.
            </p>
          </div>
          <Link
            className="picklink-glow-control inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b2228] px-5 py-3 text-[14px] font-bold text-white shadow-[0_12px_28px_rgba(8,29,36,0.16)] transition-[background-color,transform] hover:bg-[#143f34] active:scale-[0.98] sm:w-auto"
            to="/clubs/create"
          >
            <Plus aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
            Tạo câu lạc bộ
          </Link>
        </motion.section>

        <div className="mb-6 max-w-3xl">
          <p className="inline-flex items-center gap-2 text-[13px] font-bold text-[#477313]">
            <Users aria-hidden="true" className="h-4 w-4" />
            Danh sách câu lạc bộ
          </p>
          <h2 className="mt-2 text-[clamp(1.75rem,4vw,2.65rem)] font-bold leading-tight tracking-[-0.04em]">
            Cộng đồng dành cho nhịp chơi của bạn
          </h2>
          {!loading && !error && (
            <p aria-live="polite" className="mt-2 text-[14px] leading-6 text-[#64736a]">
              Đang hiển thị {clubs.length.toLocaleString('vi-VN')} câu lạc bộ phù hợp với lựa chọn hiện tại.
            </p>
          )}
        </div>

        {/* Clubs Grid */}
        {loading ? (
          <div aria-label="Đang tải câu lạc bộ" className="grid gap-4 md:grid-cols-2">
            {[0, 1, 2].map((item) => (
              <article
                className={`overflow-hidden rounded-2xl border border-[#d8e4d4] bg-white ${item === 0 ? 'md:col-span-2 md:grid md:grid-cols-[1.1fr_0.9fr]' : ''}`}
                key={item}
              >
                <div className="min-h-52 animate-pulse bg-[#dce8d7]" />
                <div className="grid gap-4 p-5">
                  <div className="h-5 w-2/3 animate-pulse rounded-lg bg-[#dce8d7]" />
                  <div className="h-4 w-1/3 animate-pulse rounded-lg bg-[#edf5e9]" />
                  <div className="h-16 animate-pulse rounded-xl bg-[#edf5e9]" />
                </div>
              </article>
            ))}
          </div>
        ) : error ? (
          <section className="picklink-glow-surface grid justify-items-start rounded-2xl border border-[#e7c8c4] bg-white p-6 shadow-[0_14px_34px_rgba(18,45,34,0.06)] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#ffdad6] text-[#ba1a1a]">
              <AlertCircle aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-[20px] font-bold tracking-[-0.02em]">Không thể tải danh sách câu lạc bộ</h3>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-[#64736a]">{error}</p>
            <button
              className="picklink-glow-control mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0b2228] px-5 py-2.5 text-[14px] font-bold text-white hover:bg-[#143f34]"
              onClick={() => loadClubs()}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
              Thử tải lại
            </button>
          </section>
        ) : clubs.length === 0 ? (
          <section className="picklink-glow-surface grid justify-items-start rounded-2xl border border-[#d8e4d4] bg-white p-6 shadow-[0_14px_34px_rgba(18,45,34,0.06)] sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-[#edf5e9] text-[#477313]">
              <Users aria-hidden="true" className="h-6 w-6" />
            </span>
            <h3 className="mt-5 text-[20px] font-bold tracking-[-0.02em]">Chưa tìm thấy câu lạc bộ phù hợp</h3>
            <p className="mt-2 max-w-xl text-[14px] leading-6 text-[#64736a]">
              {searchTerm || typeFilter !== 'All'
                ? 'Hãy thử một từ khóa, khu vực hoặc bộ lọc khác.'
                : 'Bạn có thể bắt đầu cộng đồng đầu tiên ngay hôm nay.'}
            </p>
            <Link
              className="picklink-glow-control mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#e2ff57] px-5 py-2.5 text-[14px] font-bold text-[#102414] hover:bg-[#d6f64d]"
              to="/clubs/create"
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              Tạo câu lạc bộ
            </Link>
          </section>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {clubs.map((club, index) => {
                const gradient = cardGradients[index % cardGradients.length];
                const IconComponent = cardIcons[index % cardIcons.length];
                const isMember = club.myStatus === 'Accepted';
                const isPending = club.myStatus === 'Pending';
                const isDeclined = club.myStatus === 'Declined';
                const isBanned = club.myStatus === 'Banned';
                const isJoining = joiningId === club.groupId;
                const isFeatured = index === 0;

                return (
                  <motion.article
                    className={`picklink-glow-surface group overflow-hidden rounded-2xl border border-[#d8e4d4] bg-white shadow-[0_14px_34px_rgba(8,29,36,0.065)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 ${
                      isFeatured ? 'md:col-span-2' : ''
                    }`}
                    data-motion-managed
                    initial={revealInitial}
                    key={club.groupId}
                    transition={{
                      delay: shouldReduceMotion ? 0 : Math.min(index, 5) * 0.04,
                      duration: shouldReduceMotion ? 0.01 : 0.32,
                      ease: [0.2, 0.8, 0.2, 1],
                    }}
                    viewport={{ amount: 0.15, once: true }}
                    whileInView={{ opacity: 1, y: 0 }}
                  >
                    <div className={isFeatured ? 'grid h-full md:grid-cols-[1.12fr_0.88fr]' : 'flex h-full flex-col'}>
                      <div
                        className={`relative min-h-52 overflow-hidden bg-gradient-to-br ${gradient} ${
                          isFeatured ? 'md:min-h-[330px]' : ''
                        }`}
                      >
                        {club.coverImageUrl ? (
                          <img
                            alt={club.groupName}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.04] motion-reduce:transform-none"
                            loading="lazy"
                            src={club.coverImageUrl}
                          />
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(226,255,87,0.28),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_62%)]" />
                            <IconComponent
                              aria-hidden="true"
                              className="absolute bottom-5 left-5 h-14 w-14 text-white/78 transition-[transform,color] duration-300 group-hover:-translate-y-1 group-hover:text-[#e2ff57]"
                              strokeWidth={1.5}
                            />
                          </>
                        )}
                        <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(8,29,36,0.68),rgba(8,29,36,0.02)_68%)]" />
                        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-lg border border-white/18 bg-[#081d24]/72 px-2.5 py-1.5 text-[11px] font-bold text-white backdrop-blur">
                          {club.groupType === 'Private' ? (
                            <LockKeyhole aria-hidden="true" className="h-3.5 w-3.5 text-[#e2ff57]" />
                          ) : (
                            <Globe2 aria-hidden="true" className="h-3.5 w-3.5 text-[#e2ff57]" />
                          )}
                          {club.groupType === 'Private' ? 'Riêng tư' : 'Công khai'}
                        </span>
                        <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 text-white">
                          <span className="inline-flex items-center gap-2 text-[12px] font-bold">
                            <Users aria-hidden="true" className="h-4 w-4 text-[#e2ff57]" />
                            {club.memberCount.toLocaleString('vi-VN')} thành viên
                          </span>
                        </div>
                      </div>

                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex-1 p-5 sm:p-6">
                          <h3 className={`font-bold leading-tight tracking-[-0.03em] ${isFeatured ? 'text-[26px]' : 'text-[21px]'}`}>
                            {club.groupName}
                          </h3>
                          <p className="mt-3 line-clamp-3 text-[14px] leading-6 text-[#64736a]">
                            {club.description || 'Tham gia câu lạc bộ để kết nối, duy trì lịch chơi và phát triển cùng cộng đồng.'}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-[#e0e9dc] p-4 sm:p-5">
                          <Link
                            className="picklink-glow-control inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#b9cbb3] bg-white px-3 text-[13px] font-bold text-[#0b2228] transition-[background-color,border-color] hover:border-[#98d951] hover:bg-[#edf5e9]"
                            to={`/clubs/${club.groupId}`}
                          >
                            Xem chi tiết
                            <ArrowRight aria-hidden="true" className="h-4 w-4 text-[#477313]" />
                          </Link>
                          {isMember ? (
                            <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#edf5e9] px-3 text-center text-[13px] font-bold text-[#477313]">
                              Đã tham gia
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#fff8e6] px-3 text-center text-[13px] font-bold text-[#7a5600]">
                              Đang chờ duyệt
                            </span>
                          ) : isBanned ? (
                            <span className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#ffdad6] px-3 text-center text-[13px] font-bold text-[#ba1a1a]">
                              Không thể tham gia
                            </span>
                          ) : (
                            <button
                              className={`picklink-glow-control inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-[13px] font-bold transition-[background-color,transform] disabled:cursor-wait disabled:opacity-60 ${
                                isDeclined
                                  ? 'border border-[#d7b86a] bg-[#fff8e6] text-[#6b4c00] hover:bg-[#fff1c9]'
                                  : 'bg-[#e2ff57] text-[#102414] hover:bg-[#d6f64d]'
                              }`}
                              disabled={isJoining}
                              onClick={() => handleJoin(club.groupId)}
                              type="button"
                            >
                              {isJoining && <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />}
                              {isDeclined ? 'Gửi lại yêu cầu' : 'Tham gia'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
            {hasMore && <div aria-hidden="true" className="h-px w-full" ref={loadMoreRef} />}
            {loadingMore && (
              <div className="flex items-center justify-center py-8" role="status">
                <Loader2 aria-hidden="true" className="h-5 w-5 animate-spin text-[#477313]" />
                <span className="ml-2 text-[13px] font-bold text-[#64736a]">Đang tải thêm câu lạc bộ...</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
