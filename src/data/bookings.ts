export type BookingPaymentStatus = 'paid' | 'pending' | 'failed';
export type BookingStatus = 'confirmed' | 'holding' | 'cancelled';
export type BookingCheckInStatus = 'not_open' | 'ready' | 'checked_in' | 'missed' | 'cancelled';

export type BookingTimelineStep = {
  label: string;
  description: string;
  status: 'done' | 'current' | 'upcoming' | 'failed';
};

export type BookingDetail = {
  id: string;
  code: string;
  courtId: string;
  courtName: string;
  subCourt: string;
  address: string;
  area: string;
  date: string;
  startTime: string;
  endTime: string;
  slots?: Array<{ courtId: number | string; courtNumber: number; startTime: string; endTime: string }>;
  durationHours: number;
  pricePerHour: number;
  serviceFee: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: BookingPaymentStatus;
  bookingStatus: BookingStatus;
  checkInStatus: BookingCheckInStatus;
  createdAt: string;
  holdExpiresAt: string;
  ownerPhone: string;
  note: string;
  timeline: BookingTimelineStep[];
};

export const formatBookingCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value);

export const formatBookingDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date + 'T00:00:00'));

export const formatBookingDateTime = (dateTime: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateTime));