import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { AppFrame } from '@/apps/AppFrame';
import { lazyPage } from '@/apps/lazyPage';
import { ProtectedRoute, PublicOnlyRoute } from '@/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { MatchFoundAlert } from '@/components/matches/MatchFoundAlert';
import { NotificationToastBridge } from '@/components/notifications/NotificationToastBridge';
import { prefetchPlayerRoute } from '@/navigation/playerRoutePrefetch';

const ForgotPassword = lazyPage(() => import('@/pages/auth/ForgotPassword'), 'ForgotPassword');
const Login = lazyPage(() => import('@/pages/auth/Login'), 'Login');
const NotFound = lazyPage(() => import('@/pages/auth/NotFound'), 'NotFound');
const Register = lazyPage(() => import('@/pages/auth/Register'), 'Register');
const Unauthorized = lazyPage(() => import('@/pages/auth/Unauthorized'), 'Unauthorized');
const BookingDetail = lazyPage(() => import('@/pages/bookings/BookingDetail'), 'BookingDetail');
const BookingFail = lazyPage(() => import('@/pages/bookings/BookingFail'), 'BookingFail');
const BookingSuccess = lazyPage(() => import('@/pages/bookings/BookingSuccess'), 'BookingSuccess');
const MyBookings = lazyPage(() => import('@/pages/bookings/MyBookings'), 'MyBookings');
const ClubDashboard = lazyPage(() => import('@/pages/clubs/ClubDashboard'), 'ClubDashboard');
const ClubDetail = lazyPage(() => import('@/pages/clubs/ClubDetail'), 'ClubDetail');
const Clubs = lazyPage(() => import('@/pages/clubs/Clubs'), 'Clubs');
const CreateClub = lazyPage(() => import('@/pages/clubs/CreateClub'), 'CreateClub');
const CreatePost = lazyPage(() => import('@/pages/community/CreatePost'), 'CreatePost');
const ClubPosts = lazyPage(() => import('@/pages/community/PostCollections'), 'ClubPosts');
const PostDetail = lazyPage(() => import('@/pages/community/PostDetail'), 'PostDetail');
const Posts = lazyPage(() => import('@/pages/community/Posts'), 'Posts');
const Friends = lazyPage(() => import('@/pages/community/Friends'), 'Friends');
const BookCourt = lazyPage(() => import('@/pages/courts/BookCourt'), 'BookCourt');
const Checkout = lazyPage(() => import('@/pages/courts/Checkout'), 'Checkout');
const CourtScheduleDetail = lazyPage(() => import('@/pages/courts/CourtScheduleDetail'), 'CourtScheduleDetail');
const Home = lazyPage(() => import('@/pages/home/Home'), 'Home');
const MatchDetail = lazyPage(() => import('@/pages/matches/MatchDetail'), 'MatchDetail');
const MyMatches = lazyPage(() => import('@/pages/matches/MyMatches'), 'MyMatches');
const Opponents = lazyPage(() => import('@/pages/matches/Opponents'), 'Opponents');
const PendingInvites = lazyPage(() => import('@/pages/matches/PendingInvites'), 'PendingInvites');
const QueueDetail = lazyPage(() => import('@/pages/matches/QueueDetail'), 'QueueDetail');
const Messages = lazyPage(() => import('@/pages/messages/Messages'), 'Messages');
const Notifications = lazyPage(() => import('@/pages/notifications/Notifications'), 'Notifications');
const Profile = lazyPage(() => import('@/pages/profile/Profile'), 'Profile');
const MySchedule = lazyPage(() => import('@/pages/schedule/MySchedule'), 'MySchedule');
const CreateReview = lazyPage(() => import('@/pages/reviews/CreateReview'), 'CreateReview');
const TicketSessions = lazyPage(() => import('@/pages/tickets/TicketSessions'), 'TicketSessions');
const TicketSessionDetail = lazyPage(() => import('@/pages/tickets/TicketSessionDetail'), 'TicketSessionDetail');
const MyTickets = lazyPage(() => import('@/pages/tickets/MyTickets'), 'MyTickets');
const MyTicketDetail = lazyPage(() => import('@/pages/tickets/MyTicketDetail'), 'MyTicketDetail');

