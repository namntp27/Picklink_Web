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
  { id: 'overview', label: 'TÃ¡Â»â€¢ng quan', to: '/admin', icon: LayoutDashboard },
  { id: 'users', label: 'NgÃ†Â°Ã¡Â»Âi dÃƒÂ¹ng', to: '/admin/users', icon: Users },
  { id: 'courts', label: 'SÃƒÂ¢n', to: '/admin/courts', icon: LandPlot },
  { id: 'clubs', label: 'CLB', to: '/admin/clubs', icon: UsersRound },
  { id: 'bookings', label: 'Booking', to: '/admin/bookings', icon: CalendarCheck },
  { id: 'reports', label: 'BÃƒÂ¡o cÃƒÂ¡o', to: '/admin/reports', icon: Flag },
  { id: 'posts', label: 'BÃƒÂ i viÃ¡ÂºÂ¿t', to: '/admin/posts', icon: FileText },
  { id: 'reviews', label: 'Ã„ÂÃƒÂ¡nh giÃƒÂ¡', to: '/admin/reviews', icon: Star },
  { id: 'transactions', label: 'Giao dÃ¡Â»â€¹ch', to: '/admin/transactions', icon: CreditCard },
  { id: 'settings', label: 'CÃ¡ÂºÂ¥u hÃƒÂ¬nh', to: '/admin/settings', icon: Settings },
];
