import { apiRequest } from './client';

export type PlayerProfile = {
  userId: number;
  username: string;
  email: string;
  userType: string;
  profileImageUrl?: string | null;
  city?: string | null;
  commune?: string | null;
  playerId?: number | null;
  skillLevel?: number | null;
  prestige?: number | null;
  playerSubType?: string | null;
  playFrequency?: string | null;
  preferredTimeSlot?: string | null;
  bio?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  matchesPlayed: number;
};

export type UpdatePlayerProfile = {
  username: string;
  city?: string | null;
  commune?: string | null;
  profileImageUrl?: string | null;
  skillLevel: number;
  playerSubType?: string | null;
  playFrequency?: string | null;
  preferredTimeSlot?: string | null;
  bio?: string | null;
  birthDate?: string | null;
  gender?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
};

export type PublicPlayerProfile = {
  playerId: number;
  username: string;
  profileImageUrl?: string | null;
  city?: string | null;
  commune?: string | null;
  skillLevel: number;
  prestige: number;
  playerSubType?: string | null;
  playFrequency?: string | null;
  preferredTimeSlot?: string | null;
  bio?: string | null;
  matchesPlayed: number;
};

export const getMyProfile = (token: string) => apiRequest<PlayerProfile>('/api/profile/me', {}, token);

export const getPublicPlayerProfile = (
  playerId: number,
  options: Pick<RequestInit, 'signal'> = {},
) => apiRequest<PublicPlayerProfile>(`/api/profile/players/${playerId}`, options);

export const updateMyProfile = (token: string, input: UpdatePlayerProfile) => apiRequest<PlayerProfile>('/api/profile/me', {
  method: 'PUT',
  body: JSON.stringify(input),
}, token);

export const uploadMyAvatar = (token: string, avatar: File) => {
  const formData = new FormData();
  formData.append('avatar', avatar);
  return apiRequest<PlayerProfile>('/api/profile/me/avatar', { method: 'POST', body: formData }, token);
};
