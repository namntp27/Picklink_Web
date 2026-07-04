import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';

export type MatchFormat = '1vs1' | '2vs2';
export type MatchStatus =
  | 'Recruiting'
  | 'ReadyToBook'
  | 'BookingPending'
  | 'Booked'
  | 'Completed'
  | 'Cancelled'
  | 'Expired';
export type ParticipantStatus =
  | 'Invited'
  | 'Pending'
  | 'Approved'
  | 'Accepted'
  | 'Rejected'
  | 'Withdrawn'
  | 'Left'
  | 'Removed';

export type MatchPreferredVenue = {
  venueId: number;
  venueName: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  distanceKm?: number | null;
};

export type MatchAvailabilitySlot = {
  matchAvailabilitySlotId: number;
  timeStart: string;
  timeEnd: string;
};

export type MatchSummary = {
  matchId: number;
  hostPlayerId: number;
  hostName: string;
  hostAvatarUrl?: string | null;
  matchType: MatchFormat;
  matchSkillLevel: number;
  minSkillLevel: number;
  maxSkillLevel: number;
  status: MatchStatus;
  title: string;
  note?: string | null;
  province: string;
  ward: string;
  searchRadiusKm: number;
  searchLatitude?: number | null;
  searchLongitude?: number | null;
  availableDateFrom: string;
  availableDateTo: string;
  preferredTimeStart: string;
  preferredTimeEnd: string;
  availabilitySlots: MatchAvailabilitySlot[];
  neededPlayerCount: number;
  requiredPlayerCount: number;
  acceptedPlayerCount: number;
  pendingRequestCount: number;
  availableSlotCount: number;
  preferredVenues: MatchPreferredVenue[];
  courtId?: number | null;
  courtNumber?: number | null;
  venueId?: number | null;
  venueName?: string | null;
  address?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  totalBookingAmount: number;
  amountPerPlayer: number;
  isHost: boolean;
  myParticipantStatus?: ParticipantStatus | null;
  myPaymentStatus?: string | null;
};

export type MatchParticipant = {
  participantId: number;
  playerId: number;
  playerName: string;
  avatarUrl?: string | null;
  skillLevel: number;
  status: ParticipantStatus;
  isHost: boolean;
  requestedAt: string;
  respondedAt?: string | null;
  paymentId?: number | null;
  paymentStatus?: string | null;
  qrImageUrl?: string | null;
  transferContent?: string | null;
  paymentRejectionReason?: string | null;
  checkInStatus: string;
  checkedInAt?: string | null;
};

export type MatchPlayerRecommendation = {
  playerId: number;
  playerName: string;
  avatarUrl?: string | null;
  skillLevel: number;
  prestige: number;
  city?: string | null;
  commune?: string | null;
  preferredTimeSlot?: string | null;
  distanceKm?: number | null;
  matchReason: string;
};

export type MatchDetailResponse = MatchSummary & {
  bookingId?: number | null;
  conversationId?: number | null;
  myPlayerId?: number | null;
  checkInCode?: string | null;
  paymentDeadline?: string | null;
  myPaymentId?: number | null;
  myQrImageUrl?: string | null;
  myTransferContent?: string | null;
  myPaymentRejectionReason?: string | null;
  participants: MatchParticipant[];
};

export type MatchMessage = {
  messageId: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatarUrl?: string | null;
  content: string;
  messageType: string;
  sentAt: string;
  isMine: boolean;
};

export type MatchSlotOption = {
  courtId: number;
  courtNumber: number;
  startTime: string;
  endTime: string;
  status: string;
  isCompatibleForAll: boolean;
  compatiblePlayerCount: number;
  requiredPlayerCount: number;
  voteCount: number;
  voterNames: string[];
  isVotedByMe: boolean;
};

export type MatchSlotVoteInput = {
  courtId: number;
  startTime: string;
  endTime: string;
};

export type MatchPlayerReview = {
  matchPlayerReviewId: number;
  matchId: number;
  reviewerPlayerId: number;
  reviewerName: string;
  revieweePlayerId: number;
  revieweeName: string;
  score: number;
  comment?: string | null;
  createdAt: string;
};

export type MatchSearchFilters = PaginationParams & {
  matchType?: MatchFormat;
  skillLevel?: number;
  from?: string;
  to?: string;
  province?: string;
  ward?: string;
};

const queryString = (values: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
};

export const searchMatchVenues = (input: {
  province?: string;
  ward?: string;
  radiusKm: number;
  latitude?: number;
  longitude?: number;
}) => apiRequest<MatchPreferredVenue[]>(`/api/Match/venues${queryString(input)}`);

export const getMatchPlayerRecommendations = (token: string, input: {
  radiusKm: number;
  latitude?: number;
  longitude?: number;
  province?: string;
  ward?: string;
  minSkillLevel: number;
  maxSkillLevel: number;
  limit?: number;
}) => apiRequest<MatchPlayerRecommendation[]>(
  `/api/Match/player-recommendations${queryString(input)}`,
  {},
  token,
);

