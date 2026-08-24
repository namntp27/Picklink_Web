import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';
import type { ListingFeePayment, ListingFeeStatus } from './listingFees';
import { optimizeReceiptImage } from '../utils/receiptImage';

export type OwnerCourt = {
  courtId: number;
  venueId: number;
  courtNumber: number;
  surfaceType?: string | null;
  courtType: string;
  hourlyPrice: number;
  isIndoor: boolean;
  availabilityStatus: 'Available' | 'Maintenance' | 'Inactive';
};

export type OwnerVenueImage = {
  venueImageId: number;
  imageUrl: string;
  caption?: string | null;
  isPrimary: boolean;
  sortOrder: number;
};

export type OwnerVenue = {
  venueId: number;
  venueName: string;
  address: string;
  overallRating: number;
  openTime: string;
  closeTime: string;
  phoneNumber?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  basePrice: number;
  isOpen: boolean;
  approvalStatus: 'Draft' | 'Pending' | 'Approved' | 'Rejected';
  rejectionReason?: string | null;
  listingStatus: ListingFeeStatus;
  listingExpiresAt?: string | null;
  latestListingPayment?: ListingFeePayment | null;
  amenities: string[];
  images: OwnerVenueImage[];
  courts: OwnerCourt[];
};

export type OwnerVenueReview = {
  ratingId: number;
  bookingId?: number | null;
  reviewerName: string;
  courtNumber?: number | null;
  score: number;
  comment?: string | null;
  tags: string[];
  isAnonymous: boolean;
  createdAt: string;
};

export type OwnerVenueInput = {
  venueName: string;
  address: string;
  openTime: string;
  closeTime: string;
  phoneNumber?: string;
  latitude?: number | null;
  longitude?: number | null;
  basePrice: number;
  initialCourtCount?: number;
  amenities: string[];
};

export type OwnerCourtInput = {
  courtNumber: number;
  surfaceType?: string;
  courtType: string;
  hourlyPrice: number;
  isIndoor: boolean;
  availabilityStatus: OwnerCourt['availabilityStatus'];
};

export type OwnerScheduleItem = {
  bookingId: number;
  courtId: number;
  venueId: number;
  venueName: string;
  courtNumber: number;
  startTime: string;
  endTime: string;
  status: string;
  customerName?: string | null;
  customerPhone?: string | null;
  customerUserId?: number | null;
  amount: number;
  paymentStatus?: string | null;
  checkInStatus?: string | null;
  canCancel: boolean;
  requiresRefund?: boolean;
  refundPending?: boolean;
  isOwnerBlock: boolean;
  isOwnerEntry: boolean;
  entryType?: OwnerScheduleDisplayEntryType | null;
  title?: string | null;
};

// "Maintenance" is only kept for rows written before it merged into "Blocked".
export type OwnerScheduleEntryType = 'Blocked' | 'Maintenance' | 'Event' | 'WalkIn' | 'WalkInUnpaid';
export type OwnerWalkInPaymentMethod = 'Cash' | 'BankTransfer' | 'Unpaid';

export type OwnerPlayerSearchResult = {
  playerId: number;
  userId: number;
  playerName: string;
  phoneNumber?: string | null;
};
export type OwnerScheduleDisplayEntryType = OwnerScheduleEntryType | 'TicketSession';

export type OwnerScheduleSlot = {
  courtId: number;
  venueId: number;
  venueName: string;
  courtNumber: number;
  startTime: string;
  endTime: string;
  status: 'Available' | 'Holding' | 'Booked' | 'Blocked' | 'Maintenance' | 'Event' | 'TicketSession' | 'Closed' | 'Inactive';
  bookingId?: number | null;
  checkInStatus?: string | null;
  entryType?: OwnerScheduleDisplayEntryType | null;
  title?: string | null;
  /** The occurrence covering this cell when the booking spans multiple slots (e.g. a whole-month package). Null for single-slot bookings and owner-created entries. */
  bookingCheckInGroupId?: number | null;
  /** Whether THIS occurrence specifically can still be cancelled — unlike the booking-level flag, an earlier or already checked-in occurrence in the same multi-slot booking does not lock out a later one. */
  canCancel: boolean;
};

export type OwnerSchedule = {
  date: string;
  startDate: string;
  endDate: string;
  view: 'day' | 'week';
  slotMinutes: number;
  venues: OwnerVenue[];
  items: OwnerScheduleItem[];
  slots: OwnerScheduleSlot[];
};

export type StaffPermission = 'ViewBookings' | 'VerifyBooking' | 'ConfirmPayment' | 'CheckIn' | 'MarkNoShow';

