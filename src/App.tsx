import React, { Suspense, type ComponentType } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { ToastProvider } from './components/ui/ToastRegion';

const lazyPage = <TModule extends Record<string, unknown>>(
  loader: () => Promise<TModule>,
  exportName: keyof TModule,
) => React.lazy(async () => {
  const module = await loader();
  return { default: module[exportName] as ComponentType<any> };
});

const ForgotPassword = lazyPage(() => import('./pages/auth/ForgotPassword'), 'ForgotPassword');
const Login = lazyPage(() => import('./pages/auth/Login'), 'Login');
const NotFound = lazyPage(() => import('./pages/auth/NotFound'), 'NotFound');
const Register = lazyPage(() => import('./pages/auth/Register'), 'Register');
const Unauthorized = lazyPage(() => import('./pages/auth/Unauthorized'), 'Unauthorized');
const BookingDetail = lazyPage(() => import('./pages/bookings/BookingDetail'), 'BookingDetail');
const BookingFail = lazyPage(() => import('./pages/bookings/BookingFail'), 'BookingFail');
const BookingSuccess = lazyPage(() => import('./pages/bookings/BookingSuccess'), 'BookingSuccess');
const MyBookings = lazyPage(() => import('./pages/bookings/MyBookings'), 'MyBookings');
const ClubDashboard = lazyPage(() => import('./pages/clubs/ClubDashboard'), 'ClubDashboard');
const ClubDetail = lazyPage(() => import('./pages/clubs/ClubDetail'), 'ClubDetail');
const ClubMembers = lazyPage(() => import('./pages/clubs/ClubMembers'), 'ClubMembers');
const Clubs = lazyPage(() => import('./pages/clubs/Clubs'), 'Clubs');
const CreateClub = lazyPage(() => import('./pages/clubs/CreateClub'), 'CreateClub');
const CreatePost = lazyPage(() => import('./pages/community/CreatePost'), 'CreatePost');
const ClubPosts = lazyPage(() => import('./pages/community/PostCollections'), 'ClubPosts');
const SavedPosts = lazyPage(() => import('./pages/community/PostCollections'), 'SavedPosts');
const TrendingPosts = lazyPage(() => import('./pages/community/PostCollections'), 'TrendingPosts');
const PostDetail = lazyPage(() => import('./pages/community/PostDetail'), 'PostDetail');
const Posts = lazyPage(() => import('./pages/community/Posts'), 'Posts');
const BookCourt = lazyPage(() => import('./pages/courts/BookCourt'), 'BookCourt');
const Checkout = lazyPage(() => import('./pages/courts/Checkout'), 'Checkout');
const CourtDetail = lazyPage(() => import('./pages/courts/CourtDetail'), 'CourtDetail');
const CourtScheduleDetail = lazyPage(() => import('./pages/courts/CourtScheduleDetail'), 'CourtScheduleDetail');
const Home = lazyPage(() => import('./pages/home/Home'), 'Home');
const MatchDetail = lazyPage(() => import('./pages/matches/MatchDetail'), 'MatchDetail');
const MyMatches = lazyPage(() => import('./pages/matches/MyMatches'), 'MyMatches');
const Opponents = lazyPage(() => import('./pages/matches/Opponents'), 'Opponents');
const PendingInvites = lazyPage(() => import('./pages/matches/PendingInvites'), 'PendingInvites');
const Messages = lazyPage(() => import('./pages/messages/Messages'), 'Messages');
const Notifications = lazyPage(() => import('./pages/notifications/Notifications'), 'Notifications');
const Profile = lazyPage(() => import('./pages/profile/Profile'), 'Profile');
const CreateReview = lazyPage(() => import('./pages/reviews/CreateReview'), 'CreateReview');
const AdminBookings = lazyPage(() => import('./pages/admin/AdminBookings'), 'AdminBookings');
const AdminClubs = lazyPage(() => import('./pages/admin/AdminClubs'), 'AdminClubs');
const AdminCourts = lazyPage(() => import('./pages/admin/AdminCourts'), 'AdminCourts');
const AdminDashboard = lazyPage(() => import('./pages/admin/AdminDashboard'), 'AdminDashboard');
const AdminPosts = lazyPage(() => import('./pages/admin/AdminPosts'), 'AdminPosts');
const AdminReports = lazyPage(() => import('./pages/admin/AdminReports'), 'AdminReports');
const AdminReviews = lazyPage(() => import('./pages/admin/AdminReviews'), 'AdminReviews');
const AdminSettings = lazyPage(() => import('./pages/admin/AdminSettings'), 'AdminSettings');
const AdminTransactions = lazyPage(() => import('./pages/admin/AdminTransactions'), 'AdminTransactions');
const AdminUsers = lazyPage(() => import('./pages/admin/AdminUsers'), 'AdminUsers');
const OwnerBookingDetail = lazyPage(() => import('./pages/owner/OwnerBookingDetail'), 'OwnerBookingDetail');
const OwnerBookings = lazyPage(() => import('./pages/owner/OwnerBookings'), 'OwnerBookings');
const OwnerCourtCreate = lazyPage(() => import('./pages/owner/OwnerCourtCreate'), 'OwnerCourtCreate');
const OwnerCourtEdit = lazyPage(() => import('./pages/owner/OwnerCourtEdit'), 'OwnerCourtEdit');
const OwnerCourts = lazyPage(() => import('./pages/owner/OwnerCourts'), 'OwnerCourts');
const OwnerDashboard = lazyPage(() => import('./pages/owner/OwnerDashboard'), 'OwnerDashboard');
const OwnerRevenue = lazyPage(() => import('./pages/owner/OwnerRevenue'), 'OwnerRevenue');
const OwnerSettings = lazyPage(() => import('./pages/owner/OwnerSettings'), 'OwnerSettings');
const OwnerStaff = lazyPage(() => import('./pages/owner/OwnerStaff'), 'OwnerStaff');
const OwnerVenueDetail = lazyPage(() => import('./pages/owner/OwnerVenueDetail'), 'OwnerVenueDetail');
const StaffDashboard = lazyPage(() => import('./pages/staff/StaffDashboard'), 'StaffDashboard');

