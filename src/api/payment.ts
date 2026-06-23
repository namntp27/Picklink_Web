import { apiRequest } from './client';
import type { PaginatedResponse, PaginationParams } from './client';
import type { BankTransfer } from './booking';

export type OwnerBankAccount = {
  ownerBankAccountId: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isActive: boolean;
};

export type OwnerBankAccountInput = Omit<OwnerBankAccount, 'ownerBankAccountId' | 'isActive'>;

export const submitBankTransfer = (token: string, bookingId: number, receipt: File) => {
  const formData = new FormData();
  formData.append('receipt', receipt);
  return apiRequest<BankTransfer>(`/api/payments/bookings/${bookingId}/submit`, {
    method: 'POST',
    body: formData,
  }, token);
};

export const getOwnerBankAccount = (token: string) =>
  apiRequest<OwnerBankAccount>('/api/payments/bank-account', {}, token);

export const saveOwnerBankAccount = (token: string, input: OwnerBankAccountInput) =>
  apiRequest<OwnerBankAccount>('/api/payments/bank-account', {
    method: 'PUT',
    body: JSON.stringify(input),
  }, token);

export const getOperatorPayments = (token: string, status = 'WaitingForConfirmation', pagination: PaginationParams = {}) => {
  const params = new URLSearchParams({ status });
  if (pagination.page) params.set('page', String(pagination.page));
  if (pagination.pageSize) params.set('pageSize', String(pagination.pageSize));
  return apiRequest<PaginatedResponse<BankTransfer>>(`/api/payments/operator?${params.toString()}`, {}, token);
};

export const getOperatorPayment = (token: string, paymentId: number) =>
  apiRequest<BankTransfer>(`/api/payments/operator/${paymentId}`, {}, token);

export const getOperatorBookingPayments = (token: string, bookingId: number) =>
  apiRequest<BankTransfer[]>(`/api/payments/operator/booking/${bookingId}`, {}, token);

export const approveOperatorPayment = (token: string, paymentId: number) =>
  apiRequest<BankTransfer>(`/api/payments/operator/${paymentId}/approve`, { method: 'POST' }, token);

export const rejectOperatorPayment = (token: string, paymentId: number, reason: string) =>
  apiRequest<BankTransfer>(`/api/payments/operator/${paymentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }, token);