export type OwnerStaffAssignment = {
  staffId: number;
  userId: number;
  username: string;
  email: string;
  venueId: number;
  venueName: string;
  role: string;
  permissions: StaffPermission[];
  isActive: boolean;
  assignedAt: string;
  revokedAt?: string | null;
};

export type OwnerCheckInHistory = {
  bookingId: number;
  bookingCode: string;
  venueId: number;
  venueName: string;
  courtNumber: number;
  playerName: string;
  startTime: string;
  checkInStatus: string;
  codeVerifiedAt?: string | null;
  codeVerifiedBy?: string | null;
  paymentConfirmedAt?: string | null;
  paymentConfirmedBy?: string | null;
  checkedInAt?: string | null;
  checkedInBy?: string | null;
  noShowAt?: string | null;
  noShowBy?: string | null;
};

export type OwnerBookingRecord = {
  bookingId: number;
  matchId?: number | null;
  matchType?: string | null;
  requiredPlayerCount?: number | null;
  acceptedPlayerCount?: number | null;
  matchPlayers?: Array<{
    playerId: number;
    userId?: number;
    playerName: string;
    isHost: boolean;
    paymentStatus: string;
  }>;
  bookingCode: string;
  bookingStatus: string;
  checkInStatus: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  paymentId?: number | null;
  totalAmount: number;
  refundAmount: number;
  courtAmount: number;
  hourlyPrice: number;
  venueId: number;
  venueName: string;
  venuePhone?: string | null;
  address: string;
  courtId: number;
  courtNumber: number;
  playerName: string;
  playerEmail?: string | null;
  playerCity?: string | null;
  playerCommune?: string | null;
  startTime: string;
  endTime: string;
  slots: Array<{ bookingSlotId: number; courtId: number; courtNumber: number; startTime: string; endTime: string; courtAmount: number }>;
  checkInGroups: Array<{ bookingCheckInGroupId: number; courtId: number; courtNumber: number; startTime: string; endTime: string; checkInStatus: string }>;
  createdAt: string;
  holdExpiresAt?: string | null;
  codeVerifiedAt?: string | null;
  paymentConfirmedAt?: string | null;
  checkedInAt?: string | null;
  noShowAt?: string | null;
  codeVerifiedBy?: string | null;
  paymentConfirmedBy?: string | null;
  checkedInBy?: string | null;
  noShowBy?: string | null;
  paymentPaidAt?: string | null;
  paymentVerifiedAt?: string | null;
  transferCode?: string | null;
  receiptImageUrl?: string | null;
  refundProofImageUrl?: string | null;
  refundReference?: string | null;
  refundProofSubmittedAt?: string | null;
  refundDisputeStatus?: 'Open' | 'Resolved' | 'Closed' | null;
  refundDisputeReason?: string | null;
  refundDisputedAt?: string | null;
  refundDisputeResolution?: string | null;
  refundDisputeResolvedAt?: string | null;
  rejectionReason?: string | null;
  bookingHistory: Array<{ fromStatus?: string | null; toStatus: string; reason?: string | null; actorName?: string | null; changedAt: string }>;
  paymentHistory: Array<{ fromStatus?: string | null; toStatus: string; action: string; reason?: string | null; actorName?: string | null; createdAt: string }>;
};

export type OwnerTicketRevenueRecord = {
  sessionTicketId: number;
  ticketSessionId: number;
  ticketCode: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string | null;
  amount: number;
  refundAmount: number;
  sessionTitle: string;
  playerName: string;
  playerEmail?: string | null;
  venueId: number;
  venueName: string;
  venueAddress: string;
  courtId: number;
  courtNumber: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  paymentPaidAt?: string | null;
};

export type OwnerRevenueReport = {
  from: string;
  to: string;
  grossRevenue: number;
  paidBookings: number;
  pendingAmount: number;
  refundedAmount: number;
  cancelledBookings: number;
  averageBookingValue: number;
  daily: Array<{ date: string; revenue: number; bookingCount: number }>;
  bookings: OwnerBookingRecord[];
  tickets: OwnerTicketRevenueRecord[];
};

const withSeconds = (value: string) => value.length === 5 ? `${value}:00` : value;

const mapVenueInput = (input: OwnerVenueInput) => ({
  ...input,
  openTime: withSeconds(input.openTime),
  closeTime: withSeconds(input.closeTime),
  initialCourtCount: input.initialCourtCount ?? 0,
});

