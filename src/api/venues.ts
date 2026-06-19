import { apiRequest } from './client';
import type {
  BlockedSlot,
  CourtDetail,
  CourtInput,
  CourtListItem,
  Province,
  VenueDetail,
  VenueInput,
  VenueListItem,
  Ward,
} from '../types/venue';

const toQuery = (values: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const administrativeApi = {
  provinces: () => apiRequest<Province[]>('/administrative-units/provinces'),
  wards: (provinceId: string) => apiRequest<Ward[]>(`/administrative-units/provinces/${provinceId}/wards`),
};

export const publicVenueApi = {
  venues: (filters: Record<string, string | number | undefined> = {}) =>
    apiRequest<VenueListItem[]>(`/venues${toQuery(filters)}`),
  venue: (id: string) => apiRequest<VenueDetail>(`/venues/${id}`),
  courts: (filters: Record<string, string | number | undefined> = {}) =>
    apiRequest<CourtListItem[]>(`/courts${toQuery(filters)}`),
  court: (id: string) => apiRequest<CourtDetail>(`/courts/${id}`),
};

export const ownerVenueApi = {
  venues: () => apiRequest<VenueListItem[]>('/owner/venues', {}, { auth: true }),
  venue: (id: string) => apiRequest<VenueDetail>(`/owner/venues/${id}`, {}, { auth: true }),
  createVenue: (input: VenueInput) => apiRequest<string>('/owner/venues', {
    method: 'POST', body: JSON.stringify(input),
  }, { auth: true }),
  updateVenue: (id: string, input: VenueInput) => apiRequest<void>(`/owner/venues/${id}`, {
    method: 'PUT', body: JSON.stringify(input),
  }, { auth: true }),
  deleteVenue: (id: string) => apiRequest<void>(`/owner/venues/${id}`, { method: 'DELETE' }, { auth: true }),
  submitVenue: (id: string) => apiRequest<void>(`/owner/venues/${id}/submit`, { method: 'POST' }, { auth: true }),
  courts: () => apiRequest<CourtListItem[]>('/owner/courts', {}, { auth: true }),
  court: (id: string) => apiRequest<CourtDetail>(`/owner/courts/${id}`, {}, { auth: true }),
  createCourt: (input: Required<CourtInput>) => apiRequest<string>('/owner/courts', {
    method: 'POST', body: JSON.stringify(input),
  }, { auth: true }),
  updateCourt: (id: string, input: Omit<CourtInput, 'venueId'>) => apiRequest<void>(`/owner/courts/${id}`, {
    method: 'PUT', body: JSON.stringify(input),
  }, { auth: true }),
  deleteCourt: (id: string) => apiRequest<void>(`/owner/courts/${id}`, { method: 'DELETE' }, { auth: true }),
  addBlockedSlot: (courtId: string, input: Omit<BlockedSlot, 'id'>) => apiRequest<string>(`/owner/courts/${courtId}/blocked-slots`, {
    method: 'POST', body: JSON.stringify(input),
  }, { auth: true }),
  deleteBlockedSlot: (courtId: string, slotId: string) =>
    apiRequest<void>(`/owner/courts/${courtId}/blocked-slots/${slotId}`, { method: 'DELETE' }, { auth: true }),
};

export const adminVenueApi = {
  venues: (filters: Record<string, string | number | undefined> = {}) =>
    apiRequest<VenueListItem[]>(`/admin/venues${toQuery(filters)}`, {}, { auth: true }),
  venue: (id: string) => apiRequest<VenueDetail>(`/admin/venues/${id}`, {}, { auth: true }),
  approve: (id: string) => apiRequest<void>(`/admin/venues/${id}/approve`, { method: 'POST' }, { auth: true }),
  reject: (id: string, reason: string) => apiRequest<void>(`/admin/venues/${id}/reject`, {
    method: 'POST', body: JSON.stringify({ reason }),
  }, { auth: true }),
  suspend: (id: string, reason: string) => apiRequest<void>(`/admin/venues/${id}/suspend`, {
    method: 'POST', body: JSON.stringify({ reason }),
  }, { auth: true }),
};

export const uploadApi = {
  image: async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest<{ url: string }>('/uploads/images', { method: 'POST', body: form }, { auth: true });
  },
};
