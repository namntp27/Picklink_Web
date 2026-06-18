import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
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
import { MatchDetail } from './pages/community/MatchDetail';
import { MyMatches } from './pages/community/MyMatches';
import { Opponents } from './pages/community/Opponents';
import { PendingInvites } from './pages/community/PendingInvites';
import { SavedPosts, TrendingPosts } from './pages/community/PostCollections';
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
import { OwnerDashboard } from './pages/owner/OwnerDashboard';
import { OwnerRevenue } from './pages/owner/OwnerRevenue';
import { OwnerSettings } from './pages/owner/OwnerSettings';
import { Home } from './pages/home/Home';
import { Messages } from './pages/messages/Messages';
import { Notifications } from './pages/notifications/Notifications';
import { Profile } from './pages/profile/Profile';
import { CreateReview } from './pages/reviews/CreateReview';
import { MyTournaments } from './pages/tournaments/MyTournaments';
import { TournamentDetail } from './pages/tournaments/TournamentDetail';
import { Tournaments } from './pages/tournaments/Tournaments';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="book-court" element={<BookCourt />} />
        <Route path="opponents" element={<Opponents />} />
        <Route path="opponents/pending" element={<PendingInvites />} />
        <Route path="matches/:id" element={<MatchDetail />} />
        <Route path="my-matches" element={<MyMatches />} />
        <Route path="my-bookings" element={<MyBookings />} />
        <Route path="my-tournaments" element={<MyTournaments />} />
        <Route path="profile" element={<Profile />} />
        <Route path="messages" element={<Messages />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="reviews/create" element={<CreateReview />} />
        <Route path="clubs" element={<Clubs />} />
        <Route path="listclubs" element={<Clubs />} />
        <Route path="posts" element={<Posts />} />
        <Route path="posts/create" element={<CreatePost />} />
        <Route path="posts/trending" element={<TrendingPosts />} />
        <Route path="posts/saved" element={<SavedPosts />} />
        <Route path="posts/:id" element={<PostDetail />} />
        <Route path="clubs/create" element={<CreateClub />} />
        <Route path="clubs/:id/members" element={<ClubMembers />} />
        <Route path="clubs/:id/dashboard" element={<ClubDashboard />} />
        <Route path="clubs/:id" element={<ClubDetail />} />
        <Route path="tournaments" element={<Tournaments />} />
        <Route path="tournaments/:id" element={<TournamentDetail />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
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
      <Route path="/owner" element={<OwnerDashboard />} />
      <Route path="/owner/schedule" element={<OwnerDashboard />} />
      <Route path="/owner/bookings" element={<OwnerBookings />} />
      <Route path="/owner/bookings/:id" element={<OwnerBookingDetail />} />
      <Route path="/owner/courts" element={<OwnerCourts />} />
      <Route path="/owner/courts/create" element={<OwnerCourtCreate />} />
      <Route path="/owner/courts/:id/edit" element={<OwnerCourtEdit />} />
      <Route path="/owner/revenue" element={<OwnerRevenue />} />
      <Route path="/owner/settings" element={<OwnerSettings />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/checkout/success" element={<BookingSuccess />} />
      <Route path="/checkout/fail" element={<BookingFail />} />
      <Route path="/bookings/:id" element={<BookingDetail />} />
      <Route path="/court/:id/schedule" element={<CourtScheduleDetail />} />
      <Route path="/court/:id" element={<CourtDetail />} />
    </Routes>
  );
}

export default App;
