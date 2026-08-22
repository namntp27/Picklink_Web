import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const dashboardSource = readFileSync(new URL('../../../src/pages/owner/OwnerDashboard.tsx', import.meta.url), 'utf8');
const detailSource = readFileSync(new URL('../../../src/pages/owner/OwnerBookingDetail.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/owner.ts', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Owner/Implementations/OwnerVenueService.cs', import.meta.url), 'utf8');

const updateStatusSource = serviceSource.slice(
  serviceSource.indexOf(' UpdateBookingStatus('),
  serviceSource.indexOf(' MarkBookingRefunded('),
);

test('the owner can cancel a paid booking instead of hitting a dead end', () => {
  // The old copy told the owner a refund process was needed and left them stuck.
  assert.doesNotMatch(dashboardSource, /chỉ có thể hủy khi có quy trình hoàn tiền/);
  assert.doesNotMatch(detailSource, /chỉ có thể hủy khi có quy trình hoàn tiền/);

  assert.match(serviceSource, /CanCancel = !HasStartedSlot\(booking, localNow\)/);
  assert.match(serviceSource, /RequiresRefund = paidBookingIds\.Contains\(booking\.BookingId\)/);
  assert.ok(detailSource.includes("const canCancel = booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Expired';"));
});

test('cancelling was a stub and now really persists, under the payment lock', () => {
  assert.doesNotMatch(serviceSource, /UpdateBookingStatus\(int bookingId, OwnerBookingStatusRequest request, CancellationToken cancellationToken\) =>\s*\n\s*Task\.FromResult/);
  // Same lock namespace as the payment services so a cancel cannot race a SePay webhook.
  assert.match(updateStatusSource, /booking-payment:\{bookingId\}/);
  assert.match(updateStatusSource, /Vui lòng nhập lý do hủy để gửi cho người chơi\./);
  assert.match(updateStatusSource, /Booking đã bắt đầu nên không thể hủy\./);
});

test('money already collected becomes a refund debt rather than vanishing', () => {
  assert.match(updateStatusSource, /payment\.Status = fromStatus is "Confirmed" or "Paid" \? "RefundPending" : "Cancelled"/);
  assert.match(updateStatusSource, /Action = "OwnerCancelledBooking"/);
  assert.match(updateStatusSource, /Khoản đã thanh toán sẽ được hoàn lại\./);
});

test('the owner submits proof while the player remains responsible for final confirmation', () => {
  assert.doesNotMatch(serviceSource, /payment\.Status = "Refunded"/);
  assert.match(serviceSource, /Action = isUpdate \? "OwnerUpdatedRefundProof" : "OwnerMarkedRefundSent"/);
  assert.match(serviceSource, /payment\.RefundProofImageUrl = proofFileName/);
  assert.match(serviceSource, /Booking này không có khoản nào đang chờ hoàn tiền\./);

  assert.ok(apiSource.includes('export const submitOwnerBookingRefundProof'));
  assert.ok(apiSource.includes("formData.append('proof', optimized)"));
  assert.ok(dashboardSource.includes('Gửi minh chứng'));
  assert.ok(detailSource.includes('void markRefunded()'));
});

test('a cancellation reason is required before the request goes out', () => {
  assert.ok(apiSource.includes("body: JSON.stringify({ status, reason }),"));
  assert.ok(dashboardSource.includes('disabled={!cancelReason.trim()}'));
  assert.ok(detailSource.includes('disabled={isBusy || !cancelReason.trim()}'));
});
