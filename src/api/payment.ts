import { apiRequest } from './client';
import type { BankTransfer } from './booking';
import { optimizeReceiptImage } from '../utils/receiptImage';

export type OwnerBankAccount = {
  ownerBankAccountId: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  isActive: boolean;
};

export type OwnerBankAccountInput = Omit<OwnerBankAccount, 'ownerBankAccountId' | 'isActive'>;

export type BatchPaymentPreview = {
  bookingId: number;
  payerIds: number[];
  memberNames: string[];
  totalAmount: number;
  transferContent: string;
  qrImageUrl: string;
};

export type BatchPaymentResponse = {
  paymentGroupId: string;
  totalAmount: number;
  payments: BankTransfer[];
};

export const submitBankTransfer = async (token: string, bookingId: number, receipt: File, payerId?: number) => {
  const formData = new FormData();
  formData.append('receipt', await optimizeReceiptImage(receipt));
  if (payerId !== undefined) formData.append('payerId', String(payerId));
  return apiRequest<BankTransfer>(`/api/payments/bookings/${bookingId}/submit`, {
    method: 'POST',
    body: formData,
  }, token);
};

export const getPlayerBookingPayment = (token: string, bookingId: number) =>
  apiRequest<BankTransfer>(`/api/payments/bookings/${bookingId}`, {}, token);

export const previewBatchPayment = (
  token: string,
  bookingId: number,
  payerIds: number[],
) => apiRequest<BatchPaymentPreview>(`/api/payments/bookings/${bookingId}/batch-preview`, {
  method: 'POST',
  body: JSON.stringify({ payerIds }),
}, token);

export const submitBatchBankTransfer = async (
  token: string,
  bookingId: number,
  payerIds: number[],
  receipt: File,
) => {
  const formData = new FormData();
  payerIds.forEach((payerId) => formData.append('payerIds', String(payerId)));
  formData.append('receipt', await optimizeReceiptImage(receipt));
  return apiRequest<BatchPaymentResponse>(`/api/payments/bookings/${bookingId}/submit-batch`, {
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
