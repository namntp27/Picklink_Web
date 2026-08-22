import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';

const source = readFileSync(new URL('../../../src/pages/matches/MatchCheckout.tsx', import.meta.url), 'utf8');

test('match checkout presents owner receipt decisions to the player', () => {
  assert.ok(source.includes('const rejectedPayment = paymentTargets.find'));
  assert.ok(source.includes('participant.paymentRejectionReason'));
  assert.ok(source.includes('Biên lai thanh toán đã bị từ chối.'));
  assert.ok(source.includes('rejectedPayment.paymentRejectionReason'));
  assert.ok(source.includes("const myPaymentApproved = match?.myPaymentStatus === 'Paid';"));
  assert.ok(source.includes('myPaymentApproved &&'));
  assert.ok(source.includes('role="status"'));
});

test('match checkout anchors its countdown to the remaining seconds returned by the server', () => {
  assert.ok(source.includes('const [paymentDeadlineAt, setPaymentDeadlineAt] = useState(0);'));
  assert.ok(source.includes('detail.paymentHoldRemainingSeconds != null'));
  assert.ok(source.includes('receivedAt + Math.max(0, detail.paymentHoldRemainingSeconds) * 1_000'));
  assert.ok(source.includes('const deadline = paymentDeadlineAt;'));
  assert.match(source, /`\$\{value\}\+07:00`/);
  assert.doesNotMatch(source, /`\$\{value\}Z`/);
});

test('match checkout auto-selects every payment the current player is required to submit', () => {
  assert.ok(source.includes('if (match?.myPlayerId && selectablePayerIds.has(match.myPlayerId)) required.add(match.myPlayerId);'));
  assert.ok(source.includes('reconcileSelectedPayerIds('));
  assert.ok(source.includes('const isAutoSelected = canSelect && requiredPayerIds.has(participant.playerId);'));
  assert.ok(source.includes('disabled={!canSelect || isAutoSelected || isSubmitting}'));
  assert.ok(source.includes('Bạn · Tự động'));
  assert.ok(source.includes('Phần của bạn được chọn tự động.'));
});

test('proxy payment uses a request and explicit accept or reject flow', () => {
  assert.ok(source.includes('participant.allowPaymentByOthers'));
  assert.ok(source.includes('requestPaymentSponsorship(token, bookingId, targetPlayerId)'));
  assert.ok(source.includes('respondPaymentSponsorship(token, bookingId, accept)'));
  assert.ok(source.includes('!participant.paymentSponsorshipRequestedByPlayerId && (!claimedBy || claimedBy === match.myPlayerId)'));
  assert.ok(source.includes('muốn trả hộ phần của bạn'));
  assert.ok(source.includes('Đồng ý'));
  assert.ok(source.includes('Từ chối'));
  assert.ok(source.includes('Đã đồng ý để bạn trả hộ'));
  assert.ok(source.includes('Đã gửi yêu cầu'));
});

test('owner receipt review keeps the original countdown running', () => {
  assert.ok(!source.includes('isPaymentReviewPaused'));
  assert.ok(source.includes('deadline && remainingSeconds <= 0 && hasPendingPayments'));
  assert.ok(source.includes('(!hasPendingPayments && !hasReceiptAwaitingReview)'));
  assert.ok(source.includes('[deadline, hasPendingPayments, hasReceiptAwaitingReview, paymentExpired]'));
  assert.ok(source.includes('hasPendingPayments || hasReceiptAwaitingReview'));
});

test('expired partial match payments explain the refund state', () => {
  assert.ok(source.includes("participant.paymentStatus === 'RefundPending'"));
  assert.ok(source.includes('hasRefundPending'));
  assert.ok(source.includes('Booking đã hủy vì thiếu thanh toán'));
  assert.ok(source.includes('đánh dấu chờ owner hoàn tiền'));
  assert.ok(source.includes('Mọi thành viên vẫn được giữ trong phòng'));
  assert.ok(!source.includes('Thành viên chưa thanh toán đã bị đưa khỏi phòng'));
});
