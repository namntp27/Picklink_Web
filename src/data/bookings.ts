export type BookingPaymentStatus = 'paid' | 'pending' | 'failed';
export type BookingStatus = 'confirmed' | 'holding' | 'cancelled';

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
  durationHours: number;
  pricePerHour: number;
  serviceFee: number;
  totalAmount: number;
  customerName: string;
  customerPhone: string;
  paymentMethod: string;
  paymentStatus: BookingPaymentStatus;
  bookingStatus: BookingStatus;
  createdAt: string;
  holdExpiresAt: string;
  ownerPhone: string;
  note: string;
  timeline: BookingTimelineStep[];
};

export const sampleBooking: BookingDetail = {
  id: 'pkl-20260618-001',
  code: 'PKL-20260618-001',
  courtId: '1',
  courtName: 'San Pickleball Cau Giay',
  subCourt: 'Pickleball 2',
  address: 'So 1 Duy Tan, Phuong Cau Giay, Ha Noi',
  area: 'Cau Giay, Ha Noi',
  date: '2026-06-18',
  startTime: '18:00',
  endTime: '20:00',
  durationHours: 2,
  pricePerHour: 220000,
  serviceFee: 30000,
  totalAmount: 470000,
  customerName: 'Nguyen Minh Anh',
  customerPhone: '0912 345 678',
  paymentMethod: 'Vi dien tu',
  paymentStatus: 'paid',
  bookingStatus: 'confirmed',
  createdAt: '2026-06-18T10:42:00',
  holdExpiresAt: '2026-06-18T10:52:00',
  ownerPhone: '0937 294 949',
  note: 'Den truoc gio choi 10 phut de check-in va nhan san.',
  timeline: [
    {
      label: 'Chon khung gio',
      description: 'Nguoi choi da chon san con va khung gio phu hop.',
      status: 'done',
    },
    {
      label: 'Thanh toan',
      description: 'Giao dich thanh toan da duoc xac nhan.',
      status: 'done',
    },
    {
      label: 'Giu san',
      description: 'Chu san da nhan lich va san duoc giu cho ban.',
      status: 'current',
    },
    {
      label: 'Check-in',
      description: 'Xuat trinh ma dat san khi den san.',
      status: 'upcoming',
    },
  ],
};

export const failedBooking: BookingDetail = {
  ...sampleBooking,
  id: 'pkl-20260618-fail',
  code: 'PKL-20260618-ERR',
  paymentStatus: 'failed',
  bookingStatus: 'holding',
  paymentMethod: 'Chuyen khoan QR',
  note: 'Thanh toan chua hoan tat, khung gio se duoc mo lai khi het thoi gian giu tam.',
  timeline: [
    {
      label: 'Chon khung gio',
      description: 'Khung gio da duoc giu tam trong luc thanh toan.',
      status: 'done',
    },
    {
      label: 'Thanh toan',
      description: 'Giao dich bi gian doan hoac chua duoc ngan hang xac nhan.',
      status: 'failed',
    },
    {
      label: 'Thu lai',
      description: 'Ban co the doi phuong thuc thanh toan hoac chon khung gio khac.',
      status: 'current',
    },
  ],
};

export const bookingById: Record<string, BookingDetail> = {
  [sampleBooking.id]: sampleBooking,
  [sampleBooking.code.toLowerCase()]: sampleBooking,
  [failedBooking.id]: failedBooking,
  [failedBooking.code.toLowerCase()]: failedBooking,
};

export const getBookingById = (id?: string) => {
  if (!id) {
    return sampleBooking;
  }

  return bookingById[id.toLowerCase()] ?? sampleBooking;
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
  }).format(new Date(`${date}T00:00:00`));

export const formatBookingDateTime = (dateTime: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateTime));
