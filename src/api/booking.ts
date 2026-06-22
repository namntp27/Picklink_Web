import { apiRequest } from './client';

export type BookingVenue = {
  venueId: number;
  venueName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  overallRating: number;
  openTime: string;
  closeTime: string;
  imageUrl?: string | null;
  fromPrice: number;
  courtCount: number;
};

export type BookingCourt = {
  courtId: number;
  courtNumber: number;
  courtType: string;
  surfaceType?: string | null;
  isIndoor: boolean;
  hourlyPrice: number;
};

export type AvailabilitySlot = {
  courtId: number;
  startTime: string;
  endTime: string;
  status: 'Available' | 'Holding' | 'Booked' | 'Blocked' | 'Maintenance' | 'Event' | 'Closed';
  bookingId?: number | null;
  isOwnedByCurrentUser?: boolean;
};

export type CourtAvailability = {
  venueId: number;
  venueName: string;
  address: string;
  openTime: string;
  closeTime: string;
  date: string;
  slotMinutes: number;
  courts: BookingCourt[];
  slots: AvailabilitySlot[];
};

export type BookingHistory = {
  fromStatus?: string | null;
  toStatus: string;
  reason?: string | null;
  changedAt: string;
};

export type PaymentHistory = {
  fromStatus?: string | null;
  toStatus: string;
  action: string;
  reason?: string | null;
  createdAt: string;
};

export type BankTransfer = {
  paymentId: number;
  bookingId: number;
  bookingCode: string;
  bookingStatus: string;
  paymentStatus: 'Pending' | 'WaitingForConfirmation' | 'Paid' | 'Expired' | 'Cancelled';
  amount: number;
  transferCode?: string | null;
  transferContent?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  qrImageUrl?: string | null;
  receiptImageUrl?: string | null;
  submittedAt?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  holdExpiresAt?: string | null;
  venueId: number;
  venueName: string;
  courtNumber: number;
  startTime: string;
  endTime: string;
  playerName: string;
  history: PaymentHistory[];
};

export type BookingHolding = {
  bookingId: number;
  bookingCode: string;
  status: 'Holding' | 'Confirmed' | 'Expired' | 'Cancelled';
  createdAt: string;
  holdExpiresAt?: string | null;
  venueId: number;
  venueName: string;
  address: string;
  courtId: number;
  courtNumber: number;
  startTime: string;
  endTime: string;
  durationHours: number;
  hourlyPrice: number;
  courtAmount: number;
  totalAmount: number;
  paymentStatus: string;
  bankTransfer?: BankTransfer | null;
  statusHistory: BookingHistory[];
};

export const getBookingVenues = () => apiRequest<BookingVenue[]>('/api/player-bookings/venues');

export const getCourtAvailability = (venueId: number, date: string, token?: string | null) => apiRequest<CourtAvailability>(`/api/player-bookings/venues/${venueId}/availability?date=${encodeURIComponent(date)}`, {}, token ?? undefined);

export const createBookingHolding = (token: string, input: { courtId: number; date: string; slotStarts: string[] }) => apiRequest<BookingHolding>('/api/player-bookings/hold', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const getBookingHolding = (token: string, bookingId: number) => apiRequest<BookingHolding>(`/api/player-bookings/${bookingId}`, {}, token);

export const cancelBookingHolding = (token: string, bookingId: number) => apiRequest<void>(`/api/player-bookings/${bookingId}/hold`, {
  method: 'DELETE',
}, token);

export const completeBookingPayment = (token: string, bookingId: number, paymentMethod: 'Wallet' | 'BankTransfer' | 'AtCourt') => apiRequest<BookingHolding>(`/api/player-bookings/${bookingId}/pay`, {
  method: 'POST',
  body: JSON.stringify({ paymentMethod }),
}, token);
