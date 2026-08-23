import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const pageSource = readFileSync(new URL('../../../src/pages/admin/AdminBookings.tsx', import.meta.url), 'utf8');
const apiSource = readFileSync(new URL('../../../src/api/adminBookings.ts', import.meta.url), 'utf8');

test('admin bookings exposes a player-dispute queue and proof metadata', () => {
  assert.match(pageSource, /value: 'RefundDisputed'/);
  assert.match(pageSource, /RefundDisputed: 'Đang khiếu nại'/);
  assert.match(pageSource, /booking\.refundPendingSince/);
  assert.match(pageSource, /booking\.refundDisputeReason/);
  assert.match(pageSource, /booking\.refundProofImageUrl/);
  assert.match(pageSource, /setPaymentStatus\('RefundDisputed'\)/);
});

test('admin records a dispute conclusion without confirming the money', () => {
  assert.match(pageSource, /resolveAdminRefundDispute/);
  assert.match(pageSource, /Admin không chuyển tiền và không tự đánh dấu khoản hoàn là đã nhận/);
  assert.match(pageSource, /resolution\.length < 5/);
  assert.match(pageSource, /Ghi kết luận/);
  assert.doesNotMatch(pageSource, /Nhắc owner/);
  assert.doesNotMatch(pageSource, /Xác nhận hoàn/);
  assert.match(apiSource, /\/refund\/dispute\/resolve/);
  assert.match(apiSource, /JSON\.stringify\(\{ resolution \}\)/);
  assert.doesNotMatch(apiSource, /\/refund\/remind/);
});
