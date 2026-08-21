import { apiRequest } from './client';
import type { BankTransfer } from './booking';
import { optimizeReceiptImage } from '../utils/receiptImage';
import { uploadToCloudinary } from './cloudinary';

export type OwnerBankAccount = {
  ownerBankAccountId: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  /** The SePay token itself never leaves the backend; only these two fields describe it. */
  hasSePayApiToken: boolean;
  maskedSePayApiToken: string | null;
  isActive: boolean;
};

export type OwnerBankAccountInput =
  Omit<OwnerBankAccount, 'ownerBankAccountId' | 'isActive' | 'hasSePayApiToken' | 'maskedSePayApiToken'> & {
    /** Omit to keep the stored token, send '' to remove it, send a value to replace it. */
    sePayApiToken?: string;
  };

export type BatchPaymentPreview = {
  bookingId: number;
  payerIds: number[];
  memberNames: string[];
  totalAmount: number;
  transferContent: string;
  qrImageUrl: string;
  claimExpiresAt: string;
  hasSePayApiToken?: boolean;
};

export type BatchPaymentResponse = {
  paymentGroupId: string;
  totalAmount: number;
  payments: BankTransfer[];
};

export const submitBankTransfer = async (
  token: string,
  bookingId: number,
  receipt: File,
  payerId?: number,
  onProgress?: (progress: number) => void,
) => {
  const optimized = await optimizeReceiptImage(receipt);
  if (onProgress) {
    onProgress(5);
    await uploadToCloudinary(token, optimized, (pct) => onProgress(Math.min(90, Math.max(5, pct))), 'picklink_receipts');
    onProgress(95);
  }
  const formData = new FormData();
  formData.append('receipt', optimized);
  if (payerId !== undefined) formData.append('payerId', String(payerId));
  const response = await apiRequest<BankTransfer>(`/api/payments/bookings/${bookingId}/submit`, {
    method: 'POST',
    body: formData,
  }, token);
  if (onProgress) onProgress(100);
  return response;
};

export const submitTicketReceipt = async (
  token: string,
  sessionTicketId: number,
  receipt: File,
  onProgress?: (progress: number) => void,
) => {
  const optimized = await optimizeReceiptImage(receipt);
  if (onProgress) {
    onProgress(5);
    await uploadToCloudinary(token, optimized, (pct) => onProgress(Math.min(90, Math.max(5, pct))), 'picklink_receipts');
    onProgress(95);
  }
  const formData = new FormData();
  formData.append('receipt', optimized);
  const response = await apiRequest<BankTransfer>(`/api/payments/tickets/${sessionTicketId}/submit`, {
    method: 'POST',
    body: formData,
  }, token);
  if (onProgress) onProgress(100);
  return response;
};

export const getPlayerBookingPayment = (token: string, bookingId: number) =>
  apiRequest<BankTransfer>(`/api/payments/bookings/${bookingId}`, {}, token);

export const getCheckoutBookingContext = (token: string, bookingId: number) =>
  apiRequest<{ matchId: number | null }>(`/api/payments/bookings/${bookingId}/checkout-context`, {}, token);

export const previewBatchPayment = (
  token: string,
  bookingId: number,
  payerIds: number[],
) => apiRequest<BatchPaymentPreview>(`/api/payments/bookings/${bookingId}/batch-preview`, {
  method: 'POST',
  body: JSON.stringify({ payerIds }),
}, token);

export const requestPaymentSponsorship = (
  token: string,
  bookingId: number,
  targetPlayerId: number,
) => apiRequest<{ paymentId: number; requestedByPlayerId: number; targetPlayerId: number; status: string }>(
  `/api/payments/bookings/${bookingId}/sponsorship-requests/${targetPlayerId}`,
  {
    method: 'POST',
  },
  token,
);

export const respondPaymentSponsorship = (
  token: string,
  bookingId: number,
  accept: boolean,
) => apiRequest<{ paymentId: number; requestedByPlayerId: number; targetPlayerId: number; status: string }>(
  `/api/payments/bookings/${bookingId}/sponsorship-requests/respond`,
  {
    method: 'POST',
    body: JSON.stringify({ accept }),
  },
  token,
);

export const cancelPaymentSponsorship = (
  token: string,
  bookingId: number,
  targetPlayerId: number,
) => apiRequest<{ paymentId: number; requestedByPlayerId: number; targetPlayerId: number; status: string }>(
  `/api/payments/bookings/${bookingId}/sponsorship-requests/${targetPlayerId}`,
  { method: 'DELETE' },
  token,
);

export const submitBatchBankTransfer = async (
  token: string,
  bookingId: number,
  payerIds: number[],
  receipt: File,
  onProgress?: (progress: number) => void,
) => {
  const optimized = await optimizeReceiptImage(receipt);
  if (onProgress) {
    onProgress(5);
    await uploadToCloudinary(token, optimized, (pct) => onProgress(Math.min(90, Math.max(5, pct))), 'picklink_receipts');
    onProgress(95);
  }
  const formData = new FormData();
  payerIds.forEach((payerId) => formData.append('payerIds', String(payerId)));
  formData.append('receipt', optimized);
  const response = await apiRequest<BatchPaymentResponse>(`/api/payments/bookings/${bookingId}/submit-batch`, {
    method: 'POST',
    body: formData,
  }, token);
  if (onProgress) onProgress(100);
  return response;
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

export const markOperatorMatchRefundSent = (token: string, paymentId: number) =>
  apiRequest<BankTransfer[]>('/api/payments/operator/' + paymentId + '/refund-sent', { method: 'POST' }, token);

export const confirmMatchRefundReceived = (token: string, paymentId: number) =>
  apiRequest<BankTransfer[]>('/api/payments/' + paymentId + '/refund/confirm', { method: 'POST' }, token);

export const rejectOperatorPayment = (token: string, paymentId: number, reason: string) =>
  apiRequest<BankTransfer>(`/api/payments/operator/${paymentId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }, token);
