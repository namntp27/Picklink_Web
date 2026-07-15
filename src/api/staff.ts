import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';
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
  bookingType: 'Court' | 'Match';
  matchId?: number | null;
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
  participantCount: number;
  checkedInParticipantCount: number;
  participants: StaffMatchParticipant[];
  checkInGroups: StaffCheckInGroup[];
  startTime: string;
  endTime: string;
  isCheckInWindowOpen: boolean;
  canMarkNoShow: boolean;
  codeVerifiedAt?: string | null;
  paymentConfirmedAt?: string | null;
  checkedInAt?: string | null;
  noShowAt?: string | null;
};

export type StaffCheckInGroup = {
  bookingCheckInGroupId: number;
  checkInCode: string;
  courtId: number;
  courtNumber: number;
  startTime: string;
  endTime: string;
  checkInStatus: 'Ready' | 'CheckedIn' | 'NoShow';
  isCheckInWindowOpen: boolean;
  canMarkNoShow: boolean;
  codeVerifiedAt?: string | null;
  checkedInAt?: string | null;
  noShowAt?: string | null;
};

export type StaffMatchParticipant = {
  playerId: number;
  playerName: string;
  isHost: boolean;
  paymentStatus: string;
  attendanceStatus: 'Pending' | 'Present' | 'Absent';
  attendanceAt?: string | null;
};

export type StaffNotification = {
  type: 'Payment' | 'Upcoming' | 'Overdue';
  title: string;
  message: string;
  bookingId: number;
  startTime: string;
};

export const getStaffAssignments = (token: string) => apiRequest<StaffAssignment[]>('/api/staff/assignments', {}, token);
export const getTodayStaffBookings = (
  token: string,
  date?: string,
  pagination: PaginationParams = {},
  bookingType?: 'Court' | 'Match',
) => {
  const params = new URLSearchParams();
  if (date) params.set('date', date);
  if (bookingType) params.set('bookingType', bookingType);
  if (pagination.page) params.set('page', String(pagination.page));
  if (pagination.pageSize) params.set('pageSize', String(pagination.pageSize));
  const query = params.toString();
  return apiRequest<PaginatedResponse<StaffBooking>>(`/api/staff/bookings/today${query ? `?${query}` : ''}`, {}, token);
};
export const searchStaffBooking = (token: string, code: string) => apiRequest<StaffBooking>(`/api/staff/bookings/search?code=${encodeURIComponent(code)}`, {}, token);
export const verifyStaffBookingCodeByCode = (token: string, code: string) => apiRequest<StaffBooking>('/api/staff/bookings/verify-code', { method: 'POST', body: JSON.stringify({ code }) }, token);
export const getStaffBooking = (token: string, bookingId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}`, {}, token);
export const verifyStaffBookingCode = (token: string, bookingId: number, code: string) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/verify-code`, { method: 'POST', body: JSON.stringify({ code }) }, token);
export const verifyStaffCheckInGroupCode = (token: string, bookingId: number, checkInGroupId: number, code: string) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/check-in-groups/${checkInGroupId}/verify-code`, { method: 'POST', body: JSON.stringify({ code }) }, token);
export const confirmStaffAtCourtPayment = (token: string, bookingId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/confirm-at-court-payment`, { method: 'POST' }, token);
export const checkInStaffBooking = (token: string, bookingId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/check-in`, { method: 'POST' }, token);
export const checkInStaffCheckInGroup = (token: string, bookingId: number, checkInGroupId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/check-in-groups/${checkInGroupId}/check-in`, { method: 'POST' }, token);
export const markStaffBookingNoShow = (token: string, bookingId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/no-show`, { method: 'POST' }, token);
export const markStaffCheckInGroupNoShow = (token: string, bookingId: number, checkInGroupId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/check-in-groups/${checkInGroupId}/no-show`, { method: 'POST' }, token);
export const checkInStaffMatchParticipant = (token: string, bookingId: number, playerId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/participants/${playerId}/check-in`, { method: 'POST' }, token);
export const markStaffMatchParticipantNoShow = (token: string, bookingId: number, playerId: number) => apiRequest<StaffBooking>(`/api/staff/bookings/${bookingId}/participants/${playerId}/no-show`, { method: 'POST' }, token);
export const getStaffNotifications = (token: string) => apiRequest<StaffNotification[]>('/api/staff/notifications', {}, token);
