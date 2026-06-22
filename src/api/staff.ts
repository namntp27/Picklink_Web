import { apiRequest } from './client';
import type { StaffPermission } from './owner';

export type StaffAssignment = {
  staffId: number;
  venueId: number;
  venueName: string;
  role: string;
  permissions: StaffPermission[];
};

export type StaffBooking = {
  bookingId: number;
  bookingCode: string;
  bookingStatus: string;
  checkInStatus: 'NotOpen' | 'Ready' | 'CheckedIn' | 'NoShow' | 'Cancelled';
  paymentStatus: string;
  paymentMethod?: string | null;
  amount: number;
  venueId: number;
  venueName: string;
  address: string;
  courtId: number;
  courtNumber: number;
  playerName: string;
  startTime: string;
  endTime: string;
  isCheckInWindowOpen: boolean;
  canMarkNoShow: boolean;
  codeVerifiedAt?: string | null;
  paymentConfirmedAt?: string | null;
  checkedInAt?: string | null;
  noShowAt?: string | null;
};

export type StaffNotification = {
  type: 'Payment' | 'Upcoming' | 'Overdue';
  title: string;
  message: string;
  bookingId: number;
  startTime: string;
};

export const getStaffAssignments = (token: string) => apiRequest<StaffAssignment[]>('/api/staff/assignments', {}, token);
export const getTodayStaffBookings = (token: string, date?: string) => apiRequest<StaffBooking[]>(`/api/staff/bookings/today${date ? `?date=${encodeURIComponent(date)}` : ''}`, {}, token);
export const searchStaffBooking = (token: string, code: string) => apiRequest<StaffBooking>(`/api/staff/bookings/search?code=${encodeURIComponent(code)}`, {}, token);
export const getStaffBooking = (token: string, bookingId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}`, {}, token);
export const verifyStaffBookingCode = (token: string, bookingId: number, code: string) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/verify-code`, { method: 'POST', body: JSON.stringify({ code }) }, token);
export const confirmStaffAtCourtPayment = (token: string, bookingId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/confirm-at-court-payment`, { method: 'POST' }, token);
export const checkInStaffBooking = (token: string, bookingId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/check-in`, { method: 'POST' }, token);
export const markStaffBookingNoShow = (token: string, bookingId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/no-show`, { method: 'POST' }, token);
export const getStaffNotifications = (token: string) => apiRequest<StaffNotification[]>('/api/staff/notifications', {}, token);
