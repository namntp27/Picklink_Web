import { useEffect, useState, useTransition } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  MessageCircle,
  Loader2,
  UserRound,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import {
  getFriends,
  getFriendRequests,
  searchPlayers,
  type CommunityFriend,
  type FriendRequest,
  type PlayerSearchResult,
  type FriendshipStatus,
} from '../../api/community';
import { CommunityFeedShell, CommunityPage } from './CommunityUI';
import { FriendButton } from './components/FriendButton';

export const Friends = () => {
  const { user, token, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') || 'friends') as 'friends' | 'requests' | 'search';

  // Data states
  const [friends, setFriends] = useState<CommunityFriend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [playerSearchQuery, setPlayerSearchQuery] = useState(searchParams.get('q') || '');
  const [, startTransition] = useTransition();

  const setTab = (tab: 'friends' | 'requests' | 'search') => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', tab);
    setSearchParams(params);
  };

  // Load friends and requests
  useEffect(() => {
    if (!token || !isAuthenticated) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    Promise.all([
      getFriends(token).catch(() => []),
      getFriendRequests(token).catch(() => []),
    ]).then(([friendsData, requestsData]) => {
      if (!cancelled) {
        setFriends(friendsData || []);
        setRequests(requestsData || []);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [token, isAuthenticated]);

  // Handle live search for adding new players
  useEffect(() => {
    if (!token || activeTab !== 'search') return;

    const timer = setTimeout(() => {
      let cancelled = false;
      setSearching(true);
      searchPlayers(token, playerSearchQuery.trim(), 24)
        .then((res) => {
          if (!cancelled) {
            setSearchResults(res || []);
            setSearching(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setSearchResults([]);
            setSearching(false);
          }
        });

      return () => {
        cancelled = true;
      };
    }, 300);

    return () => clearTimeout(timer);
  }, [token, activeTab, playerSearchQuery]);

  const handleFriendStatusUpdate = (targetUserId: number, newStatus: FriendshipStatus) => {
    startTransition(() => {
      // If accepted request, remove from requests list and refresh friends
      if (newStatus === 'Accepted') {
        setRequests((prev) => prev.filter((r) => r.requesterId !== targetUserId));
        if (token) {
          getFriends(token).then((res) => setFriends(res || [])).catch(() => {});
        }
      } else if (newStatus === 'None') {
        // Unfriended or declined
        setFriends((prev) => prev.filter((f) => f.userId !== targetUserId));
        setRequests((prev) => prev.filter((r) => r.requesterId !== targetUserId));
      }

      // Update search results list status
      setSearchResults((prev) =>
        prev.map((p) => (p.userId === targetUserId ? { ...p, status: newStatus } : p))
      );
    });
  };

  // Filter existing friends by friendSearchQuery
  const filteredFriends = friends.filter((f) => {
    if (!friendSearchQuery.trim()) return true;
    return f.username.toLowerCase().includes(friendSearchQuery.trim().toLowerCase());
  });

  return (
    <CommunityPage>
      <CommunityFeedShell activePath="/posts/friends">
        {/* Page Header */}
        <header className="community-panel p-5 sm:p-6 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-[12px] font-extrabold text-[#477313]">
                <Users aria-hidden="true" className="h-4 w-4" />
                Cộng đồng người chơi
              </p>
              <h1 className="mt-2 text-[20px] sm:text-[21px] font-extrabold tracking-[-0.03em] text-[#0b2228]">
                Bạn bè & Kết nối
              </h1>
              <p className="mt-1 text-[13px] leading-6 text-[#66756b]">
                Tìm kiếm bạn chơi mới, kết nối đồng đội và mở rộng mạng lưới thể thao của bạn.
              </p>
            </div>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-[#477313] hover:bg-[#3b5d0f] px-4 py-2.5 text-[13px] font-extrabold text-white transition-all shadow-sm hover:shadow-md self-start sm:self-auto cursor-pointer"
              onClick={() => setTab('search')}
              type="button"
            >
              <UserPlus className="h-4 w-4" />
              <span>Tìm bạn mới</span>
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-[#e0e9dc] pt-4">
            <button
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] transition-all cursor-pointer ${
                activeTab === 'friends'
                  ? 'bg-[#477313] text-white font-extrabold shadow-xs'
                  : 'bg-[#edf5e9] text-[#0b2228] hover:bg-[#dbe8d3] font-bold'
              }`}
              onClick={() => setTab('friends')}
              type="button"
            >
              <Users className="h-4 w-4" />
              <span>Bạn bè của tôi</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                  activeTab === 'friends' ? 'bg-white text-[#477313]' : 'bg-[#dbe8d3] text-[#477313]'
                }`}
              >
                {friends.length}
              </span>
            </button>

            <button
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] transition-all cursor-pointer ${
                activeTab === 'requests'
                  ? 'bg-[#477313] text-white font-extrabold shadow-xs'
                  : 'bg-[#edf5e9] text-[#0b2228] hover:bg-[#dbe8d3] font-bold'
              }`}
              onClick={() => setTab('requests')}
              type="button"
            >
              <UserCheck className="h-4 w-4" />
              <span>Lời mời kết bạn</span>
              {requests.length > 0 && (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                    activeTab === 'requests' ? 'bg-white text-[#477313]' : 'bg-[#477313] text-white'
                  }`}
                >
                  {requests.length}
                </span>
              )}
            </button>

            <button
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[13px] transition-all cursor-pointer ${
                activeTab === 'search'
                  ? 'bg-[#477313] text-white font-extrabold shadow-xs'
                  : 'bg-[#edf5e9] text-[#0b2228] hover:bg-[#dbe8d3] font-bold'
              }`}
              onClick={() => setTab('search')}
              type="button"
            >
              <Search className="h-4 w-4" />
              <span>Tìm bạn mới</span>
            </button>
          </div>
        </header>

        {/* Tab 1: All Friends */}
        {activeTab === 'friends' && (
          <section className="space-y-4">
            {friends.length > 0 && (
              <div className="relative">
                <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718077]" />
                <input
                  className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#d8e4d4] bg-white text-[13px] font-semibold text-[#0b2228] placeholder-[#718077]/70 outline-none focus:border-[#477313] focus:ring-2 focus:ring-[#477313]/15 transition-all shadow-xs"
                  onChange={(e) => setFriendSearchQuery(e.target.value)}
                  placeholder="Lọc danh sách bạn bè theo tên..."
                  type="text"
                  value={friendSearchQuery}
                />
                {friendSearchQuery && (
                  <button
                    aria-label="Xóa tìm kiếm"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718077] hover:text-[#0b2228]"
                    onClick={() => setFriendSearchQuery('')}
                    type="button"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-[#cfe0c8] bg-white p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#477313]" />
              </div>
            ) : filteredFriends.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredFriends.map((friend) => (
                  <div
                    key={friend.userId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe8d3] bg-white p-4 transition-all hover:border-[#477313]/40 hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      {friend.profileImageUrl ? (
                        <img
                          alt={friend.username}
                          className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-[#e0e9dc]"
                          src={friend.profileImageUrl}
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf5e9] text-[#477313]">
                          <UserRound className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-extrabold text-[#0b2228]">{friend.username}</p>
                        <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#718077]">
                          {friend.skillLevel ? (
                            <span className="rounded-md bg-[#edf5e9] px-1.5 py-0.5 text-[#477313] font-bold">
                              Trình độ {friend.skillLevel}
                            </span>
                          ) : (
                            <span>Thành viên</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Link
                        aria-label={`Nhắn tin với ${friend.username}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e4d4] bg-[#f4f8f2] text-[#477313] hover:border-[#477313] hover:bg-[#477313] hover:text-white transition-all shadow-xs"
                        title={`Nhắn tin với ${friend.username}`}
                        to={`/messages?chatWithUserId=${friend.userId}`}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Link>
                      <FriendButton
                        onStatusChange={(status) => handleFriendStatusUpdate(friend.userId, status)}
                        status="Accepted"
                        targetUserId={friend.userId}
                        targetUserName={friend.username}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : friends.length > 0 ? (
              <div className="rounded-2xl border border-[#cfe0c8] bg-[#f4f8f2] p-8 text-center text-[#718077]">
                <p className="font-extrabold text-[15px]">Không tìm thấy bạn bè nào khớp với "{friendSearchQuery}"</p>
                <p className="mt-1 text-[12px]">Thử nhập lại tên chính xác hơn.</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#cfe0c8] bg-[#f4f8f2] p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5e9] text-[#477313]">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-[16px] font-extrabold text-[#0b2228]">Chưa có bạn bè nào</h3>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#718077]">
                  Hãy tìm kiếm và kết bạn với những người chơi khác để cùng nhau tham gia các trận đấu pickleball thú vị!
                </p>
                <button
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#477313] hover:bg-[#3b5d0f] px-4 py-2.5 text-[13px] font-extrabold text-white transition-all shadow-sm hover:shadow-md cursor-pointer"
                  onClick={() => setTab('search')}
                  type="button"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Tìm người chơi để kết bạn</span>
                </button>
              </div>
            )}
          </section>
        )}

        {/* Tab 2: Incoming Requests */}
        {activeTab === 'requests' && (
          <section className="space-y-4">
            {loading ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-[#cfe0c8] bg-white p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#477313]" />
              </div>
            ) : requests.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {requests.map((req) => {
                  let formattedDate = 'Gần đây';
                  try {
                    formattedDate = new Intl.DateTimeFormat('vi-VN', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(new Date(req.createdAt));
                  } catch {
                    // Ignore date error
                  }

                  return (
                    <div
                      key={req.friendshipId}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#cfe0c8] bg-white p-4 shadow-sm"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {req.requesterAvatarUrl ? (
                          <img
                            alt={req.requesterName}
                            className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-[#e0e9dc]"
                            src={req.requesterAvatarUrl}
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf5e9] text-[#477313]">
                            <UserRound className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-extrabold text-[#0b2228]">{req.requesterName}</p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-[#718077]">
                            {req.skillLevel && (
                              <span className="rounded-md bg-[#edf5e9] px-1.5 py-0.5 text-[#477313] font-bold">
                                Trình {req.skillLevel}
                              </span>
                            )}
                            <span>· {formattedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <FriendButton
                          onStatusChange={(status) => handleFriendStatusUpdate(req.requesterId, status)}
                          status="PendingReceived"
                          targetUserId={req.requesterId}
                          targetUserName={req.requesterName}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#cfe0c8] bg-[#f4f8f2] p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5e9] text-[#477313]">
                  <UserCheck className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-[16px] font-extrabold text-[#0b2228]">Không có lời mời kết bạn nào</h3>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#718077]">
                  Khi có người chơi khác gửi lời mời kết bạn đến bạn, danh sách lời mời sẽ hiển thị tại đây.
                </p>
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Search & Add New Friends */}
        {activeTab === 'search' && (
          <section className="space-y-4">
            <div className="relative">
              <Search aria-hidden="true" className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#718077]" />
              <input
                autoFocus
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#d8e4d4] bg-white text-[13px] font-semibold text-[#0b2228] placeholder-[#718077]/70 outline-none focus:border-[#477313] focus:ring-2 focus:ring-[#477313]/15 transition-all shadow-xs"
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                placeholder="Tìm kiếm người chơi theo tên, username, email..."
                type="text"
                value={playerSearchQuery}
              />
              {searching && (
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-[#477313]" />
                </div>
              )}
              {playerSearchQuery && !searching && (
                <button
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#718077] hover:text-[#0b2228]"
                  onClick={() => setPlayerSearchQuery('')}
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Results */}
            {searching && searchResults.length === 0 ? (
              <div className="flex min-h-[260px] items-center justify-center rounded-2xl border border-[#cfe0c8] bg-white p-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#477313]" />
              </div>
            ) : searchResults.length > 0 ? (
              <div>
                <div className="mb-3 flex items-center justify-between px-1">
                  <p className="text-[12px] font-extrabold text-[#718077]">
                    Tìm thấy {searchResults.length} người chơi
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {searchResults.map((player) => (
                    <div
                      key={player.userId}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[#dbe8d3] bg-white p-4 transition-all hover:border-[#477313]/40 hover:shadow-md"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {player.profileImageUrl ? (
                          <img
                            alt={player.username}
                            className="h-12 w-12 shrink-0 rounded-xl object-cover ring-2 ring-[#e0e9dc]"
                            src={player.profileImageUrl}
                          />
                        ) : (
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#edf5e9] text-[#477313]">
                            <UserRound className="h-6 w-6" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-extrabold text-[#0b2228]">{player.username}</p>
                          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-[#718077]">
                            {player.skillLevel ? (
                              <span className="rounded-md bg-[#edf5e9] px-1.5 py-0.5 text-[#477313] font-bold">
                                Trình độ {player.skillLevel}
                              </span>
                            ) : (
                              <span>Thành viên</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          aria-label={`Nhắn tin với ${player.username}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#d8e4d4] bg-[#f4f8f2] text-[#477313] hover:border-[#477313] hover:bg-[#477313] hover:text-white transition-all shadow-xs"
                          title={`Nhắn tin với ${player.username}`}
                          to={`/messages?chatWithUserId=${player.userId}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Link>
                        <FriendButton
                          onStatusChange={(status) => handleFriendStatusUpdate(player.userId, status)}
                          status={player.status}
                          targetUserId={player.userId}
                          targetUserName={player.username}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-[#cfe0c8] bg-[#f4f8f2] p-10 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#edf5e9] text-[#477313]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h3 className="mt-4 text-[16px] font-extrabold text-[#0b2228]">
                  {playerSearchQuery ? 'Không tìm thấy người chơi phù hợp' : 'Tìm kiếm bạn chơi mới'}
                </h3>
                <p className="mx-auto mt-1 max-w-sm text-[13px] text-[#718077]">
                  {playerSearchQuery
                    ? `Không có tài khoản nào khớp với "${playerSearchQuery}". Hãy thử tìm theo tên hoặc username khác.`
                    : 'Nhập tên người chơi hoặc username vào thanh tìm kiếm phía trên để kết nối.'}
                </p>
              </div>
            )}
          </section>
        )}
      </CommunityFeedShell>
    </CommunityPage>
  );
};

export default Friends;
