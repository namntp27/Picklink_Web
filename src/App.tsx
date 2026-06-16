import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './pages/Home';
import { BookCourt } from './pages/BookCourt';
import { Clubs } from './pages/Clubs';
import { Posts } from './pages/Posts';
import { Tournaments } from './pages/Tournaments';
import { Opponents } from './pages/Opponents';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AdminDashboard } from './pages/AdminDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { Checkout } from './pages/Checkout';
import { CourtDetail } from './pages/CourtDetail';
import { CreateClub } from './pages/CreateClub';
import { ClubDashboard } from './pages/ClubDashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="book-court" element={<BookCourt />} />
        <Route path="opponents" element={<Opponents />} />
        <Route path="clubs" element={<Clubs />} />
        <Route path="listclubs" element={<Clubs />} />
        <Route path="posts" element={<Posts />} />
        <Route path="clubs/create" element={<CreateClub />} />
        <Route path="clubs/:id/dashboard" element={<ClubDashboard />} />
        <Route path="tournaments" element={<Tournaments />} />
      </Route>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/owner" element={<OwnerDashboard />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/court/:id" element={<CourtDetail />} />
    </Routes>
  );
}

export default App;
