import { apiRequest } from './client';

export type ReplayType = 'None' | 'Daily' | 'Weekly' | 'Monthly';

export type QueueSlotResponse = {
  dayOfWeek?: string | null;
  specificDate?: string | null;
  dayOfMonth?: number | null;
  timeStart: string;
  timeEnd: string;
};

export type QueuePlayerResponse = {
  playerId: number;
  playerName: string;
  avatarUrl?: string | null;
  isHost: boolean;
  status?: 'Pending' | 'Approved' | 'Rejected' | string;
};

export type QueueStatusResponse = {
  inQueue: boolean;
  matchmakingQueueId?: number | null;
  matchId?: number | null;
  title?: string | null;
  playerCount?: number;
  matchType?: string | null;
  skillLevel?: number | null;
  minSkillLevel?: number;
  maxSkillLevel?: number;
  searchRadiusKm?: number;
  searchLatitude?: number | null;
  searchLongitude?: number | null;
  isActive: boolean;
  replayType: ReplayType;
  replayWeekdays?: string | null;
  conversationId?: number | null;
  isPublic: boolean;
  province?: string | null;
  ward?: string | null;
  sharedVenues?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  queueSlots: QueueSlotResponse[];
  queuePlayers: QueuePlayerResponse[];
};

export type QueueSlotRequest = {
  dayOfWeek?: number | null; // DayOfWeek enum index or string
  specificDate?: string | null;
  dayOfMonth?: number | null;
  timeStart: string;
  timeEnd: string;
};

export type JoinSoloQueueRequest = {
  title?: string;
  playerCount?: number;
  minSkillLevel?: number;
  maxSkillLevel?: number;
  matchType: string;
  searchRadiusKm: number;
  searchLatitude?: number | null;
  searchLongitude?: number | null;
  replayType: ReplayType;
  replayWeekdays?: string | null;
  isPublic?: boolean;
  isActive?: boolean;
  province?: string | null;
  ward?: string | null;
  sharedVenues?: string | null;
  queueSlots: QueueSlotRequest[];
};

export const getQueueStatus = (token: string) =>
  apiRequest<QueueStatusResponse>('/api/matchmaking/status', {}, token);

export const joinSoloQueue = (token: string, request: JoinSoloQueueRequest) =>
  apiRequest<QueueStatusResponse>('/api/matchmaking/join-solo', {
    method: 'POST',
    body: JSON.stringify(request),
  }, token);

export const joinLobbyQueue = (token: string, matchId: number) =>
  apiRequest<QueueStatusResponse>(`/api/matchmaking/join-lobby/${matchId}`, {
    method: 'POST',
  }, token);

export const getMyQueues = (token: string) =>
  apiRequest<QueueStatusResponse[]>('/api/matchmaking/my-queues', {}, token);

export const cancelQueue = (token: string, queueId?: number) =>
  apiRequest<{ message: string }>(`/api/matchmaking/cancel${queueId ? `?queueId=${queueId}` : ''}`, {
    method: 'POST',
  }, token);

export const resumeQueue = (token: string, queueId?: number) =>
  apiRequest<QueueStatusResponse>(`/api/matchmaking/resume${queueId ? `?queueId=${queueId}` : ''}`, {
    method: 'POST',
  }, token);

export const getPublicQueues = (token?: string | null) =>
  apiRequest<QueueStatusResponse[]>('/api/matchmaking/public', {}, token || undefined);

export const joinPublicQueue = (token: string, queueId: number) =>
  apiRequest<QueueStatusResponse>(`/api/matchmaking/public/join/${queueId}`, {
    method: 'POST',
  }, token);

export const createManualQueueRoom = (token: string, queueId: number) =>
  apiRequest<{ matchId: number }>(`/api/matchmaking/public/${queueId}/room`, {
    method: 'POST',
  }, token);
export const approvePublicQueueRequest = (token: string, queueId: number, playerId: number) =>
  apiRequest<{ message: string }>(`/api/matchmaking/public/requests/${queueId}/${playerId}/approve`, { method: 'POST' }, token);

export const rejectPublicQueueRequest = (token: string, queueId: number, playerId: number) =>
  apiRequest<{ message: string }>(`/api/matchmaking/public/requests/${queueId}/${playerId}/reject`, { method: 'POST' }, token);
