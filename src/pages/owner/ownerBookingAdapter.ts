import type { OwnerBookingRecord } from '../../api/owner';
import type { BookingDetail, BookingCheckInStatus, BookingPaymentStatus, BookingStatus } from '../../data/bookings';

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
    paymentMethod: record.paymentMethod === 'AtCourt' ? 'Thanh toán tại sân' : record.paymentMethod || 'Chưa chọn',
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
