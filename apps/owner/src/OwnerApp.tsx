import { Navigate, Route, Routes } from 'react-router-dom';
import { AppFrame } from '@/apps/AppFrame';
import { lazyPage } from '@/apps/lazyPage';
import { useAuth } from '@/auth/AuthContext';
import { ProtectedRoute, PublicOnlyRoute } from '@/auth/ProtectedRoute';
import { NotificationToastBridge } from '@/components/notifications/NotificationToastBridge';
import { prefetchOwnerRoute } from '@/navigation/ownerRoutePrefetch';

const ForgotPassword = lazyPage(() => import('@/pages/auth/ForgotPassword'), 'ForgotPassword');
const Login = lazyPage(() => import('@/pages/auth/Login'), 'Login');
const NotFound = lazyPage(() => import('@/pages/auth/NotFound'), 'NotFound');
const Unauthorized = lazyPage(() => import('@/pages/auth/Unauthorized'), 'Unauthorized');
const OwnerBookingDetail = lazyPage(() => import('@/pages/owner/OwnerBookingDetail'), 'OwnerBookingDetail');
const OwnerCheckIn = lazyPage(() => import('@/pages/owner/OwnerCheckIn'), 'OwnerCheckIn');
const OwnerBookings = lazyPage(() => import('@/pages/owner/OwnerBookings'), 'OwnerBookings');
const OwnerCourtCreate = lazyPage(() => import('@/pages/owner/OwnerCourtCreate'), 'OwnerCourtCreate');
const OwnerCourtEdit = lazyPage(() => import('@/pages/owner/OwnerCourtEdit'), 'OwnerCourtEdit');
const OwnerCourts = lazyPage(() => import('@/pages/owner/OwnerCourts'), 'OwnerCourts');
const OwnerDashboard = lazyPage(() => import('@/pages/owner/OwnerDashboard'), 'OwnerDashboard');
const OwnerMessages = lazyPage(() => import('@/pages/owner/OwnerMessages'), 'OwnerMessages');
const OwnerNotifications = lazyPage(() => import('@/pages/owner/OwnerNotifications'), 'OwnerNotifications');
const OwnerRevenue = lazyPage(() => import('@/pages/owner/OwnerRevenue'), 'OwnerRevenue');
const OwnerSettings = lazyPage(() => import('@/pages/owner/OwnerSettings'), 'OwnerSettings');
const OwnerStaff = lazyPage(() => import('@/pages/owner/OwnerStaff'), 'OwnerStaff');
const OwnerTicketSessions = lazyPage(() => import('@/pages/owner/OwnerTicketSessions'), 'OwnerTicketSessions');
const OwnerTicketSessionDetail = lazyPage(() => import('@/pages/owner/OwnerTicketSessionDetail'), 'OwnerTicketSessionDetail');
const OwnerVenueDetail = lazyPage(() => import('@/pages/owner/OwnerVenueDetail'), 'OwnerVenueDetail');
const StaffDashboard = lazyPage(() => import('@/pages/staff/StaffDashboard'), 'StaffDashboard');

const OwnerRootRedirect = () => {
  const { user } = useAuth();
  return <Navigate replace to={user?.role === 'staff' ? '/staff' : '/owner'} />;
};

export const OwnerApp = () => (
  <AppFrame prefetchRoute={prefetchOwnerRoute}>
    <NotificationToastBridge />
    <Routes>
      <Route path="/" element={<OwnerRootRedirect />} />
      <Route element={<PublicOnlyRoute allowedRoles={['owner', 'staff']} />}>
        <Route
          path="/login"
          element={(
            <Login
              allowedRoles={['owner', 'staff']}
              portalLabel="Owner Web"
              showRegistration={false}
              subtitle="Quản lý lịch sân, đơn đặt, nhân viên và doanh thu trong một không gian vận hành riêng."
              title="Vận hành sân hiệu quả."
            />
          )}
        />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized fallbackPath="/login" />} />
      <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
        <Route path="/owner" element={<OwnerDashboard />} />
        <Route path="/owner/messages" element={<OwnerMessages />} />
        <Route path="/owner/notifications" element={<OwnerNotifications />} />
        <Route path="/owner/check-in" element={<OwnerCheckIn />} />
        <Route path="/owner/schedule" element={<OwnerDashboard />} />
        <Route path="/owner/bookings" element={<OwnerBookings kind="regular" />} />
        <Route path="/owner/match-bookings" element={<OwnerBookings kind="match" />} />
        <Route path="/owner/bookings/:id" element={<OwnerBookingDetail />} />
        <Route path="/owner/ticket-sessions" element={<OwnerTicketSessions />} />
        <Route path="/owner/ticket-sessions/:id" element={<OwnerTicketSessionDetail />} />
        <Route path="/owner/courts" element={<OwnerCourts />} />
        <Route path="/owner/courts/create" element={<OwnerCourtCreate />} />
        <Route path="/owner/courts/:id" element={<OwnerVenueDetail />} />
        <Route path="/owner/courts/:id/edit" element={<OwnerCourtEdit />} />
        <Route path="/owner/revenue" element={<OwnerRevenue />} />
        <Route path="/owner/settings" element={<OwnerSettings />} />
        <Route path="/owner/staff" element={<OwnerStaff />} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['staff']} />}>
        <Route path="/staff" element={<StaffDashboard />} />
      </Route>
      <Route path="*" element={<NotFound homePath="/" />} />
    </Routes>
  </AppFrame>
);
