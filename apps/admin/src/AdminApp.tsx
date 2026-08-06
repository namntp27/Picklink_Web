import { Navigate, Route, Routes } from 'react-router-dom';
import { AppFrame } from '@/apps/AppFrame';
import { lazyPage } from '@/apps/lazyPage';
import { ProtectedRoute, PublicOnlyRoute } from '@/auth/ProtectedRoute';
import { prefetchAdminRoute } from '@/navigation/adminRoutePrefetch';

const ForgotPassword = lazyPage(() => import('@/pages/auth/ForgotPassword'), 'ForgotPassword');
const Login = lazyPage(() => import('@/pages/auth/Login'), 'Login');
const NotFound = lazyPage(() => import('@/pages/auth/NotFound'), 'NotFound');
const Unauthorized = lazyPage(() => import('@/pages/auth/Unauthorized'), 'Unauthorized');
const AdminBookings = lazyPage(() => import('@/pages/admin/AdminBookings'), 'AdminBookings');
const AdminClubs = lazyPage(() => import('@/pages/admin/AdminClubs'), 'AdminClubs');
const AdminCourts = lazyPage(() => import('@/pages/admin/AdminCourts'), 'AdminCourts');
const AdminDashboard = lazyPage(() => import('@/pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminPosts = lazyPage(() => import('@/pages/admin/AdminPosts'), 'AdminPosts');
const AdminReports = lazyPage(() => import('@/pages/admin/AdminReports'), 'AdminReports');
const AdminReviews = lazyPage(() => import('@/pages/admin/AdminReviews'), 'AdminReviews');
const AdminSettings = lazyPage(() => import('@/pages/admin/AdminSettings'), 'AdminSettings');
const AdminTransactions = lazyPage(() => import('@/pages/admin/AdminTransactions'), 'AdminTransactions');
const AdminUsers = lazyPage(() => import('@/pages/admin/AdminUsers'), 'AdminUsers');

export const AdminApp = () => (
  <AppFrame prefetchRoute={prefetchAdminRoute}>
    <Routes>
      <Route path="/" element={<Navigate replace to="/admin" />} />
      <Route element={<PublicOnlyRoute allowedRoles={['admin']} />}>
        <Route
          path="/login"
          element={(
            <Login
              allowedRoles={['admin']}
              portalLabel="Admin Web"
              showRegistration={false}
              subtitle="Kiểm soát tài khoản, nội dung, giao dịch và cấu hình vận hành của toàn nền tảng."
              title="Trung tâm quản trị Picklink."
            />
          )}
        />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized fallbackPath="/login" />} />
      <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/courts" element={<AdminCourts />} />
        <Route path="/admin/clubs" element={<AdminClubs />} />
        <Route path="/admin/bookings" element={<AdminBookings />} />
        <Route path="/admin/reports" element={<AdminReports />} />
        <Route path="/admin/posts" element={<AdminPosts />} />
        <Route path="/admin/reviews" element={<AdminReviews />} />
        <Route path="/admin/transactions" element={<AdminTransactions />} />
        <Route path="/admin/settings" element={<AdminSettings />} />
      </Route>
      <Route path="*" element={<NotFound homePath="/" />} />
    </Routes>
  </AppFrame>
);
