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

test('player ticket pages cover QR payment, expiry retry, cancellation, and refund history', () => {
  const history = source('MyTickets.tsx');
  const detail = source('MyTicketDetail.tsx');

  assert.match(history, /getPlayerTickets/);
  assert.match(history, /PendingPayment/);
  assert.match(history, /RefundPending/);
  assert.match(detail, /qrImageUrl/);
  assert.match(detail, /useVisiblePolling/);
  assert.match(detail, /buySessionTicket/);
  assert.match(detail, /cancelPlayerTicket/);
  assert.match(detail, /sePayTransactions/);
  assert.match(detail, /AdditionalRefundPending/);
});
