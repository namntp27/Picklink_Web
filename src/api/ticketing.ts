import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type TicketSessionStatus = 'Draft' | 'Published' | 'Completed' | 'Cancelled';
export type SessionTicketStatus = 'PendingPayment' | 'Paid' | 'CheckedIn' | 'Cancelled' | 'Expired' | 'RefundPending' | 'Refunded';

export type TicketSession = {
  ticketSessionId: number;
  bookingId: number;
  venueId: number;
  venueName: string;
  venueAddress: string;
  venuePhone?: string | null;
  venueLatitude?: number | null;
  venueLongitude?: number | null;
  courtId: number;
  courtNumber: number;
  courtType?: string | null;
  title: string;
  description?: string | null;
  skillLevel: string;
  playFormat: string;
  startTime: string;
  endTime: string;
  maxPlayers: number;
  soldTickets: number;
  reservedTickets: number;
  remainingTickets: number;
  ticketPrice: number;
  cancellationDeadlineHours: number;
  status: TicketSessionStatus;
  createdAt: string;
  publishedAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
};

export type SePayTransaction = {
  sePayTransactionId: number;
  externalTransactionId: number;
  amount: number;
  status: string;
  receivedAt: string;
  refundedAt?: string | null;
  refundReference?: string | null;
};

export type SessionTicket = {
  sessionTicketId: number;
  ticketSessionId: number;
  playerId: number;
  playerName: string;
  playerEmail?: string | null;
  ticketCode: string;
  status: SessionTicketStatus;
  createdAt: string;
  holdExpiresAt?: string | null;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
  checkedInAt?: string | null;
  checkedInByStaffId?: number | null;
  paymentId: number;
  paymentStatus: string;
  amount: number;
  transferContent?: string | null;
  bankCode?: string | null;
  bankName?: string | null;
  bankAccountNumber?: string | null;
  bankAccountName?: string | null;
  qrImageUrl?: string | null;
  paidAt?: string | null;
  sePayTransactions: SePayTransaction[];
  session?: TicketSession | null;
};

export type StaffTicketParticipant = {
  sessionTicketId: number;
  playerId: number;
  playerName: string;
  ticketCode: string;
  ticketStatus: SessionTicketStatus;
  paymentStatus: string;
  paidAt?: string | null;
  checkedInAt?: string | null;
  checkedInByStaffId?: number | null;
};

export type TicketSessionParticipants = {
  session: TicketSession;
  tickets: SessionTicket[];
};

export type StaffTicketSessionParticipants = {
  session: TicketSession;
  tickets: StaffTicketParticipant[];
};

export type TicketSessionInput = {
  venueId: number;
  courtId: number;
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  description?: string;
  skillLevel: string;
  playFormat: string;
  maxPlayers: number;
  ticketPrice: number;
};

export type TicketSessionSearch = PaginationParams & {
  search?: string;
  venueId?: number;
  date?: string;
  skillLevel?: string;
  playFormat?: string;
  minPrice?: number;
  maxPrice?: number;
  onlyAvailable?: boolean;
};

const queryString = (values: Record<string, string | number | boolean | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? '?' + query : '';
};

export const getTicketSessions = (filters: TicketSessionSearch = {}) =>
  apiRequest<PaginatedResponse<TicketSession>>('/api/ticket-sessions' + queryString(filters));

export const getTicketSession = (ticketSessionId: number) =>
  apiRequest<TicketSession>('/api/ticket-sessions/' + ticketSessionId);

export const buySessionTicket = (token: string, ticketSessionId: number) =>
  apiRequest<SessionTicket>('/api/ticket-sessions/' + ticketSessionId + '/tickets', { method: 'POST' }, token);

export const getPlayerTickets = (token: string, filters: PaginationParams & { status?: string } = {}) =>
  apiRequest<PaginatedResponse<SessionTicket>>('/api/player/tickets' + queryString(filters), {}, token);

