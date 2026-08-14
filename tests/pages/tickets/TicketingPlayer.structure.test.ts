import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = (fileName: string) => readFileSync(
  new URL(`../../../src/pages/tickets/${fileName}`, import.meta.url),
  'utf8',
);

test('public ticket pages support discovery, filters, realtime capacity, and purchase', () => {
  const list = source('TicketSessions.tsx');
  const detail = source('TicketSessionDetail.tsx');

  assert.match(list, /getTicketSessions/);
  assert.match(list, /onlyAvailable/);
  assert.match(list, /PaginationControls/);
  assert.match(list, /useScheduleRealtime/);
  assert.match(list, /usePaymentRealtime/);
  assert.match(detail, /buySessionTicket/);
  assert.match(detail, /navigate\(`\/my-tickets\/\$\{ticket\.sessionTicketId\}`/);
  assert.match(detail, /user\.role !== 'player'/);
});

test('player ticket pages cover QR payment, expiry retry, and non-refundable cancellation', () => {
  const history = source('MyTickets.tsx');
  const detail = source('MyTicketDetail.tsx');

  assert.match(history, /getPlayerTickets/);
  assert.match(history, /PendingPayment/);
  assert.match(history, /không được hoàn lại/);
  assert.match(detail, /qrImageUrl/);
  assert.match(detail, /useVisiblePolling/);
  assert.match(detail, /buySessionTicket/);
  assert.match(detail, /cancelPlayerTicket/);
  assert.match(detail, /sePayTransactions/);
  assert.match(detail, /Vé đã thanh toán không được hoàn tiền/);
  assert.match(detail, /Khoản đã thanh toán \(nếu có\) không được hoàn lại/);
  assert.match(detail, /submitTicketReceipt/);
  assert.match(detail, /Gửi biên lai/);
  assert.match(detail, /Chờ chủ sân xác nhận/);
  assert.match(detail, /receiptImageUrl/);
  assert.match(detail, /ticket\?\.holdRemainingSeconds/);
  assert.match(detail, /canShowCheckInCode \? ticket\.ticketCode : 'Có sau khi thanh toán'/);
  assert.match(history, /ticket\.status === 'Paid' \|\| ticket\.status === 'CheckedIn'/);
});

test('owner can open the existing payment review modal for a ticket receipt', () => {
  const ownerDetail = readFileSync(
    new URL('../../../src/pages/owner/OwnerTicketSessionDetail.tsx', import.meta.url),
    'utf8',
  );

  assert.match(ownerDetail, /paymentStatus === 'WaitingForConfirmation'/);
  assert.match(ownerDetail, /Kiểm tra biên lai/);
  assert.match(ownerDetail, /OwnerTransactionReviewModal/);
});
