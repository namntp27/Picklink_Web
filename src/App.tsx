import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ProtectedRoute, PublicOnlyRoute } from './auth/ProtectedRoute';
import { MainLayout } from './components/layout/MainLayout';
import { ToastProvider } from './components/ui/ToastRegion';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Login } from './pages/auth/Login';
import { NotFound } from './pages/auth/NotFound';
import { Register } from './pages/auth/Register';
import { Unauthorized } from './pages/auth/Unauthorized';
import { BookingDetail } from './pages/bookings/BookingDetail';
import { BookingFail } from './pages/bookings/BookingFail';
import { BookingSuccess } from './pages/bookings/BookingSuccess';
import { MyBookings } from './pages/bookings/MyBookings';
import { ClubDashboard } from './pages/clubs/ClubDashboard';
import { ClubDetail } from './pages/clubs/ClubDetail';
import { ClubMembers } from './pages/clubs/ClubMembers';
import { Clubs } from './pages/clubs/Clubs';
import { CreateClub } from './pages/clubs/CreateClub';
import { CreatePost } from './pages/community/CreatePost';
import { MatchDetail } from './pages/matches/MatchDetail';
import { MyMatches } from './pages/matches/MyMatches';
import { Opponents } from './pages/matches/Opponents';
import { PendingInvites } from './pages/matches/PendingInvites';
import { SavedPosts, TrendingPosts, ClubPosts } from './pages/community/PostCollections';
import { PostDetail } from './pages/community/PostDetail';
import { Posts } from './pages/community/Posts';
import { Checkout } from './pages/courts/Checkout';
import { BookCourt } from './pages/courts/BookCourt';
import { CourtDetail } from './pages/courts/CourtDetail';
import { CourtScheduleDetail } from './pages/courts/CourtScheduleDetail';
import { AdminBookings } from './pages/admin/AdminBookings';
import { AdminClubs } from './pages/admin/AdminClubs';
import { AdminCourts } from './pages/admin/AdminCourts';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminPosts } from './pages/admin/AdminPosts';
import { AdminReports } from './pages/admin/AdminReports';
import { AdminReviews } from './pages/admin/AdminReviews';
import { AdminSettings } from './pages/admin/AdminSettings';
import { AdminTournaments } from './pages/admin/AdminTournaments';
import { AdminTransactions } from './pages/admin/AdminTransactions';
import { AdminUsers } from './pages/admin/AdminUsers';
import { OwnerBookingDetail } from './pages/owner/OwnerBookingDetail';
import { OwnerBookings } from './pages/owner/OwnerBookings';
import { OwnerCourtCreate } from './pages/owner/OwnerCourtCreate';
import { OwnerCourtEdit } from './pages/owner/OwnerCourtEdit';
import { OwnerCourts } from './pages/owner/OwnerCourts';
import { OwnerVenueDetail } from './pages/owner/OwnerVenueDetail';
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerRevenue } from './pages/owner/OwnerRevenue';
import { OwnerSettings } from './pages/owner/OwnerSettings';
import { OwnerStaff } from './pages/owner/OwnerStaff';
import { StaffDashboard } from './pages/staff/StaffDashboard';
import { Home } from './pages/home/Home';
import { Messages } from './pages/messages/Messages';
import { Notifications } from './pages/notifications/Notifications';
import { Profile } from './pages/profile/Profile';
import { CreateReview } from './pages/reviews/CreateReview';
import { MyTournaments } from './pages/tournaments/MyTournaments';
import { TournamentDetail } from './pages/tournaments/TournamentDetail';
import { Tournaments } from './pages/tournaments/Tournaments';

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
          <Route path="tournaments" element={<Tournaments />} />
          <Route path="tournaments/:id" element={<TournamentDetail />} />
          <Route element={<ProtectedRoute allowedRoles={['player']} />}>
            <Route path="opponents" element={<PendingInvites />} />
            <Route path="opponents/pending" element={<PendingInvites />} />
            <Route path="opponents/create" element={<Opponents />} />
            <Route path="matches/:id" element={<MatchDetail />} />
            <Route path="my-matches" element={<MyMatches />} />
            <Route path="my-bookings" element={<MyBookings />} />
            <Route path="my-tournaments" element={<MyTournaments />} />
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
          <Route path="/admin/tournaments" element={<AdminTournaments />} />
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
      </div>
    </ToastProvider>
  );
}

export default App;
