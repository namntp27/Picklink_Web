import type { LucideIcon } from 'lucide-react';
import {
  CalendarCheck,
  CreditCard,
  FileText,
  Flag,
  LandPlot,
  LayoutDashboard,
  Settings,
  Star,
  Trophy,
  Users,
  UsersRound,
} from 'lucide-react';
import type { AdminSectionId } from './types';

export const adminNavItems: Array<{
  id: AdminSectionId;
  label: string;
  to: string;
  icon: LucideIcon;
}> = [
  { id: 'overview', label: 'Tổng quan', to: '/admin', icon: LayoutDashboard },
  { id: 'users', label: 'Người dùng', to: '/admin/users', icon: Users },
  { id: 'courts', label: 'Sân', to: '/admin/courts', icon: LandPlot },
  { id: 'clubs', label: 'CLB', to: '/admin/clubs', icon: UsersRound },
  { id: 'bookings', label: 'Booking', to: '/admin/bookings', icon: CalendarCheck },
  { id: 'reports', label: 'Báo cáo', to: '/admin/reports', icon: Flag },
  { id: 'posts', label: 'Bài viết', to: '/admin/posts', icon: FileText },
  { id: 'reviews', label: 'Đánh giá', to: '/admin/reviews', icon: Star },
  { id: 'tournaments', label: 'Giải đấu', to: '/admin/tournaments', icon: Trophy },
  { id: 'transactions', label: 'Giao dịch', to: '/admin/transactions', icon: CreditCard },
  { id: 'settings', label: 'Cấu hình', to: '/admin/settings', icon: Settings },
];
