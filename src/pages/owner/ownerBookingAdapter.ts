import type { OwnerBookingRecord, OwnerTicketRevenueRecord } from '../../api/owner';
import type { BookingDetail, BookingCheckInStatus, BookingPaymentStatus, BookingStatus } from '../../data/bookings';

const paymentMethodLabel: Record<string, string> = {
  AtCourt: 'Tại sân',
  BankTransfer: 'Chuyển khoản',
  Cash: 'Tiền mặt',
  GroupOnline: 'Thanh toán nhóm',
  Unpaid: 'Chưa thanh toán',
  VietQR: 'VietQR',
  Wallet: 'Ví điện tử',
};

const formatPaymentMethod = (method?: string | null) => method ? paymentMethodLabel[method] ?? method : 'Chưa chọn';
export const ownerBookingToDetail = (record: OwnerBookingRecord): BookingDetail => {
  const bookingStatus: BookingStatus = record.bookingStatus === 'Confirmed'
    ? 'confirmed'
    : record.bookingStatus === 'Cancelled' || record.bookingStatus === 'Expired' ? 'cancelled' : 'holding';
  const paymentStatus: BookingPaymentStatus = record.paymentStatus === 'Paid'
    ? 'paid'
    : record.paymentStatus === 'Cancelled' || record.paymentStatus === 'Expired' || record.paymentStatus === 'Rejected' ? 'failed' : 'pending';
  const checkInMap: Record<string, BookingCheckInStatus> = {
    NotOpen: 'not_open', Ready: 'ready', CheckedIn: 'checked_in', NoShow: 'missed', Cancelled: 'cancelled',
  };
  const start = new Date(record.startTime);
  const end = new Date(record.endTime);
  const durationHours = record.slots.length
    ? record.slots.reduce((total, slot) => total + (new Date(slot.endTime).getTime() - new Date(slot.startTime).getTime()) / 3_600_000, 0)
    : Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
  return {
    id: String(record.bookingId),
    code: record.bookingCode,
    courtId: String(record.courtId),
    courtName: record.venueName,
    subCourt: record.slots.length ? Array.from(new Set(record.slots.map((slot) => `Sân ${slot.courtNumber}`))).join(', ') : `Sân ${record.courtNumber}`,
    address: record.address,
    area: record.address,
    date: record.startTime.slice(0, 10),
    startTime: record.startTime.slice(11, 16),
    endTime: record.endTime.slice(11, 16),
    slots: record.slots,
    durationHours,
    pricePerHour: record.hourlyPrice,
    serviceFee: Math.max(0, record.totalAmount - record.hourlyPrice * durationHours),
    totalAmount: record.totalAmount,
    customerName: record.playerName,
    customerPhone: 'Chưa cập nhật',
    paymentMethod: formatPaymentMethod(record.paymentMethod),
    paymentStatus,
    bookingStatus,
    checkInStatus: checkInMap[record.checkInStatus] ?? 'not_open',
    createdAt: record.createdAt,
    holdExpiresAt: record.holdExpiresAt ?? record.createdAt,
    ownerPhone: record.venuePhone || 'Chưa cập nhật',
    note: record.checkedInAt ? `Đã check-in lúc ${record.checkedInAt}` : record.noShowAt ? `No-show lúc ${record.noShowAt}` : 'Theo dõi trạng thái vận hành tại sân.',
    timeline: [],
  };
};

export const ownerTicketToDetail = (ticket: OwnerTicketRevenueRecord): BookingDetail => {
  const bookingStatus: BookingStatus = ticket.status === 'Paid' || ticket.status === 'CheckedIn'
    ? 'confirmed'
    : ticket.status === 'PendingPayment' ? 'holding' : 'cancelled';
  const paymentStatus: BookingPaymentStatus = ticket.paymentStatus === 'Paid'
    ? 'paid'
    : ticket.paymentStatus === 'Cancelled' || ticket.paymentStatus === 'Expired' ? 'failed' : 'pending';
  const start = new Date(ticket.startTime);
  const end = new Date(ticket.endTime);
  const durationHours = Math.max(0, (end.getTime() - start.getTime()) / 3_600_000);
  return {
    id: String(ticket.sessionTicketId),
    code: ticket.ticketCode,
    courtId: String(ticket.courtId),
    courtName: ticket.venueName,
    subCourt: `Sân ${ticket.courtNumber}`,
    address: ticket.venueAddress,
    area: ticket.venueAddress,
    date: ticket.startTime.slice(0, 10),
    startTime: ticket.startTime.slice(11, 16),
    endTime: ticket.endTime.slice(11, 16),
    durationHours,
    pricePerHour: durationHours > 0 ? ticket.amount / durationHours : ticket.amount,
    serviceFee: 0,
    totalAmount: ticket.amount,
    customerName: ticket.playerName,
    customerPhone: 'Chưa cập nhật',
    paymentMethod: formatPaymentMethod(ticket.paymentMethod),
    paymentStatus,
    bookingStatus,
    checkInStatus: ticket.status === 'CheckedIn' ? 'checked_in' : 'not_open',
    createdAt: ticket.createdAt,
    holdExpiresAt: ticket.createdAt,
    ownerPhone: 'Chưa cập nhật',
    note: `Vé xé sân — ${ticket.sessionTitle}`,
    timeline: [],
  };
};
