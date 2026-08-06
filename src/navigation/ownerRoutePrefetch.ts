import { prefetchApiData } from '../api/client';

type RouteLoader = () => Promise<unknown>;
type DataLoader = (accessToken?: string) => Promise<unknown>;

const routeLoaders = new Map<string, RouteLoader>([
  ['/owner', () => import('../pages/owner/OwnerDashboard')],
  ['/owner/schedule', () => import('../pages/owner/OwnerDashboard')],
  ['/owner/messages', () => import('../pages/owner/OwnerMessages')],
  ['/owner/notifications', () => import('../pages/owner/OwnerNotifications')],
  ['/owner/check-in', () => import('../pages/owner/OwnerCheckIn')],
  ['/owner/bookings', () => import('../pages/owner/OwnerBookings')],
  ['/owner/match-bookings', () => import('../pages/owner/OwnerBookings')],
  ['/owner/ticket-sessions', () => import('../pages/owner/OwnerTicketSessions')],
  ['/owner/courts', () => import('../pages/owner/OwnerCourts')],
  ['/owner/courts/create', () => import('../pages/owner/OwnerCourtCreate')],
  ['/owner/revenue', () => import('../pages/owner/OwnerRevenue')],
  ['/owner/settings', () => import('../pages/owner/OwnerSettings')],
  ['/owner/staff', () => import('../pages/owner/OwnerStaff')],
  ['/staff', () => import('../pages/staff/StaffDashboard')],
]);

const dynamicRouteLoaders: Array<{ pattern: RegExp; loader: RouteLoader }> = [
  { pattern: /^\/owner\/bookings\/[^/]+$/, loader: () => import('../pages/owner/OwnerBookingDetail') },
  { pattern: /^\/owner\/ticket-sessions\/[^/]+$/, loader: () => import('../pages/owner/OwnerTicketSessionDetail') },
  { pattern: /^\/owner\/courts\/[^/]+\/edit$/, loader: () => import('../pages/owner/OwnerCourtEdit') },
  { pattern: /^\/owner\/courts\/[^/]+$/, loader: () => import('../pages/owner/OwnerVenueDetail') },
];

const localDate = () => {
  const date = new Date();
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
};

const prefetch = <T>(loader: () => Promise<T>) => prefetchApiData(loader);

const dataLoaders = new Map<string, DataLoader>([
  ['/owner', (token) => token
    ? import('../api/owner').then((api) => prefetch(() => api.getOwnerSchedule(token, localDate(), 'day')))
    : Promise.resolve()],
  ['/owner/schedule', (token) => token
    ? import('../api/owner').then((api) => prefetch(() => api.getOwnerSchedule(token, localDate(), 'day')))
    : Promise.resolve()],
]);

const prefetchedRoutes = new Set<string>();
const normalizePath = (pathname: string) => (
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
);

export const prefetchOwnerRoute = (pathname: string, accessToken?: string | null) => {
  const normalizedPath = normalizePath(pathname);
  const routeLoader = routeLoaders.get(normalizedPath)
    ?? dynamicRouteLoaders.find(({ pattern }) => pattern.test(normalizedPath))?.loader;

  if (routeLoader && !prefetchedRoutes.has(normalizedPath)) {
    prefetchedRoutes.add(normalizedPath);
    void routeLoader().catch(() => prefetchedRoutes.delete(normalizedPath));
  }

  const dataLoader = dataLoaders.get(normalizedPath);
  if (dataLoader) void dataLoader(accessToken ?? undefined).catch(() => undefined);
};