const normalizeOwnerVenue = (venue: OwnerVenue): OwnerVenue => ({
  ...venue,
  isOpen: venue.isOpen ?? true,
  approvalStatus: venue.approvalStatus ?? 'Draft',
  rejectionReason: venue.rejectionReason ?? null,
  listingStatus: venue.listingStatus ?? 'Unpaid',
  listingExpiresAt: venue.listingExpiresAt ?? null,
  latestListingPayment: venue.latestListingPayment ?? null,
  amenities: venue.amenities ?? [],
  images: venue.images ?? [],
  courts: (venue.courts ?? []).map((court) => ({
    ...court,
    courtType: court.courtType ?? 'Tiêu chuẩn',
    hourlyPrice: court.hourlyPrice ?? venue.basePrice ?? 0,
  })),
});

export const getOwnerVenues = async (token: string) => (await apiRequest<OwnerVenue[]>('/api/owner/venues', {}, token)).map(normalizeOwnerVenue);

export const getOwnerVenue = async (token: string, venueId: number) => normalizeOwnerVenue(await apiRequest<OwnerVenue>(`/api/owner/venues/${venueId}`, {}, token));

export const getOwnerVenueReviews = (token: string, venueId: number) =>
  apiRequest<OwnerVenueReview[]>(`/api/owner/venues/${venueId}/reviews`, {}, token);

export const createOwnerVenue = async (token: string, input: OwnerVenueInput) => normalizeOwnerVenue(await apiRequest<OwnerVenue>('/api/owner/venues', {
  method: 'POST',
  body: JSON.stringify(mapVenueInput(input)),
}, token));

export const updateOwnerVenue = async (token: string, venueId: number, input: OwnerVenueInput) => normalizeOwnerVenue(await apiRequest<OwnerVenue>(`/api/owner/venues/${venueId}`, {
  method: 'PUT',
  body: JSON.stringify(mapVenueInput(input)),
}, token));

export const deleteOwnerVenue = (token: string, venueId: number) => apiRequest<void>(`/api/owner/venues/${venueId}`, { method: 'DELETE' }, token);

export const setOwnerVenueOpenStatus = async (token: string, venueId: number, isOpen: boolean) => normalizeOwnerVenue(await apiRequest<OwnerVenue>(`/api/owner/venues/${venueId}/open-status`, {
  method: 'PATCH',
  body: JSON.stringify({ isOpen }),
}, token));

export const submitOwnerVenue = async (token: string, venueId: number) => normalizeOwnerVenue(await apiRequest<OwnerVenue>(`/api/owner/venues/${venueId}/submit`, { method: 'POST' }, token));

export const uploadOwnerVenueImage = (token: string, venueId: number, image: File, caption = '') => {
  const formData = new FormData();
  formData.append('image', image);
  if (caption.trim()) formData.append('caption', caption.trim());
  return apiRequest<OwnerVenueImage>(`/api/owner/venues/${venueId}/images`, { method: 'POST', body: formData }, token);
};

export const setPrimaryOwnerVenueImage = async (token: string, venueId: number, imageId: number) => normalizeOwnerVenue(await apiRequest<OwnerVenue>(`/api/owner/venues/${venueId}/images/${imageId}/primary`, { method: 'PATCH' }, token));

export const deleteOwnerVenueImage = (token: string, venueId: number, imageId: number) => apiRequest<void>(`/api/owner/venues/${venueId}/images/${imageId}`, { method: 'DELETE' }, token);

