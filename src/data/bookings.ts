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
  slots?: Array<{ courtId: number | string; courtNumber: number; startTime: string; endTime: string }>
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

export const sampleBooking: BookingDetail = {
  id: 'pkl-20260618-001',
  code: 'PKL-20260618-001',
  courtId: '1',
  courtName: 'Sân Pickleball Cầu Giấy',
  subCourt: 'Pickleball 2',
  address: 'Số 1 Duy Tân, Phường Cầu Giấy, Hà Nội',
  area: 'Cầu Giấy, Hà Nội',
  date: '2026-06-18',
  startTime: '18:00',
  endTime: '20:00',
  durationHours: 2,
  pricePerHour: 220000,
  serviceFee: 30000,
  totalAmount: 470000,
  customerName: 'Nguyễn Minh Anh',
  customerPhone: '0912 345 678',
  paymentMethod: 'Ví điện tử',
  paymentStatus: 'paid',
  bookingStatus: 'confirmed',
  checkInStatus: 'ready',
  createdAt: '2026-06-18T10:42:00',
  holdExpiresAt: '2026-06-18T10:52:00',
  ownerPhone: '0937 294 949',
  note: 'Đến trước giờ chơi 10 phút để check-in và nhận sân.',
  timeline: [
    {
      label: 'Chọn khung giờ',
      description: 'Người chơi đã chọn sân con và khung giờ phù hợp.',
      status: 'done',
    },
    {
      label: 'Thanh toán',
      description: 'Giao dịch thanh toán đã được xác nhận.',
      status: 'done',
    },
    {
      label: 'Giữ sân',
      description: 'Chủ sân đã nhận lịch và sân được giữ cho bạn.',
      status: 'current',
    },
    {
      label: 'Check-in',
      description: 'Xuất trình mã đặt sân khi đến sân.',
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
  checkInStatus: 'not_open',
  paymentMethod: 'Chuyển khoản QR',
  note: 'Thanh toán chưa hoàn tất, khung giờ sẽ được mở lại khi hết thời gian giữ tạm.',
  timeline: [
    {
      label: 'Chọn khung giờ',
      description: 'Khung giờ đã được giữ tạm trong lúc thanh toán.',
      status: 'done',
    },
    {
      label: 'Thanh toán',
      description: 'Giao dịch bị gián đoạn hoặc chưa được ngân hàng xác nhận.',
      status: 'failed',
    },
    {
      label: 'Thử lại',
      description: 'Bạn có thể đổi phương thức thanh toán hoặc chọn khung giờ khác.',
      status: 'current',
    },
  ],
};

export const playerBookings: BookingDetail[] = [
  sampleBooking,
  {
    ...sampleBooking,
    id: 'pkl-20260620-014',
    code: 'PKL-20260620-014',
    courtId: '2',
    courtName: 'PickleHub Mỹ Đình',
    subCourt: 'PB 4',
    address: 'KĐT Mỹ Đình 2, Nam Từ Liêm, Hà Nội',
    area: 'Mỹ Đình, Hà Nội',
    date: '2026-06-20',
    startTime: '07:00',
    endTime: '08:30',
    durationHours: 1.5,
    pricePerHour: 260000,
    serviceFee: 25000,
    totalAmount: 415000,
    paymentMethod: 'Thanh toán tại sân',
    paymentStatus: 'pending',
    bookingStatus: 'holding',
    checkInStatus: 'not_open',
    createdAt: '2026-06-18T11:18:00',
    holdExpiresAt: '2026-06-18T11:28:00',
    ownerPhone: '0919 858 563',
    note: 'Thanh toán tại sân, vui lòng đến đúng giờ để giữ lịch.',
    timeline: [
      {
        label: 'Chọn khung giờ',
        description: 'Khung giờ đã được giữ tạm cho người chơi.',
        status: 'done',
      },
      {
        label: 'Chờ thanh toán',
        description: 'Người chơi sẽ thanh toán khi đến sân.',
        status: 'current',
      },
      {
        label: 'Check-in',
        description: 'Mã đặt sân sẽ khả dụng khi đến gần giờ chơi.',
        status: 'upcoming',
      },
    ],
  },
  {
    ...sampleBooking,
    id: 'pkl-20260615-008',
    code: 'PKL-20260615-008',
    courtId: '3',
    courtName: 'Sân Tennis & Pickleball Ba Đình',
    subCourt: 'Pickleball 1',
    address: 'Số 12 Quần Ngựa, Ba Đình, Hà Nội',
    area: 'Ba Đình, Hà Nội',
    date: '2026-06-15',
    startTime: '19:00',
    endTime: '21:00',
    durationHours: 2,
    pricePerHour: 190000,
    serviceFee: 30000,
    totalAmount: 410000,
    paymentMethod: 'Chuyển khoản QR',
    paymentStatus: 'paid',
    bookingStatus: 'confirmed',
    checkInStatus: 'checked_in',
    createdAt: '2026-06-14T20:10:00',
    holdExpiresAt: '2026-06-14T20:20:00',
    ownerPhone: '0904 112 233',
    note: 'Đơn đã check-in thành công tại lễ tân.',
    timeline: [
      {
        label: 'Chọn khung giờ',
        description: 'Người chơi đã chọn sân con và khung giờ phù hợp.',
        status: 'done',
      },
      {
        label: 'Thanh toán',
        description: 'Giao dịch thanh toán đã được xác nhận.',
        status: 'done',
      },
      {
        label: 'Check-in',
        description: 'Người chơi đã check-in tại sân.',
        status: 'done',
      },
    ],
  },
  {
    ...sampleBooking,
    id: 'pkl-20260612-021',
    code: 'PKL-20260612-021',
    courtId: '1',
    subCourt: 'Pickleball 5',
    date: '2026-06-12',
    startTime: '06:00',
    endTime: '07:00',
    durationHours: 1,
    pricePerHour: 220000,
    serviceFee: 20000,
    totalAmount: 240000,
    paymentStatus: 'paid',
    bookingStatus: 'cancelled',
    checkInStatus: 'cancelled',
    createdAt: '2026-06-11T18:24:00',
    holdExpiresAt: '2026-06-11T18:34:00',
    note: 'Đơn đã hủy theo yêu cầu của người chơi.',
    timeline: [
      {
        label: 'Chọn khung giờ',
        description: 'Người chơi đã chọn sân con và khung giờ phù hợp.',
        status: 'done',
      },
      {
        label: 'Hủy lịch',
        description: 'Đơn đặt sân đã được hủy.',
        status: 'failed',
      },
    ],
  },
  failedBooking,
];

export const bookingById: Record<string, BookingDetail> = playerBookings.reduce<Record<string, BookingDetail>>(
  (lookup, booking) => {
    lookup[booking.id] = booking;
    lookup[booking.code.toLowerCase()] = booking;

    return lookup;
  },
  {},
);

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