export const getPlayerTicket = (token: string, ticketId: number) =>
  apiRequest<SessionTicket>('/api/player/tickets/' + ticketId, {}, token);

export const cancelPlayerTicket = (token: string, ticketId: number, reason?: string) =>
  apiRequest<SessionTicket>('/api/player/tickets/' + ticketId + '/cancel', {
    method: 'POST',
    body: JSON.stringify({ reason: reason?.trim() || undefined }),
  }, token);

export const getOwnerTicketSessions = (token: string, filters: PaginationParams & { status?: string } = {}) =>
  apiRequest<PaginatedResponse<TicketSession>>('/api/owner/ticket-sessions' + queryString(filters), {}, token);

export const createOwnerTicketSession = (token: string, input: TicketSessionInput) =>
  apiRequest<TicketSession>('/api/owner/ticket-sessions', { method: 'POST', body: JSON.stringify(input) }, token);

export const updateOwnerTicketSession = (token: string, ticketSessionId: number, input: TicketSessionInput) =>
  apiRequest<TicketSession>('/api/owner/ticket-sessions/' + ticketSessionId, { method: 'PUT', body: JSON.stringify(input) }, token);

export const publishOwnerTicketSession = (token: string, ticketSessionId: number) =>
  apiRequest<TicketSession>('/api/owner/ticket-sessions/' + ticketSessionId + '/publish', { method: 'POST' }, token);

export const cancelOwnerTicketSession = (token: string, ticketSessionId: number, reason: string) =>
  apiRequest<TicketSession>('/api/owner/ticket-sessions/' + ticketSessionId + '/cancel', {
    method: 'POST',
    body: JSON.stringify({ reason: reason.trim() }),
  }, token);

export const getOwnerTicketSessionParticipants = (token: string, ticketSessionId: number) =>
  apiRequest<TicketSessionParticipants>('/api/owner/ticket-sessions/' + ticketSessionId + '/participants', {}, token);

export const checkInOwnerSessionTicket = (token: string, ticketSessionId: number, ticketCode: string) =>
  apiRequest<SessionTicket>('/api/owner/ticket-sessions/' + ticketSessionId + '/tickets/check-in', {
    method: 'POST',
    body: JSON.stringify({ ticketCode: ticketCode.trim() }),
  }, token);

export const completeOwnerTicketRefund = (token: string, ticketSessionId: number, ticketId: number, reference: string) =>
  apiRequest<SessionTicket>('/api/owner/ticket-sessions/' + ticketSessionId + '/tickets/' + ticketId + '/refund', {
    method: 'POST',
    body: JSON.stringify({ reference: reference.trim() }),
  }, token);

export const completeOwnerAdditionalRefund = (
  token: string,
  ticketSessionId: number,
  ticketId: number,
  sePayTransactionId: number,
  reference: string,
) => apiRequest<SePayTransaction>(
  '/api/owner/ticket-sessions/' + ticketSessionId + '/tickets/' + ticketId
    + '/sepay-transactions/' + sePayTransactionId + '/refund',
  { method: 'POST', body: JSON.stringify({ reference: reference.trim() }) },
  token,
);

export const getStaffTicketSessions = (
  token: string,
  filters: PaginationParams & { date?: string } = {},
  options: Pick<RequestInit, 'signal'> = {},
) => apiRequest<PaginatedResponse<TicketSession>>('/api/staff/ticket-sessions' + queryString(filters), options, token);

export const getStaffTicketSessionParticipants = (token: string, ticketSessionId: number) =>
  apiRequest<StaffTicketSessionParticipants>('/api/staff/ticket-sessions/' + ticketSessionId + '/participants', {}, token);

export const checkInSessionTicket = (token: string, ticketCode: string) =>
  apiRequest<StaffTicketParticipant>('/api/staff/tickets/check-in', {
    method: 'POST',
    body: JSON.stringify({ ticketCode: ticketCode.trim() }),
  }, token);