const RouteFallback = () => <div aria-label="Dang tai" className="min-h-dvh bg-background" />;

function App() {
  const { pathname } = useLocation();
  const isProductWorkspace = (
    pathname.startsWith('/admin')
    || pathname.startsWith('/owner')
    || pathname.startsWith('/staff')
    || pathname.startsWith('/matches/')
    || pathname === '/opponents'
    || pathname.startsWith('/opponents/')
    || pathname === '/posts'
    || pathname.startsWith('/posts/')
    || pathname.startsWith('/my-')
    || pathname.startsWith('/messages')
    || pathname.startsWith('/notifications')
    || pathname.startsWith('/profile')
    || pathname.startsWith('/checkout')
    || pathname.startsWith('/bookings/')
    || (pathname.startsWith('/clubs/') && pathname.endsWith('/dashboard'))
  );
  const motionScope = pathname === '/' ? 'home' : isProductWorkspace ? 'product' : 'rich';

  return (
    <ToastProvider>
      <div className="picklink-app-shell" data-motion-scope={motionScope}>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Home />} />
              <Route path="book-court" element={<BookCourt />} />
              <Route path="clubs" element={<Clubs />} />
              <Route path="listclubs" element={<Clubs />} />
              <Route path="posts" element={<Posts />} />
              <Route path="posts/trending" element={<TrendingPosts />} />
              <Route path="posts/saved" element={<SavedPosts />} />
              <Route path="posts/clubs" element={<ClubPosts />} />
              <Route path="posts/:id" element={<PostDetail />} />
              <Route path="clubs/:id/members" element={<ClubMembers />} />
              <Route path="clubs/:id" element={<ClubDetail />} />
              <Route element={<ProtectedRoute allowedRoles={['player']} />}>
                <Route path="opponents" element={<PendingInvites />} />
                <Route path="opponents/pending" element={<PendingInvites />} />
                <Route path="opponents/create" element={<Opponents />} />
                <Route path="matches/:id" element={<MatchDetail />} />
                <Route path="my-matches" element={<MyMatches />} />
                <Route path="my-bookings" element={<MyBookings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="messages" element={<Messages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="reviews/create" element={<CreateReview />} />
                <Route path="posts/create" element={<CreatePost />} />
                <Route path="clubs/create" element={<CreateClub />} />
                <Route path="clubs/:id/dashboard" element={<ClubDashboard />} />
              </Route>
            </Route>
            <Route element={<PublicOnlyRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
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
            <Route element={<ProtectedRoute allowedRoles={['owner']} />}>
              <Route path="/owner" element={<OwnerDashboard />} />
              <Route path="/owner/schedule" element={<OwnerDashboard />} />
              <Route path="/owner/bookings" element={<OwnerBookings kind="regular" />} />
              <Route path="/owner/match-bookings" element={<OwnerBookings kind="match" />} />
              <Route path="/owner/bookings/:id" element={<OwnerBookingDetail />} />
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
            <Route element={<ProtectedRoute allowedRoles={['player']} />}>
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout/success" element={<BookingSuccess />} />
              <Route path="/checkout/fail" element={<BookingFail />} />
              <Route path="/bookings/:id" element={<BookingDetail />} />
            </Route>
            <Route path="/court/:id/schedule" element={<CourtScheduleDetail />} />
            <Route path="/court/:id" element={<CourtDetail />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </div>
    </ToastProvider>
  );
}

export default App;