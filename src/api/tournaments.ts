import { apiRequest, type PaginatedResponse } from './client';
import { optimizeReceiptImage } from '../utils/receiptImage';

export type TournamentStatus =
  | 'draft'
  | 'pendingApproval'
  | 'open'
  | 'closed'
  | 'inProgress'
  | 'completed'
  | 'cancelled';
export type TournamentRegistrationStatus =
  | 'pending'
  | 'approved'
  | 'waitlisted'
  | 'rejected'
  | 'cancelled';
export type TournamentPaymentStatus = 'unpaid' | 'pending' | 'confirmed' | 'rejected';

export type TournamentSummary = {
  tournamentId: number;
  slug: string;
  name: string;
  status: TournamentStatus;
  imageUrl?: string;
  city: string;
  venueName: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  format: string;
  skillLevel?: string;
  capacity: number;
  registeredCount: number;
  entryFee: number;
  prizePool: number;
  description?: string;
};

export type TournamentDivision = {
  tournamentDivisionId: number;
  name: string;
  description?: string;
  skillLevel?: string;
  capacity: number;
  registeredCount: number;
  entryFee: number;
  status: 'open' | 'closed';
  displayOrder: number;
};

export type TournamentTeam = {
  registrationId: number;
  teamName: string;
  divisionName: string;
  area?: string;
  skillLevel?: string;
  status: TournamentRegistrationStatus;
};

export type TournamentPayment = {
  tournamentPaymentId: number;
  amount: number;
  paymentMethod: string;
  transferContent?: string;
  receiptImageUrl?: string;
  status: Exclude<TournamentPaymentStatus, 'unpaid'>;
  submittedAt: string;
  verifiedAt?: string;
  rejectionReason?: string;
};

export type TournamentRegistration = {
  tournamentRegistrationId: number;
  tournamentId: number;
  tournamentSlug: string;
  tournamentName: string;
  tournamentImageUrl?: string;
  venueName: string;
  startDate: string;
  endDate: string;
  tournamentDivisionId: number;
  divisionName: string;
  teamName: string;
  partnerName?: string;
  representativePhone: string;
  status: TournamentRegistrationStatus;
  paymentStatus: TournamentPaymentStatus;
  amountDue: number;
  registeredAt: string;
  rejectionReason?: string;
  checkInCode?: string;
  checkedInAt?: string;
  seed?: number;
  payment?: TournamentPayment;
};

export type TournamentMatch = {
  tournamentMatchId: number;
  tournamentDivisionId: number;
  divisionName: string;
  roundName: string;
  matchNumber: number;
  team1RegistrationId?: number;
  team1Name?: string;
  team2RegistrationId?: number;
  team2Name?: string;
  scheduledAt?: string;
  courtName?: string;
  team1Score?: number;
  team2Score?: number;
  winnerRegistrationId?: number;
  winnerName?: string;
  status: 'scheduled' | 'completed';
  notes?: string;
};

export type TournamentDetail = TournamentSummary & {
  address: string;
  organizerName: string;
  organizerPhone?: string;
  bracketType: string;
  rules: string[];
  divisions: TournamentDivision[];
  teams: TournamentTeam[];
  matches: TournamentMatch[];
  myRegistration?: TournamentRegistration;
  resultsPublishedAt?: string;
};

export type TournamentAdminStats = {
  totalTournaments: number;
  pendingApproval: number;
  openTournaments: number;
  pendingRegistrations: number;
  pendingPayments: number;
  confirmedRevenue: number;
};

export type TournamentDivisionInput = {
  name: string;
  description?: string;
  skillLevel?: string;
  capacity: number;
  entryFee?: number;
  displayOrder: number;
};

export type TournamentInput = {
  name: string;
  slug?: string;
  description?: string;
  rules?: string;
  imageUrl?: string;
  venueName: string;
  address: string;
  city: string;
  organizerName: string;
  organizerPhone?: string;
  format: string;
  bracketType: string;
  skillLevel?: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  capacity: number;
  entryFee: number;
  prizePool: number;
  divisions: TournamentDivisionInput[];
};

export type TournamentMatchInput = {
  tournamentDivisionId: number;
  roundName: string;
  matchNumber: number;
  team1RegistrationId?: number;
  team2RegistrationId?: number;
  scheduledAt?: string;
  courtName?: string;
  notes?: string;
};

