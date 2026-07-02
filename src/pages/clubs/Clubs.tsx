import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import {
  Search,
  MapPin,
  ChevronDown,
  Activity,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  Award,
  User,
  Users,
  Calendar,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  getGroups,
  joinGroup,
  type CommunityGroup,
} from '../../api/community';
import { Dropdown, type DropdownOption } from '../../components/ui/Dropdown';

// Color gradient pairs for club cards without cover images
const cardGradients = [
  'from-primary-container to-primary',
  'from-[#2D5000] to-primary-container',
  'from-[#7e1c66] to-[#ffade0]',
  'from-[#1a4b7e] to-[#96c8ff]',
  'from-[#6a3d00] to-[#ffd599]',
  'from-[#004d40] to-[#a7f3d0]',
];

const cardIcons = [Activity, Zap, Star, Award, Users, Activity];

const sortOptions: readonly DropdownOption<'newest' | 'members' | 'active'>[] = [
  { value: 'newest', label: 'Mới nhất' },
  { value: 'members', label: 'Nhiều thành viên nhất' },
  { value: 'active', label: 'Hoạt động sôi nổi' },
];

export const Clubs = () => {
  const navigate = useNavigate();
  const { token, isAuthenticated } = useAuth();
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
  const [selectedCity, setSelectedCity] = useState('Toàn quốc');

  const buildSearchQuery = useCallback((search: string, city: string) => {
    if (city === 'Toàn quốc') return search;
    return `${search} ${city}`.trim();
  }, []);

  const loadClubs = useCallback(
    async (pageNum: number = 1, replace: boolean = false) => {
      if (pageNum === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const queryVal = buildSearchQuery(searchTerm, selectedCity) || undefined;
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
    [token, typeFilter, sortBy, searchTerm, selectedCity, buildSearchQuery],
  );

  // Load page 1 on filter or sort change
  useEffect(() => {
    setPage(1);
    loadClubs(1, true);
  }, [token, typeFilter, sortBy, selectedCity]);

  // Infinite scroll event listener
  useEffect(() => {
    const handleScroll = () => {
      if (loading || loadingMore || !hasMore) return;
      if (
        window.innerHeight + window.scrollY >=
        document.documentElement.scrollHeight - 150
      ) {
        setPage((prev) => {
          const next = prev + 1;
          loadClubs(next, false);
          return next;
        });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loading, loadingMore, hasMore, loadClubs]);

  const handleSearch = () => {
    setPage(1);
    loadClubs(1, true);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
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
    } catch {
      // Silent fail
    } finally {
      setJoiningId(null);
    }
  };



  return (
    <div className="flex-1 flex flex-col font-body-md overflow-x-hidden w-full bg-background">
      {/* Hero Section */}
      <div className="bg-primary">
        <div className="h-[72px] w-full" />
        <section className="relative overflow-hidden pt-12 pb-24 md:pt-16 md:pb-32">
          {/* Abstract background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
          </div>
          
          <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop relative z-10 text-center">
            <h1 className="font-headline-xl text-[32px] md:text-headline-xl text-white mb-stack-md font-bold">Khám phá Câu Lạc Bộ Pickleball</h1>
            <p className="text-white/90 font-body-lg text-body-lg max-w-2xl mx-auto mb-stack-lg">
              Kết nối với những người đam mê, nâng cao kỹ năng và tham gia vào cộng đồng Pickleball sôi động nhất Việt Nam.
            </p>
            
            {/* Search Box */}
            <div className="flex flex-col md:flex-row gap-stack-sm items-center justify-center max-w-3xl mx-auto bg-white p-2 rounded-xl shadow-xl">
              <div className="flex items-center flex-1 w-full px-4 border-b md:border-b-0 md:border-r border-outline-variant">
                <Search className="text-outline w-[24px] h-[24px]" />
                <input
                  className="w-full border-none focus:ring-0 text-body-md py-3 placeholder:text-outline/60 outline-none ml-2"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Tìm tên câu lạc bộ..."
                  type="text"
                  value={searchTerm}
                />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto px-4 relative">
                <MapPin className="text-outline w-[24px] h-[24px]" />
                <select 
                  className="border-none focus:ring-0 text-body-md py-3 bg-transparent pr-8 outline-none appearance-none cursor-pointer"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                >
                  <option>Toàn quốc</option>
                  <option>Hà Nội</option>
                  <option>TP. Hồ Chí Minh</option>
                  <option>Đà Nẵng</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-outline w-5 h-5" />
              </div>
              <button
                className="w-full md:w-auto bg-primary-container text-on-primary-container font-label-md text-label-md px-8 py-3 rounded-lg font-bold hover:opacity-90 transition-all mt-2 md:mt-0"
                onClick={handleSearch}
              >
                Tìm kiếm
              </button>
            </div>
            
            {/* Club Tabs */}
          </div>
        </section>
      </div>

      {/* Filter Bar */}
      <section className="bg-surface-container-lowest border-b border-outline-variant py-4 sticky top-[72px] z-40 shadow-sm">
        <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-stack-md relative">
          <div className="flex items-center gap-stack-md overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setTypeFilter('All')}
              className={`px-4 py-2 rounded-full border text-label-md font-label-md transition-colors ${
                typeFilter === 'All'
                  ? 'bg-primary text-white border-primary shadow-sm font-semibold'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              Tất cả
            </button>
            <button
              onClick={() => setTypeFilter('Public')}
              className={`px-4 py-2 rounded-full border text-label-md font-label-md transition-colors ${
                typeFilter === 'Public'
                  ? 'bg-primary text-white border-primary shadow-sm font-semibold'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              Công khai
            </button>
            <button
              onClick={() => setTypeFilter('Private')}
              className={`px-4 py-2 rounded-full border text-label-md font-label-md transition-colors ${
                typeFilter === 'Private'
                  ? 'bg-primary text-white border-primary shadow-sm font-semibold'
                  : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-highest'
              }`}
            >
              Riêng tư
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setTypeFilter('Mine')}
                className={`px-4 py-2 rounded-full border text-label-md font-label-md transition-colors ${
                  typeFilter === 'Mine'
                    ? 'bg-primary text-white border-primary shadow-sm font-semibold'
                    : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-highest'
                }`}
              >
                Của tôi
              </button>
            )}
          </div>
          <div className="flex items-center gap-stack-sm ml-auto mr-4 md:mr-0 pl-4 border-l border-outline-variant md:border-none relative z-40">
            <span className="text-label-sm font-label-sm text-outline whitespace-nowrap">Sắp xếp:</span>
            <Dropdown<'newest' | 'members' | 'active'>
              options={sortOptions}
              value={sortBy}
              onChange={setSortBy}
            />
          </div>
        </div>
      </section>

      <main className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-stack-lg w-full">
        {/* Create Club call to action banner */}
        <div className="mb-8 p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-[18px] font-bold text-primary">Chưa tìm thấy câu lạc bộ ưng ý?</h2>
            <p className="text-[14px] text-on-surface-variant mt-1">Hãy xây dựng một cộng đồng Pickleball của riêng bạn, thu hút thành viên và tổ chức hoạt động sôi nổi!</p>
          </div>
          <Link
            to="/clubs/create"
            className="inline-flex items-center justify-center shrink-0 bg-primary text-white text-[14px] font-bold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
          >
            Tạo câu lạc bộ ngay
          </Link>
        </div>

        {/* Clubs Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-[14px] text-on-surface-variant">Đang tải câu lạc bộ...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="h-10 w-10 text-[#ba1a1a]" />
            <p className="mt-3 text-[16px] font-bold text-on-surface">Không thể tải dữ liệu</p>
            <p className="mt-2 text-[14px] text-on-surface-variant">{error}</p>
            <button
              className="mt-4 rounded-lg bg-primary px-6 py-2 text-[14px] font-bold text-white hover:opacity-90"
              onClick={() => loadClubs()}
            >
              Thử lại
            </button>
          </div>
        ) : clubs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Users className="h-10 w-10 text-on-surface-variant" />
            <p className="mt-3 text-[16px] font-bold text-on-surface">Không tìm thấy câu lạc bộ</p>
            <p className="mt-2 text-[14px] text-on-surface-variant">
              {searchTerm || typeFilter !== 'All' ? 'Thử thay đổi từ khóa hoặc bộ lọc.' : 'Hãy tạo câu lạc bộ đầu tiên!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter mb-stack-lg">
              {clubs.map((club, index) => {
                const gradient = cardGradients[index % cardGradients.length];
                const IconComponent = cardIcons[index % cardIcons.length];
                const isMember = club.myStatus === 'Accepted';
                const isPending = club.myStatus === 'Pending';
                const isDeclined = club.myStatus === 'Declined';
                const isBanned = club.myStatus === 'Banned';
                const isJoining = joiningId === club.groupId;

                return (
                  <div
                    className="group bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-lg transition-all duration-300 flex flex-col"
                    key={club.groupId}
                  >
                    <div className={`h-40 relative overflow-hidden bg-gradient-to-br ${gradient}`}>
                      {club.coverImageUrl ? (
                        <img
                          alt={club.groupName}
                          className="absolute inset-0 h-full w-full object-cover"
                          src={club.coverImageUrl}
                        />
                      ) : (
                        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
                      )}
                      <div className="absolute bottom-4 left-4 z-20">
                        <div className="w-16 h-16 bg-white rounded-full p-1 border-2 border-white shadow-md transition-transform duration-300 group-hover:-translate-y-2">
                          <div className="w-full h-full bg-surface-container rounded-full flex items-center justify-center">
                            <IconComponent className="text-primary w-8 h-8" />
                          </div>
                        </div>
                      </div>
                      {club.groupType === 'Private' && (
                        <div className="absolute top-3 right-3 z-20">
                          <span className="bg-white/90 text-on-surface text-[11px] font-bold px-2 py-1 rounded-full">
                            Riêng tư
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-stack-md pt-8 flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-headline-md text-[20px] md:text-headline-md text-on-surface">
                          {club.groupName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 text-outline mb-4">
                        <Users className="w-[18px] h-[18px]" />
                        <span className="text-label-md font-label-md">
                          {club.memberCount.toLocaleString('vi-VN')} thành viên
                        </span>
                      </div>
                      <p className="text-on-surface-variant line-clamp-2 mb-stack-md text-body-md">
                        {club.description || 'Câu lạc bộ pickleball — tham gia để kết nối và chơi cùng cộng đồng!'}
                      </p>
                    </div>
                    <div className="p-stack-md border-t border-outline-variant flex gap-stack-sm">
                      <Link
                        to={`/clubs/${club.groupId}`}
                        className="flex-1 border border-primary text-primary font-label-md text-label-md py-2 rounded-lg hover:bg-primary/5 transition-colors text-center"
                      >
                        Xem chi tiết
                      </Link>
                      {isMember ? (
                        <span className="flex-1 bg-surface-container text-on-surface-variant font-label-md text-label-md py-2 rounded-lg text-center cursor-default">
                          Đã tham gia
                        </span>
                      ) : isPending ? (
                        <span className="flex-1 bg-[#fff8e6] text-[#7a5600] font-label-md text-label-md py-2 rounded-lg text-center cursor-default">
                          Đang chờ duyệt
                        </span>
                      ) : isDeclined ? (
                        <button
                          className="flex-1 bg-[#fff8e6] text-[#7a5600] border border-[#7a5600]/40 font-label-md text-label-md py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                          disabled={isJoining}
                          onClick={() => handleJoin(club.groupId)}
                        >
                          {isJoining && <Loader2 className="h-4 w-4 animate-spin" />}
                          Đã yêu cầu · Gửi lại
                        </button>
                      ) : isBanned ? (
                        <span className="flex-1 bg-[#ffdad6] text-[#ba1a1a] font-label-md text-label-md py-2 rounded-lg text-center cursor-default">
                          Bị cấm
                        </span>
                      ) : (
                        <button
                          className="flex-1 bg-primary text-white font-label-md text-label-md py-2 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
                          disabled={isJoining}
                          onClick={() => handleJoin(club.groupId)}
                        >
                          {isJoining && <Loader2 className="h-4 w-4 animate-spin" />}
                          Tham gia
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {loadingMore && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="ml-2 text-[13px] text-on-surface-variant font-medium">Đang tải thêm...</span>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};
