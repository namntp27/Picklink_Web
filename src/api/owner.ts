import { apiRequest } from './client';

export type OwnerCourt = {
  courtId: number;
  venueId: number;
  courtNumber: number;
  surfaceType?: string | null;
  isIndoor: boolean;
  availabilityStatus: 'Available' | 'Maintenance' | 'Inactive';
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
  amenities: string[];
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
};

export type OwnerSchedule = {
  date: string;
  venues: OwnerVenue[];
  items: OwnerScheduleItem[];
};

const withSeconds = (value: string) => value.length === 5 ? `${value}:00` : value;

const mapVenueInput = (input: OwnerVenueInput) => ({
  ...input,
  openTime: withSeconds(input.openTime),
  closeTime: withSeconds(input.closeTime),
  initialCourtCount: input.initialCourtCount ?? 0,
});

export const getOwnerVenues = (token: string) => apiRequest<OwnerVenue[]>('/api/owner/venues', {}, token);

export const getOwnerVenue = (token: string, venueId: number) => apiRequest<OwnerVenue>(`/api/owner/venues/${venueId}`, {}, token);

export const createOwnerVenue = (token: string, input: OwnerVenueInput) => apiRequest<OwnerVenue>('/api/owner/venues', {
  method: 'POST',
  body: JSON.stringify(mapVenueInput(input)),
}, token);

export const updateOwnerVenue = (token: string, venueId: number, input: OwnerVenueInput) => apiRequest<OwnerVenue>(`/api/owner/venues/${venueId}`, {
  method: 'PUT',
  body: JSON.stringify(mapVenueInput(input)),
}, token);

export const deleteOwnerVenue = (token: string, venueId: number) => apiRequest<void>(`/api/owner/venues/${venueId}`, { method: 'DELETE' }, token);

export const createOwnerCourt = (token: string, venueId: number, input: OwnerCourtInput) => apiRequest<OwnerCourt>(`/api/owner/venues/${venueId}/courts`, {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const updateOwnerCourt = (token: string, courtId: number, input: OwnerCourtInput) => apiRequest<OwnerCourt>(`/api/owner/courts/${courtId}`, {
  method: 'PUT',
  body: JSON.stringify(input),
}, token);

export const deleteOwnerCourt = (token: string, courtId: number) => apiRequest<void>(`/api/owner/courts/${courtId}`, { method: 'DELETE' }, token);

export const getOwnerSchedule = (token: string, date: string) => apiRequest<OwnerSchedule>(`/api/owner/schedule?date=${encodeURIComponent(date)}`, {}, token);

export const createOwnerScheduleBlock = (token: string, input: { courtId: number; startTime: string; endTime: string }) => apiRequest<OwnerScheduleItem>('/api/owner/schedule/blocks', {
  method: 'POST',
  body: JSON.stringify(input),
}, token);

export const deleteOwnerScheduleBlock = (token: string, bookingId: number) => apiRequest<void>(`/api/owner/schedule/blocks/${bookingId}`, { method: 'DELETE' }, token);

export const updateOwnerBookingStatus = (token: string, bookingId: number, status: 'Confirmed' | 'Cancelled') => apiRequest<{ bookingId: number; status: string }>(`/api/owner/bookings/${bookingId}/status`, {
  method: 'PATCH',
  body: JSON.stringify({ status }),
}, token);
