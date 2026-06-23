import { apiRequest } from './client';

export type MatchFormat = '1vs1' | '2vs2';
export type MatchStatus = 'Waiting' | 'Full' | 'PaymentPending' | 'Confirmed' | 'Completed' | 'Cancelled';
export type ParticipantStatus = 'Pending' | 'Accepted' | 'Rejected' | 'Left' | 'Removed';

export type MatchSummary = {
  matchId: number;
  hostPlayerId: number;
  hostName: string;
  hostAvatarUrl?: string | null;
  matchType: MatchFormat;
  matchSkillLevel: number;
  status: MatchStatus;
  note?: string | null;
  requiredPlayerCount: number;
  acceptedPlayerCount: number;
  pendingRequestCount: number;
  availableSlotCount: number;
  courtId: number;
  courtNumber: number;
  venueId: number;
  venueName: string;
  address: string;
  startTime: string;
  endTime: string;
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
  paymentStatus?: string | null;
};

export type MatchDetailResponse = MatchSummary & {
  bookingId: number;
  myPlayerId?: number | null;
  checkInCode?: string | null;
  paymentDeadline?: string | null;
  myPaymentId?: number | null;
  myQrImageUrl?: string | null;
  myTransferContent?: string | null;
  participants: MatchParticipant[];
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

export const getOpenMatches = (token?: string) => apiRequest<MatchSummary[]>('/api/Match/open', {}, token);
export const getMyMatches = (token: string) => apiRequest<MatchSummary[]>('/api/Match/mine', {}, token);
export const getMatchDetail = (token: string, matchId: number) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}`, {}, token);
export const createMatch = (token: string, input: { courtId: number; matchType: MatchFormat; matchSkillLevel: number; startTime: string; endTime: string; note?: string }) => apiRequest<MatchDetailResponse>('/api/Match', { method: 'POST', body: JSON.stringify(input) }, token);
export const joinMatch = (token: string, matchId: number) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/join`, { method: 'POST' }, token);
export const leaveMatch = (token: string, matchId: number) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/leave`, { method: 'POST' }, token);
export const acceptParticipant = (token: string, matchId: number, participantId: number) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/participants/${participantId}/accept`, { method: 'POST' }, token);
export const rejectParticipant = (token: string, matchId: number, participantId: number) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/participants/${participantId}/reject`, { method: 'POST' }, token);
export const removeParticipant = (token: string, matchId: number, participantId: number) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/participants/${participantId}`, { method: 'DELETE' }, token);
export const cancelMatch = (token: string, matchId: number) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/cancel`, { method: 'POST' }, token);
export const reopenMatch = (token: string, matchId: number) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/reopen`, { method: 'POST' }, token);
export const completeMatch = (token: string, matchId: number) => apiRequest<MatchDetailResponse>(`/api/Match/${matchId}/complete`, { method: 'POST' }, token);
export const getMatchReviews = (token: string, matchId: number) => apiRequest<MatchPlayerReview[]>(`/api/Match/${matchId}/reviews`, {}, token);
export const reviewPlayer = (token: string, matchId: number, playerId: number, input: { score: number; comment?: string }) => apiRequest<MatchPlayerReview>(`/api/Match/${matchId}/reviews/${playerId}`, { method: 'POST', body: JSON.stringify(input) }, token);
