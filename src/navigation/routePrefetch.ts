import { prefetchApiData } from '../api/client';
import * as communityApi from '../api/community';
import * as notificationApi from '../api/notifications';

type RouteLoader = () => Promise<unknown>;
type DataLoader = (accessToken?: string, search?: string) => Promise<unknown>;

const commonRouteLoaders = new Map<string, RouteLoader>([
  ['/', () => import('../pages/home/Home')],
  ['/book-court', () => import('../pages/courts/BookCourt')],
  ['/ticket-sessions', () => import('../pages/tickets/TicketSessions')],
  ['/clubs', () => import('../pages/clubs/Clubs')],
  ['/listclubs', () => import('../pages/clubs/Clubs')],
  ['/opponents', () => import('../pages/matches/PendingInvites')],
  ['/opponents/pending', () => import('../pages/matches/PendingInvites')],
  ['/opponents/create', () => import('../pages/matches/Opponents')],
  ['/posts', () => import('../pages/community/Posts')],
  ['/posts/clubs', () => import('../pages/community/PostCollections')],
  ['/my-matches', () => import('../pages/matches/MyMatches')],
  ['/my-bookings', () => import('../pages/bookings/MyBookings')],
  ['/my-tickets', () => import('../pages/tickets/MyTickets')],
  ['/messages', () => import('../pages/messages/Messages')],
  ['/notifications', () => import('../pages/notifications/Notifications')],
  ['/profile', () => import('../pages/profile/Profile')],
  ['/admin', () => import('../pages/admin/AdminDashboard')],
  ['/owner', () => import('../pages/owner/OwnerDashboard')],
  ['/owner/schedule', () => import('../pages/owner/OwnerDashboard')],
  ['/staff', () => import('../pages/staff/StaffDashboard')],
]);

const dynamicRouteLoaders: Array<{ pattern: RegExp; loader: RouteLoader }> = [
  { pattern: /^\/matches\/\d+$/, loader: () => import('../pages/matches/MatchDetail') },
  { pattern: /^\/bookings\/\d+$/, loader: () => import('../pages/bookings/BookingDetail') },
  { pattern: /^\/clubs\/\d+$/, loader: () => import('../pages/clubs/ClubDetail') },
  { pattern: /^\/posts\/\d+$/, loader: () => import('../pages/community/PostDetail') },
  { pattern: /^\/ticket-sessions\/\d+$/, loader: () => import('../pages/tickets/TicketSessionDetail') },
  { pattern: /^\/my-tickets\/\d+$/, loader: () => import('../pages/tickets/MyTicketDetail') },
  { pattern: /^\/court\/\d+\/schedule$/, loader: () => import('../pages/courts/CourtScheduleDetail') },
];

const prefetch = <T>(loader: () => Promise<T>) => prefetchApiData(loader);