export const getOpenMatches = (
  token?: string,
  filters: MatchSearchFilters = {},
  options: Pick<RequestInit, 'signal'> = {},
) => apiRequest<PaginatedResponse<MatchSummary>>(`/api/Match/open${queryString(filters)}`, options, token);

export const getMyMatches = (
  token: string,
  pagination: PaginationParams = {},
  options: Pick<RequestInit, 'signal'> = {},
) => apiRequest<PaginatedResponse<MatchSummary>>(`/api/Match/mine${queryString(pagination)}`, options, token);

export const getMatchDetail = (token: string, matchId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}`, {}, token);

export const createMatch = (token: string, input: {
  title: string;
  province: string;
  ward: string;
  searchRadiusKm: number;
  searchLatitude?: number;
  searchLongitude?: number;
  preferredVenueIds: number[];
  availableDateFrom: string;
  availableDateTo: string;
  preferredTimeStart: string;
  preferredTimeEnd: string;
  availabilitySlots: Array<{
    timeStart: string;
    timeEnd: string;
  }>;
  minSkillLevel: number;
  maxSkillLevel: number;
  matchType: MatchFormat;
  neededPlayerCount: number;
  note?: string;
}) => {
  const normalizeTime = (value: string) => /^\d{2}:\d{2}$/.test(value) ? `${value}:00` : value;
  return apiRequest<MatchDetailResponse>('/api/Match', {
    method: 'POST',
    body: JSON.stringify({
      ...input,
      preferredTimeStart: normalizeTime(input.preferredTimeStart),
      preferredTimeEnd: normalizeTime(input.preferredTimeEnd),
      availabilitySlots: input.availabilitySlots.map((slot) => ({
        ...slot,
        timeStart: normalizeTime(slot.timeStart),
        timeEnd: normalizeTime(slot.timeEnd),
      })),
    }),
  }, token);
};

export const joinMatch = (token: string, matchId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/join`, { method: 'POST' }, token);
export const inviteMatchPlayers = (
  token: string,
  matchId: number,
  input: { automatic: boolean; playerIds?: number[] },
) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/invitations`, {
  method: 'POST',
  body: JSON.stringify({ automatic: input.automatic, playerIds: input.playerIds ?? [] }),
}, token);
export const acceptMatchInvitation = (token: string, matchId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/invitation/accept`, { method: 'POST' }, token);
export const declineMatchInvitation = (token: string, matchId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/invitation/decline`, { method: 'POST' }, token);
export const leaveMatch = (token: string, matchId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/leave`, { method: 'POST' }, token);
export const acceptParticipant = (token: string, matchId: number, participantId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/participants/${participantId}/accept`, { method: 'POST' }, token);
export const rejectParticipant = (token: string, matchId: number, participantId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/participants/${participantId}/reject`, { method: 'POST' }, token);
export const removeParticipant = (token: string, matchId: number, participantId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/participants/${participantId}`, { method: 'DELETE' }, token);
export const markMatchReadyToBook = (token: string, matchId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/ready`, { method: 'POST' }, token);
export const createMatchBooking = (token: string, matchId: number, input: {
  courtId: number;
  startTime: string;
  endTime: string;
}) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/booking`, {
  method: 'POST',
  body: JSON.stringify(input),
}, token);
export const getMatchSlotOptions = (
  token: string,
  matchId: number,
  venueId: number,
  date: string,
) => apiRequest<MatchSlotOption[]>(
  `/api/Match/${matchId}/slot-options${queryString({ venueId, date })}`,
  {},
  token,
);
export const voteMatchSlot = (token: string, matchId: number, input: MatchSlotVoteInput) =>
  apiRequest<MatchSlotOption[]>(`/api/Match/${matchId}/slot-votes`, {
    method: 'POST',
    body: JSON.stringify(input),
  }, token);
export const unvoteMatchSlot = (token: string, matchId: number, input: MatchSlotVoteInput) =>
  apiRequest<MatchSlotOption[]>(`/api/Match/${matchId}/slot-votes`, {
    method: 'DELETE',
    body: JSON.stringify(input),
  }, token);
export const cancelMatch = (token: string, matchId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/cancel`, { method: 'POST' }, token);
export const reopenMatch = (token: string, matchId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/reopen`, { method: 'POST' }, token);
export const completeMatch = (token: string, matchId: number) =>
  apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/complete`, { method: 'POST' }, token);

export const getMatchMessages = (token: string, matchId: number) =>
  apiRequest<MatchMessage[]>(`/api/Match/${matchId}/messages`, {}, token);
export const sendMatchMessage = (token: string, matchId: number, content: string) =>
  apiRequest<MatchMessage>(`/api/Match/${matchId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  }, token);

export const getMatchReviews = (token: string, matchId: number) =>
  apiRequest<MatchPlayerReview[]>(`/api/Match/${matchId}/reviews`, {}, token);
export const reviewPlayer = (
  token: string,
  matchId: number,
  playerId: number,
  input: { score: number; comment?: string },
) => apiRequest<MatchPlayerReview>(`/api/Match/${matchId}/reviews/${playerId}`, {
  method: 'POST',
  body: JSON.stringify(input),
}, token);
