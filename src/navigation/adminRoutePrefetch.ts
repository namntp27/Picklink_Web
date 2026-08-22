import { prefetchApiData } from '../api/client';

type RouteLoader = () => Promise<unknown>;

const routeLoaders = new Map<string, RouteLoader>([
  ['/admin', () => import('../pages/admin/AdminDashboard')],
  ['/admin/notifications', () => import('../pages/admin/AdminNotifications')],
  ['/admin/users', () => import('../pages/admin/AdminUsers')],
  ['/admin/courts', () => import('../pages/admin/AdminCourts')],
  ['/admin/clubs', () => import('../pages/admin/AdminClubs')],
  ['/admin/bookings', () => import('../pages/admin/AdminBookings')],
  ['/admin/reports', () => import('../pages/admin/AdminReports')],
  ['/admin/posts', () => import('../pages/admin/AdminPosts')],
  ['/admin/reviews', () => import('../pages/admin/AdminReviews')],
  ['/admin/transactions', () => import('../pages/admin/AdminTransactions')],
  ['/admin/settings', () => import('../pages/admin/AdminSettings')],
]);

const prefetchedRoutes = new Set<string>();
const normalizePath = (pathname: string) => (
  pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname
);

export const prefetchAdminRoute = (pathname: string, accessToken?: string | null) => {
  const normalizedPath = normalizePath(pathname);
  const routeLoader = routeLoaders.get(normalizedPath);

  if (routeLoader && !prefetchedRoutes.has(normalizedPath)) {
    prefetchedRoutes.add(normalizedPath);
    void routeLoader().catch(() => prefetchedRoutes.delete(normalizedPath));
  }

  if (normalizedPath === '/admin' && accessToken) {
    void import('../api/adminDashboard')
      .then((api) => prefetchApiData(() => api.getAdminDashboard(accessToken)))
      .catch(() => undefined);
  }
};