const LegacyCourtDetailRedirect = () => {
  const { id } = useParams();
  return <Navigate replace to={id ? '/court/' + id + '/schedule' : '/book-court'} />;
};

const getPlayerMotionScope = (pathname: string) => {
  if (pathname === '/') return 'home' as const;

  const isProductWorkspace = (
    pathname.startsWith('/matches/')
    || pathname === '/opponents'
    || pathname.startsWith('/opponents/')
    || pathname === '/posts'
    || pathname.startsWith('/posts/')
    || pathname.startsWith('/my-')
    || pathname.startsWith('/ticket-sessions')
    || pathname.startsWith('/messages')
    || pathname.startsWith('/notifications')
    || pathname.startsWith('/profile')
    || pathname.startsWith('/checkout')
    || pathname.startsWith('/bookings/')
    || (pathname.startsWith('/clubs/') && pathname.endsWith('/dashboard'))
  );

  return isProductWorkspace ? 'product' as const : 'rich' as const;
};

export const PlayerApp = () => (
  <AppFrame getMotionScope={getPlayerMotionScope} prefetchRoute={prefetchPlayerRoute}>
    <MatchFoundAlert />
    <NotificationToastBridge />
    <Routes>
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="book-court" element={<BookCourt />} />
        <Route path="ticket-sessions" element={<TicketSessions />} />
        <Route path="ticket-sessions/:id" element={<TicketSessionDetail />} />
        <Route path="clubs" element={<Clubs />} />
        <Route path="listclubs" element={<Clubs />} />
        <Route path="posts" element={<Posts />} />
        <Route path="posts/friends" element={<Friends />} />
        <Route path="posts/clubs" element={<ClubPosts />} />
        <Route path="posts/:id" element={<PostDetail />} />
        <Route path="clubs/:id" element={<ClubDetail />} />
        <Route element={<ProtectedRoute allowedRoles={['player']} />}>
          <Route path="opponents" element={<PendingInvites />} />
          <Route path="opponents/pending" element={<PendingInvites />} />
          <Route path="opponents/create" element={<Opponents />} />
          <Route path="opponents/queue/:id" element={<QueueDetail />} />
          <Route path="matches/:id" element={<MatchDetail />} />
          <Route path="my-matches" element={<MyMatches />} />
          <Route path="my-schedule" element={<MySchedule />} />
          <Route path="my-bookings" element={<MyBookings />} />
          <Route path="my-tickets" element={<MyTickets />} />
          <Route path="my-tickets/:id" element={<MyTicketDetail />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="reviews/create" element={<CreateReview />} />
          <Route path="posts/create" element={<CreatePost />} />
          <Route path="clubs/create" element={<CreateClub />} />
          <Route path="clubs/:id/dashboard" element={<ClubDashboard />} />
          <Route path="messages" element={<Messages />} />
        </Route>
      </Route>
      <Route element={<PublicOnlyRoute allowedRoles={['player']} />}>
        <Route path="/login" element={<Login allowedRoles={['player']} portalLabel="Player Web" />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/unauthorized" element={<Unauthorized fallbackPath="/login" />} />
      <Route element={<ProtectedRoute allowedRoles={['player']} />}>
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/checkout/success" element={<BookingSuccess />} />
        <Route path="/checkout/fail" element={<BookingFail />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
      </Route>
      <Route path="/court/:id/schedule" element={<CourtScheduleDetail />} />
      <Route path="/court/:id" element={<LegacyCourtDetailRedirect />} />
      <Route path="*" element={<NotFound homePath="/" />} />
    </Routes>
  </AppFrame>
);