const commonDataLoaders = new Map<string, DataLoader>([
  ['/', (token) => Promise.all([
    import('../api/booking').then((api) => prefetch(() => api.getBookingVenues({ page: 1, pageSize: 4 }, token))),
    prefetch(() => communityApi.getGroups(token, undefined, 1, 3, 'All', 'members')),
    import('../api/matches').then((api) => prefetch(() => api.getOpenMatches(token, { page: 1, pageSize: 3 }))),
  ])],
  ['/book-court', (token, search = '') => {
    const params = new URLSearchParams(search);
    return import('../api/booking').then((api) => prefetch(() => api.getBookingVenues({
      search: params.get('search') ?? undefined,
      area: params.get('area') ?? undefined,
      favoritesOnly: params.get('favorites') === 'true',
      page: 1,
      pageSize: 10,
    }, token)));
  }],
  ['/ticket-sessions', () => import('../api/ticketing')
    .then((api) => prefetch(() => api.getTicketSessions({ page: 1, pageSize: 9 })))],
  ['/clubs', (token) => prefetch(() => communityApi.getGroups(token, undefined, 1, 3, 'All', 'newest'))],
  ['/listclubs', (token) => prefetch(() => communityApi.getGroups(token, undefined, 1, 3, 'All', 'newest'))],
  ['/opponents', (token) => import('../api/matches')
    .then((api) => prefetch(() => api.getOpenMatches(token, { page: 1, pageSize: 10, owner: 'other' })))],
  ['/opponents/pending', (token) => import('../api/matches')
    .then((api) => prefetch(() => api.getOpenMatches(token, { page: 1, pageSize: 10, owner: 'other' })))],
  ['/posts', (token) => prefetch(() => communityApi.getGlobalPosts(token))],
  ['/my-matches', (token) => token ? Promise.all([
    import('../api/matches').then((api) => prefetch(() => api.getMyMatches(token, { page: 1, pageSize: 9 }))),
    import('../api/matchmaking').then((api) => prefetch(() => api.getMyQueues(token))),
  ]) : Promise.resolve()],
  ['/my-bookings', (token) => token ? import('../api/booking')
    .then((api) => prefetch(() => api.getMyBookingHistory(token, { page: 1, pageSize: 10 }))) : Promise.resolve()],
  ['/my-tickets', (token) => token ? import('../api/ticketing')
    .then((api) => prefetch(() => api.getPlayerTickets(token, { page: 1, pageSize: 10 }))) : Promise.resolve()],
  ['/messages', (token) => token ? Promise.all([
    prefetch(() => communityApi.getGroups(token, undefined, undefined, undefined, 'Mine')),
    prefetch(() => communityApi.getDirectConversations(token)),
  ]) : Promise.resolve()],
  ['/notifications', (token) => token ? Promise.all([
    prefetch(() => notificationApi.listNotifications(token, { page: 1, pageSize: 10 })),
    prefetch(() => notificationApi.getUnreadNotificationCount(token)),
  ]) : Promise.resolve()],
  ['/profile', (token) => token ? import('../api/profile')
    .then((api) => prefetch(() => api.getMyProfile(token))) : Promise.resolve()],
  ['/admin', (token) => token ? import('../api/adminDashboard')
    .then((api) => prefetch(() => api.getAdminDashboard(token))) : Promise.resolve()],
  ['/owner', (token) => token ? import('../api/owner')
    .then((api) => prefetch(() => api.getOwnerSchedule(token, localDate(), 'day'))) : Promise.resolve()],
  ['/owner/schedule', (token) => token ? import('../api/owner')
    .then((api) => prefetch(() => api.getOwnerSchedule(token, localDate(), 'day'))) : Promise.resolve()],
]);

const prefetchedRoutes = new Set<string>();

const normalizePath = (pathname: string) => (
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
);

const numericId = (pathname: string) => Number(pathname.split('/').filter(Boolean).at(-1));

const localDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const dynamicDataLoader = (pathname: string): DataLoader | undefined => {
  if (/^\/matches\/\d+$/.test(pathname)) {
    const id = numericId(pathname);
    return (token) => token ? import('../api/matches')
      .then((api) => prefetch(() => api.getMatchDetail(token, id))) : Promise.resolve();
  }
  if (/^\/bookings\/\d+$/.test(pathname)) {
    const id = numericId(pathname);
    return (token) => token ? import('../api/booking')
      .then((api) => prefetch(() => api.getBookingHolding(token, id))) : Promise.resolve();
  }
  if (/^\/clubs\/\d+$/.test(pathname)) {
    const id = numericId(pathname);
    return (token) => prefetch(() => communityApi.getGroup(id, token));
  }
  if (/^\/posts\/\d+$/.test(pathname)) {
    const id = numericId(pathname);
    return (token) => prefetch(() => communityApi.getGlobalPost(id, token));
  }
  if (/^\/ticket-sessions\/\d+$/.test(pathname)) {
    const id = numericId(pathname);
    return () => import('../api/ticketing')
      .then((api) => prefetch(() => api.getTicketSession(id)));
  }
  if (/^\/my-tickets\/\d+$/.test(pathname)) {
    const id = numericId(pathname);
    return (token) => token ? import('../api/ticketing')
      .then((api) => prefetch(() => api.getPlayerTicket(token, id))) : Promise.resolve();
  }
  return undefined;
};

export const prefetchRoute = (pathname: string, accessToken?: string | null, search = '') => {
  const normalizedPath = normalizePath(pathname);
  const routeLoader = commonRouteLoaders.get(normalizedPath)
    ?? dynamicRouteLoaders.find(({ pattern }) => pattern.test(normalizedPath))?.loader;

  if (routeLoader && !prefetchedRoutes.has(normalizedPath)) {
    prefetchedRoutes.add(normalizedPath);
    void routeLoader().catch(() => prefetchedRoutes.delete(normalizedPath));
  }

  const dataLoader = commonDataLoaders.get(normalizedPath) ?? dynamicDataLoader(normalizedPath);
  if (dataLoader) void dataLoader(accessToken ?? undefined, search).catch(() => undefined);
};