export const formatTournamentCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export const formatTournamentDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${date.slice(0, 10)}T00:00:00`));

export const formatTournamentDateTime = (dateTime: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateTime));

export const getTournamentStatusLabel = (status: TournamentStatus) => {
  const labels: Record<TournamentStatus, string> = {
    draft: 'Bản nháp',
    pendingApproval: 'Chờ duyệt',
    open: 'Đang mở đăng ký',
    closed: 'Đã khóa đăng ký',
    inProgress: 'Đang thi đấu',
    completed: 'Đã kết thúc',
    cancelled: 'Đã hủy',
  };
  return labels[status];
};

export const getTournamentRegistrationStatusLabel = (status: TournamentRegistrationStatus) => {
  const labels: Record<TournamentRegistrationStatus, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    waitlisted: 'Danh sách chờ',
    rejected: 'Bị từ chối',
    cancelled: 'Đã hủy',
  };
  return labels[status];
};

export const listTournaments = (params: {
  search?: string;
  city?: string;
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') query.set(key, String(value));
  });
  return apiRequest<PaginatedResponse<TournamentSummary>>(`/api/tournaments?${query}`);
};

export const getTournament = (identifier: string, accessToken?: string) =>
  apiRequest<TournamentDetail>(
    `/api/tournaments/${encodeURIComponent(identifier)}`,
    {},
    accessToken,
  );

export const getMyTournamentRegistrations = (accessToken: string) =>
  apiRequest<TournamentRegistration[]>(
    '/api/tournaments/me/registrations',
    {},
    accessToken,
  );

export const registerTournament = (
  tournamentId: number,
  input: {
    tournamentDivisionId: number;
    teamName: string;
    partnerName?: string;
    representativePhone: string;
  },
  accessToken: string,
) =>
  apiRequest<TournamentRegistration>(
    `/api/tournaments/${tournamentId}/registrations`,
    { method: 'POST', body: JSON.stringify(input) },
    accessToken,
  );

export const submitTournamentPayment = (
  registrationId: number,
  input: { paymentMethod: string; transferContent?: string; receiptImageUrl?: string },
  accessToken: string,
) =>
  apiRequest<TournamentRegistration>(
    `/api/tournaments/registrations/${registrationId}/payment`,
    { method: 'POST', body: JSON.stringify(input) },
    accessToken,
  );

export const submitTournamentPaymentReceipt = async (
  registrationId: number,
  receipt: File,
  transferContent: string,
  accessToken: string,
) => {
  const formData = new FormData();
  formData.append('receipt', await optimizeReceiptImage(receipt));
  formData.append('transferContent', transferContent);
  return apiRequest<TournamentRegistration>(
    `/api/tournaments/registrations/${registrationId}/payment-receipt`,
    { method: 'POST', body: formData },
    accessToken,
  );
};

export const cancelTournamentRegistration = (
  registrationId: number,
  accessToken: string,
) =>
  apiRequest<void>(
    `/api/tournaments/registrations/${registrationId}`,
    { method: 'DELETE' },
    accessToken,
  );

export const getAdminTournamentStats = (accessToken: string) =>
  apiRequest<TournamentAdminStats>('/api/admin/tournaments/stats', {}, accessToken);

export const listAdminTournaments = (
  accessToken: string,
  params: { search?: string; status?: string; page?: number; pageSize?: number } = {},
) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') query.set(key, String(value));
  });
  return apiRequest<PaginatedResponse<TournamentSummary>>(
    `/api/admin/tournaments?${query}`,
    {},
    accessToken,
  );
};

export const getAdminTournament = (tournamentId: number, accessToken: string) =>
  apiRequest<TournamentDetail>(`/api/admin/tournaments/${tournamentId}`, {}, accessToken);

export const createTournament = (input: TournamentInput, accessToken: string) =>
  apiRequest<TournamentDetail>(
    '/api/admin/tournaments',
    { method: 'POST', body: JSON.stringify(input) },
    accessToken,
  );

export const updateTournament = (
  tournamentId: number,
  input: TournamentInput,
  accessToken: string,
) =>
  apiRequest<TournamentDetail>(
    `/api/admin/tournaments/${tournamentId}`,
    { method: 'PUT', body: JSON.stringify(input) },
    accessToken,
  );

export const deleteTournament = (tournamentId: number, accessToken: string) =>
  apiRequest<void>(
    `/api/admin/tournaments/${tournamentId}`,
    { method: 'DELETE' },
    accessToken,
  );

export const approveTournament = (tournamentId: number, accessToken: string) =>
  apiRequest<TournamentDetail>(
    `/api/admin/tournaments/${tournamentId}/approve`,
    { method: 'POST' },
    accessToken,
  );

export const updateTournamentStatus = (
  tournamentId: number,
  status: TournamentStatus,
  accessToken: string,
) =>
  apiRequest<TournamentDetail>(
    `/api/admin/tournaments/${tournamentId}/status`,
    { method: 'PUT', body: JSON.stringify({ status }) },
    accessToken,
  );

export const createTournamentDivision = (
  tournamentId: number,
  input: TournamentDivisionInput,
  accessToken: string,
) =>
  apiRequest<TournamentDivision>(
    `/api/admin/tournaments/${tournamentId}/divisions`,
    { method: 'POST', body: JSON.stringify(input) },
    accessToken,
  );

export const updateTournamentDivision = (
  tournamentId: number,
  divisionId: number,
  input: TournamentDivisionInput,
  accessToken: string,
) =>
  apiRequest<TournamentDivision>(
    `/api/admin/tournaments/${tournamentId}/divisions/${divisionId}`,
    { method: 'PUT', body: JSON.stringify(input) },
    accessToken,
  );

export const deleteTournamentDivision = (
  tournamentId: number,
  divisionId: number,
  accessToken: string,
) =>
  apiRequest<void>(
    `/api/admin/tournaments/${tournamentId}/divisions/${divisionId}`,
    { method: 'DELETE' },
    accessToken,
  );

export const listTournamentRegistrations = (tournamentId: number, accessToken: string) =>
  apiRequest<TournamentRegistration[]>(
    `/api/admin/tournaments/${tournamentId}/registrations`,
    {},
    accessToken,
  );

export const reviewTournamentRegistration = (
  registrationId: number,
  input: { status: 'approved' | 'waitlisted' | 'rejected'; reason?: string },
  accessToken: string,
) =>
  apiRequest<TournamentRegistration>(
    `/api/admin/tournaments/registrations/${registrationId}/review`,
    { method: 'PUT', body: JSON.stringify(input) },
    accessToken,
  );

export const listTournamentPayments = (accessToken: string, tournamentId?: number) =>
  apiRequest<TournamentRegistration[]>(
    `/api/admin/tournaments/payments${tournamentId ? `?tournamentId=${tournamentId}` : ''}`,
    {},
    accessToken,
  );

export const reviewTournamentPayment = (
  paymentId: number,
  input: { status: 'confirmed' | 'rejected'; reason?: string },
  accessToken: string,
) =>
  apiRequest<TournamentRegistration>(
    `/api/admin/tournaments/payments/${paymentId}/review`,
    { method: 'PUT', body: JSON.stringify(input) },
    accessToken,
  );

export const checkInTournamentTeam = (checkInCode: string, accessToken: string) =>
  apiRequest<TournamentRegistration>(
    '/api/admin/tournaments/check-in',
    { method: 'POST', body: JSON.stringify({ checkInCode }) },
    accessToken,
  );

export const createTournamentMatch = (
  tournamentId: number,
  input: TournamentMatchInput,
  accessToken: string,
) =>
  apiRequest<TournamentMatch>(
    `/api/admin/tournaments/${tournamentId}/matches`,
    { method: 'POST', body: JSON.stringify(input) },
    accessToken,
  );

export const updateTournamentMatch = (
  tournamentId: number,
  matchId: number,
  input: TournamentMatchInput,
  accessToken: string,
) =>
  apiRequest<TournamentMatch>(
    `/api/admin/tournaments/${tournamentId}/matches/${matchId}`,
    { method: 'PUT', body: JSON.stringify(input) },
    accessToken,
  );

export const deleteTournamentMatch = (
  tournamentId: number,
  matchId: number,
  accessToken: string,
) =>
  apiRequest<void>(
    `/api/admin/tournaments/${tournamentId}/matches/${matchId}`,
    { method: 'DELETE' },
    accessToken,
  );

export const recordTournamentResult = (
  tournamentId: number,
  matchId: number,
  input: { team1Score: number; team2Score: number; winnerRegistrationId: number; notes?: string },
  accessToken: string,
) =>
  apiRequest<TournamentMatch>(
    `/api/admin/tournaments/${tournamentId}/matches/${matchId}/result`,
    { method: 'PUT', body: JSON.stringify(input) },
    accessToken,
  );

export const publishTournamentResults = (tournamentId: number, accessToken: string) =>
  apiRequest<TournamentDetail>(
    `/api/admin/tournaments/${tournamentId}/publish-results`,
    { method: 'POST' },
    accessToken,
  );
