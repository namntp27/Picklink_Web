import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../src/pages/owner/OwnerDashboard.tsx', import.meta.url), 'utf8');
const gridSource = readFileSync(new URL('../../../src/pages/owner/components/OwnerTimelineGrid.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/owner.ts', import.meta.url), 'utf8');
const serviceSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Owner/Implementations/OwnerVenueService.cs', import.meta.url), 'utf8');
const entrySource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Owner/OwnerScheduleEntry.cs', import.meta.url), 'utf8');
const revenueSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/Services/Owner/Implementations/OwnerOperationQueryService.cs', import.meta.url), 'utf8');

test('the slot schedule-type list offers a walk-in booking instead of maintenance', () => {
  assert.ok(pageSource.includes('<option value="Blocked">Khóa khung giờ</option>'));
  assert.ok(pageSource.includes('<option value="WalkIn">Đặt tại sân cho player</option>'));
  assert.doesNotMatch(pageSource, /<option value="Maintenance">/);

  // Maintenance is merged into Blocked, so nothing may still label a slot as maintenance.
  assert.doesNotMatch(pageSource, /Maintenance: 'Bảo trì'/);
  assert.doesNotMatch(gridSource, /Maintenance: 'Bảo trì'/);
  assert.match(serviceSource, /court\.AvailabilityStatus == "Maintenance"\s*\?\s*"Blocked"/);
});

test('a walk-in takes either a player account or a typed guest name', () => {
  assert.ok(apiSource.includes('export const searchOwnerPlayers'));
  assert.ok(apiSource.includes('/api/owner/players/search?query='));
  assert.ok(pageSource.includes('customerPlayerId: isWalkInEntry ? customerPlayer?.playerId : undefined'));
  assert.ok(pageSource.includes('customerName: isWalkInEntry && !customerPlayer ? customerQuery.trim() : undefined'));
  assert.match(serviceSource, /Vui lòng chọn người chơi hoặc nhập tên khách\./);
});

test('the amount defaults to slot count times the court price and stays editable', () => {
  assert.ok(pageSource.includes('const defaultAmount = Math.round((selectedCourt?.hourlyPrice ?? 0) * walkInSlotCount * 0.5);'));
  assert.ok(pageSource.includes('const amountValue = amountOverride ?? String(defaultAmount);'));
  assert.ok(pageSource.includes('onChange={(event) => setAmountOverride(event.target.value)}'));
  assert.ok(pageSource.includes('Về giá sân'));
});

test('a paid walk-in reaches revenue even when the guest has no account', () => {
  // PAYMENT.payerId is a required FK to PLAYER, so a guest booking carries the paid flag
  // on the entry type instead of a payment row.
  assert.match(entrySource, /WalkInPaid = "WalkIn"/);
  assert.match(entrySource, /WalkInUnpaid = "WalkInUnpaid"/);
  assert.match(entrySource, /WalkInPaid => "Paid"/);
  assert.match(serviceSource, /if \(isWalkIn && customer is not null\)/);
  assert.match(revenueSource, /item\.OwnerEntryType == OwnerScheduleEntry\.WalkInPaid/);
  assert.match(revenueSource, /OwnerScheduleEntry\.ImpliedPaymentStatus\(booking\.OwnerEntryType\)/);
});

test('the slot info panel shows the customer phone number', () => {
  assert.ok(pageSource.includes('<span className="text-on-surface-variant">Số điện thoại</span>'));
  assert.ok(pageSource.includes('href={`tel:${selectedSlotItem.customerPhone}`}'));
  assert.ok(apiSource.includes('customerPhone?: string | null;'));

  // A registered player carries their own number; only a guest needs one stored on the booking.
  assert.match(serviceSource, /CustomerPhone = booking\.Player\?\.PhoneNumber \?\? booking\.GuestPhoneNumber/);
  assert.match(serviceSource, /GuestPhoneNumber = isWalkIn && customer is null/);
  assert.ok(pageSource.includes('customerPlayer.phoneNumber || \'Hồ sơ player chưa có số\''));
});

test('acting on a slot that already passed warns the owner first', () => {
  assert.ok(pageSource.includes('const hasPassed = (localDateTime: string) => new Date(localDateTime).getTime() <= Date.now();'));
  // The owner can edit the times after clicking, so the warning follows the form, not the cell.
  assert.ok(pageSource.includes('const isPastEntryRange = hasPassed(`${date}T${endTime}:00`);'));
  assert.ok(pageSource.includes("title: 'Khung giờ này đã trôi qua',"));
  assert.ok(pageSource.includes('Kiểm tra lại ngày giờ trước khi lưu.'));
  assert.ok(pageSource.includes('Đã qua'));
  assert.ok(pageSource.includes('const isPastItem = hasPassed(item.endTime);'));
});

test('validation messages reaching the owner are in Vietnamese', () => {
  const dtoSource = readFileSync(new URL('../../../../PicklinkBackend/PicklinkBackend/DTOs/OwnerVenueDtos.cs', import.meta.url), 'utf8');
  const entryRequest = dtoSource.slice(
    dtoSource.indexOf('class OwnerScheduleBlockRequest'),
    dtoSource.indexOf('class OwnerPlayerSearchResponse'),
  );

  assert.match(entryRequest, /ErrorMessage = "Loại lịch không hợp lệ/);
  assert.match(entryRequest, /ErrorMessage = "Vui lòng chọn loại lịch\."/);
  assert.match(entryRequest, /ErrorMessage = "Hình thức thanh toán không hợp lệ\."/);
  assert.match(entryRequest, /ErrorMessage = "Số tiền phải từ/);
  // Every validation attribute on this request must carry a message, otherwise ASP.NET falls
  // back to its English default and the owner sees the raw regular expression.
  const attributes = entryRequest.match(/\[(Required|RegularExpression|Range|StringLength|Phone)\(/g) ?? [];
  const messages = entryRequest.match(/ErrorMessage = /g) ?? [];
  assert.equal(messages.length, attributes.length);
});

test('creating and removing a schedule entry actually persists', () => {
  // These were stubs returning an empty response, so the form silently did nothing.
  assert.doesNotMatch(serviceSource, /CreateScheduleEntry\(OwnerScheduleBlockRequest request, CancellationToken cancellationToken\) =>\s*\n\s*Task\.FromResult/);
  assert.match(serviceSource, /await _paymentRepository\.AddBookingAsync\(booking, cancellationToken\)/);
  assert.match(serviceSource, /_paymentRepository\.RemoveBooking\(booking\)/);
  assert.match(serviceSource, /Khung giờ đã có lịch khác/);
});
