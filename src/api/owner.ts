import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';
import type { ListingFeePayment, ListingFeeStatus } from './listingFees';

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
  amount: number;
  paymentStatus?: string | null;
  isOwnerBlock: boolean;
  isOwnerEntry: boolean;
  entryType?: OwnerScheduleEntryType | null;
  title?: string | null;
};

export type OwnerScheduleEntryType = 'Blocked' | 'Maintenance' | 'Event';

export type OwnerScheduleSlot = {
  courtId: number;
  venueId: number;
  venueName: string;
  courtNumber: number;
  startTime: string;
  endTime: string;
  status: 'Available' | 'Holding' | 'Booked' | 'Blocked' | 'Maintenance' | 'Event' | 'Closed' | 'Inactive';
  bookingId?: number | null;
  entryType?: OwnerScheduleEntryType | null;
  title?: string | null;
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
  rejectionReason?: string | null;
  bookingHistory: Array<{ fromStatus?: string | null; toStatus: string; reason?: string | null; actorName?: string | null; changedAt: string }>;
  paymentHistory: Array<{ fromStatus?: string | null; toStatus: string; action: string; reason?: string | null; actorName?: string | null; createdAt: string }>;
};

export type OwnerRevenueReport = {
  from: string;
  to: string;
  grossRevenue: number;
  paidBookings: number;
  pendingAmount: number;
  cancelledBookings: number;
  averageBookingValue: number;
  daily: Array<{ date: string; revenue: number; bookingCount: number }>;
  bookings: OwnerBookingRecord[];
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
    items: (result.items ?? []).map((item) => ({ ...item, isOwnerEntry: item.isOwnerEntry ?? item.isOwnerBlock, entryType: item.entryType ?? (item.isOwnerBlock ? 'Blocked' : null) })),
    slots: result.slots ?? [],
  };
};

export const createOwnerScheduleEntry = (token: string, input: { courtId: number; startTime: string; endTime: string; entryType: OwnerScheduleEntryType; title?: string }) => apiRequest<OwnerScheduleItem>('/api/owner/schedule/entries', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const deleteOwnerScheduleEntry = (token: string, bookingId: number) => apiRequest<void>(`/api/owner/schedule/entries/${bookingId}`, { method: 'DELETE' }, token);

export const createOwnerScheduleBlock = (token: string, input: { courtId: number; startTime: string; endTime: string }) => apiRequest<OwnerScheduleItem>('/api/owner/schedule/blocks', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const deleteOwnerScheduleBlock = (token: string, bookingId: number) => apiRequest<void>(`/api/owner/schedule/blocks/${bookingId}`, { method: 'DELETE' }, token);

export const updateOwnerBookingStatus = (token: string, bookingId: number, status: 'Confirmed' | 'Cancelled') => apiRequest<{ bookingId: number; status: string }>(`/api/owner/bookings/${bookingId}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status }),
}, token);

export const getOwnerStaff = (token: string) => apiRequest<OwnerStaffAssignment[]>('/api/owner/staff', {}, token);

export const assignOwnerStaff = (token: string, input: { venueId: number; email: string; role?: string; permissions: StaffPermission[] }) => apiRequest<OwnerStaffAssignment>('/api/owner/staff', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const createOwnerStaffAccount = (token: string, input: { venueId: number; username: string; email: string; password: string; role?: string; permissions: StaffPermission[] }) => apiRequest<OwnerStaffAssignment>('/api/owner/staff/accounts', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const updateOwnerStaff = (token: string, staffId: number, input: { role?: string; permissions: StaffPermission[]; isActive: boolean }) => apiRequest<OwnerStaffAssignment>(`/api/owner/staff/${staffId}`, {
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

export const getOwnerRevenueReport = (token: string, from: string, to: string) => apiRequest<OwnerRevenueReport>(`/api/owner/reports/revenue?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, {}, token);
