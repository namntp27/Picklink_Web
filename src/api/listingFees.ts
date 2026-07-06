import { apiRequest, type PaginatedResponse, type PaginationParams } from './client';
import { optimizeReceiptImage } from '../utils/receiptImage';

export type ListingFeeStatus = 'Unpaid' | 'PendingReview' | 'Paid' | 'Confirmed' | 'Rejected' | 'Expired';

export type ListingFeeSettings = {
  listingFeeSettingId: number;
  pricePerCourtPerMonth: number;
  updatedAt?: string | null;
};

export type OwnerListingFeePreview = {
  venueId: number;
  months: number;
  activeCourtCount: number;
  pricePerCourtPerMonth: number;
  amount: number;
};

export type ListingFeePayment = OwnerListingFeePreview & {
  venueListingPaymentId: number;
  venueName?: string;
  ownerName?: string;
  ownerEmail?: string;
  status: ListingFeeStatus | string;
  receiptImageUrl?: string | null;
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
  paidFrom?: string | null;
  paidUntil?: string | null;
};

export type ListingFeePaymentListParams = PaginationParams & {
  status?: 'PendingReview' | 'Confirmed' | 'Rejected' | 'all';
  search?: string;
};

const appendParams = (params: Record<string, string | number | undefined>) => {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '' && value !== 'all') query.set(key, String(value));
  });
  return query.toString();
};

export const getListingFeeSettings = (token: string) =>
  apiRequest<ListingFeeSettings>('/api/admin/listing-fees/settings', {}, token);

export const updateListingFeeSettings = (token: string, pricePerCourtPerMonth: number) =>
  apiRequest<ListingFeeSettings>('/api/admin/listing-fees/settings', {
    method: 'PUT',
    body: JSON.stringify({ pricePerCourtPerMonth }),
  }, token);

export const listListingFeePayments = (
  token: string,
  params: ListingFeePaymentListParams = {},
) => {
  const query = appendParams(params);
  return apiRequest<PaginatedResponse<ListingFeePayment>>(
    `/api/admin/listing-fees/payments${query ? `?${query}` : ''}`,
    {},
    token,
  );
};

export const confirmListingFeePayment = (token: string, paymentId: number) =>
  apiRequest<ListingFeePayment>(
    `/api/admin/listing-fees/payments/${paymentId}/confirm`,
    { method: 'POST' },
    token,
  );

export const rejectListingFeePayment = (token: string, paymentId: number, reason: string) =>
  apiRequest<ListingFeePayment>(
    `/api/admin/listing-fees/payments/${paymentId}/reject`,
    { method: 'POST', body: JSON.stringify({ reason }) },
    token,
  );

export const previewOwnerListingFee = (token: string, venueId: number, months: number) =>
  apiRequest<OwnerListingFeePreview>(
    `/api/owner/venues/${venueId}/listing-fee/preview?months=${months}`,
    {},
    token,
  );

export const submitOwnerListingFeePayment = async (
  token: string,
  venueId: number,
  months: number,
  receipt: File,
) => {
  const formData = new FormData();
  formData.append('months', String(months));
  formData.append('receipt', await optimizeReceiptImage(receipt));
  return apiRequest<ListingFeePayment>(
    `/api/owner/venues/${venueId}/listing-fee/payments`,
    { method: 'POST', body: formData },
    token,
  );
};
