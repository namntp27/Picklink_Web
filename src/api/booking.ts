import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

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
  isFavorite: boolean;
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
  paymentGroupId?: string | null;
  groupPaymentCount: number;
  groupTotalAmount: number;
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
  slots?: Array<{
    courtId: number;
    courtNumber: number;
    startTime: string;
    endTime: string;
  }>;
  history: PaymentHistory[];
};

export type BookingHolding = {
  bookingId: number;
  bookingCode: string;
  status: 'Holding' | 'Confirmed' | 'Completed' | 'Expired' | 'Cancelled';
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
  checkInStatus: 'NotOpen' | 'Ready' | 'CheckedIn' | 'NoShow' | 'Missed' | 'NotApplicable';
  checkedInAt?: string | null;
  checkInCode?: string | null;
  canCancel: boolean;
  canRetryPayment: boolean;
  canReview: boolean;
  hasReviewed: boolean;
  bankTransfer?: BankTransfer | null;
  statusHistory: BookingHistory[];
  slots: Array<{
    bookingSlotId: number;
    courtId: number;
    courtNumber: number;
    checkInGroupId?: number | null;
    startTime: string;
    endTime: string;
    hourlyPrice: number;
    courtAmount: number;
  }>;
  checkInGroups: Array<{
    bookingCheckInGroupId: number;
    courtId: number;
    courtNumber: number;
    startTime: string;
    endTime: string;
    checkInCode?: string | null;
    checkInStatus: string;
    checkedInAt?: string | null;
  }>;
};

export type BookingHoldSlot = {
  courtId: number;
  startTime: string;
};

export type BookingHoldingGroup = {
  paymentGroupId: string;
  totalAmount: number;
  bookings: BookingHolding[];
};

const normalizeBookingHolding = (booking: BookingHolding): BookingHolding => ({
  ...booking,
  slots: booking.slots ?? [],
  checkInGroups: booking.checkInGroups ?? [],
  statusHistory: booking.statusHistory ?? [],
});

export type VenueFilters = PaginationParams & {
  search?: string;
  area?: string;
  minPrice?: number;
  maxPrice?: number;
  favoritesOnly?: boolean;
};

export const getBookingVenues = (filters: VenueFilters = {}, token?: string | null) => {
  const params = new URLSearchParams();
  if (filters.search?.trim()) params.set('search', filters.search.trim());
  if (filters.area?.trim()) params.set('area', filters.area.trim());
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  if (filters.favoritesOnly) params.set('favoritesOnly', 'true');
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const query = params.toString();
  return apiRequest<PaginatedResponse<BookingVenue>>(`/api/player-bookings/venues${query ? `?${query}` : ''}`, {}, token ?? undefined);
};

export const addFavoriteVenue = (token: string, venueId: number) => apiRequest<void>(`/api/player-bookings/favorites/${venueId}`, { method: 'PUT' }, token);

export const removeFavoriteVenue = (token: string, venueId: number) => apiRequest<void>(`/api/player-bookings/favorites/${venueId}`, { method: 'DELETE' }, token);

export const getCourtAvailability = (venueId: number, date: string, token?: string | null) => apiRequest<CourtAvailability>(`/api/player-bookings/venues/${venueId}/availability?date=${encodeURIComponent(date)}`, {}, token ?? undefined);

export const createBookingHolding = (token: string, input: { date: string; slots: BookingHoldSlot[] }) => apiRequest<BookingHolding>('/api/player-bookings/hold', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const getBookingHolding = (token: string, bookingId: number) =>
  apiRequest<BookingHolding>(`/api/player-bookings/${bookingId}`, {}, token).then(normalizeBookingHolding);

export const getBookingHoldingGroup = (token: string, paymentGroupId: string) =>
  apiRequest<BookingHoldingGroup>(`/api/player-bookings/payment-groups/${paymentGroupId}`, {}, token);

export const getMyBookingHistory = (token: string, pagination: PaginationParams = {}) => {
  const params = new URLSearchParams();
  if (pagination.page) params.set('page', String(pagination.page));
  if (pagination.pageSize) params.set('pageSize', String(pagination.pageSize));
  const query = params.toString();
  return apiRequest<PaginatedResponse<BookingHolding>>(`/api/player-bookings/mine${query ? `?${query}` : ''}`, {}, token);
};

export const cancelBookingHolding = (token: string, bookingId: number) => apiRequest<void>(`/api/player-bookings/${bookingId}/hold`, {
  method: 'DELETE',
}, token);

export const cancelPlayerBooking = (token: string, bookingId: number, reason: string) => apiRequest<void>(`/api/player-bookings/${bookingId}/cancel`, {
  method: 'POST',
  body: JSON.stringify({ reason }),
}, token);

export const retryBookingPayment = (token: string, bookingId: number) => apiRequest<BookingHolding>(`/api/player-bookings/${bookingId}/retry-payment`, {
  method: 'POST',
}, token);

export const completeBookingPayment = (token: string, bookingId: number, paymentMethod: 'Wallet' | 'BankTransfer' | 'AtCourt') => apiRequest<BookingHolding>(`/api/player-bookings/${bookingId}/pay`, {
  method: 'POST',
  body: JSON.stringify({ paymentMethod }),
}, token);