export const createOwnerCourt = (token: string, venueId: number, input: OwnerCourtInput) => apiRequest<OwnerCourt>(`/api/owner/venues/${venueId}/courts`, {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const updateOwnerCourt = (token: string, courtId: number, input: OwnerCourtInput) => apiRequest<OwnerCourt>(`/api/owner/courts/${courtId}`, {
  method: 'PUT',
  body: JSON.stringify(input),
}, token);

export const deleteOwnerCourt = (token: string, courtId: number) => apiRequest<void>(`/api/owner/courts/${courtId}`, { method: 'DELETE' }, token);

export const getOwnerSchedule = async (token: string, date: string, view: 'day' | 'week' = 'day') => {
  const result = await apiRequest<OwnerSchedule>(`/api/owner/schedule?date=${encodeURIComponent(date)}&view=${view}`, {}, token);
  return {
    ...result,
    startDate: result.startDate ?? result.date,
    endDate: result.endDate ?? result.date,
    view: result.view ?? view,
    slotMinutes: result.slotMinutes ?? 30,
    venues: (result.venues ?? []).map(normalizeOwnerVenue),
    items: (result.items ?? []).map((item) => ({ ...item, canCancel: item.canCancel ?? true, isOwnerEntry: item.isOwnerEntry ?? item.isOwnerBlock, entryType: item.entryType ?? (item.isOwnerBlock ? 'Blocked' : null) })),
    slots: result.slots ?? [],
  };
};

export const createOwnerScheduleEntry = (token: string, input: {
  courtId: number;
  startTime: string;
  endTime: string;
  entryType: OwnerScheduleEntryType;
  title?: string;
  customerPlayerId?: number;
  customerName?: string;
  customerPhone?: string;
  amount?: number;
  paymentMethod?: OwnerWalkInPaymentMethod;
}) => apiRequest<OwnerScheduleItem>('/api/owner/schedule/entries', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const searchOwnerPlayers = (token: string, query: string) =>
  apiRequest<OwnerPlayerSearchResult[]>(`/api/owner/players/search?query=${encodeURIComponent(query)}`, {}, token);

export const deleteOwnerScheduleEntry = (token: string, bookingId: number) => apiRequest<void>(`/api/owner/schedule/entries/${bookingId}`, { method: 'DELETE' }, token);

export const createOwnerScheduleBlock = (token: string, input: { courtId: number; startTime: string; endTime: string }) => apiRequest<OwnerScheduleItem>('/api/owner/schedule/blocks', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const deleteOwnerScheduleBlock = (token: string, bookingId: number) => apiRequest<void>(`/api/owner/schedule/blocks/${bookingId}`, { method: 'DELETE' }, token);

export const updateOwnerBookingStatus = (token: string, bookingId: number, status: 'Confirmed' | 'Cancelled', reason?: string) => apiRequest<{ bookingId: number; status: string }>(`/api/owner/bookings/${bookingId}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status, reason }),
}, token);

/** Cancels a single occurrence (e.g. one day of a whole-month package) instead of the whole booking. */
export const cancelOwnerBookingCheckInGroup = (token: string, bookingId: number, bookingCheckInGroupId: number, reason: string) => apiRequest<void>(`/api/owner/bookings/${bookingId}/check-in-groups/${bookingCheckInGroupId}/cancel`, {
  method: 'PATCH',
  body: JSON.stringify({ reason }),
}, token);

export const submitOwnerBookingRefundProof = async (
  token: string,
  bookingId: number,
  proof: File,
  reference?: string,
) => {
  const optimized = await optimizeReceiptImage(proof);
  const formData = new FormData();
  formData.append('proof', optimized);
  if (reference?.trim()) formData.append('reference', reference.trim());
  return apiRequest<void>(`/api/owner/bookings/${bookingId}/refund`, {
    method: 'POST',
    body: formData,
  }, token);
};

export const getOwnerStaff = (token: string) => apiRequest<OwnerStaffAssignment[]>('/api/owner/staff', {}, token);

export const assignOwnerStaff = (token: string, input: { venueIds: number[]; email: string; role?: string; permissions: StaffPermission[] }) => apiRequest<OwnerStaffAssignment>('/api/owner/staff', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const createOwnerStaffAccount = (token: string, input: { venueIds: number[]; username: string; email: string; password: string; role?: string; permissions: StaffPermission[] }) => apiRequest<OwnerStaffAssignment>('/api/owner/staff/accounts', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const updateOwnerStaff = (token: string, staffId: number, input: { venueIds?: number[]; username?: string; email?: string; role?: string; permissions: StaffPermission[]; isActive: boolean }) => apiRequest<OwnerStaffAssignment>(`/api/owner/staff/${staffId}`, {
  method: 'PATCH',
  body: JSON.stringify(input),
}, token);

export const getOwnerCheckInHistory = (token: string, filters: { venueId?: number; date?: string } & PaginationParams = {}) => {
  const params = new URLSearchParams();
  if (filters.venueId) params.set('venueId', String(filters.venueId));
  if (filters.date) params.set('date', filters.date);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  const query = params.toString();
  return apiRequest<PaginatedResponse<OwnerCheckInHistory>>(`/api/owner/staff/check-in-history${query ? `?${query}` : ''}`, {}, token);
};

export const getOwnerBookings = (token: string, filters: {
  from?: string;
  to?: string;
  status?: string;
  search?: string;
  bookingType?: 'regular' | 'match';
} & PaginationParams = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, String(value)); });
  const query = params.toString();
  return apiRequest<PaginatedResponse<OwnerBookingRecord>>(`/api/owner/bookings${query ? `?${query}` : ''}`, {}, token);
};

export const getOwnerBooking = (token: string, bookingId: number) => apiRequest<OwnerBookingRecord>(`/api/owner/bookings/${bookingId}`, {}, token);

export type OwnerRevenueSource = 'Court' | 'Match' | 'Ticket';

export const getOwnerRevenueReport = (token: string, from: string, to: string, source?: OwnerRevenueSource) => {
  const params = `from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}` + (source ? `&source=${source}` : '');
  return apiRequest<OwnerRevenueReport>(`/api/owner/reports/revenue?${params}`, {}, token);
};
