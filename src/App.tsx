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
import { Clubs } from './pages/clubs/Clubs';
import { CreateClub } from './pages/clubs/CreateClub';
import { MatchDetail } from './pages/community/MatchDetail';
import { MyMatches } from './pages/community/MyMatches';
import { Opponents } from './pages/community/Opponents';
import { PendingInvites } from './pages/community/PendingInvites';
import { Posts } from './pages/community/Posts';
import { Checkout } from './pages/courts/Checkout';
import { BookCourt } from './pages/courts/BookCourt';
import { CourtDetail } from './pages/courts/CourtDetail';
import { CourtScheduleDetail } from './pages/courts/CourtScheduleDetail';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { OwnerDashboard } from './pages/dashboard/OwnerDashboard';
import { Home } from './pages/home/Home';
import { Notifications } from './pages/notifications/Notifications';
import { Profile } from './pages/profile/Profile';
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
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="clubs" element={<Clubs />} />
        <Route path="listclubs" element={<Clubs />} />
        <Route path="posts" element={<Posts />} />
        <Route path="clubs/create" element={<CreateClub />} />
        <Route path="clubs/:id" element={<ClubDetail />} />
        <Route path="clubs/:id/dashboard" element={<ClubDashboard />} />
        <Route path="tournaments" element={<Tournaments />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/owner" element={<OwnerDashboard />} />
      <Route path="/owner/schedule" element={<OwnerDashboard />} />
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
